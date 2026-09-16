import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { PurchaseRequestForm } from "@/components/purchase-requests/purchase-request-form";

const NewPurchaseRequestPage = async () => {
  const [companies, clerkUsers, products] = await Promise.all([
    getCompaniesForSelect(),
    getClerkUsersForSelect(),
    getProductsForSelect(),
  ]);

  const productOptions = [
    { value: "", label: "Not listed" },
    ...products.map((product) => ({
      value: product.uuid,
      label: [product.productCode, product.name].filter(Boolean).join(" — "),
    })),
  ];

  return (
    <div className="space-y-4">
      <PurchaseRequestForm
        companies={companies}
        clerkUsers={clerkUsers}
        productOptions={productOptions}
      />
    </div>
  );
};

export default NewPurchaseRequestPage;
