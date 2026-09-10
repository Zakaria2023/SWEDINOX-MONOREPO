# Blocked deliveries

`Overviews → Logistics → Blocked deliveries`. Ours: `/blocked-deliveries`.

**Order lines that are finished and deliberately not moving.** The richest
money screen in the whole Logistics group: it prints the gross price, both
discounts and the amount side by side on the same row, which is what makes it
possible to prove the pricing rule outright.

**Filter**: `Customer name` from / u/i, `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product ·
Show Company · Show Order | Purchase lines · Warehouse workorders ·
Orders and Quotes

---

## 🔑 `Amount` = `Kg(p)` × price in the price's own unit

Eighteen rows, four different tonne prices, and every one exact to the cent:

| Qty(p) | Kg(p) | Gross price | PriceU | Amount |
|---|---|---|---|---|
| 1 002 ST | 3 893,6 | € 2 550,00 | TN | **€ 9 928,68** |
| 570 ST | 2 953,2 | € 2 550,00 | TN | € 7 530,66 |
| 134 ST | 462,9 | € 2 550,00 | TN | € 1 180,40 |
| 315 ST | 1 335,3 | € 2 550,00 | TN | € 3 405,02 |
| 30 ST | 5 184 | € 3 300,00 | TN | € 17 107,20 |
| 1 ST | 980 | € 4 350,00 | TN | € 4 263,00 |
| 1 ST | 1 075 | € 3 050,00 | TN | € 3 278,75 |

`3 893,6 × 2 550 ÷ 1 000 = 9 928,68`.

Note the first row: **1 002 pieces**, and the amount is € 9 928,68. Priced by
the piece it would have been € 2 555 100 — out by a factor of a thousand.

### ⚠️ This was the same six-place bug, on the sales side

`quoteLineFinancials` computed `amount = netPrice × quantity`, and it drives
quote lines *and* the order lines raised from them. Identical in shape to the
purchase-order bug found earlier, and worse in reach, because it also fed
`costAmount` and `replacementCost` — so the profit and the margin were wrong
too, in a way that happened to look plausible.

Fixed by `priceMeasureFor` in `lib/helpers.ts`, which is now the single dispatch
for every price on a line. It covers all nine sales units, including the three
"per hundred" ones (`HK`, `HM`, `HS`) that a two-branch reading cannot express.

### And the amount is struck on the **planned** weight

Row 9 makes this unambiguous: `Kg(p)` 5 184, `Kg(a)` 3 024, and the amount is
`5 184 × 3,30 = € 17 107,20`. It bills what was ordered, not what has shipped so
far — which is consistent with the purchase side, where the *weighed* weight
only takes over once there is one.

---

## ✅ `Qty(call-off)` = `Qty(p)` − `Qty(a)`, and the same for kilos

| Kg(p) | Kg(a) | Kg(call-off) |
|---|---|---|
| 5 184 | 3 024 | **2 160** |
| 3 893,6 | 0 | 3 893,6 |
| 980 | 0 | 980 |

Built as `callOffRemaining` in `lib/helpers.ts`, floored at zero — an
over-delivery leaves nothing to call off rather than owing goods back.

---

## 🔑 `Call-off` is an order type, and `Wait for call` is the only block

Every row on the screen reads `Order type: Call-off` and
`Blocking reason: Wait for call`. Those two facts are the same fact: the
customer has bought the goods and will telephone to say when to send them.

- `wait_for_call` added to `warehouseBlockReasons`.
- We already carry `OrderItems.qtyCallOff` / `kgCallOff` and two screens that
  read them (`/orders-still-to-be-called`, `/order-lines-still-to-be-called`),
  so the *quantities* were modelled. What was missing is that a call-off order
  is **blocked by design**, not by exception.

⚠️ Ours blocks on three booleans — `commercialBlock`, `financialBlock`,
`transportBlock` — and a call-off line is none of those. It is held by the
customer, which is a fourth kind of hold with no field. See
[IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md).

---

## Statuses seen

`Line status`: `In progress` · `Partially delivered` · `Released` ·
`Partially invoiced`
`Delivery status`: `Ready` · `Released`

A line can be `Partially invoiced` while still blocked, which means billing runs
ahead of delivery on a call-off — the goods are the customer's already.

---

## Columns

`Customer` · `Order` · `Customer reference` · `Order type` · `Line` ·
`Line status` · `Type` · `Product` · `Qty(p)` · `Qty(a)` · `Qty(call-off)` ·
`QtyU` · `Kg(p)` · `Kg(a)` · `Kg(call-off)` · `Gross price` · `PriceU` ·
`Line discount` · `Group discount` · `Amount` · `Delivery date` ·
`Delivery status` · `Blocking reason` · `Reservation date` · `Qty(res)` ·
`Kg(res)` · `Purchase order` · `Qty(pur)` · `Kg(pur)`

The last three link a blocked sales line to the purchase order raised to cover
it. All zero across the sample — nothing here is bought to order.

---

## ✅ The discount basis — settled elsewhere

`Line discount` and `Group discount` are printed side by side on every row — and
read **0 %** on every single one. So this screen, the best-placed one in the
system to settle whether the two discounts cascade or add, did not.

✅ **Answered 10-9-2026 on purchase quote 900003.** The discounts **cascade**:
gross 1.000,00 with a 5 % line discount printed a `Net Price` of 950,00, and
with a 3 % group discount added it printed **921,50**. Additive would have
printed 920,00. `netPriceAfterDiscounts` already multiplied the two, so no code
changed — what changed is that it is now proved. See
[discount-basis.md](discount-basis.md).
