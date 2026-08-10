# Queryvale G4b — Temel Bölge Kapsama Kanıtı

Bu belge yalnızca yeniden kurulan temel rota (#1–#17) içindir. İlk 17 özgün vaka korunur; rota sırası `routeOrder` ile yeniden dengelenir. #18–#52 vaka kimliği, içeriği, puanı ve göreli sırası bu çalışmanın dışında tutulur.

## Doğrulama yöntemi

- Kaynak gerçeklik `src/content/curriculum.ts` içindeki `curriculumConcepts` alanıdır. Bu alanlar G4a'nın çözüm-SQL denetimindeki kavram haritasını taşır; SQL doğrulama kavramlarıyla karıştırılmaz.
- Özgün #1–#17 vakalarının tamamı ve 30 yeni alıştırmanın tamamı bu alanı taşır. #18–#52'ye `curriculumConcepts` eklenmez.
- Kapsama sayısı, bir kavramın aynı rota kaleminde kaç kez yazıldığına değil, onu taşıyan rota kalemi sayısına göre hesaplanır.
- Alıştırma veri dünyası kopyalanmaz: her alıştırma kendisinden sonraki vakanın `setupSql`, `schema` ve `sampleRows` referanslarını aynen kullanır. Bu sözleşme rota testinde doğrudan referans eşitliğiyle denetlenir.
- `drill_intro` yalnız bir `conceptNew` taşır; `drill_practice` ve `drill_mix` yeni kavram taşımaz. Mix'lerdeki her kavram, kendisinden önceki dört rota kaleminde bulunur.

## Kavram kapsamı

`Tanıtım` sütunu kavramın rotadaki ilk temasını, `Tekrar 1` ve `Tekrar 2 / birleşim` ise en erken anlamlı sonraki temasları gösterir. Parantez içindeki toplam, temel rota içindeki tüm temas sayısıdır.

| Kavram               | Tanıtım      | Tekrar 1     | Tekrar 2 / birleşim                              | Toplam temas | Kural |
| -------------------- | ------------ | ------------ | ------------------------------------------------ | -----------: | :---: |
| K01                  | 1 `m1-t1`    | 2 `m1-t2`    | 2.1 `m2-d1` ve sonraki tüm temel kalemler        |           47 |   ✓   |
| K02                  | 9 `m3-t1`    | 10 `m3-t2`   | 10.1 `m3-d2` ve sonraki dönüşüm/özet kalemleri   |           25 |   ✓   |
| K03                  | 5 `m2-t3`    | 5.4 `m2-m3`  | 6 `m2-t4`, 7 `m1-t4`, Top-N ve özetler           |           22 |   ✓   |
| K04                  | 8 `m1-t3`    | 8.1 `m3-d1`  | 8.2 `m3-m1`                                      |            3 |   ✓   |
| K05                  | 3.2 `m2-d2`  | 3.4 `m2-d4`  | 4 `m2-t2`, 4.1 `m2-m2`, 16 `m4-t1`               |            5 |   ✓   |
| K06                  | 3 `m2-t1`    | 3.1 `m2-m1`  | 3.4 `m2-d4`, 4.1 `m2-m2`                         |            4 |   ✓   |
| K07                  | 3.4 `m2-d4`  | 4 `m2-t2`    | 4.1 `m2-m2`, 5.3 `m2-d7`, 5.4 `m2-m3`, 6 `m2-t4` |            6 |   ✓   |
| K09                  | 5.2 `m2-d6`  | 5.3 `m2-d7`  | 5.4 `m2-m3`, 6 `m2-t4`                           |            4 |   ✓   |
| K10                  | 3.3 `m2-d3`  | 4 `m2-t2`    | 4.1 `m2-m2`                                      |            3 |   ✓   |
| K11                  | 5 `m2-t3`    | 5.1 `m2-d5`  | 5.4 `m2-m3`                                      |            3 |   ✓   |
| K12                  | 5.3 `m2-d7`  | 5.4 `m2-m3`  | 6 `m2-t4`                                        |            3 |   ✓   |
| K13                  | 2 `m1-t2`    | 2.1 `m2-d1`  | 3.1 `m2-m1`                                      |            3 |   ✓   |
| K14                  | 12.3 `m4-d1` | 12.4 `m4-d2` | 13 `m4-t3`, 14 `m4-t2` ve sonraki özetler        |           11 |   ✓   |
| K15                  | 14 `m4-t2`   | 14.1 `m4-m2` | 15 `m4-t4`, 15.1/15.2, 16–17                     |            9 |   ✓   |
| K16                  | 12.4 `m4-d2` | 13 `m4-t3`   | 14 `m4-t2` ve sonraki özet/JOIN hazırlıkları     |           12 |   ✓   |
| K17                  | 16.5 `m5-d4` | 16.7 `m5-m2` | 17 `m5-t2`                                       |            3 |   ✓   |
| K18                  | 16 `m4-t1`   | 16.1 `m5-d1` | 16.2 `m5-m1`                                     |            3 |   ✓   |
| K19                  | 8 `m1-t3`    | 8.1 `m3-d1`  | 8.2 `m3-m1`                                      |            3 |   ✓   |
| K20                  | 16.3 `m5-d2` | 16.4 `m5-d3` | 16.6 `m5-d5`, 16.7 `m5-m2`, 17 `m5-t2`           |            5 |   ✓   |
| K24                  | 16.4 `m5-d3` | 16.7 `m5-m2` | 17 `m5-t2`                                       |            3 |   ✓   |
| K25                  | 16.6 `m5-d5` | 16.7 `m5-m2` | 17 `m5-t2`                                       |            3 |   ✓   |
| K26                  | 12 `m3-t4`   | 12.2 `m4-m1` | 15 `m4-t4`, 15.1 `m4-d3`, 15.2 `m4-m3`           |            5 |   ✓   |
| K28                  | 11 `m3-t3`   | 11.1 `m3-d3` | 11.2 `m3-m3`                                     |            3 |   ✓   |
| K29                  | 10 `m3-t2`   | 10.1 `m3-d2` | 10.2 `m3-m2`, 11.2 `m3-m3`                       |            4 |   ✓   |
| K99-ARITMETIK        | 9 `m3-t1`    | 10.2 `m3-m2` | 12 `m3-t4`, 16.1/16.2, 17 `m5-t2`                |            6 |   ✓   |
| K99-TIP_DONUSUMU     | 12 `m3-t4`   | 12.1 `m4-d4` | 12.2 `m4-m1`                                     |            3 |   ✓   |
| K99-KOSULLU_OZETLEME | 15 `m4-t4`   | 15.1 `m4-d3` | 15.2 `m4-m3`                                     |            3 |   ✓   |

Kapsam dışındaki G4a kodları (örneğin K08, K21–K23, K27 ve ileri SQL kodları) ilk 17 özgün vakanın çözümünde geçmediği için bu temel kapsama sözleşmesine dahil değildir.

## Yeni temel rota — tam liste

Toplam: **47 rota kalemi = 17 puanlı vaka + 30 atlanabilir, puansız alıştırma.** `Yeni kavram` yalnız `drill_intro` satırlarında gösterilir; vakalar özgün içeriklerini korur.

| Rota | Kimlik  | Tip            | Ad                               | Yeni kavram |
| ---: | ------- | -------------- | -------------------------------- | ----------- |
|    1 | `m1-t1` | case           | Katalog görünümünü hazırla       | —           |
|    2 | `m1-t2` | case           | Kategori listesini tekilleştir   | —           |
|  2.1 | `m2-d1` | drill_practice | Şehirleri tekilleştir            | —           |
|    3 | `m2-t1` | case           | Yüksek tutarlı siparişleri ayır  | —           |
|  3.1 | `m2-m1` | drill_mix      | Tekrarsız kontrol şehirleri      | —           |
|  3.2 | `m2-d2` | drill_intro    | Tek durum eşitliği               | K05         |
|  3.3 | `m2-d3` | drill_intro    | Şehir kümesini seç               | K10         |
|  3.4 | `m2-d4` | drill_intro    | İki koşulu birlikte tut          | K07         |
|    4 | `m2-t2` | case           | Bekleyen şehir siparişlerini bul | —           |
|  4.1 | `m2-m2` | drill_mix      | Öncelikli şehir kuyruğu          | —           |
|    5 | `m2-t3` | case           | Kampanya tarih aralığını incele  | —           |
|  5.1 | `m2-d5` | drill_practice | Tarih penceresini tekrar kur     | —           |
|  5.2 | `m2-d6` | drill_intro    | Eksik teslimatı seç              | K09         |
|  5.3 | `m2-d7` | drill_intro    | İsim desenini ara                | K12         |
|  5.4 | `m2-m3` | drill_mix      | Eksik teslimat penceresi         | —           |
|    6 | `m2-t4` | case           | Eksik teslimat kayıtlarını tara  | —           |
|    7 | `m1-t4` | case           | Fiyat panosunu düzenle           | —           |
|    8 | `m1-t3` | case           | Kritik stokları sırala           | —           |
|  8.1 | `m3-d1` | drill_practice | İlk iki satış hareketi           | —           |
|  8.2 | `m3-m1` | drill_mix      | Fiyata göre kısa liste           | —           |
|    9 | `m3-t1` | case           | Satır gelirini hesapla           | —           |
|   10 | `m3-t2` | case           | Temsilci etiketlerini oluştur    | —           |
| 10.1 | `m3-d2` | drill_practice | Temsilci adını büyük yaz         | —           |
| 10.2 | `m3-m2` | drill_mix      | Etiket ve gelir birlikte         | —           |
|   11 | `m3-t3` | case           | Aylık dönem etiketini üret       | —           |
| 11.1 | `m3-d3` | drill_practice | Satış yılını ayır                | —           |
| 11.2 | `m3-m3` | drill_mix      | Ay etiketini standardize et      | —           |
|   12 | `m3-t4` | case           | Satışları gelir bandına ayır     | —           |
| 12.1 | `m4-d4` | drill_practice | Sipariş kimliğini metne çevir    | —           |
| 12.2 | `m4-m1` | drill_mix      | Metin referansı ve tutar bandı   | —           |
| 12.3 | `m4-d1` | drill_intro    | Tek COUNT                        | K14         |
| 12.4 | `m4-d2` | drill_intro    | GROUP BY + tek aggregate         | K16         |
|   13 | `m4-t3` | case           | Kupon kullanımını doğru say      | —           |
|   14 | `m4-t2` | case           | Kanal sağlık özetini hazırla     | —           |
| 14.1 | `m4-m2` | drill_mix      | Kanal sayısı ve toplamı          | —           |
|   15 | `m4-t4` | case           | Sipariş durum matrisini kur      | —           |
| 15.1 | `m4-d3` | drill_practice | Tek koşullu sayaç                | —           |
| 15.2 | `m4-m3` | drill_mix      | Bölgesel tamamlama özeti         | —           |
|   16 | `m4-t1` | case           | Bölgesel gelir özetini çıkar     | —           |
| 16.1 | `m5-d1` | drill_practice | HAVING ile eşik koy              | —           |
| 16.2 | `m5-m1` | drill_mix      | Sipariş toplamına eşik koy       | —           |
| 16.3 | `m5-d2` | drill_intro    | İki tablo INNER JOIN             | K20         |
| 16.4 | `m5-d3` | drill_intro    | Üç tabloyu ilişkilendir          | K24         |
| 16.5 | `m5-d4` | drill_intro    | İki kolonla grupla               | K17         |
| 16.6 | `m5-d5` | drill_intro    | JOIN sonucunu özetle             | K25         |
| 16.7 | `m5-m2` | drill_mix      | Sipariş kalem özetini birleştir  | —           |
|   17 | `m5-t2` | case           | Sipariş değer dosyasını üret     | —           |

## Alıştırma çözüm kataloğu

Bu katalogdaki SQL, her alıştırmanın `solutionSql` değeridir. Alıştırmalar yalnız daha önce öğretilmiş yapıları kullanır; `drill_intro` satırlarında yalnız kendi yeni kavramı eklenir.

```sql
-- 2.1 · m2-d1
SELECT DISTINCT city
FROM orders;

-- 3.1 · m2-m1
SELECT DISTINCT city
FROM orders
WHERE total_amount >= 500;

-- 3.2 · m2-d2
SELECT order_id, status
FROM orders
WHERE status = 'pending';

-- 3.3 · m2-d3
SELECT order_id, city
FROM orders
WHERE city IN ('Ankara', 'Istanbul');

-- 3.4 · m2-d4
SELECT order_id, customer_name
FROM orders
WHERE city = 'Istanbul'
  AND total_amount >= 500;

-- 4.1 · m2-m2
SELECT order_id, city
FROM orders
WHERE city IN ('Ankara', 'Istanbul')
  AND status = 'pending'
  AND total_amount >= 300;

-- 5.1 · m2-d5
SELECT order_id, ordered_at
FROM orders
WHERE ordered_at BETWEEN DATE '2026-01-05' AND DATE '2026-01-08';

-- 5.2 · m2-d6
SELECT order_id, customer_name
FROM orders
WHERE delivered_at IS NULL;

-- 5.3 · m2-d7
SELECT customer_name
FROM orders
WHERE delivered_at IS NULL
  AND customer_name LIKE '%e%';

-- 5.4 · m2-m3
SELECT customer_name, status
FROM orders
WHERE delivered_at IS NULL
  AND customer_name LIKE '%e%'
  AND ordered_at BETWEEN DATE '2026-01-05' AND DATE '2026-01-08'
ORDER BY customer_name;

-- 8.1 · m3-d1
SELECT sale_id, quantity
FROM sales
ORDER BY quantity DESC
LIMIT 2;

-- 8.2 · m3-m1
SELECT sale_id, unit_price
FROM sales
ORDER BY unit_price DESC
LIMIT 2;

-- 10.1 · m3-d2
SELECT sale_id, UPPER(agent_first_name) AS agent_label
FROM sales;

-- 10.2 · m3-m2
SELECT
  UPPER(agent_first_name) AS agent_label,
  quantity * unit_price AS revenue
FROM sales;

-- 11.1 · m3-d3
SELECT sale_id, TO_CHAR(sale_date, 'YYYY') AS sale_year
FROM sales;

-- 11.2 · m3-m3
SELECT sale_id, UPPER(TO_CHAR(sale_date, 'Mon')) AS sale_month_label
FROM sales;

-- 12.1 · m4-d4
SELECT CAST(order_id AS TEXT) AS order_ref
FROM channel_orders;

-- 12.2 · m4-m1
SELECT
  CAST(order_id AS TEXT) AS order_ref,
  CASE
    WHEN order_amount >= 900 THEN 'Yüksek'
    ELSE 'Standart'
  END AS amount_band
FROM channel_orders;

-- 12.3 · m4-d1
SELECT COUNT(*) AS order_count
FROM channel_orders;

-- 12.4 · m4-d2
SELECT channel, COUNT(*) AS order_count
FROM channel_orders
GROUP BY channel;

-- 14.1 · m4-m2
SELECT
  channel,
  COUNT(*) AS order_count,
  SUM(order_amount) AS total_amount
FROM channel_orders
GROUP BY channel
ORDER BY channel;

-- 15.1 · m4-d3
SELECT
  region,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_transaction_count
FROM transactions
GROUP BY region
ORDER BY region;

-- 15.2 · m4-m3
SELECT
  region,
  COUNT(*) AS transaction_count,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_transaction_count
FROM transactions
GROUP BY region
ORDER BY region;

-- 16.1 · m5-d1
SELECT
  order_id,
  COUNT(*) AS item_count
FROM order_items
GROUP BY order_id
HAVING SUM(quantity * unit_price) >= 400
ORDER BY order_id;

-- 16.2 · m5-m1
SELECT
  order_id,
  SUM(quantity * unit_price) AS order_amount
FROM order_items
GROUP BY order_id
HAVING SUM(quantity * unit_price) >= 450
ORDER BY order_id;

-- 16.3 · m5-d2
SELECT o.order_id, c.customer_name
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
ORDER BY o.order_id;

-- 16.4 · m5-d3
SELECT o.order_id, c.customer_name, i.item_id
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
INNER JOIN order_items i ON i.order_id = o.order_id
ORDER BY o.order_id, i.item_id;

-- 16.5 · m5-d4
SELECT
  order_id,
  unit_price,
  COUNT(*) AS line_count
FROM order_items
GROUP BY order_id, unit_price
ORDER BY order_id, unit_price;

-- 16.6 · m5-d5
SELECT
  c.customer_name,
  COUNT(*) AS order_count
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
GROUP BY c.customer_name
ORDER BY c.customer_name;

-- 16.7 · m5-m2
SELECT
  o.order_id,
  c.customer_name,
  COUNT(i.item_id) AS item_count
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
INNER JOIN order_items i ON i.order_id = o.order_id
GROUP BY o.order_id, c.customer_name
ORDER BY o.order_id;
```

## Yapamadıklarım

Yok. G4b kapsamındaki 30 alıştırma, rota sıralaması, kavram temasları, alıştırma alt-tip sözleşmesi ve sonraki-vaka fixture devamlılığı içerikte tanımlandı.
