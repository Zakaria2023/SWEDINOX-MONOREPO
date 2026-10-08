"use client";

import {
  addPurchaseOrderReceiptDocument,
  deletePurchaseOrderReceiptDocument,
  PurchaseOrderItemDetail,
  PurchaseOrderReceiptDocumentRow,
  PurchaseReceiptDocument,
} from "@/app/(dashboard)/purchase-orders/actions";
import {
  ReceiptDocumentFormValues,
  receiptDocumentSchema,
} from "@/app/(dashboard)/purchase-orders/validation";
import { DocumentUploader } from "@/components/document-uploader";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { certificaatOptions, receiptDocumentKinds } from "@/lib/enums";
import { cn, orDash, pluralize } from "@/lib/helpers";
import { CERTIFICAAT_LABELS, RECEIPT_DOCUMENT_KIND_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  purchaseOrderUuid: string;
  documents: PurchaseOrderReceiptDocumentRow[];
  items: PurchaseOrderItemDetail[];
  receipts: PurchaseReceiptDocument[];
};

/**
 * `Product Receipt Documents` (C19, captured on 404299 8-10-2026) — the panel
 * where a certificate lives in the reference: a document row on the purchase
 * order, `Soort` DoP / Certificate / Other, tied to an order line and a
 * reception. `New` · `Delete` · `Toon`.
 */
export const ReceiptDocumentsPanel = ({
  purchaseOrderUuid,
  documents,
  items,
  receipts,
}: Props) => {
  const [adding, setAdding] = useState(false);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [state, dispatch, isPending] = useActionState(
    addPurchaseOrderReceiptDocument,
    {},
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReceiptDocumentFormValues>({
    resolver: zodResolver(receiptDocumentSchema),
    defaultValues: {
      purchaseOrderUuid,
      kind: "certificate",
      producer: "",
      documentCertificate: "",
      documentCode: "",
      purchaseOrderItemUuid: "",
      purchaseLineReceivalUuid: "",
      documents: [],
    },
  });

  const attached = watch("documents");
  const selected = documents.find((row) => row.uuid === selectedUuid) ?? null;
  const shownFile = selected?.documents?.[0] ?? null;

  useEffect(() => {
    if (state.success) {
      setAdding(false);
      reset();
    }
  }, [state, reset]);

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, purchaseOrderUuid });
    });
  });

  const onDelete = async () => {
    if (!selected) {
      return;
    }
    const result = await deletePurchaseOrderReceiptDocument(
      selected.uuid,
      purchaseOrderUuid,
    );
    setDeleteError(result.error ?? null);
    if (!result.error) {
      setSelectedUuid(null);
    }
  };

  return (
    <CollapsibleSection
      title="Product receipt documents"
      summary={`${documents.length} ${pluralize(documents.length, "document")}`}
    >
      <div className="space-y-3 p-3">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAdding(true)}
            disabled={adding}
          >
            <Plus className="me-1.5 size-4" />
            New
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={!selected || adding}
          >
            <Trash2 className="me-1.5 size-4" />
            Delete
          </Button>
          {shownFile && !adding ? (
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/api/documents/${shownFile.id}/download`} />}
            >
              Show
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Show
            </Button>
          )}
        </div>
        <FormError>{deleteError}</FormError>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kind</TableHead>
              <TableHead>Producer</TableHead>
              <TableHead>Certificate type</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Document</TableHead>
              <TableHead className="text-right">Order line</TableHead>
              <TableHead className="text-right">Receipt line</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-16 text-center text-muted-foreground"
                >
                  No documents on this order.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((row) => (
                <TableRow
                  key={row.uuid}
                  onClick={() => setSelectedUuid(row.uuid)}
                  className={cn(
                    "cursor-pointer",
                    row.uuid === selectedUuid && "bg-accent",
                  )}
                >
                  <TableCell>
                    {row.kind ? RECEIPT_DOCUMENT_KIND_LABELS[row.kind] : "—"}
                  </TableCell>
                  <TableCell>{orDash(row.producer)}</TableCell>
                  <TableCell>
                    {row.documentCertificate
                      ? CERTIFICAAT_LABELS[row.documentCertificate]
                      : "—"}
                  </TableCell>
                  <TableCell>{orDash(row.documentCode)}</TableCell>
                  <TableCell>
                    {orDash(
                      row.documents?.map((file) => file.fileName).join(", ") ||
                        null,
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.orderLine)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.receptionLine)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {adding && (
          <form
            onSubmit={onSubmit}
            className="space-y-3 rounded-lg border bg-muted/30 p-3"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <FormLabel htmlFor="receipt-document-kind" required>
                  Kind
                </FormLabel>
                <Controller
                  name="kind"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="receipt-document-kind"
                      value={field.value}
                      options={receiptDocumentKinds.map((kind) => ({
                        value: kind,
                        label: RECEIPT_DOCUMENT_KIND_LABELS[kind],
                      }))}
                      onValueChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div>
                <FormLabel htmlFor="receipt-document-producer">
                  Producer
                </FormLabel>
                <Input
                  id="receipt-document-producer"
                  {...register("producer")}
                />
              </div>
              <div>
                <FormLabel htmlFor="receipt-document-certificate">
                  Certificate type
                </FormLabel>
                <Controller
                  name="documentCertificate"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="receipt-document-certificate"
                      value={field.value ?? ""}
                      placeholder="Empty"
                      options={certificaatOptions.map((option) => ({
                        value: option,
                        label: CERTIFICAAT_LABELS[option],
                      }))}
                      onValueChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div>
                <FormLabel htmlFor="receipt-document-code">Code</FormLabel>
                <Input
                  id="receipt-document-code"
                  {...register("documentCode")}
                />
              </div>
              <div>
                <FormLabel htmlFor="receipt-document-line">
                  Order line
                </FormLabel>
                <Controller
                  name="purchaseOrderItemUuid"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="receipt-document-line"
                      value={field.value ?? ""}
                      placeholder="Whole order"
                      options={items.map((item) => ({
                        value: item.uuid,
                        label: `${item.lineNumber === null ? "—" : item.lineNumber * 10} · ${item.productCode}`,
                      }))}
                      onValueChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div>
                <FormLabel htmlFor="receipt-document-reception">
                  Receipt line
                </FormLabel>
                <Controller
                  name="purchaseLineReceivalUuid"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="receipt-document-reception"
                      value={field.value ?? ""}
                      placeholder="Not tied to one"
                      options={receipts.map((receipt) => ({
                        value: receipt.uuid,
                        label: `${receipt.lineNumber ?? "—"} · ${receipt.productCode ?? ""}`,
                      }))}
                      onValueChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FormLabel>Document</FormLabel>
              <DocumentUploader
                onSuccess={(uploads) =>
                  setValue(
                    "documents",
                    [
                      ...attached,
                      ...uploads.map((upload) => ({
                        id: upload.documentId,
                        fileName: upload.fileName,
                      })),
                    ],
                    { shouldValidate: true },
                  )
                }
              />
              {attached.length > 0 && (
                <p className="text-sm">
                  {attached.map((file) => file.fileName).join(", ")}
                </p>
              )}
              <FormFieldError message={errors.documents?.message} />
            </div>

            <FormError>{state.error}</FormError>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setAdding(false);
                  reset();
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </CollapsibleSection>
  );
};
