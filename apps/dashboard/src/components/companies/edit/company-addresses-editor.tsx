"use client";

import {
  deleteCompanyAddress,
  saveCompanyAddress,
} from "@/app/(dashboard)/companies/[uuid]/edit/addresses/actions";
import { addressRowToFormValues } from "@/app/(dashboard)/companies/[uuid]/edit/addresses/mappers";
import {
  CompanyFormValues,
  createCompanySchema,
  DEFAULT_ADDRESS,
} from "@/app/(dashboard)/companies/validation";
import { AdditionalAddressDialog } from "@/components/companies/dialogs/additional-address-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { addressCategories, AddressCategory } from "@/lib/enums";
import { ADDRESS_CATEGORY_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  companyUuid: string;
  addresses: SelectCompanyAddresses[];
};

export const CompanyAddressesEditor = ({ companyUuid, addresses }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<SelectCompanyAddresses | null>(null);

  const [saveState, dispatchSave, isSaving] = useActionState(
    saveCompanyAddress,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteCompanyAddress,
    {},
  );

  // The shared AddressForm fields are bound to the company form's `address`
  // subtree, so this form wraps the dialog values in that same shape — only
  // the address path is ever validated or read.
  const addressForm = useForm<CompanyFormValues>({
    resolver: zodResolver(createCompanySchema()),
    defaultValues: { address: { ...DEFAULT_ADDRESS, category: [] } },
  });

  useEffect(() => {
    if (saveState.success) {
      setIsDialogOpen(false);
      setEditingUuid(null);
      addressForm.reset({ address: { ...DEFAULT_ADDRESS, category: [] } });
    }
  }, [saveState, addressForm]);

  useEffect(() => {
    if (deleteState.success) {
      setDeleteTarget(null);
    }
  }, [deleteState]);

  // Categories already used by another address aren't offered again, except
  // delivery — a company can have any number of delivery addresses. The
  // address being edited keeps its own categories available.
  const usedByOthers = new Set<AddressCategory>(
    addresses
      .filter((address) => address.uuid !== editingUuid)
      .flatMap((address) => address.category),
  );
  const availableCategories: AddressCategory[] = [
    ...addressCategories.filter(
      (category) => category !== "delivery" && !usedByOthers.has(category),
    ),
    "delivery",
  ];

  const handleOpenAdd = () => {
    addressForm.reset({ address: { ...DEFAULT_ADDRESS, category: [] } });
    setEditingUuid(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (address: SelectCompanyAddresses) => {
    addressForm.reset({ address: addressRowToFormValues(address) });
    setEditingUuid(address.uuid);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      addressForm.reset({ address: { ...DEFAULT_ADDRESS, category: [] } });
      setEditingUuid(null);
    }
    setIsDialogOpen(open);
  };

  const handleCancel = () => {
    handleDialogOpenChange(false);
  };

  // The dialog footer is a plain button (no <form>), so validate just the
  // address subtree and dispatch its values — like the legacy dialog did.
  const handleSave = async () => {
    const valid = await addressForm.trigger("address");
    if (!valid) {
      return;
    }
    const values = addressForm.getValues("address");
    startTransition(() => {
      dispatchSave({ companyUuid, addressUuid: editingUuid, values });
    });
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      startTransition(() => {
        dispatchDelete({ companyUuid, addressUuid: deleteTarget.uuid });
      });
    }
  };

  return (
    <div className="space-y-4">
      <FormError>{saveState.error ?? deleteState.error}</FormError>

      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {addresses.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No addresses yet — add the first one below.
          </p>
        )}
        {addresses.map((address) => (
          <div
            key={address.uuid}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <span className="line-clamp-1 text-foreground">
                {[address.streetAndNo, address.city]
                  .filter(Boolean)
                  .join(", ") ||
                  address.altName ||
                  "Address"}
              </span>
              {address.category.map((category) => (
                <span
                  key={category}
                  className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                >
                  {ADDRESS_CATEGORY_LABELS[category]}
                </span>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => handleOpenEdit(address)}
                className="rounded p-1 text-muted-foreground hover:text-primary"
                disabled={isSaving || isDeleting}
              >
                <Pencil className="size-4" />
                <span className="sr-only">Edit address</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(address)}
                className="rounded p-1 text-muted-foreground hover:text-destructive"
                disabled={isSaving || isDeleting}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Delete address</span>
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          disabled={isSaving || isDeleting}
        >
          <Plus className="size-4" />
          Add Address
        </button>
      </div>

      <AdditionalAddressDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onCancel={handleCancel}
        onSave={handleSave}
        form={addressForm}
        availableForNext={availableCategories}
        submitLabel={editingUuid ? "Save Changes" : "Add Address"}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete address"
        description={`Delete ${
          deleteTarget
            ? [deleteTarget.streetAndNo, deleteTarget.city]
                .filter(Boolean)
                .join(", ") ||
              deleteTarget.altName ||
              "this address"
            : "this address"
        }? This can't be undone.`}
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
