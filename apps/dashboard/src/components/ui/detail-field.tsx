import { ReactNode } from "react";

type DetailFieldProps = {
  label: string;
  value: ReactNode;
};

/**
 * One read-only label/value pair on a detail screen. An empty or absent value
 * prints an em dash, so a blank field reads as "nothing recorded" rather than
 * as a rendering failure.
 */
export const DetailField = ({ label, value }: DetailFieldProps) => (
  <div>
    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {label}
    </p>
    <p className="text-sm">{value === "" || value == null ? "—" : value}</p>
  </div>
);
