"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { type ReactNode } from "react";

type Props = {
  href: string;
  labelKey: string;
  className?: string;
  icon?: ReactNode;
};

export const TranslatedLink = ({ href, labelKey, className, icon }: Props) => {
  const { t } = useTranslation();
  return (
    <Link href={href} className={className}>
      {icon}
      {t(labelKey)}
    </Link>
  );
};
