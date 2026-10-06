"use client";

import {
  addLotOption,
  deleteLotOption,
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
import { Input } from "@/components/shadcn/input";
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
import { stockOptions, stockOptionStatuses } from "@/lib/enums";
import {
  STOCK_OPTION_LABELS,
  STOCK_OPTION_STATUS_LABELS,
} from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { startTransition, useActionState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  data: StockLotDialogData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  const { lot, options } = data;
  const [addState, add, isAdding] = useActionState(addLotOption, {});
  const [removeState, remove, isRemoving] = useActionState(deleteLotOption, {});

  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<StockOptionFormValues>({
    resolver: zodResolver(stockOptionSchema),
    defaultValues: {
      stockUuid: lot.uuid,
      option: "brushing",
      specification: "",
      status: "requested",
    },
  });

  useEffect(() => {
    if (addState.success) {
      reset();
    }
  }, [addState, reset]);

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      add({ ...values, stockUuid: lot.uuid });
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-20 text-center text-muted-foreground"
                  >
                    No options on this lot.
                  </TableCell>
                </TableRow>
              ) : (
                options.map((row) => (
                  <TableRow key={row.uuid}>
                    <TableCell className="font-medium">
                      {STOCK_OPTION_LABELS[row.option]}
                    </TableCell>
                    <TableCell>{row.specification ?? "—"}</TableCell>
                    <TableCell>
                      {STOCK_OPTION_STATUS_LABELS[row.status]}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        aria-label={`Remove ${STOCK_OPTION_LABELS[row.option]}`}
                        disabled={isRemoving}
                        onClick={() =>
                          startTransition(() =>
                            remove({
                              optionUuid: row.uuid,
                              stockUuid: lot.uuid,
                            }),
                          )
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <FormError>{removeState.error}</FormError>

          <form onSubmit={onSubmit} className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Add an option</p>
            <div className="grid gap-3 sm:grid-cols-3">
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
                      value={field.value}
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
                <Input
                  id="option-specification"
                  {...register("specification")}
                />
                <FormFieldError message={errors.specification?.message} />
              </div>
              <div>
                <FormLabel htmlFor="option-status" required>
                  Status
                </FormLabel>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      id="option-status"
                      value={field.value}
                      options={stockOptionStatuses.map((value) => ({
                        value,
                        label: STOCK_OPTION_STATUS_LABELS[value],
                      }))}
                      onValueChange={field.onChange}
                    />
                  )}
                />
                <FormFieldError message={errors.status?.message} />
              </div>
            </div>
            <FormError>{addState.error}</FormError>
            <div className="flex justify-end">
              <Button type="submit" variant="outline" disabled={isAdding}>
                {isAdding ? "Adding…" : "Add"}
              </Button>
            </div>
          </form>
        </DialogBody>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
