# Questions

Simple version of the open questions in [STEPS.md](STEPS.md). For each one:
what I picked, and the easiest possible way to double-check it if you ever
want to. You don't have to check any of these — if you don't, we just go with
the pick.

## 1. "Avg. Monthly consumption last year" — which 12 months?

**The question:** does "last year" mean the 2025 calendar year, or the last
12 months counting back from today?

**My pick:** the last 12 months counting back from today. That's how this
kind of number is normally done, and it's what our system already does.

**Easiest way to check, if you want to:** pick a product you know started
selling a lot more (or a lot less) in the last few months. Look at its
"Avg. Monthly consumption last year" number on Order advice today. Come back
and look at that same number again on **January 2nd, 2027**. If the number
jumps on that date, it's the calendar year. If it barely changes, it's the
rolling 12 months (my pick).

## 2. "Consumption previous month" — last calendar month, or last 30 days?

**The question:** does this mean everything sold in August (the whole
calendar month), or everything sold in the last 30 days counting back from
today?

**My pick:** last calendar month (August). That's what people normally mean
by "previous month," and it's what our system already does.

**Easiest way to check, if you want to:** find a product that sold something
on the very last day of last month and something on the very first day of
this month. If this number already reflects the first-of-this-month sale,
it's a rolling 30 days. If it only reflects last month's sales, it's the
calendar month (my pick).

## 3. "Avg. Monthly consumption last 3 years" — 36 months added up and divided
by 36?

**The question:** same idea as question 1, but over 3 years instead of 1.

**My pick:** yes — add up the last 36 months and divide by 36. Same logic as
question 1, and it's what our system already does. Low stakes either way —
not worth spending time checking.

## 4. What counts as "consumption" in the first place?

**The question:** is a sale counted the moment it's **invoiced**, the moment
it's **delivered**, or the moment stock physically leaves the warehouse?
These can happen on different days for the same order.

**My pick:** invoiced. That's the most standard definition (a completed,
billed sale) and it's what our system already does.

**This one matters more than the others** — every consumption number and
the whole purchase advice depends on it. If you get a chance: find a product
that was delivered to a customer recently but hasn't been invoiced yet. Check
whether its "Avg. Monthly consumption" already includes that delivery. If yes,
it's delivery-based, not invoice-based, and I should switch the pick.

## 5. "Coverage" columns — months of stock, measured against which number?

**The question:** "Economic Coverage" and "Technical Coverage" are shown as
plain numbers with no unit. Are they months of stock on hand, and are they
measured against "Avg. Monthly consumption last year"?

**My pick:** yes to both — months of stock, against last year's average. It's
what our system already does. Low stakes — not worth spending time checking.

## 6. "Advice Weight rounded" — rounded to the nearest whole kilogram?

**The question:** when the system suggests how much to buy, does it round
that suggestion to the nearest kilogram, or to some other step (like the
supplier's order size)?

**My pick:** nearest whole kilogram. The rounding to the supplier's order
size happens later, in a separate column ("OrderQty"), so this earlier number
doesn't need to already be rounded to that. Low stakes — not worth spending
time checking.
