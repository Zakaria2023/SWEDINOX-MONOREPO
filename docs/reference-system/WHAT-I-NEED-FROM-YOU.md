# What I still need from the old system

Everything not yet obtained, in one place, as click steps. Nothing here needs
explaining first — open the screen, do the thing, send the picture.

**Ranked.** The first two are worth more than all the rest together.

---

# 🔴 The two that matter

## 1. When a lorry arrives, which screen do you open?

**No clicking. Just ask whoever receives deliveries.**

Why: we tried to receive goods against purchase order `401157` and could not.
`Kg(a)` would not take focus, `Batch registration` was greyed, and
`Warehouse workorders` did nothing. Meanwhile 53 of the 151 rows in your
receivals export read `Workorders created`.

Our system creates the stock when the **purchase invoice** arrives. If yours
books it in at **receipt**, ours does it too late and I have to rebuild that
chain.

**Send:** one sentence.

---

## 2. Two numbers in a quote — 30 seconds

1. Open purchase quote `900002`
2. On the line, set `Gross Price` = **1000**
3. Set `Line Discount` = **5**
4. Set `Group Discount` = **3**
5. Press Tab

📸 **The `Net Price` cell.**

| It shows | Meaning |
|---|---|
| **921,50** | discounts cascade — my code is right |
| **920,00** | discounts add up — I change one line |

Why: on a €50.000 order these are €75 apart, and it is the one money rule in
the code I cannot work out by reasoning.

---

> **The third one moved.** Whether the batch scheduler is meant to be off needs
> an administrator, who is not reachable yet, so it now sits with the other
> questions waiting on a person — see
> [MANAGER-QUESTIONS.md](MANAGER-QUESTIONS.md).

---

# 🟠 Worth doing when you have ten minutes

## 4. Is StockOp used at all?

1. `Overviews → Purchase → Purchase lines`
2. Select any row, press `Show Product`
3. Find the block that reads *"Use StockOp for this product?"*
4. Do it for four products: `PK304L20021`, `PK316L40021`, `SC304`, `CK3040010`

📸 That block on each.

**If all four are unticked**, the whole `StockOn advice` screen leaves scope and
I delete it — the way `Import purchase invoices` was deleted.

## 5. The Pricing panel on an old order

1. `Overviews → Purchase → Purchase lines`, find order **`400650`**
2. Press `Show Purchase order`
3. Expand the **`Pricing`** panel

📸 The whole panel.

Why: on `Previous orders`, 4 pieces weighing 94,2 kg are billed as 100 kg. I
know the invoice uses the **weighed** weight, but I want to see where that
weight is held.

## 6. One purchase line received in two goes

1. `Overviews → Purchase → Purchase lines`
2. Set `Creation date` from `1-1-2024`, press `Show Data`
3. Find a line whose `Qty(a)` is more than 0 but less than `Qty(p)`
4. Press `Show Purchase order`, expand `Receipts`

📸 The `Receipts` panel — I want to see two instalments on one line, with one
`Received` and one still `Released`.

---

# 🟡 Lists of values — only needed when we build that screen

Each is the same move: **drag the column's header into the grey bar above the
grid** ("Drag a column header here to group by that column"). That lists every
value it takes, with counts.

| # | Screen | Column to group by |
|---|---|---|
| 7 | Purchase invoices | `Status` — is a blocked invoice a status or a separate flag? |
| 8 | Orders and quotes | `Status` — do quote values and order values mix? |
| 9 | Purchase lines | `Line type` — only `Stk` and `CD` seen so far |

And these are dropdowns — **open them and screenshot the list**:

| # | Screen | Dropdown |
|---|---|---|
| 10 | Orders and quotes | `Order method` |
| 11 | Orders and quotes | `Classification code` |
| 12 | Product (`PK316L40021`) | the `Options` list — scroll to the bottom, and open one row's state |
| 13 | Product | `Price` — it reads `Algemeen` |
| 14 | Company → Creditor or Debtor | `Journal code` — `0` and `11` seen |
| 15 | StockOn advice | `Lead time method`, on a product's setup screen |
| 16 | Net prices | `Net priceU` — widen it across several rows |
| 17 | Purchase quote `900002` | `Expired because` |

---

# 🔵 Buttons nobody has ever pressed

On a **test** order, press each and screenshot what opens. If a button does
nothing, that is an answer too — say so.

| # | Screen | Button |
|---|---|---|
| 18 | Purchase order | `Return` and `Par. return` — do they raise a Purchase return order? |
| 19 | Purchase order | `Relocate` |
| 20 | Purchase order | `Workorder` |
| 21 | Purchase order | expand the `Workorders` panel |
| 22 | Purchase order | expand `Product Receipt Documents` |
| 23 | Stock on location | `Change APP…` and `Toon reserveringen…` |
| 24 | Product | `Correct products and stock` |
| 25 | Company | `Show Word File` |
| 26 | Purchase quote | `Prices…`, `Afhalen`, `Hego Prod - Lossen` |
| 27 | Purchase lines | the quick buttons `NG`, `F`, `DUPK320` — press each on a test line and read the option row it adds |

---

# 🟣 Only a person can answer these

No screen shows them. They need somebody who knows how the business runs.

| # | Question | Why it matters |
|---|---|---|
| 28 | Does the business raise purchase quotes at all? | One quote exists in three years and it is a test entry. If nobody raises them, the screen stays a stub for ever |
| 29 | What does `Expiration reason` decide? | If it only gets written down, it is a text box. If it triggers something, it is a real field |
| 30 | What does ticking `Consignatie` change? | Consignment stock is the supplier's until drawn, so it should not count as our stock value — but we could not test it |
| 31 | Are `Purchase request` and `Purchase return order` used? | Two document types in the `Nieuw` menu that no screen has shown |
| 32 | Are any companies `Processor` or `Transporter`? | Would change how work orders are assigned |
| 33 | What is `Gip`? | The product has `Gip → Artikelgroep`, stock has `Gipgroup`, and nothing explains it |

---

# 📤 Exports I would still like

`Show in Excel`, then tell me — I read it straight out of the running Excel.

| # | Screen | Filter |
|---|---|---|
| 34 | Purchase lines | `Creation date` from `1-1-2024`, `View` = `-empty-` |
| 35 | Purchase invoices | `Invoice date` from `1-1-2024` |
| 36 | Stock on location | `Product code` from blank, `View` = `-empty-` |

⚠️ Never leave a date filter's **from** box blank to widen a range — it voids
the filter and returns nothing. Put a real date in, like `1-1-2000`.

---

## How to send it

A screenshot per numbered item, and the number with it. Anything that turns out
to be impossible or does nothing is still an answer — say which number and what
happened, and I will strike it off.
