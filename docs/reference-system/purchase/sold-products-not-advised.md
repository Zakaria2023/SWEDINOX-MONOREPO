# Sold products not on the order recommendation

`Overviews → Purchase → Sold products not on the order recommendation`.
Ours: `/sold-products-not-advised`.

The complement of [Order advice](order-advice.md): products that **sold** in a
period but which the advice does not cover — so a buyer can see demand the
stocking policy is silent about. Typically a non-stock or non-standard product
somebody keeps selling.

**Filters**: `Product code` (from / to), `Invoice date` (from / to — defaulted to
today on both sides in the capture), `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product · Purchase
lines · Warehouse workorders · Orders and Quotes · Production workorders.
**View open when captured**: none selected (blank).
**Grid was empty** in the capture, so no example values were readable.

## Columns — captured, not yet matched

| # | Reference heading | Notes |
|---|---|---|
| 1 | Main group | the grid was sorted on this |
| 2 | Product group | a second level below main group — ours joins only one |
| 3 | Product code | |
| 4 | Description | |
| 5 | Stock product | checkbox |
| 6 | Standard product | checkbox — tooltip confirmed |
| 7 | Avg. Monthly consumption last year (Stk.U.) | tooltip confirmed — **stock unit here, not Kg** |
| 8 | Revenue | money |
| 9 | Sales | money or quantity — unknown |
| 10 | Stock (Stk.U.) | |
| 11 | Available (StkU) | |
| 12 | Stock U. | the unit itself, as a column |
| 13 | PAC-Code | tooltip confirmed |

## 🔴 What is needed before this can be built

**1. Two grouping levels, not one.**
This screen shows `Main group` *and* `Product group`. Ours joins `ProductGroups`
once and calls it the main group. Are these two levels of one hierarchy — a
parent group and its child — or two separate fields on the product?
→ *In the old system:* open a product and look at its group fields. If there is
one field whose value has a parent, it is a hierarchy; if there are two fields,
we need a second column.

**2. What "not on the order recommendation" actually excludes.**
The obvious reading is "sold in the period, but absent from Order advice" — and
Order advice only lists `Stock product = true`. But this screen has a
`Stock product` column, which implies some rows *are* stock products, so the
exclusion must be something else or something more.
→ *In the old system:* press `Show Data` with a wide invoice-date range, then
compare the product codes here against the codes on `Order advice`. If nothing
overlaps, the rule is simply set difference. If some overlap, the rule is
narrower and we need to know what it is.

**3. "Standard product" — where does it live?**
A product's own screen shows a greyed `Standard product` checkbox next to
`Stock product`, so the field exists; ours has `Products.stockProduct` but needs
checking for a standard-product equivalent.
→ *In the old system:* open a product and find the field, then note whether it
is editable or derived.

**4. `Revenue` vs `Sales` — what is the difference?**
Two adjacent money-looking columns. Revenue is probably invoiced value; Sales
could be ordered value, or a quantity, or the count of orders.
→ *In the old system:* widen both columns on a row with data and read their
values against that product's invoice history. If Sales carries a unit or a
count, it is not money.

**5. `PAC-Code` — what is it?**
Appears nowhere else that has been captured. It may be a purchasing
classification, a customs/commodity code, or a supplier's article code.
→ *In the old system:* open a product and search its screens for the field, or
right-click the column for a description. Its dropdown or format will say what
it is.

**6. `Stock U.` as a column.**
The stock unit shown as data rather than as a suffix, because this grid mixes
products stocked in different units. Ours has `Products.stockUnit`, so this is
just a column to add.

**7. Which period the consumption column uses.**
It says "last year", same as Order advice — so whatever answer question 2 in
[order-advice.md](order-advice.md#-open-questions) gets applies here too, except
it is counted in the **stock unit** rather than kilos.
