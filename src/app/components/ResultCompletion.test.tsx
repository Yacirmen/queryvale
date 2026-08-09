import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tasks } from "../../content";
import { TASK_LEARNING_CONTENT } from "../../content/taskLearningContent";
import { ResultCompletion } from "./ResultCompletion";

const baseTask = tasks[0];
const task = { ...baseTask, ...TASK_LEARNING_CONTENT[baseTask.id] };

describe("ResultCompletion", () => {
  it("keeps the debrief collapsed until the learner asks for it", async () => {
    const user = userEvent.setup();

    render(
      <ResultCompletion
        task={task}
        attempts={2}
        rowCount={6}
        scoreAwarded={7}
        onSaveNote={vi.fn()}
      />,
    );

    const panel = screen.getByRole("region", {
      name: task.completionMessage,
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      within(panel).getByText("Vaka doğrulandı · 6 satır · 2 deneme"),
    ).toBeVisible();
    expect(within(panel).getByText("2 kolon doğru")).toBeVisible();
    expect(within(panel).getByText("6 satır doğru")).toBeVisible();
    expect(within(panel).getByText("İş kuralı karşılandı")).toBeVisible();
    expect(within(panel).getByText("+7 analiz puanı")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Bu vakadan 7 analiz puanı kazandın",
    );
    expect(
      within(panel).getByText(/10 başlangıç − 1 ipucu × 3 = 7/i),
    ).toBeVisible();
    expect(within(panel).getByText("Kanıt hazırlanıyor")).toBeVisible();
    expect(
      within(panel).getByText(/yorumun otomatik puanlanmaz/i),
    ).not.toBeVisible();
    expect(within(panel).getByText(task.debrief.steps[0])).not.toBeVisible();

    await user.click(within(panel).getByText("Çözümü incele"));

    expect(within(panel).getByText("Bu vakanın temel mantığı")).toBeVisible();
    expect(within(panel).getByText(task.debrief.steps[0])).toBeVisible();
    expect(
      within(panel).getByText(task.debrief.transfer.reveal),
    ).not.toBeVisible();

    await user.click(within(panel).getByText("Aktarım sorusu"));
    await user.click(within(panel).getByText("Yaklaşımı karşılaştır"));
    expect(within(panel).getByText(task.debrief.transfer.reveal)).toBeVisible();
  });

  it("announces full-solution completion without framing zero as earned points", () => {
    render(
      <ResultCompletion
        task={task}
        attempts={1}
        rowCount={6}
        scoreAwarded={0}
        onSaveNote={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Tam çözüm kullanıldığı için bu vakadan analiz puanı kazanılmadı",
    );
    expect(screen.getByText("0 analiz puanı")).toBeVisible();
  });

  it("leaves progression ownership to the persistent Studio rail", () => {
    render(
      <ResultCompletion
        task={task}
        attempts={1}
        rowCount={6}
        scoreAwarded={10}
        onSaveNote={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /sonraki vaka/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/aşağıdaki vaka gezintisinden/i)).toBeVisible();
  });

  it("turns a verified result into an optional analyst decision note", async () => {
    const user = userEvent.setup();
    const onSaveNote = vi.fn();

    render(
      <ResultCompletion
        task={task}
        attempts={1}
        rowCount={6}
        scoreAwarded={10}
        evidence={{
          verifiedRun: {
            columns: ["product_name", "category"],
            rowCount: 6,
            verifiedAt: "2026-07-31T08:00:00.000Z",
          },
        }}
        onSaveNote={onSaveNote}
      />,
    );

    expect(screen.getByText(/yorumun otomatik puanlanmaz/i)).not.toBeVisible();
    expect(screen.getByText("Kanıt doğrulandı")).toBeVisible();
    await user.click(screen.getByText("Karar notu ekle"));
    expect(screen.getByText(/yorumun otomatik puanlanmaz/i)).toBeVisible();
    await user.type(
      screen.getByRole("textbox", { name: /^Bulgu/i }),
      "Katalogda dört farklı kategori var.",
    );
    await user.type(
      screen.getByRole("textbox", { name: /^Öneri/i }),
      "Filtre seçeneklerini bu kategorilerle sınırla.",
    );
    await user.click(screen.getByRole("button", { name: "Kanıta ekle" }));

    expect(onSaveNote).toHaveBeenCalledWith({
      finding: "Katalogda dört farklı kategori var.",
      recommendation: "Filtre seçeneklerini bu kategorilerle sınırla.",
      caveat: undefined,
    });
    expect(
      screen.getByText("Karar notu Kanıt Defteri’ne kaydedildi."),
    ).toBeVisible();
  });
});
