"use client";

import { useState } from "react";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { PurchaseRequestDetail } from "@/app/(dashboard)/purchase-requests/actions";
import { PurchaseRequestFormValues } from "@/app/(dashboard)/purchase-requests/validation";
import { ClerkUserOption } from "@/lib/server/clerk";
import { PurchaseRequestForm } from "./purchase-request-form";
import { SendPurchaseRequestDialog } from "./send-purchase-request-dialog";

type Props = {
  request: PurchaseRequestDetail;
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
  defaultValues: PurchaseRequestFormValues;
  /** Changes whenever the stored request does, so the form reopens afresh. */
  version: string;
};

/**
 * A saved request: its form, plus the `Send` dialog held above it. `Make
 * final` releases the request, which reopens the form on the new values —
 * the dialog the reference asks next must outlive that, so it lives here.
 */
export const PurchaseRequestScreen = ({
  request,
  companies,
  clerkUsers,
  defaultValues,
  version,
}: Props) => {
  const [isSendOpen, setIsSendOpen] = useState(false);

  return (
    <>
      <PurchaseRequestForm
        key={version}
        companies={companies}
        clerkUsers={clerkUsers}
        existing={request}
        defaultValues={defaultValues}
        onSend={() => setIsSendOpen(true)}
      />
      <SendPurchaseRequestDialog
        request={request}
        open={isSendOpen}
        onOpenChange={setIsSendOpen}
      />
    </>
  );
};
