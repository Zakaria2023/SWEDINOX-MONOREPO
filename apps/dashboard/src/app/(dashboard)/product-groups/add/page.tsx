import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { ProductGroupForm } from "@/components/product-groups/product-group-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddProductGroupPage = async () => {
  const [existingGroups, companies] = await Promise.all([
    getProductGroupsForSelect(),
    getCompaniesForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeading title="Add Product Group" />
      <ProductGroupForm existingGroups={existingGroups} companies={companies} />
    </div>
  );
};

export default AddProductGroupPage;
