# What the Logistics batch changed, and what is left

Written **8-9-2026**, after the whole Logistics group arrived in one batch.
Read this before touching any of it again.

Checked by the local harness `apps/dashboard/scripts/verify-logistics.ts` —
**64 cases**, each one a figure printed on a reference screen, not a figure this
code produced. `apps/dashboard/scripts` is gitignored, so it lives outside the
repo; run it with

```
cd apps/dashboard
node ../../node_modules/.pnpm/tsx@4.22.4/node_modules/tsx/dist/cli.mjs scripts/verify-logistics.ts
```

`tsc` and `eslint` clean.

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

## ✅ The units are populated, and one of them deliberately is not

The migration exposed something the code alone could not: **`price_unit` was
NULL on all 5 626 products**, so `priceMeasureFor` fell back to charging by the
piece for every line — meaning the money fix above was correct and completely
inert. `sales_unit`, meanwhile, was filled on all but three:

```
TN 2 927    ST 1 972    M1 722    KG 2    NULL 3
```

`price_unit` is a field the product form writes, so this was incomplete import
data rather than a missing feature. `scripts/backfill-price-unit.mjs` filled it
from `sales_unit` — 5 623 rows, 5 626 intact, none disagreeing afterwards.

### 🚫 `weight_unit` was deliberately left alone

The obvious next step would have been to stamp `M3` on `weight_unit` to match
the reference. **That would have been a disaster**, and checking first is the
only reason it was not taken:

| our `theoretical_weight` | rows |
|---|---|
| looks like a per-piece weight (< 1 000 kg) | **3 570** |
| zero | 2 054 |
| in the 6 000–9 000 density range | **0** |

Our column holds per-piece kilograms. The reference's holds a density. Stamping
`M3` on ours would have made `theoreticalPieceWeightKg` multiply 3 570 real
weights by their own volume. Left NULL, the helper's default branch reads the
column as the per-piece figure it actually is — which is the right answer for
our data and stays right.

### And a flaw in the helper, found by the same check

114 products are sold by weight (`TN` or `KG`) and carry **no weight at all**.
`priceMeasureFor` returned `0` for those, where the area and volume bases
already returned `null` when their dimension was missing — so backfilling
`price_unit` would have billed those 114 products at nothing, silently. The
three weight bases now return `null` too, and a weightless line falls back to
the piece count exactly as before.

---

## ✅ `pnpm db:push` has been run

Not through drizzle-kit's own path. It flagged all twelve column changes as
data loss that cannot be reverted, because it cannot tell an enum being
*widened* from one being narrowed — eleven of the twelve add a single member
and take nothing away.

`scripts/widen-enums.mjs` does it with plain `ALTER TABLE MODIFY COLUMN`,
finding the columns from `information_schema` rather than the schema files —
which turned up **15**, not 12, since three empty ones gave push nothing to warn
about. It reinstates each column's nullability, default and comment, and takes
every column's row count and value distribution before and after; any
difference aborts.

The one real conversion was `receipt_status`, varchar to enum over 161 rows in
the reference's own casing. MySQL turns a value outside an enum into the empty
string **without complaining**, so those are normalised first and anything left
over aborts rather than being lost. That was the only place the warning applied.

Applied: 161 receivals intact and renamed, 5 626 products intact across five
columns, `OrderItems` still 194. `pnpm db:push` afterwards reports
`Changes applied` with no warnings and no prompt.

```
cd apps/dashboard
node scripts/widen-enums.mjs           # reports, changes nothing
node scripts/widen-enums.mjs --apply   # does it
```

🚫 **Never `drizzle-kit push --force` on this database.** It tried to
`TRUNCATE OrderItems` (194 rows) to widen an enum once already.

## ~~⚠️~~ The four UPDATEs, for reference

The normalisation the script performs, written out in case it is ever needed
by hand:

```
cd apps/dashboard
node scripts/widen-enums.mjs           # reports, changes nothing
node scripts/widen-enums.mjs --apply   # does it
```

It finds the columns from `information_schema` rather than the schema files,
normalises the receipt statuses first, reinstates each column's nullability,
default and comment, and takes every column's row count and value distribution
before and after — any difference aborts the run.

Counts before: `received` 53 · `Workorders created` 53 · `Released` 33 ·
`New` 19 · `Invoiced` 3 = **161**. Counts after, unchanged in total.

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

1. ~~**The 222 `.toFixed(2)` sites**~~ — ✅ **done 9-9-2026.** 178 money
   sites converted across 29 files; the 47 that remain are weights, counts
   and percentages, and are meant to stay. See
   [PLANNED-CODE-CHANGES.md §7](PLANNED-CODE-CHANGES.md).
2. ~~`pnpm db:push`~~ — done, by hand, with every row verified.
3. ~~**The receipt chain**~~ — ✅ **answered 9-9-2026**, and in our favour: the
   work-order path already creates the lot at unloading. What is wrong is that
   the *invoice* creates a second one. See [receipt-chain.md](receipt-chain.md)
   and [PLANNED-CODE-CHANGES.md §1.2](PLANNED-CODE-CHANGES.md).
4. ~~**A call-off line is blocked by the customer**~~ — ✅ **answered**. It was
   never a fourth boolean: it is a **location type** (`Afroep`), and every lot
   in one is blocked by construction. See
   [stock-on-location.md](stock-on-location.md#location-type--eight-of-them-and-they-carry-the-block).
5. ~~**`Fetching` subtyped by machine**~~ — ✅ **done**, but not by machine:
   `Machines` has no detail screen and `Decoiler` / `Laser 1` / `Knip` are
   themselves locations under `Productie`, so the discriminator is the
   **destination location**. `WarehouseCapacity.toLocationUuid` added.
6. ~~**`Section`**~~ — ✅ the 17 sections, the 8 location types and a
   1 940-row master export are all captured. 🔴 And the claim that followed
   this one — *"there is no locations table at all"* — **was wrong**: it is
   `Warehouses`, a self-referencing tree that already carries `locationType`,
   `blocked`, `blockReason` and the maximum dimensions. See
   [locations.md](locations.md).
7. ~~**The discount basis**~~ — ✅ **closed 10-9-2026.** Blocked deliveries
   prints both discount columns and reads 0 % on every row, so it took a line
   typed by hand: quote 900003 printed **921,50**, and the discounts cascade.
   No code changed — `netPriceAfterDiscounts` already multiplied the two — but
   the same screenshot did expose a real rounding bug. See
   [discount-basis.md](discount-basis.md).

---

## Four exports arrived with the screenshots

7 293 rows, read out of the running Excel and kept in
`docs/reference-system/exports` (gitignored):

| File | Rows | What it settled |
|---|---|---|
| `warehouse-capacity.tsv` | 3 087 | `Remaining = Occupied − Ready` **exact on every row** |
| `receipts-full-view.tsv` | 3 088 | all 2 078 invoiced receipts carry a zero accrual |
| `receipts-per-day.tsv` | 1 008 | the accrual on 254 priced rows, to the cent |
| `nesting.tsv` | 10 | `Kg(p)` is **not** derived from the displayed density |

The verification harness now reads all of it, so the claims are pinned to the
reference's own figures rather than to my transcription of a screenshot.

Three things only the exports could have told us:

**`Expired` is a seventh receipt status.** Two rows of the 3 088 carry it, both
with a zero accrual. It was missing from the enum that had just been pushed;
added, and it is terminal like `invoiced` rather than a step further along.

**`Fetching` is ten jobs, not one.** The capacity export carries fifteen work
order types where the Warehouse workorders screen shows six, because
`Aanhalen` splits into Laser, Slijpen, Laser Folie, Knippen, Borstelen, UV
Folie, Blauwe Folie, Decoilen, Folie verwijderen and Duplo — one for one with
the processing options bought as service lines on a purchase order. Ten capacity
pools, not three. See [warehouse-capacity.md](warehouse-capacity.md).

**Receipts include returns.** 62 of the 3 088 rows have `Order type: Return`,
with positive weights, so a return comes back in through the same door the goods
went out of.

And a fourth, which is the export confirming the code rather than correcting it:
four of the 254 priced receipt rows hold values ending in exactly `,xx5` —
`67 100,855`, `4 405,135`, `2 610,745`, `2 848,105`. The screen prints them
rounded half-up. That is the same half-cent boundary `roundToCents` was written
for, met again in the reference's own stored data.

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
