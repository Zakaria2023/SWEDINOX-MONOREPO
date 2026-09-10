# How much of the system is built

Measured 10-9-2026, not estimated. Two different questions get two very
different answers, and conflating them is how a rebuild convinces itself it is
nearly done.

## Screens: essentially complete

**126 route folders** under `app/(dashboard)`. Every screen named in every menu
captured so far — Logistics (32), Finance (14), Suppliers (5), Purchase (12),
plus Customers, Companies, Sales and the rest — has one.

Nothing on any menu is missing. That is the easy half, and it was finished
before this session started.

## Behaviour: roughly a third

Of those 126 routes:

| | Count |
| --- | --- |
| Routes whose `actions.ts` writes to the database | **42** |
| Routes that only read | 76 |
| Routes with no `actions.ts` at all | 8 |

⚠️ **76 read-only routes is not 76 gaps.** Most are reports, and they are
read-only in the reference too — every `revenue-*`, `pick-statistics`,
`purchase-results`, `credit-information-customers`, `journal-entries`,
`stock-on-location`, `cbs-documentation`, the four `control-*` screens. A report
that does not write is finished.

The gap is the screens where the reference lets you *do* something and we only
list: booking a receipt, planning a trip, adjusting stock by hand, creating a
reservation, and most master-data maintenance.

## Where the real work stands, by area

| Area | State |
| ---- | ----- |
| **Purchase** | ✅ formulas proved on 5 535 rows, order advice, receipts, receivals, the seven-part price build-up |
| **Stock & logistics** | ✅ lots, movements with polymorphic causes, locations, capacity, reservations, weights at rolled thickness |
| **Sales & credit** | ✅ pricing, cascading discounts, both credit limits, three blocking reasons |
| **Production** | 🟠 work orders and sawing waste modelled; capacity planning is not, and the reference does not use it either |
| **Finance** | 🔴 **the biggest hole.** Balanced entries post, but the 27-account chart is not seeded and nothing maps a movement to an account. VAT scenarios are stored and drive nothing. CBS and SFN are shells |
| **Master data** | ✅ companies, contacts, products, contracts |

## The honest number

If "built" means *a screen exists that shows the right columns*: **~95 %**.

If it means *the screen does what the reference's screen does*: **around a
third**, and the arithmetic underneath it is the part that is furthest along —
**123 automated checks** now pass against roughly 130 000 exported rows, and
every money rule in Purchase, Stock and Sales has been proved against real data
rather than assumed.

The remaining two thirds is mostly **write paths and posting**, not discovery.
We now know what the screens do; what is missing is the code that does it.

## What is genuinely still unknown

Not "unbuilt" — **unknown**, and no amount of coding will settle it:

- 🔴 **How many days is "too long"** for an outstanding post. Ships on an
  assumed 30 ([PLANNED-CODE-CHANGES-2.md](PLANNED-CODE-CHANGES-2.md) item 2)
- **What `LIP` and `FSP` stand for.** FSP's behaviour is established
  ([fsp.md](fsp.md)); the letters are not
- **Whether customer-owned stock should carry value** — €40 833 does today in
  the reference ([customer-stock.md](customer-stock.md)). An accounting policy
  call
- **Whether Swedinox wants the switched-off features at all**: transport
  costing, `Resource`, `Pickvolgorde`, `Zelfbeoordeling`, FSP revaluation,
  sawing planning. Six features the reference ships and does not use
  ([empty-screens.md](empty-screens.md))

## What is unbuilt and known

In rough order of value:

1. **Post movements to the ledger.** The chart is in
   [chart-of-accounts.md](chart-of-accounts.md); nothing reads it yet
2. **Write paths on the logistics screens** — book a receipt, plan a trip,
   adjust a lot, create a reservation by hand
3. **The `Stk+CD` half of cross-dock**: the column exists, but nothing sets
   `purchaseOrderItemUuid` yet because we have no cross-dock buying flow
4. **Master-data maintenance** for suppliers, contacts and addresses
5. **CBS and SFN returns** — both are statutory, both are currently shells
