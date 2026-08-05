"use server";

import {
  CounterOrderActionResult,
  CounterOrderInput,
} from "@/app/(dashboard)/counter-orders/actions";
import {
  formValuesToCounterOrderExtras,
  formValuesToCounterOrderInput,
} from "@/app/(dashboard)/counter-orders/mappers";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import {
  Companies,
  Contracts,
  CounterOrderItems,
  CounterOrders,
  CounterOrderSurcharges,
  db,
  SelectCompanies,
  SelectContracts,
  SelectCounterOrderItems,
  SelectCounterOrders,
  SelectCounterOrderSurcharges,
  SelectTexts,
  Texts,
} from "@/db";
import { describeError, generateUuid } from "@/lib/helpers";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CounterOrderEditData = SelectCounterOrders & {
  surcharges: SelectCounterOrderSurcharges[];
  texts: SelectTexts[];
  contracts: SelectContracts[];
  items: SelectCounterOrderItems[];
};

export type CounterOrderEditOverview = {
  order: SelectCounterOrders;
  companyName: SelectCompanies["companyName"] | null;
  counts: {
    items: number;
    surcharges: number;
    texts: number;
    contracts: number;
    documents: number;
  };
};

// Which columns each section owns, so saving one never carries a half-finished
// edit from another along with it.
const SECTION_COLUMNS = {
  header: [
    "companyUuid",
    "contactUuid",
    "customerRef",
    "leaveCustomer",
    "orderMethod",
    "ourReference",
    "seller",
    "projectUuid",
    "status",
    "priority",
    "priceDate",
    "orderDate",
  ],
  orderType: [
    "handlingBlocked",
    "printPickingSlips",
    "isPickup",
    "isIncidental",
    "isOverlength",
    "isPrinted",
    "isMailed",
    "isFaxed",
  ],
  delivery: [
    "deliveryTerms",
    "deliveryAddressUuid",
    "deliveryDate",
    "deliveryRemark",
  ],
  logistics: [
    "completeDelivery",
    "transportBlockage",
    "vehicleWithCrane",
    "vehicleWithCanopy",
    "bundlingSeparate",
    "transportRegion",
    "maxLengthMm",
    "maxBundleWeightKg",
    "deliveryAfterTime",
    "deliverForTime",
    "transportMode",
  ],
  finances: [
    "showNetPrice",
    "scrapSurchargeSeparate",
    "calculateVatIfApplicable",
    "financialBlockage",
    "invoiceBlockage",
    "onlyTotalAmountOnInvoice",
    "includeOptionPricesInMaterialPrices",
    "paymentTerms",
    "billingAddressUuid",
    "blockingReason",
  ],
  summary: ["amountExVat", "weightKg", "gainPercent", "remarks"],
  documents: ["documents"],
} as const satisfies Record<string, readonly (keyof CounterOrderInput)[]>;

const pickColumns = <K extends keyof CounterOrderInput>(
  input: CounterOrderInput,
  keys: readonly K[],
): Pick<CounterOrderInput, K> =>
  Object.fromEntries(keys.map((key) => [key, input[key]])) as Pick<
    CounterOrderInput,
    K
  >;

export const getCounterOrderForEdit = async (
  uuid: string,
): Promise<CounterOrderEditData | null> => {
  try {
    const [order] = await db
      .select()
      .from(CounterOrders)
      .where(eq(CounterOrders.uuid, uuid))
      .limit(1);

    if (!order) {
      return null;
    }

    const [surcharges, texts, contracts, items] = await Promise.all([
      db
        .select()
        .from(CounterOrderSurcharges)
        .where(eq(CounterOrderSurcharges.counterOrderUuid, uuid)),
      db.select().from(Texts).where(eq(Texts.counterOrderUuid, uuid)),
      db.select().from(Contracts).where(eq(Contracts.counterOrderUuid, uuid)),
      db
        .select()
        .from(CounterOrderItems)
        .where(eq(CounterOrderItems.counterOrderUuid, uuid))
        .orderBy(CounterOrderItems.lineNumber),
    ]);

    return { ...order, surcharges, texts, contracts, items };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch the counter order"));
  }
};

export const getCounterOrderEditOverview = async (
  uuid: string,
): Promise<CounterOrderEditOverview | null> => {
  const order = await getCounterOrderForEdit(uuid);

  if (!order) {
    return null;
  }

  const { surcharges, texts, contracts, items, ...row } = order;

  const [company] = await db
    .select({ companyName: Companies.companyName })
    .from(Companies)
    .where(eq(Companies.uuid, row.companyUuid))
    .limit(1);

  return {
    order: row,
    companyName: company?.companyName ?? null,
    counts: {
      items: items.length,
      surcharges: surcharges.length,
      texts: texts.length,
      contracts: contracts.length,
      documents: (row.documents ?? []).length,
    },
  };
};

const saveSection = async (
  uuid: string,
  columns: Partial<CounterOrderInput>,
): Promise<CounterOrderActionResult> => {
  try {
    await db
      .update(CounterOrders)
      .set(columns)
      .where(eq(CounterOrders.uuid, uuid));
  } catch (error) {
    return { error: describeError(error, "Failed to update counter order") };
  }

  revalidatePath("/counter-orders");
  revalidatePath(`/counter-orders/${uuid}/edit`);
  redirect(`/counter-orders/${uuid}/edit`);
};

export const updateCounterOrderHeader = async (
  uuid: string,
  values: CounterOrderFormValues,
): Promise<CounterOrderActionResult> =>
  saveSection(
    uuid,
    pickColumns(formValuesToCounterOrderInput(values), SECTION_COLUMNS.header),
  );

export const updateCounterOrderType = async (
  uuid: string,
  values: CounterOrderFormValues,
): Promise<CounterOrderActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToCounterOrderInput(values),
      SECTION_COLUMNS.orderType,
    ),
  );

export const updateCounterOrderDelivery = async (
  uuid: string,
  values: CounterOrderFormValues,
): Promise<CounterOrderActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToCounterOrderInput(values),
      SECTION_COLUMNS.delivery,
    ),
  );

export const updateCounterOrderLogistics = async (
  uuid: string,
  values: CounterOrderFormValues,
): Promise<CounterOrderActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToCounterOrderInput(values),
      SECTION_COLUMNS.logistics,
    ),
  );

export const updateCounterOrderFinances = async (
  uuid: string,
  values: CounterOrderFormValues,
): Promise<CounterOrderActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToCounterOrderInput(values),
      SECTION_COLUMNS.finances,
    ),
  );

export const updateCounterOrderSummary = async (
  uuid: string,
  values: CounterOrderFormValues,
): Promise<CounterOrderActionResult> =>
  saveSection(
    uuid,
    pickColumns(formValuesToCounterOrderInput(values), SECTION_COLUMNS.summary),
  );

export const updateCounterOrderDocuments = async (
  uuid: string,
  values: CounterOrderFormValues,
): Promise<CounterOrderActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToCounterOrderInput(values),
      SECTION_COLUMNS.documents,
    ),
  );

export const updateCounterOrderLines = async (
  uuid: string,
  values: CounterOrderFormValues,
): Promise<CounterOrderActionResult> => {
  const { items } = formValuesToCounterOrderExtras(values);

  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(CounterOrderItems)
        .where(eq(CounterOrderItems.counterOrderUuid, uuid));

      if (items.length > 0) {
        await tx.insert(CounterOrderItems).values(
          items.map((item, index) => ({
            ...item,
            uuid: generateUuid(),
            counterOrderUuid: uuid,
            // Numbering in tens leaves room to slot a line in between later
            // without renumbering everything below it.
            lineNumber: (index + 1) * 10,
          })),
        );
      }
    });
  } catch (error) {
    return {
      error: describeError(error, "Failed to update counter order lines"),
    };
  }

  revalidatePath("/counter-orders");
  revalidatePath(`/counter-orders/${uuid}/edit`);
  redirect(`/counter-orders/${uuid}/edit`);
};

export const updateCounterOrderSurcharges = async (
  uuid: string,
  values: CounterOrderFormValues,
): Promise<CounterOrderActionResult> => {
  const { surcharges } = formValuesToCounterOrderExtras(values);

  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(CounterOrderSurcharges)
        .where(eq(CounterOrderSurcharges.counterOrderUuid, uuid));

      if (surcharges.length > 0) {
        await tx.insert(CounterOrderSurcharges).values(
          surcharges.map((surcharge) => ({
            ...surcharge,
            uuid: generateUuid(),
            counterOrderUuid: uuid,
          })),
        );
      }
    });
  } catch (error) {
    return {
      error: describeError(error, "Failed to update counter order surcharges"),
    };
  }

  revalidatePath("/counter-orders");
  revalidatePath(`/counter-orders/${uuid}/edit`);
  redirect(`/counter-orders/${uuid}/edit`);
};

export const updateCounterOrderTexts = async (
  uuid: string,
  values: CounterOrderFormValues,
): Promise<CounterOrderActionResult> => {
  const { texts } = formValuesToCounterOrderExtras(values);

  try {
    const [order] = await db
      .select({ companyUuid: CounterOrders.companyUuid })
      .from(CounterOrders)
      .where(eq(CounterOrders.uuid, uuid))
      .limit(1);

    if (!order) {
      return { error: "Counter order not found." };
    }

    await db.transaction(async (tx) => {
      await tx.delete(Texts).where(eq(Texts.counterOrderUuid, uuid));

      if (texts.length > 0) {
        await tx.insert(Texts).values(
          texts.map((text) => ({
            uuid: generateUuid(),
            counterOrderUuid: uuid,
            companyUuid: order.companyUuid,
            title: text.title,
            textBlock: text.textBlock,
            textCategoryUuid: text.textCategoryUuid ?? null,
          })),
        );
      }
    });
  } catch (error) {
    return {
      error: describeError(error, "Failed to update counter order texts"),
    };
  }

  revalidatePath("/counter-orders");
  revalidatePath(`/counter-orders/${uuid}/edit`);
  redirect(`/counter-orders/${uuid}/edit`);
};

export const updateCounterOrderContracts = async (
  uuid: string,
  values: CounterOrderFormValues,
): Promise<CounterOrderActionResult> => {
  try {
    await db.transaction(async (tx) => {
      // A contract points at the counter order rather than the other way
      // round, so detaching means clearing the pointer on the ones dropped —
      // not deleting the contract itself.
      await tx
        .update(Contracts)
        .set({ counterOrderUuid: null })
        .where(eq(Contracts.counterOrderUuid, uuid));

      if (values.contractUuids.length > 0) {
        await tx
          .update(Contracts)
          .set({ counterOrderUuid: uuid })
          .where(inArray(Contracts.uuid, values.contractUuids));
      }
    });
  } catch (error) {
    return {
      error: describeError(error, "Failed to update counter order contracts"),
    };
  }

  revalidatePath("/counter-orders");
  revalidatePath("/contracts");
  revalidatePath(`/counter-orders/${uuid}/edit`);
  redirect(`/counter-orders/${uuid}/edit`);
};
