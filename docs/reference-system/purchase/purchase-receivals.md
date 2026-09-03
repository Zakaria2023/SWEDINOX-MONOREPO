# Purchase receivals

`Overviews → Purchase → Purchase receivals`. Ours: not yet built.

Planned vs. actual, per purchase line — what was due and what actually arrived,
in both quantity and weight.

**Filters**: `Scheduled delivery date` (from / u/i — defaulted to today on both
sides in the capture), `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product · Supplier ·
Show… · Purchase lines · Warehouse workorders · Production workorders.
**View open when captured**: none selected (blank).
**Grid was empty**, so no example values were readable.

## Columns — captured, not yet matched

Several tooltips on this screen returned the raw internal field name
(`PurchaseLineReceivals_PurchaseOrderCode`) rather than a friendly label, unlike
every other screen captured so far — see question 1.

| # | Reference heading | Notes |
|---|---|---|
| 1 | *(truncated)* | tooltip read `PurchaseLineReceivals_PurchaseOrderCode` |
| 2 | *(truncated)* | tooltip read `PurchaseLineReceivals_PurchaseLineCode` |
| 3 | *(truncated)* | tooltip read `PurchaseLineReceivals_CompanyCode` |
| 4 | *(truncated)* | tooltip read `PurchaseLineReceivals_CompanyName` |
| 5 | Purchase order date | tooltip confirmed |
| 6 | Line amount | |
| 7 | Qty(p) | planned quantity |
| 8 | Unit | the quantity's unit, as a column |
| 9 | Qty(a) | actual quantity — see question 2 |
| 10 | Received Qty | see question 2 |
| 11 | Price quantity (in gross price U.) | tooltip confirmed — see question 4 |
| 12 | Invoiced (Prod.) | tooltip confirmed — see question 5 |
| 13 | Options | |
| 14 | Line status | see question 3 |
| 15 | Receipt date | |
| 16 | Purchaser | |
| 17 | Initials | the purchaser's initials, as a separate column |
| 18 | Product code | |
| 19 | Product | |
| 20 | Kg(a) | actual weight |
| 21 | Length | |
| 22 | Receipt status | see question 3 |
| 23 | Delivery date (a) | actual delivery date |
| 24 | Delivery date (p) | planned delivery date — see question 6 |
| 25 | Kg(p) | planned weight |

The `(p)`/`(a)` suffix pairing — planned vs. actual — appears three times
(`Qty`, `Kg`, `Delivery date`), the clearest instance yet of that convention.

## 🔴 What is needed before this can be built

**1. What do the four truncated headers actually say?**
Their tooltips gave raw field names, not display labels — the one screen so far
where that happened. The real (short) header caption is still unread.
→ *In the old system:* widen columns 1–4 until each heading is fully readable,
without relying on the tooltip.

**2. `Qty(a)` vs `Received Qty` — the same figure twice, or this-receipt vs.
running-total?**
A line can be received in more than one delivery. `Qty(a)` next to `Qty(p)`
reads like this row's actual quantity; `Received Qty` sitting apart, next to
`Price quantity`, may be the cumulative total received against the line so far.
→ *In the old system:* find a purchase line received in two separate
deliveries and check whether it produces two rows here. If so, compare `Qty(a)`
and `Received Qty` on each — if `Received Qty` grows cumulatively while `Qty(a)`
is per-row, that confirms the split.

**3. `Line status` vs. `Receipt status` — two different fields.**
One is presumably the purchase line's own status (open/closed/cancelled) and
the other this specific receipt's status (e.g. pending inspection, accepted).
→ *In the old system:* group the grid by each in turn to list their distinct
values, and check whether they ever disagree on the same row.

**4. `Price quantity (in gross price U.)` — what is a "gross price unit"?**
Distinct from the ordinary purchase unit (`Purchase U.` elsewhere), this
suggests pricing can be struck on a different basis than the unit purchased in —
e.g. a gross weight before a scrap or yield deduction.
→ *In the old system:* open a purchase line with a gross-price-unit value and
compare it against the line's ordinary `Purchase U.` and `Qty(p)`.

**5. `Invoiced (Prod.)` — "Prod." as Product, or as Production?**
If Product: the invoiced quantity in product units. If Production: a link to a
production work order this receipt feeds.
→ *In the old system:* open a receipt row with a non-zero value here and check
whether it points at a purchase invoice line or at a production work order.

**6. `Delivery date (p)` vs. the `Scheduled delivery date` filter — the same
date?**
→ *In the old system:* set the filter to a narrow range and check whether every
returned row's `Delivery date (p)` falls inside it.

**7. `Company code` / `Company name` — the supplier, or a branch?**
Same ambiguity as `Company code` on
[Purchase quotes](purchase-quotes.md#-what-is-needed-before-this-can-be-built).
→ *In the old system:* compare against the row's own supplier, if a separate
supplier column exists elsewhere on this line's purchase order.
