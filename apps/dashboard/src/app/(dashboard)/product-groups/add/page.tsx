import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { ProductGroupForm } from "@/components/product-groups/product-group-form";

const AddProductGroupPage = async () => {
  const [existingGroups, companies] = await Promise.all([
    getProductGroupsForSelect(),
    getCompaniesForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <ProductGroupForm existingGroups={existingGroups} companies={companies} />
    </div>
  );
};

export default AddProductGroupPage;
