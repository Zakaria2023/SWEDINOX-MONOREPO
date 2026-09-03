# Purchase orders and quotes

`Overviews → Purchase → Purchase orders and quotes`. Ours: not yet built as a
combined screen (we have separate `PurchaseOrders` and quote data).

One row per purchase order **or** quote — a single unified list of both
document types, not two screens. `Order type` is the column that tells them
apart, and several columns only make sense for one type or the other (`Quote
date`/`Valid u/i` for quotes, `Delivery date` for orders).

**Filters**: `Creation date` (from / u/i — defaulted to today in the capture),
`Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Company · Show… ·
Purchase lines · Warehouse workorders · Orders and Quotes · Production
workorders.
**View open when captured**: none selected (blank).
**Grid was empty**, so no example values were readable.

## Columns — captured, not yet matched

| # | Reference heading | Notes |
|---|---|---|
| 1 | Creation date | tooltip confirmed |
| 2 | Year (Creation Date) | tooltip confirmed |
| 3 | Month (Creation Date) | tooltip confirmed |
| 4 | Time frame | see question 4 |
| 5 | Purchase order/Requests | tooltip confirmed — the order **or** quote number, per row type |
| 6 | Initials | the purchaser's initials |
| 7 | Purchaser | |
| 8 | Status | see question 3 |
| 9 | Converted from/to | see question 2 |
| 10 | Lines | line count |
| 11 | Weight (kg) | header rollup — likely summed from lines |
| 12 | Revenue | header rollup |
| 13 | Supplier | |
| 14 | Customer code | see question 8 — unexpected on a purchase screen |
| 15 | Delivery date | order rows |
| 16 | Order type | the field this whole screen keys off |
| 17 | Expiration reason | quote rows — same enum as [Purchase quotes](purchase-quotes.md#-what-is-needed-before-this-can-be-built) question 1 |
| 18 | Quote date | quote rows |
| 19 | Internal Text | |
| 20 | Consignment | tooltip pattern matches [Purchase quotes](purchase-quotes.md) column 23 |
| 21 | Send | see question 5 |
| 22 | Must be sent | see question 5 |
| 23 | Order method | see question 5 |
| 24 | Deliberately not sent | tooltip confirmed — see question 5 |
| 25 | Valid u/i | quote rows — "valid until" |
| 26 | Affiliate company details | tooltip confirmed — see question 6 |
| 27 | Classification code | tooltip confirmed |
| 28 | Classification | the code's description |
| 29 | Reference | see question 7 |
| 30 | Onze referentie | **untranslated Dutch** — "Our reference", same field [Purchase quotes](purchase-quotes.md) has |

## 🔴 What is needed before this can be built

**1. Is a unified orders+quotes list the right shape for us, or two screens
joined by a shared filter?**
Ours currently keeps `PurchaseOrders` and quotes conceptually separate. This
screen suggests the reference system treats them as one document type with a
type flag, which is a bigger structural question than any single column.
→ *In the old system:* open one quote row and one order row here and open each
one's own detail screen. If both open the same kind of window with an
`Order type` field, they are one entity; if they open different screens
entirely, this overview is just a shared list over two tables.

**2. `Converted from/to` — the quote-to-order link.**
If a quote is accepted, it presumably becomes (or generates) an order. This
column likely holds that cross-reference in both directions.
→ *In the old system:* find a quote that was converted to an order. Check
whether the order row's `Converted from/to` shows the quote number, and the
quote row's shows the resulting order number.

**3. `Status` — shared ladder, or two different ones shown in one column?**
Our `PurchaseOrders.status` is `open | confirmed | pre_notified | …`; quotes
likely have their own separate states (draft, sent, accepted, expired).
→ *In the old system:* group the grid by `Status` to list every distinct value
with counts, and check whether quote-type values and order-type values appear
mixed in the same list or are cleanly separate.

**4. `Time frame` — what does it hold?**
Not a date itself; possibly a delivery window, or a grouping bucket like "this
week" / "next month".
→ *In the old system:* widen the column on a row with data and read its value.

**5. The send-status cluster — `Send`, `Must be sent`, `Order method`,
`Deliberately not sent`.**
Reads like: how this document reaches the supplier (`Order method` — e.g. EDI,
email, fax, print), whether it still needs transmitting (`Must be sent`), and a
flag for intentionally holding it back (`Deliberately not sent`). `Send` may be
a button-like action column rather than data.
→ *In the old system:* open the `Order method` dropdown on a row to list every
option. Find a row with `Deliberately not sent` ticked and check what stops it
being sent automatically. Check whether `Send` and `Must be sent` are ever both
true, or ever both false, to see if one drives the other.

**6. `Affiliate company details` — is this the answer to the recurring
"Company code" question?**
Purchase quotes, purchase receivals and purchase invoices each have an
unexplained company-identity column. "Affiliate company" reading as a related
or branch entity would resolve all of them at once.
→ *In the old system:* open a row's `Affiliate company details` and read what
it shows — if it is a branch/entity selector distinct from the `Supplier`
column, note its values and whether the same set of affiliates appears on
those other screens' ambiguous company columns.

**7. `Reference` vs. `Onze referentie` — the same two-reference pattern as
Purchase quotes.**
Purchase quotes had `Onze referentie`, `Purchase Reference`, and
`Quote nr. supplier`; this screen has `Reference` and `Onze referentie`.
Worth checking whether `Reference` here is the same field as `Purchase
Reference` there.
→ *In the old system:* open a document that appears on both screens (a quote
row here and its matching row on Purchase quotes) and compare the two
reference columns directly.

**8. `Customer code` on a purchase screen — why?**
Sits right after `Supplier`, which is unexpected unless this is a drop-ship /
consignment order bought specifically to fulfil a customer's sales order —
which would tie directly to the `Consignment` column two positions later.
→ *In the old system:* find a row with `Consignment` ticked and check whether
`Customer code` is populated there specifically (and empty on ordinary stock
purchases).

**9. `Classification code` / `Classification` — classifying what?**
A code+description pair, same shape as `Payment terms code`/`Payment terms` on
[Purchase invoices](purchase-invoices.md). Could classify the order itself
(e.g. by purpose) or the product being bought.
→ *In the old system:* open the `Classification code` dropdown on a row and
list every option.

**10. `Weight (kg)` and `Revenue` — confirm these are rollups, not fields.**
→ *In the old system:* open one order's lines, sum their weights, and compare
against the header `Weight (kg)` on this screen.
