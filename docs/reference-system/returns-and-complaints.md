# Return lines, and the complaint behind them

**Item B7 of [WHAT-IS-LEFT.md](WHAT-IS-LEFT.md), captured 13-9-2026.**
`Overviews → Sales → Return lines`, `View` = `-empty-`. **64 columns, 88 rows**
— `exports/b7-return-lines.tsv`. Every row is `R`-prefixed: these are the lines
of the 43 return orders the header export found
([orders-and-quotes.md](orders-and-quotes.md) §1).

The grid is the order-line grid ([order-lines.md](order-lines.md)) plus **ten
return-only columns**. Everything proved there — the two price units, the
amount and profit formulas, the margin conventions — applies unchanged.

---

## 1. 🔴 A return is driven by a **complaint**, and the complaint has its own series

```
Complaint = K40000 … K40069
```

A **sixth number series**, alongside `O` orders, `R` returns, `B` counter
orders, `Q` quotes and `5xxxxx` invoices. It carries:

- **`Complaint`** — the `K4xxxx` number, blank on 5 of 88 lines
- **`Complaint description`** — free text, and **almost all of it is Dutch**:
  *"316 7st MF2 vertonen krassen"* (show scratches), *"4 platen te weinig en 3
  retour vanwege slechte kwaliteit"*, *"CD is nooit de deur uitgegaan en klant
  wil hem niet meer hebben."* The staff write in Dutch; the labels are English.
- **`Complaint date`** — filled on 83 of 88

So a return is not raised on its own. Something goes wrong, a complaint is
logged, and the return order is the complaint's financial consequence. Nothing
in `apps/dashboard` models a complaint at all.

⚠️ Not every complaint is about goods. Three of the descriptions are **billing**
corrections — *"gefactureerd op verkeerde klant"* (invoiced to the wrong
customer), *"adjustments to put 101300+100644 in 1 invoice"*, *"Klant wil
facturatie op SPBCN"*. And one is explicitly a paper-only reversal: *"Order
100697 retourboeken (niet werkelijk terughalen) crediteren"* — **book the
return, do not actually collect the goods, credit it.** A return can move money
without moving metal.

---

## 2. 🔴 `Return reason` — five values

| Reason | Lines |
| --- | --- |
| Wrong material delivered | 33 |
| Damaged | 22 |
| Not delivered / not collected | 20 |
| Wrong quantity | 8 |
| Delivered too late | 5 |

A closed list, English, and every one of the 88 lines carries one. This is an
enum, and `returnOrderReasons` in `lib/enums.ts` should be checked against it.

---

## 3. 🔴 The return points back at what it reverses

| Column | Filled |
| --- | --- |
| `Original order` | 83 / 88 |
| `Original order line` | 83 / 88 |
| `Original bill of lading` | 68 / 88 |
| `Return delivery date` | 73 / 88 |
| `Return bill of lading` | **2 / 88** |

The link is at **line** level, not order level — `Original order` *and*
`Original order line`. Five lines have no original at all, which fits the
billing-correction cases in §1: there is nothing to send back.

`Original bill of lading` is recorded on 68 and `Return bill of lading` on
**two**. The goods' outward paperwork is kept; the inward paperwork almost never
is.

---

## 4. Two quantities with opposite signs

`Quantity (QtyU)` is **negative on all 88 rows**. `Return Qty` is **positive on
72 and zero on 16**. They are never equal, because they are the same number
signed two ways: the accounting quantity (negative, so it subtracts from
revenue) and the physical quantity coming back (positive).

The 16 zeros are returns where nothing physically returns — the paper-only
credits again.

`Line status`: `Invoiced` 76, `Checked` 8, `Received` 4 — the same three the
header export showed for `R` documents.

`Line type`: `Stk` 76, `CD` 12. `Order type` is `Normal` on all 88 — a return
never carries `Call-off` or `Rush`.

`Stock category` is `2nd choice` on 18 of 88 and blank on 70 — returned metal is
not automatically downgraded.

---

## What to build

Queued as items 14–15 of
[PLANNED-CODE-CHANGES-3.md](PLANNED-CODE-CHANGES-3.md):

- **A `Complaints` table** with its own number series, a date, a free-text
  description and a link to the return order it produced. Today nothing records
  *why* a return exists.
- **`returnOrderReasons`** checked against the five observed values.
- **`originalOrderItemUuid`** on the return line — the link is per line, and our
  `ReturnOrderItems` should carry it.
- A **paper-only** flag, or the recognition that `Return Qty = 0` means the
  credit happens without a stock movement. Getting this wrong would create
  phantom stock on every billing correction.
