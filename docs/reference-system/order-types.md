# `Stk` and `CD` — the line type that runs through everything

🔴 **Corrected 10-9-2026, after this page was first written.** The heading used
to say _"the order type"_, and that was wrong in a way worth keeping on the
page, because the reference caused it.

**The reference labels two different fields `Order type`.** Its Production
capacity details export prints both, side by side, and they share nothing:

```
Order type   Normal 1.933    Call-off 29    Rush 8
Line type    Stk    1.935    Stk+CD   31    CD    4
```

So `Stk` / `CD` is the **line type** — where the metal comes from. On the
revenue screens it is rolled up from the lines and the column is headed `Order
type`, which is where the confusion came from. The order's own `Order type` is
the urgency, and it is the `Normal` dropdown at the top of the order-type block
on order 100742.

**And there is a third value.** `Stk+CD`, on 31 of 1.970 lines: a line filled
partly from stock and partly by buying in. A page written from the revenue
screens alone would never have seen it.

Two values are in use on the revenue screens because those aggregate.

## The split

From `Revenue per product` (2 782 rows, invoice dates through the export
window):

| Order type | Revenue     | Profit      | Weight       | Margin      |
| ---------- | ----------- | ----------- | ------------ | ----------- |
| **`Stk`**  | € 6 930 267 | € 1 392 273 | 2 580 020 kg | **20,09 %** |
| **`CD`**   | € 2 102 335 | € 221 722   | 793 310 kg   | **10,55 %** |

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

| Screen                                  | How                                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `Production capacity details`           | as **`Line type`** — the only screen that names it correctly, and the only one that shows `Stk+CD` |
| `Revenue per product`                   | a column headed `Order type`; splits every product's revenue                                       |
| `Revenue per revenue group`             | a **grouping level**, above revenue group                                                          |
| `Purchases and sales per revenue group` | a column                                                                                           |
| `Revenue w.r.t. Budget`                 | a column, budgeted separately                                                                      |
| `Supplier revenue per revenue group`    | a grouping level — so it splits **purchases** too                                                  |
| `CBS Documentatie`                      | as `Ordertype` `V` / `I`, which is a _different_ axis — sales vs purchase, not Stk vs CD           |
| Sales order lines                       | `Type` on each line                                                                                |
| `Production capacity details`           | `Order type` here is the **urgency**: Normal / Call-off / Rush                                     |

`Supplier revenue per revenue group` splitting by the same `Stk` / `CD` values
(Σ 909 375 kg CD against Σ 1 782 497 kg Stk) confirms it is a property of the
**trade**, tracked from both ends, and not a sales-only tag.

⚠️ A third value exists and is blank. Both revenue screens show an
`Order type:` group with an empty label — 94 091 kg and € 18 855,71 at a **68 %**
margin, described as `Price differences`. That is not a trading type; it is where
price corrections land. Whatever the blank means, it is not a third way of
selling steel.

## What was built

Both fields, since they are both real:

- **`Orders.orderType`** — `normal` / `call_off` / `rush`, with a select on the
  order form's own Order Type section, a hidden-by-default column on the
  overview and a filter. Hidden by default because 1.933 of 1.970 rows are
  `Normal`; it earns its width only when somebody is hunting the call-offs.
- **`OrderItems.sourceType`** — `stock` / `stock_and_cross_dock` /
  `cross_dock`, shown by default on the Order lines screen, which is the only
  screen that lists lines one at a time.
- **`OrderItems.purchaseOrderItemUuid`** — the purchase line that covers a
  cross-docked sale, which is what `CD deliveries in progress` prints. A real
  foreign key: nothing in the purchase chain imports `order-items.ts`, so it
  closes no module cycle, unlike `Stock.orderItemUuid`.

⚠️ Not to be confused with our own `OrderItems.lineType`, which holds
`material` and is a different axis — the reference keeps options and surcharges
in separate tables rather than in a column.


---

## 🔴 A fourth value, and a name for the axis — 7-10-2026

Grouping `Purchase lines` on `Line type` over 2024–2026 gave **`CD` · `EXW` ·
`Stk`**. `EXW` had shown once before, on one sales line (order-lines.md §8), and
been written off as thin. It is a member.

**And the same three names appear in two other places**, which says what this
axis *is*:

| Where | The three |
|---|---|
| `Line type`, purchase and sales lines | `Stk` · `CD` · `EXW` |
| Product → `Minimum profit margins` | `Stock` · `Cross Docking` · `Ex works` |
| `REVENUEGROUP_BUDGET` (B17) | `STOCK` · `CROSSDOCK` · `FACTORY` |

So the line type picks the margin floor and the budget column. It is a mode of
the trade, and `FACTORY` ≡ `Ex works` ≡ `EXW`.

⚠️ **But the one `EXW` purchase line is not a mill delivery.** It is a
toll-processing return at € 0,05/TN from Decomecc, never ordered, with an
internal certificate — see
[purchase/purchase-lines.md](purchase/purchase-lines.md) *Step 6 answered*. On
the buying side `EXW` is how metal that was already ours comes back from
somebody else's works. What `Ex works` means on the selling side, and in the
margin and budget tables, is **still open** — Step 6c reads order `400143`'s
header.

`Stk+CD` did **not** appear on purchase lines, as expected: it is a sales line
filled from two sources, and a purchase line has one.

Built 7-10-2026: `ex_works` in `orderSourceTypes`; `purchaseSourceTypes` as the
purchase-side subset; `PurchaseOrderItems.sourceType`; `minimumMarginFor` keyed
on the type.
