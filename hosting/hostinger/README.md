# Hostinger yayını

Queryvale, Hostinger üzerinde backend veya veritabanı olmadan statik site olarak
çalışır. Bunun için hesapta **Web Hosting / Cloud Hosting** altında bir
**Custom PHP/HTML** sitesi ve **File Manager** bulunmalıdır. Yalnız Hostinger
Website Builder hakkı statik uygulama dosyalarını yüklemek için yeterli değildir.

## Paketleme

1. `pnpm run build:portable` çalıştırılır.
2. `dist-portable` içeriği `dist-hostinger` içine kopyalanır.
3. Bu klasördeki `.htaccess` ve `robots.txt` dosyaları çıktının köküne eklenir.
4. `dist-hostinger` klasörünün kendisi değil, içeriği ziplenir.

Yayın kökü şu yapıda olmalıdır:

```text
public_html/
├── .htaccess
├── index.html
├── favicon.svg
├── robots.txt
└── assets/
```

Hash tabanlı yönlendirme kullanıldığı için genel bir SPA rewrite kuralı eklenmez.
Eksik WASM veya worker dosyalarını `index.html` ile yanıtlayan catch-all kurallar
SQL çalışma zamanını bozar.

## Yayın sonrası kontrol

- Ana sayfa HTTPS üzerinden açılmalıdır.
- `.wasm` dosyaları `application/wasm`, `.data` dosyası
  `application/octet-stream` olarak sunulmalıdır.
- İlk görevde gerçek sorgu çalıştırılmalı ve ilerleme sayfasında tamamlanma
  görünmelidir.
- Yenilemeden sonra kullanıcı adı ve ilerleme korunmalıdır.

İlerleme her tarayıcıda IndexedDB içinde ayrı saklanır. Alan adı veya alt alan
adı değişirse eski ilerleme otomatik taşınmaz; JSON dışa/içe aktarma kullanılır.
`robots.txt` arama motorlarına indekslememe isteği gönderir fakat erişim kontrolü
değildir. Yalnız iki kişilik erişim isteniyorsa Hostinger dizin parola koruması
ayrıca etkinleştirilmelidir.
