#include <arpa/inet.h>
#include <errno.h>
#include <fcntl.h>
#include <netinet/in.h>
#include <poll.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/time.h>
#include <sys/types.h>
#include <unistd.h>

#define REQUEST_CAPACITY 8192
#define PATH_CAPACITY 4096
#define IDLE_TIMEOUT_MS (12 * 60 * 60 * 1000)

static int send_all(int socket_fd, const void *buffer, size_t length) {
  const char *cursor = (const char *)buffer;
  while (length > 0) {
    ssize_t sent = send(socket_fd, cursor, length, 0);
    if (sent < 0) {
      if (errno == EINTR) continue;
      return -1;
    }
    if (sent == 0) return -1;
    cursor += sent;
    length -= (size_t)sent;
  }
  return 0;
}

static void send_text(int socket_fd, int status, const char *status_text,
                      const char *body) {
  char header[1024];
  size_t body_length = strlen(body);
  int header_length = snprintf(
      header, sizeof(header),
      "HTTP/1.1 %d %s\r\n"
      "Content-Type: text/plain; charset=utf-8\r\n"
      "Content-Length: %zu\r\n"
      "Cache-Control: no-store\r\n"
      "X-Content-Type-Options: nosniff\r\n"
      "Connection: close\r\n\r\n",
      status, status_text, body_length);
  if (header_length > 0) {
    send_all(socket_fd, header, (size_t)header_length);
    send_all(socket_fd, body, body_length);
  }
}

static int hex_value(char value) {
  if (value >= '0' && value <= '9') return value - '0';
  if (value >= 'a' && value <= 'f') return value - 'a' + 10;
  if (value >= 'A' && value <= 'F') return value - 'A' + 10;
  return -1;
}

static int decode_path(const char *encoded, char *decoded, size_t capacity) {
  size_t output = 0;
  for (size_t index = 0; encoded[index] != '\0'; index++) {
    if (encoded[index] == '?' || encoded[index] == '#') break;
    unsigned char value = (unsigned char)encoded[index];
    if (value == '%' && encoded[index + 1] && encoded[index + 2]) {
      int high = hex_value(encoded[index + 1]);
      int low = hex_value(encoded[index + 2]);
      if (high < 0 || low < 0) return -1;
      value = (unsigned char)((high << 4) | low);
      index += 2;
    }
    if (value == '\0' || value == '\\' || output + 1 >= capacity) return -1;
    decoded[output++] = (char)value;
  }
  decoded[output] = '\0';
  return strstr(decoded, "..") ? -1 : 0;
}

static const char *content_type_for(const char *path) {
  const char *extension = strrchr(path, '.');
  if (!extension) return "application/octet-stream";
  if (strcmp(extension, ".html") == 0) return "text/html; charset=utf-8";
  if (strcmp(extension, ".js") == 0 || strcmp(extension, ".mjs") == 0)
    return "text/javascript; charset=utf-8";
  if (strcmp(extension, ".css") == 0) return "text/css; charset=utf-8";
  if (strcmp(extension, ".json") == 0)
    return "application/json; charset=utf-8";
  if (strcmp(extension, ".wasm") == 0) return "application/wasm";
  if (strcmp(extension, ".svg") == 0) return "image/svg+xml";
  if (strcmp(extension, ".png") == 0) return "image/png";
  if (strcmp(extension, ".jpg") == 0 || strcmp(extension, ".jpeg") == 0)
    return "image/jpeg";
  if (strcmp(extension, ".webp") == 0) return "image/webp";
  if (strcmp(extension, ".ico") == 0) return "image/x-icon";
  if (strcmp(extension, ".ttf") == 0) return "font/ttf";
  if (strcmp(extension, ".woff") == 0) return "font/woff";
  if (strcmp(extension, ".woff2") == 0) return "font/woff2";
  return "application/octet-stream";
}

static void serve_file(int socket_fd, const char *method, const char *path) {
  int file_fd = open(path, O_RDONLY);
  if (file_fd < 0) {
    send_text(socket_fd, 404, "Not Found", "Queryvale dosyası bulunamadı.\n");
    return;
  }

  struct stat info;
  if (fstat(file_fd, &info) != 0 || !S_ISREG(info.st_mode)) {
    close(file_fd);
    send_text(socket_fd, 404, "Not Found", "Queryvale dosyası bulunamadı.\n");
    return;
  }

  char header[1200];
  const char *cache_control =
      strcmp(path, "index.html") == 0 ? "no-cache" : "public, max-age=31536000, immutable";
  int header_length = snprintf(
      header, sizeof(header),
      "HTTP/1.1 200 OK\r\n"
      "Content-Type: %s\r\n"
      "Content-Length: %lld\r\n"
      "Cache-Control: %s\r\n"
      "X-Content-Type-Options: nosniff\r\n"
      "Cross-Origin-Resource-Policy: same-origin\r\n"
      "Connection: close\r\n\r\n",
      content_type_for(path), (long long)info.st_size, cache_control);

  if (header_length <= 0 ||
      send_all(socket_fd, header, (size_t)header_length) != 0 ||
      strcmp(method, "HEAD") == 0) {
    close(file_fd);
    return;
  }

  char buffer[64 * 1024];
  for (;;) {
    ssize_t read_count = read(file_fd, buffer, sizeof(buffer));
    if (read_count == 0) break;
    if (read_count < 0) {
      if (errno == EINTR) continue;
      break;
    }
    if (send_all(socket_fd, buffer, (size_t)read_count) != 0) break;
  }
  close(file_fd);
}

static void handle_request(int socket_fd) {
  struct timeval receive_timeout = {.tv_sec = 5, .tv_usec = 0};
  setsockopt(socket_fd, SOL_SOCKET, SO_RCVTIMEO, &receive_timeout,
             sizeof(receive_timeout));

  char request[REQUEST_CAPACITY];
  ssize_t received = recv(socket_fd, request, sizeof(request) - 1, 0);
  if (received <= 0) return;
  request[received] = '\0';

  char method[8];
  char encoded_path[PATH_CAPACITY];
  char protocol[16];
  if (sscanf(request, "%7s %4095s %15s", method, encoded_path, protocol) != 3) {
    send_text(socket_fd, 400, "Bad Request", "Geçersiz istek.\n");
    return;
  }
  if (strcmp(method, "GET") != 0 && strcmp(method, "HEAD") != 0) {
    send_text(socket_fd, 405, "Method Not Allowed", "Yöntem desteklenmiyor.\n");
    return;
  }

  char path[PATH_CAPACITY];
  if (decode_path(encoded_path, path, sizeof(path)) != 0 || path[0] != '/') {
    send_text(socket_fd, 400, "Bad Request", "Geçersiz dosya yolu.\n");
    return;
  }
  if (strcmp(path, "/__queryvale_health") == 0) {
    send_text(socket_fd, 200, "OK", "queryvale-ok/v2\n");
    return;
  }

  if (path[1] == '/' || strstr(path, "//") != NULL) {
    send_text(socket_fd, 400, "Bad Request", "Geçersiz dosya yolu.\n");
    return;
  }

  const char *relative = path + 1;
  if (relative[0] == '\0') relative = "index.html";
  serve_file(socket_fd, method, relative);
}

int main(int argc, char **argv) {
  if (argc < 2 || argc > 3) {
    fprintf(stderr, "Kullanım: %s <uygulama-klasörü> [port]\n", argv[0]);
    return 64;
  }
  int port = argc == 3 ? atoi(argv[2]) : 41739;
  if (port < 1024 || port > 65535) {
    fprintf(stderr, "Geçersiz port.\n");
    return 64;
  }
  if (chdir(argv[1]) != 0) {
    perror("Uygulama klasörü açılamadı");
    return 66;
  }

  signal(SIGPIPE, SIG_IGN);
  int server_fd = socket(AF_INET, SOCK_STREAM, 0);
  if (server_fd < 0) {
    perror("Sunucu oluşturulamadı");
    return 70;
  }
  int reuse = 1;
  setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(reuse));

  struct sockaddr_in address;
  memset(&address, 0, sizeof(address));
  address.sin_family = AF_INET;
  address.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
  address.sin_port = htons((unsigned short)port);
  if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) != 0) {
    perror("Queryvale localhost portu açılamadı");
    close(server_fd);
    return 71;
  }
  if (listen(server_fd, 32) != 0) {
    perror("Queryvale dinlemeye başlayamadı");
    close(server_fd);
    return 71;
  }

  fprintf(stdout, "Queryvale hazır: http://127.0.0.1:%d/\n", port);
  fflush(stdout);

  for (;;) {
    struct pollfd descriptor = {.fd = server_fd, .events = POLLIN};
    int poll_result = poll(&descriptor, 1, IDLE_TIMEOUT_MS);
    if (poll_result == 0) break;
    if (poll_result < 0) {
      if (errno == EINTR) continue;
      break;
    }
    int client_fd = accept(server_fd, NULL, NULL);
    if (client_fd < 0) {
      if (errno == EINTR) continue;
      continue;
    }
    handle_request(client_fd);
    close(client_fd);
  }

  close(server_fd);
  return 0;
}
