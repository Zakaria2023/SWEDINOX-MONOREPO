"use client";

import { CompanyTextInput } from "@/app/(dashboard)/companies/actions";
import { USAGE_CATEGORY_FIELDS } from "@/app/(dashboard)/companies/validation";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { TEXT_USAGE_CATEGORY_LABELS } from "@/lib/labels";
import { AlignLeft, Plus, X } from "lucide-react";

type Props = {
  texts: CompanyTextInput[];
  removeText: (index: number) => void;
  handleOpenText: () => void;
  isPending: boolean;
  textCategories: TextCategoryOption[];
};

export const TextsSection = ({
  texts,
  removeText,
  handleOpenText,
  isPending,
  textCategories,
}: Props) => (
  <section className="space-y-4">
    <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
      Texts
    </h2>
    <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
      {texts.map((text, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <AlignLeft className="size-4 shrink-0 text-muted-foreground" />
            <span className="font-medium text-foreground truncate">
              {text.title}
            </span>
            {(() => {
              const cat = textCategories.find(
                (c) => c.uuid === text.textCategoryUuid,
              );
              return cat ? (
                <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                  {cat.name}
                </span>
              ) : null;
            })()}
            {USAGE_CATEGORY_FIELDS.filter(
              ({ field }) => text[field as keyof typeof text],
            )
              .slice(0, 3)
              .map(({ key }) => (
                <span
                  key={key}
                  className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                >
                  {TEXT_USAGE_CATEGORY_LABELS[key]}
                </span>
              ))}
          </div>
          <button
            type="button"
            onClick={() => removeText(index)}
            className="shrink-0 text-muted-foreground hover:text-destructive"
            disabled={isPending}
          >
            <X className="size-4" />
            <span className="sr-only">Remove text</span>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleOpenText}
        className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        disabled={isPending}
      >
        <Plus className="size-4" />
        Add Text
      </button>
    </div>
  </section>
);
