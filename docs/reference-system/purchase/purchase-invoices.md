# Purchase invoices

`Overviews → Purchase → Purchase invoices`. Ours: `/purchase-invoices`.

Supplier invoice headers — one row per invoice. Where
[Purchase invoice line](purchase-invoice-line.md) is the statutory view of the
lines, this is the payables view of the documents.

**Filters**: `Invoice date` (from / to), `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Company ·
Show Purchase invoice · Purchase lines · Warehouse workorders ·
Production workorders.
**View open when captured**: none selected (blank).
**The overview grid was empty**, but **one invoice detail has been captured** —
`600000`, Quarto Deutschland Gmbh — and it answers four of the questions below
outright.

## Columns — captured, not yet matched

| # | Reference heading | Notes |
|---|---|---|
| 1 | Creation date | grid was sorted on this |
| 2 | Status | |
| 3 | Invoice date | the supplier's date — what the filter above uses |
| 4 | Invoice no. | ours |
| 5 | Expiration date | tooltip confirmed — the due date |
| 6 | Creditor no. | see question 2 |
| 7 | Invoice no. supplier | tooltip confirmed — theirs |
| 8 | Supplier code | see question 2 |
| 9 | Supplier | the name |
| 10 | City | |
| 11 | Country | |
| 12 | VAT number | |
| 13 | Invoice amount | |
| 14 | VAT amount | |
| 15 | Credit restriction | see question 3 |
| 16 | Payment terms code | |
| 17 | Payment terms | the code's description |
| 18 | Weight | see question 4 |
| 19 | IBAN | |
| 20 | Bank Country | |
| 21 | Booking period | tooltip confirmed — the accounting period |

## ✅ The invoice detail screen — `600000`

Title: `Purchase invoice 600000, Quarto Deutschland Gmbh, Tel: …, Fax: … -
Released`, and under it an audit line: *"Invoice status was last changed by
Raymond Wattez on 22-1-2025 at 12:08."* So the status carries **who changed it
and when** — a field trio ours does not have.

**Toolbar**: Final · Show company · Show purchase order · Unblock (greyed)

| Header field | Value |
|---|---|
| `Company` | `12804` Quarto Deutschland Gmbh |
| `Invoice sent by` | `12804` — **a second company field**, so an invoice can arrive from someone other than the supplier (a factor, or a group billing entity) |
| `Booking date` | **`Automatically`** — not a date, a mode |
| `Invoice date` | 22-1-2025, with `Exp. date` 21-2-2025 beside it |
| `Invoice number supplier` | `611076` |
| `Invoice total` | € 7 881,60 |
| `Purchase order` | **`IO400166`** — the order number with an `IO` prefix (*InkoopOrder*) |
| `Payment terms` | Within 30 days from date of invoice |
| `Blocked` ☐ + `Blocking reason` | so blocking **is** separate from status |
| `Cred.No` | `50988`, printed twice |
| `Basis for Fiscal Period` | radio: **`Booking date`** ● / `Document date` ○ |

The summary block on the right: `Materials` · `Options` · `Surcharges` ·
`Tot. excl. VAT` · **`VAT high` / `VAT middle` / `VAT low`** ·
`Tot. incl. VAT` · `Credit restriction` · `Remainde` · `Tot. general`.
Three VAT buckets, not one rate. (`Remainde` is a truncation of *Remainder*.)

### Lines — and they reconcile to the cent

`3 lines`. Toolbar: New · Delete · Purchase order · Product · `View: Standaard`.
Columns: `Booked` ☑ · `Item` · `Purchase order` · `Product` · `Qty` · `U` ·
`Kg` · `Length` · `U` · `Price` · **`Per`** · `Material` · `Options` ·
`Total` · `VAT rate` · `Delivery date`

| Item | Qty | Kg | Price | Per | Material | Total |
|---|---|---|---|---|---|---|
| 10 | 1 ST | 800 | € 2 800 | **TN** | € 2 240,00 | € 2 240,00 |
| 30 | 1 ST | 576 | € 4 350 | TN | € 2 505,60 | € 2 505,60 |
| 20 | 1 ST | 1 120 | € 2 800 | TN | € 3 136,00 | € 3 136,00 |

`2800 × 0,800 = 2240,00` · `4350 × 0,576 = 2505,60` ·
`2800 × 1,120 = 3136,00`, and the three sum to **7 881,60 — the header
`Invoice total` exactly**. So:

- **`Material` = price × weight ÷ 1000**, where `Per` names the weight unit.
  `Per` is a **column of its own** holding the price basis — the third
  independent sighting of the same idea, after `Net Price / TN` on
  [the order](purchase-order-detail.md#lines) and
  `Price quantity (in gross price U.)` on
  [receivals](purchase-receivals.md).
- **`Total` = `Material` + `Options`.**
- **Question 7 is answered: `Invoice amount` is net.** `Materials` 7 881,60 →
  `Tot. excl. VAT` 7 881,60 → VAT 0,00 → `Tot. incl. VAT` 7 881,60. The total
  is net plus VAT.

### Question 1 is answered: the dates

`Booking date` is not a date at all on this invoice — it reads
**`Automatically`**, i.e. the system derives it. And `Basis for Fiscal Period`
is a **radio between `Booking date` and `Document date`**, which is exactly our
`purchaseInvoiceFiscalBases` enum (`booking_date | document_date`). So the
concept lines up after all: the invoice stores *which basis* to post on, and the
period follows from the chosen date rather than being typed.

`Booking period` on the overview is therefore **derived**, not a stored field.

### Question 2 is answered: creditor no. vs supplier code

They are different keys on the same company, and the
[company detail screen](../company-detail.md) shows both: `Company code`
**12804**, `Creditor` **50988** — and a `Debtor` number **12088** as well,
because this company is both a supplier and a customer. So payables is keyed on
the creditor number, purchasing on the company code, and receivables on the
debtor number. **Three numbers, one company.**

### Question 3: `Credit restriction` is a real amount

It has its own line in the summary block, between `Tot. incl. VAT` and
`Tot. general` — so it is money that changes what is owed, not a note. It is
€ 0,00 on this invoice, so the *percentage* behind it is still unread.
→ *In the old system:* find an invoice with a non-zero credit restriction.

---

**Four dates on one row**: creation, invoice, expiration, and a booking period.
Together with the two date checkboxes on
[Purchase invoice line](purchase-invoice-line.md#-what-is-needed-before-this-can-be-built),
that is at least five date concepts on a purchase invoice, where our
`PurchaseInvoices` carries fewer. Settling them is question 1.

## 🔴 What is needed before this can be built

**1. `Weight` on an invoice header.**
Presumably the sum of its lines' weights, carried on the header so payables can
sanity-check a tonnage price without opening the lines.
→ *In the old system:* open an invoice, note the header weight, then add up its
lines' weights. If they match it is derived and we compute it rather than store
it.

**2. `IBAN` and `Bank Country` — snapshotted or joined?**
If they are read live from the supplier, changing the supplier's bank rewrites
history on every old invoice — which is exactly the sort of thing that hides a
payment-fraud change. A snapshot taken when the invoice was entered is safer and
is probably what this does.
→ *In the old system:* find an invoice from a supplier whose bank details were
changed at some point, and see whether the old invoice still shows the old IBAN.

**3. `Status` — what are its values?**
Ours has `purchaseInvoiceBlockReasons` (`price_mismatch`,
`awaiting_goods_receipt`, `awaiting_approval`, `duplicate`, `disputed`, `other`),
which is a *block* reason rather than a status — and the detail screen confirms
that split, carrying `Blocked` ☐ and `Blocking reason` **separately** from a
status of `Released`. `Released` is one status value; the rest are unknown.
The toolbar's `Final` button suggests another.
→ *In the old system:* drag the `Status` header into the group bar to list every
distinct value with counts, and note whether a blocked invoice shows as a status
or carries a separate block flag.

Questions 1, 2, 3 and 7 of the original seven are answered above.


---

## ✅ Step 7, 7-10-2026 — `Status` grouped

`Purchase invoices`, invoice date `1-1-2024` → `7-10-2026`, `Weergave`
`-leeg-`, grouped on `Status`: **two groups**, `Provisional` and `Released`.
No counts on the headers.

Our `purchaseInvoiceStatuses` is `new` · `released` · `final`. `new` is not a
word the reference uses — the first rung is **`Provisional`**, the same word as
on every other document — and `final` has not been seen on any invoice since
2024. Whether `Final` (or anything else) exists on older invoices is requested
over a wider window. Queued as
[PLANNED-CODE-CHANGES-7.md](../PLANNED-CODE-CHANGES-7.md) §10.


### ✅ Widened to `1-1-2020`, 7-10-2026 — still two, and now final

Same two groups. The `Released` group's first row is invoice **`600000`**,
dated 22-1-2025 — the series starts there, so there is no older invoice for a
wider window to find. **`Provisional` and `Released` are the whole list.**
`Final` does not exist.

The three `Provisional` rows, read across:

| Created | Invoice date | No. | Expiry | Creditor | Supplier's no. | Supplier | Amount | VAT | Terms | Booking period |
|---|---|---|---|---|---|---|---|---|---|---|
| 8-12-2025 | 1-12-2025 | `601550` | 1-12-2025 | 51173 | 12121 | ITALCOM SRL (I) | € 0,00 | € 0,00 | `V` Prepayment | **0** |
| 11-2-2026 | 11-2-2026 | `601850` | 13-3-2026 | 50742 | x | Fisher Edelstaal (NL) | € 187,07 | € 0,00 | `30` | **0** |
| 13-4-2026 | 16-12-2025 | `602217` | 15-1-2026 | 50638 | 20250762A | H. Schrijver Constructiebed… (NL) | € 726,00 | € 126,00 | `30` | **0** |

🔑 **`Booking period` is `0` on every `Provisional` row and `1` on every
`Released` row.** Provisional means *not yet booked into a period*; release is
the booking. That is the behaviour the status carries, and it is why there is
no third rung: once booked, an invoice is simply released.

Columns to the right, for the record: `Credit restriction` (€ 0,00 on all),
`Payment terms code` (`V` · `30` · `118` · `14` · `102`) beside the `Payment
terms` text (`Prepayment`, `Within 30 days from d…`, `Within 14 days -3.0%…`,
`Within 8 days -1%, 3…`), `Weight` (kg, `0` on all three provisional), `IBAN`,
`Bank Country`, `Booking peri…`.

Also seen: `602217` was *created* 13-4-2026 for an invoice *dated*
16-12-2025, four months late — `Creation date` and `Invoice date` are two
columns for a reason.
