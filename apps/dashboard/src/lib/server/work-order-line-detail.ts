import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import {
  OrderItemOptions,
  SelectOrderItemOptions,
} from "@/db/schema/order-item-options";
import { OrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { SalesOptions, SelectSalesOptions } from "@/db/schema/sales-options";
import { SelectStock, Stock } from "@/db/schema/stock";
import {
  SelectTextCategories,
  TextCategories,
} from "@/db/schema/text-categories";
import { SelectTexts, Texts } from "@/db/schema/texts";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { eq, or } from "drizzle-orm";

export type LineStockRow = {
  uuid: SelectStock["uuid"];
  locationName: SelectWarehouses["name"] | null;
  productName: SelectProducts["name"] | null;
  lengthMm: SelectStock["lengthMm"];
  widthMm: SelectStock["widthMm"];
  thicknessMm: SelectStock["thicknessMm"];
  // Technical is what stands on the shelf, reserved is what is spoken for, and
  // available is the difference — which goes negative when more has been
  // promised than held, and is left that way rather than clamped.
  technical: number;
  reserved: number;
  available: number;
  charge: SelectStock["charge"];
  internalCharge: SelectStock["internalCharge"];
  quality: SelectStock["quality"];
  remark: SelectStock["remark"];
};

/** The sales order behind the line, as the floor needs to read it. */
export type LineOrderContext = {
  orderUuid: SelectOrders["uuid"];
  orderNumber: SelectOrders["id"];
  companyUuid: SelectCompanies["uuid"] | null;
  companyName: SelectCompanies["companyName"] | null;
  status: SelectOrders["status"];
  deliveryDate: SelectOrders["deliveryDate"];
  customerRef: SelectOrders["customerRef"];
  seller: SelectOrders["seller"];
  contactName: string | null;
  telephone: SelectContacts["telephone"] | null;
  deliveryAddress: string | null;
};

export type LineOptionRow = {
  uuid: SelectOrderItemOptions["uuid"];
  // The order the options were added in. No column records it, so it is the
  // row's position rather than a stored sequence — enough to keep a two-step
  // finish in the order somebody meant it, which is what the floor reads it for.
  sequenceNumber: number;
  name: SelectSalesOptions["name"] | null;
  code: SelectSalesOptions["code"] | null;
  quantity: SelectOrderItemOptions["quantity"];
  unit: SelectOrderItemOptions["unit"];
};

export type LineTextRow = {
  uuid: SelectTexts["uuid"];
  categoryName: SelectTextCategories["name"] | null;
  title: SelectTexts["title"];
  textBlock: SelectTexts["textBlock"];
};

/** Everything the Details panel shows for one line, in one round trip. */
export type LineDetail = {
  stock: LineStockRow[];
  order: LineOrderContext | null;
  options: LineOptionRow[];
  texts: LineTextRow[];
};

type WorkOrderLineDetailParams = {
  productUuid: string | null;
  orderItemUuid: string | null;
};

/**
 * The Details panel behind a work-order line: where else this product is
 * standing, the order it is for, what was sold with it, and anything noted
 * against the order or the customer.
 *
 * A warehouse line and a production line show the same four tabs, because the
 * question the floor is asking is the same either way — what am I holding, who
 * is it for, what has to happen to it, and is there anything I should know. So
 * one query serves both rather than two drifting apart.
 */
export const getWorkOrderLineDetail = async ({
  productUuid,
  orderItemUuid,
}: WorkOrderLineDetailParams): Promise<LineDetail> => {
  // Sequential rather than concurrent: this database caps connections.
  const stockRows = productUuid
    ? await db
        .select({
          uuid: Stock.uuid,
          locationName: Warehouses.name,
          productName: Products.name,
          lengthMm: Stock.lengthMm,
          widthMm: Stock.widthMm,
          thicknessMm: Stock.thicknessMm,
          quantity: Stock.quantity,
          reservedQuantity: Stock.reservedQuantity,
          charge: Stock.charge,
          internalCharge: Stock.internalCharge,
          quality: Stock.quality,
          remark: Stock.remark,
        })
        .from(Stock)
        .leftJoin(Warehouses, eq(Stock.locationUuid, Warehouses.uuid))
        .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
        .where(eq(Stock.productUuid, productUuid))
        .orderBy(Warehouses.name, Stock.charge)
    : [];

  const stock: LineStockRow[] = stockRows.map((row) => {
    const technical = Number(row.quantity ?? 0);
    const reserved = Number(row.reservedQuantity ?? 0);
    return {
      uuid: row.uuid,
      locationName: row.locationName ?? null,
      productName: row.productName ?? null,
      lengthMm: row.lengthMm,
      widthMm: row.widthMm,
      thicknessMm: row.thicknessMm,
      technical,
      reserved,
      // Deliberately not clamped: more can be promised than held, and hiding
      // that would tell the floor there is stock to pick when there is not.
      available: technical - reserved,
      charge: row.charge,
      internalCharge: row.internalCharge,
      quality: row.quality,
      remark: row.remark,
    };
  });

  if (!orderItemUuid) {
    return { stock, order: null, options: [], texts: [] };
  }

  const [orderRow] = await db
    .select({
      orderUuid: Orders.uuid,
      orderNumber: Orders.id,
      companyUuid: Companies.uuid,
      companyName: Companies.companyName,
      status: Orders.status,
      deliveryDate: Orders.deliveryDate,
      customerRef: Orders.customerRef,
      seller: Orders.seller,
      firstName: Contacts.firstName,
      lastName: Contacts.lastName,
      telephone: Contacts.telephone,
      street: CompanyAddresses.streetAndNo,
      postalCode: CompanyAddresses.postalCode,
      city: CompanyAddresses.city,
      country: CompanyAddresses.country,
    })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .leftJoin(Contacts, eq(Orders.contactUuid, Contacts.uuid))
    .leftJoin(
      CompanyAddresses,
      eq(Orders.deliveryAddressUuid, CompanyAddresses.uuid),
    )
    .where(eq(OrderItems.uuid, orderItemUuid))
    .limit(1);

  const optionRows = await db
    .select({
      uuid: OrderItemOptions.uuid,
      name: SalesOptions.name,
      code: SalesOptions.code,
      quantity: OrderItemOptions.quantity,
      unit: OrderItemOptions.unit,
    })
    .from(OrderItemOptions)
    .leftJoin(SalesOptions, eq(OrderItemOptions.optionUuid, SalesOptions.uuid))
    .where(eq(OrderItemOptions.orderItemUuid, orderItemUuid))
    .orderBy(OrderItemOptions.id);

  // A note reaches the floor either because it was written on this order or
  // because it stands against the customer for every order they place — the
  // goods-reception hours on a delivery address are the second kind.
  const textRows = orderRow
    ? await db
        .select({
          uuid: Texts.uuid,
          categoryName: TextCategories.name,
          title: Texts.title,
          textBlock: Texts.textBlock,
        })
        .from(Texts)
        .leftJoin(
          TextCategories,
          eq(Texts.textCategoryUuid, TextCategories.uuid),
        )
        .where(
          orderRow.companyUuid
            ? or(
                eq(Texts.orderUuid, orderRow.orderUuid),
                eq(Texts.companyUuid, orderRow.companyUuid),
              )
            : eq(Texts.orderUuid, orderRow.orderUuid),
        )
        .orderBy(Texts.sequenceNumber, Texts.id)
    : [];

  const contactName =
    [orderRow?.firstName, orderRow?.lastName].filter(Boolean).join(" ") || null;

  const deliveryAddress =
    [
      orderRow?.street,
      [orderRow?.postalCode, orderRow?.city].filter(Boolean).join(" "),
      orderRow?.country,
    ]
      .filter((part) => part && part.trim() !== "")
      .join(", ") || null;

  return {
    stock,
    order: orderRow
      ? {
          orderUuid: orderRow.orderUuid,
          orderNumber: orderRow.orderNumber,
          companyUuid: orderRow.companyUuid ?? null,
          companyName: orderRow.companyName ?? null,
          status: orderRow.status,
          deliveryDate: orderRow.deliveryDate,
          customerRef: orderRow.customerRef,
          seller: orderRow.seller,
          contactName,
          telephone: orderRow.telephone ?? null,
          deliveryAddress,
        }
      : null,
    options: optionRows.map((row, index) => ({
      uuid: row.uuid,
      sequenceNumber: (index + 1) * 10,
      name: row.name ?? null,
      code: row.code ?? null,
      quantity: row.quantity,
      unit: row.unit,
    })),
    texts: textRows.map((row) => ({
      uuid: row.uuid,
      categoryName: row.categoryName ?? null,
      title: row.title,
      textBlock: row.textBlock,
    })),
  };
};
