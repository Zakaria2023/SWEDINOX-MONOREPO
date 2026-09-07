# Purchase quotes

`Overviews → Purchase → Purchase quotes`. Ours: `/purchase-quotes`.

One row per quote **line** — `Line` is a column and the header fields repeat
down the group.

**Filters**: `Quote date` (from / u/i), `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product ·
Show Company · Show Purchase quote | Order lines · Orders and Quotes |
Afhalen.
**View open when captured**: none selected (blank).

## 🚩 The screen has one row in three years — and it is a mistake

Filtered `7-9-2023 … 7-9-2026`, the grid returns **exactly one line**:

| Field | Value |
|---|---|
| Supplier | Holland Stainless Int (`11692`) |
| Purchase quote / Line | `900000` / `10` |
| Quote date / Valid u/i | 22-6-2026 / **22-6-2026** — same day |
| Status | **`Expired`** |
| Expiration reason | **`Incorrectly entered`** |
| Product code / description | `Offerte` / `Steel` |
| Quantity / Kg / Amount | 1 TN / 1 000 / **€ 0,00** |
| Consignation | ☐ |

`Offerte` is Dutch for *quote*, the product is a placeholder called `Steel
Offerte`, every money field is zero, and the system's own reason says it was
entered incorrectly. **This is a test row, not a quote.**

So on the evidence, **purchase quotes are not used** — three years, one
mis-entry. That is the same shape as Import purchase invoices, which has now
left scope entirely. **The decision taken was different, though: this screen
stays.** See the bottom of this file.

⚠️ **Correction: `Consignation` is a header field, not a line field.** The
overview's `Consignation` column had suggested it sat on the line. Creating a
quote live shows it as **`Consignatie`** — Dutch, untranslated — a checkbox in
the header's top-right block, directly under `Overlength`:

```
Purchase order type
  [Materials        ]
  [-empty-          ]
  ☑ Overlength
  ☐ Consignatie
```

So it is one flag per document, not per line. Our schema needs it on the quote
header.

## ✅ Verified live, by creating a quote

A test quote was built on the `HEGO TEST` affiliate — supplier `11692`,
one line of `PK304L20021`, 10 ST at €1 930/TN — and it confirms three
formulas at once:

| Figure | Reference showed | Check |
|---|---|---|
| `Kg(p)` | **314** | `10 × 31,4` — the density formula, computed live |
| `Amount` | **€ 606,02** | `1 930 × 0,314` — price × weight in the price's own unit |
| `VAT` | **€ 127,26** | `606,02 × 0,21` — so **`VAT high` is 21 %**, the Dutch standard rate |
| `Tot. incl. VAT` | **€ 733,28** | `606,02 + 127,26` |
| `Total weight` | **314 Kg** | the line's `Kg(p)` |

### 🔑 `Options` is its own table, and it carries its own pricing basis

Adding the `K320` quick button opened an **`Options` panel** below the lines —
a separate grid, not extra columns on the line:

| Seq. | Option | Qty | U | Gross price | **Per** | Discount | U | Amount | Reference factor | Net price | Specificatie |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 10 | `Grinding` | 10 | ST | € 0,00 | **`M2`** | 0,00 | % | € 0,00 | 1 | € 0,00 | `K320` |

**`Per` = `M2`.** The option's pricing basis is a **field on the option row**,
so it is per option rather than global — which is exactly what the Purchase
lines arithmetic implied (surface treatments per m², decoiling per tonne) and
now confirms structurally rather than by inference.

`Amount` is € 0,00 only because no `Gross price` is maintained for this option
with this supplier. `Reference factor` (1) is a multiplier and `Specificatie`
(`K320`) is the grade.

The quick buttons under both the Lines and Options toolbars are
`DUPK320` · `NG` · `K320` · `BF` · `F` · `L` · `K` · `LSR`.

### `Bev. Nettoprijs` is a button, not just a column

The line toolbar gains **`Bev. Nettoprijs`** (*confirm net price*) once a line
exists, matching the `Bev. Nettop…` column. So a quote's net price is
explicitly confirmed rather than derived.

### Converting to an order

`Purchase order` in the toolbar converts, after a confirmation dialog reading
*"This converts the entire purchase quote into a purchase order. Choose Cancel
if this is not the intention."*

The result: **order `401154`**, status **`Provisional`**, and its header prints
**`Converted from quote 900000`** under the delivery block. So:

- a converted order **starts `Provisional`**, matching the status lifecycle;
- the link back to the quote is a real field, not a note;
- quote numbers are a **9-series** (`900000`) and orders a **4-series**
  (`401154`).

⚠️ **`Consignatie` does not appear on the purchase order header.** The order's
top-right block holds `Overlength` ☑, `Printed`, `Mailed`, `Faxed`,
`Message sent via StaalWeb` and `Do not print prices` — no consignment
checkbox. Either it is quote-only, or it moved somewhere not yet looked at.
That is now the open half of the consignment question; see
[MANAGER-QUESTIONS.md](../MANAGER-QUESTIONS.md).

## Columns — 27, all captured

| # | Reference heading | Notes |
|---|---|---|
| 1 | Supplier | grid was sorted on this |
| 2 | Quote date | |
| 3 | Valid u/i | "valid until" — `u/i` is this system's "to" throughout |
| 4 | Quote nr. supplier | the supplier's own reference |
| 5 | Purchase quote | our quote number — `900000`, a 9-series where orders are 4-series |
| 6 | Line | |
| 7 | Status | `Expired` observed |
| 8 | Expiration reason | `Incorrectly entered` observed |
| 9 | Revenue group number | `2900` |
| 10 | Revenue group | `Other products` |
| 11 | Product code | |
| 12 | Product description | note: `Product description` here, `Description` on order advice |
| 13 | Length · 14 Width | **no (mm) suffix** here, but the detail screen prints `0 mm`, so millimetres |
| 15 | Quantity · 16 QtyU | quantity and **its unit as a column** (`TN`) |
| 17 | Kg | |
| 18 | Net price · 19 PriceU | price and **its unit as a column** (`TN`) |
| 20 | Amount | |
| 21 | Company code | **the supplier's** — `11692` = Holland Stainless Int |
| 22 | Internal Text | |
| 23 | Consignation | **a checkbox**, confirmed on screen |
| 24 | Initials purchaser | `BV` |
| 25 | Purchaser | `Benno Vos` |
| 26 | Onze referentie | **untranslated Dutch** — "our reference" |
| 27 | Purchase Reference | |

The `Quantity` / `QtyU` and `Net price` / `PriceU` pairs are the same
unit-beside-the-number pattern as
[Purchase lines](purchase-lines.md#-amountp--price--weight-in-the-prices-own-unit).

## The quote detail screen — `900000`

Title: `Purchase quote 900000, Holland Stainless Int, Tel: 06 50 65 63 38,
Fax: - Expired`.

**Toolbar**: Print… · Purchase order *(greyed)* · Show company ·
Show order *(greyed)* · Options… *(greyed)* | Order lines · Orders and Quotes ·
**Stock on location** | Afhalen · **Hego Prod - Lossen**

`Purchase order` is the convert-to-order action, greyed because this quote is
expired. `Afhalen` is *collect* and `Lossen` is *unload* — warehouse actions
sitting on a purchase document.

**The header is the same layout as [the purchase
order](purchase-order-detail.md#header)**, which is the useful part: creation
date, supplier, `Agent`, `Contact`, `Purchaser`, `Order category`,
`Reference`, the `Purchase order type` pair, `Overlength` ☑ greyed, payment
terms, the whole delivery block, and the same **`Date` + `Rem` / `Week` +
`Year`** radio pair for the delivery date.

Two blocks are specific to a quote:

| Block | Fields |
|---|---|
| `Quote` | `Quote No:` (blank) · `Quote date` · `Valid u/i` |
| `Follow-up` | **`Expired because:`** → `Incorrectly entered` |

So `Expiration reason` on the overview is the detail's `Expired because`. Note
`Quote No` is **blank on the header** while the overview shows `900000` — so the
header field is the *supplier's* quote number and the 900000 is ours.

`Summary` is identical to the order's: `Materials` · `Options` · `Surcharges` ·
`Tot. excl. VAT` · `VAT` · `Tot. incl. VAT` · `Total weight` (1 000 Kg).

### ✅ The line grid gives the discount model

Columns: `Code` · `Product` · `Description` · `Qty(p)` · `U` · `Length` ·
`Kg(p)` · **`Gross Price`** · `Thickness` · **`Net Price`** · `U` ·
**`Line Discount`** · `U` · **`Group Discount`** · `U` · `Amount` ·
`Delivery date` · `Status` · `Bev. Nettop…`

| Code | Product | Qty(p) | Kg(p) | Gross | Net | Line disc. | Group disc. | Amount | Status |
|---|---|---|---|---|---|---|---|---|---|
| 10 | Offerte | 1 TN | 1 000 | € 0,00 | € 0,00 / TN | 0,00 % | 0,00 % | € 0,00 | Expired |

**Both discounts are percentages, each with its own `U` column reading `%`.**
That completes the price chain seen on the order's
[`Previous orders`](purchase-order-detail.md#previous-orders) panel, where
`Group discount` and `Line discount` were both `0 %` and `Net price` equalled
`Gross price`:

```
Net price = Gross price − Group discount % − Line discount %
Amount    = Net price × weight, in the price's own unit
```

`Status` is **per line** here as well as on the header — the line reads
`Expired` too.

`Bev. Nettop…` is truncated Dutch, almost certainly *Bevestigde nettoprijs* —
the confirmed net price. Reads € 0,00.

## 🔑 The product master looks different for a non-material product

`Show Product` on that line opens `Hego Offerte`, and its **`Basis` panel is a
different shape** from the plate captured in
[product-detail.md](../product-detail.md):

| | Plate (`PK316L40021`) | Piece article (`Offerte`) |
|---|---|---|
| `Product` (shape) | `Plaat` | **`Stuksartikel`** (*piece article*) |
| Dimensions | Length · Width · Thickness + `Fixed dimensions` ☑ | **none at all** |
| `Weight` | **7 850,000 KG/M3** — a density | **1 Kg/Psc** — a weight per piece |
| Three weights | Theoretically · Trade · German | **absent** |
| Other | Paint surface · Quality · Standards · Classification features | **`Color`** · **`Kwaliteit`** · free-text `Description` |
| Shared | `Options` list · `Processed → Option / Source product` | same |

**This qualifies the weight formula.** `length × width × thickness × density`
holds for **dimensioned** products; a `Stuksartikel` has no dimensions and
carries its weight per piece directly. So weight is derived for plate and coil
and *stored* for piece articles — our schema needs both paths, which is what
`theoreticalWeight` alongside a per-piece weight already allows.

Also here: `Material group` = **`Steel`**, a root-level group, and `Commodity`
= **`-leeg-`** (Dutch for *empty*, the same untranslated string as the company
screen's `Work panel color`). `Kwaliteit` is Dutch for *Quality*, which the
plate screen spelled in English — the reference is inconsistent between product
types.

## ✅ Answers to the old questions

**`Company code` is the supplier's**, not the branch — `11692` is Holland
Stainless Int on the same row. (Question 7.)

**`Length` and `Width` are millimetres.** The overview omits the unit but the
detail grid prints `0 mm`. (Question 8.)

**`Initials purchaser` and `Purchaser` agree** — `BV` / `Benno Vos`, and the
[receivals export](purchase-receivals.md)'s ten-row mapping is consistent
throughout. It is a display convenience; store one field. (Question 6.)

**`Consignation` is a checkbox.** (Part of question 5.)

**`Revenue group` reaches `2900 = Other products`**, adding to Purchase lines'
`1000 = SS 304`, `1100 = SS 316`, `1300 = SS 430`. So the groups are grade
families with a catch-all. Whether it is editable on the line is still unknown.
(Part of question 4.)

**`Status` and `Expiration reason` each have one known value** — `Expired` and
`Incorrectly entered`. With one row in the system, grouping the grid cannot
produce more. (Questions 1 and 2.)

## ⚖️ Decision: the screen stays, as a read-only table

The screen keeps its table view and its route (`/purchase-quotes`). It is
**not** removed the way Import purchase invoices was, and its actions are out of
scope for now.

Every remaining question about it has moved to
[MANAGER-QUESTIONS.md](../MANAGER-QUESTIONS.md) — they need someone who knows
the business, not another click. Nothing about Purchase quotes is a step any
more.

⚠️ **One honest caveat on the row count.** Re-running with `Quote date`
**from** left *blank* and **u/i** set to `31-12-2099` returned **zero** rows —
*fewer* than the narrower `7-9-2023 … 7-9-2026` range, which returned one. So
the blank `from` voided the filter rather than widening it; it did **not**
prove the table is empty.

The defensible statement is therefore: **at most one quote exists in the three
years to September 2026, and it is a test entry.** To get a real total, set
**from** to a real date such as `1-1-2000` rather than leaving it blank.
