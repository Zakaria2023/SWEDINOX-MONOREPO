# The run sheet — everything still needed from easy2trade, in one go

Written 18-9-2026, at your request: **every remaining capture, all of it, with
the clicks.** [WHAT-IS-LEFT.md](WHAT-IS-LEFT.md) stays the authority on *why*
each item matters. This file is the *doing* order.

**Started at 58 items. 44 actionable now** (18-9-2026): B16, B17 and I1–I5 are
done, and Sitting 1's seven are blocked until someone can reach the settings
tree.
Sittings are ordered so that each one is worth doing even if you never reach the
next. Numbers are the same numbers as WHAT-IS-LEFT.md — send the number with
whatever you send.

**Anything greyed out, crashing, or empty is a real answer.** Say the number and
what happened, and it comes off the list.

---

## The two rules that have cost us real mistakes

**1. `View` = `-empty-` before every export.** The export carries the *current
view's* columns. A column hidden in the view is **missing from the file**, not
blank in it. `Trip data` gave 7 columns on its view and 20 on `-empty-`, and the
13 missing ones were every cost column.

**2. Blank `Year`/`Month` means September 2026, not "all time".** It cost us a
published conclusion that had to be retracted. On any `Year`/`Month` screen type
**`Year` = `2025`, `Month` = `1`**. The database is dense January–May 2025 and
nearly empty after.

> ✅ **Why, proved 18-9-2026:** the box is labelled `from` and it behaves that
> way — it is a **lower bound, not an equals**. Asking B16 and B17 for `2025` /
> `1` returned January **onwards**, 2026 rows included. Blank defaults the bound
> to today, which is why a blank filter returns nothing.

And: never blank a `from` date box — that voids the filter and returns zero rows.
Type `1-1-2024`. Text filters already hold `zzzzzzzzzzzzzzz` as their
no-upper-bound sentinel; leave those alone.

**How to send an export:** `Show in Excel`, **leave the workbook open**, tell me
the number. I read it straight out of the running Excel. (`Save as Excel` is
blocked on this install.)

---

# Sitting 1 — The settings screens 🟡 deferred 18-9-2026

> ⚠️ **Looked for, not found — 18-9-2026.** The `Vestigingsgegevens` tree is
> nowhere in the application for this login. That is itself a finding: the
> security profiles **name** these screens (72 rights under
> `Vestigingsgegevens` alone), so they exist in the product and this login
> cannot reach them. Almost certainly a rights question, not a missing feature.
>
> **So K1 no longer has a screen route.** The remaining paths, in order of how
> easy they are:
>
> 1. **One SQL query**, by whoever has database access:
>    `SELECT Task_StoredProc, Parameter, Value FROM TASK_PARAMETER` — the schema
>    has no column for the threshold, so it is stored as data, and this is where
>    per-procedure numbers live.
> 2. **Ask INAD** (the vendor — confirmed in the error log) either for the number
>    or for a login that can open `Vestigingsgegevens`.
> 3. **Ask Swedinox's administrator** what they set it to.
>
> Everything below is kept for whoever gets that access. Resume here.

**The highest-value thing left on the whole list, and it needs no data.** One
number in shipped code is an assumption right now:

```ts
export const OVERDUE_POST_BLOCK_DAYS = 30;
```

The reference blocks 18 orders with `Post(s) outstanding for too long`. Every
blocked example is 496+ days overdue, so **any number from 1 to 496 reproduces
all of them.** We cannot tell 30 from 60 from 90 by looking at data. It is a
setting, and the security-profile tree proved the screen exists.

### S1 — Find `Vestigingsgegevens`

It is **not** in the menu bar (all seven menus are photographed). The rights tree
names it, so it exists. The likeliest home is the left navigation tree — that is
where `System info` turned out to be hiding too.

1. Scroll the **left tree to the very top**. 📸
2. Scroll it to the **very bottom**. 📸
3. Look for `Vestigingsgegevens`, `Instellingen`, `Applicatie Instellingen`,
   `Systeembeheer` or `Batchtaken`. Open whichever you find. 📸

### S2 — 🔴 `Instellingen Verkoop` → `Klant instellingen`

Open it and photograph **the whole screen, every field**. I am looking for a
number of days next to words like `dagen`, `vervallen`, `openstaand`,
`blokkeren`, `krediet`.

### S3 — 🔴 `Instellingen Verkoop` → `Order Instellingen`

Same — whole screen, every field. If K1's threshold is not on `Klant
instellingen`, it is here.

### S4 — `Instellingen Verkoop` → `Omzetverdeling per maand`

The monthly revenue split. 📸 — this is the distribution factor B17 divides a
year's budget by, and without it B17's numbers cannot be reproduced.

### S5 — `Instellingen Financiën`

Open `Journaalpost instellingen` and `Multivers instellingen`. 📸 both.

**Why:** nothing in `apps/dashboard` posts to a ledger. `Journaalpost
instellingen` says which account each posting hits. And `Multivers instellingen`
existing beside the AFAS batch jobs is the direct evidence for K12 — which ledger
the live system actually posts to.

### S6 — `Instellingen Logistiek` → `Voorraad` and `StockOp`

📸 both. `StockOp` settles J3 from the other end, and `Voorraad` is where
"does customer-owned stock carry value" (K2) would be configured if it is a
setting rather than a policy.

### S7 — `Batchtaken`

📸 the job list with its schedule columns, especially the three AFAS jobs and
whatever the `Laatst uitgevoerd` / last-run column says.

**Why:** the status bar has read `Batchscheduler is not active` on every single
screenshot for weeks. If the scheduler is off, open posts are frozen at the last
sync — meaning orders blocked for overdue debt may be blocked over invoices that
were paid in AFAS a year ago. That is K10, and it is currently blocking.

---

# Sitting 2 — The statistics screens 🟡 mostly done 18-9-2026

> ✅ **B16 and B17 captured 18-9-2026** → [sales-statistics.md](sales-statistics.md).
> **Both had data.** B16 had been argued to be dead on two indirect facts; it is
> not, and 826 rows say so. 🎉 **That makes the `Overviews` tree 116 of 116.**
>
> Two findings worth carrying forward:
>
> - **The `Year`/`Month` filter is a *from*, not an equals.** Asking for `2025`
>   / `1` returned January **onwards**, 2026 rows included. That is the whole
>   mechanism behind the blank-filter trap, now proved rather than inferred.
> - **B17's second view is no longer needed** — all five budget columns came
>   through, and all five are `0` on all 109 rows. No budget has ever been set.
>
> ⚠️ **S8 crashed** — see below. Two items remain in this sitting.

| # | Screen | Where | Set |
|---|---|---|---|
| **I6** | `Purchases and sales per revenue group` | 🔴 **`Overviews → Finance`**, 7th item — under `Revenue per revenue group (period)`, above `Credit information customers`. It is **not** in the Sales group | `Year` = `2025`, `Month` = `1` |
| **S8** | `Stock value check` | `Overviews → System info` | `2025` / `5`, and **not** on `-empty-` — see below |

**For each:** set `View` = `-empty-`, type the two numbers, `Show Data`,
📸 **the filter block and the grid in one shot**, then `Show in Excel` and leave
it open.

**On I6:** expect data. B17 returned €9 042 028,23 from that same window.

### ⚠️ S8 crashes on `-empty-` — use another view

> **Database error** — The column `GL_ACCOUNT_STOCK` was expected but did not
> occur in `GetReportData_StockValueCheck`.

**Third screen with this bug** (C1 wanted `DeliveryTerm`, B15 wanted
`Thickness`). The `-empty-` view asks for a column the stored procedure does not
return — a fault in the reference, not in the capture.

**So for S8 only: open the `View` dropdown and pick any other view**, run it, and
tell me which view it was. The 15 columns were already read off the crashed
screen; what is missing is rows.

---

# Sitting 3 — The empty screens 🟢 done 18-9-2026

> ✅ **All five run** with `1-1-2024` → `18-9-2026`, `View` = `-empty-`, filter
> captured → [stock-history.md](stock-history.md).
>
> **Two of the five had data**, which is the second time this exact mistake has
> been caught on this project:
>
> | # | Screen | |
> |---|---|---|
> | **I1** | Stock history | 🔴 **33 211 × 55** — fifteen monthly snapshots of every lot |
> | **I4** | Freight flow (SFN) | 🔴 **390 × 16** — a monthly tonnage balance; two formulas proved on every row |
> | **I2** | Production batches | ✅ genuinely empty — **leaves scope** |
> | **I3** | Freight movement | ✅ genuinely empty — **leaves scope** |
> | **I5** | Sawing layouts | ✅ genuinely empty — **leaves scope** |
>
> Three findings worth carrying:
>
> - **`GL_ACCOUNT_STOCK` is `3000 Stock`**, a constant on all 33 211 rows — so
>   S8's crash was hiding nothing. Stock posts to **one** account.
> - **The revenue-group master is 26, not 17.** B17 only showed the ones with
>   revenue.
> - ⚠️ **New doubt on K10:** snapshots exist for every month to **2026-06** on a
>   database said to be frozen at mid-May 2025. Something kept running. S7's
>   last-run column settles it.
>
> I7 is the only one of this group left.

| # | Screen | How |
|---|---|---|
| **I7** | Deviations in count lists | ⚠️ it has **two** date filters that `AND` together. Widen **one at a time** — `View` = `-empty-`, `1-1-2024` → today, 📸 the filter block. If empty both ways, say so and it closes |

---

# Sitting 4 — The records 🔴

A grid gives columns. **A record gives structure** — which fields sit together,
which are greyed, which panels exist, what the buttons are called. These are
screenshots only. Open it, **expand every panel and every tab**, photograph each.

### ~~G1 — One sales order, every tab and panel~~ ✅ 18-9-2026

Done, order `100742`, all twelve panels → [order-detail.md](order-detail.md)
Part 2. It was worth its billing: the panels below the lines are **scoped to the
selected line**, a warehouse work order names its **order line**, a bill of
lading **groups lines onto a trip**, and the `Pricing` panel shows five price
columns `OrderItems` does not have.

⚠️ **Two things it did not settle**, both worth a follow-up order:

- **the discount cascade is still numerically unproved** — every box on
  `Pricing` was `€ 0,00` because the price was typed, not built;
- **no option has ever been seen on a real order line** — this order has none,
  and `Options` was collapsed.

So: **one more order, chosen for a built-up price and at least one option.**
`Overviews → Sales → Order lines`, sort or filter on a non-zero `Line discount`,
open that order, expand `Pricing` and `Options` on that line.

### G2 — 🔴 One sales invoice, every panel

`Overviews → Sales → Invoices`, any row, `Show Invoice`. **Nothing in our app
posts to a ledger yet, and the invoice is where the posting is decided.**

### G3 — One delivery, every panel

The document that sits between an order line and a stock movement. We model the
movement and have never seen the document.

### G4 — One quote that became an order

Does the order keep the quote's number? Its prices? Its discounts? Find a `Q`
row whose status says it was converted, open both.

### G7 — One trip: bill of lading `300813`, trip number `600249`

Two numbers, two documents, one delivery, and the pair is unexplained.
**438 trips are captured and not one has ever been opened.**

### G8 — One production batch, every tab

### G9 — One remnant lot (a saw offcut) — and read its `Supplier`

Us, or the original mill? It decides whether a remnant traces back to the heat it
was cut from — which is the whole certificate chain.

### G10 — One `Bewerker` lot (any lot at an external-processor location)

**All 36 are blocked.** Which screen set that, and can it be lifted by hand?

### G11 — One order from the `29xxxx` series

Half answered already: it is a sales **return** order (`R290000`–`R290051`, 43 of
them), negative revenue and weight. Still worth opening **one** to see its lines.

### A6 — `Bestand → Nieuw → Purchase request`, and `→ Purchase return order`

The two document types no screen has ever shown. They **appear greyed** in the
menu screenshot — if they are, that is the answer and K7 closes. If they open,
photograph the empty form and close without saving.

---

# Sitting 5 — Eight small things on the purchase side

Each is a few clicks and each closes a real gap.

### J1 — Consignment stock, finish it

Order `401154` exists, `Provisional`, reception created. Three clicks:
press **`Make final`** → fill `Kg(a)` = `314` / `Qty(a)` = `10` on the reception
→ read that lot's **`Stock (€)`** on `Stock on location`.

**€0,00 means consignment is excluded from stock value.** That is the accounting
half of K9.

### J2 — The `Pricing` panel on purchase order `400650`

`Overviews → Purchase → Purchase lines`, find order `400650`, `Show Purchase
order`, expand `Pricing`. 📸 the whole panel.

**4 pieces weighing 94,2 kg are billed as 100 kg** and we cannot say where that
weight is held.

### J3 — Is StockOp used at all?

`Purchase lines` → any row → `Show Product` → find *"Use StockOp for this
product?"*. Check exactly these four: `PK304L20021`, `PK316L40021`, `SC304`,
`CK3040010`.

**All four unticked = the whole `StockOn advice` screen leaves scope and gets
deleted.**

### J4 — A purchase line received in two goes

`Purchase lines`, creation date from `1-1-2024`, find a line where `Qty(a)` is
above `0` but below `Qty(p)` → `Show Purchase order` → expand `Receipts`. 📸 —
two instalments on one line, one `Received`, one `Released`.

### J5 — The product `Options` list, to the bottom

Product `PK316L40021` → scroll `Options` to the end → open one row's state
dropdown. 📸

Six read `Possible`; `Knippen` appears on Purchase receivals and **not** in that
list, so the enum has at least seven members and we only have six.

### J6 — Value lists: drag the header into the grey bar

The bar reading *"Drag a column header here to group by that column"*. Drag the
column onto it and it lists every value with a count. 📸 Do it for three:

- `Purchase invoices` → `Status`
- `Orders and quotes` → `Status`
- `Purchase lines` → `Line type`

**This is the cheapest enum capture there is** — it gives the complete value list
and the row count per value in one drag.

### J7 — Dropdowns: open the list and photograph it

- `Orders and quotes` → `Order method`
- `Orders and quotes` → `Classification code`
- Product → `Price` (it reads `Algemeen`)
- Company → `Journal code` (`0` and `11` have been seen; what else?)
- `Net prices` → `Net priceU`

### J8 — Buttons nobody has ever pressed

**On a test record.** 📸 what each one opens — and **a button that does nothing
is an answer**, so say so.

- Purchase order → `Return`, `Par. return`, `Relocate`, `Workorder`
- Purchase order → the `Workorders` and `Product Receipt Documents` panels
- `Stock on location` → `Change APP…`
- Product → `Correct products and stock`
- Company → `Show Word File`

---

# Sitting 6 — How the work is actually done 🔴

**This is the two thirds that is unbuilt.** 126 screens exist in our app and
**42 of them write.** The rest only list. In the reference somebody *does* these
things, and we have never watched it happen once.

For each: **do it on a test record and photograph every single step** — the
button, the dialog that opens, what it asks, and what the screen looks like
afterwards. **A short screen recording is better than screenshots** if that is
easier for you.

### H1 — 🔴 Start here. A lorry arrives → the goods become stock

*The oldest open question in the project.* Which screen, which button, in what
order.

We create stock when the **purchase invoice** arrives. If the reference books it
in at **receipt**, ours does it at the wrong moment and the whole chain has to be
rebuilt. 53 of 151 receival rows read `Workorders created`, so something creates
them — we just don't know what, or when.

Everything in the warehouse hangs off this one.

| # | The flow | Why it is needed |
|---|---|---|
| **H2** | Create a reservation by hand | We can read reservations; we cannot make one |
| **H3** | Adjust a lot by hand — correct a weight or a quantity | `Correct products and stock` on the product screen |
| **H4** | Plan a trip — from deliveries waiting to a trip with a bill of lading | The whole transport side is read-only in ours |
| **H5** | Take an order from entry to delivery, one line, every button | The spine of the selling side |
| **H6** | Send an invoice — from an order delivered to an invoice sent | |
| **H7** | Take a payment against an invoice | |
| **H8** | Block, then unblock, one order | Three blocking rules are built and **no unblocking exists** |
| **H9** | Send material out for external processing, and take it back | Purchase reservations are this flow, inferred from 23 rows |
| **H10** | Report a saw cut — the two report dialogs, and the kilos balancing | Modelled from a screenshot; never watched |
| **H11** | Link a certificate to a batch | The certificate chain has no write path at all |
| **H12** | Raise a credit note / return | `Return order` and `Return lines` exist as menu items and nothing else |

---

# Sitting 7 — Only a person can answer these

No screen shows them. They need somebody who knows how Swedinox runs — most
likely INAD (the software vendor, now confirmed) or Swedinox's own administrator.
**These can be asked by email while the clicking happens.**

| # | The question |
|---|---|
| **K1** | 🔴 **How many days overdue is "too long"?** If S2/S3 do not show it, whoever has database access runs `SELECT Task_StoredProc, Parameter, Value FROM TASK_PARAMETER` |
| **K10** | 🔴 Is the batch scheduler meant to be switched off — **on the live system**, not this test copy? The test copy stops logging after 13-5-2025, so its scheduler being off is expected and tells us nothing |
| **K12** | 🔴 **Does the rebuild replace AFAS, or sync with it?** AFAS holds the ledger, receivables and payments. This decides how journal entries, payments and credit control get built — it is an architecture decision, not a detail |
| **K2** | Should customer-owned stock carry value? €40 833 does today in the reference. An accounting policy call |
| **K3** | **Are these six features wanted at all?** The reference ships them and never uses them: transport costing, `Resource`, `Pickvolgorde`, `Zelfbeoordeling`, FSP revaluation, sawing planning. **Six features we can decline to build, on purpose, in writing** |
| **K4** | What does `FSP` stand for, and `LIP`? FSP's behaviour is established; only the letters are unknown |
| **K5** | What is `Gip`? Believed to be average purchase price, not confirmed |
| **K6** | Does the business raise **purchase quotes** at all? One exists in three years and it is a test entry |
| **K7** | Are `Purchase request` and `Purchase return order` used? (A6 may answer this by itself) |
| **K9** | What does ticking `Consignatie` change **commercially**? J1 answers the accounting half |
| **K11** | Nearly closed: INAD is the vendor's support login, used by people. It lifted **63 of 571** order blocks. Left to ask: **on whose request?** |

---

# One decision that is ours, not the reference's

Not a capture — it is waiting on you, and it is the only thing currently blocking
code that is otherwise ready to write.

**The kilometre → transporter tariff → trip cost chain.** `/address-distances`
now stores and edits the number, and `TransporterCosts.fromKm`/`untilKm` band a
tariff by it. But **no table in the app holds a trip's cost.** Where a computed
cost lands is a modelling decision, so I left it rather than inventing one.

The same sitting could settle the **batch backfill**: a written, never-applied
script that would issue 544 internal charges and register 549 batches for lots
already on the shelf.

---

## Sending it back

One screenshot per numbered item, **with the number**. For an export: `Show in
Excel`, leave the workbook open, say the number.

You do not have to do these in order, and you do not have to finish a sitting.
**Send one item and it comes off the list.**
