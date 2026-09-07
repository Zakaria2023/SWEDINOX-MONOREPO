# Stock on location

`Overviews → Stock → Stock on location`, and reachable from a purchase quote's
toolbar. Ours: `/stock-on-location` (already built —
`app/(dashboard)/stock-on-location/actions.ts`).

One row per **lot**: a physical parcel of one product in one location, with its
own heat number, bundle, supplier and valuation. This is the screen that holds
the company's whole stock position — **2 428 474 kg** and **€ 5 070 915,59**
across the default view.

**Filters**: `Product code` **from / u/i**, `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product ·
`Change APP…` · `Toon reserveringen…` | Purchase lines · Warehouse workorders ·
Orders and Quotes

⚠️ The `u/i` box defaults to **`zzzzzzzzzzzzzzz`** — a string sentinel standing
in for "no upper bound" on a text filter. Ours uses an empty field, not a
sentinel.

`Toon reserveringen…` is Dutch for *show reservations*; `Change APP…` is
unexplained. Neither was opened.

## The seven saved views

| View | Filter | Kg total |
|---|---|---|
| `Standaard` | — | **2 428 474** |
| `GIP` | — (adds `Gipgroup`, `Valuation price`, `Modified on`, sorted newest first) | 2 428 474 |
| `Verkocht` (*sold*) | `Reserved (Stk.U.) > 0,01` | **495 180** |
| `Beschikbare voorraad` (*available stock*) | `Reserved (Stk.U.) = 0,00` | **1 933 295** |
| `Controle` (*check*) | `Bundle = 0 And Not Product code Contains SC` | 21 rows |
| `Cuvelje` | `Location = CUVELJE` | **0 rows** |
| `availeble stock in house` *(sic)* | `Location ≠ CUVELJE And Stock category In [2nd choice, Remaining] Or Stock category Is null or empty And Available (StkU) from 1,00 to 3.996,00 And Stock (Kg) from 1…` | 1 828 130 |

**`495 180 + 1 933 295 = 2 428 475`** against the full total of `2 428 474` — one
kilo out from rounding. So `Verkocht` and `Beschikbare voorraad` **partition the
entire stock**, which means:

> **"Sold" is exactly "reserved".** There is no separate sold flag; a lot is
> sold when someone has reserved it.

That matters for our model — it says `Stock.reservedQuantity > 0` is the whole
definition, and we do not need a status for it.

`Cuvelje` returning zero rows with its own saved view suggests a location that
was used once and emptied. `availeble stock in house` is misspelled in the
reference itself.

## Columns — ~26, pooled across all seven views

| Column | Notes |
|---|---|
| `Warehouse` | `00 He…` — only in `Controle`, so a second level above location |
| `Location` | see the location list below |
| `Blocked` | **a checkbox**, ticked on real rows |
| `Product code` · `Product type` | `Product type` reads `Plaat` — the same shape field as [the product master](product-detail.md#the-product-shape-decides-the-whole-screen) |
| `Quality` | `304L2B`, `3042B`, `316L2B`, `S235`, `A6082T6`, `A5005H14`, `304L1D`, `4412B` … |
| `Stock category` | **`2nd choice`** · **`Scrap`** · **`Remaining`** · blank |
| `Options` | `Laser Foil`, `Brushing, Laser Foil`, **`UV Foil, Brushing`**, `Grinding (K320), …` |
| `Length (mm)` · `Width (mm)` · `Thickness` | |
| `Stock (Stk.U.)` · `Reserved` · `Available` · `StkU` | quantity trio plus **its unit as a column** (`ST` / `KG`) |
| `Stock (Kg)` | |
| `Stock (€)` · `Valuation price` | **both derived — see below** |
| `Charge` | the mill **heat number** — `651764F`, `V642082A`, `3MME`, `TS87HA20`, and `nvt` (Dutch *n/a*) |
| `Internal charge` | our own batch code — `25ADKI`, `23FBFC`, `26ADQT`: **a 2-digit year plus four characters** |
| `Bundle` | 6-digit bundle number, `0` when none |
| `Supplier` | |
| `Purchase order` | **`IO400874`**, `IO100040` — the `IO` prefix (*InkoopOrder*), matching the purchase invoice's `IO400166` |
| `Receipt date` | ties the lot back to its arrival |
| `Gipgroup` | `P3040K15`, `C430010B`, `PW304220` — only in the `GIP` view |
| `Modified on` | a **timestamp**, `12-05-2025 10:42:34` — the only second-precision field seen anywhere |

`UV Foil` is a **new option value**, not on the product master's list. The
option enum is now at least: Duplo · Decoilen · Grinding (K320) · Brushing ·
ShearCut · Laser Foil · **UV Foil** · Blue Foil · Knippen · Laser.

## ✅ Three formulas, all proved

**1. `Stock (Kg)` is the density formula again** — `length × width × thickness ×
7 850 × quantity`, on ten of ten rows:

| Lot | Dimensions | Qty | Calculated | Shown |
|---|---|---|---|---|
| `Fox / 2009100` | 1273 × 1100 × 1,00 | 1 | 10,99 | **11** |
| `PK304L150` | 3658 × 1830 × 1,52 | 17 | 1 357,9 | **1 358** |
| `PK304L150` | 2000 × 180 × 1,50 | 230 | 975,0 | **975** |
| `PK304L100` | 1500 × 220 × 1,00 | 310 | 803,1 | **803** |

That is the **fifth** screen to confirm it, and the first on the stock side.

**2. `Stock (€) = Stock (Kg) × Valuation price ÷ 1000`** — so the valuation
price is **per tonne**, like every other price in the system. Exact on eight of
eight rows:

| Lot | kg | € / tonne | Calculated | Shown |
|---|---|---|---|---|
| `Laad / SC304` | 3 895,00 | 1 150,00 | 4 479,25 | **4 479,25** |
| `SC / SC304 3212B` | 250,00 | 759,94 | 189,99 | **189,99** |
| `SC / SCA A6082T6` | 37,19 | 2 960,01 | 110,08 | **110,09** |
| `SC / SC304 304L1D` | 180,00 | **−1 688,83** | **−303,99** | **−303,99** |

🚩 **One lot carries a negative valuation price** — `−€1 688,83` per tonne,
giving `−€303,99` of stock value. The formula holds, but a negative valuation is
a data error, not a business case. Our UI should not crash on it, and it is
worth reporting rather than reproducing.

**3. `Available = round(Stock − Reserved)`** — rounded to whole units,
half-up, on fifteen of fifteen rows:

```
55,41 → 55      12,84 → 13      9 714,55 → 9 715
31,30 → 31      43,67 → 44      2 801,82 → 2 802
26,49 → 26     161,61 → 162       35,10 → 35
```

Note this rounds **kilograms** too when `StkU` is `KG`, so it is a display
rounding of a stored decimal, not a piece count. Ours should keep the decimal
and round only on render.

## The locations tell a story

Named locations (Dutch) sit alongside alphanumeric bins:

| Location | Meaning |
|---|---|
| `Ontvangst` | **goods-in** — where a fresh receipt lands |
| `Laad` | **load** — staged for despatch |
| `Bewerkers` | **processors** — out at an external processor |
| `Blok` · `DECO` · `Laser 1` · `Fox` · `SC` | work areas |
| `CUVELJE` | a named location, currently empty |
| `4A5` `5A` `7H` `8B` `2B6` `4E1` `2N` `4D6` `2C5` `4C3` `4B2` `2B3` `8A` … | rack bins |

**Almost every `Bewerkers` row is `Blocked` ☑.** Material sitting at an external
processor is blocked from sale — which is exactly what
`control-stock-increase-external-processing` exists to reconcile. That is a real
rule worth copying: leaving the building for processing blocks the lot.

`Ontvangst` rows are mostly *not* blocked, so goods-in is sellable immediately.

## 🔑 Stock corrections are booked as a purchase

The `Supplier` column includes **`Hego Voorraadco…`** — *Hego
Voorraadcorrectie*, "stock correction". So an adjustment is recorded as a
receipt from a pseudo-supplier rather than as a separate movement type. Also
present: `Hego Production` (the in-house department, as on
[Purchase lines](purchase/purchase-lines.md#the-saved-views--and-what-a-view-actually-is))
and `Swedinox` itself.

Two consequences: every lot has a supplier even when nobody sold it to us, and
the supplier list is not purely external companies — which lines up with the
company master's `Internal` role checkbox.

## ⚠️ The footer, and what not to copy

`TOTAAL=2.428.474` · `Som=€5.070.915,59` · `AVG=€2.159,66`

Two Dutch labels and one English. The `AVG` of `Valuation price` is a
*plain* average, not weighted by tonnage — €5 070 915,59 ÷ 2 428 474 kg is
€2 088/t, not €2 159,66. Unlike [Purchase lines' summed
prices](purchase/purchase-lines.md#-two-things-not-to-copy) an average price is
at least meaningful, but ours should weight it or label it plainly.

## The product-search dialog

Reached from a purchase or quote line's product picker, and worth recording
because it exposes fields no grid does:

**Search side**: `Product code` · `Search code` · `Company` ·
`Product group` · `Quality` · `Processes`, plus `Length` / `Width` /
`Thickness` **from / until-and-incl.** with a **`Search with margin`** ☑ and a
**5 %** tolerance per dimension. Three filter checkboxes:
`Only products with available stock`, **`1e keus`** and **`2e keus`** —
*first choice* and *second choice*, which is where `Stock category`'s
`2nd choice` comes from.

**Result side**, per product/quality/option combination: `Technical` ·
`Reserved` · `Available` in pieces, then `Kg (t..)` / `Kg (r..)` /
`Kg (a..)` — the same trio in kilos — plus `Total length`, `C. Kg` and
`C. ST`.

**Lot side**, with tabs **`Stock` | `Purchase` | `Internal production`**:
`Order qty.` · dimensions · `Technical` · `Reserved` · `Available` ·
**`Unopened`** ☑ · `Kg (avail.)` · `Options` · `Remarks` · `Quality` ·
**`APP`** · `Purchase price` · `Internal charge` · `Stk. cat.`, and a footer
reading `Charge` · `Internal charge` · `Loc` · `Purchase`.

Three things worth having:

- **`Unopened`** is a lot flag not on any grid — an unopened bundle.
- **`APP` and `Purchase price` both print `/ TN`**, so both are per-tonne
  prices. On the two lots seen they read `2050 / TN` and `2000 / TN`.
- The footer's `Purchase` line reads
  `3-4-2025 / IO400766 / Hego Voorraadcorrecties` — the stock-correction
  pseudo-supplier again, with its own `IO` order number, confirming that
  corrections really are booked as purchases.

## 🔴 What is still needed

1. **`Change APP…`** — mostly answered. The product-search dialog reached from
   a purchase line carries an **`APP`** column reading **`2050 / TN`**, beside a
   `Purchase price` column reading the same, so **APP is a price per tonne** and
   this button is a price-change action rather than anything structural. What is
   still unknown is how APP differs from the purchase price.
   → *In the old system:* select a lot, press it, and read the dialog.
2. **`Toon reserveringen…`** (*show reservations*) — the same.
3. **`Gipgroup` and `Gip → Artikelgroep`.** The product master has a
   `Gip → Artikelgroep` field reading `PK316`, and this screen has `Gipgroup`
   values like `P3040K15`. They look like the same concept in two formats, and
   `Gip` is unexplained.
   → *In the old system:* open the `Gipgroup` dropdown, or a product, and see
   what Gip stands for.
4. **`Warehouse` above `Location`.** Only the `Controle` view shows it, reading
   `00 He…` on every row — so there may be exactly one warehouse today.
   → *In the old system:* group by `Warehouse` to list them.
5. **The negative valuation price** on the `SC / SC304 304L1D` lot — confirm it
   is a data error and not something the reference does deliberately.
