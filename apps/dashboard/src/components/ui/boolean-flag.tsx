import { Check, Minus } from "lucide-react";

type Props = {
  on: boolean | null | undefined;
  label: string;
};

// A yes/no column in an overview, drawn the way the ERP grids draw one: a tick
// when set, a dash when not. `label` names the column for screen readers, since
// the icon alone carries the value.
export const BooleanFlag = ({ on, label }: Props) =>
  on ? (
    <Check className="size-4 text-primary" aria-label={`${label}: yes`} />
  ) : (
    <Minus
      className="size-4 text-muted-foreground"
      aria-label={`${label}: no`}
    />
  );
