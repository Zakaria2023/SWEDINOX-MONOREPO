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

---

# Part 2 — Every panel, opened · 18-9-2026 (G1)

The same order `100742`, this time with **every panel expanded**. Part 1 above
was the header and the lines; this is the twelve panels underneath, which had
never been seen. Item **G1** on the capture list, and it was the highest-value
item left on it.

## 🔴 10. The lower panels belong to the *selected line*, not the order

This is the structural finding, and most of what follows depends on it.

The order has **9 lines** and `Deliveries` says **`1 delivery`**. That is not a
contradiction: line 10 is the highlighted row, and the panel is showing line
10's delivery. `Revenue+Profit` agrees — it reads **€ 4.402,94**, which is line
10's `Amount` exactly, not the order's € 92.874,60.

| Panel | Scope |
|---|---|
| `Workorders` (all three) | the **order** |
| `Order lines` · `Options` | the order |
| `Deliveries` · `Revenue+Profit` · `Receipts` · `Pricing` · `Stock` · `Stock other affiliates` · `Previous orders` · `Previous quotes` | the **selected line** |
| `Invoice lines` · `Finances` | the order |

**Our `/orders/[uuid]` has eleven sections and every one of them is
order-scoped.** There is no notion of selecting a line and having the panels
below follow it. That is a UI shape rather than a schema change, but it is the
shape the reference works in — a seller picks a line and then asks "what stock is
there, what did this customer pay last time, what has shipped".

## 11. 🔴 `Workorders` is three panels, and it ties to the order line

The one thing the order model never had: **how an order reaches the warehouse.**

### Warehouse workorders

`Item` · `Workorder` · `Line` · `Workorder date` · `Type` · `Status` ·
`Product` · `Length` · `Width` · `Dikte` · `Qty(p)` · `Qty(a)` · `U(p)` ·
`Kg(p)` · `Kg(a)` · `From` · `To` · `Deviation reason` · `Batch information` ·
`Date finished` · `Charge` · `Purchase order` · `Receipt date` · `Resource(a)` ·
`Voorraadcategorie` · `Kwaliteitscode` · `Colli`

Five rows on this order:

| Item | Workorder | Line | Date | Type | Status | From | To | Charge | Purchase order | Receipt date |
|---|---|---|---|---|---|---|---|---|---|---|
| 10 | 302106 | 1 | 11-2-2025 | Picking | Approved | 4B1 | Laad | 4A2829F | IO100076 | 27-9-2024 |
| 50 | 304211 | 1 | 25-3-2025 | Picking | Approved | 3CC | Laad | 4A2829D | IO100076 | 27-9-2024 |
| 60 | 304211 | 2 | 25-3-2025 | Picking | Approved | 3CC | Laad | 4A2829H | IO100076 | 27-9-2024 |
| 70 | 304211 | 3 | 25-3-2025 | Picking | Approved | 4B1 | Laad | 130125 | IO400047 | 11-2-2025 |
| 80 | 304211 | 4 | 25-3-2025 | Picking | Approved | 4D1 | Laad | 1124860 | IO400251 | 13-2-2025 |

Three things fall out:

1. **`Item` is the order-line code.** 10, 50, 60, 70, 80 are order lines 10, 50,
   60, 70 and 80. So a warehouse work order line points at an order line, and one
   work order (`304211`) serves four of them. ✅ **Corrected 19-9-2026:** I wrote
   here that our schema had no such link. It does —
   `WarehouseWorkOrderLines.orderItemUuid` has carried a real foreign key to
   `OrderItems.uuid` since the warehouse rebuild. What was missing was not the
   column but the *screen*: nothing read it back onto the order.
2. **`From` is a pick location, `To` is always `Laad`.** Picking moves metal from
   its bin to the loading area — which is why `Laad` is a location *type* and why
   its lots are never blocked. The movement is proved here on five rows.
3. **`Charge` / `Purchase order` / `Receipt date` travel with the work order
   line**, so the heat is fixed at picking, not at delivery.

Only 5 of the 9 lines have a work order. The four that do not (20, 30, 40 and
one more) are `Released` with delivery dates in June — **nothing is picked until
it is due**, which is the first evidence of when picking is triggered.

### Production workorders

Present and **empty** on this order — it is a plain stock order, nothing cut.

### Transport workorders

`Product` · `Description` · `Kwaliteitscode` · `Voorraadcategorie` · `Length` ·
`Width` · `Dikte` · `Delivery date` · `Trip` · `Status` · `Vehicle` ·
`Direction` · `Bill of lading` · `Qty(p)` · `Qty(a)` · **`Qty(loaded)`** ·
`U(p)` · `Kg(p)` · `Kg(a)` · `U(loaded)` · `Charge`

| Item | Delivery date | Trip | Status | Vehicle | Direction | Bill of lading | Qty(loaded) |
|---|---|---|---|---|---|---|---|
| 10 | 12-02-2025 | 12-2-2025 | Completed | ADO NL | Deliver | 300358 | 64 |
| 50 | 01-12-2025 | 1-12-2025 | **New** | — | Deliver | — | **0** |
| 60 | 18-02-2025 | 26-3-2025 | Completed | ADO NL | Deliver | 300804 | 61 |
| 70 | 18-02-2025 | 26-3-2025 | Completed | ADO NL | Deliver | 300804 | 57 |
| 80 | 18-02-2025 | 26-3-2025 | Completed | ADO NL | Deliver | 300804 | 42 |

- **`Trip` renders as a date here, not a number**, while `Bill of lading` is the
  number. Three lines share bill of lading `300804` on one trip. That bears
  directly on **G7**, where bill of lading `300813` and trip `600249` are an
  unexplained pair: **the bill of lading groups the lines, the trip is the
  journey.**
- **`Direction` = `Deliver`** — a transport work order has a direction, so
  collection must be the other value.
- **`Qty(loaded)` is a third quantity**, distinct from planned and actual, and it
  is `0` on the one `New` row. Loading is its own event, recorded separately.
- A line can ship long after its delivery date (18-02 planned, 26-3 shipped).
  **`Delivery date` is the promise; `Trip` is what happened.**

## 12. 🔴 `Pricing` — the price build-up, finally on screen

The discount cascade was previously *"proved on one quote line"*. Here is the
form it is built in:

```
Base price              € 0,00      Line discount:       0 %   € 0,00
Quantity surcharge      € 0,00      Extra discount:      0 %   € 0,00
Color surcharge         € 0,00      ─────────────────────────────────
Lengtetoeslag           € 0,00      Line discount tot.:  0 %   € 0,00
──────────────────────              Group discount:      0 %   € 0,00
Gross Price             € 0,00      Net price:                 € 0,00
```

**The left column builds up, the right column discounts down.** Four additive
components make the gross price; three discounts reduce it to net, and
`Line discount tot.` is the subtotal of line + extra *before* the group discount
applies — which is the cascade, drawn.

Every figure reads `€ 0,00` because this line's price was **typed**
(`€ 3.640,00 / TN`) rather than built up. So the panel shows the machinery and
this order does not use it. ⚠️ That also means the cascade is **still** unproved
numerically — the form is now known, the arithmetic is not.

Two checkboxes govern it: **`Transfer price setting to order line`** (unticked)
and **`Transfer pricing determination to o…`** (ticked). Beside them sits a table
of the line's **options**, each with its own `Base price`, `Surcharge`,
`Gross price`, `Qty Discount`, `Extra Discount`, `Reference f…`, `Net price` and
**`Contract`** — so an option is priced through the same cascade, and a
**contract can be named per option line**, which is exactly what
[contracts.md](contracts.md) said a contract declares.

**Against `apps/dashboard`:** `OrderItems` has `grossPrice`, `lineDiscount`,
`groupDiscount`, `netPrice`. It is missing **`basePrice`, `quantitySurcharge`,
`colorSurcharge`, `lengthSurcharge` and `extraDiscount`** — the four components
that make the gross price, and one of the three discounts. We store the answer
and not the sum, so we cannot reproduce or re-price a line.

## 13. `Stock` — what the seller sees while quoting

Tabs `Stock` / `Purchase`, and buttons `Article` · `Group` · `Alternative`, so
one panel answers "this article", "its group" and "something else that would do".

`Code` · `Article` · `Dimensions` · `Length` · `Width` · `Location` ·
`Location type` · `Blocked` · **`Technical`** · `Kg Technical` ·
**`Reserved`** · `Kg Reserved` · **`Available`** · `Kg Available` · `Quality` ·
`Charge` · `Purchase order` · `Receipt date` · `Supplier` · `Internal charge` ·
`Opties` · `Stk cat.` · `Remark` · `Factory number` · **`Internal batch`** ·
**`Batch`**

- **Three quantities, each in pieces and kilos: technical, reserved, available.**
  The `Laad` row reads 64 ST technical / 64 reserved / **0 available**, so
  `Available = Technical − Reserved`, confirmed on the one row where it bites.
- **Four identifiers on one lot** — `Charge` (1125372), `Internal charge`
  (25AAEY), `Batch` (P01558765) and `Internal batch` (385385) — plus
  `Factory number` as a fifth. We hold `charge` and `internalBatch`; the other
  pair is unmodelled.
- ⚠️ The `Laad` row's kilos read **1.190** where the order line and the warehouse
  work order both read **1209,6** for the same 64 pieces.
  1209,6 × (25104,9 / 25515) = 1190,1 — the ratio of this order's theoretical to
  trade weight. So the **`Stock` panel most likely shows theoretical weight while
  the order and the work order show trade weight.** One rounded figure on one row
  is not a proof; worth confirming on a second order before relying on it.

`Stock other affiliates` sits directly below — **a multicompany panel**, matching
`Applicatie Instellingen → Multicompany` in the rights tree. Nothing in our app
knows another branch exists.

## 14. `Previous orders` — the panel that sells

`Order / Line` · `Creation date` · `Status` · `Qty` · `U` · `Dimensions` ·
`Weight` · `Gross price` · `Line discount` · `Group discount` · `Net price` ·
`Amount` · **`Days in system`**

| Order / Line | Created | Status | Qty | Weight | Net price | Days in system |
|---|---|---|---|---|---|---|
| 100694/10 | 6-2-2025 | **Expired** | 61 ST | 1152,9 | € 3.640,00 | 589 |
| 100694/20 | 6-2-2025 | **Expired** | 64 ST | 1209,6 | € 3.640,00 | 589 |

**This is "what did we charge this customer for this product last time".** Same
price, € 3.640,00, four days before this order — which is very likely *why* the
seller typed the price instead of building it up. `Previous quotes` is the same
panel for quotes.

`Expired` is an order status we do not have in `orderStatuses`. `Days in system`
is an age in days on a **line**, computed rather than stored.

## 15. `Invoice lines` — traceability reaches the invoice

`Line` · `Invoice` · **`Type`** · `Delivery date` · `Qty` · `U` · `Description` ·
`Dimensions` · **`PriceQty`** · `Per` · `Gross price` · `Line discount` ·
**`RdU`** · `Group discount` · **`GdU`** · `Amount` · `Printed` · `Print date` ·
`Mailed` · `E-mail date` · `E-mail address` · `Charge` · `Purchase order` ·
`Receipt date`

| Line | Invoice | Type | PriceQty | Per | Amount | Mailed | Charge |
|---|---|---|---|---|---|---|---|
| 10 | **500509** | Debit | 1,2096 | TN | € 4.402,94 | 12-02-2025 09:51 | 4A2829F |
| 60 | **501106** | Debit | 1,1529 | TN | € 4.196,56 | 27-03-2025 09:27 | 4A2829H |
| 70 | 501106 | Debit | 1,0773 | TN | € 3.921,37 | 27-03-2025 09:27 | 130125 |
| 80 | 501106 | Debit | 1,0584 | TN | € 3.852,58 | 27-03-2025 09:27 | 1124860 |

- **One order, two invoices.** Lines are invoiced as they ship, not in one batch
  at the end.
- **`PriceQty` is the tonnage**, and `Amount = PriceQty × Gross price` on all
  four rows to the cent (1,2096 × 3640 = 4402,94). Tonne pricing again — this
  time with the multiplier stored as its own column rather than derived from kg.
- **`Type: Debit`** — an invoice line is debit or credit, which is how a credit
  note is a *line type* rather than a separate document (**H12**).
- **`RdU` and `GdU`** sit immediately after `Line discount` and `Group discount`:
  **a unit per discount**, so a discount can be a percentage or an amount and the
  column says which. We store both as plain decimals with no unit, which silently
  assumes percentages.
- **`Charge` / `Purchase order` / `Receipt date` are on the invoice line.** The
  heat traces from the mill, through picking, through the delivery, onto the
  invoice. That closes the certificate chain from this end;
  [batch-registration.md](batch-registration.md) §3 proved the same link from the
  other on 1 662 of 1 662 rows.
- `Printed` unticked and `Mailed` ticked on all four, with a timestamp and the
  address (`administratie@hd…`). **Sending is recorded per line**, not per
  invoice.

## 16. `Finances` — two blockages and six switches

> Payment terms: **Within 30 days from date of invoice**

| Control | State |
|---|---|
| `Show net price` | ☐ |
| `Scrap surcharge separately` | ☐ |
| `Calculate VAT if applicable` | ☑ (greyed) |
| **`Financial blockage`** | ☐ |
| **`Invoice blockage`** | ☐ |
| `Only total amount on invoice` | ☐ |
| `Include option prices in material prices` | ☑ |
| `Payment terms` | dropdown |
| `Billing address` | Emrikweg 14, 2031 BT, HAARLEM |
| **`Blocking reason`** | `-empty-` dropdown |

✅ **Our schema already has this.** `financialBlockage`, `invoiceBlockage`,
`blockingReason` and `paymentTerms` are all on `Orders`, and the two blockages
being separate flags sharing one reason matches what C7 found. Confirmation
rather than new work.

`Include option prices in material prices` is worth noting: it decides whether
the summary's `Options` row folds into `Materials`, which is why this order shows
€ 0,00 options against € 92.874,60 of materials.

`Receipts` exists as a panel on a **sales** order and reads `0 receipts` — so a
sales order can receive goods back, which is the return path (**H12**).

## 17. What this changes in `apps/dashboard`

| Finding | State |
|---|---|
| Order header, order type, delivery, blockages, weights | ✅ already modelled in Part 1 |
| `Financial` / `Invoice blockage` + `Blocking reason` | ✅ confirmed correct |
| Tonne pricing, `profitTooLow`, the four profit bases | ✅ confirmed |
| **Warehouse work order line → order line** | ✅ the column already existed; the screen now reads it |
| **`From` / `To` on a picking work order** | ✅ already on the line; now joined and shown |
| **Transport WO: `Direction`, `Qty(loaded)`, bill-of-lading grouping** | ✅ built 19-9-2026 — `direction`, `billOfLading`, `orderItemUuid` added |
| **`basePrice`, `quantitySurcharge`, `colorSurcharge`, `lengthSurcharge`, `extraDiscount`** | ✅ built 19-9-2026 on `OrderItems` |
| **`RdU` / `GdU`** — a unit per discount | ✅ built 19-9-2026 — `discountUnits`, on both the order line and the invoice line |
| **Invoice line `Type` (Debit/Credit)** | ✅ built 19-9-2026 — `invoiceLineTypes` |
| **`Charge` on the invoice line** | ✅ built 19-9-2026 — `charge`, `purchaseOrderNumber`, `receiptDate` |
| **Per-line `Printed` / `Mailed` + timestamp + address** | ✅ built 19-9-2026 |
| **`Previous orders` / `Previous quotes`** | ✅ built 19-9-2026 — same company, same article |
| **Line-scoped panels** | ✅ built 19-9-2026 — selection lives in `?line=`, panels render server-side for it |
| `Expired` order status | ✅ it was already in `orderStatuses`; only the comment was wrong |
| `Stock other affiliates` — multicompany | ⚠️ exists; out of scope for now |

### Built 19-9-2026

Everything above marked ✅ was implemented in one pass, against this capture.
Two things are worth stating plainly, because they are where the build had to
make a judgement the capture does not settle:

- **The cascade's arithmetic is written down but still unproved.** `priceCascade`
  in `lib/helpers.ts` implements the order of operations the panel lays out —
  line + extra subtotal, then group discount on the remainder. Every captured box
  read € 0,00, so no non-zero line has ever tested it. The helper carries that
  warning in its own comment.
- **A typed price is not a built-up price.** A line with a real `grossPrice` and
  a zero build-up — which is all nine lines of `100742` — would otherwise render
  a € 0,00 gross. `getOrderLinePanels` falls back to the stored gross and net in
  that case, so the panel reports what was actually charged.

**None of this is a rewrite.** The header and the money were right. What was
missing is the **downstream** — how an order reaches the warehouse, the lorry and
the invoice, and the fact that a seller works one line at a time.

## 18. What G1 did *not* settle

Worth writing down so it is not assumed later:

- **The discount cascade is still unproved numerically.** Every box on the
  `Pricing` panel is zero.
- **`Options` was collapsed** and this order has none, so an option has still
  never been seen on a real order line.
- **The theoretical-vs-trade weight reading in §13 is one rounded row**, not a
  proof.
- **`Production workorders` is empty here**, so the order → cut → order chain is
  still unseen. That is **G8** and **H10**.


---

## A call-off order, 7-10-2026 — `100785`, Allva Edelstahl GmbH

Opened from `Blocked deliveries`. Header: *"Order 100785, Allva Edelstahl
GmbH … - Partially invoiced, Printed, Mailed"*; *"Creation date: 13-2-2025 -
Delivery planned: 25-4-2025 - Delivered: 23-5-2025"*.

| Field | Value |
|---|---|
| `Customer` | `10579` Allva Edelstahl GmbH · `Contact` Benjamin Fellermair |
| `Customer ref.` | `B111349` · `Leave custome…` ☐ |
| `Order method` | `Telephone` · `Seller` Marco Borsboom · `Price date` 13-2-2025 |
| `Project` / `Order category` | `-leeg-` / `-leeg-` · `Handling blocked` ☐ |
| Order type | `Pick-up` ☐ · `Incidental` ☐ · `Consignment with a duration` ☐ greyed · `Internal production/processing` ☐ greyed · `Klant materiaal` ☐ greyed · **`Call-off`** · `-leeg-` · `Overlengte` ☑ greyed |
| `Delivery terms` | `(CPT) Carriage paid to` · address Tannenbergstr. 173, D-73230 Kirchheim unter Teck |
| **`Call-off period`** | `17-2-2025` t/m `17-2-2025` · a **`Keuzehulp`** button |
| Summary | Materials € 24.356,07, **profit € 24.356,07 (100 %)**, same w.r.t. replacement price · avg kilo price € 2,55 · total weight 9 551,5 kg · theor. 9 551,2 kg |
| Toolbar | `Print… · Send… · Return` (greyed) `· Par. return · Show company · PAC · Cancel · Optimize · Copy · Workorder · Invoice` |

**`Call-offs` panel** — `New · Delete · Change · Print call-off · Send…`;
grid `Customer reference · Delivery address · Rush · Call-off last modified by
· Call-off last … · IsSend · Days in system`. Two rows, both `B111349` to the
same address, `Rush` ☐, `IsSend` ☐, modified by Richard van Slooten on
24-4-2025 and 22-5-2025. So a call-off is a **child record of the order** with
its own reference, address and rush flag, and the order's `Call-off period`
is the window they fall in.

`Order lines`, 4: line `10` `Stk` 26-5-2025 `Partially inv…` `PK304L150`
Cold-rolled plate 304L 1,5 mm `2nd choice` `304L2B` 1 002 ST 1500 × 220 ×
1,5 — 3 893,6 kg, 1 503 m, **€ 2.550,00 / TN**; line `20` `Stk` 25-4-2025
`Invoiced` 254 ST 1500 × 180 — 807,6 kg, 381 m, same price.

**Line 10's `Revenue+Profit`:** *"CURRENT APP: € 0,00 · Profit w.r.t. CURRENT
APP: € 9.928,68 (100,00 %)"*. Revenue € 9.928,68 against **APP, FSP,
replacement price and LIP all € 0,00**, so every profit column reads 100 %.
`Pricing`: `Transfer price setting to order line` ☐, `Transfer pricing
determination to o…` ☑, every build-up figure € 0,00 and one option row
`ShearCut` at € 0,00 / ST — while the line itself carries € 2.550 / TN. ✅ As
order-detail.md already records: with the first box unticked the line's price
is typed and the panel is not its source.

🔑 **A 100 % margin in the reference means "no cost known", not "free
metal".** Second-choice plate with no APP, FSP, replacement or LIP price
reports its whole revenue as profit. Our margin code would do the same on a
lot valued at zero; the reference does not guard against it either.
