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
        nextTaskTitle="Kategori listesini tekilleştir"
        onSaveNote={vi.fn()}
        onNext={vi.fn()}
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

  it("advances only after the explicit next action", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();

    render(
      <ResultCompletion
        task={task}
        attempts={1}
        rowCount={6}
        nextTaskTitle="Kategori listesini tekilleştir"
        onSaveNote={vi.fn()}
        onNext={onNext}
      />,
    );

    expect(onNext).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", {
        name: "Sonraki vakaya geç: Kategori listesini tekilleştir",
      }),
    );
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("turns a verified result into an optional analyst decision note", async () => {
    const user = userEvent.setup();
    const onSaveNote = vi.fn();

    render(
      <ResultCompletion
        task={task}
        attempts={1}
        rowCount={6}
        evidence={{
          verifiedRun: {
            columns: ["product_name", "category"],
            rowCount: 6,
            verifiedAt: "2026-07-31T08:00:00.000Z",
          },
        }}
        onSaveNote={onSaveNote}
        onNext={vi.fn()}
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
