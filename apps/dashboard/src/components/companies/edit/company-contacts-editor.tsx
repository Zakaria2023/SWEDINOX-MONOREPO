"use client";

import {
  deleteCompanyContact,
  saveCompanyContact,
} from "@/app/(dashboard)/companies/[uuid]/edit/contacts/actions";
import { contactRowToDialogValues } from "@/app/(dashboard)/companies/[uuid]/edit/contacts/mappers";
import {
  contactDialogSchema,
  ContactDialogValues,
  DEFAULT_CONTACT,
} from "@/app/(dashboard)/companies/validation";
import { ContactDialog } from "@/components/companies/dialogs/contact-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import type { SelectContacts } from "@/db/schema/contacts";
import type { ContactCategory } from "@/lib/enums";
import { CONTACT_CATEGORY_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2, User } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  companyUuid: string;
  contacts: SelectContacts[];
};

export const CompanyContactsEditor = ({ companyUuid, contacts }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SelectContacts | null>(null);

  const [saveState, dispatchSave, isSaving] = useActionState(
    saveCompanyContact,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteCompanyContact,
    {},
  );

  const contactForm = useForm<ContactDialogValues>({
    resolver: zodResolver(contactDialogSchema),
    defaultValues: DEFAULT_CONTACT,
  });

  useEffect(() => {
    if (saveState.success) {
      setIsDialogOpen(false);
      setEditingUuid(null);
      contactForm.reset(DEFAULT_CONTACT);
    }
  }, [saveState, contactForm]);

  useEffect(() => {
    if (deleteState.success) {
      setDeleteTarget(null);
    }
  }, [deleteState]);

  const handleOpenAdd = () => {
    contactForm.reset(DEFAULT_CONTACT);
    setEditingUuid(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (contact: SelectContacts) => {
    contactForm.reset(contactRowToDialogValues(contact));
    setEditingUuid(contact.uuid);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      contactForm.reset(DEFAULT_CONTACT);
      setEditingUuid(null);
    }
    setIsDialogOpen(open);
  };

  const handleCancel = () => {
    handleDialogOpenChange(false);
  };

  const toggleContactCategory = (category: ContactCategory) => {
    const current = contactForm.getValues("categories") as ContactCategory[];
    contactForm.setValue(
      "categories",
      current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category],
    );
  };

  const handleSave = contactForm.handleSubmit((values) => {
    dispatchSave({ companyUuid, contactUuid: editingUuid, values });
  });

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      dispatchDelete({ companyUuid, contactUuid: deleteTarget.uuid });
    }
  };

  return (
    <div className="space-y-4">
      <FormError>{saveState.error ?? deleteState.error}</FormError>

      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {contacts.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No contacts yet — add the first one below.
          </p>
        )}
        {contacts.map((contact) => (
          <div
            key={contact.uuid}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <User className="size-4 shrink-0 text-muted-foreground" />
              <span className="line-clamp-1 text-gray-800">
                {[contact.firstName, contact.lastName]
                  .filter(Boolean)
                  .join(" ") ||
                  contact.email ||
                  "Contact"}
              </span>
              {contact.email && (
                <span className="line-clamp-1 text-muted-foreground">
                  {contact.email}
                </span>
              )}
              {contact.categories.map((category) => (
                <span
                  key={category}
                  className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                >
                  {CONTACT_CATEGORY_LABELS[category]}
                </span>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => handleOpenEdit(contact)}
                className="rounded p-1 text-muted-foreground hover:text-primary"
                disabled={isSaving || isDeleting}
              >
                <Pencil className="size-4" />
                <span className="sr-only">Edit contact</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(contact)}
                className="rounded p-1 text-muted-foreground hover:text-destructive"
                disabled={isSaving || isDeleting}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Delete contact</span>
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
          Add Contact
        </button>
      </div>

      <ContactDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onCancel={handleCancel}
        onSave={handleSave}
        form={contactForm}
        toggleContactCategory={toggleContactCategory}
        submitLabel={editingUuid ? "Save Changes" : "Add Contact"}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete contact"
        description={`Delete ${
          deleteTarget
            ? [deleteTarget.firstName, deleteTarget.lastName]
                .filter(Boolean)
                .join(" ") ||
              deleteTarget.email ||
              "this contact"
            : "this contact"
        }? This can't be undone.`}
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
