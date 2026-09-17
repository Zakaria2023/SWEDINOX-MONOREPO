"use server";

import { COMMUNICATION_SETTING_COLUMNS } from "@/app/(dashboard)/communication-settings/columns";
import {
  CommunicationSettings,
  Companies,
  db,
  SelectCommunicationSettings,
} from "@/db";
import { SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import {
  communicationSettingDocumentTypes,
  communicationSettingShapes,
  communicationSettingTypes,
} from "@/lib/enums";
import { describeError } from "@/lib/helpers";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { exportRows } from "@/lib/server/excel";
import {
  enumFilter,
  FilterBindings,
  relationFilter,
  runPaged,
  SortableColumns,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { count, desc, eq, getTableColumns } from "drizzle-orm";

// A communication setting is an override, not the rule: "for this company,
// send this one document this way." The reference holds three rows in three
// years, so the screen is a short list of exceptions — but it is still an
// overview, with every column the reference shows.
const COMMUNICATION_SETTING_SEARCH = [
  Companies.companyName,
  CommunicationSettings.email,
] as const;

const COMMUNICATION_SETTING_FILTERS: FilterBindings = {
  company: relationFilter(CommunicationSettings.companyUuid),
  documentType: enumFilter(
    CommunicationSettings.documentType,
    communicationSettingDocumentTypes,
  ),
  communicationType: enumFilter(
    CommunicationSettings.communicationType,
    communicationSettingTypes,
  ),
  shape: enumFilter(CommunicationSettings.shape, communicationSettingShapes),
};

const COMMUNICATION_SETTING_SORTABLE: SortableColumns = {
  createdAt: CommunicationSettings.createdAt,
  updatedAt: CommunicationSettings.updatedAt,
  company: Companies.companyName,
  documentType: CommunicationSettings.documentType,
};

export type CommunicationSettingListItem = SelectCommunicationSettings & {
  companyId: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  contactEmail: SelectContacts["email"] | null;
  // The contact's name as one string, blank rather than a dash when there is
  // no contact — this row is exported as well as displayed.
  contactName: string | null;
  modifiedBy: string | null;
};

export type CommunicationSettingDetail = CommunicationSettingListItem;

const communicationSettingRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<CommunicationSettingListItem[]> => {
    const rows = await db
      .select({
        ...getTableColumns(CommunicationSettings),
        companyId: Companies.id,
        companyName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
        contactEmail: Contacts.email,
      })
      .from(CommunicationSettings)
      .leftJoin(Companies, eq(Companies.uuid, CommunicationSettings.companyUuid))
      .leftJoin(Contacts, eq(Contacts.uuid, CommunicationSettings.contactUuid))
      .where(
        tableWhere({
          query,
          search: COMMUNICATION_SETTING_SEARCH,
          filters: COMMUNICATION_SETTING_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          COMMUNICATION_SETTING_SORTABLE,
          query,
          [desc(CommunicationSettings.createdAt)],
          CommunicationSettings.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) {
      return [];
    }

    // The column stores a Clerk id; Clerk owns the name.
    const users = await getClerkUsersForSelect();
    const nameById = new Map(users.map((user) => [user.value, user.label]));

    return rows.map(({ contactFirstName, contactLastName, ...row }) => ({
      ...row,
      contactName: row.contactUuid
        ? ([contactFirstName, contactLastName].filter(Boolean).join(" ") ||
          null)
        : null,
      modifiedBy: nameById.get(row.modifiedByUserId) ?? row.modifiedByUserId,
    }));
  };

export const getCommunicationSettings = async (
  query: TableQuery,
): Promise<Paged<CommunicationSettingListItem>> => {
  try {
    const where = tableWhere({
      query,
      search: COMMUNICATION_SETTING_SEARCH,
      filters: COMMUNICATION_SETTING_FILTERS,
    });

    return await runPaged(query, {
      rows: communicationSettingRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(CommunicationSettings)
          .leftJoin(
            Companies,
            eq(Companies.uuid, CommunicationSettings.companyUuid),
          )
          .where(where);
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch communication settings"),
    );
  }
};

export const exportCommunicationSettings = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Communication settings",
    columns: COMMUNICATION_SETTING_COLUMNS,
    columnKeys,
    rows: communicationSettingRows(parseTableQuery(params)),
  });

/**
 * One communication setting with the company it belongs to.
 *
 * `CommunicationSettings` carries no uuid of its own, so it is keyed by its
 * autoincrement id — which is what the detail route param is.
 */
export const getCommunicationSettingDetail = async (
  id: number,
): Promise<CommunicationSettingDetail | null> => {
  const [row] = await db
    .select({
      ...getTableColumns(CommunicationSettings),
      companyId: Companies.id,
      companyName: Companies.companyName,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
      contactEmail: Contacts.email,
    })
    .from(CommunicationSettings)
    .leftJoin(Companies, eq(Companies.uuid, CommunicationSettings.companyUuid))
    .leftJoin(Contacts, eq(Contacts.uuid, CommunicationSettings.contactUuid))
    .where(eq(CommunicationSettings.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  const users = await getClerkUsersForSelect();
  const nameById = new Map(users.map((user) => [user.value, user.label]));

  const { contactFirstName, contactLastName, ...setting } = row;

  return {
    ...setting,
    contactName: setting.contactUuid
      ? ([contactFirstName, contactLastName].filter(Boolean).join(" ") || null)
      : null,
    modifiedBy: nameById.get(setting.modifiedByUserId) ?? setting.modifiedByUserId,
  };
};
