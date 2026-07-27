"use client";

import { markCertificateReceived } from "@/app/(dashboard)/certificates-received/actions";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { FormError } from "@/components/ui/form-error";
import { FormLabel } from "@/components/ui/form-field";
import { Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  certificateUuid: string;
  internalCharge: string | null;
};

export const MarkReceivedDialog = ({
  certificateUuid,
  internalCharge,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [documentCode, setDocumentCode] = useState("");
  const [fileName, setFileName] = useState("");
  const [formError, setFormError] = useState<string | undefined>();

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setDocumentCode("");
      setFileName("");
      setFormError(undefined);
    }
    setDialogOpen(open);
  };

  const onSubmit = () =>
    startTransition(async () => {
      setFormError(undefined);
      const result = await markCertificateReceived(
        certificateUuid,
        documentCode,
        fileName,
      );
      if (result.error) {
        setFormError(result.error);
        return;
      }
      handleDialogClose(false);
      router.refresh();
    });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
      >
        <Link2 className="mr-1.5 size-4" />
        Link
      </Button>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link certificate</DialogTitle>
            <DialogDescription>
              Record the certificate that arrived for batch{" "}
              {internalCharge ?? "—"}.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div>
              <FormLabel htmlFor="certificate-document-code" required>
                Document code
              </FormLabel>
              <Input
                id="certificate-document-code"
                value={documentCode}
                onChange={(event) => setDocumentCode(event.target.value)}
                placeholder="CERT-00123"
                disabled={isPending}
              />
            </div>
            <div>
              <FormLabel htmlFor="certificate-file-name" required>
                File name
              </FormLabel>
              <Input
                id="certificate-file-name"
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
                placeholder="cert-00123.pdf"
                disabled={isPending}
              />
            </div>
            <FormError>{formError}</FormError>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={onSubmit} disabled={isPending}>
              {isPending ? "Saving..." : "Mark received"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
