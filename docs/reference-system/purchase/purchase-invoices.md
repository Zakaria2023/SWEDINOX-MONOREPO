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
**Grid was empty**, so no example values were readable.

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

**Four dates on one row**: creation, invoice, expiration, and a booking period.
Together with the two date checkboxes on
[Purchase invoice line](purchase-invoice-line.md#-what-is-needed-before-this-can-be-built),
that is at least five date concepts on a purchase invoice, where our
`PurchaseInvoices` carries fewer. Settling them is question 1.

## 🔴 What is needed before this can be built

**1. Which date is which, and which one the books use.**
`Creation date` (when it was entered here), `Invoice date` (the supplier's),
`Expiration date` (when it is due), `Booking period` (which period it posts to).
Our schema has a fiscal-basis enum — `purchaseInvoiceFiscalBases` is
`booking_date | document_date` — so the concept exists but the field set does not
line up.
→ *In the old system:* open one purchase invoice and read all four off its
header, then check whether `Booking period` is derived from a date or set by
hand. If it can be set independently, it is its own field and not a formatting
of a date.

**2. Three ways to identify the same supplier.**
`Creditor no.`, `Supplier code` and `Supplier`. Ours has one company record.
`Creditor no.` is likely the finance ledger account and `Supplier code` the
purchasing code — which would mean a company carries both, and payables is keyed
on the creditor number.
→ *In the old system:* open a supplier company and look for both numbers on it.
If they differ, note whether one is editable and one generated. Also check
`Overviews → Finance → Journal entries` to see which of the two a posting
carries.

**3. `Credit restriction` — the Dutch *kredietbeperking*?**
That is a surcharge added to an invoice which the buyer may deduct if they pay
inside the discount period. If so it is a real amount that changes what is owed
depending on when it is paid, not a note — and nothing in ours models it.
→ *In the old system:* find an invoice with a non-zero value here and check
whether the amount payable changes when it is paid early, and whether the
supplier's own record carries a credit-restriction percentage.

**4. `Weight` on an invoice header.**
Presumably the sum of its lines' weights, carried on the header so payables can
sanity-check a tonnage price without opening the lines.
→ *In the old system:* open an invoice, note the header weight, then add up its
lines' weights. If they match it is derived and we compute it rather than store
it.

**5. `IBAN` and `Bank Country` — snapshotted or joined?**
If they are read live from the supplier, changing the supplier's bank rewrites
history on every old invoice — which is exactly the sort of thing that hides a
payment-fraud change. A snapshot taken when the invoice was entered is safer and
is probably what this does.
→ *In the old system:* find an invoice from a supplier whose bank details were
changed at some point, and see whether the old invoice still shows the old IBAN.

**6. `Status` — what are its values?**
Ours has `purchaseInvoiceBlockReasons` (`price_mismatch`,
`awaiting_goods_receipt`, `awaiting_approval`, `duplicate`, `disputed`, `other`),
which is a *block* reason rather than a status.
→ *In the old system:* drag the `Status` header into the group bar to list every
distinct value with counts, and note whether a blocked invoice shows as a status
or carries a separate block flag.

**7. Is `Invoice amount` net or gross?**
There is a separate `VAT amount`, which suggests `Invoice amount` is net and the
total is the two added — but plenty of systems show gross alongside VAT.
→ *In the old system:* read one invoice's three figures against its printed total.
