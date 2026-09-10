# The receipt chain, traced end to end

Captured **9-9-2026** by walking single orders through five screens rather than
reading any one screen's columns. It answers the question that had been open
since the purchase group was built: **when does a stock lot come into
existence?**

> **The lot exists before the invoice.** Purchase order `400130` is
> `Receipt status: Received`, still owes **€ 0,11**, and already has a lot of
> **1 ST / 11 kg** at location `Fox`. Nothing has been invoiced, and the
> material is on the shelf.

That closes follow-up 3 of [LOGISTICS-BUILT.md](LOGISTICS-BUILT.md), and it
closes it in our favour: `warehouse-work-orders/actions.ts` already creates the
lot when an `Unloading` work order is approved. The reference agrees. What is
_wrong_ is that `purchase-invoices/actions.ts` creates one **as well** — see
[PLANNED-CODE-CHANGES.md](PLANNED-CODE-CHANGES.md).

---

## The chain, as the reference draws it

```
purchase order line  ──▶  reception            ──▶  warehouse work order  ──▶  stock lot
     400130/20             Kg(p) 11, Kg(a) 11        307873/2  Unloading         2009100
                           charge YU102842           From ‹empty›  To Fox        Fox · Pick
                           interne charge 25AAWO     status Approved            11 kg · S235
```

Four documents, one parcel of metal. Each step keeps the identity of the last.

### The purchase order carries its work orders on its own screen

`Purchase order 401259` has a **`Workorders → Warehouse workorders`** panel
listing work order `307873`, lines 1 and 2, `Type: Unloading`,
`Status: Approved`. The header toolbar has a **`Workorder`** button, so the work
order is raised _from_ the order.

The work order line holds `Qty(p)/Kg(p)` against `Qty(a)/Kg(a)` plus
`Qty Changed` and `Kg Changed` checkboxes — so a deviation is recorded as a flag
and a reason (`Deviation reason`), not inferred by comparing the two numbers.

**A warehouse work order has a `From` and a `To`.** On an `Unloading` the `From`
is empty — goods-in has no origin inside the warehouse — and the `To` is the
location the metal lands on. Both were `Fox`.

### `Ontvangst` is a real location

Work order `306693` (`Type: Fetching`) runs `From: Ontvangst` `To: Decoiler`.
So goods-in is not a virtual state; it is a named location material is moved
_off_. Two work orders in sequence:

|                       | Type        | From        | To                             |
| --------------------- | ----------- | ----------- | ------------------------------ |
| goods arrive          | `Unloading` | ‹empty›     | `Ontvangst` or a pick location |
| goods go to be worked | `Fetching`  | `Ontvangst` | `Decoiler`, `Laser 1`, …       |

That same work order hangs off **order `102189` — a `1xxxxx` sales order**, not a
purchase order, and its `Company` is `Hego Production, ALMERE` (an internal
affiliate). So a warehouse work order's parent document can be either series.

---

## The lot's identity is a triple, not a pair

`Charge aanpassen…` on the reception exposes three fields, and the dialog for
changing them shows all three current values:

| Field            | Example                      | What it is                           |
| ---------------- | ---------------------------- | ------------------------------------ |
| `Charge`         | `YU102842`                   | the **supplier's** melt/heat number  |
| `Plaatnummer`    | ‹blank›                      | plate / sheet number within the heat |
| `Interne charge` | `25AAWO`, `25AELU`, `25ACKT` | **our own** code                     |

The new internal charge is chosen with a **`Selecteer`** button, not typed — so
internal charges come from a registry, and the format is the year plus a
four-character sequence (`25` + `AAWO`).

⚠️ `Charge` is dirty free text. Across 2 247 lots: 607 blank, **`nvt`** 145
(Dutch _n/a_), **`-`** 33, **`ntv`** 32 (a transposition of `nvt`). Any importer
has to fold all four into NULL.

## A reception can be held hostage by its certificate

`Batch registration` opens **`Partijregistratie instellingen`**, which shows the
reception (`Order 400348/10`, `Afmetingen / gewicht 4000 / 3,9 KG(w)`,
`Ontvangst datum 11-2-2025`, `Interne charge 25AAWO`, `Charge YU102842`) and
offers exactly one setting:

> ☐ **`Document verplichtigingen negeren op bovenstaande ontvangst.`**
> _If this is set it will no longer be mandatory to link a document to this
> receipt. As a result the line may disappear from view._

So: **goods-in requires a document — a mill certificate — to be linked**, the
obligation is enforced per reception, and there is a per-reception waiver. That
is the mechanism behind the `documents` block reason, and it explains why a
receipt line stays in somebody's to-do list after the metal has physically
arrived.

We model none of it. `PurchaseLineReceivals` has no `charge`, no
`internalCharge`, no plate number and no document obligation.

---

## Number series

| Series   | Document                          |
| -------- | --------------------------------- |
| `1xxxxx` | sales order                       |
| `29xxxx` | **return** — see below            |
| `3xxxxx` | warehouse / production work order |
| `4xxxxx` | purchase order                    |
| `6xxxxx` | trip                              |
| `300xxx` | bill of lading                    |

### RETRACTED: there is no `2xxxxxx` lot series

I recorded `2009100` here as _"a lot has its own number — a `2xxxxxx` series,
an eighth one"_. **That was wrong.** `2009100` is a **product code**:

- it is in `exports/stock-on-location-Sheet1.tsv` under **`Product code`**, at
  location `Fox`, `1273 x 1100`, `11.2024 kg` — the very same lot
- it appears three times in `exports/stock-mutations.tsv`, again as a product
  code
- it is in `exports/pick-statistic.tsv`'s `Product code` column beside
  `201003315` and `20100425125`, part of a numeric aluminium range **28 of whose
  codes carry no description at all** — which is what made a bare number look
  like an internal id

The `Code` column on a purchase order's `Stock` panel is the **product** code.

> **A lot has no number of its own.** Its identity is the tuple — product +
> location + **`Internal charge`** (`25AAWO`, `21GFFI`, `23EHGI`) +
> **`Internal Bundle`** (`366558`, `389755`) — plus the supplier's `Charge`
> where there is one. Those two internal codes _are_ the lot identity.

### And the density rule, to four decimals

The same row is the most precise confirmation of the weight rule in these notes.
`1 273 x 1 100 x 1 mm` at **8 000 kg/m3**:

```
1,273 x 1,1 x 0,001 = 0,0014003 m3   ->   x 8 000 = 11,2024 kg
```

The export reads **`11.2024`**. The same digits, not rounded. The screen prints
`11` because that product's `decimal places` is 0.

### `29xxxx` is `Return` — the series is no longer a mystery

Every `29xxxx` row in the Receipts grid reads **`Order type: Return`**: 290144,
290099, 290208, 290009, 290125, 290035, 290210. They behaved like purchase
orders because a return _is_ goods-in — a customer's metal coming back through
the receipts door. All of them carry `Qty 0 / Kg 0` and
`Receipt status: Expired`: a return that was announced and never came back.

That was open since the purchase group. Closed.

---

## `Customer Materials` is a purchase order that owns nothing

`Purchase order 401259` has `Purchase order type: Customer Materials`, every
price € 0,00, and a `Total weight` of 28 Kg. Its product is `PCDIVS001` — a
catch-all article (`Length 0`, `Width 0,0`, `Fixed dimensions` unticked,
search code `PCDIV`) whose whole description is _"Snijwerk 1mm"_.

**Its lot carries no origin document, no supplier, no charge and no internal
charge**, and its `Receipt date` reads `1-1-0001`. Customer metal is anonymous:
it comes in, it gets worked, it goes out, and the system does not pretend to own
it. Two products' `Stock` panels were empty for exactly this reason before a
third one landed.

`purchaseOrderTypes` already carries `customer_materials`, so nothing changes —
but the _lot_ needs to tolerate having no origin at all.

⚠️ **`1-1-0001` is this system's null-date sentinel.** It also appears as
`EDI Leverdatum 1-1-0001`. Read as a date it is the year 1; it means _unset_.

---

## The density rule, confirmed to the gram — three times

`PCDIVS001` (the product screen) holds two different weight fields, and telling
them apart is the whole game:

| Block      | Field           | Value                 | What it is                |
| ---------- | --------------- | --------------------- | ------------------------- |
| `Features` | `Weight`        | **`8.000,000 KG/M3`** | a **density**             |
| `Weights`  | `Theoretically` | `0,000`               | per-piece, **empty here** |

With no per-piece figure, `Kg(p)` must be derived — and it is, exactly:

| Line | Size               | 8 000 kg/m³ × volume | Screen |
| ---- | ------------------ | -------------------- | ------ |
| 10   | 2000 × 1000 × 1 mm | **16,00**            | `16`   |
| 20   | 2000 × 740 × 1 mm  | **11,84**            | `12`   |

Order header `Total weight: 28 Kg` = 16 + 12, so the header sums the **rounded**
line weights. The rounding is the product's own
`Number of decimal places weight = 0`, which our schema already has as
`Products.decimalPlaces`.

Two more, from other screens:

- `400130/20`, `1273 × 1100 × 1 mm` at 8 000 → **11,2** → lot reads `11 kg`
- `PK30430021`, `2000 × 1000 × 3 mm` at 7 850 → **47,1** → lot reads `47.1 kg`

**This is precisely the chain `productPieceWeightKg` implements** — prefer the
stored per-piece weight, fall back to density × volume — and it had never had a
clean confirmation before. See
[stock-on-location.md](stock-on-location.md#the-2-247-lot-export) for the same
rule checked across 1 929 lots at once.

### And it settles the `weight_unit` question for good

`Theor. Wt. U.` is **`M3` on 2 238 of 2 247 lots**. So on the reference that
column really does say _density_ almost everywhere.

🚫 It still must not be backfilled to `M3` on our data. Our
`Products.theoretical_weight` holds a **per-piece weight** on 3 570 rows and has
**zero** rows in the 6 000–9 000 band. The reference keeps a density in that
column and we keep a weight; the unit beside it is the only thing that says
which. What this export does reveal is that our _import_ filled the wrong field
— the density belongs in `theoretical_weight` + `weight_unit = M3`, and the
per-piece figure in `weight_theoretical`. That is an import defect to record,
not to silently correct.

---

## What is still not answered

- **The reception → work order join was never shown directly.** Pressing
  `Warehouse workorders` from the Receipts grid opens the work order screen on
  its _own_ default filter (`Workorder date` today → today), so it ignored the
  selected row. The chain above is assembled from both ends plus matching
  weights, not from the reference performing the join.
- **`Sheet number` / `Plaatnummer` was blank everywhere it appeared**, so its
  format is unknown.
- **`Internal Bundle` (`389755`) vs `Bundle` vs `Internal batch`** — three
  bundle-ish fields across the work order and the lot, and no row yet has more
  than one of them filled.
