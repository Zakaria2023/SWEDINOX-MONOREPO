# StockOn advice

`Overviews → Purchase → StockOn advice`. Ours: not yet built.

Same toolbar family as [Order advice](order-advice.md) (Show Product · Supplier ·
Purchase… · Request quote… · Current purchase orders/quotes), and several of its
columns reappear here — `Techn. Stk.`, `Reserved`, `To be received short/long
term (Pur.U.)`. Reads like the same stocking-policy engine as Order advice, but
exposing every parameter that drives it (review time, lead time, priorities)
rather than just the resulting advice. **This relationship is the central open
question** — see below.

**Filters**: `Product code` (from / u/i), `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product · Supplier ·
Purchase… · Request quote… · Current purchase orders/quotes.
**View open when captured**: none selected (blank).
**Grid was empty**, so no example values were readable.

## Columns — captured, not yet matched

| # | Reference heading | Notes |
|---|---|---|
| 1 | Main group | |
| 2 | Product group | same pairing as [sold-products-not-advised.md](sold-products-not-advised.md) |
| 3 | Product code | |
| 4 | Product | |
| 5 | Techn. Stk. | technical stock — same figure Order advice uses |
| 6 | Reserved | |
| 7 | Stock U. | the stock unit, as a column |
| 8 | Order Level (Kg. or Psc.) | tooltip confirmed |
| 9 | To order (Kg. or Psc.) | |
| 10 | To order | no unit suffix — see question 2 |
| 11 | Order Level | no unit suffix — see question 2 |
| 12 | Available Stk. | |
| 13 | Techn. Stk. + To receive | tooltip confirmed |
| 14 | Stock - Order level | |
| 15 | Purchase U. | the purchase unit, as a column |
| 16 | % Difference | see question 9 |
| 17 | Order now? | |
| 18 | Determined by StockOp | tooltip confirmed — see question 4 |
| 19 | Preferred supplier | |
| 20 | 1e productie/wals da... | **untranslated Dutch, truncated** — see question 3 |
| 21 | productie/wals door | **untranslated Dutch** — see question 3 |
| 22 | To be received long term (Pur.U.) | tooltip confirmed |
| 23 | To be received short term (Pur.U.) | tooltip confirmed |
| 24 | Review time (days) | |
| 25 | Lead time (days) | |
| 26 | Lead time method | see question 6 |
| 27 | Evaluate/decide today? | |
| 28 | Avg. Consumption/day | tooltip confirmed |
| 29 | Avg. Consumption during L + R | tooltip confirmed — "Lead time + Review time" is the likely expansion |
| 30 | Number of days stk. | tooltip confirmed |
| 31 | 1st current PO | |
| 32 | 1st PO reception | |
| 33 | Working days until 1st receipt | |
| 34 | Priority 1 | see question 8 |
| 35 | Priority 2 | see question 8 |

## 🔴 What is needed before this can be built

**1. Is this the same policy engine as Order advice, exposed in full?**
Both screens share the toolbar, both carry `Techn. Stk.`, `Reserved`, and both
`To be received` columns. If StockOn advice is Order advice's underlying
calculation with every parameter shown, our `ProductGroups` stocking-policy
fields are the right place to add `Review time`, `Lead time`, and `Lead time
method` rather than building a second, parallel advice engine.
→ *In the old system:* pick one product that appears on both screens and check
whether `Order advice`'s advice figure can be reconstructed from this screen's
columns (`Order Level`, `Techn. Stk. + To receive`, lead time, review time).

**2. Two pairs of near-duplicate columns.**
`Order Level (Kg. or Psc.)` at position 8 and `Order Level` at position 11;
`To order (Kg. or Psc.)` at position 9 and `To order` at position 10. Either the
grid shows both a converted (Kg-or-pieces) and a native-unit version of the same
figure, side by side — matching the Kg-vs-Pur.U. split Order advice already
has — or these are genuinely different values.
→ *In the old system:* open a row with data and read all four columns together.
If `Order Level (Kg. or Psc.)` and `Order Level` differ only by unit conversion,
it is the same pattern as Order advice; if the numbers are unrelated, they are
different concepts.

**3. Two untranslated Dutch columns, both truncated.**
`1e productie/wals da...` and `productie/wals door` — "productie/wals" is
"production/rolling". These look tied to mill scheduling: when the material can
next be produced, and which mill produces it.
→ *In the old system:* widen both columns to read the full headings, and read
their tooltips if the grid offers them.

**4. `Determined by StockOp` — what does "StockOp" mean, and what are the values?**
Likely short for a stock-optimization method or module name, naming which
calculation set the order level.
→ *In the old system:* widen the column with data on screen to list its values,
and check a product's own screen for where "StockOp" is configured or chosen.

**5. `Review time (days)` and `Lead time (days)` — do they mean the standard
inventory-theory definitions?**
Review time = how often the reorder decision is revisited; lead time = supplier
delivery time. Both feed the reorder-point formula in the textbook sense, and
`Avg. Consumption during L + R` (Lead + Review) is consistent with that.
→ *In the old system:* open a product's stocking-policy setup and read the
labels next to these two fields directly.

**6. `Lead time method` — what are its options?**
→ *In the old system:* open the dropdown on a product's setup screen (or widen
this column across rows) and list every value.

**7. `Evaluate/decide today?` — what changes when it is off?**
→ *In the old system:* find a row where it is unticked and compare how that
product is treated versus a ticked one (does it get skipped by an advice run?).

**8. `Priority 1` and `Priority 2` — numbers, dates, or supplier references?**
→ *In the old system:* read both columns across several rows with data and note
their format.

**9. `% Difference` — between which two columns?**
→ *In the old system:* read one row's `Techn. Stk. + To receive`, `Order Level`,
and `% Difference` together and check whether the percentage is
`(Techn. Stk. + To receive − Order Level) / Order Level`.

**10. Same product-hierarchy question as everywhere else** — `Main group` +
`Product group` here, tracked centrally in the
[README](../README.md#the-one-question-that-unblocks-the-most).

## Where StockOp is configured — and whether it is used at all

A product's *Stock policy* panel carries the whole StockOp parameter set, which
answers most of what this screen's columns were asking:

```
StockOp Parameters
  Lead time Method:                Manually
  Lead time (L):                   0 days
  Review period (R):               0 days
  Order Costs (purchasing side) A1: 0,00 €/order
  Order Costs (Logistics) A2:      0,00 €/order
  Order series:                    0 Kg
  Minimum order qty.:              0 Kg
  [Adopt of preferred supplier]

Parameters for StockOp simulation version
  Capital cost (r1):     0,00 €/€/year
  Warehouse cost (r2):   0,0000 €/Kg/year
  B (% per u. stockout): 0%   (two of these)
  Handling:              0,0000 €/Kg
  Transport:             0,0000 €/Kg
  [Use product type parameters from easy2config]

StockOn order parameters
  ☐ Use StockOp for this product?
  "StockOp parameters zijn nog nooit berekend."

StockOn ordering/evaluation
  ☑ Monday ☑ Tuesday ☑ Wednesday ☑ Thursday ☑ Friday

PAC-classification: [empty]
Order advice code:  [empty]
```

### What this settles

- **`Lead time` and `Review time` are in days**, labelled `(L)` and `(R)` —
  the classic periodic-review notation.
- **`Lead time Method`** is a dropdown, and `Manually` is one of its values.
- **"Determined by StockOp"** on the grid is this screen's
  `Use StockOp for this product?` checkbox.
- **"Evaluate/decide today?"** is these five weekday checkboxes. A product is
  reconsidered only on its ticked days, so the column is not a property of the
  product — it is *today* tested against that set.
- **The order series is held twice, in different units.** The *Purchase* panel
  has `Order series: 0 ST`; this panel has `Order series: 0 Kg`. They are not
  the same field, and ours reads only one of them.

### The scope question this raises

The parameter list — order costs, capital cost, warehouse cost, a stockout
penalty, handling and transport per kilo — is a full inventory-optimisation
model, the machinery behind an economic order quantity and a reorder level. It
is a genuinely different engine from Order advice, which is just a min/max
policy against average consumption.

**But on the product inspected it is switched off and has never been run:**
`Use StockOp for this product?` is unticked, every parameter is zero, and the
system says in as many words that the parameters *have never been calculated*.

If that holds across the catalogue, StockOn advice is dormant in this business
— and like [Import purchase invoices](import-purchase-invoices.md), it may not
need building at all. That is worth establishing before any of the column
questions on this page are worth answering.
