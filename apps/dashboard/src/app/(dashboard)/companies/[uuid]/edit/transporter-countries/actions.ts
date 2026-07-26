"use server";

import type { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import { db } from "@/db";
import {
  SelectTransporterCountries,
  TransporterCountries,
} from "@/db/schema/transporter-countries";
import { describeError, generateUuid } from "@/lib/helpers";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { transporterCountryValuesToColumns } from "./mappers";
import {
  transporterCountryRowSchema,
  TransporterCountryRowValues,
} from "./validation";

export type SaveTransporterCountryPayload = {
  companyUuid: string;
  transporterCountryUuid: string | null;
  values: TransporterCountryRowValues;
};

export type DeleteTransporterCountryPayload = {
  companyUuid: string;
  transporterCountryUuid: string;
};

const revalidateTransporterCountryPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/transporter-countries`);
  revalidatePath(`/companies/${companyUuid}/edit`);
};

export const getTransporterCountriesForCompany = async (
  companyUuid: string,
): Promise<SelectTransporterCountries[]> =>
  await db
    .select()
    .from(TransporterCountries)
    .where(eq(TransporterCountries.companyUuid, companyUuid))
    .orderBy(asc(TransporterCountries.id));

// Inserts a new transporter country row or updates an existing one by uuid.
// Updates write only the grid-editable columns.
export const saveTransporterCountry = async (
  _prevState: CompanyActionResult,
  payload: SaveTransporterCountryPayload,
): Promise<CompanyActionResult> => {
  const parsed = transporterCountryRowSchema.safeParse(payload.values);
  if (!parsed.success) {
    return {
      error:
        "Invalid transporter country data — check the fields and try again",
    };
  }

  try {
    const columns = transporterCountryValuesToColumns(parsed.data);

    if (payload.transporterCountryUuid) {
      await db
        .update(TransporterCountries)
        .set(columns)
        .where(
          and(
            eq(TransporterCountries.uuid, payload.transporterCountryUuid),
            eq(TransporterCountries.companyUuid, payload.companyUuid),
          ),
        );
    } else {
      await db.insert(TransporterCountries).values({
        ...columns,
        uuid: generateUuid(),
        companyUuid: payload.companyUuid,
      });
    }

    revalidateTransporterCountryPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return {
      error: describeError(error, "Failed to save transporter country"),
    };
  }
};

export const deleteTransporterCountry = async (
  _prevState: CompanyActionResult,
  payload: DeleteTransporterCountryPayload,
): Promise<CompanyActionResult> => {
  try {
    await db
      .delete(TransporterCountries)
      .where(
        and(
          eq(TransporterCountries.uuid, payload.transporterCountryUuid),
          eq(TransporterCountries.companyUuid, payload.companyUuid),
        ),
      );

    revalidateTransporterCountryPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return {
      error: describeError(error, "Failed to delete transporter country"),
    };
  }
};
