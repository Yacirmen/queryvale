const sql = (source: string): string => {
  const lines = source.split("\n");
  while (lines[0]?.trim() === "") lines.shift();
  while (lines.at(-1)?.trim() === "") lines.pop();
  const indentation = Math.min(
    ...lines
      .filter((line) => line.trim())
      .map((line) => line.match(/^\s*/)?.[0].length ?? 0),
  );
  return lines.map((line) => line.slice(indentation)).join("\n");
};

/**
 * Editörün açılış içeriği — yalnız alıştırmalar için.
 *
 * Boş bir editör ve yanıp sönen imleç, bir alıştırmanın en pahalı anıdır:
 * öğrenen kavramı biliyor olsa bile ilk satırı yazmak için görevi hatırlamak,
 * tablo adını bulmak ve cümle sırasını kurmak zorunda kalır. İskelet bu üç
 * yükü kaldırır ve geriye asıl kararı bırakır.
 *
 * İki kural bu dosyayı kullanılabilir tutar:
 *
 * 1. Alıştırmanın öğrettiği anahtar kelime iskelette geçmez. DISTINCT
 *    alıştırmasında DISTINCT, EXISTS alıştırmasında EXISTS yazılı değildir;
 *    yalnız o kelimenin gireceği boşluk vardır. Aksi hâlde iskelet cevabın
 *    kendisi olur ve üç aşamalı ipuç merdivenini anlamsızlaştırır.
 * 2. Aranan hiçbir sabit değer (eşik, tarih, kategori adı) iskelette
 *    görünmez; yorum satırı yalnız iş sorusunu söyler.
 *
 * Vakalar bilerek dışarıda: onlar puanlı ölçüm ve sorguyu sıfırdan kurmak
 * ölçülen becerinin ta kendisi. `assertCurriculumIsValid` bu ayrımı ve
 * yukarıdaki iki kuralı makine tarafından denetler.
 */
export const TASK_STARTERS: Readonly<Record<string, string>> = {
  "m2-d1": sql(`
    -- Her şehir listede yalnız bir kez görünsün.
    SELECT
    FROM orders
  `),
  "m2-m1": sql(`
    -- Yüksek tutarlı siparişlerin şehirleri, tekrarsız.
    SELECT
    FROM orders
    WHERE
  `),
  "m2-d2": sql(`
    -- Yalnız bekleyen siparişlerin kimliği ve durumu.
    SELECT order_id, status
    FROM orders
  `),
  "m2-d3": sql(`
    -- Yalnız iki hedef şehrin siparişleri.
    SELECT order_id, city
    FROM orders
    WHERE
  `),
  "m2-d4": sql(`
    -- Tek bir şehirde ve eşiğin üzerinde olan siparişler.
    SELECT order_id, customer_name
    FROM orders
    WHERE
  `),
  "m2-m2": sql(`
    -- İki şehirden biri, bekleyen durumda ve eşiğin üzerinde.
    SELECT order_id, city
    FROM orders
    WHERE
  `),
  "m2-d5": sql(`
    -- Belirli bir tarih aralığında alınan siparişler.
    SELECT order_id, ordered_at
    FROM orders
    WHERE
  `),
  "m2-d6": sql(`
    -- Teslim tarihi henüz oluşmamış siparişler.
    SELECT order_id, customer_name
    FROM orders
    WHERE
  `),
  "m2-d7": sql(`
    -- Teslim edilmemiş ve adında aranan harf geçen müşteriler.
    SELECT customer_name
    FROM orders
    WHERE
  `),
  "m2-m3": sql(`
    -- Teslim edilmemiş, adı desene uyan, tarih aralığındaki siparişler.
    SELECT customer_name, status
    FROM orders
    WHERE
    ORDER BY
  `),
  "m3-d1": sql(`
    -- Miktarı en yüksek ilk iki satış hareketi.
    SELECT sale_id, quantity
    FROM sales
    ORDER BY
  `),
  "m3-m1": sql(`
    -- Birim fiyatı en yüksek ilk iki satır.
    SELECT sale_id, unit_price
    FROM sales
    ORDER BY
  `),
  "m3-d2": sql(`
    -- Temsilci adı büyük harfle, agent_label adıyla.
    SELECT
      sale_id
    FROM sales
  `),
  "m3-m2": sql(`
    -- agent_label (ad, büyük harf) ve revenue (adet x birim fiyat).
    SELECT
    FROM sales
  `),
  "m3-d3": sql(`
    -- Satış tarihinden yalnız yıl, sale_year adıyla.
    SELECT
      sale_id
    FROM sales
  `),
  "m3-m3": sql(`
    -- Ay kısaltması büyük harfle, sale_month_label adıyla.
    SELECT
      sale_id
    FROM sales
  `),
  "m4-d4": sql(`
    -- Sipariş kimliği metin tipinde, order_ref adıyla.
    SELECT
    FROM channel_orders
  `),
  "m4-m1": sql(`
    -- order_ref (metin kimlik) ve amount_band (eşiğe göre etiket).
    SELECT
    FROM channel_orders
  `),
  "m4-d1": sql(`
    -- Tablodaki toplam satır sayısı, order_count adıyla.
    SELECT
    FROM channel_orders
  `),
  "m4-d2": sql(`
    -- Her kanalın satır sayısı, order_count adıyla.
    SELECT
      channel
    FROM channel_orders
    GROUP BY
  `),
  "m4-m2": sql(`
    -- Kanal başına order_count ve total_amount; kanala göre artan.
    SELECT
      channel
    FROM channel_orders
    GROUP BY
    ORDER BY
  `),
  "m4-d3": sql(`
    -- Bölge başına completed_transaction_count; bölgeye göre artan.
    SELECT
      region
    FROM transactions
    GROUP BY
    ORDER BY
  `),
  "m4-m3": sql(`
    -- Bölge başına transaction_count ve completed_transaction_count.
    SELECT
      region
    FROM transactions
    GROUP BY
    ORDER BY
  `),
  "m5-d1": sql(`
    -- Kalem tutarı toplamı eşiği geçen siparişlerin item_count değeri.
    SELECT
      order_id
    FROM order_items
    GROUP BY order_id
    ORDER BY order_id
  `),
  "m5-m1": sql(`
    -- Kalem tutarı toplamı eşiği geçen siparişlerin order_amount değeri.
    SELECT
      order_id
    FROM order_items
    GROUP BY order_id
    ORDER BY order_id
  `),
  "m5-d2": sql(`
    -- Sipariş kimliği ve müşteri adı; kimliğe göre artan.
    SELECT
    FROM orders o
    ORDER BY o.order_id
  `),
  "m5-d3": sql(`
    -- Sipariş kimliği, müşteri adı ve kalem kimliği tek satırda.
    SELECT
    FROM orders o
    ORDER BY o.order_id, i.item_id
  `),
  "m5-d4": sql(`
    -- Sipariş ve birim fiyat kırılımında line_count.
    SELECT
    FROM order_items
    GROUP BY
    ORDER BY order_id, unit_price
  `),
  "m5-d5": sql(`
    -- Müşteri başına order_count; ada göre artan.
    SELECT
    FROM orders o
    INNER JOIN customers c ON o.customer_id = c.customer_id
    GROUP BY
    ORDER BY
  `),
  "m5-m2": sql(`
    -- Sipariş ve müşteri kırılımında item_count; kimliğe göre artan.
    SELECT
    FROM orders o
    INNER JOIN customers c ON o.customer_id = c.customer_id
    GROUP BY
    ORDER BY
  `),
  "m6-d1": sql(`
    -- Birim fiyatı katalog ortalamasının üzerindeki ürünler.
    SELECT product_name, unit_price
    FROM products
    WHERE unit_price >
    ORDER BY
  `),
  "m6-d2": sql(`
    -- Önce alt kategori sayıları, sonra kategori adıyla eşleştir.
    WITH child_counts AS (
    )
    SELECT
    FROM child_counts cc
    ORDER BY
  `),
  "m6-d3": sql(`
    -- Kök kategori 0 derinlikte, altındakiler 1 derinlikte, tek listede.
    SELECT category_name, 0 AS depth
    FROM categories
    WHERE

    SELECT category_name, 1
    FROM categories
    WHERE
    ORDER BY depth, category_name
  `),
  "m6-d4": sql(`
    -- Altında en az bir alt kategori bulunan kategoriler.
    SELECT c.category_id, c.category_name
    FROM categories c
    WHERE
    ORDER BY c.category_id
  `),
  "m7-d1": sql(`
    -- Ciroya göre azalan, eşitlikte isme göre artan sıra numarası.
    SELECT
      rep_name,
      revenue,
    FROM representative_sales
    ORDER BY row_no
  `),
  "m7-d2": sql(`
    -- Sıralama her kategori kendi içinde; eşitler aynı sırayı paylaşsın.
    SELECT
      category,
      rep_name,
      revenue,
    FROM representative_sales
    ORDER BY category, revenue_rank, rep_name
  `),
  "m7-d4": sql(`
    -- Aynı veri, aynı bölüm; bu kez eşitlikten sonra sıra atlansın.
    SELECT
      category,
      rep_name,
      revenue,
    FROM representative_sales
    ORDER BY category, revenue_rank, rep_name
  `),
  "m7-d3": sql(`
    -- Her güne, o gün ve önceki iki günü kapsayan kayan toplam.
    -- Kolon adı: rolling_3d_units
    SELECT
      demand_date,
      units
    FROM daily_demand
    ORDER BY demand_date
  `),
  "m7-d5": sql(`
    -- Her hesabın kendi içinde, iki basamağa yuvarlanmış hareketli ortalama.
    SELECT
      account_no,
      transaction_date,
      amount,
      ROUND(AVG(amount) OVER (
      ), 2) AS moving_avg_2
    FROM account_transactions
    ORDER BY account_no, transaction_date
  `),
  "m8-d1": sql(`
    -- inventory_movements tablosuna yeni bir giriş hareketi ekle.
    -- Eklenen satırı aynı ifadede geri gör:
    --   movement_id, product_id, quantity_delta
  `),
  "m8-d2": sql(`
    -- Silinecek satırları silmeden önce oku.
    SELECT import_row_id, batch_id, status
    FROM import_rows
    WHERE
    ORDER BY import_row_id
  `),
  "m8-d4": sql(`
    -- Bir önceki alıştırmada ölçtüğün kapsamı import_rows üzerinde uygula.
    -- Giden satırı aynı ifadede geri gör:
    --   import_row_id, batch_id, status
  `),
  "m8-d3": sql(`
    -- Yaz; anahtar zaten varsa değerleri güncelle ve yazılan satırı gör.
    INSERT INTO branch_daily_metrics (
      branch_id,
      metric_date,
      order_count,
      revenue
    )
    VALUES ()
  `),
  "m9-d1": sql(`
    -- Yalnız hedef kategorideki ürünlere ait fact satırları.
    SELECT sale_key, product_key, quantity
    FROM fact_sales
    WHERE product_key
    ORDER BY sale_key
  `),
  "m9-d2": sql(`
    -- Altı sürüm satırının arkasındaki gerçek müşteriler.
    SELECT
    FROM dim_customer
    ORDER BY customer_id
  `),
  "m9-d3": sql(`
    -- Müşteri başına en geç sürüm başlangıcı, latest_version_start adıyla.
    SELECT
      customer_id,
    FROM dim_customer
    GROUP BY
    ORDER BY customer_id
  `),
  "m10-d1": sql(`
    -- Her şube listede kalsın; dönem koşulu birleşimin içinde dursun.
    SELECT
      b.branch_name,
    FROM branches b
    LEFT JOIN branch_sales s
      ON
    GROUP BY b.branch_name
    ORDER BY b.branch_name
  `),
  "m10-d2": sql(`
    -- Aynı sorgu, ama satışsız şubenin tutarı boş yerine sıfır.
    SELECT
      b.branch_name,
    FROM branches b
    LEFT JOIN branch_sales s
      ON
    GROUP BY b.branch_name
    ORDER BY b.branch_name
  `),
};

export function getTaskStarter(taskId: string): string | undefined {
  return TASK_STARTERS[taskId];
}
