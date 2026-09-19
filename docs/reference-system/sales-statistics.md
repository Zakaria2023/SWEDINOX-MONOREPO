# Sales statistics — B16, B17

Captured 18-9-2026 with `Year` = `2025`, `Month` = `1`. **These were the last two
of the reference's 116 `Overviews` screens.** The tree is now fully captured.

Both had been photographed blank before, and both were written up as probably
dead. **Both have data.** The blank grids were the `Year`/`Month` trap, exactly
as the recipe warned — and on B16 I had gone one step further and argued from two
indirect facts that the screen was genuinely unused. That was wrong, and the
export is what says so.

---

## 0. The filter is a **from**, not an equals

The filter block reads `from` above the two boxes, and the exports prove it
behaves that way:

| Screen | Asked for | Came back |
|---|---|---|
| B16 | 2025 / 1 | 2025 M1–M5 (823 rows) **plus** 2026 M3, M5, M6 (3 rows) |
| B17 | 2025 / 1 | 2025 M1–M5 and M8 **plus** 2026 M3, M5, M6 |

So `Year`/`Month` is a lower bound, and the label *"leave blank for current
year"* means the bound defaults to now — which is why a blank filter returns
nothing. That is the whole mechanism behind the trap, and it now has a proof
rather than an inference.

The 2025 tail-off at May and the three stray 2026 rows match the error log's
finding that the database is a copy frozen around **mid-May 2025**.

---

# Part 1 — B16 · SFN statistics Product-Market combinations

**826 rows × 7 columns.**

| Column | What is in it |
|---|---|
| `sfn_no` | **`0` on all 826 rows** |
| `Year` | 2025 (823), 2026 (3) |
| `Month` | 1–6 |
| `cbs_statnr.` | 41 distinct 8-digit codes |
| `SBI code` | **`Unknown SBI` on all 826 rows** |
| `Postal code` | 70 distinct, **two digits** |
| `Weight (kg)` | 1 667 494 kg total; 4 rows negative |

## 1a. This is a CBS statistics return, not a sales report

Nothing here is money. It is **weight, by commodity code, by postal district, by
month** — which is the shape of a Dutch statistics-bureau (CBS) trade
declaration, and it pairs with `CBS Documentatie` sitting in the Finance group.

`cbs_statnr.` is a Combined Nomenclature commodity code: `72042110` is stainless
steel scrap, the `7219xxxx` family is flat-rolled stainless, `7606xxxx` is
aluminium plate. 41 of them across the whole period.

`Postal code` is **two digits** — the first two of a Dutch postcode, i.e. a
region, not an address. That is the "market" half of "product-market
combination": commodity × district.

## 1b. 🔴 Two of the seven columns are dead

- **`sfn_no` is `0` on every row.** SFN is the thing the screen is *named after*
  and it is never filled. (`SFN` also appears as a branch-level number in
  `Vestigingsgegevens` and on the `Freight flow (SFN)` screen, which is itself
  one of the unproved-empty screens.)
- **`SBI code` reads `Unknown SBI` on every row.** SBI is the Dutch standard
  business classification — it would be a property of the *customer*, and no
  customer has one set.

So the screen computes a real CBS return from real deliveries, and the two
columns that would classify it are empty. **Weight and commodity code are the
only outputs that carry information.**

## 1c. Against `apps/dashboard`

Nothing in our app knows CBS codes exist. There is no `cbsCode` on a product, no
statistics number on a company, and no screen that aggregates delivered weight by
commodity and postal district.

**This is a genuine reporting obligation, not a nice-to-have** — a Dutch company
trading across borders files it. But it needs three things we do not have:

1. a CBS/CN commodity code per product,
2. an SBI code per company (the reference has the column and never fills it),
3. the postal district of the delivery address, which we *do* have.

**Recommendation: do not build B16 yet.** Ask first whether Swedinox files CBS
returns from easy2trade today or from somewhere else — the empty `sfn_no` and
`Unknown SBI` suggest the screen is computed but not actually submitted from
here. Added to the questions list as **K13**.

---

# Part 2 — B17 · Revenue w.r.t. Budget

**109 rows × 15 columns.**

## 2a. 🔴 There is no budget

Five of the fifteen columns are the budget half:

`Weight Budget` · `Revenue Budget` · `Profit budget` · `Profit % Budget` ·
`Avg. Sales Price/Kg Budget`

**Every one of them is `0` on all 109 rows.** Not "mostly zero" — every value of
every budget column.

So `Revenue w.r.t. Budget` is, in the live data, just
`Revenue per revenue group with split order types` with five dead columns bolted
on. **No budget has ever been entered in three years**, and the screen that would
enter it is `Instellingen Verkoop → Omzetverdeling per maand` in
`Vestigingsgegevens` — the settings tree that cannot be reached from this login.

This is the same pattern as the Balanced Scorecard (F3): nine KPIs, no target
ever set. **It belongs on the K3 list of features the reference ships and does
not use.**

## 2b. What the real half says

Total across the whole export:

| | |
|---|---|
| Revenue | **€9 042 028,23** |
| Profit | €1 625 767,40 |
| Weight | 4 517 322,5 kg |

The €9,04 M matches the €9 million previously cited for its sibling
`Revenue per revenue group` over the same window — an independent cross-check
that both screens read the same figures.

## 2c. The seventeen revenue groups that carry revenue

> ⚠️ **Corrected 18-9-2026.** This section originally called these "the complete
> revenue-group list". They are not. I4 `Freight flow (SFN)` lists **26** groups
> → [stock-history.md](stock-history.md) §2a. B17 shows the seventeen that had
> revenue in the window; the other nine are accounting-only (`Roestvast.nl`,
> `Sales residual material`, `EU Import duties`, `Import costs`,
> `Revenue Asia vs. EU material`, `Foil consumption and sales`,
> `Other (Pallets etc)`, `Credit notes yet to be received`,
> `VAT credit restriction creditor`) and never carry a sales line.

Pieces of this were known from `order-lines.md` (the 1xxx/2xxx product groups)
and `charges.md` (the 8xxx charge groups); B17 confirms the numbering bands.

| No. | Group | Band |
|---|---|---|
| 1000 | SS 304 | material |
| 1100 | SS 316 | material |
| 1200 | SS 321 | material |
| 1300 | SS 430 | material |
| 1400 | High Alloys | material |
| 1500 | Aluminium | material |
| 1600 | Steel | material |
| 2900 | Other products | material |
| 3000 | Decoiling | processing |
| 3010 | Grinding/Foiling | processing |
| 3020 | Cutting | processing |
| 3030 | Lasering | processing |
| 3090 | Other processing | processing |
| 8100 | Freight costs | charge |
| 8150 | Freight costs external | charge |
| 8600 | Price differences | charge |
| 8900 | Other allowances | charge |

Three bands, and the band is readable from the number: **1xxx–2xxx material,
3xxx processing/options, 8xxx charges.**

## 2d. `Order type` is blank on the charge groups

| Order type | Rows |
|---|---|
| `Stk` | 60 |
| `CD` | 31 |
| *(blank)* | 18 |

All 18 blanks are 8xxx rows. **A charge has no `Stk`/`CD` split** — which makes
sense: the split is about whether the metal came off the shelf or was cut to
dimension, and freight is neither. Our own revenue reporting should leave it null
on charge lines rather than defaulting it.

## 2e. The second view is no longer needed

The run sheet asked for B17's second view on the grounds that the first might
hide the budget columns. **All five came through and all five are zero**, so
there is nothing for a second view to reveal. Struck off.

---

# Part 3 — S8 · Stock value check crashes

Run with `Year` = `2025`, `Month` = `1` and `View` = `-empty-`:

> **Database error** — The column `GL_ACCOUNT_STOCK` was expected but did not
> occur in `GetReportData_StockValueCheck`. Please contact system administration.

## 3a. The third instance of the same reference bug

| Screen | Missing column | Procedure |
|---|---|---|
| C1 Customers and Prospects | `DeliveryTerm` | `GetReportData_CustomerAndProspect` |
| B15 Order lines capacity overflow | `Thickness` | `GetReportData_CapacityOverrides` |
| **S8 Stock value check** | **`GL_ACCOUNT_STOCK`** | **`GetReportData_StockValueCheck`** |

Three screens where the `-empty-` view asks for a column the stored procedure
does not return. It is a bug in the reference — a view definition that drifted
ahead of its procedure — not a mistake in the capture.

**Fallback, same as C1:** pick any other `View` from the dropdown, export that,
and say which view it was. A short column list beats an error box.

## 3b. The error is itself a finding

`GL_ACCOUNT_STOCK` means the reference expects a **general-ledger account for
stock**, resolved per row on a stock-value report. Combined with
`Journaalpost instellingen` in the settings tree, that is the second independent
sign that stock valuation posts to named GL accounts.

`apps/dashboard` has no GL account on a product, a product group or a location,
and nothing posts anywhere. This feeds the same decision as K12 (replace AFAS or
sync with it).

## 3c. The columns, read off the crashed screen

The grid header renders before the error, so the column list survives:

`Product code` · `Handelslengte` · `Vast` · `Totaal Kg (start)` ·
`Totaal Kg (einde)` · `Totaal Hvh (start)` · `Totaal Hvh (einde)` · `Hvh eh` ·
`Totaal mm (start)` · `Totaal mm (einde)` · `Waardering (start)` ·
`Waardering (einde)` · `Waarder…` · `Mutatie Kg` · `Mutatie…`

Start-of-period and end-of-period totals in **three units** (kg, quantity, mm)
plus a valuation, and then the movement between them. It is an opening/closing
stock reconciliation. Two columns are cut off at the right edge and at least one
more (`Waarder…`) is truncated.

⚠️ This screen is also still in Dutch — `Handelslengte` (trade length), `Vast`
(fixed), `Totaal Hvh` (total quantity), `Waardering` (valuation), `Mutatie`
(movement). It is one of the few that was never translated, which usually marks a
screen added late.

---

# What this closes

- **B16, B17 → ✅.** The `Overviews` tree is **116 of 116 captured**.
- **B16 was wrongly called dead.** Corrected here.
- **B17's second view** — no longer needed.
- **S8** — 🟡 columns captured, rows blocked by a reference bug; needs a re-run on
  any other view.
- **New for K3** (features the reference ships and never uses): **budgets**.
- **New question K13:** does Swedinox file CBS statistics returns out of
  easy2trade, or from somewhere else? **Strengthened 18-9-2026** — I4 shows the
  same pattern: `Supplied SFN` and `Received from producers` are `0` on all 390
  rows, so on *both* SFN screens the SFN-specific fields are never filled.
