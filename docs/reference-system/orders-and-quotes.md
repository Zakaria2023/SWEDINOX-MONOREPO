# Orders and Quotes — the sales document header

**Item B1 of [WHAT-IS-LEFT.md](WHAT-IS-LEFT.md), captured 13-9-2026.**
`Overviews → Sales → Orders and Quotes`, `View` = `-empty-`, creation date from
`1-1-2024`. **40 columns, 2 091 rows** — `exports/b1-orders-and-quotes.tsv`.

This is the first export ever taken from the Sales menu. Everything the rebuild
believed about the selling side came from screenshots of one or two documents;
this is the whole population.

The filter caught everything the database holds: creation dates run
**2024-12-31 → 2026-09-09**, so 2 091 is not a sample, it is the total.

---

## 1. 🔴 One screen, one status ladder, **four number series**

The screen is not "orders, and also quotes". It is one header table holding
**three different document types**, told apart only by the letter on the number.

| Prefix | Range | Rows | What it is |
| --- | --- | --- | --- |
| `O` | 100000 – 102190 | 2 041 | Sales orders |
| `R` | 290000 – 290051 | 43 | **Sales return orders** |
| `Q` | 300001 – 300006 | 6 | Quotes |
| `B` | 250000 | 1 | Unknown — see §8 |

**This answers item G11.** The `29xxxx` series that kept turning up in the
logistics exports with no home is the sales **return order**. It is not a
separate screen and it is not a credit note — it sits in the same grid as the
orders, with the same columns.

The `O` series has **154 gaps** in its span (2 037 distinct numbers across
2 191 slots). Numbers are consumed and not always kept.

---

## 2. 🔴 `Status` has **ten** values, not four

The code ships `orderStatuses = ["open", "confirmed", "completed",
"cancelled"]`. None of those four strings exist in the reference. The real list,
counted across all 2 091 rows:

| Status | Rows | Seen on |
| --- | --- | --- |
| `Invoiced` | 1 657 | O, R |
| `Released` | 195 | O, R, Q |
| `In progress` | 99 | O |
| `Provisional` | 71 | O, R, Q, B |
| `Partially invoiced` | 22 | O |
| `Partially delivered` | 17 | O |
| `Completed` | 17 | O |
| `Checked` | 7 | O, R |
| `Received` | 4 | **R only** |
| `Expired` | 2 | **Q only** |

Read as a ladder: `Provisional → Released → Checked → In progress → Partially
delivered → Partially invoiced → Invoiced → Completed`, with `Received` a
return-only rung and `Expired` a quote-only terminus.

**Quotes share the ladder.** Our `Quotes` table has no `status` column at all —
it carries a `expired` boolean instead. The reference puts `Provisional`,
`Released` **and** `Expired` on quotes, so `expired` is one value of a status,
not a flag beside it.

`Returns` fare better: `returnOrderStatuses` already holds `received`, but not
`provisional`, `checked` or `invoiced`.

---

## 3. 🔴 `Profit margin` divides by the **absolute** revenue

```
Profit margin = round( Profit / |Revenue| × 100 , 1 )
```

**0 mismatches across 2 091 rows.** The naive `profit / revenue` fails on 44 of
them — every return order, because a return carries negative revenue and the
sign flips.

The zero case is its own rule, and it is not zero:

| Revenue | Profit | Margin |
| --- | --- | --- |
| 0 | 0 | `0` |
| 0 | > 0 | `100` |
| 0 | < 0 | `-100` |

`O100756` is the proof of the last row: revenue `0`, profit `-0.11`, margin
`-100`.

`lib/helpers.ts` currently holds:

```ts
export const profitMarginPercent = (revenue: number, profit: number): number =>
  revenue === 0 ? 0 : (profit / revenue) * 100;
```

— which is wrong on both counts, and is used by the dashboard tile, the options
screen and `orders/actions.ts`. Four more screens inline the same wrong
expression.

---

## 4. A return is a **negative** order, not a separate shape

All 41 return orders that carry values carry them negative — revenue, weight and
line counts alike:

```
R290043  lines 2   wt -14339   rev -38285.13   profit -2796.10
R290051  lines 1   wt -10000   rev -20000      profit -10000
```

**Every row with negative revenue in the whole export is `R`-prefixed**, and
every one of those has weight ≤ 0. The two exceptions are a `Provisional` return
with nothing on it yet (`R290047`) and a `Received` return awaiting pricing
(`R290050`, weight `-707`, revenue `0`).

Profit is *not* always negative — `R290002`, `R290014`, `R290033` and `R290044`
come back with a positive profit, meaning the goods were credited for less than
they cost to take back.

---

## 5. `Order type` gains a fourth value

| Order type | Rows |
| --- | --- |
| `Normal` | 2 069 |
| `Call-off` | 16 |
| `Rush` | 5 |
| **`Ex works`** | **1** |

`orderTypes` in `lib/enums.ts` holds three. `Ex works` is missing.

This also **confirms** the note already in the enum's comment: the `Order type`
column on this screen really is the header dropdown (Normal / Call-off / Rush),
not the line sourcing that the revenue screens put under the same header.

`Pick-up` is a separate boolean and does not track it — 307 `Normal` orders are
pick-ups, all 16 `Call-off`s are not, and 3 of 5 `Rush` orders are.

---

## 6. Two fields the header has and we do not

- **`Representative`** — four values on 2 091 rows: `Hego` (2 082), `Export`
  (4), `Arian Bloks` (3), `BNL` (2). Not the seller: `O101734`'s representative
  is `Arian Bloks` while its seller is `André van der Veen`, and all four
  `Export` rows belong to one Ukrainian customer. This is a channel/agency on
  the header, and `Orders` has no column for it.
- **`Affiliate company details`** — `HEGO TEST Stainless Steel & Aluminium` on
  every row. The owning legal entity. Single-valued here, so nothing to build,
  but it is why the reference can run more than one company on one database.

---

## 7. What is switched off

Seven of the forty columns are blank on **every one of 2 091 rows**. Per the
standing rule — *a column blank on every row of a full export is evidence* —
these features exist and are unused:

- `Pick-up slip`
- `Converted from/to`
- `Last follow-up`, `Last follow-up reason`
- `Internal Text`
- `Classification code`, `Classification`

Two more are effectively off: `Decision date` and `Last follow-up date` are `0`
on all 2 091 rows, **including the six quotes**. The quote follow-up machinery
is modelled in the reference and has never been used.

⚠️ **`Converted from/to` is the weak one.** Only six quotes exist in the entire
database and none was converted, so its emptiness says the feature is unused —
not that quote-to-order conversion is absent from the product.

---

## 8. Small things worth keeping

- **`Time frame`** is derived, not stored: the creation timestamp floored to the
  half hour, printed `HH:MM - HH:MM`. **0 mismatches / 2 091.** Same for
  `Year (Creation Date)` and `Month (Creation Date)`.
- **`Delivery date` is never empty** — all 2 091 rows carry one, including every
  `Provisional` document. It is `NOT NULL` on the header.
- **`Quote date` / `Valid u/i` are quote-only.** `0` on all 2 085 non-quotes.
  All four quotes that have one are valid for **3 days** except `Q300006`
  (1 day). There is no long validity window in the data.
- **`Order method`** is nullable — blank on 169 rows (8 %), which is *every*
  return order (43) plus 125 orders and one quote. Values seen: `Telephone`
  (1 190), `E-Mail` (719), `Counter` (12), `Oral` (1). Our enum's `representative`,
  `website`, `edi` and `ai_read_email` appear nowhere.
- **The send flags are a set of three**, and only four combinations occur:

  | Send | Deliberately not sent | Must be sent | Rows |
  | --- | --- | --- | --- |
  | True | False | True | 1 482 |
  | False | True | True | 337 |
  | False | False | True | 227 |
  | False | False | False | 45 |

  `Send = True` never coexists with `Deliberately not sent = True`. The 227 are
  the real outstanding queue: must be sent, not sent, not waived.
- **`Onze referentie` is untranslated** in the reference itself — "our
  reference", beside the customer's `Reference`. We already have both
  (`ourReference`, `customerRef`). 13 rows of 2 091 fill it.
- **`Customer code` ↔ `Customer` is 1:1** across all 335 customers. No code
  carries two names, no name two codes.
- **`Lines = 0`** on 56 rows — all `Provisional` (39) or `Released` (17). Eight
  of them still carry a revenue, which means the header total is stored, not
  summed from lines at read time.
- **Two rows have no seller at all** (`O100016`, `O100043`), so `seller` is
  nullable.

---

## ⚪ Two things this export does not settle

- **`B250000`.** One row, prefix `B`, its own series. `Provisional`, order type
  `Rush`, pick-up, order method `Oral`, seller `Hamza Dabbagh`, customer
  `zakaria test`, revenue €15 with 0 lines, created 2026-06-30. It is test data
  somebody typed, but the prefix is a fourth document type the menu never names.
  **Ask what `B` is.**
- **Four orders appear twice.** `O102166`–`O102169` each occupy two rows that
  are identical in 37 of 40 columns — same customer, same single line, same
  revenue, same delivery date. They differ only in `Creation date`, and its two
  derived columns. The first row of each pair was created 2026-07-28 at its own
  time; the second row of all four carries the **exact same** timestamp,
  2026-09-09 11:16:26. Something re-stamped four orders in one action without
  giving them new numbers. Nothing else in the export explains it.

---

## What it means for the rebuild

Queued in [PLANNED-CODE-CHANGES-3.md](PLANNED-CODE-CHANGES-3.md). In short: the
status enum is wrong, the margin formula is wrong on returns, `Ex works` is
missing, quotes need a status instead of a boolean, and `Representative` has no
column.

**Still unproved.** This is the header only. Nothing here touches the price
build-up, the discounts, the `Stk`/`CD` split or the VAT scenarios — those are
**B2 (Order lines)** and **B3/B4 (Invoices, Invoice lines)**. Discounts
cascading is still proved on exactly one quote line.

---

### Against `apps/dashboard` — rebuilt 20-9-2026

The substance was already right: four series in one grid, the ten-value status
ladder, the margin divided by the **absolute** revenue so a return does not
report a loss as a gain, and the quote's own dates. What the screen lacked was
half its columns and any paging at all.

It now carries **32 columns**, paged, searchable and filterable, with an export.

🔴 **The three send flags resolve.** `Must be sent`, `Deliberately not sent` and
`Send` are not three views of one thing: the first two are stored and `Send`
means **still to be sent**. The reference's own cross-tab proves it —

| Must be sent | Deliberately not sent | Send | Rows |
|---|---|---|---|
| False | False | False | 45 |
| True | False | **True** | **1 482** |
| True | False | False | 227 |
| True | True | False | 337 |

`Send` is true on exactly the must-send-and-not-held-back set of 1 709 **less
the 227 that had already gone out**. `mustBeSent` and `deliberatelyNotSent`
were added to `Orders`, `Quotes`, `ReturnOrders` and `CounterOrders`; `Send` is
derived from the pair and the printed/mailed/faxed flags, and the live check
asserts the identity on every row.

**`Time frame` is derived, not stored** — the creation time floored to the half
hour — and reproduces the reference's format exactly, including the roll at
`11:59 → 11:30 - 12:00`.

**`Representative` is the customer's, not the seller's.** The reference shows
documents typed by one person against another's account, and its four values
match the customer distribution. It is read from the company rather than
snapshotted, which is the same trade-off the invoice address has: right for a
current view, wrong for a reprint of an old document.

Seven columns are not carried because they are blank on **every one of 2 091
rows** — `Pick-up slip`, `Converted from/to`, `Last follow-up`, `Last follow-up
reason`, `Internal Text`, `Classification code`, `Classification` — plus
`Affiliate company details`, which is one constant. ⚠️ `Converted from/to`
being blank says the feature is unused, **not** that quote-to-order conversion
is absent: only six quotes exist there and none was converted.

The four reads also run one after another now rather than through a
`Promise.all`; four large queries at once is how the connection cap gets hit.

Verified live, 24/24.


---

## ✅ Step 7, 7-10-2026 — `Status` grouped on the live grid

`Orders and Quotes`, creation date `1-1-2024` → `7-10-2026`, `Weergave`
`-leeg-`, grouped on `Status`. Groups as shown, alphabetical, **no counts on
the headers**:

```
Checked · Completed · Converted · Delivered · Expired · In progress ·
Invoiced · Partially delivered · Partially invoiced · Provisional
```

⚠️ The list very likely continues below `Provisional` — `Released` alone was
195 rows in the export §2 was built from — and the screen was not scrolled.
Requested.

🔴 **Two values the export never showed: `Converted` and `Delivered`.** §2's
ten came from 2 091 exported rows; the live grid over a shorter window has two
more. `Converted` is presumably a quote that became an order (the grid has a
`Converted from/to` column), which would make it the third quote-only terminus
beside `Expired`. `Delivered` sits between `Partially delivered` and
`Partially invoiced` on the ladder — fully delivered, nothing invoiced yet —
which is what §7 of order-lines.md records as `Completed` on a *line*. Whether
header `Delivered` and header `Completed` are two rungs or one word on two
screens is to be read off the rows. Requested.

Our `orderStatuses` holds neither. Queued as
[PLANNED-CODE-CHANGES-7.md](PLANNED-CODE-CHANGES-7.md) §9.


### ✅ The two new groups opened, 7-10-2026

**`Converted` — quotes only.** Two rows, both `Q`:

| Created | Quote | Converted from/to | Lines | Kg | Revenue | Profit | Customer | Quote date | Valid u/i | Order method |
|---|---|---|---|---|---|---|---|---|---|---|
| 23-4-2026 11:30–12:00 | `Q300013` | **`O106623`** | 6 | 1 334 | € 4.134,46 | € 989,22 (23,90 %) | Pustjens Metaalbewerking BV | 24-4-2026 | 27-4-2026 | Telephone |
| 23-4-2026 13:00–13:30 | `Q300014` | **`O106616`** | 5 | 38 | € 210,63 | € 97,27 (46,20 %) | Metaalketen Noord-Oost B.V. | 23-4-2026 | 26-4-2026 | Telephone |

So `Converted` is the third quote-only terminus beside `Expired` (and
`Released` for a live one), and `Converted from/to` is the link: on the quote
it holds the order number. Both carry `Send` ☑ and `Must be sent` ☑,
`Consignment` ☐, `Deliberately not sent` ☐, `Pick-up` ☐, `Incidental` ☐,
`Reference` `24/4` / `23/4`, `Order type` `Normal`, `Representative` `Hego`.

**`Delivered` — orders only.** One row: `O105922`, created 27-2-2026, seller
Cherice van Ro…, 4 lines, 4 904 kg, revenue € 9.906,08, profit **€ −168,88
(−1,70 %)**, Tamegainox LdA, delivery date 26-5-2026, customer `13214`, `Send`
☑, `Must be sent` ☑, `Order method` blank. Everything delivered, nothing
invoiced — a real rung between `Partially delivered` and `Partially
invoiced`, and not the same thing as `Completed`, which has its own group.

**`Provisional` spans the three series** in one group: `O104076`
(20-10-2025, 0 lines, € 15,00, Lootens Belgie BV, `E-Mail`, reference
`202512196`), `Q300007` (24-11-2025, 12 lines, 33 706 kg, € 34.401,34 at
92,50 %, UAB Metalinox, `Send` ☐) and **`R290157`** (14-1-2026, 0 lines,
€ 0,00, Groku Kampen BV, `Pick-up` ☑) — the return series is `R29xxxx`.

⚠️ Below `Provisional` the grid was still not scrolled; `Received` and
`Released` are expected there and remain unconfirmed on the live grid.

🔑 **J7 in passing:** the grid carries two columns, `Classification code` and
`Classification`, and both are **blank on all six rows** seen. Not closed —
six rows — but it leans the same way `Order method` went.

⚠️ **The data runs to April 2026.** `Q300013` was created 23-4-2026 with a
delivery date of 29-4-2026, on a database once described as frozen in
mid-May 2025. See K10.


### ✅ Below `Provisional`, and `Classification code` — 7-10-2026

**`Released` is the last group.** Four rows: `O100131`, `O100133`, `O100391`
(all Marco Borsboom, January 2025, 0 lines, € 0,00) and `O103593` (Furkan
Sadir, 17-9-2025, 3 lines, 5 912 kg, € 13.994,03 at 58,20 %, SZK Fast
Transport). **No `Received` group** in 2024–2026 — it would sit between
`Provisional` and `Released` — so the live grid's list is eleven:
`Checked · Completed · Converted · Delivered · Expired · In progress ·
Invoiced · Partially delivered · Partially invoiced · Provisional ·
Released`. `Received` stays a return-only rung known from the export, not
disproved, just absent from this window.

**`Classification code` grouped: one group, blank, holding every row.** The
column is never filled. J7's `Orders and quotes` dropdown is closed the way
`Order method` closed. The second column, `Classification`, is blank on every
row seen too.

🔑 **The order series starts at `O100000` on 31-12-2024** — the first rows of
the blank group — exactly as purchase invoices start at `600000` in January
2025. The database begins at the turn of 2025.

### 🔑 `Hego Reserveringen` — stock parked on € 0 orders

The expanded `Provisional` group (14 rows) holds an internal customer,
**`Hego Reserveringen`**, carrying real lines and tonnage at zero revenue:

| Order | Created | Seller | Lines | Kg | Revenue | Profit |
|---|---|---|---|---|---|---|
| `O105318` | 20-1-2026 | Hego | 10 | 3 497 | € 0,00 | **€ −3.561,07** (−100 %) |
| `O107910` | 21-8-2026 | Hego | 8 | 66 950 | € 0,00 | **€ −136.591,11** |
| `O108123` | 7-9-2026 | Furkan Sadir | 1 | 22 510 | € 0,00 | **€ −42.079,16** |

Profit at −100 % is the cost of the reserved lots with nothing against it:
these orders exist to *hold* stock, not to sell it — the same mechanism as a
customer order's reservation, pointed at an in-house customer. `O108300`
(INAD, 3 925 kg, € −8.554,51) looks the same. The export (to mid-2025) held
one such order (`O100643`, 72 kg); the practice grew in 2026. Who
`Hego Reserveringen` is — `Internal` ☑? — is requested.

Also in that group: `Q300026` (Benno Vos, 3 lines, **60 096 kg**,
€ 182.691,84 at 100,00 % — a quote with no cost yet), `R290237` (a second
return in the `R29xxxx` series), and `Time frame` on every row — the
half-hour slot the document was created in (`14:00 - 14:30`).
