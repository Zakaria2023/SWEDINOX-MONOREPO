"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  ContractNetPrices,
  SelectContractNetPrices,
} from "@/db/schema/contract-net-prices";
import { Contracts, SelectContracts } from "@/db/schema/contracts";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import {
  ProductGroupSuppliers,
  SelectProductGroupSuppliers,
} from "@/db/schema/product-group-suppliers";
import { Products, SelectProducts } from "@/db/schema/products";
import { NET_PRICE_COLUMNS } from "@/app/(dashboard)/net-prices/columns";
import { ContractableRole, NetPriceSide } from "@/lib/enums";
import { describeError, generateUuid, moneyString } from "@/lib/helpers";
import { exportRows } from "@/lib/server/excel";
import {
  numberRangeFilter,
  relationFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import {
  aliasedTable,
  and,
  asc,
  count,
  eq,
  gte,
  isNull,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Which contracts each side reads from. A purchase price is what a supplier or
// a processor charges us; a sales price is what a customer pays.
const SIDE_ROLES: Record<NetPriceSide, ContractableRole[]> = {
  purchase: ["supplier", "processor"],
  sales: ["customer", "prospect"],
};

const ParentGroups = aliasedTable(ProductGroups, "parent_groups");

// The preferred supplier of the product's group, resolved per row as correlated
// scalar subqueries. Companies must be joined under an alias here because the
// outer query already joins Companies for the contract's company.
const SupplierCompanies = aliasedTable(Companies, "supplier_companies");

const preferredSupplierRow = db
  .select({ companyName: SupplierCompanies.companyName })
  .from(ProductGroupSuppliers)
  .innerJoin(
    SupplierCompanies,
    eq(SupplierCompanies.uuid, ProductGroupSuppliers.supplierCompanyUuid),
  )
  .where(
    and(
      eq(ProductGroupSuppliers.productGroupUuid, Products.productGroupUuid),
      eq(ProductGroupSuppliers.preferred, true),
    ),
  )
  .limit(1);

const preferredSupplierName = sql<string | null>`(${preferredSupplierRow})`;

const supplierProductCodeRow = db
  .select({ code: ProductGroupSuppliers.externalProductCode })
  .from(ProductGroupSuppliers)
  .where(
    and(
      eq(ProductGroupSuppliers.productGroupUuid, Products.productGroupUuid),
      eq(ProductGroupSuppliers.preferred, true),
    ),
  )
  .limit(1);

const supplierProductCode = sql<string | null>`(${supplierProductCodeRow})`;

const NET_PRICE_SEARCH = [
  Products.productCode,
  Products.name,
  Contracts.code,
  Companies.companyName,
] as const;

const NET_PRICE_SORTABLE = {
  contractCode: Contracts.code,
  productCode: Products.productCode,
  netPrice: ContractNetPrices.netPrice,
  validFrom: ContractNetPrices.validFrom,
  fromQty: ContractNetPrices.fromQty,
};

const NET_PRICE_FILTERS = {
  side: (values: string[]) => {
    const side = values[0];
    return side === "purchase" || side === "sales"
      ? sideCondition(side)
      : undefined;
  },
  contract: relationFilter(ContractNetPrices.contractUuid),
  company: relationFilter(Contracts.companyUuid),
  product: relationFilter(ContractNetPrices.productUuid),
  // The reference's "Company code" from/to.
  companyCode: numberRangeFilter(Companies.id),
  // Prices in force during the period, the way the reference's "Contract valid
  // between" reads: a row counts when its own window overlaps the range.
  validBetween: (values: string[]) => {
    const [from, to] = (values[0] ?? "").split("..");
    return and(
      from
        ? or(
            isNull(ContractNetPrices.validUntil),
            gte(ContractNetPrices.validUntil, from),
          )
        : undefined,
      to
        ? or(
            isNull(ContractNetPrices.validFrom),
            lte(ContractNetPrices.validFrom, to),
          )
        : undefined,
    );
  },
};

export type NetPriceRow = SelectContractNetPrices & {
  contractCode: SelectContracts["code"] | null;
  contractDescription: SelectContracts["description"] | null;
  contractRole: SelectContracts["role"] | null;
  companyCode: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  companyUuid: SelectContracts["companyUuid"] | null;
  productCode: SelectProducts["productCode"] | null;
  oldProductCode: SelectProducts["oldProductCode"] | null;
  productName: SelectProducts["name"] | null;
  groupProduct: SelectProducts["groupProduct"] | null;
  stockProduct: SelectProducts["stockProduct"] | null;
  standardProduct: SelectProducts["standardProduct"] | null;
  basePrice: SelectProducts["basePrice"] | null;
  mainGroup: SelectProductGroups["name"] | null;
  subGroup: SelectProductGroups["name"] | null;
  preferredSupplier: SelectCompanies["companyName"] | null;
  supplierProductCode:
    | SelectProductGroupSuppliers["externalProductCode"]
    | null;
};

/** What a person types when agreeing one price. */
export type NetPriceInput = {
  contractUuid: string;
  productUuid: string;
  netPrice: string;
  netPriceUnit: SelectContractNetPrices["netPriceUnit"];
  fromQty: string;
  fromQtyUnit: SelectContractNetPrices["fromQtyUnit"];
  validFrom: string | null;
  validUntil: string | null;
};

export type NetPriceActionResult = {
  netPriceUuid?: string;
  error?: string;
  success?: boolean;
};

const sideCondition = (side: NetPriceSide) =>
  or(...SIDE_ROLES[side].map((role) => eq(Contracts.role, role)));

// The purchase side is what this screen is for, so it stands unless the filter
// says otherwise — the reference reaches it from the Purchase menu.
const netPriceWhere = (query: TableQuery) =>
  tableWhere({
    query,
    search: NET_PRICE_SEARCH,
    filters: NET_PRICE_FILTERS,
    scope:
      (query.filters?.side ?? []).length > 0 ? [] : [sideCondition("purchase")],
  });

/**
 * Every agreed price, joined to its contract, that contract's company and the
 * product it prices. The overview, the export and the detail screen share it.
 */
const netPriceRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<NetPriceRow[]> => {
    const rows = await db
      .select({
        netPrice: ContractNetPrices,
        contractCode: Contracts.code,
        contractDescription: Contracts.description,
        contractRole: Contracts.role,
        companyCode: Companies.id,
        companyName: Companies.companyName,
        companyUuid: Contracts.companyUuid,
        productCode: Products.productCode,
        oldProductCode: Products.oldProductCode,
        productName: Products.name,
        groupProduct: Products.groupProduct,
        stockProduct: Products.stockProduct,
        standardProduct: Products.standardProduct,
        basePrice: Products.basePrice,
        groupName: ProductGroups.name,
        groupParentUuid: ProductGroups.parentUuid,
        parentName: ParentGroups.name,
        preferredSupplier: preferredSupplierName,
        supplierProductCode,
      })
      .from(ContractNetPrices)
      .innerJoin(Contracts, eq(ContractNetPrices.contractUuid, Contracts.uuid))
      .leftJoin(Companies, eq(Contracts.companyUuid, Companies.uuid))
      .innerJoin(Products, eq(ContractNetPrices.productUuid, Products.uuid))
      .leftJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
      .leftJoin(ParentGroups, eq(ProductGroups.parentUuid, ParentGroups.uuid))
      .where(netPriceWhere(query))
      .orderBy(
        ...tableOrderBy(
          NET_PRICE_SORTABLE,
          query,
          [
            asc(Contracts.code),
            asc(Products.productCode),
            asc(ContractNetPrices.fromQty),
          ],
          ContractNetPrices.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    return rows.map((row) => ({
      ...row.netPrice,
      contractCode: row.contractCode,
      contractDescription: row.contractDescription,
      contractRole: row.contractRole,
      companyCode: row.companyCode,
      companyName: row.companyName,
      companyUuid: row.companyUuid,
      productCode: row.productCode,
      oldProductCode: row.oldProductCode,
      productName: row.productName,
      groupProduct: row.groupProduct,
      stockProduct: row.stockProduct,
      standardProduct: row.standardProduct,
      basePrice: row.basePrice,
      mainGroup: row.groupParentUuid ? row.parentName : row.groupName,
      subGroup: row.groupParentUuid ? row.groupName : null,
      preferredSupplier: row.preferredSupplier,
      supplierProductCode: row.supplierProductCode,
    }));
  };

/** Every net price the current view matches, as a workbook. */
export const exportNetPrices = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Net prices",
    columns: NET_PRICE_COLUMNS,
    columnKeys,
    rows: netPriceRows(parseTableQuery(params)),
  });

export const getNetPrices = async (
  query: TableQuery,
): Promise<Paged<NetPriceRow>> => {
  try {
    return await runPaged(query, {
      rows: netPriceRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(ContractNetPrices)
          .innerJoin(
            Contracts,
            eq(ContractNetPrices.contractUuid, Contracts.uuid),
          )
          .leftJoin(Companies, eq(Contracts.companyUuid, Companies.uuid))
          .innerJoin(Products, eq(ContractNetPrices.productUuid, Products.uuid))
          .where(netPriceWhere(query));
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch net prices"));
  }
};

/**
 * One agreed net price with its contract, the company that contract is with,
 * the product and the product's group and preferred supplier.
 */
export const getNetPriceDetail = async (
  uuid: string,
): Promise<NetPriceRow | null> => {
  try {
    const [found] = await db
      .select({
        netPrice: ContractNetPrices,
        contractCode: Contracts.code,
        contractDescription: Contracts.description,
        contractRole: Contracts.role,
        companyCode: Companies.id,
        companyName: Companies.companyName,
        companyUuid: Contracts.companyUuid,
        productCode: Products.productCode,
        oldProductCode: Products.oldProductCode,
        productName: Products.name,
        groupProduct: Products.groupProduct,
        stockProduct: Products.stockProduct,
        standardProduct: Products.standardProduct,
        basePrice: Products.basePrice,
        groupName: ProductGroups.name,
        groupParentUuid: ProductGroups.parentUuid,
        parentName: ParentGroups.name,
        preferredSupplier: preferredSupplierName,
        supplierProductCode,
      })
      .from(ContractNetPrices)
      .innerJoin(Contracts, eq(ContractNetPrices.contractUuid, Contracts.uuid))
      .leftJoin(Companies, eq(Contracts.companyUuid, Companies.uuid))
      .innerJoin(Products, eq(ContractNetPrices.productUuid, Products.uuid))
      .leftJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
      .leftJoin(ParentGroups, eq(ProductGroups.parentUuid, ParentGroups.uuid))
      .where(eq(ContractNetPrices.uuid, uuid))
      .limit(1);

    if (!found) {
      return null;
    }

    return {
      ...found.netPrice,
      contractCode: found.contractCode,
      contractDescription: found.contractDescription,
      contractRole: found.contractRole,
      companyCode: found.companyCode,
      companyName: found.companyName,
      companyUuid: found.companyUuid,
      productCode: found.productCode,
      oldProductCode: found.oldProductCode,
      productName: found.productName,
      groupProduct: found.groupProduct,
      stockProduct: found.stockProduct,
      standardProduct: found.standardProduct,
      basePrice: found.basePrice,
      mainGroup: found.groupParentUuid ? found.parentName : found.groupName,
      subGroup: found.groupParentUuid ? found.groupName : null,
      preferredSupplier: found.preferredSupplier,
      supplierProductCode: found.supplierProductCode,
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch net price"));
  }
};

// What a price of this size means against the product's list price, kept so the
// overview can explain the number without re-deriving it.
const discountAgainstBasePrice = async (
  productUuid: string,
  netPrice: number,
): Promise<string> => {
  const [product] = await db
    .select({ basePrice: Products.basePrice })
    .from(Products)
    .where(eq(Products.uuid, productUuid))
    .limit(1);

  const basePrice = Number(product?.basePrice ?? 0);
  return moneyString(
    basePrice > 0 ? (1 - netPrice / basePrice) * 100 : 0,
  );
};

// An agreed price is a promise about one product at one quantity break, so the
// same contract cannot hold two of them.
const netPriceProblem = async (
  input: NetPriceInput,
  ignoreUuid?: string,
): Promise<string | null> => {
  if (!input.contractUuid) {
    return "Choose the contract this price was agreed under.";
  }
  if (!input.productUuid) {
    return "Choose the product this price is for.";
  }
  if (!Number.isFinite(Number(input.netPrice)) || Number(input.netPrice) < 0) {
    return "Enter the agreed price.";
  }
  if (!Number.isFinite(Number(input.fromQty)) || Number(input.fromQty) < 0) {
    return "Enter the quantity this price applies from.";
  }
  if (
    input.validFrom &&
    input.validUntil &&
    input.validUntil < input.validFrom
  ) {
    return "The price cannot stop being valid before it starts.";
  }

  const [duplicate] = await db
    .select({ uuid: ContractNetPrices.uuid })
    .from(ContractNetPrices)
    .where(
      and(
        eq(ContractNetPrices.contractUuid, input.contractUuid),
        eq(ContractNetPrices.productUuid, input.productUuid),
        eq(ContractNetPrices.fromQty, Number(input.fromQty).toFixed(3)),
        ignoreUuid ? ne(ContractNetPrices.uuid, ignoreUuid) : undefined,
      ),
    )
    .limit(1);

  return duplicate
    ? "This contract already prices that product at that quantity."
    : null;
};

export const createNetPrice = async (
  input: NetPriceInput,
): Promise<NetPriceActionResult> => {
  const uuid = generateUuid();
  try {
    const problem = await netPriceProblem(input);
    if (problem) {
      return { error: problem };
    }

    await db.insert(ContractNetPrices).values({
      uuid,
      contractUuid: input.contractUuid,
      productUuid: input.productUuid,
      netPrice: moneyString(Number(input.netPrice)),
      netPriceUnit: input.netPriceUnit,
      discountPercent: await discountAgainstBasePrice(
        input.productUuid,
        Number(input.netPrice),
      ),
      fromQty: Number(input.fromQty).toFixed(3),
      fromQtyUnit: input.fromQtyUnit,
      validFrom: input.validFrom,
      validUntil: input.validUntil,
    });
  } catch (error) {
    return { error: describeError(error, "Failed to save the net price") };
  }

  revalidatePath("/net-prices");
  redirect(`/net-prices/${uuid}`);
};

export const updateNetPrice = async (
  uuid: string,
  input: NetPriceInput,
): Promise<NetPriceActionResult> => {
  try {
    const problem = await netPriceProblem(input, uuid);
    if (problem) {
      return { error: problem };
    }

    await db
      .update(ContractNetPrices)
      .set({
        contractUuid: input.contractUuid,
        productUuid: input.productUuid,
        netPrice: moneyString(Number(input.netPrice)),
        netPriceUnit: input.netPriceUnit,
        discountPercent: await discountAgainstBasePrice(
          input.productUuid,
          Number(input.netPrice),
        ),
        fromQty: Number(input.fromQty).toFixed(3),
        fromQtyUnit: input.fromQtyUnit,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
      })
      .where(eq(ContractNetPrices.uuid, uuid));
  } catch (error) {
    return { error: describeError(error, "Failed to save the net price") };
  }

  revalidatePath("/net-prices");
  revalidatePath(`/net-prices/${uuid}`);
  redirect(`/net-prices/${uuid}`);
};

export const deleteNetPrice = async (
  uuid: string,
): Promise<NetPriceActionResult> => {
  try {
    await db
      .delete(ContractNetPrices)
      .where(eq(ContractNetPrices.uuid, uuid));
  } catch (error) {
    return { error: describeError(error, "Failed to delete the net price") };
  }

  revalidatePath("/net-prices");
  redirect("/net-prices");
};
