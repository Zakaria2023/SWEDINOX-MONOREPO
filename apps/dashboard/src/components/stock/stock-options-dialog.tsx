"use client";

import {
  saveLotOptions,
  StockLotDialogData,
} from "@/app/(dashboard)/stock/actions";
import {
  StockOptionFormValues,
  stockOptionSchema,
} from "@/app/(dashboard)/stock/validation";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Select } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { StockOption, StockOptionStatus, stockOptions } from "@/lib/enums";
import { cn, generateUuid } from "@/lib/helpers";
import {
  STOCK_OPTION_LABELS,
  STOCK_OPTION_STATUS_LABELS,
} from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  data: StockLotDialogData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** A `Toevoegen` not yet saved — held in the dialog until `Opslaan`. */
type StagedOption = {
  key: string;
  option: StockOption;
  specification: string;
};

/** One row of the grid: a saved option still standing, or a staged one. */
type OptionGridRow = {
  key: string;
  option: StockOption;
  specification: string | null;
  status: StockOptionStatus;
  staged: boolean;
};

/**
 * `Opties bewerken` — the reference's `Voorraad opties`.
 *
 * 🔴 **The biggest model change the 5-10-2026 capture forced.** We held a lot's
 * options as a single column of text. The reference holds them as a grid of
 * `Optie · Specificatie · Status` with a `Toevoegen` block below it — so an
 * option carries a specification and a status of its own, and a `varchar` could
 * carry neither.
 *
 * 🔑 **There are nineteen options, not six.** `J5` recorded six off the
 * *product's* panel and flagged a missing seventh. The lot's dropdown held
 * fourteen, the two lists barely overlap, and **both were still scrolling** —
 * so the enum is a floor, not a ceiling.
 *
 * 🔑🔑 **`2.1 Certificate` is one of them.** The certificate is an option on a
 * lot — a thing you ask for — not a field on a batch and not a document. That
 * is why every certificate column on the batch screens is empty, and it closes
 * a contradiction that was going to be chased across 2.910 batch rows.
 */
export const StockOptionsDialog = ({ data, open, onOpenChange }: Props) => {
  const { lot, options, optionSpecifications } = data;
  const [saveState, save, isSaving] = useActionState(saveLotOptions, {});
  // 🔑 Nothing is written until `Opslaan` (249-251): adds and removals are
  // staged here, and `Annuleren` drops them.
  const [additions, setAdditions] = useState<StagedOption[]>([]);
  const [removals, setRemovals] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const {
    control,
    reset,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<StockOptionFormValues>({
    resolver: zodResolver(stockOptionSchema),
    // `Optie` opens blank in the reference, `Toevoegen` greyed until one is
    // chosen.
    defaultValues: {
      option: undefined,
      specification: "",
    },
  });

  const chosenOption = watch("option");

  const discard = () => {
    setAdditions([]);
    setRemovals([]);
    setSelectedKey(null);
    reset();
  };

  useEffect(() => {
    if (saveState.success) {
      setAdditions([]);
      setRemovals([]);
      setSelectedKey(null);
      onOpenChange(false);
    }
  }, [saveState, onOpenChange]);

  const rows: OptionGridRow[] = [
    ...options
      .filter((row) => !removals.includes(row.uuid))
      .map((row) => ({
        key: row.uuid,
        option: row.option,
        specification: row.specification,
        status: row.status,
        staged: false,
      })),
    ...additions.map((row) => ({
      key: row.key,
      option: row.option,
      specification: row.specification || null,
      status: "to_add" as const,
      staged: true,
    })),
  ];
  const selected = rows.find((row) => row.key === selectedKey) ?? null;

  // `Specificatie` is a combo, not free text: the specifications already on
  // record against the chosen option, and a blank.
  const specificationOptions = [
    { value: "", label: "-empty-" },
    ...optionSpecifications
      .filter((row) => row.option === chosenOption && row.specification)
      .map((row) => ({
        value: row.specification ?? "",
        label: row.specification ?? "",
      })),
  ];

  const onAdd = handleSubmit((values) => {
    setAdditions((current) => [
      ...current,
      {
        key: generateUuid(),
        option: values.option,
        specification: values.specification?.trim() ?? "",
      },
    ]);
    reset();
  });

  // `Verwijder geselecteerde optie` — a staged row simply goes; a saved one
  // is marked for removal and leaves on `Opslaan`.
  const removeSelected = () => {
    if (!selected) {
      return;
    }
    if (selected.staged) {
      setAdditions((current) =>
        current.filter((row) => row.key !== selected.key),
      );
    } else {
      setRemovals((current) => [...current, selected.key]);
    }
    setSelectedKey(null);
  };

  const onSave = () => {
    startTransition(() => {
      save({
        stockUuid: lot.uuid,
        additions: additions.map((row) => ({
          option: row.option,
          specification: row.specification,
        })),
        removals,
      });
    });
  };

  const dirty = additions.length > 0 || removals.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing without `Opslaan` is `Annuleren`: the staged edits go.
        if (!next) {
          discard();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Stock options</DialogTitle>
          <DialogDescription>
            What has been done to these pieces. The article’s own list is what it
            <em> can </em> have done — this is what it <em>has</em>.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Option</TableHead>
                <TableHead>Specification</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-20 text-center text-muted-foreground"
                  >
                    No options on this lot.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={row.key}
                    aria-selected={row.key === selectedKey}
                    onClick={() => setSelectedKey(row.key)}
                    className={cn(
                      "cursor-pointer",
                      row.key === selectedKey && "bg-accent",
                    )}
                  >
                    <TableCell className="font-medium">
                      {STOCK_OPTION_LABELS[row.option]}
                    </TableCell>
                    <TableCell>{row.specification ?? "—"}</TableCell>
                    <TableCell>
                      {STOCK_OPTION_STATUS_LABELS[row.status]}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* One `Verwijder geselecteerde optie`, acting on the selected row
              and greyed until there is one (249) — not a bin per row. */}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!selected}
              onClick={removeSelected}
            >
              <Trash2 className="size-4" />
              Remove selected option
            </Button>
          </div>

          <form onSubmit={onAdd} className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Add</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FormLabel htmlFor="option-option" required>
                  Option
                </FormLabel>
                <Controller
                  control={control}
                  name="option"
                  render={({ field }) => (
                    <Select
                      id="option-option"
                      value={field.value ?? ""}
                      placeholder="-empty-"
                      options={stockOptions.map((value) => ({
                        value,
                        label: STOCK_OPTION_LABELS[value],
                      }))}
                      onValueChange={field.onChange}
                    />
                  )}
                />
                <FormFieldError message={errors.option?.message} />
              </div>
              <div>
                <FormLabel htmlFor="option-specification">
                  Specification
                </FormLabel>
                <Controller
                  control={control}
                  name="specification"
                  render={({ field }) => (
                    <Select
                      id="option-specification"
                      value={field.value ?? ""}
                      placeholder="-empty-"
                      options={specificationOptions}
                      onValueChange={field.onChange}
                    />
                  )}
                />
                <FormFieldError message={errors.specification?.message} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="outline" disabled={!chosenOption}>
                Add
              </Button>
            </div>
          </form>

          <FormError>{saveState.error}</FormError>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => {
              discard();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSaving || !dirty}
            onClick={onSave}
          >
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
