# Planned code changes — from the 8-10-2026 capture day

**Nothing on this page is built yet.** Code changes are on hold by request; this
page is the list of what will change once they are allowed, each tied to the
capture that proves it. Items are added as each capture lands.

| # | Change | Proved by | State |
|---|---|---|---|
| C1 | A purchase line bought for a sales line is `CD` | `404299` | 📋 ready |
| C2 | Ordering a request directly carries its `For line` onto the sale | `404299` | 📋 ready |
| C3 | A receipt reserves the new lot to the line it was bought for | `404299` lot `404744` | ⏸ waits on `O108183/10` |
| C4 | Purchase quote lines keep the request's `For line` | follows from C1 | 📋 ready |
| C5 | `For line` column on the purchase order's Lines grid | `404299` screenshot | 📋 ready |
| C6 | A CD receipt is put on the loading location, not a rack | lot `404744` at `Laad` | 🟡 default to confirm |
| C7 | Purchase lines gain the status `Delivered` | `Purchase lines` grouped on `Status` | 🟡 meaning to confirm |
| C8 | A processing purchase order lists the material we send out (`Supplies`) | `400066` | ⏸ more screenshots coming |
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

✅ **Confirmed twice**: the order's `Stock` panel and `Stock on location` both
read lot `404744` as 41 reserved of 41.

**Now:** `applyReceipt` (`warehouse-work-orders/actions.ts`) creates the lot
**unreserved**. The reference reserved lot `404744` in full (41 of 41) to
`O108183/10` the moment it was received. H1.2 showed the same thing from the
other side: the report dialog pre-fills a `For order line` per bundle.

**Change:** after the lot is written, find the sales lines this purchase line
covers. Reserve the lot to them, up to its quantity, with a `Reservations` row
and `Stock.reservedQuantity`, in the same transaction.

⏸ **Blocked on our data model.** `OrderItems.stockUuid` is `notNull`, so in our
app a sales line can only be cut from a lot that already exists. A CD sale is
made **before** the goods are bought. This needs one more screenshot first:

> Sales order **`O108183`**, line **10**, scrolled right so `Line type` shows,
> plus its **`Reservations`** panel.

That tells us what the sales line holds before the goods arrive, and so whether
`stockUuid` becomes nullable or the sale holds something else until receipt.
This is the one change on this page that touches the sales spine (picking,
invoicing, call-offs all read `stockUuid`), so it gets its own plan once the
screenshot is in.

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

**Change, once confirmed:** add `delivered` to the purchase line's status set
(a hand-ALTER of the enum first, then a normal `pnpm db:push`), and set it where
a purchase return line is delivered.

## H13 · `Split` — attempts

| Order | Reception | `Split` |
|---|---|---|
| `400066` (line in `Status: Released`) | `Kg(a)` **900**, `Qty(a)` 1, charge `70120 3`, internal charge `23EFFF`, pre-announced 31-1-2025, by `RVS` | greyed |

⚠️ Not yet the test asked for: the reception already carries actual figures. A
reception reading `Kg(a)` 0 is still to be tried.

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
   25/130 of 1 134 kg is 218 kg, close to the 234 kg gap. Line 2 is probably the
   25 mm strip. ⚠️ To be read.

**Ours:** nothing. A processing purchase order has lines and receptions only,
and the material sent out is not recorded against it.
(external-processing.md modelled the out-leg from movements alone.)

**Change:** planned once the header, lines, full `Supplies` row and work order
panels of `400066` are in.

---

## Still to come today

As each capture lands it gets a section here: H13 `Split`, H9 external
processing, H10 saw cut, J1 consignment, H12 credit note, G3/G7/H4 transport,
J8 buttons, and the two extras (`Quote- and order lines`, `C. Kg` / `C. ST`).
