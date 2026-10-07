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


### Vergeest's `Debtor` panel, 7-10-2026

| Field | Value |
|---|---|
| `Debtor number` | `12539` — the first search code, as on every company |
| `IBAN` / `BIC` | `NL87RABO0121591093` / `RABONL2U` |
| `Calculate VAT if applicable` · `Reminder` | ☑ ☑, greyed |
| `Collect invoices in collection-mandate` · `Different contracts` | ☐ ☐ |
| `Purchase org.` | `-leeg-` + `Show` · `Mem. no. Pur.Org.` blank |
| **`Credit limit insurance`** | **`0010822904`** — a policy number, leading zeros kept |
| `Insurance valid until` | `31-12-9999` |
| `Credit limit uninsured` | `€ 0` |
| `Open orders` / `Open entrees` (excl. BTW) | `€ 0,00` / **`€ 1.377,50`** |
| `Oldest invoice date open entrees` / `Oldest due date` | `11-9-2026` / `11-10-2026` |
| `Payment terms` | `Within 30 days from date of invoice` · `Different payment terms ex works` blank |
| **`Journal code`** | **`0`, greyed** |
| `VAT no` / `C of C number` | `NL810737413B01` / `10041394` |
| `Currency` | `Euro` |
| `Blocked by` | ☐, with the text box reading *"Allianz limiet akkoord voor € 25K./13-12-2024. Limietverhoging naar € 50K akkoord./27-01-2025."* |

✅ **`Open entrees` reconciles to one invoice.** € 1.377,50 is exactly the
excl.-VAT amount of `508220`, the only invoice on the `Invoices` panel with
anything outstanding; its date (11-9-2026) and expiry (11-10-2026) are the two
`Oldest …` dates. So open entrees is the excl.-VAT sum of unpaid invoices, and
the two dates are the min over the same set — as credit-and-blocking.md has it.

🔑 **The insured credit-limit amount is not on this panel for this login.**
The panel shows the policy number and the uninsured limit, and no insured
amount at all. system-info.md's security table has `Debtor → Kredietlimiet`
(insured) **hidden** for two of the four profiles, which is the likely reason.
The history of that limit — € 25K approved 13-12-2024, raised to € 50K on
27-01-2025 — survives only as **hand-typed text in the `Blocked by` box**,
which is a free-text memo field whether or not the block is ticked.

### `Decomecc N.V.` (`11046`), 7-10-2026 — a processor, read in full

Roles: **`Customer` ☑ · `Supplier` ☑ · `Processor` ☑**, the other six ☐.
Created 26-9-2024. Search codes: blank, `21835`, `DECOMECC`. Main language
Dutch.

Its panels add three the customer record lacked: **`Purchase requests`**
(*"0 open purchase requests, 0 Kg"*), **`Purchase quotes`** (*"0 open purchase
quote(s); € 0,00; 0 Kg"*), **`Purchase orders`** (*"1 open purchase order(s);
€ 2.632,96; 15304,2 Kg"*) — then `Inkoopregels` and `Customer stock`. The
`Orders` panel (sales) is empty.

`Purchase orders` grid — `Status · Order no · Purchase type · For order ·
Order date · Delivery date · Amount · Weight (kg) · Copied from · Internal ref
· Printed · Mailed · Handle tran… · Pick up/Dro… · Inkoper · Purchaser i… ·
Re…`:

| Status | No. | Type | Ordered | Delivery | Amount | Kg | Handle transport | Purchaser |
|---|---|---|---|---|---|---|---|---|
| **`Expired`** | **`400142`** | `Processing` | 14-1-2025 | 16-1-2026 | € 0,00 | 0 | ☑ | Benno Vos |
| `Received` | `400143` | `Ex works Pro…` | 14-1-2025 | 15-1-2025 | € 0,01 | 177 | ☑ | Benno Vos |
| `Invoiced` | `400192` | `Processing` | 17-1-2025 | 10-2-2025 | € 1.161,45 | 9 940 | ☑ | Benno Vos |
| `Invoiced` | `400196` | `Processing` | 17-1-2025 | 10-2-2025 | € 1.692,90 | 9 956 | ☑ | Benno Vos |
| **`Expired`** | `400359` | `Materials` | 10-2-2025 | 11-2-2025 | € 0,00 | 0 | ☐ | INAD |
| `Invoiced` | `400366` | `Processing` | 11-2-2025 | 11-2-2025 | € 1.364,40 | 11 370 | ☑ | Benno Vos |
| **`In progress`** | `402401` | `Processing` | 14-11-2025 | 14-9-2026 | € 2.632,96 | 15 304,2 | ☑ | Marco Borsboom |

🔑 **`400142` is `Expired` — that is why no search found it.** It is the
outgoing leg of the `400143` pair (purchase-lines.md *Step 6c*) and it ended
at € 0,00 / 0 kg. The journal postings of € 1.324,16 and € 1.261,10 against
it were each reversed, so the processing was never billed on it. An expired
purchase order drops out of `Purchase lines` and `Purchase orders and quotes`
alike; it is reachable from its supplier's company record and nowhere else
yet found.

🔴 **Four purchase-order statuses on one grid, three of which we do not
hold.** `Expired`, `Received`, `Invoiced`, `In progress`. Ours is
`provisional · open · confirmed · pre_notified · completed · cancelled`.
Queued as [PLANNED-CODE-CHANGES-7.md](PLANNED-CODE-CHANGES-7.md) §11.

🔑 **A processor's work is ordered as `Processing` and carries tonnage.**
`400192` / `400196` / `400366` are 9,9–11,4 t each at € 1.161–1.693 — about
€ 0,12–0,17 per kilo, a processing rate, not a metal price. `Handle transport`
☑ on every one: we move the metal there ourselves.

**`Creditor`:** `50982` · IBAN `BE42235005290754` · BIC `GEBABEBB` · Bank
`Fortis Bank` · City `AMSTERDAM` *(sic — a Belgian bank, a Belgian company, a
Dutch city)* · Country `Belgium` · terms `Within 30 days from date of invoice`
· `EUR` · **`Journal code 0`, greyed** · VAT `BE0455164877` · `Payment term
changeable in purchase orders` ☑ and `Collect invoices in payment order` ☑,
greyed · open orders / entrees € 0,00 · a **`Bijwerken`** (refresh) button
under the open-entrees block, which the customer's creditor panel lacked.

**`Debtor`:** `11527` · same IBAN and BIC · terms `Within 30 days from date of
invoice` · **`Journal code 11`, greyed** · `Currency` **`-leeg-`** (the
creditor side says `EUR`).

✅ **`Journal code` closes: it cannot be opened, on either panel, on any
company tried.** Creditor `0` / debtor `11` on Decomecc, `0` / `0` on
Vergeest — greyed every time. The dropdown is display-only in this login;
the values arrive from the ledger (AFAS). J7 is finished.

### `Hego Reserveringen` (`11584`), 7-10-2026 — the parking customer

`Hego Reserveringen, Bolderweg 10, ALMERE, 036 549 2222`. Roles: **`Customer`
☑ · `Supplier` ☑ · `Processor` ☑ — and `Internal` ☐.** Created 26-9-2024.
Search codes `13158`, `22975`, `HEGO2`. **Main language `English`.**

So it is not flagged as internal, though it is: it is a company record at
Hego's own address, used as a customer to hold stock. The `Orders` panel says
*"3 in progress; the last one is from 7-9-2026"*:

| No. | Status | Ordered | Delivery | Kg | Profit% | Customer reference |
|---|---|---|---|---|---|---|
| `108123` | Provisional | 7-9-2026 | 8-9-2026 | 22 510 | −100 | `PROJECT ORDER/ PRIME+2ND` |
| `107916` | Expired | 24-8-2026 | 8-9-2026 | 22 510 | −100 | `PROJECT ORDER PRIME/2ND` |
| `107910` | Provisional | 21-8-2026 | 25-8-2026 | 66 950 | −100 | `PROJECT- PRIME/2ND/SCRAP` |
| `107831` | Expired | 14-8-2026 | 27-8-2026 | 0 | 0 | `furkans order to romania` |
| `107198` | Expired | 16-6-2026 | 25-6-2026 | 0 | 0 | |
| `106778` | Expired | 7-5-2026 | 11-5-2026 | 0 | 0 | `INOXPRIME SERVICES MATERIAL` |
| `106669` | Expired | 30-4-2026 | 1-5-2026 | 0 | 0 | |
| `105318` | Provisional | 20-1-2026 | 18-5-2026 | 3 497,3 | −100 | `Vincent Laser Material` |
| `103792` | Expired | 1-10-2025 | 31-10-2025 | 0 | 0 | |
| `100766` | Expired, **Blocked ☑** | 11-2-2025 | 31-3-2025 | 0 | 0 | `onbekend of order door Aperam geleve…` |
| `100643` | Expired | 4-2-2025 | 5-2-2025 | 0 | 0 | |

All `Normal`, all € 0,00, none consignment.

🔑 **The customer reference names the real party.** `Vincent Laser Material`,
`INOXPRIME SERVICES MATERIAL`, `furkans order to romania`, `PROJECT ORDER
PRIME/2ND` — each order holds stock **for** somebody who has not ordered yet,
or for a project. A provisional € 0 order reserves the lots; when the real
order comes, the reservation moves or the parking order expires. That is why
eight of eleven are `Expired` with 0 kg: the stock was released and the
order left to age out.

🔑 **`Expired` is an order status, not only a quote and line status** — eight
whole sales orders carry it here.
