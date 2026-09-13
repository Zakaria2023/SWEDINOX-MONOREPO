# What is left in the old system

**This is the one list.** Everything still to be taken out of easy2trade, with
the exact clicks for each item. No time estimates anywhere — the order is by
what a wrong answer costs, not by how long it takes.

Every item has a **number**. When you send something, send the number with it.
"Item B4, here it is" is enough. If an item turns out to be impossible, greyed
out, or returns nothing — **that is still an answer.** Say which number and what
happened, and it comes off the list.

> Where this sits: [COVERAGE.md](COVERAGE.md) says how much is built.
> **This file says what is still unknown.** When this list is empty, there is
> nothing left to discover — only code to write.

---

## The score

The `Overviews` tree has **112 screens** across nine groups.

| | Screens | State |
|---|---|---|
| Purchase | 11 | ✅ all captured |
| Logistics | 32 | ✅ all captured |
| Finance | 14 | ✅ all captured |
| Suppliers | 5 | ✅ all captured |
| **Sales** | 19 | 🟡 **15 captured, 4 left** |
| **Customers** | 15 | 🟡 **2 captured, 13 left** |
| **Companies** | 6 | 🔴 **none captured** |
| **Batch registration** | 5 | 🔴 **none captured** |
| **Other** | 5 | 🔴 **none captured** |

**77 captured. 35 left.** Sales is nearly done; the 35 sit in four groups.

### ⚠️ "But I sent you the Sales sheets"

The 19 workbooks captured on 10-9-2026 were read in full — and **not one of them
was a Sales screen.** Checked against each file's own header row:

| Group | Files | Screens |
|---|---|---|
| Finance | **10** | Journal entries · Cost price for selling of invoices to be sent · Purchase invoices to be received · Purchase orders to be received · Credit information customers · Financially blocked quotes and orders · CD-deliveries in progress · Control stock increase ext. processing · Control sawing waste · CBS Documentatie |
| Suppliers | **4** | Suppliers · Supplier revenue · Supplier revenue per revenue group · Contact persons suppliers |
| Logistics | **5** | Customer stock on location · Revenue per product · Reservations · Production capacity · Production capacity details |
| **Sales** | **0** | — |

From the Sales menu itself came **four screenshots**: `Contracts` and
`Contractgroups` (both ✅ done — `Contracts` proved that a contract declares
what it adjusts), plus `SFN statistics` and `Revenue w.r.t. Budget`, whose grids
were empty because `Year`/`Month` was blank. That is why the count is 19 − 2 =
**17**.

**Three of those files look like sales screens and are not.** `Revenue per
product`, `CD-deliveries in progress` and `Credit information customers` carry
revenue, profit margin, order types and customer credit — but they live in the
Logistics and Finance menus, and they are **reports about** selling, not the
documents that do it. No order, order line, quote line, invoice, invoice line,
delivery or price row has ever been exported.

That gap is exactly the one that has bitten this project twice: `Profit margin`
was proved across **2 702** rows of a report, while **discounts cascading was
proved on one quote line.** The reports are dense; the documents are unseen.

And one whole dimension has never been touched at all: **the menus above
`Overviews`.** `Bestand`, `Beeld`, `Logistiek`, `Financiën`, `Batch Taken`,
`Acties`, `Extra` — we know their names and nothing else. Settings live in
there, and so does the answer to the one red question in the code.

---

## The recipe — read this once, use it for every screen

Every screen in Parts B–F is the same five moves.

1. Open the screen from `Overviews`.
2. **Set `View` to `-empty-`.** This is not optional. The export carries the
   *current* view's columns, so a column hidden in the view is **missing from
   the file**, not blank in it. `Trip data` gave 7 columns on its own view and
   20 on `-empty-`, and the 13 missing ones were every cost column.
3. **Widen every filter — but never blank a `from` box.** Blanking `from` voids
   the filter and returns **zero rows**. Type a real date: `1-1-2024`. Text
   filters already hold `zzzzzzzzzzzzzzz` as their no-upper-bound sentinel —
   leave that alone.
4. Press `Show Data`. 📸 **screenshot the filter block and the grid together**
   — the filter block is half the evidence.
5. `Show in Excel`, **leave the workbook open**, and tell me. I read it straight
   out of the running Excel. (`Save as Excel` is blocked on this install.)

### ⚠️ The filter that lies

If a screen filters on **`Year` / `Month`** instead of a date range, it will say
*"leave blank for current"*. **Blank means September 2026, not "all time".** An
empty grid from a blank `Year`/`Month` proves nothing — it cost us a whole wrong
conclusion once, published and retracted.

**On any `Year`/`Month` screen: type `Year` = `2025`, `Month` = `1`.** The
database is dense January–May 2025 and nearly empty after, so January 2025 is
where the rows are.

### ⚠️ When `-empty-` itself breaks the screen

`Customers and Prospects` (C1) answers `View` = `-empty-` with a **Database
error**:

> The column "DeliveryTerm" was expected but did not occur in
> "GetReportData_CustomerAndProspect".

That is a bug in the reference, not a mistake in the capture: the `-empty-` view
asks for a column the report procedure does not return. **Fall back to any other
view**, export it, and say which view it was — a short column list is worth more
than an error box. If the screen has two views, export both and the hidden
columns can be recovered by diffing them.

---

### ⚠️ Two date filters

Some screens have two (`Deviations in count lists` does). They `AND` together,
so a row must satisfy both. If a screen comes back empty and it has two date
filters, that is usually why — try again with only one widened.

---

# Part A — The menus nobody has opened

🔴 **Highest value on the whole list**, and none of it needs data. Just open
each menu and photograph it open. Where a menu item opens a window, open it and
photograph that too.

| # | Menu | Why it matters |
|---|---|---|
| **A1** | **`Extra`** | Settings live here. **This is where the overdue-days number is**, see below |
| **A2** | `Acties` (Actions) | Every action the system can run that is not a screen |
| **A3** | `Batch Taken` (Batch Tasks) | Scheduled jobs. Whether the batch scheduler is off is an open question |
| **A4** | `Logistiek` and `Financiën` | Two top menus that are *not* the `Overviews` tree — they hold something else |
| **A5** | `Bestand` and `Beeld` | Probably file/view housekeeping, but nobody has looked |
| **A6** | `Nieuw` → `Purchase request`, and `Nieuw` → `Purchase return order` | The two document types in the New menu that no screen has ever shown. Open each, photograph the empty form, close without saving |

## 🔴 A1 in detail — the one red unknown in the code

Right now `apps/dashboard` holds this line:

```ts
export const OVERDUE_POST_BLOCK_DAYS = 30;
```

It is **an assumption**, marked as one. The reference blocks 18 of 31 held
orders with `Post(s) outstanding for too long`, and **17 of those 18 pass the
credit check** — so it is purely an age-of-debt rule. Every blocked example is
496+ days overdue, which means any number from 1 to 496 reproduces all of them.
The real number is a setting on a screen nobody has captured.

**Steps:**

1. Open **`Extra`** from the top menu bar.
2. Photograph the menu open.
3. Open anything that reads like settings, options, parameters, `Instellingen`,
   `Opties`, or `Bedrijfsgegevens`.
4. Look for a debtor/credit block — words like `dagen`, `days`, `vervallen`,
   `overdue`, `blokkeren`.
5. 📸 that block.

**If `Extra` has nothing:** open one company that is currently blocked
(`Overviews → Finance → Financially blocked quotes and orders` names them),
press `Show Company`, and open the **`Debtor`** panel. A per-customer day
setting would live there.

---

# Part B — Sales · 4 screens left

🟡 **Was the biggest hole in the whole rebuild; now mostly filled.** On
13-9-2026 twelve Sales exports were taken in one sitting — **~43 000 rows** —
covering the whole order-to-cash chain: orders, quotes, lines, deliveries,
invoices, invoice lines, returns, charges and options. What is left is five
screens, and two of them are statistics.

Standard recipe. Filters below are the ones to set; everything else stays.

| # | Screen | Filter |
|---|---|---|
| ~~**B1**~~ | ~~**Orders and Quotes**~~ | ✅ **captured 13-9-2026** — 2 091 rows × 40 columns → [orders-and-quotes.md](orders-and-quotes.md), queued in [PLANNED-CODE-CHANGES-3.md](PLANNED-CODE-CHANGES-3.md) |
| ~~**B2**~~ | ~~**Order lines**~~ | ✅ 4 975 × 54 → [order-lines.md](order-lines.md) |
| ~~**B3**~~ | ~~**Invoices**~~ | ✅ 1 683 × 27 → [invoice-lines.md](invoice-lines.md) Part 2 — **VAT settled** |
| ~~**B4**~~ | ~~**Invoice lines**~~ | ✅ 5 650 × 43 → [invoice-lines.md](invoice-lines.md) |
| ~~**B5**~~ | ~~**Deliveries**~~ | ✅ 6 134 × 54 → [deliveries.md](deliveries.md) |
| ~~**B6**~~ | ~~Quote lines~~ | ✅ 9 × 46 → [order-lines.md](order-lines.md) §10 — discount **shape** proved, every value `0 %` |
| ~~**B7**~~ | ~~Return lines~~ | ✅ 88 × 64 → [returns-and-complaints.md](returns-and-complaints.md) |
| ~~**B8**~~ | ~~Charges~~ | ✅ 1 504 × 24 → [charges.md](charges.md) — names the `B` series |
| ~~**B9**~~ | ~~Options~~ | ✅ 2 890 × 31 → [sales-options-and-calloff.md](sales-options-and-calloff.md) |
| ~~**B10**~~ | ~~Option prices per product~~ | ✅ 54 × 16 → [product-prices.md](product-prices.md) §3 |
| **B11** | **Product prices** | ⚠️ **captured but must be re-run** — 19 383 × 47, and every price column is `0` because `Price date` is a **snapshot** date, not a range. Re-run with the **`Price date` at today**. See [product-prices.md](product-prices.md) §1 |
| ~~**B12**~~ | ~~Net prices~~ | ✅ **proved empty 13-9-2026** — filter block photographed, all sentinels correct, 1-1-2024→13-9-2026, zero rows. No contract is typed `Net prices` either. See [product-prices.md](product-prices.md) |
| ~~**B13**~~ | ~~Order lines still to be called~~ | ✅ 55 × 26 → [sales-options-and-calloff.md](sales-options-and-calloff.md) §6 |
| ~~**B14**~~ | ~~Orders still to be called~~ | ✅ 691 × 49 → [sales-options-and-calloff.md](sales-options-and-calloff.md) §6 |
| **B15** | Order lines capacity overflow | `Show Data` |
| **B16** | SFN statistics Product-Market combinations | ⚠️ `Year` = `2025`, `Month` = `1` — it was captured blank and proves nothing |
| **B17** | Revenue w.r.t. Budget | ⚠️ `Year` = `2025`, `Month` = `1` — same, and this one also needs its **second view** exported |

Already done: `Contracts` and `Contractgroups` ✅.

## What B1–B5 unlock

These five are the whole order-to-cash chain, and each one settles something
that is guessed today:

- ~~**B1**~~ ✅ **answered.** No — there are **four** series, not one:
  `O` orders, `R` **return orders** (this is the `29xxxx` series of item G11),
  `Q` quotes and one stray `B`. A quote's `Status` comes from the **same
  ten-value ladder** as an order's, and our four-value `orderStatuses` matches
  none of it. `orderType` survives and gains a fourth value, `Ex works`.
  `Order method` is nullable and uses four of our eight values.
- **B2** — the sales equivalent of the purchase-lines export that proved six
  formulas. This is where the price build-up, the discounts and the `Stk`/`CD`
  split get proved on the selling side. **We proved discounts cascade from a
  single quote line.** One line.
- **B3 / B4** — VAT scenarios are stored in our code and **drive nothing**. The
  invoice header/line pair is what says which scenario applies when, and how the
  line totals roll into the header.
- **B5** — a delivery is the document that consumes the reservation and moves
  the stock. We model the movement; we have never seen the delivery.

---

# Part C — Customers · 15 screens

🔴 **Nothing in this group has ever been opened.** Visits, prospects, revenue by
customer — fifteen screens built from menu names alone.

| # | Screen | Filter |
|---|---|---|
| ~~**C1**~~ | ~~**Customers and Prospects**~~ | 🟡 **columns captured 13-9-2026, no rows** — `-empty-` triggers a reference bug (`DeliveryTerm` missing from `GetReportData_CustomerAndProspect`). 44 columns + toolbar photographed → [customers-and-prospects.md](customers-and-prospects.md). **A prospect is a checkbox, not a table.** Rows still wanted: try another `View` |
| ~~**C2**~~ | ~~**Customer overview**~~ | ✅ **1 679 × 47, 13-9-2026** → [customers-and-prospects.md](customers-and-prospects.md) Part 2 — the whole document family counted per customer, complaints included |
| **C3** | Contact persons Customers and Prospects | `Show Data` |
| **C4** | Addresses | `Show Data` |
| **C5** | Remarks per company | `Show Data` |
| **C6** | Contracts per Customer / Prospect | `Show Data` |
| **C7** | **Unblocked orders** | date from `1-1-2024`. ⚠️ **this is the other half of the blocking rule** — who unblocks, and on what grounds |
| **C8** | Customer revenue | `Year` = `2025`, `Month` = `1` |
| **C9** | Customer revenue per product group | `Year` = `2025`, `Month` = `1` |
| **C10** | Customer revenue per revenue group | `Year` = `2025`, `Month` = `1` |
| **C11** | Customer revenue per revenue group with split order types | `Year` = `2025`, `Month` = `1`. ⚠️ splits by `Stk`/`CD` — a second proof of the order-type model |
| **C12** | Customerrevenue, -sales and -visits | `Year` = `2025`, `Month` = `1` |
| **C13** | Visit schedule | date from `1-1-2024` |
| **C14** | To visit/call | `Show Data` |
| **C15** | Change visit schedule | 📸 the screen only — do **not** change anything |

**C7 matters more than its position suggests.** We built three blocking reasons
and a rule for each. Nothing in the code knows how a block is *lifted*, who may
lift it, or whether lifting it is recorded. This screen is the record.

---

# Part D — Companies · 6 screens

| # | Screen | Filter |
|---|---|---|
| **D1** | Inactive companies | `Show Data` — what makes a company inactive? |
| **D2** | Texts | `Show Data` — and 📸 one text opened, so we see what it attaches to |
| **D3** | Communication settings | `Show Data` — 📸 one row opened. This is probably how documents get emailed |
| **D4** | Visits made | date from `1-1-2024` |
| **D5** | Visit reports | date from `1-1-2024` — 📸 one report opened |
| **D6** | Address distances | `Show Data` — distance between addresses, presumably for trip planning |

---

# Part E — Batch registration · 5 screens

The certificate chain. A steel batch carries a mill certificate, and the
certificate has to follow the metal to the customer. We store `charge` and
`internalBatch` on a lot and **nothing else in this chain exists**.

| # | Screen | Filter |
|---|---|---|
| **E1** | **Batches** | `Show Data`. ⚠️ start here — it is the master |
| **E2** | Certificates received | date from `1-1-2024` |
| **E3** | Certificates to be linked | `Show Data` — what "linked" means is the whole question |
| **E4** | Sending certificates | date from `1-1-2024` |
| **E5** | Deliveries from the missing batch | `Show Data` — a delivery that went out with no certificate behind it |

Also: **📸 one batch opened**, every tab. See item G6.

---

# Part F — Other · 5 screens

| # | Screen | Filter |
|---|---|---|
| **F1** | **Complaints** | date from `1-1-2024`. We have a `/complaints` screen and a form built from nothing |
| **F2** | Complaint lines | date from `1-1-2024` — does a complaint line name an invoice line, or a delivery? |
| **F3** | Balanced Scorecard | `Show Data` — 📸 the filter block especially; we have no idea what it scores |
| **F4** | Transport by region | `Show Data` |
| **F5** | SigmaNest geblokkeerde orders | `Show Data` — SigmaNest is the nesting software; this is its reject queue |

---

# Part G — Records to open

A grid gives columns. **A record gives structure** — which fields are grouped
together, which are greyed, which panels exist. Every one of these is
screenshots only: open it, and photograph **every tab and every panel expanded**.

| # | Open this | What it settles |
|---|---|---|
| **G1** | 🔴 **One sales order, every tab and panel** | The single most valuable record left. We built the order model from one screenshot of order `100742`. Take any order with several lines, at least one option, and a delivery against it |
| **G2** | 🔴 **One sales invoice, every panel** | Nothing posts to the ledger yet. The invoice is where the posting is decided |
| **G3** | **One delivery**, every panel | The document between an order line and a stock movement |
| **G4** | One quote that became an order | Does the order keep the quote's number? Its prices? Its discounts? |
| **G5** | One complaint, every tab | |
| **G6** | One batch, every tab | Part E's master record |
| **G7** | **One trip** — bill of lading `300813` against trip number `600249` | Two numbers, two documents, one delivery, and the pair is unexplained. 438 trips are captured and not one has been opened |
| **G8** | One production batch, every tab | |
| **G9** | **One remnant lot** (an offcut the saw made) — and read its **`Supplier`** | Us, or the original mill? It decides whether a remnant traces back to the heat it was cut from |
| **G10** | **One `Bewerker` lot** — any lot at an external-processor location | All 36 are blocked. Which screen set that, and can it be lifted by hand? |
| **G11** | An order from the **`29xxxx`** series | ⚠️ **half answered by B1** — it is a **sales return order** (`R290000`–`R290051`, 43 of them), negative revenue and weight, in the same grid as the orders. Still worth opening **one** to see its lines |
| **G12** | One customer company, **`Debtor`** panel fully expanded | Where the credit limits, the journal code and possibly the overdue-days setting live |

---

# Part H — How the work is actually done

🔴 **This is the two thirds that is unbuilt.** 126 screens exist in our app and
**42 of them write**. The rest list. In the reference, somebody *does* things on
these screens, and we have never watched it happen.

For each: **do it on a test record, and photograph every single step** —
including the dialog that opens, what it asks, and what the screen looks like
afterwards. A short screen recording is better than screenshots if that is
easier.

| # | The flow | Why |
|---|---|---|
| **H1** | 🔴 **A lorry arrives → the goods become stock.** Which screen, which button, in what order | *Still the number one question in the whole project.* We create stock when the **purchase invoice** arrives. If the reference books it in at **receipt**, ours does it too late and the chain has to be rebuilt. 53 of 151 receival rows read `Workorders created`, so something creates them |
| **H2** | **Create a reservation by hand** | We can read reservations; we cannot make one |
| **H3** | **Adjust a lot by hand** — correct a weight or a quantity | `Correct products and stock` on the product screen |
| **H4** | **Plan a trip** — from deliveries waiting to a trip with a bill of lading | The whole transport side is read-only in ours |
| **H5** | **Take an order from entry to delivery**, one line, every button | The spine of the selling side |
| **H6** | **Send an invoice** — from an order delivered to an invoice sent | |
| **H7** | **Take a payment** against an invoice | |
| **H8** | **Block, then unblock, one order** | Three blocking rules are built and no unblocking exists |
| **H9** | **Send material out for external processing, and take it back** | Purchase reservations are this flow, inferred from 23 rows |
| **H10** | **Report a saw cut** — the two report dialogs, and the kilos balancing | Modelled from a screenshot; never watched |
| **H11** | **Link a certificate to a batch** | Part E |
| **H12** | **Raise a credit note / return** | `Return order` and `Return lines` exist as menu items and nothing else |

**Start with H1.** It is the oldest open question in the project and everything
in the warehouse hangs off it.

---

# Part I — Screens that came back empty and should not be trusted

Each of these returned nothing, but the filter that produced the nothing was not
captured — so it is unknown whether the screen is genuinely unused or was simply
asked about the wrong month.

**The rule:** a column blank on every row of a **full** export is evidence. An
empty grid is not.

| # | Screen | Run it again with |
|---|---|---|
| **I1** | Stock history | date from `1-1-2024`, 📸 **the filter block** |
| **I2** | Production batches | date from `1-1-2024`, 📸 the filter block |
| **I3** | Freight movement | date from `1-1-2024`, 📸 the filter block |
| **I4** | Freight flow (SFN) | date from `1-1-2024`, 📸 the filter block |
| **I5** | Sawing layouts | date from `1-1-2024`, 📸 the filter block |
| **I6** | Purchases and sales per revenue group | ⚠️ `Year` = `2025`, `Month` = `1`. Its sibling `Revenue per revenue group` returns **€9 million** from the same window once the filter is right, so expect data |
| **I7** | Deviations in count lists | ⚠️ it has **two** date filters that `AND` together. Widen one at a time |

If a screen still returns nothing **with a photographed filter block over
1-1-2024 → today**, it is confirmed unused and it leaves scope for good.

---

# Part J — Older items still standing

Carried over from the Purchase rounds. Smaller, but each one is a real gap.

| # | Item | Steps |
|---|---|---|
| **J1** | **Consignment stock — finish it** | Order `401154` exists, `Provisional`, reception created. Three clicks: press **`Make final`** → fill `Kg(a)`=314 / `Qty(a)`=10 on the reception → read that lot's `Stock (€)` on `Stock on location`. **€0,00 means consignment is excluded from stock value** |
| **J2** | **The `Pricing` panel on purchase order `400650`** | `Overviews → Purchase → Purchase lines`, find order `400650`, `Show Purchase order`, expand `Pricing`. 📸 the whole panel. 4 pieces weighing 94,2 kg are billed as 100 kg and we cannot say where that weight is held |
| **J3** | **Is StockOp used at all?** | `Purchase lines` → any row → `Show Product` → find *"Use StockOp for this product?"*. Check `PK304L20021`, `PK316L40021`, `SC304`, `CK3040010`. **All four unticked = the whole `StockOn advice` screen leaves scope and gets deleted** |
| **J4** | **A purchase line received in two goes** | `Purchase lines`, creation date from `1-1-2024`, find a line where `Qty(a)` is above 0 but below `Qty(p)` → `Show Purchase order` → expand `Receipts`. 📸 — two instalments on one line, one `Received`, one `Released` |
| **J5** | **The product `Options` list, to the bottom** | Product `PK316L40021` → scroll `Options` to the end → open one row's state dropdown. Six read `Possible`; `Knippen` appears on Purchase receivals and **not** in that list, so the enum has at least seven members |
| **J6** | **Value lists — drag the header into the grey bar** | The bar reading *"Drag a column header here to group by that column"*. It lists every value with counts. Do it for: `Purchase invoices → Status`, `Orders and quotes → Status`, `Purchase lines → Line type` |
| **J7** | **Dropdowns — open and photograph the list** | `Orders and quotes → Order method` · `Orders and quotes → Classification code` · Product → `Price` (reads `Algemeen`) · Company → `Journal code` (`0` and `11` seen) · `Net prices → Net priceU` |
| **J8** | **Buttons nobody has pressed** | On a **test** record: Purchase order → `Return`, `Par. return`, `Relocate`, `Workorder`, and the `Workorders` / `Product Receipt Documents` panels · Stock on location → `Change APP…` · Product → `Correct products and stock` · Company → `Show Word File`. 📸 what each opens. **A button that does nothing is an answer** |

---

# Part K — Only a person can answer these

No screen shows them. They need somebody who knows how Swedinox runs, not
somebody clicking.

| # | Question | Why it matters |
|---|---|---|
| **K1** | 🔴 **How many days overdue is "too long"?** | The one assumption sitting in shipped code. If A1 finds the setting, this is answered without asking anybody |
| **K2** | **Should customer-owned stock carry value?** | €40 833 does today in the reference. That is an accounting policy call, not a code fact |
| **K3** | **Are these six features wanted at all?** | The reference ships them and does not use them: transport costing, `Resource`, `Pickvolgorde`, `Zelfbeoordeling`, FSP revaluation, sawing planning. **Six features we can decline to build** |
| **K4** | What does `FSP` stand for, and what does `LIP` stand for? | FSP's *behaviour* is established — the price stock is carried at, versioned, revalued through two GL accounts. Only the letters are unknown |
| **K5** | What is `Gip`? | The product has `Gip → Artikelgroep`, stock has `Gipgroup`. Believed to be average purchase price. Not confirmed |
| **K6** | Does the business raise **purchase quotes** at all? | One exists in three years and it is a test entry |
| **K7** | Are `Purchase request` and `Purchase return order` used? | Two document types in the `Nieuw` menu that no screen has shown |
| **K8** | Are any companies `Processor` or `Transporter`? | Would change how work orders are assigned |
| **K9** | What does ticking `Consignatie` change commercially? | J1 answers the accounting half; this is the business half |
| **K10** | Is the batch scheduler meant to be switched off? | Needs an administrator |

---

# What each part unlocks

So the order makes sense:

| Do this | And this becomes buildable |
|---|---|
| **A1** | The credit block stops being an assumption |
| **B1–B5** | The whole selling side gets proved the way Purchase was — and the ledger posting becomes possible, because invoices are where posting is decided |
| **H1** | Receiving goods gets rebuilt at the right moment in the chain |
| **G1, G2** | Order and invoice detail screens get built from fact instead of one screenshot each |
| **C7, H8** | Blocking gets its missing half — how a hold is released |
| **E1–E5, G6, H11** | The certificate chain exists at all |
| **I1–I7** | Seven screens either come into scope or leave it for good |
| **K3** | Six features get declined, on purpose, in writing |

---

# When can testing start?

**Testing the parts already proved can start now.** Purchase, stock, logistics
and the credit rules are checked by **123 automated cases** against ~130 000 real
exported rows, and every money rule in them has been proved rather than assumed.
Put real work through those screens today.

**Testing the selling side should wait for Part B.** Not because the screens are
missing — they exist — but because their arithmetic has been proved on single
lines from single screenshots, and single lines are exactly how the two wrong
conclusions in this project got made.

**Part H is not testing, it is discovery.** Until a lorry arriving has been
watched end to end, the warehouse write paths cannot be built, and what cannot
be built cannot be tested.

---

## How to send it

One screenshot per numbered item, with the number. For an export: `Show in
Excel`, **leave the workbook open**, and say which number it is — I read it out
of the running Excel.

Anything impossible, greyed out, or empty is still an answer. Say the number and
what happened.
