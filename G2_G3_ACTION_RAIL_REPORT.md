# Queryvale v1.2 — G2 + G3 Teslim Raporu

Tarih: 9 Ağustos 2026

## Sonuç

SQL Studio ve Python Studio artık aynı, kalıcı ve içerik üstüne binmeyen aksiyon rayını kullanıyor. Kullanıcı çözümü beklemeden önceki/sonraki vakaya gidebilir, bütün rota vakalarını açabilir, doğru veya yanlış sonucunu tabloyu kaybetmeden görebilir ve geri döndüğünde vaka bazlı taslağına devam eder.

## Değişen kullanıcı davranışı

- Çalışma alanının altında her durumda görünen `Önceki · Rota · Sonraki` rayı eklendi.
- Başarı, modal veya otomatik yönlendirme yerine sonuç tablosunun üstündeki ince durum şeridinde gösteriliyor.
- SQL'deki 52 ve Python'daki 12 vakanın tamamı rota çekmecesinden doğrudan açılabiliyor; sıra öneri, erişim kilidi değil.
- İlk vakada önceki eylemi görünür ama pasif; son vakada sağ eylem `Rota özeti` veya çözümden sonra `Rotayı tamamla` oluyor.
- Rota çekmecesi overlay değil, rayın üstünde normal flex akışında açılıyor; belgeyi büyütmüyor ve sonuçları örtmüyor.
- Durum simgeleri gerçek ilerlemeyi gösteriyor: başlanmadı, denendi ve tamamlandı. Puan yalnız tamamlanmış vakalarda gösteriliyor.
- SQL ve Python vaka değişimlerinde mevcut taslak önce kaydediliyor. Çalışan eski sorgu/worker isteği geçersizleştirildiği için sonucu yeni vakaya sızmıyor.
- Başarıdan sonra sonuç tablosunun scroll konumu sıfırlanmıyor.
- Yinelenen `Sonraki vakaya geç` düğmeleri kaldırıldı; ilerlemenin tek sahibi alt ray oldu.
- Kısayollar: `Cmd/Ctrl+Enter` çalıştırır, `Cmd/Ctrl+Shift+←/→` vaka değiştirir, `Cmd/Ctrl+K` rotayı açar, `Esc` kapatır.

## Yerleşim ve erişilebilirlik

- SQL ve Python çalışma alanları `100dvh` içinde tek flex bütçesi kullanıyor; üst bar, mobil sekmeler, içerik ve ray yüksekliklerini içeriklerinden alıyor.
- Ray `position: fixed` değil ve `flex-shrink: 0`; içerik onun arkasına düşmüyor.
- Mobil hedefler en az 44 px, alt safe-area destekli ve kısa etiketli.
- Ray gerçek `<nav>`, tüm eylemler gerçek `<button>`; rota çekmecesinde oklar, Home/End, Enter ve Escape ile odak yönetimi var.
- Rota çekmecesi açıldığında aktif vaka otomatik olarak görünür alana ve klavye odağına geliyor.

## Mimari karar

`ADR-044` eklendi. Bu karar, müfredatın sert kilit hükümlerini açık rota lehine değiştiriyor; ana sayfadaki tanıtım sonuna ulaşma geçidi ise yalnız header sunum davranışı olarak korunuyor. Yeni backend, paket veya depolama katmanı eklenmedi.

## Başlıca dosyalar

- `src/app/components/StudioActionRail.tsx`: ortak ray, rota çekmecesi ve sonuç şeridi.
- `src/app/screens/WorkspaceScreen.tsx`: SQL akışı, taslak flush, stale-run koruması ve ortak ray entegrasyonu.
- `src/app/screens/PythonStudioScreen.tsx`: Python akışı, worker iptali ve ortak ray entegrasyonu.
- `src/app/QueryvaleApp.tsx`: geçerli SQL/Python deep-link'lerinde müfredat erişim yönlendirmesinin kaldırılması.
- `src/features/progress/moduleAccess.ts` ve `pythonAccess.ts`: bütün geçerli vakalar için açık erişim sözleşmesi.
- `app/globals.css`: tek viewport bütçesi, ray, çekmece, durum şeridi ve mobil kurallar.
- `tests/e2e/queryvale.spec.ts`: viewport, 2× ray, açık rota, geometri ve erişim regresyonları.

## Doğrulama sonuçları

- Unit/integration: **34 dosya, 279 test geçti**.
- TypeScript: **geçti**.
- ESLint: **geçti**.
- Prettier: **tüm değişen metin dosyaları geçti**.
- Portable üretim build'i: **geçti**.
- Playwright: **17 test geçti, 7 koşullu test atlandı, 0 hata**.
- Test edilen viewport'lar: `1440×900`, `1280×800`, `1280×720`, `390×844`.
- SQL ve Python'da tüm viewport'larda `scrollHeight - innerHeight ≤ 2`.
- Masaüstü çözülmüş SQL karesinde sonuç altı ile ray üstü örtüşmesi: **0 px**.
- Mobil `390×844`: belge yükseklik farkı **0 px**, yatay taşma **0 px**, üç ray düğmesi **44 px**.
- Rota açıkken belge yükseklik farkı **0 px**, çekmece konumu akış içi ve SQL satır sayısı **52**.

Makinece okunur ölçümler: [`artifacts/g23/g23-viewport-metrics.json`](artifacts/g23/g23-viewport-metrics.json)

## Görsel kanıtlar

- [`artifacts/g23/g23-sql-solved-desktop.png`](artifacts/g23/g23-sql-solved-desktop.png): çözülmüş SQL vakası, gerçek tablo, başarı şeridi ve vurgulu sonraki eylemi.
- [`artifacts/g23/g23-sql-mobile-390x844.png`](artifacts/g23/g23-sql-mobile-390x844.png): 390×844 mobil sekmeler, vaka içeriği ve alt ray.
- [`artifacts/g23/g23-route-menu-open.png`](artifacts/g23/g23-route-menu-open.png): 52 vakalık akış içi rota çekmecesi.

## Bilinen sınır

İlerleme ve taslaklar mevcut ürün sözleşmesi gereği cihazın yerel IndexedDB alanında kalır; bu teslim bulut senkronizasyonu veya gerçek hesap backend'i eklemez. Görsel regresyonların otomasyonu Chromium'da çalıştırıldı; Safari için safe-area davranışı CSS sözleşmesi ve mobil geometri testiyle korunuyor.
