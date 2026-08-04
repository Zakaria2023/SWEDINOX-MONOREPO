"use server";

import {
  db,
  Companies,
  CompanyAddresses,
  CounterOrders,
  Orders,
  ProductGroups,
  PurchaseOrders,
  PurchaseQuotes,
  PurchaseRequests,
  PurchaseReturnOrders,
  Quotes,
  ReturnOrders,
  TextCategories,
  Texts,
  SelectCounterOrders,
  SelectOrders,
  SelectProductGroups,
  SelectPurchaseOrders,
  SelectPurchaseQuotes,
  SelectPurchaseRequests,
  SelectPurchaseReturnOrders,
  SelectQuotes,
  SelectReturnOrders,
  SelectTexts,
  SelectCompanies,
  SelectCompanyAddresses,
  SelectTextCategories,
} from "@/db";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type TextListItem = SelectTexts & {
  companyId: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  roles: SelectCompanies["roles"] | null;
  city: SelectCompanyAddresses["city"] | null;
  textCategoryName: SelectTextCategories["name"] | null;
};

export type TextDetail = SelectTexts & {
  companyId: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  roles: SelectCompanies["roles"] | null;
  textCategoryName: SelectTextCategories["name"] | null;
  textCategoryDescription: SelectTextCategories["description"] | null;
  productGroupName: SelectProductGroups["name"] | null;
  orderId: SelectOrders["id"] | null;
  counterOrderId: SelectCounterOrders["id"] | null;
  returnOrderId: SelectReturnOrders["id"] | null;
  purchaseReturnOrderId: SelectPurchaseReturnOrders["id"] | null;
  quoteId: SelectQuotes["id"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  purchaseQuoteId: SelectPurchaseQuotes["id"] | null;
  purchaseRequestId: SelectPurchaseRequests["id"] | null;
};

export const getTexts = async (): Promise<TextListItem[]> =>
  db
    .select({
      ...getTableColumns(Texts),
      companyId: Companies.id,
      companyName: Companies.companyName,
      roles: Companies.roles,
      city: CompanyAddresses.city,
      textCategoryName: TextCategories.name,
    })
    .from(Texts)
    .leftJoin(Companies, eq(Companies.uuid, Texts.companyUuid))
    .leftJoin(
      CompanyAddresses,
      eq(CompanyAddresses.companyUuid, Texts.companyUuid),
    )
    .leftJoin(TextCategories, eq(TextCategories.uuid, Texts.textCategoryUuid))
    .orderBy(desc(Texts.createdAt));

/**
 * One text block with everything recorded on it: the company and document it is
 * attached to, its category, and the raw text itself. Every document a text can
 * hang off is joined, because a text carries at most one of them and which one
 * is what says where it will be printed.
 */
export const getTextDetail = async (
  uuid: string,
): Promise<TextDetail | null> => {
  const [row] = await db
    .select({
      ...getTableColumns(Texts),
      companyId: Companies.id,
      companyName: Companies.companyName,
      roles: Companies.roles,
      textCategoryName: TextCategories.name,
      textCategoryDescription: TextCategories.description,
      productGroupName: ProductGroups.name,
      orderId: Orders.id,
      counterOrderId: CounterOrders.id,
      returnOrderId: ReturnOrders.id,
      purchaseReturnOrderId: PurchaseReturnOrders.id,
      quoteId: Quotes.id,
      purchaseOrderId: PurchaseOrders.id,
      purchaseQuoteId: PurchaseQuotes.id,
      purchaseRequestId: PurchaseRequests.id,
    })
    .from(Texts)
    .leftJoin(Companies, eq(Companies.uuid, Texts.companyUuid))
    .leftJoin(TextCategories, eq(TextCategories.uuid, Texts.textCategoryUuid))
    .leftJoin(ProductGroups, eq(ProductGroups.uuid, Texts.productGroupUuid))
    .leftJoin(Orders, eq(Orders.uuid, Texts.orderUuid))
    .leftJoin(CounterOrders, eq(CounterOrders.uuid, Texts.counterOrderUuid))
    .leftJoin(ReturnOrders, eq(ReturnOrders.uuid, Texts.returnOrderUuid))
    .leftJoin(
      PurchaseReturnOrders,
      eq(PurchaseReturnOrders.uuid, Texts.purchaseReturnOrderUuid),
    )
    .leftJoin(Quotes, eq(Quotes.uuid, Texts.quoteUuid))
    .leftJoin(PurchaseOrders, eq(PurchaseOrders.uuid, Texts.purchaseOrderUuid))
    .leftJoin(PurchaseQuotes, eq(PurchaseQuotes.uuid, Texts.purchaseQuoteUuid))
    .leftJoin(
      PurchaseRequests,
      eq(PurchaseRequests.uuid, Texts.purchaseRequestUuid),
    )
    .where(eq(Texts.uuid, uuid))
    .limit(1);

  return row ?? null;
};
