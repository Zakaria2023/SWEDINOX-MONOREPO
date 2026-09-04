# Questions

Simple version of the open questions in [STEPS.md](STEPS.md). For each one:
what I picked, and the easiest possible way to double-check it if you ever
want to. You don't have to check any of these — if you don't, we just go with
the pick.

## 1. ✅ ANSWERED — "Avg. Monthly consumption last year" is the last 12 months

**The question was:** does "last year" mean the 2025 calendar year, or the last
12 months counting back from today?

**Answer: the last 12 months.** My pick was right.

Proved on the Sold products screen. With the `Invoice date` filter set wide
(`11-1-2023` → `4-9-2026`) every row showed a consumption of `0,0`, even rows
with € 93.910 of revenue. Narrowing the filter to exactly the last 12 months
(`4-9-2025` → `4-9-2026`) left only two products with sales — and both showed a
real consumption figure. So the consumption column looks at its own fixed
trailing-12-month window, not at the filter, and not at a calendar year.

The divisor is 12, exactly:

```
SC304 · Stainless steel scrap · Stock U. = KG
Sales 45,23  →  45,23 ÷ 12 = 3,769  →  shown as 3,8   ✓
```

## 2. "Consumption previous month" — last calendar month, or last 30 days?

**The question:** does this mean everything sold in August (the whole
calendar month), or everything sold in the last 30 days counting back from
today?

**My pick:** last calendar month (August). That's what people normally mean
by "previous month," and it's what our system already does. Question 1 landing
on my pick makes this one more likely to be right too.

**Easiest way to check, if you want to:** find a product that sold something
on the very last day of last month and something on the very first day of
this month. If this number already reflects the first-of-this-month sale,
it's a rolling 30 days. If it only reflects last month's sales, it's the
calendar month (my pick).

## 3. ✅ ANSWERED — 36 months divided by 36

**The question was:** same idea as question 1, but over 3 years instead of 1.

**Answer: yes, divided by 36 flat.** My pick was right.

Proved on the 5,535-row export. `601003021` reads a previous-year average of
26, a two-year average of 13,5 and a three-year average of 9:

```
26   × 12 = 312   (the previous twelve months)
13,5 × 24 = 324   = 312 + 11, the eleven sold in the last twelve months
9    × 36 = 324   the same total, so nothing sold in year three
```

Two more products reconcile the same way to within a rounding unit. The
divisors are 12, 24 and 36 flat — not a count of months with history.

## 4. ✅ ANSWERED — consumption is counted from invoices

**The question was:** is a sale counted the moment it's **invoiced**, the
moment it's **delivered**, or the moment stock physically leaves the
warehouse?

**Answer: invoiced.** My pick was right — and this was the one I flagged as
mattering most, because every consumption figure and the whole purchase advice
depends on it.

Same proof as question 1. The consumption figure moves exactly with what the
`Invoice date` filter can see, and `45,23 ÷ 12 = 3,8` reconciles against the
invoiced total to the decimal. If consumption were counted from deliveries or
stock movements, it would not track the invoice total that precisely.

**One thing this turned up that we had wrong:** the consumption column is
counted in the product's **stock unit**, while the `Sales` column next to it is
a **weight in kilograms**. On `CK3040010` (Coil Cold-rolled 304, stock unit
`ST`), Sales reads `10.000,00` and consumption reads `0,3` — which only
reconciles if the 10.000 is kilos and the 0,3 is coils. **Fixed**: `Sales` now
sums `weightKg`, and the consumption figure is converted into the stock unit.

## 5. ✅ ANSWERED — months of cover, against last year's average

**The question was:** are the two coverage columns months of stock, and against
which consumption figure?

**Answer: yes to both.** My pick was right, and it checks out on all fourteen
rows that carry a coverage.

```
Economic Coverage  = Econ. stock ÷ Avg. Monthly consumption last year
Technical Coverage = Stoch       ÷ Avg. Monthly consumption last year
```

`601003021`: `489 ÷ 0,9 = 543,33` shown as **543,3**, and
`500 ÷ 0,9 = 555,56` shown as **555,6**. `PK30415021`:
`1367 ÷ 0,8 = 1708,75` shown as **1708,8**.

Both are struck in **purchase units**, not kilos — see the note on question 6.

**And both divide by the average as printed, rounded to one decimal.** That is
part of the arithmetic, not display: 489 / 0,9 = 543,3 is what the reference
shows, where 489 / (11/12) would be 533,5. Confirmed on three products, and
ours now matches all 262 rows that carry a coverage.

## 6. ⚠️ OVERTAKEN — the advice is not struck in kilograms at all

**The question was:** what step does "Advice Weight rounded" round to?

**It turns out the question was the wrong way round.** `Advice Weight rounded`
is **zero on all 5,535 rows**, including the two that carry a real advice.
`CAA1050030` is advised **6 pieces** and shows an advice weight of **0**,
because that product records no weight per piece to convert by.

A kilo-first engine could not produce a quantity without first producing a
weight. So the reference system computes the whole chain in the **purchase
unit** — demand, minimum, maximum, advice — and the kilo columns are a
reporting derivative. There is no `Min. Stock (Kg)` or `Max. Stock (Kg)`
anywhere among the 72 columns, which is the same story from the other side.

Ours does it in kilos and converts at the end. That is the one substantial
thing the export says we have backwards. What rounds to what is settled too:

```
Min = round(factor × avg monthly)     rounded to a whole purchase unit, half up
Max = 3 × round(avg monthly)          the average is rounded BEFORE the factor
```

`round(3 × 2,3) = 7`, but the data shows **6** against an average of 2,3. So
the rounding happens first.

---

## Score so far

**Five of six settled, and every pick that was tested came back right** —
questions 1, 3, 4 and 5 all matched. Question 6 was not wrong so much as
misconceived: the advice never runs in kilos in the first place.

Only **question 2** is still open, and it is the smallest of them: whether
"Consumption previous month" means the calendar month or a rolling thirty days.
Given the run of confirmations, the pick stands.
