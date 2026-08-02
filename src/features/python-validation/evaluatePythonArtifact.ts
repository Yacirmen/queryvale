import type { PythonLessonTask, PythonScalar } from "../../types/pythonLesson";
import type {
  PythonExecutionResult,
  PythonTableArtifact,
} from "../python-engine";

export type PythonEvaluationStatus =
  | "execution-error"
  | "artifact-wrong"
  | "columns-wrong"
  | "dtypes-wrong"
  | "rows-wrong"
  | "order-wrong"
  | "correct";

export interface PythonEvaluation {
  status: PythonEvaluationStatus;
  title: string;
  message: string;
  expected?: string;
  actual?: string;
}

function sameScalar(
  actual: PythonScalar,
  expected: PythonScalar,
  tolerance: number,
): boolean {
  if (actual === expected) return true;
  if (typeof actual === "number" && typeof expected === "number") {
    return Number.isFinite(actual) && Number.isFinite(expected)
      ? Math.abs(actual - expected) <= tolerance
      : false;
  }
  return false;
}

function sameRow(
  actual: readonly PythonScalar[],
  expected: readonly PythonScalar[],
  tolerance: number,
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value, index) =>
      sameScalar(value, expected[index] ?? null, tolerance),
    )
  );
}

function sameOrderedRows(
  actual: readonly (readonly PythonScalar[])[],
  expected: readonly (readonly PythonScalar[])[],
  tolerance: number,
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((row, index) => sameRow(row, expected[index] ?? [], tolerance))
  );
}

function sameUnorderedRows(
  actual: readonly (readonly PythonScalar[])[],
  expected: readonly (readonly PythonScalar[])[],
  tolerance: number,
): boolean {
  if (actual.length !== expected.length) return false;
  // A greedy first match can reject a valid result when numeric tolerance
  // makes one expected row compatible with multiple actual rows. An augmenting
  // path keeps duplicate rows and those overlapping tolerance windows correct.
  const expectedByActual = Array<number>(actual.length).fill(-1);
  const assignExpected = (
    expectedIndex: number,
    visitedActual: Set<number>,
  ): boolean => {
    for (let actualIndex = 0; actualIndex < actual.length; actualIndex += 1) {
      if (
        visitedActual.has(actualIndex) ||
        !sameRow(actual[actualIndex], expected[expectedIndex], tolerance)
      ) {
        continue;
      }
      visitedActual.add(actualIndex);
      const previousExpected = expectedByActual[actualIndex];
      if (
        previousExpected < 0 ||
        assignExpected(previousExpected, visitedActual)
      ) {
        expectedByActual[actualIndex] = expectedIndex;
        return true;
      }
    }
    return false;
  };

  return expected.every((_row, expectedIndex) =>
    assignExpected(expectedIndex, new Set()),
  );
}

function dtypeFamily(dtype: string): string {
  const normalized = dtype.toLocaleLowerCase("en-US");
  if (normalized.includes("datetime")) return "datetime";
  if (normalized.includes("timedelta")) return "timedelta";
  if (normalized.includes("bool")) return "boolean";
  if (normalized.includes("int")) return "integer";
  if (normalized.includes("float") || normalized.includes("double"))
    return "float";
  if (normalized.includes("string") || normalized.includes("object"))
    return "text";
  return normalized;
}

function evaluateTable(
  task: PythonLessonTask,
  artifact: PythonTableArtifact,
): PythonEvaluation {
  if (
    artifact.columns.length !== task.expectedColumns.length ||
    artifact.columns.some(
      (column, index) => column !== task.expectedColumns[index],
    )
  ) {
    return {
      status: "columns-wrong",
      title: "Kolonları yeniden kontrol et",
      message:
        "Kod çalıştı; ancak result tablosunun kolon adları veya sırası teslim sözleşmesiyle eşleşmiyor.",
      expected: task.expectedColumns.join(" · "),
      actual: artifact.columns.join(" · ") || "Kolon yok",
    };
  }

  const expectedDtypeEntries = Object.entries(task.expectedDtypes ?? {});
  if (
    expectedDtypeEntries.some(([column, dtype]) => {
      const index = artifact.columns.indexOf(column);
      return (
        !dtype ||
        index < 0 ||
        dtypeFamily(dtype) !== dtypeFamily(artifact.dtypes[index] ?? "")
      );
    })
  ) {
    return {
      status: "dtypes-wrong",
      title: "Veri tipleri henüz güvenilir değil",
      message:
        "Değerler oluştu; fakat en az bir kolonun veri tipi beklenen analiz tipine dönüşmedi.",
      expected: expectedDtypeEntries
        .map(
          ([column, dtype]) =>
            `${column}: ${dtype ? dtypeFamily(dtype) : "belirsiz"}`,
        )
        .join(" · "),
      actual: artifact.columns
        .map(
          (column, index) =>
            `${column}: ${dtypeFamily(artifact.dtypes[index] ?? "")}`,
        )
        .join(" · "),
    };
  }

  const orderedMatch = sameOrderedRows(
    artifact.rows,
    task.expectedRows,
    task.numericTolerance,
  );
  if (orderedMatch) {
    return {
      status: "correct",
      title: "Analiz çıktısı doğrulandı",
      message: task.completionMessage,
    };
  }

  const unorderedMatch = sameUnorderedRows(
    artifact.rows,
    task.expectedRows,
    task.numericTolerance,
  );
  if (unorderedMatch && task.orderSensitive) {
    return {
      status: "order-wrong",
      title: "Değerler doğru, sıralama farklı",
      message:
        "Tablodaki kayıtlar doğru; karar ekranının beklediği sıralamayı açıkça uygula.",
    };
  }
  if (unorderedMatch) {
    return {
      status: "correct",
      title: "Analiz çıktısı doğrulandı",
      message: task.completionMessage,
    };
  }

  return {
    status: "rows-wrong",
    title: "Kod çalıştı; sonuç henüz hedef değil",
    message: `result ${artifact.rowCount} satır üretti. Filtre, toplulaştırma ve eksik değer kararlarını kabul kontrolleriyle karşılaştır.`,
    expected: `${task.expectedRows.length} satır`,
    actual: `${artifact.rowCount} satır`,
  };
}

export function evaluatePythonArtifact(
  task: PythonLessonTask,
  execution: PythonExecutionResult,
): PythonEvaluation {
  if (execution.kind === "execution-error") {
    return {
      status: "execution-error",
      title: "Python kodu tamamlanamadı",
      message: execution.message,
    };
  }
  if (execution.artifact.kind !== "table") {
    return {
      status: "artifact-wrong",
      title: "result bir tablo olmalı",
      message:
        "Bu vaka result değişkeninde bir pandas DataFrame bekliyor. Hesabı DataFrame olarak teslim et.",
      expected: "pandas.DataFrame",
      actual: "Tek değer",
    };
  }
  return evaluateTable(task, execution.artifact);
}
