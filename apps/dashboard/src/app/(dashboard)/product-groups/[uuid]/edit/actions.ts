"use server";

import {
  ProductGroupActionResult,
  ProductGroupFields,
} from "@/app/(dashboard)/product-groups/actions";
import {
  formValuesToProductGroupFields,
  formValuesToProductGroupSuppliers,
} from "@/app/(dashboard)/product-groups/mappers";
import { ProductGroupFormValues } from "@/app/(dashboard)/product-groups/validation";
import { db } from "@/db";
import {
  ProductGroupSuppliers,
  SelectProductGroupSuppliers,
} from "@/db/schema/product-group-suppliers";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { describeError, generateUuid } from "@/lib/helpers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ProductGroupEditData = SelectProductGroups & {
  suppliers: SelectProductGroupSuppliers[];
};

export type ProductGroupEditOverview = {
  group: SelectProductGroups;
  parentName: SelectProductGroups["name"] | null;
  counts: {
    suppliers: number;
    documents: number;
  };
};

// Which columns each section owns. A section writes only these, so saving one
// never carries a half-finished edit from another along with it — and a column
// no section shows (`options` has no field yet) keeps whatever it holds.
const SECTION_COLUMNS = {
  general: [
    "parentUuid",
    "name",
    "productShape",
    "groupLongDesc",
    "groupShortDesc",
    "productShapeDesc",
    "materialGroup",
    "commodity",
    "scrap",
    "packaging",
    "descSalesPurchaseOverridable",
    "searchCode1",
    "searchCode2",
    "searchCode3",
    "articleGroup",
  ],
  basis: [
    "length",
    "width",
    "thickness",
    "decimalPlaces",
    "printDimensions",
    "weight",
    "paintSurface",
    "featuresQuality",
    "weightTheoretical",
    "weightTrade",
    "weightGerman",
    "standardsQuality",
    "tolerance",
    "ce",
    "processedOption",
    "sourceProduct",
    "industryNumber",
  ],
  purchase: [
    "purchasingUnit",
    "unitPrice",
    "deliveryTime",
    "deliveryTimeUnit",
    "orderSeries",
    "blockedForPurchasing",
    "makingOrderAdvices",
    "orderingAdviceNotes",
    "productCodeOnPurchase",
    "maxLineQty",
    "maxNetPrice",
  ],
  warehouseControl: [
    "packagingMandatoryOnCompletion",
    "receiptInLocationsWithLimitedDimensions",
    "goodsReceiptTerm",
    "includeInCsvForStockLabels",
    "suggestLastUsedChargeInScanner",
    "stockLabelType",
    "stockLabelPrinting",
    "toleranceUnloadingQty",
    "toleranceUnloadingKg",
    "toleranceCountQty",
    "toleranceCountKg",
    "tolerancePickingQty",
    "tolerancePickingKg",
    "toleranceProductionQty",
    "customerLabelForPickingSlip",
    "customerLabelForSawingSlip",
    "customerLabelAtSurfTreatSlip",
    "alwaysApproveManuallyWarehouseWorkorderLine",
    "alwaysApproveManuallyProductionWorkorderLine",
  ],
  stockPolicy: [
    "minStockMode",
    "minStockMultiplier",
    "minStockFixedValue",
    "minStockUnit",
    "maxStockMode",
    "maxStockMultiplier",
    "maxStockFixedValue",
    "maxStockUnit",
    "leadTimeMethod",
    "leadTime",
    "reviewPeriod",
    "orderCostsPurchasingSide",
    "orderCostsLogistics",
    "stockOpOrderSeries",
    "minOrderQty",
    "useStockOpForThisProduct",
    "orderOnMonday",
    "orderOnTuesday",
    "orderOnWednesday",
    "orderOnThursday",
    "orderOnFriday",
    "capitalCost",
    "warehouseCost",
    "b2StockoutPct1",
    "b2StockoutPct2",
    "handling",
    "transport",
    "pacClassification",
    "orderAdviceCode",
  ],
  sales: [
    "revenueGroup",
    "salesUnit",
    "salesUnitPrice",
    "vatCode",
    "roundWeightPerPieceUp",
    "benorProduct",
    "productCodeOnQuoteOrderInvoice",
    "certificaat",
    "websiteExport",
    "websiteBlockedForSales",
    "descriptionProductShort",
    "showWeightPerPiece",
    "showPackagingPerPiece",
    "markProductGroup",
    "priceOnRequest",
    "minProfitMarginStock",
    "minProfitMarginExWorks",
    "minProfitMarginCrossDocking",
    "severalBlockedForSales",
    "vehicleWithCraneRequired",
    "vehicleWithCanopyRequired",
    "alwaysReserveStock",
    "maxSalesLineQty",
    "maxSalesNetPrice",
    "handlingCosts",
  ],
  documents: ["documents"],
} as const satisfies Record<string, readonly (keyof ProductGroupFields)[]>;

const pickColumns = <K extends keyof ProductGroupFields>(
  fields: ProductGroupFields,
  keys: readonly K[],
): Pick<ProductGroupFields, K> =>
  Object.fromEntries(keys.map((key) => [key, fields[key]])) as Pick<
    ProductGroupFields,
    K
  >;

export const getProductGroupForEdit = async (
  uuid: string,
): Promise<ProductGroupEditData | null> => {
  try {
    const [group] = await db
      .select()
      .from(ProductGroups)
      .where(eq(ProductGroups.uuid, uuid))
      .limit(1);

    if (!group) {
      return null;
    }

    const suppliers = await db
      .select()
      .from(ProductGroupSuppliers)
      .where(eq(ProductGroupSuppliers.productGroupUuid, uuid));

    return { ...group, suppliers };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch the product group"));
  }
};

export const getProductGroupEditOverview = async (
  uuid: string,
): Promise<ProductGroupEditOverview | null> => {
  const group = await getProductGroupForEdit(uuid);

  if (!group) {
    return null;
  }

  const { suppliers, ...row } = group;

  const parent = row.parentUuid
    ? await db
        .select({ name: ProductGroups.name })
        .from(ProductGroups)
        .where(eq(ProductGroups.uuid, row.parentUuid))
        .limit(1)
    : [];

  return {
    group: row,
    parentName: parent[0]?.name ?? null,
    counts: {
      suppliers: suppliers.length,
      documents: (row.documents ?? []).length,
    },
  };
};

const saveSection = async (
  uuid: string,
  columns: Partial<ProductGroupFields>,
): Promise<ProductGroupActionResult> => {
  try {
    await db.update(ProductGroups).set(columns).where(eq(ProductGroups.uuid, uuid));
  } catch (error) {
    return { error: describeError(error, "Failed to update product group") };
  }

  revalidatePath("/product-groups");
  revalidatePath(`/product-groups/${uuid}/edit`);
  redirect(`/product-groups/${uuid}/edit`);
};

export const updateProductGroupGeneral = async (
  uuid: string,
  values: ProductGroupFormValues,
): Promise<ProductGroupActionResult> => {
  // A group parented to itself would drop its whole branch out of the tree.
  if (values.parentUuid === uuid) {
    return { error: "A product group cannot be its own parent" };
  }

  return saveSection(
    uuid,
    pickColumns(formValuesToProductGroupFields(values), SECTION_COLUMNS.general),
  );
};

export const updateProductGroupBasis = async (
  uuid: string,
  values: ProductGroupFormValues,
): Promise<ProductGroupActionResult> =>
  saveSection(
    uuid,
    pickColumns(formValuesToProductGroupFields(values), SECTION_COLUMNS.basis),
  );

export const updateProductGroupPurchase = async (
  uuid: string,
  values: ProductGroupFormValues,
): Promise<ProductGroupActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToProductGroupFields(values),
      SECTION_COLUMNS.purchase,
    ),
  );

export const updateProductGroupWarehouseControl = async (
  uuid: string,
  values: ProductGroupFormValues,
): Promise<ProductGroupActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToProductGroupFields(values),
      SECTION_COLUMNS.warehouseControl,
    ),
  );

export const updateProductGroupStockPolicy = async (
  uuid: string,
  values: ProductGroupFormValues,
): Promise<ProductGroupActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToProductGroupFields(values),
      SECTION_COLUMNS.stockPolicy,
    ),
  );

export const updateProductGroupSales = async (
  uuid: string,
  values: ProductGroupFormValues,
): Promise<ProductGroupActionResult> =>
  saveSection(
    uuid,
    pickColumns(formValuesToProductGroupFields(values), SECTION_COLUMNS.sales),
  );

export const updateProductGroupDocuments = async (
  uuid: string,
  values: ProductGroupFormValues,
): Promise<ProductGroupActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToProductGroupFields(values),
      SECTION_COLUMNS.documents,
    ),
  );

export const updateProductGroupSuppliers = async (
  uuid: string,
  values: ProductGroupFormValues,
): Promise<ProductGroupActionResult> => {
  const suppliers = formValuesToProductGroupSuppliers(values.suppliers);

  // The overview names a group's supplier by reading the row flagged preferred,
  // so more than one would make that name arbitrary.
  if (suppliers.filter((supplier) => supplier.preferred).length > 1) {
    return { error: "Only one supplier can be the preferred one" };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(ProductGroupSuppliers)
        .where(eq(ProductGroupSuppliers.productGroupUuid, uuid));

      if (suppliers.length > 0) {
        await tx.insert(ProductGroupSuppliers).values(
          suppliers.map((supplier) => ({
            ...supplier,
            uuid: generateUuid(),
            productGroupUuid: uuid,
          })),
        );
      }
    });
  } catch (error) {
    return {
      error: describeError(error, "Failed to update product group suppliers"),
    };
  }

  revalidatePath("/product-groups");
  revalidatePath(`/product-groups/${uuid}/edit`);
  redirect(`/product-groups/${uuid}/edit`);
};
