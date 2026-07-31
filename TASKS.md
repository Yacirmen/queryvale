# Uygulama Görevleri

Bu dosya yürütme panosudur. Durumlar ancak kod, test ve build kanıtıyla güncellenir:

- `[ ]` planlandı
- `[-]` çalışılıyor
- `[x]` doğrulandı
- `[!]` engelli; nedeni aynı satırda yazılır

## P0 — Ürün çekirdeği

- [x] Ürün adı, sloganı, vizyonu ve kapsam sınırlarını belgelemek
- [x] Mimari, test, içerik ve katkı sözleşmelerini belgelemek
- [x] Özgün Queryvale token’larıyla global tasarım sistemini kurmak
- [x] Ana sayfa değer önerisi ve ilk görev CTA’sını tamamlamak
- [x] Öğrenme yolu ekranını modül/görev durumu ile bağlamak
- [x] Görev çalışma alanını responsive panel davranışıyla tamamlamak
- [x] İlerleme ve ayarlar ekranlarını gerçek yerel veriye bağlamak
- [x] Onboarding’i kısa, atlanabilir ve tekrar açılabilir yapmak

## P0 — SQL motoru

- [x] PGlite’ı ayrı istemci chunk’ı olarak lazy-load etmek
- [x] Görev bazlı setup ve deterministik reset uygulamak
- [x] Aktif run kimliği ve stale-result koruması eklemek
- [x] Timeout’ta görev veritabanını kapatıp yeniden hazırlamak
- [x] Maksimum sonuç satırı ve görünür kesilme bilgisi eklemek
- [x] Yasak operasyon politikasını görev bazında uygulamak
- [x] Motor desteklenmez/yüklenemez durumunu tasarlamak

## P0 — Değerlendirme ve öğretim

- [x] Değer/kolon/satır normalizasyon sözleşmesini uygulamak
- [x] Duplicate koruyan multiset karşılaştırmasını uygulamak
- [x] Sıra, `NULL`, tarih, case ve sayısal tolerans politikalarını uygulamak
- [x] Zorunlu kavram sinyallerini yorum/comment etkisinden arındırmak
- [x] Altı değerlendirme sonucunu açıklanabilir geri bildirime bağlamak
- [x] Teknik PGlite hatalarını Türkçe öğretici mesaja eşlemek
- [x] Üç kademeli ipucu ve çözüm yaklaşımı kilidini uygulamak

## P0 — İçerik

- [x] `TaskDefinition` ve `ModuleDefinition` tiplerini tanımlamak
- [x] İçerik build/test doğrulayıcısını kurmak
- [x] On modüllük kataloğu ve tutarlı ön koşul zincirini eklemek
- [x] Modül 1 için üretim kalitesinde çalışan görevleri gerçek motorda doğrulamak
- [x] Modül 2 için üretim kalitesinde çalışan görevleri gerçek motorda doğrulamak
- [x] Modül 3 için üretim kalitesinde çalışan görevleri gerçek motorda doğrulamak
- [x] Modül 4–10 için dürüst etiketli genişletilebilir örnekler eklemek
- [x] İlk üç modülün referans çözümlerini, ileri fixture’ların setup SQL’ini gerçek motorda test etmek

## P0 — İlerleme ve ayarlar

- [x] IndexedDB store’unu ve sürüm 1 veri sözleşmesini uygulamak
- [x] Tamamlama, deneme, sorgu, ipucu ve süreyi kaydetmek
- [x] Son görev ve öğrenme serisini deterministik hesaplamak
- [x] Ayarları kaydetmek ve uygulama açılışında geri yüklemek
- [x] Sürüm ve alan doğrulamalı JSON export/import eklemek
- [x] Açık onaylı ilerleme reseti uygulamak
- [x] IndexedDB kullanılamazsa görünür uyarılı oturum içi fallback sunmak

## P0 — Erişilebilirlik ve responsive

- [x] Landmark, başlık ve form semantiğini doğrulamak
- [x] Klavye kısayollarını çakışma ve focus kurallarıyla uygulamak
- [x] Canlı hata/değerlendirme mesajlarını ekran okuyucuya duyurmak
- [x] Renk dışı durum göstergelerini doğrulamak
- [x] Reduced-motion davranışını doğrulamak
- [x] Mobilde ilk görev akışını yatay sayfa taşması olmadan bitirmek

## P0 — Kalite kapısı

- [x] İçerik, motor, evaluator, progress ve settings unit testleri
- [x] Workspace ve gerçek PGlite entegrasyon testleri
- [x] İlk görev, yanlış sorgu, ipucu ve tamamlama E2E akışları
- [x] Mobil görünüm temel E2E kontrolleri
- [x] `pnpm run typecheck`
- [x] `pnpm run lint`
- [x] `pnpm test`
- [x] `pnpm run build`
- [x] Üretim önizlemesinde klavye ve kritik yol smoke testi
- [x] README komutları ve bilinen sınırlamaları gerçek çıktıyla eşitlemek

## P1 — MVP sonrası

- [ ] Modül 4–7 içerik derinliği
- [ ] PGlite sorgularını ayrı Web Worker içinde izole etmek
- [ ] Sonuç tablosu sanallaştırması
- [ ] Tam PWA cache/update deneyimi
- [ ] İçerik yazarına preview/fixture araçları
- [ ] Gelişmiş, yerel sonraki görev önerileri
