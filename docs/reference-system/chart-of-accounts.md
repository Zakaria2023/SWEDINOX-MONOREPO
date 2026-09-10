# The chart of accounts

Read out of the reference's `Journal entries` export — 34 826 rows, 10-9-2026.
**27 accounts**, and it is the whole general ledger this system posts to.

Five carry no description in the export (`3503`–`3507`); they are a block and
almost certainly the stock sub-accounts per revenue group, but nothing in the
data says so, so they are recorded blank.

| Account | Name | Rows |
| ------- | ---- | ---- |
| `1601` | Invoices to be received | 4 919 |
| `1602` | Credit invoices to be received | |
| `2700` | Suspense account to be invoiced | 6 493 |
| `3000` | **Stock** | 7 451 |
| `3010` | Suspense account of purchase invoices | 1 267 |
| `3100` | Inventory increase due to external processing | 433 |
| `3150` | **Suspense account CD** | 1 126 |
| `3160` | Length differences reception | 1 067 |
| `3170` | Goods to be received | 7 114 |
| `3503`–`3507` | *(unnamed block of five)* | 218 + 81 + … |
| `3550` | Stock revaluation | |
| `5300` | Price differences on purchase invoices | 163 |
| `7000` | Cost of inventory | 1 480 |
| `7002` | **Cost of crossdock** | 258 |
| `7004` | Cost of operations | |
| `7005` | Waste sawing | 2 168 (from its own screen) |
| `7006` | Price differences due to processing | 322 |
| `7100` | Purchasing costs | |
| `8010` | **Turnover stock** | 1 487 |
| `8020` | **Turnover crossdock** | 205 |
| `8040` | Turnover operations | |
| `8050` | Turnover freight costs | 82 |
| `8150` | Billing rounding differences | |
| `8200` | Sales costs | 530 |

## What the numbering says

The blocks are the ordinary Dutch ones: **1xxx** receivables and payables,
**3xxx** stock, **5xxx** price differences, **7xxx** cost of sales, **8xxx**
turnover.

Three things are worth pulling out.

### Cross-dock has its own accounts

`3150 Suspense account CD`, `7002 Cost of crossdock` and `8020 Turnover
crossdock` sit beside `3000 Stock`, `7000 Cost of inventory` and `8010 Turnover
stock`. **The books separate a cross-docked sale from a stocked one all the way
through** — suspense, cost and turnover — which is independent confirmation that
`Stk` versus `CD` is a real dimension and not a reporting tag. See
[order-types.md](order-types.md).

### `8150 Billing rounding differences` exists

A named account for the cent that will not reconcile. That is the same problem
`roundToCents` exists for — see [discount-basis.md](discount-basis.md) — and the
reference's answer is to post the difference rather than to argue with it.

### `3160 Length differences reception` — 1 067 rows

Goods arrive at a different length than ordered, and the difference gets its own
account with over a thousand postings. Steel is cut to length and what turns up
is not exactly what was ordered; that is a routine event here, not an exception.

## The three journals

| Journal | Rows | Documents |
| ------- | ---- | --------- |
| `80` | 32 223 | the bulk |
| `70` | 1 823 | |
| `10` | 780 | numbered `6xxxxx` — **trip numbers** |

Journal 10 keying on the trip is the accounting side of
[stock-mutations.md](stock-mutations.md): goods leave on a trip, and the books
follow the trip.

## What was built

**Nothing, deliberately.** `LedgerAccounts` exists and is empty, and seeding a
company's chart of accounts is a business decision rather than a code one —
these are Swedinox's account numbers, taken from a system they may or may not
keep. The list is here so that whoever seeds it does not have to guess.

⚠️ Also not built: any posting that uses them. `lib/server/ledger.ts` posts
balanced entries already, but it does not know these numbers. Wiring the two
together is the piece of work this page makes possible, not one it completes.

## Two caveats on the export

- **It is a selection, not a ledger.** Only 2 986 of its 5 275 documents balance,
  and the file's own total is −2 563 727. Counter-legs live outside it. Do not
  use it to test double-entry.
- `Cost centre` is `0` on all 34 826 rows — the dimension exists and is unused,
  like `Resource` and `Pickvolgorde` before it.
