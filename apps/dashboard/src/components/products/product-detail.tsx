"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  copyProduct,
  deleteProduct,
  ProductDetail,
} from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/shadcn/button";
import { ProductControlPanels } from "@/components/products/product-control-panels";
import { RelatedRecordsBar } from "@/components/ui/related-records-bar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import {
  certificateIsMandatory,
  formatDateColumn,
  formatMoney,
  formatNumber,
  materialGradeMeta,
  qualityStandardMetaOf,
  requiredCertificateFor,
  yesNo,
} from "@/lib/helpers";
import {
  ARTICLE_GROUP_LABELS,
  CERTIFICAAT_LABELS,
  DISPATCH_STRATEGY_LABELS,
  MATERIAL_FAMILY_LABELS,
  MATERIAL_SURFACE_FINISH_LABELS,
  PROCESSED_OPTION_LABELS,
  PRODUCT_DIMENSION_SHAPE_LABELS,
  SALES_UNIT_LABELS,
} from "@/lib/labels";
import { ProductField } from "./product-field";
import { ProductPanels } from "./product-panels";

type Props = {
  product: ProductDetail;
};

export const ProductDetailView = ({ product }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // `Kopieer artikel(groep)en` — the action opens the copy in the editor.
  const handleCopy = () => {
    startTransition(async () => {
      const result = await copyProduct(product.uuid);
      if (result.error) {
        setError(result.error);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProduct(product.uuid);
      if (result.error) {
        setError(result.error);
      }
      setIsConfirmOpen(false);
    });
  };

  // On-hand and reserved across every location the article sits in — the two
  // figures a buyer actually asks for.
  const technicalQuantity = product.stock.reduce(
    (total, row) => total + Number(row.quantity ?? 0),
    0,
  );
  const reservedQuantity = product.stock.reduce(
    (total, row) => total + Number(row.reservedQuantity ?? 0),
    0,
  );

  // What the grade code itself says: the family, the surface, and the density
  // the theoretical weight above was computed from.
  const material = materialGradeMeta(product.featuresQuality);

  return (
    <div className="space-y-6">
      {error && <FormError>{error}</FormError>}

      {/* ── Identity ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Product</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <ProductField label="Product" value={product.productCode} />
          <ProductField label="Name" value={product.name} />
          <ProductField
            label="Product group"
            value={product.productGroupName}
          />
          {/* `Producttype` and `Prijsstructuur` sit in the reference's header,
              under the product code. */}
          <ProductField
            label="Product type"
            value={
              product.dimensionShape
                ? PRODUCT_DIMENSION_SHAPE_LABELS[product.dimensionShape]
                : null
            }
          />
          <ProductField label="Price structure" value={product.priceGroup} />
          <ProductField label="EAN" value={product.ean} />
          <ProductField label="Material group" value={product.materialGroup} />
          <ProductField label="Commodity" value={product.commodityCode} />
          <ProductField
            label="Old product code"
            value={product.oldProductCode}
          />
          <ProductField label="Search code 1" value={product.searchCode1} />
          <ProductField label="Search code 2" value={product.searchCode2} />
          <ProductField label="Search code 3" value={product.searchCode3} />
          <ProductField label="Company" value={product.companyName} />
          <ProductField label="Scrap" value={yesNo(product.scrap)} />
          <ProductField label="Packaging" value={yesNo(product.packaging)} />
          <ProductField
            label="Description can be overwritten"
            value={yesNo(product.descSalesPurchaseOverridable)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ProductField label="Group long" value={product.groupLongDesc} />
          <ProductField label="Group short" value={product.groupShortDesc} />
          <ProductField
            label="Product short"
            value={product.productShortDesc}
          />
        </div>
      </section>

      {/* ── Selection codes ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">
          Selection codes
        </h2>
        {product.selectionCodes && product.selectionCodes.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {product.selectionCodes.map((code) => (
              <li
                key={code}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
              >
                {code}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No selection codes.</p>
        )}
      </section>

      {/* ── Basis ───────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Basis</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <ProductField label="Length (mm)" value={product.length} />
          <ProductField label="Width / Ø (mm)" value={product.widthDiameter} />
          <ProductField label="Thickness (mm)" value={product.thickness} />
          <ProductField label="Trade length (mm)" value={product.tradeLength} />
          <ProductField
            label="Fixed dimensions"
            value={yesNo(product.tradeLengthFixed)}
          />
          <ProductField label="Overlength (mm)" value={product.overlength} />
          <ProductField label="Weight (KG/M1)" value={product.weightPerM1} />
          {/* The reference's `Kenmerken — Gewicht 7.850 KG/M3`: the product's
              own density, stored per dm³. */}
          <ProductField
            label="Weight (KG/M3)"
            value={
              product.densityKgDm3 === null
                ? null
                : formatNumber(Number(product.densityKgDm3) * 1000)
            }
          />
          <ProductField
            label="Paint surface (M2/M1)"
            value={product.paintSurfacePerM1}
          />
          <ProductField label="Quality" value={product.featuresQuality} />
          <ProductField
            label="Material"
            value={
              material ? MATERIAL_FAMILY_LABELS[material.base.family] : null
            }
          />
          <ProductField
            label="Surface"
            value={
              material
                ? MATERIAL_SURFACE_FINISH_LABELS[material.surface.finish]
                : null
            }
          />
          <ProductField
            label="Density (kg/dm³)"
            value={material ? material.base.density.toFixed(3) : null}
          />
          <ProductField
            label="Magnetic"
            value={material ? yesNo(material.base.magnetic) : null}
          />
          <ProductField
            label="Travels under foil"
            value={
              material ? yesNo(material.surface.requiresProtectiveFoil) : null
            }
          />
          <ProductField
            label="Standard — quality"
            value={product.standardsQuality}
          />
          <ProductField label="Tolerance" value={product.tolerance} />
          <ProductField label="CE" value={product.ce} />
          {/* What the standards on this article actually demand: which EN 10204
              certificate has to travel with it, and whether the goods may leave
              before the document is on hand. */}
          <ProductField
            label="Certificate required"
            value={
              CERTIFICAAT_LABELS[
                requiredCertificateFor({
                  ceStandard: product.ce,
                  productCertificate: product.certificaat,
                })
              ]
            }
          />
          <ProductField
            label="Held for certificate"
            value={yesNo(certificateIsMandatory(product.ce))}
          />
          <ProductField
            label="Tolerance standard"
            value={
              qualityStandardMetaOf(product.tolerance)?.toleranceStandard ??
              null
            }
          />
          <ProductField
            label="Theoretical weight"
            value={product.weightTheoretical}
          />
          <ProductField label="Trade weight" value={product.weightTrade} />
          <ProductField label="German weight" value={product.weightGerman} />
          <ProductField
            label="Industry number"
            value={product.industryNumber}
          />
          <ProductField
            label="Number of decimal places, weight"
            value={product.decimalPlaces}
          />
          <ProductField
            label="Print dimensions"
            value={yesNo(product.printDimensions)}
          />
          <ProductField
            label="Processed — option"
            value={
              product.processedOption
                ? PROCESSED_OPTION_LABELS[product.processedOption]
                : null
            }
          />
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Processed — source product
            </p>
            <p className="text-sm">
              {product.sourceProductUuid ? (
                <Link
                  href={`/products/${product.sourceProductUuid}`}
                  className="text-primary hover:underline"
                >
                  Show source product
                </Link>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>

        {/* The reference's `Opties` list: every option this article may be
            ordered with, each `Possible`. */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Options</h3>
          {product.options && product.options.length > 0 ? (
            <table className="text-sm">
              <tbody>
                {product.options.map((option) => (
                  <tr key={option}>
                    <td className="pe-6">{option}</td>
                    <td className="text-muted-foreground">Possible</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">No options.</p>
          )}
        </div>
      </section>

      {/* ── Classification ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">
          Classification features
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <ProductField
            label="Article group"
            value={
              product.articleGroup
                ? ARTICLE_GROUP_LABELS[product.articleGroup]
                : null
            }
          />
          <ProductField
            label="Material"
            value={product.classificationMaterial}
          />
          <ProductField
            label="Quality group"
            value={product.classificationQualityGroup}
          />
          <ProductField
            label="Main shape"
            value={product.classificationMainShape}
          />
          <ProductField
            label="Sub shape"
            value={product.classificationSubShape}
          />
          <ProductField
            label="Procedure"
            value={product.classificationProcedure}
          />
          <ProductField
            label="Appearance"
            value={product.classificationAppearance}
          />
          <ProductField
            label="Performance"
            value={product.classificationPerformance}
          />
        </div>
      </section>

      {/* ── Sales prices ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Sales prices</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <ProductField
            label="Price unit"
            value={
              product.priceUnit ? SALES_UNIT_LABELS[product.priceUnit] : null
            }
          />
          <ProductField
            label="Base price"
            value={formatMoney(Number(product.basePrice ?? 0))}
          />
          <ProductField label="Markup (%)" value={product.markup} />
          <ProductField
            label="Fixed sales price"
            value={formatMoney(Number(product.fixedSalesPrice ?? 0))}
          />
          <ProductField
            label="Price date"
            value={formatDateColumn(product.priceDate)}
          />
        </div>
      </section>

      {/* ── Purchase cost ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Purchase cost</h2>
        <p className="text-sm text-muted-foreground">
          Read back from the supplier invoices this article has been billed on —
          it is not maintained on the product.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <ProductField
            label="Average purchase price (APP)"
            value={formatMoney(product.purchaseCost.averagePurchasePrice)}
          />
          <ProductField
            label="Last invoiced price"
            value={formatMoney(product.purchaseCost.lastPurchasePrice)}
          />
          <ProductField
            label="Last invoice date"
            value={formatDateColumn(product.purchaseCost.lastPurchaseDate)}
          />
          <ProductField
            label="Last invoice"
            value={product.purchaseCost.lastPurchaseInvoiceNumber}
          />
          <ProductField
            label="Last supplier"
            value={product.purchaseCost.lastPurchaseSupplier}
          />
        </div>
      </section>

      {/* ── Stock at a glance ───────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Stock</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ProductField
            label="Technical stock"
            value={formatNumber(technicalQuantity)}
          />
          <ProductField
            label="Reserved"
            value={formatNumber(reservedQuantity)}
          />
          <ProductField
            label="Available"
            value={formatNumber(technicalQuantity - reservedQuantity)}
          />
          <ProductField
            label="Stock unit"
            value={
              product.stockUnit ? SALES_UNIT_LABELS[product.stockUnit] : null
            }
          />
          <ProductField
            label="Stock product"
            value={yesNo(product.stockProduct)}
          />
          <ProductField
            label="Batch registration"
            value={yesNo(product.batchRegistration)}
          />
          <ProductField
            label="Dispatch strategy"
            value={
              product.batchDispatchStrategy
                ? DISPATCH_STRATEGY_LABELS[product.batchDispatchStrategy]
                : null
            }
          />
          <ProductField
            label="Always reserve stock"
            value={yesNo(product.alwaysReserveStock)}
          />
        </div>
      </section>

      {/* ── The control settings the editor holds ──────────────────────── */}
      <ProductControlPanels product={product} />

      {/* ── Everything else, collapsed ──────────────────────────────────── */}
      <ProductPanels product={product} />

      {/* The reference's article toolbar (244/249): `Toon artikelgroep`,
          `Corrigeer artikelen en voorraad`, `Activeren` (grey),
          `Productieopdracht voor voorraad` (grey), `Kopieer artikel(groep)en`,
          `Order lines` — then `Purchase lines` and `Stock on location`
          narrowed to the product. Correcting stock happens lot by lot, so
          that button opens the article's lots. */}
      <div className="flex flex-wrap gap-2">
        <RelatedRecordsBar
          records={[
            {
              label: "Show product group",
              href: product.productGroupUuid
                ? `/product-groups/${product.productGroupUuid}`
                : null,
            },
            {
              label: "Correct articles and stock",
              href: `/stock?product=${product.uuid}`,
            },
            { label: "Activate", href: null },
            { label: "Production order for stock", href: null },
          ]}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          disabled={isPending}
        >
          Copy article(s)
        </Button>
        <RelatedRecordsBar
          records={[
            {
              label: "Order lines",
              href: `/order-lines?product=${product.uuid}`,
            },
            {
              label: "Purchase lines",
              href: `/purchase-lines?product=${product.uuid}`,
            },
            {
              label: "Stock on location",
              href: `/stock-on-location?product=${product.uuid}`,
            },
          ]}
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          render={<Link href={`/products/${product.uuid}/edit`} />}
        >
          Edit Product
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setIsConfirmOpen(true)}
          disabled={isPending}
        >
          Delete Product
        </Button>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleDelete}
        isPending={isPending}
        title="Delete product"
        description="This removes the product and its price structures, suppliers and locations. Products used on stock, orders or quotes cannot be deleted."
        confirmLabel="Delete Product"
      />
    </div>
  );
};
