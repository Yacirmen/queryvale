#import <Cocoa/Cocoa.h>

#include <arpa/inet.h>
#include <errno.h>
#include <fcntl.h>
#include <netinet/in.h>
#include <signal.h>
#include <spawn.h>
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/time.h>
#include <unistd.h>

extern char **environ;

static const int kQueryvalePort = 41739;
static const char *kQueryvaleHealthBody = "queryvale-ok/v2\n";

typedef NS_ENUM(NSInteger, QueryvaleHealthStatus) {
  QueryvaleHealthUnavailable,
  QueryvaleHealthHealthy,
  QueryvaleHealthUnexpected,
};

static QueryvaleHealthStatus QueryvaleHealthCheck(void) {
  int socketFD = socket(AF_INET, SOCK_STREAM, 0);
  if (socketFD < 0) return QueryvaleHealthUnavailable;

  int enabled = 1;
  setsockopt(socketFD, SOL_SOCKET, SO_NOSIGPIPE, &enabled, sizeof(enabled));
  struct timeval timeout = {.tv_sec = 0, .tv_usec = 250000};
  setsockopt(socketFD, SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof(timeout));
  setsockopt(socketFD, SOL_SOCKET, SO_SNDTIMEO, &timeout, sizeof(timeout));

  struct sockaddr_in address;
  memset(&address, 0, sizeof(address));
  address.sin_family = AF_INET;
  address.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
  address.sin_port = htons((unsigned short)kQueryvalePort);
  if (connect(socketFD, (struct sockaddr *)&address, sizeof(address)) != 0) {
    close(socketFD);
    return QueryvaleHealthUnavailable;
  }

  const char *request =
      "GET /__queryvale_health HTTP/1.1\r\n"
      "Host: 127.0.0.1\r\n"
      "Cache-Control: no-cache\r\n"
      "Connection: close\r\n\r\n";
  size_t remaining = strlen(request);
  const char *cursor = request;
  while (remaining > 0) {
    ssize_t sent = send(socketFD, cursor, remaining, 0);
    if (sent <= 0) {
      close(socketFD);
      return QueryvaleHealthUnexpected;
    }
    cursor += sent;
    remaining -= (size_t)sent;
  }

  char response[4096];
  size_t used = 0;
  while (used + 1 < sizeof(response)) {
    ssize_t received =
        recv(socketFD, response + used, sizeof(response) - used - 1, 0);
    if (received <= 0) break;
    used += (size_t)received;
  }
  close(socketFD);
  response[used] = '\0';

  const char *expectedStatus = "HTTP/1.1 200 OK\r\n";
  const char *body = strstr(response, "\r\n\r\n");
  if (strncmp(response, expectedStatus, strlen(expectedStatus)) == 0 && body &&
      strcmp(body + 4, kQueryvaleHealthBody) == 0) {
    return QueryvaleHealthHealthy;
  }
  return QueryvaleHealthUnexpected;
}

static void ShowFailure(NSString *message) {
  NSAlert *alert = [[NSAlert alloc] init];
  alert.messageText = @"Queryvale başlatılamadı";
  alert.informativeText = message;
  alert.alertStyle = NSAlertStyleCritical;
  [alert addButtonWithTitle:@"Tamam"];
  [alert runModal];
}

static BOOL IsRegularFile(NSString *path, BOOL mustBeExecutable) {
  NSError *error = nil;
  NSDictionary<NSFileAttributeKey, id> *attributes =
      [NSFileManager.defaultManager attributesOfItemAtPath:path error:&error];
  if (error || ![attributes[NSFileType] isEqualToString:NSFileTypeRegular]) {
    return NO;
  }
  return !mustBeExecutable ||
         [NSFileManager.defaultManager isExecutableFileAtPath:path];
}

static pid_t StartQueryvaleServer(NSString *serverPath, NSString *webPath,
                                  NSString **errorMessage) {
  NSString *logPath =
      [NSTemporaryDirectory() stringByAppendingPathComponent:@"queryvale-local.log"];
  int logFD = open(logPath.fileSystemRepresentation,
                   O_WRONLY | O_CREAT | O_APPEND | O_CLOEXEC | O_NOFOLLOW,
                   0600);
  if (logFD < 0 || fchmod(logFD, 0600) != 0) {
    int savedError = errno;
    if (logFD >= 0) close(logFD);
    if (errorMessage) {
      *errorMessage = [NSString
          stringWithFormat:@"Yerel günlük dosyası açılamadı: %s",
                           strerror(savedError)];
    }
    return -1;
  }

  posix_spawn_file_actions_t actions;
  int actionResult = posix_spawn_file_actions_init(&actions);
  if (actionResult != 0) {
    close(logFD);
    if (errorMessage) {
      *errorMessage = [NSString
          stringWithFormat:@"Yerel sunucu hazırlanamadı: %s",
                           strerror(actionResult)];
    }
    return -1;
  }
  if (actionResult == 0) {
    actionResult =
        posix_spawn_file_actions_adddup2(&actions, logFD, STDOUT_FILENO);
  }
  if (actionResult == 0) {
    actionResult =
        posix_spawn_file_actions_adddup2(&actions, logFD, STDERR_FILENO);
  }
  if (actionResult == 0) {
    actionResult = posix_spawn_file_actions_addclose(&actions, logFD);
  }
  if (actionResult != 0) {
    posix_spawn_file_actions_destroy(&actions);
    close(logFD);
    if (errorMessage) {
      *errorMessage = [NSString
          stringWithFormat:@"Yerel sunucu hazırlanamadı: %s",
                           strerror(actionResult)];
    }
    return -1;
  }

  posix_spawnattr_t attributes;
  int attributeResult = posix_spawnattr_init(&attributes);
  if (attributeResult != 0) {
    posix_spawn_file_actions_destroy(&actions);
    close(logFD);
    if (errorMessage) {
      *errorMessage = [NSString
          stringWithFormat:@"Yerel sunucu oturumu hazırlanamadı: %s",
                           strerror(attributeResult)];
    }
    return -1;
  }
  sigset_t defaultSignals;
  sigemptyset(&defaultSignals);
  sigaddset(&defaultSignals, SIGTERM);
  sigaddset(&defaultSignals, SIGINT);
  sigaddset(&defaultSignals, SIGHUP);
  sigset_t signalMask;
  sigemptyset(&signalMask);
  if (attributeResult == 0) {
    attributeResult = posix_spawnattr_setpgroup(&attributes, 0);
  }
  if (attributeResult == 0) {
    attributeResult =
        posix_spawnattr_setsigdefault(&attributes, &defaultSignals);
  }
  if (attributeResult == 0) {
    attributeResult = posix_spawnattr_setsigmask(&attributes, &signalMask);
  }
  if (attributeResult == 0) {
    short flags = POSIX_SPAWN_SETPGROUP | POSIX_SPAWN_SETSIGDEF |
                  POSIX_SPAWN_SETSIGMASK;
    attributeResult = posix_spawnattr_setflags(&attributes, flags);
  }
  if (attributeResult != 0) {
    posix_spawn_file_actions_destroy(&actions);
    posix_spawnattr_destroy(&attributes);
    close(logFD);
    if (errorMessage) {
      *errorMessage = [NSString
          stringWithFormat:@"Yerel sunucu oturumu hazırlanamadı: %s",
                           strerror(attributeResult)];
    }
    return -1;
  }

  const char *server = serverPath.fileSystemRepresentation;
  const char *web = webPath.fileSystemRepresentation;
  char port[16];
  snprintf(port, sizeof(port), "%d", kQueryvalePort);
  char *arguments[] = {(char *)server, (char *)web, port, NULL};

  pid_t processID = -1;
  int spawnResult = posix_spawn(&processID, server, &actions, &attributes,
                                arguments, environ);
  posix_spawn_file_actions_destroy(&actions);
  posix_spawnattr_destroy(&attributes);
  close(logFD);

  if (spawnResult != 0) {
    if (errorMessage) {
      *errorMessage = [NSString
          stringWithFormat:@"Yerel sunucu çalıştırılamadı: %s",
                           strerror(spawnResult)];
    }
    return -1;
  }
  return processID;
}

static BOOL PrepareQueryvale(NSString *serverPath, NSString *webPath,
                             NSString **errorMessage) {
  BOOL isDirectory = NO;
  BOOL webDirectoryExists = [NSFileManager.defaultManager
      fileExistsAtPath:webPath
           isDirectory:&isDirectory];
  NSString *indexPath = [webPath stringByAppendingPathComponent:@"index.html"];
  if (!IsRegularFile(serverPath, YES) || !webDirectoryExists || !isDirectory ||
      !IsRegularFile(indexPath, NO)) {
    if (errorMessage) {
      *errorMessage = @"Paket dosyaları eksik. Zip'i yeniden indirip tamamen "
                       "çıkardıktan sonra tekrar deneyin.";
    }
    return NO;
  }

  QueryvaleHealthStatus status = QueryvaleHealthCheck();
  if (status == QueryvaleHealthHealthy) return YES;
  if (status == QueryvaleHealthUnexpected) {
    if (errorMessage) {
      *errorMessage = @"41739 portunu başka bir uygulama kullanıyor. O "
                       "uygulamayı kapatıp Queryvale'i yeniden açın.";
    }
    return NO;
  }

  NSString *launchError = nil;
  pid_t startedProcess =
      StartQueryvaleServer(serverPath, webPath, &launchError);
  if (startedProcess < 0) {
    if (errorMessage) {
      *errorMessage = launchError ?: @"Yerel sunucu başlatılamadı.";
    }
    return NO;
  }

  for (int attempt = 0; attempt < 80; attempt++) {
    usleep(100000);
    status = QueryvaleHealthCheck();
    if (status == QueryvaleHealthHealthy) return YES;
    if (status == QueryvaleHealthUnexpected) break;
  }

  kill(startedProcess, SIGTERM);
  if (errorMessage) {
    *errorMessage = status == QueryvaleHealthUnexpected
                        ? @"41739 portunda beklenmeyen bir uygulama yanıt "
                           "verdi. O uygulamayı kapatıp tekrar deneyin."
                        : @"Yerel sunucu zamanında yanıt vermedi. Mac'i "
                           "yeniden başlatıp tekrar deneyin.";
  }
  return NO;
}

int main(void) {
  @autoreleasepool {
    [NSApplication sharedApplication];
    [NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];

    NSBundle *bundle = NSBundle.mainBundle;
    NSString *serverPath = [bundle.bundlePath
        stringByAppendingPathComponent:@"Contents/Helpers/queryvale-server"];
    NSString *webPath =
        [bundle.resourcePath stringByAppendingPathComponent:@"uygulama"];
    __block int exitCode = 0;

    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
      @autoreleasepool {
        NSString *launchError = nil;
        BOOL ready = PrepareQueryvale(serverPath, webPath, &launchError);
        dispatch_async(dispatch_get_main_queue(), ^{
          if (!ready) {
            exitCode = 1;
            ShowFailure(launchError ?: @"Queryvale başlatılamadı.");
          } else {
            NSURL *url = [NSURL URLWithString:@"http://127.0.0.1:41739/"];
            if (![NSWorkspace.sharedWorkspace openURL:url]) {
              exitCode = 1;
              ShowFailure(@"Tarayıcı açılamadı. Tarayıcıda "
                          "http://127.0.0.1:41739/ adresini açın.");
            }
          }
          [NSApp terminate:nil];
        });
      }
    });

    [NSApp run];
    return exitCode;
  }
}
