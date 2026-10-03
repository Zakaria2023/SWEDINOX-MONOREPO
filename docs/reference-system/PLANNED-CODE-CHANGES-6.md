# Planned code changes — from the live flows, 21-9-2026

**Source:** flows **H1** (a lorry arrives → stock), **H2** (order entry → picked) and
**H5** (block → unblock), watched end to end in `HEGO TEST` on 21-9-2026 across
~75 screenshots and two stock exports. Written up in
[receipt-chain.md](receipt-chain.md) §H1.1/§H1.2 and
[order-to-delivery.md](order-to-delivery.md).

Records used: purchase order **`401141`** / work order **`306675`** / lots
**`389823`–`389827`** · sales order **`102191`** / work order **`306697`**.

> **Why this file exists.** Everything in Parts B–F of
> [WHAT-IS-LEFT.md](WHAT-IS-LEFT.md) was read off grids. Grids show what a record
> looks like when it is finished. These three flows are the first time anybody
> watched the reference *do* something, and eleven of the items below could not
> have been found any other way.

**Ordering is by cost of being wrong, not by effort.** 1–4 are wrong money or
wrong stock. 5–12 are missing mechanism. 13–20 are missing fields and screens.

---

## ▶️ Code resumed, 29-9-2026 (same evening)

The capture-first pause set earlier on 29-9 was **lifted the same evening** by
Swedinox: build what tonight's flow produced. Items **22–26b** are back to being
a work queue.

Order of work, smallest blast radius first:

1. **24** — the `reportPicking` guard (no arithmetic, pure refusal)
2. **25a** — the `returnReasons` enum
3. **26b** — a correction writes a movement for attribute changes
4. **22** — picker semantics: physical-stock filter, ±5 % dimensional margin
5. **23** — the purchase line's two weights ⚠️ **last**, and re-run every
   purchase margin check after it

**All five are built as of 30-9-2026**, in that order, across five commits.
What is left of the queue is not code:

- ⚠️ **`pnpm db:push` has not run.** Six schema changes wait on it —
  `kg_actual` on a purchase line; `correction_reason` / `attribute` /
  `value_before` / `value_after` on a movement; the `adjust` movement type;
  `return_order_item_uuid` on a work order line; `return_order_uuid` /
  `return_order_item_uuid` on a movement; and **`Stock.valuation_price` widened
  from `decimal(15,4)` to `decimal(15,5)`** (item 12, 30-9-2026). The Aiven host
  times out from the machine this was built on. **Nothing in items 23, 25 or 26b
  works until it is pushed from a machine that can reach the database**, and
  until then every lot's valuation price is still being rounded to four
  decimals on the way in.
- **O9** still decides what a returned lot is worth in the general case, and
  **O8** still blocks the confirmation footer. Both need a person.
- ✅ **Item 12 is built.** A picking was driven end to end on 30-9-2026 —
  **O2 and O3 are both closed** — and the code went in the same evening. See
  [picking-flow.md](picking-flow.md) for the flow and item 12 below for what was
  written. Two new findings came with it, **neither of them copied**: reporting a
  line **deletes and re-raises** the rest of the work order, and the work order's
  kg disagrees with the stock row's (**O11**).
- The credit note is the one part of H12 nobody has watched.

---

## Where this stands — 21-9-2026, twenty commits

**Everything that was demonstrably *wrong* is fixed.** What is left is new
feature work and two genuinely blocked items.

| | Item | State |
|---|---|---|
| ✅ | **1** two weights | `b56515e` — 12 checks reproduce the observed line to the cent |
| ✅ | **2** invoice creates no stock | `d0afe74` |
| 🟡 | **3** valuation on receipt | `33c2920` — ledger half was already right; lot half blocked on **O9** |
| ✅ | **4** charge mandatory per bundle | `dfc5aa6` — server rule + disabled button |
| ✅ | **5** lot number vs receipt charge | `69575db` — `nextInternalBatch` |
| ✅ | **6** stock picker | `4977929` + `a948733` + `b5ed4f3` — search, dialog and the nullable reservation. `Use selected product` resolves to the fullest lot rather than leaving the line open, because our line writes a reservation and a reservation binds a lot. `Internal production` is not offered: never seen holding anything. **29-9-2026:** re-read against the stock screen — it respects reservations, `Only products with available stock` filters on *physical* stock, and it searches dimensions at ±5 % (item 22) |
| ✅ | **7** unblock clears its reason | `a03a643` |
| ✅ | **8** `Make final` raises both work orders | `e8c5cda` — also corrected picking's destination |
| ✅ | **9** ladder self-approves | already correct; **4** locked it in |
| ✅ | **10** internal move is not a mutation | `33c2920` — 19 reasons, none a relocation |
| 🟡 | **11** profit bases | `c30569d` — **three of four.** APP and replacement were already there; FSP now comes from the dated settlement history. **LIP is deliberately absent**: its behaviour is known, its meaning is not (K4), and a column of zeros would read as an answer |
| 🟡 | **12** picking allocation | ✅ **Built 30-9-2026**, once O2 and O3 were closed by driving work order `323526` from `New` to `Approved` ([picking-flow.md](picking-flow.md)). No allocation UI was needed — lots are allocated when the picking is raised, and `makeOrderFinal` now carries the lot's heat onto the line. The report path went in with it: a per-row lot picker on physical stock, `+ New` as a real parcel split, a date **and** time, `By` and `To location`, and — the one that was silently wrong — **a relocation now moves the lot row instead of minting a new uuid at the destination**. 🟡 only because `valuation_price` moved to 5 decimals and **`pnpm db:push` has not run** |
| ✅ | **13** order fields | `a55e249` — most already existed; transport/handling costs added |
| ✅ | **14** customer defaults | `a55e249` |
| 🟡 | **15** confirmation document | `2e56830` — built, and sending is its own decision as the reference makes it (`Don't send` is the default). The **footer is deliberately absent**: printing *"payment discharges only to Boozt24 Finance"* tells a customer where to send money, and **O8** is unanswered. A wrong answer there is somebody's money in the wrong bank |
| ✅ | **16** minimum margin | already built; confirmed correct |
| 🟡 | **17** panels | `c51aea8`. `Previous orders`/`Previous quotes` already existed. **Competitors** built from its four captured columns, against the **company** rather than the order — a share of a customer's spend must not disagree with itself across their orders. **Communication** turned out not to be speculation: we send documents and recorded failures to `console.error` alone, so "did we send it?" had no answer. ⚠️ Its *shape* is ours, not the reference's — only the panel's name was ever captured. **PDF Documents** not built: orders already carry a `documents` column and R2 behind it |
| 🔴 | **18** discount cascade | Cannot be built from evidence |
| ✅ | **19** location tree | `94a32ed` — and it earned its keep. Ours reaches **3 levels, not 4**, and carries **no `load` location at all**, so `makeOrderFinal` would have refused every order. Now falls back through the reference's own three picking destinations in its own order of frequency |
| ✅ | **20** smaller confirmations | no change needed |
| ✅ | **21** product record | `d987957` — unblocked item 1 |
| ✅ | **22** order-line stock picker re-read | 29-9-2026 — respects reservations; `Only products with available stock` filters on *physical* stock; ±5 % dimension margin. Sales half of **O3** closed. **Built:** the checkbox now filters `quantity ≠ 0` and is labelled for what it does, and the `1e keus` / `2e keus` choice filter is there, both unticked. The ±5 % margin and the two-level commitment were already correct |
| 🟡 | **23** purchase bills weighed kilos | 29-9-2026 — `Amount = Kg(a) x price`, proved to the cent on PO `402532`. **Built:** `kg_actual` on the line, `billingWeightKg`, `rebillPurchaseLineOnWeighedKilos` after each receipt, and the purchase-lines read path no longer calls a pro-rata estimate "actual". Plus `refreshPurchaseOrderTotals`, because the header's amount and weight were stored columns nothing ever wrote — € 95.513,48 and 48.484 kg are both sums of the lines, and the weight sums `Kg(a)`. ⚠️ **`pnpm db:push` has not run** — the column does not exist in the database yet |
| ✅ | **24** `Report completion` crashes | 29-9-2026 — `NullReferenceException` on a picking with no lots assigned, twice. **Built:** a pre-flight guard refuses an out/move report whose rows carry no lot, with a stated error instead of a crash. O2 and the warehouse half of O3 stay parked |
| 🟡 | **25** flow H12, a return end to end | 29-9-2026 — a return raises an **Unloading** work order with no purchase order, and the lot lands at **€ 0, prime, sellable, undated, no charge**. Six-value `Return reason` enum. No link to the original sale anywhere. **Built 30-9-2026:** the six reasons with labels and the complaint mapping; `returnOrderItemUuid` on a work order line so an unloading with **no purchase order** is bookable; `applyReturnReceipt`, which values the lot at what it cost to go out, persists the typed charge, sets `receiptDate` and names the sales line it came back off; and `receiveReturnOrder` no longer silently skips a line whose original lot is gone. ⚠️ `pnpm db:push` not run. **Still unwatched:** the credit note — `Invoice` came alive after `Make final` and was not pressed |
| 🟡 | **26** the return's stock mutation | 29-9-2026 — kg +35,325 and **value +€ 0,00** against account `3000`. Reason `Ontvangst Return customer`. The mutation carries `R290247` / `290247/10` / workorder `327396` and **stored running balances**, where the document itself links to nothing. **Built 30-9-2026:** `return_order_uuid` / `return_order_item_uuid` on a movement, set on every return leg, so the audit trail the document cannot hold lives in the ledger as references rather than a formatted string. **Not built:** the stored running balances — our ledger recomputes, and a stamped balance is only worth its cost once a stock-value-at-a-past-date report exists to read it |
| ✅ | **26b** `Correction…` is silent | 29-9-2026 — ran twice on lot `404763`; the second downgraded it `Standaard` → `2nd choice` and **no mutation was written** either time. The ledger records quantity and value, never attributes. **Built 30-9-2026:** the eight `Reden` values as `stockCorrectionReasons` with the rules each one carries, a third movement type `adjust`, `correction_reason` / `attribute` / `value_before` / `value_after` on the ledger, `applyStockCorrection` writing a row per changed attribute, and the two-checkbox dialog on the lot. No valuation field, because the reference has none either. ⚠️ `pnpm db:push` not run |

**Two schema pushes**, both applied: `transport_costs` / `handling_costs` on
orders, `delivery_terms` / `weight_type` on companies, and one new system-log
category.

---

## 🔴 1. Revenue is billed on trade weight; cost is taken on theoretical weight

**The single most expensive finding of the day.** Proved on order `102191`
line 10, 5 pieces at € 2 500,00 / TN:

| | Working | Screen |
|---|---|---|
| Revenue | **540,0 kg** ÷ 1000 × 2 500 | **€ 1 350,00** |
| Cost | **529,88 kg** ÷ 1000 × 2 058,8151 | **€ 1 090,91** |
| Profit | 1 350,00 − 1 090,91 | **€ 259,09** |
| Margin | 259,09 ÷ 1 350,00 | **19,2 %** |

The order header prints both side by side — `Total weight: 540 Kg` against
`Theor. wt.: 529,9 Kg` — and the **order confirmation sent to the customer shows
`540 KG`**, so this is not an internal display quirk. The order's weight type is
`Trade weight`, which is what the customer record defaults to.

`Avg. kilo price € 2,50` = 1 350 ÷ **540**, confirming revenue's side.

**What we do now:** `priceBasis(priceUnit, { weightKg, quantity, lengthMm })`
takes **one** `weightKg` and both the revenue and the cost calls pass the same
number. Every margin we display on a trade-weight order is therefore wrong, and
trade weight is the default for this customer.

**Change:**

- `lib/helpers.ts` — a line must carry **two** weights. Rename nothing; add the
  second. Revenue resolves its basis from the trade weight, cost from the
  theoretical weight.
- `db/schema/order-items.ts` (and quote/return/counter items) — a
  `theoretical_weight_kg` beside the existing weight, or an explicit
  `trade_weight_kg`; whichever is added, **both must be stored**, because the
  theoretical one is derived from dimensions and density and the trade one is
  not.
- Everything that computes profit on a sales line: `order-lines`,
  `invoice-lines`, `quote-lines`, `return-lines`, `deliveries`, and the revenue
  family under `lib/server/customer-revenue.ts`.
- ⚠️ **Re-run the margin checks afterwards.** The B2 fix (cost by the piece on
  tonne-priced lines) was proved against the reference's own export; this second
  correction moves the same numbers again and the export must still reconcile.

### ✅ Answered the same day — the product carries three densities

Product `PK304L300315`, the `Basis → Weights` block:

```
Theoretically:  7.850,000
Trade:          8.000,000
German:             0,000
```

They are **densities in kg/m³, not weights**, and they sit beside
`Features → Weight: 7.850,000 KG/M3` which is the same number again.

| Basis | Working | Screen |
|---|---|---|
| Theoretical | 0,0135 m³ × **7 850** = 105,975/piece × 5 | **529,875 → 529,9** ✓ |
| Trade | 0,0135 m³ × **8 000** = 108,000/piece × 5 | **540,0** ✓ |

8 000 ÷ 7 850 = 1,01911 — exactly the unexplained factor.

> **The order's weight type selects which density to multiply the volume by.**
> Nothing else. `orderWeightTypes` already holds all four values
> (`theoretical_weight`, `trade_weight`, `german_trade_weight`, `weighed`);
> three of them pick a column here and `weighed` presumably takes a measured
> figure.

`German` is `0,000` on this product, so a German-trade-weight order would
compute nothing — treat a zero density as "not offered" rather than as zero
kilograms.

`Number of decimal places we[ight]` = **1**, which is why 529,875 prints as
529,9.

**Change:**

- `db/schema/products.ts` — `theoretical_weight` holds 7 850 today. Add
  **`trade_weight_density`** and **`german_weight_density`** beside it.
  ⚠️ See the density/per-piece import defect already recorded in
  [receipt-chain.md](receipt-chain.md) — our column names disagree with the
  reference's and the import filled the wrong one. Fix that first or the new
  columns inherit the confusion.
- `lib/helpers.ts` — `productPieceWeightKg` takes a weight **basis** and reads
  the matching density. Revenue passes the order's basis; cost passes
  `theoretical`.
- Purchase is unaffected: purchase order `401141` used 100 × 105,975 = 10 597,5,
  the **theoretical** density. Only the sales side chooses.

---

## 🔴 2. Stock is created by reporting an unloading — never by an invoice

**H1 proved the whole chain**, and proved it twice: once by what exists before
the goods arrive, once by what appears the moment they are reported.

```
purchase order Released        → nothing
Pre-notify                     → reception exists, Kg(a) 0     no stock
Work order Released            → stock labels print            no stock
Report completion              → ███ 5 LOTS EXIST ███
Approve                        → happens by itself
```

**No invoice anywhere in it.**

**What we do now:** `app/(dashboard)/purchase-invoices/actions.ts` creates a lot
when a purchase invoice is posted. The code already carries a comment saying
this is wrong and guards it with *"link the lot the unloading already made, and
only create one when there is none"* — the fallback exists because no approved
unloading existed in our data at the time.

**Change:**

- Delete the `if (!receivedLot)` lot-creation branch and the
  `recordPurchaseLineReceipt` call inside it. An invoice for goods with no lot
  is now an **error to surface**, not a gap to paper over.
- Keep the lookup that links `PurchaseInvoiceItems.stockUuid` to the lot the
  unloading made. That part is right.
- ⚠️ **Migration:** existing rows were created by the invoice path. Do not
  retro-delete them. Add the guard, leave history alone, and note the boundary
  date.

---

## 🔴 3. A lot is valued at the product's carried price — the ledger is booked at the purchase price

Two different numbers for the same steel, both visible on 21-9-2026:

| | Value | Where |
|---|---|---|
| Lot `Valuation price` | **€ 2 058,8151 / TN** | all five lots, `Stock on location` |
| Stock mutation | **€ 2 000,00 / TN** | all five rows, `Stock mutations` |
| Purchase line net price | **€ 2 000,00 / TN** | order `401141` |

€ 4 239,00 ÷ 2,1195 t = 2 000,00 exactly, on all five rows. And 2 058,8151 is
the **same figure** carried by lots received from purchase order `IO400803` back
in April 2025 — so it is the product's price, not this order's.

So: **the ledger records what was paid; the lot carries the product's standard
price.** The difference between them is what the two revaluation GL accounts
exist for, and nothing in our receipt path produces it.

**Change:**

- `warehouse-work-orders/actions.ts` — on approving an unloading, set
  `Stock.valuationPrice` from the **product's carried price**, not from the
  purchase line.
- `stock-movements` — the movement's value comes from the **purchase line**.
- A revaluation difference of `(carried − paid) × kg` must be booked. Which two
  accounts is **not yet known** — `control-stock-revaluation-fsp` is the screen
  that reports it. **Do not guess the accounts.**
- ⚠️ We currently set `valuationPrice` from the invoice line's unit cost
  (`unitCost = lineAmount / invoicedQty`). That is the paid price **and** it is
  per piece, where the reference's is per price unit. Both halves are wrong.

### 🟡 Half of this was already right — 21-9-2026, while implementing

The **ledger** side needs no change. The receipt already books
`value = purchase line price × measure`, and that is exactly what the reference
did: its five mutation rows divide out to € 2 000,00/TN to the cent, and the
running balance closes on it.

🔴 **The lot side is blocked, and not on effort.** The lots carry
`Valuation price` **2 058,8151** — a price belonging to the *product*, which the
reference calls **APP**, and which also appears on lots received in April 2025
against a different order.

It is **not FSP**: order 102191's profit panel prints `w.r.t. APP` at € 2 058,82
and `w.r.t. FSP` at € 0,00 **side by side** for the same product.

⚠️ **Correction, same day.** An earlier draft of this said *"we have no APP at
all"*. That was wrong. `lib/server/purchase-pricing.ts` already derives an
`averagePurchasePrice` per product from the purchase invoices, and
`loadSalesPricingContext` hands it to every sales line. So the **concept** is
there; what is missing is narrower and sharper:

1. **Whether the reference's APP is the same average.** Ours is computed from
   invoices; theirs is carried on the product and on the lot. Same idea, and no
   evidence yet that the two produce the same number.
2. **The two revaluation accounts.** Receiving at the carried price while paying
   a different one *creates* a difference that has to be posted, and which pair
   of accounts takes it is unknown. `control-stock-revaluation-fsp` is the
   screen that reports it.

The chicken-and-egg resolves cleanly, which is encouraging: the receipt precedes
the invoice, so APP at receipt is the *standing* average excluding this delivery,
and the gap against what was paid is exactly the revaluation. That is what the
reference shows — lot at 2 058,82, paid 2 000,00.

The paid price stands until (2) is answered, because a lot valued correctly with
its revaluation unposted is a worse state than one valued consistently. The
divergence is commented at the point it is set.

**Reconciliation to keep as a test:** the mutation rows carry a running
product-level balance that closed exactly — € 35 311,54 → € 56 506,54
(+€ 21 195,00), 16 955,982 kg → 27 553,482 kg (+10 597,5), 160 → 260 pieces.
Note **€ 21 195,00, not € 21 196,00**: the ledger uses the true 10 597,5 kg while
the order line shows its rounded 10 598.

---

## 🔴 4. One receipt becomes many lots, and a charge is mandatory on every one

The `Report completion` dialog for an unloading arrived **pre-split into
bundles**, with ten rows of which five carried quantity:

```
For order line   Qty   Weight   Meters   To          Internal charge   Charge
O10217…           20   2 119,5     60    Ontvangst   26ADRC            ‹empty›
O10217…           25   2 649,4     75    Ontvangst   26ADRC            ‹empty›
O10217…           20   2 119,5     60    Ontvangst   26ADRC            ‹empty›
O10217…           25   2 649,4     75    Ontvangst   26ADRC            ‹empty›
‹none›            10   1 060,2     30    Ontvangst   26ADRC            ‹empty›
```

**`OK` stayed greyed until every row with a quantity had a `Charge`.** Ticking
rows, committing cells and filling `By:` made no difference. One heat number per
bundle, or the metal does not become stock.

**Change:**

- `warehouse-work-orders/actions.ts` — reporting an unloading takes **a list of
  bundles**, not one quantity, and creates one lot per bundle.
- `validation.ts` — `charge` is **required** on every reported bundle.
  This is the hardest validation rule found anywhere in the reference.
- `New` is greyed on the dialog and `Delete` is not: the operator works inside
  the rows offered and cannot invent them. Whatever pre-computes the split is
  still unknown (see Open Questions) — until it is, offer the planned quantity
  as one row and let it be divided.

⚠️ **`By:` is empty and has no options.** It is not the blocker. A fourth
independent confirmation that `Resource` is an unused feature (K3).

---

## 🔴 5. `Internal charge` names the receipt; the six-digit number names the lot

I had these the wrong way round. All five lots share one internal charge:

```
Internal charge  26ADRC   ← one per RECEIPT, system-assigned, format YY + 4 letters
Bundle           389823 389824 389825 389826 389827   ← one per LOT, consecutive
Charge           TEST-H1  ← the mill's heat, TYPED BY A PERSON
```

`26ADRC` was already in the dialog before anything was typed, and `26` matches
2026 exactly as `25AAEO`, `23FBHI`, `25ADCT` match their own years.

The picking dialog's lot picker names the six-digit column **`Interne partij`**,
which settles it from the other direction.

**Change:**

- `db/schema/stock.ts` — the comment block is right about the *fields* but
  should record that `internalCharge` is **receipt-scoped**, not lot-scoped.
- A numbering rule is needed for both: `YY` + four letters for the receipt, and
  a six-digit running series for the lot. Neither exists.
- `Stock.charge` must be settable by hand and is never generated.

⚠️ **Naming trap between the export and the panels** — getting it backwards
inverts two columns:

| Export column | Panel column | Example | Our field |
|---|---|---|---|
| **`Bundle`** | **`Internal batch`** | `389823` | `Stock.internalBatch` |
| *(absent)* | `Batch` | `4236-24` | `Stock.bundle` |

---

## 🔴 6. Selling a line starts by picking stock, and it can commit goods that have not arrived

Pressing `New` on an order line opens a **`Stock`** search window, not a product
dropdown:

- Filters on product, search code, company, product group, quality, processes
- Length / width / thickness **from–until, plus a ±5 % `Search with margin`**
- `Only products with available stock`, `1e keus` / `2e keus`
- Upper grid = product/quality variants → **`Use selected product`**
- Lower grid = **individual lots** → **`Use selected stock`**
- Three tabs: **`Stock` · `Purchase` · `Internal production`**

Two levels of commitment. `Use selected product` leaves the line unallocated;
`Use selected stock` binds it to a lot.

🔴 **The `Purchase` tab is almost certainly how 90 of the 100 pieces on purchase
order `401141` were reserved before the lorry left** — its own Stock panel read
`Qty(p) 100 · Qty(n) 100 · Qty(r) 90 · Available 10`, and the reporting dialog
then handed the warehouseman exactly that 20/25/20/25 + 10 allocation.

**Change:**

- A stock-picker component behind order/quote line entry, with the three
  supply sources and the ±5 % dimensional margin.
- 🔴 **`Reservations.stockUuid` is `notNull` and must not be.** A hold against
  incoming purchase supply has no lot. Either it becomes nullable with a check
  constraint that exactly one of `stockUuid` / `purchaseOrderItemUuid` is set,
  or the commitment is modelled on the purchase line instead.
- `db/schema/order-items.ts` — the `For line` link between a purchase line and
  the sales line it was bought for. Visible on both documents, modelled on
  neither.

---

## 🔴 7. Blocking: the reason is system-set, unblocking is one checkbox

Order `102191` saved itself **`Provisional, Blocked`**. The `Finances` panel:

```
Financial blockage   ☑        Blocking reason:  Post(s) outstanding for too long   (disabled)
Invoice blockage     ☐        Payment terms:    Within 30 days from date of invoice
```

- **The margin warning did not block it.** *"Line 10: The profit margin is lower
  than the minimum profit margin for this product"* is a warning that ticks
  `Profit too low` on the line and nothing more. The block is the overdue-debt
  rule — the one whose day threshold is still the single hardcoded guess in our
  code (`OVERDUE_POST_BLOCK_DAYS = 30`, K1).
- **`Blocking reason` is disabled.** Never chosen by a person.
- **Unticking `Financial blockage` lifts the hold.** No confirmation, no reason
  asked, no second field. The reason clears to `-empty-` with it, and the block
  **survived a close and reopen**.
- ⚠️ The batch scheduler is off, so whether a scheduled re-check would re-apply
  it is untested. Within normal use it is permanent.

**Change:**

- `financially-blocked/actions.ts` — a release action. **None exists.**
- `db/schema/orders.ts` — `invoice_blockage` as a second, independent flag.
- `unblocked-orders/` becomes a log of a real action rather than an import.
- Because there is no confirmation and no reason field, the audit trail is
  whoever saved the record — which is exactly why 63 releases in the reference
  carry only the vendor's login name.
- **Do not add a reason field the reference does not have.**

---

## 🔴 8. `Make final` creates the warehouse and transport work orders

One button on the sales order produced all of this:

- an **order confirmation** document (PDF preview, full letterhead)
- a **send dialog** — `Don't send` / `Immediately send the following`, with
  e-mail / fax / **Staalweb** as the three channels
- the order → **`Vrijgegeven, Printed`**, the line → `Released`
- **warehouse work order `306697`** — Type `Picking`, `From Ontvangst` →
  `To Laad`, 5 ST / 540 kg, `New`
- **transport work order** — Direction `Deliver`, delivery date 23-09-2026,
  `Trip` and `Bill of lading` **empty**, `New`
- production work orders: **none** (nothing needs cutting)

**Change:**

- `orders/actions.ts` — a `makeFinal` action doing all four things in one
  transaction: document, status, warehouse work order, transport work order.
- The picking work order's `Kg(p)` is **540 — the trade weight**, not the
  theoretical. Consistent with item 1.
- Whether a production work order is raised depends on the line needing
  processing; on a plain stock line it is not.

---

## 🔴 9. Reporting a warehouse work order self-approves, and the ladder is enforced

Watched twice, on an unloading and on a picking:

| Status | Live buttons |
|---|---|
| `New` | `Release` · `Vrijgeven zonder voorraadlabels` · `Cancel` |
| `Released` | `Report completion…` · `Cancel` · (`Package`, picking only) |
| after reporting | **`Approved`** — `Approve` was never pressed |

This is exactly what `lib/enums.ts` already says of `workOrderStatuses`
(*"a warehouse order lands straight on `approved` when it is reported"*) — now
watched rather than inferred. **No change needed; add a test that locks it in.**

Two further facts:

- **`Release` prints.** Stock labels on an unloading, a
  `PickOrderLandscape` pick list on a picking — no dialog, no questions. A
  second button releases **without** labels.
- The toolbar only wakes for the **leaf** row of the day/type/order tree.

**Change:**

- `warehouse-work-orders/actions.ts` — a `release` action that produces the
  document, and a `releaseWithoutLabels` variant.
- Two print templates we do not have: the **stock label** and the **pick list**.
  Both PDFs are saved (`306675-labels.pdf`, `306697-picklist.pdf`) and should be
  read before either is designed.

---

## 🔴 10. An internal move is not a stock mutation

`Stock mutations` for 21-9-2026 returned **five rows — the receipt only**. The
picking from `Ontvangst` to `Laad` produced **no mutation at all**.

So the mutations ledger books boundary crossings — goods in, goods out — and not
relocations inside the building. That squares with the earlier finding that
4 189 customer deliveries are caused by a **trip** rather than by a work order.

**Change:**

- `stock-movements` must **not** be written for a `Picking`, `Fetching`,
  `Relocating` or `Arranging` work order. Check
  `WAREHOUSE_WORK_ORDER_TYPE_META` against this.
- The mutation's columns, now seen filled: `Mutation reason`
  (`Ontvangst From supplier`), `Workorder#`, `Text` (= `401141/10`, the purchase
  **line**), running `Starting`/`Closing stock` in **€, kg and pieces**, GL
  `3000 Stock`, revenue group, company, charge, internal charge, internal
  bundle, and **three quantity columns** — pieces, kg and metres.

---

## 11. Four profit bases, not one

The line's `Revenue+Profit` panel:

```
CURRENT APP: € 2.058,82      Profit w.r.t. CURRENT APP: € -1.090,91

           Revenue   Profit w.r.t. APP   Profit w.r.t. FSP   Profit w.r.t. Repl. price   Profit w.r.t. LIP
Materials:  €0,00      €-1.090,91            €0,00                  €0,00                    €0,00
Options:    €0,00           €0,00            €0,00                  €0,00                    €0,00
Total:      €0,00      €-1.090,91            €0,00                  €0,00                    €0,00
```

**APP** is the average purchase price and **it is the number a lot is valued at**
— € 2 058,82 is the same figure that appeared on all five lots and in the stock
picker's `APP` column. That answers K5's "what is Gip" from the side: the carried
price has a name and it drives cost.

FSP, Replacement price and LIP are all € 0,00 on this product.

**What we have:** `summaryBlock` in `lib/helpers.ts` already carries `profit` and
`profitReplPrice`. **Two of four.**

**Change:** add profit against **APP** and against **LIP**, and make the header
line (`CURRENT APP: …`) part of the summary. K4 (what LIP stands for) is still
open but its *behaviour* is now known: it is a price basis profit is measured
against.

---

## 12. Picking allocates a lot, and defaults to one nobody has claimed

The picking `Report completion` dialog is the mirror of the unloading's:

| | Unloading | Picking |
|---|---|---|
| Rows | bundles you declare | lots you consume |
| `Charge` | **typed**, mandatory | **pre-filled** from the lot |
| Destination | `To` **per row** | one **`To Location`** for the report |
| Extra | `For order line` | `From location` |

Clicking `Charge` opens a lot picker listing every lot at that location. It had
defaulted to **`389827` — the only one of the five not reserved to another
customer.** So the system suggests free metal first and a picker may override.

**Change:**

- `warehouse-work-orders/actions.ts` — reporting a picking consumes named lots,
  with a default allocation preferring unreserved stock.
- ⚠️ The picker showed `Available` as the **full** quantity on all five lots
  (20/10/20/25/25) while `Stock on location` showed four of them at
  `Available 0`. The two disagree. **Do not implement an availability rule until
  this is settled** (see Open Questions).

### ✅ Built 30-9-2026, after the flow closed O2 and O3

The availability rule the warning above was holding back is now settled, and
five things went in with it. What was **not** copied is listed at the end.

| | What | Where |
|---|---|---|
| 1 | **A relocation moves the row, it does not mint a new identity.** Moving a whole lot now updates its `location_uuid` in place — same uuid, same valuation, same stock category, same reservation. Only a *partial* move splits a row off | `lib/server/stock-movements.ts` — `applyMove` |
| 2 | **What a split may merge into.** A part that travelled joins a lot at the destination only when the parcel number, the heat, the internal charge, the quality, the stock category **and the valuation price** all agree | same |
| 3 | **The warehouse lot picker.** `getPickableLotsForLine` — physical stock, reservations shown but never subtracted, scoped to the line's `From location` with the scope removable, exactly as the reference's `Location = 2C7` chip behaves | `warehouse-work-orders/actions.ts` |
| 4 | **Allocation at creation.** `makeOrderFinal` copies the lot's `charge` / `internalCharge` / `internalBatch` / `quality` onto the work-order line, so a `New` picking already names the metal it is for | `orders/actions.ts` |
| 5 | **The dialog, per line.** `Executed on` is now a date *and* a time defaulting to now, `By` is an operator select, `To location` is a select defaulting to the line's destination, and each row carries its own lot picker — which is what makes `+ New` a genuine parcel split rather than five rows against one lot | `report-completion-dialog.tsx` |

Three smaller ones came out of the same evidence:

- **`valuation_price` is `decimal(15,5)`, not `(15,4)`.** The reference carries
  `1537,61789` and its `Stock (€)` reconciles to the cent off the fifth decimal.
  A new `unitCostString` helper writes all seven call sites so they cannot drift
  from the column again. ⚠️ **Schema change — `pnpm db:push` not run.**
- **The reported lot's identity is what the line keeps.** A floor that walked to
  a different parcel than the one planned leaves the line naming the heat it
  really shipped, and the pick row records the lot's own `From location` rather
  than the line's.
- **`Stock.bundle` carries a warning.** The `Stock on location` export's column
  named `Bundle` is `internalBatch`, not this column. Mapping it here on an
  import would file the parcel number under the supplier's batch.

**Deliberately not copied:**

- **The re-plan.** Reporting one line does not delete and re-raise the rest
  (§7 of [picking-flow.md](picking-flow.md)). Ours decrements the reported line
  and leaves the others, their reservations and their printed paper alone.
- **The pre-filled weight on a short pick.** The reference leaves `Kg(a)` at the
  planned figure whatever quantity is then typed, so reporting 20 of 50 pieces
  reports all 50 pieces' worth of metal. Ours clears it — and clears it rather
  than recalculating it, because `Kg(a)` is what the parcel weighed and the
  reference's own two densities disagree by 1,9 % (**O11**). A computed weight
  presented as a measured one is the mistake O11 is about.

---

## 13. Sales order fields we do not have

From the header, the `Finances` panel and the confirmation document:

| Field | Note |
|---|---|
| `Price date` | separate from creation date; drives which price list applies |
| `Order category` | |
| `Project` | |
| `Handling blocked` | a third hold, distinct from financial and invoice |
| `Klant materiaal` | customer's own material |
| `Consignment with a duration` | with a value + unit |
| `Leave customer` *(Leave custome…)* | on the customer reference |
| `Show net price` | print option |
| `Scrap surcharge separately` | print option |
| `Only total amount on invoice` | print option |
| `Include option prices in material prices` | **on by default** — decides whether option revenue is folded into materials, which bears directly on the C10 option-revenue split |
| `Transport costs` / `Handling costs` | on the summary; **this is where a trip's cost lands**, which had been an open question |

**Change:** `db/schema/orders.ts` + `orders/validation.ts`. Several are print
options and belong together as such.

---

## 14. Customer defaults to copy onto a new order

Typing the customer filled: **contact person**, **delivery terms** (`(FCA) Free
carrier`), **delivery address**, **weight type** (`Trade weight`), **payment
terms** (`Within 30 days from date of invoice`) and **billing address**.

`Seller` = the logged-in user (`Ayam`); `Representative` = **`Hego`**, a
different value. Two distinct people on one order.

**Change:** `orders/actions.ts` — a `defaultsForCustomer` step. Weight type
matters most, because it decides item 1.

---

## 15. The order confirmation document

A full `ORDERBEVESTIGING` with letterhead, both references, a grouped line table
(`Lev. datum · Rgl · Aantal · Omschrijving · Afm. · Hoeveelh. · Prijs · Korting ·
Per · Bedrag`), delivery and payment conditions, terms text and a bank footer.

Two things to carry over:

- the quantity column prints **`540 KG`** — the trade weight (item 1)
- 🔴 the footer reads *"Deze Vordering is verkocht en gecedeerd aan **Boozt24
  Finance B.V.**"* — **the receivables are factored.** Payment goes to the
  factor, not to Hego. That is a material fact about how money arrives and it
  appears nowhere in anything we have built or discussed. It also bears on K12
  (AFAS) and on how open posts are cleared.

**Change:** a document template, and **a question for Swedinox** about
factoring before anything payment-related is built.

---

## 16. A minimum profit margin per product

*"Line 10: The profit margin is lower than the minimum profit margin for this
product."* A warning on save, which ticks **`Profit too low`** on the line and
does not block.

**Change:** `db/schema/products.ts` — a minimum margin percentage;
`orders/actions.ts` — the check; `db/schema/order-items.ts` —
`profit_too_low`. The line grid already has the column in the reference.

---

## 17. Sixteen panels on a sales order

The right-click navigator lists: `Workorders · Order lines · Competitors ·
Contracts · Invoice lines · Finances · Purchase lines · Complaints · Logistics ·
Remark · Return lines · Texts · Surcharges · Documents · Communication ·
PDF Documents`. We had twelve.

Line-level panels are separate and scoped to the selected line:
`Revenue+Profit · Pricing · Stock · Stock other affiliates · Previous orders ·
Previous quotes`.

New and worth building: **`Competitors`** (`Firm · Revenue share · Customer
satisfaction · Remarks`), **`Previous orders` / `Previous quotes`** (price
history for this product with `Days in system`), **`Communication`**,
**`PDF Documents`**.

`Contracts` counts **three** kinds: *company contract(s), project contract(s),
order contract(s)*.

---

## 18. The `Pricing` cascade is empty because the product has no sales price

`Base price € 0,00`, every surcharge € 0,00, every discount 0 %, `Net price
€ 0,00` — while the line was priced € 2 500,00 by hand.

**This is the answer, not a failed capture.** The panel shows a *derivation*, and
a product with no price list derives nothing. Every `Pricing` panel captured on
this project has read zeros, and this explains all of them at once.

**The discount cascade still cannot be implemented from evidence.** It needs a
product that has a base price and a customer that has an agreement. **Do not
build it from the field names.**

Two checkboxes above it, both ticked, that we do not model: **`Transfer price
setting to order line`** and **`Transfer pricing determination to order line`** —
a purchase line's pricing can be pushed onto the sales line it was bought for.

---

## 19. Locations are a four-level tree, chosen by search

The `To` cell opens a **`Location search`** window: a `Search` tab, and a
`Warehouse` tab browsing

```
00 Hego Almere
 ├ 01 … 12          sections
 │  └ 1A            subsections
 │     └ 1A-1 … 1A-10, BNL     bins (several expand again)
 ├ Consignatie
 ├ Extern
 └ Intern
Antwerpen
```

`Consignatie` / `Extern` / `Intern` sit **alongside** the numbered sections
rather than being a flag on a location.

**Change:** verify `warehouses` / `warehouse-sub-sections` / `locations` carries
four levels, and that the picker is a search rather than a dropdown.

---

## 20. Smaller confirmations, no change needed

- **Density 7 850 kg/m³** for this product, and `Kg(p)` = volume × density to the
  gram (100 × 3,0 × 1,5 × 0,003 × 7 850 = 10 597,5 → `10 598` rounded).
- **`TN` price basis**: 10,598 t × € 2 000 = € 21 196,00 ✓. `priceBasis` is right.
- **VAT 21 %** — € 1 350,00 → € 283,50 ✓.
- **`M1`** is linear metres: 100 × 3 m = 300; 5 × 3 m = 15.
- **Send logic confirmed on a fresh order**: `Must be sent` ✓, `Deliberately not
  sent` ☐, `Send` ☐ — exactly the B1 rule we shipped.
- **A concurrency warning exists** — *"INAD (040-2438407) is doing the same
  thing"* — which is what `db/schema/work-panel-locks.ts` was built from.
- **`nvt`** (*niet van toepassing*) is a sentinel in the `Charge` column. Add it
  to the sentinel list; a naive import would file it as a heat number.
- **Texts attach by category** — category `InkoopOrder` on purchase order
  `401141`, exactly as the Texts screen models it.
- **`Vrijgegeven` is untranslated Dutch** in a status the user sees. One for
  [ENGLISH-ONLY-TODO.md](ENGLISH-ONLY-TODO.md).
- **Receipt date is the reporting date** (21-9-2026), not the order's delivery
  date (6-8-2026).

---

## Open questions — do not implement around these

| # | Question | Why it blocks |
|---|---|---|
| **O2** | ✅ **CLOSED 30-9-2026.** Reproduced deliberately on `PK44115025125`: shelf `4A5` held bundles `402152` and `402153` with identical heat, internal charge, purchase order, receipt date, valuation and dimensions. After the pick, `402153` was **gone** and `402152` existed **twice** (50 @ `4A5` + 50 @ `Laad`), 511 pieces and 18 801,731 kg conserved exactly. The two shelves holding one candidate each moved cleanly and kept their numbers | **A bundle number is a printed label, not an identity.** Our uuid primary key is already correct and stays. `Stock.bundle` is a non-unique label field, never a foreign key, and no movement is ever keyed on it. Any import de-duplicates on `(product, location, charge, internalCharge, valuationPrice)` |
| **O3** | ✅ **CLOSED 30-9-2026.** The `Report completion` `Charge` picker offered lot `402158` as **`Available 50`** while `Stock on location` read **`Available 0,00`** for the same lot at the same moment. The picker is also scoped to the line's `From location` (chip `Location = 2C7`) | **The two dialogs run different rules on purpose.** Sales order-line picker: `Available = Stock − Reserved`, so a salesman cannot sell committed metal. Warehouse report picker: `Available = physical stock`, because the picker is consuming metal for the very order that reserved it. Both halves settled |
| **O4** | 🟡 **NARROWED 2-10-2026, not closed.** The `Receipts` grid carries four EDI columns and one is literally **`EDI Bundels`**, beside `EDI Charge`, `EDI Vrachtbrief` and `EDI Leverdatum`; the header has `Message sent via StaalWeb`. **Best hypothesis: the mill sends the bundle breakdown and nobody computes it.** ⚠️ Unproved — blank on the order read, which was placed by `Order method: Telephone`. ⚠️ **And `401141` did not open the H1 document**: the grid showed a 2025 Terninox **coil**, 1 line, 1 reception, 4 340 kg — either the overview was scoped to the previous tab's product or the test order is gone | Item 4 offers one row until this is known. **Next:** find the real order via `Stock on location` → internal charge `26ADRC` → `Show purchase order`; then read an order whose `Order method` is EDI/StaalWeb |
| **O5** | Was work order `306675` raised by the `Workorder` button, or automatically by `Confirm` / `Pre-notifiy`? — 2-10-2026: the order's `Workorders` panel is **three sub-panels** (`Warehouse` / `Production` / `Transport`) and `Pre-notify` turns out to sit on the **`Lines`** toolbar as well as the order's, so it is a per-line act | The only gap left in H1 |
| **O6** | After reporting, work order `306675` read `Qty(p) 10 / Kg(p) 1 060,2`, down from 100 / 10 598, with no child rows | Cosmetic — the stock is right either way — but unexplained |
| **O7** | The unloading dialog balanced its last bundle to the order's **rounded** `Kg(p)` (1 060,2) and stock stored the theoretical 1 059,75 | **Do not reproduce the dialog's arithmetic as if it were stored** |
| **O8** | **Is the factoring arrangement with Boozt24 current?** | Item 15. Ask before building anything that clears an open post |
| **O9** | 🔴 **Which two accounts take the revaluation?** A lot comes in valued at the product's APP (€ 2 058,8151) while € 2 000,00 was paid. That gap has to be posted and we do not know where | Item 3's lot side. We already derive an average purchase price, so the valuation itself is reachable — but valuing the lot correctly while leaving the difference unposted is worse than valuing it consistently. `control-stock-revaluation-fsp` is the screen that reports it |
| **O10** | ✅ **CLOSED 2-10-2026.** The `Valuation` panel on `PK44115025125` prints `APP = € 1.587,63` per TN with a five-decimal input mask, and `History APP` keeps a dated row per change, each referenced **`Inslag inkooporder IO400201`** — one per goods receipt | **Same average, different mechanism.** The reference recalculates APP **at receipt time** and keeps the history; ours recomputes from purchase invoices on read. So a lot's `valuation_price` is the APP *as it stood when that lot arrived*, and recomputing from today's invoices will not reproduce a historic lot. Confirms `decimal(15,5)` for the third time |
| **O11** | ✅ **CLOSED 2-10-2026.** Not a disagreement — two bases, both correct. Every stock row and every stock mutation on the product is **theoretical 7 850** to the gram (24 pieces stored as `883,125`). The `Orders` panel shows seventeen lines split by **customer**: Bergen Stainless at trade 8 000 (150 → 5 625), Thermo Products and MATINA EXIM at theoretical (51 → 1 876,7). `Make final` copies the **order line's** `Kg(p)` onto the work order, so a trade-weight customer's picking plans 1 875 against a shelf holding 1 839,84 | **The reference does not reconcile them, it tolerates them.** `Warehouse control` allows a picking to be reported **5 %** off plan; the trade/theoretical gap is 1,911 %. Keep `Kg(p)` from the order line, compute `Kg(a)` from the lot at **theoretical** density, and validate the difference against the product's tolerance instead of demanding equality |

---

## Suggested commit order

One flow's worth of change per commit, smallest blast radius first.

1. **2** — remove the invoice's lot creation (self-contained, and the comment
   already says it is wrong)
2. **7** — the unblock action and `invoice_blockage` (no arithmetic)
3. **16** + **13** + **14** — order fields, minimum margin, customer defaults
4. **5** — identifier scoping and the two numbering rules
5. **4** + **9** — bundle reporting with a mandatory charge, release documents
6. **3** + **10** — valuation on receipt, and movements only on boundary crossings
7. **8** — `makeFinal`
8. **6** — the stock picker and the nullable reservation
9. **1** — the two weights ⚠️ **last, and re-run every margin check**
10. **11**, **17**, **19** — panels and presentation

**Blocked until answered:** ~~item 12 needs O2 and O3~~ — ✅ both closed 30-9-2026, item 12 is unblocked. Item 18 cannot be built at
all from what exists. ✅ Item 1 is unblocked — the product carries the density.

---

## 21. Three more answers off one product screen

Product `PK304L300315` was opened only to settle item 1. It closed three other
items on the way past.

### 🔴 The CN commodity code exists — `Commodity: 72193310`

K13 (do we file CBS returns?) had been written off as unbuildable because
*"it needs a CN commodity code per product and an SBI code per company, neither
of which we have."* **Half of that is wrong.** The code is a field on the product
record and has been all along. `72193310` is the correct CN heading for
cold-rolled stainless flat product.

**Change:** `db/schema/products.ts` — a `commodity_code`. The CBS screen then
needs only the **SBI code per company**, which is still missing. K13 goes from
"cannot build" to "one field short".

### `Price: Algemeen` — why the cascade was empty

The product's price list is `Algemeen` (general). That is the direct reason item
18's `Pricing` panel derived nothing: the product is on the general list with no
customer agreement behind it. Confirms the diagnosis rather than changing it.

### J5 — the product `Options` list

Six, all reading `Possible`: `Duplo · Decoilen · Grinding · Brushing ·
ShearCut · Laser Foil`. ⚠️ `Knippen` appears on purchase receivals and **not**
here, so the enum still has at least a seventh member.

### Other fields on the record, for completeness

`Material group` · `Commodity` · `Scrap` ☐ · `Packaging` ☐ · `Description
sales/purchase can be overwritten` ☐ · three **search codes** · `Gip
Artikelgroep` · three description levels (group long / group short / product
short) · `Fixed dimensions` ✓ · `Paint surface (M2/M1)` · `Standards`
(quality / tolerance / CE, all empty) · `Classification features` (product
group, material, quality group, main/sub shape, **procedure = `Cold-rolled`**,
appearance, performance) · `Print dimensions` ☐ · `Industry number`.

Toolbar: `Show product group` · **`Correct products and stock`** (live — this is
the H3 adjust-a-lot entry point) · `Activate` (greyed) · `Production workorder
for stock` (greyed) · `Copy product (group) and…`.

---

## 22. The order-line stock picker, read against the stock screen — 29-9-2026

One product, `PK316T05013`, opened twice: on `Stock on location` and then in the
`Stock` search window that `New` raises on an order line. Four lots, one receipt
(`IO403918`, 15-7-2026, charge `0477979`, Acciai Speciali Terni).

### What the stock screen says

| Bundle | Location | Stock | Reserved | Available | Kg | € | €/TN |
|---|---|---|---|---|---|---|---|
| `403911` | `9C` | 156 | 156 | **0** | 1 990 | 7 038,52 | 3 536,99 |
| `403912` | `9C` | 156 | 156 | **0** | 1 990 | 7 038,52 | 3 536,99 |
| `403916` | `9C` | 53 | 53 | **0** | 676 | 2 391,29 | 3 536,99 |
| `403917` | `4A1` | 30 | 0 | **30** | 383 | 1 378,66 | **3 602,57** |

`Available = Stock − Reserved`, exactly, on all four.

### What the order-line picker says

The upper grid groups the lots by quality/option/choice, and the lower grid
lists the lots of the selected group:

| Upper row | Technical | Reserved | Available | is |
|---|---|---|---|---|
| 316T, no option | 209 ST | 209 ST | **0 ST** | `403912` + `403916` |
| 316T, `Stempelen` | 156 ST | 156 ST | **0 ST** | `403911` |
| 316T, `2nd choice` | 30 ST | 0 ST | **30 ST** | `403917` |

The lower grid reads `Available 0 ST` on `403912` and `403916` individually.

**The order-line picker respects reservations.** It does not show free metal
that is already committed, at either level.

⚠️ **This is not O3.** O3 was raised on the *picking* `Report completion`
dialog's `Charge` lot picker (item 12), which is a different window. What this
settles is that the **sales-side** picker is safe to copy; the warehouse-side
one is still unread. See the amended O3 below.

### Three behaviours to copy, and one not to

1. 🔴 **`Only products with available stock` does not filter on availability.**
   It was ticked while two rows showed `Available 0 ST`. The grid's own filter
   chip reads `TotalPhysicalStock ≠ 0`. So the checkbox means *physical stock
   exists*, not *available > 0* — the obvious implementation is the wrong one.
2. **`Search with margin` — ±5 % on length, width and thickness**, defaulted on
   with 5 in each box. Asking for 2500 × 1300 also offers 2540 × 1250. Ours has
   no dimensional tolerance at all.
3. **`Use selected stock` is disabled until a lot is ticked** in the lower grid;
   `Use selected product` is always live. That is the two-level commitment of
   item 6, enforced in the UI.
4. `1e keus` / `2e keus` are the stock-category filter, both unticked by default,
   so both choices are offered together — a 2nd-choice lot is a normal candidate
   unless somebody excludes it.

### The revaluation gap, on a second record

The lower grid prints both prices side by side: **`APP 3537 / TN` against
`Purchase 3500 / TN`** on `403912` and `403916`. The same €37/TN shape as
purchase order `401141`, now seen on an unrelated receipt — so it is the rule,
not an artefact of the flow we watched.

And the fourth lot sharpens it. `403917` is the **2nd choice** downgrade off the
same receipt, created `02-09-2026 16:44` against `18-08-2026 12:20` for the other
three, and it is valued **above** them — €3 602,57/TN against €3 536,99/TN.

**A lot takes the product's carried average on the day the lot is created, not
the price on the receipt it came from.** Two weeks of APP drift is why the
downgraded lot is worth more per tonne than the prime metal beside it. This is
item 3's mechanism, and it is what makes **O9** urgent rather than academic: the
gap is posted on every receipt and on every later lot split.

### Amended: O3 narrows, it does not close

| | Before | Now |
|---|---|---|
| Order-line `Stock` picker (item 6) | unknown | ✅ respects reservations |
| Picking `Report completion` lot picker (item 12) | disagrees with stock screen | 🔴 still unread |

The two dialogs may legitimately differ — a salesman must not commit reserved
metal, while a warehouseman consuming stock arguably should see everything
physically on the shelf. **Item 12 stays blocked**, now on O2 and the warehouse
half of O3 only.

### Also noted

`Finance` is absent from the `Overviews` tree on the login used for this
capture — ten groups, not the eleven recorded on 10-9-2026. A rights difference,
not a missing module. **The ledger work needs a login with Finance rights**, and
the `Journal entries` re-capture is parked until then.

---

## 🔴 23. A purchase line is billed on the **weighed** kilos, and stock keeps the **theoretical** ones — 29-9-2026

Purchase order **`402532`** (Holland Stainless Int, supplier `11692`, created
3-12-2025, purchaser Cherice van Rooyen), opened from a warehouse work order
row. Two lines, sixteen receipts, twelve lots still on the floor.

### First, a structural answer nobody had asked for

**A warehouse work order has no record of its own.** Right-clicking a row on
`Warehouse workorders` offers exactly two things — `Show Product` and
`Show Purchase order` — and nothing opens a work-order detail screen. The work
order lives as a **panel on its parent document**: the purchase order carries
`Workorders` with three sub-grids (`Warehouse` · `Production` · `Transport`),
and that is the only place its lines are editable.

⚠️ **Consequence for us:** there must be no standalone work-order detail route.
The picking `Report completion` dialog is reached from the *sales order*, not
from the work-order overview — which is why the O3 warehouse half is still
unread.

### The arithmetic — every figure to the cent

| Line | Product | Qty | `Kg(p)` | `Kg(a)` | Net price | Amount |
|---|---|---|---|---|---|---|
| 10 | `PW304L04315` | 160 ST | 22 608 | **22 655** | € 1 970,00 / TN | € 44 630,35 |
| 20 | `PW304L05315` | 144 ST | 25 434 | **25 829** | € 1 970,00 / TN | € 50 883,13 |

```
Kg(p) x 1,97 = 44 537,76    <- NOT the amount
Kg(a) x 1,97 = 44 630,35    <- exact, both lines
```

🔴 **`Amount = Kg(a) x net price`.** The planned weight bills nothing. And the
whole document follows from it:

| | Computed | Shown |
|---|---|---|
| Materials | 95 513,48 | 95 513,48 ✅ |
| VAT @ 21 % | 20 057,83 | 20 057,83 ✅ |
| Incl. VAT | 115 571,31 | 115 571,31 ✅ |
| Total weight | **sum of `Kg(a)`** = 48 484 | 48 484 ✅ (sum of `Kg(p)` is 48 042) |

### Where the two kilos come from

The product record settles it. `PW304L04315`, `Weights` block:

```
Theoretically:  7 850,000      Trade:  8 000,000      German:  0,000
```

A 3000 x 1500 x 4 mm plate:

| Basis | kg/piece |
|---|---|
| theoretical, 7 850 kg/m³ | **141,3** |
| trade, 8 000 kg/m³ | 144,0 |
| actually weighed (`Kg(a)` / 160) | **141,59** |

- `Kg(p)` 22 608 / 160 = **141,30** — the theoretical weight, exactly
- Stock's `Kg (t)` 1 413 per 10 pieces = **141,3** — theoretical, exactly
- `Kg(a)` 22 655 / 160 = **141,59** — the weighbridge

🔴 **So the purchase pays for 141,59 kg a plate and stock carries 141,30.** On
this one order that is **442 kg bought and never stocked** (48 484 − 48 042),
about € 871 at the line price. It is not an error — it is the same two-weight
split as item 1, seen from the buying side, and it is where `5300 Price
differences on purchase invoices` and the O9 revaluation gap come from.

**Change:**

- `purchase-order-items` must carry **both** weights and bill on the actual one.
  Ours has a single weight, so every purchase line is billed on theory.
- The receipt grain already holds both — the `Receipts` panel prints `Kg(p)`
  1 413 against `Kg(a)` 1 405 per receival, with `Qty(p)` in `ST` and `Qty(a)`
  in `Pieces`.
- The order header's total weight is the **actual** sum, not the planned one.

### The stock panel's toolbar — the write actions, named

On the product record, the `Stock` panel carries the verbs we have been guessing
at:

```
New · Relocating… · Restocking… (greyed) · Correction… · Scrapping… ·
Transfering… · Batch registration… · Reservations… · Stock label ·
Opties bewerken · Splits
```

**`Correction…` is the H8 "adjust a lot by hand" entry point**, and `Splits`,
`Scrapping` and `Transfering` are three more write paths we list read-only.
`Restocking…` is greyed — another of the switched-off features.

### Smaller things off the same document

- **`Text lines`** is a panel with a **category** enum — one row here, category
  `InkoopOrder`, text *"Please note that this position was changed"*. Free text
  is categorised per document, not a single notes field.
- The purchase-order toolbar carries **`Return`** and **`Par. return`** — the
  purchase-return flow, beside `Confirm`, `Pre-notify`, `Workorder`, `Options…`
  and `Relocate`.
- **`Pricing` is empty again** — every box € 0,00 and greyed, on a second
  document. Item 18's diagnosis holds: the cascade derives nothing when the
  product sits on the general price list.
- `Previous orders` shows three prior buys of the same product with a
  **`Days in system`** column (257 / 391 / 460) — the age of the order, offered
  as a buying aid.
- Lots from one receipt carry **two different charges** — `0476884` and
  `0477095` — against one purchase order `IO402532` and one receipt date. So a
  charge is per *receival*, not per purchase order, confirming item 5.

---

## 24. `Report completion` crashes on an unassigned picking — 29-9-2026

Two attempts, two identical crashes, so this is the behaviour and not a fluke.

```
Unexpected application Error
ExceptionManager.FullName: ez2Lib.Shared, Version=3.13.0.508
Exception Type: System.NullReferenceException
Message: Object reference not set to an instance of an object.
```

Only button offered: `Close application`.

### What was being reported

Work order **`312722`** (Picking, 15-10-2025, order `103015` Mercainox,
7 lines / 4 673,7 kg / 95 pieces planned, **0 ready**), selected on the
operational screen and reported with the toolbar's `Report completion...`.

🔑 **Every line of `312722` carries `Charge` = `-`.** The sibling work order on
the same sales order, `312991`, carries charge `519108` on its line — and
`312991` crashed too.

### What it implies

A picking cannot be reported until its lines have lots assigned, and the
reference does not guard the case: it dereferences the allocation and throws.
So **charge assignment is a step of its own, before reporting** — which is most
of what item 12 was trying to establish.

**Change:** our `reportPicking` must refuse a line with no allocated lot with a
stated error, not proceed. That is a guard the reference itself lacks.

### O2 and the warehouse half of O3 stay open, and are now expensive

Reaching that dialog needs a picking whose lines already carry charges, which in
practice means watching one picked from the start rather than opening an
existing one. **Park both until a flow session.** They block only item 12.

### Route notes, so nobody hunts for this again

- `Overviews → Logistics → Warehouse workorders` is a **report grid**.
  **`Logistics → Warehouse workorders`** (the top menu, not Overviews) is the
  **operational screen** — that is where work is released, reported, approved.
- Its toolbar: `Select All` · `Details` · `Release` · `Vrijgeven zonder
  voorraadlabels` · `To prepare` · **`Report completion...`** · `Approve` ·
  `Cancel` · `Package` · `Print`. Filters: `Date` · `Section` · `Subsection` ·
  `Type` · `Status` · `To`, plus priority buttons `1 2 3 4`.
- Queue buttons across the top: `Afhalen` · `Hego Prod - Lossen` ·
  `Hego Prod - Picken` · `Lossen` · `To Do Slijp+Knip` · `Alles`.
- The sales order's `Actions` menu does **not** report work orders. It holds
  `Print` · `Send` · `Return` · `Par. return` · `Show company` · `PAC` ·
  `Cancel` · `Optimize` · `Copy` · `Workorder` · `Invoice` · `Options…` ·
  `Prices…` · `Optimize (input)` · `Manual sawing workorders…` · `Show quote` ·
  `Pro-forma invoice…` · `Delivery dates…` · `Print order status…` ·
  `Send order status…` · `DSTV Import` · `Print packing list` ·
  `Send certificates` · `Bill of lading` · `Opties inkopen…`.
- `Logistics` menu: `Warehouse workorders` · `Production workorders` ·
  `Transport workorders` · `Production schedule Suppliers`.

### Item 17's sixteen panels, confirmed by name

The order's panel-jump menu lists them exactly: `Workorders` · `Order lines` ·
**`Competitors`** · `Contracts` · `Invoice lines` · `Finances` ·
`Purchase lines` · `Complaints` · `Logistics` · `Remark` · `Return lines` ·
`Texts` · `Surcharges` · `Documents` · **`Communication`** ·
**`PDF Documents`**. Sixteen, and the three we were least sure of are real.

### One more order header field

Order `108034` and `103015` both carry a **`Normal` / `Weighed`** dropdown in the
order-type block, and the summary prints **`Avg. kilo price`** — € 2,55 on
`108034` (71 349,00 ÷ 27 980, exact) and € 2,57 on `103015`. The header also
prints `Total weight` beside `Theor. wt.`: equal on `108034` (27 980 / 27 980,0),
**different on `103015` — 18 578,4 against 18 397,3**. The same two weights as
item 23, now on the selling side of a delivered order.

---

## 🔴 25. Flow H12 — a return, watched end to end — 29-9-2026

Return order **`290247`** (Mercainox `12368`), created, made final and reported
in `HEGO TEST`. One line, `PK304L100315`, 1 ST, 35,325 kg. The first write-flow
watched since 21-9, and the one that answers what a return actually does.

### The document

- Entering the customer **creates the document immediately** — number `290247`,
  status `Provisional`, before anything is on it.
- `Contact`, `Sales` (the rep), `Pick-up` and `Delivery address` all fill from
  the customer record. 🔑 **The two addresses are inverted against a sales
  order**: `Pick-up` is the customer's address, `Delivery address` is ours
  (`Bolderweg 10, 1332AT, Almere`). Goods travel customer → us.
- 🔴 **`Sales order` on the header is greyed and cannot be filled.** There is no
  header-level link to the original sale.
- 🔴 **The line's `Order line` stays `0`.** Nothing links the return to the sale
  it reverses — not on the header, not on the line, not through the charge.

### `Return reason` — a six-value enum we did not have

```
Damaged · Wrong quantity · Wrong material delivered ·
Delivered too late · Not delivered / not collected · Transport damage
```

**Change:** `lib/enums.ts` gets `returnReasons`, `lib/labels.ts` its labels. It
decides nothing yet — but see [[feedback-enums-must-carry-behaviour]]: find out
whether `Transport damage` routes differently before shipping it as a label.

### Picking the line

`New` on `Order lines` adds an **inline row**, not a dialog. The `Product` cell's
`…` opens **the same `Stock` search window as a sales order** — same three tabs,
same `TotalPhysicalStock ≠ 0` chip, same ±5 % margin. So a return line is chosen
from **our own stock**, identifying what the metal *becomes*, not what it was.

`Reserveringen…` is greyed here where it is live on a sales order.

🔴 **No price cascades.** With the product picked and `Qty(p) = 1` entered,
`Gross Price` stayed `€ 0,00`, `Amount € 0,00`, `Materials € 0,00`. A return
does not price itself from the original invoice, nor from the product list. The
credit value is typed by hand, or it is nothing.

`Kg(p)` filled itself: **35,4** on screen, **35,325** in stock — the exact
theoretical (3,0 × 1,5 × 0,001 × 7 850). The grid rounds to one decimal; the lot
keeps four.

### `Make final`

Silent — no dialog, no confirmation. Status `Provisional → Released` on header
and line, `Customer` and `Return date` lock, `Make final` leaves the toolbar and
`Workorder` / `Invoice` come alive.

🔴 **It accepted `€ 0,00` without objection.** A return can be made final
carrying no money at all.

### 🔑 A return raises an `Unloading` work order

Work order **`327396`**, Type **`Unloading`** — the *same type as a supplier
receipt*. Status `New`, `To` = **`Ontvangst`**, `Qty(p) 1 ST`, `Kg(p) 35,4`.

- **There is no "return" movement type.** Goods coming back use the same verb as
  goods arriving from a mill. One inbound movement, two possible causes.
- 🔴 **`Purchase order` is `-leeg-`.** An unloading work order exists with **no
  purchase order behind it**. If our schema requires one, a return cannot be
  booked at all.
- It lands at **`Ontvangst`**, not a pick location, and starts at `New` — a rung
  below the `Released` that picking starts at.

### Reporting it

`Release` first (the screen also offers `Vrijgeven zonder voorraadlabels` —
release *without* stock labels, so a normal release prints them), then
`Report completion…`.

The dialog opened **without crashing**, which confirms item 24: the
`NullReferenceException` is specific to a *picking* whose lines carry no
allocated lot, not to reporting in general.

- `OK` is **greyed until `Charge` is filled** — item 4 holds on the return path
  too: a charge is mandatory per bundle.
- `Charge` is **free text**, no picker. So the charge is no route back to the
  original sale either.
- Columns we do not model: `Gross weight`, `Weight claimed`, `Side`,
  `Factory number`, `Internal batch`, and `For order line` — which is a
  **checkbox**, not a lookup.

🔑 **And then this, on `OK`:**

> **Geen gewogen gewicht** — *"De opdracht moet met gewogen gewichten
> teruggemeld worden. Het gewicht is niet gewijzigd. Doorgaan?"*
> *(The work order must be reported back with weighed weights. The weight has
> not been changed. Continue?)*

**This is the mechanism behind item 23.** The order is type `Weighed`, and the
system insists the reported weight be the one off the scale, warning when the
theoretical figure is left untouched. That is how `Kg(a)` comes to differ from
`Kg(p)` — and why a purchase line bills on `Kg(a)`.

### 🔴 The finding that matters: a returned lot enters stock at ZERO

Lot **`404763`**, read straight off `Stock on location`:

| Field | Value |
|---|---|
| Location / type | `Ontvangst` / `Pick` |
| Warehouse section | `00 Hego Almere` |
| Stock | 1 ST · **35,325 kg** |
| **Valuation price** | **0** |
| **Stock (€)** | **0** |
| Stk-GL account | **`3000` Stock** |
| `Charge` | **empty** |
| `Internal charge` | **empty** |
| `Purchase order` | **empty** |
| `Supplier` | **empty** |
| `Receipt date` | **0** |
| `Blocked` | False |
| `Stock category` | *(blank — prime)* |
| `Available (StkU)` | **1** |

Three consequences, each worth code:

1. 🔴 **The metal is on the books at € 0, prime, unblocked and immediately
   sellable.** Sell it and the margin reads 100 %. Nothing revalues it; nothing
   flags it. This is `3550 Stock revaluation`'s job and it is not being done —
   which sharpens **O9** from an accounting question into a live distortion.
2. 🔴 **The typed charge did not persist.** `RET290247` was entered in the
   reporting dialog and the lot carries no charge, no internal charge, no
   supplier. **Traceability breaks on every return** — you cannot get from the
   lot back to who sent it.
3. 🔴 **`Receipt date` is `0`.** The lot is undated, so every age-based report
   skips it. In the 22-9 stock analysis **38 of 2 035 lots had no receipt date**
   and were dropped from the ageing — returns are very likely most of them.

**Change:**

- `stock-lots` created by a return must carry a value. Decide the basis
  (original sale price, product APP, or zero-and-flag) — this is a business
  call, and it belongs with **O9**.
- The reported charge must persist to the lot.
- `receivedAt` must be set on a return, or the ageing reports lie.
- A return must be linkable to the sale it reverses. The reference does not do
  it; **we should**, because without it a credit cannot be checked against what
  was charged.

### What is still not answered

`Invoice` came alive on the return after `Make final` and was **not pressed** —
so the credit note itself, and whether it prices from the original invoice, is
the one part of H12 still unwatched. That is the natural first step next time.

---

## 🔴 26. The return's stock mutation — value does not move — 29-9-2026

The mutation written when lot `404763` landed, read off
`Overviews → Logistics → Stock mutations`, every column.

| Field | Value |
|---|---|
| Mutation date / time | `29-9-2026 17:34:44` |
| Mutation operator | `A.K` |
| **Mutation reason** | **`Ontvangst Return customer`** |
| Product | `PK304L100315`, 3000 x 1500 x 1 |
| Mutation qty | **1 ST** · **35,325 kg** |
| **Mutation value** | **€ 0,00** |
| **Workorder#** | **`327396`** |
| **Order** | **`R290247`** |
| **Text** | **`290247/10`** |
| General ledger | **`3000`** |
| Revenue group | `SS 304` / `1000` |
| Company | `12368` Mercainox |
| Internal Bundle | `404763` |
| Charge · Purchase order · Supplier · Internal charge · Receipt date | **all empty** |

### 🔴 The kilos moved and the money did not

The mutation carries running balances, before and after, in all three units:

```
kg    16 695,298  ->  16 730,623     +35,325   ✅ exactly the lot
qty          452  ->         453     +1
EUR   18 232,39   ->   18 232,39     +0,00     🔴 value did not move
```

**35,325 kg of prime, sellable 304L entered stock against account `3000` and
added nothing to its value.** Item 25 saw this on the lot; here it is in the
movement ledger, which is what any stock valuation report would read. The stock
quantity and the stock value are now out of step by one bundle, permanently,
until somebody revalues it by hand.

This is what makes **O9** urgent. It is not an accounting nicety about where a
revaluation posts — the reference is putting metal on the books at zero and
nothing catches it.

### 🔑 A mutation is better linked than the document it came from

Item 25 found that a return links to nothing — no sales order on the header, no
`Order line` on the line, no charge. But the **mutation** carries:

- `Order` = **`R290247`** — with the `R` prefix, which is where the `R2900xx`
  numbers in the invoice-line export come from
- `Text` = **`290247/10`** — order number **slash line number**
- `Workorder#` = **`327396`**

So the audit trail exists one level down. Our `stock_movements` should carry the
same three, and a return's movement must name its return order and line.

### Running balances are stored, not computed

`Starting stock` and `Closing stock` are held **on the mutation row** in €, kg
and pieces. So the reference keeps a running per-product balance and stamps it
into every movement. That is worth copying: it makes any historical stock
position readable without replaying the whole ledger — and it is how a
stock-value report can be produced for a past date.

### 🔴 `Correction…` changes a lot silently — no mutation, either way

Run **twice** on lot `404763`, and `Stock mutations` read after each with the
date set to `29-9-2026` on both sides and **no search filter** — so every
mutation in the system that day was in view.

| | What was set | Did it apply? | Mutation written? |
|---|---|---|---|
| 1st | reason `Stock correction`, description typed, **nothing else changed** | n/a | **No** |
| 2nd | reason `Stock correction`, **`Categorie` `Standaard` → `2nd choice`** | ✅ **Yes** — `Stock on location` now reads `2nd choice` on bundle `404763` | **No** |

`OK` came alive both times and was pressed both times. **One mutation row exists
for the whole of 29-9-2026, and it is the return's receipt.**

🔴 **So a prime bundle was downgraded to 2nd choice and the movement ledger
shows nothing** — not who did it, not when, not what it was before. The change
is real and it is invisible.

That matters because the category is not cosmetic. It decides what the metal can
be sold as, it is the basis of the 2nd-choice split in the stock analysis
(487,4 t of 1 601,8 t), and item 22 showed the order-line picker offers both
choices together unless somebody filters. A silent downgrade moves tonnage
between those buckets with no record.

**Change:** our correction action **must** write a `stock_movements` row for an
attribute change — category, quality, thickness — carrying the old value, the
new value, the reason and the operator. The reference does not, and that is a
gap to close rather than a behaviour to copy.

### What the mutation ledger actually records

Putting the two together: the ledger records **quantity and value movement**,
nothing else. A receipt of 35,325 kg wrote a row. A downgrade of the same lot
wrote none. So `Stock mutations` cannot be used to reconstruct what a lot *was*
— only how much of it there has been.

⚠️ **Still unread:** whether a correction that changes the *quantity* writes a
mutation, and whether its value column can move. Both remain open, and the
second is the one that matters — a correction is the only warehouse movement
that could carry a revaluation. If it cannot, nothing in the warehouse can
repair a € 0 lot and **O9 is the only route left**.

### The state lot `404763` is now in

Worth writing down, because it is a compact illustration of everything above:

**35,325 kg of `2nd choice` 304L, at `Ontvangst`, valued at € 0,00, with no
charge, no supplier, no purchase order, no receipt date, unblocked and
available to sell** — and an audit trail that shows only that it arrived.

---

## 🔴 27. Eleven panels below `Basis` — the product record, read to the bottom — 2-10-2026

Product `PK44115025125` opened to settle **O11**. It closed **O10** as well and
produced six changes nobody had queued. Full capture in
[product-detail.md](product-detail.md).

### 27a. 🔴 A report has a tolerance, and nothing checks it

`Warehouse control → Tolerances when reporting as completed`, **per product**:

| Workorder type | Qty | Kg |
|---|---|---|
| Unloading wo | 5 % | 5 % |
| Count workorder | **0 %** | **0 %** |
| Picking workorder | 5 % | 5 % |
| Production workorder | — | **0 %** |

Our `reportCompletion` accepts whatever is typed. The reference refuses a report
outside the product's tolerance, and the four rows are three different rules:

- **Production must balance exactly.** This settles **G9** and the kilo-balance
  half of **H10** without running a saw cut.
- **A count must be exact**, which is what makes it a count.
- **Picking and unloading may be 5 % out**, which is the slack that absorbs the
  trade/theoretical density gap of 1,911 %.

**Change:**

- `db/schema/products.ts` — four tolerance pairs, one `decimal(5,2)` per cell.
- `warehouse-work-orders/actions.ts` and the production equivalent —
  `reportCompletion` compares reported against planned and refuses outside
  tolerance, naming the product's own percentage in the message.
- ⚠️ Default to the reference's values for a product that carries none, not to
  0 %. A zero default would reject every honest picking.

### 27b. 🔴 `Approve` is never pressed because approval is automatic

```
Always approve manually:
  Warehouse workorder line   ☐
  Production workorder line  ☐
```

Both off. **Reporting a line approves it** unless the product opts in. The state
machine we built is right and the "missing" button was never missing — but the
flag is real and belongs on the product.

**Change:** `db/schema/products.ts` — `always_approve_warehouse_line` and
`always_approve_production_line`, both defaulting false. The report actions
already self-approve; they must stop when the flag is on.

### 27c. 🔴 The lot picker has a dispatch strategy, and it is LIFO

`Stock control → Dispatch strategy: LIFO`, per product.

`getPickableLotsForLine` sorts the line's own location first and says nothing
about age. That is a sensible tiebreak, not the rule. The rule is on the
product, and on this one the **newest** bundle goes first.

**Change:**

- `lib/enums.ts` — a `dispatchStrategies` const array. ⚠️ Only `LIFO` is
  evidenced; the dropdown was not opened, so the list is incomplete.
- `db/schema/products.ts` — `dispatch_strategy`, storing what the import finds
  rather than defaulting until a second product confirms a default.
- `getPickableLotsForLine` — order by the product's strategy first, then by the
  line's location.

### 27d. APP is maintained at receipt, with a history

`Valuation` prints `APP = € 1.587,63` per TN; `History APP` keeps a dated row per
change, each referenced **`Inslag inkooporder <PO>`** — one per goods receipt —
ending at the `31-12-9999` sentinel.

> Ours recomputes an average from purchase invoices on read. Theirs is **stamped
> when the metal lands**. A lot's `valuation_price` is therefore the APP *as it
> stood that day*, which is why two bundles under one internal charge hold
> € 1 537,61789 and € 1 345,19975 — and why recomputing from today's invoices
> cannot reproduce a historic lot.

**Change:**

- A `ProductValuationHistory` table — product, `valid_from`, `valid_to`, `app`
  `decimal(15,5)`, reason, purchase order. Written by the receipt action, never
  recomputed.
- The receipt action stamps the new APP onto the lot rather than reading an
  average later.
- ⚠️ `decimal(15,5)` is now confirmed three ways — the `€ 0,00000` input mask,
  the `107,20071` history rows and the `1 537,61789` lot export. The widening
  already queued for `pnpm db:push` is right.
- ⚠️ Five history rows dated 4-2-2025 read `107,20071`–`108,36518`, two orders
  of magnitude below everything else on the product and inside the frozen
  migration window. **An importer must not trust them.**

### 27e. There are three minimum margins, not one

`Sales → Minimum profit margins`: **Stock 7,00 % · Ex works 7,00 % ·
Cross Docking 7,00 %**. Item 16 recorded one margin per product. It is one per
**delivery mode**.

**Change:** item 16's single column becomes three, and the margin check picks the
one matching the order's delivery mode.

### 27f. Automatic reservation is a product flag

`Sales → Always reserve stock ☑`. We treated auto-reservation as system
behaviour; it is per product — which is also why 12 of this product's 14 lots
are fully reserved and the only two that are not carry a `Slechte…` (*bad*)
remark.

**Change:** `db/schema/products.ts` — `always_reserve_stock`, and the order-line
action reserves only when it is set.

### 27g. Order advice is min/max, and StockOp is dead

```
Min. stock: 1 times the avg. monthly consumption
Max. stock: 3 times the avg. monthly consumption

Use StockOp for this product?  ☐
StockOp parameters zijn nog nooit berekend.
```

Every StockOp field — lead time, review period, order costs A1/A2, capital cost,
warehouse cost, stock-out percentages, handling, transport — is greyed and zero,
and the panel says outright that the parameters have never been calculated.

> **The advanced replenishment engine was bought and never switched on.** We do
> not need to build it. Order advice is the min/max multiple, generated
> Monday–Friday.

This narrows the order-advice work rather than widening it.

### Smaller things worth copying

- **`Preferred location(s)`** — one row: preference 1, location `Ontvangst`,
  type `Pick`. That is where an unloading puts goods when nobody says otherwise.
  The `RestockLevel`/`RestockLocation`/`RestockQty` trio belongs to the greyed
  `Restocking…` button — the feature is off.
- **`Count settings`** — frequency 1, counted against **technical** stock below
  **1.000 KG**, with a `Count now` button. Counting is the 0 %-tolerance flow.
- **`Scrap product: SC430`** — a *different product code*, so scrapping converts
  between products instead of reducing a quantity.
- **`Charge` ☑ greyed** — a fourth confirmation that a charge is mandatory; it
  cannot be switched off even here.
- **Bought and sold in `ST`, priced in `TN`** on both the purchase and sales
  panels. Movement unit and pricing unit are separate fields, and we have
  conflated them in places.
- **`Suggest last used charge in scanner`** — there is a barcode scanner client
  against this system that we have never seen.
- **`Optimization criteria`** — the saw nesting cost function, with a preferred
  minimum offcut of **1000 mm** and weights for bundles, cuts, offcuts, scrap
  pieces and short offcuts, plus `Allow the longest possible offcuts to be
  create ☑`. Not needed to report a cut, but it is the whole of H10's optimiser
  if we ever plan one.

### 27h. H9 is visible without running it

The `Purchase orders` panel lists sixteen lines of `Purchase type: Processing`
to supplier **`Hego Production`** at **€ 0,00**, against one `Materials` line
from APERAM at € 1 505,00/TN. `IO404206` is open right now.

> **External processing is a purchase order of type `Processing`, priced at
> zero.** The material keeps its value; the purchase order is the vehicle for
> the round trip, not a cost.

The same panel disambiguates the quantity columns: on an open order
`Qty(r) 24 / Qty(a) 0`, on an invoiced one `Qty(r) 0 / Qty(a) 6` — so **`Qty(r)`
is what is still to come** and **`Qty(a)` is what arrived**.

It also carries `Kwaliteit` and `Voorraadcategorie` **per purchase line**:
quality and stock category are chosen when buying, not derived from the product.

### 27i. A movement names its own origin

`Stock mutations` carries `Supplier` and `Purchase order` **on outbound delivery
rows** — a 14-8-2026 delivery to Bergen Stainless reads `Supplier: Swedinox`,
`Purchase order: IO403283`. Full origin traceability denormalised onto the
movement, so "where did this plate come from" is one row, not a walk.

**Change:** `db/schema/stock-movements.ts` — carry the lot's origin supplier and
purchase order onto every movement, copied from the lot at write time. ⚠️ Copy,
do not join: the point is that the answer survives the lot being consumed.

---

## 🔴 28. `Correct products and stock` is not what we assumed — 2-10-2026

The dialog behind the Product master's toolbar button is titled
**`Corrigeren lengte artikel en voorraad`** — *correct the **length** of an
article and its stock*.

```
Artikel:  PK44115025125                          […]
Reden:    ‹dropdown›

☐ Kenmerken aanpassen            (adjust characteristics)
    Huidige lengte      → Nieuwe lengte
    Huidige overlengte  → Nieuwe overlengte

☐ Voorraadbesturing aanpassen    (adjust stock control)
    Huidige vrd eh: ST  → Nieuwe vrd eh: ‹KG · M1 · M2 · ST›

      [Simuleer]   [OK]   [Annuleren]
      ┌──────────────────────────────┐
      │  (empty output pane)         │
      └──────────────────────────────┘
```

> ⚠️ **It does not change a quantity.** It changes a product's **length** and
> **over-length**, or its **stock unit**, and rewrites every lot to match. The
> per-lot `Correction…` on the `Stock` panel is the quantity tool, and flow
> **H3 still needs that one** — this button is a different animal.

Three things to copy.

### 28a. 🔴 The correction reason enum, in full

The `Reden` dropdown, pooled across both scroll positions — **eight values**:

| Value | |
|---|---|
| `Rejected material` | |
| `Inventory rejection` | |
| `Stock difference` | |
| `Stock correction` | |
| `Transfer length` | |
| `Internal damage` | |
| `Scrap` | |
| `Opmerking voorraad toevoegen/aanpassen` | *add/adjust a stock remark* — the only Dutch one left |

**Change:** `lib/enums.ts` — `stockCorrectionReasons`, and `lib/labels.ts` for
the English of the last one. The `correction_reason` column already queued for
`pnpm db:push` becomes a `mysqlEnum` over these rather than free text.

That last value is worth noticing: **adding a remark to a lot is itself a
correction reason**, which is consistent with item 26 — a downgrade wrote a
remark and no mutation.

### 28b. 🔴 `Simuleer` — a dry run before a mass change

The button beside `OK`, with an output pane under it. Nothing in our application
does this, and this dialog rewrites every lot of a product at once.

**Change:** any action that touches more than one lot gets a simulate path that
returns the rows it *would* write without a transaction. Start with this one and
with the `Stock` panel's `Correction…`.

### 28c. Stock unit is per product and changeable

`Eenheid`: **`KG` · `M1` · `M2` · `ST`**. Four units, and a product's unit can be
migrated after the fact — which is why `Voorraadbesturing aanpassen` exists at
all.

`Overlengte` (*over-length*) is a product attribute we do not have: a nominal
length plus an agreed overshoot.

## 🔴 The `Stock` search dialog — the lot finder the whole system uses

The `…` beside `Artikel` opens a dialog we have seen the output of many times
and never the input.

**Filters:** `Product code` · `Search code` · `Company` (greyed) ·
`Product group` · `Quality` · `Processes`, plus `Length` / `Width` / `Thickness`
as **From – Until and incl.** ranges with **`Search with margin` ☑ 5 %** on each,
`Only products with available stock` ☑, and `1e keus` ☐ / `2e keus` ☐.

> **Dimensional search is fuzzy by default — ±5 % on each of three dimensions.**
> That is how the floor finds a plate that is *close enough*, and our product
> search is exact-match only.

**Upper grid — one row per (product, quality, stock category):**

`Product` · `Quality` · `Stk. cat.` · `Options` · `Length` · `Width` ·
`Thickness` · `Technical` · `Reserved` · `Available` · `Kg (t.)` · `Kg (r.)` ·
`Kg (a.)` · **`Total len.`** · **`C. Kg`** · **`C. ST`**

Five rows for this one product code, split by quality and choice:

| Quality | Stk. cat. | Tech | Res | Avail | Kg (t.) | Total len. |
|---|---|---|---|---|---|---|
| `4412D` | 2nd ch. | 1 | 0 | 1 | 35 | 2,5 |
| `441` | | 33 | 29 | 4 | 1.214 | 82,5 |
| `4412B` | | 150 | 150 | 0 | 5.520 | 375 |
| `4412B` | 2nd ch. | 27 | 27 | 0 | 994 | 67,5 |
| `441BA` | 2nd ch. | 300 | 300 | 0 | 11.039 | 750 |

`Total len.` is quantity × length in metres — 33 × 2,5 = 82,5 ✓, 300 × 2,5 =
750 ✓. The filter chip reads **`TotalPhysicalStock ≠ 0`** with an `Edit Filter`
button, so the grid is a saved filter the user can change.

**Lower grid — the lots, under three tabs:**

```
Stock  |  Purchase  |  Internal production
```

> **Three sources, one picker.** A line can be satisfied from stock, from an
> incoming **purchase**, or from **internal production**. We offer stock only.

Its columns: `Order qty.` · `Length` · `Width` · `Thick…` · `Technical` ·
`Reserved` · `Available` · **`Unopened`** ☑ · `Kg (avail.)` · `Options` ·
`Remarks` · `Quality` · **`APP`** · **`Purchas…`** · `Interne …` · `Stk. cat.`,
and a footer carrying `Charge` · `Internal charge` · `Location` · `Purchase`.

The single row, which is the lot already familiar from item 26:

```
0 | 2500 | 1250 | 1,44 | 1 ST | 0 | 1 ST | ☑ | 35 | | Slechte 2e keus! |
4412D | 950 / TN | 1679 / TN | 365542 | 2nd choice

Charge 68107 1 · Internal charge 21FFEC · Location 4A3
Purchase 12-1-2024 / IO100020 / Outokumpu Stainles Oy
```

### 🔑 A lot carries its own thickness, and the weight follows the lot

The product is **1,50 mm**. This lot is **1,44 mm**.

```
2,5 × 1,25 × 0,00144 × 7 850 = 35,325 kg
```

which is exactly the `Kg (avail.)` shown, and exactly the 35,325 kg recorded in
item 26.

> **Weight is not `product dimensions × density`. It is `lot dimensions ×
> density`.** A rolled plate comes in under nominal, the lot records what it
> actually measures, and every kilo downstream follows the lot.

This corrects the formula as written in
[product-detail.md](product-detail.md) — that derivation is right for a
*planned* quantity and wrong for a *held* one.

**Change:** `db/schema/stock.ts` already carries length/width/thickness. Every
weight computed from a lot must read the lot's dimensions, never the product's.
Audit: `getPickableLotsForLine`, the report-completion `Kg(a)` fill, and the
stock overviews.

### 🔴 `APP 950 / TN` beside `Purchase 1679 / TN`

Two prices on one lot, and they disagree by 43 %. The lot is flagged
`Slechte 2e keus!` (*bad second choice*) and was bought from Outokumpu on
12-1-2024 at 1 679/TN.

So a lot's carried value **can be written down below what was paid for it**, and
the screen shows both numbers side by side rather than replacing one with the
other.

⚠️ This is **O9's gap made visible on a lot** — the difference between what was
paid and what the lot is now carried at. It does not say where the difference
was posted, so O9 stays open, but it confirms the gap is real, routine, and
displayed rather than hidden.

### `Unopened` — a lot flag we do not have

A ticked checkbox on the lot. An unopened bundle is worth more to a customer
than a broken one, and it is the natural companion to the bundle/parcel model.

**Change:** `db/schema/stock.ts` — `unopened` boolean. ⚠️ It must be cleared the
first time a partial quantity is picked off the lot.

---

## 🔴 29. Purchase order `401141` — the wrong document, and an EDI channel nobody knew about — 2-10-2026

### ⚠️ First, this is not the document H1 was watched on

`Purchase orders and quotes`, creation date 1-1-2024 → 2-10-2026, `Find 401141`
returns **exactly one row**:

| Creation | Time frame | Order | Purchaser | Status | Lines | Weight | Revenue | Supplier |
|---|---|---|---|---|---|---|---|---|
| 30-5-2025 | 11:00 - 11:30 | `IO401141` | Marco Borsboom | Invoiced | **1** | **4 340 kg** | € 8 246,00 | **Terninox S.p.A.** |

Its single receipt is **one coil** — `Coil Cold-rolled 3…`, length `999999`,
width 1522, 1,5 mm, **1 ST, 4 340 kg**. One line, one reception, nothing to
split.

The H1 order is described consistently across three of our files as 100 pieces
of `PK304L300315` at € 2 000/TN from **Holland Stainless Int**, created
**6-8-2026**, received 21-9-2026 under internal charge `26ADRC` as lots
`389823`–`389827` — and [order-to-delivery.md](order-to-delivery.md) quotes the
lot picker printing `IO401141` against charge `TEST-H1`. So our notes agree with
each other; it is this grid that disagrees with them.

**Two explanations, and the screenshot cannot separate them:**

1. **The grid is scoped or stale.** It was opened from the `Stock on location`
   tab, which is still beside it, and `Show Data` sits unpressed in the corner.
   An overview inheriting the previous tab's product would show only the orders
   for that product — and would legitimately hide a `PK304L300315` order.
2. **The H1 test order is gone**, which would be unremarkable for a deliberately
   created test document with a charge literally typed `TEST-H1`.

> **Either way, O4 could not have been answered from this screen** — a
> one-piece coil has no bundle split. ⚠️ Do not rewrite the `401141`
> references in our docs on the strength of this grid; confirm first.

**How to find it without guessing a number:** `Overviews → Stock →
Stock on location`, search internal charge **`26ADRC`**, select any of the five
lots, then `Show purchase order`. That lands on the right document whatever it
is numbered.

### 29a. 🔴 A receipt has four EDI columns

Scrolled right, the `Receipts` grid ends with:

```
Sheet number | EDI Charge | EDI Bundels | EDI Vrachtbrief | EDI Leverdatum
             |            |             |                 |  1-1-0001
```

and the order header carries **`Message sent via StaalWeb` ☐** beside `Printed`,
`Mailed` and `Faxed`.

> 🔑 **There is an EDI channel into goods receipt, and one of its columns is
> literally `EDI Bundels` — "EDI bundles".**
>
> That is the best available answer to **what pre-computes a bundle split**: the
> mill sends its charge, its **bundle breakdown**, its bill of lading and its
> delivery date electronically, and the unloading dialog offers them. Nobody
> computed 20/25/20/25/10 — the supplier did.

⚠️ **This is a hypothesis with a named column behind it, not a proof.** It is
blank on this order, which was placed by `Order method: Telephone`. The check
that settles it: find an order whose `Order method` is EDI/StaalWeb and read
whether `EDI Bundels` is populated and whether its receipt split matches.

**Change (once confirmed):** `db/schema/purchase-order-receipts.ts` — the four
`edi_*` columns are kept **beside** the entered values, not merged into them.
The point of the pair is that you can see what the supplier claimed against what
was actually counted.

`EDI Leverdatum = 1-1-0001` is the null-date sentinel this system uses — year 1,
not NULL. An importer must map it to NULL.

### 29b. Delivery date is a date **or** a week

```
● Date:  9-6-2025     Rem: ___
○ Week:  24           Year: 2025
```

A radio pair, not two fields. **Steel is bought "week 24"**, and the order stores
which form was used.

**Change:** `db/schema/purchase-orders.ts` — `delivery_week` / `delivery_year`
beside `delivery_date`, plus the discriminator. ⚠️ Do not resolve a week into a
date on the way in: the whole point is that the supplier has not committed to a
day.

### 29c. The header, field by field

| Field | Value |
|---|---|
| Title | `Purchase order 401141, Terninox S.p.A., Tel: +390744490861, Fax: -` **`Invoiced, Printed, Mailed`** |
| `Creation date` | 30-5-2025 |
| `Supplier` | `13249` Terninox S.p.A. |
| `Agent` | -empty- |
| `Contact` | `Giorgio Frontini` |
| `Purchaser` | `Marco Borsboom` |
| `Order category` | -empty- |
| `Reference` | blank |
| `Purchase order type` | **`Materials`** + a second, unlabelled -empty- dropdown |
| **`Overlength`** | ☑ greyed |
| `Printed` / `Mailed` | ☑ ☑ **in red** |
| `Faxed` · `Message sent via StaalWeb` · `Do not print prices` | ☐ ☐ ☐ |
| `Payment terms` | `Within 8 days from date of invoice` |
| `Delivery terms` | `(CIP) Carriage and insurance paid to` |
| `Delivery address` | `Bolderweg 10, 1332AT, Almere` |
| `Arrange transport` · `Pick up/Drop-off CD-purchases` | ☐ ☐ |

Three things to copy:

- **The status line is three flags, not one state** — `Invoiced` is the status,
  `Printed` and `Mailed` are dispatch facts, and they print together in the
  title. `Faxed` and `StaalWeb` are the other two channels.
- **`Overlength` is on the purchase order**, a second sighting today after
  `overlengte` on the correction dialog. A nominal length plus an agreed
  overshoot, agreed when buying.
- **`Delivery terms` is an Incoterm** — `(CIP)` is spelled out in the label, so
  the enum carries both code and text.

### 29d. The summary is three buckets

```
                    Revenue
Materials:        € 8.246,00
Options:          €     0,00   [ ]
Surcharges:       €     0,00
-----------------------------
Tot. excl. VAT:   € 8.246,00
VAT:              €     0,00
Tot. incl. VAT:   € 8.246,00
Total weight:         4340 Kg
```

**Materials / Options / Surcharges** are separate subtotals, which matches
options being purchased as their own lines
([purchase-lines.md](purchase/purchase-lines.md)). `VAT € 0,00` on an Italian
supplier is the intra-EU reverse charge, so **a zero VAT line is correct and must
not be treated as missing data**.

### 29e. Toolbars, named

**`Lines`** (`1 line`):

```
New · Delete · Sawing specifications · ⬦ · ⬦ · ⬦ · Calculate · Pre-notify
```

> **`Sawing specifications` sits on a purchase line.** Cuts can be specified at
> buying time, not only on a production work order — which is a route into H10
> we had not considered.

`Pre-notify` is here as well as on the order toolbar, so pre-notification is a
**per-line** act.

**`Receipts`** (`1 reception`):

```
New · Delete · Split · Batch registration · Charge aanpassen…
```

**`Split`** confirms a reception can be broken into bundles *after* it exists —
relevant to O4 whichever way the EDI question lands.

**`Workorders`** is a panel of three: `Warehouse workorders`,
`Production workorders`, `Transport workorders`, all collapsed here.

### 29f. The receipt row, in full

| | |
|---|---|
| `Status` | `Invoiced` |
| `Delivery date` | 10-6-2025 |
| `Delivery dat…` | ✅ `Pre-notifi…` |
| `Bill of lading` | **`401141`** — same as the order number |
| `Product` | `Coil Cold-rolled 3…` |
| `Length` / `Width` / `Dikte` | **999999** / 1522 / 1,5 |
| `Kg(p)` / `Qty(p)` / `U(p)` | 4340 / 1 / **`ST`** |
| `Kg(a)` / `Qty(a)` / `U(a)` | 4340 / 1 / **`Pieces`** |
| `Pre-announced deli…` | 9-6-2025 |
| `Pre-reported by` | **`MOK`** |
| `Charge` / `Internal charge` | `U0901221` / `25AECW` |
| `Sheet number` | blank |
| `Transfer address` / `Transfer q…` | blank / `0,` |

- **`Length 999999` is the coil sentinel.** A coil is one piece of indefinite
  length, and the weight is what is real about it. ⚠️ Any dimension-driven weight
  formula must skip a product whose length is this value.
- **`U(p)` reads `ST` and `U(a)` reads `Pieces`** on the same row — planned and
  actual units are rendered from different vocabularies. Ours must not assume one
  enum.
- **`Pre-reported by`** is a user stamp on the receipt, distinct from the
  purchaser.
- `Sheet number` is a receipt column we do not have — the mill's sheet
  identifier, blank for a coil.

### 29g. Overview columns worth having

Beyond the familiar: `Time frame` (**`11:00 - 11:30`** — the creation slot),
`Initials` (`MB`), `Converted fr…`, `Expiration reason`, `Quote date`,
`Internal Text`, `Consignment` ☐, **`Send` ☑ / `Must be sent` ☑**,
**`Order method: Telephone`**, `Deliberately …` ☐, `Valid u/i`,
**`Affiliate company det…: TEST HEGO Stainless …`**, `Classification…`,
`Classification`, `Reference`, `Onze referentie`.

- **`Order method`** is the enum the EDI question turns on — this one is
  `Telephone`.
- **`Send` / `Must be sent`** is a two-flag outbox: one says it should go, the
  other says it went.
- **`Affiliate company`** names the buying entity, so purchase orders are scoped
  per company and we have one tenant.

---

## 30. Why `IO400003` has no batches — and why H11 was the wrong ask — 2-10-2026

The capture came back empty: **no batch rows on that purchase order.** Two
reasons, both already on record and both missed when the step was written.

### 30a. `Batch registration` is a per-product opt-in, and it is off

From the product record read earlier today, `Stock control`:

```
☐ Batch registration
    ☐ Length   Minimum 0   Interval 0
    ☐ Width    Minimum 0   Interval 0
    ☑ Charge        Dispatch strategy LIFO
    ☐ Do not split stock per batch
    ☐ Plate number
    ☑ Batch number
```

**Unticked, with its sub-options greyed.** A product that has not opted in has no
batches at all, so `Batch registration` on its receipt has nothing to show. The
2 910 batches in [batch-registration.md](batch-registration.md) belong to the
products that *have* opted in.

**Change:** `db/schema/products.ts` — `batch_registration` boolean plus the
`length`/`width` minimum+interval pairs it gates, `plate_number` and
`do_not_split_stock_per_batch`. The receipt action creates batch rows **only**
when the flag is set.

### 30b. ⚠️ Nobody has ever linked a certificate

[batch-registration.md](batch-registration.md) §1 already concluded it, on the
whole population rather than a sample:

> On **all 2 540** received rows and **all 3 271** sent rows, `Document code`,
> `Filename`, `Document certificate`, `Sheet number`, `Requested certificate`
> and `Internal reference` are **empty**, and `Document sent on` is `0`.
> `Certificates to be linked` is empty.

**So H11 as written — "watch a certificate being linked to a batch" — asks for a
thing this business does not do.** The screens exist and the certificate half of
them has never been used. What *is* used, on every one of those rows, is the
**batch** half: which heat and which internal batch a sheet came from, and which
customer it went to.

> 🔑 **Replace H11.** The question worth answering is **how a batch gets
> registered**, not how a certificate gets attached. Route: `Overviews →
> Batch registration → Batches` (2 910 rows) → take a recent row → note its
> `Internal charge` → open that purchase order → `Receipts` →
> `Batch registration`. That lands on a product that has the flag on.

### 30c. The `Overviews` tree, confirmed complete

The navigation pane was captured open on `Purchase` and `Logistics`. Every item
in both groups is already captured and written up — `Production batches`,
`Sawing layouts`, `Freight flow (SFN)`, `Pick statistic` and
`Deviations in count lists` included, the first two
[genuinely empty](empty-screens.md). **No unseen screen in either group**, which
is worth knowing before another hunt starts.

The window's own toolbars, for the record: menus `Bestand · Beeld · Logistiek ·
Financiën · Batch Taken · Acties · Extra · Help`, and a row of saved work
queues — **`Afhalen` · `Hego Prod - Lossen` · `Hego Prod - Picken` · `Lossen` ·
`To Do Slijp+Knip` · `Alles`**. Those six are the floor's actual working views,
and we have no equivalent: our overviews open unfiltered.

---

## 🔴 31. The `Batches` register — and `Kg(a)` is measured on coil, computed on plate — 2-10-2026

`Overviews → Batch registration → Batches`, receipt date 1-1-2024 → 2-10-2026.
23 rows read in full across three horizontal positions.

**Columns:** `Purchase order` · `Supplier code` · `Supplier` · `Product code` ·
`Product` · `Length` · `Width` · `Qty(a)` · `Qty U` · `Kg(a)` · `Charge` ·
`Internal charge` · `Sheet number` · `Document code` · `Filename` ·
`Mand. ign. doc.` · `Receipt date` · `Thickness` · `Stock Category` ·
`Quality Code` · `Document certificate` · `Producer` · `Options`.

Toolbar: `Show Product` · `Show Company` · `Show Purchase order` ·
**`Show File`** · **`Open file location`** — the last two are the certificate
attachment path, live but pointing at nothing.

### 31a. 🔑 One column, two kinds of number

Every row's `Kg(a)` was checked against `length × width × thickness × 7 850 ×
quantity`. The result splits cleanly by product code:

| | Implied density | Spread |
|---|---|---|
| **`PK…` plate** (7 rows) | **7 844 – 7 860** | 0,20 % |
| **`CK…` coil, 0,8 mm** (6 rows) | 7 545 – 7 583 | 0,51 % |
| **`CK…` coil, 1,5 mm** (6 rows) | 7 650 – 7 704 | 0,71 % |

The plate rows reproduce the formula **exactly**:

| Product | Working | Screen |
|---|---|---|
| `PK316L200415` | 3,0 × 1,5 × 0,002 × 2 × 7 850 | **141,3** ✓ |
| `PK304L120415` | 3,2 × 1,0 × 0,0012 × 10 × 7 850 = 301,44 | **301,5** ✓ |
| `PK304L05021` | 2,0 × 1,0 × 0,0005 × 5 × 7 850 = 39,25 | **39,3** ✓ |
| `PK30405031` | 3,0 × 1,0 × 0,0005 × 20 × 7 850 | **235,5** ✓ |

Their whole 0,20 % spread is the rounding to one decimal — which is exactly the
product record's `Number of decimal places weight: 1`.

The coil rows do not. Six rows of **one product, one charge, one internal charge,
one receipt date** imply six *different* densities spanning 0,51 %. A stored
density cannot vary within itself.

> **So `Kg(a)` is computed on plate and measured on coil**, in the same column.
> You can tell which by whether it lands on the formula.

And the shortfall is not noise — it is one-sided, 2–4 % under nominal:

```
CK441 nominal 0,8 mm  →  really 0,769 – 0,773 mm
CK441 nominal 1,5 mm  →  really 1,462 – 1,472 mm
```

which is the same band as the lot read on the `Stock` search dialog earlier
today: **1,44 mm against a nominal 1,50 — 96,0 %**.

**Cold-rolled coil runs under nominal thickness, and the batch records what it
really weighed.** Every one of these coil rows carries `Options: Decoilen` or
`Knippen` — they are coil that has been cut into sheets, and somebody weighed the
result.

**Change:**

- This is item 23's rule, proved a second way and on a different screen. ⚠️ It
  also means **a weight that matches the formula exactly is evidence that nobody
  weighed it** — useful when deciding whether to trust an imported figure.
- The 2–4 % shortfall sits inside the **5 %** unloading tolerance from §27a,
  which is presumably why it has never caused an argument.
- ⚠️ Do **not** "correct" a coil weight to the nominal computation on import.

### 31b. 🔴 `Options` is multi-valued per batch

```
Decoilen
Knippen
Knippen, Blauwe Folie
Borstelen, UV Folie
Slijpen, Blauwe Folie
```

**Two options on one batch, comma-separated.** We have treated the option enum as
a single value chosen per line. A batch carries a **set** — a cutting operation
plus a film, which is the natural pairing.

**Change:** the option link becomes a join table (batch ↔ option), not a column.
⚠️ Check the purchase-line side too: `Purchase lines` showed options as their own
lines, which may be the same set modelled differently.

This also adds `Blauwe Folie` (*blue film*) to the enum beside `UV Folie`, and
confirms `Borstelen`, `Slijpen`, `Knippen` and `Decoilen` all appear here in
Dutch.

### 31c. 🔴 `Mand. ign. doc.` is ticked on every row — and that contradicts E2

Every one of the 23 batches has **`Mand. ign. doc.` ☑**.

[batch-registration.md](batch-registration.md) §1 recorded the opposite on the
`Certificates received` export: *"`Mand. ign. doc.` is `False` everywhere"*, all
2 540 rows.

> **Mandatory-document-ignore is `True` on every batch and `False` on every
> received certificate.** Two screens, two populations, opposite values.

If the column means "ignore the requirement that this batch carry a document",
then it being `True` everywhere **explains why no certificate has ever been
attached**: the requirement is switched off, batch by batch, rather than being
forgotten. That is a materially different story from neglect, and it changes
whether we build the requirement at all.

⚠️ **Unresolved.** It needs one look at the column's meaning before anything is
built on it. Until then, record the flag and enforce nothing.

### 31d. The certificate columns are empty here too

`Sheet number`, `Document code`, `Filename`, `Document certificate` and
**`Producer`** are blank on all 23 rows — a fourth independent confirmation,
now on the `Batches` register itself, that the certificate half has never been
used. `Show File` and `Open file location` sit live in the toolbar with nothing
to open.

`Producer` is a column we do not have: the mill that made the metal, distinct
from the supplier that sold it. Blank everywhere, but the distinction is real and
cheap to carry.

### 31e. Smaller things, all load-bearing

- **A scrap batch is measured in kilos.** The first row: `Qty U` = **`KG`**,
  `Length` and `Width` **0**, `Qty(a)` 20, `Kg(a)` 20,0, `Stock Category` =
  **`Scrap`**. So `Qty U` is per batch and dimensions are optional — scrap has no
  shape, only weight. That is the other end of the product record's
  `Scrap product: SC430`.
- **One charge spans many batches**, confirmed again: `574651` carries 7 rows,
  `76365 4` carries 6. Charge formats seen: bare digits (`574651`, `57676`),
  digits + space + a sequence (`67193 3`, `64878 1`, `70764 5`, `76365 4`), and
  letter-prefixed (`E12911`, `E12879`, `SD52980`). ⚠️ Never parse a charge.
- **`76365 4` appears with two different receipt dates** — 11-03-2025 on five
  rows and 10-11-2025 on one — under one internal charge `23EFFC`. So an internal
  charge is not confined to a single receipt date.
- **The coil length sentinel again**: `CK304L0015` and `CK3040015` carry
  `Length 999999` with a real width (156, 105) and a real weight.
- ⚠️ **Purchase orders `100020`, `100021`, `100024` look like migration
  umbrellas.** `100020` alone holds 7 product codes and 7 internal charges with
  receipt dates from 31-01-2025 to 10-11-2025 — ten months on one purchase order.
  The `Stock` search dialog's footer showed `Purchase 12-1-2024 / IO100020 /
  Outokumpu Stainles Oy` for a lot received much later, and the `History APP`
  rows of that era read `Conversie`. **Do not treat these as real purchase
  orders**, and do not derive a lead time from them.
- The filter block is `Receipt date` + `Company code` + `Product code`, the last
  two defaulting to the `zzzzzzzzz` upper-bound sentinel.

---

## 🔴 32. Production work orders — a pair, a surface treatment, and a sales order — 2-10-2026

`Overviews → Logistics → Production workorders`, product `PK304L200415`
(4000 × 1500 × 2 mm, 304L), 1-1-2024 → 2-10-2026, `View: Standaard`.
**Eleven rows, the product's entire production history.**

**Columns:** `Workorder date` · `Status` · `Production workorder` · `Line` ·
`Order` · `Order line` · **`Machine`** · **`Extra options`** · `Product code` ·
`Product` · `Length (mm)` · `Width (mm)` · `Qty(p)` · `Qty(a)` · `Kg(p)` ·
`Kg(a)` · `Company` · **`Created by`** · **`Reported as completed`** ·
**`Previous warehouse workorder`**.

### 32a. 🔑 Every production work order is paired with a warehouse work order, N−1

| Production WO | `Previous warehouse workorder` |
|---|---|
| 303126 | **303125** |
| 307933 | **307932** |
| 316707 | **316706** |
| 324792 | **324791** |
| 326757 | **326756** |
| 326752 | **326751** |
| 327292 | **327291** |
| 327027 | **327026** |
| 327353 | **327352** |

**Nine for nine, exactly one less.**

> **A production job is raised as a pair.** A warehouse work order fetches the
> metal, and the production work order that processes it takes the very next
> number. Warehouse and production work orders share **one number sequence**, and
> the link is a stored column — `Previous warehouse workorder` — not something
> inferred.

**Change:**

- `db/schema/warehouse-work-orders.ts` / `production-work-orders.ts` — a stored
  `previous_warehouse_work_order_uuid` on the production side.
- The number series must be **shared**, not per-type. ⚠️ Check what we do today;
  two independent sequences cannot reproduce this.
- Raising a production job creates **both**, in that order, in one transaction.

### 32b. 🔴 These are not cuts — the dimensions never change

`Machine` is **`Slijpen/Foliën`** (*grinding / filming*) on all eleven rows, and
`Extra options` is **`Laser Foil`** on nine of them, blank on two.

**`Length 4000` and `Width 1500` are identical on plan and actual, every row.**
Nothing is cut; the plate is ground and filmed and comes out the same size.

> **Production here is surface treatment, not sawing.** Our production model
> assumed a cut that changes dimensions and produces a remnant. The jobs that
> actually exist change neither.

This lines up with three things already on record: `Sawing layouts` is
[genuinely empty](empty-screens.md), the product record's `Optimization criteria`
has never been exercised, and the `Purchase orders` panel showed **sixteen
`Processing` lines to `Hego Production` at € 0,00**.

> 🟡 **Hypothesis worth one check: the cutting is bought, not done.** In-house
> production is grinding and filming; sawing goes out to `Hego Production` on a
> zero-priced `Processing` purchase order and comes back. That would explain the
> empty sawing screens without anyone having switched a feature off.

⚠️ This filter was one product, so it cannot prove no machine saws. But **H10 as
written — "report a saw cut" — may have nothing to observe**, and should not be
scheduled again until the hypothesis above is checked.

### 32c. 🔴 Production is planned at **trade** weight, and the basis still follows the customer

One plate is `4,0 × 1,5 × 0,002` = 0,012 m³, so 94,20 kg at theoretical and
96,00 kg at trade. Ten of the eleven rows are **exactly 96,00 per piece**:

| Qty(p) | `Kg(p)` | Per piece | Density |
|---|---|---|---|
| 20 | 1 920,00 | 96,00 | **8 000** |
| 15 | 1 440,00 | 96,00 | **8 000** |
| 13 | 1 248,00 | 96,00 | **8 000** |
| 11 | 1 056,00 | 96,00 | **8 000** |
| 1 | 96,00 | 96,00 | **8 000** |
| **2** | **188,40** | **94,20** | **7 850** |

No scatter whatsoever — these are computed, not weighed. And the single
theoretical row is for a different customer (`RVS accuraat, Lemmer`) from the ten
trade rows (Groku Kampen, Betinoc, Holland Filter, Rovasta, Van Raak).

**That is the third independent confirmation today that the weight basis follows
the customer** — after the `Orders` panel and the work-order/stock gap in O11 —
and it is the first showing the basis propagating all the way into a *production*
work order.

**Change:** whatever carries the order's weight type must reach the production
work order too, not just the warehouse one.

### 32d. The kilo balance, on the one under-delivery

| | Qty(p) | Qty(a) | Kg(p) | Kg(a) |
|---|---|---|---|---|
| WO `324792` line 1 | 10 | **9** | 960,00 | **864,00** |

`960 × 9 ÷ 10 = 864,00` — exact.

So when less is produced than planned, **the kilos scale with the quantity and
nothing is lost**. That is consistent with §27a's `Production workorder Kg: 0 %`
tolerance, and it is what a 0 % balance means on a job that does not cut: in
equals out, piece for piece.

⚠️ It does **not** settle what happens to kilos on a job that *does* cut — the
remnant question G9 asks. That stays open, and §32b casts doubt on whether it can
be watched here at all.

### 32e. 🔴 `Reported as completed` can precede the work order date

| Production WO | `Workorder date` | `Reported as completed` |
|---|---|---|
| 327292 | **21-9-2026** | **18-09-2026** — 3 days earlier |
| 327027 | **23-9-2026** | **16-09-2026** — 7 days earlier |

> **`Workorder date` is a planned date, not a creation date.** The work was done
> early and the plan left where it was.

⚠️ **Do not validate `reportedAt >= workOrderDate`.** Two of eleven rows would
fail.

### 32f. Smaller things

- **Production is made to order, never to stock.** Every row carries an `Order`
  and an `Order line` — `101020/10`, `105157/10`, `108178/70`. That is why
  `Production workorder for stock` is **greyed** on the product master toolbar.
- **One production work order holds several lines**: `316707` lines 1 and 2,
  `324792` lines 1 and 2, and `327027` is line **5**. The pair in `324792`
  reported 10 and 9 against identical plans, so lines are reported
  independently.
- `Created by` names a person (`Benno Vos`, `Sharif Pasaribu`,
  `Richard van Sloo…`, `Vincent Groenew…`, `Arian Bloks`) — five operators.
- `Status` reads `Approved` on ten rows and `Released` on the one with
  `Qty(a) 0`, which matches the ladder we built.
- `Machine` and `Extra options` are two columns we do not have. `Machine` is the
  work centre; `Extra options` is an operation added to it, and `Laser Foil` is
  already in our options enum.

---

## ▶️ Built 3-10-2026 — sections 27–32, the logic half

Swedinox: *"build the server actions and pages all of it"*, with the remaining
sittings two days out.

**The first finding was that the schema was already there.** Tolerances,
`alwaysApproveManually*`, three minimum margins, `alwaysReserveStock`,
`batchDispatchStrategy`, every `batch*` flag, the count settings and the whole
sawing `opt*` block had been built from the 21-9-2026 product capture. Every one
of them appeared in exactly four places — the schema, the form's validation, its
mapper and its section component — **and nowhere else.**

> They were stored and displayed and they decided nothing, which is precisely
> what this repo's own rule about enums carrying behaviour exists to prevent.

So this was not a schema round. It was the logic round.

| | What changed |
|---|---|
| ✅ **27a** | `breachedTolerance` (`lib/server/tolerances.ts`), called by the warehouse and production report actions. The reference's four workorder-type rows map onto our four stock effects exactly, so the branch is the one the completion routine already made |
| ✅ **27a** | ⚠️ **We had the production row backwards.** Our form offered `Production Qty` and showed `—` for Kg; the reference is the other way round. `toleranceProductionKg` added, the form cells swapped |
| ✅ **27a** | Tolerance columns made **nullable**. `0` and blank had been collapsing into one value, and they are opposite rules — blank is *no rule*, zero is the strictest there is. A `0.00` default would have refused every honest picking |
| ✅ **27b** | Reporting stops at `ready` when the product ticks `Always approve manually`, plus `approveWarehouseWorkOrderLine` and an `Approve` button to get it the rest of the way. On every other product reporting still *is* approval — which is why the reference's button sits unpressed |
| ✅ **27c** | `getPickableLotsForLine` reads `batchDispatchStrategy`. It was hard-coded to newest-first, which is right for this product and wrong as a rule |
| ✅ **27f** | An order line reserves only when the product says to. ⚠️ Absent reads as *reserve*, and the column now defaults `true` — failing to hold metal that has been sold is the expensive direction |
| ✅ **27i** | `originSupplierUuid` / `originPurchaseOrderUuid` on a movement, stamped from the lot on the way out via `lotOrigin`. Copied, never joined: a lot drawn to zero is exactly when somebody asks where its steel came from |
| ✅ **31/28** | 🔑 **`lotPieceWeightKg`** — weight from the **lot's** dimensions, not the product's. `productPieceWeightKg` returns the stored per-piece figure before it ever looks at the dimensions it is handed, so a 1,44 mm lot was being weighed as 1,50. Now used by the receipt path and the order line |
| ✅ **29f** | `COIL_LENGTH_SENTINEL` (999999), so no dimension formula turns one coil into several thousand tonnes |
| ✅ **—** | `Stock.unopened`, cleared on every partial draw-down and on the part that travels. An intact bundle cannot become intact again |
| ✅ **32a** | `previousWarehouseWorkOrderUuid` on a production work order. The **shared counter already existed** and was already documented — `nextWorkOrderNumbers` reads the high-water mark across both tables — so only the stored link was missing |
| ✅ **32b** | `extraOption` on a production work order (`Laser Foil` beside `Slijpen/Foliën`) |
| ✅ **32e** | Audited: **no `reportedAt >= plannedDate` validation exists**, so nothing had to be removed. The column comments now say why one must never be added |
| ✅ **29a** | The four `edi_*` columns, `sheetNumber` and `producer` on a receival — kept **beside** the entered values, because the point of the pair is seeing what the supplier claimed against what was counted |

`tsc` and `eslint` clean across the lot.

### Already correct, checked rather than changed

- **The shared work-order counter** (§32a) — built, and its comment already gave
  the consecutive-block reasoning.
- **The production cut path** already refuses a run whose kilos do not balance,
  which is the 0 % rule arriving at the same answer from the other direction.
- **Rolled-vs-nominal thickness** was already modelled on the product
  (`theoreticalThickness`, proved against 1 932 lots). What was missing was only
  the *lot* level.
- **`deliveryWeek` / `deliveryYear`** (§29b) and `preReportedBy` /
  `preAnnouncedDeliveryDate` (§29f) already existed.

### Still queued, and why

- **27d** the `ProductValuationHistory` table — a new table and a change to how
  receipts value a lot. Bigger than the rest and worth its own pass.
- **27e** three margins exist and are read; **27g** is a decision not to build.
- **28b** `Simuleer` — needs a UI pattern, not just an action.
- **31b** `Options` as a join table rather than a column.
- ✅ **`pnpm db:push` RAN, 3-10-2026.** All 23 queued columns applied, every row
  count unchanged — `Stock` 549, `Products` 5 626, `Orders` 193,
  `PurchaseLineReceivals` 164. **Items 23, 25 and 26b are unblocked**, and
  `Stock.valuation_price` finally holds five decimals.

  ⚠️ **It took a near-miss, and the lesson is worth more than the push.**
  `drizzle-kit push --force` warned about exactly one statement — the
  `decimal(15,4) → decimal(15,5)` widening, which is harmless — and then ran:

  ```sql
  truncate table Stock;
  ```

  It failed only because of `fk_batches_stock`, a foreign key nobody wrote for
  that purpose. **drizzle-kit's MySQL push strategy for a column change it deems
  lossy is TRUNCATE-then-ALTER**, and `--force` means "run the destructive
  statements" — which are not the ones it printed.

  > **Never pass `--force` to this.** Without it, push refuses rather than
  > applying, and in a non-TTY shell it errors out, which is a safe failure.

  **What worked:** apply the lossy column by hand after checking the data cannot
  overflow — `ALTER TABLE Stock MODIFY COLUMN valuation_price DECIMAL(15,5) NOT
  NULL DEFAULT '0.00000'`, which kept all 549 rows (`1930.0000` → `1930.00000`)
  — then run `pnpm db:push` normally. With no lossy change left it printed
  `[✓] Changes applied` and added everything else without a prompt.

  **Reading the aftermath:** `TRUNCATE` resets `AUTO_INCREMENT` to 1 in InnoDB,
  so an empty table sitting above 1 was emptied by `DELETE`s, not truncated.
  That is what proved `Batches` (ai=2), `StockMovements` (ai=51), `StockBatches`
  (ai=2) and `ReturnOrders` (ai=14) were never touched.
  `information_schema.TABLES.UPDATE_TIME` is NULL on this server and tells you
  nothing.
