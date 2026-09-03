# Order advice

`Overviews → Purchase → Order advice`. Ours: `/order-advice`.

What to buy. For every stock product it compares the position against a stocking
policy and advises a purchase quantity.

**Filters**: `Product code` (from / to), `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product · Supplier ·
Purchase… · Request quote… · Current purchase orders/quotes.
**View open when captured**: `besteladvies printver…`.

## Columns — matched

All 18, in the reference system's own order. Names below are its headings, taken
from the tooltip where the heading is truncated on screen.

| # | Reference heading | Our field | Where ours gets it |
|---|---|---|---|
| 1 | Product code | `productCode` | `Products.productCode` |
| 2 | Description | `description` | `Products.name` |
| 3 | Main group | `mainGroup` | `ProductGroups.name` |
| 4 | Stock (Pur.U.) | `stockPurchaseUnit` | technical kg → purchase unit |
| 5 | Reserved | `reservedKg` | `Stock.quantityKg` pro-rated by `reservedQuantity / quantity` |
| 6 | Available (Kg) | `availableKg` | technical kg − reserved kg |
| 7 | To be received short term (Kg) | `toBeReceivedShortTermKg` | open purchase lines, `kgPurchased` pro-rated by what is still owed **and not reserved** |
| 8 | Econ. stock (Kg) | `economicStockKg` | available + to be received |
| 9 | Avg. Monthly consumption last year (Kg) | `avgMonthlyConsumptionLastYearKg` | invoiced `weightKg`, trailing 12 months ÷ 12 |
| 10 | Supplier | `supplierName` | preferred `ProductGroupSuppliers` → `Companies.companyName` |
| 11 | Consumption previous month (Kg) | `consumptionPreviousMonthKg` | invoiced `weightKg`, previous calendar month |
| 12 | Avg. Monthly consumption last 3 years (Kg) | `avgMonthlyConsumptionLast3YearsKg` | invoiced `weightKg`, trailing 36 months ÷ 36 |
| 13 | Advice Weight rounded | `adviceWeightRounded` | `max(0, maxStockKg − economicStockKg)` when below min, rounded to whole kg |
| 14 | Economic Coverage | `economicCoverage` | econ. stock ÷ avg monthly (last year) |
| 15 | Technical Coverage | `technicalCoverage` | technical ÷ avg monthly (last year) |
| 16 | Stock product | `stockProduct` | `Products.stockProduct` |
| 17 | Advice Qty. (Pur.U.) | `adviceQtyPurchaseUnit` | advice weight → purchase unit |
| 18 | OrderQty (Pur.U.) | `orderQtyPurchaseUnit` | advice qty rounded up to order series / MOQ |

**Dropped from ours**: `Min level` and `Max level` were columns we invented. They
are still computed — the advice needs them — but they are not shown, because the
reference system does not show them.

**The chain**, so the three advice columns cannot drift apart: the advice is
struck in kilos, rounded (→ 13), converted to the purchase unit (→ 17), then
rounded up to the supplier's series and minimum (→ 18).

## Policy

A product's own screen reads *"Min. stock: 1 times the avg. monthly consumption;
Max. stock: 3 times the avg. monthly consumption"*, which matches our
`ProductGroups.minStockMode = multiplier` model. Nothing is advised until the
economic stock has actually fallen through the minimum; then it is topped up to
the maximum.

## 🔴 Open questions

Each one is a figure that is currently a defensible guess. What ours does today
is stated so a wrong answer is a one-line change.

**1. Answered — "short term" is not a date horizon at all. It excludes the
reserved portion of an open PO line.**
Checked on `PW304L0525125` (Hot-rolled plate 304L): its one open PO line
(401010/10) has `Qty(p)=5`, `Reserv...=2`, `Kg still to be received=613,3`.
Order advice shows `To be re...=367,98`. `613,3 × (5−2)/5 = 367,98` — exact.
So the formula is `kgPurchased × (quantity − qtyReceived − reservedQty) /
quantity`. **Implemented** — `order-advice/actions.ts` now subtracts
`reservedQty` (and coalesces both subtrahends, since either can be NULL on an
older row). `PurchaseOrderItems.reservedQty` already existed, so no schema
change was needed.

This also reframes the sibling column on
[StockOn advice](stockon-advice.md): `To be received short term (Pur.U.)` is
very likely this same unreserved-remainder figure in the purchase unit, and
`To be received long term (Pur.U.)` a separate, further-out figure (future
mill production not yet on a firm PO) — worth confirming once that screen is
tackled.

**2. "Avg. Monthly consumption last year" — trailing 12 months, or last calendar year?**
Ours uses trailing 12 months ÷ 12. "Last year" could mean the previous calendar
year ÷ 12, which gives a different number for most of the year.
→ *In the old system:* find a product with steady sales, note the figure, and
compare it against its invoiced weight for the previous calendar year ÷ 12 and
for the trailing 12 months ÷ 12. Whichever matches is the definition.

**3. "Consumption previous month" — previous calendar month, or trailing 30 days?**
Ours uses the previous calendar month.
→ *In the old system:* same method. Pick a product invoiced early this month; a
calendar-month figure will ignore those invoices, a trailing-30-day one will not.

**4. "Avg. Monthly consumption last 3 years" — 36 months ÷ 36?**
Ours does that. It could also be the mean of three separate yearly averages,
which differs when a product's history is shorter than three years.
→ *In the old system:* find a product first sold ~18 months ago. Dividing by 36
halves the figure; dividing by months-with-history does not.

**5. What counts as "consumption"?**
Ours counts **invoiced** lines. It could equally be delivered lines, or stock
movements out to a customer — and `Stock mutations` does record
`Levering / To customer`, so a movement-based definition is plausible. Every
consumption column, both coverages and the whole advice depend on this.
→ *In the old system:* find a product delivered but not yet invoiced. If its
consumption already includes that delivery, it is movement- or delivery-based,
not invoice-based.

**6. Coverage — in what unit, and against which consumption?**
Ours reports months of cover against the last-year average. The footer showed
`AVR=1,1` and `AVR=1,49`, which is consistent with months but also with a ratio
against the minimum stock level.
→ *In the old system:* take one line and read off its `Econ. stock (Kg)` and its
three consumption columns. If Economic Coverage = econ. stock ÷ avg-monthly-last-year,
ours is right; if not, try the other two consumption columns, then min stock.

**7. "Advice Weight rounded" — rounded to what?**
Ours rounds to whole kilograms. It could be rounded to the order series, or to a
per-product rounding step.
→ *In the old system:* find a line with a non-zero advice and compare it against
that product's order series and minimum order quantity. If the advice weight is
already a multiple of the series, the rounding is to the series, not to 1 kg.

**8. Answered — which units can "Pur.U." be?**
This screen showed a product bought by the tonne (`Available (Kg) 28,00` →
`Stock (Pur.U.) 0,03`) while our `purchasingUnits` held only `HS` and `ST`, so
the three Pur.U. columns came back empty for any such product.

The dropdown's actual option list (read off product
`582004002/06`, Stainless steel 304 square tube):

| Code | Meaning |
|---|---|
| `HK` | One hundred kilograms |
| `HM` | One hundred meters |
| `HS` | One hundred pieces |
| `KG` | Kilogram |
| `M1` | Meter |
| `MM` | Millimeter |
| `ST` | Pieces |
| `TN` | Tonnage |

Eight values, not two — and note it is exactly `salesUnitOptions` minus
`M2`, which the codebase already carried in full, with these same English
labels. A square metre prices a coated sheet; it does not order one.

**Implemented** — `purchasingUnits` widened to all eight, `PURCHASING_UNIT_LABELS`
filled in from the reference's own wording, and the 17 `enum('HS','ST')`
columns in the database widened to match. Widening an enum keeps every stored
value legal, so no data moved.

This also **confirms the Stock (Pur.U.) formula**, not just the unit list. The
same product's Order advice row reads `Stoch (Pur.U.) 7,00` against
`Available (Kg) 105,00` while its own Purchasing unit is `ST` — and
`105 ÷ 7 = 15` kg/piece, matching `convertKgToUnit(kg, "ST", weightPerPiece)`
exactly (`kg / weightPerPiece`). And the earlier `Available (Kg) 28,00` →
`Stock (Pur.U.) 0,03` example is consistent with a `TN` product:
`28 ÷ 1000 = 0,028`, which rounds to `0,03` — confirming the `TN` branch
(`kg / 1000`) too.

`convertKgToUnit` now covers all eight. Two factors carry the list:
`Products.theoreticalWeight` (kg per piece) answers `ST`/`HS`, and
`Products.weightPerM1` (kg per running metre) answers `M1`/`HM`/`MM`; the
hundred-codes are those divided by a hundred, and `M2` still returns null
because no product records a weight per square metre.

## Smaller uncertainties

- **`Reserved` has no unit suffix** and the heading is truncated. Ours assumes
  kilograms because both neighbours are kg. Widen the column in the old system
  to read the full heading.
- **Row 1 of the capture had an empty `Description`** (product `1010006/06`),
  so a blank description is legitimate data, not a join failure.
