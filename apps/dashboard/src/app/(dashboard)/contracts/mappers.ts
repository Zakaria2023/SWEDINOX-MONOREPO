import {
  ContractDetail,
  ContractInput,
} from "@/app/(dashboard)/contracts/actions";
import { ContractFormValues } from "@/app/(dashboard)/contracts/validation";
import { toFormString } from "@/lib/helpers";

/** A saved contract back into the values its form edits. */
export const contractDetailToFormValues = (
  contract: ContractDetail,
): ContractFormValues => ({
  code: contract.code,
  contractType: contract.contractType ?? undefined,
  description: contract.description,
  contractGroupUuid: toFormString(contract.contractGroupUuid),
  quicklyChangeOrder: toFormString(contract.quicklyChangeOrder),
  hasPriceDate: contract.hasPriceDate ?? false,
  priceDate: toFormString(contract.priceDate),
  linkToNewCustomer: contract.linkToNewCustomer ?? false,
  searchCode1: toFormString(contract.searchCode1),
  searchCode2: toFormString(contract.searchCode2),
  searchCode3: toFormString(contract.searchCode3),
  websiteSorting: toFormString(contract.websiteSorting, "10"),
  hideOnWebsite: contract.hideOnWebsite ?? false,

  grossPrice: contract.grossPrice ?? false,
  grossPriceValue: toFormString(contract.grossPriceValue),
  colorSurcharge: contract.colorSurcharge ?? false,
  colorSurchargeValue: toFormString(contract.colorSurchargeValue),
  colorSurchargeUnit: toFormString(contract.colorSurchargeUnit),
  extraDiscount: contract.extraDiscount ?? false,
  extraDiscountValue: toFormString(contract.extraDiscountValue),
  extraDiscountUnit: toFormString(contract.extraDiscountUnit),
  extraDiscountFromValue: toFormString(contract.extraDiscountFromValue),
  extraDiscountFromUnit: toFormString(contract.extraDiscountFromUnit),

  quantitySurcharge: contract.quantitySurcharge ?? false,
  quantitySurchargeTierUnit: contract.quantitySurchargeTierUnit ?? undefined,
  quantitySurchargeDiscountUnit: toFormString(
    contract.quantitySurchargeDiscountUnit,
  ),
  quantitySurchargeTiers: contract.quantitySurchargeTiers ?? [],
  quantitySurchargePerType: contract.quantitySurchargePerType ?? undefined,

  lineDiscount: contract.lineDiscount ?? false,
  lineDiscountTierUnit: contract.lineDiscountTierUnit ?? undefined,
  lineDiscountDiscountUnit: toFormString(contract.lineDiscountDiscountUnit),
  lineDiscountTiers: contract.lineDiscountTiers ?? [],

  groupDiscount: contract.groupDiscount ?? false,
  groupDiscountTierUnit: contract.groupDiscountTierUnit ?? undefined,
  groupDiscountDiscountUnit: toFormString(contract.groupDiscountDiscountUnit),
  groupDiscountTiers: contract.groupDiscountTiers ?? [],
  groupDiscountBasedOn: contract.groupDiscountBasedOn ?? undefined,
});

/**
 * Form values as the Contracts columns. The company link, role and validity
 * dates are absent: those are set when the contract is attached to a company,
 * not while its terms are being edited.
 */
export const contractFormToInput = (
  values: ContractFormValues,
): ContractInput => ({
  code: values.code.toUpperCase(),
  contractType: values.contractType ?? null,
  description: values.description,
  contractGroupUuid: values.contractGroupUuid,
  quicklyChangeOrder: values.quicklyChangeOrder || null,
  hasPriceDate: values.hasPriceDate,
  priceDate: values.hasPriceDate ? values.priceDate || null : null,
  linkToNewCustomer: values.linkToNewCustomer,
  searchCode1: values.searchCode1 || null,
  searchCode2: values.searchCode2 || null,
  searchCode3: values.searchCode3 || null,
  websiteSorting:
    values.websiteSorting !== "" && values.websiteSorting !== undefined
      ? Number(values.websiteSorting)
      : 10,
  hideOnWebsite: values.hideOnWebsite,

  grossPrice: values.grossPrice,
  grossPriceValue: values.grossPriceValue || null,
  colorSurcharge: values.colorSurcharge,
  colorSurchargeValue: values.colorSurchargeValue || null,
  colorSurchargeUnit: values.colorSurchargeUnit || null,
  extraDiscount: values.extraDiscount,
  extraDiscountValue: values.extraDiscountValue || null,
  extraDiscountUnit: values.extraDiscountUnit || null,
  extraDiscountFromValue: values.extraDiscountFromValue || null,
  extraDiscountFromUnit: values.extraDiscountFromUnit || null,

  quantitySurcharge: values.quantitySurcharge,
  quantitySurchargeTierUnit: values.quantitySurchargeTierUnit ?? null,
  quantitySurchargeDiscountUnit: values.quantitySurchargeDiscountUnit || null,
  quantitySurchargeTiers: values.quantitySurchargeTiers,
  quantitySurchargePerType: values.quantitySurchargePerType ?? null,

  lineDiscount: values.lineDiscount,
  lineDiscountTierUnit: values.lineDiscountTierUnit ?? null,
  lineDiscountDiscountUnit: values.lineDiscountDiscountUnit || null,
  lineDiscountTiers: values.lineDiscountTiers,

  groupDiscount: values.groupDiscount,
  groupDiscountTierUnit: values.groupDiscountTierUnit ?? null,
  groupDiscountDiscountUnit: values.groupDiscountDiscountUnit || null,
  groupDiscountTiers: values.groupDiscountTiers,
  groupDiscountBasedOn: values.groupDiscountBasedOn ?? null,
});
