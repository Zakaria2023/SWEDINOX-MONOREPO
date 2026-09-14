# Order lines capacity overflow (item B15)

`Overviews → Sales → Order lines capacity overflow`, 14-9-2026. **No rows — the
screen crashes.** Captured as screenshots of the filter block, the error and
every column header (with tooltips for the truncated ones).

## 1. ⚠️ A reference bug, not an empty table

`Show Data` raises:

> **Database error** — The column "Thickness" was expected but did not occur in
> "GetReportData_CapacityOverrides". Please contact system administration.

The same class of bug as C1 (`DeliveryTerm` missing from
`GetReportData_CustomerAndProspect`): the report procedure and the grid
definition disagree about a column. **Nothing can be exported from this screen
in this version (3.13.0.499).** Whether the underlying table has rows is
unknown.

The procedure's name is the one useful fact the error gives away: the records
are **capacity overrides** — a person deciding to let an order line exceed a
capacity limit — not a computed list of overfull days.

## 2. The filter block

| Row | from | u/i |
| --- | --- | --- |
| `Scheduled delivery date` | `1-1-2024` | `14-9-2026` |
| `Line status` | **`10`** | **`830`** |

**`Line status` is filtered by its numeric code**, `10`–`830` — the same codes
as `ORDER_LINE_STATUS_CODES` in `lib/labels.ts` (`010` provisional … `830`).
Third screen to use them.

## 3. The columns — a master row and its order line

**Override (master) — 8 columns:**
`Action`, `Order`, `Order type`, `Action by`, `Company`, `Capacity date`,
`Capacity name`, `Accountability`.

**Order line (detail) — 46 columns**, in grid order:

| Group | Columns |
| --- | --- |
| Line | `Line`, `Action on`, `Product code`, `Product` |
| Dimensions | `Length (mm)`, `Width (mm)`, `Dikte` (thickness), `Kwaliteit` (quality/grade), `Categorie`, `Pick-up` |
| Sawing | `Sawing specification`, `Fixed dimensions`, `To saw`, `Sawing workorder status`, `Production starting date` |
| Delivery | `Planned Delivery`, `Delivered`, `U(delivery)`, `Delivery date (p)`, `Delivery date (a)`, `Delivery status` |
| Weight | `Kg(p)`, `Kg(a)`, `Theor. Weight (kg per Theor. Weight U.)`, `Theor. Weight U.` |
| Quantity | `Order line Deliv. Date`, `Line Qty(a)`, `Line Qty(p)`, `Line QtyU`, `Option Qty`, `Line status`, `Line type` |
| Sawing work order | `Sawing workorder`, `Sawing workorder line`, `Sawing m…` (machine), `Drilling holes`, `L.Saw angle`, `Bls`, `Bls+P`, `Sawing`, `Drilling`, `R.Saw angle`, `Standing`, `Sawing type`, `Transport date`, `Sawing angle(s)` |

`(p)` = planned, `(a)` = actual, throughout.

The crash names `Thickness`, and the grid's column is headed **`Dikte`** — an
untranslated Dutch header next to English ones. The mismatch is probably
exactly that rename.

## 4. Against our code

`OrderLineCapacityOverflows` (`db/schema/capacity-overflows.ts`) already has
the master's shape: `orderItemUuid`, `capacityCheckUuid` (→ `Capacity date` /
`Capacity name`), `action`, `actionByUserId`, `actionOn`, `accountability`. ✅
The table models an override, which is what the reference's procedure name
says it is.

Not modelled: the header's **`Order type`** (reachable through the order
line), and the sawing columns of the detail — `Sawing specification`,
`Fixed dimensions`, `L.Saw angle` / `R.Saw angle`, `Standing`, `Drilling holes`,
`Bls` / `Bls+P` (blasting, blasting + painting). Those belong to the order line
and its sawing work order, not to the override, and are covered by the
production work-order model.
