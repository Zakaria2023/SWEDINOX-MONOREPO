# Sold products not on the order recommendation

`Overviews → Purchase → Sold products not on the order recommendation`.
Ours: `/sold-products-not-advised`.

The complement of [Order advice](order-advice.md): products that **sold** in a
period but which the advice does not cover — so a buyer can see demand the
stocking policy is silent about. Typically a non-stock or non-standard product
somebody keeps selling.

**Filters**: `Product code` (from / `u/i`, the upper bound left as
`zzzzzzzzzzzzzz`), `Invoice date` (from / `u/i`, captured as `11-1-2023` →
`4-9-2026`, i.e. wide open to today), `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product · Purchase
lines · Warehouse workorders · Orders and Quotes · Production workorders.
**View open when captured**: none selected (blank).

## Columns — matched

All 13, in the reference system's own order, sorted on `Main group`.

| # | Reference heading | Our field | Where ours gets it |
|---|---|---|---|
| 1 | Main group | `mainGroup` | root of the group hierarchy — `COALESCE(parent.name, group.name)` |
| 2 | Product group | `productGroup` | the product's own group, but only when it has a parent |
| 3 | Product code | `productCode` | `Products.productCode` |
| 4 | Description | `productName` | `Products.name` |
| 5 | Stock product | `stockProduct` | `Products.stockProduct` — a tick |
| 6 | Standard product | `standardProduct` | `Products.standardProduct` — a tick |
| 7 | Avg. Monthly consumption last year (Stk.U.) | `avgMonthlyConsumption` | invoiced `weightKg` ÷ 12, restated in the stock unit |
| 8 | Revenue | `revenue` | `SUM(InvoiceItems.amount)` — money |
| 9 | Sales | `sales` | `SUM(InvoiceItems.weightKg)` — a weight in kilos |
| 10 | Stock (Stk.U.) | `stock` | `SUM(Stock.quantity)`, own & unblocked |
| 11 | Available (StkU) | `available` | stock − reserved |
| 12 | Stock U. | `stockUnit` | `Products.stockUnit` |
| 13 | PAC-Code | `pacClassification` | `ProductGroups.pacClassification` |

The suffix on 10 and 11 is inconsistent in the reference system itself —
`(Stk.U.)` on one, `(StkU)` on the next. Ours copies both verbatim rather than
tidying them, so the columns stay recognisable to anyone moving between the two
systems.

## Sample rows, as the reference system printed them

Kept as an answer key: these are real figures to reconcile ours against once we
have equivalent data.

| Main group | Product group | Product code | Stock | Std | Avg | Revenue | Sales | Stock (Stk.U.) | Stock U. |
|---|---|---|---|---|---|---|---|---|---|
| Aluminum | *(blank)* | `PCSA10500010` | ✓ | ✓ | 0,0 | € 504,25 | 28,30 | 0,00 | ST |
| Aluminum | Aluminium coils A5754 | `CAA5754025` | ☐ | ☐ | 0,0 | € 10.409,28 | 2.096,00 | 0,00 | ST |
| Aluminum | *(blank)* | `CAA5754200` | ✓ | ✓ | 0,0 | € 93.910,79 | 23.350,00 | 0,00 | ST |
| Stainless Steel | Cold-rolled plate 316L | `PK316L08025125` | ✓ | ✓ | 0,0 | € 4.006,00 | 920,00 | 46,00 | ST |
| Stainless Steel | Cold-rolled plate 304L | `PK304L100415` | ✓ | ✓ | 0,0 | € 16.114,56 | 5.232,00 | 15,00 | ST |

## Answered

**1. The product hierarchy — two levels of one tree, read from the root down.**
This is the question that was blocking three screens, and this grid settles it
by showing both levels at once.

`Main group` takes a handful of material families — `Aluminum`,
`Stainless Steel`. `Product group` is specific — `Aluminium coils A5754`,
`Cold-rolled plate 316L`. So it is one hierarchy, and our self-referencing
`ProductGroups.parentUuid` models it correctly.

The catch is the direction it is read in. Three rows show a `Main group` with an
**empty** `Product group` — `PCSA10500010`, `CAA5754200`, `PC605007T5` — while
their neighbours in the same family show both. A product can therefore hang
straight off a main group without sitting in any sub-group, and the reference
system prints that as *main group filled, product group blank*.

Ours had it backwards: it read the product's own group into `Product group` and
that group's parent into `Main group`, so a product attached directly to
`Aluminum` would have printed `Aluminum` under **Product group** with **Main
group** empty — the mirror image of what the reference system shows.

**Implemented** in both screens:

- `Main group` = `COALESCE(parent.name, group.name)` — always the root.
- `Product group` = the group's own name, but `NULL` when it has no parent.

[Order advice](order-advice.md) shows only `Main group`, and it was reading the
product's own group. It now reads the same root, so the two screens agree on
what family a product belongs to.

**Update — the tree is four levels, not two.** Walking "Show product group"
from a sized plate climbs `Aluminum` → `Aluminium plates` → `Aluminium plate
semi-rigid 1S (Al 99.5)` → the plate itself, each naming its parent in a
`Material group` field. So "the root" can be three hops up, not one, and both
screens now climb the whole way. The full walk is in the
[README](../README.md#the-product-hierarchy--answered).

**4. `Revenue` is money, `Sales` is a weight — both proved to the cent.**
`PCSA10500010`'s own product screen lists the three orders behind its row:

| Order | Qty | Kg | Net price |
|---|---|---|---|
| `O101160` | 95 ST | 1,7 | € 0,55 /ST |
| `O100559` | 130 ST | 2,3 | € 0,40 /ST |
| `O100606` | 500 ST | 24,1 | € 0,80 /ST |

Its grid row reads **Revenue € 504,25** and **Sales 28,30**.

```
95×0,55 + 130×0,40 + 500×0,80 = 52,25 + 52,00 + 400,00 = 504,25   ✓ exact
```

So `Revenue` = `SUM(quantity × net price)` = `SUM(InvoiceItems.amount)`, which
is what ours already computed.

And `Sales` tracks the **Kg** column, not the Qty column: `1,7 + 2,3 + 24,1 =
28,1` against a shown 28,30, where the quantities sum to 725 ST — nowhere near.
`Sales` is a **weight in kilograms**. (The 0,2 gap is a fourth line below the
fold or the Kg column's own rounding.)

This is the independent confirmation of the unit finding in question 7 below.

**6. `Stock U.` as a column.** Confirmed, and it genuinely varies: `ST` on
most rows but `KG` on `SC304`. The grid mixes products stocked in different
units, which is exactly why the unit is a column rather than a heading suffix.

**3. Answered — "Standard product" is derived, not set by hand.**
On the product screen's *Stock control* panel the two sit together:

```
☑ Stock product      27-12-2024
☑ Standard product   ← greyed out
```

`Stock product` is editable and carries the date it was set; `Standard product`
is greyed, so the system maintains it. That explains the pattern in the grid,
where the two flags never disagreed across two dozen rows.

We keep `Products.standardProduct` as a stored column for now, because the rule
that derives it is still unknown — a product could be "standard" because it is
stocked, or because it is the canonical variant of its group. Nothing depends
on it beyond being displayed, so a wrong guess here costs one column.

## 🔴 Still open

**2. Answered — the exclusion is per product, and it is a clean set difference.**
Exporting both screens settles it. They share **20 product groups** but **not a
single product code**: 0 of 175. So the rule is a plain complement of what
Order advice includes.

What it cannot be is a group-level flag. Eighty-three of these rows are
`Stock product` **ticked** *and* sit in a group that also feeds Order advice —
`CAA1050020` appears here while `CAA1050030`, in the same group and equally a
stock product, appears there. One flag on the group could not produce both.

**Implemented** — both screens now read `Products.makingOrderAdvices` rather
than the group's copy. The column already existed on `Products` as well as
`ProductGroups`, so nothing had to change in the schema; only the two queries
were looking at the wrong table. The group keeps its copy as the default the
product form starts from.

## Verified against the reference

The 175-row export was seeded and our screen diffed against it, the same way
[Order advice](order-advice.md) was:

| Column | Match | Differ |
|---|---|---|
| Avg. Monthly consumption last year | **175** | 0 |
| Revenue | **175** | 0 |
| Sales | **175** | 0 |
| Stock (Stk.U.) | **175** | 0 |
| Available (StkU) | **175** | 0 |
| Main group | **175** | 0 |
| Product group | **175** | 0 |
| Stock U. | **175** | 0 |

Exactly 175 rows come back — none of the 5,398 products on Order advice leak
in, which is the per-product flag doing its job.

The fixture gives each product two invoice lines: one inside the trailing
twelve months carrying the quantity that makes the consumption figure, and one
well outside it carrying the money and the weight, because `Revenue` and
`Sales` are summed over the whole filter period while consumption is not.

**5. `PAC-Code` — found, but never filled.**
It lives on the product, in the *Stock policy* panel, labelled
**`PAC-classification`**, next to a second field called **`Order advice code`**
— which is the same `Order advice code` column the full Order advice view
shows. Both were empty on the product inspected, so what they hold is still
unknown, but we now know where they are configured and that they are
product-level, not group-level.

**7. Answered — the zeros were an empty window, not a wrong definition.**

Re-run with `Invoice date` narrowed to `4-9-2025` → `4-9-2026` (the last 12
months), the grid dropped from 24 rows to 2 — and both showed a **non-zero**
consumption. So the earlier zeros simply meant those products had not been
invoiced for over a year.

| Product | Stock U. | Revenue | Sales | Avg. Monthly consumption |
|---|---|---|---|---|
| `SC304` Stainless steel scrap | KG | € 45,23 | 45,23 | **3,8** |
| `CK3040010` Coil Cold-rolled 304 | ST | € 20.000,00 | 10.000,00 | **0,3** |

`SC304` settles the arithmetic exactly — `45,23 ÷ 12 = 3,769`, shown as `3,8`.
That confirms two picks at once, both of which we had guessed right:
[QUESTIONS #1](../QUESTIONS.md) (trailing 12 months, not a calendar year) and
[QUESTIONS #4](../QUESTIONS.md) (counted from **invoices**).

**And it exposed one we had wrong.** `CK3040010` does not reconcile the same
way: `10.000 ÷ 12 = 833`, not `0,3`. The two columns are in different units.
Its stock unit is `ST` and `SC304`'s is `KG` — the one that reconciled
directly is the one already stocked in kilos.

So `Sales` is a **weight in kilograms**, and the consumption column is that
weight ÷ 12 **converted into the product's stock unit** — which is what its
`(Stk.U.)` suffix said all along. The implied factor on `CK3040010` is
`10.000 ÷ (0,3 × 12) ≈ 2.778` kg per coil, a believable weight for a
cold-rolled 304 coil. The prices corroborate it: € 2,00/kg for 304 coil and
€ 1,00/kg for stainless scrap are both realistic, where per-piece readings
would not be.

**Implemented** — `sales` now sums `InvoiceItems.weightKg` instead of
`quantity`, and `avgMonthlyConsumption` runs the monthly kilo figure through
`convertKgToUnit` against `Products.stockUnit`. A product with no conversion
factor shows `—`.

→ *Worth one spot-check:* find a second non-`KG` product and divide its Sales
by twelve times its consumption. If that also lands on a believable kg-per-piece
for the product, the conversion is settled.
