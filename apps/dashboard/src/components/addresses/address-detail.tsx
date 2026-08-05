import Link from "next/link";
import { AddressDetail } from "@/app/(dashboard)/addresses/actions";
import { DetailField } from "@/components/ui/detail-field";
import { formatDateValue, formatNumber, yesNo } from "@/lib/helpers";
import { ADDRESS_CATEGORY_LABELS, AVAILABLE_AT_LABELS } from "@/lib/labels";

type Props = {
  address: AddressDetail;
};

export const AddressDetailView = ({ address }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Address</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Company
          </p>
          {address.companyUuid && address.companyName ? (
            <Link
              href={`/companies/${address.companyUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {address.companyName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Company code" value={address.companyId} />
        <DetailField label="Alternative name" value={address.altName} />
        <DetailField label="PO box" value={yesNo(address.poBox)} />
        <DetailField label="Street and number" value={address.streetAndNo} />
        <DetailField label="House" value={address.house} />
        <DetailField label="Postal code" value={address.postalCode} />
        <DetailField label="City" value={address.city} />
        <DetailField label="Region" value={address.region} />
        <DetailField label="Country" value={address.country} />
        <DetailField
          label="Sequence number"
          value={address.sequenceNumber}
        />
        <DetailField
          label="Categories"
          value={
            address.category.length > 0
              ? address.category
                  .map((category) => ADDRESS_CATEGORY_LABELS[category])
                  .join(", ")
              : null
          }
        />
        <DetailField
          label="Address complete"
          value={yesNo(address.addressComplete)}
        />
        <DetailField
          label="Haulage distance"
          value={
            address.distanceKm === null
              ? null
              : `${formatNumber(Number(address.distanceKm))} km`
          }
        />
        <DetailField
          label="Created"
          value={formatDateValue(address.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(address.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Contact</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Telephone" value={address.telephone} />
        <DetailField label="Fax" value={address.fax} />
        <DetailField label="Email" value={address.email} />
        <DetailField label="Website" value={address.website} />
        <DetailField
          label="Billing attention"
          value={address.billingAttention}
        />
        <DetailField
          label="Billing attention (additional)"
          value={address.billingAttentionAdditional}
        />
        <DetailField label="GLN" value={address.gln} />
        <DetailField label="Peppol ID" value={address.peppolId} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Delivery and unloading
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Crane needed" value={yesNo(address.needCrane)} />
        <DetailField
          label="Canopy required"
          value={yesNo(address.canopyRequired)}
        />
        <DetailField
          label="Bundle separately"
          value={yesNo(address.bundleSeparately)}
        />
        <DetailField
          label="Special transport"
          value={yesNo(address.specialTransport)}
        />
        <DetailField
          label="Available at"
          value={
            address.availableAt
              ? AVAILABLE_AT_LABELS[address.availableAt]
              : null
          }
        />
        <DetailField
          label="Unloading from"
          value={address.unloadingStartTime}
        />
        <DetailField label="Unloading until" value={address.unloadingEndTime} />
        <DetailField label="Maximum length" value={address.maxLength} />
        <DetailField
          label="Maximum bundle weight"
          value={address.maxBundleWeight}
        />
      </div>
      <DetailField
        label="Loading instructions"
        value={address.loadingInstructions}
      />
    </section>
  </div>
);
