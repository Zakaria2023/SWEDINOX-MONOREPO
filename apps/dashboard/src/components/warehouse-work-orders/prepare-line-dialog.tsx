"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import {
  prepareWarehouseWorkOrderLine,
  WorkOrderLineListItem,
} from "@/app/(dashboard)/warehouse-work-orders/actions";
import {
  prepareLineSchema,
  PrepareLineFormValues,
} from "@/app/(dashboard)/warehouse-work-orders/validation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormError } from "@/components/ui/form-error";
import { cn } from "@/lib/helpers";

type Props = {
  line: WorkOrderLineListItem | null;
  onOpenChange: (open: boolean) => void;
};

export const PrepareLineDialog = ({ line, onOpenChange }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | undefined>();

  const { control, register, handleSubmit, reset } =
    useForm<PrepareLineFormValues>({
      resolver: zodResolver(prepareLineSchema),
      defaultValues: { picks: [] },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "picks" });
  const picks = useWatch({ control, name: "picks" });

  useEffect(() => {
    if (line) {
      reset({
        picks: [
          {
            stockUuid: line.stockUuid ?? "",
            qtyPlanned: line.qtyPlanned ?? "",
            kgPlanned: line.kgPlanned ?? "",
          },
        ],
      });
      setFormError(undefined);
    }
  }, [line, reset]);

  // The rows have to add up to what the line asks for, which is the one thing
  // preparing can get wrong in a way nobody notices until the floor is short.
  const asked = Number(line?.qtyPlanned ?? 0);
  const prepared = (picks ?? []).reduce(
    (total, pick) => total + Number(pick?.qtyPlanned || 0),
    0,
  );

  const onSubmit = handleSubmit((values) => {
    if (!line) {
      return;
    }
    startTransition(async () => {
      const result = await prepareWarehouseWorkOrderLine(
        line.uuid,
        values.picks.map((pick) => ({
          stockUuid: pick.stockUuid || null,
          toLocationUuid: null,
          qtyPlanned: pick.qtyPlanned || "0",
          kgPlanned: pick.kgPlanned || null,
        })),
      );

      if (result.success) {
        onOpenChange(false);
        router.refresh();
        return;
      }

      setFormError(result.error);
    });
  });

  return (
    <Dialog open={!!line} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Prepare Line</DialogTitle>
          <DialogDescription>
            Say which lots this line will be drawn from. Optional — a line taken
            from a single lot needs no preparing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <DialogBody className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stock lot</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Kg</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Input
                        className="font-mono"
                        placeholder="Stock lot reference"
                        {...register(`picks.${index}.stockUuid`)}
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="text-right"
                        {...register(`picks.${index}.qtyPlanned`)}
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="text-right"
                        {...register(`picks.${index}.kgPlanned`)}
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={isPending || fields.length === 1}
                        aria-label="Remove row"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ stockUuid: "", qtyPlanned: "", kgPlanned: "" })
                }
                disabled={isPending}
              >
                <Plus className="size-4" />
                Add row
              </Button>
              <p
                className={cn(
                  "text-sm",
                  prepared === asked
                    ? "text-muted-foreground"
                    : "font-medium text-amber-600",
                )}
              >
                Prepared {prepared} of {asked}
              </p>
            </div>

            <FormError>{formError}</FormError>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
