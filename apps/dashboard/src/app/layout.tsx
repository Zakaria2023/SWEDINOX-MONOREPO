import { getLanguageDirection } from "@/i18n/config";
import { getLang } from "@/i18n/getServerLang";
import I18nProvider from "@/providers/I18NextProvider";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swedinox Dashboard",
  description: "Swedinox admin dashboard",
};

type Props = {
  children: ReactNode;
};

const RootLayout = async ({ children }: Props) => {
  const lang = await getLang();

  return (
    <ClerkProvider>
      <html lang={lang} dir={getLanguageDirection(lang)} suppressHydrationWarning>
        <body className="antialiased">
          <I18nProvider key={lang} initialLang={lang}>
            {children}
          </I18nProvider>
        </body>
      </html>
    </ClerkProvider>
  );
};

export default RootLayout;
