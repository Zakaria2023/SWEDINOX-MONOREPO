# Order lines — the price build-up

**Item B2 of [WHAT-IS-LEFT.md](WHAT-IS-LEFT.md), captured 13-9-2026.**
`Overviews → Sales → Order lines`, `View` = `-empty-`, creation date from
`1-1-2024`. **54 columns, 4 975 rows** — `exports/b2-order-lines.tsv`.

The header was [orders-and-quotes.md](orders-and-quotes.md); this is what sits
under it. Until now the selling-side price build-up was proved on **one** quote
line. It is now proved on 4 975.

---

## 1. 🔴 A line carries **two** price units, and the same net price twice

This is the finding the whole export turns on.

| Column | What it is |
| --- | --- |
| `PriceU` | the unit **the customer is billed in** — `TN` 3 993, `ST` 898, `M1` 31, `KG` 28, `HK` 25 |
| `Product PriceU.` | the unit **the product is held in** — `TN` 4 625, `HK` 234, `ST` 57, `M1` 31, `KG` 28 |
| `Net price (PriceU)` | the agreed price, in the customer's unit |
| `Net price (ProdPriceU)` | **the same price restated** in the product's unit |

The two units differ on **841 of 4 975 lines** — 632 sold per piece against a
tonne-held product, 209 per piece against a `HK` (100 kg) product.

**The conversion, proved on all 841:**

```
weight per piece = Weight (kg) / Quantity (QtyU)
Net price (ProdPriceU) = Net price (PriceU) ÷ (weight per piece, in the product's unit)
```

632 of 632 for `ST → TN`, 209 of 209 for `ST → HK`. **0 exceptions.**
Where the two units are the same (4 134 rows) the two prices are equal, always.

---

## 2. 🔴 `Amount` — one formula per price unit

```
Amount = basis(PriceU) × Net price (PriceU)
```

where the basis is:

| `PriceU` | basis |
| --- | --- |
| `TN` | `Weight (kg) / 1000` |
| `KG` | `Weight (kg)` |
| `HK` | `Weight (kg) / 100` |
| `ST` | `Quantity (QtyU)` |
| `M1` | `Quantity (QtyU) × Length (mm) / 1000` |

**Exact on 4 571 of 4 975 rows** — and on **all** of `ST` (898/898), `M1`
(31/31) and `HK` (25/25).

The 404 that miss are 400 `TN` rows and 4 `KG` rows, and they miss by −5 % to
+2 %. **398 of the 400 are `Invoiced`.** The implied weight is not the line's
weight: `O100006` line 20 shows 6 pieces at 1 059.8 kg but is priced on
883.3 kg — exactly 5 pieces' worth. The line is billed on what actually left
the warehouse, while the grid keeps showing the line's own weight.

⚠️ **This is a hypothesis, not a proof.** It needs **B4 (Invoice lines)** to
settle. Until then: order-stage amounts reproduce exactly, invoiced ones may not.

---

## 3. 🔴 `Profit` uses the **line's** unit for cost, not the product's

```
Profit = Amount − Cost price × basis(PriceU)
```

Restricted to the 4 571 rows whose `Amount` reproduces:

| tolerance | rows | share |
| --- | --- | --- |
| ≤ €0.011 | 4 238 | 92.7 % |
| ≤ €0.50 | 4 502 | **98.5 %** |
| ≤ €5 | 4 546 | 99.5 % |

The residual is the displayed `Cost price` being rounded to two decimals — the
stored one carries more. Using the **product's** unit instead drops the fit to
91 % and leaves errors in the thousands, so the line's unit is the right one.

When `Cost price` is `0` (788 rows), `Profit == Amount` on 787 of them.

---

## 4. 🔴 `Price -/- Cost price` is **a unit bug in the reference**

```
Price -/- Cost price = Net price (ProdPriceU) − Cost price
```

0 mismatches on all 4 975 rows — but read what it does. `Net price (ProdPriceU)`
is per **tonne**; `Cost price` is per **piece** (§3 proves it). On the 841 lines
where the two units differ, the reference subtracts €/piece from €/tonne.

`O100220` line 20: net €5 468.75/TN, cost €2.43/ST, column reads **€5 466.32**.
The real per-tonne margin is about €760.

**Do not reproduce this.** Convert the cost into the product's unit first. The
same 841 lines make `Price -/- FSP`, `Price -/- Replacement price` and
`Net price (ProdPriceU)` fine — only the cost column is mixed.

---

## 5. The margin columns — three different zero rules

| Column | Formula | Zero rule |
| --- | --- | --- |
| `Profit margin` | `Profit / \|Amount\| × 100` | `Amount = 0` → **±100** by the sign of the profit, `0` if profit is 0 |
| `Profit margin w.r.t. APP` | `(NetProd − APP) / \|NetProd\| × 100` | `NetProd = 0` → **`0`** |
| `Profit margin w.r.t. replacement price` | as above, replacement `0` | `0` or `100` only |

**0 mismatches on 4 975 rows for all three.** So is the difference column they
rest on: `Price -/- APP = Net price (ProdPriceU) - APP`, 4 975 / 4 975.

Two things follow:

- The `|Amount|` denominator is the **same rule the header uses**
  ([orders-and-quotes.md](orders-and-quotes.md) §3), now confirmed on a second,
  larger population. `lib/helpers.ts` has it wrong in both places.
- ⚠️ **The two screens round differently.** The header rounds the margin to one
  decimal (`23.1`); this one does not (`11.6279069767442`). Do not round in the
  stored value.

---

## 6. `FSP` and `Replacement price` are **0 on every one of 4 975 rows**

Which makes three whole columns decorative:

- `Price -/- FSP` = `Net price (ProdPriceU)` — identical on all 4 975
- `Price -/- Replacement price` = the same
- `Profit margin w.r.t. replacement price` = `100` (4 646) or `0` (329), nothing else

This is the third independent confirmation that FSP revaluation is a real
feature nobody uses ([fsp.md](fsp.md)). `APP` by contrast is live — non-zero on
3 948 rows.

---

## 7. `Line status` is the header ladder minus one

Nine values, 4 975 rows: `Invoiced` 4 195, `Released` 335, `In progress` 260,
`Completed` 58, `Partially invoiced` 43, `Provisional` 39, `Partially delivered`
32, `Checked` 9, `Received` 4.

Same list as the header's, without `Expired` (a quote-level state). `Received`
appears on the four return lines.

**Our `orderLineStatuses` is close but not right** — it has `delivered` and
`cancelled`, which the reference never shows here, and lacks `completed` and
`received`. And see [sales-options-and-calloff.md](sales-options-and-calloff.md)
§3: the reference's **numeric** status codes, and a tenth status this screen
hides.

---

## 8. `Line type` gains a fourth value

`Stk` 4 261, `CD` 630, `Stk+CD` 83, **`EXW`** 1.

`Stk+CD` is a real mixed line, not a rounding of the other two — 83 of them.
`APP` is zero on 378 of the 630 `CD` lines but on only 595 of 4 261 `Stk` lines,
which fits: a direct-delivery line has no average purchase price until it is
bought.

---

## 9. Sentinels and small proofs

- **`Length (mm) = 999999` is the coil sentinel.** 685 rows, and **684 of them
  are coils** (`Coil Cold-rolled 304`, `Aluminium coils A5754`, …). Exactly one
  coil row carries a real length. A coil has no length; the reference stores
  `999999` rather than null.
- **`Revenue group` is eight material groups**: `SS 304` (1000), `SS 316`
  (1100), `SS 430` (1300), `High Alloys` (1400), `Aluminium` (1500), `Steel`
  (1600), `SS 321`, `Other products` (2900). Options use a **separate 3000
  band** — see [sales-options-and-calloff.md](sales-options-and-calloff.md).
- **`Stock category`** — blank on 3 914 rows, then `2nd choice` (1 037),
  `3rd party inventory` (20), `Scrap` (3), `Remaining` (1). Blank is first
  choice.
- **`Region`** — 18 values (`WN EURO`, `NL-1`, `NL MIDD`, `NL-8`, `NL OOST`, …),
  blank on 199. A customer attribute copied onto the line.
- **`Country` vs `Destination country`** differ: 15 vs 17 values, and
  `Destination country` is blank on 70 rows. Invoice country and delivery
  country are separate.
- **`Commercial shortfall`** — `True` on **2 rows**, both `Provisional` with
  amount `0`. Too thin to model. Keep the column, guess nothing.
- **`Classification` / `Classification code`** — blank on all 4 975, as on the
  header. Switched off.
- **`#Deliveries`** — 1 on 4 398 rows, up to 12. A line can be delivered in
  parts.
- **`QtyU`** is almost always `ST` (4 968); `KG` 5, `M1` 2.
- **`Options`** on this screen is **display text in Dutch**, comma-joined, and
  can repeat (`Laser Folie, Laser Folie`). The real table is B9.

---

## 10. Item B6 — Quote lines, and where the discounts live

`Overviews → Sales → Quote lines`, 46 columns, **9 rows** —
`exports/b6-quote-lines.tsv`. Nine lines is all the database holds.

🔴 **This is the only screen in the whole sales menu that shows a discount**, and
it shows the cascade as three columns in order:

```
Gross price  →  Group discount  →  Line discount  →  Net price (PriceU)
```

Both discounts are stored as **percentages with a literal ` %` suffix**
(`0 %`), so the column is text, not a number.

⚠️ **And every one of the nine lines reads `0 %` on both.** The structure is
proved — two discount levels, group before line, gross before net. The
*behaviour* is not: `Net price == Gross price` on all nine, so the cascade we
modelled from a single quote line is still modelled from a single quote line.
Nothing here contradicts it; nothing here confirms it either.

`Amount`, `Profit` and `Profit margin` reproduce exactly with the §2/§3/§5
formulas — `Q300000` prices 706.5 kg at €35/TN for €24.73, deducts
€2 671.81094/TN of cost for a profit of −€1 862.90 and a margin of
−7 532.95592397897, unrounded. The quote screen uses the **order-line**
conventions, not the header's.

Three things the quote line has that no other screen does:

- **`Order type` = `DEF` on all nine.** A different vocabulary from
  Normal/Call-off/Rush/Ex works. One value, no contrast — ask.
- **`Converted to`** — blank on all nine, so no quote has ever become an order.
- **`Customer group`** — `APPBOUW (E`, `CONSTRUCT`, `HANDELAAR`, `EINDGEBR`. The
  same 18-value segmentation the invoice line carries
  ([invoice-lines.md](invoice-lines.md) §4).

⚠️ **`Q300000` appears here but not in the header export.** B1 returned
`Q300001`–`Q300006`; this line belongs to `Q300000`, status `Expired`. Other
`Expired` quotes *do* appear in B1, so this is not a status filter. One quote is
missing from `Orders and Quotes` and nothing in either export says why.

---

## What is still not proved

**Discounts, on an order.** §10 proves the *shape* on quotes — gross, group
discount, line discount, net — but every observed value is `0 %`, and the order
line grid carries no discount column at all. To see a discount actually bite,
open an order with one (item G1).

**VAT.** Nothing on this screen, and nothing on the invoice **line** either
([invoice-lines.md](invoice-lines.md)). VAT is decided on the invoice
**header** — item **B3**, still uncaptured.
