import { salesUnitOptions } from "@/lib/enums";
import { TableFilterControl } from "@/lib/table-query";

/**
 * What the price list can be narrowed by.
 *
 * The three product flags are first because they are how a reader gets from
 * nineteen thousand articles to the few hundred they actually price: stock
 * products are the ones carried, standard products the ones quoted from, and a
 * group product is a heading rather than a thing that is sold.
 */
export const productPriceFilters = (
  mainGroups: string[],
): TableFilterControl[] => [
  {
    key: "mainGroup",
    kind: "select",
    label: "Main group",
    placeholder: "All groups",
    options: mainGroups.map((group) => ({ value: group, label: group })),
  },
  {
    key: "stockProduct",
    kind: "select",
    label: "Stock product",
    placeholder: "Stocked or not",
    options: [
      { value: "true", label: "Stock product" },
      { value: "false", label: "Not stocked" },
    ],
  },
  {
    key: "standardProduct",
    kind: "select",
    label: "Standard product",
    placeholder: "Standard or not",
    options: [
      { value: "true", label: "Standard product" },
      { value: "false", label: "Not standard" },
    ],
  },
  {
    key: "groupProduct",
    kind: "select",
    label: "Group product",
    placeholder: "Group or article",
    options: [
      { value: "true", label: "Group product" },
      { value: "false", label: "Article" },
    ],
  },
  {
    key: "priceUnit",
    kind: "select",
    label: "Price unit",
    placeholder: "All units",
    options: salesUnitOptions.map((unit) => ({ value: unit, label: unit })),
  },
  { key: "basePrice", kind: "numberRange", label: "Base price" },
];
