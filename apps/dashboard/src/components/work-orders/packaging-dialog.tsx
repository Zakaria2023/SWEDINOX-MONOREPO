"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { PackagingType, packagingTypes } from "@/lib/enums";
import { PACKAGING_TYPE_LABELS } from "@/lib/labels";

// Shared by the warehouse and the machines: a load is packed as a load either
// way, and the grid is the same one. The schema lives here rather than in a
// route folder because this component is its only reader.
const packagingSchema = z.object({
  entries: z.array(
    z.object({
      packaging: z.enum(packagingTypes),
      quantity: z.string(),
      specification: z.string().optional(),
    }),
  ),
});

type PackagingFormValues = z.infer<typeof packagingSchema>;

export type PackagingRow = {
  uuid: string;
  packaging: PackagingType;
  quantity: number;
  specification: string | null;
};

export type SavePackaging = (
  workOrderUuid: string,
  entries: {
    packaging: PackagingType;
    quantity: number;
    specification?: string | null;
  }[],
) => Promise<{ error?: string; success?: boolean }>;

type Props = {
  workOrderUuid: string | null;
  existing: PackagingRow[];
  save: SavePackaging;
  onOpenChange: (open: boolean) => void;
};

export const PackagingDialog = ({
  workOrderUuid,
  existing,
  save,
  onOpenChange,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | undefined>();

  const { control, register, handleSubmit, reset } =
    useForm<PackagingFormValues>({
      resolver: zodResolver(packagingSchema),
      defaultValues: { entries: [] },
    });

  const entries = useWatch({ control, name: "entries" });

  // Every kind is always on the grid; you fill in the ones you used. A row left
  // at nothing is not saved, which is what keeps the record to what went out.
  useEffect(() => {
    if (workOrderUuid) {
      reset({
        entries: packagingTypes.map((packaging) => {
          const row = existing.find((item) => item.packaging === packaging);
          return {
            packaging,
            quantity: row ? String(row.quantity) : "",
            specification: row?.specification ?? "",
          };
        }),
      });
      setFormError(undefined);
    }
  }, [workOrderUuid, existing, reset]);

  const anyCounted = (entries ?? []).some(
    (entry) => Number(entry?.quantity || 0) > 0,
  );

  const onSubmit = handleSubmit((values) => {
    if (!workOrderUuid) {
      return;
    }
    startTransition(async () => {
      const result = await save(
        workOrderUuid,
        values.entries.map((entry) => ({
          packaging: entry.packaging,
          quantity: Number(entry.quantity || 0),
          specification: entry.specification || null,
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
    <Dialog open={!!workOrderUuid} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Packaging</DialogTitle>
          <DialogDescription>
            The returnable packaging these goods went out on.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <DialogBody>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32 text-right">Count</TableHead>
                  <TableHead>Packaging</TableHead>
                  <TableHead>Specification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packagingTypes.map((packaging, index) => (
                  <TableRow key={packaging}>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        className="text-right"
                        {...register(`entries.${index}.quantity`)}
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell>{PACKAGING_TYPE_LABELS[packaging]}</TableCell>
                    <TableCell>
                      <Input
                        {...register(`entries.${index}.specification`)}
                        disabled={isPending}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

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
            <Button type="submit" disabled={isPending || !anyCounted}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
