type ProductFieldProps = {
  label: string;
  value: string | number | null | undefined;
};

/** One read-only label/value pair on the product detail screen. */
export const ProductField = ({ label, value }: ProductFieldProps) => (
  <div>
    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {label}
    </p>
    <p className="text-sm">{value === "" || value == null ? "—" : value}</p>
  </div>
);
