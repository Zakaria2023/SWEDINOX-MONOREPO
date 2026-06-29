"use client";

import { useFormContext } from "react-hook-form";
import { PurchaseInvoiceFormValues } from "@/app/(dashboard)/purchase-invoices/validation";
import { FormLabel } from "@/components/ui/form-field";
import { DocumentUploader } from "@/components/document-uploader";

type UploadedFile = { documentId: string; fileName: string };

type Props = {
  isPending: boolean;
  uploadedDocs: Array<{ id: string; fileName: string }>;
  onUploadSuccess: (uploads: UploadedFile[]) => void;
  onRemoveDoc: (id: string) => void;
};

export const RemarksAndDocumentsSection = ({
  isPending,
  uploadedDocs,
  onUploadSuccess,
  onRemoveDoc,
}: Props) => {
  const { register } = useFormContext<PurchaseInvoiceFormValues>();

  return (
    <div className="space-y-4">
      <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
        Remarks &amp; Documents
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <FormLabel htmlFor="remarks">Remarks</FormLabel>
          <textarea
            id="remarks"
            {...register("remarks")}
            rows={5}
            className="w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel>Documents</FormLabel>
          <DocumentUploader onSuccess={onUploadSuccess} />
          {uploadedDocs.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {uploadedDocs.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between">
                  <span className="truncate text-gray-700">{doc.fileName}</span>
                  <button
                    type="button"
                    className="ml-2 text-xs text-red-500 hover:underline"
                    onClick={() => onRemoveDoc(doc.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
