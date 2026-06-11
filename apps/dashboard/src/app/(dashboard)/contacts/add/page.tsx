import { ChevronLeft } from "lucide-react";
import { getContactGroups } from "@/app/(dashboard)/contacts/actions";
import { ContactForm } from "@/components/contacts/contact-form";
import { PageHeading } from "@/components/layout/page-heading";
import { TranslatedLink } from "@/components/layout/translated-link";

const AddContactPage = async () => {
  const groups = await getContactGroups();

  return (
    <div className="space-y-6 p-6">
      <div>
        <TranslatedLink
          href="/contacts"
          labelKey="contacts-add-page.back-link"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          icon={<ChevronLeft className="size-4" />}
        />
      </div>
      <PageHeading titleKey="contacts-add-page.title" />
      <ContactForm groups={groups} />
    </div>
  );
};

export default AddContactPage;
