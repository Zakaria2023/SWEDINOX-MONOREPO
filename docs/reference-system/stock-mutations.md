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
