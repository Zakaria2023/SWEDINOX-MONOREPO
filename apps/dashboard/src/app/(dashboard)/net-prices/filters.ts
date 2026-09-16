import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ContractListItem } from "@/app/(dashboard)/contracts/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { netPriceSides } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import { NET_PRICE_SIDE_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const netPriceFilters = (
  contracts: ContractListItem[],
  companies: CompanyOption[],
  products: ProductOption[],
): TableFilterControl[] => [
  {
    key: "side",
    kind: "select",
    label: "Side",
    // Left empty this screen shows the purchase side, which is what it is for.
    placeholder: "Purchase (supplier)",
    options: netPriceSides.map((side) => ({
      value: side,
      label: NET_PRICE_SIDE_LABELS[side],
    })),
  },
  {
    key: "contract",
    kind: "select",
    label: "Contract",
    placeholder: "All contracts",
    options: contracts.map((contract) => ({
      value: contract.uuid,
      label: `${contract.code} — ${contract.description}`,
    })),
  },
  {
    key: "company",
    kind: "select",
    label: "Company",
    placeholder: "All companies",
    options: companies.map((company) => ({
      value: company.uuid,
      label: companyOptionLabel(company),
    })),
  },
  {
    key: "product",
    kind: "select",
    label: "Product",
    placeholder: "All products",
    options: products.map((product) => ({
      value: product.uuid,
      label: `${product.productCode} — ${product.name}`,
    })),
  },
  { key: "validBetween", kind: "dateRange", label: "Valid between" },
];
