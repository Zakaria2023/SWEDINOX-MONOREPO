# Purchase results

`Overviews → Purchase → Purchase results`. Ours: `/purchase-results`.

Did we buy well? Each receipt's purchase value set against what the same
material would cost today, so buying performance is visible per product and per
period.

**Filters**: `Receipt date` (from / to), `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product ·
Purchase lines · Warehouse workorders · Orders and Quotes ·
Production workorders.
**View open when captured**: none selected (blank).
**Grid was empty**, so no example values were readable.

## Columns — captured, not yet matched

| # | Reference heading | Notes |
|---|---|---|
| 1 | Main group | grid was sorted on this |
| 2 | Subgroup | see question 1 |
| 3 | Product | |
| 4 | Year (Date received) | tooltip confirmed — a grouping key, not a date |
| 5 | Month (Receipt Date) | tooltip confirmed |
| 6 | Receipt date | the date itself |
| 7 | Purchase value | what was paid |
| 8 | Replacement value | what it would cost now |
| 9 | Purchase -/- replacement value (€) | the difference in money |
| 10 | Purchase -/- replacement value (%) | the same difference as a percentage |

`-/-` is Dutch bookkeeping shorthand for "minus", so columns 9 and 10 are
`purchase value − replacement value`, once in euros and once as a percentage. A
negative figure means the material was bought cheaper than it would cost today —
a good purchase.

Year and Month exist as their own columns so the grid can be dragged into
year/month groups without needing a date function; the underlying date is
column 6.

## 🔴 What is needed before this can be built

**1. The product hierarchy — this is now the third different naming.**
Order advice shows `Main group`. Sold products not on the order recommendation
shows `Main group` **and** `Product group`. This screen shows `Main group` **and**
`Subgroup`. Ours joins `ProductGroups` once and calls it the main group, which
cannot serve all three.
→ *In the old system:* open `Overviews → Logistics → Products`, then open one
product and read its group fields. Either there is one group field whose value
sits under a parent — in which case `Main group` is the parent and
`Subgroup`/`Product group` are the same thing under two names — or there are
genuinely two fields. Also open a product **group** and check whether it has a
parent of its own.

This blocks three screens at once, so it is the first thing worth answering.

**2. Where does `Replacement value` come from?**
Our `Products` carries a replacement price and our order lines already compute
`profitReplPrice`, so the concept exists. What is unclear is whether this screen
uses the replacement price **as at the receipt date** or **as at today** — the
difference decides whether the figure is stable history or moves every day.
→ *In the old system:* note the value for an old receipt, then come back to the
same row after the replacement price has been changed on that product (or check
whether `Control Revaluation of stock due to FSP-changes` records such changes —
if it does, the price is versioned and this screen can look it up historically).

**3. Is `Purchase value` the line's cost, or the received quantity's?**
A purchase line can be received in parts. If the row is per receipt, the value
should be the received portion, not the whole line.
→ *In the old system:* find a purchase line received in two goes and see whether
it appears here once or twice.

**4. What is one row?**
Main group / Subgroup / Product / Receipt date suggests one row per product per
receipt. But with Year and Month as their own columns it may be pre-aggregated
per product per month.
→ *In the old system:* press `Show Data` over a month where one product was
received twice on different dates. Two rows means per-receipt; one row means
per-month.

**5. The percentage's denominator.**
`(purchase − replacement) / purchase` and `/ replacement` give different numbers.
→ *In the old system:* read one row's three value columns and divide it out.
