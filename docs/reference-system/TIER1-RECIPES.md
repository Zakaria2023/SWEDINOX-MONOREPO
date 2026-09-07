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

The `Consignation` tick lives on a **quote line** — that is the one place it has
actually been seen — so start there and convert.

### 1a. Create the quote

1. `Nieuw → Purchase quote`
2. `Supplier`: `11692` (Holland Stainless Int) — any supplier is fine
3. `Purchase order type`: **`Materials`**
4. `Purchaser`: yourself
5. In the `Lines` panel press **`New`** and fill:
   - `Product`: **`PK304L20021`** (2000 × 1000 × 2 mm, 304L — a product I have
     already proved the weight maths on)
   - `Qty(p)`: **`10`** `ST`
   - `Net Price`: **`1930`** per `TN`
6. **Tick `Consignation` on the line.** If you cannot find it on the line grid,
   scroll the line columns right, or set `View` to `-empty-`.
   → *If there is no `Consignation` tick on the quote line at all, screenshot
   the line grid and the header and stop here — tell me, and I will re-plan.*
7. Save

📸 **Screenshot 1**: the whole quote with the line visible, `Consignation`
ticked.

### 1b. Turn it into an order

8. With the quote open, press **`Purchase order`** in the toolbar (it is greyed
   only on expired quotes; a fresh one should allow it)
9. Note the order number it creates

📸 **Screenshot 2**: the new purchase order's header **and** its line, so I can
see whether `Consignation` survived the conversion.

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

## 2. Purchase order Pricing and Options — **no record needed, then one edit**

I have proved that processing options are **priced per m² or per tonne** from
Purchase lines. What is unconfirmed is how that money reaches the order header,
and why `Previous orders` bills 4 pieces weighing 94,2 kg as 100 kg.

### 2a. Just look (no changes)

1. `Overviews → Purchase → Purchase lines`, find order **`400253`**, press
   `Show Purchase order`
2. Expand the **`Pricing`** panel — never opened

📸 **Screenshot 6**: the `Pricing` panel in full.

3. Expand the **`Options`** panel — never opened

📸 **Screenshot 7**: the `Options` panel in full.

### 2b. Then add one option, on a fresh line

Do this on a **new** order so nothing real changes:

4. `Nieuw → Purchase order`, supplier `11692`, type `Materials`
5. Add a line: `PK304L20021`, `Qty(p)` **`10`** `ST`, `Net Price` **`1930`** /
   `TN`
6. Note the `Summary` figures on the right — `Materials`, `Options`,
   `Surcharges`, `Tot. excl. VAT`
7. Select the line and press **`Options…`** in the toolbar (or one of the quick
   buttons `K320` / `BF F L K` under the line grid) and add **`Slijpen (K320)`**
   — grinding
8. Save

📸 **Screenshot 8**: the line grid now showing **both** rows (the material line
and the option line), with `Qty(p)`, `Kg(p)`, `Net Price` and `Amount` visible.

📸 **Screenshot 9**: the `Summary` block, so I can see whether the option money
lands in `Options` or in `Surcharges`.

**What decides it:** the grinding line should come out at €1,70 per m² of the
parent — `2,0 × 1,0 × 10 = 20 m² → € 34,00`. If it does, the model is confirmed
and I can build option pricing. If it comes out per tonne instead
(`0,314 t × 1,70`), the basis is per-option and I need the full list.

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

| # | Question | Records to create | Screenshots |
|---|---|---|---|
| 1 | Consignment stock value | 1 quote → 1 order → 1 receipt | 5 |
| 2 | Option / surcharge pricing | 1 order with an option line | 4 |
| 3 | Is StockOp used? | **none** (unless one is ticked) | 1–2 |

Question 3 needs nothing created. Question 1 is the only one needing a full
document chain, and it is the one that changes the database.
