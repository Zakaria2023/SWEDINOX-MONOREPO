import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { workPanelTypes } from "../../lib/enums";

// A record somebody has open for editing — the reference's `Geopende
// werkpanelen`. While the lock is held, a save by anyone else is refused, so two
// people cannot overwrite each other. A lock left behind by a closed browser
// stays until its owner opens the record again or somebody removes it on the
// Open work panels screen, as the reference's `Delete Lock` does.
export const WorkPanelLocks = mysqlTable(
  "WorkPanelLocks",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    panelType: mysqlEnum("panel_type", workPanelTypes).notNull(),
    recordUuid: char("record_uuid", { length: 36 }).notNull(),
    description: varchar("description", { length: 255 }),
    userId: varchar("user_id", { length: 255 }).notNull(),

    openedAt: timestamp("opened_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_work_panel_locks_record").on(
      table.panelType,
      table.recordUuid,
    ),
  ],
);

export type SelectWorkPanelLocks = InferSelectModel<typeof WorkPanelLocks>;
export type InsertWorkPanelLocks = InferInsertModel<typeof WorkPanelLocks>;
