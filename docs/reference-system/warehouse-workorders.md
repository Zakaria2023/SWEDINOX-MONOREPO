# Warehouse work orders

Reached with the `Warehouse workorders` button that sits on nearly every
purchase screen. Ours: `/warehouse-workorders`.

Barely captured — one screen, one order — but what it shows matters, because
this is very likely how goods are actually booked into stock.

## The tree

Not a flat grid. Three levels above the line:

```
9-9-2026                            ← the day's work
 └ Fetching                         ← work order type
    └ 306693                        ← work order number, a 6-digit series
       └ 1 Coil Cold-rolled 304 1mm ← the line
```

Every level carries its own `Status` (all `New` here) and a count.

## The line

| Column | Value |
|---|---|
| description | `1 Coil Cold-rolled 304 1 mm` |
| counterparty | **`Hego Production, ALMERE`** — the in-house production department |
| product | `CK3040010` |
| charge | `102189` |
| status | `New` |
| from | **`Ontva…`** — `Ontvangst`, the goods-in location |
| to | **`Decoiler`** — a machine |
| length · width · thickness | `999999` · `1500` · `1,000` |

So a warehouse work order **moves a lot from one place to another** — here from
goods-in to a decoiler — and `Fetching` is the type of move.

`999999` is the coil sentinel again, which fits: a coil has no cut length.

## 🚩 Why this probably blocks the receipt chain

The status bar reads **`Batchscheduler is not active.`** — on every screen
captured today, all session.

Set that beside what could *not* be done on purchase order `401157`:

- `Kg(a)` and `Qty(a)` on its reception would not take focus
- `New`, `Split`, `Batch registration` and `Charge aanpassen…` were greyed even
  after `Make final` put the reception into `Released`
- `Warehouse workorders` pressed from the order did nothing
- no work order for `401157` appears in this tree

…while work order `306693` **does** exist, for a coil from Hego Production.
Something created it earlier.

The reading: **a released reception is turned into a warehouse work order by
the batch scheduler**, and with the scheduler off nothing will ever pick a new
reception up. That would explain all four blockages at once, and it fits the
151-row export where **53 of 151 receptions read
`Receipt status = Workorders created`** — the commonest status after
`Received`.

It is a reading, not a proof. See
[MANAGER-QUESTIONS.md](MANAGER-QUESTIONS.md) question 3.

## 🔴 What is needed

1. **Is the batch scheduler meant to be off on `HEGO TEST`, and is it what
   raises warehouse work orders from receptions?** One sentence from whoever
   administers the install settles the entire receipt chain.
2. **The full list of work order types.** `Fetching` is the only one seen.
   → *In the old system:* open the type column's filter, or group the tree by
   it.
3. **What a work order looks like when it is finished** — the export's
   `Workorders created` receptions became `Received` somehow.
