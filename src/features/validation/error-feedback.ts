import { SqlSecurityError } from "../sql-engine/security";

export interface SqlErrorFeedback {
  title: string;
  message: string;
  suggestion: string;
  technicalMessage: string;
  code?: string;
}

interface ErrorLike {
  message?: unknown;
  code?: unknown;
  position?: unknown;
}

function errorDetails(error: unknown): {
  message: string;
  code?: string;
  position?: string;
} {
  if (error instanceof Error) {
    const errorLike = error as Error & ErrorLike;
    return {
      message: error.message,
      code: typeof errorLike.code === "string" ? errorLike.code : undefined,
      position:
        typeof errorLike.position === "string"
          ? errorLike.position
          : undefined,
    };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  if (error && typeof error === "object") {
    const errorLike = error as ErrorLike;
    return {
      message:
        typeof errorLike.message === "string"
          ? errorLike.message
          : "Bilinmeyen SQL hatası",
      code: typeof errorLike.code === "string" ? errorLike.code : undefined,
      position:
        typeof errorLike.position === "string"
          ? errorLike.position
          : undefined,
    };
  }
  return { message: "Bilinmeyen SQL hatası" };
}

function quotedIdentifier(message: string): string | undefined {
  return (
    message.match(/(?:column|relation|table)\s+["']([^"']+)["']/i)?.[1] ??
    message.match(/["']([^"']+)["']/)?.[1]
  );
}

export function translateSqlError(error: unknown): SqlErrorFeedback {
  const details = errorDetails(error);
  const lower = details.message.toLocaleLowerCase("en-US");
  const identifier = quotedIdentifier(details.message);
  const location = details.position ? ` (konum ${details.position})` : "";

  if (error instanceof SqlSecurityError) {
    return {
      title: "Bu sorguya izin verilmiyor",
      message: error.violations[0]?.message ?? error.message,
      suggestion:
        "Görev verilerini yalnızca bu görevin izin verdiği SQL işlemleriyle kullan.",
      technicalMessage: details.message,
      code: details.code,
    };
  }

  if (details.code === "42703" || lower.includes("column") && lower.includes("does not exist")) {
    return {
      title: "Kolon bulunamadı",
      message: identifier
        ? `"${identifier}" adında bir kolon bulunmuyor.`
        : "Sorguda kullandığın kolonlardan biri bulunmuyor.",
      suggestion:
        "Şema panelindeki kolon adlarını ve varsa tablo alias’ını kontrol et.",
      technicalMessage: `${details.message}${location}`,
      code: details.code,
    };
  }

  if (details.code === "42P01" || lower.includes("relation") && lower.includes("does not exist")) {
    return {
      title: "Tablo bulunamadı",
      message: identifier
        ? `"${identifier}" adında bir tablo bu görevde yok.`
        : "Sorguda kullandığın tablolardan biri bu görevde yok.",
      suggestion: "Şema panelindeki tablo adlarını kontrol et.",
      technicalMessage: `${details.message}${location}`,
      code: details.code,
    };
  }

  if (
    details.code === "42601" ||
    lower.includes("syntax error") ||
    lower.includes("unterminated")
  ) {
    return {
      title: "SQL sözdizimini kontrol et",
      message: `PostgreSQL sorguyu bu noktada anlayamadı${location}.`,
      suggestion:
        "Virgülleri, parantezleri, tırnakları ve SQL bölümlerinin sırasını kontrol et.",
      technicalMessage: details.message,
      code: details.code,
    };
  }

  if (details.code === "42702" || lower.includes("ambiguous")) {
    return {
      title: "Kolon adı belirsiz",
      message: identifier
        ? `"${identifier}" birden fazla tabloda bulunduğu için hangi kolonun seçileceği belirsiz.`
        : "Bir kolon adı birden fazla tabloda bulunuyor.",
      suggestion:
        "Kolonun başına tablo adını veya alias’ını ekle: örneğin orders.id.",
      technicalMessage: details.message,
      code: details.code,
    };
  }

  if (
    details.code === "42803" ||
    lower.includes("must appear in the group by")
  ) {
    return {
      title: "Gruplama eksik",
      message:
        "SELECT listesindeki aggregate olmayan bir kolon GROUP BY içinde yer almıyor.",
      suggestion:
        "Kolonu GROUP BY listesine ekle veya uygun bir aggregate fonksiyonuyla kullan.",
      technicalMessage: details.message,
      code: details.code,
    };
  }

  if (details.code === "22012" || lower.includes("division by zero")) {
    return {
      title: "Sıfıra bölme hatası",
      message: "Hesaplamadaki payda bazı satırlarda sıfır.",
      suggestion:
        "NULLIF(payda, 0) kullanmayı veya sıfır değerleri WHERE ile ayırmayı düşün.",
      technicalMessage: details.message,
      code: details.code,
    };
  }

  if (
    details.code === "57014" ||
    lower.includes("statement timeout") ||
    lower.includes("sınırını aştığı")
  ) {
    return {
      title: "Sorgu zaman sınırını aştı",
      message: "Sorgu güvenli çalışma süresi içinde tamamlanamadı.",
      suggestion:
        "JOIN koşullarını, filtreleri ve gereksiz çapraz birleşimleri kontrol et.",
      technicalMessage: details.message,
      code: details.code,
    };
  }

  if (
    details.code === "42883" ||
    lower.includes("operator does not exist") ||
    lower.includes("function") && lower.includes("does not exist")
  ) {
    return {
      title: "Veri tipleri uyuşmuyor",
      message:
        "Kullandığın operatör veya fonksiyon bu veri tipi birleşimini desteklemiyor.",
      suggestion:
        "Şemadaki veri tiplerini kontrol et; gerekirse CAST ile açık dönüşüm yap.",
      technicalMessage: details.message,
      code: details.code,
    };
  }

  return {
    title: "Sorgu çalıştırılamadı",
    message: "PostgreSQL sorguyu tamamlayamadı.",
    suggestion:
      "Teknik ayrıntıyı ve şema panelini birlikte inceleyerek sorgunun ilgili bölümünü düzelt.",
    technicalMessage: `${details.message}${location}`,
    code: details.code,
  };
}

