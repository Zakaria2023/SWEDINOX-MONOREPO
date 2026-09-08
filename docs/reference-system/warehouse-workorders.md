# Warehouse work orders

`Overviews → Logistics → Warehouse workorders`. Ours: `/warehouse-workorders`.

**Every movement of stock inside the building.** One row per line of a work
order, saying what moves, from where, to where, and why.

**Filters**: `Product code` from / u/i, `Workorder date` from / u/i, `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product · Show… |
Purchase lines · Warehouse workorders · Orders and Quotes ·
Production workorders

**Backed by an export** — 11 625 work orders over `1-1-2024 … 8-9-2026`, kept as
`exports/warehouse-workorders.tsv`. Everything below is read off it.

---

## 🔑 This is how goods are received

The question the whole purchase chain hung on, answered outright.

### `Unloading` is the receipt

| | |
|---|---|
| rows | **3 179** |
| with **no** `From-location` | **3 179** — every single one |
| against a **purchase** order (`4xxxxx`) | **3 117** |
| against a **sales** order (`1xxxxx`) | **0** |
| naming a supplier in `Delivery/reception company name` | **3 179** |

Nothing else in the system has no source. Goods come from outside the building,
which is exactly what an inbound receipt is, and no other type behaves this way.

### Approving it is what books the goods in

| Status | Rows | `Kg(a)` filled |
|---|---|---|
| `New` | 116 | **6** (5 %) |
| `Released` | 122 | **11** (9 %) |
| **`Approved`** | 11 387 | **11 352 (100 %)** |

A work order is planned with `Kg(p)`, sits at `New` or `Released` with nothing
in `Kg(a)`, and **approving it fills the actuals**. That is the step that could
not be reached on the test install, and it explains everything: `Kg(a)` on a
reception is not typed, it is *reported* by the work order that moved the goods.

### A receipt does not always land in goods-in

`Ontvangst` takes 887 of the 3 179, and the rest go straight to a rack:

| To | Rows |
|---|---|
| `Ontvangst` | 887 |
| `7Z1` · `7W1` · `5A` · `7Y` · `6A` · `SC` | 1 151 between them |
| `Laad` | 263 — unloaded straight into despatch, presumably a cross-dock |

So goods-in is a default, not a rule.

---

## The six types

| Type | Rows | From | To | Against |
|---|---|---|---|---|
| **`Picking`** | 3 936 | a rack | `Laad` (3 420) | sales orders (3 721) |
| **`Unloading`** | 3 179 | **nothing** | `Ontvangst` or a rack | **purchase orders (3 117)** |
| **`Relocating`** | 2 405 | a rack | a rack | **no order at all** |
| **`Fetching`** | 1 244 | a rack | `Slijpen/Foliën`, `Laser 1`, `Knip` | sales orders (1 207) |
| **`Pick-up`** | 860 | `Afhaal` | — | sales orders (860) |
| **`Scrapping`** | 1 | | | |

`Relocating` carries no order because nobody ordered it — it is the warehouse
tidying itself.

`Fetching` goes to a **machine**, not a location: `Slijpen/Foliën` (grinding and
film), `Laser 1`, `Knip` (cutting). Those are the processing options bought as
service lines on a purchase order, seen from the other side.

---

## ✅ `Kg(dif)` = `Kg(a)` − `Kg(p)`

Exact on **11 625 of 11 625** rows. 493 came up short of plan.

Six approved unloadings differ, and they read like real life:

| Order | Planned | Actual | Difference |
|---|---|---|---|
| `290049/10` | 494,6 | 353,3 | **−141,3** |
| `401059/10` | 942 | 0 | −942 |
| `400472/20` | 3 073,3 | 0 | −3 073,3 |

A short delivery, and two that never came at all. This is the third place the
weighed weight shows up — planned against actual, with the difference kept
rather than the plan overwritten.

---

## Columns — all 44

**Identity** `Type` · `Workorder#` · `Line#` · `Workorder date` · `Status`

**What moves** `Product no.` · `Product` · `Length (mm)` · `Width (mm)` ·
`Thickness` · `Quality Code` · `Stock Category` · `Internal Bundle` ·
`Bundle quantity` · `Batch information`

**Where** `From-location` · `To-location` · `Section` · `Loading location` ·
`Resource`

**How much** `Qty(p)` · `U.` · `Kg(p)` · `Qty(a)` · `Kg(a)` · `Qty(dif)` ·
`Kg(dif)` · `Max. Bundle weight`

**Why** `Order` · `Order line` · `Company` ·
`Delivery/reception company name`

**Transport** `Vehicle` · `Transport date` · `Trip number` · `Trip status` ·
`Transport region` · `Bill of lading` · `Loading instructions`

**Audit** `Created by` · `Created on` · `Order created on` · `Modified by` ·
`Reported as completed on`

`Section` is a level above location — `00 Hego Almere`, `04-OUD/OLD`,
`Productie-OUD`. `Trip number` and `Trip status` tie a work order to the trip on
[Transport work orders](transport-workorders.md), so the two screens are two
views of one movement.

⚠️ **A fourth null sentinel.** `Transport date` is `1-1-1900` on **7 400 of
11 625** rows — Excel serial `1`. Add it to `1-1-0001`, `31-12-9999` and the
`999999` coil length. All four must render blank.

---

## What this means for our code

Ours creates the stock lot when the **purchase invoice** is posted. The
reference does not, and now we know exactly what it does instead:

```
purchase order
  → transport work order   (Pick-up: fetch it from the supplier)
  → warehouse work order   (Unloading: no source, into Ontvangst or a rack)
  → approve it             (fills Kg(a), and the goods exist)
  → purchase invoice       (values what is already there)
```

See [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) §1. This is no longer
blocked.

## 🔴 What is still open

1. **Does approving an `Unloading` also write the reception's `Kg(a)`**, or are
   the two independent? 53 of 151 receptions read `Workorders created`, which
   suggests the work order is raised *from* the reception.
2. **`New` → `Released` → `Approved`** — what moves a work order between them,
   and does the batch scheduler do it.
3. **`Section`** — a level above location we do not model at all.
