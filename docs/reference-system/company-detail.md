# Company — the master screen

Reached with `Show company` from any purchase overview. Ours: the company form
under `/companies`.

Captured from **`12804` Quarto Deutschland Gmbh**, titled
`Quarto Deutschland Gmbh , BAHNSTRASSE 44, BOCHUM, 0049 234 890870-0` — the
title line assembles name, street, city and phone.

**Toolbar**: Show Word File · Activate (greyed) | Purchase lines · Warehouse
workorders · Orders and Quotes · Production workorders · Transport workorders

## 🔑 One company, nine roles, three numbers

The header is a column of **checkboxes, not a dropdown** — a company can be
several things at once:

`Customer` ☑ · `Prospect` ☐ · `Supplier` ☑ · `Processor` ☐ · `Transporter` ☐ ·
`Agent` ☐ · `Purchasing org.` ☐ · `Other` ☐ · `Internal` ☐

This one is **both a customer and a supplier**, so a role is a **set**, not a
single value, and our company model needs nine booleans (or a join table)
rather than one enum.

`Processor` and `Transporter` are the interesting two — a company that does
processing work, and a haulier. `Purchasing org.` matches the
`Purchase org.` field further down.

And it carries **three separate identities**:

| Number | Where | What it keys |
|---|---|---|
| `Company code` **12804** | header | purchasing and sales |
| `Creditor` **50988** | Creditor panel | payables — this is `Cred.No` on [Purchase invoices](purchase/purchase-invoices.md) |
| `Debtor number` **12088** | Debtor panel | receivables |

**This answers question 2 on Purchase invoices.** `Creditor no.` and
`Supplier code` are not two names for one thing — they are the finance ledger
account and the trading code, and a company that both buys and sells has a
creditor *and* a debtor number on top of its company code.

## Header

| Field | Value |
|---|---|
| *(created)* | `Company (created on 9-11-2015)` |
| `Company code` | `12804` |
| `Company name` | Quarto Deutschland Gmbh |
| `Corresp. name` | blank — a separate correspondence name |
| `Main language` | **German** |
| `Sister affiliate` | `-empty-` |
| `Search codes` | two blank slots + `QUARTO1` |
| `Work panel color` | **`-leeg-`** |

Two things to copy:

- **`Main language` is per company**, so documents print in the customer's
  language. That is a real field, not a UI preference.
- **`Sister affiliate`** is the link that explains the `Affiliate` columns on
  several purchase screens and the `Stock other affiliates` panel on
  [the purchase order](purchase/purchase-order-detail.md).

⚠️ `Work panel color` reads **`-leeg-`**, which is Dutch for *empty* — while the
rest of this screen says `-empty-`. The reference's own translation is
incomplete; ours says *empty* everywhere.

## The panels

`Additional info` · `Addresses` · `Contacts` · `Remarks` · `Counter Orders` ·
`Documents` · `Visit reports` · `Communication` · `Communication settings` ·
`Contracts` · **`Creditor`** · **`Debtor`** · `Purchase invoices` ·
`Purchase quotes` · **`Purchase orders`** · `Purchase returns` · `Complaints`

Seventeen sections. Several show a **summary in the collapsed header**, which is
a pattern worth copying:

- `Documents` — `0 Documents`
- `Contracts` — `0 contracts`
- `Purchase quotes` — `0 open purchase quote(s); € 0,00; 0 Kg`
- `Purchase orders` — `3 open purchase order(s); € 14.115,48; 4808,2 Kg`
- `Purchase returns` — `0 open purchase return order(s); € 0,00; 0 Kg`
- `Creditor` — `Payment terms: Within 30 days from date of invoice`
- `Debtor` — `Debtor no: 12088, Credit limit: € 0,00, Credit limit: € 0,00`

`Counter Orders` and `Visit reports` are new concepts not seen anywhere else.

### `Purchase orders` — and what "open" means

Columns: `Status` · `Order no` · `Purchase type` · `For order` · `Order date` ·
`Delivery date` · `Amount` · `Weight (kg)` · `Confirmation…` ·
`Confirmation d…` · `Copied from` · `Internal ref…` · `Printed` ☑ · `Mailed` ☑

The header says `3 open purchase order(s); € 14.115,48; 4808,2 Kg`, and the
grid's own rows settle what that counts:

| Status | Order no | Amount | Weight |
|---|---|---|---|
| Released | 401016 | € 2 340,48 | 883,2 |
| Released | 401009 | € 11 775,00 | 3 925 |
| **Provisional** | 400958 | € 0,00 | 0 |
| Invoiced | 400974, 400959, 400894, … | *(excluded)* | |

`2 340,48 + 11 775,00 + 0 = ` **14 115,48**, and `883,2 + 3 925 + 0 = ` **4 808,2**
— exact on both. So **"open" = `Released` + `Provisional`**, i.e. everything not
yet `Invoiced`. The `Provisional` order contributes nothing to either total, so
it is the *count* of 3 that proves it belongs.

`Purchase type` reads `Materials`, matching the first of the two dropdowns under
[`Purchase order type`](purchase/purchase-order-detail.md#purchase-order-type-really-is-two-fields).

`Copied from` and `For order` are both blank here — self-references for copied
and child orders.

### `1-1-0001` and `31-12-9999` are null sentinels

`Confirmation d…` reads **`1-1-0001`** on every row, and the Debtor panel's
`Oldest invoice date open entrees` / `Oldest due date open entrees` read the
same. Meanwhile `Insurance valid until` reads **`31-12-9999`**.

So the reference uses `DateTime.MinValue` for *never* and `MaxValue` for
*forever*. **Both must render blank in ours**, and neither should be stored —
our columns are nullable.

### `Creditor`

| | |
|---|---|
| `Creditor` | `50988` |
| `IBAN` · `BIC` · `Bank account` · `Postbank` | `DE39370106002220996017` · `BNPADEFF` |
| `Bank` · `Street` · `City` · `Country` | ABN Amro · — · AMSTERDAM · Germany |
| `Payment terms` | Within 30 days from date of invoice |
| `Currency` | EUR |
| `Journal code` | `0` |
| `VAT no` | `DE815693552` |
| `C of C number` | `40227B79583` — Chamber of Commerce |
| `Payment term changeable in purchase orders` | ☑ |
| `Collect invoices in payment order` | ☑ |
| `Blocked by` | ☐ + a free-text box |

`Payment term changeable in purchase orders` ☑ is why the purchase order carries
its own `Payment terms` field — the company's is a default that the order may
override.

Note the **bank's** country is Germany while its city is Amsterdam, so these are
the bank's details, not the company's address.

### `Debtor`

Mirrors the creditor with receivables fields on top:

| | |
|---|---|
| `Debtor number` | `12088` |
| `Payment terms` | **`Prepayment`** — *different from the creditor's* |
| `Different payment terms ex works` | blank — a second terms field |
| `Journal code` | `11` — different from the creditor's `0` |
| `Calculate VAT if applicable` ☑ · `Reminder` ☑ · `Collect invoices in collection-mandate` ☐ | |
| `Purchase org.` · `Mem. no. Pur.Org.` | `-leeg-` |
| `Credit limit insurance` | `116696476` + `Insurance valid until 31-12-9999` |
| `Credit limit` · `Credit limit uninsured` · `Credit space` | € 0 each |
| `Open orders` / `Open entrees` | `Excl. BTW` and `Incl. BTW` columns, plus an **`Update`** button |
| `Different contracts` ☐ · `Blocked by` ☐ | |

**Creditor and debtor carry independent payment terms and journal codes** —
30 days when we buy, prepayment when we sell. So payment terms belong to the
role, not the company.

`Credit space` with an `Update` button beside `Open orders` / `Open entrees`
means the exposure figures are **recalculated on demand**, not live. `BTW` is
Dutch for VAT and needs translating.

## 🔴 What is still needed here

1. **`Counter Orders` and `Visit reports`** — two panels seen nowhere else,
   captured by name only.
   → *In the old system:* expand both on a company that has some.
2. **The `Role` checkbox set is nine values; are they all in use?** A
   `Processor` or `Transporter` company would change how work orders are
   assigned.
   → *In the old system:* on the companies overview, group by each role in turn,
   or filter for `Processor` ☑ and see whether any exist.
3. **`Journal code`** — `0` on the creditor and `11` on the debtor. The list
   behind it is unread.
   → *In the old system:* open either dropdown.


---

## ✅ A customer record read, 7-10-2026 — `Vergeest Metaaltechniek Wijchen B.V.` (`13680`)

Opened from `Orders and Quotes` with `Show Company`. The nine role boxes
read **`Customer` ☑** and the other eight ☐ — `Prospect`, `Supplier`,
`Processor`, `Transporter`, `Agent`, `Purchasing org.`, `Other`, `Internal`.
Created 16-12-2024. `Search codes`: **`12539`** (= its debtor number), blank,
`Vergeest`. `Main language` Dutch · `Sister affiliate` `-leeg-` · `Work panel
color` `-leeg-`.

Panels, top to bottom: `Addresses` (one, headed **`5. Factuur, Bezoek,
Correspondentie, Af…`** — the address *number* then the roles it serves) ·
`Contacts` (five cards, each headed by its roles: `Boekhouding`, `Inkoop,
Verkoop`, `Boekhouding`, `Inkoop`, `Inkoop, Verkoop`) · `Remarks` · `Quotes`
· `Orders` (header: *"0 in progress; the last one is from 10-9-2026"*; grid
`Order type · Order no · Blocked · Status · Order date · Delivery date ·
Amount (excl. VAT) · Weight (kg) · Customer reference · Project · Consignment
· Profit% · Days in system`) · `Quote- and order lines` · `Invoices` (grid
`Invoice no · Order · Invoice date · Expiration · Bedrag ex · Amount in ·
Credit res · Status · Outstanding · Printed · Print date · Mailed · E-mail
date · E-mail address · Change date · Days in system`; every status `Sent`,
every row `Mailed` ☑ and `Printed` ☐) · `Counter Orders` · `Documents`
(`0 Documents`) · `Visit reports` · `Communication` · `Communication
settings` · `Contracts` · `Creditor` · `Debtor` · `Invoicing` · `Sales`
(`Customer group:` blank).

🔑 **Invoice `507740` has no `Order`.** € 8.527,10 excl., dated 6-8-2026,
sent and paid, with the `Order` cell empty — an invoice that was not raised
from a sales order. Everything else on the grid carries its `O` number.

⚠️ **`Contracts` says `0 contracts` and lists two.** `PACKAGING …` and
`PALLET COSTS`, both `Surcharges`, `Customer` role, 16-12-2024 →
`31-12-9999`, `Preference 0`, `Website sorting 10`, `660` days in system.
The header count evidently excludes surcharge contracts — or counts only
price contracts. Two rows, one zero: the number is not the row count.

**`Creditor` on a company that is not a supplier is read-only.** `Payment
terms: To be determined`, `Currency EUR`, **`Journal code 0`** — all greyed,
with `Calculate VAT` ☑, `Payment term changeable in purchase orders` ☑ and
`Collect invoices in payment order` ☑ greyed too; bank fields empty;
`Open orders` / `Open entries` € 0,00; `Oldest due date open entries`
`1-1-0001`. So the `0` seen earlier on this panel is the placeholder a
non-supplier carries, not a chosen value — the dropdown's list has to be
read on a company with `Supplier` ☑, or on this company's `Debtor` panel,
where it was `11`. Requested.
