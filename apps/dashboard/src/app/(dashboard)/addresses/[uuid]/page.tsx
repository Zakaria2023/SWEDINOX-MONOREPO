import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAddressDetail } from "@/app/(dashboard)/addresses/actions";
import { AddressDetailView } from "@/components/addresses/address-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const AddressDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const address = await getAddressDetail(uuid);

  if (!address) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/addresses"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Addresses
        </Link>
      </div>
      <PageHeading
        title={
          [address.streetAndNo, address.city].filter(Boolean).join(", ") ||
          address.altName ||
          "Address"
        }
        description={address.companyName ?? undefined}
      />
      <AddressDetailView address={address} />
    </div>
  );
};

export default AddressDetailPage;
