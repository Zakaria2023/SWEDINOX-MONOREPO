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

**3. The percentage's denominator.**
`(purchase − replacement) / purchase` and `/ replacement` give different numbers.
→ *In the old system:* read one row's three value columns and divide it out.

## The hierarchy behind `Main group` and `Subgroup`

Settled on the product screens rather than here. The group tree is a single
self-referencing entity, at least four levels deep, with each record naming its
parent in a **`Material group`** field:

```
Aluminum  →  Aluminium plates  →  Aluminium plate semi-rigid 1S (Al 99.5)  →  …3000x1500x4mm
```

`Main group` is the root of that chain. Ours now climbs to it rather than
stopping at the immediate parent. Full detail in the
[README](../README.md#the-product-hierarchy--answered).

**`Subgroup` is now settled too.** An export of this screen — 1,800 rows, kept
as `exports/purchase-results.tsv` — prints its Main group / Subgroup / Product
triples directly:

| Main group | Subgroup | Product |
|---|---|---|
| Aluminum | Aluminium plate semi-rigid 1S (Al 99.5) | Aluminium plate semi-rigid 1S (Al 99.5) |
| Aluminum | Aluminium coils A1050 | Aluminium coils A1050 |
| Aluminum | Aluminium plate tears 54S (AlMg 3) | Aluminium plate tears 54S (AlMg 3) |

`Subgroup` holds the level directly above the product — the same level
[Sold products](sold-products-not-advised.md) calls `Product group` — with
`Main group` the root above it. Level two of the tree is skipped in the
display, exactly as it is there. `Product` usually repeats the subgroup name,
but not always — see the correction below.

`Main group` takes two values across the export: `Stainless Steel` (1,675) and
`Aluminum` (125).

## ✅ One row per receipt line — no aggregation at all

The old questions 3 and 4 asked whether the grid is pre-aggregated per product
per month. **It is not, and not even per day.** The 1,800 rows cover only
**466** distinct (Subgroup, Receipt date) pairs, and 278 of those pairs carry
more than one row. The extreme case:

> `Cold-rolled plate 304` on **2025-03-10** produces **29 rows**, and all 29
> `Purchase value` figures are **different** — 922,50 · 2 279,60 · 3 034,00 ·
> 2 203,75 · … · 4 955,75.

Twenty-nine distinct values cannot be an aggregate of anything. So one row is
**one receipt line**, and `Purchase value` is that receipt's own cost — which
also answers question 3: a line received in two goes appears **twice**.

**`Year` and `Month` are derived**, not stored: both agree with
`Receipt date` on **1,800 of 1,800** rows. They exist only so the grid can be
dragged into a year/month grouping, so ours computes them.

⚠️ **Correction.** This doc previously said the screen "aggregates at the
subgroup" because `Product` repeats the subgroup name. That was wrong on both
counts: there is no aggregation, and `Product` **does** differ from `Subgroup`
on 32 of the 1,800 rows — `Stainless steel coils` against
`Coil Cold-rolled 439`. It is a genuine level below, which merely happens to
carry the same name most of the time.

The export's own span, for the record: `Receipt date` runs
**2025-01-07 … 2026-02-12** across 7 distinct months, from a filter set to
`7-9-2022 … 7-9-2026` — so there is nothing before 2025.

## 🔴 Dead columns

`Replacement value` is **zero on every one of the 1,800 rows**, which makes
`Purchase -/- replacement value (€)` and `(%)` dead with it — the percentage
cannot be reconstructed because there is nothing to divide. Either the business
does not maintain replacement prices, or this screen never receives them. Worth
one glance before building those three columns at all.
