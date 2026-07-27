"use server";

import {
  CompanyActionResult,
  CustomerSalesInput,
} from "@/app/(dashboard)/companies/actions";
import { db, SelectCompanies } from "@/db";
import { Companies } from "@/db/schema/companies";
import { describeError } from "@/lib/helpers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { companySalesSchema, CompanySalesFormValues } from "./validation";

// The columns this section owns are exactly the ones the legacy Sales dialog
// edited — keyof CustomerSalesInput keeps this Pick in sync with that list.
export type CompanySalesData = Pick<
  SelectCompanies,
  "uuid" | keyof CustomerSalesInput
>;

export type UpdateCompanySalesPayload = CompanySalesFormValues & {
  companyUuid: string;
};

export const getCompanySales = async (
  companyUuid: string,
): Promise<CompanySalesData | null> => {
  const [company] = await db
    .select({
      uuid: Companies.uuid,
      customerGroup: Companies.customerGroup,
      representative: Companies.representative,
      accountManager: Companies.accountManager,
      region: Companies.region,
      memberOf: Companies.memberOf,
      miscellaneousSettings: Companies.miscellaneousSettings,
      deliveryCondition: Companies.deliveryCondition,
      devTheorWt: Companies.devTheorWt,
      defTransport: Companies.defTransport,
      quoteOrderSettings: Companies.quoteOrderSettings,
      groupLinesByLongProductGroupDescription:
        Companies.groupLinesByLongProductGroupDescription,
      printProductCodesOnOutgoingDocuments:
        Companies.printProductCodesOnOutgoingDocuments,
      quoteOrderInvoiceSettings: Companies.quoteOrderInvoiceSettings,
      orderSettings: Companies.orderSettings,
      quoteSettings: Companies.quoteSettings,
      websiteQuoteMustBeApproved: Companies.websiteQuoteMustBeApproved,
      websiteQuoteApprovalAmount: Companies.websiteQuoteApprovalAmount,
      releaseActionPrint: Companies.releaseActionPrint,
      releaseActionEmailEnabled: Companies.releaseActionEmailEnabled,
      releaseActionEmailTo: Companies.releaseActionEmailTo,
      releaseActionFaxEnabled: Companies.releaseActionFaxEnabled,
      releaseActionFaxTo: Companies.releaseActionFaxTo,
      actionPrint: Companies.actionPrint,
      actionEmailEnabled: Companies.actionEmailEnabled,
      actionEmailTo: Companies.actionEmailTo,
      actionFaxEnabled: Companies.actionFaxEnabled,
      actionFaxTo: Companies.actionFaxTo,
      ediSettings: Companies.ediSettings,
    })
    .from(Companies)
    .where(eq(Companies.uuid, companyUuid))
    .limit(1);

  return company ?? null;
};

// Updates only the sales columns this section owns — other sections' fields
// (and all child collections) are untouched, so concurrent edits elsewhere
// can't be clobbered. An empty input intentionally clears its column.
export const updateCompanySales = async (
  _prevState: CompanyActionResult,
  payload: UpdateCompanySalesPayload,
): Promise<CompanyActionResult> => {
  const { companyUuid, ...values } = payload;
  const parsed = companySalesSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid sales settings — check the fields and try again" };
  }

  try {
    await db
      .update(Companies)
      .set({
        customerGroup: parsed.data.customerGroup || null,
        representative: parsed.data.representative || null,
        accountManager: parsed.data.accountManager || null,
        region: parsed.data.region || null,
        memberOf: parsed.data.memberOf || null,
        miscellaneousSettings: parsed.data.miscellaneousSettings,
        deliveryCondition: parsed.data.deliveryCondition || null,
        devTheorWt: parsed.data.devTheorWt || null,
        defTransport: parsed.data.defTransport || null,
        quoteOrderSettings: parsed.data.quoteOrderSettings,
        groupLinesByLongProductGroupDescription:
          parsed.data.groupLinesByLongProductGroupDescription || null,
        printProductCodesOnOutgoingDocuments:
          parsed.data.printProductCodesOnOutgoingDocuments || null,
        quoteOrderInvoiceSettings: parsed.data.quoteOrderInvoiceSettings,
        orderSettings: parsed.data.orderSettings,
        quoteSettings: parsed.data.quoteSettings,
        websiteQuoteMustBeApproved: parsed.data.websiteQuoteMustBeApproved,
        websiteQuoteApprovalAmount:
          parsed.data.websiteQuoteApprovalAmount || null,
        releaseActionPrint: parsed.data.releaseActionPrint,
        releaseActionEmailEnabled: parsed.data.releaseActionEmailEnabled,
        releaseActionEmailTo: parsed.data.releaseActionEmailTo || null,
        releaseActionFaxEnabled: parsed.data.releaseActionFaxEnabled,
        releaseActionFaxTo: parsed.data.releaseActionFaxTo || null,
        actionPrint: parsed.data.actionPrint,
        actionEmailEnabled: parsed.data.actionEmailEnabled,
        actionEmailTo: parsed.data.actionEmailTo || null,
        actionFaxEnabled: parsed.data.actionFaxEnabled,
        actionFaxTo: parsed.data.actionFaxTo || null,
        ediSettings: parsed.data.ediSettings,
      })
      .where(eq(Companies.uuid, companyUuid));
  } catch (error) {
    return { error: describeError(error, "Failed to update sales settings") };
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${companyUuid}`);
  revalidatePath(`/companies/${companyUuid}/edit/sales`);
  revalidatePath(`/companies/${companyUuid}/edit`);
  redirect(`/companies/${companyUuid}/edit`);
};
