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

- ⚠️ **`pnpm db:push` has not run.** Four schema changes wait on it —
  `kg_actual` on a purchase line, `correction_reason` / `attribute` /
  `value_before` / `value_after` on a movement, the `adjust` movement type, and
  `return_order_item_uuid` on a work order line. The Aiven host times out from
  the machine this was built on. **Nothing in items 23, 25 or 26b works until
  it is pushed from a machine that can reach the database.**
- **O9** still decides what a returned lot is worth in the general case, and
  **O8** still blocks the confirmation footer. Both need a person.
- **Item 12** stays parked on **O2** and the warehouse half of **O3**, which
  need a pick watched from the start.
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
| 🔴 | **12** picking allocation | Blocked on **O2** and the warehouse half of **O3** — the sales half of O3 closed 29-9-2026 (item 22) |
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
| 🟡 | **23** purchase bills weighed kilos | 29-9-2026 — `Amount = Kg(a) x price`, proved to the cent on PO `402532`. **Built:** `kg_actual` on the line, `billingWeightKg`, `rebillPurchaseLineOnWeighedKilos` after each receipt, and the purchase-lines read path no longer calls a pro-rata estimate "actual". ⚠️ **`pnpm db:push` has not run** — the column does not exist in the database yet |
| ✅ | **24** `Report completion` crashes | 29-9-2026 — `NullReferenceException` on a picking with no lots assigned, twice. **Built:** a pre-flight guard refuses an out/move report whose rows carry no lot, with a stated error instead of a crash. O2 and the warehouse half of O3 stay parked |
| 🟡 | **25** flow H12, a return end to end | 29-9-2026 — a return raises an **Unloading** work order with no purchase order, and the lot lands at **€ 0, prime, sellable, undated, no charge**. Six-value `Return reason` enum. No link to the original sale anywhere. **Built 30-9-2026:** the six reasons with labels and the complaint mapping; `returnOrderItemUuid` on a work order line so an unloading with **no purchase order** is bookable; `applyReturnReceipt`, which values the lot at what it cost to go out, persists the typed charge, sets `receiptDate` and names the sales line it came back off; and `receiveReturnOrder` no longer silently skips a line whose original lot is gone. ⚠️ `pnpm db:push` not run. **Still unwatched:** the credit note — `Invoice` came alive after `Make final` and was not pressed |
| 🔴 | **26** the return's stock mutation | 29-9-2026 — kg +35,325 and **value +€ 0,00** against account `3000`. Reason `Ontvangst Return customer`. The mutation carries `R290247` / `290247/10` / workorder `327396` and **stored running balances**, where the document itself links to nothing |
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
| **O2** | 🔴 **Lot `389825` lost 5 pieces when the picker named `389827`.** Totals conserve (100 pieces, 10 597,5 kg before and after) and a new `389827` row appeared at `Laad` with 5, while `389827` at `Ontvangst` kept its 10 and gained a reservation of 5 | Either the six-digit number is a reusable label rather than a lot identity, or the pick debited a different lot than it displayed. Item 12 depends on which. The mutations ledger cannot settle it (item 10) |
| **O3** | 🟡 **Narrowed 29-9-2026.** The *order-line* `Stock` picker was re-read against the stock screen on `PK316T05013` and **agrees** — `Available 0` on both, at group and lot level (item 22). The disagreement was seen on the *picking* `Report completion` `Charge` picker, which is a different dialog and is **still unread** | An availability rule cannot be written for the warehouse side while the two disagree. The sales side is now settled |
| **O4** | **What computed the 20/25/20/25/10 bundle split?** Offered pre-filled and accepted unchanged | Item 4 offers one row until this is known |
| **O5** | Was work order `306675` raised by the `Workorder` button, or automatically by `Confirm` / `Pre-notifiy`? | The only gap left in H1 |
| **O6** | After reporting, work order `306675` read `Qty(p) 10 / Kg(p) 1 060,2`, down from 100 / 10 598, with no child rows | Cosmetic — the stock is right either way — but unexplained |
| **O7** | The unloading dialog balanced its last bundle to the order's **rounded** `Kg(p)` (1 060,2) and stock stored the theoretical 1 059,75 | **Do not reproduce the dialog's arithmetic as if it were stored** |
| **O8** | **Is the factoring arrangement with Boozt24 current?** | Item 15. Ask before building anything that clears an open post |
| **O9** | 🔴 **Which two accounts take the revaluation?** A lot comes in valued at the product's APP (€ 2 058,8151) while € 2 000,00 was paid. That gap has to be posted and we do not know where | Item 3's lot side. We already derive an average purchase price, so the valuation itself is reachable — but valuing the lot correctly while leaving the difference unposted is worse than valuing it consistently. `control-stock-revaluation-fsp` is the screen that reports it |
| **O10** | Is the reference's **APP** the same average we compute? | Ours comes from purchase invoices, theirs is carried on the product and the lot. Same idea; nothing yet says the same number. **Read the product record's price blocks** — the `Basis` block was captured on 21-9-2026 and the ones below it were not |

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

**Blocked until answered:** item 12 needs O2 and O3. Item 18 cannot be built at
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
