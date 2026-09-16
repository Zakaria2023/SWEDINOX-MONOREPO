import "server-only";

import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Complaints, SelectComplaints } from "@/db/schema/complaints";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import {
  CounterOrders,
  SelectCounterOrders,
} from "@/db/schema/counter-orders";
import { Orders, SelectOrders } from "@/db/schema/orders";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import {
  PurchaseQuotes,
  SelectPurchaseQuotes,
} from "@/db/schema/purchase-quotes";
import { Quotes, SelectQuotes } from "@/db/schema/quotes";
import { ReturnOrders, SelectReturnOrders } from "@/db/schema/return-orders";
import {
  complaintDocumentCode,
  complaintResolutionDays,
} from "@/lib/helpers";

/**
 * What both complaint overviews print about the complaint itself.
 *
 * The reference's Complaint lines overview is the Complaints overview repeated
 * per line plus two columns — every other value matched its complaint on 34 of
 * 34 lines — so the two share one selection and one mapping, and cannot drift.
 * Each query supplies the joins these columns come from: Companies, Contacts
 * and the six document tables, all on the complaint.
 */
export const COMPLAINT_OVERVIEW_FIELDS = {
  complaintUuid: Complaints.uuid,
  complaintNumber: Complaints.id,
  reportDate: Complaints.reportDate,
  createdAt: Complaints.createdAt,
  companyUuid: Complaints.companyUuid,
  companyCode: Companies.id,
  companyName: Companies.companyName,
  customerGroup: Companies.customerGroup,
  accountManager: Companies.accountManager,
  representative: Companies.representative,
  category: Complaints.category,
  status: Complaints.status,
  statusHistory: Complaints.statusHistory,
  description: Complaints.description,
  cause: Complaints.cause,
  explanationOfCause: Complaints.explanationOfCause,
  solution: Complaints.solution,
  explanationOfSolution: Complaints.explanationOfSolution,
  complaintType: Complaints.complaintType,
  contactFirstName: Contacts.firstName,
  contactLastName: Contacts.lastName,
  deadline: Complaints.deadline,
  responsibleUserId: Complaints.responsibleUserId,
  createdByUserId: Complaints.createdByUserId,
  costsCustomer: Complaints.costsCustomer,
  internalCosts: Complaints.internalCosts,
  extraCosts: Complaints.extraCosts,
  toBeReclaimed: Complaints.toBeReclaimed,
  orderUuid: Complaints.orderUuid,
  orderId: Orders.id,
  orderSeller: Orders.seller,
  quoteId: Quotes.id,
  counterOrderId: CounterOrders.id,
  purchaseOrderUuid: Complaints.purchaseOrderUuid,
  purchaseOrderId: PurchaseOrders.id,
  purchaser: PurchaseOrders.purchaser,
  purchaseQuoteId: PurchaseQuotes.id,
  returnOrderId: ReturnOrders.id,
};

export type ComplaintOverviewFields = {
  complaintUuid: SelectComplaints["uuid"];
  complaintNumber: SelectComplaints["id"];
  reportYear: number | null;
  reportMonth: number | null;
  reportDate: SelectComplaints["reportDate"];
  companyUuid: SelectComplaints["companyUuid"];
  companyCode: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  customerGroup: SelectCompanies["customerGroup"] | null;
  accountManager: SelectCompanies["accountManager"] | null;
  representative: SelectCompanies["representative"] | null;
  category: SelectComplaints["category"];
  status: SelectComplaints["status"];
  resolutionDays: number;
  description: SelectComplaints["description"];
  cause: SelectComplaints["cause"];
  explanationOfCause: SelectComplaints["explanationOfCause"];
  solution: SelectComplaints["solution"];
  explanationOfSolution: SelectComplaints["explanationOfSolution"];
  complaintType: SelectComplaints["complaintType"];
  correspondenceName: string | null;
  deadline: SelectComplaints["deadline"];
  documentCode: string | null;
  documentHref: string | null;
  responsible: string | null;
  statusDate: string | null;
  capturedBy: string | null;
  purchaserSeller: string | null;
  creationDate: SelectComplaints["createdAt"];
  totalCosts: number;
};

type ComplaintOverviewRaw = {
  complaintUuid: SelectComplaints["uuid"];
  complaintNumber: SelectComplaints["id"];
  reportDate: SelectComplaints["reportDate"];
  createdAt: SelectComplaints["createdAt"];
  companyUuid: SelectComplaints["companyUuid"];
  companyCode: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  customerGroup: SelectCompanies["customerGroup"] | null;
  accountManager: SelectCompanies["accountManager"] | null;
  representative: SelectCompanies["representative"] | null;
  category: SelectComplaints["category"];
  status: SelectComplaints["status"];
  statusHistory: SelectComplaints["statusHistory"];
  description: SelectComplaints["description"];
  cause: SelectComplaints["cause"];
  explanationOfCause: SelectComplaints["explanationOfCause"];
  solution: SelectComplaints["solution"];
  explanationOfSolution: SelectComplaints["explanationOfSolution"];
  complaintType: SelectComplaints["complaintType"];
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  deadline: SelectComplaints["deadline"];
  responsibleUserId: SelectComplaints["responsibleUserId"];
  createdByUserId: SelectComplaints["createdByUserId"];
  costsCustomer: SelectComplaints["costsCustomer"];
  internalCosts: SelectComplaints["internalCosts"];
  extraCosts: SelectComplaints["extraCosts"];
  toBeReclaimed: SelectComplaints["toBeReclaimed"];
  orderUuid: SelectComplaints["orderUuid"];
  orderId: SelectOrders["id"] | null;
  orderSeller: SelectOrders["seller"] | null;
  quoteId: SelectQuotes["id"] | null;
  counterOrderId: SelectCounterOrders["id"] | null;
  purchaseOrderUuid: SelectComplaints["purchaseOrderUuid"];
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  purchaser: SelectPurchaseOrders["purchaser"] | null;
  purchaseQuoteId: SelectPurchaseQuotes["id"] | null;
  returnOrderId: SelectReturnOrders["id"] | null;
};

const personName = (
  id: string | null,
  nameById: Map<string, string>,
): string | null => (id ? (nameById.get(id) ?? id) : null);

export const toComplaintOverviewFields = (
  raw: ComplaintOverviewRaw,
  nameById: Map<string, string>,
): ComplaintOverviewFields => {
  const statusDate = raw.statusHistory?.at(-1)?.statusDate ?? null;
  const reportDate = raw.reportDate ? new Date(raw.reportDate) : null;

  // The document the complaint names: a sales order or a purchase order are
  // the two the reference was seen to link, and both have a page to open.
  const documentHref = raw.orderUuid
    ? `/orders/${raw.orderUuid}`
    : raw.purchaseOrderUuid
      ? `/purchase-orders/${raw.purchaseOrderUuid}`
      : null;

  return {
    complaintUuid: raw.complaintUuid,
    complaintNumber: raw.complaintNumber,
    reportYear: reportDate ? reportDate.getUTCFullYear() : null,
    reportMonth: reportDate ? reportDate.getUTCMonth() + 1 : null,
    reportDate: raw.reportDate,
    companyUuid: raw.companyUuid,
    companyCode: raw.companyCode,
    companyName: raw.companyName,
    customerGroup: raw.customerGroup,
    accountManager: raw.accountManager,
    representative: raw.representative,
    category: raw.category,
    status: raw.status,
    resolutionDays: complaintResolutionDays(
      raw.status,
      raw.reportDate,
      statusDate,
    ),
    description: raw.description,
    cause: raw.cause,
    explanationOfCause: raw.explanationOfCause,
    solution: raw.solution,
    explanationOfSolution: raw.explanationOfSolution,
    complaintType: raw.complaintType,
    correspondenceName:
      [raw.contactFirstName, raw.contactLastName].filter(Boolean).join(" ") ||
      null,
    deadline: raw.deadline,
    documentCode: complaintDocumentCode(raw),
    documentHref,
    responsible: personName(raw.responsibleUserId, nameById),
    statusDate,
    capturedBy: personName(raw.createdByUserId, nameById),
    // Read through the link, never typed: the seller of the sales order, or
    // the purchaser of the purchase order — filled on exactly the 60 reference
    // complaints that name one.
    purchaserSeller: personName(raw.orderSeller ?? raw.purchaser, nameById),
    creationDate: raw.createdAt,
    totalCosts:
      Number(raw.costsCustomer ?? 0) +
      Number(raw.internalCosts ?? 0) +
      Number(raw.extraCosts ?? 0) +
      Number(raw.toBeReclaimed ?? 0),
  };
};
