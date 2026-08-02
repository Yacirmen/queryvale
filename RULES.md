# Proje Kuralları

## Ürün

1. Queryvale bir veri operasyon laboratuvarıdır; jenerik kurs veya admin dashboard diline kaymaz.
2. Her özellik somut bir kullanıcı işini desteklemeli, aksi halde MVP dışında kalmalıdır.
3. Çalışmayan buton, sahte sonuç, lorem ipsum veya üretim özelliği gibi sunulan mock bırakılmaz.
4. Kullanıcı hesabı, backend, ücretli API, AI botu, sosyal özellik, leaderboard ve ödeme eklenmez.
5. Oyunlaştırma ölçülüdür: ilerleme ve ustalık görünür, dikkat ekonomisi kurulmaz.

## SQL, Python ve içerik

1. Kullanıcı sorgusu gerçek SQL motorunda çalışır.
2. Doğruluk örnek SQL metniyle birebir eşleşmeye bağlanmaz.
3. Görevler birbirinden izole DB durumuna sahiptir.
4. Sonuç satırı, süre ve izin verilmeyen operasyonlar sınırlandırılır.
5. Her görev gerçekçi bağlam, açık hedef, çıktı tanesi, kabul kontrolleri, tutarlı veri, duruma özel koçluk, üç kademeli ipucu, açık talepte gösterilen çalışan örnek çözüm ve transfer odaklı debrief taşır.
6. İçerik uygulama component’lerine gömülmez; tip güvenli tanımlarda tutulur.
7. Kullanıcıya gösterilen örnek çözüm, referans sonuç ve alternatif doğru sorgular gerçek SQL motorunda test edilir.
8. Python vakası gerçek Pyodide/pandas runtime’ında çalışır; sahte tablo veya önceden hazırlanmış kullanıcı çıktısı gösterilmez.
9. Python doğruluğu kaynak kod metnine değil, `result` DataFrame artifact’ının kolon, dtype, satır ve sıra sözleşmesine bağlanır.
10. Python fixture’ları küçük ve deterministiktir; runtime yalnız sabitlenmiş, aynı origin’den sunulan izinli paketleri yükler.

## Mimari

1. Feature sınırları korunur; domain saf fonksiyonları UI bağımlılığı almaz.
2. Sade React state varsayılandır; yeni state kütüphanesi ancak ölçülmüş ihtiyaçla eklenir.
3. Yeni abstraction en az iki gerçek kullanım veya güçlü sınır gerekçesi olmadan oluşturulmaz.
4. Büyük component sorumluluk sınırında bölünür; her küçük DOM parçası component yapılmaz.
5. `any`, sessiz catch, rastgele type assertion ve devre dışı test kalite kaçağıdır.
6. Ağır bağımlılıklar lazy-load edilir; yeni paket için boyut, lisans ve bakım gerekçesi yazılır.
7. Kullanıcı verisi varsayılan olarak cihazdan çıkmaz.

## Tasarım ve erişilebilirlik

1. Başka eğitim ürünlerinin görünümü kopyalanmaz.
2. Siyah/yeşil hacker terminali ve varsayılan Tailwind kart yığını kullanılmaz.
3. Durum yalnızca renkle anlatılmaz.
4. Her etkileşim klavye, görünür focus ve reduced-motion ile çalışır.
5. Responsive davranış sonradan daraltma değil, bilgi önceliği kararıdır.
6. Gradient, blur, gölge ve hareket anlam taşıdığı ölçüde kullanılır.

## Kalite

1. Davranış değişikliği uygun test olmadan tamamlanmış sayılmaz.
2. Test, lint, typecheck ve production build kapıları devre dışı bırakılamaz.
3. Testler implementasyon ayrıntısından çok kullanıcı sonucu ve saf sözleşmeleri doğrular.
4. Hata ve boş durumlar mutlu yol kadar gerçek kabul edilir.
5. Dokümantasyon kodla aynı değişiklikte güncellenir.
6. Yeni önemli karar `DECISIONS.md` kaydı olmadan kalıcılaştırılmaz.

## Git ve katkı

1. Değişiklikler küçük, odaklı ve geri alınabilir tutulur.
2. İlgisiz kullanıcı değişiklikleri düzenlenmez veya silinmez.
3. Secret, kişisel veri, build çıktısı ve yerel DB dosyası commit edilmez.
4. Commit/PR açıklaması “ne” kadar “neden”i de söyler.
