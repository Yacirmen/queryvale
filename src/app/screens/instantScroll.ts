export function withInstantRootScroll(action: () => void): void {
  const rootStyle = document.documentElement.style;
  const previousValue = rootStyle.getPropertyValue("scroll-behavior");
  const previousPriority = rootStyle.getPropertyPriority("scroll-behavior");
  rootStyle.setProperty("scroll-behavior", "auto");

  try {
    action();
  } finally {
    if (previousValue) {
      rootStyle.setProperty("scroll-behavior", previousValue, previousPriority);
    } else {
      rootStyle.removeProperty("scroll-behavior");
    }
  }
}
