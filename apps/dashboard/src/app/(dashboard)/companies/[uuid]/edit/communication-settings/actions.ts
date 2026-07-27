"use server";

import { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import {
  commSettingSchema,
  CommunicationSettingFormValues,
} from "@/app/(dashboard)/companies/validation";
import { db } from "@/db";
import {
  CommunicationSettings,
  SelectCommunicationSettings,
} from "@/db/schema/communication-settings";
import { describeError } from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { communicationSettingValuesToColumns } from "./mappers";

// CommunicationSettings rows have no uuid column, so payloads carry the int
// primary key instead — null means "insert a new row".
export type SaveCommunicationSettingPayload = {
  companyUuid: string;
  settingId: number | null;
  values: CommunicationSettingFormValues;
};

export type DeleteCommunicationSettingPayload = {
  companyUuid: string;
  settingId: number;
};

const revalidateCommunicationSettingPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/communication-settings`);
  revalidatePath(`/companies/${companyUuid}/edit`);
};

export const getCompanyCommunicationSettings = async (
  companyUuid: string,
): Promise<SelectCommunicationSettings[]> =>
  await db
    .select()
    .from(CommunicationSettings)
    .where(eq(CommunicationSettings.companyUuid, companyUuid))
    .orderBy(asc(CommunicationSettings.id));

// Inserts a new communication setting or updates an existing one by id. Both
// paths stamp modifiedByUserId with the current Clerk user, exactly like the
// legacy full-form sync did on every write.
export const saveCompanyCommunicationSetting = async (
  _prevState: CompanyActionResult,
  payload: SaveCommunicationSettingPayload,
): Promise<CompanyActionResult> => {
  const parsed = commSettingSchema.safeParse(payload.values);
  if (!parsed.success) {
    return {
      error: "Invalid communication setting — check the fields and try again",
    };
  }

  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return { error: "User not authenticated" };
    }

    const columns = communicationSettingValuesToColumns(parsed.data);

    if (payload.settingId != null) {
      await db
        .update(CommunicationSettings)
        .set({ ...columns, modifiedByUserId: userId })
        .where(
          and(
            eq(CommunicationSettings.id, payload.settingId),
            eq(CommunicationSettings.companyUuid, payload.companyUuid),
          ),
        );
    } else {
      const documentType = columns.documentType;
      const communicationType = columns.communicationType;

      if (!documentType || !communicationType) {
        return {
          error:
            "Invalid communication setting — check the fields and try again",
        };
      }

      await db.insert(CommunicationSettings).values({
        ...columns,
        documentType,
        communicationType,
        companyUuid: payload.companyUuid,
        modifiedByUserId: userId,
      });
    }

    revalidateCommunicationSettingPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return {
      error: describeError(error, "Failed to save communication setting"),
    };
  }
};

// Nothing references communication settings (they have no uuid), so deleting
// one is always safe.
export const deleteCompanyCommunicationSetting = async (
  _prevState: CompanyActionResult,
  payload: DeleteCommunicationSettingPayload,
): Promise<CompanyActionResult> => {
  try {
    await db
      .delete(CommunicationSettings)
      .where(
        and(
          eq(CommunicationSettings.id, payload.settingId),
          eq(CommunicationSettings.companyUuid, payload.companyUuid),
        ),
      );

    revalidateCommunicationSettingPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return {
      error: describeError(error, "Failed to delete communication setting"),
    };
  }
};
