# Planned code changes 5 — from System info (15-9-2026)

Source findings: [database-schema.md](database-schema.md) (S1–S8),
[error-log.md](error-log.md) (L1–L13), [system-info.md](system-info.md) (P1–P5).
Built the same day on the user's go-ahead. **Not committed.**

## Build status

| # | What | State |
|---|---|---|
| S1 | Order changed after a financial release is flagged and re-checked | ✅ built |
| S2 | Manual vs automatic financial block | ✅ built |
| S3 | Delivery block with its own reason | 🟡 manual block with reason built; automatic trigger not (no rule known) |
| S4 | A lot holds several batches (`StockBatches`) | ✅ built |
| S5 | Mill charge required | ⏭️ dropped — the reference fills it with `nvt`/`ntv`, so "required" is not a real rule |
| S6 | Visit reports stop copying company fields | ✅ built (second round) — 17 columns dropped, backup kept |
| S7 | Complaint handling on the complaint, not per line | ✅ built (second round) — plus delivery date and completed per line |
| S8 | Budget split stock/factory/cross-dock, profit as % | ✅ built (second round) — plus budget entry and both report views |
| L9 | Delivery date changes logged | ✅ built |
| L1, L2 | Deleting an unload / pick line voids the label and needs re-announcing | ⏭️ no host — our app has no action that deletes a single unload or pick line |
| L3, L4, L5 | Lowering a receipt / short unload lowers or deletes the purchase reservation | ⏭️ no host — nothing here creates purchase reservations; every reservation is on a stock lot |
| L6, L7 | Short load lowers the pick; deviating load drops the cross-dock reservation | ⏭️ no host — transport lines are not linked to picks and no loaded quantity is ever recorded |
| L8 | Changed delivery recreates released work orders | ⏭️ no host — warehouse work orders carry no delivery date to fall out of step |
| L10, L11 | Faulty reservation blocks save; valuation warning on finalising | ⏭️ rule unknown — the log names the message, not the test |
| L12 | Address distance from Google Distance Matrix | ⏭️ needs a Google API key |
| L13 | Concurrent edits refused | ✅ already — optimistic guards on stock, lines and invoices; record locks (P3) |
| P1 | Financial release restricted to Finance/admin | ✅ built |
| P2 | Worklists (task panel) | ✅ built (second round) — 13 worklists on `/tasks` |
| P3 | Record locks + Open work panels | ✅ built for orders and company details |
| P4 | Stock value check | ⏭️ no data — stock movements carry no value and the table is empty; waits for the redo with Year 2025 / Month 5 |
| P5 | Settings screen | ✅ built (overdue days) |
| — | Automatic delivery blocks | ⏭️ trigger unknown in the reference |

## Second round — 15-9-2026

### Database
- `scripts/migrate-remaining-2026-09-15.mjs` (gitignored) then `pnpm db:push`, both applied.
- **`VisitReports`:** 17 company copies dropped (address, phone, fax, marketing, visit planning). The 2 rows' values are saved in `scripts/backups/visit-reports-company-copies-2026-09-15.json`.
- **`ComplaintItems`:**
  - Recreated without the per-line status, cause, solution, deadline and responsible columns (the table was empty).
  - New columns: `delivery_date` and `completed`.
- **`RevenueBudgets`:** recreated per group × year × month (the table was empty). Revenue and weight each split into stock / cross-dock / ex factory, profit % per type, unique on (group, year, month).

### Logic and pages
- **Visit reports**
  - A report shows the company's visiting address, marketing and visit planning, with an "Edit on the company" link.
  - The report's own Marketing and Visit planning editors are gone. The new-report form no longer asks for address or marketing.
  - Resolving a visit sets the company's next visit date, unless the company already has one planned after this visit.
  - Visits made reads the city and postal code from the company's visiting address.
- **Complaint lines**
  - Every line shows its complaint's handling.
  - New lines carry the order line's delivery date.
  - "Mark line completed" on the line detail; the complaint shows Delivery date and Completed per line.
- **Revenue w.r.t. Budget**
  - Year / Month filter; a blank year is the current year.
  - Two views: per revenue group, or per month.
  - Actuals from non-cancelled invoices in the period.
  - Budget profit = Σ revenue × % per type.
- **Revenue budgets** (new, under Sales): set one group's month; saving the same month replaces it; delete per row.
- **Tasks** (new, first item of Work orders): a count per worklist, each linking to the screen that works it. The three finance lists are visible to Finance and admin only. The lists:
  - financial blocks
  - customers to unblock
  - customers without a debtor number
  - manually blocked deliveries
  - transport blocks
  - invoice blocks
  - late order lines
  - incomplete deliveries
  - overdue purchase lines
  - expiring customer contracts
  - open complaints
  - incomplete delivery addresses
  - visit reports to read

### Not in the reference's shape yet
- "Ex factory" actuals: our order lines have no factory source type, so the report's actuals do not split by type. Only the budget does.
- The complaint line's bill of lading, exchange product and short-delivered quantity: nothing in this app would fill them, so they were not added.

### Verified (second round)
- `tsc` clean. The only errors were stale `.next` types for the two deleted pages, and the build cleared them.
- ESLint clean.
- `pnpm build` ✓ (151 pages).
- Harness 162/162.
- Live SQL:
  - Two saves of one budget month leave 1 row; revenue 2 500 → profit 450.
  - Every worklist query runs.
  - The visit report joins the company's visiting address.

## What changed

### Database (`pnpm db:push`, applied)

- `Orders.financial_block_manual`, `Orders.changed_after_financial_deblock`.
- New tables:
  - `SystemLogs`: category, message, order, user, time.
  - `BranchSettings`: one row; `overdue_post_block_days`, default 30.
  - `WorkPanelLocks`: unique on (panel type, record).
  - `StockBatches`: stock ↔ batch with quantity, unique on the pair.
- `scripts/backfill-system-2026-09-15.mjs` (gitignored) wrote the settings row. `Batches` is empty, so there were no links to write.

### Logic

- **Credit rule**
  - `assessCredit` takes `overduePostBlockDays`.
  - `checkCredit` reads it from `BranchSettings`.
  - `OVERDUE_POST_BLOCK_DAYS` remains the default.
- **`createOrder`**
  - A block ticked on the form is stored as manual.
  - Every hold is logged. The credit rule's holds are logged as the system.
- **Quote conversion:** a hold is automatic and logged.
- **`updateOrder`**
  - Refused while another user holds the order's lock; a successful save releases the saver's own lock.
  - Logs a delivery date change with the old and new date.
  - After a financial release, an edit sets `changedAfterFinancialDeblock` and is logged.
- **`deliverOrderItem`**
  - Re-runs the credit rule unless there is a *financial* release that the order has not been changed since. A commercial release no longer counts.
  - A new hold is automatic, resets the flag, and is logged.
- **`unblockOrder`**
  - Needs the `admin` or `finance` Clerk role. All 7 current users are `admin`.
  - Clears the manual and changed flags and logs the release.
- **`blockOrderLineDelivery`** (new): a reserved line gets a commercial block with a reason, logged. `releaseCommercialBlock` is logged too.
- **Batch registration:** writes a `StockBatches` row per new batch. Sending certificates traces lot → `StockBatches` → batch, one row per pick per batch.
- **`updateCompanyDetails`:** refused while another user holds the company's lock.

### Pages

- **System info** (new sidebar group):
  - **Errors** (`/system-log`): the log, filterable by type.
  - **Open work panels** (`/open-work-panels`): current locks. `Delete lock` is admin-only and logged.
  - **Settings** (`/settings`): days overdue before a financial block. Admin edits, everyone else reads; changes are logged.
- **Financially blocked quotes and orders:**
  - New `Block` column (Manual/Automatic).
  - Unblock is offered to Finance/admin only, and errors are shown.
- **Order line detail:** "Block delivery" with a reason, or the commercial unblock when the line is already held.
- **Edit order** and **Company details:** take the lock while open and show who holds it otherwise.

## Verified

- `tsc --noEmit` clean.
- ESLint clean on every changed file.
- `pnpm build` ✓.
- Harness **162/162**, including the new threshold check.
- `db:push` applied.
- Live check of the new columns and indexes. A two-user lock round-trip keeps the first holder.
