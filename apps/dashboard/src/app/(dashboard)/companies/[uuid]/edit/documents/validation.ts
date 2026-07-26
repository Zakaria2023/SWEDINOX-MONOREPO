import { z } from "zod";

// Shape of one entry in the Companies.documents JSON column — the id is the
// storage documentId returned by /api/documents/upload.
export const companyDocumentEntrySchema = z.object({
  id: z.string().min(1),
  fileName: z.string().min(1),
});

export const companyDocumentsSchema = z
  .array(companyDocumentEntrySchema)
  .min(1);
