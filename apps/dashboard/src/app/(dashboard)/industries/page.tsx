import { getIndustries } from "@/app/(dashboard)/industries/actions";
import { Industries } from "@/components/industries/industries";
import { PageHeading } from "@/components/layout/page-heading";

const IndustriesPage = async () => {
  const industries = await getIndustries();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Industries"
        description="SBI codes that can be assigned to a company's industry"
      />
      <Industries industries={industries} />
    </div>
  );
};

export default IndustriesPage;
