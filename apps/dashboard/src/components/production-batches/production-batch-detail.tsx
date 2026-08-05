import Link from "next/link";
import { ProductionBatchDetail } from "@/app/(dashboard)/production-batches/actions";
import { DetailField } from "@/components/ui/detail-field";
import { formatDateColumn, formatDateValue } from "@/lib/helpers";
import { MACHINE_PRODUCTION_LABELS } from "@/lib/labels";

type Props = {
  batch: ProductionBatchDetail;
};

export const ProductionBatchDetailView = ({ batch }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Production batch
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Code" value={batch.code} />
        <DetailField
          label="Created on the floor"
          value={formatDateColumn(batch.createdOn)}
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Machine
          </p>
          {batch.machineUuid && batch.machineName ? (
            <Link
              href={`/machines/${batch.machineUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {[batch.machineCode, batch.machineName]
                .filter(Boolean)
                .join(" — ")}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Machine production"
          value={
            batch.machineProduction
              ? MACHINE_PRODUCTION_LABELS[batch.machineProduction]
              : null
          }
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            To location
          </p>
          {batch.toLocationUuid && batch.toLocationName ? (
            <Link
              href={`/warehouses/${batch.toLocationUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {batch.toLocationName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Created" value={formatDateValue(batch.createdAt)} />
        <DetailField
          label="Last modified"
          value={formatDateValue(batch.updatedAt)}
        />
      </div>
    </section>
  </div>
);
