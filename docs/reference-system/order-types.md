# `Stk` and `CD` — the order type that runs through everything

`Order type` turned up on six screens on 10-9-2026 and it is a real dimension,
not a label. Two values are in use.

## The split

From `Revenue per product` (2 782 rows, invoice dates through the export
window):

| Order type | Revenue | Profit | Weight | Margin |
| ---------- | ------- | ------ | ------ | ------ |
| **`Stk`** | € 6 930 267 | € 1 392 273 | 2 580 020 kg | **20,09 %** |
| **`CD`** | € 2 102 335 | € 221 722 | 793 310 kg | **10,55 %** |

`Revenue per revenue group` prints the same two figures for CD to the cent —
€ 2 102 334,97 and € 221 722,15 — from a different screen and a different
grouping, so the two agree on what CD is.

**CD is a quarter of the volume at half the margin.** That is the whole
economics of the distinction and it is not a rounding artefact: 9,5 points of
margin across 793 tonnes.

## What CD is

`CD-deliveries in progress` gives it away. Its 115 rows carry, on one line:

```
Order · Line · Product · Delivery date · Quantity · Weight
Stock value · Purchase value · Purchase value - Stock value
Purchase order · Purchase order line
```

**A sales order line and a purchase order line on the same row.** The metal is
bought against a specific sale rather than out of stock — a cross-dock, and the
purchase quote's `Pick up/Drop-off CD-purchases` checkbox is the buying end of
the same arrangement.

`Stk` is the ordinary way: sell what is standing in the rack. The reference's
order-line grid prints `Type: Stk` on every line of order 100742, and its Stock
panel shows which lot each line came out of.

Lower margin follows: no stock was carried, no handling was done, and the
purchase price is known before the sale is priced. The screen's `Purchase value
- Stock value` column is there precisely to watch that margin.

## Where it appears

| Screen | How |
| ------ | --- |
| `Revenue per product` | a column; splits every product's revenue |
| `Revenue per revenue group` | a **grouping level**, above revenue group |
| `Purchases and sales per revenue group` | a column |
| `Revenue w.r.t. Budget` | a column, budgeted separately |
| `Supplier revenue per revenue group` | a grouping level — so it splits **purchases** too |
| `CBS Documentatie` | as `Ordertype` `V` / `I`, which is a *different* axis — sales vs purchase, not Stk vs CD |
| Sales order lines | `Type` on each line |
| `Production capacity details` | `Order type` per line |

`Supplier revenue per revenue group` splitting by the same `Stk` / `CD` values
(Σ 909 375 kg CD against Σ 1 782 497 kg Stk) confirms it is a property of the
**trade**, tracked from both ends, and not a sales-only tag.

⚠️ A third value exists and is blank. Both revenue screens show an
`Order type:` group with an empty label — 94 091 kg and € 18 855,71 at a **68 %**
margin, described as `Price differences`. That is not a trading type; it is where
price corrections land. Whatever the blank means, it is not a third way of
selling steel.

## What we have

Nothing. `Orders` has no order-type column, and both figures above would be
unsplittable in our system today. `CD` also implies a link from a sales order
line to the purchase order line that covers it, which we do not model — our
`PurchaseOrderItems` has no sales-side reference.

Written up as item 4 of
[PLANNED-CODE-CHANGES-2.md](PLANNED-CODE-CHANGES-2.md). **No code was changed.**
