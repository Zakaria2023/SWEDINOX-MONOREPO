# The picking flow, watched from `New` to `Approved` — 30-9-2026

The first time a warehouse picking has been driven end to end in the reference
system. It closes **O2** and the warehouse half of **O3**, which together were
the only things blocking [item 12](PLANNED-CODE-CHANGES-6.md).

**What was driven:** warehouse work order **`323526`** — Picking, dated
29-6-2026, sales order **`106146`**, customer *Bergen Stainless & Steel Products
B.V., THOLEN*. Three lines (`/3`, `/5`, `/6`), 150 pieces, 5 625 kg planned,
375 m, all of product **`PK44115025125`** (Cold-rolled plate 441 2500×1250×1,5).

**Evidence:** `Stock on location` for that product code exported before and
after — 14 rows each time. The "after" export is
[`exports/g1-stock-on-location-PK44115025125-after-picking-323526.tsv`](exports/).
The "before" was captured as six screenshots of the same grid scrolled across
all 54 columns, and every figure in it reconciles against the after export.

---

## 1. The route, and the screen that is not the screen

| Menu path | What it is |
|---|---|
| `Overviews → Logistics → Warehouse workorders` | a **report grid**, read-only |
| **`Logistics → Warehouse workorders`** | the **operational screen** — release, report, approve |

The tab strip above the grid (`Hego Prod - Picken` · `Lossen` ·
`To Do Slijp+Knip` · `Alles`) is **not a filter**. Each button **opens a
different screen**: `Alles` opens `Transport workorders`, not "all warehouse
work orders". The saved `View:` dropdown is the thing that filters, and
`Ext. Prod - Picken` carries a hidden chip `Bedrijf ≠ Hego Production, ALMERE`.

⚠️ For us: the work-order overview needs no tab strip. It needs a **saved-view
selector whose filter is visible**, which is what the reference's bottom-of-grid
filter chip does and what ours already does with searchParams.

### The grid is a four-level tree

`Dag / Type / Opdracht / Regel` — date → work-order type → work-order number →
line. Ours is flat. Not worth changing on its own, but the **line numbers are
the sales order's**, not 1..n: `323526` holds lines **3, 5 and 6**, because
lines 1, 2 and 4 of order `106146` are on other work orders.

> **A work order carries a subset of its sales order's lines, keyed by the sales
> line number.** `WarehouseWorkOrderLines` must store the originating line
> number, not a local sequence.

---

## 2. The state machine, proved by which buttons light up

With a **date row** selected, the whole toolbar is grey. Buttons act on a
**work-order row**.

| Status | Live buttons |
|---|---|
| `New` | `Release` · `Cancel` · `Package` |
| `Released` | `To prepare` · **`Report completion...`** · `Cancel` · `Package` · `Print` |
| `Approved` | `Package` · `Print` (everything else grey) |

So:

```
New ──Release──> Released ──report every line──> Approved
```

🔑 **`Report completion...` is unreachable from `New`.** A picking must be
released first.

🔑 **`Release` is silent** — no dialog, no confirmation, no print, and it moves
**no stock**: `Qty(a)` and `Kg(a)` stayed at `0`. It is a pure status change.

🔑 **`Approve` is never pressed.** Reporting the last line took the work order
straight from `Released` to `Approved` on its own. The button exists for the
manual case; the normal flow does not use it.

⚠️ `Vrijgeven zonder voorraadlabels` (*release without stock labels*) stayed grey
while `Release` was live, so the two are **not** alternatives on the same state.
What distinguishes them is still unknown.

---

## 3. A `New` picking already carries its lots

This overturns what was assumed after the 29-9-2026 crash. Scrolled right, every
line of every `New` picking already had a lot on it:

| WO | Line | From | `Internal batch` | `Charge` | `Internal charge` | `Kwaliteit` |
|---|---|---|---|---|---|---|
| `318341` | 1 | `7W3` | `398250` | `3HLJ` | `26AKSI` | EN 1.4016 BA |
| `323526` | 3 | `4A5` | `402152` | `SD40825` | `26AOCW` | EN 1.4509 2B |
| `323526` | 5 | `2C7` | `402158` | `SD40826` | `26AOCX` | EN 1.4509 BA |
| `323526` | 6 | `4A1` | `402156` | `SD40826` | `26AOCX` | EN 1.4509 BA |

> **Lot allocation happens when the picking is raised, not as a step after
> release.** The `312722` crash of 29-9-2026 was an *abnormal* work order whose
> lines carried `Charge = -`, not the normal flow.

Our item 24 guard is still right — it refuses exactly the state that crashed the
reference — but item 12 does **not** need an allocation UI. It needs the
allocation to happen at work-order creation.

---

## 4. Three names for one field

| Screen | Column | Value |
|---|---|---|
| `Stock on location` | **`Bundle`** | `402152` |
| `Warehouse workorders` | **`Internal batch`** | `402152` |
| `Report completion` lot picker | **`Interne partij`** | `402152` |

One field, three labels, one of them untranslated Dutch. And it sits beside two
genuinely different identifiers:

| Field | Example | Grain |
|---|---|---|
| `Charge` | `SD40825` | the **mill's heat** — spans many bundles |
| `Internal charge` | `26AOCW` | **our sub-lot** — spans ~3 bundles |
| `Bundle` | `402152` | **the physical parcel** |

Proved on this product: `26AOCW` covers bundles `402152`, `402153`, `402154`,
`402155`; `26AOCX` covers `402156`, `402158`; and heat `SD40825` spans both
`26AOCW` and `26AOCY`.

---

## 5. 🔴 O3, answered — the two lot pickers deliberately disagree

Clicking the `Charge` cell in `Report completion` opens a picker with columns
`Location` · `Internal charge` · `Charge` · `Purchase order` · `Receipt date` ·
**`Available`** · `Interne partij`, and a filter chip at the bottom reading
**`Location = 2C7`**.

For line `/5` it offered exactly two rows, and both read **`Available 50`**:

| | `Stock on location` | `Report completion` picker |
|---|---|---|
| lot `402158` stock | 50 | — |
| lot `402158` reserved | 50 | — |
| lot `402158` **available** | **0,00** | **50** |

> 🔑 **The warehouse picker's `Available` is physical stock. It ignores
> reservations entirely.**

This is correct behaviour, not a bug. The warehouseman is consuming metal *for
the very order that reserved it*; hiding reserved stock would leave him nothing
to pick. So the two dialogs run two deliberately different rules:

| Dialog | Rule | Why |
|---|---|---|
| Sales order-line `Stock` picker (item 6, item 22) | `Available = Stock − Reserved` | a salesman must not sell committed metal |
| Warehouse `Report completion` `Charge` picker | `Available = physical stock` | the picker must see what is on the shelf |

**And the picker is scoped to the line's `From location`.** It offered 2 rows
out of the product's 14 lots, because shelf `2C7` holds exactly 2.

✅ **O3 is closed.** Both halves.

---

## 6. 🔴 O2, answered — a bundle number is a label, not an identity

### The diff

Totals conserve **exactly**: 511 pieces and 18 801,731 kg before and after,
14 rows before and 14 rows after.

| Bundle | Before | After | |
|---|---|---|---|
| `402158` | 50 @ `2C7` | 50 @ `Laad` | moved, **kept its number** |
| `402156` | 50 @ `4A1` | 50 @ `Laad` | moved, **kept its number** |
| `402152` | 50 @ `4A5` | 50 @ `4A5` **and** 50 @ `Laad` | **appears twice** |
| `402153` | 50 @ `4A5` | — | 🔴 **gone** |

### Why `4A5` misbehaved and the other two shelves did not

Shelf `4A5` was the only one holding **two lots the picker cannot tell apart**:

```
402152  4A5  SD40825  26AOCW  IO403283  29-5-2026  € 1 537,61789
402153  4A5  SD40825  26AOCW  IO403283  29-5-2026  € 1 537,61789
```

Same heat, same internal charge, same purchase order, same receipt date, same
valuation, same quality, same dimensions. And the picker's display label is
exactly **`SD40825, IO403283, 29-5-2026`** — which **identifies neither of
them**. Shelves `2C7` and `4A1` each held one candidate, and both moves came out
clean.

### Timestamps, which fix the order of events

```
17:10:54   402158 @ Laad created        (line /5, from 2C7)
17:11:05   402152 @ 4A5  modified       (line /3, from 4A5)
17:11:06   402152 @ Laad created
17:11:20   402156 @ Laad created        (line /6, from 4A1)
```

The row at `4A5` was **modified, not emptied** — it still holds 50 — while a new
`402152` was created at `Laad` and `402153` ceased to exist. Whether the system
debited `402153` and relabelled the parcel `402152`, or debited `402152` and
renumbered `402153`, cannot be told apart from the outside and does not matter.
The observable rule is the same:

> 🔑 **A bundle number is a printed label on a parcel, not a durable identity.**
> After a move, the number on the moved parcel need not be the number of the row
> that was debited. Two indistinguishable lots on one shelf are
> interchangeable to the system.

This is the same shape as the 21-9-2026 anomaly recorded in
[order-to-delivery.md](order-to-delivery.md#7): lot `389825` lost 5 pieces while
the parcel that landed at `Laad` was labelled `389827`. Same mechanism, now
reproduced deliberately.

### ✅ What we do about it

**Nothing — and that is the finding.** Our `Stock` row has a uuid primary key.
The identity is ours, it is stable, and it survives a move. We are *better* than
the reference here, and the correct action is to **not** copy its behaviour:

1. **Never key a stock movement on the bundle number.** Key it on the lot's
   uuid.
2. **`Stock.bundle` is a label field** — printed on the parcel, searchable, not
   unique, not an identifier, and **not a foreign key**.
3. **A relocation moves the lot row; it does not mint a new identity.** When our
   warehouse work order moves 50 pieces from `4A5` to `Laad`, the same
   `Stock` uuid changes location, or splits into two rows that both carry the
   parent's lineage. Either is fine. Losing the number is not.
4. Because the reference *can* lose a number, **any import from it must treat
   `Bundle` as non-unique** and de-duplicate on
   `(product, location, charge, internalCharge, valuationPrice)`.

✅ **O2 is closed.**

---

## 7. 🔴 Reporting a line re-plans everything that is left

After reporting line `/3`, the system raised a modal:

> **`Notification in workorder 323526/3`**
>
> *Onderstaande vrijgegeven, afgedrukte opdrachten zijn verwijderd. Voor de
> leveringen zijn nieuwe reserveringen en opdrachten aangemaakt.*
> **`327343/5 (106146/50)`**
>
> — *The released, printed work orders below have been **deleted**. **New
> reservations and new work orders have been created** for the deliveries.*

> 🔑 **A partial report tears down the remaining released work and re-raises
> it.** The outstanding lines are *deleted*, their reservations are *dropped*,
> and a **new work order** (`327343`) with **new reservations** is created
> against the same sales order (`106146`), for the same quantity (50).

This is the most consequential behaviour found today, and it is a second,
independent route to the O2 symptom: a reservation that is dropped and re-made
can land on a different lot than the one displayed a moment earlier.

⚠️ **Our model does not do this and should not.** Deleting a work order that has
already been printed and released destroys the paper trail the warehouse is
holding. What ours should do instead:

- **Report a line → decrement that line, leave the others alone.**
- If a re-plan is genuinely needed, it is an explicit action with its own
  movement rows, not a silent side effect of reporting an unrelated line.
- **Reservations are never silently re-pointed.** Item 22 already made
  reservations binding on the sales side; this makes them binding on the
  warehouse side too.

**Open:** whether the notification fires once per work order or once per
reported line. Both readings fit what was seen.

---

## 8. The `Report completion` dialog, field by field

Title: **`Report completion of workorder 323526/3, 50 ST Cold-rolled plate 441
2500x1250x1.5mm`**

🔑 **One dialog per line.** A three-line picking is three dialogs, not one. Ours
reports a whole work order at once — that is a real divergence.

| Control | Default | Notes |
|---|---|---|
| `Executed on:` | **now** (`30-9-2026 17:59`) | datetime, editable |
| `By:` | **`-empty-`** | the operator; not mandatory |
| `To Location:` | **`Laad`** | with a `...` browse button |
| `OK` / `Cancel` | | |

Grid toolbar: **`+ New`** · **`✕ Delete`**, over columns:

`Qty(p)` · `Qty(a)` · `Kg(p)` · `Kg(a)` · `Length` · `Width` · `Thickness` ·
`From location` · `Charge` · `Batch` · `Internal batch`

One pre-filled row plus four blank spares:

```
50 | 50 | 1875 | 1875, | 2500 | 1250 | 1,5 | 4A5 | SD40825, IO403283, 29-5-2026 | | 0
```

- **`Qty(a)` and `Kg(a)` are pre-filled to the planned figures.** The default is
  "all of it, exactly as planned".
- 🔑 **`+ New` is the bundle split.** One planned line may be reported as several
  parcels. This is what **O4** was asking about — the 20/25/20/25/10 split on the
  unloading dialog is the same control on the same kind of grid. O4 is not
  *closed* (nothing says what pre-computed that particular split), but the
  mechanism is now understood: **the operator adds rows.**
- ⚠️ **`Internal batch` reads `0`** in the dialog while the work-order grid
  showed `402152` for the same line. The dialog does not carry the bundle in.
  Combined with §6, this is very likely *where* the number gets lost.
- **`Charge` renders as `heat, purchase order, receipt date`** — three fields
  concatenated, and as §6 shows, not unique.

---

## 9. Arithmetic confirmed to the gram

**Density is 7850 and it is stored on the product** (`Theoretical Wt. 7850`,
`Theor. Wt. U. M3`):

```
50 × 2,5 × 1,25 × 0,0015 × 7850 = 1 839,84375 kg   ← exact, on six rows
```

**`Available = Stock − Reserved`** on all 14 rows, both exports.

**`M1` = pieces × length**: 29 × 2,5 = 72,5 ✓, 24 × 2,5 = 60 ✓, 150 × 2,5 = 375 ✓

**`Stock (€)` = kg/1000 × valuation price** (TN basis):
1 839,84375 / 1000 × 1 537,61789 = € 2 828,98 ✓

**Valuation carries 5 decimals** — `1537,61789`, `1345,19975`, not 2. Our
`decimal` precision on lot valuation must allow it.

🔴 **A relocation does not revalue.** `402152` moved to `Laad` at the same
€ 1 537,61789, `402156`/`402158` at the same € 1 345,19975. Stock category
carried too — both `2nd choice` lots stayed `2nd choice`.

### ⚠️ One unexplained gap

The work order plans **1 875 kg** for 50 pieces; the stock row weighs
**1 839,84 kg**. That is density **8000** against **7850** — a 1,9 % difference,
on the same product, in the same system, at the same moment.

The `Report completion` dialog pre-fills `Kg(a)` with the **work order's** 1875,
not the lot's 1840. So if the operator accepts the default, the reported weight
is 1,9 % heavier than the metal that moved.

**This is not being guessed at.** It is [**O11**](PLANNED-CODE-CHANGES-6.md).

---

## 10. Smaller things worth keeping

- **Stock posts to ledger account `3000 Stock`** (`Stk-general ledger account
  no` = 3000 on every row). Free find; it belongs with the O9 work.
- Lot `365542` carries `Vrd. Opmerking` = **"Slechte 2e keus!"** — a free-text
  stock remark, in use, on a real row. Item 26b's `stock_remark` correction
  reason was the right call.
- `Qty ordered` = `24,00` repeated identically on all 14 rows, so it is a
  **product-level** figure (open purchase quantity), not a lot figure. Do not
  model it on the lot.
- `Gipgroup` `P4302020` / `Gip product group` `PK430` appear only on
  `2nd choice` rows — unexplained, low value.
- Reference version **3.13.0.508**; status bar reads **`Batchscheduler is not
  active`**, confirming the earlier finding.
- The picking's destination is not always `Laad`. Work order `318341` sends line
  1 to **`Afroep`** (call-off).

---

## What this unblocks

| | |
|---|---|
| **O2** | ✅ closed — bundle is a label; our uuid identity is correct and stays |
| **O3** | ✅ closed — warehouse picker ignores reservations by design |
| **item 12** | ✅ **unblocked**, and smaller than thought: allocation happens at work-order creation, not in a separate UI |
| **O4** | 🟡 mechanism understood (`+ New` adds parcels); what pre-computes a split is still unknown |
| **O11** | 🔴 new — the work order and the stock row disagree on density, 8000 vs 7850 |
