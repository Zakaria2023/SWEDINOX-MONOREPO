# Purchase lines

`Overviews → Purchase → Purchase lines`. Ours: `/purchase-lines`.

Every line of every purchase order, as one flat list. The default view is
"upcoming receipts" — what is coming in, when.

**Filters**: `Creation date` (from / to), `Only current purchasing lines`
(checkbox, **checked** by default), `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product ·
Show Company · Show Purchase order · Quotes… · Purchase lines ·
Production workorders.
**View open when captured**: `Aankomende ontvan…` (Dutch for "upcoming
receipts").
**Grouped by**: `Receipt date` — collapsed groups reading `Receipt date : 2-1-2025`,
`15-1-2025`, `17-1-2025`, … in ascending order.
**Row count shown**: 405.
**User filter bar at the bottom**: `Purchase order type = Purchase order AND
Supplier ≠ Hego Production`, with `Edit Filter`. Not part of the screen — that
is a filter somebody built.

## Columns — captured, not yet matched

| # | Reference heading | Notes |
|---|---|---|
| 1 | Date Created | |
| 2 | Purchase order type | the same field as column 5 — see below |
| 3 | No. | the purchase order number |
| 4 | Line | line number within the order |
| 5 | Purchase order type | a duplicate of column 2 |
| 6 | Line type | tooltip confirmed |
| 7 | Status | |
| 8 | Product | the description |
| 9 | Supplier | grid was sorted on this |
| 10 | Product code | |
| 11 | Quality Code | tooltip confirmed |
| 12 | Stock Category | |
| 13 | Options | |
| 14 | Length (mm) | |
| 15 | Width (mm) | |
| 16 | Thickness | tooltip confirmed — **no (mm) suffix**, unlike length and width |
| 17 | Qty(p) (Pur.U.) | tooltip confirmed — planned quantity, purchase unit |
| 18 | Purchase U. | tooltip confirmed — the unit itself, as a column |
| 19 | Reserved (Pur.U.) | tooltip confirmed |
| 20 | Kg(pur) | purchased weight |
| 21 | Purchaser | |

**Receipt date** is a column too — it has to be, since the grid groups by it —
but it was not visible in either capture because grouping moves it out of the
column strip.

## 🔴 What is needed before this can be built

**1. Answered — it is one field, shown twice.**
Positions 2 and 5 both read `Purchase order type`, confirmed by hovering each
in turn. They are not two fields with a shared tooltip; the saved view simply
carries the column twice, which is easy to do by dragging in a grid like this.
Both headings also show the same ▽ filter glyph, matching the user filter at
the bottom of the screen (`Purchase order type = Purchase order`).

So this is **one database column**, and our single type field on
`PurchaseOrders` is right. Ours prints it once.

**2. `Only current purchasing lines` — what does "current" mean?**
It is checked by default, so it is the normal way this screen is read. It could
mean not-yet-fully-received, or not cancelled, or belonging to an open order.
→ *In the old system:* note the row count with it checked (405 in the capture),
then uncheck it, press `Show Data`, and compare. Then look at what the extra
rows have in common — a status, a fully-received quantity, a cancelled order.

**3. `Line type` — what are its values?**
→ *In the old system:* group the grid by `Line type` (drag its header up) to see
every distinct value at once, with counts.

**4. `Status` — what are its values, and is it the line's or the order's?**
Our `PurchaseOrders.status` is on the order (`open`, `confirmed`,
`pre_notified`, …). This column is on a line row, so it may be a line-level
status we do not model.
→ *In the old system:* group by `Status` the same way. If two lines of one order
show different statuses, it is line-level and we need the column.

**5. `Stock Category` and `Quality Code` — where do they come from?**
Both appear on the warehouse work-order grids too (`Voorraadcategorie`,
`Kwaliteitscode`), so they are probably product or lot attributes rather than
purchase-line ones.
→ *In the old system:* open a product and look for both fields. If they are on
the product, they are joined in, not stored on the line.

**6. `Receipt date` — planned or actual?**
The view is named "upcoming receipts" and groups by it, with dates in the past
(2-1-2025 onwards) while the system date is 3-9-2026. Past dates in an
"upcoming" view suggests these are *planned* dates that have been missed — which
would make this screen a late-delivery list as much as a forecast.
→ *In the old system:* expand one of the older groups and check whether those
lines are still open. If they are, the date is planned and overdue.

**7. `Thickness` has no `(mm)` suffix** where length and width do. Probably still
millimetres, but it may be a decimal where the others are integers — our
warehouse line schema already models it that way (`thickness` decimal, `length`
and `width` int).
