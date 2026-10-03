"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, Resolver } from "react-hook-form";
import {
  createProductGroup,
  ProductGroupActionResult,
  ProductGroupOption,
} from "./actions";
import {
  DEFAULT_PRODUCT_GROUP,
  productGroupSchema,
  ProductGroupFormValues,
} from "./validation";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";

type UseProductGroupSubmitParams = {
  existingGroups: ProductGroupOption[];
  companies: CompanyOption[];
};

export const useProductGroupSubmit = ({
  existingGroups,
  companies,
}: UseProductGroupSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ProductGroupActionResult>({});

  const form = useForm<ProductGroupFormValues>({
    resolver: zodResolver(
      productGroupSchema,
    ) as Resolver<ProductGroupFormValues>,
    defaultValues: DEFAULT_PRODUCT_GROUP,
  });

  const parentGroupOptions = [
    { value: "", label: "— None —" },
    ...existingGroups.map((g) => ({ value: g.uuid, label: g.name })),
  ];

  const supplierOptions = [
    { value: "", label: "— None —" },
    ...companies
      .filter((c) => Array.isArray(c.roles) && c.roles.includes("supplier"))
      .map((c) => ({
        value: c.uuid,
        label: c.companyName ?? c.searchCode1 ?? c.uuid,
      })),
  ];

  const handleCancel = () => router.push("/product-groups");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createProductGroup({
        parentUuid: values.parentUuid || null,
        name: values.name,
        productShape: values.productShape || null,
        groupLongDesc: values.groupLongDesc || null,
        groupShortDesc: values.groupShortDesc || null,
        productShapeDesc: values.productShapeDesc || null,
        materialGroup: values.materialGroup || null,
        commodity: values.commodity || null,
        scrap: values.scrap,
        packaging: values.packaging,
        descSalesPurchaseOverridable: values.descSalesPurchaseOverridable,
        searchCode1: values.searchCode1 || null,
        searchCode2: values.searchCode2 || null,
        searchCode3: values.searchCode3 || null,
        articleGroup: values.articleGroup || null,
        length: values.length || null,
        width: values.width || null,
        thickness: values.thickness || null,
        decimalPlaces: values.decimalPlaces || "0",
        printDimensions: values.printDimensions,
        weight: values.weight || null,
        paintSurface: values.paintSurface || null,
        featuresQuality: values.featuresQuality || null,
        weightTheoretical: values.weightTheoretical,
        weightTrade: values.weightTrade,
        weightGerman: values.weightGerman,
        standardsQuality: values.standardsQuality || null,
        tolerance: values.tolerance || null,
        ce: values.ce || null,
        options: values.options ?? null,
        processedOption: values.processedOption || null,
        sourceProduct: values.sourceProduct || null,
        industryNumber: values.industryNumber || null,
        purchasingUnit: values.purchasingUnit || null,
        unitPrice: values.unitPrice || null,
        deliveryTime: values.deliveryTime,
        deliveryTimeUnit: values.deliveryTimeUnit || null,
        orderSeries: values.orderSeries,
        blockedForPurchasing: values.blockedForPurchasing,
        makingOrderAdvices: values.makingOrderAdvices,
        orderingAdviceNotes: values.orderingAdviceNotes || null,
        productCodeOnPurchase: values.productCodeOnPurchase,
        maxLineQty: values.maxLineQty,
        maxNetPrice: values.maxNetPrice,
        packagingMandatoryOnCompletion: values.packagingMandatoryOnCompletion,
        receiptInLocationsWithLimitedDimensions:
          values.receiptInLocationsWithLimitedDimensions,
        goodsReceiptTerm: values.goodsReceiptTerm,
        includeInCsvForStockLabels: values.includeInCsvForStockLabels,
        suggestLastUsedChargeInScanner: values.suggestLastUsedChargeInScanner,
        stockLabelType: values.stockLabelType || null,
        stockLabelPrinting: values.stockLabelPrinting || null,
        toleranceUnloadingQty: values.toleranceUnloadingQty,
        toleranceUnloadingKg: values.toleranceUnloadingKg,
        toleranceCountQty: values.toleranceCountQty,
        toleranceCountKg: values.toleranceCountKg,
        tolerancePickingQty: values.tolerancePickingQty,
        tolerancePickingKg: values.tolerancePickingKg,
        toleranceProductionQty: values.toleranceProductionQty,
        toleranceProductionKg: values.toleranceProductionKg,
        customerLabelForPickingSlip: values.customerLabelForPickingSlip || null,
        customerLabelForSawingSlip: values.customerLabelForSawingSlip || null,
        customerLabelAtSurfTreatSlip:
          values.customerLabelAtSurfTreatSlip || null,
        alwaysApproveManuallyWarehouseWorkorderLine:
          values.alwaysApproveManuallyWarehouseWorkorderLine,
        alwaysApproveManuallyProductionWorkorderLine:
          values.alwaysApproveManuallyProductionWorkorderLine,
        minStockMode: values.minStockMode,
        minStockMultiplier: values.minStockMultiplier,
        minStockFixedValue: values.minStockFixedValue,
        minStockUnit: values.minStockUnit || null,
        maxStockMode: values.maxStockMode,
        maxStockMultiplier: values.maxStockMultiplier,
        maxStockFixedValue: values.maxStockFixedValue,
        maxStockUnit: values.maxStockUnit || null,
        leadTimeMethod: values.leadTimeMethod,
        leadTime: values.leadTime,
        reviewPeriod: values.reviewPeriod,
        orderCostsPurchasingSide: values.orderCostsPurchasingSide,
        orderCostsLogistics: values.orderCostsLogistics,
        stockOpOrderSeries: values.stockOpOrderSeries,
        minOrderQty: values.minOrderQty,
        useStockOpForThisProduct: values.useStockOpForThisProduct,
        orderOnMonday: values.orderOnMonday,
        orderOnTuesday: values.orderOnTuesday,
        orderOnWednesday: values.orderOnWednesday,
        orderOnThursday: values.orderOnThursday,
        orderOnFriday: values.orderOnFriday,
        capitalCost: values.capitalCost,
        warehouseCost: values.warehouseCost,
        b2StockoutPct1: values.b2StockoutPct1,
        b2StockoutPct2: values.b2StockoutPct2,
        handling: values.handling,
        transport: values.transport,
        pacClassification: values.pacClassification || null,
        orderAdviceCode: values.orderAdviceCode || null,
        revenueGroup: values.revenueGroup || null,
        salesUnit: values.salesUnit || null,
        salesUnitPrice: values.salesUnitPrice || null,
        vatCode: values.vatCode || null,
        roundWeightPerPieceUp: values.roundWeightPerPieceUp,
        benorProduct: values.benorProduct,
        productCodeOnQuoteOrderInvoice: values.productCodeOnQuoteOrderInvoice,
        certificaat: values.certificaat || null,
        websiteExport: values.websiteExport,
        websiteBlockedForSales: values.websiteBlockedForSales,
        descriptionProductShort: values.descriptionProductShort,
        showWeightPerPiece: values.showWeightPerPiece,
        showPackagingPerPiece: values.showPackagingPerPiece,
        markProductGroup: values.markProductGroup,
        priceOnRequest: values.priceOnRequest,
        minProfitMarginStock: values.minProfitMarginStock,
        minProfitMarginExWorks: values.minProfitMarginExWorks,
        minProfitMarginCrossDocking: values.minProfitMarginCrossDocking,
        severalBlockedForSales: values.severalBlockedForSales,
        vehicleWithCraneRequired: values.vehicleWithCraneRequired,
        vehicleWithCanopyRequired: values.vehicleWithCanopyRequired,
        alwaysReserveStock: values.alwaysReserveStock,
        maxSalesLineQty: values.maxSalesLineQty,
        maxSalesNetPrice: values.maxSalesNetPrice,
        handlingCosts: values.handlingCosts,
        documents: values.documents ?? null,
      }, values.suppliers.map((supplier) => ({
        supplierCompanyUuid: supplier.supplierCompanyUuid,
        preferred: supplier.preferred,
        ean: supplier.ean || null,
        externalProductCode: supplier.externalProductCode || null,
        editing: supplier.editing || null,
        deliveryTime: supplier.deliveryTime,
        deliveryTimeUnit: supplier.deliveryTimeUnit || null,
        moq: supplier.moq,
        moqUnit: supplier.moqUnit || null,
        orderSeries: supplier.orderSeries,
        orderSeriesUnit: supplier.orderSeriesUnit || null,
      })));

      setState(result);
      if (result.success && result.productGroupUuid) {
        router.push("/product-groups");
      }
    });
  });

  return {
    form,
    isPending,
    onSubmit,
    state,
    parentGroupOptions,
    supplierOptions,
    handleCancel,
  };
};
