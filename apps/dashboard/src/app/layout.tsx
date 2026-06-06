import type { Metadata } from "next";
import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swedinox Dashboard",
  description: "Swedinox admin dashboard",
};

type Props = {
  children: ReactNode;
};

const RootLayout = ({ children }: Props) => (
  <ClerkProvider>
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  </ClerkProvider>
);

export default RootLayout;
