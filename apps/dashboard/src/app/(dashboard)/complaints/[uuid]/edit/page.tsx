import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getComplaintDetail } from "@/app/(dashboard)/complaints/actions";
import { complaintDetailToFormValues } from "@/app/(dashboard)/complaints/mappers";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { ComplaintForm } from "@/components/complaints/complaint-form";
import { PageHeading } from "@/components/layout/page-heading";
import { getClerkAdminUsers } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditComplaintPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [complaint, companies, products, responsibleUsers] = await Promise.all([
    getComplaintDetail(uuid),
    getCompaniesForSelect(),
    getProductsForSelect(),
    getClerkAdminUsers(),
  ]);

  if (!complaint) {
    notFound();
  }

  return (
    <div className="max-w-3xl space-y-6 p-6">
      <div>
        <Link
          href={`/complaints/${uuid}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Complaint #{complaint.id}
        </Link>
      </div>
      <PageHeading
        title={`Edit Complaint #${complaint.id}`}
        description={complaint.companyName ?? undefined}
      />
      <ComplaintForm
        companies={companies}
        products={products}
        responsibleUsers={responsibleUsers}
        complaintUuid={uuid}
        defaultValues={complaintDetailToFormValues(complaint)}
      />
    </div>
  );
};

export default EditComplaintPage;
