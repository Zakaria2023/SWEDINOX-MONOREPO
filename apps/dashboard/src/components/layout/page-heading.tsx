"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/helpers";

type Props = {
  titleKey: string;
  descriptionKey?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export const PageHeading = ({
  titleKey,
  descriptionKey,
  titleClassName,
  descriptionClassName,
}: Props) => {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className={cn("text-3xl font-bold text-gray-900", titleClassName)}>
        {t(titleKey)}
      </h1>
      {descriptionKey && (
        <p className={cn("mt-2 text-gray-600", descriptionClassName)}>
          {t(descriptionKey)}
        </p>
      )}
    </div>
  );
};
