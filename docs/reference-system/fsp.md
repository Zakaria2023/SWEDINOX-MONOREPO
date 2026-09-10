# FSP — the price stock is carried at

`FSP` has been an unexplained abbreviation in these docs since the count-list
screens first showed `FSP` and `FSP U.` columns with nothing to say about them.
On 10-9-2026 two screens explained it between them.

## The menu names it

Under `Overviews → Finance`:

> **Control Revaluation of stock due to FSP-changes**

That sentence is the whole answer in outline: **FSP is the price a lot is
carried at, and changing it revalues stock.** A price that triggers a
revaluation when it moves is a standard cost, not a transaction price.

## The screen confirms it

`Product code` (blank → `zzzzzzzzzzzzzzz`) and `Mutation date` 1-1-2024 →
10-9-2026. Zero rows — no FSP has been changed in that window. Its columns:

```
Product code · Description · Starting date · Financial … · Financial …
GLA# Revaluation · GLA Revaluation Stock · Revaluation … · Revenue group
Revenue group no. · PriceU · Technical stock · Technical stock … · StkU
FSP · FSP -/- Preceding FSP · Preceding FSP
```

Three of those are the shape of the thing:

- **`FSP`**, **`Preceding FSP`**, **`FSP -/- Preceding FSP`** — the new price,
  the old price, and the difference. A revaluation is a *change* record.
- **`GLA# Revaluation`** and **`GLA Revaluation Stock`** — two general-ledger
  accounts. The revaluation posts to the books: one leg to a stock account, one
  to a revaluation account.
- **`Technical stock`** and **`PriceU`** — the quantity the difference is
  multiplied by, in the price's own unit.

So a row on this screen reads: *product X was carried at `Preceding FSP`, is now
carried at `FSP`, the difference times the technical stock is the revaluation
amount, and here are the two accounts it was posted to.*

## Where it sits among the four

The sales order's `Revenue+Profit` panel states margin against **four** price
bases at once — see [order-detail.md](order-detail.md):

| | What it is | Evidence |
| --- | --- | --- |
| **APP** | average purchase price | its edit dialog is in Dutch and calls it `Gip` — *gemiddelde inkoopprijs* — quoted per tonne |
| **FSP** | the price stock is **carried** at | this page |
| **Repl. price** | replacement price | already held as `Products.replacementPrice` |
| **LIP** | not established. The `IP` is almost certainly the same *inkoopprijs*; the `L` has no evidence behind it | — |

APP is what the metal cost on average. FSP is what the books say it is worth.
They are different questions, which is why the system reports margin against
both.

⚠️ **What is still not proved.** The letters themselves. "Fixed Stock Price"
fits every observation and is not written down anywhere in the system, so it is
not recorded here as fact. What *is* established is the behaviour: a per-product
carrying price, versioned with a starting date, whose change revalues stock
through two named GL accounts.

## What it means for us

`Stock.valuationPrice` is our carrying price and is currently only ever set from
what a lot cost. There is no notion of a **product-level** carrying price that
can be restated across every lot at once, and no revaluation journal.

Nothing was built. The reference has not changed an FSP in two and a half years
of data, so this is a real feature that is not in daily use — the same shape as
transport costing. It is written down so that if Swedinox ever revalues stock,
the two GL accounts and the change-record shape are already known.

Related: [order-detail.md](order-detail.md) ·
[customer-stock.md](customer-stock.md) · [empty-screens.md](empty-screens.md)
