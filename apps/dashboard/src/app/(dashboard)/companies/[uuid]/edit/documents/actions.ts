"use server";

import type { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import { db, SelectCompanies } from "@/db";
import { Companies } from "@/db/schema/companies";
import { describeError } from "@/lib/helpers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { companyDocumentsSchema } from "./validation";

export type CompanyDocumentEntry = NonNullable<
  SelectCompanies["documents"]
>[number];

export type AddCompanyDocumentsPayload = {
  companyUuid: string;
  documents: CompanyDocumentEntry[];
};

export type RemoveCompanyDocumentPayload = {
  companyUuid: string;
  documentId: string;
};

// Documents also show on the companies list and detail pages (they render the
// Companies.documents column directly), so revalidate those too — like the
// details section does for its Companies-row columns.
const revalidateDocumentPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/documents`);
  revalidatePath(`/companies/${companyUuid}/edit`);
  revalidatePath(`/companies/${companyUuid}`);
  revalidatePath("/companies");
};

export const getCompanyDocuments = async (
  companyUuid: string,
): Promise<CompanyDocumentEntry[]> => {
  const [company] = await db
    .select({ documents: Companies.documents })
    .from(Companies)
    .where(eq(Companies.uuid, companyUuid))
    .limit(1);

  return company?.documents ?? [];
};

// Appends freshly uploaded files to the Companies.documents JSON column. The
// binary upload itself already happened through /api/documents/upload — this
// only records the returned {id, fileName} entries on the company row.
export const addCompanyDocuments = async (
  _prevState: CompanyActionResult,
  payload: AddCompanyDocumentsPayload,
): Promise<CompanyActionResult> => {
  const parsed = companyDocumentsSchema.safeParse(payload.documents);
  if (!parsed.success) {
    return { error: "Invalid document data — try uploading again" };
  }

  try {
    const [company] = await db
      .select({ documents: Companies.documents })
      .from(Companies)
      .where(eq(Companies.uuid, payload.companyUuid))
      .limit(1);

    if (!company) {
      return { error: "Company not found" };
    }

    await db
      .update(Companies)
      .set({ documents: [...(company.documents ?? []), ...parsed.data] })
      .where(eq(Companies.uuid, payload.companyUuid));

    revalidateDocumentPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save documents") };
  }
};

// Removes one entry from the Companies.documents JSON column. The stored file
// is deleted separately through the existing /api/documents/[id]/delete
// endpoint before this runs — mirroring the legacy documents section.
export const removeCompanyDocument = async (
  _prevState: CompanyActionResult,
  payload: RemoveCompanyDocumentPayload,
): Promise<CompanyActionResult> => {
  try {
    const [company] = await db
      .select({ documents: Companies.documents })
      .from(Companies)
      .where(eq(Companies.uuid, payload.companyUuid))
      .limit(1);

    if (!company) {
      return { error: "Company not found" };
    }

    await db
      .update(Companies)
      .set({
        documents: (company.documents ?? []).filter(
          (document) => document.id !== payload.documentId,
        ),
      })
      .where(eq(Companies.uuid, payload.companyUuid));

    revalidateDocumentPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to remove document") };
  }
};
