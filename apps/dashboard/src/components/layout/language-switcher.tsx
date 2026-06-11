"use client";

import { Select } from "@/components/shadcn/select";
import { supportedLanguages } from "@/i18n/config";
import { useI18nContext } from "@/providers/I18NextProvider";
import { useTranslation } from "react-i18next";

export const LanguageSwitcher = () => {
  const { changeLanguage, language } = useI18nContext();
  const { t } = useTranslation();

  const options = supportedLanguages.map((value) => ({
    value,
    label: t(`language-switcher.languages.${value}`),
  }));

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {t("language-switcher.label")}
      </span>
      <div className="w-28">
        <Select
          value={language}
          onValueChange={(nextLanguage) => changeLanguage(nextLanguage as typeof language)}
          options={options}
        />
      </div>
    </div>
  );
};
