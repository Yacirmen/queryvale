import { describe, expect, it, vi } from "vitest";
import { withInstantRootScroll } from "./instantScroll";

describe("withInstantRootScroll", () => {
  it("forces an instant CSSOM scroll only for the action", () => {
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty("scroll-behavior", "smooth", "important");
    const action = vi.fn(() => {
      expect(rootStyle.getPropertyValue("scroll-behavior")).toBe("auto");
    });

    withInstantRootScroll(action);

    expect(action).toHaveBeenCalledOnce();
    expect(rootStyle.getPropertyValue("scroll-behavior")).toBe("smooth");
    expect(rootStyle.getPropertyPriority("scroll-behavior")).toBe("important");
    rootStyle.removeProperty("scroll-behavior");
  });

  it("restores the root style when the action throws", () => {
    const rootStyle = document.documentElement.style;
    rootStyle.removeProperty("scroll-behavior");

    expect(() =>
      withInstantRootScroll(() => {
        throw new Error("scroll failed");
      }),
    ).toThrow("scroll failed");
    expect(rootStyle.getPropertyValue("scroll-behavior")).toBe("");
  });
});
