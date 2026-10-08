# Planned code changes — from the 8-10-2026 capture day

**Nothing on this page is built yet.** Code changes are on hold by request; this
page is the list of what will change once they are allowed, each tied to the
capture that proves it. Items are added as each capture lands.

| # | Change | Proved by | State |
|---|---|---|---|
| C1 | A purchase line bought for a sales line is `CD` | `404299` | 📋 ready |
| C2 | Ordering a request directly carries its `For line` onto the sale | `404299` | 📋 ready |
| C3 | A CD sales line exists before its lot; the receipt gives it one and reserves it | `404299` + `O108183/10` | 📋 ready — touches the sales spine |
| C4 | Purchase quote lines keep the request's `For line` | follows from C1 | 📋 ready |
| C5 | `For line` column on the purchase order's Lines grid | `404299` screenshot | 📋 ready |
| C6 | A CD receipt is put on the loading location, not a rack | lot `404744` at `Laad` | 🟡 default to confirm |
| C7 | Purchase return lines appear on `Purchase lines`, negative, as `Delivered` | `Status: Delivered` group | 📋 ready |
| C8 | A processing purchase order lists the material we send out (`Supplies`) | `400066` | 📋 ready, valuation open |
| C9 | The processor's offcut comes back as a scrap line, and the kilos close | `400066` line 20 | 📋 ready |
| C10 | A processing order's value is its options, charged on the weight received | `400066` | 📋 ready |
| C11 | A CD sales line is costed at its purchase line's price | `O108183/10` | 📋 ready |
| C12 | `Ex works Processor`: book in metal where it lies, at the processor, without an unloading | `400143` | 📋 ready |
| C13 | A processed receipt carries the supplied lot's heat **and original purchase order** | `402401` | 📋 ready |
| — | ~~Item 1 of -7: a `CD` line must not create a lot~~ | `404299` | ❎ withdrawn |

---

## The capture — purchase order `404299`

Picked from the `Line type: CD` group of `Overviews → Purchase → Purchase
lines` (creation date from `1-1-2024`, view `-leeg-`).

| What | Read |
|---|---|
| Header | Outokumpu Stainless Oy `12651`, `Materials`, `Received · Printed · Mailed`, created 11-9-2026 |
| Delivery | `(CPT) Carriage paid to`, address **`Bolderweg 10, 1332AT, Almere`** (our yard) |
| Tickboxes | `Arrange transport` ☐ · **`Pick up/Drop-off CD-purchases` ☐** |
| Line 10 | `PK316L150315`, 2nd choice, `316L2B`, 3000 × 1500 × 1,5 mm, 41 ST, 2 172,5 kg, € 3 050,00/TN, **`For line` `O108183/10`**, `Received` |
| Warehouse work order | `327345`, **`Unloading`**, `Approved`, 41 ST / 2 184 kg planned and actual |
| Reception | `Kg(a)` 2 184, `Qty(a)` 41, pre-announced 21-9-2026, pre-reported by `RVS`, charge `91138`, internal charge `26AQVM` |
| Stock panel | lot **`404744`**, 41 ST, **`Kg Reserved` 2 172, `Available` 0 ST**, batch `T015431501` |

### The lot itself — `Stock on location`, product `PK316L150315`

The last of 18 rows, read across five screenshots (view `-leeg-`):

| Column | Lot `404744` | The other 17 lots of the product |
|---|---|---|
| `Stock (Stk.U.)` / `Reserved` | **41 / 41** | 0 reserved, apart from one lot at 6 / 6 |
| `Location` / `Location type` | **`Laad` / `Laad`** | racks `2A5`, `2B1`, `8A` … all type `Pick` |
| `Blocked` | ☐ | ☐ |
| `Stock (Kg)` | 2 172 | |
| `Stk-general ledger account` | **`3000 Stock`** | `3000 Stock` |
| `Valuation price` / `PriceU` | **€ 3 050,00 / TN**, the price on the purchase line | € 2 900,00 · 3 034,01 · 3 200,80 · 3 510,00 · 3 858,60 · 4 640,58 |
| `Stock (€)` | € 6 626,09 (= 3 050 × 2,1725 t) | |
| `Charge` / `Purchase order` / `Receipt date` | `91138` / `IO404299` / 21-9-2026 | |
| `Internal charge` / `Bundle` | `26AQVM` / `404744` | |
| `Available (StkU)` | **0** | |
| `Stock category` / `Created on` | 2nd choice / 21-09-2026 15:58:38 | |

Three things this settles beyond the reservation:

1. **The ledger is `3000 Stock`**, not `3170 Goods to be received`. The
   withdrawn -7 §1 guessed a CD parcel would bypass the stock account; it does
   not. Ours books a receipt to stock too, so **no change**.
2. **The lot is valued at the price paid** (€ 3 050,00/TN on the line), not at a
   carried product price. Ours values a receipt at the paid price
   (`applyReceipt`), so **no change**. ⚠️ H1.2 found lot `389823`–`389827`
   valued at a carried 2 058,8151 instead of the 2 000,00 paid, and here several
   older lots share € 3 034,01 across different purchase orders. So the likely
   rule is "a CD lot is valued at its own purchase price, a stock lot at the
   carried APP". That is a valuation question (finance, out of scope); recorded
   only.
3. **The lot sits on `Laad`, the loading location**, while every other lot of
   the product is on a `Pick` rack. That is the cross-dock: received and put
   straight onto the bay for the customer's lorry. See C6.

**What it means:** `CD` is not "the goods skip our warehouse". It is **bought
for a named sales line**. The goods come into the yard, are unloaded and
received like any stock, and arrive **already reserved** to the sales line they
were bought for. Our receipt chain writing a lot for every reception is right.

---

## C1 · The line type follows the `For line`, not the tickbox

**Now:** `purchaseSourceTypeFor` (`lib/helpers.ts`) makes a new purchase line
`cross_dock` only when the header's `Pick up/Drop-off CD-purchases` is ticked.
`404299` is `CD` with it unticked, so every line we raise for a sale comes out
`Stk`.

**Change:** the helper takes a second argument, *bought for a sales line*. A
line with a `For line` is `cross_dock` whatever the tickbox says. The tickbox
still defaults a line to `CD`. The buyer can still override it per line on the
order form.

**Files:** `lib/helpers.ts`; the three callers in `purchase-orders/actions.ts`,
`purchase-quotes/actions.ts` and `purchase-requests/actions.ts`.

**Also moves:** the margin floor and the budget column, which both split on the
line type (order-types.md, *a fourth value*).

## C2 · Request → order carries the `For line` onto the sale

**Now:** a purchase request line can name the sales line it covers
(`PurchaseRequestItems.forOrderItemUuid`). Ordering the request directly
(`convertPurchaseRequestToOrder`) creates the purchase line and drops the link.
Nothing anywhere writes `OrderItems.purchaseOrderItemUuid` (-7 §4).

**Change:** when the request line has a `For line`, set that sales line's
`purchaseOrderItemUuid` to the new purchase line, and make the purchase line
`CD` (C1).

**File:** `purchase-requests/actions.ts`.

## C3 · A receipt reserves the lot to the line it was bought for

### The sales side — `O108183`, captured 8-10-2026 17:28

| What | Read |
|---|---|
| Header | **UAB Metalinox** `12402`, `In progress · Printed · Mailed`, created **11-9-2026**, delivery planned 2-10-2026, seller Marco Borsboom |
| Order type | `Normal`, `Weighed`; `Pick-up` ☐; `(FCA) Free carrier` to Taikos ave. 106 K, Kaunas (LT) |
| Summary | revenue € 7 169,25, profit **€ 508,05 (7,1 %)**, 2 172,5 kg, avg kilo price € 3,30 |
| Line 10 | **`Type` `CD`** (a dropdown on the line) · delivery 2-10-2026 · `In progress` · `PK316L150315` 2nd choice `316L2B` · 41 ST · 3000 × 1500 × 1,5 · Kg(p) 2 172,5 · M1 123 · net € 3 300,00/TN · amount € 7 169,25 · **`Purchase price` € 3 050,00** · **`Costs` € 6 661,20** · profit 7,09 % / € 508,05 |

**The order of events.** The sales order and purchase order `404299` were
**both created on 11-9-2026**. The lot was created on **21-9-2026** at
15:58:38. So for ten days **the sales line existed with no lot behind it**,
held only by the purchase line raised `For line` it. When the goods came in,
the lot was born reserved to it: 41 of 41.

**The sales line's `Type` is `CD`.** It is the reference's `Line type` on the
sales side, a dropdown on the order line, matching the purchase line's `CD`.
(-7 §4 asked what the reference does to the sales line. It reads `CD`.
Whether the seller picks it or the purchase sets it cannot be told from a
finished order; ours lets the seller pick it already.)

✅ **Confirmed twice**: the order's `Stock` panel and `Stock on location` both
read lot `404744` as 41 reserved of 41.

**Now:** `applyReceipt` (`warehouse-work-orders/actions.ts`) creates the lot
**unreserved**. The reference reserved lot `404744` in full (41 of 41) to
`O108183/10` the moment it was received. H1.2 showed the same thing from the
other side: the report dialog pre-fills a `For order line` per bundle.

**Change:** after the lot is written, find the sales lines this purchase line
covers. Reserve the lot to them, up to its quantity, with a `Reservations` row
and `Stock.reservedQuantity`, in the same transaction.

✅ **Unblocked by `O108183`.** A CD sales line is real for days before any lot
exists, so our model has to allow it.

**Change, in three parts:**

1. **`OrderItems.stockUuid` becomes nullable.** It is null only while a `CD`
   line waits for its goods, and then `purchaseOrderItemUuid` must be set: a
   sales line is held either by a lot or by a purchase line, never by nothing.
   NOT NULL → NULL loses no data, so it is a plain `pnpm db:push`.
2. **Entering a CD line.** On the order form, a line typed `CD` is entered
   from the stock search dialog's **`catalogue`** source (the article, not a
   lot), reserves nothing, and is costed per C11. Raising the purchase line for
   it (from the request `For line`, C2, or directly) sets
   `purchaseOrderItemUuid`.
3. **The receipt closes the loop** (`applyReceipt`). After writing the lot,
   find the sales lines this purchase line covers that have no lot yet. Give
   each one the lot (`stockUuid`), write a `Reservations` row (`sale`,
   `definitive`, the line's quantity and kilos), and raise
   `Stock.reservedQuantity`, up to what arrived, all in the same transaction.
   Lot `404744`: 41 arrived, 41 reserved, 0 available.

**What else reads `OrderItems.stockUuid`, and must cope with null** (11 reads
across 8 files, found 8-10-2026): `orders/actions.ts`, `order-lines/actions.ts`,
`warehouse-work-orders/actions.ts` (picking), `charges/actions.ts`,
`complaints/actions.ts`, `return-orders/actions.ts`,
`purchase-return-orders/actions.ts`, `sending-certificates/actions.ts`.
Picking a CD line before its lot exists is refused with a message naming the
purchase line it waits on. The rest show the line without a lot.

## C11 · A CD sales line is costed at its purchase line

**Seen on `O108183/10`:** `Purchase price` **€ 3 050,00**, the net price on
`404299/10`. `Costs` **€ 6 661,20** = 3 050 × **2,184 t**, the weight
*unloaded* (work order `327345`, `Kg(a)` 2 184), not the 2 172,5 sold. Profit
€ 7 169,25 − € 6 661,20 = **€ 508,05 (7,09 %)**, to the cent. The `w.r.t.
Repl. price` column reads 100 %, so this product has no replacement price.

**Ours:** a sales line's cost comes from the lot it is cut from. A CD line has
no lot until receipt, and then the lot's valuation price (€ 3 050,00, the
price paid, see the lot table above) is the same figure.

**Change:** while a CD line has no lot, its cost price is its purchase line's
net price, so the order shows a margin from the moment it is entered. On
receipt, the line takes the lot and its cost stays the same. ⚠️ The reference
costs it on the **unloaded** kilos (2 184), not the sold kilos. Ours costs on
the sold weight. Recorded as a difference to decide, not a change: it moves
margin by 0,5 % on this line.

## C4 · Purchase quote lines keep the request's `For line`

**Now:** request → quotes → order loses the link at the quote step:
`PurchaseQuoteItems` has no `For line` column.

**Change:** add a nullable `for_order_item_uuid` to `PurchaseQuoteItems`. Copy
it from the request line when quotes are raised, and from the quote line when
the quote becomes an order (then C1 and C2 apply). A new nullable column is a
plain `pnpm db:push` with no hand-ALTER.

**Files:** `db/schema/purchase-quote-items.ts`, `purchase-requests/actions.ts`
(`convertPurchaseRequestToQuotes`), `purchase-quotes/actions.ts`.

## C5 · `For line` on the purchase order's Lines grid

**Now:** the reference's Lines grid reads `Code · For line · Delivery date ·
Status · Product …`, with `O108183/10` in `For line`. Ours has no such column.

**Change:** read the covering sales line (order number / line number) through
`OrderItems.purchaseOrderItemUuid`, and show it second, after `Code`.

**Files:** `purchase-orders/actions.ts` (the detail query),
`components/purchase-orders/purchase-order-detail.tsx`.

## C6 · A CD receipt lands on the loading location

**Now:** the unloading report puts the lot wherever the dialog's `To` says
(H1.2 saw it default to `Ontvangst`). Nothing treats a CD line differently.

**Seen:** lot `404744` is on `Laad` (type `Laad`, our `load`), staged for the
lorry, while the product's 17 other lots are on `Pick` racks.

**Change, once confirmed:** when the unloading line is a `CD` purchase line, the
report dialog's `To` defaults to the warehouse's loading location. The
warehouseman can still change it.

🟡 **Not yet proved as a default.** One lot cannot tell a default from a
warehouseman's choice. Settled by the next CD unloading we watch (item 1, step
10 of the capture list), by reading what `To` offers before it is touched.

## C7 · `Delivered` is a purchase-line status

**Seen 8-10-2026:** `Purchase lines`, creation date from `1-1-2024`, grouped on
`Status`, shows **nine** groups: `Checked` · **`Delivered`** · `Expired` ·
`In progress` · `Invoiced` · `Partially received` · `Provisional` · `Received` ·
`Released`. ANSWERED.md listed seven, without `Delivered` and `Expired`.

**Ours:** purchase lines share `orderLineStatuses` with sales lines. That list
has `expired` but not `delivered`. Its nearest word, `completed`, is the sales
side's "delivered, not invoiced".

**Likely meaning:** -7 §15 found that purchase *returns* end in `Delivered`, so
these are probably the return lines (`IR95xxxx`) on the same screen. ⚠️ Not
proven. One look settles it: expand `Status: Delivered` and read the order
numbers.

✅ **Confirmed 8-10-2026.** Expanding `Status: Delivered`: every row is
**negative** (`Qty(p)` −1 / −2 / −8 ST, `Kg(pur)` and `Kg(a)` −172 … −1 568),
mostly company `13684` (Albko Metallhandel, the supplier of return `IR950034`),
`Aluminium` group `1500`, € 5 090,00/TN. With such a row selected the toolbar's
`Show Purchase order` reads **`Show Purchase return`**. So these are
**purchase return lines**, shown on the same screen as purchase lines, signed
negative, in status `Delivered` (-7 §15).

**Ours:** `Purchase lines` reads `PurchaseOrderItems` only. Return lines live in
`PurchaseReturnOrderItems`, have no status of their own, and do not appear.

**Change:** `Purchase lines` unions in purchase return lines, quantities and
kilos negated, status taken from the return header (`delivered` is already in
`purchaseOrderStatuses`, so **no enum change**). The toolbar button becomes
`Show Purchase return` for those rows and opens `/purchase-return-orders/…`.

**File:** `purchase-lines/actions.ts`, and the overview's toolbar.

## H13 · `Split` — attempts

| Order | Reception | `Split` |
|---|---|---|
| `400066` (line in `Status: Released`) | `Kg(a)` **900**, `Qty(a)` 1, charge `70120 3`, internal charge `23EFFF`, pre-announced 31-1-2025, by `RVS` | greyed |

⏹ **Stopped chasing, 8-10-2026, by request.** Moved to
[MANAGER-QUESTIONS.md](MANAGER-QUESTIONS.md) question 11: a person who splits
receptions has to say when it is enabled and what it asks.

## C8 · `Supplies` — what we send to a processor (H9, first look)

**Seen 8-10-2026 on purchase order `400066`** (supplier `Hela…`), found while
looking for H13:

- **`Options`** panel: one row, `Decoilen`, Qty 1 ST, gross € 110,00 per TN,
  discount 0 %, amount € 99,00, reference factor 1, net € 110,00. The order
  buys a **processing step**, priced per tonne, not metal.
- **`Receipts`**: one reception, 900 kg / 1 piece back.
- 🔑 **`Supplies`** panel (`1 supply`), toolbar `New` · `Delete` (greyed) ·
  `Show purchase order` (greyed) · `Show product`. Columns `Blocked · Delivery
  date · Product · Length · Width · Thickness · Kg(p) · Options · Qty(p) · U ·
  Picked · Qty(a) · Kg(a) · Bill of lading · Sta…`. Row: ☐ · 14-1-2025 ·
  `Coil Cold-rolled 304 1,5 mm` · 999999 · 130 · 1,50 · **1 531** · — · 1 · ST ·
  1 · 1 · **1 134** · **`300070`** · `Del…`.

**What it means:** the out-leg of external processing is a **supply on the
processor's purchase order**: our coil, picked and shipped on a bill of lading
like a sale. The in-leg is the order's own reception. Length `999999` is the
coil sentinel. ⚠️ 1 134 kg went out and 900 kg came back. Is the 234 kg the
decoiling loss, or is part of it still to come? Open.

### `400066` in full — second batch of screenshots

| What | Read |
|---|---|
| Header | **Helaxa BVBA** `11604`, `Received · Printed`, created 8-1-2025, purchaser Marco Borsboom |
| `Purchase order type` | **`Processing`** |
| 🔑 `Sawing workorder with one delivery` | ☑ (greyed), and under it, as text: **`1 ST of CK3040015 Coil Cold-rolled 304 130 x 1,50 MM 741 M1 1531 KG`**, the material handed over |
| Delivery | `(FCA) Free carrier`, delivery address **our yard** (Bolderweg 10, Almere), **`Arrange transport` ☑**, `Pick up/Drop-off CD-purchases` ☐, supplier address **`GOSSELIN CONTAINER TERMINAL (G.C.T.)`, Belcrown…**, date 31-1-2025 |
| Summary | Materials **€ 0,00** · Options **€ 99,00** · Surcharges € 0,00 · total weight 1 134 kg |
| Lines (2) | line 10: `CK3040015` Coil cold-rolled 304 1,5 mm, `Standaard`, `3042B`, **999999 × 105 × 1,5**, 1 ST, **Kg(p) 900**, M1(p) 727,934, **net price € 0,00 / TN**, `Received`. Line 2 not yet seen |
| `Supplies`, scrolled right | `Bill of lading` 300070 · **`Status` `Delivered`** · `Code` `CK3040015` · **`Charge` `70120 3`** · **`Purchase order` `IO100020`** · `Receipt date` 18-12-2024 · `M1(p)` 741 · `M1(a)` 0 |
| Reception | charge **`70120 3`**, internal charge `23EFFF`, 900 kg / 1 piece |

What it settles:

1. **What marks a processing order** (H9's first question): `Purchase order
   type` = `Processing`. Its metal lines are priced at **€ 0,00**: the
   order pays only for the `Options` row (`Decoilen`, € 110/TN).
2. **The option is charged on what came back.** € 110,00/TN × 0,900 t =
   **€ 99,00**, the order's whole value. The 1 134 kg that went out is not
   the basis.
3. **The processed metal keeps its heat.** The coil supplied carries charge
   `70120 3` and purchase order `IO100020` (its original mill purchase,
   received 18-12-2024). The reception of the processed coil carries the same
   charge `70120 3`. This is the certificate chain through a processor. It is
   also -7 §16 (an offcut inherits its parent's identity) seen on the processing
   side.
4. **The out-leg is a delivery.** The supply was picked, shipped on bill of
   lading `300070` and reads `Delivered`, so it goes through the same transport
   chain as a sale. `Arrange transport` is ticked.
5. **Slitting, not just decoiling:** 130 mm went out and 105 mm came back.

### Line 20 — the third batch

| Code | Delivery date | Status | Product | Category | Quality | L × W × T | Qty(p) | U | Kg(p) | Net price | Amount | Kg(a) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 10 | 31-1-2025 | `Received` | `CK3040015` coil 304 1,5 mm | Standaard | `3042B` | 999999 × 105 × 1,5 | 1 | ST | 900 | € 0,00/TN | € 0,00 | **900** |
| 20 | 31-1-2025 | `Received` | **`SC304` Stainless steel scrap** | Standaard | `3042B` | 0 × 0 × 0 | 234 | **KG** | 234 | € 0,00/TN | € 0,00 | **234** |

**The kilos close exactly: 900 + 234 = 1 134**, the `Kg(a)` of the supply. The
25 mm strip cut off does not vanish as a loss. It comes back as a **second
purchase line on a scrap article**, counted in kilos, at € 0. Both lines are
`Received`, and the header's `Total weight` 1 134 kg is the sum.

The three work order panels were still collapsed in the last screenshot, so
which work orders the order raised (the picking of the supply, the unloading
of both lines) is still open.

**Ours:** nothing. A processing purchase order has lines and receptions only,
and the material sent out is not recorded against it.
(external-processing.md modelled the out-leg from movements alone.)

**Change (C8):**

1. **New table `PurchaseOrderSupplies`**, one row per lot handed to the
   processor: `purchase_order_uuid`, `stock_uuid` (the lot that goes out),
   `product_uuid`, planned and actual qty / kg / M1, `delivery_date`, `status`
   (`deliveryStatuses`), the outbound transport or warehouse work order line,
   and `blocked`. A new table, so a plain `pnpm db:push`.
2. **A `Supplies` panel on the purchase order**, shown when the type is
   `Processing`, with the reference's columns in its order (`Blocked · Delivery
   date · Product · Length · Width · Thickness · Kg(p) · Options · Qty(p) · U ·
   Picked · Qty(a) · Kg(a) · Bill of lading · Status · Code · Charge · Purchase
   order · Receipt date · M1(p) · M1(a)`). `New` opens the **stock search
   dialog** on source `stock`, since it picks a lot we hold. Never a dropdown.
3. **Sending it out is a delivery.** Making the order final raises the picking
   and transport for each supply. The issue writes the
   `external_processing_issue` movement the control list already reads, so
   `Control Stock increase ext. processing` gets its outbound leg from a real
   document instead of an inferred one.
4. **The header's `Sawing workorder with one delivery`** flag, and the summary
   line under it (`1 ST of CK3040015 … 741 M1 1531 KG`), built from the
   supplies.
5. **The received processed lot carries the supplied lot's `charge`** (heat):
   `70120 3` out, `70120 3` back. Ours must not ask for a new heat number on a
   processing receipt; it defaults from the supply.

✅ **The work orders, 8-10-2026** (`Warehouse workorders` panel of `400066`):

| Item | Work order | Line | Date | Type | Status | Product | Width | Qty | Kg(p) | Kg(a) |
|---|---|---|---|---|---|---|---|---|---|---|
| 10 | **`300253`** | 1 | 9-1-2025 | **`Picking`** | Approved | `CK3040015` | 130 | 1 ST | 1 134 | 1 134 |
| 10 | **`301583`** | 2 | 31-1-2025 | **`Unloading`** | Approved | `CK3040015` | 105 | 1 ST | 900 | 900 |
| 20 | `301583` | 5 | 31-1-2025 | `Unloading` | Approved | `SC304` | 0 | 234 KG | 234 | 234 |

So the out-leg is an ordinary **picking** work order against the supply, and
the in-leg is **one unloading work order with a line per purchase line**:
metal and scrap together. Both are approved like any other. Our warehouse work
order already has `picking` and `unloading`. What is missing is the purchase
order raising the picking for its supplies (C8 point 3). The `Transport
workorders` panel was not opened; the bill of lading `300070` on the supply
says one exists.

⚠️ One detail still open, not blocking: what the received lot is **valued** at. The export
says a processing round trip loses about a quarter of book value (median
0,759). That is valuation (finance), so it is recorded, not planned.

### `400142` — the Decomecc pair, captured 8-10-2026 17:35

Reached through company `DECOMECC` → `Purchase orders` panel (an `Expired`
order drops out of `Purchase lines`). That panel's grid also showed a
`Reference` column (`400142` = **`Coil 5 mm`**, `400196` = `loonwerk`) and
`Days in system` (632 for both `400142` and `400143`).

| What | Read |
|---|---|
| Header | Decomecc N.V. `11046`, **`Expired · Printed`**, created 14-1-2025, contact Elke Verheijen, purchaser Benno Vos, reference `Coil 5 mm` |
| `Purchase order type` | **`Processing`** |
| `Sawing workorder with one delivery` | ☑, text **`1 ST of CK304L0050 Coil Cold-rolled 304L 1500 x 5,00 MM 3 M1 177 KG`** |
| Delivery | **`(EXW) Ex works`**, delivery address **`Decomecc NV, Bilzerweg 8, B-3600, Genk`** (the processor's own), `Arrange transport` ☑, date 16-1-2026 |
| Summary | everything € 0,00, total weight **0 kg** |
| Lines (1) | 10 · 16-1-2026 · **`Expired`** · `PK304L500` Cold-rolled plate 304L 5 mm · 3000 × 1500 × 5 · **`Qty(p)` 0** · M1 0 · € 0,00/TN |
| Warehouse workorders | **empty** |
| Receipts (1) | `Kg(a)` 0 · `Qty(a)` 0 · pre-announced 16-1-2026 · charge `NVT` · **internal charge `25AATY`** |
| Supplies (1) | 10-2-2025 · `Coil Cold-rolled 304L 5 mm` · 999999 × 1500 × 5,00 · Kg(p) 177 · 1 ST · picked 1 · Qty(a) 1 · Kg(a) 177 · **bill of lading `INtern`** · **`Delivered`** · code `CK304L0050` · charge `NVT` · **purchase order `IO400143`** · receipt date 10-2-2025 · M1 3 / 3 |

`Show purchase order` on the `Supplies` toolbar is **live** here (greyed on
`400066`). It opens the order the supplied lot was bought on, `IO400143`.

**What it means, against what -7 §2 assumed:**

- -7 §2 read the one `EXW` purchase line (`400143/10`, € 0,05/TN, 177 kg) as
  *"our own plate coming back from a processor"*, the **return** leg.
- `400142` shows the coil bought on `400143` being **supplied to** Decomecc
  on a `Processing` order, to be cut into `PK304L500` plate. So `400143` is
  not the return: it **booked into our stock a 177 kg coil already lying at
  Decomecc**, at a nominal price. `400142` then sent that coil into
  processing. The bill of lading reads `INtern`: nothing travelled, because
  the coil was already there.
- The processing **never happened**: `Qty(p)` was set to 0, no work order, the
  reception still 0 kg, the order `Expired`. company-detail.md had already
  found its two journal postings reversed.
- The reception was pre-filled with internal charge **`25AATY`**, the same
  internal charge as the lot `400143` created. The processed output was
  going to keep the input's identity. This is the same as `400066`, where the
  heat number carried through.

So **`EXW` on a purchase line = metal that is already ours, or becomes ours, at
somebody else's works**, booked in where it lies. That fits the margin table's
`Ex works` and the budget's `FACTORY`.

### `400143` — confirmed, 8-10-2026 17:37

| What | Read |
|---|---|
| Header | Decomecc N.V., **`Received · Printed`**, created 14-1-2025, contact Sige Geerkens, purchaser Benno Vos |
| `Purchase order type` | **`Ex works Processor`** |
| 🔑 `Purchase reference` | **`IO400142`**, printed under `Order category` |
| Delivery | `(FCA) Free carrier`, delivery address **`Bilzerweg 8, B-3600, GENK`** (Decomecc), date 15-1-2025 |
| Summary | Materials **€ 0,01**, total weight 177 kg |
| Toolbar | **`Report completion…`** where a normal order has `Workorder` (greyed here, already received) |
| Warehouse workorders | **empty**: received with no unloading work order |
| Line 10 | **`For line` `IO400142/…`**, with the tooltip **`Open linked order`** · 15-1-2025 · `Received` · `CK304L0050` coil 304L 5 mm · `Standaard` · `304L2B` · **3000** × 1500 × 5 · 1 ST · 177 kg · M1 3 · **€ 0,05/TN** · amount € 0,01 · Kg(a) 177 |
| Options | none |
| Reception | `Received` · delivery 10-2-2025 · pre-notified ✓ · **bill of lading `INtern`** · 177 kg / 1 piece · pre-announced 15-1-2025 · charge `NVT` · internal charge **`25AATY`** |
| `Stock` panel | lot `386458`: **location `Bewerkers`, type `Bewerker`, `Blocked` ☑**, 1 ST / 177 kg, **available 1 ST**, quality `304L`, charge `NVT`, `IO400143`, receipt 10-2-2025, supplier Decomecc, internal charge `25AATY` |
| …and beside it | a second lot at `Bewerkers`, blocked: coil 999999 × 1500, **1 ST / 11 380 kg, reserved 1 ST**, available 0, charge `3MME`, `IO100032`, Acerinox, received 21-10-2024, internal charge `23BAHH` |

**What it settles:**

1. **`Ex works Processor` books metal in where it lies.** The delivery
   address is the processor's, the bill of lading is `INtern`, no unloading
   work order exists, and the lot lands on the processor location
   **`Bewerkers`, blocked**. That is the 36-lots-all-blocked finding (G10)
   explained: a lot at a processor is blocked because it is there.
2. **It is raised `For line` a processing order's line**, and the header
   repeats that order as `Purchase reference`. So the two orders point at
   each other: `400143` → `400142/…`, and `400142`'s supply →
   `IO400143`.
3. **The lot is a 3 m piece of a 1 500 mm coil** (177 kg = 3 × 1,5 × 0,005 ×
   7 870), sitting at Decomecc: the tail of an earlier job. `400142` was to
   turn it into `PK304L500` plate of the same 3000 × 1500 × 5. It expired, and
   the lot is **still at `Bewerkers`, available, twenty months on**.
4. **The 11 380 kg coil beside it is -7 §17 / G10.** It is reserved, blocked,
   at the processor, bought in October 2024. `400366` (Processing, Decomecc,
   **11 370 kg**, invoiced 11-2-2025) is almost certainly the order holding it.
   The processing invoice went out and the reservation stayed.

**Change (C12):**

- `Ex works Processor` (`ex_works_processor`, already queued in -7 §2) is a
  purchase order type whose lines are `EXW` and whose receipt **skips the
  unloading**. `Report completion…` books the reception straight onto the
  processor's location, blocked, at the line's nominal price.
- A line can be raised `For line` **another purchase order's line**
  (`PurchaseOrderItems.forPurchaseOrderItemUuid`, already in the schema), and
  the header shows that order as `Purchase reference`. `For line` opens the
  linked order.
- -7 §2's "toll-processing return" reading is **withdrawn**: `EXW` is
  booking-in at the processor, not the processed goods coming back.

### `402401` — a live processing order, 8-10-2026 17:39

| What | Read |
|---|---|
| Header | Decomecc N.V., **`In progress · Printed · Mailed`**, created 14-11-2025, contact Elke Verheijen, purchaser Marco Borsboom, type **`Processing`** |
| `Sawing workorder with one delivery` | ☑ — `1 ST of CK316L0040 Coil Cold-rolled 316L 2050 x 3,96 MM 230 M1 14670 KG` |
| Delivery | `(FCA)`, delivery address **our yard** (Bolderweg 10, Almere), `Arrange transport` ☑, supplier address Genk, date 14-9-2026 |
| Summary | Materials **€ 0,00** · Options **€ 1 871,98** · **Surcharges € 760,98** · total € 2 632,96 · 15 304,2 kg |
| Supply | 5-12-2025 · coil 316L 999999 × 2050 × 3,96 · **14 670 kg** · picked 1 · bill of lading **`303347`** · `Delivered` · `CK316L0040` · charge **`539002`** · purchase order **`IO402399`** · receipt 28-11-2025 · M1 230 / 0 |
| Picking work order | `315201`, 1-12-2025, `Picking`, Approved, 1 ST / 14 670 kg, **from `5G` to `Laad`**, finished 3-12-2025, charge `539002`, `IO402399` |
| Unloading work order | `316082`, 15-12-2025, `Unloading`, Approved, one line per purchase line, `PK316L400` 4000 × 2050, to **`Ontvangst`**, **charge `539002`, purchase order `IO402399`, receipt 28-11-2025**, `2nd choice`, `EN 1.4404 2E` |
| Lines (7) | 10–60 · 15-12-2025 · **`Invoiced`** · `PK316L400` plate 316L 4 mm · 2nd choice · `316L2E` · 4000 × 2050 × 3,96 · 9 / 10 / 10 / 11 / 10 / 8 ST · € 0,00 · **Kg(p)** 2 294,2 / 2 549,1 / 2 549,1 / 2 804,1 / 2 549,2 / 2 039,3 · **Kg(a)** 2 294,2 / 2 608 / 2 608 / 2 874,1 / 2 583,9 / 2 081 |
| Line 70 | 14-9-2026 · **`In progress`** · `Standaard` · 1 ST · 255 kg, nothing received |
| Reception (line 10) | `Invoiced` · 15-12-2025 · pre-notified ✓ · **bill of lading `402401`** (the order's own number) · 9 / 2 294,2 kg · pre-reported by `FJ` · charge `539002` · internal charge **`25AIVK`** |

**What it adds to C8–C10:**

1. **The whole cycle, on a live order.** Picking `315201` takes the coil from
   rack `5G` to `Laad`. Transport on bill of lading `303347` takes it to
   Decomecc. One unloading `316082` brings 58 plates back to `Ontvangst`, one
   line per purchase line. C8's shape holds.
2. 🔑 **The processed plates carry the coil's heat `539002` *and* its original
   purchase order `IO402399` with its receipt date 28-11-2025**, not
   `IO402401`. A lot's `Purchase order` is where the metal was *bought*, not
   where it was last processed. The certificate chain survives processing.
   They do take a new internal charge (`25AIVK`). → **C13.**
3. **Each line is invoiced on its own.** Six lines are `Invoiced` and line 70
   is still `In progress`, ten months later, for one plate of 255 kg. The
   order stays open on a remainder that will probably never come. This is the
   same pattern as -7 §17, and the worklist proposed there would catch it.
4. **Surcharges exist on a processing order** (€ 760,98), beside the options.
   What they are is not visible here; `Pricing` was not opened.
5. ⚠️ **`Kg(a)` came back heavier than the coil went out**: 15 049,2 kg on
   lines 10–60 against 14 670 kg supplied. `Kg(p)` runs at the measured
   3,96 mm, and the `Kg(a)` of a 10-plate line (2 608) is exactly 10 × 4 ×
   2,05 × **0,004** × 7 950, the **nominal 4 mm**. So the unloading weighed
   nothing: it booked theoretical weight at nominal thickness, overstating
   the plates by ~1 %. Recorded as an observation. Ours weighs a receipt from
   the line's planned kilos or the scale (`applyReceipt`), which would not
   repeat it.

## C13 · Processed metal keeps where it was bought

**Change:** when an unloading receives the output of a `Processing` order,
the new lot takes the **supplied lot's** `charge`, `purchaseOrderUuid`,
`purchaseOrderItemUuid` and `receiptDate`, not the processing order's. It
takes a new internal charge of its own. Without this, every processed plate
would trace back to a processor's € 0 order instead of the mill's
certificate.

**File:** `applyReceipt` in `warehouse-work-orders/actions.ts`, reading the
supply (C8) of the processing order the purchase line belongs to.

## C9 · The offcut comes back as a scrap line

**Change:** a processing order's lines may include a **scrap article** in `KG`
(`SC304`). Receiving it books a scrap lot. The order shows a **kilo balance**:
supplied `Kg(a)` against the sum of the lines' `Kg(a)`, so 1 134 against
900 + 234, and flags a gap. This is the same check as the production cut's
kilo balance (H10), on the outside processor.

## C10 · A processing order is worth its options

**Now:** our purchase order value is the sum of its lines.

**Change:** on a `Processing` order the metal lines carry € 0,00 and the value
is the `Options` rows, each **priced on the weight received**: € 110,00/TN ×
0,900 t = **€ 99,00**, not on the 1 134 kg sent. Summary reads `Materials € 0,00
· Options € 99,00`, as on `400066`. Until the reception is in, the option
amount uses the planned kilos.

---

## Where 8-10-2026 stopped

The reference was closed at 17:01 after `400066`. Done today: item 1 (CD
receipt, except one screenshot), C7's status list, and most of item 3 (H9) by
way of `400066`.

**Next time, in this order:**

1. ~~`O108183` line 10~~ ✅ done 17:28: `Type` `CD`, sale made before the lot; C3 unblocked, C11 added.
2. ~~`Status: Delivered` on Purchase lines~~ ✅ done 17:21: purchase returns.
3. ~~`400066` Workorders panels~~ ✅ done 17:21: picking out, one unloading back.
4. ~~H13 `Split`~~ ⏹ moved to MANAGER-QUESTIONS.md question 11.
5. Then items 4 to 8 of the capture list (H10 saw cut, J1 consignment, H12
   credit note, G3/G7/H4 transport, J8 buttons) and the two extras.

---

## Still to come

As each capture lands it gets a section here: H10 saw cut, J1
consignment, H12 credit note, G3/G7/H4 transport, J8 buttons, and the two
extras (`Quote- and order lines`, `C. Kg` / `C. ST`).
