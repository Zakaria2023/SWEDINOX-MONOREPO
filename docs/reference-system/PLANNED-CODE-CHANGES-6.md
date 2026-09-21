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
| **O3** | The picker showed `Available` as the full quantity on lots the stock screen showed at `Available 0` | An availability rule cannot be written while the two disagree |
| **O4** | **What computed the 20/25/20/25/10 bundle split?** Offered pre-filled and accepted unchanged | Item 4 offers one row until this is known |
| **O5** | Was work order `306675` raised by the `Workorder` button, or automatically by `Confirm` / `Pre-notifiy`? | The only gap left in H1 |
| **O6** | After reporting, work order `306675` read `Qty(p) 10 / Kg(p) 1 060,2`, down from 100 / 10 598, with no child rows | Cosmetic — the stock is right either way — but unexplained |
| **O7** | The unloading dialog balanced its last bundle to the order's **rounded** `Kg(p)` (1 060,2) and stock stored the theoretical 1 059,75 | **Do not reproduce the dialog's arithmetic as if it were stored** |
| **O8** | **Is the factoring arrangement with Boozt24 current?** | Item 15. Ask before building anything that clears an open post |

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
