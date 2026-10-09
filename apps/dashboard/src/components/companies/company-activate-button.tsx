"use client";

import { setCompanyInactive } from "@/app/(dashboard)/companies/actions";
import { Button } from "@/components/shadcn/button";
import { Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  companyUuid: string;
  isInactive: boolean;
};

/**
 * The company toolbar's `Activate`: greyed on an active company, and on an
 * inactive one it puts the company back on the active lists.
 */
export const CompanyActivateButton = ({ companyUuid, isInactive }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () =>
    startTransition(async () => {
      await setCompanyInactive(companyUuid, false);
      router.refresh();
    });

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={!isInactive || isPending}
    >
      <Undo2 className="me-1.5 size-4" />
      Activate
    </Button>
  );
};
