# Purchase receivals

`Overviews → Purchase → Purchase receivals`. Ours: not yet built.

Planned vs. actual, per **receival** — what was due and what actually arrived,
in both quantity and weight.

**Filters**: `Scheduled delivery date` (from / u/i — defaulted to today on both
sides in the capture), `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product · Supplier ·
Show… · Purchase lines · Warehouse workorders · Production workorders.
**View open when captured**: none selected (blank).

**Now backed by an export** — 151 rows over 107 purchase lines, taken with the
filter set to `7-9-2025 … 7-9-2026`, kept as
`exports/purchase-receivals.tsv`. Everything below is read off it.

## The row grain: one row per receival, not per purchase line

This was the screen's biggest open question and the export answers it flatly.
**151 rows cover only 107 distinct (order, line) pairs.** Twenty-two lines
appear more than once:

| Rows for one line | Lines |
|---|---|
| 1 | 85 |
| 2 | 12 |
| 3 | 3 |
| 4 | 4 |
| 5 | 2 |
| 7 | 1 |

And of the 25 columns, **exactly four vary between the rows of one line**:

| Per-receival | Repeated from the purchase line |
|---|---|
| `Kg(p)` | the other 21 columns — including `Qty(p)`, `Qty(a)`, `Received Qty`, `Line amount`, `Price quantity`, `Line status`, `Receipt date`, `Delivery date (p)`, `Length`, `Options` |
| `Kg(a)` | |
| `Delivery date (a)` | |
| `Receipt status` | |

So a receival is a **weight instalment against a line**, carrying its own
arrival date and its own status. Order `401076` line `10` is the clean example —
39 pieces, one line, four receivals:

| | Kg(p) |
|---|---|
| receival 1 | 471,0 |
| receival 2 | 251,2 |
| receival 3 | 219,8 |
| receival 4 | 282,6 |
| **total** | **1 224,6** |

and the line's `Price quantity` is `1,2246` — the same 1 224,6 kg expressed in
tonnes. **The instalments sum to the line.** That holds on 101 of the 107
lines; the six exceptions are explained below and each turns out to prove
something else.

**What this means for our table:** the row source is a
`PurchaseLineReceivals` table joined *up* to the purchase line, and it holds
only those four fields plus its parent. Not one row per line, and not a
`GROUP BY`.

**And the order detail names the mechanism.** Opening order `400253` shows a
`Receipts` panel whose toolbar carries a **`Split`** button: a reception is
created against the line and then split into instalments. See
[the order detail screen](purchase-order-detail.md#receipts--this-is-the-receivals-table).
That panel also shows the reception carrying its **own** `Qty(p)`/`Qty(a)`
alongside its weights — the overview simply does not expose them, showing the
line's quantities instead.

It also confirms the instalment reading directly. Line `40` of that order is
**345,4 kg** on the order itself; the receivals row for `400253/40` reads
`Kg(p) = 62,8`, the 2 pieces still due of the 11.

## Columns — all 25, matched

| # | Reference heading | What it holds |
|---|---|---|
| 1 | *(no caption)* | purchase order code — the export names the field `PurchaseLineReceivals_PurchaseOrderCode` |
| 2 | *(no caption)* | purchase line code — `…_PurchaseLineCode`, in steps of 10 |
| 3 | *(no caption)* | **supplier** code — `…_CompanyCode` |
| 4 | *(no caption)* | **supplier** name — `…_CompanyName` |
| 5 | Purchase order date | date **and time** (the export carries a fractional day) |
| 6 | Line amount | € for the whole line |
| 7 | Qty(p) | planned quantity, line-level |
| 8 | Unit | `ST` 148 · `TN` 2 · `KG` 1 |
| 9 | Qty(a) | **quantity received so far**, line-level — see below |
| 10 | Received Qty | a **committed** quantity, not a receipt — see below |
| 11 | Price quantity (in gross price U.) | the line's weight in the unit its price is struck in — see below |
| 12 | Invoiced (Prod.) | **the same value as column 11**, on all 151 rows |
| 13 | Options | free-text processing steps, Dutch — see below |
| 14 | Line status | the line's lifecycle, 6 values |
| 15 | Receipt date | actual arrival if there is one, else the planned date |
| 16 | Purchaser | full name, 10 distinct |
| 17 | Initials | the purchaser's initials |
| 18 | Product code | |
| 19 | Product | description |
| 20 | Kg(a) | **actual weight of this receival** |
| 21 | Length | mm — `999999` is a sentinel, see below |
| 22 | Receipt status | **this receival's** state, 5 values |
| 23 | Delivery date (a) | actual arrival date of this receival |
| 24 | Delivery date (p) | planned delivery date, line-level |
| 25 | Kg(p) | **planned weight of this receival** |

The `(p)`/`(a)` pairing is real but asymmetric: `Kg` is per-receival on both
sides, `Delivery date` is planned-per-line but actual-per-receival, and `Qty`
is line-level on both sides.

## `Qty(a)` vs `Received Qty` — answered, and not the way it looked

The guess was that one is per-receival and the other cumulative. **Both are
line-level**, so neither carries the split — that lives in `Kg(p)` alone.

`Qty(a)` is the quantity **actually received so far**. Cross-tabulated against
`Line status` it is exact:

| Line status | Rows | `Qty(a)` |
|---|---|---|
| Provisional | 17 | `0` on all 17 |
| In progress | 3 | `0` on all 3 |
| Released | 76 | `0` on all 76 |
| Partially received | 9 | strictly between 0 and `Qty(p)` on all 9 |
| Received | 43 | `= Qty(p)` on all 43 |
| Invoiced | 3 | `= Qty(p)` on all 3 |

`Received Qty` cannot be an actual receipt: it is **non-zero on 67 rows where
`Qty(a)` is 0**, i.e. where nothing has arrived. It is zero on exactly the 20
`Provisional` and `In progress` rows, and equals `Qty(p)` on 109 of the
remaining 131. So it reads as the **confirmed / committed** quantity — what the
supplier has acknowledged it will send — which is zero until the line is
confirmed.

**Settled outright by [Purchase lines](purchase-lines.md#-qty-ordered-and-qty-confirmed-are-process-flags).**
That screen carries `Qty ordered` and `Qty confirmed` as separate columns, each
either `0` or the full line quantity, recording *has this been ordered with the
supplier* and *has the supplier confirmed it*. `Received Qty` here **is
`Qty confirmed`** — both read 11 on `400253/40` and both read 0 on
`401076/10`. The heading is simply misleading.

That also explains `401099/10`, where `Qty(p) = 58`, `Qty(a) = 58` and
`Received Qty = 60`: the supplier confirmed 60 against a planned 58.

## `Price quantity (in gross price U.)` — the weight in the price's own unit

Divide `Line amount` by it and the answer is a round price on **64 of the 64
lines that carry a price**:

| Line | Amount | Price quantity | € per unit |
|---|---|---|---|
| 400253/40 | 666,62 | 0,3454 | **1 930,00** |
| 400920/10 | 4 835,60 | 1,3816 | **3 500,00** |
| 400983/70 | 1 632,18 | 0,7419 | **2 200,00** |
| 400983/20 | 1 768,00 | 0,8840 | **2 000,00** |
| 400992/10 | 3 750,00 | 1,5000 | **2 500,00** |
| 401076/10 | 2 571,66 | 1,2246 | **2 100,00** |

So the "gross price unit" is a **weight** unit, and for 104 of the 107 lines it
is the **tonne** — `Price quantity` is simply the line's kilograms ÷ 1000.

**The order detail says so outright.** Its line grid carries `Net Price` with
its own unit column reading `TN`, and the `Previous orders` panel prints the
unit inside the cell: **`€ 1.950,00 per TN`**. Better still, two of order
`400253`'s lines are in this export, and they reconcile to the cent —
`1930 × 0,3454 = 666,62` and `1930 × 0,3140 = 606,02`, both exactly the
`Line amount` here. So **`Line amount` = net price per tonne × the line's
weight in tonnes**.

But it is genuinely per-product, which is why the column is named the way it
is. Three lines price in **100 kg** instead:

| Line | Unit | Total kg | Price quantity | ÷ |
|---|---|---|---|---|
| 401084/10 | ST | 72 000 | 720 | 100 |
| 401092/10 | ST | 2 734 | 27,34 | 100 |
| 401092/20 | TN | 10 000 | 100 | 100 |

`401092` comes out at €9,50 per 100 kg — a processing charge, not metal.

Note also that `Unit` (`ST`/`TN`/`KG`) is independent of this: `401090/40` is
bought in `KG` and still priced per tonne, `401092/20` is bought in `TN` and
priced per 100 kg. **The purchase unit and the gross price unit are two
separate things**, which is the whole point of the heading.

**And it follows the actual weight once the line is complete.** Two of the six
sum mismatches are exactly this:

| Line | Σ `Kg(p)` | Σ `Kg(a)` | Price quantity × 1000 |
|---|---|---|---|
| 401085/10 | 157,0 | **154,0** | **154,0** |
| 401127/10 | 706,6 | **693,3** | **693,3** |

Both are `Received`. While a line is still open the figure tracks planned
weight; once it is fully in, it is restated to what actually arrived. That is
also why the price stays round — the supplier bills the delivered weight.

The remaining three mismatches are the earlier receivals of a partially
received line falling **outside the date filter** (`400253/40` shows 62,8 kg
for the 2 outstanding pieces while `Price quantity` still describes all 11) and
the two `401092` lines, whose 100 kg unit is already accounted for.

## `Invoiced (Prod.)` — the same column twice

It is **identical to `Price quantity` on all 151 rows**, including the 17
`Provisional` rows, which cannot have been invoiced at all. So it is one field
shown under two headings, exactly like `Purchase order type` appearing twice on
[Purchase lines](purchase-lines.md).

It is also **not money**, despite the grid rendering it as `€ 0,35`. The
underlying value is `0,3454` — a quantity wearing a currency mask.

## `Line status` vs `Receipt status` — two genuinely different fields

`Line status` is the purchase line's lifecycle, and the six values fall into an
obvious order:

`Provisional` → `In progress` → `Released` → `Partially received` → `Received`
→ `Invoiced`

`Receipt status` belongs to the individual receival: `New` · `Released` ·
`Workorders created` · `Received` · `Invoiced`.

The proof that they are independent is the `Partially received` lines. There
the receivals that arrived read `Received` (5 rows) and the ones still due read
`Released` (4 rows) — **on the same line, same `Line status`**. Only eight
combinations occur in 151 rows:

| Line status | Receipt status | Rows |
|---|---|---|
| Released | Workorders created | 53 |
| Received | Received | 43 |
| Released | Released | 23 |
| Provisional | New | 17 |
| Partially received | Received | 5 |
| Partially received | Released | 4 |
| In progress | Released | 3 |
| Invoiced | Invoiced | 3 |

`Workorders created` is the interesting one: 53 receivals have already raised
their warehouse/production work orders while the line is merely `Released` —
which lines up with the toolbar's `Warehouse workorders` and
`Production workorders` buttons, and with
[the work-order model](../../../docs/reference-system/README.md).

## The dates

- `Delivery date (a)` and `Kg(a)` are filled **together or not at all** — 51
  rows both, 100 rows neither, **zero rows one without the other**. An arrival
  stamps date and weight in one go.
- `Receipt date` **equals `Delivery date (a)` on all 51** arrived rows, and
  equals `Delivery date (p)` on 146 of 151 overall. So it is derived: *actual
  if known, else planned*. `401081/10` is the case that separates them —
  planned `2025-09-30`, arrived `2025-11-21`, and `Receipt date` reads
  `2025-11-21`.
- **The filter is on the planned date**, as expected: with the range set to
  `7-9-2025 … 7-9-2026`, `Delivery date (p)` and `Receipt date` are inside it
  on all 151 rows, while `Delivery date (a)` falls outside on 100 and
  `Purchase order date` on 25. (`Delivery date (p)` and `Receipt date` cannot be
  told apart by this test, since the 5 rows where they differ are inside the
  range on both.)

## Two small things worth copying

**`Length = 999999`** on 32 of 151 rows — a sentinel for coil / endless
material, not a real 999 metre bar, **confirmed** on the order detail where the
999999 line is `CK304L0015`, *Coil Cold-rolled 3…*. One row carries `0`. Our
UI should render both as blank rather than as a number.

**`Options`** is free text holding processing steps, and it is Dutch, so it
needs translating per the English-only rule:

| Reference | English | Rows |
|---|---|---|
| *(blank)* | — | 123 |
| `Decoilen` | Decoiling | 13 |
| `Slijpen (K320), Laser Folie` | Grinding (K320), Laser film | 7 |
| `Slijpen (K320)` | Grinding (K320) | 3 |
| `Borstelen, Laser Folie` | Brushing, Laser film | 2 |
| `Knippen` | Cutting | 2 |
| `ShearCut` | ShearCut | 1 |

It is a comma-separated list, so it is really a many-to-many onto a processing
table rather than a string column. The order detail has an `Options` panel,
never expanded, which is presumably where they are chosen — and a row of quick
buttons on the line grid (`DUPK320`, `NG`, `K320`, `BF F L K`) that look like
one-click versions of the same thing.

## ✅ Nothing left blocking

All seven questions this screen was carrying are answered by the export. The
one residual — `Received Qty = 60` against `Qty(p) = 58` on `401099/10` — does
not block building, since the column is a plain passthrough either way.

The four unlabelled headers (1–4) still have no readable **caption**, but the
export names the fields, so we know they are order code, line code, supplier
code and supplier name. A caption can be chosen on our side.
