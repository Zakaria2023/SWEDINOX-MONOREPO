"use server";

import { db } from "@/db";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import type { AddressCategory, AvailableAt } from "@/lib/enums";
import { and, count, eq, like } from "drizzle-orm";

export interface AddressActionResult {
  error?: string;
  success?: boolean;
}

export interface AddressListItem {
  id: number;
  companyUuid: string;
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

// Queries

export const getAddresses = async (
  page = 1,
  pageSize = 10,
  search = "",
  companyUuid?: string,
): Promise<PaginatedAddresses> => {
  const offset = (page - 1) * pageSize;

  const whereClauses = [];
  if (search.trim()) {
    whereClauses.push(like(CompanyAddresses.altName, `%${search.trim()}%`));
  }
  if (companyUuid) {
    whereClauses.push(eq(CompanyAddresses.companyUuid, companyUuid));
  }

  const whereClause =
    whereClauses.length > 0 ? and(...whereClauses) : undefined;

  const [results, [{ total }]] = await Promise.all([
    db
      .select()
      .from(CompanyAddresses)
      .where(whereClause)
      .orderBy(CompanyAddresses.createdAt)
      .limit(pageSize)
      .offset(offset),

    db.select({ total: count() }).from(CompanyAddresses).where(whereClause),
  ]);

  const data: AddressListItem[] = results.map((item) => ({
    ...item,
    category: item.category.split(",") as AddressCategory[],
  }));

  return { data, total, page, pageSize };
};

export const getAddressById = async (
  id: number,
): Promise<AddressDetail | null> => {
  const [address] = await db
    .select()
    .from(CompanyAddresses)
    .where(eq(CompanyAddresses.id, id))
    .limit(1);

  if (!address) return null;

  return {
    ...address,
    category: address.category.split(",") as AddressCategory[],
  };
};

export const getAddressesByCompany = async (
  companyUuid: string,
): Promise<AddressListItem[]> => {
  const results = await db
    .select()
    .from(CompanyAddresses)
    .where(eq(CompanyAddresses.companyUuid, companyUuid))
    .orderBy(CompanyAddresses.sequenceNumber, CompanyAddresses.createdAt);

  return results.map((item) => ({
    ...item,
    category: item.category.split(",") as AddressCategory[],
  }));
};

// Mutations

export const createAddress = async (
  _prevState: AddressActionResult,
  data: CreateAddressInput,
): Promise<AddressActionResult> => {
  if (!data.companyUuid) {
    return { error: "Company UUID is required" };
  }

  if (!data.category || data.category.length === 0) {
    return { error: "At least one address category is required" };
  }

  await db.insert(CompanyAddresses).values({
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
    sequenceNumber: data.sequenceNumber || null,
    category: data.category.join(",") as AddressCategory,
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
  });

  return { success: true };
};

export const updateAddress = async (
  _prevState: AddressActionResult,
  data: UpdateAddressInput,
): Promise<AddressActionResult> => {
  if (!data.companyUuid) {
    return { error: "Company UUID is required" };
  }

  if (!data.category || data.category.length === 0) {
    return { error: "At least one address category is required" };
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
      sequenceNumber: data.sequenceNumber || null,
      category: data.category.join(",") as AddressCategory,
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
