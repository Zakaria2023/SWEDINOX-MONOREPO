import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  href: string;
};

export const TableNewLink = ({ children, href }: Props) => (
  <Link
    href={href}
    className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/80"
  >
    {children}
  </Link>
);
