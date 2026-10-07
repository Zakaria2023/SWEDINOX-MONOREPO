# Stock mutations

`Overviews → Logistics → Stock mutations`. Ours: `/stock-movements`.

**Every change to a stock lot, and what caused it.** One row per movement, with
the quantity in three units, the value it moved, and the reason.

**Filters**: `Product code` from / u/i, `Mutation date` from / u/i, `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product ·
Show Company *(greyed)* · Show · Export to CSV | Purchase lines ·
Warehouse workorders

---

## 🔑 Every movement names the work order that caused it

The `-empty-` view carries a **`Workorder#`** column, filled on the great
majority of rows. That is the causal link the whole stock model hangs on: a lot
does not change because somebody edited it, it changes because a work order was
reported completed.

Two number series appear in it, and they are the two we already know:

| Series | What it is |
|---|---|
| `3xxxxx` | a warehouse or production work order — `303358`, `305251`, `306153` |
| `6xxxxx` | a trip — `600390`, on a `Levering To customer` row |

So an outbound delivery is stamped with the **trip**, and an internal move with
the **work order**. Both are recorded in the same column.

⚠️ **We do not model this at all.** `StockMovements` has
`purchaseOrderUuid`, `purchaseInvoiceUuid`, `orderUuid` and `invoiceUuid` — four
document links, and not one of them is a work order. See
[IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) §1.

---

## Mutation reasons

The reference labels these bilingually, Dutch then English, in one string:

| Reason | What it is | Ours |
|---|---|---|
| `Productie Scrap production` | offcut and swarf booked back off a production run | `sawing_waste` / `production_remnant` |
| `Levering To customer` | goods delivered — always negative | `sale_consumption` |
| `Ontvangst From processor` | goods back from an outside processor | ✅ **added** as `external_processing_return` |
| `Overboeking Transfer` | a lot moved between locations | `warehouse_transfer` |
| `Conversion Conversion` | the opening balance a lot was migrated in with | ✅ **added** as `data_conversion` |
| `Bij gereedmelding` | booked on reporting a work order completed | `warehouse_receipt` / `production_output` |

Two of those we had no value for, and both matter:

- **`Ontvangst From processor`** is why Finance keeps a
  *"Control Stock increase due to external processing"* list — material leaves as
  our stock, somebody else works on it, and it comes back worth more. Nothing
  else in the system increases a lot's value without a purchase.
- **`Conversion`** is not trading activity. The reference's own data carries
  thousands of them stamped within the same three seconds on `31-12-2024
  09:47:4x`. Any report that sums movements to measure what the business did
  must exclude them.

### Signs

Outbound is negative and inbound positive, in every unit at once:

```
Levering To customer      -25 ST   -1 226,563 kg   € -1 659,99
Productie Scrap production  +9,017978 kg
Overboeking Transfer       -1 ST      -4,71 kg
```

€ 1 659,99 ÷ 1 226,563 kg = € 1,3533/kg = **€ 1 353,30 per tonne** — the same
`stockValueFromWeight` rule as everywhere else.

---

## Opening and closing balances are denormalised onto every row

`Start date`, `Starting stock (€)`, `Starting stock (qty)`, `End date`,
`Closing stock (€)` and `Closing stock (qty)` repeat **the same figures on every
row of a product**, and the two dates are simply the filter's own from / u/i.

So they are not per-movement values. They are the product's balance over the
window being looked at, carried on each row so the grid can be grouped by
product without a second query. `€ 14.993,86 / 30 095,599` recurs on a dozen
consecutive rows of one product.

---

## Columns — the `-empty-` set

**When and who** `Mutation date / time` · `Mutation operator` *(initials: `AVD`,
`RVS`, `IN`, `FS`)*

**What** `Product code` · `Description` · `Length (mm)` · `Width (mm)` ·
`Standard product` ☑ · `Stock product` ☑

**How much** `MutationQty (StkU)` · `StkU` · `MutationQty (Kg)` ·
`MutationQty (M1)` · `MutationQty (€)`

**Why** `Mutation reason` · `Workorder#` · `Order` · `Text` · `Purchase order` ·
`Receipt date` · `Supplier` · `Internal charge` · `Charge` · `Internal Bundle`

**Who for** `Company code` · `Company`

**Accounting** `General ledger` *(`3000` throughout)* · `Revenue group` — which
appears **twice**, once as a number (`1000`, `1100`, `1300`, `1500`) and once as
a name (`SS 304`, `SS 316`, `SS 430`, `Aluminium`)

**Balances** `Start date` · `Starting stock (€)` · `Starting stock (qty)` ·
`End date` · `Closing stock (€)` · `Closing stock (qty)`

`Order` carries a prefix that says which kind it is: `O101154` for a sales
order, `IO400645/70` for an internal one against a purchase order line.

---

## What is still open

1. **`Internal charge` vs `Charge`** — two separate columns, both filled on
   conversion rows (`IO100019` / `07HGGF`, and `Y191024C05-2` or `SD42012` in
   the second). The second looks like a supplier's own heat number.
2. **`MutationQty (M1)`** — filled on one row in the sample (`389493`), which is
   an implausible running-metre figure and may be a mis-scaled column.

---

# The 13 562-movement export

**9-9-2026.** `View` = `-empty-`, dates from `1-1-2024`, `Show in Excel` →
`exports/stock-mutations.tsv`, **13 562 rows × 36 columns**. This is the ledger
behind [stock-on-location.md](stock-on-location.md)'s snapshot.

## 🔴 Every movement names the work order that caused it — or it is a correction

`Workorder#` is a column, and how it is filled is the whole model:

| Mutation reason | Rows | Names a work order |
|---|---|---|
| `Levering To customer` | 5 163 | 5 043 |
| `Ontvangst From supplier` | 2 654 | **2 654** |
| `Productie Origin of production` | 1 200 | **1 200** |
| `Productie Consumed` | 513 | **513** |
| `Ontvangst From processor` | 316 | **316** |
| `Productie Scrap production` | 264 | **264** |
| `Productie Rest production` | 191 | **191** |
| `Levering To processor` | 167 | **167** |
| `Ontvangst Return customer` | 60 | **60** |
| `Ontvangst Van klant` | 56 | **56** |
| `Conversion Conversion` | 2 316 | **0** |
| `Correctie Stock correction` | 313 | **0** |
| `Correctie Transfer length` | 241 | **0** |
| `Correctie Stock difference` | 87 | **0** |
| `Overboeking Transfer` | 8 | **0** |
| `Schroot Scrap` | 8 | **0** |
| `Correctie` × 3 others | 5 | **0** |

> **Metal moves because a work order moved it, or because a human corrected the
> books.** 10 464 movements carry one; the 2 978 corrections, conversions,
> transfers and scrappings carry **none at all** — that half is exact.

⚠️ The other half is a strong tendency rather than a law: **120 customer
deliveries carry no causing document** either. So "no work order" does not prove
"correction", though "correction" does prove "no work order".

⚠️ Our `StockMovements` has four document links — `purchaseOrderUuid`,
`purchaseInvoiceUuid`, `orderUuid`, `invoiceUuid` — and **not one of them is a
work order or a trip.** So we cannot record the cause of any of those 10 483.

## 🔴 A delivery to a customer is caused by a **trip**, not a work order

Splitting `Workorder#` by its number series shows the column holds two different
documents:

| Series | Reason | Rows |
|---|---|---|
| **`6xxxxx` — a trip** | `Levering To customer` | **4 189** |
| `3xxxxx` — a work order | `Ontvangst From supplier` | 2 652 |
| `3xxxxx` | `Productie Origin of production` | 1 200 |
| `3xxxxx` | `Levering To customer` | 854 |
| `3xxxxx` | `Productie Consumed` | 513 |
| `3xxxxx` | everything else | 1 054 |

So goods leave on a **trip** (`6xxxxx`) 4 189 times and on a warehouse work
order (`3xxxxx`) 854 times — a customer collecting, most likely, against the
`Afhaal` / pick-up path. Goods *arrive* only ever on a `3xxxxx`.

That makes the causing document polymorphic: a movement points at a warehouse or
production work order **or** at a trip. Two nullable links, not one.

## Conservation holds: 733 of 735 products balance

`Starting stock` and `Closing stock` are **not** running balances — they are the
product's position at the two ends of the *filter period* (`Start date 1-1-2024`,
`End date 9-9-2026`), repeated identically on every row of that product. Only 2
of 735 products show them varying.

Which makes the real law testable:

> **Σ `MutationQty (Kg)` per product = `Closing stock (Kg)` − `Starting stock
> (Kg)`** — **733 / 735 products**.

The two that miss are `PK316L20021` (57 movements, sum 6 656,8 against a
3 108,6 swing) and `20101025125` (4 movements, off by nothing — it balances on
kilos but its Starting/Closing vary). Worth one look, but 99,7 % of a
13 562-row ledger closing to the kilo is the strongest conservation evidence in
any export so far.

## The reason code is two words: a category and a reason

Nineteen reasons across **seven** categories:

| Category | Reasons |
|---|---|
| `Ontvangst` *(receipt)* | `From supplier` · `From processor` · `Return customer` · `Van klant` |
| `Levering` *(delivery)* | `To customer` · `To processor` |
| `Productie` | `Origin of production` · `Consumed` · `Scrap production` · `Rest production` |
| `Correctie` | `Stock correction` · `Transfer length` · `Stock difference` · `Inventory rejection` · `Rejected material` · `Internal damage` |
| `Conversion` | `Conversion` |
| `Overboeking` *(transfer)* | `Transfer` |
| `Schroot` *(scrap)* | `Scrap` |

`Ontvangst Van klant` is **untranslated in the reference itself** — the English
build still prints the Dutch. It is the customer-materials receipt, distinct from
`Return customer`.

`Conversion Conversion` at 2 316 rows is the data migration that created the
opening position, which is why our own `data_conversion` reason exists.

## Two things are always worth nothing

| | Rows | `MutationQty (€) = 0` |
|---|---|---|
| `Productie Scrap production` | 264 | **264 / 264** |
| `Ontvangst Van klant` | 56 | **56 / 56** |

**Scrap carries no value, and customer material carries no value.** Both are
absolute across the export — and the second confirms from the ledger side what
[receipt-chain.md](receipt-chain.md) found on the order: customer metal is
anonymous and unvalued, because it was never ours.

## Direction is fixed by the reason

| Reason | `MutationQty (Kg) < 0` |
|---|---|
| every `Ontvangst *` | **0 of 3 086** — a receipt is never negative |
| `Productie Consumed` | **513 of 513** — always out |
| `Levering To customer` | 4 923 of 5 163 |
| `Levering To processor` | 134 of 167 |
| `Correctie Transfer length` | 228 of 241 |

So the reason decides the sign, rather than the sign being free — which is what
`stockMovementReasons` should be enforcing.

## Order prefixes discriminate — on this screen

| Prefix | Series | Rows | |
|---|---|---|---|
| `O` | `10xxxx` | 7 296 | sales order |
| `IO` | `40xxxx` | 3 193 | purchase order |
| **`R`** | **`29xxxx`** | **60** | **return** |

`R290050`, `R290049`, `R290048` — **a third independent confirmation that
`29xxxx` is the return series**, and the 60 rows match `Ontvangst Return
customer` exactly.

⚠️ But the convention is **not** system-wide: `Stock on location`'s
`Purchase order` column prefixes *everything* `IO`, including sales numbers
(`IO100032`). So `O`/`IO`/`R` discriminates within this screen's `Order` column
and nowhere else. Do not build a type off the prefix.

## Smaller notes

- **`Mutation operator`** is initials: `FS` 3 896 · `RVS` 2 926 · `AVD` 2 913 ·
  `IN` 2 582 · `AA` 1 092 · `HD` 109 · `CVR` 23 · `SP` 14 · `VG` 7. `AVD` is
  André van der Veen, who also appeared as `Pre-reported by` on a reception.
  `IN` at 2 582 is likely the import/system account rather than a person.
- **`Text`** holds the bare order number on only **653 of 10 549** rows, so it is
  a free remark that sometimes repeats the order — not a derived field.
- The movement carries the **lot's whole identity** alongside its own figures:
  `Charge`, `Internal charge`, `Internal Bundle`, `Purchase order`, `Receipt
  date`, `Supplier`. So a movement is readable without joining back to the lot.
- `General ledger account# Stock` = `3000` on every row — the same account the
  lot carries.
- `MutationQty` comes in **four units at once**: `StkU`, `Kg`, `€` and `M1`.


---

## ✅ G9 answered from this export, 7-10-2026 — an offcut keeps its parent's identity

The 191 `Productie Rest production` rows are the offcuts. Read across:

| | Rows |
|---|---|
| carry an `Internal charge` | 184 of 191 |
| …and that internal charge also appears on the parent's other rows (a `Conversion`, an `Origin of production`, a `Levering To customer`) | **184 of 184** |
| carry the parent's `Purchase order` (`IO100020`, `IO100049`, …) | 184 of 191 |
| carry a `Charge` (heat number) | 105 of 191 |
| `Supplier` blank | 7 of 191 |

Four traced examples — offcut against a sibling row with the same internal
charge:

| Internal charge | Offcut | Sibling | Supplier on both | PO on both |
|---|---|---|---|---|
| `12BBFJ` | PC304L250 1000 × 310 | `Conversion` PK304L25021 2000 × 1000 | Outokumpu Stainles Oy | `IO100020` |
| `18AJAI` | PC304200 1000 × 360 | `Origin of production` 1000 × 60 | Trinox Metal Sanayi | `IO100049` |
| `18BAIB` | PCSA10500010 1000 × 869 | `Levering To customer` 130 × 50 | Henan Foshan Aluminium | `IO100041` |
| `19DIGE` | PC316L100 1500 × 1219 | `Levering To customer` 178 × 45 | Dacapo Stainless, charge `ZC820` | `IO100028` |

🔑🔑 **The offcut's `Supplier` is the original mill, not us.** It inherits
the parent lot's internal charge, charge, purchase order and supplier, so a
remnant traces back to the heat it was cut from — certificate and all. The
seven blanks are offcuts of lots that had no supplier to begin with.

⚠️ **121 of the 191 offcuts carry `MutationQty (€) = 0`** — the piece enters
stock with kilos but no value on the mutation (46 200 kg in all, € 83.684
across the 70 that do carry one). So the cost of a cut is not reliably split
between the output and the offcut; often the whole cost stays with what was
cut out. Worth checking against H10 when a cut is watched.

⚠️ No offcut's work order also shows a `Productie Consumed` row in this
export, so the parent is linked by internal charge, not by work order.
