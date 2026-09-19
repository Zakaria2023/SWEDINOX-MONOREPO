# Stock history and Freight flow — I1, I4

Captured 18-9-2026, `Date` from `1-1-2024` to `18-9-2026`, `View` = `-empty-`.
Two of the five "unproved empty" screens turned out to have data, and both are
substantial.

| # | Screen | Result |
|---|---|---|
| **I1** | Stock history | ✅ **33 211 × 55** |
| **I2** | Production batches | ✅ **confirmed empty**, filter photographed |
| **I3** | Freight movement | ✅ **confirmed empty**, 34 columns captured |
| **I4** | Freight flow (SFN) | ✅ **390 × 16** |
| **I5** | Sawing layouts | ✅ **confirmed empty**, 43 columns captured |

---

# Part 1 — I1 · Stock history

**33 211 rows × 55 columns.** It is the stock-on-location screen plus
`Year (Reference date)` / `Month (Reference date)` — that is, **a full snapshot
of every lot, taken monthly and kept.**

## 1a. Fifteen monthly snapshots, and a real time series

| Snapshot | Lots | Kg | Value |
|---|---|---|---|
| 2024-12 | 2 230 | 2 841 963 | € 6 421 978 |
| 2025-05 | 2 172 | 2 299 235 | € 4 729 264 |
| 2025-06 | 2 176 | 2 299 471 | € 4 728 832 |
| 2025-07 | 2 179 | 2 361 171 | € 4 886 119 |
| 2025-08 | 2 200 | 2 361 456 | € 4 899 088 |
| 2025-09 | 2 205 | 2 360 131 | € 4 892 456 |
| 2025-10 | 2 208 | 2 350 482 | € 4 902 075 |
| 2025-11 | 2 214 | 2 389 507 | € 4 948 208 |
| 2025-12 | 2 227 | 2 399 857 | € 5 028 862 |
| 2026-01 | 2 227 | 2 399 857 | € 5 028 862 |
| 2026-02 | 2 228 | 2 399 857 | € 5 028 862 |
| 2026-03 | 2 234 | 2 405 097 | € 5 038 259 |
| 2026-04 | 2 234 | 2 404 179 | € 5 036 400 |
| 2026-05 | 2 239 | 2 401 637 | € 5 028 563 |
| 2026-06 | 2 238 | 2 400 753 | € 5 028 563 |

Each snapshot differs from the last, so this is stored history, not the current
stock re-labelled fifteen times.

**Stock is ~2 400 t worth ~€5,03 M across ~2 230 lots and 518 distinct products.**

## 1b. 🔴 Two things this contradicts

**1. The months 2025-01 to 2025-04 are missing.** The filter ran from 1-1-2024,
and 2024-12 came back, so the gap is in the data, not the filter. The snapshot
series starts properly at 2025-05.

**2. Snapshots continue to 2026-06.** The error log's finding was that the test
database is a copy frozen around **mid-May 2025** and that the `BATCH` user logs
nothing after 13-5-2025. Yet a monthly snapshot exists for every month from
2025-05 to 2026-06.

Those two facts sit either side of exactly the same date, which is unlikely to be
coincidence. The most economical reading: **the snapshot series begins when the
test copy was taken**, and something has kept writing one every month since —
which would mean the batch scheduler is *not* entirely off. ⚠️ **Hypothesis.**
It matters because it bears directly on K10, and K10 is currently blocking. The
`Batchtaken` screen's last-run column (item S7) would settle it.

## 1c. ✅ `GL_ACCOUNT_STOCK` answered, from the screen next door

S8 `Stock value check` crashes because `GL_ACCOUNT_STOCK` is missing from its
stored procedure. **I1 carries the same field and it is filled:**

| Column | Value |
|---|---|
| `Stk-general ledger account no` | **`3000`** on all 33 211 rows |
| `Stk-general ledger account` | **`Stock`** on all 33 211 rows |

So stock posts to **one** GL account, `3000 Stock`, not one per product group or
location. That is worth knowing before any ledger work starts, and it means S8's
missing column would have added nothing — it is a constant.

## 1d. Location types and blocking, on 33 211 rows

| Location type | Rows |
|---|---|
| `Pick` | 29 000 |
| `Laad` | 2 160 |
| `Bulk` | 687 |
| `Bewerker` | 485 |
| `Schroot` | 382 |
| `Productie` | 313 |
| `Afroep` | 159 |
| `Afhaal` | 25 |

`Blocked` is `True` on 644 of 33 211 (1,9 %). This is the largest sample the
location-type model has ever been checked against, and the eight values match
[locations.md](locations.md) exactly.

## 1e. Against `apps/dashboard`

**We have no stock history at all.** `/stock-on-location` shows the present and
nothing else. There is no snapshot table, no `Year`/`Month` reference date, and
no way to answer "what was stock worth at the end of March?".

Building it is cheap and mechanical — a monthly job that copies the lot table
with a reference date — but it is **a new table plus a scheduled job**, and this
app has no scheduler yet. Worth queueing, not worth improvising.

---

# Part 2 — I4 · Freight flow (SFN)

**390 rows × 16 columns**, and 390 is exactly **15 months × 26 revenue groups** —
a complete grid with no gaps.

Despite the name this has nothing to do with freight or transport. It is a
**monthly tonnage balance per revenue group**: what you started with, what came
in and from where, what went out and to where, what you ended with.

## 2a. 🔴 The revenue-group master is 26, not 17

B17 showed 17 groups. It showed the 17 that *had revenue in that window*. I4
lists **26**, and the nine extra ones are all non-trading:

| Extra group | |
|---|---|
| `Roestvast.nl` | the webshop |
| `Sales residual material` | offcuts sold on |
| `Revenue Asia vs. EU material` | an origin-margin group |
| `EU Import duties` | |
| `Import costs` | |
| `Foil consumption and sales` | |
| `Other (Pallets etc)` | |
| `Credit notes yet to be received` | |
| `VAT credit restriction creditor` | |

⚠️ **This corrects [sales-statistics.md](sales-statistics.md) §2c**, which called
B17's seventeen "the complete revenue-group list". It is not — it is the
seventeen that were used. The full master has 26 and includes accounting-only
groups that never carry a sales line.

## 2b. ✅ Two formulas, proved on all 390 rows

**The chain closes perfectly:**

```
this month's Ending inventory == next month's Starting stock
```

**338 of 338** consecutive pairs, to the gram. This is a genuine running ledger
of tonnage, not an independently recomputed figure per month.

**And `Stock difference` is the unexplained residual:**

```
Stock difference = (Starting stock + all receipts − all supplies) − Ending inventory
```

**390 of 390 rows, exact.** Not 349 — the naive reading
(`start + receipts − supplies == ending`) holds on only 349 of 390, and the 41
that fail are exactly the rows where material left without being *supplied*:
consumed by production, cut to scrap, or corrected. `Stock difference` is the
plug that absorbs all of it — **1 249,7 t** across the period.

That is a useful thing to have named. Our app tracks production consumption and
sawing waste as separate movements and has nothing that reconciles them back
against a period balance.

## 2c. Three columns are dead, and they are the SFN ones

| Column | Value |
|---|---|
| `Received from producers` | **`0` on all 390 rows** |
| `Supplied SFN` | **`0` on all 390 rows** |
| `To order manufacturers` | **`0` on all 390 rows** |

The same pattern as B16, where `sfn_no` is `0` on all 826 rows. Both screens are
built to report against **SFN** — a trade federation — and on both, the column
that would identify the SFN half is never filled.

Everything *else* is filled: receipts split `non-producers` / `within EU` /
`outside EU`, supplies split `non-SFN` / `outside NLD`, and both on-order
columns. So the **origin/destination split is live and the membership split is
not.**

This strengthens the case for **K13**: the machinery for a statistics return
exists and runs, and the specifically-SFN fields are blank on every row of both
screens. Ask whether Swedinox files these at all before building either.

## 2d. Against `apps/dashboard`

Nothing like this exists. We have no concept of:

- a **period tonnage balance** per revenue group,
- receipt **origin** (producer vs trader, EU vs non-EU) — which is a customs and
  statistics distinction, not a commercial one,
- delivery **destination country** as a reportable split,
- an explicit **unexplained-difference** figure.

The origin fields are the interesting ones: they would have to be captured at
purchase time, on the supplier or the purchase line, and we capture neither.

---

# Part 3 — The three that really are empty

All three ran `1-1-2024` → `18-9-2026` with `View` = `-empty-`, filter block
photographed or exported. **These leave scope.**

## I2 · Production batches — 4 columns

`Code` · `Aangemaakt` · `Machine` · `Naar Locatie`

Four columns, and still in **Dutch** — created-on, machine, to-location. The
screen exists, nothing has ever used it. Note this is *not* the same as
`Production workorders`, which is populated.

## I3 · Freight movement — 34 columns

`Mutation date / time` · `Mutation operator` · `Product code` · `Description` ·
`Length (mm)` · `Width (mm)` · `MutationQty (StkU)` · `StkU` ·
`MutationQty (Kg)` · `Internal charge` · `Mutation reason` · `MutationQty (€)` ·
`Workorder#` · `Start date` · `Starting stock (€)` · `Starting stock (Kg)` ·
`End date` · `Closing stock (€)` · `Closing stock (Kg)` ·
`General ledger account# Stock` · `Revenue group` · `Standard product` ·
`Stock product` · `Company code` · `Company` · `Order` ·
`Starting stock (StkU)` · `Closing stock (StkU)` · `Text` ·
`Revenue group number` · `Charge` · `Purchase order` · `Receipt date` ·
`Supplier`

⚠️ **This is a stock-mutation screen, not a transport one** — and its column list
is very close to `Stock mutations`, which *is* populated (13 562 rows over the
same window). So "Freight movement" is a second, differently-scoped view of
movements that has never been used, rather than a missing feature. It also
carries `General ledger account# Stock` — the third screen to reference it.

## I5 · Sawing layouts — 43 columns

A fetch half (`Machine`, `Fetch date/code/status/qty`, `Warehouse`, `Section`,
`Location`, `Product`, `Length`, `Residual length (p)`), a sawing half
(`Sawing date/code/status/product`, `Total pieces to be sawed`, `Sawing of TL`,
`Sawing according to specification`, `Layout includes corners`,
`Follow-up processing`, `To location(s)`) and then **ten `Qty n` / `Length n`
pairs** — the cutting pattern itself, up to ten different lengths off one bar.

**Empty, over the full window.** This is the third independent confirmation that
**sawing planning is switched off** in the reference — it is already on the K3
list of features shipped and unused. The ten-pair layout structure is worth
keeping on record in case sawing planning is ever wanted.

---

# Part 4 — Cross-checked against a live `Stock on location`

Exported the same evening, 18-9-2026: **2 247 rows × 54 columns.**

## 4a. ✅ The snapshot theory, proved structurally

The two column lists line up exactly:

```
Stock history = Stock on location
              + Year (Reference date)
              + Month (Reference date)
              − Modified on
```

**53 columns shared, one dropped, two added.** A snapshot keeps what a lot *was*
and throws away when it was last touched, which is what you would do if you were
freezing a row rather than tracking it.

## 4b. The drift since the last snapshot

| | Lots | Kg | Value |
|---|---|---|---|
| 2026-06 snapshot | 2 238 | 2 400 753 | € 5 028 563 |
| Live, 18-9-2026 | 2 247 | 2 428 474 | € 5 070 916 |
| **Difference** | **+9** | **+27 722** | **+€42 353** |

Eleven lot keys are in live and not in the snapshot; three are in the snapshot
and not in live.

⚠️ **So the reference database is still moving.** Small movements, but real ones,
on a system described as frozen at mid-May 2025. Combined with §1b (snapshots
running to 2026-06), that is the second sign that the "frozen copy" picture is
incomplete. It also means **a capture taken today may not reproduce exactly
tomorrow** — worth knowing before anyone tries to re-derive a figure from these
docs.

## 4c. 🔴 `Blocked` follows from `Location type` — now on 33 211 rows

This was proved on the 2 247-lot export of 9-9-2026. The history file raises the
sample **fifteen-fold** and the rule holds without a single exception:

| Location type | Blocked | Free | Across 33 211 history rows |
|---|---|---|---|
| `Afroep` (call-off) | 159 | 0 | **always blocked** |
| `Bewerker` (external processor) | 485 | 0 | **always blocked** |
| `Afhaal` | 0 | 25 | never |
| `Bulk` | 0 | 687 | never |
| `Laad` | 0 | 2 160 | never |
| `Pick` | 0 | 29 000 | never |
| `Productie` | 0 | 313 | never |
| `Schroot` | 0 | 382 | never |

**Zero exceptions in 33 211 rows.** Two location types block, six do not.

**But the live export has one.** One of 23 `Productie` lots is blocked today, and
no `Productie` lot was blocked in any of the fifteen snapshots. So the flag is a
**default derived from location type, with a manual override** — not a computed
field. Our model should derive it and still allow it to be set, and the override
appeared some time after the 2026-06 snapshot, which is itself more evidence for
§4b.

✅ **G10 confirmed in passing:** all 36 `Bewerker` lots are blocked live, and
485 of 485 across the history. The question G10 actually asks — *which screen set
that, and can it be lifted by hand* — is now sharper, because the single
`Productie` override proves a lot **can** be blocked by hand.

---

# What this closes

- **I1 → ✅ 33 211 rows.** Monthly stock snapshots exist. We have none.
- **I4 → ✅ 390 rows.** Two formulas proved on every row.
- **I2, I3, I5 → ✅ confirmed empty** with the filter captured. They leave scope.
- **`GL_ACCOUNT_STOCK` is `3000 Stock`**, a constant — answered without needing S8.
- **The revenue-group master is 26, not 17** — corrects sales-statistics.md §2c.
- **⚠️ New doubt on K10:** snapshots continue to 2026-06 on a database said to be
  frozen at mid-May 2025. The `Batchtaken` last-run column (S7) settles it.
- **Sawing planning** confirmed unused for the third time (K3).
- **`Stock history` = `Stock on location` + reference year/month − `Modified on`** —
  53 shared columns, proved by diffing the two exports.
- **`Blocked` follows from `Location type`** on 33 211 rows with zero exceptions,
  but the live export has one manual override — so it is a **default, not a
  computed field**.
- ⚠️ **The reference database is still moving** (+9 lots, +€42 353 since the
  2026-06 snapshot). Captures may not reproduce exactly.
