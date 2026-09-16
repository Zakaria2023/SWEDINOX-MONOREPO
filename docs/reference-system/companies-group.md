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
