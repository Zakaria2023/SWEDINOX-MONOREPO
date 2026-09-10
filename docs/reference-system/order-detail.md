# A sales order, opened

`Order 100742, Holland Dak Accessoires B.V.` — reached from a reservation's
`Order` button, 10-9-2026. The first time a sales order has been seen in full.

Header line: **`Released, Printed, Mailed`** — three states at once, so the
status of an order is a set of flags and not one value.

## The header

| Group | Fields |
| ----- | ------ |
| Identity | `Creation date` 10-2-2025, `Delivery planned` 12-2-2025, `Customer` 11686, `Contact`, `Customer ref.`, `Onze referentie`, `Order method` E-Mail, `Seller`, `Price date`, `Project`, `Order category` |
| Order type | `Pick-up`, `Incidental`, `Consignment with a duration of …`, `Internal production/processing`, **`Klant materiaal`**, a `Normal` dropdown, a `Trade weight` dropdown, `Overlengte` |
| Flags | `Printed`, `Mailed`, `Faxed`, `Handling blocked`, `Leave customer…` |
| Delivery | `Delivery terms` (CPT), `Delivery address`, `Date` / `Week` + `Year`, `Keuzehulp` |

Three of those are worth naming:

- **`Klant materiaal`** — customer material. The order-side twin of `Klant
  voorraad op locatie`, and the reason `Stock.ownerCompanyUuid` exists.
- **`Trade weight`** — a dropdown beside `Normal`, so the weight an order is
  priced on is a *choice*, not a constant. It sits next to the header's
  `Total weight: 25515 Kg` against `Theor. wt.: 25104,9`, a 410 kg difference on
  one order.
- **`Consignment with a duration of …`** with its own unit dropdown —
  consignment is a term, not a boolean.

## The summary block, and the four price bases

```
                Revenue      Profit              Profit w.r.t. Repl. price
Materials:     € 92.874,60  € 74.290,50 (80 %)  € 92.874,60 (100 %)
Options:       € 0,00       € 0,00 ( %)         € 0,00 ( %)
Surcharges:    € 0,00       € 0,00 ( %)         € 0,00 ( %)
Transport costs:            € 0,00              € 0,00
Handling costs:             € 0,00              € 0,00
Tot. excl. VAT: € 92.874,60 € 74.290,50 (80 %)  € 92.874,60 (100 %)
VAT:            € 19.503,67
Tot. incl. VAT: € 112.378,27   Avg. kilo price: € 3,64
Total weight:   25515 Kg       Theor. wt.: 25104,9
```

`Transport costs` and `Handling costs` are both zero, consistent with transport
costing being switched off everywhere else.

Lower down, a **`Revenue+Profit`** panel states profit **four ways at once**:

```
CURRENT APP: € 0,00   Profit w.r.t. CURRENT APP: € 4.402,94 (100,00 %)

           Revenue     w.r.t. APP   w.r.t. FSP   w.r.t. Repl. price   w.r.t. LIP
Materials: € 4.402,94  € 4.402,94   € 4.402,94   € 4.402,94 (100 %)   € 4.402,94
```

So a line's margin is not one number — it is the same revenue measured against
four different costs:

| | |
| --- | --- |
| **APP** | the average purchase price. Confirmed by its own edit dialog, which is in Dutch and calls it **`Gip`** — *gemiddelde inkoopprijs* |
| **Repl. price** | the replacement price, which we already hold as `Products.replacementPrice` |
| **LIP** | not expanded on screen. The `I` and `P` almost certainly stand for the same *inkoopprijs*; the `L` does not have enough evidence behind it to write down |
| **FSP** | ⚠️ still not expanded — but no longer a mystery *category*. It is a **price basis for profit**, alongside three we understand, which is more than "an unexplained column on the count-list screen" |

All four read 100 % here because this lot's APP is € 0,00 — an unvalued lot
makes every margin look perfect, which is worth remembering before trusting a
profit percentage from this system.

## `Change APP` — stock revaluation

Right-click on a product offers `Show Product`, **`Change APP…`** and `Toon
reserveringen…`. `Change APP` opens a Dutch dialog:

- filters: `Gipgroep`, `Naam`, `Artikelgroep`, `Kwaliteit`, `Voorraadcategorie`,
  `Opties`, and `Lengte` / `Breedte` / `Dikte` ranges
- `Gip`: **`Huidig € 5,22` Tonnage** against **`Nieuw € 0,00` Tonnage**
- buttons `Check` then `Wijzig` (check, then change)
- a grid of what would be revalued, with `Waarde` against `Nieuwe waarde`

So APP is **per tonne**, and it is revalued in **bulk against a filter**, with a
dry run before the write. That is the shape our `control-stock-revaluation-fsp`
screen should have.

## The order lines

`Code` (10, 20, 30 … — lines are numbered in tens), `Type` (`Stk`),
`Delivery date`, `Status`, `Product`, `Description`, `Category`, `Quality`,
`Qty(p)`, `U`, `Length`, `Width`, `Thickness`, `Kg(p)`, `M1(p)`, `#Bundles`,
`Net Price`, `U`, `Amount`, `Purchase p.`, `Costs`, `Profit`, `Profit amount`,
`Reference`, **`Profit too low`** (a checkbox).

Line statuses seen on one order: `Invoiced`, `Released`, `In progress` — three,
alongside the 3 seen on work orders.

`Profit too low` is a **stored flag per line**, not a rendering rule — and one
line on this order has it ticked at 6,79 % where its neighbours sit at 8,26 %.
We already compute `profitTooLow`; this confirms it belongs on the line.

Tonne pricing holds again: line 10 is `Net Price € 3.640,00 / TN` on
`Kg(p) 1209,6`, and `3640 x 1,2096 = 4.402,94`, which is what `Amount` prints.

## ⚠️ `IO` — and a correction to the number series

The lots on this order name their purchase orders as `IO400018`, `IO400372`,
`IO400047`, `IO100042`, `IO100035`, `IO100076`.

The reservation names its sales order as `O100742/50`.

So the prefix is doing the work: **`O` is a sales order and `IO` a purchase
order** (*inkooporder*), and the number ranges are **not** reliably disjoint.
`IO100042` and `IO100076` are purchase orders numbered in the `1xxxxx` range —
their receipt dates are 17-3-2022, 13-4-2022 and 27-9-2024, against 2025 for
every `IO4xxxxx`.

The rule recorded elsewhere in these docs — *`1xxxxx` sales, `4xxxxx` purchase* —
holds for everything created recently and **is not a law**. Read the prefix, not
the range.
