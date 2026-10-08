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
| C14 | `Quote- and order lines` panel on the company screen | Decomecc, extra A | 📋 ready |
| C15 | Stock search: `C. Kg` / `C. ST`, `Order hvh.` and the lot footer | `Voorraad` on `PK316L150315`, extra B | 📋 ready |
| C16 | `Confirm` takes a confirmation number, date and confirmed delivery date per line | `404299` J8 | 📋 ready |
| C17 | `Pre-notify` takes a bill of lading, date and pre-notification code per reception | `404299` J8 | 📋 ready |
| C18 | `Return` / `Par. return` are greyed on a received, mailed order | `404299` J8 | 🟡 rule to confirm |
| C19 | `Product Receipt Documents` panel: attach a certificate / DoP to a purchase order | `404299` J8 | 📋 ready |
| C20 | Returns and credits: € 0 return closes with no invoice; a complaint credits money with no goods back | `290247` + `K40055` H12 | 🟡 decide (a/b), credit route ready |
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

## C14 · `Quote- and order lines` on the company

**Captured 8-10-2026 on Decomecc N.V.** (empty there: Decomecc has no sales
lines, so this is the panel's shape only). It sits between `Orders` and
`Purchase requests`.

- **Toolbar:** `Show` · `Show contract` · `Show product` · `Show invoice` (all
  act on the selected row), then `View: Standaard`.
- **Columns, in order:** `Order date` (sorted descending) · `Delivery date` ·
  `Status` · `Order` · `Line` · `Product code` · `Product` · `kwaliteit` ·
  `Qty` · `QtyU` · `Length` · `Width` · `Dikte` · `Voorraadcategorie` · `Kg` ·
  `Gross price` · `Net price` · `PriceU` · `Reference` · `Days in system`.

**The three views** (the `View` dropdown), captured the same evening:

| View | Columns, in order | Filter |
|---|---|---|
| `Standaard` | the 20 above | none |
| `Vrijgegeven` (released) | Delivery date · Order · Line · Product · Length · Width · Qty · QtyU · kwaliteit · Kg · Gross price · Net price · PriceU · Order date · Dikte · **Customer** · Voorraadcategorie · Status · **Contract code** · **Invoice no.** · Reference · Product code · Days in system | a filter on `Status` (the column carries the filter mark; its value is not shown) |
| `Openstaand` (open) | Order date · Delivery date · Order · Line · Status · Product code · Product · Qty · QtyU · kwaliteit · Length · Width · Kg · Gross price · Net price · PriceU · Dikte · Reference · Voorraadcategorie · Days in system | **`Status ≠ Invoiced And Status ≠ Expired`**, shown in the filter bar |

So the panel has **23 columns**: the 20 of `Standaard` plus `Customer`,
`Contract code` and `Invoice no.`

**Ours:** the company screen got its document panels on 7-10-2026
(`company-related-panels.tsx`). This one was left out because its columns had
never been seen.

**Change:** a ninth panel, quote lines and order lines of this company
together, newest first, carrying all **23 columns**: the `Standaard` 20 in
their order, shown, then `Customer`, `Contract code` and `Invoice no.`,
hidden by default (labels in English: Quality, Thickness, Stock category). A
view selector above it offers `Standard` (everything), `Released` (status
`released`) and **`Open`** (status not `invoiced` and not `expired`). The four buttons sit in a
toolbar above the grid and act on the selected row: `Show` opens the quote or
order, `Show contract` the line's contract (greyed when none), `Show product`
the product, `Show invoice` the invoice the line was billed on (greyed when
none). Same sequential, 100-row query as the other panels.

**Files:** `companies/actions.ts` (`getCompanyRelatedRecords`),
`components/companies/company-related-panels.tsx`.

## C15 · The stock search, read in full (extra B)

**Captured 8-10-2026 17:55**: the `Voorraad` window opened from `New` on the
lines of quote `300007`, product `PK316L150315`, with `Met marges zoeken` ☑
5 % on all three dimensions and `Alleen artikelen met technische voorraad` ☑.
The filter bar reads `TotalPhysicalStock ≠ 0`.

**`C. Kg` / `C. ST` (the question):** **0 on all five article rows**, and
hovering the header shows only `C. Kg` again: the system does not say what C
stands for. Nothing on this product is consigned, and the window's other
columns already cover technical, reserved and available stock in both pieces
and kilos. That leaves **consignment** (`Consignatie`, the location seen in
H1.2's location tree) as the only reading that fits. ⚠️ Not proved; a product
with consignment stock would show it.

**Upper grid, in order:** Artikel · Kwaliteit · Vrd. cat. · Opties · Lengte ·
Breedte · Dikte · Technisch · Gereserveerd · Beschikbaar · `Kg (techn.)` ·
`Kg (geres.)` · `Kg (besch.)` · Totale lengte · C. Kg · C. ST. Ours has all of
these except the last two.

**Lot grid, in order:** **`Order hvh.`** · Lengte · Breedte · Dikte · Technisch
· Gereserveerd · Beschikbaar · `Ongeopend` · `Kg (besch.)` · Opties ·
Opmerking · Kwaliteit · `GIP` · `Inkoopprijs` · Interne partij · Vrd. cat.
Tabs `Voorraad` · `Inkoop` · `Interne productie`.

- **`Order hvh.`** (order quantity) is the first column, white (editable), 0
  on every lot: the quantity to take from that lot for this line, typed in the
  grid.
- **No location or product column.** Those sit in a **footer under the grid**
  for the selected lot: `Charge 446108 · Interne charg 25AFWS · Locatie 2C2 ·
  Inkoop 22-8-2025 / IO401559 / Aperam Service Solution Germany`, plus the
  lot's remark in red (`Shorter`).
- **A fully reserved lot is shown in red**: lot `404744`, 41 ST, 41 reserved,
  0 available, GIP 3050 / TN.
- `GIP` reads like `2900 / TN` and `Inkoopprijs` like `2650 / TN`, or `0 /`
  when there is no purchase price.
- Buttons: `Gebruik geselecteerde artikel` (between the grids), and `Reset
  dialoog` · `Standaard instellingen` · `Reserveringen…` · `Annuleer` along the
  bottom.

**Ours** (`components/orders/stock-search-dialog.tsx`): the upper grid matches
apart from C. Kg / C. ST. The lot grid matches in substance: `Unopened`, red
when available ≤ 0, `APP` = GIP, `Purchase` = Inkoopprijs. It differs in
layout: ours puts `Location` and `Product` in the grid and has no footer and
no `Order hvh.` column.

**Change:**

1. Add `C. Kg` and `C. ST` at the end of the upper grid, **hidden by
   default**. They print 0, with a comment that they are consignment stock,
   which we do not track.
2. Add the **selected-lot footer** (charge · internal charge · location ·
   purchase date / order / supplier · remark).
3. ⚠️ `Order hvh.` (typing a quantity per lot inside the dialog) is a change
   to how a line takes its stock. Recorded here, decided separately; ours
   asks the quantity on the line.

## J8 · Buttons on `404299` (`Received · Printed · Mailed`), 8-10-2026 18:00

**Toolbar:** `Print…` · `Send…` · ~~`Return`~~ · ~~`Par. return`~~ · `Confirm` ·
`Pre-notify` · `Show company` · `Copy` · `Workorder` · `Options…`. **`Return`
and `Par. return` are greyed** on a received order. `Workorder` opened only a
loading spinner (no dialog came up).

🔑 **An unsaved edit greys the document toolbar.** Adding an (empty) row to
`Product Receipt Documents` turned `Print…` · `Send…` · `Confirm` ·
`Pre-notify` · `Copy` · `Workorder` grey; only `Show company` and
`Options…` stayed live, until the change was saved or discarded. So nothing
can be sent, confirmed or worked on half-edited. Ours edits on a separate
page, so the detail screen's toolbar never sees a half-edited record. No
change, but any in-place panel editing we add (C19) must keep this rule.

**The rest of J8, closed the same evening:**

- `Correct products and stock` was already opened on 2-10-2026 (ACTIONS.md:
  it corrects a product's length / stock unit, with `Simuleer`).
- **`Show Word File`** on the company (Outokumpu Stainless Oy) **opens an
  empty Word document**. Nothing is merged into it, so it is a blank letter
  for the company, and no template is configured. **Not built**: ours has no
  Word integration, and an empty file is not worth one. Declined, like K3.
- `Change APP…` is finance and out of scope.

### C16 · `Confirm purchase order 404299`

- **Header, "Copy these values into the selected order lines below":**
  `Confirmation number` · `Confirmation date` (defaults to **today**) ·
  `Confirmed delivery date` · `Document supplier` (a `…` picker).
- **`Change confirmation` ☐** block, greyed until ticked: `Confirmation
  number` · `Confirmation date` · `Confirmed delivery date` dropdowns, which
  re-pick an existing confirmation.
- **Grid, one row per order line with a tick:** Qty · U · Kg · Product ·
  Dim. (mm) · Thickness · Gross price · U · Line discount % · Group discount %
  · Net price · Conf. No. · Delivery date · Prod. Sup. · Order · Doc. Supplier
  · Doc. code. The gross price shows in red (€ 3 050,00).
- `All select` · **`OK` greyed until a line is ticked** · `Cancel`.

**Ours:** `confirmPurchaseOrder(uuid)` only stamps `confirmedAt` on the order
and its lines. There is no dialog, no number and no date.

**Change:** a `Confirm` dialog with the four header fields, line ticks and
`All select`. On OK, write the confirmation number, confirmation date and
confirmed delivery date onto each ticked line, and the document supplier onto
the order. The confirmed delivery date becomes the line's expected date, the
way pre-notify's date does for receptions. Line columns `confirmationNumber`,
`confirmationDate` and `confirmedDeliveryDate` are new and nullable, so a
plain `pnpm db:push`.

### C17 · `Pre-notify purchase order 404299`

- **Header, "Copy these values into the selected receipts below":** `Bill of
  lading number` · `Pre-notified delivery date` · `Pre-notification code` ·
  `Confirmation number` · `Confirmation date` · `Document Supplier`.
- **`Change pre-notify` ☐** block: `Bill of lading number` and `Pre-notified
  delivery date` dropdowns plus **`Take over`**, which re-picks an earlier
  pre-notification.
- **Grid, one row per open reception** (empty here, since everything has
  arrived): It. · For line · Qty1 · U1 · Kg1 · M1 · Charge · Batch number ·
  #Bundle · Product · Length1 · Width · Bill of lading · Delivery … · Qty2 ·
  U2 · Length2 · Delivery d… · Conf. No. · Prd. Sup. · Product code · Order ·
  P… · EDI Consign… · EDI Charge · EDI Deliver… · Doc. supplier · Doc. code.
- `All select` · **`Pre-notify in stock unit (if receipt for stock)` ☑** ·
  `OK` · `Cancel`.

**Ours:** the dialog built on 7-10-2026 asks one date and writes it to every
open reception.

**Change:** add `Bill of lading number`, `Pre-notification code`,
`Confirmation number`, `Confirmation date` and `Document supplier` to the
header, and a reception grid with ticks and `All select`, so a pre-notice can
cover some receptions and not others. The bill of lading is what H1.1 saw on
the reception (`324234`) and what the `Receipts` panel shows. The charge,
batch and bundle columns let the supplier's dispatch note be typed in ahead of
the lorry. `Pre-notify in stock unit` stays ticked, and the quantity is
entered in the stock unit.

### C18 · `Return` greyed on a received order

`404299` is `Received`, and its 41 plates went straight to the customer's sales
line (C3). `Return` and `Par. return` are both greyed. On `404102`, where
`Par. return` was captured working (ACTIONS.md), the order was not fully
reserved. ⚠️ So the likely rule is that **a return needs unreserved received
stock to send back**, but one order cannot prove it. Ours enables
`Par. return` on any non-provisional order. Not changed until a second order
settles it.

### C19 · `Product Receipt Documents`, the certificate attach path (H11)

The last panel on the purchase order, under `Previous orders`.

- **Toolbar:** `New` · `Delete` · `Toon` (show, greyed until a row has a
  document) · `View`.
- **Columns:** `Soort` · `Producent` · `Certificaattype` · `Code` ·
  `Document` · `Order regel` · `Ontvangst regel`.
- **`Soort` is a dropdown of three: `DoP` · `Certificate` · `Other`.** DoP is
  the Declaration of Performance (CE marking for construction steel).
  `Certificaattype` defaults to `-leeg-`.
- Empty on `404299`.

**What it settles:** the certificate is stored **as a document on the purchase
order**, tied to an order line (`Order regel`) and a reception line
(`Ontvangst regel`). It is not attached to the batch screen. That is H11's
question, *"is the certificate stored in the system, or a filename?"*: it is a
document row with a file (`Document` / `Toon`). It also explains why the
batches export's `Filename` was empty on every row: the file lives here, not on
the batch.

**Ours:** `BatchCertificates` holds a certificate per batch with
`documentCertificate` (the 3.1 / 2.2 kind), `documentCode`, `producer`,
`purchaseOrderItemUuid` and a `documents` JSON of uploaded files. The shape
is close, but it hangs off the batch, there is no `Soort` (DoP / Certificate
/ Other), and there is no panel on the purchase order to add one.

**Change:**

1. Add `kind` (`dop` · `certificate` · `other`, a new enum in `lib/enums.ts`)
   and a nullable `purchase_line_receival_uuid` to `BatchCertificates`, and
   allow `batchUuid` to be null so a document can exist before its batch.
   A new enum column with a default plus NOT NULL → NULL is a plain push.
2. A **`Product receipt documents`** panel at the bottom of the purchase order
   detail, with the seven columns and `New` · `Delete` · `Show`, uploading
   through the existing `/api/documents/upload` route (R2), never a new
   handler.
3. When the reception becomes a lot, the document's batch is filled in, so
   `Certificates received` / `to be linked` keep reading the same table.

⚠️ `Certificaattype`'s list was not opened. It is probably the 3.1 / 2.2 /
`INtern` / `NVT` set already in `certificaatOptions`. One click settles it.

## J1 · Consignment — the test order is gone

**8-10-2026 18:10:** purchase order `401154` now opens as a **real order**:
Terninox S.p.A. `13249`, `Materials`, `Invoiced · Printed · Mailed`, created
30-5-2025, one coil `CK3210015` 321 1,5 mm × 1 272, 1 178 kg at € 1 950/TN,
unloading `307281` approved, reception invoiced. Nothing on it says
consignment. The test order of that number (from a quote with `Consignatie`
ticked, `Provisional`) **no longer exists**, so the test copy has been
refreshed or renumbered since.

So J1 cannot be finished on `401154`. ⏹ **`401156` is a real order too**
(Aperam Stainless Belgium `10627`, `Materials`, `Invoiced · Printed · Mailed`,
created 2-6-2025, reference `I25E5414`, one coil `CK304L0020` 304L 2 mm ×
1 545, 2 850 kg at € 1 960/TN). The test numbers have been reused by real
orders, so **J1 is closed as not capturable** and consignment moves to
[MANAGER-QUESTIONS.md](MANAGER-QUESTIONS.md) question 5, which already asks
what `Consignatie` changes. With C15's `C. Kg` / `C. ST` reading 0 on every
row, nothing in the test data uses consignment at all.

**No change planned.** `Stock.ownerCompanyUuid` stays as the model for
customer-owned stock (K2), and supplier consignment is not built until
someone says it is a real process.

## C20 · H12 — the € 0 return that was "invoiced" with no invoice

**Return order `290247`** (opened 8-10-2026 18:16), the one captured on
29-9-2026 (-6 item 25):

| What | Read |
|---|---|
| Header | Mercainox Componentes Industriais `12368`, **`Invoiced`**, created 29-9-2026, sales Adrie Noom, contact Rogerio Neves |
| Links | **`Sales order` empty · `Complaint` empty** · `Customer ref.` empty |
| Reception | return date 29-9-2026, **`Pick-up` ☑**, pick-up at Mercainox (Rua A no 365), delivery to Bolderweg 10 |
| Reason | **`Wrong quantity`** |
| Summary | everything **€ 0,00**, 35,4 kg |
| Toolbar | `Print…` · `Send…` · `Show company` live. `Show order` · `Show complaint` · `Workorder` · **`Invoice` greyed** |
| Line 10 | `Order line` **0** · `Invoiced` · `PK304L1003…` cold-rolled plate · 1 / 1 ST · 3000 × 1500 · 35,4 / 35,4 kg · **gross price € 0,00 / TN** · discounts 0 |

**The credit note does not exist.** `Overviews → Sales → Invoices`, from
1-1-2024, search `Mercainox`, newest first: the latest is **`508204`, Debit,
11-9-2026**, and every row is `Debit`. Nothing is dated on or after 29-9-2026.
So `Invoice` on a € 0 return set the return and its line to `Invoiced`
**without writing an invoice**. That is H12's open half: "does the credit price
from the original invoice?" It does not. A return carries no price unless
someone types one, and at € 0 the system skips the document.

**Ours:** a return credits through `invoices/actions.ts` and the credit is
valued at the return's cost (the receipt side values the returned lot at what
it cost to go out, by design, see `applyReceipt`).

**Change, to decide:** two readings, and neither is captured as a rule.

- (a) Copy the reference: a return whose total is € 0 can be closed as
  `invoiced` with no credit document, for a paper-only correction of quantity.
- (b) Keep ours: always write the credit document, even at € 0, so every
  `Invoiced` status points at an invoice number.

Recommended: **(b)**. An `Invoiced` status with no invoice behind it is
exactly the kind of state nobody can audit later, and a € 0 credit costs
nothing to keep. Recorded for decision, not built.

### The complaint side — `K40055`, 8-10-2026 18:21

Found by searching `40055` without the `K` (the number column holds digits
only).

| What | Read |
|---|---|
| Header | Complaint **40055**, J. op den Velde Staal B.V. `13402`, customer group `HANDELAAR`, account mgr / representative `Hego`. Recorded by Adrie Noom 08-04-2025 14:43, last changed by Sharif Pasaribu 09-04-2025 |
| Type / report / category | `General` · `E-Mail` · **`Wrong quantity`** |
| Description | *"platen 3000 x 1000 x 2,0 mm. 6 stuks, gewicht is 288 kg. Er is gefactureerd 360 kg. Prijs 2,78 p/kg. Crediteren 200,16 Euro. Order: 101365 / faktuur 501210"* |
| Product block | `PK30420031` cold-rolled plate 304 3000×1000×2 · **`Qty` 0** · **`Amount` € 200,16** · **`Weight` 72 kg** |
| Cause / explanation | `Production`: plates supplied at 3000 × 1000 × 2,0, cut from production order 3000 × 1250 × 2,0, so the kilos are lower than the plates put in |
| Status | `Done` (Handling panel), result `1` |
| Toolbar | `Show company` · `Show product` · `Order lines` · `Orders and Quotes` · `Stock on location` · `Afhalen` · `Hego Prod - Lossen` · `Hego Prod - Picken` · `Lossen`. **No `Return` / `Credit` button** |
| Panels | `Workorders` · `Handling` · `Status history` · `Documents` |

**What it settles (H12's last question):** **crediting does not require the
goods to come back.** This complaint is a pure money correction: **`Qty` 0**,
**72 kg** = 360 billed − 288 delivered, **€ 200,16** = 72 × € 2,78. No return
order was raised from it. The complaint cannot raise one (no button), and the
credit was made against invoice `501210` directly. So there are two routes:

- **goods back:** a return order (`290247`), which unloads stock and can be €
  0;
- **money only:** a complaint carrying qty 0, the kilos and the amount to
  credit, credited on the original invoice.

**Ours:** `Complaints` already carries `qty`, `qtyUnit`, `amount` and
`weight`, and links to an order, invoice side and return order. The
**money-only** route is the open part: nothing raises a credit invoice from a
complaint's amount. The return route already exists (`Par. return` makes a
return + complaint in one step, -7 §20).

**Change (part of C20):** on a complaint with `amount` > 0 and no return order,
offer **`Credit`**: a credit invoice on the complaint's order invoice, one line
for the complaint's product at `weight` kg and `amount` €, then link it back
and set the complaint to `done`. A complaint whose qty is 0 never touches
stock.

## G7 · Trip `600249` on `Trip data`, 8-10-2026 18:25

`Trip data` is a **report with no record behind it**: the toolbar has no
`Show`, and double-clicking opens nothing. Its only buttons jump elsewhere
(`Order lines` · `Orders and Quotes` · `Stock on location` · `Afhalen` · `Hego
Prod - Lossen`).

| Year | Month | Trip | Trip date | Vehicle | Stops | Orders | Kg | Colli | Kg/stop | Orders/stop | Colli/stop | Km | Hours | Cost | Driver |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2025 | 3 | 600249 | 21-3-2025 | ADO NL | 17 | 18 | 26 429,40 | 62 | 1 555,00 | 1 | 3 | 0 | 0 | € 0,00 | — |

**Checks ours, no change.** Kg/stop 26 429,4 / 17 = 1 554,7, shown **rounded**
to 1 555. Orders/stop 18 / 17 = 1,06 → **1**, and colli/stop 62 / 17 = 3,6 →
**3**, both **floored**. That is exactly what `trip-data/actions.ts` does since
f6a6d45a. Km, hours, costs and driver are empty, as on all 438 trips. Ours
having no trip detail page (removed in f6a6d45a) is also right.

## G3 · A "delivery" is an order line, not a document

`Sales → Deliveries` (scheduled delivery date from 1-1-2024), 8-10-2026 18:26:
one row per **order line** (Customer · Order · Order type · Pick-up ·
Seller · Commercial / Financially / Transport blocked · Line · **Line type** ·
Line status · Product code · Product · Length …). The toolbar offers only
`Show Product` · `Show Company` · `Show Order`, and there is **no delivery
record to open**. Searching the bill of lading `300813` finds nothing on it.

**So G3 is answered:** there is no delivery document between the order line
and the stock movement. A delivery is the order line's own delivery state plus
the transport / picking work order that moved it, which is what ours models.
**No change.**

Also seen: order **`101974`** (247 Watersnijden, the "delivery waiting" record
picked for H4 in FLOWS.md) is now **`Invoiced`** on every line, lines 10 and 20
`CD`. It is no longer waiting, so H4 needs another row from `Deliveries to be
arranged`.

## H4 · Planning a trip — no screen does it

`Deliveries to be arranged without…` (8-10-2026 18:30) lists one line:
Henk van den Bergh, order `108298` / 10, 23-9-2026, 10 ST `PC304060`, length
50. Toolbar `Show Product` · `Show Order` · `Order lines` · `Orders and
Quotes` · `Stock on location` · `Afhalen`, and right-click offers only `Show
Product` · `Show Order`. **No button anywhere creates a trip or a transport
work order.** `Trip data` is a read-only report (G7), and `Deliveries` is a
line grid (G3).

So trips are made **outside the screens reachable here**: by a planning
module, the scanner app, or an import. Moved to
[MANAGER-QUESTIONS.md](MANAGER-QUESTIONS.md) question 12. **No change**: ours
keeps transport read-only until someone says where trips come from.

## H10 · Reporting a production cut — what the evening found

**Where reporting happens.** Not on the `Production workorders` overview
(toolbar `Show Product` / `Show Order` only, no double-click), and not on the
sales order's `Production workorders` panel (`New` · `Delete` · `Show
product`). It happens on the **work panel** (top menu `Logistiek`): a tree
`Dag / Optie (Machine) / Opdracht / Regel` with view `Decoilen`, filters
`Datum` · `Optie` · `Machine` · `Status` · `Naar`, and the toolbar `Alles
Selecteren` · `Details` · `Vrijgeven` · **`Gereedmelden…`** · `Goedkeuren` ·
`Annuleren` · `Verpakken` · `Afdrukken` · `Klantlabel`. Bottom tabs `Voorraad`
· `Order` · `Opties` · `Teksten`. Columns: Extra opties · Status ·
Artikelcode · Order · Dikte · Hvh(p) · Hvh(w) · Eh(p) · Eh(w) · Kg(p) · Kg(w) ·
Vorig · Van · Naar · Bedrijf · Leveren op · Afhaal · Spoed · Prioriteit ·
Charge · Specificatie · Voorraadcategorie · Interne partij · Interne charge ·
Partij · Kwaliteitscode · Kwaliteit.

**Two statuses only.** Grouping the overview on `Status` gave `Approved` and
`Released`. A line that is fully reported (`Hvh(w)` = `Hvh(p)`, `Kg(w)` =
`Kg(p)`) can still read `Released`, as on `303496` lines 1/4/6, so reporting
does not move the status by itself here.

**Machines in use:** `Slijpen/Foliën` (grinding / foil), `Knip` (shear),
`Laser 1`, `Decoiler`. No saw (`Zaag`) appears among the open orders, which
fits sawing planning being unused (K3).

🔑 **A rule:** pressing `Gereedmelden…` on a line whose **fetch work order**
(`aanhaalopdracht`) was already reported gives *"De aanhaalopdracht is al
gereedgemeld. Deze opdracht kan niet meer met behulp van de dialoog
gereedgemeld worden."* ("The fetch work order is already reported. This work
order can no longer be reported with the dialog.") So a production line and
the warehouse fetch that feeds it are reported together. Once the fetch is
reported, the production line is closed through it, not through this
dialog. Ours reports the two independently. ⚠️ To confirm what closes it then.

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
consignment, H12 credit note, G3/G7/H4 transport and J8 buttons. Both extras
are done (C14, C15).
