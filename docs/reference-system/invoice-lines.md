# Invoice lines

**Item B4 of [WHAT-IS-LEFT.md](WHAT-IS-LEFT.md), captured 13-9-2026.**
`Overviews → Sales → Invoice lines`, `View` = `-empty-`. **43 columns, 5 650
rows** — `exports/b4-invoice-lines.tsv`.

1 683 invoices, numbered **`500000`–`501713`** with 31 gaps. Invoice dates run
January–May 2025 plus five rows in 2026 — the dense window.

---

## 1. 🔴 An invoice line is one of **two kinds**

```
Linetype = Orderline (5 180)  |  Surcharge (470)
```

A surcharge line has **no order line** (`Order line = 0` on exactly those 470)
and is quantified in **euros** (`QtyU = Euro`, 458 rows; 12 in `TN`).

Surcharge descriptions, and the revenue group each lands in:

| Description | Rows | Revenue group |
| --- | --- | --- |
| Packaging surcharge | 169 | 8900 Other allowances |
| Pallet surcharge | 143 | 8900 Other allowances |
| Transpost costs | 84 | 8100 Freight costs |
| Other | 21 | 8900 |
| Order surcharge | 17 | 8900 |
| Price differences | 12 | 8600 Price differences |
| Decoil surcharge | 9 | **3000 Decoiling** |
| Costs | 6 | 8900 |
| External transport | 4 | 8150 Freight costs external |
| Project discount | 2 | 8900 |

So the **8000 band is surcharges**, completing the picture: 1000 materials,
3000 processing ([sales-options-and-calloff.md](sales-options-and-calloff.md)),
8000 charges. `Decoil surcharge` posting to 3000 is the exception that shows the
band follows the *thing sold*, not the line kind.

⚠️ `Transpost costs` is the reference's own typo, and `Certiifcate costs` on the
charges screen is another. Translate, don't transcribe.

---

## 2. 🔴 Money splits **products / options / line**

Six columns, three pairs:

```
Revenue line = Revenue products + Revenue options    (0 mismatches / 5 650)
Profit line  = Profit products  + Profit options     (0 mismatches / 5 650)
```

The metal and the processing are invoiced on the **same line**, then reported
apart. `Revenue options` is non-zero on only 329 rows and `Profit options` on
3 — consistent with options being sold at cost
([sales-options-and-calloff.md](sales-options-and-calloff.md) §4).

The same split appears on the delivery line as `Invoiced (Prod.)` /
`Invoiced (Opt.)` ([deliveries.md](deliveries.md) §7).

---

## 3. ⚠️ Every screen rounds its margin differently — **four conventions now**

| Screen | Formula | Rounding | Fit |
| --- | --- | --- | --- |
| Orders and Quotes | `profit / \|revenue\| × 100` | 1 dp | 2 091 / 2 091 |
| Order lines | `profit / \|amount\| × 100` | **none** | 4 975 / 4 975 |
| Invoice lines — `products` | `profit / \|revenue\| × 100` | 1 dp | 5 540 / 5 650 |
| Invoice lines — `line` | `profit / revenue × 100` (**signed**) | 2 dp | 5 562 / 5 650 |

And the zero rule flips too: `Order lines` returns **±100** when the amount is
zero, `Invoice lines` returns **0**.

The signed denominator on `Profit margin line` shows on invoice `501253`, a
credit note: revenue −13 400.25, profit −1 210.29, margin **+9.03**. The
`products` column on the same rows uses `|revenue|` and comes out negative.

**Do not build one shared margin helper and expect it to match every grid.**
Store the unrounded value; round per screen; and record the sign rule per screen.

---

## 4. Two identifiers we do not have

- **`Debtor no.`** — a second customer key, **1:1 with `Customer code`** across
  all 293 customers but a different number (`13000` ↔ `10862`). The customer
  code is the commercial identity; the debtor number is the ledger identity.
  [chart-of-accounts.md](chart-of-accounts.md) is where it posts.
- **`Customer group`** — **18 values**, blank on 988 rows:

  `HANDELAAR` 1 029, `APPBOUW` 737, `EINDGEBR` 597, `HANDEL (E)` 583,
  `AGRARISCH` 487, `CONSTRUCT` 366, `REG HANDEL` 308, `BOUW` 158, `GEBR (E)` 84,
  `SNIJBEDR` 82, `Dakbedekkingsbedrijven` 58, `VOEDING` 57, `SERVICE` 48,
  `TANKBOUW` 30, `MARITIEM` 14, `WATERZUIV` 12, `LOON (I)` 11, `APPBOUW (E` 1.

  Dutch trade segments — dealer, equipment building, end user, agriculture,
  construction, regional trade, cutting shops, roofing, food, tanks, maritime,
  water treatment. `(E)` marks an export variant and one value is **truncated
  mid-word** (`APPBOUW (E`), so the stored column is narrower than the data.

  It also appears on the quote line ([order-lines.md](order-lines.md) §10), so
  it is a **customer** attribute copied onto documents. It belongs in Part C.

---

## 5. `Order type` here is the **line type**

`Stk` 4 938, `CD` 712 — two values, under a header that reads `Order type`.

This is the third independent confirmation of the warning comment already in
`lib/enums.ts`: the reference uses one header, `Order type`, for two different
fields. On the document screens it is Normal / Call-off / Rush / Ex works; on
the revenue and invoice screens it is the line's sourcing. Keep them apart.

---

## 6. Small things

- **`CBS no.`** — the customs commodity code (`72193310` 1 813, `72193100` 848,
  …), 57 values, blank on 769. Joins to the CBS return already captured.
- **`VAT number`** sits on the line, 287 values, blank on 6. **`Country`** is the
  two-letter code here (`NL`, `DE`, `BE`, `PT`, `GB`, `ES`, …) where the order
  line spells it out (`Nederland`). Two representations, one concept.
- **`Member SFN` is `False` on all 5 650 rows** — switched off, and the fourth
  time an SFN feature has proved unused ([fsp.md](fsp.md) is its sibling).
- **`Region number` is `0` on all 5 650** while `Region` carries 18 values. The
  region has a name and no number.
- **`Representative (Initials)`** is blank on 5 646 of 5 650 — the initials
  column exists but only `Arian Bloks` ever fills it. `Representative (Name)`
  carries the four values from the header export.
- **30 rows have no `Order`** — surcharge lines raised directly on an invoice.

### Against `apps/dashboard` — rebuilt 20-9-2026

`/invoice-lines` read **only `InvoiceItems`**, so the 470 surcharge lines were
not on the screen at all — a tenth of the invoiced rows, and the same omission
the revenue-group screen had. It showed 10 of the reference's 43 columns.

It now carries **40 columns and both kinds of line**. A surcharge row has no
order, no order line and no product; its revenue group comes from its
description — packaging and pallet to 8900, transport to 8100, **decoiling to
3000**, the processing band, because the band follows the thing sold rather
than the kind of line — and it is quantified in euros, as the reference's
`QtyU = Euro` says.

🔴 **The three margins use two conventions, and both are kept.** `Profit margin
products` divides by the size of the revenue and rounds to one decimal;
`Profit margin line` divides by the signed revenue and rounds to two. §3 said
not to build one shared helper, and this is why: on the credit note's figures
(revenue −13 400.25, profit −1 210.29) the live check reproduces the
reference's own pair exactly — **+9.03 on the line, −9.03 on the products**.
`absoluteProfitMarginPercent` was added beside `profitMarginPercent` so neither
can quietly replace the other.

Verified live, 15/15: every order line and every surcharge line is listed
(367 and 3 here), the surcharge money totals the surcharges to the cent,
`Revenue line = products + options` and `Profit line = products + options` hold
on every row, a surcharge carries no order line, and the `Linetype` filter
splits the screen exactly.

Three columns are not carried: `Region number` (`0` on all 5 650),
`Member SFN` (`False` on all 5 650) and `Affiliate company details` (one
constant). `Order type` is labelled `Order type (supply)`, since on this screen
it is the line's sourcing and not the order's own type.

---

# Part 2 — the invoice **header** (item B3)

`Overviews → Sales → Invoices`, `View` = `-empty-`. **27 columns, 1 683 rows**
— `exports/b3-invoices.tsv`. One row per invoice, numbers `500000`–`501713`,
matching the 1 683 invoice numbers the line export carries.

## 7. 🔴 VAT is decided **here**, and the rule is domestic-or-nothing

The line grid has no VAT column at all. The header has one, and it resolves:

| Country | 21 % | 0 % |
| --- | --- | --- |
| Nederland | **1 128** | 13 |
| Germany | 1 | **229** |
| Belgium | 10 | **118** |
| Portugal | 2 | **61** |
| United Kingdom | — | 62 |
| Spain, Lithuania, Italy, France, China, Latvia, Sweden, Poland, Suriname, Ukraine | 2 | 39 |

```
VAT = 21 % of the net amount when the customer is in the Netherlands
VAT = 0            otherwise
```

1 128 of 1 141 Dutch invoices and 524 zero-rated invoices in total. The
exceptions run both ways — 13 Dutch invoices at 0 % and 15 foreign ones at 21 %
— which is what you would expect where a customer's VAT number is missing or
invalid. `VAT number` is on the header (287 values, blank on 3) and so is
`C. of C. no.` (the Dutch KvK registration, blank on 250).

Our `vatCodes` enum exists and **drives nothing**. It can now be wired: one rate
for domestic, zero-rated intra-community and export, with a per-invoice
override.

## 8. 🔴 `Type` — four kinds of invoice

| `Type` | Rows | Amount sign |
| --- | --- | --- |
| `Debit` | 1 616 | positive (9 are zero) |
| `Credit` | 32 | **negative** |
| `Surcharge` | 29 | 23 negative, 6 positive |
| `Correction` | 6 | 5 positive, 1 negative |

A `Credit` invoice is a whole document, not a negative line — it pairs with the
`R` return orders ([returns-and-complaints.md](returns-and-complaints.md)).
`Surcharge` invoices are the 135 rows with `Order = 0`: charges billed with no
order behind them.

## 9. 🔴 Payment terms are a **20-value list with early-payment discounts**

| Code | Terms | Invoices |
| --- | --- | --- |
| `30` | Within 30 days from date of invoice | 665 |
| `102` | **Within 8 days −1 %, 30 days net** | 311 |
| `60` | Within 60 days from date of invoice | 300 |
| `103` | **Within 8 days −1,5 %, 30 days net** | 175 |
| `V` | Prepayment | 100 |
| `7` | Within 7 days after invoice date | 36 |
| `104` | Within 8 days −2 %, 30 days net | 22 |
| `116` | Within 10 days −1.0 %, 30 days net | 14 |
| `998` | Payment in settlement | 12 |
| `45` / `14` | 45 / 14 days | 10 each |
| `C` | Cash | 7 |
| `115` | Within 14 days −2 %, 30 days net | 7 |
| `31` | Within 30 days end of month | 5 |
| `90` | Within 90 days after invoice date | 3 |
| `106` | 10 % Prepayment, balance CAD | 2 |
| `8`, `101`, `119`, `114` | one each | 1 each |

**The code is not always a number of days.** `V`, `C` and `998` are letters or
flags, and the `1xx` band is the discount schemes. Treating the code as an
integer works on 1 030 of 1 576 numeric rows and breaks on the rest — so
`Expiration date` is a stored due date, not a computed one.

⚠️ **531 invoices (32 %) carry a settlement discount** we model nowhere. Codes
`101`–`119` offer 1 %–3 % for paying inside 8–14 days. That is a real cash-flow
instrument, and it also explains part of the payment behaviour the credit
screens show.

`invoicePaymentTerms` in `lib/enums.ts` must be checked against these 20.

## 10. The debt, and the sending machinery

- **`Outstanding amount`** is non-zero on **482 invoices totalling
  €3 370 533.15** — and on every one of those 482 it **equals the invoice
  amount exactly**. The reference records an invoice as open or closed; there is
  no partial payment on this screen.
- **`Expiration date`** — the due date, feeding the overdue-post blocking rule
  whose threshold is still item A1.
- **`Credit restriction` is `0` on all 1 683.** *Kredietbeperking* — the Dutch
  surcharge-then-waive device — exists and is unused.
- **`Mailed?` is `True` on 1 625 and `Printed?` on 101**, each with its own
  timestamp (`E-mail date`, `Print date`) and an `Email` address per customer
  (287 values). Invoices go out by email by default; printing is the exception.
- **`Street + No`, `Postal code`, `City`, `Country`** are on the invoice — the
  address is snapshotted, not joined.
