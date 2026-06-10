import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ContactForm } from "@/components/contacts/contact-form";
import { getContactGroups } from "@/app/(dashboard)/contacts/actions";

const AddContactPage = async () => {
  const groups = await getContactGroups();

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/contacts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Contacts
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Contact</h1>
      </div>

      <ContactForm groups={groups} />
    </div>
  );
};

export default AddContactPage;
