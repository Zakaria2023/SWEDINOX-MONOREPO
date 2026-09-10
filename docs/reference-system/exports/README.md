# Exports from the reference system

Reference-system exports live here as **TSV**, one file per screen, named after
the screen. **Contents are gitignored** — see `.gitignore` — so the files exist
only on the machine that captured them, and the docs that cite them carry the
row counts and conclusions.

## How to capture one

`Save as Excel` is **blocked** on this install. Use **`Show in Excel`**, leave
the workbook open, and read it out of the running Excel over COM:

```powershell
$excel = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
$ur = $excel.Workbooks.Item(1).Worksheets.Item(1).UsedRange
$v  = $ur.Value2        # one COM call for the whole grid, not cell by cell
```

Join rows with `[string]::Join("`t", $cells)` — **not** `StringBuilder.Append`,
whose overload resolution picks `Char` and silently mangles the output.

`MK_E_UNAVAILABLE` from `GetActiveObject` means no Excel is running: the
workbook was closed, or has not finished opening.

## Four things to get right, or the file is misleading

1. **Set `View` to `-empty-` first.** The export carries the *current* view's
   columns, so a column hidden in the active view is **absent from the file**,
   not blank in it. `Trip data` returned 7 columns on its default view and 20 on
   `-empty-`; the 13 missing ones included every cost column.
2. **Widen every filter, but never blank a `from` box.** A legacy grid exports
   what is on screen. Blanking `from` voids the filter and returns **zero rows**
   — put a real date in, like `1-1-2000`. Text filters use `zzzzzzzzzzzzzzz` as
   their no-upper-bound sentinel; leave it alone.
3. **Watch for a second date filter.** `Deviations in count lists` has two, and
   the `AND` between them excludes any work order never reported as completed —
   which is probably why it returns nothing.
4. **Trim headers as well as values when parsing.** They were not, once, and the
   last column of every file silently read as empty — which turned two correct
   formulas into apparent failures.

## What is here (9-9-2026)

| File | Rows | Screen |
|---|---|---|
| `stock-mutations.tsv` | 13 562 | Stock mutations — the movement ledger |
| `warehouse-and-production-workorders.tsv` | 13 610 | Warehouse- and production workorders |
| `warehouse-workorders.tsv` | 11 625 | Warehouse workorders |
| `order-advice-full-view.tsv` | 5 535 | Order advice |
| `receipts-full-view.tsv` | 3 088 | Receipts |
| `warehouse-capacity.tsv` | 3 087 | Warehouse capacity |
| `stock-on-location-Sheet1.tsv` | 2 247 | Stock on location — the lot snapshot |
| `locations.tsv` | 1 940 | Locations |
| `pick-statistic.tsv` | 1 332 | Pick statistic |
| `receipts-per-day.tsv` | 1 008 | Receipts, per day |
| `trip-data-full.tsv` | 438 | Trip data, `-empty-` view (20 cols) |
| `trip-data.tsv` | 438 | Trip data, default view (7 cols) |
| `nesting.tsv` | 10 | Nesting |
| plus `purchase-receivals`, `purchase-results`, `order-advice-saved-view`, `sold-products-not-advised` | | earlier batches |

**≈ 71 000 rows.**

## ⚠️ The database is dense Jan–May 2025 and sparse after

Every export shows the same cliff. Trips: **425 of 438** in those five months.
Deliveries in the mutations ledger: **4 188 of 4 190**. Pick statistic:
**1 260 of 1 332**.

**Formulas proved against these files are sound** — they are arithmetic, and a
rule that holds on 13 583 of 13 583 lines holds. **Volumes are not**: read a row
count as the shape of a snapshot, never as a workload.
