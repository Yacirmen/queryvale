import { maskSqlLiteralsAndComments } from "../sql-engine/security";

export type SqlConcept =
  | "SELECT"
  | "DISTINCT"
  | "WHERE"
  | "COMPARISON"
  | "ORDER_BY"
  | "LIMIT"
  | "AND"
  | "OR"
  | "NOT"
  | "IN"
  | "BETWEEN"
  | "LIKE"
  | "IS_NULL"
  | "ALIAS"
  | "ARITHMETIC"
  | "STRING_FUNCTION"
  | "DATE_FUNCTION"
  | "CASE"
  | "CAST"
  | "COALESCE"
  | "COUNT"
  | "SUM"
  | "AVG"
  | "MIN"
  | "MAX"
  | "AGGREGATE"
  | "GROUP_BY"
  | "HAVING"
  | "JOIN"
  | "INNER_JOIN"
  | "LEFT_JOIN"
  | "MULTI_JOIN"
  | "SELF_JOIN"
  | "SUBQUERY"
  | "EXISTS"
  | "CTE"
  | "RECURSIVE_CTE"
  | "UNION"
  | "WINDOW"
  | "PARTITION_BY"
  | "RUNNING_TOTAL"
  | "MOVING_AVERAGE"
  | "ROW_NUMBER"
  | "RANK"
  | "DENSE_RANK"
  | "LAG"
  | "LEAD"
  | "INSERT"
  | "UPSERT"
  | "UPDATE"
  | "DELETE"
  | "CREATE_TABLE"
  | "STAR_SCHEMA"
  | "REPORTING";

const CONCEPT_ALIASES: Record<string, SqlConcept> = {
  SELECT: "SELECT",
  DISTINCT: "DISTINCT",
  WHERE: "WHERE",
  COMPARISON: "COMPARISON",
  ORDER: "ORDER_BY",
  ORDER_BY: "ORDER_BY",
  LIMIT: "LIMIT",
  AND: "AND",
  OR: "OR",
  NOT: "NOT",
  IN: "IN",
  BETWEEN: "BETWEEN",
  LIKE: "LIKE",
  NULL: "IS_NULL",
  IS_NULL: "IS_NULL",
  ALIAS: "ALIAS",
  AS: "ALIAS",
  ARITHMETIC: "ARITHMETIC",
  STRING_FUNCTION: "STRING_FUNCTION",
  DATE_FUNCTION: "DATE_FUNCTION",
  CASE: "CASE",
  CASE_WHEN: "CASE",
  CAST: "CAST",
  COALESCE: "COALESCE",
  COUNT: "COUNT",
  SUM: "SUM",
  AVG: "AVG",
  MIN: "MIN",
  MAX: "MAX",
  AGGREGATE: "AGGREGATE",
  AGGREGATION: "AGGREGATE",
  GROUP_BY: "GROUP_BY",
  HAVING: "HAVING",
  JOIN: "JOIN",
  INNER_JOIN: "INNER_JOIN",
  LEFT_JOIN: "LEFT_JOIN",
  MULTI_JOIN: "MULTI_JOIN",
  SELF_JOIN: "SELF_JOIN",
  SUBQUERY: "SUBQUERY",
  EXISTS: "EXISTS",
  CTE: "CTE",
  WITH: "CTE",
  RECURSIVE_CTE: "RECURSIVE_CTE",
  UNION: "UNION",
  WINDOW: "WINDOW",
  WINDOW_FUNCTION: "WINDOW",
  PARTITION_BY: "PARTITION_BY",
  RUNNING_TOTAL: "RUNNING_TOTAL",
  MOVING_AVERAGE: "MOVING_AVERAGE",
  ROW_NUMBER: "ROW_NUMBER",
  RANK: "RANK",
  DENSE_RANK: "DENSE_RANK",
  LAG: "LAG",
  LEAD: "LEAD",
  INSERT: "INSERT",
  UPSERT: "UPSERT",
  ON_CONFLICT: "UPSERT",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  CREATE_TABLE: "CREATE_TABLE",
  STAR_SCHEMA: "STAR_SCHEMA",
  REPORTING: "REPORTING",
};

function has(sql: string, pattern: RegExp): boolean {
  return pattern.test(sql);
}

/**
 * Lightweight SQL feature detection. Comments and literals are masked first,
 * preventing keywords in prose/data from satisfying a learning requirement.
 */
export function detectSqlConcepts(sql: string): ReadonlySet<SqlConcept> {
  const masked = maskSqlLiteralsAndComments(sql);
  const concepts = new Set<SqlConcept>();

  const add = (concept: SqlConcept, pattern: RegExp) => {
    if (has(masked, pattern)) {
      concepts.add(concept);
    }
  };

  add("SELECT", /\bselect\b/i);
  add("DISTINCT", /\bselect\s+distinct\b/i);
  add("WHERE", /\bwhere\b/i);
  add(
    "COMPARISON",
    /(?:<>|!=|>=|<=|(?<![<>=])=(?!=)|(?<![<>=])>(?!=)|(?<![<>=])<(?!=))/,
  );
  add("ORDER_BY", /\border\s+by\b/i);
  add("LIMIT", /\blimit\b/i);
  add("AND", /\band\b/i);
  add("OR", /\bor\b/i);
  add("NOT", /\bnot\b/i);
  add("IN", /\bin\s*\(/i);
  add("BETWEEN", /\bbetween\b/i);
  add("LIKE", /\b(?:i?like)\b/i);
  add("IS_NULL", /\bis\s+(?:not\s+)?null\b/i);
  add(
    "ARITHMETIC",
    /(?:[a-z_][a-z0-9_.]*|\d+(?:\.\d+)?|\))\s*[+*/%-]\s*(?:[a-z_(]|\d)/i,
  );
  add(
    "STRING_FUNCTION",
    /\b(?:upper|lower|trim|concat|substring|substr|replace|length|string_agg)\s*\(|\|\|/i,
  );
  add(
    "DATE_FUNCTION",
    /\b(?:to_char|date_trunc|extract|date_part|age|make_date)\s*\(|\bcurrent_date\b|\binterval\b/i,
  );
  add("CASE", /\bcase\b[\s\S]*\bwhen\b/i);
  add("CAST", /\bcast\s*\(|::\s*[a-z_]/i);
  add("COALESCE", /\bcoalesce\s*\(/i);
  add("COUNT", /\bcount\s*\(/i);
  add("SUM", /\bsum\s*\(/i);
  add("AVG", /\bavg\s*\(/i);
  add("MIN", /\bmin\s*\(/i);
  add("MAX", /\bmax\s*\(/i);
  add("AGGREGATE", /\b(?:count|sum|avg|min|max)\s*\(/i);
  add("GROUP_BY", /\bgroup\s+by\b/i);
  add("HAVING", /\bhaving\b/i);
  add("JOIN", /\bjoin\b/i);
  add("INNER_JOIN", /\binner\s+join\b/i);
  add("LEFT_JOIN", /\bleft(?:\s+outer)?\s+join\b/i);
  add("EXISTS", /\bexists\s*\(/i);
  add("CTE", /^\s*with\b/i);
  add("RECURSIVE_CTE", /^\s*with\s+recursive\b/i);
  add("UNION", /\bunion(?:\s+all)?\b/i);
  add("PARTITION_BY", /\bpartition\s+by\b/i);
  add("ROW_NUMBER", /\brow_number\s*\(/i);
  add("RANK", /\brank\s*\(/i);
  add("DENSE_RANK", /\bdense_rank\s*\(/i);
  add("LAG", /\blag\s*\(/i);
  add("LEAD", /\blead\s*\(/i);
  add("INSERT", /\binsert\s+into\b/i);
  add(
    "UPSERT",
    /\binsert\s+into\b[\s\S]*\bon\s+conflict\b[\s\S]*\bdo\s+update\b/i,
  );
  add("UPDATE", /\bupdate\b/i);
  add("DELETE", /\bdelete\s+from\b/i);
  add("CREATE_TABLE", /\bcreate\s+(?:temporary\s+|temp\s+)?table\b/i);

  const joinCount = masked.match(/\bjoin\b/gi)?.length ?? 0;
  if (joinCount >= 2) concepts.add("MULTI_JOIN");

  if (
    /\b(?:from|join)\s+fact_[a-z0-9_]+\b/i.test(masked) &&
    /\bjoin\s+dim_[a-z0-9_]+\b/i.test(masked)
  ) {
    concepts.add("STAR_SCHEMA");
  }

  if (
    joinCount >= 2 &&
    concepts.has("AGGREGATE") &&
    concepts.has("GROUP_BY") &&
    concepts.has("CASE")
  ) {
    concepts.add("REPORTING");
  }

  const firstSelectList = masked.match(
    /\bselect\b([\s\S]*?)(?:\bfrom\b|$)/i,
  )?.[1];
  if (firstSelectList && /\bas\s+[a-z_][a-z0-9_]*\b/i.test(firstSelectList)) {
    concepts.add("ALIAS");
  }

  if (
    has(masked, /\bover\s*(?:\([^)]*\)|[a-z_][a-z0-9_]*)/i) ||
    concepts.has("ROW_NUMBER") ||
    concepts.has("RANK") ||
    concepts.has("DENSE_RANK") ||
    concepts.has("LAG") ||
    concepts.has("LEAD")
  ) {
    concepts.add("WINDOW");
  }

  if (/\bsum\s*\([^)]*\)\s*over\s*\([^)]*\border\s+by\b[^)]*\)/i.test(masked)) {
    concepts.add("RUNNING_TOTAL");
  }

  if (
    /\bavg\s*\([^)]*\)\s*over\s*\([^)]*\border\s+by\b[^)]*\b(?:rows|range)\b/i.test(
      masked,
    )
  ) {
    concepts.add("MOVING_AVERAGE");
  }

  const selectMatches = masked.match(/\bselect\b/gi);
  if (
    (selectMatches?.length ?? 0) > 1 &&
    (has(masked, /\(\s*select\b/i) || concepts.has("CTE"))
  ) {
    concepts.add("SUBQUERY");
  }

  // A self join is conservatively inferred when a JOIN target also appears as
  // a FROM target. This is intentionally basic and does not replace a parser.
  const fromTable = masked.match(/\bfrom\s+([a-z_][a-z0-9_.]*)\b/i)?.[1];
  if (
    fromTable &&
    new RegExp(`\\bjoin\\s+${escapeRegExp(fromTable)}\\b`, "i").test(masked)
  ) {
    concepts.add("SELF_JOIN");
  }

  return concepts;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeConceptName(concept: string): SqlConcept | undefined {
  const normalized = concept
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return CONCEPT_ALIASES[normalized];
}

export interface RequiredConceptCheck {
  satisfied: boolean;
  detected: SqlConcept[];
  missing: string[];
}

export function checkRequiredConcepts(
  sql: string,
  requiredConcepts: readonly string[] = [],
): RequiredConceptCheck {
  const detected = detectSqlConcepts(sql);
  const missing = requiredConcepts.filter((required) => {
    const concept = normalizeConceptName(required);
    return !concept || !detected.has(concept);
  });

  return {
    satisfied: missing.length === 0,
    detected: [...detected],
    missing,
  };
}
