# Queryvale G4b — Temel Bölge Yeniden Kurulum Raporu

**Tarih:** 10 Ağustos 2026
**Kapsam:** SQL rotasının ilk 17 özgün vakası ve bunların arasına eklenen kısa alıştırmalar.
**Kapsam dışı:** #18–#52 vakalarının içerikleri, ID'leri, puanları ve kendi aralarındaki sıra.

## Sonuç özeti

Temel SQL hattı, yeni başlayan birinin kavramı görüp uzun süre tekrar etmeden ilerlemesini engelleyecek şekilde yeniden kuruldu.

- SQL çalışma sayısı **52 puanlı vaka/proje + 30 puansız alıştırma = 82** oldu.
- Maksimum SQL puanı **520** olarak kaldı; alıştırmalar puan üretmiyor.
- İlk 17 özgün vaka, 30 kısa çalışma ile birlikte **47 rota kalemi** halinde ilerliyor.
- İlk 17 vakada yer alan her denetim kavramı artık temel rota içinde en az **3 temas** alıyor.
- #18–#52 için authored içerik parmak izi, kimlik, puan ve göreli sıra koruma testleri eklendi.

## Yapılan değişiklikler

### 1. Üç alıştırma alt tipi

| Tip | Kullanıcıya görünen rozet | Süre | Yeni kavram | Puan |
|---|---|---:|---:|---:|
| `drill_intro` | `ALIŞTIRMA · 3 DK` | 2–3 dk | Tam 1 | Yok |
| `drill_practice` | `TEKRAR · 3 DK` | 2–3 dk | 0 | Yok |
| `drill_mix` | `BİRLEŞTİR · 5 DK` | 5 dk | 0 | Yok |

Bu tipler veri modeli, içerik doğrulaması, rota çekmecesi ve çalışma alanında ayrı davranışlara sahip. Alıştırmalar:

- erişime açık ve atlanabilir,
- tek ücretsiz ipucu taşır,
- `Durum → Görev → Beklenen kolonlar → Kavram` kısa brief'ini kullanır,
- puan, kanıt kaydı, karar notu veya vaka debrief'i oluşturmaz.

### 2. Temel rota düzeltmeleri

- Eski #3 (`m1-t3`, Top-N) filtreleme bloğunun arkasına alındı. Öğretim hattı artık `SELECT → WHERE → ORDER BY → LIMIT → Top-N` şeklinde ilerliyor.
- Kupon kullanımını sayan dar COUNT vakası (`m4-t3`) ağır kanal sağlık özetinden (`m4-t2`) önce konumlandırıldı.
- SQL Studio önceki/sonraki gezinmesi ve güvenli devam akışı artık `routeOrder` üzerinden ilerliyor; eski `nextTaskId` zinciri alıştırmaları atlayamıyor.

### 3. İçerik ve veri sürekliliği

- 30 alıştırmanın tamamı, kendisinden sonraki tam vakanın gerçek `setupSql`, şema ve örnek satırlarını kullanıyor.
- Her alıştırmanın `solutionSql` değeri gerçek PGlite üzerinde çalıştırılıp doğrulandı.
- Kavram tanıtımı ile ilk tekrar arasındaki mesafe en fazla 5 rota kalemi.
- Her en fazla 5 rota kaleminde bir `drill_mix` bulunuyor ve bu çalışma yalnız önceki dört kalemde görülen kavramları kullanıyor.

### 4. Arayüz ve erişilebilirlik

- Rota menüsünde alıştırma türleri ikon, renk ve görünür/ekran okuyucu metniyle ayrışıyor.
- Çalışma rayı ve sayaç artık “vaka” yerine karma türleri kapsayan “çalışma” dilini kullanıyor.
- Vaka tarafındaki puan, çözüm, kanıt ve debrief deneyimi korunuyor; alıştırma tarafı bilinçli olarak daha sade kalıyor.

## Sayısal sonuç

| Ölçüm | Sonuç |
|---|---:|
| Toplam SQL çalışması | 82 |
| Puanlı vaka/proje | 52 |
| Puansız alıştırma | 30 |
| `drill_intro` | 11 |
| `drill_practice` | 8 |
| `drill_mix` | 11 |
| İlk 17 vaka bölgesindeki rota kalemi | 47 |
| Temel kavramlar için en düşük temas sayısı | 3 |
| Maksimum SQL puanı | 520 |

## Teslim belgeleri

- [foundation-coverage.md](./foundation-coverage.md): 27 kavram için temas kanıtı, ilk 17 bölgenin 47 kalemlik rota listesi ve 30 alıştırmanın tek blok hâlindeki çözüm SQL kataloğu.
- [DECISIONS.md](./DECISIONS.md): ADR-046, üç alıştırma tipini ve temel rota kararını kayıt altına alır.

## Doğrulama

| Kontrol | Sonuç |
|---|---|
| TypeScript typecheck | Başarılı |
| Lint | Başarılı |
| G4b kapsamındaki dosyalarda Prettier | Başarılı |
| Unit test paketi | Başarılı |
| G4b odaklı Vitest | 100/100 geçti |
| PGlite entegrasyon testi | 10/10 geçti; 30 alıştırma dahil |
| Playwright drill smoke | Masaüstü + mobil 2/2 geçti |
| Production build | Başarılı |
| `git diff --check` | Başarılı |

Tam depo için genel Prettier taraması, G4b kapsamı dışında önceden biçimlenmemiş 11 dosyada uyarı veriyor. Bu dosyalara kullanıcı değişikliklerini korumak için dokunulmadı; G4b kapsamında değişen dosyalar biçim kontrolünden geçti.

## Yapamadıklarım

Yok. G4b kapsamındaki rota, alıştırma türleri, kavram tekrarı, fixture devamlılığı, UI ayrışması ve doğrulama kapıları tamamlandı.
