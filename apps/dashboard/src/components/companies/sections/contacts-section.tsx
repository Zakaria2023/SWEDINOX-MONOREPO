"use client";

import { CompanyContactInput } from "@/app/(dashboard)/companies/actions";
import { CONTACT_CATEGORY_LABELS } from "@/lib/labels";
import { Plus, User, X } from "lucide-react";

type Props = {
  contacts: CompanyContactInput[];
  removeContact: (index: number) => void;
  handleOpenContact: () => void;
  isPending: boolean;
};

export const ContactsSection = ({
  contacts,
  removeContact,
  handleOpenContact,
  isPending,
}: Props) => (
  <section className="space-y-4">
    <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
      Contacts
    </h2>
    <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
      {contacts.map((contact, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <User className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-muted-foreground">
              {[contact.firstName, contact.lastName]
                .filter(Boolean)
                .join(" ") || "Contact"}
            </span>
            {contact.categories?.map((cat) => (
              <span
                key={cat}
                className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
              >
                {CONTACT_CATEGORY_LABELS[cat]}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => removeContact(index)}
            className="shrink-0 text-muted-foreground hover:text-destructive"
            disabled={isPending}
          >
            <X className="size-4" />
            <span className="sr-only">Remove contact</span>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleOpenContact}
        className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        disabled={isPending}
      >
        <Plus className="size-4" />
        Add Contact
      </button>
    </div>
  </section>
);
