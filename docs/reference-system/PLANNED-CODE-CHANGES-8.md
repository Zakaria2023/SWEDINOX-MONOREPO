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

---

## Still to come today

As each capture lands it gets a section here: H13 `Split`, H9 external
processing, H10 saw cut, J1 consignment, H12 credit note, G3/G7/H4 transport,
J8 buttons, and the two extras (`Quote- and order lines`, `C. Kg` / `C. ST`).
