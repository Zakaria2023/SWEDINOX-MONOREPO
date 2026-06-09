"use server";

import {
  db,
  type InsertCompanyAddresses,
  type SelectCompanies,
  type SelectCompanyAddresses,
} from "@/db";
import { Companies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { eq } from "drizzle-orm";

export type AddressActionResult = {
  addressId?: number;
  companyUuid?: string;
  error?: string;
  success?: boolean;
};

export type AddressListItem = {
  CompanyAddresses: SelectCompanyAddresses;
  Companies: SelectCompanies | null;
};

export type AddressDetail = AddressListItem;

export interface UpdateAddressInput extends InsertCompanyAddresses {
  id: number;
}

// Queries

export const getAddresses = async () => {
  const address = await db
    .select()
    .from(CompanyAddresses)
    .leftJoin(Companies, eq(CompanyAddresses.companyUuid, Companies.uuid))
    .orderBy(CompanyAddresses.createdAt);

  return address as AddressListItem[];
};

export const getAddressById = async (
  id: number,
): Promise<AddressDetail | null> => {
  const [address] = await db
    .select()
    .from(CompanyAddresses)
    .leftJoin(Companies, eq(CompanyAddresses.companyUuid, Companies.uuid))
    .where(eq(CompanyAddresses.id, id))
    .limit(1);

  if (!address) return null;

  return address as AddressDetail;
};

export const getAddressesByCompany = async (
  companyUuid: string,
): Promise<AddressListItem[]> => {
  const addressesByCompany = await db
    .select()
    .from(CompanyAddresses)
    .leftJoin(Companies, eq(CompanyAddresses.companyUuid, Companies.uuid))
    .where(eq(CompanyAddresses.companyUuid, companyUuid))
    .orderBy(CompanyAddresses.sequenceNumber, CompanyAddresses.createdAt);

  return addressesByCompany as AddressListItem[];
};

// Mutations

export const createAddress = async (
  _prevState: AddressActionResult,
  data: InsertCompanyAddresses,
): Promise<AddressActionResult> => {
  if (!data.companyUuid) {
    return { error: "Company is required" };
  }

  if (!data.category.length) {
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
      category: data.category,
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

  return {
    addressId: createdAddress?.id,
    companyUuid: data.companyUuid,
    success: true,
  };
};

export const updateAddress = async (
  _prevState: AddressActionResult,
  data: UpdateAddressInput,
): Promise<AddressActionResult> => {
  if (!data.companyUuid) {
    return { error: "Company is required" };
  }

  if (!data.category.length) {
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
      category: data.category,
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
