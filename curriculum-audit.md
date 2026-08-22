# Queryvale G4a — Müfredat Denetimi

Bu denetim, çalışma anında kullanılan `curriculum.flatMap(module.tasks)` sırasındaki 52 SQL vakasını ve her vakanın gerçek `solutionSql` alanını esas alır. `concepts` ve `requiredConcepts` alanları yalnız çapraz kontrol için kullanılmıştır. Vaka adı veya modül kimliği üzerinden kavram tahmini yapılmamıştır.

## Yöntem ve sınıflandırma kararları

- Bir kavram aynı sorguda kaç kez kullanılırsa kullanılsın vaka sıklığına bir kez eklenmiştir.
- `Yeni kavram`, önceki rota vakalarının hiçbirinde görülmeyen; `Pekiştirilen`, daha önce en az bir kez görülen kavramdır. Aynı vaka içindeki tekrar pekiştirme sayılmamıştır.
- K02 yalnız çıktı/ifade takma adını kapsar; sadece tablo kısa adı veya `CAST(... AS type)` içindeki `AS` K02 sayılmamıştır.
- K05/K06 yalnız `WHERE` veya aggregate `FILTER (WHERE ...)` içindeki eşitlik/karşılaştırmadır. K07, çözüm için anlamlı `AND` bağlacını `WHERE`, `ON` veya `CASE` içinde kapsar. K08 yalnız parantezle gruplanmış `OR` koşuludur.
- K13, `SELECT DISTINCT` yanında `COUNT(DISTINCT ...)` kullanımını da kapsar. K16/K17, bir vakanın farklı CTE'lerinde tek ve çok kolonlu `GROUP BY` birlikte varsa aynı satırda birlikte bulunabilir.
- K21/K25 yalnız aynı `SELECT` kapsamında sırasıyla JOIN + WHERE ve JOIN + GROUP BY oluştuğunda; K24 ise vakanın tesliminde üç veya daha fazla fiziksel tablonun ilişkilendirilmesi gerektiğinde verilmiştir.
- K28 gerçek tarih fonksiyonunu; tarih farkı ve `INTERVAL` hesabı `K99-TARIH_ARITMETIGI` kodunu taşır. K30, oran veya maddi `ROUND` kullanımını kapsar. K38, `UNION ALL` kullanımını da kapsar.
- K99 yalnız çözüm sorgusunda maddi bir öğrenme yükü oluşturan, K01–K38'de karşılığı bulunmayan SQL yapılarına verilmiştir. Şema adı, “raporlama”, “veri kalitesi” gibi alan etiketleri tek başına K99 yapılmamıştır.
- `Kademe`, satırdaki standart K01–K38 kodlarının en yükseğidir; K99 da varsa `+ K99` ile gösterilir. Yalnız taksonomi dışı DML taşıyan satırlar `K99` olarak işaretlenmiştir.

## Bölüm 1 — Vaka haritası

| # | Vaka adı | Kullanılan kavramlar | Yeni kavram | Yeni sayısı | Pekiştirilen | Kademe |
|---:|---|---|---|---:|---|---|
| 1 | Katalog görünümünü hazırla | K01 | K01 | 1 | — | 0 |
| 2 | Kategori listesini tekilleştir | K01, K13 | K13 | 1 | K01 | 1 |
| **3** | **Kritik stokları sırala** | **K01, K03, K04, K19** | **K03, K04, K19** | **3** | **K01** | **2** |
| 4 | Fiyat panosunu düzenle | K01, K03 | — | 0 | K01, K03 | 0 |
| 5 | Yüksek tutarlı siparişleri ayır | K01, K06 | K06 | 1 | K01 | 1 |
| **6** | **Bekleyen şehir siparişlerini bul** | **K01, K05, K07, K10** | **K05, K07, K10** | **3** | **K01** | **1** |
| 7 | Kampanya tarih aralığını incele | K01, K03, K11 | K11 | 1 | K01, K03 | 1 |
| **8** | **Eksik teslimat kayıtlarını tara** | **K01, K03, K07, K09, K12** | **K09, K12** | **2** | **K01, K03, K07** | **1** |
| **9** | **Satır gelirini hesapla** | **K01, K02, K99-ARITMETIK** | **K02, K99-ARITMETIK** | **2** | **K01** | **0 + K99** |
| 10 | Temsilci etiketlerini oluştur | K01, K02, K29 | K29 | 1 | K01, K02 | 4 |
| 11 | Aylık dönem etiketini üret | K01, K02, K28 | K28 | 1 | K01, K02 | 4 |
| **12** | **Satışları gelir bandına ayır** | **K01, K02, K26, K99-ARITMETIK, K99-TIP_DONUSUMU** | **K26, K99-TIP_DONUSUMU** | **2** | **K01, K02, K99-ARITMETIK** | **4 + K99** |
| **13** | **Kanal sağlık özetini hazırla** | **K01, K02, K03, K14, K15, K16** | **K14, K15, K16** | **3** | **K01, K02, K03** | **2** |
| 14 | Kupon kullanımını doğru say | K01, K02, K03, K14, K16 | — | 0 | K01, K02, K03, K14, K16 | 2 |
| 15 | Sipariş durum matrisini kur | K01, K02, K03, K15, K16, K26, K99-KOSULLU_OZETLEME | K99-KOSULLU_OZETLEME | 1 | K01, K02, K03, K15, K16, K26 | 4 + K99 |
| 16 | Bölgesel gelir özetini çıkar | K01, K02, K03, K05, K14, K15, K16, K18 | K18 | 1 | K01, K02, K03, K05, K14, K15, K16 | 2 |
| **17** | **Sipariş değer dosyasını üret** | **K01, K02, K03, K15, K17, K20, K24, K25, K99-ARITMETIK** | **K17, K20, K24, K25** | **4** | **K01, K02, K03, K15, K99-ARITMETIK** | **3 + K99** |
| 18 | Çalışan–yönetici görünümünü kur | K01, K02, K03, K20, K99-OZ_BIRLESIM | K99-OZ_BIRLESIM | 1 | K01, K02, K03, K20 | 3 + K99 |
| 19 | Fiyatı bileşik anahtarla eşleştir | K01, K02, K03, K07, K20, K99-ARITMETIK, K99-BILESIK_JOIN | K99-BILESIK_JOIN | 1 | K01, K02, K03, K07, K20, K99-ARITMETIK | 3 + K99 |
| **20** | **Sipariş vermeyen müşterileri de koru** | **K01, K02, K03, K07, K15, K17, K22, K25, K27** | **K22, K27** | **2** | **K01, K02, K03, K07, K15, K17, K25** | **4** |
| 21 | Kampanya ürünlerini kısa listele | K01, K03, K05, K06, K07, K10, K15, K31 | K31 | 1 | K01, K03, K05, K06, K07, K10, K15 | 5 |
| 22 | Sessiz müşterileri bul | K01, K03, K05, K06, K07, K23, K31 | K23 | 1 | K01, K03, K05, K06, K07, K31 | 5 |
| **23** | **Kategori ağacını aç** | **K01, K02, K03, K09, K20, K29, K33, K38, K99-ARITMETIK, K99-RECURSIVE_CTE** | **K33, K38, K99-RECURSIVE_CTE** | **3** | **K01, K02, K03, K09, K20, K29, K99-ARITMETIK** | **5 + K99** |
| 24 | Ortalamanın üzerindeki şubeleri bul | K01, K02, K06, K15, K16, K31, K33 | — | 0 | K01, K02, K06, K15, K16, K31, K33 | 5 |
| **25** | **Kategori liderlerini sırala** | **K01, K02, K03, K34, K35, K99-DENSE_RANK, K99-PARTITION_BY** | **K34, K35, K99-DENSE_RANK, K99-PARTITION_BY** | **4** | **K01, K02, K03** | **5 + K99** |
| **26** | **Haftalık gelir değişimini ölç** | **K01, K02, K03, K27, K30, K33, K37** | **K30, K37** | **2** | **K01, K02, K03, K27, K33** | **5** |
| **27** | **Yedi günlük talep sinyali üret** | **K01, K02, K03, K15, K30, K99-HAREKETLI_ORTALAMA, K99-PENCERE_CERCEVESI** | **K99-HAREKETLI_ORTALAMA, K99-PENCERE_CERCEVESI** | **2** | **K01, K02, K03, K15, K30** | **4 + K99** |
| 28 | Hareketli hesap bakiyesini üret | K01, K02, K03, K15, K36, K99-PARTITION_BY, K99-PENCERE_CERCEVESI | K36 | 1 | K01, K02, K03, K15, K99-PARTITION_BY, K99-PENCERE_CERCEVESI | 5 + K99 |
| **29** | **Sipariş için stok ayır** | **K05, K99-ARITMETIK, K99-RETURNING, K99-UPDATE** | **K99-RETURNING, K99-UPDATE** | **2** | **K05, K99-ARITMETIK** | **1 + K99** |
| 30 | Stok giriş hareketini kaydet | K99-INSERT, K99-RETURNING | K99-INSERT | 1 | K99-RETURNING | K99 |
| 31 | Taslak ithalat kaydını güvenle sil | K05, K07, K99-DELETE, K99-RETURNING | K99-DELETE | 1 | K05, K07, K99-RETURNING | 1 + K99 |
| 32 | Günlük metriği çakışmada güncelle | K99-INSERT, K99-RETURNING, K99-UPDATE, K99-UPSERT | K99-UPSERT | 1 | K99-INSERT, K99-RETURNING, K99-UPDATE | K99 |
| 33 | Yıldız şemadan aylık gelir üret | K01, K02, K03, K15, K17, K20, K24, K25, K99-ARITMETIK | — | 0 | K01, K02, K03, K15, K17, K20, K24, K25, K99-ARITMETIK | 3 + K99 |
| 34 | Güncel müşteri segmentini seç | K01, K03, K09 | — | 0 | K01, K03, K09 | 1 |
| 35 | Yetim satış anahtarlarını denetle | K01, K03, K09, K21, K22, K23 | K21 | 1 | K01, K03, K09, K22, K23 | 3 |
| 36 | Eksiksiz haftalık kanal martını üret | K01, K02, K03, K07, K14, K15, K17, K20, K22, K24, K25, K27, K33, K99-CROSS_JOIN | K99-CROSS_JOIN | 1 | K01, K02, K03, K07, K14, K15, K17, K20, K22, K24, K25, K27, K33 | 5 + K99 |
| 37 | Şube hedef gerçekleşme raporu | K01, K02, K03, K07, K15, K17, K20, K22, K24, K25, K26, K27, K30 | — | 0 | K01, K02, K03, K07, K15, K17, K20, K22, K24, K25, K26, K27, K30 | 4 |
| **38** | **Müşteri kayıp risk kuyruğunu kur** | **K01, K02, K03, K05, K09, K14, K15, K16, K20, K21, K22, K24, K26, K27, K33, K99-AGGREGATE_FILTER, K99-NULL_SIRALAMA, K99-TARIH_ARITMETIGI** | **K99-AGGREGATE_FILTER, K99-NULL_SIRALAMA, K99-TARIH_ARITMETIGI** | **3** | **K01, K02, K03, K05, K09, K14, K15, K16, K20, K21, K22, K24, K26, K27, K33** | **5 + K99** |
| 39 | Kampanya kârlılığını mutabıklaştır | K01, K02, K03, K15, K16, K22, K24, K26, K27, K30, K33, K99-ARITMETIK | — | 0 | K01, K02, K03, K15, K16, K22, K24, K26, K27, K30, K33, K99-ARITMETIK | 5 + K99 |
| 40 | Operasyon erken uyarı panelini hazırla | K01, K02, K03, K05, K07, K14, K15, K17, K20, K22, K24, K26, K27, K33, K36, K37, K99-ARITMETIK, K99-AGGREGATE_FILTER, K99-PARTITION_BY, K99-PENCERE_CERCEVESI | — | 0 | K01, K02, K03, K05, K07, K14, K15, K17, K20, K22, K24, K26, K27, K33, K36, K37, K99-ARITMETIK, K99-AGGREGATE_FILTER, K99-PARTITION_BY, K99-PENCERE_CERCEVESI | 5 + K99 |
| 41 | Kampanya funnel sağlığını teşhis et | K01, K02, K03, K07, K14, K15, K16, K17, K22, K24, K25, K26, K27, K30, K33, K99-KOSULLU_OZETLEME | — | 0 | K01, K02, K03, K07, K14, K15, K16, K17, K22, K24, K25, K26, K27, K30, K33, K99-KOSULLU_OZETLEME | 5 + K99 |
| 42 | Kanal edinim verimliliğini karşılaştır | K01, K02, K03, K07, K11, K14, K15, K16, K17, K22, K24, K25, K26, K27, K30, K33, K99-ARITMETIK, K99-NULL_SIRALAMA, K99-TARIH_ARITMETIGI | — | 0 | K01, K02, K03, K07, K11, K14, K15, K16, K17, K22, K24, K25, K26, K27, K30, K33, K99-ARITMETIK, K99-NULL_SIRALAMA, K99-TARIH_ARITMETIGI | 5 + K99 |
| 43 | Landing-page deneyini değerlendir | K01, K02, K03, K07, K13, K14, K17, K20, K22, K24, K25, K26, K30, K33 | — | 0 | K01, K02, K03, K07, K13, K14, K17, K20, K22, K24, K25, K26, K30, K33 | 5 |
| 44 | Arama terimi bütçe israfını bul | K01, K02, K03, K05, K06, K07, K08, K11, K15, K17, K20, K21, K24, K25, K26, K30, K33 | K08 | 1 | K01, K02, K03, K05, K06, K07, K11, K15, K17, K20, K21, K24, K25, K26, K30, K33 | 5 |
| 45 | E-posta etkileşim funnelını denetle | K01, K02, K03, K07, K15, K16, K17, K22, K24, K25, K26, K27, K30, K33, K99-KOSULLU_OZETLEME | — | 0 | K01, K02, K03, K07, K15, K16, K17, K22, K24, K25, K26, K27, K30, K33, K99-KOSULLU_OZETLEME | 5 + K99 |
| 46 | RFM müşteri segmentlerini üret | K01, K02, K03, K05, K06, K07, K09, K14, K15, K16, K17, K20, K21, K22, K24, K25, K26, K27, K33, K99-ARITMETIK, K99-TARIH_ARITMETIGI | — | 0 | K01, K02, K03, K05, K06, K07, K09, K14, K15, K16, K17, K20, K21, K22, K24, K25, K26, K27, K33, K99-ARITMETIK, K99-TARIH_ARITMETIGI | 5 + K99 |
| 47 | Kohortların ilk ay tutunmasını ölç | K01, K02, K03, K07, K13, K14, K17, K20, K22, K24, K25, K28, K30, K33, K99-TARIH_ARITMETIGI, K99-TIP_DONUSUMU | — | 0 | K01, K02, K03, K07, K13, K14, K17, K20, K22, K24, K25, K28, K30, K33, K99-TARIH_ARITMETIGI, K99-TIP_DONUSUMU | 5 + K99 |
| 48 | Reaktivasyon ve churn kuyruğunu kur | K01, K02, K03, K05, K06, K07, K08, K09, K15, K16, K20, K21, K22, K24, K26, K33, K34, K37, K99-NULL_SIRALAMA, K99-PARTITION_BY, K99-TARIH_ARITMETIGI | — | 0 | K01, K02, K03, K05, K06, K07, K08, K09, K15, K16, K20, K21, K22, K24, K26, K33, K34, K37, K99-NULL_SIRALAMA, K99-PARTITION_BY, K99-TARIH_ARITMETIGI | 5 + K99 |
| 49 | Geliri temaslara adil dağıt | K01, K02, K03, K07, K11, K13, K14, K15, K16, K20, K22, K24, K27, K30, K33, K36, K99-TARIH_ARITMETIGI | — | 0 | K01, K02, K03, K07, K11, K13, K14, K15, K16, K20, K22, K24, K27, K30, K33, K36, K99-TARIH_ARITMETIGI | 5 + K99 |
| 50 | Holdout ile artımlı etkiyi ölç | K01, K02, K03, K05, K07, K13, K14, K17, K20, K22, K24, K25, K26, K30, K33, K99-AGGREGATE_FILTER, K99-ARITMETIK, K99-GREATEST_LEAST, K99-TIP_DONUSUMU | K99-GREATEST_LEAST | 1 | K01, K02, K03, K05, K07, K13, K14, K17, K20, K22, K24, K25, K26, K30, K33, K99-AGGREGATE_FILTER, K99-ARITMETIK, K99-TIP_DONUSUMU | 5 + K99 |
| 51 | Bütçeyi CAC trendine göre yeniden dağıt | K01, K02, K03, K09, K11, K15, K16, K20, K22, K24, K26, K27, K30, K33, K99-AGGREGATE_FILTER | — | 0 | K01, K02, K03, K09, K11, K15, K16, K20, K22, K24, K26, K27, K30, K33, K99-AGGREGATE_FILTER | 5 + K99 |
| 52 | Yönetici büyüme scorecard'ını teslim et | K01, K02, K03, K06, K07, K08, K09, K11, K13, K14, K15, K16, K20, K21, K22, K24, K25, K26, K27, K30, K33, K99-GREATEST_LEAST, K99-TIP_DONUSUMU | — | 0 | K01, K02, K03, K06, K07, K08, K09, K11, K13, K14, K15, K16, K20, K21, K22, K24, K25, K26, K27, K30, K33, K99-GREATEST_LEAST, K99-TIP_DONUSUMU | 5 + K99 |

## Bölüm 2 — Kavram sıklık tablosu

`⚠️`, üçten az vakada görülen ve bu nedenle yetersiz pekiştirilen kavramı gösterir. Mesafe, son vaka numarası eksi ilk vaka numarasıdır.

| Kavram | Kaç vakada | Vaka numaraları | İlk → son mesafe |
|---|---:|---|---:|
| K01 | 48 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52 | 51 vaka |
| K02 | 36 | 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27, 28, 33, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52 | 43 vaka |
| K03 | 39 | 3, 4, 7, 8, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26, 27, 28, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52 | 49 vaka |
| ⚠️ K04 | 1 | 3 | 0 vaka |
| K05 | 12 | 6, 16, 21, 22, 29, 31, 38, 40, 44, 46, 48, 50 | 44 vaka |
| K06 | 8 | 5, 21, 22, 24, 44, 46, 48, 52 | 47 vaka |
| K07 | 21 | 6, 8, 19, 20, 21, 22, 31, 36, 37, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 52 | 46 vaka |
| K08 | 3 | 44, 48, 52 | 8 vaka |
| K09 | 9 | 8, 23, 34, 35, 38, 46, 48, 51, 52 | 44 vaka |
| ⚠️ K10 | 2 | 6, 21 | 15 vaka |
| K11 | 6 | 7, 42, 44, 49, 51, 52 | 45 vaka |
| ⚠️ K12 | 1 | 8 | 0 vaka |
| K13 | 6 | 2, 43, 47, 49, 50, 52 | 50 vaka |
| K14 | 14 | 13, 14, 16, 36, 38, 40, 41, 42, 43, 46, 47, 49, 50, 52 | 39 vaka |
| K15 | 24 | 13, 15, 16, 17, 20, 21, 24, 27, 28, 33, 36, 37, 38, 39, 40, 41, 42, 44, 45, 46, 48, 49, 51, 52 | 39 vaka |
| K16 | 15 | 13, 14, 15, 16, 24, 38, 39, 41, 42, 45, 46, 48, 49, 51, 52 | 39 vaka |
| K17 | 14 | 17, 20, 33, 36, 37, 40, 41, 42, 43, 44, 45, 46, 47, 50 | 33 vaka |
| ⚠️ K18 | 1 | 16 | 0 vaka |
| ⚠️ K19 | 1 | 3 | 0 vaka |
| K20 | 18 | 17, 18, 19, 23, 33, 36, 37, 38, 40, 43, 44, 46, 47, 48, 49, 50, 51, 52 | 35 vaka |
| K21 | 6 | 35, 38, 44, 46, 48, 52 | 17 vaka |
| K22 | 18 | 20, 35, 36, 37, 38, 39, 40, 41, 42, 43, 45, 46, 47, 48, 49, 50, 51, 52 | 32 vaka |
| ⚠️ K23 | 2 | 22, 35 | 13 vaka |
| K24 | 19 | 17, 33, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52 | 35 vaka |
| K25 | 14 | 17, 20, 33, 36, 37, 41, 42, 43, 44, 45, 46, 47, 50, 52 | 35 vaka |
| K26 | 16 | 12, 15, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 48, 50, 51, 52 | 40 vaka |
| K27 | 14 | 20, 26, 36, 37, 38, 39, 40, 41, 42, 45, 46, 49, 51, 52 | 32 vaka |
| ⚠️ K28 | 2 | 11, 47 | 36 vaka |
| ⚠️ K29 | 2 | 10, 23 | 13 vaka |
| K30 | 14 | 26, 27, 37, 39, 41, 42, 43, 44, 45, 47, 49, 50, 51, 52 | 26 vaka |
| K31 | 3 | 21, 22, 24 | 3 vaka |
| K33 | 19 | 23, 24, 26, 36, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52 | 29 vaka |
| ⚠️ K34 | 2 | 25, 48 | 23 vaka |
| ⚠️ K35 | 1 | 25 | 0 vaka |
| K36 | 3 | 28, 40, 49 | 21 vaka |
| K37 | 3 | 26, 40, 48 | 22 vaka |
| ⚠️ K38 | 1 | 23 | 0 vaka |
| K99-AGGREGATE_FILTER | 4 | 38, 40, 50, 51 | 13 vaka |
| K99-ARITMETIK | 12 | 9, 12, 17, 19, 23, 29, 33, 39, 40, 42, 46, 50 | 41 vaka |
| ⚠️ K99-BILESIK_JOIN | 1 | 19 | 0 vaka |
| ⚠️ K99-CROSS_JOIN | 1 | 36 | 0 vaka |
| ⚠️ K99-DELETE | 1 | 31 | 0 vaka |
| ⚠️ K99-DENSE_RANK | 1 | 25 | 0 vaka |
| ⚠️ K99-GREATEST_LEAST | 2 | 50, 52 | 2 vaka |
| ⚠️ K99-HAREKETLI_ORTALAMA | 1 | 27 | 0 vaka |
| ⚠️ K99-INSERT | 2 | 30, 32 | 2 vaka |
| K99-KOSULLU_OZETLEME | 3 | 15, 41, 45 | 30 vaka |
| K99-NULL_SIRALAMA | 3 | 38, 42, 48 | 10 vaka |
| ⚠️ K99-OZ_BIRLESIM | 1 | 18 | 0 vaka |
| K99-PARTITION_BY | 4 | 25, 28, 40, 48 | 23 vaka |
| K99-PENCERE_CERCEVESI | 3 | 27, 28, 40 | 13 vaka |
| ⚠️ K99-RECURSIVE_CTE | 1 | 23 | 0 vaka |
| K99-RETURNING | 4 | 29, 30, 31, 32 | 3 vaka |
| K99-TARIH_ARITMETIGI | 6 | 38, 42, 46, 47, 48, 49 | 11 vaka |
| K99-TIP_DONUSUMU | 4 | 12, 47, 50, 52 | 40 vaka |
| ⚠️ K99-UPDATE | 2 | 29, 32 | 3 vaka |
| ⚠️ K99-UPSERT | 1 | 32 | 0 vaka |

### Rotada hiç geçmeyen standart kavramlar

- **K32 — Alt sorgu (FROM):** Hiçbir `solutionSql`, `FROM (SELECT ...)` biçiminde derived-table alt sorgusu kullanmıyor. CTE'den okuma K32 sayılmadı.

## Bölüm 3 — Sıçrama listesi

### 3.1 Çoklu yeni kavram

| Vaka | Yeni kavramlar |
|---|---|
| 3 — Kritik stokları sırala | K03, K04, K19 |
| 6 — Bekleyen şehir siparişlerini bul | K05, K07, K10 |
| 8 — Eksik teslimat kayıtlarını tara | K09, K12 |
| 9 — Satır gelirini hesapla | K02, K99-ARITMETIK |
| 12 — Satışları gelir bandına ayır | K26, K99-TIP_DONUSUMU |
| 13 — Kanal sağlık özetini hazırla | K14, K15, K16 |
| 17 — Sipariş değer dosyasını üret | K17, K20, K24, K25 |
| 20 — Sipariş vermeyen müşterileri de koru | K22, K27 |
| 23 — Kategori ağacını aç | K33, K38, K99-RECURSIVE_CTE |
| 25 — Kategori liderlerini sırala | K34, K35, K99-DENSE_RANK, K99-PARTITION_BY |
| 26 — Haftalık gelir değişimini ölç | K30, K37 |
| 27 — Yedi günlük talep sinyali üret | K99-HAREKETLI_ORTALAMA, K99-PENCERE_CERCEVESI |
| 29 — Sipariş için stok ayır | K99-RETURNING, K99-UPDATE |
| 38 — Müşteri kayıp risk kuyruğunu kur | K99-AGGREGATE_FILTER, K99-NULL_SIRALAMA, K99-TARIH_ARITMETIGI |

### 3.2 Yetim kavram

Tam olarak bir kez tanıtılıp bir daha kullanılmayan kavramlar:

- K04 ve K19 — yalnız #3.
- K12 — yalnız #8.
- K18 — yalnız #16.
- K99-OZ_BIRLESIM — yalnız #18.
- K99-BILESIK_JOIN — yalnız #19.
- K38 ve K99-RECURSIVE_CTE — yalnız #23.
- K35 ve K99-DENSE_RANK — yalnız #25.
- K99-HAREKETLI_ORTALAMA — yalnız #27.
- K99-DELETE — yalnız #31.
- K99-UPSERT — yalnız #32.
- K99-CROSS_JOIN — yalnız #36.

### 3.3 Geç tekrar

Burada eşik, ilk kullanım ile **ilk sonraki kullanım** arasındaki rota indeks farkının 12'den büyük olmasıdır. Bölüm 2'deki ilk–son mesafesiyle karıştırılmamalıdır.

| Kavram | Tanıtım → ilk tekrar | Mesafe |
|---|---|---:|
| K13 | 2 → 43 | 41 |
| K06 | 5 → 21 | 16 |
| K10 | 6 → 21 | 15 |
| K11 | 7 → 42 | 35 |
| K09 | 8 → 23 | 15 |
| K29 | 10 → 23 | 13 |
| K28 | 11 → 47 | 36 |
| K99-TIP_DONUSUMU | 12 → 47 | 35 |
| K99-KOSULLU_OZETLEME | 15 → 41 | 26 |
| K24 | 17 → 33 | 16 |
| K22 | 20 → 35 | 15 |
| K23 | 22 → 35 | 13 |
| K34 | 25 → 48 | 23 |
| K37 | 26 → 40 | 14 |

### 3.4 Kademe atlaması

Kademe atlaması, rota ilk kez yeni bir en yüksek standart kademeye ulaştığında önceki kademe yükünün pekişip pekişmediğine bakılarak değerlendirilmiştir; sonraki aşağı dönüşler yeni bir frontier atlaması sayılmamıştır.

1. **#3, Kademe 1 → 2:** K13 yalnız #2'de tanıtılmış, tekrar edilmeden K19'a geçilmiştir. Aynı #3 satırında K03 ve K04 de ilk kez istenir.
2. **#10, Kademe 2 → 4:** K19 yalnız #3'te kalmışken doğrudan K29'a geçilir; Kademe 3'ten henüz hiçbir kavram görülmemiştir. Bu nedenle taksonomi sırası açısından bir kademe tamamen atlanır.
3. **#21, Kademe 4 → 5:** K28 (#11), K29 (#10) ve K27 (#20) henüz ikinci kez kullanılmamışken K31 tanıtılır. K30 ise henüz hiç görülmemiştir.

### 3.5 Boş vaka

**Bulunmadı.** Yeni kavram getirmeyen vakalar da çözümün ana işi olarak daha önceki kavramları farklı veri tanesinde veya birleşik iş bağlamında kullanıyor. Örneğin #14 COUNT'un `NULL` davranışını, #24 CTE + alt sorgu bileşimini, #33 çok tablolı özetlemeyi ve #37–52 bütünleşik analist teslimlerini anlamlı biçimde pekiştiriyor.

## Bölüm 4 — 12. vaka bölgesi

### #10 — Temsilci etiketlerini oluştur

- **İstenen:** `UPPER(first_name || ' ' || last_name) AS agent_name` ile satır tanesini bozmadan metin üretmek.
- **Önceki vakadan gelen:** #9'da ifade sonucu için alias ve satır düzeyinde hesaplama görülmüştür.
- **Yeni yük:** K29.
- **Değerlendirme:** Tek yeni fonksiyon ailesi ve aynı satır tanesi nedeniyle geçiş dengelidir.

### #11 — Aylık dönem etiketini üret

- **İstenen:** `TO_CHAR(sale_date, 'YYYY-MM') AS sale_month`.
- **Önceki vakadan gelen:** #10'daki tek fonksiyon + alias + satır tanesini koruma deseni.
- **Yeni yük:** K28.
- **Değerlendirme:** Metin fonksiyonundan tarih fonksiyonuna kontrollü transferdir.

### #12 — Satışları gelir bandına ayır

- **İstenen:** `sale_id` için tip dönüşümü, `quantity * unit_price` hesabı ve eşik sıralı çok dallı `CASE`.
- **Önceki vakadan gelen:** Alias, satır düzeyinde aritmetik ve tek fonksiyonlu dönüşüm.
- **Yeni yük:** K26 + K99-TIP_DONUSUMU.
- **Eksik köprü:** Basit CASE ve tip dönüşümü ayrı ayrı çalışılmamıştır. İlk `intermediate` vaka aynı anda sınıf sınırı, işlem sırası ve çıktı tipi doğrular.

### #13 — Kanal sağlık özetini hazırla

- **İstenen:** Tek sorguda `COUNT(*)`, `SUM`, `AVG`, `MIN`, `MAX`, `GROUP BY channel` ve sıralama.
- **Önceki vakadan gelen:** #12 hâlâ her satış satırını bir çıktı satırı olarak korur; daha önce hiçbir vaka satırları gruba indirgememiştir.
- **Yeni yük:** K14 + K15 + K16.
- **Eksik köprü:** Öncesinde tablonun tek `COUNT` sonucu, tek metrikli genel özet veya tek kolon `GROUP BY + COUNT` yoktur. Çıktı tanesi bir anda sekiz olay satırından üç kanal satırına dönerken beş aggregate fonksiyonu birlikte zorunlu tutulur.
- **Hüküm:** Kullanıcının “12'den sonra sıçrama” hissinin ana ve doğrudan kaynağı budur.

### #14 — Kupon kullanımını doğru say

- **İstenen:** `COUNT(*)` ile `COUNT(coupon_code)` farkını kanal bazında göstermek.
- **Önceki vakadan gelen:** #13'te tanıtılan K14 ve K16.
- **Yeni yük:** Yok; `COUNT` içindeki `NULL` semantiği alt beceri olarak derinleşir.
- **Eksik köprü:** İçerik doğru bir giriş/pekiştirme vakasıdır fakat ağır #13'ten sonra konumlandığı için öğrenme iskelesi ters kurulmuştur.

### #15 — Sipariş durum matrisini kur

- **İstenen:** Üç ayrı `SUM(CASE WHEN ... THEN 1 ELSE 0 END)` metriği.
- **Önceki vakadan gelen:** K26 (#12), K15/K16 (#13) ve grup sayma (#14).
- **Yeni yük:** K99-KOSULLU_OZETLEME.
- **Eksik köprü:** Satır düzeyi CASE'in aggregate içine alınması tek bir koşullu metrikte prova edilmeden üç paralel sayaç istenir.

### #16 — Bölgesel gelir özetini çıkar

- **İstenen:** `WHERE status = 'completed'`, COUNT/SUM/GROUP BY, yeni HAVING eşiği ve gelir sırası.
- **Önceki vakadan gelen:** Satır filtresi, aggregate ailesi ve tek kolon gruplama.
- **Yeni yük:** K18.
- **Eksik köprü:** Ana yapılar pekişmiştir; yalnız satır filtresi ile grup filtresi ayrımının açıkça kurulması gerekir. Bu vaka modül finali olarak #13'ten daha dengelidir.

### Bölgesel sonuç

Sıçrama tek bir ileri sözdiziminden değil, ardışık bilişsel yük birikiminden doğuyor: #12 iki yeni kavramı birleştiriyor; #13 hemen ardından çıktı tanesini değiştirip üç yeni kavramı ve beş aggregate fonksiyonunu birlikte istiyor; daha sade COUNT/GROUP BY pratiği ancak #14'te geliyor. 10–16 bölgesi için **minimum üç, sağlıklı tek-yeni-kavram eğrisi için dört köprü** gerekir.

## Bölüm 5 — Yapay filtre taraması

### Kesin bulgu

| Vaka | Filtre | Neden gerekçelendirilemiyor |
|---|---|---|
| 8 — Eksik teslimat kayıtlarını tara | `customer_name LIKE '%e%'` | `delivered_at IS NULL` gerçek takip ihtiyacıdır; fakat müşteri adında küçük “e” bulunması operasyonel öncelik veya teslimat riski üretmez. Senaryo teknik predikatı tekrar ediyor, iş gerekçesi sunmuyor. Case-sensitive harf seçimi de gerçek kullanıcı grubunu keyfî biçimde dışlıyor ve vakayı LIKE bulmacasına çeviriyor. |

### Belirsiz aday

| Vaka | Filtre | Değerlendirme |
|---|---|---|
| 21 — Kampanya ürünlerini kısa listele | `unit_price > (SELECT AVG(unit_price) FROM products)` | **?** “Premium vitrin” için ortalama üstü fiyat iş kuralı senaryoda açıkça verilmiştir; bu nedenle kesin yapay filtre değildir. Ancak eşiğin iş verisinden değil SQL kavramını zorlamak için seçilmiş görünme riski vardır. |

Diğer tarih aralıkları, durum filtreleri, SCD güncel satır koşulu, anti-join `IS NULL`, güvenli DELETE koşulları ve pazarlama performans eşikleri senaryo/amaç içindeki karar veya veri güvenliği kuralına bağlanabildiği için yapay sayılmamıştır.

## Bölüm 6 — Öneri

Katı “bir vakada en fazla bir maddi yeni kavram” hedefi için **21 köprü vaka** gerekir. Kapsam kısıtlıysa aşağıdaki 14 müdahale noktasının her birine en az bir köprü eklenerek **14 vakalık minimum paket** uygulanabilir; ancak 5↔6, 12↔13, 16↔17, 22↔23, 24↔25 ve 37↔38 aralıklarında önerilen adet azaltılırsa çoklu yeni kavram kusuru tamamen kapanmaz.

| Nereye | Amaç | Getireceği kavram | Pekiştireceği |
|---|---|---|---|
| 2 ↔ 3 arası (1 köprü) | Sıralamayı LIMIT/Top-N'den önce tek başına çalıştırmak | K03 | K01 |
| 5 ↔ 6 arası (2 köprü) | Önce equality filtresini, sonra iki koşulu AND ile birleştirmeyi ayırmak | K05, ardından K07 | K01, K06 |
| 7 ↔ 8 arası (1 köprü) | LIKE eklenmeden önce eksik değer filtresini tek başına kurmak | K09 | K01, K07 |
| 8 ↔ 9 arası (1 köprü) | Hesaplamadan önce çıktı alias'ını tek başına görünür kılmak | K02 | K01 |
| 11 ↔ 12 arası (1 köprü) | CASE ile tip dönüşümünü aynı ilk temastan ayırmak | K26 veya K99-TIP_DONUSUMU | K01, K02, K99-ARITMETIK |
| 12 ↔ 13 arası (2 köprü) | Önce tek genel COUNT, sonra tek kolon GROUP BY + tek aggregate çalıştırmak | K14, ardından K16 | K01, K02, K05 |
| 14 ↔ 15 arası (1 köprü) | Üç sayaçtan önce tek koşullu aggregate üretmek | K99-KOSULLU_OZETLEME | K15, K16, K26 |
| 16 ↔ 17 arası (3 köprü) | İki tablo JOIN, sonra üç tablo JOIN, sonra JOIN + GROUP BY yüklerini ayırmak | K20, ardından K24 ve K25/K17 | K01, K03, K15 |
| 20 ↔ 21 arası (1 köprü) | Aynı vakada iki alt sorgudan önce tek scalar/IN alt sorgusu çalıştırmak | K31 | K05, K06, K10, K15 |
| 22 ↔ 23 arası (2 köprü) | Önce düz CTE, sonra UNION ALL; recursion'ı mevcut vakaya bırakmak | K33, ardından K38 | K01, K20, K29 |
| 24 ↔ 25 arası (2 köprü) | ROW_NUMBER'ı RANK/DENSE_RANK ve PARTITION BY'dan ayırmak | K34, ardından K35/K99-PARTITION_BY | K03, K02 |
| 26 ↔ 27 arası (1 köprü) | Hareketli ortalamadan önce açık pencere çerçevesini bilinen SUM üzerinden göstermek | K99-PENCERE_CERCEVESI | K15, K30, K36 |
| 28 ↔ 29 arası (1 köprü) | İlk mutation'da RETURNING eklenmeden kontrollü UPDATE kapsamını kurmak | K99-UPDATE | K05, K99-ARITMETIK |
| 37 ↔ 38 arası (3 köprü) | Tarih farkı, aggregate FILTER ve NULL sıralamasını üç ayrı küçük karar adımına bölmek | K99-TARIH_ARITMETIGI, K99-AGGREGATE_FILTER, K99-NULL_SIRALAMA | K14, K15, K26, K33 |

41–52 arasındaki portföy projeleri uzun olsa da büyük ölçüde daha önce görülen kavramları birleştirir; bu bölgede yeni vaka sayısından önce K99-GREATEST_LEAST ve tip dönüşümü gibi az tekrarlanan yapıların mevcut projeler öncesinde kısa transferlerle pekiştirilmesi daha değerlidir.

## Taksonomi dışı K99 kavramları

| Kod | Anlam | Vaka numaraları |
|---|---|---|
| K99-AGGREGATE_FILTER | PostgreSQL aggregate `FILTER (WHERE ...)` | 38, 40, 50, 51 |
| K99-ARITMETIK | Oran/ROUND dışında kalan maddi satır aritmetiği | 9, 12, 17, 19, 23, 29, 33, 39, 40, 42, 46, 50 |
| K99-BILESIK_JOIN | Birden fazla anahtar kolonu ile eşleştirme | 19 |
| K99-CROSS_JOIN | Kapsama omurgası için kartezyen birleşim | 36 |
| K99-DELETE | Kontrollü satır silme | 31 |
| K99-DENSE_RANK | Eşitlikte boşluk bırakmayan sıralama | 25 |
| K99-GREATEST_LEAST | Sınır seçen `GREATEST` / `LEAST` fonksiyonları | 50, 52 |
| K99-HAREKETLI_ORTALAMA | `AVG(...) OVER (...)` ile hareketli ortalama | 27 |
| K99-INSERT | Satır ekleme | 30, 32 |
| K99-KOSULLU_OZETLEME | `SUM(CASE ...)` ile koşullu aggregate | 15, 41, 45 |
| K99-NULL_SIRALAMA | `NULLS FIRST` / `NULLS LAST` | 38, 42, 48 |
| K99-OZ_BIRLESIM | Aynı tabloyu iki rolde birleştirme | 18 |
| K99-PARTITION_BY | Window bölümlendirme | 25, 28, 40, 48 |
| K99-PENCERE_CERCEVESI | `ROWS BETWEEN ...` window çerçevesi | 27, 28, 40 |
| K99-RECURSIVE_CTE | `WITH RECURSIVE` ile özyinelemeli sorgu | 23 |
| K99-RETURNING | DML sonucunu görünür teslim olarak döndürme | 29, 30, 31, 32 |
| K99-TARIH_ARITMETIGI | Tarih farkı ve `INTERVAL` tabanlı tarih hesabı | 38, 42, 46, 47, 48, 49 |
| K99-TIP_DONUSUMU | Sonuç sözleşmesi için maddi `CAST` / `::type` | 12, 47, 50, 52 |
| K99-UPDATE | Kontrollü satır güncelleme | 29, 32 |
| K99-UPSERT | `INSERT ... ON CONFLICT DO UPDATE` | 32 |

## Belirsizlikler (`?`)

- **#21 yapay filtre adayı:** Ortalama fiyatın “premium” eşiği olması senaryoda açıkça tanımlı olduğu için kesin kusur sayılmadı; buna rağmen eşik ürün kararından çok alt sorgu kullandırmak için seçilmiş olabilir.
- Bunun dışında vaka–kavram eşlemesinde çözülmemiş bir belirsizlik bırakılmadı. İleri sorgulardaki zorunlu olmayan tablo kısa adları ve sonuç sözleşmesini etkilemeyen redundant cast'ler kavram olarak sayılmadı.
