"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  ContractNetPrices,
  SelectContractNetPrices,
} from "@/db/schema/contract-net-prices";
import { Contracts, SelectContracts } from "@/db/schema/contracts";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import {
  ProductGroupSuppliers,
  SelectProductGroupSuppliers,
} from "@/db/schema/product-group-suppliers";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  applyPriceDiscounts,
  generateUuid,
  normaliseDiscountTiers,
  resolveTierDiscount,
} from "@/lib/helpers";
import {
  aliasedTable,
  and,
  asc,
  eq,
  gte,
  inArray,
  lte,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type NetPriceFilter = {
  contractCodeFrom?: string;
  contractCodeTo?: string;
  validFrom?: string;
  validUntil?: string;
  companyCode?: number;
};

export type NetPriceRow = SelectContractNetPrices & {
  contractCode: SelectContracts["code"] | null;
  contractDescription: SelectContracts["description"] | null;
  companyCode: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
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

const ParentGroups = aliasedTable(ProductGroups, "parent_groups");
const SupplierCompanies = aliasedTable(Companies, "supplier_companies");

const preferredSupplierName = sql<
  string | null
>`(SELECT ${SupplierCompanies.companyName} FROM ${ProductGroupSuppliers} INNER JOIN ${SupplierCompanies} ON ${SupplierCompanies.uuid} = ${ProductGroupSuppliers.supplierCompanyUuid} WHERE ${ProductGroupSuppliers.productGroupUuid} = ${Products.productGroupUuid} AND ${ProductGroupSuppliers.preferred} = TRUE LIMIT 1)`;

const supplierProductCode = sql<
  string | null
>`(SELECT ${ProductGroupSuppliers.externalProductCode} FROM ${ProductGroupSuppliers} WHERE ${ProductGroupSuppliers.productGroupUuid} = ${Products.productGroupUuid} AND ${ProductGroupSuppliers.preferred} = TRUE LIMIT 1)`;

// Every agreed price, joined to its contract, that contract's company and the
// product it prices. The filters mirror the legacy overview: a contract code
// range, the validity window the price must fall inside, and one company.
export const getNetPrices = async (
  filter: NetPriceFilter = {},
): Promise<NetPriceRow[]> => {
  try {
    const rows = await db
      .select({
        netPrice: ContractNetPrices,
        contractCode: Contracts.code,
        contractDescription: Contracts.description,
        companyCode: Companies.id,
        companyName: Companies.companyName,
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
      .leftJoin(
        ProductGroups,
        eq(Products.productGroupUuid, ProductGroups.uuid),
      )
      .leftJoin(ParentGroups, eq(ProductGroups.parentUuid, ParentGroups.uuid))
      .where(
        and(
          filter.contractCodeFrom
            ? gte(Contracts.code, filter.contractCodeFrom)
            : undefined,
          filter.contractCodeTo
            ? lte(Contracts.code, filter.contractCodeTo)
            : undefined,
          filter.validFrom
            ? gte(ContractNetPrices.validUntil, filter.validFrom)
            : undefined,
          filter.validUntil
            ? lte(ContractNetPrices.validFrom, filter.validUntil)
            : undefined,
          filter.companyCode ? eq(Companies.id, filter.companyCode) : undefined,
        ),
      )
      .orderBy(
        asc(Contracts.code),
        asc(Products.productCode),
        asc(ContractNetPrices.fromQty),
      );

    return rows.map((row) => ({
      ...row.netPrice,
      contractCode: row.contractCode,
      contractDescription: row.contractDescription,
      companyCode: row.companyCode,
      companyName: row.companyName,
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
  } catch {
    throw new Error("Failed to fetch net prices");
  }
};

export type GenerateNetPricesResult = {
  error?: string;
  success?: boolean;
  createdRows?: number;
};

// Prices every customer contract that has no net prices yet.
//
// The products priced are the ones that customer has actually ordered; a
// customer with no order history gets the standard product catalogue. Each
// product is priced from its base price with the contract's own discounts
// applied — the group discount and the line discount stack, and a contract with
// an extra discount takes that off on top. A contract that overrides the gross
// price uses that value as the starting point instead of the product's.
//
// A contract with quantity tiers produces one row per tier, so the overview
// shows the price break the way the contract negotiated it. Contracts that
// already have net prices are skipped, so this can be re-run.
export const generateNetPrices = async (): Promise<GenerateNetPricesResult> => {
  try {
    const contracts = await db
      .select()
      .from(Contracts)
      .where(inArray(Contracts.role, ["customer", "prospect"]));

    if (contracts.length === 0) {
      return { error: "No customer contracts yet. Create one first." };
    }

    const existing = await db
      .select({ contractUuid: ContractNetPrices.contractUuid })
      .from(ContractNetPrices);
    const contractsWithPrices = new Set(
      existing.map((row) => row.contractUuid),
    );

    const emptyContracts = contracts.filter(
      (contract) => !contractsWithPrices.has(contract.uuid),
    );
    if (emptyContracts.length === 0) {
      return { error: "Every customer contract already has net prices." };
    }

    const rows: (typeof ContractNetPrices.$inferInsert)[] = [];

    for (const contract of emptyContracts) {
      const orderedProducts = contract.companyUuid
        ? await db
            .selectDistinct({
              uuid: Products.uuid,
              basePrice: Products.basePrice,
              replacementPrice: Products.replacementPrice,
              priceUnit: Products.priceUnit,
              stockUnit: Products.stockUnit,
            })
            .from(OrderItems)
            .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
            .innerJoin(Products, eq(OrderItems.productUuid, Products.uuid))
            .where(eq(Orders.companyUuid, contract.companyUuid))
        : [];

      const products =
        orderedProducts.length > 0
          ? orderedProducts
          : await db
              .select({
                uuid: Products.uuid,
                basePrice: Products.basePrice,
                replacementPrice: Products.replacementPrice,
                priceUnit: Products.priceUnit,
                stockUnit: Products.stockUnit,
              })
              .from(Products)
              .where(eq(Products.standardProduct, true));

      if (products.length === 0) {
        continue;
      }

      const groupDiscountTiers = contract.groupDiscount
        ? normaliseDiscountTiers(contract.groupDiscountTiers)
        : normaliseDiscountTiers([]);
      const lineDiscountTiers = contract.lineDiscount
        ? normaliseDiscountTiers(contract.lineDiscountTiers)
        : normaliseDiscountTiers([]);
      const extraDiscount = contract.extraDiscount
        ? Number(contract.extraDiscountValue ?? 0)
        : 0;
      const contractGrossPrice = contract.grossPrice
        ? Number(contract.grossPriceValue ?? 0)
        : 0;

      // One row per quantity break the contract negotiated — the union of
      // both tier ladders, so neither discount's break points are lost.
      const thresholds = Array.from(
        new Set([
          ...groupDiscountTiers.map((tier) => tier.from),
          ...lineDiscountTiers.map((tier) => tier.from),
        ]),
      ).sort((a, b) => a - b);

      for (const product of products) {
        const listPrice =
          contractGrossPrice > 0
            ? contractGrossPrice
            : Number(product.basePrice ?? 0) > 0
              ? Number(product.basePrice)
              : Number(product.replacementPrice ?? 0);

        for (const threshold of thresholds) {
          const groupPercent = resolveTierDiscount(
            groupDiscountTiers,
            threshold,
          );
          const linePercent = resolveTierDiscount(lineDiscountTiers, threshold);
          const afterTiers = applyPriceDiscounts(
            listPrice,
            groupPercent,
            linePercent,
          );
          const netPrice = afterTiers * (1 - extraDiscount / 100);
          const totalDiscount =
            listPrice === 0 ? 0 : (1 - netPrice / listPrice) * 100;

          rows.push({
            uuid: generateUuid(),
            contractUuid: contract.uuid,
            productUuid: product.uuid,
            netPrice: netPrice.toFixed(2),
            netPriceUnit: product.priceUnit ?? product.stockUnit,
            discountPercent: totalDiscount.toFixed(2),
            fromQty: threshold.toFixed(3),
            fromQtyUnit: product.stockUnit,
            validFrom: contract.startingDate,
            validUntil: contract.endDate,
          });
        }
      }
    }

    if (rows.length === 0) {
      return {
        error:
          "Nothing to price — the contracts' customers have no order history and there are no standard products.",
      };
    }

    await db.insert(ContractNetPrices).values(rows);

    revalidatePath("/net-prices");
    return { success: true, createdRows: rows.length };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate net prices",
    };
  }
};
