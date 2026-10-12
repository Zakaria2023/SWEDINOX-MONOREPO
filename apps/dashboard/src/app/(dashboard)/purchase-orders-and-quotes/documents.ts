import {
  ConvertedDocument,
  PurchaseDocumentKind,
} from "@/app/(dashboard)/purchase-orders-and-quotes/actions";
import { PurchaseRequestStatus } from "@/lib/enums";
import { documentStatusLabel } from "@/lib/helpers";
import { PURCHASE_REQUEST_STATUS_LABELS } from "@/lib/labels";

/**
 * How each of the four documents on Purchase orders and quotes is printed,
 * opened and labelled. The list, its toolbar, its export and its filters all
 * read these, so a request cannot print `IA800010` in one place and `800010`
 * in another.
 */

// The letters the reference puts before the number: Inkoop Order, Quote,
// Retour and Aanvraag — `IO404355`, `IQ900001`, `IR950008`, `IA800010`.
const DOCUMENT_PREFIXES: Record<PurchaseDocumentKind, string> = {
  Order: "IO",
  Quote: "IQ",
  Return: "IR",
  Request: "IA",
};

const DOCUMENT_PATHS: Record<PurchaseDocumentKind, string> = {
  Order: "/purchase-orders",
  Quote: "/purchase-quotes",
  Return: "/purchase-return-orders",
  Request: "/purchase-requests",
};

// A request's statuses share `awarded` with a quote's and `cancelled` with an
// order's, so in the status filter they travel under this prefix.
export const REQUEST_STATUS_FILTER_PREFIX = "request:";

const isPurchaseDocumentKind = (
  value: string | undefined,
): value is PurchaseDocumentKind =>
  value !== undefined && Object.hasOwn(DOCUMENT_PREFIXES, value);

export const purchaseDocumentNumber = (
  kind: PurchaseDocumentKind,
  number: number,
): string => `${DOCUMENT_PREFIXES[kind]}${number}`;

export const purchaseDocumentHref = (
  kind: PurchaseDocumentKind,
  uuid: string,
): string => `${DOCUMENT_PATHS[kind]}/${uuid}`;

export const purchaseDocumentStatusLabel = (
  kind: PurchaseDocumentKind,
  status: string | null | undefined,
): string => {
  if (kind !== "Request") {
    return documentStatusLabel(kind, status);
  }
  if (!status) {
    return "—";
  }
  return (
    PURCHASE_REQUEST_STATUS_LABELS[status as PurchaseRequestStatus] ?? status
  );
};

/** `IQ900001, IQ900002` — every document on the other end of a conversion. */
export const convertedDocumentsLabel = (
  converted: readonly ConvertedDocument[],
): string | null =>
  converted.length > 0
    ? converted
        .map((document) =>
          purchaseDocumentNumber(document.kind, document.number),
        )
        .join(", ")
    : null;

/**
 * Reads the `Kind:number:uuid` list the overview's SQL builds for the
 * `Converted from/to` column, comma-separated when a request became several
 * quotes.
 */
export const parseConvertedDocuments = (
  refs: string | null,
): ConvertedDocument[] =>
  (refs ?? "")
    .split(",")
    .map((ref) => ref.trim().split(":"))
    .flatMap(([kind, number, uuid]) =>
      isPurchaseDocumentKind(kind) && number && uuid
        ? [{ kind, uuid, number: Number(number) }]
        : [],
    );
