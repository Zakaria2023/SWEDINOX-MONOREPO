# Companies group (items D1–D6)

`Overviews → Companies`.

---

## D1. Inactive companies — 93 rows × 16 columns (16-9-2026)

`exports/d1-inactive-companies.tsv` (`inactive company.xlsx`). No filter-block
screenshot came with it.

**Columns:** `Code` · `Company` · `Visiting address` · `Postal code` · `City` ·
`Country` · `Customer` · `Prospect` · `Supplier` · `Processor` ·
`Transporter` · `Agent` · `Other` · `Last modified by` · `Date last modified` ·
`Representative`.

### 🔴 Inactive is a flag someone sets, not "no orders lately"

- **Every role appears**, not only customers: Customer 45 · Supplier 33 ·
  Prospect 17 · Transporter 8 · Processor 2 (Agent and Other 0). A rule about
  orders could not make a supplier or a transporter inactive.
- **The names say why a person switched it off**: `NIET GEBRUIKEN` (*do not
  use*, 2), `FAILLIET 03-04-2015` (*bankrupt*), `Zie relatie Rubix` (*see
  company Rubix* — 3 duplicates merged into one), `Zie Hego 4`, `X`. Six have
  their address overwritten with `x` / `X`.
- `Last modified by`: **`BATCH` 54**, all on **24-12-2024** (53) or January 2025
  — the go-live data load, which brought dead companies over already switched
  off. The other 39 are people: ARIAN 29, INAD 4, SHARIF 3, RAYMOND 2, MARCO 1,
  spread over Sept 2024 – May 2025.
- `Date last modified` is the last edit of the company, not necessarily the day
  it was switched off.

### Other facts

- `Country` is **Dutch for the Netherlands** (`Nederland` 66) but English for
  the rest (`Germany` 9, `Belgium` 5, `Turkey` 4, …) — stored data.
- `Representative`: `HEGO` 35, `INAD` 27, blank 31.
- The 45 inactive **customers still appear in C8 Customer revenue** — being
  inactive hides a company from pick lists, it does not erase its history.
- ✅ **Answers K8** in part: companies *are* typed `Processor` and `Transporter`
  (e.g. `b.v. P. Cuveljé & Zn. Hoornaar`, `INOX TRANSPORT sp. z o.o.`). These two
  are inactive as companies, yet `CUVELJE` and `INOX TRANSPORT` still ran trips
  into 2026 in F4 — so a **vehicle is its own list**, not a link to the
  transporter company.

### Against `apps/dashboard` — ✅ built 16-9-2026

`Companies.modifiedByUserId` added and stamped by every company save; the
overview now shows only flagged companies with the 16 columns, role and
date-last-modified filters, and paging. Before:

`/inactive-companies` lists companies flagged `isInactive` **or** customers /
prospects with no order in 12 months, with columns code, company, city,
representative, customer group, region, last order date. The reference shows
**only the flag**, for every role. To match: drop the 12-month rule; show the 16
columns — address, postal code, country, the seven role ticks, last modified by
and date, representative.

---

## D2. Texts — 259 rows × 29 columns (17-9-2026)

`Overviews → Companies → Texts`. One filter only: **`Company code` from / u&frasl;i**
(`zzzzzzzzzzzzzzz` sentinel). No date filter, no `View` saved — the grid opens
on everything. The row menu holds **`Show Company` and nothing else**.

### What a text is

**A note stuck to a company that prints on chosen documents.** Not a template,
not a letter: one free-text block, plus a tick per document it should appear on.
Nothing else links it — no contact, no address, no product, no language column.

The 29 columns are: `Company code`, `Customer` (name), `City`, then the three
role ticks `Customer` / `Supplier` / `Processor`, then `Text group`, `Text`,
`Categories`, `Modified on`, `Created on` — and then **18 boolean columns, one
per document**:

`Visit report` · `Purchase Quote Request` · `Purchase Order` ·
`Purchase Order Tool Tip` · `Purchase Return Order` · `Customer label` ·
`Loadlist` · `Warehouse Order` · `Sales Quote` · `Sales Order` ·
`Sales Order Tool Tip` · `Production Order` · `Ride list` ·
`Transport planning` · `Sales Invoice` · `Waybill` · `Website after` ·
`Website in advance`

### 🔴 `Categories` is not a field — it is the 18 ticks, written out

Proved **258 of 259 rows**: the Dutch list in `Categories` is exactly the set of
boolean columns reading `True`, comma-separated.

| `Categories` word | Column |
|---|---|
| `MagazijnOpdracht` | `Warehouse Order` |
| `ProductieOpdracht` | `Production Order` |
| `Laadlijst` | `Loadlist` |
| `Vrachtbrief` | `Waybill` |
| `Ritlijst` | `Ride list` |
| `Transportplanning` | `Transport planning` |
| `VerkoopFactuur` | `Sales Invoice` |
| `Order` | `Sales Order` |

The single exception is the test row `13761 zakaria test`, created 15-6-2026,
whose `Categories` already reads **`Sales Invoice`** in English — so the string
is rendered from a translation table at read time, not stored. There is nothing
to model here: store the ticks, render the list.

### Only 8 of the 18 documents have ever been ticked

| Document | Rows |
|---|---|
| `Warehouse Order` | 198 |
| `Production Order` | 198 |
| `Loadlist` | 72 |
| `Waybill` | 71 |
| `Ride list` | 65 |
| `Transport planning` | 48 |
| `Sales Invoice` | 5 |
| `Sales Order` | 2 |

**Ten are `False` on all 259 rows**: `Visit report`, the four purchase ones,
`Purchase Order Tool Tip`, `Customer label`, `Sales Quote`,
`Sales Order Tool Tip`, `Website after`, `Website in advance`. They exist as
columns and carry nothing — the ticks that matter are warehouse, production and
the four transport documents.

### The texts fall into three kinds

1. **Delivery windows — 174 rows**, `Warehouse Order` + `Production Order`. The
   customer's receiving hours, in the customer's own language, often with a
   phone number: *"Warenannahme Vreden: 6:00-13:30u (notfaellen: Hr.Kluempers
   0049 2564 92230)"*, *"Opening times: 08.30AM - 4PM"*, *"Vrijdag middag
   gesloten !"*. They print for the **warehouse and the saw**, so whoever
   prepares the goods knows when they may be delivered.
2. **The export declaration — 45+ rows**, the four transport ticks and
   sometimes `Sales Invoice`. A legal sentence, always some variant of *"The
   exporter of the products covered by this document (Exporter Reference No
   NLREX4577) declares that … these products are of EU preferential origin"*,
   the longest also declaring **no Russian-origin iron or steel under Regulation
   833/2014 as amended by 2022/2474**. Three authorisation numbers appear —
   `NLREX4577`, an older `Customs Authorization No NL/657/03/1287` — so the text
   is per customer because the **customer's** paperwork decides which wording
   applies. This is a compliance obligation, not a nicety.
3. **Notes that print nowhere — 8 rows**, every tick `False`. They are visible
   only on the company. ⚠️ **All but one of them are login credentials to the
   customer's or supplier's portal, stored in clear text** (e.g. *"Inlognaam:
   …@hego.nl / Wachtwoord: …"*). Whatever we build, this is where users will put
   passwords, because that is what they did here. It argues for an explicit
   "internal note" kind and against ever exporting the text column casually.

### Other facts

- **A company may have several texts** — 259 rows over 233 companies; 25
  companies have 2 or 3. The usual pair is *delivery window* (warehouse) +
  *export declaration* (transport).
- **`Text group` is filled on 2 rows of 259**, both `1. Export teksten`. The
  numbering says it is a list someone meant to grow. It is a lookup on the text,
  not a category of the ticks.
- **`Text` is short and plain** — 0 to 368 characters, average 99, 91 of 259
  multi-line. **No placeholder syntax on any row** (no `{customer}`, no `<naam>`):
  the text prints verbatim. One row is empty (`11055 Dejond NV`, ticked
  `Sales Invoice`) — an empty text is allowed.
- **221 of 259 were created on 25-9-2024 at 18:49**, seconds apart — the
  migration script INAD ran that day ([error-log.md](error-log.md) §3). The rest
  were typed by hand between 7-1-2025 and 7-5-2025, one a day, plus the 15-6-2026
  test row. So texts are **maintained by users**, at a trickle.
- `Modified on` differs from `Created on` on 51 rows, so texts are edited in
  place.
- The role ticks are the company's, not the text's: 183 customer only, 63
  customer + supplier, 6 all three, 3 supplier only, 3 with no role at all.

### Against `apps/dashboard` — ✅ already built, and it matches

`/texts` and the `Texts` table were built before this capture, and the export
confirms them: **all 18 boolean fields exist with exactly these names**, the
company link, the `TextCategories` lookup (`Text group`), and the overview's
columns are the same 29 in the same grouping. `textUsageCategories` renders the
`Categories` string from the ticks, which is what the reference does.

Three differences were found and closed on 20-9-2026:

- **The title.** `Texts.title` is `notNull` in our schema and the reference has
  no title column at all — not in the grid, and not in the company panel, which
  shows only `Categorieën` and `Tekst`. Ours held a copy of the text group's
  name, so the grid printed the same word twice. The column is gone from the
  overview, the export, the detail page and both company panels, which now show
  the text itself. The database column stays, because a text written on an
  *order* does carry a real title — a company text writes the group name, or
  nothing.
- **The scope.** Our `Texts` can hang off ten other documents (order, quote,
  purchase order, product group, …) and the overview listed all of them. The
  reference screen shows company texts only, so ours does now; a text written on
  one order belongs on that order.
- **The tick order.** Same eighteen, different sequence. The list now follows
  the reference's grid order, and it is declared once — the edit dialog reads
  the same array as the overview, so the two cannot drift.

Two more, decided at the same time:

- **The text group is no longer required.** The reference fills it on 2 rows of
  259. Ours refused to save without one, which is a wall in front of the only
  thing anybody does here — type an opening time and tick the warehouse.
- **The grid no longer clips the text.** An opening time cut off at
  `Warenannahme Vre…` tells nobody anything, and the reference shows it whole.

### 🔴 What still does not match: nothing prints

We store all eighteen ticks, show them, export them — and **no document we
generate reads one**. Ticking `Waybill` on the export declaration changes
nothing about the waybill. The record matches the reference; the consequence
does not exist yet. Until the printing side reads these ticks, this screen is an
archive rather than a working feature — which matters most for the export
declaration, where the missing sentence is a customs problem, not a cosmetic
one.

The company record carries the same list: a **`Texts` panel** between
`Selectioncodes` and `Total revenue`, with `New` / `Delete` / `View` and two
columns, `Categorieën` and `Tekst`. Its header reads **`0 texts`** while showing
one — a counter bug in the reference, not a data fact.

---

## D3. Communication settings — 3 rows × 11 columns (17-9-2026)

`Overviews → Companies → Communication settings`. One filter, `from` / `u⁄i`,
both empty, and `Show Data` returns **the whole table: three rows**. Toolbar:
`Save as Excel`, `Show in Excel`, `Print`, `Show Company`, and jumps to
`Purchase lines`, `Warehouse workorders`, `Orders and Quotes`,
`Production workorders`.

Columns: `Created on`, `Adjusted on`, `Modified by`, `Company code`, `Company`,
`Documenttype`, `Communication type`, `Shape`, `Contact name`, `Contact email`,
`Custom contact`. (The grid is cut off at the right edge of both screenshots,
so an extra column beyond `Custom contact` cannot be ruled out.)

### What it is: an override, not the sending rule

A row says **"for this company, send this one document type this way."** Three
rows exist in three years:

| Created | By | Company | Document type | Type | Shape | Recipient |
|---|---|---|---|---|---|---|
| 21-1-2025 | Adrie Noom | 11686 Holland Dak Accessoires B.V. | `Order status message` | `E-mail` | `PDF` | custom, an internal `@hego.nl` address |
| 3-3-2025 | Marco Borsboom | 11754 IBO Technik GmbH | `Bill of lading` | `E-mail` | *(blank)* | custom, an internal `@hego.nl` address |
| 7-6-2026 | Hamza Dabbagh | 13756 Zakaria | `Order status message` | `E-mail` | `SCSN` | custom, a personal address |

Two real rows and one test. So **this table is not how documents are normally
sent** — it is the exception list. The default routing for each document type
lives somewhere else (almost certainly the unopened `Vestigingsgegevens`
settings, the same place K1 hides), and a row here overrides it for one company.
Both real rows send to a Swedinox address, not the customer's — they are a
**copy-to-myself**, someone wanting to see the message go out.

### `Shape` is the payload format, and one of them is not a document at all

`PDF` on one row, **`SCSN` on another**, blank on the third. SCSN is the
**Smart Connected Supplier Network**, the Dutch supply-chain message standard —
so `Shape` is not "how it looks", it is **what is actually transmitted**: a
rendered PDF, or a structured message. Our enum already carries the whole list
(`pdf`, `scsn`, `sales_in_the_construction`, `edi4steel`, `text`, `peppol`),
which this capture confirms is the right shape of the field. `Shape` is
**nullable** — row 2 proves it.

### 🔴 The recipient is three columns, not one

`Contact name`, `Contact email`, `Custom contact`. On all three rows the first
two are empty and `Custom contact` holds a typed address. So a setting either
**points at a contact person of the company** — and then the address follows the
contact record, changing when the contact's email changes — **or holds a typed
address that never follows anything**. `Contact email` is displayed from the
contact, not stored on the setting.

On the company record the same rows appear in a **`Communication settings`**
panel, between `Communication` and `Contracts`, with `New` / `Delete` / `View`
and four columns: `Documenttype` (a dropdown in the row), `Communicatiewijze`,
`Vorm`, **`Gegevens`** — one recipient column, which the overview splits into
the three above.

### Against `apps/dashboard` — ✅ built 17-9-2026

`CommunicationSettings` exists with `documentType`, `communicationType`,
`shape`, `email`, `fax`, `modifiedByUserId`, and the enums already hold every
value seen here — `order_status_message`, `bill_of_lading`, `email`, `pdf`,
`scsn`. Two things to fix:

1. 🔴 **No contact link.** Our single `email` column collapses the reference's
   contact-vs-custom split. Needs `contactUuid` beside `email`, with the rule:
   a contact wins and its address is read live; `email` is the typed fallback.
2. 🟡 **`/communication-settings` is not an overview by our own rules.** It
   loads every row with `getCommunicationSettings()` — no paging, no filters, no
   search, no export — and shows `Code`, `Company`, `Document Type`,
   `Communication Type`, `Shape`, `Email`, `Fax`, `Created At`, `Updated At`.
   Missing against the reference: `Company code`, `Modified by`, `Contact name`,
   `Contact email`, `Custom contact`. `Fax` and `Code` are ours alone.

`CommunicationSettings.contactUuid` added, and `/communication-settings` is now
a paged overview carrying the reference's eleven columns — created on, adjusted
on, modified by (resolved through Clerk), company code, company, document type,
communication type, shape, and the recipient split three ways — with a column
picker, an export and filters on company, document type, communication type and
shape. A chosen contact wins and its address is read live; the typed `email` is
shown as `Custom contact` only when no contact is chosen.

Also worth noting: the table is keyed by autoincrement `id` with no `uuid`,
which is the only table in the app built that way.

---

## D4. Visits made — 166 rows × 16 columns (17-9-2026)

`Overviews → Companies → Visits made`, plus **one report opened** (`Baas Machine
Service B.V., 13-5-2025`), which is the same document D5 lists.

Columns: `Representative`, `Customer code`, `Company`, `Postal code`, `City`,
`Visiting date`, `Visited by`, `Contact person`, `Categories`, `Contact`,
`Took place`, `Bezoekredenen`, `Region number`, `Region`, `Customer group`,
`Customer group code`.

### 🔴 The visit side is alive — and C13/C14 said it was not

C13 `Visit schedule` and C14 `To visit/call` showed **2 531 companies with
nothing planned and every visit counter at `0`**. Here are **166 real contacts**
against 147 companies, 162 of them between January and May 2025 — 100 in April
alone. Both are true at once, because the counters on C12/C13/C14 are **batch
statistics** and `Maand statistiek` has not run since the copy was taken
([error-log.md](error-log.md)). This is the second independent confirmation of
that hypothesis, after the `… last month` columns of C8.

**So the planning half is unused and the doing half is not.** A representative
records what they did; nobody schedules what they will do.

### It is mostly the telephone

| `Contact` | `Took place` | Rows |
|---|---|---|
| Telephone contact | True | 147 |
| Visit | False | 9 |
| Telephone contact | False | 7 |
| Visit | True | 3 |

**154 calls to 12 visits.** The screen is named for the rarer half. And
`Took place` is a **separate flag from the date** — 16 rows record a contact
that was planned and did not happen, and **the reference lists them here
anyway**. A visit report is written first and ticked afterwards; the checkbox on
the record reads `Bezoek/Telefonisch contact heeft plaatsgevonden`.

### 🔴 `Bezoekredenen` is plural — a visit can have several reasons

The header is `Bezoekredenen` (visit reason**s**), and two rows carry more than
one, comma-separated: `Omzet blijft achter, Offerteopvolging`, and one with
four. Seven values appear:

| Dutch (export) | English (on the record) | Rows |
|---|---|---|
| `Kennismaking` | Introduction | 89 |
| `Bezoekfrequentie` | Visit frequency | 33 |
| `Omzet blijft achter` | Turnover is lagging behind | 25 |
| `Offerteopvolging` | Quotation follow-up | 13 |
| `Potentiële klant (prospect)` | Potential customer (prospect) | 1 |
| `Klacht` | Complaint | 1 |
| `Op verzoek van klant` | At customer's request | 1 |

The export prints Dutch and the record's dropdown prints `Visit frequency` in
English, so the reason is **stored as a code and rendered through a translation
table** — the same mechanism as the `Categories` string on D2. Nothing here is
Dutch stored data.

⚠️ **`Potentiële klant (prospect)` is not in our `visitReportReasons`.** Ours has
six; there are seven.

### The record

`Visit report <company>, <date>`. Left column is the form:

`Bedrijf` (company code + name, greyed) · `Vertegenwoordiger` (`-leeg-`) ·
`Bezocht door` (dropdown) · `Bezoekdatum` · `Bezoektijd` (`15:38` — a **time**,
which the export has no column for) · a **radio pair `Visit` / `Telephone
contact`** · the `heeft plaatsgevonden` checkbox · `Bezoekreden` ·
`Aandachtspunt` (free text) · `Opmerkingen` (free text).

Right column is read from the company and not editable: address, postal code,
city, telephone, fax, and a `Contact` dropdown (`-empty-` on this one; the
export fills `Contact person` on 133 of 166).

Panels: `Documents` (0) · the report · **`Visit result`** (a third free-text
box) · `Categories` · `Complaints` · **`Readers`** · `Revenue` · `Qoutes` *(sic)*
· `Total revenue`. Toolbar: `Show company`, `Print report`, `Show PDF` (greyed).

**`Readers` is a distribution list**: `Functionary` / `To read` / `Read`, one row
per employee — `Arian Bloks`, `Cherice van Rooyen`, `Benno Vos`, all four boxes
empty here. A visit report is meant to be circulated and ticked off, exactly like
F7 `Read external documents` does for external documents. Neither was ever used.

### Other facts

- `Categories` is filled on **1 row of 166** (`Wishing you next visit,
  Acquisition`) and is multi-valued, matching our three-value
  `visitReportCategories`.
- `Representative` is the **company's** rep, `Visited by` is **who made the
  contact**, and they differ on 102 rows (`Arian Bloks` calling on `Hego`'s
  accounts).
- `Region number` and `Customer group code` are **`0` on all 166 rows** — dead
  sentinel columns, like the ones on the purchase screens. `Region` (17 values)
  and `Customer group` (12 values) carry the real data, blank on 26 and 53 rows.
- 19 companies were contacted twice. Nothing is recorded outside
  October 2024 – May 2025 except three test rows from June 2026.

### Against `apps/dashboard` — ✅ built 17-9-2026

`VisitReports` already had the company, representative, visitedBy, contact,
contactMethod, date, **time**, `hasTakenPlace`, attentionPoint, remarks, a
`categories` json and a **`readers` json** of `{userId, toRead, read}`. Four
things were fixed:

1. **`visit_reason` became `visit_reasons`**, a json list, the way `categories`
   already was — and the enum gained its seventh value,
   `potential_customer_prospect`. The one stored value was carried into the
   list. `visitReasonsLabel` renders it the way the reference's column writes
   it, and `nextVisitDateForReasons` takes the **soonest** date the several
   reasons ask for: turnover slipping (8 weeks) plus a quote to chase (2) is due
   back in 2, because the quote will not wait.
2. **`/visits-made` no longer filters `hasTakenPlace = true`.** It lists every
   recorded contact, carries `Took place` as a column, and offers it as a
   filter — which is what the reference does with its 16 rows that never
   happened.
3. **`visitResult` added** for the record's third text box, on the form, the
   detail and the export.
4. `/visits-made` is now paged, with search, a column picker, an export and
   filters on date, contact method, took place, reason, category, region and
   customer group. It carries 14 of the reference's 16 columns plus the time;
   the 2 left out are the dead `0` sentinels.

One thing fixed on the way: the visit report's edit page saved the reason with
the *report* section while the form edits it under *Details*, so saving Details
never wrote it. The reasons and all three text boxes now belong to Details.

---

## D5. Visit reports — a printed report of the same 166 visits (17-9-2026)

`Overviews → Companies → Visit reports`, `visit date from 1-1-2024 to
17-9-2026`. **It is a Report, not a grid** — the same shape as C5 `Remarks per
company`: Excel gets one column, 998 lines, no header row and no columns to
speak of. `Blz. 1 van 1` sits in D3 as page furniture.

It prints **166 blocks**, one per visit, exactly the population of D4:

```
Hego (Arian Bloks)
Budi B.V., Ooltgensplaat, L. Dorsman
9-4-2025 14:56, Kennismaking
Contact: Telephone contact, Took place: yes
```

and a fifth line when the visit has categories:

```
Wishing you next visit, Acquisition
```

### It reconciles to D4 exactly, and adds one field

Every block matches a D4 row on company + date (165 of 166 by automatic match,
the last by hand). The 33 blocks whose second line ends in a bare comma are the
33 D4 rows with no `Contact person`.

**The first line is `Representative (Visited by)`, with the visitor in
parentheses only when the two differ** — `Hego (Arian Bloks)` 102 times,
`Hego` 39, `Arian Bloks` 21, and `(Arian Bloks)` / `(Hamza Dabbagh)` for the two
reports whose company has no representative. That is D4's two columns rendered
into one string, and it confirms the reading: **`Representative` is the account's
owner, `Visited by` is whoever actually made the contact.**

The one thing it carries that the D4 grid does not is the **time** —
`9-4-2025 14:56`. Our `VisitReports.visitTime` already holds it.

### What it does not carry

**None of the free text.** `Aandachtspunt`, `Opmerkingen` and `Visit result` are
on the record and appear nowhere in this report, nor in the D4 grid. So the
written substance of a visit is only ever readable **one record at a time** —
there is no screen in the reference that lists what was said. Nothing to build
against; our record already has two of the three boxes (see D4).

Also note the report prints the reason in **Dutch** (`Bezoekfrequentie`) while
the record's own dropdown prints it in **English** (`Visit frequency`) — the
reference translates inconsistently between its screens. We render one language,
so this is a non-issue for us beyond confirming the value is a code.

### Against `apps/dashboard` — nothing new

D5 adds no field, no column and no rule that D4 did not already give. `/visit-reports`
exists and reads the same table. The work queued by D4 stands unchanged.

---

## D6. Address distances — 481 rows × 5 columns (17-9-2026)

`Overviews → Companies → Address distances`. Columns: `Country`, `City`,
`Street`, `Postal code`, **`Km`**. Row menu: **`Edit selected line`** and
nothing else.

### 🔴 It is not a distance between two addresses — it is the distance from us

Only one address per row and one `Km`. The origin is proved by the **13 rows
that read `0`**: every one of them is **`Bolderweg 10, 1332 AT, ALMERE`**, in
thirteen spellings — `Bolderweg`, `Boldereweg`, `Bolderwweg`, ` 10`, postal
`1322 AT` vs `1332 AT` vs `1332AT`, two with no city and three with no postal
code at all. That is **our own depot**, zero kilometres from itself, entered
thirteen times by different hands.

The numbers behave like road distances from Almere and nothing else:

| Country | Rows | Median km | Range |
|---|---|---|---|
| `Nederland` | 295 | 97 | 0 – 245 |
| `Germany` | 73 | 260 | 143 – 698 |
| `Belgium` | 40 | 200 | 128 – 314 |
| `United Kingdom` | 14 | 768 | 616 – 935 |
| `Spain` | 10 | 1 548 | 1 415 – 2 050 |
| `Italië` | 9 | 1 076 | 1 054 – 1 155 |
| `Portugal` | 6 | 2 078 | 2 064 – 2 100 |
| `Turkey` | 3 | 2 648 | 2 615 – 2 732 |

Overall min 0, max 2 732, median 136.

### The kilometres come from Google, one row at a time, by hand

`Edit selected line` opens **`Bewerk adres afstand`** — the same five fields,
editable, with two buttons and one that matters:

> **`Geselecteerde regel KM via Google bepalen`** — *determine the KM of the
> selected line via Google*

So the reference **calls a Google distance lookup per row, when a user asks for
it**, and stores the answer. It is not computed at planning time, not refreshed,
and not done in bulk: **481 rows against the 4 739 addresses of C4** — a
distance exists only where somebody once pressed that button. `Km` is a whole
number; nothing carries a route, a duration or a date of lookup.

### 🔴 What it is for: the transporter tariff is banded by kilometre

Our `TransporterCosts` already prices a transporter by `fromKm` / `untilKm`
(and `fromKg` / `untilKg`, per validity window). **D6 is where that kilometre
comes from.** The chain is: delivery address → its `Km` row → the transporter's
cost band → the trip's transport cost. Nothing in `apps/dashboard` closes that
chain today, and F4 `Transport by region` groups stops by the address's coarse
`region` text instead.

So **region is for grouping the work, kilometres are for pricing it.** They are
not alternatives, and D6 settles that distance is a real, stored, per-address
number rather than something the reference derives.

### Other facts

- **481 rows, 481 distinct `(country, city, street, postal)` keys** — no
  duplicates, yet the depot appears thirteen times, because a row follows an
  **address record**, not a unique place. Typos make new rows.
- `Country` is stored data and mixed: `Nederland` and `Italië` in Dutch,
  `Germany`, `Belgium`, `Spain` in English, plus the codes **`BE2`** and
  **`GB2`** (3 rows) and 2 rows with no country. Same disease as D1's `Country`
  — see [ENGLISH-ONLY-TODO.md](ENGLISH-ONLY-TODO.md) §3.
- 13 rows have no postal code, 3 no city, 1 no street.

### Against `apps/dashboard` — 🟡 the screen is built, the costing chain is not

`AddressDistances` holds `country`, `city`, `street`, `postalCode` and `km` —
the five reference columns. `/address-distances` is now a paged overview with
those five, a column picker, an export, search on city, street and postal code,
and filters on country, company and a kilometre range. Its row menu holds the
one action the reference has, **`Edit selected line`**, opening the address and
its kilometres in a dialog.

Two things remain, on purpose:

1. 🔴 **Nothing reads `km` yet.** `TransporterCosts.fromKm`/`untilKm` exist and
   no code picks a band from a delivery address. **This needs a decision before
   it can be built:** no table in the app holds a trip's cost —
   `TransportTrips` carries vehicle, stops, kilos and colli and no money — so
   where the computed cost lands is a design question the captures do not
   answer. Guessing it would invent a model the reference has not shown us.
2. 🟡 **No lookup.** The reference's one button is a Google call
   (`Geselecteerde regel KM via Google bepalen`). Ours has no equivalent, so
   distances are typed. Wiring one up needs a Maps key and a decision about
   calling out to Google at all.

**We carry a `companyUuid` the reference does not have.** There is no company on
its screen: a distance belongs to an *address string*, and
`/address-distances/[uuid]` already matches addresses back on city and postal
code, which is the reference's real key. The link stays as a convenience, not as
the identity.
