# Tier 1 — how to create the data that answers each question

The three Tier 1 questions in [STEPS.md](STEPS.md) cannot be answered by
looking, because the system has no example of the thing being asked about. This
file says exactly what to **create** instead.

> A fourth question — *are purchase quotes used at all?* — has been **retired**.
> The screen holds at most one row in three years and that row is a test entry,
> so it stays a read-only table and its remaining questions moved to
> [MANAGER-QUESTIONS.md](MANAGER-QUESTIONS.md).

Safe to do: the status bar reads `Vestiging: HEGO TEST Stainless Steel
Aluminium` — a test affiliate, not production.

Every action button seen anywhere in the reference is inventoried in
[ACTIONS.md](ACTIONS.md) — that is the list we build from.

Everything starts from the **`Nieuw`** (New) button, top left. Its menu offers:
Action · Company · Complaint · Contract · Contract group · Counter order ·
Invoice · Location · Machine · Order · Product · Product group ·
**Purchase invoice** · **Purchase order** · **Purchase quote** ·
**Purchase request** · **Purchase return order** · Quote · Return order ·
Visit report · Warehouse section · Warehouse subsection.

> Two of those are document types no captured screen has shown:
> **`Purchase request`** and **`Purchase return order`**. The company master's
> `Purchase returns` panel is the return order's overview. Neither is in scope
> yet — noted so they are not forgotten.

---

## 1. Consignment stock — **the big one**

The question: when consignment goods arrive, are they **excluded from stock
value**? Consignment stock is the supplier's until we draw it, so it should
carry € 0 value while still showing a quantity.

### ✅ 1a. Create the quote — **DONE**

Quote `900000`: supplier `11692`, one line of `PK304L20021`, 10 ST at
€1 930/TN, with **`Consignatie` ticked**.

**Correction learned here:** `Consignation` is a **header** checkbox spelled
`Consignatie`, sitting under `Overlength` — *not* a line field, as the
overview's `Consignation` column had suggested.

Three formulas confirmed on the way past: `Kg(p)` = **314** (10 × 31,4),
`Amount` = **€ 606,02** (1 930 × 0,314), `VAT` = **€ 127,26** (21 %).

### ✅ 1b. Turn it into an order — **DONE**

`Purchase order` converted it, after a dialog reading *"This converts the
entire purchase quote into a purchase order."* Result: order **`401154`**,
status **`Provisional`**, header printing **`Converted from quote 900000`**.

⚠️ **The order header has no `Consignatie` checkbox at all.** Either the
conversion drops it or it lives somewhere unlooked-at. Now
[manager question 3](MANAGER-QUESTIONS.md).

### 1c. Make the order final — **do this first**

The conversion **already created the reception for you**. Order `401154`'s
`Receipts` panel reads `1 reception`, status `New`, with `Kg(p)` = 314,
`Qty(p)` = 10 and `Kg(a)` / `Qty(a)` = 0.

But it is **read-only**, because the order is `Provisional`. `New`, `Split`,
`Batch registration` and `Charge aanpassen…` are all greyed, and `Kg(a)`
cannot be typed into.

10. On the order toolbar press **`Make final`** — the button that only exists on
    a provisional order

📸 **Screenshot 3a**: the header after it, so I can see what the status becomes
(`Released`? `In progress`?) and which toolbar buttons change.

11. *(optional, and it answers another question free)* press **`Confirm`**

📸 **Screenshot 3b**: the line grid afterwards. If `Qty confirmed` fills with
10, that settles what `Confirm` does and what `Received Qty` on
[Purchase receivals](purchase/purchase-receivals.md) really is.

### 1d. Now receive it

12. Back in `Receipts`, type `Kg(a)` = **`314`** and `Qty(a)` = **`10`** on the
    existing row
13. Save

📸 **Screenshot 3c**: the `Receipts` row with `Kg(p)`, `Qty(p)`, `Kg(a)`,
`Qty(a)` and `Status` visible.

→ *If `Kg(a)` still will not accept a value after `Make final`, screenshot the
toolbar and the panel and stop — do not go hunting. Tell me and I will re-plan.*

### 1e. Read the answer off the stock

14. `Overviews → Stock → Stock on location`
15. `Product code` **from** = `PK304L20021`, **u/i** = leave the
    `zzzzzzzzzzzzzzz` default
16. `Show Data`
17. Find the lot that just arrived — `Receipt date` is today

📸 **Screenshot 4**: that row with **`Stock (Kg)`, `Stock (€)` and
`Valuation price`** visible. Include a normal `PK304L20021` lot in the same shot
if there is one, so I can compare.

**What decides it:** if the consignment lot shows a quantity but
`Stock (€) = € 0,00` and `Valuation price = € 0,00` while ordinary lots show
value, consignment is excluded from stock value and our `Stock.ownerCompanyUuid`
is the right model. If it is valued like anything else, it is only a label.

### 1f. One bonus check, free

18. `Overviews → Purchase → Order advice`, set `View` to `-empty-`, find
    `PK304L20021`

📸 **Screenshot 5**: its `Consign.` column. That column is zero on all 5 535
rows of the export I have, so this would be the first time it is populated and
would confirm what feeds it.

---

## 2. The `Pricing` panel — **the Options half is already answered**

### ✅ 2a. The `Options` panel — **DONE**

Pressing `K320` on quote `900000` opened it, and it is **its own grid**, not
columns on the line:

| Seq. | Option | Qty | U | Gross price | **Per** | Discount | U | Amount | Reference factor | Net price | Specificatie |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 10 | `Grinding` | 10 | ST | € 0,00 | **`M2`** | 0,00 | % | € 0,00 | 1 | € 0,00 | `K320` |

**`Per` = `M2`.** The pricing basis is a **field on the option row**, so it is
per option rather than global — confirming structurally what the Purchase lines
arithmetic implied. `Amount` is €0,00 only because no `Gross price` is
maintained for this option with this supplier.

### 🔴 2b. What is still open

**Two things, and neither needs a new record.**

1. **Expand the `Pricing` panel** on order `400253` or `400650` — never opened
   on either. It is the one place that should explain why `Previous orders`
   bills 4 pieces weighing 94,2 kg as **100 kg**. Trade weight is ruled out
   (that would be 96,0 kg), so options or a minimum billed weight are the
   remaining candidates.

   📸 the `Pricing` panel in full.

2. *(optional, one number)* On the existing Grinding option row, type
   **`1,70`** into `Gross price` and Tab.

   📸 the Options row + the `Summary` block.

   | Amount | Meaning |
   |---|---|
   | **€ 34,00** | per m² **of the parent** — 10 × 2,0 × 1,0 = 20 m². Confirms the model outright. |
   | € 17,00 | 10 × 1,70 — it uses the piece count and `M2` is only a label |
   | € 0,53 | per tonne, and `Per` is ignored |

   The `Summary` block also shows whether option money lands in `Options` or
   in `Surcharges`.

---

## 3. Is StockOp switched off everywhere? — **no record needed**

1. `Overviews → Purchase → Purchase lines`, select any row, press `Show Product`
2. Find the **StockOp** block (it is the one reading *"Use StockOp for this
   product?"*)

📸 **Screenshot 10**: that block, on **four different products** — use
`PK304L20021`, `PK316L40021`, `SC304` and `CK3040010`. They are a plate, a
thicker plate, a kilo-stocked product and a coil, so if any product type uses
StockOp one of those four should.

**If all four are unticked and say the parameters were never calculated**, the
StockOn advice screen leaves scope and I delete it like Import purchase
invoices. Say so and I will.

**If one is ticked**, then instead:

3. Tick `Use StockOp for this product?` on `PK304L20021` and save
4. Look in the **`Batch Taken`** (Batch Tasks) menu for a StockOp or parameter
   calculation and run it
5. `Overviews → Purchase → StockOn advice`, press `Show Data`

📸 **Screenshot 11**: the StockOn advice row for that product, with
`Order Level`, `Techn. Stk. + To receive` and `% Difference` visible — that is
what lets me reconstruct the formula.

---

## Summary of what I need back

| # | Question | State | Left to do |
|---|---|---|---|
| 1 | Consignment stock value | **quote and order done** — `401154` is `Provisional` with its reception already created | `Make final` → fill `Kg(a)`/`Qty(a)` → read the lot's `Stock (€)`. **3 clicks, 3 screenshots** |
| 2 | Option / surcharge pricing | **Options answered** — `Per` = `M2`, a field per option row | expand the `Pricing` panel; optionally set one `Gross price`. **No records needed** |
| 3 | Is StockOp used? | untouched | 4 product screenshots. **No records needed** |

**Nothing else needs creating.** Question 1's document chain already exists —
what remains is three clicks on order `401154`. Questions 2 and 3 are pure
looking.

## What these recipes have already settled

Not open any more, and recorded in [ANSWERED.md](ANSWERED.md):

- `Consignation` is a **header** field spelled `Consignatie`, not a line field
- `Kg(p)`, `Amount` and `VAT` all confirmed live — the density formula, price ×
  weight in the price's own unit, and **21 %** for `VAT high`
- `Options` is its own table, and **`Per` names the pricing basis per option**
- Converting a quote yields a **`Provisional`** order that prints
  `Converted from quote 900000` and **creates its reception automatically**
- That reception is **read-only until `Make final`** — which is why the recipe
  now starts there
- `Bev. Nettoprijs` is a *confirm net price* action, and `Confirm` /
  `Make final` exist only on a provisional order
- `APP` is a **per-tonne price**, so Stock on location's `Change APP…` is a
  price action
