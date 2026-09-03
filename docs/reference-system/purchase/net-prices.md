# Net prices

`Overviews → Purchase → Net prices`. Ours: not yet built.

Contract pricing — what a supplier has agreed to charge for a product, valid
between dates, possibly tiered by quantity.

**Filters**: `Contract code` (from / u/i), `Contract valid between` (from / u/i —
defaulted to today on both sides in the capture), `Company code` (from / u/i),
`Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product · Show Company ·
Show Contract · Purchase lines · Production workorders.
**View open when captured**: none selected (blank).
**Grid was empty**, so no example values were readable.

## Columns — captured, not yet matched

| # | Reference heading | Notes |
|---|---|---|
| 1 | Contract code | |
| 2 | Product code | |
| 3 | Product no. (old) | a legacy code carried alongside the current one |
| 4 | Product | the description |
| 5 | Group product | checkbox — see question 2 |
| 6 | Stock product | checkbox |
| 7 | Standard product | checkbox — tooltip confirmed |
| 8 | Main group | |
| 9 | Subgroup | third screen to show this pairing — see [README](../README.md#the-one-question-that-unblocks-the-most) |
| 10 | Preferred supplier | |
| 11 | Suppliers product no. | the supplier's own article code |
| 12 | Net price | |
| 13 | Net priceU | the price's unit, as a column |
| 14 | Valid from | the price row's own validity, not the contract filter above |
| 15 | Valid u/i | |
| 16 | FromQty | the quantity break this price applies from |
| 17 | FromQtyU | the unit `FromQty` is counted in |

`Group product`, `Stock product`, `Standard product` sit together as three
adjacent checkboxes, the same trio a product's own screen shows.

## 🔴 What is needed before this can be built

**1. `Show Contract` — is there a Contract entity we don't have?**
A dedicated toolbar button to open a contract, plus a `Contract code` filter,
suggests a real header record (supplier, validity, terms) that these price rows
hang off — not just a code string on the price row itself.
→ *In the old system:* select a net price row and click `Show Contract`. List
every field the contract screen shows.

**2. `Group product` — what does this checkbox mean?**
Unlike `Stock product` and `Standard product`, which we already have a sense of,
this one is new. It may mark a product that represents a whole group for
ordering purposes rather than a single item.
→ *In the old system:* open a product with `Group product` ticked and see what
is different about it — extra fields, child products, anything.

**3. Quantity-tiered pricing — one row per tier?**
`FromQty` reads like a price break (e.g. cheaper above 1000 kg). If so, the same
product/contract pair should appear more than once, one row per tier.
→ *In the old system:* find a product with more than one net price row and check
whether `FromQty` differs between them.

**4. Row validity vs. contract validity — can a price be narrower?**
The filter has its own `Contract valid between`, and each row has its own
`Valid from` / `Valid u/i`. If a price's own window sits inside the contract's,
they are independent fields; if they always match, one may be derived from the
other.
→ *In the old system:* open a contract and compare its own validity dates
against the `Valid from`/`Valid u/i` on each of its price rows.

**5. `Net priceU` — which units appear here?**
Same pattern as `PriceU` on Purchase quotes.
→ *In the old system:* widen the column across several rows and list every value
it takes.

**6. `Product no. (old)` — from a prior system, or a superseded internal code?**
→ *In the old system:* open a product carrying this value and check whether it
is described anywhere as a migration artifact (e.g. a "legacy code" label) or as
an ordinary alternate code still in active use.
