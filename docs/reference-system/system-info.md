# System info — the eight screens

Captured 15-9-2026. `Database tables` → [database-schema.md](database-schema.md),
`Errors` → [error-log.md](error-log.md). The other six are below.

| Screen | Captured as | State |
|---|---|---|
| Geopende werkpanelen (open work panels) | screenshot | 6 rows |
| Active Logins | 2 screenshots | 1 row |
| EDI | 2 screenshots | **empty** for 1-1-2024 → 15-9-2026 |
| Stock value check | 4 screenshots | ⚠️ **empty because `Year`/`Month` were blank** — redo |
| Security profiles | [exports/security-profiles.tsv](exports/security-profiles.tsv) | 4 685 rights × 7 profiles |
| Task profiles | [exports/task-profiles.tsv](exports/task-profiles.tsv) | 120 tasks × 6 profiles |

---

## 1. Open work panels — records are locked while open

Columns: `Work panel` · `Description` · `Opened` · `User` · `Telephone:`. Toolbar
action **`Delete Lock`**.

| Work panel | Description | Opened | User |
|---|---|---|---|
| Company | Vergeest Metaaltechniek Wijchen… | 13-9-2026 13:06 | Ayam |
| Product | Plaat Koudgewalst 304 1,2mm | 26-8-2026 11:27 | INAD |
| PurchaseOrder | Purchase order 401141, Holland… | 6-8-2026 11:41 | INAD |
| PurchaseOrder | Inkooporder 400875, Hego Prod… | 26-8-2026 12:13 | INAD |
| SalesOrder | Order 101714, Hego Production… | 1-9-2026 17:59 | Ayam |
| SalesOrder | Order 102141, Machinefabriek J… | 19-8-2026 12:33 | INAD |

- Opening a record **takes a lock** (`WORKPANEL_LOCK`), shown with the user's
  phone number so a colleague can call them. Locks survive for weeks when a
  session dies, and an administrator clears them with `Delete Lock`.
- Together with the `ConcurrencyException` entries in the error log, the
  reference uses **both** a lock on open and a version check on save.
- INAD (`040-2438407`) opened panels in August 2026, so INAD staff are still
  working on the test system.

**Ours:** no record locking. Two users can edit the same order and the last
save wins.

## 2. Active Logins — three ways in

Columns: `User` · `Logged in on` · `E-mail address` · `Telephone` ·
**`Access to easy2trade`** · **`Access to website`** · **`Access to scanner`** ·
`Last activity`. Toolbar action **`Delete Login`** (kicks a session).

One row: `Ayam`, `sales@swedinox.se`, logged in 15-9-2026 16:49, easy2trade ✓,
website ✗, scanner ✓.

A user can reach the system three ways: the desktop app, the customer website,
or a warehouse scanner, each allowed separately. Matches
`USERS.IsLoginAllowed` / `IsLoginOnWebAllowed` / `IsLoginOnScannerAllowed`.

## 3. EDI — never used

Filter `Creation date` 1-1-2024 → 15-9-2026, **no rows**. Columns: `Created on`,
`Adjusted on`, `Adjusted by`, `Final destination`, `Specification`, `Role`,
`Company`, `Work panel`, …, `Receive data storage`, `Receive data`,
`Data sent storage`, `Data sent`, `Invoked method`, `Retry possible`,
`Last error message`, `Error message`, `User interaction required`.

An inbound/outbound message queue with retry. **Not used in 2½ years**, so it's a
candidate for K3 (features we can decline).

## 4. Stock value check — redo with a year and month

Filters: `Year (Reference date)` and `Month (Reference date is last day of
month)`, both **blank**. Blank means the current month, and the database is
frozen in May 2025, so the empty grid proves nothing.

Columns, left to right: `Product code`, `Handelslengte` (trade length), `Vast`
(fixed), `Totaal Kg (start)`, `Totaal Kg (einde)`, `Totaal Hvh (start)`,
`Totaal Hvh (einde)`, `Hvh eh` (unit), `Totaal mm (start)`, `Totaal mm (einde)`,
`Waardering (start)`, `Waardering (einde)`, `Waardering …`, `Mutatie Kg`,
`Mutatie hvh`, `Mutatie waarde`, `Gip & vvp correctie`,
`Inkoopfactuur (correctie)`, `Gip correctie t.g.v. …`, `General ledger …`,
`Revenue group`, `Voorraad waarde …` (×2), `Totaal mutatie`,
**`Waarde verschil`**, `Voorraad waarde …`.

It reads as a **month-end stock valuation reconciliation** per product:
opening value + movements + average-price/FSP corrections + purchase-invoice
corrections should equal the closing value, and `Waarde verschil` is what does
not reconcile. That rule matters for FSP/Gip (K4, K5).

---

## 5. Task profiles — the work queue

The `Takenpaneel` (task panel) is a list of **worklists**, each a saved query
such as "orders with a financial block". A task profile decides which
worklists a user sees.

**Profiles and members** (row `Gebruikers`):

| Profile | Users |
|---|---|
| Applicatiebeheer (admin) | RAYMOND, MOHAMED, AYAM, WAHHAB, HAMZA, FURKAN, **BATCH**, SHARIF, **INAD**, **INADENG**, ANDRE |
| Commercie (sales) | MARCO, ADRIE, ARIAN, BENNO |
| Finance | — (nobody) |
| Geen taak (no tasks) | SLIJPMACHINE, DECOILER, MAGAZIJN2, PICKER, LASER — **machine and scanner accounts**; BNL, EXPORT, GUY |
| Logistiek | RICHARD, FARIEL, VINCENT, CHERICE |
| Website | PUBLICWEB, HEGO |

The document workflow is visible in the task names. Quotes, orders, return
orders, purchase orders and invoices all step through **Controleren (check) →
Fiatteren (authorise) → Definitief maken (finalise) → Bevestigen (confirm) →
Afdrukken en/of versturen (print/send)**.

**Tasks that bear on blocking and credit:**

| Task | Seen by |
|---|---|
| Orders met financiële blokkering | admin, Finance, Logistiek |
| Offertes met financiële blokkering | admin, Finance |
| Orders met commerciële blokkering | admin, Commercie, Finance, Logistiek |
| 🔴 **Orderregels met automatisch geblokkeerde leveringen** | admin, Commercie, Finance, Logistiek |
| 🔴 **Orderregels met handmatig geblokkeerde leveringen** | admin, Commercie, Finance, Logistiek |
| Orders met transportblokkering | admin, Finance, Logistiek |
| Orders met factuurblokkering | admin, Finance, Logistiek |
| **Klanten deblokkeren** (unblock customers) | admin, Finance |
| **Klanten zonder debiteurnummer** | admin, Finance |
| Bedrijven die nog niet zijn gesynchroniseerd / met synchronisatiefouten | admin, Finance |
| Geblokkeerde Vrd-leveringen terwijl voldoende voorraad | admin, Commercie, Finance, Logistiek |

The automatic/manual split confirms gaps **S2** and **S3**
([database-schema.md](database-schema.md)): a delivery block is either
automatic or manual, and each has its own worklist.

**Other worklists we have no equivalent for:** expiring customer contracts
and projects; call-off orders (first, next, last call-off); order lines late,
or with late or early purchases; lines with transport planned too late;
purchase order lines due soon, not received, or with shortages; missing
purchase certificates; products without VVP; incomplete delivery addresses;
EDI orders needing interaction; packing lists to print.

## 6. Security profiles — who may do what

**7 profiles:** Applicatiebeheer, Commercie, Finance, Logistiek,
Productie/Magazijn, Vertegenwoordiger (sales reps: BNL, EXPORT, GUY), Website.
Each right is **Wijzigen** (edit), **Zien** (view), **Uitvoeren** (may run an
action) or **Verborgen** (hidden), set on a work panel, a section, a single
field, an action or an overview. MOHAMED is in Logistiek here but in the admin
task profile; security and task profiles are set independently.

### Credit and blocking rights

| Right | Admin | Commercie | Finance | Logistiek |
|---|---|---|---|---|
| Financially blocked quotes and orders — overview **and `Deblokkeren`** | ✅ | hidden | ✅ | hidden |
| Credit information customers — overview | ✅ | hidden | ✅ | hidden |
| Order → Financiën: financial block, reason, invoice block | edit | view | edit | view |
| Order → **Authorize** (fiatteren) | ✅ | ❌ | ✅ | ❌ |
| Debtor → **Kredietlimiet** (insured) | **edit** | view | **hidden** | hidden |
| Debtor → Kredietlimiet onverzekerd | edit | view | edit | view |
| Debtor → uninsured *valid until*, *zelfbeoordeling*, open posts/orders **incl. VAT** | edit | hidden | hidden | hidden |
| Debtor → Geblokkeerd / Geblokkeerd door / Kredietruimte / oldest post dates | edit | view | edit | view |
| Purchase invoice → `Deblokkeren` | ✅ | ❌ | ✅ | ❌ |

**So:** releasing a financial block is a **Finance or admin** action; sales
cannot. The insured limit belongs to the admin alone. The rule reads amounts
**excl. VAT**, and the incl.-VAT figures are hidden from everyone but the admin,
which matches our credit check.

**Ours:** one `admin` role (`requireAdmin`). No per-profile rights, so there's no
way to let Finance unblock while sales can't.

### 🔴 The settings screens exist: `Vestigingsgegevens`

The menu bar has no settings, but the rights tree does. **`Vestigingsgegevens`**
(branch data, 72 rights) holds the whole configuration:

- `Instellingen Verkoop` → **`Klant instellingen`**, **`Order Instellingen`**,
  `Offerte`, `Factuur`, `Retourorder`, `BalieOrder`, `Afhaalbon`,
  `Bezoekrapport`, `Orderstatusbericht`, **`Omzetverdeling per maand`** (monthly
  revenue split, which feeds B17's distribution factor)
- `Instellingen Financiën` → **`Journaalpost instellingen`**,
  **`Multivers instellingen`**
- `Instellingen Inkoop` → Algemeen, Besteladvies, Inkoopaanvraag, Inkoopfactuur,
  Inkooporder, Inkoopretourorder, Leverancier
- `Instellingen Logistiek` → Levering, Magazijnopdrachten, StockOp, Transport,
  TransportPlanning, Voorraad
- `Instellingen Productie` → DSTV, easy2optimize, ProductieOpdrachten
- `Instellingen Communicatie`, `Handelsdocumenten`, `Scanner`, `StaalWeb`,
  `Website` (Firebase, push notifications)
- branch fields: name, addresses, VAT/KvK/EAN/GLN/CBS/**SFN** numbers, bank,
  warehouses, **`Vestigingskalender`** (branch calendar), main-screen title and
  colours

Next to it: **`Applicatie Instellingen`** (`BedrijfsCodeGenerator`, the company
code generator behind the 25-9-2024 renumbering, plus `Connecties`, `Modules`,
`Multicompany`, `Talen`), **`Batchtaken`** (the scheduler, with
`Status in statusbalk tonen`), `Taakinstellingen`, `Systeembeheer` →
`Archiveer opdrachten`, `Gebruikers`, and every lookup list (payment terms,
financial / delivery / stock / purchase-invoice block reasons, cancel reasons…).

**K1's threshold is almost certainly in `Instellingen Verkoop → Klant
instellingen` or `Order Instellingen`.** These screens have simply never been
opened.

### The batch jobs: 47 types, not 8

`Batch Taken` in the menu showed 8 configured jobs. The rights list names **47
job types**, including:

- **`Bijwerken openstaande saldi`** (refresh open balances)
- **`Doorzetten journaalposten`** (post journal entries)
- **`Export bedrijven naar boekhoudpakket`** (export companies to the
  accounting package)
- **`Synchroniseer facturen met CreditDevice`**. CreditDevice is a
  credit-management and dunning service, so **receivables chasing may live
  outside both easy2trade and the ledger** (bears on K12)
- invoicing, sending invoices, certificates and orders
- releasing pick, production, fetch and count orders
- 8 KPI jobs that feed the Balanced Scorecard (F3): count deviations, load
  factor, gross profit, purchase and sales complaints, quote hit ratio, stock
  turnover, transport cost per tonne, sawing waste
- integrations: Staalweb, StockOp, easy2optimize, Data2Track, Elvy, X24Light,
  mobile push notifications
- `Oude gegevens opruimen` (clean up old data)

---

## Against our code

| # | Reference | Ours |
|---|---|---|
| P1 | 7 security profiles with field-level rights; Finance/admin alone may unblock financially | one `admin` role |
| P2 | Worklists per task profile (the task panel) | overviews only |
| P3 | Record lock on open + `Delete Lock` | none; last save wins |
| P4 | Month-end stock value reconciliation with `Waarde verschil` | none (see redo) |
| P5 | Settings in `Vestigingsgegevens` | constants in code (`OVERDUE_POST_BLOCK_DAYS = 30`) |

Nothing built. P1 and P5 need the user's decision before any code.
