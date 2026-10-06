import { getLanguageDirection } from "@/i18n/config";
import { getLang } from "@/i18n/getServerLang";
import I18nProvider from "@/providers/I18NextProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { arSA } from "@clerk/localizations/ar-SA";
import { enUS } from "@clerk/localizations/en-US";
import { nlNL } from "@clerk/localizations/nl-NL";
import { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swedinox Dashboard",
  description: "Swedinox admin dashboard",
};

type Props = {
  children: ReactNode;
};

const clerkLocalizations = { ar: arSA, en: enUS, nl: nlNL };

const RootLayout = async ({ children }: Props) => {
  const language = await getLang();

  return (
    <ClerkProvider localization={clerkLocalizations[language]}>
      <html
        lang={language}
        dir={getLanguageDirection(language)}
        suppressHydrationWarning
      >
        <body className="antialiased">
          <I18nProvider key={language} initialLang={language}>
            {children}
          </I18nProvider>
        </body>
      </html>
    </ClerkProvider>
  );
};

export default RootLayout;
