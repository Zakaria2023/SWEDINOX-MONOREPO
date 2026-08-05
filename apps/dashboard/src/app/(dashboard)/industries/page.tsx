import { getIndustries } from "@/app/(dashboard)/industries/actions";
import { Industries } from "@/components/industries/industries";
import { PageHeading } from "@/components/layout/page-heading";

const IndustriesPage = async () => {
  const industries = await getIndustries();

  return (
    <div className="space-y-4">
      <PageHeading title="Industries" />
      <Industries industries={industries} />
    </div>
  );
};

export default IndustriesPage;
