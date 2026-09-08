# Nesting

`Overviews → Logistics → Nesten`. Ours: `/nesting`.

**How order lines are laid out on the plate before cutting.** The widest screen
in the group — over fifty columns, because it joins the order line, the sawing
work order, the nest, the machine and the fetch that brings the material.

**Filter**: from / u/i (unlabelled), `Show Data`. No `View` saved at all.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product ·
Show Company · Show Order · Optimaliseer *(greyed)* | Purchase lines ·
Warehouse workorders

`Optimaliseer` is greyed out — the nesting optimiser is a batch job, and
`Batchscheduler is not active`.

---

## 🔑 `Theor. Weight` is a **density** when its unit says `M3`

The single most valuable column on the screen, and it settles a bug I had
already introduced once:

| `Theor. Weight (kg)` | `Theor. Weight U.` |
|---|---|
| **7 850** | **`M3`** |

7 850 kg per cubic metre is the density of stainless steel. It is not a
7,85-tonne plate. Every row on the screen carries the same pair.

So the unit column is not decoration — **it decides how the figure is read**:

| Unit | What the stored figure means | Piece weight |
|---|---|---|
| `KG` / `ST` | kilograms per piece | the figure itself |
| `M1` | kilograms per running metre | × length |
| `M2` | kilograms per square metre | × length × width |
| `M3` | **kilograms per cubic metre — a density** | × length × width × thickness |

A 3 000 × 1 500 × 2 mm plate at 7 850 kg/m³ weighs **70,65 kg**. Read without
the unit it would be 7 850 kg — out by a factor of 111.

### ⚠️ But the displayed density is **not** what `Kg(p)` is computed from

A ten-row export settles this, and it is the opposite of what the screen
suggests. Every row shows `7 850 per M3`, yet the weight each row actually
carries implies a different density:

| Product | Size | `Kg(p)` per piece | implied density |
|---|---|---|---|
| `PK304L200315` | 3 000 × 1 500 × 2 | 72,0000 | **8 000** |
| `PK304L15025125` | 2 500 × 1 250 × 1,5 | 37,5000 | **8 000** |
| `PK430080` | 2 000 × 1 000 × 0,8 | 12,8000 | **8 000** |
| `PK316L600` | 395 × 395 × 6 | 7,4903 | 8 001 |
| `PK304L150` | 1 500 × 180 × 1,5 | 3,1793 | **7 850** |
| `PC304L150` | 750 × 500 × 1,5 | 4,4200 | 7 858 |
| `PC304L150` | 550 × 450 × 1,5 | 2,9500 | 7 946 |

Five of ten land on 8 000 and the rest scatter between 7 850 and 7 946 — while
the column beside them says 7 850 on every single row.

So `Kg(p)` comes from **the product's own stored per-piece weight**, not from
re-deriving it against the density this screen prints. The density column is a
default shown for the material, and the per-product figure that actually
produced the weight differs — which is exactly what `Products.densityKgDm3`
exists for, and matches the earlier finding that a 316L plate reads 7,850 here
where our grade table says 8,000.

**Which is why `productPieceWeightKg` prefers the stored `weightTheoretical`
and only derives from a density when there is none.** That ordering is not a
convenience; it is the only ordering that reproduces the reference.

### ⚠️ What this fixed

1. **`salesUnitOptions` had no `M3`.** The one value the reference actually uses
   for this column was missing from the enum. Added.
2. **Nothing read the unit.** `Products.weightUnit` existed, and three screens
   already surfaced it as `theoreticalWeightUnit` — but no code anywhere
   branched on it. Now `THEORETICAL_WEIGHT_BASIS` and
   `theoreticalPieceWeightKg` in `lib/helpers.ts` do.
3. **Three quote/order call sites read the raw column.** All three passed
   `theoreticalWeight: Number(product.theoreticalWeight ?? 0)` straight into
   `quoteLineFinancials`, which multiplied it by the quantity to get the line
   weight. On reference data that is `quantity × 7 850`. All three now go
   through `productPieceWeightKg`.

This is the second time this column has bitten. The first time I read it as a
density when it was a weight; the reference's own screen now says it is a
density *when the unit says so*, and the unit is the only thing that tells you.

---

## The nest, the machine and the fetch

Three linked objects per row:

**The sawing work order** — `Sawing workorder` (`306623`), `Sawing workorder
line`, `Sawing workorder status` (`New`), `Nest`, `Sawing machine`
(`LASER 1`, `KNIP`).

**The geometry** — `Drilling holes`, `L.Saw angle`, `R.Saw angle`,
`Sawing angle(s)`, `Bls` ☐, `Bls+P` ☐, `Sawing` ☐, `Drilling` ☐, `Standing` ☐,
`Sawing type`, `Sawing speed`, `To saw`, `Fixed dimensions` ☑, `Pick-up` ☐.

**The fetch** — `Fetch date`, `Fetch code` (`306622`), `Fetch line`,
`Fetch status` (`Released`), `Fetch qty`, `Fetch product`, `Fetch description`,
`Fetch length`, `Residual length`.

`Fetch code` `306622` and `Sawing workorder` `306623` are **consecutive**. So
raising the job hands out two numbers from the one sequence: a `Fetching`
warehouse work order to bring the plate to the machine, and a sawing work order
to cut it. That is the same shared sequence
[warehouse-workorders.md](warehouse-workorders.md) describes, seen from the
production side.

`Residual length` is `0` throughout — the offcut, which is where
`production_remnant` comes from.

---

## `Delivery status: Workorders created`

The four scheduled rows read `Delivery status: Workorders created`, with
`Sawing workorder status: New` and `Kg(a)` of 0.

Exactly the same phrase, and exactly the same meaning, as the receipt status on
[Receipts](receipts.md): **the work orders exist and nothing has happened yet.**
The reference uses one vocabulary for "promised but not done" across inbound
goods and production alike.

The remaining rows read `Delivery status: Released` with no sawing work order at
all — released to be nested, not yet nested.

---

## Columns

**The order line** `Order` · `Order type` (`Normal`) · `Line` · `Company` ·
`Product code` · `Product` · `Length (mm)` · `Width (mm)` · `Dikte`
(thickness) · `Kwaliteit` (quality) · `Categorie` (`2nd choice`) ·
`Line Qty(p)` · `Line Qty(a)` · `Line QtyU` · `Option Qty` · `Line status` ·
`Line type` (`Stk`) · `Order line Deliv. Date`

**Weights** `Kg(p)` · `Kg(a)` · `Theor. Weight (kg)` · `Theor. Weight U.`

**Delivery** `Production starting date` · `Planned Delivery` · `Delivered` ·
`U(delivery)` · `Delivery date (p)` · `Delivery date (a)` · `Delivery status` ·
`Transport date`

**Nesting** the three groups above.

`Dikte` and `Kwaliteit` and `Categorie` are still in Dutch on this screen where
other screens translate them — the reference's own translation is incomplete,
which is worth remembering when matching column names.
