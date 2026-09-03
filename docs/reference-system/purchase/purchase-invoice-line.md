# Purchase invoice line

`Overviews → Purchase → Purchase invoice line`. Ours: `/purchase-invoice-line`.

Purchase invoice lines. The view that was open is **`CBS - IRIS`**, which is not
a general-purpose layout — it is the statutory one: CBS is the Dutch statistics
bureau, and these columns are what an Intrastat / goods-flow return declares.

**Filters**: `Bookings date` (from / to), `Use booking date system` (checkbox,
**checked**), `Use invoice posting date` (checkbox, **checked**), `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product ·
Show Company · Show Purchase invoice · Purchase lines · Production workorders.
**View open when captured**: `CBS - IRIS`.
**Footer**: `Σ=` under `Weight` and under `Qty`.
**Grid was empty**, so no example values were readable.

## Columns — captured, not yet matched

| # | Reference heading | Notes |
|---|---|---|
| 1 | Year (Invoice date) | tooltip confirmed — a grouping key |
| 2 | Month (Invoice date) | tooltip confirmed |
| 3 | Purchase order | |
| 4 | Line | |
| 5 | CBS no. | the commodity code the return declares |
| 6 | Country | country of origin / dispatch |
| 7 | Weight | summed in the footer |
| 8 | Qty | summed in the footer |
| 9 | Revenue products | |
| 10 | VAT number | the supplier's |

Note the year/month pair here is on the **invoice date**, where Purchase results
uses the **receipt date**. Same pattern, different anchor — worth keeping
straight, because a return is filed on one and stock arrives on the other.

## What we already have

Our `/cbs-documentation` screen exists and `sfnCounterpartyRoles` +
`transportModes` already carry Intrastat concepts (`cbsCode`, mode-of-transport
codes), and `FreightMovements` records the goods flow. So this screen is probably
a second window onto machinery we have rather than something new — but it is
reading it off **purchase invoice lines**, which is a different grain from
`FreightMovements`.

## 🔴 What is needed before this can be built

**1. The two date checkboxes — what do they switch between?**
`Use booking date system` and `Use invoice posting date` are both checked, and
the filter above them is called `Bookings date`. So there appear to be up to
three dates on a purchase invoice: a system booking date, a posting date, and
possibly the invoice's own date. Which one the filter applies to depends on
these two boxes, and we model only one.
→ *In the old system:* set the `Bookings date` range to a month you know has
invoices, press `Show Data`, and note the row count. Then uncheck each box in
turn and re-run. If the count changes, they select which date the range is
applied to — and the ones that drop out will show which date they were matched
on.

**2. `CBS no.` — on the product, or on the line?**
A commodity code is normally a product attribute. Ours does not obviously carry
one.
→ *In the old system:* open a product and look for a CBS or commodity-code field.
If it is there, this column is joined in; if not, it is entered per invoice line.

**3. `Revenue products` — a name, a number, or an amount?**
The heading is plural, which reads like a grouping ("revenue products" as a
category) rather than a value. Purchase quotes had `Revenue group` and
`Revenue group number`, so this may be a third variant.
→ *In the old system:* widen the column with data on screen. If it holds money it
is a value; if it holds a name it is the revenue group under which the bought
product sells.

**4. `Country` — of origin, of dispatch, or the supplier's?**
Intrastat distinguishes these and they can differ.
→ *In the old system:* find an invoice from a supplier whose goods came from a
third country. If the column shows the goods' origin rather than the supplier's
address country, it is country of origin.

**5. What the `CBS - IRIS` view is for, and whether there is a plainer one.**
This is a statutory layout. If the screen is meant to be a general list of
purchase invoice lines, there will be another saved view with the ordinary
columns (product, quantity, price, amount).
→ *In the old system:* open the `View` dropdown on this screen and list every
saved view. If there is a default/blank one, capture that too — it is more
likely what our page should show, with `CBS - IRIS` as a second layout later.

**6. `Qty` has no unit column** where every other purchase screen names its unit
(`QtyU`, `Purchase U.`, `Stock U.`). A statutory return is filed in kilos plus a
supplementary unit, so `Weight` and `Qty` are probably exactly those two —
meaning `Qty` is in the commodity code's own supplementary unit, not the
product's.
→ *In the old system:* check two rows with different products but the same CBS
no. and see whether their `Qty` is comparable.
