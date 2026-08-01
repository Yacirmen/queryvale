const ALWAYS_FORBIDDEN_PATTERNS: ReadonlyArray<{
  code: SecurityViolationCode;
  pattern: RegExp;
  message: string;
}> = [
  {
    code: "database-operation",
    pattern: /\b(?:create|alter|drop)\s+database\b/i,
    message: "Veritabanı düzeyindeki işlemler vaka ortamında kullanılamaz.",
  },
  {
    code: "system-operation",
    pattern: /\balter\s+system\b/i,
    message:
      "Sistem ayarlarını değiştiren sorgular vaka ortamında kullanılamaz.",
  },
  {
    code: "system-operation",
    pattern: /\b(?:create\s+extension|load|vacuum|cluster|reindex)\b/i,
    message: "Bu bakım veya eklenti işlemi vaka ortamında desteklenmiyor.",
  },
  {
    code: "external-access",
    pattern: /\bcopy\b/i,
    message: "COPY ile dosya veya akış erişimi vaka ortamında kapalıdır.",
  },
  {
    code: "privilege-operation",
    pattern: /\b(?:grant|revoke)\b/i,
    message: "Yetki değiştiren sorgular vaka ortamında kullanılamaz.",
  },
  {
    code: "system-catalog",
    pattern: /\b(?:pg_catalog|information_schema)\s*\./i,
    message: "Sistem kataloglarına erişim vaka ortamında kapalıdır.",
  },
  {
    code: "system-catalog",
    pattern:
      /\b(?:from|join|update|into|table|truncate)\s+(?:only\s+)?pg_[a-z0-9_]*\b/i,
    message: "PostgreSQL sistem tablolarına erişim vaka ortamında kapalıdır.",
  },
  {
    code: "system-operation",
    pattern:
      /\b(?:pg_read_file|pg_read_binary_file|pg_ls_dir|pg_reload_conf|pg_terminate_backend|lo_import|lo_export)\s*\(/i,
    message: "Sistem işlevlerine erişim vaka ortamında kapalıdır.",
  },
];

export type SecurityViolationCode =
  | "empty-query"
  | "multiple-statements"
  | "database-operation"
  | "system-operation"
  | "external-access"
  | "privilege-operation"
  | "system-catalog"
  | "forbidden-operation";

export interface SecurityViolation {
  code: SecurityViolationCode;
  message: string;
  operation?: string;
}

export interface QuerySecurityResult {
  allowed: boolean;
  violations: SecurityViolation[];
}

/**
 * Removes comments, literals and quoted identifiers while preserving token
 * boundaries. The result is intended for conservative keyword inspection, not
 * for executing or rewriting SQL.
 */
export function maskSqlLiteralsAndComments(sql: string): string {
  let output = "";
  let index = 0;
  let blockDepth = 0;
  let state:
    | "normal"
    | "single-quote"
    | "double-quote"
    | "line-comment"
    | "block-comment"
    | "dollar-quote" = "normal";
  let dollarDelimiter = "";

  const mask = (character: string) => (character === "\n" ? "\n" : " ");

  while (index < sql.length) {
    const character = sql[index];
    const next = sql[index + 1];

    if (state === "normal") {
      if (character === "'") {
        state = "single-quote";
        output += " ";
        index += 1;
        continue;
      }
      if (character === '"') {
        state = "double-quote";
        output += " ";
        index += 1;
        continue;
      }
      if (character === "-" && next === "-") {
        state = "line-comment";
        output += "  ";
        index += 2;
        continue;
      }
      if (character === "/" && next === "*") {
        state = "block-comment";
        blockDepth = 1;
        output += "  ";
        index += 2;
        continue;
      }
      if (character === "$") {
        const match = sql
          .slice(index)
          .match(/^\$[a-zA-Z_][a-zA-Z0-9_]*\$|^\$\$/);
        if (match) {
          state = "dollar-quote";
          dollarDelimiter = match[0];
          output += " ".repeat(dollarDelimiter.length);
          index += dollarDelimiter.length;
          continue;
        }
      }

      output += character;
      index += 1;
      continue;
    }

    if (state === "single-quote") {
      if (character === "'" && next === "'") {
        output += "  ";
        index += 2;
      } else if (character === "'") {
        state = "normal";
        output += " ";
        index += 1;
      } else {
        output += mask(character);
        index += 1;
      }
      continue;
    }

    if (state === "double-quote") {
      if (character === '"' && next === '"') {
        output += "  ";
        index += 2;
      } else if (character === '"') {
        state = "normal";
        output += " ";
        index += 1;
      } else {
        output += mask(character);
        index += 1;
      }
      continue;
    }

    if (state === "line-comment") {
      output += mask(character);
      index += 1;
      if (character === "\n") {
        state = "normal";
      }
      continue;
    }

    if (state === "block-comment") {
      if (character === "/" && next === "*") {
        blockDepth += 1;
        output += "  ";
        index += 2;
      } else if (character === "*" && next === "/") {
        blockDepth -= 1;
        output += "  ";
        index += 2;
        if (blockDepth === 0) {
          state = "normal";
        }
      } else {
        output += mask(character);
        index += 1;
      }
      continue;
    }

    if (state === "dollar-quote" && sql.startsWith(dollarDelimiter, index)) {
      output += " ".repeat(dollarDelimiter.length);
      index += dollarDelimiter.length;
      state = "normal";
    } else {
      output += mask(character);
      index += 1;
    }
  }

  return output;
}

function containsMultipleStatements(maskedSql: string): boolean {
  const withoutFinalTerminator = maskedSql.trim().replace(/;\s*$/, "");
  return withoutFinalTerminator.includes(";");
}

function operationPattern(operation: string): RegExp | null {
  const tokens = operation
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (tokens.length === 0) {
    return null;
  }

  return new RegExp(`\\b${tokens.join("\\s+")}\\b`, "i");
}

export function validateQuerySecurity(
  sql: string,
  forbiddenOperations: readonly string[] = [],
): QuerySecurityResult {
  const maskedSql = maskSqlLiteralsAndComments(sql);
  const violations: SecurityViolation[] = [];

  if (maskedSql.trim().replace(/;+$/, "").trim().length === 0) {
    violations.push({
      code: "empty-query",
      message: "Çalıştırmak için bir SQL sorgusu yazmalısın.",
    });
  }

  if (containsMultipleStatements(maskedSql)) {
    violations.push({
      code: "multiple-statements",
      message: "Aynı anda yalnızca bir SQL ifadesi çalıştırabilirsin.",
    });
  }

  for (const rule of ALWAYS_FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(maskedSql)) {
      violations.push({ code: rule.code, message: rule.message });
    }
  }

  for (const operation of forbiddenOperations) {
    const pattern = operationPattern(operation);
    if (pattern?.test(maskedSql)) {
      violations.push({
        code: "forbidden-operation",
        operation,
        message: `${operation.toUpperCase()} işlemi bu vakada kullanılamaz.`,
      });
    }
  }

  const uniqueViolations = violations.filter(
    (violation, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.code === violation.code &&
          candidate.operation === violation.operation,
      ) === index,
  );

  return {
    allowed: uniqueViolations.length === 0,
    violations: uniqueViolations,
  };
}

export class SqlSecurityError extends Error {
  readonly violations: SecurityViolation[];

  constructor(violations: SecurityViolation[]) {
    super(
      violations[0]?.message ??
        "Sorgu güvenlik politikası tarafından engellendi.",
    );
    this.name = "SqlSecurityError";
    this.violations = violations;
  }
}

export function assertQueryAllowed(
  sql: string,
  forbiddenOperations: readonly string[] = [],
): void {
  const result = validateQuerySecurity(sql, forbiddenOperations);
  if (!result.allowed) {
    throw new SqlSecurityError(result.violations);
  }
}
