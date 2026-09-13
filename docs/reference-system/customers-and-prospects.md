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
