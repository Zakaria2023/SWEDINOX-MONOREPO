# The discount basis

**Settled 10-9-2026, on purchase quote `900003` typed by hand.**

Open for four rounds, asked eight times, and the cheapest question in the whole
system to answer — sixty seconds at a keyboard. It stayed open so long because
no captured row could answer it: `Blocked deliveries` prints `Line discount` and
`Group discount` side by side, which makes it the best-placed screen in the
system, and it reads **0 %** on every row. At 0 % the two candidate readings
give the same number.

## The answer

**The discounts cascade.** The second comes off what the first left, not off the
gross.

| Gross | Line disc. | Group disc. | `Net Price` |
| ----- | ---------- | ----------- | ----------- |
| 1.000,00 | 5 % | — | **950,00** |
| 1.000,00 | 5 % | 3 % | **921,50** |

`950 x 0,97 = 921,50`. Additive — both percentages off the gross — would have
printed `920,00`.

The two rows are the **same line seconds apart**: the first screenshot caught it
mid-edit, with `3,00` typed into the group discount box but not yet committed,
so the grid still showed the line discount alone. That accident is what makes
the pair conclusive. One line, one product, one moment, both readings.

- Supplier `11692` Holland Stainless Int
- Product `PK304L200315`, Cold-rolled plate 304L 3000 x 1500 x 2mm, 1 ST
- Quality `304L2B`, no options, first choice — chosen to keep option pricing and
  second-choice pricing out of the reading

## What it changed in the code

**Nothing.** `netPriceAfterDiscounts` already read:

```ts
grossPrice *
  (1 - (groupDiscountPercent || 0) / 100) *
  (1 - (lineDiscountPercent || 0) / 100);
```

which is cascading. Multiplication is commutative, so the order the two are
applied in does not matter and the argument order is free — worth saying,
because the doc comment used to fuss about which came first as though it were
the open question. It never was; the open question was cascade against add.

What changed is the comment above it: an assumption stated where it could be
found became a proof stated where it could be found.

## What it did change — a rounding bug

The same screenshot priced the line, and that is where something real turned up.

```
Net Price 950,00 / TN  on 70,7 kg  ->  Amount  67,17
Net Price 921,50 / TN  on 70,7 kg  ->  Amount  65,15
```

The second confirms `priceMeasureFor`: a tonne price is struck against the
weight in tonnes, not against the piece count. **The first did not reproduce.**
Ours printed `67,16`.

`950 x 0,0707` is `67,165` — an exact half-cent, and the reference rounds it up.
Ours rounded it down, because in binary the product is `67,16499999999999`,
genuinely *below* the midpoint. Rounding it down was correct arithmetic on a
number that had already lost the thing that mattered.

`roundToCents` existed for exactly this and did not do it:

```ts
Math.round(value * 100) / 100
```

Its own doc comment offered `462,9 kg at EUR 2.550/TN = EUR 1.180,395` as the
case it handled, and it returned `1.180,39` against the reference's `1.180,40`.
**A function that had been wrong about itself for months**, in a comment
confident enough that nobody re-read the code under it. It is now:

```ts
const scaled = value * 100;
const meant = Math.abs(scaled) < 1e9 ? Number(scaled.toPrecision(12)) : scaled;
return Math.round(meant) / 100;
```

Twelve significant digits sits far inside a double's fifteen to seventeen, so
`toPrecision` recovers the decimal the arithmetic meant without disturbing a
value that genuinely sits below the boundary — `67,16499` and even
`67,1649999999` still round down. Across 600.000 random amounts it differs from
the naive form on **one**, and that one is a true half-cent. Above 1e9 cents
there is no slack left to recover and it steps aside.

⚠️ **One behaviour changed for negative amounts.** Half-up means toward +∞, so a
credit line landing exactly on `-67,165` now reads `-67,16` where it used to
read `-67,17`. That is the consistent reading rather than a new rule — the old
answer came from drift and not from a decision — but no negative half-cent has
been seen in the reference, so it is an assumption and is marked as one in the
code.

## Why this one took four rounds

Worth recording, because the pattern will repeat.

Every screen that *prints* both discount columns has 0 % in them, so no export
could settle it however many rows it held — 71.000 rows of captured data and not
one of them could answer a question about what happens when a number is not
zero. The answer had to be **created**, not found: somebody had to type a
discount into a box.

The general shape: **a formula with two factors can only be read off a row where
both factors are non-trivial.** When the live data is degenerate, more of it is
worth nothing, and the cheap move is to make one row that is not.

## Verified by

`scripts/verify-logistics.ts`, group *Discount basis — purchase quote 900003*,
five checks: the two `Net Price` readings, the rejection of the additive answer,
and the two `Amount` figures. Plus three on the rounding fix, including the
`1.180,40` case the old comment claimed and missed. **95/95.**
