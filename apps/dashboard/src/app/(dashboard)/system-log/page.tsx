import { getSystemLogs } from "@/app/(dashboard)/system-log/actions";
import { SystemLogTable } from "@/components/system-log/system-log-table";
import { SystemLogCategory, systemLogCategories } from "@/lib/enums";
import { getClerkUserNames } from "@/lib/server/clerk";

type Props = {
  searchParams: Promise<{ category?: string }>;
};

const SystemLogPage = async ({ searchParams }: Props) => {
  const { category } = await searchParams;
  const selected =
    systemLogCategories.find((value): value is SystemLogCategory =>
      value === category,
    ) ?? null;

  const [rows, userNames] = await Promise.all([
    getSystemLogs(selected),
    getClerkUserNames(),
  ]);

  return (
    <div className="space-y-4">
      <SystemLogTable rows={rows} selected={selected} userNames={userNames} />
    </div>
  );
};

export default SystemLogPage;
