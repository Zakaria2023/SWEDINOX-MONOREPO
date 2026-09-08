# Receipts

`Overviews → Logistics → Receipts`. Ours: `/receipts`.

**Goods that have arrived.** Sits directly above `Warehouse workorders` in the
menu, and the purchase order's own panel is called `Receipts` too — which turns
out to be the point.

**Filter**: `Date reported as completed` from / u/i.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product ·
Show Company · **Show Return** | Purchase lines · Warehouse workorders ·
Orders and Quotes

`Show Return` is a button no other screen has: a receipt can be sent back.

---

## 🔑 The receipt and the reception are one thing seen twice

This screen and [Purchase receivals](purchase/purchase-receivals.md) are the
same rows. The grain settles it: purchase order **400908 line 30** appears
**four separate times** with four different weights (1 516, 1 465, 484, 2 063
kg). A receipt is not rolled up per day, per line or per order — it is one
lorry's worth of one line, which is exactly what the 151-row receivals export
already showed.

And the weights tie back to the work orders. `290049/10` reads **353,3 kg**
here, and the warehouse work order export has `290049/10` as an approved
`Unloading` with `Kg(p)` 494,6 and `Kg(a)` 353,3 — a 141,3 kg short delivery.
**`Receipts.Kg` is the work order's `Kg(a)`.**

So [warehouse-workorders.md](warehouse-workorders.md) open question 1 is
answered: they are not independent. Approving the Unloading is what fills the
reception's actuals.

---

## ✅ The receipt status ladder

Six values, read off the reference's own `Receipt status` column across the
151-row export:

```
New → Released → Workorders created → Partially received → Received → Invoiced
```

| Status | Rows in the export | Does a work order exist? | Are the goods here? |
|---|---|---|---|
| `New` | 19 | no | **no** |
| `Released` | 33 | no | **no** |
| **`Workorders created`** | **53** | **yes** | **no** |
| `Partially received` | — *(seen only in the saved filter)* | yes | partly |
| `Received` | 53 | yes | yes |
| `Invoiced` | 3 | yes | yes |
| **`Expired`** | — *(2 in the 3 088-row export)* | — | **no, and never will be** |

**`Workorders created` is the state our build had no concept of**, and it is the
one that explains the whole gap. At that point the reception exists, the
Unloading work order has been raised, the paperwork is complete — and **nothing
is in stock**. Ours created the stock lot when the purchase invoice was posted,
three steps past this.

`Expired` is a **seventh** status, and only the 3 088-row export shows it — a
reception that lapsed without its goods ever arriving. It is terminal like
`invoiced` rather than a step beyond `received`, and both of its rows carry a
zero accrual.

Built as `receiptStatuses` in `lib/enums.ts`, with `RECEIPT_STATUS_META` and
`receiptStatusAfterUnloading` in `lib/helpers.ts`.

The screen's own saved filter is `Ontvangststatus In [Partially received]
[Received]` — it shows what has physically landed, and deliberately hides what
has only been promised.

---

## ✅ `Material still to be invoiced` = Kg × price

The rightmost column is money, not a quantity, and it is the received weight
priced at what the purchase line agreed:

| Supplier | Kg | Price | Printed |
|---|---|---|---|
| Acciai Vender | 1 861 | € 2 050/TN | **€ 3 815,05** |
| Acciai Vender | 1 389 | € 2 050/TN | € 2 847,45 |
| Acciai Vender | 484 | € 2 050/TN | € 992,20 |
| Acerinox Benelux | 3 630 | € 2 300/TN | € 8 349,00 |
| Aperam Stainless | 10 000 | € 1 000/TN | € 10 000,00 |
| Contisteel BVBA | 28 | € 500/TN | € 14,00 |
| Damstahl | 896 | € 3 150/TN | € 2 822,40 |
| Douma Staal | 706,5 | € 1 000/TN | € 706,50 |

Exact on all twelve captured rows. Several `Received` rows read **€ 0,00**
despite carrying a weight — those are the ones already invoiced, which is what
proves the column is *still to be invoiced* rather than *still to be received*.

**This is the accrual behind Finance's `Purchase invoices to be received`**:
goods on our shelves that nobody has billed us for yet.

⚠️ Ours had this column computing `planned − received` as a **quantity** and
calling it `materialStillToReceive`. Fixed — see `materialStillToInvoice` in
`lib/helpers.ts` and `receipts/actions.ts`.

---

## Views

| View | What it shows |
|---|---|
| `Ontvangsten per dag` | receipts per day — the one with data |
| `Ontvangsten staal` | steel receipts only; adds `Date reported as completed` and `Warehouse section` |

`Ontvangsten staal` came back **empty**, because it carries a saved filter of
its own: `Omzetgroepnummer < 2000 And Magazijnsectie ≠ Draad And Ordernr >
540000`. The last clause is the reason — no order in the data reaches 540000.

That filter is worth keeping: it names a **`Draad`** (wire) warehouse section and
a revenue-group cut at 2000, neither of which we model.

---

## Columns

`Date reported as completed` · `Company code` · `Company` · `Product` · `Qty` ·
`QtyU` · `Kg` · `Order no` · `Order line` · `Receipt status` ·
`Material still to be invoiced` · `Warehouse section`

## Order number series

A fifth series turns up here that we had not seen: **`29xxxx`** — `290048`,
`290049`, `290050`. They sit alongside the familiar `40xxxx` purchase orders and
behave identically. Almost certainly a second purchase-order series (a different
company or branch), but unconfirmed.

| Series | What |
|---|---|
| `1xxxxx` | sales order |
| `29xxxx` | **unknown — behaves as a purchase order** |
| `4xxxxx` | purchase order |
| `3xxxxx` | warehouse / production work order |
| `6xxxxx` | trip |
