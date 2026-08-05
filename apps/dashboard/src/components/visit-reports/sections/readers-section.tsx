"use client";

import { useFormContext } from "react-hook-form";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DashboardUserOption } from "@/lib/server/clerk";

type Props = {
  isPending: boolean;
  adminUsers: DashboardUserOption[];
};

export const ReadersSection = ({ isPending, adminUsers }: Props) => {
  const { watch, setValue } = useFormContext<VisitReportFormValues>();
  const readers = watch("readers") ?? [];

  const getReader = (userId: string) =>
    readers.find((reader) => reader.userId === userId) ?? {
      userId,
      toRead: false,
      read: false,
    };

  const toggle = (userId: string, key: "toRead" | "read") => {
    const existing = readers.find((reader) => reader.userId === userId);
    const next = existing
      ? readers.map((reader) =>
          reader.userId === userId
            ? { ...reader, [key]: !reader[key] }
            : reader,
        )
      : [
          ...readers,
          {
            userId,
            toRead: key === "toRead",
            read: key === "read",
          },
        ];
    setValue("readers", next);
  };

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
        Readers
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Functionary</th>
              <th className="px-3 py-2 text-center font-medium">To read</th>
              <th className="px-3 py-2 text-center font-medium">Read</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-4 text-center text-muted-foreground"
                >
                  No functionaries found
                </td>
              </tr>
            ) : (
              adminUsers.map((user) => {
                const reader = getReader(user.value);
                return (
                  <tr key={user.value} className="border-b last:border-0">
                    <td className="px-3 py-1.5">{user.label}</td>
                    <td className="px-3 py-1.5 text-center">
                      <Checkbox
                        checked={reader.toRead}
                        onChange={() => toggle(user.value, "toRead")}
                        disabled={isPending}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <Checkbox
                        checked={reader.read}
                        onChange={() => toggle(user.value, "read")}
                        disabled={isPending}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
