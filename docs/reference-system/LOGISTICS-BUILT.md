# What the Logistics batch changed, and what is left

Written **8-9-2026**, after the whole Logistics group arrived in one batch.
Read this before touching any of it again.

Verified by `pnpm --filter @swedinox/dashboard verify-logistics` — **64 cases**,
each one a figure printed on a reference screen. `tsc` and `eslint` clean.

---

## 🔴 The find that matters: the sales-side money bug

`quoteLineFinancials` computed:

```ts
const amount = netPrice * quantity;
const costAmount = costPrice * quantity;
const replacementCost = replacementPrice * quantity;
```

The truth, proved to the cent on eighteen rows of
[Blocked deliveries](blocked-deliveries.md), is **price × the measure the price's
own unit names**. Steel is sold by the tonne.

A line of **1 002 pieces** weighing 3 893,6 kg at **€ 2 550/TN** bills
**€ 9 928,68**. The old code produced **€ 2 555 100** — out by a factor of a
thousand.

This is the same bug found earlier on the purchase side, and it reached further:
it also drove `costAmount` and `replacementCost`, so **profit and margin were
wrong too** — and wrong in a way that looked plausible, because both sides were
scaled by the same factor.

**It fed:** quote lines (`quotes/actions.ts`), the order lines raised from a
quote (`orders/actions.ts`), the order lines raised straight from quote lines
(`quote-lines/actions.ts`), the live grid preview (`quote-lines-editor.tsx`) and
the header summary (`use-quote-submit.ts`).

**Now:** one dispatch, `priceMeasureFor`, covering all nine sales units
including the three "per hundred" ones. `optionMeasureFor` defers to it, so
there is one definition rather than two that can drift.

---

## 🔴 The second find: `Theor. Weight` is a density

[Nesting](nesting.md) prints `Theor. Weight (kg)` = **7 850** with
`Theor. Weight U.` = **`M3`**. That is the density of stainless steel, not a
7,85-tonne plate.

Three call sites read `Products.theoreticalWeight` raw and multiplied it by the
quantity to get a line weight. On reference data that is `quantity × 7 850`.

- `salesUnitOptions` had **no `M3`** — the only value the column actually uses.
- `Products.weightUnit` existed, three screens surfaced it, and **no code
  anywhere branched on it**.

Now `THEORETICAL_WEIGHT_BASIS` + `theoreticalPieceWeightKg`, and
`productPieceWeightKg` routes through them. This column has now bitten twice; it
must only ever be read through that helper.

---

## 🔴 The third find: `toFixed(2)` rounds money the wrong way

`Number.prototype.toFixed` rounds the *binary* approximation, not the decimal,
so it lands a cent **low** on an exact half-cent:

```
462,9 kg × € 2 550/TN = € 1 180,395
  reference prints    € 1 180,40
  toFixed(2) writes   € 1 180,39   ← a cent short
```

Two of eighteen priced lines land on that boundary, so it is common, not exotic.

**Built:** `roundToCents` and `moneyString` in `lib/helpers.ts`, and
`quoteLineFinancials` now rounds every money figure it returns — so every
downstream `.toFixed(2)` is a no-op on an already-correct number, with no
call-site churn.

⚠️ **Not finished.** There are **222** other `.toFixed(2)` sites, concentrated
in `quotes`, `return-orders`, `orders`, `invoices`, `purchase-invoices` and
`purchase-return-orders`. Each needs `moneyString(x)` instead of `x.toFixed(2)`.
It is mechanical but it is money across the whole app, and doing it blind at the
end of a large batch was the wrong risk to take. **This is the top follow-up.**

---

## Everything else that changed

### Bugs fixed

| Where | Was | Now |
|---|---|---|
| `warehouse-and-production-workorders/actions.ts` | `weightDeviation = kgActual − kgPlanned` | `weightDeviationPercent` — a percentage of plan, positive when short, `null` when nothing planned |
| `warehouse-capacity/actions.ts` | `totalCapacity = occupied + ready + remaining` — counted everything twice | `capacityRemaining(occupied, ready)` and a `readyPercent` |
| `receipts/actions.ts` | `materialStillToReceive`, a **quantity**, from a `GROUP BY` | `materialStillToInvoice`, **money**, one row per reception, priced off the purchase order line |
| `TransportStatusAdjustments.tripStatus` | `deliveryStatuses` — the wrong vocabulary entirely | `tripStatuses` |
| `TransportWorkOrders.status` | four states | the seven proved ones |
| `deliveries/actions.ts` | `getDeliveriesToArrange` sorted by `createdAt` | by customer, then delivery date — it is a worklist |

### Enums that gained behaviour

| Enum | Change |
|---|---|
| `tripStatuses` | **new** — seven states, replacing a four-state guess in two places |
| `receiptStatuses` | **new** — six states, and `PurchaseLineReceivals.receiptStatus` is no longer a `varchar` |
| `salesUnitOptions` | `+ M3` |
| `stockMovementReasons` | `+ external_processing_return`, `+ data_conversion` |
| `warehouseBlockReasons` | `+ wait_for_call` |

### Helpers added

`priceMeasureFor` · `roundToCents` · `moneyString` ·
`THEORETICAL_WEIGHT_BASIS` · `theoreticalPieceWeightKg` ·
`weightDeviationPercent` · `callOffRemaining` · `capacityRemaining` ·
`TRIP_STATUS_META` · `tripStatusMetaOf` · `nextTripStatus` · `canMoveTripTo` ·
`RECEIPT_STATUS_META` · `receiptStatusMetaOf` · `receiptStatusAfterUnloading` ·
`materialStillToInvoice`

---

## ⚠️ `pnpm db:push` has NOT been run

Four schema changes are written and **not yet applied**:

1. `TransportWorkOrders.status` → `tripStatuses` *(table empty — free)*
2. `TransportWorkOrderLines.status` → `tripStatuses` *(empty)*
3. `TransportStatusAdjustments.trip_status` → `tripStatuses` *(empty)*
4. `PurchaseLineReceivals.receipt_status` `varchar(100)` → `mysqlEnum` *(**161
   rows**)*

Only the fourth needs care. Its current values are the reference's own, in mixed
case, and must be normalised **before** the column type changes:

```sql
UPDATE PurchaseLineReceivals SET receipt_status = 'new'                WHERE receipt_status = 'New';
UPDATE PurchaseLineReceivals SET receipt_status = 'released'           WHERE receipt_status = 'Released';
UPDATE PurchaseLineReceivals SET receipt_status = 'workorders_created' WHERE receipt_status = 'Workorders created';
UPDATE PurchaseLineReceivals SET receipt_status = 'invoiced'           WHERE receipt_status = 'Invoiced';
-- 'received' is already lower case
```

Counts before: `received` 53 · `Workorders created` 53 · `Released` 33 ·
`New` 19 · `Invoiced` 3 = **161**.

🚫 **Never `drizzle-kit push --force` on this database.** It tried to
`TRUNCATE OrderItems` (194 rows) to widen an enum once already. Widen enums with
plain `ALTER TABLE … MODIFY COLUMN`, counting rows before and after each
statement.

---

## The receipt chain is now fully specified

Nothing is guessed any more:

```
purchase order
  → transport work order   Pick-up — we collect from the supplier
      trip: new → scheduled → loading_list → loaded → loading_done
            → in_transit → completed
  → warehouse work order   Unloading — no source location, into Ontvangst or a rack
      reception:  new → released → workorders_created
      work order: new → released (a date, a section, a half-hour slot)
  → approve the Unloading  fills Kg(a); the goods now exist
      reception:  → partially_received | received
      stock:      a movement stamped with the work order number
  → purchase invoice       values what is already there
      reception:  → invoiced
      accrual:    Material still to be invoiced drops to zero
```

**What is built:** every status ladder, every transition rule, every piece of
arithmetic in it.

**What is not built:** the chain itself. Ours still creates the stock lot when
the purchase invoice is posted — three steps late. `StockMovements` has four
document links and **not one of them is a work order**, which is the column the
reference stamps on every movement.

That is [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) §1 and it is the next
substantial piece of work.

---

## Follow-ups, in the order they are worth doing

1. **The 222 `.toFixed(2)` sites** → `moneyString`. Money, app-wide, mechanical.
2. **`pnpm db:push`**, with the four `UPDATE`s above run first.
3. **The receipt chain** — move lot creation from the invoice to the approval of
   the Unloading, and add the work-order link to `StockMovements`.
4. **A call-off line is blocked by the customer**, which is a fourth kind of
   hold our three booleans cannot express. See
   [blocked-deliveries.md](blocked-deliveries.md).
5. **`Fetching` subtyped by machine**, so capacity draws on the right pool.
6. **`Section`**, a level above location — twelve of them, one current.
7. **The discount basis** — still unproved. Blocked deliveries prints both
   discount columns and reads 0 % on every row, so even the best-placed screen
   in the system did not settle it. One quote line with real figures in both
   boxes still would.

---

## The Customers, Companies and Finance menus arrived too

All three trees were captured in the same batch. **All 35 of their screens
already exist as routes** — checked one by one against `app/(dashboard)`,
nothing missing. So there is no scaffolding left to do in those groups, only
column-matching, and that needs the screens themselves rather than the menu.

Two entries in Finance are worth naming now, because this batch just built what
they report on:

- **`Purchase invoices to be received`** is the accrual proved on
  [Receipts](receipts.md): received weight × the purchase price, dropping to
  zero once the supplier bills. `materialStillToInvoice` is that figure.
- **`Control Stock increase due to external processing`** is why
  `external_processing_return` had to exist — see
  [stock-mutations.md](stock-mutations.md). Nothing else in the system raises a
  lot's value without a purchase.

Alongside them sit `Control sawing waste` and `Control Revaluation of stock due
to FSP-changes`, the two other reasons a lot changes value on its own. All three
are control lists watching a single stock-movement reason, which is a good sign
that the reason enum is now the right shape.

---

## Two things the reference has not explained

- **`29xxxx` order numbers** appear on [Receipts](receipts.md) — `290048`,
  `290049`, `290050` — behaving exactly like `4xxxxx` purchase orders. A second
  series, for an unknown reason.
- **`Bill of lading` vs `Trip number`.** Transport status adjustments holds
  `300813` in `Bill of lading`; the Warehouse workorders export holds `600249`
  in `Trip number`. Either two identifiers both called a trip, or one sits above
  the other.
