"use client";

import { Select } from "@/components/shadcn/select";

type Props = {
  adaptFromOptions: { value: string; label: string }[];
  adaptFromValue: string;
  handleAdaptFrom: (value: string) => void;
};

export const AdaptFromSection = ({
  adaptFromOptions,
  adaptFromValue,
  handleAdaptFrom,
}: Props) => {
  if (adaptFromOptions.length <= 1) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Adapt From
      </h2>
      <div className="max-w-sm">
        <Select
          id="adaptFrom"
          name="adaptFrom"
          options={adaptFromOptions}
          value={adaptFromValue}
          onValueChange={(value) => handleAdaptFrom(value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Select an existing warehouse to inherit its settings. You can adjust
        any field before saving.
      </p>
    </section>
  );
};
