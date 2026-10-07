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
`Deliberately not sent`.** ✅ **ANSWERED 5-10-2026.** See
[§ The send-status cluster](#-the-send-status-cluster--answered-5-10-2026)
below. Original question, kept for the record: reads like how this document
reaches the supplier (`Order method`), whether it still needs transmitting
(`Must be sent`), and a flag for intentionally holding it back.

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


---

## ✅ The send-status cluster — answered 5-10-2026

Captured on `Purchase orders and quotes`, creation date `1-1-2024` → `5-10-2026`,
grouped by `Order method`, scrolled right. 23 consecutive rows,
`IO401479`–`IO401502`, July–August 2025.

### The three flags are one state, not three

| Row pattern | Count in 23 |
|---|---|
| `Send` ☑ · `Must be sent` ☑ · `Deliberately not sent` ☐ | 15 |
| `Send` ☐ · `Must be sent` ☑ · `Deliberately not sent` ☑ | 8 |
| anything else | **0** |

🔑 **`Must be sent` is ticked on every single row**, and **`Send` and
`Deliberately not sent` are mutually exclusive and exhaustive** — exactly one of
the two is ticked, never both, never neither.

So the cluster is not three independent booleans. It is:

```
Must be sent          = this document is one that goes to the supplier
  Send                = … and it went
  Deliberately not sent = … and somebody stopped it on purpose
```

Question 5 asked *"whether `Send` and `Must be sent` are ever both true, or ever
both false, to see if one drives the other"*. Both true is the normal case (15 of
23). Both false never happened. **`Must be sent` is the gate; the other two
partition it.**

⚠️ `Send` is **data, not a button** — it renders as a tickbox in the grid like
the other two, and it is read-only there.

### What gets held back

Mapping the 8 suppressed rows back to their suppliers:

| Supplier | Code | Suppressed |
|---|---|---|
| **`Hego Voorraadcorrecties`** | 11586 | **2 of 2** — always |
| `H. Schrijver Constructiebedrijf B.V.` | 13000 | 1 of 1 — the `Customer Materials` order |
| `B.V. Leeuwbouw` | 12172 | 1 of 1 |
| `Nedinox B.V.` | 12528 | 1 of 1 |
| `Hego Production` | 13660 | 2 of 8 |
| `Holland Stainless Int` | 11692 | 1 of 4 |

🔑 **`Hego Voorraadcorrecties` — "Hego stock corrections" — is a supplier.**
Stock corrections are booked as **purchase orders against a dummy supplier**,
with revenues of € 0,01 / € 0,02 / € 0,03, and they are **always deliberately
not sent** — you do not email a stock correction to anybody. That is the clearest
use of the flag.

Holland Stainless appears both sent and suppressed, so the flag is **per order,
not per supplier**.

### 🔴 `Order method` is empty

Grouping by `Order method` over a 2¾-year window produced a group header reading
**`Order method:`** with **no value and no count after it** — a single, blank
group. Every order in view sits under it.

Earlier notes assumed the orders we had read were `Telephone` and that an
EDI/StaalWeb order existed somewhere to be found. On this evidence the column is
**simply never filled**, which would mean there is no EDI order to find and
**O4 closes by saying the feature is unused**.

⚠️ **One confirmation still owed:** collapse the group (the `−` box on the
group header). A collapsed grouping lists every distinct value with its count on
one line each. If one blank group holds every row, O4 is closed.

### Two enums that came free

**`Order type`** — and it tracks what the order is *for*:

| Value | Seen against |
|---|---|
| `Materials` | Holland Stainless, Aperam, Outokumpu, HW-Inox, Terninox, Nedinox — buying metal |
| `Processing` | **Hego Production** every time — sending material out to be worked |
| `Customer Materials` | H. Schrijver — the customer's own metal coming in, **€ 0,00** |

🔑 **`Processing` orders to Hego Production are the external-processing flow
H9 is about**, visible as an order type rather than something inferred.

🔑 **`Customer Materials` orders carry € 0,00 revenue** — consistent with
customer-owned metal having no purchase value, and relevant to K2.

**`Status`** — `Invoiced` and `Received` both seen on this slice.

### Columns the overview carries that we do not

`Year (Creation)` · `Month` · **`Time frame`** · `Initials` · `Purchaser` ·
`Converted from` · `Lines` · `Weight (kg)` · `Revenue` · `Customer code`

🔑 **`Time frame` is a half-hour bucket of the creation time** — `08:00 - 08:30`,
`12:00 - 12:30`, `17:00 - 17:30`. That closes question 4 above: it is not a
delivery window, it is when the order was keyed, rounded to 30 minutes.

🔑 `Year` and `Month` are **derived from the creation date**, offered as
columns so they can be dragged into the grouping bar.

🔑 `Initials` (`BV`, `AB`, `MB`, `AVD`, `AN`, `FJ`, `RVS`, `CVR`) and
`Purchaser` (the full name) are **two separate columns** on the same person.

⚠️ **`Revenue` on a purchase order** means the order's value, not revenue. And
`Customer code` on a purchase order holds the **supplier's** number — another
instance of the one-company-table, nine-roles model.


---

## ✅ `Status` grouped, 7-10-2026

`Purchase orders and quotes`, creation date `1-1-2024` → `7-10-2026`,
`Weergave` blank, grouped on `Status`. **Nine groups**, alphabetical, no
counts:

```
Checked · Delivered · Expired · In progress · Invoiced ·
Partially received · Provisional · Received · Released
```

So the purchase header runs on the **same ladder as the lines**
(`orderLineStatuses`), with `Partially received` / `Received` in place of the
sales side's `Partially delivered` / `Delivered`, plus `Expired`. What is
**absent** matters as much: no `Open`, `Confirmed`, `Pre-notified`,
`Completed` or `Cancelled` — four of the six values in our
`purchaseOrderStatuses` are not in the reference at all, and the fifth is
spelled differently.

⚠️ **`Delivered` on a purchase order is unexplained.** Goods are *received*
on a purchase; `Delivered` is a sales word. Candidates: a purchase return
order (goods delivered back to the supplier), or a `CD` purchase delivered
straight to the customer. Expand that group to settle it.

⚠️ `Partially invoiced` is not among the nine, though it is on the sales
side. Either a purchase order is invoiced in one go, or no order in the
window was caught half-invoiced.

⚠️ Expired orders **are** listed here once grouped — so `400142`'s absence
from the earlier searches was the `Find` box, not this screen.
