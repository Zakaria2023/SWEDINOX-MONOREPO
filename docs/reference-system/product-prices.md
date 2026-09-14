# Product prices, and option prices per product

**Items B11 and B10 of [WHAT-IS-LEFT.md](WHAT-IS-LEFT.md), captured 13-9-2026.**

| Item | Screen | File | Size |
| --- | --- | --- | --- |
| B11 | `Sales → Product prices` | `exports/b11-product-prices.tsv` | 19 383 rows × 47 cols |
| B10 | `Sales → Option prices per product` | `exports/b10-option-prices-per-product.tsv` | 54 rows × 16 cols |

---

## ⚠️ 1. B11 must be run again — the price date defeated it

**`Price date` reads `45292` — 1 January 2024 — on every one of 19 383 rows.**
That is the date typed into the filter, and the grid answered *"what was this
product's price on 1-1-2024?"* The answer, for the whole catalogue, is
**nothing**:

| Column | Value on all 19 383 rows |
| --- | --- |
| `Gross price/Base price` | `0` |
| `Markup` | `0` |
| `PriceA` `PriceB` `PriceC` `PriceD` | `0` |
| `Replacement price`, `FSP`, `LPP` | `0` |
| `Scrap surcharge`, `Quality surcharge` | `0` |
| `Base price Blasting`, `Base price Bls+P` | `0` |
| three `Sawing price` columns, `Color surcharge` | `0` |
| `Valid from`, `Valid u/i` | `0` |

Only `APP` breaks through, on 81 rows.

🔴 **This is a new filter trap, and it belongs in the recipe.** A `Price date`
box is a **snapshot date**, not the start of a range. The standing advice —
*"never blank a `from` box; type `1-1-2024`"* — is right for a *creation date*
and wrong here. Setting it to a date before the price records exist returns the
whole catalogue with every price at zero.

**The re-run:** open `Sales → Product prices`, set `View` = `-empty-`, and put
the **`Price date` / `from` box at today's date** (or the latest date the box
accepts). Everything else stays. Then `Show Data` and `Show in Excel` as usual.

The product *attributes* came through fine — this is not an empty grid, it is a
full grid with an empty price column, so everything in §2 below stands.

### ✅ Re-run 14-9-2026 — the zeros are real

`exports/b11-product-prices-2026-09-14.tsv` (`Product prices 14-9-2026.xlsx`),
**19 383 × 47**, `Price date` = **14-9-2026** on every row. Same rows, same
headers, same attributes as the first run. What changed:

| Column | 1-1-2024 run | 14-9-2026 run |
| --- | --- | --- |
| `Gross price/Base price`, `Markup`, `PriceA`–`PriceD` | 0 | **still 0 on all 19 383** |
| `Replacement price`, `FSP`, scrap/quality/colour surcharges, blasting, sawing | 0 | **still 0** |
| **`APP`** (average purchase price) | 81 rows | **451 rows** |
| **`LPP`** (last purchase price) | 0 | **366 rows** |
| `Valid from` / `Valid u/i` | 0 | **16 rows** |

So the first run was not the whole story. **With a current price date there is
still no sales price anywhere in the catalogue.** The trap was real, but it hid
nothing. This settles §"So where does a price come from?" for good: **no gross
price, no markup, no price list A–D** — the selling price is typed on the order
line.

What the date *did* unlock is cost:

- **`APP` and `LPP` are purchase figures, per `PriceU`** (400 of the 451 `APP`
  rows are `TN`). They agree on only **40 of the 267** products that have both —
  an average and a last price are different numbers, as they should be.
- 347 of the 569 products that sold have an `APP`, 321 an `LPP`.
- ⚠️ **`APP` is dirty**: six are **negative** (−1 981.85, −1 880.77, …) and 18 are
  `0.01` / `0.001` placeholders. `PC304200` has `LPP` = `0.2` per tonne. A moving
  average that goes negative means receipts and issues were booked out of order.
  **Never import `APP` as a cost price without cleaning it.**
- **The 16 dated rows are all packaging** — `EMPASU4 Super_Pallet_4m`,
  `EMBIGR3 Large_Biplex_3m`, `EMKAKL2 Small_Cardboard_2m`, the deck pallets —
  valid **5-2-2024 → 31-12-9999**, every price `0`. These are the items the
  `PACKAGING COSTS` / `PALLET COSTS` contracts charge for
  ([customers-and-prospects.md](customers-and-prospects.md) §31), and the only
  products with a validity period at all.
- `Sawing price U.` = `ST` on 54 products, with every sawing price `0`.

---

## 2. What B11 proves anyway — the product hierarchy

**All 569 products that actually sold** ([order-lines.md](order-lines.md)) are
in this catalogue of 19 383. It is the full master.

### 🔴 `Main group` and `Revenue group` are **independent axes**

| `Main group` | Rows |
| --- | --- |
| Stainless Steel | 10 071 |
| Steel | 7 749 |
| Aluminum | 1 547 |
| Packaging | 16 |

Four material families — and they do **not** determine the revenue group:

| Main group | Revenue group | Rows |
| --- | --- | --- |
| Steel | Steel | 5 356 |
| Steel | **Aluminium** | 1 450 |
| Steel | **High Alloys** | 837 |
| Stainless Steel | SS 304 | 5 185 |
| Stainless Steel | **Aluminium** | 112 |
| Stainless Steel | **Steel** | 23 |

1 450 products whose material family is `Steel` post to the `Aluminium` P&L
group. The hierarchy is what the metal *is*; the revenue group is where the
money *lands*. Two dimensions, and our model must not collapse them into one.

`Subgroup` carries 143 values (`Stainless steel 316 seamless pipe`,
`316 THREADED FITTINGS`, `LASBOCHTEN 316` — several still Dutch), blank on
7 960.

### `Group product` is a product that *is* a group

`True` on **5 848** rows — confirming the standing finding that the reference
holds groups and products in one table where we hold two. It cuts across stock:
3 666 group-products are stock products and 2 182 are not.

### 🔴 `Stock product` and `Standard product` are the **same value**

Identical on **19 383 of 19 383 rows**. Two columns, one fact. Model one.

### Units

`PriceU` across the catalogue: `HK` 7 748, `M1` 4 040, `ST` 3 078, `KG` 2 952,
`TN` 1 565 — a very different shape from what actually sells, which is
tonne-priced plate. The catalogue is mostly pipe and fittings priced per metre
or per 100 kg.

`KgU` is `M1` 13 742, `ST` 3 094, `M3` 2 547 — and **where `KgU` is `M3` the
figure is a density**: 7850 (steel), 8000 (stainless), 2755 (aluminium alloy).
Fifth confirmation of the standing rule; see [deliveries.md](deliveries.md) §6.

### Blank on every row → switched off

`Preferred supplier`, `Product no. supplier`, `Order advice code`,
`PriceU. Blasting`, `PriceU. Bls+P`, `Color surcharge U`.

⚠️ `Order advice code` being blank on 19 383 rows sits oddly beside a working
order-advice engine ([project memory: order advice runs in purchase units]).
Worth one look at a product's own screen before concluding.

### Small things

- **598 duplicate product codes.** Some pairs differ only in `Subgroup`; others
  are identical in all 47 columns. The product code is **not unique** in this
  export.
- **`Old product no.`** — a legacy code on 15 004 rows, 7 344 values (`PDIVS`,
  `BN304`, `CAP`). Many products share one; it is a family key, not an id.
- **`Trade dim. (mm)`** — 16 values, blank on 13 556. `6100`, `6000`, `12100`,
  `14100`, `15100`: standard bar and pipe lengths.
- **`Paint surface`** — non-zero on 6 277 rows, values like `0.39`, `0.272` m²
  per unit. Used to price coating.
- **`In website tree` is `False` and `Export` is `False` on all 19 383.**
- ⚠️ **`Kg. (per Piece)` uses a comma decimal separator** — `8,28`, `51,18`,
  `38,82` — while every other numeric column in every export uses a dot. Filled
  on 7 366 rows. **Any parser must handle both**, or 7 366 weights become
  thousands-separated integers.
- **`Sawing price U.`** is `ST` on 19 rows and blank on 19 364, while all three
  `Sawing price` columns are `0`. The unit outlives the price.

---

## 3. B10 — option prices per product, and a **14th** option

54 rows, and every one of them is the same option:

```
Option code = Z    Option = Zagen (sawing)    PriceU = ST    Base price = 0
```

🔴 **`Z` / `Zagen` appears in no other export.** The Options screen
([sales-options-and-calloff.md](sales-options-and-calloff.md) §1) lists 13 codes
across 2 890 ordered options and `Z` is not among them. So the catalogue has at
least **14** options, and sawing is *configured* on 54 products and has never
been *sold* — which matches `Sawing` being `False` on all 6 134 delivery rows
([deliveries.md](deliveries.md) §8).

The 54 products are 26 stainless, 18 aluminium, 10 packaging — coils, checker
plate, pallets, separator paper.

### 🔴 A third sentinel: `2958465` = **no end date**

`Valid u/i` reads `2958465` on all 54 rows. That is Excel's maximum date,
**9999-12-31** — the reference's "valid forever". `Valid from` is real and
varies: 13 distinct dates from **2023-12-14** to **2025-04-29**.

So the sentinel set is now:

| Sentinel | Means | Seen on |
| --- | --- | --- |
| `999999` | no length / no upper bound | coil length, charge bracket |
| `2958465` | no end date | option price validity |
| `0` | not yet / not set | actual delivery date, invoice no., quote date |
| `zzzzzzzzzzzzzzz` | no text upper bound | filter boxes |

**`Base price` is `0` on all 54 rows** — the per-product override exists and
carries no price either. Same story as B11, and here it is *not* a filter
artefact: `Valid from` and `Valid u/i` both came through with real values.

---

## What this says about pricing

Taken together with the order lines, the picture is that **the reference's
standing price list is not where sales prices come from.** 2 091 orders and
4 975 lines were priced without a base price, a markup, or a customer price
tier — every `PriceA`–`PriceD` is zero.

### 🔴 `Net prices` is empty — proved 13-9-2026

The obvious candidate was **B12, `Net prices`** — the contract-level agreement
per customer. **It holds nothing.** Opened three times, and the third attempt
was run with the filter block photographed and every sentinel correct:

```
Contract code             (blank)        zzzzzzzzzzzzzzzz
Contract valid between    1-1-2024       13-9-2026
Company code              (blank)        zzzzzzzzz
```

A seven-year range across the whole dense period, no filter voided. **Zero
rows.**

This is the rare case where an empty grid *is* evidence, because a second
screen predicts it independently: the `Contracts` screen
([contracts.md](contracts.md)) holds **10 contracts**, typed `Gross prices` (4),
`Surcharges` (3) and `Options` (3) — and **not one is typed `Net prices`**. No
net-price contract exists, so no net-price row can exist. Two screens, one
answer.

⚠️ It also means the earlier note in
[purchase/net-prices.md](purchase/net-prices.md) — *"grid was empty, so no
example values were readable"* — was never a filter problem after all. The
table has been empty all along, on the purchase side too.

### So where does a price come from?

By elimination: **not** the standing price list (every `Gross price`, `Markup`
and `PriceA`–`D` is zero, pending the re-run in §1), and **not** a net-price
contract (none exists). What is left:

- **A `Gross prices` contract.** Four of the ten contracts are typed this way.
  Untested — nobody has opened one.
- **Typed by hand on the order line.** Which is what a metal trader with 2 091
  orders, 335 customers and daily alloy surcharges would actually do.

### 🔴 Answered from the data: **the price is typed on the line**

No screenshot needed. Count the decimal places each price column actually uses
across all 4 975 order lines:

| Column | 0 dp | 1 dp | 2 dp | **3–10 dp** |
| --- | --- | --- | --- | --- |
| `Net price (PriceU)` — the customer's unit | 3 793 | 330 | 523 | **0** |
| `Net price (ProdPriceU)` — the product's unit | 3 731 | 72 | 310 | **533** |

**`Net price (PriceU)` never exceeds two decimals. Not once in 4 975 rows.**
`Net price (ProdPriceU)` runs to **ten** decimal places on 493 rows
(`3652.96803652968`, `7389.93710691824`).

A human types two decimals; a machine produces ten. So the price is **entered in
the unit the customer buys in**, and the product-unit price is *derived* from it
— the reverse of the natural assumption. On the 841 lines where the two units
differ, the typed one has ≤2 decimals on **100 %** of rows and the derived one on
only 19 %.

The typed values look typed, too. Of the 3 860 tonne-priced lines: **93 % are
whole euros**, 92 % are multiples of 10, and 60 % are multiples of 50 —
€2 150, €2 700, €2 750, €2 850.

And the same product sells to the same customer at **up to 30 different prices**
(customer 10731, product `PC304L500`) — sometimes several within one order,
because each cut piece is a different size. A price list cannot produce that; a
salesperson quoting a day's alloy surcharge can.

### The pricing model, settled

```
salesperson types Net price in the line's own unit (≤2 decimals, usually round)
        ↓
Net price (ProdPriceU) = typed price / (weight per piece, in the product's unit)
        ↓
Amount = basis(PriceU) × typed price
Profit = Amount − Cost price × basis(PriceU)
```

Everything downstream is derived. There is no price engine to rebuild — there is
a **price field**, and the arithmetic in [order-lines.md](order-lines.md) §§2–3.

⚠️ **Two things this does not settle**, both needing one opened order (item G1):

- **The discount cascade.** `Gross price → Group discount → Line discount → Net
  price` is proved as a *shape* on 9 quote lines, every value `0 %`. If the
  salesperson types the net price directly, the cascade may be dead in practice
  — but that is a guess until a line with a real discount is seen.
- **Whether a `Gross prices` contract pre-fills the box.** Four of the ten
  contracts are typed that way and nobody has opened one.

⚠️ **Do not conclude the price list is unused until B11 has been re-run with a
current price date.** An empty grid is not evidence; a zero column under a
filter that selects the wrong day is not evidence either.
