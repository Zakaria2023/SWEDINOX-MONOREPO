import Link from "next/link";
import { Plus } from "lucide-react";
import { ContactsTable } from "@/components/contacts/contacts-table";

const ContactsPage = () => (
  <div className="space-y-6 p-6">
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        <p className="mt-2 text-gray-600">Standalone contact records.</p>
      </div>
      <Link
        href="/contacts/add"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        <Plus className="size-4" />
        New Contact
      </Link>
    </div>

    <ContactsTable />
  </div>
);

export default ContactsPage;
