# External processing — the metal we send out to be worked on

One export, 18-9-2026: **`Control Stock increase due to external processing`**,
**483 rows × 16 columns**, scratchpad `ext-processing-18sep.tsv`.

The screen existed in `apps/dashboard` before this capture, but it was built
against guesses. The export replaced three of them, and each was wrong in a way
that changed what the screen reported.

## 1. What the list actually is

Both legs of a round trip. Metal leaves as our stock, somebody else works on it,
and it comes back as our stock — **the processor never owns it**, which is why
both legs are stock movements rather than a sale followed by a purchase.

| | Rows |
| --- | --- |
| Positive (came back) | **316** |
| Negative (went out) | **167** |
| Total | **483** |

**The old query showed only the inbound half.** A control list that hides the
outbound leg cannot be reconciled against anything.

## 2. The GL account is a constant

`GLA# Stock Increase ext.edit.` and `GLA Stock Increase ext.edit.` are **`3100`
on all 483 rows** — both columns, no exceptions. This list is *defined* as what
landed on 3100, so the account is not a lookup and does not need a join. It is
the list's identity.

## 3. 🔴 It hangs off the PURCHASE order, not the sales order

**`Order` is an `IO4…` number on 483 of 483 rows.** Every single one is in the
purchase series. The processing is *bought*, so the purchase order is what
carries it — and the purchase order is also what names the processor.

The old query joined `Orders`, the sales table. It could therefore never show a
company at all, which is exactly why `Company code` and `Company` were rendered
as literal `—` placeholders in the table component.

147 distinct purchase orders across the 483 rows:

| Rows per order | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- |
| Orders | 89 | 19 | 10 | 6 | 6 | 8 |

## 4. Seven processors, and one of them is nearly all of it

| Processor | Rows |
| --- | --- |
| **Hego Production** | **455** |
| Metalfinish Group B.V. | 14 |
| Helaxa BVBA | 6 |
| Burger & Althoff GMBH | 2 |
| Hanigk & Bartosch Stahlservice GmbH | 2 |
| *(two more)* | 4 |

94 % of external processing goes to one company. Note these are **not** the
processors named in [batch-registration.md](batch-registration.md) (`Krogman
Metals`, `H. Schrijver`, JetLaser) — that screen's `Producer` column is a
different population, and the two have not been reconciled.

## 5. 🔴 Weight comes back. Value does not.

Across the **112 orders that have both an outbound and an inbound row**:

| | Median | Orders that lose |
| --- | --- | --- |
| **Kilo yield** (in ÷ out) | **0,998** | 57 of 112 |
| **Value ratio** (in ÷ out) | **0,759** | **72 of 112** |

The whole file nets to **−€ 146.964,39** on value against **+26.230,83 kg**.

So the metal is essentially all still there by weight, and roughly a quarter of
its book value is not. **That is what the control list is controlling.** It is
watching a loss, not a gain.

> ⚠️ This corrects a comment that had been sitting in `lib/enums.ts` since the
> warehouse work was done, which said the goods "came back worth more than they
> went out". The export says the opposite. Corrected 19-9-2026.

**35 orders have only inbound rows** — sent to the processor before this window
opened — and **0 have only outbound rows**, so nothing in the period was still
out at the processor when the export was taken.

## 6. What a row carries

`Product code` · `Description` · `Company code` · `Company` · `Financial year` ·
`Financial month` · `GLA# Stock Increase ext.edit.` ·
`GLA Stock Increase ext.edit.` · `Mutation date / time` · **`MutationQty (€)`** ·
**`MutationQty (StkU)`** · `StkU` · **`MutationQty (Kg)`** ·
`Revenue group number` · `Revenue group` · `Order`

- **Three measures of one movement** — euros, stock units and kilos — and they
  are not derivable from each other. The kilos are weighed; the euros are struck
  at the lot's valuation price at the moment it moved.
- `StkU` is `ST` on 376 rows and `KG` on 107.
- Four revenue groups only: `SS 304` (409), `SS 430` (57), `SS 316` (16),
  `SS 321` (1).
- 76 distinct products.
- Financial year `2025` on 475, `2026` on 8. Month 4 is the peak (212).

## 7. What changed in `apps/dashboard` (19-9-2026)

| Finding | What was done |
| --- | --- |
| The list watches external processing, not our own machines | The query filtered `production_output`. It now filters the two external-processing reasons |
| Both legs belong on the list | `external_processing_issue` **added** to `stockMovementReasons`; only the return leg existed |
| Every row names a purchase order | Join moved from `Orders` to `PurchaseOrders` |
| The processor is on that purchase order | `Company code` / `Company` now joined through `PurchaseOrders.supplierUuid`; they were hardcoded `—` |
| GL account is the constant `3100` | Rendered as the constant it is, in both columns |
| Three measures per movement | `quantityKg` and `valueEur` **added** to `StockMovements`; the table printed `mutationQty` twice under two wrong headings (`(p)` and `(a)`) |
| Signs carry meaning | All three measures signed by direction, outbound rows greyed |

## 8. What this export did *not* settle

- **Where the value goes.** The loss is visible but not attributed — there is no
  column saying whether it is scrap, a revaluation, or the processing fee being
  booked elsewhere.
- **Whether the processors here and the `Producer` names in batch registration
  are the same population.** They do not overlap in the two exports seen.
- **What triggers the outbound leg.** No column ties it to a sales order or a
  production plan, so why a particular lot was sent out is still unknown.
