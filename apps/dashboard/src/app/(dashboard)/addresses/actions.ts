"use server";

import { db } from "@/db";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { Companies } from "@/db/schema/companies";
import type { AddressCategory, AvailableAt } from "@/lib/enums";
import { and, count, eq, like, or } from "drizzle-orm";

export interface AddressActionResult {
  addressId?: number;
  error?: string;
  success?: boolean;
}

export interface AddressListItem {
  id: number;
  companyUuid: string;
  companyName: string | null;
  altName: string | null;
  poBox: boolean | null;
  streetAndNo: string | null;
  postalCode: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  house: string | null;
  telephone: string | null;
  fax: string | null;
  email: string | null;
  website: string | null;
  billingAttention: string | null;
  billingAttentionAdditional: string | null;
  sequenceNumber: number | null;
  category: AddressCategory[];
  needCrane: boolean | null;
  canopyRequired: boolean | null;
  bundleSeparately: boolean | null;
  addressComplete: boolean | null;
  specialTransport: boolean | null;
  availableAt: AvailableAt | null;
  unloadingStartTime: string | null;
  unloadingEndTime: string | null;
  maxLength: string | null;
  maxBundleWeight: string | null;
  loadingInstructions: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AddressDetail = AddressListItem;

export interface PaginatedAddresses {
  data: AddressListItem[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
}

export interface CreateAddressInput {
  companyUuid: string;
  altName?: string;
  poBox?: boolean;
  streetAndNo?: string;
  postalCode?: string;
  country?: string;
  city?: string;
  region?: string;
  house?: string;
  telephone?: string;
  fax?: string;
  email?: string;
  website?: string;
  billingAttention?: string;
  billingAttentionAdditional?: string;
  sequenceNumber?: number;
  category: AddressCategory[];
  needCrane?: boolean;
  canopyRequired?: boolean;
  bundleSeparately?: boolean;
  addressComplete?: boolean;
  specialTransport?: boolean;
  availableAt?: AvailableAt;
  unloadingStartTime?: string;
  unloadingEndTime?: string;
  maxLength?: string;
  maxBundleWeight?: string;
  loadingInstructions?: string;
}

export interface UpdateAddressInput extends CreateAddressInput {
  id: number;
}

const addressSelection = {
  id: CompanyAddresses.id,
  companyUuid: CompanyAddresses.companyUuid,
  companyName: Companies.companyName,
  altName: CompanyAddresses.altName,
  poBox: CompanyAddresses.poBox,
  streetAndNo: CompanyAddresses.streetAndNo,
  postalCode: CompanyAddresses.postalCode,
  country: CompanyAddresses.country,
  city: CompanyAddresses.city,
  region: CompanyAddresses.region,
  house: CompanyAddresses.house,
  telephone: CompanyAddresses.telephone,
  fax: CompanyAddresses.fax,
  email: CompanyAddresses.email,
  website: CompanyAddresses.website,
  billingAttention: CompanyAddresses.billingAttention,
  billingAttentionAdditional: CompanyAddresses.billingAttentionAdditional,
  sequenceNumber: CompanyAddresses.sequenceNumber,
  category: CompanyAddresses.category,
  needCrane: CompanyAddresses.needCrane,
  canopyRequired: CompanyAddresses.canopyRequired,
  bundleSeparately: CompanyAddresses.bundleSeparately,
  addressComplete: CompanyAddresses.addressComplete,
  specialTransport: CompanyAddresses.specialTransport,
  availableAt: CompanyAddresses.availableAt,
  unloadingStartTime: CompanyAddresses.unloadingStartTime,
  unloadingEndTime: CompanyAddresses.unloadingEndTime,
  maxLength: CompanyAddresses.maxLength,
  maxBundleWeight: CompanyAddresses.maxBundleWeight,
  loadingInstructions: CompanyAddresses.loadingInstructions,
  createdAt: CompanyAddresses.createdAt,
  updatedAt: CompanyAddresses.updatedAt,
};

const mapAddress = (
  item: Omit<AddressListItem, "category"> & { category: string },
): AddressListItem => ({
  ...item,
  category: [item.category] as AddressCategory[],
});

// Queries

export const getAddresses = async (
  page = 1,
  pageSize = 10,
  search = "",
  companyUuid?: string,
): Promise<PaginatedAddresses> => {
  const offset = (page - 1) * pageSize;
  const trimmedSearch = search.trim();
  const searchClause = trimmedSearch
    ? or(
        like(CompanyAddresses.altName, `%${trimmedSearch}%`),
        like(Companies.companyName, `%${trimmedSearch}%`),
      )
    : undefined;
  const companyClause = companyUuid
    ? eq(CompanyAddresses.companyUuid, companyUuid)
    : undefined;
  const whereClause =
    searchClause && companyClause
      ? and(searchClause, companyClause)
      : searchClause ?? companyClause;

  const [results, [{ total }]] = await Promise.all([
    db
      .select(addressSelection)
      .from(CompanyAddresses)
      .leftJoin(Companies, eq(CompanyAddresses.companyUuid, Companies.uuid))
      .where(whereClause)
      .orderBy(CompanyAddresses.createdAt)
      .limit(pageSize)
      .offset(offset),

    db
      .select({ total: count() })
      .from(CompanyAddresses)
      .leftJoin(Companies, eq(CompanyAddresses.companyUuid, Companies.uuid))
      .where(whereClause),
  ]);

  const data: AddressListItem[] = results.map(mapAddress);

  return { data, total, page, pageSize };
};

export const getAddressById = async (
  id: number,
): Promise<AddressDetail | null> => {
  const [address] = await db
    .select(addressSelection)
    .from(CompanyAddresses)
    .leftJoin(Companies, eq(CompanyAddresses.companyUuid, Companies.uuid))
    .where(eq(CompanyAddresses.id, id))
    .limit(1);

  if (!address) return null;

  return mapAddress(address);
};

export const getAddressesByCompany = async (
  companyUuid: string,
): Promise<AddressListItem[]> => {
  const results = await db
    .select(addressSelection)
    .from(CompanyAddresses)
    .leftJoin(Companies, eq(CompanyAddresses.companyUuid, Companies.uuid))
    .where(eq(CompanyAddresses.companyUuid, companyUuid))
    .orderBy(CompanyAddresses.sequenceNumber, CompanyAddresses.createdAt);

  return results.map(mapAddress);
};

// Mutations

export const createAddress = async (
  _prevState: AddressActionResult,
  data: CreateAddressInput,
): Promise<AddressActionResult> => {
  if (!data.companyUuid) {
    return { error: "Company is required" };
  }

  if (!data.category || data.category.length === 0) {
    return { error: "Address category is required" };
  }

  const [createdAddress] = await db
    .insert(CompanyAddresses)
    .values({
    companyUuid: data.companyUuid,
    altName: data.altName || null,
    poBox: data.poBox ?? false,
    streetAndNo: data.streetAndNo || null,
    postalCode: data.postalCode || null,
    country: data.country || null,
    city: data.city || null,
    region: data.region || null,
    house: data.house || null,
    telephone: data.telephone || null,
    fax: data.fax || null,
    email: data.email || null,
    website: data.website || null,
    billingAttention: data.billingAttention || null,
    billingAttentionAdditional: data.billingAttentionAdditional || null,
    sequenceNumber: data.sequenceNumber || null,
    category: data.category[0],
    needCrane: data.needCrane ?? false,
    canopyRequired: data.canopyRequired ?? false,
    bundleSeparately: data.bundleSeparately ?? false,
    addressComplete: data.addressComplete ?? false,
    specialTransport: data.specialTransport ?? false,
    availableAt: data.availableAt || null,
    unloadingStartTime: data.unloadingStartTime || null,
    unloadingEndTime: data.unloadingEndTime || null,
    maxLength: data.maxLength || null,
    maxBundleWeight: data.maxBundleWeight || null,
    loadingInstructions: data.loadingInstructions || null,
    })
    .$returningId();

  return { addressId: createdAddress?.id, success: true };
};

export const updateAddress = async (
  _prevState: AddressActionResult,
  data: UpdateAddressInput,
): Promise<AddressActionResult> => {
  if (!data.companyUuid) {
    return { error: "Company is required" };
  }

  if (!data.category || data.category.length === 0) {
    return { error: "Address category is required" };
  }

  const [existing] = await db
    .select({ id: CompanyAddresses.id })
    .from(CompanyAddresses)
    .where(eq(CompanyAddresses.id, data.id))
    .limit(1);

  if (!existing) {
    return { error: "Address not found" };
  }

  await db
    .update(CompanyAddresses)
    .set({
      companyUuid: data.companyUuid,
      altName: data.altName || null,
      poBox: data.poBox ?? false,
      streetAndNo: data.streetAndNo || null,
      postalCode: data.postalCode || null,
      country: data.country || null,
      city: data.city || null,
      region: data.region || null,
      house: data.house || null,
      telephone: data.telephone || null,
      fax: data.fax || null,
      email: data.email || null,
      website: data.website || null,
      billingAttention: data.billingAttention || null,
      billingAttentionAdditional: data.billingAttentionAdditional || null,
      sequenceNumber: data.sequenceNumber || null,
      category: data.category[0],
      needCrane: data.needCrane ?? false,
      canopyRequired: data.canopyRequired ?? false,
      bundleSeparately: data.bundleSeparately ?? false,
      addressComplete: data.addressComplete ?? false,
      specialTransport: data.specialTransport ?? false,
      availableAt: data.availableAt || null,
      unloadingStartTime: data.unloadingStartTime || null,
      unloadingEndTime: data.unloadingEndTime || null,
      maxLength: data.maxLength || null,
      maxBundleWeight: data.maxBundleWeight || null,
      loadingInstructions: data.loadingInstructions || null,
    })
    .where(eq(CompanyAddresses.id, data.id));

  return { success: true };
};

export const toggleAddressComplete = async (
  id: number,
): Promise<AddressActionResult> => {
  const [address] = await db
    .select({ addressComplete: CompanyAddresses.addressComplete })
    .from(CompanyAddresses)
    .where(eq(CompanyAddresses.id, id))
    .limit(1);

  if (!address) return { error: "Address not found" };

  await db
    .update(CompanyAddresses)
    .set({ addressComplete: !address.addressComplete })
    .where(eq(CompanyAddresses.id, id));

  return { success: true };
};

export const deleteAddress = async (
  id: number,
): Promise<AddressActionResult> => {
  const [address] = await db
    .select({ id: CompanyAddresses.id })
    .from(CompanyAddresses)
    .where(eq(CompanyAddresses.id, id))
    .limit(1);

  if (!address) {
    return { error: "Address not found" };
  }

  await db.delete(CompanyAddresses).where(eq(CompanyAddresses.id, id));

  return { success: true };
};
