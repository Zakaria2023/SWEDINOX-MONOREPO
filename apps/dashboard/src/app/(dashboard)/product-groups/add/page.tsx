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
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        title="Add Product Group"
        description="Create a new product group with all its properties"
      />
      <ProductGroupForm existingGroups={existingGroups} companies={companies} />
    </div>
  );
};

export default AddProductGroupPage;
