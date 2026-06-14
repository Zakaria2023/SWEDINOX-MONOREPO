import type { TextUsageCategory } from "@/lib/enums";

export const formatTextUsageCategoryLabel = (value: TextUsageCategory) =>
  value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
