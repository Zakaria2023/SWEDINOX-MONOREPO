# Charges — the surcharge tariff

**Item B8 of [WHAT-IS-LEFT.md](WHAT-IS-LEFT.md), captured 13-9-2026.**
`Overviews → Sales → Charges`, `View` = `-empty-`. **24 columns, 1 504 rows** —
`exports/b8-charges.tsv`.

⚠️ **This screen is half untranslated.** Nine of its 24 column headers are still
Dutch: `Verkoopordertype` (sales order type), `Leverdatum` (delivery date),
`Toeslag` (surcharge), `Bedrag valuta` (amount in currency), `Bedrag` (amount),
`Kosten` (cost), `Vanaf` (from), `T/m` (up to and including), `Prijs` (price).
It is one of the screens the reference never finished localising, so its Dutch
is evidence of the underlying field names.

---

## 1. 🔴 `B250000` is a **Counter order** — question closed

`Verkoopordertype` names four document kinds, and the reference gives them its
own names:

| `Verkoopordertype` | Rows | Code series |
| --- | --- | --- |
| `Order` | 1 495 | `100000`–`102184` |
| `Return` | 5 | `290000`–`290046` |
| `Counter order` | 2 | **`250000`** |
| `Quote` | 2 | `300001`, `300003` |

[orders-and-quotes.md](orders-and-quotes.md) found a stray `B250000` and could
not name it. This names it: **`B` is a counter order** — *balieorder*, a walk-in
sale. Both its rows are the same document, the `zakaria test` row, carrying a
€5 packaging surcharge and a €10 pallet surcharge.

So the four sales series are settled:

```
O 1000xx  Order        R 2900xx  Return
B 2500xx  Counter order Q 3000xx  Quote
```

---

## 2. 🔴 The surcharge catalogue — **14 types**

| `Toeslag` | Rows | Revenue group | Unit |
| --- | --- | --- | --- |
| External transport | 955 | 8150 Freight costs external | Euro |
| Pallet surcharge | 206 | 8900 Other allowances | Euro |
| Packaging surcharge | 198 | 8900 Other allowances | Euro |
| Transpost costs | 94 | 8100 Freight costs | Euro (90) / TN (4) |
| Order surcharge | 17 | 8900 | Euro |
| Decoil surcharge | 10 | 3000 Decoiling | **TN** |
| Other | 8 | 8900 | Euro |
| Costs | 8 | 8900 | Euro |
| Project discount | 3 | 8900 | Euro |
| Certiifcate costs | 2 | 8900 | Euro |
| Administration costs | 1 | 8900 | Euro |
| Price differences | 1 | 8600 Price differences | Euro |
| Cutting surcharge | 1 | 3020 Cutting | TN |

A surcharge is **not** always in euros — `Decoil surcharge` and `Cutting
surcharge` are charged **per tonne**, which makes them processing charges
wearing a surcharge coat. They post to the 3000 band accordingly.

`Project discount` is a *negative* charge — the same mechanism used to give
money back.

---

## 3. 🔴 Freight is a **weight-bracket tariff**

`Vanaf` / `T/m` are the inclusive bounds of a weight band, and **only
`External transport` uses real bands**:

| From (kg) | To (kg) | Rows |
| --- | --- | --- |
| 0 | 2 000 | 139 |
| 2 001 | 3 000 | 108 |
| 3 001 | 4 000 | 105 |
| 4 001 | 5 000 | 105 |
| 5 001 | 7 000 | 188 |
| 7 001 | 10 000 | 103 |
| 10 001 | 15 000 | 102 |
| 15 001 | 20 000 | 104 |

Within each band there are about **eight price points** — one per destination
zone. For `5 001–7 000 kg`: €135.98 (×101), €153.30, €170.63, €182.70, €194.25,
€213.15, €234.15. The price rises with both weight *and* distance, so the tariff
is a **band × zone matrix**, and `Region` (16 values here) is the zone axis.

Two sentinels sit alongside the real bands:

- **`0–125`** on every non-freight surcharge (433 rows) — "no band", a flat
  charge. 125 is not a weight; it is the default upper bound.
- **`0–999999`** (55 rows) — unbounded. The same `999999` the coil length uses
  ([order-lines.md](order-lines.md) §9).
- **`0–500`** on `Pallet surcharge` (62 rows) — a genuine small band.

---

## 4. `Contract` links a charge to an agreement

Blank on 1 496 of 1 504, then `Packaging costs` (4) and `Pallet costs` (4). A
surcharge can be governed by a named contract rather than the standing tariff.
Eight rows is thin, but it is a real column and it points at
[contracts.md](contracts.md).

---

## 5. `Profit` is a **formatted string**, not a number

```
'€ 0,00 ( %)'      1 142 rows
'€ 85,00 (100 %)'     54
'€ 35,00 (100 %)'     42
```

Amount and margin packed into one cell, in Dutch number format (comma decimal,
`€` prefix). When the revenue is zero the percentage is rendered as an **empty
string**, giving `( %)` — which is the reference's answer to the divide-by-zero
that every other screen answers differently
([invoice-lines.md](invoice-lines.md) §3).

`Bedrag == Kosten` on 1 142 rows — the same at-cost pattern as options. Where
they differ, the charge carries margin.

---

## 6. Small things

- **`Bedrag valuta`** (amount in foreign currency) is non-zero on **3 rows**
  (−183.60 twice, 48.50 once). Multi-currency exists and is barely used.
- **`Status`** reuses the document ladder: `Invoiced` 1 246, `Expired` 111,
  `Released` 46, `In progress` 44, `Provisional` 34, `Partially invoiced` 9.
  **`Expired` again** — 111 rows, on the same 111 the delivery screen shows
  ([deliveries.md](deliveries.md) §4). The `Order lines` screen is the only one
  hiding it.
- **`Country`** reaches further than the order book: `NL` 1 261, `BE` 210,
  `DE` 15, **`UKR` 9**, `ES` 5, **`IND` 1**. Three-letter codes here, two-letter
  on the invoice line, full names on the order line. **Three representations of
  one concept.**
- **`Weight (kg)` is 0 on 1 499 of 1 504 rows** — the charge knows its weight
  band but not the weight. The band is copied down from the order when the
  charge is raised.
- **`Region number` is `0` on all 1 504**, as on the invoice line.

---

### Against `apps/dashboard` — rebuilt 21-9-2026

The `Charges` table already held everything the reference stores. The screen
did not: it loaded every charge on every request with no paging, search, filter,
column picker or export, and showed a fraction of the columns.

It now carries **23 columns**, paged, with filters on the surcharge type and
the creation date.

🔴 **`Profit` is two numeric columns here, not one string.** The reference packs
the amount and the margin into a single Dutch-formatted cell — `€ 85,00
(100 %)` — and renders `( %)` when the revenue is zero. A number that cannot be
summed or sorted is not a number, so ours are `Profit` and `Profit margin`,
both figures.

⚠️ **The weight bounds carry three sentinels.** Only `External transport` uses
real bands. `0–125` on every non-freight surcharge means *no band, flat
charge*; `0–999999` means unbounded, the same sentinel a coil's length uses.
Reading 125 as kilos would invent a tariff that does not exist, so the columns
are named `From (kg)` / `Up to (kg)` and the meaning is recorded beside them.

⚠️ **A surcharge is not always in euros.** `Decoil surcharge` and `Cutting
surcharge` are charged per tonne and post to the 3000 processing band — they
are processing charges wearing a surcharge coat. `Project discount` is a
negative charge.

Two columns are not carried: `Region number` is `0` on every row, and
`Bedrag valuta` — the amount in a foreign currency — is non-zero on **3 of
1 504 rows** and we have no currency model at all, so there is nothing to put
in it. Multi-currency exists there and is barely used; that is the finding,
not a column.

Verified live, 16/16.
