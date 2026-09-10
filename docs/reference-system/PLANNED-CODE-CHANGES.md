# Code changes from the 9-9-2026 Logistics batch

Written while data collection was still running, then worked through. Every item
names the file, what it did, what it does now, and **the rows that prove it**.

Sources: [receipt-chain.md](receipt-chain.md) ·
[stock-on-location.md](stock-on-location.md) ·
[stock-mutations.md](stock-mutations.md) ·
[warehouse-and-production-workorders.md](warehouse-and-production-workorders.md)
· `exports/` (~71 000 rows).

**Verification:** `apps/dashboard/scripts/verify-logistics.ts` — **87 checks,
all passing**, of which 22 read the exports row by row rather than a retelling.

```
cd apps/dashboard
node ../../node_modules/.pnpm/tsx@4.22.4/node_modules/tsx/dist/cli.mjs scripts/verify-logistics.ts
```

---

# ✅ Applied

## 1. `Weight deviation` is a magnitude

**`src/lib/helpers.ts`** — `weightDeviationPercent` returned a **signed**
figure, so all **337** work order lines that came in _heavier_ than plan read
negative where the reference reads positive.

```ts
|Kg(p) − Kg(a)| / Kg(p) × 100      // 13 583 of 13 583 lines
```

The numerator takes an absolute value and the denominator does not — proved by
the single line planned at **−125 kg**, which prints `−176`, not `176`. Zero
planned now returns `0` rather than `null`, as the reference prints on all 27
such lines. Return type narrowed to `number`; the DTO and the table's `—`
fallback went with it, and the table now flags **any** deviation rather than
only a shortfall.

## 2. 🔴 Stock was valued by the piece — the six-place bug, third and fourth occurrence

**`warehouse-work-orders/actions.ts`** did `unitCost * quantity` with a
**per-tonne** price. Eighteen plates at € 2 158/TN were valued at **€ 38 844**
instead of **€ 101,66**. It sets `Stock.valuationEuro`, the cost every
downstream margin is computed against.

**`purchase-invoices/actions.ts`** did the same twice — once for the lot, once
for the journal entry.

All now go through `priceMeasureFor`:

```
Stock (€) = valuation price × the measure that price's own unit names
                                            2 115 / 2 115 lots, to the cent
```

⚠️ **`Stock.valuationPrice` stays a per-piece cost.** Eight `restateLotValue`
callers scale a lot down by `remaining × unitCost` after a partial issue, so the
line price is **converted** at creation rather than stored raw. The euro figure
matches the reference; the per-unit figure is expressed differently from the
reference's `Valuation price` + `PriceU` pair. Carrying the unit on the lot is a
separate change, not needed for the money to be right.

**The receipt also records a weight now.** `applyReceipt` never set
`quantityKg`, so lots made by a work order weighed nothing for ever after.

## 3. `amountForWeight` could only read three of the ten units

It took a weight and a unit, so a line priced `ST` was valued off its _weight_ —
out by whatever the piece happens to weigh. It now takes the rest of the line
and delegates to `priceMeasureFor`, falling back to exactly its old behaviour
when the caller has no quantity to give.

Updated at four call sites: `purchase-orders`, `purchase-quotes` (×2),
`purchase-return-orders`. **`purchase-requests` is left alone** — no price unit
travels with a request, which its own comment already says.

## 4. 🔴 The lot was created twice

Both `purchase-invoices/actions.ts` and `warehouse-work-orders/actions.ts`
inserted into `Stock` for the same goods. Receive against an `Unloading`, then
invoice, and the warehouse held the same steel twice.

**A read-only check first** — `scripts/check-duplicate-lots.mjs`:

```
Stock lots                                        549
  ... with a purchase order line                    5
WarehouseWorkOrderLines of an approved unloading    0
purchase order lines carrying >1 lot                0
lines both invoiced and unloaded                    0
```

So the duplication was in the code only; no data repair needed. **But zero
approved unloadings exist**, which means every purchase today still receives
through the invoice. Deleting that insert outright would have stopped stock
being created at all.

So the invoice now **links** the lot an unloading already made, and only creates
one when there is none. Duplication is impossible; nothing regresses.

## 5. 🔴 Weight comes from the **rolled** thickness

**`Products.theoreticalThickness`** added, and `theoreticalPieceWeightKg` now
prefers it.

A plate is rolled a little off the size it is sold as — 1 mm arrives at
**1,019 mm**, 2 mm at **2,058** — and **319 of 2 187 lots** have the two
differing. It is the rolled figure every weight is computed from:

| Thickness used | `kg = density × volume × qty` |
| -------------- | ----------------------------- |
| nominal        | 1 819 / 1 929                 |
| **rolled**     | **1 932 / 1 932**             |

⚠️ **This corrected me.** I had written that the rule was exact at 7 850 and off
by ±3 % on aluminium, concluding aluminium's density was nominal. It was not —
I had used the nominal thickness, and aluminium is milled furthest from nominal,
which made my own error look like a property of the material. Every density in
the file is real. It also answers the old §8 question "aluminium weight — where
from?", which had been filed as blocked on data.

## 6. Columns the reference has and we did not

All additive and nullable; `pnpm db:push` applied them with no data loss and
**549 lots intact**.

| Table                   | Added                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `Products`              | `theoretical_thickness`                                                                                                                 |
| `Stock`                 | `order_item_uuid` · `plate_number` · `internal_bundle`                                                                                  |
| `StockMovements`        | `warehouse_work_order_line_uuid` · `production_work_order_line_uuid` · `transport_work_order_uuid`                                      |
| `PurchaseLineReceivals` | `charge` · `internal_charge` · `plate_number` · `document_obligation_waived` · `pre_reported_by` · `pre_notify_code` · `bill_of_lading` |

**`StockMovements` could not record what caused a movement.** Its four existing
links answer _which order is this about_; these answer _what moved it_. The
cause is polymorphic — goods arrive on a work order, but **4 189 of 5 043
customer deliveries leave on a `6xxxxx` trip** against 854 on a work order.

**A lot's origin is more often a sales order than a purchase** — 1 371 of 2 247
against 782 — because most of the warehouse is remnants. Hence
`Stock.order_item_uuid`.

⚠️ It has **no foreign key**, unlike its purchase-side twin: `order-items.ts`
already imports `stock.ts`, so importing `OrderItems` back closes a module cycle
and Drizzle's inference collapses to `any` across every query touching stock.
The constraint was pushed, found to break `tsc`, and reverted; schema and
database now agree.

**A reception's lot identity** was keyed nowhere, though the work order lines
already held all three parts of it. And goods-in can be **held until its mill
certificate is attached** — the `Partijregistratie` dialogue offers exactly one
setting, a per-reception waiver, which is the mechanism behind the `documents`
block reason.

---

# 🔴 Two things in this plan were simply wrong

Recorded rather than deleted, because both were written confidently.

## "There is no locations table" — **false**

There is. It is called **`Warehouses`**, and it is a self-referencing tree
(`parentUuid` + `fk_warehouses_parent`) already carrying `locationType`,
`blocked`, `blockReason`, `blockedForOptimization`, `limitedDimensions`,
`minLength`/`maxLength`/`maxWidth`/`maxWeight`, `pickingSequence`,
`callOffLocation` and some sixty settings besides. `Stock.locationUuid` has had
an FK to it all along (`fk_stock_location`).

It matches the reference's `Toon locatie` screen almost field for field. My grep
missed it because nothing in it is named "location".

**So nothing was built here, and nothing needed to be.**

## "Add a `locationTypes` enum" — **already existed**

`warehouseLocationTypes` has 11 values with a `WAREHOUSE_LOCATION_TYPE_META`
table behind them, and **all eight types in the export map onto it**:
`Pick → pick`, `Laad → load`, `Bulk → bulk`, `Bewerker → processing`,
`Schroot → scrap`, `Productie → production`, `Afroep → call_off`,
`Afhaal → collection`.

The block rule is therefore verified rather than added — three harness cases
assert that all 36 `Bewerker` lots and all 12 `Afroep` lots are blocked while all
1 934 `Pick` lots are free.

✅ **Since resolved — see §10.** Our META gave `production`, `load`,
`collection` and `scrap` a block reason the reference does not, and that is now
corrected. `sellable: false` was left alone on all four, because it answers a
different question.

---

# 🟡 Noted, deliberately not applied

**`workOrderStatuses` has a fourth value, `ready`, that never occurs** in 13 610
exported lines — only `Approved` (13 305), `Released` (179), `New` (126).
Narrowing a `mysqlEnum` is the one case where drizzle's data-loss warning is
real, and absence over five live months is not proof a transient state does not
exist.

**Three features exist in the reference and are switched off there**: transport
costing (`Driver`/`Km`/`Cost price` empty on all 438 trips), `Resource` on work
orders (`-leeg-` on all 13 610), `Pickvolgorde` (0 on all 1 940 locations). Do
not build them.

**`Deviations in count lists`** returned zero rows in both views, probably
because its second date filter excludes count orders never reported as
completed. Its 22 columns describe a stock-count correction, which is what our
`count_correction` movement reason has been waiting for. `FSP` / `FSP U.` on
that screen are unexplained and have not been guessed at.

---

# ✅ The rest, done

## 7. The `.toFixed(2)` sweep — 178 money sites now `moneyString`

`toFixed(2)` rounds the _binary approximation_, so an exact half-cent lands a
cent low: € 1 180,395 writes as `1180.39` where the reference prints
**€ 1 180,40**. `moneyString` rounds the decimal.

**178 sites converted** across 29 files — 151 by identifier, 17 parenthesised
arithmetic (`(amount - cost)`, `(totalExclVat + vatAmount)`, `(-inclVat)`), 10
multi-line calls found by walking back over balanced parentheses rather than by
regex.

**47 `.toFixed(2)` remain, all deliberately.** Every one is a weight
(`weightKg`, `kgPlanned`, `kgActual`, `quantityKg`, `totalWeightKg`), a count,
or a percentage (`profitMargin`, `markup` — the latter is `decimal(6,2)`, a
percentage, not money). `moneyString` on a kilo would read as money and be
wrong to anyone maintaining it.

## 8. Every movement now names what moved it

The columns added in §6 were declared and unwritten. Now:

| Path                                     | Stamps                         |
| ---------------------------------------- | ------------------------------ |
| `applyReceipt` — goods in                | the warehouse work order line  |
| `applyIssue` — pick-up, scrapping        | the warehouse work order line  |
| `applyMove` — relocation, both halves    | the warehouse work order line  |
| `applyProductionOutput` — finished goods | the production work order line |
| `deliverOrderItem`                       | the trip, when one is given    |

🚫 **`applyCount` deliberately stamps nothing.** A count difference is a
`Correctie`, and not one of the reference's 2 978 corrections names the document
behind it — the books were adjusted, nothing was carried anywhere. Same for a
cut's fetch and its offcuts: `ReportCutFetchedInput` carries no line because a
bed mixes lots for the whole run.

⚠️ **`deliverOrderItem` takes an optional trip and will usually be given none**,
which is a real difference from the reference rather than an oversight. There a
lorry takes several orders at once, so the **trip** is the unit of despatch —
4 189 of 5 043 customer deliveries name one. Our screen delivers a line at a
time. Planning deliveries onto trips is a feature, not a wiring job; the column
is ready for it.

## 9. Sentinels, in one place

`isSentinelDate` (`1-1-0001` / `31-12-9999`) and `COIL_LENGTH_SENTINEL`
(`999999`) already existed. Added beside them:

- **`normaliseCharge`** — `nvt` (145 lots), `-` (33), `ntv` (32, the same
  abbreviation transposed and typed three dozen times) and blank all mean _no
  heat number_. Wired into both paths that put a charge on a lot, so nothing
  becomes traceable to a heat called "ntv".
- **`TEXT_FILTER_UPPER_BOUND_SENTINEL`** — `zzzzzzzzzzzzzzz`, a real value being
  compared against, which is why clearing that box returns nothing.
- **`isEmptySelection`** — `-empty-` and its untranslated twin `-leeg-`.

## 10. The block metadata, corrected against 2 247 lots

`WAREHOUSE_LOCATION_TYPE_META` gave `production`, `load`, `collection` and
`scrap` a `blockReason`. The reference disagrees with all four:

```
Bewerker  36 of 36 blocked      Afroep    12 of 12 blocked
Productie  1 of 23              Laad       0 of 168
Schroot    0 of 27              Afhaal     0 of 2
```

**Only two types block by their nature** — the metal is off the premises, or it
belongs to a customer's call-off. `sellable: false` is untouched on all four:
metal staged for loading is not free to sell _and_ not blocked, and conflating
those two questions was the error.

## 11. `Fetching` capacity is per destination

`WarehouseCapacity.toLocationUuid` added. `fetching` is one type here and **ten
jobs** there — `Aanhalen` splits into Laser (284), Slijpen (266), Laser Folie
(152), Knippen (56), Borstelen (32), UV Folie (25), Blauwe Folie (23), Decoilen
(11), Folie verwijderen (4) and Duplo (2).

The discriminator is the **destination**, not a machine: `Machines` has no
detail screen, and `Decoiler`, `Laser 1`, `Laser 2` and `Knip` are themselves
locations under `Productie`. Null on every type that needs no splitting.

---

# ⚪ Cannot be done here

**The discount basis.** One quote line — gross `1000`, line discount `5`, group
discount `3` — and the `Net Price` it prints. `950` means both come off the
gross; `921,50` means the second comes off what the first left.

`netPriceAfterDiscounts` currently multiplies the two, and no export settles it:
Blocked deliveries prints both discount columns and reads `0 %` on every row.
**This needs one screenshot from the reference and nothing else.**
