/**
 * Köprü alıştırması doğrulayıcı.
 *
 * Bir fixture ve çözüm sorgusu alır, gerçek PGlite motorunda çalıştırır ve
 * içerik sözleşmesine yapıştırılabilecek expectedColumns/expectedResult
 * çıktısını üretir. Beklenen sonuç elle yazılmaz; motor ne döndürüyorsa odur.
 */
import { PGlite } from "@electric-sql/pglite";

const [, , setupPath, sql] = process.argv;
if (!setupPath || !sql) {
  console.error("kullanım: node scripts/drill-verify.mjs <setup.sql> \"<sorgu>\"");
  process.exit(1);
}

const { readFileSync } = await import("node:fs");
const setup = readFileSync(setupPath, "utf8");

const db = await PGlite.create();
try {
  await db.exec(setup);
  const res = await db.query(sql);
  const cols = res.fields.map((f) => f.name);
  const rows = res.rows.map((r) => cols.map((c) => r[c]));

  const fmt = (v) =>
    v === null ? "null"
      : typeof v === "number" ? String(v)
      : typeof v === "bigint" ? String(v)
      : typeof v === "boolean" ? String(v)
      : v instanceof Date ? JSON.stringify(v.toISOString().slice(0, 10))
      : JSON.stringify(String(v));

  console.log(`expectedColumns: [${cols.map((c) => JSON.stringify(c)).join(", ")}],`);
  console.log("expectedResult: [");
  for (const r of rows) console.log(`  [${r.map(fmt).join(", ")}],`);
  console.log("],");
  console.log(`// ${rows.length} satır · ${cols.length} kolon`);
} finally {
  await db.close();
}
