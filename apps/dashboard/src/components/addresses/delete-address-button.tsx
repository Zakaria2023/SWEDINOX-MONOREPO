"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteAddress } from "@/app/(dashboard)/addresses/actions";
import { Button } from "@/components/shadcn/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type DeleteAddressButtonProps = {
  addressId: number;
  label: string;
};

export const DeleteAddressButton = ({
  addressId,
  label,
}: DeleteAddressButtonProps) => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    setIsPending(true);
    setError("");

    try {
      const result = await deleteAddress(addressId);

      if (!result.success) {
        setError(result.error ?? "Failed to delete address.");
        return;
      }

      setIsOpen(false);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          setError("");
          setIsOpen(true);
        }}
      >
        <Trash2 className="text-destructive" />
        <span className="sr-only">Delete address</span>
      </Button>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);

          if (!open) {
            setError("");
          }
        }}
        title="Delete Address"
        description={
          error
            ? error
            : `Delete address "${label}"? This cannot be undone.`
        }
        onConfirm={() => {
          void handleDelete();
        }}
        isPending={isPending}
      />
    </>
  );
};
