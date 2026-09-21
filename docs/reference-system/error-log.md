# The error log

**Source:** `System info → Errors`, exported 15-9-2026 →
[exports/error-messages.tsv](exports/error-messages.tsv).

**9 360 entries**, 24-1-2024 → 26-8-2026, four columns: `Creation date`,
`User`, `Error message`, `Type` (`General` 9 340, `Batch task` 20). Despite the
name, most entries are **not failures** — they are the application writing down
what it did to stock, reservations and work orders when a user changed
something. That makes it the only place in the reference where these automatic
consequences are spelled out in words.

---

## 1. When the system was used

| Period | Entries | What it is |
|---|---|---|
| 2024-01 → 2024-03 | 23 | set-up |
| **25-9-2024, 18:57–19:04** | **7 244** | one vendor migration script under `INAD` (§3) |
| 2024-10 → 2024-12 | 23 | pre-go-live |
| **2025-01 → 2025-05** | **1 963** | **live use** — 15 named users |
| 2025-06 → 2026-08 | 101 | trickle; 2026 entries include test input (`ddsadassadsa, 1243 PS, fdsfds`) |

Nine of the fifteen named users (`BENNO`, `MARCO`, `ARIAN`, `RAYMOND`,
`CHERICE`, `MOHAMED`, `FARIEL`, `WAHHAB`, and the `BATCH` account) **log nothing
after May 2025**. Together with the order data being dense January–May 2025,
this says the database we are looking at is a **copy taken around mid-May
2025**, kept afterwards as a test system (`HEGO TEST`). Anything "overdue by
500+ days" or "last month = 0" is measured against a frozen copy.

> ⚠️ **21-9-2026 — read this carefully, the two things are different.**
> Swedinox confirms **live is exactly the same as test**: same ledger (AFAS),
> same batch jobs, same configuration. That is a statement about the
> **application**, not about the **rows**.
>
> So: every *rule* proved here holds on live and needs no re-capture. But the
> *data* in `HEGO TEST` is still a copy frozen around mid-May 2025, and the
> stale-looking numbers above are still stale. Do not turn "live is the same"
> into "the 500-day overdue posts are real on live" — that remains open, and it
> is now K10's whole weight, because the scheduler being off is the **live**
> configuration too.

## 2. 🔴 The batch account, and the ledger was Multivers (K10, K12)

- Recurring jobs run as a separate user: **`BATCH`**, 14 entries, all of type
  `Batch task`, **24-12-2024 → 13-5-2025, then silence.**
- 13 of the 14 say: *"One or more companies were not passed to / updated in
  **Multivers**. See the task 'Companies with synchronisation errors'."*
- The 14th: *"Updating outstanding balance of 12560 failed"* — a job refreshes
  each company's **open balance** (`COMPANY_SALESFINANCE.OPENINVOICES`).
- Invoices are posted the moment they are created:
  `CreateAndJournalizeInvoice F500011: …` (78 entries, mostly PDF write
  failures, run as Windows users like `HEGO\spasaribu`).
- **Aug and Nov 2025, `INAD`:** `CreateAndJournalizeInvoice F501694: Invalid
  tenant id provided` — a cloud ledger connection (tenant id) being configured
  **after** the copy.

**What this changes:** during live use the ledger was **Multivers**, not AFAS.
The `AFAS Synchroniseer …` jobs in today's `Batch Taken` menu, plus the
tenant-id errors, point to a **Multivers → AFAS switch prepared on the test
system after May 2025**. And the scheduler being off (K10) is **normal for a test
copy** — the `BATCH` account stopping on 13-5-2025 is the copy date, not an
outage. The real question for K10/K12 moves to the **live** system: which ledger
does it post to today?

## 3. 🔴 `INAD` is a person at the vendor, not a job (K11)

Batch jobs have their own account (§2), so `INAD` is not the scheduler. Its 264
entries outside the migration are **interactive work**:

- deleting unload-order lines on receipts (113),
- `Artikel waardering waarschuwing: INAD received a warning for line 400084/10…
  and made the purchase order final anyway` (34),
- changing delivery dates (19), printing work orders to printer
  `Logistiek zwart` (5), saving orders.

And on **25-9-2024** the same login ran a one-off script — `START: Controle
bedrijfscodes` → `EINDE` 18:57, `START: Controle deb/cred codes` → `EINDE` 19:01 —
that renumbered companies: `Controle bedrijfscodes: 2 BLONDS aangepast in 10040`.
**That is where the numeric company codes and the debtor/creditor codes came
from.**

**K11 answer, from evidence:** `INAD` is the vendor's support login, used by
people. The 63 unblocks it made were **done by hand by INAD staff**, not by an
automatic rule. What stays open: on whose request — and the audit trail cannot
say which INAD employee.

## 4. Rules the log spells out

Each is written by the application as a consequence of a user action. The count
is how often it happened.

| # | Trigger → what the system does | Count |
|---|---|---|
| L1 | **Unload-order line deleted** → the receipt must be pre-announced again; the label with internal code `26ADQS` may not be used any more | 400+ |
| L2 | **Pick-order line deleted** for a receipt → the inbound delivery must be announced again; label voided | 14 |
| L3 | **Receipt for a purchase line lowered** → the purchase reservation for the linked sales line is **deleted** | 146 |
| L4 | **Less unloaded than ordered** → the reservation for the sales line is **lowered**, or deleted if nothing is left | 8 |
| L5 | **Reserved quantity lowered** on a purchase line: `to 0 instead of by 2` — the lowering is clamped at zero | 3 |
| L6 | **Transport reported loaded with fewer pieces than picked** (`0 ST loaded, 1 ST picked`) → the picked quantity drops to the loaded quantity; **the remainder stays on the location** | 66 |
| L7 | **Transport loaded deviating / delivery deleted** → the **cross-dock reservation** is deleted | 33 |
| L8 | **Delivery changed on released, printed work orders** → those work orders are **deleted**, and new reservations and work orders are created | 8 |
| L9 | **Delivery date changed**: `100009/10 from 6-1-2025 to 10-1-2025` — every change is logged with old and new date | 149 |
| L10 | **Faulty reservation on a delivery** → the order cannot be saved: *"remove the delivery"* | 60+ |
| L11 | **Product valuation warning** on making a purchase order final — the user may override it, and the override is logged by name | 120+ |
| L12 | **Address distance** is fetched from the **Google Distance Matrix API**, from the company's own address (`Bolderweg 10, Almere`) | 40 |
| L13 | Concurrent edits are refused (`ConcurrencyException`) — optimistic locking on every record | 100+ |

**Confirmations:**

- The internal code format **`YY` + 4 letters** (`26ADQS`, `23EHIJ`) matches
  `nextInternalCharge` ✅.
- A 1-letter-per-line code in brackets after a receipt (`(RVS)`, `(MOK)`,
  `(DT)`, `(IN)`, `(AVD)`, `(FS)`, `(BV)`) is the **warehouse/location**.

## 5. Against our code — to check, not yet built

- **L6** — transport work orders already carry a loaded quantity here; whether
  a short load lowers the pick and leaves the rest on location is unverified.
- **L9** — nothing records delivery-date changes. The reference keeps old → new.
- **L3 / L4 / L5 / L7 / L8** — the reservation consequences of lowering a
  receipt, a short unload, a deviating load and a changed delivery. Each needs
  checking against `warehouse-work-orders` and `reservations`.
- **L11** — we have no valuation warning on finalising a purchase order.
- **L12** — our address distances already reference a distance lookup; the
  origin must be the own company address.
- There is **no application log** in `apps/dashboard` at all. The reference's
  log is where a user can see what the system did on their behalf.
