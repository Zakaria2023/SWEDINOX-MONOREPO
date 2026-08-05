import Link from "next/link";
import { ContactDetail } from "@/app/(dashboard)/contacts/actions";
import { DetailField } from "@/components/ui/detail-field";
import { formatDateValue, formatMoney, yesNo } from "@/lib/helpers";
import {
  CONTACT_CATEGORY_LABELS,
  CONTACT_SALUTATION_LABELS,
} from "@/lib/labels";

type Props = {
  contact: ContactDetail;
};

// The roles a contact is flagged for. Held as one boolean per role rather than a
// list, so the enabled ones are collected for display.
const ROLE_FIELDS: Array<{ field: keyof ContactDetail; label: string }> = [
  { field: "isCustomer", label: "Customer" },
  { field: "isProspect", label: "Prospect" },
  { field: "isSupplier", label: "Supplier" },
  { field: "isProcessor", label: "Processor" },
  { field: "isTransporter", label: "Transporter" },
  { field: "isAgent", label: "Agent" },
  { field: "isOther", label: "Other" },
];

export const ContactDetailView = ({ contact }: Props) => {
  const roles = ROLE_FIELDS.filter(({ field }) => contact[field]).map(
    ({ label }) => label,
  );

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Person</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField
            label="Salutation"
            value={
              contact.salutation
                ? CONTACT_SALUTATION_LABELS[contact.salutation]
                : null
            }
          />
          <DetailField label="First name" value={contact.firstName} />
          <DetailField label="Initials" value={contact.initials} />
          <DetailField label="Last name" value={contact.lastName} />
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Company
            </p>
            {contact.companyUuid && contact.companyName ? (
              <Link
                href={`/companies/${contact.companyUuid}`}
                className="text-sm text-primary hover:underline"
              >
                {contact.companyName}
              </Link>
            ) : (
              <p className="text-sm">—</p>
            )}
          </div>
          <DetailField label="Company code" value={contact.companyId} />
          <DetailField
            label="Roles"
            value={roles.length > 0 ? roles.join(", ") : null}
          />
          <DetailField
            label="Categories"
            value={
              contact.categories.length > 0
                ? contact.categories
                    .map((category) => CONTACT_CATEGORY_LABELS[category])
                    .join(", ")
                : null
            }
          />
          <DetailField
            label="Category addition"
            value={contact.categoryAddition}
          />
          <DetailField
            label="Sequence number"
            value={contact.sequenceNumber}
          />
          <DetailField
            label="Created"
            value={formatDateValue(contact.createdAt)}
          />
          <DetailField
            label="Last modified"
            value={formatDateValue(contact.updatedAt)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Contact</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Telephone" value={contact.telephone} />
          <DetailField label="Mobile" value={contact.mobile} />
          <DetailField label="Fax" value={contact.fax} />
          <DetailField label="Email" value={contact.email} />
          <DetailField label="Website" value={contact.website} />
          <DetailField label="BTW number" value={contact.btwNumber} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Address</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Address" value={contact.address} />
          <DetailField label="Street and number" value={contact.streetAndNo} />
          <DetailField label="Annex" value={contact.annex} />
          <DetailField label="House" value={contact.house} />
          <DetailField label="PO box" value={yesNo(contact.poBox)} />
          <DetailField label="Postal code" value={contact.postalCode} />
          <DetailField label="Postal" value={contact.postal} />
          <DetailField label="City" value={contact.city} />
          <DetailField label="Region" value={contact.region} />
          <DetailField label="Country" value={contact.country} />
          <DetailField
            label="Address country"
            value={contact.addressCountry}
          />
          <DetailField
            label="Address telephone"
            value={contact.addressTelephone}
          />
          <DetailField label="Address fax" value={contact.addressFax} />
          <DetailField label="Address email" value={contact.addressEmail} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">
          Visiting address
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField
            label="Street and number"
            value={contact.visitStreetAndNo}
          />
          <DetailField label="Postal code" value={contact.visitPostalCode} />
          <DetailField label="City" value={contact.visitCity} />
          <DetailField label="Country" value={contact.visitCountry} />
          <DetailField label="Telephone" value={contact.visitTelephone} />
          <DetailField label="Fax" value={contact.visitFax} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Commercial</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Purchaser" value={contact.purchaser} />
          <DetailField
            label="Account manager"
            value={contact.accountManager}
          />
          <DetailField label="Representative" value={contact.representative} />
          <DetailField label="Customer group" value={contact.customerGroup} />
          <DetailField label="Industry code" value={contact.industryCode} />
          <DetailField label="Industry" value={contact.industry} />
          <DetailField
            label="Classification code"
            value={contact.classificationCode}
          />
          <DetailField label="Classification" value={contact.classification} />
          <DetailField
            label="Customer region code"
            value={contact.customerRegionCode}
          />
          <DetailField
            label="Customer region"
            value={contact.customerRegion}
          />
          <DetailField label="Search code 1" value={contact.searchCode1} />
          <DetailField label="Search code 2" value={contact.searchCode2} />
          <DetailField label="Search code 3" value={contact.searchCode3} />
          <DetailField label="Competitors" value={contact.competitors} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">
          Revenue and targets
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField
            label="Revenue last year"
            value={
              contact.revenueLastYear === null
                ? null
                : formatMoney(Number(contact.revenueLastYear))
            }
          />
          <DetailField
            label="Revenue this year"
            value={
              contact.revenueThisYear === null
                ? null
                : formatMoney(Number(contact.revenueThisYear))
            }
          />
          <DetailField
            label="Target year revenue"
            value={
              contact.targetYearRevenue === null
                ? null
                : formatMoney(Number(contact.targetYearRevenue))
            }
          />
          <DetailField
            label="Target annual sales"
            value={
              contact.targetAnnualSales === null
                ? null
                : formatMoney(Number(contact.targetAnnualSales))
            }
          />
          <DetailField
            label="Credit limit"
            value={
              contact.creditLimit === null
                ? null
                : formatMoney(Number(contact.creditLimit))
            }
          />
        </div>
      </section>
    </div>
  );
};
