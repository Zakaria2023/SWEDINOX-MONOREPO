# Customers and Prospects

**Item C1 of [WHAT-IS-LEFT.md](WHAT-IS-LEFT.md), captured 13-9-2026.**
`Overviews → Customers → Customers and Prospects`, `View` = `-empty-`.

⚠️ **No data.** The screen answers `Show Data` with a reference-side bug:

> Database error — The column `"DeliveryTerm"` was expected but did not occur in
> `"GetReportData_CustomerAndProspect"`. Please contact system administration.

The `-empty-` view asks the report procedure for a column it does not return, so
the grid never fills. The **columns and the toolbar were photographed instead**,
and they carry most of what this screen was opened for.

This is the first screen in the `Customers` menu ever opened — 15 screens, and
until today not one.

---

## 1. 🔴 A prospect is a **checkbox**, not a different record

The first nine columns:

```
Searchcode 3 | Company | Customer | Prospect | Supplier | Processor | Transporter | Agent | Other
```

Seven role flags on one company row. So `Customers and Prospects` is not a
customer table — it is the **company** table filtered to two of its flags, which
is why the same grid carries `Supplier` and `Transporter` columns.

✅ **We already model this correctly.** `Companies.roles` is
`json("roles").$type<CompanyRole[]>()` over a nine-value `companyRoles` enum:
`customer`, `prospect`, `supplier`, `processor`, `transporter`, `agent`,
`purchasing_org`, `other`, `internal`. The two not shown as columns here
(`purchasing_org`, `internal`) do appear on the company detail screen
([company-detail.md](company-detail.md)). Nothing to change.

---

## 2. The full column list — 44 columns, in grid order

| # | Column | Note |
| --- | --- | --- |
| 1 | `Searchcode 3` | |
| 2 | `Company` | the name |
| 3–9 | `Customer` `Prospect` `Supplier` `Processor` `Transporter` `Agent` `Other` | the role flags, §1 |
| 10 | `Visit-City` | |
| 11 | `Visit-Postal code` | |
| 12 | **`Representative`** | |
| 13 | **`Target #visits / year`** | |
| 14 | **`Customer group`** | |
| 15 | `C. of C. no.` | Chamber of Commerce / KvK |
| 16 | 🔴 **`Credit limit`** | |
| 17 | 🔴 **`Revenue last year`** | |
| 18 | 🔴 **`Revenue this year`** | |
| 19 | 🔴 **`Competitors`** | |
| 20–25 | `Correspondence` **Address · Postal code · City · Country · Phone No. · Fax No.** | |
| 26–29 | `Delivery` **address · Postal code · City · Country** | |
| 30–32 | `Contact person` · `Contact e-mail` · `Contact mobile no.` | |
| 33 | `Region number` | tooltip-confirmed |
| 34 | `Region` | |
| 35 | 🔴 **`Account manager`** | |
| 36–37 | `Searchcode 2` · `Searchcode 1` | |
| 38 | 🔴 **`Complete delivery`** | |
| 39 | 🔴 **`Print consignment`** | |
| 40 | 🔴 **`Certificate`** | |
| 41 | 🔴 **`Customer since`** | |
| 42 | `Created on` | |
| 43 | `Delivery condition` | likely the broken `DeliveryTerm` |
| 44 | `Company code` | tooltip-confirmed; the key |

---

## 3. 🔴 What this settles that the Sales exports could not

### `Credit limit` sits on the customer, beside two revenue figures

`Credit limit` · `Revenue last year` · `Revenue this year` are adjacent columns
on the customer row. [credit-and-blocking.md](credit-and-blocking.md) proved the
creditspace identity needs **both** limits across 2 593 rows; this is where at
least one of them is maintained, and the two revenue figures beside it are what
a credit decision is judged against.

### `Representative` and `Account manager` are **two different columns**

Not two names for one thing. The toolbar carries both as separate buttons
(`Representative…`, `Account manager…`) and the grid carries both as separate
columns. `Representative` is the one on the order header — `Hego` / `Export` /
`BNL` / `Arian Bloks` ([orders-and-quotes.md](orders-and-quotes.md) §6).
**`Account manager` has appeared on no export at all.** Two roles per customer,
and our `Orders` table has a column for neither.

### `Customer group` is a customer attribute — and we already have it

The 18 Dutch trade segments the invoice lines carry
([invoice-lines.md](invoice-lines.md) §4) live here, on the company.
✅ `Companies.customerGroup` exists and `customerGroups` in `lib/enums.ts`
already holds every observed value. **Comes off the queue.**

### `Region number` is real here, and dead on the invoice

`Region number` is `0` on all 5 650 invoice lines and all 1 504 charge rows —
but it is a maintained column on the customer. The number is simply not carried
down onto the documents.

### Three per-customer switches nothing else has shown

- **`Complete delivery`** — deliver the order in one go or in parts. This
  decides whether a line may be split across deliveries at all, which is the
  `#Deliveries` column on the order line (1 on 4 398 rows, up to 12).
- **`Print consignment`** — a per-customer document preference.
- **`Certificate`** — 🔴 **a per-customer certificate requirement.** This is the
  hinge into Part E: option code `A21` *2.1 Certificate* is sold as an option
  ([sales-options-and-calloff.md](sales-options-and-calloff.md) §1), contract
  `CERTIFICATEN` — *Certificaat 3.1* — is typed `Options`
  ([contracts.md](contracts.md)), and here the customer says whether it needs
  one at all. Three screens, one feature, and none of it is built.

### `Customer since` ≠ `Created on`

Two dates. The record's creation and the relationship's start are separate — a
prospect converted to a customer has a `Customer since` later than its
`Created on`.

### `Competitors`

A free field naming who else sells to this customer. Pure CRM, nothing like it
in our schema, and nothing else references it. Low priority, but it is there.

---

## 4. The toolbar — where complaints and visits are born

```
Show Company · New Complaint · New Visit Report · Representative… · Account manager…
```

🔴 **`New Complaint` is here, not on the return order.** The `K40000`–`K40069`
series ([returns-and-complaints.md](returns-and-complaints.md) §1) is raised
against a **customer**; the return order is its consequence. That is the right
way round for the model: a complaint belongs to the relationship, and may or may
not produce a credit.

**`New Visit Report`** plus `Target #visits / year`, `Visit-City` and
`Visit-Postal code` is the visit machinery that C13 `Visit schedule` and C14
`To visit/call` run on.

---

## ⚠️ How to get the data

`-empty-` is broken on this screen. Two things to try, in order:

1. **Pick a different `View`** from the dropdown, if the install has one, and
   export that. A narrower view will not ask for `DeliveryTerm`.
2. **Remove `Delivery condition` from the grid** — right-click a column header →
   column chooser → drag it out — then `Show Data`.

Neither is essential for the model. The columns above are the capture; the rows
would only add distributions.

---

# Part 2 — Customer overview (item C2)

`Overviews → Customers → Customer overview`, `View` = `-empty-`. **47 columns,
1 679 rows** — `exports/c2-customer-overview.tsv`. This one works: a different
report procedure, no `DeliveryTerm` bug.

**1 679 customers**, codes `10263`–`13765` with **1 824 gaps**. Against them,
only 335 bought anything in the export window and 293 were invoiced. The
customer file is five times the size of the active customer base.

## 5. 🔴 The whole document family, counted per customer

Every sales document type gets three columns — total, lines, and outstanding:

| Document | Customers with any | Open |
| --- | --- | --- |
| Quotes | 6 | 4 |
| **Converted quotes** | **0** | — |
| Orders | 337 | 162 |
| Counter orders | **1** | 1 |
| Return orders | 35 | 9 |
| Complaints | **50** | **25** |
| Invoices | 292 | — |

Three things fall out:

- 🔴 **`Counter orders` is a first-class document type**, with its own count,
  line count and outstanding count — exactly like quotes and returns. The single
  counter order in the database is `B250000`, the `zakaria test` row. That is
  now the **fourth** screen to confirm the `B` series
  ([charges.md](charges.md) §1).
- 🔴 **`Complaints` are counted on the customer, and 25 are open.** Not on the
  return order. A complaint is a relationship object with its own lifecycle —
  it can be outstanding without a return existing. Nothing in
  `apps/dashboard` models it.
- **`Converted quotes` is `0` on all 1 679 rows.** Fifth independent
  confirmation that no quote has ever become an order in this database.

## 6. 🔴 Six small-order counters — a feature we have no trace of

```
Orders <200 EUR   Orders <500 EUR   Orders <2000 EUR
Orders <200 KG    Orders <500 KG    Orders <2000 KG
```

**Verified cumulative and nested** on all 1 679 rows: `<200 ≤ <500 ≤ <2000`, for
both euros and kilos. **109 customers placed at least one order under €200.**

This is a standing report on customers who order below an economic minimum —
and it pairs with `Order surcharge`, which appears on 17 invoice lines
([invoice-lines.md](invoice-lines.md) §1). Small orders are measured, and
sometimes charged for. We model neither.

## 7. The reference window, and one arithmetic identity

`Reference date from` = **2024-01-01** and `Reference date u/i` =
**2026-09-13 23:59:59** on every row — the filter, stamped onto the output. So
**every count above is windowed, not lifetime.** A screen that prints its own
filter back is a good habit and worth copying.

```
Avg. Order size = Invoiced orders revenue / Invoiced orders     0 mismatches / 1 679
```

(Zero when the customer has no invoiced order.)

## 8. Two enums are bigger than the documents showed

**`Customer group` — 21 values here, not the 18 the invoice lines carried.**
Three only appear on customers who have not bought: `COMMISS (E` (commission,
export), `LOON (E)` (contract work, export), `MAG. BEN.` (warehouse staff).
✅ All three are already in our `customerGroups` enum.

**`Region` — 23 values, not 18.** The five extra are the far-export zones:
`AZIE` (11), `M OOSTEN` (3), `Z AMERIK` (2), `AFRIKA` (1), `M AMERIK` (1) — plus
**`-` on 26 customers**, which is a real stored value meaning *no region*, not a
blank. Together with `O EUR` and `Z EUR` this is the zone axis the freight
tariff is priced on ([charges.md](charges.md) §3).

⚠️ **`Region number` is `0` on all 1 679 rows here too** — third screen to show
it dead. The region has a name and no number, anywhere.

## 9. Small things

- **`Visit frequency` is `0` on all 1 679** and only 2 customers have a visit.
  The visit machinery (`Target #visits / year`, `New Visit Report`, C13, C14)
  exists and is unused.
- **`Email to` / `To email`** — a per-customer invoice-email override. `True` on
  1 678, and exactly one customer redirects to a named address. The flag is on
  by default; the override is the exception.
- **`Searchcode 1` and `2` are mostly empty** (blank on 1 115 and 1 554) while
  **`Searchcode 3` is filled on 1 654** and is the searchable name key
  (`ALL IN`, `ADM SPRL`). Three search fields, one used.
- ⚠️ **The customer name is used as a status marker.** Four records are named
  `Failliet` (*bankrupt*), three `Dubbel` (*duplicate*), one is `x`, and one
  reads `Zie Eribel1` (*see Eribel1*). There is no archived/merged flag, so
  staff type the status into the name. **Any import must not treat these as real
  companies**, and the rebuild should give them the flag the reference lacks.

---

# Part 3 — Unblocked orders (item C7)

`Overviews → Customers → Unblocked orders`, date from `1-1-2024`. **14 columns,
571 rows** — `exports/c7-unblocked-orders.tsv`. One row per unblock event,
6-1-2025 → 9-9-2026, on **451 orders** of **148 customers**.

## 10. 🔴 Two unblock types, not four

| `Deblock type` | Rows | Median time from order creation |
| --- | --- | --- |
| `Financiële deblokkering` — financial | **544** | **1 hour** |
| `Commerciële deblokkering` — commercial | **27** | **~5 days** |

Our `orderDeblockTypes` is `financial / invoice / transport / handling`.
**`commercial` is missing, and the other three never occur.** The financial
block is lifted almost at once (273 of 544 within the hour); the commercial one
waits days, which fits a margin/price review rather than a phone call to
accounts.

## 11. Who lifts what

| Person | Financial | Commercial |
| --- | --- | --- |
| Sharif Pasaribu | 311 | 4 |
| Raymond Wattez | 94 | — |
| André van der Veen | 68 | — |
| **`INAD`** | **62** | **1** |
| Adrie Noom | — | **15** |
| Furkan Sadir, Benno Vos, Arian Bloks, Hamza Dabbagh, Marco Borsboom | 9 | 7 |

A split by role, but not an enforced one — Sharif lifts both.

**`INAD` is the software vendor.** `INAD Industrie Software B.V.` is itself a
company in the address file (C4), and the `TESTBEDRIJF BV` contact's email is
`@inad.nl`. So 63 blocks were lifted under the vendor's login — spread over
every quarter of 2025–2026, not a go-live burst. Whether that is support staff
acting on request or a job running under that account is question K11.

## 12. A block comes back

- **78 of 451 orders were unblocked more than once** (2 × on 58, up to 9 ×), and
  **11 got both types**.
- The *first* unblock is usually within a day (365 of 462 order/type pairs); the
  *repeats* are mostly **more than a week later** (65 of 109).

So the check is not run once at order entry. It runs again later — at release,
delivery or invoicing — and can hold an order that was already let go.
**Confirmed 14-9-2026:** 3 of the 29 orders held in today's financially-blocked
queue were unblocked before ([credit-and-blocking.md](credit-and-blocking.md)). Our
`financially-blocked` action inserts one `OrderDeblocks` row and nothing ever
re-evaluates.

## 13. Small things

- **No reason is stored.** Who, when, type — nothing else. Our `OrderDeblocks`
  table already has exactly that shape.
- **`Order amount` = the order's revenue ex VAT** — equals B1 `Revenue` on
  436 of 436 orders found there. **435 of 2 037 orders (21 %)** were unblocked at
  least once.
- **A negative order is still credit-checked**: `O102041`, −220.97, financially
  unblocked. And the one counter order `B250000` was commercially unblocked, so
  the `B` series goes through blocking too.
- `Deblock time` is the same serial as `Deblock date`; `Region number` is `0` on
  all 571 (fourth screen).
- Unblocks happen 08:00–17:00 on weekdays, with a thin tail to 21:00.

---

# Part 4 — Contact persons Customers and Prospects (item C3)

`Show Data`. **48 columns, 6 796 rows** —
`exports/c3-contact-persons-customers-and-prospects.tsv`. One row per contact
person, for **2 188 companies**.

## 14. 🔴 Customer and Prospect are mutually exclusive

`Customer` xor `Prospect` on **6 796 of 6 796** rows (5 995 / 801). The other
roles stack on top:

| Roles | Rows |
| --- | --- |
| Customer | 4 570 |
| Customer + Supplier | 1 253 |
| Prospect | 797 |
| Customer + Supplier + Processor | **164** |
| Customer + Supplier + Transporter | 7 |
| Prospect + Supplier | 4 |
| Customer + Other | 1 |

`Agent` is never set. **Every processor and every transporter is also a customer
and a supplier.** Converting a prospect is flipping one flag to the other, which
is what §1 predicted from the columns alone.

## 15. 🔴 The contact row carries the company, not its own copy

Seventeen company-level columns — all six role flags, both revenues, account
manager, representative, customer group, credit limit, region, the three search
codes, the visiting and correspondence addresses — are **identical across every
contact of the same company, on 2 188 of 2 188 companies**. And the address
columns are the company's addresses from C4: visiting address equal on
**2 188 / 2 188**, correspondence on 2 185 (the other three differ only by a
`P.O. Box` prefix).

So this screen is a join, contact × company × address. **Our `Contacts` table
stores its own role flags and address columns** — copies that can drift. The
reference proves there is nothing per contact to store there.

## 16. Contact categories — a fixed list plus years of free text

`Contact person Category(ies)` holds 912 distinct strings. The `TESTBEDRIJF BV`
contact, created recently, reads **`Inkoop, Verkoop, Magazijn, Directie,
Boekhouding, Certificaat beheer`** — six values, which are exactly our
`contactCategories` (procurement, sales, warehouse, management, bookkeeping,
certificates). ✅ The enum is right.

The rest is history: English aliases (`Bookkeeping` 873, `Sales` 481,
`Procurement` 456) and hand-typed roles (`inkoop rvs`, `Directeur / Eigenaar`,
`GESCHÄFTSFÜHRER`, `WVB`). An import has to map them, not store them.

## 17. Names and placeholders

- `Contact person` = `Title` + `Initials` + `First name` + `Last name`, blanks
  skipped (3 144 exact).
- **932 rows are a bare `Mr.`** with no name at all — a placeholder contact that
  exists only to carry an email or a category (`Bookkeeping` → `invoices@…`).
- Department contacts are typed into `Last name`: `Certificaten` 40,
  `Administratie` 21. `.` as a last name 38 times.
- `Contact person Telephone` is filled on only 587 and is used as a **note
  field** (`maandag tot woensdag`, `collega van Wendy`, `bezocht door A3`).
- **`Sequence number` is not a key** — 1 416 companies have duplicates, mostly
  two `1`s.

## 18. What the company columns say

- 🔴 **Credit limits end in `001`** on 181 companies — `25001`, `50001`, `75001`,
  `100001`, up to `750001`. Staff type one euro over the round figure, which
  reads like a check that blocks at `≥ limit` rather than `> limit`. Note it
  before building the comparison.
- **Blank country = Netherlands.** 4 310 rows have no country; 4 044 of them
  carry a Dutch postcode (`1234 AB`).
- `Account manager` = **`Hego`** on 6 788 of 6 796, `Representative` = `Hego` on
  6 746 — the company's own name as the default, not a person.
- **Unused:** `Industry code`, `Industry`, `Classification code`,
  `Classification`, `Competitors` (all empty), `Target year revenue` and
  `Target annual sales` (all `0`), `Revenue this year` (`0` on all but two
  companies). `Region number` `0` again.
- Ten company names own more than one code — `Dubbel` ×4, `Zie Eribel1` ×2,
  and real duplicates such as `Aalco Metals Limited` `10495`/`10496`.

---

# Part 5 — Addresses (item C4)

`Show Data`. **33 columns, 4 739 rows** — `exports/c4-addresses.tsv`. One row per
address, for **3 414 companies** — every company in C3 plus 1 226 that are only
suppliers or other roles.

## 19. 🔴 The four address roles, and how many a company has

Each row carries four independent flags. Across 3 414 companies:

| Flag | Per company |
| --- | --- |
| `Is Visiting Address` | **exactly 1, on 3 414 / 3 414** |
| `Is Correspondence address` | **exactly 1, on 3 414 / 3 414** |
| `Is Billing Address` | 1 on 3 403, **0 on 11** |
| `Is Delivery Address` | 1 on 3 262, 0 on 33, **up to 30** on one company |

The common shape is **one row doing all four jobs** (2 460 rows), with extra
rows added for a delivery-only site (565) or a correspondence-only address
(756). Our `CompanyAddresses.category` JSON array can hold all of it but
enforces none of it.

## 20. 🔴 A P.O. box is only ever a correspondence address

744 of 745 `Is PO Box` rows are **correspondence and nothing else** — you cannot
visit, bill or deliver to a post box. The one exception is a data error. That is
also where C3's `P.O. Box …` prefix comes from: it is this flag, printed.

## 21. ⚠️ The `Categories` text column mislabels delivery

The flags and the `Categories` string agree perfectly for billing, visiting and
correspondence (4 739 / 4 739 each). For delivery they agree on only 1 826.
Every one of the other **2 913** rows reads `Bezoek` **twice** —
`Bezoek, Factuur, Correspondentie, Bezoek` — and every one has
`Is Delivery Address` = `True`. The fourth label is printed as *visit* when it
means *delivery*. **Read the flags; never parse the text.**

## 22. Delivery addresses carry the logistics

- `Alternative name` (665) sits on delivery rows in 553 cases — goods go to a
  site under a different name than the invoice.
- `companyaddress_LoadInstructions` (72) is on a delivery row in 70.
- `Crane Unloading` (146) — **all 146 on delivery addresses**. `Forklift
  Unloading` on 2. Never both on one row, so our single-choice `availableAt`
  fits.
- **Unused:** `Maximum Length` (all 0), `Maximum Bundle Weight` (one row, 1200),
  `Crane` and `Separate Bundling` and `Canopy` (all `False`), `GLN` (empty).
- `Start/End time Unloading` is `0` on 4 718 rows; the 21 filled ones hold a
  **full date serial**, sometimes with a time part — the field is a datetime
  used as a time. Our `time` column is the right fix.

## 23. Small things

- **`Address Complete` is a manual flag**, not derived: 627 of its 674 `False`
  rows have street, postcode and city all filled, and 621 are delivery
  addresses. It marks "not yet confirmed", not "missing fields".
- **`Sequence number` encodes the role loosely** — `5` on 4 055 main rows, `4` on
  485 delivery-only rows — and repeats within a company on 802. Not a key.
- `Region` is filled on only 515 addresses and mixes the zone codes with
  free-text provinces (`Staffordshire`, `Lecco`, `Istanbul`). **The region that
  matters lives on the company** (C3, 23 values).
- `Invoice attention 1/2` is filled 15 times, mostly test junk (`s`, `dsa`).
- `E-mail` holds a website on 5 rows. `x` is a street 7 times.

---

# Part 6 — Remarks per company (item C5)

`Show Data`, no filter. **This screen is a Report, not a Grid** — an 87-page
printout (`Customer remarks`: `Klant no.`, `Customer`, `City`, `Representative`,
`Initials`, remark text underneath). `Show in Excel` flattens it into **one
column**, so `exports/c5-remarks-per-company.tsv` holds only the customer codes
and the remark lines. The code→remark pairs were rebuilt from the order of the
lines, and the names checked against C4 (2 531 of 2 531 codes found).

## 24. One free-text remark per company, and most have none

- **2 531 companies are printed, 985 carry a remark, 1 546 do not.** The report
  lists every company, remark or not. Our `/remarks-per-company` lists only the
  ones with a remark — a deliberate filter, but not the reference's.
- One text block per company, **up to 932 characters** (median 148). That is
  exactly our `Companies.remarks` `text` column. ✅ No schema change.

## 25. 🔴 What staff use it for

It is a **hand-kept log and a warning board**, not a description:

| Found in the text | Companies |
| --- | --- |
| `LET OP` (*attention*) | **191** |
| `koopt` (*buys* — who they buy from, what) | 184 |
| `2e keus` (second-quality material accepted or refused) | **74** |
| certificates | 60 |
| delivery instructions (`levering`, `kraan`, `kooiaap`) | ~50 |
| payment (`betaal`, `vooruit`, `rembours`, `BETAALKORTING 2%`) | ~50 |
| blocking / credit (`blok`, `krediet`) | 17 |

- **167 remarks carry a typed date**, often with initials — `31/08/2016/AB:`,
  `MU:08/02/05` — going back to 2002. People append dated entries into one field
  because there is no remark history.
- Packing rules live here and nowhere else: `GEEN FOLIE` (*no film*), `Stevige
  pallets`, `GROOTFORMAAT MINIMAAL 2995 MM`, `Bij bestelling een Ordernummer
  vragen (Geen nummer geen order)`. **These are delivery and order-entry rules
  written as prose.** Some belong in structured fields the reference also has
  and nobody fills (C4 §22: `Separate Bundling`, `Canopy`, `Maximum Length`);
  the rest has to be shown at the moment an order is typed.
- A remark cross-references other records by number: `Zie ook bedrijfsnr 4614`.

---

# Part 7 — Customer revenue per product group (C9) and per revenue group (C10)

Both read from `Downloads`, 14-9-2026:

| | Rows × columns | File |
| --- | --- | --- |
| C9 per product group | 2 241 × 25 | `exports/c9-customer-revenue-per-product-group.tsv` |
| C10 per revenue group | 1 720 × 26 | `exports/c10-customer-revenue-per-revenue-group.tsv` |

⚠️ **Neither is January 2025 only.** Both cover the same invoice window as the
B4 invoice-lines export (January–May 2025 plus a handful of stragglers into
2026). That turned out to be the useful case: every total below reconciles
against B4 to the cent.

## 26. 🔴 The two screens split an invoice line differently — and both are exact

An invoice line in B4 carries `Revenue products` + `Revenue options` =
`Revenue line`. The two screens take different halves:

| | Revenue | Profit | Kg | Lines |
| --- | --- | --- | --- | --- |
| **B4** order lines | products **9 032 601.62** + options **11 236.90** | 1 613 985.81 | 3 373 329.63 | 5 180 |
| **C9** | **9 032 601.62** — products only | **1 613 995.32** — products only (options lose 9.51) | 3 373 329.63 | 5 180 |
| **C10** product groups `1000`–`2900` | = B4 `Revenue products` **per revenue group, 8 of 8 exact** | | | |
| **C10** option groups `3000`/`3010`/`3020`/`3030`/`3090` | **11 236.90 = B4 `Revenue options`, exact** | 0 (−9.51) | *repeated* | *repeated* |
| **C10** charge groups `3000`/`8100`/`8150`/`8600`/`8900` | **18 855.71 = B4 `Surcharge` lines, exact** | 12 822.61 | 511 | 463 |

So:

- **C9 per product group reports the product half only.** Options and charges
  are not in it at all.
- **C10 per revenue group splits every order line in two**: the product revenue
  goes to the **product's** revenue group, and the option revenue goes to the
  **option's** revenue group — `Slijpen/Folien` 3010 (priced per `M2`),
  `Laseren` 3030, `Knippen` 3020. **Charges become rows of their own**, with no
  `Order type` and no `PriceU`.
- ⚠️ **Option rows repeat the parent line's weight and line count.** C10 adds up
  to 4 527 322 kg and 8 691 lines against a true 3 373 330 kg and 5 650 lines.
  **Only revenue and profit may be summed across revenue groups** — kilos and
  line counts double-count.
- Options carry **zero profit** (sold at cost — the fifth screen to show it).
  `Prijsverschillen` 8600 is **negative revenue, zero profit**: a price
  correction, not a sale.

**What that means for our code:**

- `/customer-revenue-per-revenue-group` sums `InvoiceItems.amount` under the
  **product's** revenue group and `innerJoin`s `Products`. That puts option
  revenue in the wrong group and **drops every charge**.
- `/customer-revenue-per-product-group` sums `InvoiceItems.amount` (the whole
  line). The reference sums **`revenueProducts`** — the column added on
  13-9-2026.

## 27. The columns C9 has that our screen does not

`Subgroup1`, `Subgroup2` (three product-hierarchy levels, not one),
`Order type` (`Stk` 2 045 / `CD` 196), **`Option 1` and `Option 2`** (two option
slots per line — `Slijpen` + `Laser Folie` is the commonest pair, 335),
`PriceU` with `Sales (PriceU)`, `Transport region`, `Loading address`,
`Invoice date`.

- **Grain: customer × product group × subgroups × invoice date × loading
  address × order type × option 1 × option 2 × PriceU** — unique on 2 241 of
  2 241 rows. It is per **day**, not per month.
- **`Sales (PriceU)` = kg ÷ 1 000 when `PriceU` = `TN`** (1 944 of 1 947); kg
  when `KG`; pieces or metres otherwise.
- **`Transport region`** is a third region axis, named by country group in Dutch:
  `Nederland`, `Duitsland`, `Belgie`, `Spanje/Portugal`, `Verenigd Koninkrijk`,
  `Baltische staten`, `Oost europa`, `Frankrijk`, `Italie`, `Zuid Amerika`,
  `Azie`. It is not the `Region` zone (`WN EURO`, `NL-1`) and not the country.
- `Loading address` is `HEGO` or blank — never another warehouse.

## 28. The columns C10 has

`Revenue group number` + `Revenue group` (17 groups — the full list is in the
table above), `Country` (ISO code), `Account manager`, and four dead ones:
`Profit w.r.t. replacement price` and its margin (all `0`),
`Target annual revenue` (all `0`), `Competitors (Revenue share)` (empty).

- Grain: customer × revenue group × order type × year × month × PriceU — unique
  on 1 720 of 1 720. **Per month**, unlike C9.
- 🔴 **`Affiliate` = `HEGO TEST Stainless Steel & Aluminium` on every row.** The
  database these exports come from is named as a **test** copy. Worth knowing
  before anyone treats a number here as the real ledger.

## 29. Profit margin, and the Excel error code

`Profit margin` = `Profit` ÷ `Revenue`, a fraction (not a percentage) — 0
mismatches on both screens. When revenue is `0` the cell holds
**`-2146826252`**, which is Excel's internal code for **`#DIV/0!`** (54 rows in
C9, 395 in C10). **It is an error value, not a number** — any import or harness
check must read it as "no margin", not as a huge negative. Our reporting helper
`profitMarginPercent` returns `0` there, which is the right on-screen reading.

`Region number` is `0` on every row of both — screens five and six.

---

# Part 8 — Customer revenue per revenue group with split order types (C11)

From `Downloads`, 14-9-2026. **27 columns, 1 778 rows** —
`exports/c11-customer-revenue-per-revenue-group-split-order-types.tsv`. Same
invoice window as C9/C10/B4.

## 30. 🔴 "Order type" is two axes, and the export has both columns

The grid carries **two columns both named `Order type`**:

| Column | Values | What it is |
| --- | --- | --- |
| first `Order type` | `Stk` 1 346 · `CD` 179 · blank 253 | **stock vs direct delivery** — the line's supply route (blank on charges) |
| second `Order type` | `Normal` 1 756 · `Call-off` 16 · `Rush` 6 | **the order's `orderType`** — B1's column |

C11 is C10 with the second axis added, and nothing else changes:

- **Revenue, profit, kg, invoice lines and `Sales (PriceU)` total identically**
  to C10 (9 062 694.23 / 1 626 808.42 / 4 527 322.53 / 8 691).
- **Every one of C10's 1 720 cells equals the sum of its C11 split rows.**
- Joining B4 lines to B1 orders: `Call-off` **165 672.26** and `Rush`
  **29 026.99** — **both exact** against C11. Lines whose order is not in the B1
  window fall under `Normal`.
- **Charges always count as `Normal`** (253 of 253).
- **`Call-off` and `Rush` only occur with `Stk`** — never `CD`. No `Ex works`
  in the window.

**What that means for our code:** `/customer-revenue-per-revenue-group-split`
builds its "order type" from the **boolean flags** (`isConsignment`,
`isIncidental`, `isInternalProduction`, `isCustomerMaterial`, `isPickup`). That
is not the axis the reference splits on. It must split on **`Orders.orderType`**
(normal / call-off / rush / ex works) and show **`Stk`/`CD`** beside it — and it
inherits both C10 bugs (options in the product's group, charges dropped).

Minor: the grid key is not unique on 39 rows — two rows can share every visible
dimension, so the reference groups on something it does not display.

---

# Part 9 — Contracts per Customer / Prospect (C6)

From `Downloads`, 14-9-2026. **18 columns, 173 rows** —
`exports/c6-contracts-per-customer-prospect.tsv`. One row per contract linked to
a company: **84 companies** (56 customers, 28 prospects), **5 contract codes**.

## 31. 🔴 Every new customer gets the two charge contracts, automatically

| Contract code | Linked to | Contract group | Contract type ([contracts.md](contracts.md)) |
| --- | --- | --- | --- |
| `PACKAGING COSTS` | **82** | — | Surcharges |
| `PALLET COSTS` | **82** | Pallet costs | Surcharges |
| `SS` | 6 | — | *(test, `Price date` 13-6-2026)* |
| `BB` | 2 | Pallet costs | Gross prices *(test)* |
| `KK` | 1 | Pallet costs | Gross prices *(test)* |

- **78 companies hold exactly the pair** `PACKAGING COSTS` + `PALLET COSTS`, and
  4 more hold the pair plus a test contract.
- **On all 82, both contracts share the same `Starting date`.** They are
  attached in one act, not by hand one at a time.
- The starting dates run **30-9-2024 → 16-6-2026** — only companies created
  since the system went live. 45 of the 84 have codes ≥ `13700`, the newest in
  the file.

That is the `Link to new customer` tick on the contract — our
`Contracts.linkToNewCustomer` column. **In the reference it does something: it
copies the contract onto every company created after it**, and the new
company's creation date becomes the contract's starting date. Nothing in
`apps/dashboard` reads that column.

## 32. ⚠️ Holding the contract does not decide who is charged

Against the B8 charges export:

| | Holders | Customers charged | Both | Charged **without** the contract |
| --- | --- | --- | --- | --- |
| Packaging | 82 | 66 | 14 | **52** |
| Pallet | 82 | 73 | 17 | **56** |

Most charged customers are **older than the contracts** and have none; the
surcharge was typed onto their order directly (B8 names a `Contract` on only
8 of 1 504 charge rows). So the contract is **a default for new customers**,
not the rule behind every charge. A customer with no contract can still be
charged, and one with the contract often is not.

## 33. The columns, and which ones are alive

- **`End date` = `2958465` on all 173 = 31-12-9999.** The "no end" sentinel —
  same as the purchase side.
- `Price date` is filled only on the six `SS` rows. `Contract group` only where
  the contract itself has one.
- **Dead:** `Preference` (0), `Sales` (0), `Revenue` (0),
  `Most recent invoice date` (empty) on all 173 — the per-link counters are
  never maintained. `Region number` 0 (screen seven).
- `Customer group` is filled on only 23 — the new companies mostly have none.
- The test companies are here in force: `Adnan`, `Adnan2`, `zakaria test`,
  `zakaria 5`, `shadi`, `Taym`, cities `ss`, `gfdgdf`, `hadi`.

**What that means for our code:** `getContractsPerCustomer`
(`contracts/actions.ts`) `leftJoin`s **every** `CompanyAddresses` row for the
city, so a company with three addresses shows each contract **three times**.
C4 proved there is exactly one visiting address per company — join on that.
The screen also lacks `Representative`, `Customer group`, `Starting date`,
`End date` and `Region`.

---

# Part 10 — Customer revenue (C8)

`Overviews → Customers → Customer revenue`, `View` = `-empty-`,
**`Company code` from `0`, `Year` = `2025`, `Month` = `5`**. **75 columns,
1 724 rows** — `exports/c8-customer-revenue.tsv` (file
`Customer revenue 2025-5.xlsx`). One row per customer, sold to or not.

⚠️ **How the filter works.** A first run left `Year` blank (so 2026) and every
figure came out `0`; a second put the date `1-5-2025` into `Company code` and
returned nothing. The screen takes **one year and one month**, not a range, and
`Company code` is the first box — easy to type a date into.

## 34. 🔴 "This year" means the selected month, and it is exact

With Year 2025 / Month 5 the `… this year` columns hold **May 2025 only** —
not January–May. Against B4 invoice lines dated May 2025, per customer, on
**90 of 90** customers:

| C8 column | B4 source | Match |
| --- | --- | --- |
| `Revenue of material this year` | `Revenue products` | **90 / 90** — total 846 692.76 |
| `Revenue options this year` | `Revenue options` | **90 / 90** — total 772.10 |
| `Revenue surcharges this year` | surcharge lines | 89 / 90 |
| `Revenue this year` | material + options + surcharges | 89 / 90 |
| `Kg. this year` | `Weight (kg)` | 90 / 90, **rounded to whole kilos** |
| `#Invoice lines (selection period)` | order lines only | **90 / 90** — 497, surcharge lines not counted |
| `#Invoices (selection period)` | distinct invoices | 89 / 90 |
| `Profit margin this year` | profit ÷ revenue | fraction, `#DIV/0!` code on zero revenue |

**The one miss is customer `11163` Dutch Blower**, and it is the same
−250.00 on every mismatched column: a **`Surcharge`-type invoice with no lines
and no order** (B3 `501694`, −302.50 incl. 52.50 VAT, dated **8-8-2025**). C8
counts it in May; B4 has no line for it. **A header-only surcharge invoice is
dated by some other rule than its invoice date** — unresolved, one instance.

So C8 carries the **same three-way split** C10 proved — material, options,
surcharges — as columns instead of revenue groups. Options profit is `0`
(sold at cost, again).

## 35. ⚠️ The comparison columns — one is empty data, one is broken

- **`… last year` (ten columns) = `0` on all 1 724 — correct.** The test
  database's first invoice is **7-1-2025** (B3: 1 680 invoices in 2025, 3 in
  2026, none in 2024). There is no 2024 to compare with. *Corrected 14-9-2026 —
  first written up as dead.*
- **`… last month` (ten columns) = `0` on all 1 724 — not explained by data.**
  B4 holds **2 116 324.53** of April 2025 revenue, so with Month = 5 these
  should be filled. Either "last month" means something other than the month
  before the selection, or the columns are broken.
- `Trend` is `0` everywhere, which fits: it compares with last year.

Also mislabelled: **`Profit margin for allowances this year` is the surcharge
margin** (profit ÷ revenue of surcharges, 30 of 30).

## 36. The rest of the 75 columns

- 🔴 **`Active`** — `False` on **45** customers, and the names say why:
  `FAILLIET 03-04-2015`, `Zie relatie Rubix`, `GEBRUIK POSTMUS2`. This is the
  archive flag §9 said was missing — it exists, it just is not shown on C2. Item
  D1 (`Inactive companies`) will read it.
- **`Point of attention`** (784) is the company remark from C5.
- `Last order date` (337), `Last call date` (95), `Last visit date` (2),
  `Called this year` (18), `Visits this year` (1) — the CRM counters are
  maintained, and barely used.
- `Representative` = **`INAD`** on 17 customers and `Account manager` = `INAD`
  on 5 — the vendor's login again (K11).
- **Dead:** every target and potential (`Target year revenue`,
  `Target this year`, `Target last month`, `Potential annual revenue/sales`,
  `Target annual sales`), `Visit frequency`, `Call frequency`, `Employees`,
  `Classification`, `Latest visit report`, `Competitors (Revenue share)`,
  the three `Purchase organization` columns. `Region number` `0` (screen eight).
- `Customer group code` is `0` on 1 723 rows and `30` on one — the group has a
  name and effectively no code.

**What that means for our code:** `/customer-revenue` shows one revenue figure
and computes profit as `amount − costAmount` across **every** invoice line. The
reference splits material / options / surcharges, counts only order lines in
`#Invoice lines`, and rounds kilos. It also has no `Active` column.

---

# Part 11 — Customerrevenue, -sales and -visits (C12)

`Overviews → Customers → Customerrevenue, -sales and -visits`. Filter block:
`Representative`, `Company code`, `Current year` (from only) — set to
**`Current year` = `2025`**, codes open. **21 columns, 809 rows** —
`exports/c12-customer-revenue-sales-and-visits.tsv` (file
`Customer revenue sales visits 2025-5.xlsx`). The view is translated:
`SS 304`, `Grinding/Foiling`, `Other allowances` are the Dutch `RVS 304`,
`Slijpen/Folien`, `Overige toeslagen`.

## 37. 🔴 A whole year per customer × revenue group — exact against C10

This screen has **no month**. `Current year` = 2025 means **all of 2025**:

- `Revenue current year` totals **9 047 997.80 = B4 `Revenue line` for every
  2025 invoice line**, order lines and surcharge lines together.
- Per **customer × revenue group**, **809 of 809 cells** equal C10 summed over
  2025 — revenue **and** kilos.
- So it inherits C10's split (option revenue in the option's group, charges in
  their own groups) and C10's **double-counted kilos** (4 519 951.7 kg).

## 38. 🔴 Two customer numbers — `Company code` ≠ `Debtor number`

C12 and C8 key the customer by **`Company code`** (`11163`). C10, C11 and C9
key it by **`Debtor number`** (`12494` for the same Dutch Blower). B4 carries
both and they map **one-to-one**. A company has a relationship code *and* a
separate debtor account number — the second belongs to the ledger. Any
cross-screen join, and any import, must pick the right one; joining C10 to C8 on
the visible number matches only 672 of 1 720 rows, and by accident.

## 39. Mostly dead, like C8

- `Revenue last year`, `Revenue 2 years ago`, `Kg. last year`, `Kg. 2 years ago`
  — **`0` on all 809, correctly**: the test database has no invoice before
  7-1-2025 (§35).
- **The visits half is empty:** `Target #visits / year`, `#Visits current year`,
  `#Visits last year`, `#Visits 2 years ago` all `0`. The screen is named for
  visits and none are recorded.
- `Competitors (Revenue share)` empty; `Region number` `0` (screen nine).
- Only customers **with 2025 revenue** appear (290), unlike C8 which lists all
  1 724.

---

# Part 12 — Visit schedule (C13) and To visit/call (C14)

Both from `Downloads`, 14-9-2026:

| | Rows × columns | File |
| --- | --- | --- |
| C13 Visit schedule | 2 531 × 25 | `exports/c13-visit-schedule.tsv` (`Visit Schduled.xlsx`) |
| C14 To visit/call | 2 531 × 22 | `exports/c14-to-visit-call.tsv` (`To visit call.xlsx`) |

## 40. One list, two screens

**C14's 22 columns are C13's first 22, identical on 2 531 of 2 531 rows.** C13
adds three: `Month` (`september` on every row — the current month), `Call` and
`Visit` (both `False` on every row). So *To visit/call* is the relationship
list, and *Visit schedule* is the same list with a per-month **plan** ticked
onto it — and **nothing is planned** for anyone. `Call upcoming month` and
`Visit upcoming month` are empty on both.

The population is **2 531 companies** — the same count as C5's remarks report,
and it includes the 2 188 customer/prospect companies of C3 plus others.

## 41. What the columns are built from

- **Visiting address** = the company's C4 visiting-address row, **2 531 of
  2 531**. Country is spelled out here (`Nederland`), where C3 left it blank.
- **`Contact person`** is **one** contact per company: the first contact row in
  1 925 cases, a sequence-`1` contact in 119, another in 89. There is no
  "primary contact" flag — the screen takes the first. (Our screens do the same,
  via `MIN(Contacts.id)`.)
- **`Revenue last 12 months` is live and correct.** It is non-zero on exactly
  three companies — `Douma Staal` 296.43, `Universal Steel Holland` 14 400,
  `SHS Lochbleche Butzbach` 20 000 — and each equals their B3 invoices from
  14-9-2025 onward, ex VAT. (`AVK Nederland`'s 666.00 in that window does not
  appear — one unexplained.) This is what proves §35's `last year` zeros are
  real data, not a broken column.
- `Last call date` on **129** companies, `Last visit date` on **3**. Calls are
  logged; visits are not.
- **Dead:** `Target year revenue`, `Revenue last month` (both `0`),
  `Region number` `0` (screens ten and eleven).

**What that means:** the call/visit planning feature exists and is not used.
A rebuild needs the call log (129 companies have one) far more than the
schedule.

## 42. Change visit schedule (C15) — the editable form of C13

`exports/c15-change-visit-schedule.tsv` (`Change visit schdueld.xlsx`),
**2 531 × 24**. Captured as an export rather than screenshots.

- **Identical to C13 on all 22 shared data columns, 2 531 of 2 531 rows.**
- It drops C13's `Month` column (the month is the screen's own selection) and
  keeps **`Call`** and **`Visit`** — **empty** here where C13 prints `False`.
  Those two are the tick boxes a user sets to plan a call or visit for the
  month; C13 reads the result back.
- Nothing is ticked, consistent with §40. The three screens are one table
  seen three ways: the list (C14), the plan (C13), and the place the plan is
  edited (C15).
