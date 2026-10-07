"use client";

import {
  deleteOrderCallOff,
  OrderCallOffAddressOption,
  OrderCallOffRow,
  saveOrderCallOff,
} from "@/app/(dashboard)/orders/[uuid]/actions";
import {
  callOffSchema,
  CallOffValues,
} from "@/app/(dashboard)/orders/[uuid]/validation";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
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
import { BooleanFlag } from "@/components/ui/boolean-flag";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import {
  cn,
  daysInSystem,
  formatAddressLine,
  formatDateColumn,
  orDash,
  pluralize,
  userName,
} from "@/lib/helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  orderUuid: string;
  rows: OrderCallOffRow[];
  addresses: OrderCallOffAddressOption[];
  userNames: Record<string, string>;
};

type CallOffDialogProps = {
  orderUuid: string;
  /** Null for `New`. */
  callOff: OrderCallOffRow | null;
  addresses: OrderCallOffAddressOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const CallOffDialog = ({
  orderUuid,
  callOff,
  addresses,
  open,
  onOpenChange,
}: CallOffDialogProps) => {
  const [state, dispatch, isPending] = useActionState(saveOrderCallOff, {});

  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<CallOffValues>({
    resolver: zodResolver(callOffSchema),
    defaultValues: {
      customerRef: "",
      deliveryAddressUuid: "",
      isRush: false,
      isSent: false,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        customerRef: callOff?.customerRef ?? "",
        deliveryAddressUuid: callOff?.deliveryAddressUuid ?? "",
        isRush: callOff?.isRush ?? false,
        isSent: callOff?.isSent ?? false,
      });
    }
  }, [open, callOff, reset]);

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, orderUuid, callOffUuid: callOff?.uuid ?? null });
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{callOff ? "Change call-off" : "New call-off"}</DialogTitle>
            <DialogDescription>
              The customer calling for part of this order: their reference for
              it, where it goes, and whether it is a rush.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div>
              <FormLabel htmlFor="call-off-customer-ref">
                Customer reference
              </FormLabel>
              <Input id="call-off-customer-ref" {...register("customerRef")} />
              <FormFieldError message={errors.customerRef?.message} />
            </div>
            <div>
              <FormLabel htmlFor="call-off-address">Delivery address</FormLabel>
              <Controller
                control={control}
                name="deliveryAddressUuid"
                render={({ field }) => (
                  <Select
                    id="call-off-address"
                    value={field.value}
                    options={[
                      { value: "", label: "-empty-" },
                      ...addresses.map((address) => ({
                        value: address.uuid,
                        label: formatAddressLine(address) || address.uuid,
                      })),
                    ]}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="flex gap-6">
              <Controller
                control={control}
                name="isRush"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                    Rush
                  </label>
                )}
              />
              <Controller
                control={control}
                name="isSent"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                    Sent
                  </label>
                )}
              />
            </div>
            <FormError>{state.error}</FormError>
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
              {isPending ? "Saving…" : "OK"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * `Call-offs` — the panel a `Call-off` order carries under its lines.
 *
 * Captured on `100785` (7-10-2026): `New · Delete · Change · Print call-off ·
 * Send…` above a grid of `Customer reference · Delivery address · Rush ·
 * Call-off last modified by · Call-off last … · IsSend · Days in system`. The
 * buttons act on the selected row, as every reference toolbar does.
 */
export const OrderCallOffsPanel = ({
  orderUuid,
  rows,
  addresses,
  userNames,
}: Props) => {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"new" | "change" | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startDelete] = useTransition();

  const selected = rows.find((row) => row.uuid === selectedUuid) ?? null;

  const onDelete = () => {
    if (!selected) {
      return;
    }
    startDelete(async () => {
      const result = await deleteOrderCallOff(selected.uuid);
      setError(result.error);
      setIsDeleteOpen(false);
      if (!result.error) {
        setSelectedUuid(null);
      }
    });
  };

  return (
    <CollapsibleSection
      title="Call-offs"
      summary={
        rows.length === 0
          ? "No call-offs"
          : `${rows.length} ${pluralize(rows.length, "call-off")}`
      }
      defaultOpen
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setDialogMode("new")}>
            <Plus size={16} />
            New
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!selected || isPending}
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 size={16} />
            Delete
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!selected}
            onClick={() => setDialogMode("change")}
          >
            <Pencil size={16} />
            Change
          </Button>
        </div>

        <FormError>{error}</FormError>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer reference</TableHead>
              <TableHead>Delivery address</TableHead>
              <TableHead>Rush</TableHead>
              <TableHead>Call-off last modified by</TableHead>
              <TableHead>Call-off last modified</TableHead>
              <TableHead>IsSend</TableHead>
              <TableHead className="text-right">Days in system</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-16 text-center text-muted-foreground">
                  No call-offs yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.uuid}
                  onClick={() => setSelectedUuid(row.uuid)}
                  className={cn(
                    "cursor-pointer",
                    row.uuid === selectedUuid && "bg-muted",
                  )}
                >
                  <TableCell>{orDash(row.customerRef)}</TableCell>
                  <TableCell>
                    {orDash(
                      formatAddressLine({
                        streetAndNo: row.addressStreet,
                        postalCode: row.addressPostalCode,
                        city: row.addressCity,
                      }) || null,
                    )}
                  </TableCell>
                  <TableCell>
                    <BooleanFlag on={row.isRush} label="Rush" />
                  </TableCell>
                  <TableCell>{userName(row.modifiedByUserId, userNames)}</TableCell>
                  <TableCell>{formatDateColumn(row.updatedAt)}</TableCell>
                  <TableCell>
                    <BooleanFlag on={row.isSent} label="IsSend" />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {daysInSystem(row.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CallOffDialog
        orderUuid={orderUuid}
        callOff={dialogMode === "change" ? selected : null}
        addresses={addresses}
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null);
          }
        }}
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete this call-off?"
        description="The call-off is removed from the order. The order lines are not touched."
        confirmLabel="Delete"
        isPending={isPending}
        onConfirm={onDelete}
      />
    </CollapsibleSection>
  );
};
