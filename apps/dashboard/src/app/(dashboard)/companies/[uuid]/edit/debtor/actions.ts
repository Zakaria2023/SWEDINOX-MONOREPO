"use server";

import type { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import { db, SelectCompanies } from "@/db";
import { Companies } from "@/db/schema/companies";
import { describeError } from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { companyDebtorSchema, CompanyDebtorFormValues } from "./validation";

// roles rides along so the form can gate the purchase-org fields the same way
// the legacy Debtor section did (customer/prospect only); blockedByUserId maps
// to the isBlocked checkbox exactly like the legacy full editor did.
export type CompanyDebtorData = Pick<
  SelectCompanies,
  | "uuid"
  | "roles"
  | "debtorCompanyUuid"
  | "iban"
  | "bic"
  | "bankAccount"
  | "postbankAccount"
  | "purchaseOrgCompanyUuid"
  | "memberNumberPurchaseOrg"
  | "calculateVat"
  | "reminder"
  | "collectInvoicesInMandate"
  | "insuranceValidUntil"
  | "creditLimitInsurance"
  | "creditLimit"
  | "creditLimitUninsured"
  | "creditLimitUninsuredDate"
  | "paymentTerms"
  | "differentPaymentTermsExWorks"
  | "journalCode"
  | "vatNumber"
  | "cocNumber"
  | "currency"
  | "blockedByUserId"
  | "blockedByNote"
>;

export type UpdateCompanyDebtorPayload = CompanyDebtorFormValues & {
  companyUuid: string;
};

export const getCompanyDebtor = async (
  companyUuid: string,
): Promise<CompanyDebtorData | null> => {
  const [company] = await db
    .select({
      uuid: Companies.uuid,
      roles: Companies.roles,
      debtorCompanyUuid: Companies.debtorCompanyUuid,
      iban: Companies.iban,
      bic: Companies.bic,
      bankAccount: Companies.bankAccount,
      postbankAccount: Companies.postbankAccount,
      purchaseOrgCompanyUuid: Companies.purchaseOrgCompanyUuid,
      memberNumberPurchaseOrg: Companies.memberNumberPurchaseOrg,
      calculateVat: Companies.calculateVat,
      reminder: Companies.reminder,
      collectInvoicesInMandate: Companies.collectInvoicesInMandate,
      insuranceValidUntil: Companies.insuranceValidUntil,
      creditLimitInsurance: Companies.creditLimitInsurance,
      creditLimit: Companies.creditLimit,
      creditLimitUninsured: Companies.creditLimitUninsured,
      creditLimitUninsuredDate: Companies.creditLimitUninsuredDate,
      paymentTerms: Companies.paymentTerms,
      differentPaymentTermsExWorks: Companies.differentPaymentTermsExWorks,
      journalCode: Companies.journalCode,
      vatNumber: Companies.vatNumber,
      cocNumber: Companies.cocNumber,
      currency: Companies.currency,
      blockedByUserId: Companies.blockedByUserId,
      blockedByNote: Companies.blockedByNote,
    })
    .from(Companies)
    .where(eq(Companies.uuid, companyUuid))
    .limit(1);

  return company ?? null;
};

// Updates only the debtor columns this section owns — other sections' fields
// (and all child collections) are untouched. Blocked semantics replicate the
// legacy full-editor save exactly: blockedByUserId becomes the current Clerk
// user id when isBlocked is checked and null when it isn't. Like the legacy
// submit, the purchase-org columns are only written for customer/prospect
// companies.
export const updateCompanyDebtor = async (
  _prevState: CompanyActionResult,
  payload: UpdateCompanyDebtorPayload,
): Promise<CompanyActionResult> => {
  const { companyUuid, ...values } = payload;
  const parsed = companyDebtorSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid debtor details — check the fields and try again" };
  }

  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return { error: "User not authenticated" };
    }

    const [company] = await db
      .select({ roles: Companies.roles })
      .from(Companies)
      .where(eq(Companies.uuid, companyUuid))
      .limit(1);

    if (!company) {
      return { error: "Company not found" };
    }

    const roles = company.roles ?? [];
    const isCustomerOrProspect =
      roles.includes("customer") || roles.includes("prospect");

    await db
      .update(Companies)
      .set({
        debtorCompanyUuid: parsed.data.debtorCompanyUuid || null,
        iban: parsed.data.iban || null,
        bic: parsed.data.bic || null,
        bankAccount: parsed.data.bankAccount || null,
        postbankAccount: parsed.data.postbankAccount || null,
        ...(isCustomerOrProspect
          ? {
              purchaseOrgCompanyUuid:
                parsed.data.purchaseOrgCompanyUuid || null,
              memberNumberPurchaseOrg:
                parsed.data.memberNumberPurchaseOrg || null,
            }
          : {}),
        calculateVat: parsed.data.calculateVat,
        reminder: parsed.data.reminder,
        collectInvoicesInMandate: parsed.data.collectInvoicesInMandate,
        insuranceValidUntil: parsed.data.insuranceValidUntil
          ? new Date(parsed.data.insuranceValidUntil)
          : null,
        creditLimitInsurance: parsed.data.creditLimitInsurance || null,
        creditLimit: parsed.data.creditLimit || null,
        creditLimitUninsured: parsed.data.creditLimitUninsured || null,
        creditLimitUninsuredDate: parsed.data.creditLimitUninsuredDate
          ? new Date(parsed.data.creditLimitUninsuredDate)
          : null,
        paymentTerms: parsed.data.paymentTerms || null,
        differentPaymentTermsExWorks:
          parsed.data.differentPaymentTermsExWorks || null,
        journalCode: parsed.data.journalCode ?? null,
        vatNumber: parsed.data.vatNumber || null,
        cocNumber: parsed.data.cocNumber || null,
        currency: parsed.data.currency || null,
        blockedByUserId: parsed.data.isBlocked ? userId : null,
        blockedByNote: parsed.data.blockedByNote || null,
      })
      .where(eq(Companies.uuid, companyUuid));
  } catch (error) {
    return { error: describeError(error, "Failed to update debtor details") };
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${companyUuid}`);
  revalidatePath(`/companies/${companyUuid}/edit/debtor`);
  revalidatePath(`/companies/${companyUuid}/edit`);
  redirect(`/companies/${companyUuid}/edit`);
};
