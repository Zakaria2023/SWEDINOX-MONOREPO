import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getContactDetail } from "@/app/(dashboard)/contacts/actions";
import { ContactDetailView } from "@/components/contacts/contact-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { fullName } from "@/lib/helpers";
import { getClerkUserNames } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
};

// `Contacts` backs both contact-person overviews, so the back link points at the
// one the contact belongs to rather than always at the same list.
const ContactDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const contact = await getContactDetail(uuid);

  if (!contact) {
    notFound();
  }

  const origin = contact.isSupplier
    ? {
        href: "/contact-persons-suppliers",
        label: "Contact Persons Suppliers",
      }
    : {
        href: "/contact-persons-customers-and-prospects",
        label: "Contact Persons Customers and Prospects",
      };

  // These columns store a Clerk id; Clerk owns the names.

  const userNames = await getClerkUserNames();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={origin.href}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {origin.label}
        </Link>
      </div>
      <PageHeading title={fullName(contact.firstName, contact.lastName)} />
      <ContactDetailView contact={contact}  userNames={userNames} />
    </div>
  );
};

export default ContactDetailPage;
