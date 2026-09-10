# Steps

> **Superseded by [WHAT-IS-LEFT.md](WHAT-IS-LEFT.md)**, which carries every
> still-open item from this file, renumbered. Kept for the reasoning and for
> what has already been answered.

Sorted by what a wrong answer costs, not by screen. Everything already settled
lives in [ANSWERED.md](ANSWERED.md); this file is only what is still open.

- **Tier 1** changes the database or the logic. Worth your time.
- **Tier 2** is lists of values. Only needed when we build that screen.
- **Tier 3** is labels. I will guess, and fix it in one line if I guess wrong.

If you only ever do one section, do Tier 1. It is three items — and **one of
them needs no data created at all**. See
[TIER1-RECIPES.md](TIER1-RECIPES.md) for the exact click paths, including the
one document chain question 1 needs.

Every action button seen anywhere is inventoried in [ACTIONS.md](ACTIONS.md),
including a list of the ones **never opened** — worth one screenshot each if
their screen comes into scope.

Questions that need a **person** rather than a click — what a field is for,
whether a process is still used — live in
[MANAGER-QUESTIONS.md](MANAGER-QUESTIONS.md). Everything about **Purchase
quotes** is there: the screen has at most one row in three years and that row is
a test entry, so it stays a read-only table and its questions are no longer
steps.

## Tier 1 — the ones that change code

1. **Consignment stock** → *half done.* A test quote was created with
   `Consignatie` ticked (it is a **header** checkbox under `Overlength`, not a
   line field) and converted to order `401154`, which came out `Provisional`
   with its reception already created. Three clicks remain:
   press **`Make final`**, then fill `Kg(a)`=314 / `Qty(a)`=10 on the existing
   reception, then read the lot's `Stock (€)` on Stock on location. If it is
   €0,00 while ordinary lots carry value, consignment is excluded from stock
   value. ⚠️ Note the order header has **no** `Consignatie` checkbox at all —
   see [MANAGER-QUESTIONS.md](MANAGER-QUESTIONS.md) §3.
   [recipe](TIER1-RECIPES.md)
2. **Purchase order → the `Pricing` panel** → the `Options` half of this is
   now answered: an option row carries its own **`Per`** column, reading `M2`
   for Grinding, so the pricing basis is per option. What is still unexplained
   is why `Previous orders` bills 4 pieces weighing 94,2 kg as **100 kg** —
   trade weight is ruled out. Expand the **`Pricing`** panel on order `400650`
   (never opened), and optionally type a `Gross price` of `1,70` on a Grinding
   option to confirm it lands on €34,00 for 20 m².
   [doc](purchase/purchase-order-detail.md)
3. **StockOn advice** → on the product screen, "Use StockOp for this product?"
   is unticked and the system says its parameters have never been calculated.
   Check a handful of other products for the same. If StockOp is switched off
   everywhere, the whole StockOn advice screen leaves scope.
   [doc](purchase/stockon-advice.md)

## Tier 2 — lists of values, needed when we build that screen

4. **Sold products** → find a second product whose "Stock U." is not KG. Read
   its "Sales" against its "Avg. Monthly consumption last year" and divide out
   the factor, to confirm the consumption column is in the stock unit while
   Sales is in kilos.
5. **Purchase invoices** → group by "Status". Note whether a blocked invoice
   is a status or a separate flag. [doc](purchase/purchase-invoices.md)
6. **Orders and quotes** → group by "Status". Check whether quote-type and
   order-type values mix or stay separate.
   [doc](purchase/purchase-orders-and-quotes.md)
7. **Orders and quotes** → open the "Order method" dropdown to list every
   option.
8. **Orders and quotes** → open the "Classification code" dropdown to list
   every option.
9. **StockOn advice** → open the "Lead time method" dropdown on a product's
   setup screen and list every value. [doc](purchase/stockon-advice.md)
10. **StockOn advice** → widen "Determined by StockOp" with data on screen and
    list its values. Check a product's screen for where "StockOp" is set.
11. **Net prices** → widen "Net priceU" across several rows and list every
    value it takes. [doc](purchase/net-prices.md)
12. **Net prices** → select a row, click "Show Contract", and list every field
    the contract screen shows.
13. **Product** → scroll the "Options" list to the bottom on product
    PK316L40021 and open one row's state dropdown. Six are visible (Duplo,
    Decoilen, Grinding, Brushing, ShearCut, Laser Foil), all reading
    "Possible", but "Knippen" appears on Purchase receivals and not in that
    list — so the enum has at least seven members, and its other states are
    unknown. [doc](product-detail.md)
14. **Product** → open the "Price" dropdown on the same product. It reads
    "Algemeen" (General); its other values are unknown.
15. **Company** → on the companies overview, filter or group by the "Processor"
    and "Transporter" role checkboxes. If any company carries them, it changes
    how work orders are assigned. [doc](company-detail.md)
16. **Company** → open the "Journal code" dropdown on either the Creditor or
    Debtor panel. It reads 0 for the creditor and 11 for the debtor.

## Tier 3 — labels and details, skip unless something looks wrong

### Purchase lines

17. Note the row count with "Only current purchasing lines" checked. Uncheck
    it, press Show Data, and compare what the extra rows have in common.

18. Check whether the `Hego Prod` view's second filter clause actually applies.
    It reads `Not Product In [Blauwe Folie, Decoilen, Knippen, Laser Folie,
Slijpen]`, yet Blue Foil and Grinding rows are in its 131 results.
19. Open line `20` of order `400648` — the one row where `Qty ordered` (173)
    is neither zero nor the full `Qty(p)` (187), while `Qty confirmed` is 187.
    Check which of the three is editable.


### Purchase results

20. Note the value for an old receipt. Check it again after the replacement
    price has changed on that product — or check "Control Revaluation of stock
    due to FSP-changes" for a version history.

### Purchase invoice line

21. Set "Bookings date" to a month with invoices and note the row count.
    Uncheck each of the two date checkboxes in turn, re-running each time.
    [doc](purchase/purchase-invoice-line.md)
22. Widen the "Revenue products" column with data on screen and read what it
    holds.
23. Find an invoice from a supplier whose goods came from a third country and
    check what "Country" shows.
24. Open the "View" dropdown and list every saved view.
25. Check two rows with different products but the same CBS no. Check whether
    their "Qty" is comparable.

### Purchase invoices

26. Find an invoice with a non-zero "Credit restriction". Check whether the
    amount payable changes when paid early, and whether the supplier carries a
    credit-restriction percentage.
27. Open an invoice, note the header "Weight", and add up its lines' weights.
28. Find an invoice from a supplier whose bank details changed. Check whether
    the old invoice still shows the old IBAN.

### Net prices

29. Open a product with "Group product" ticked and note what is different.
30. Find a product with more than one net price row and check whether
    "FromQty" differs between them.
31. Open a contract. Compare its validity dates against the "Valid from" and
    "Valid u/i" on each of its price rows.
32. Open a product carrying a "Product no. (old)" value and check what it is
    used for.

### StockOn advice

33. Pick a product on both Order advice and StockOn advice. Check whether Order
    advice's figure can be reconstructed from "Order Level",
    "Techn. Stk. + To receive", lead time and review time.
34. Read "Order Level (Kg. or Psc.)" against "Order Level", and
    "To order (Kg. or Psc.)" against "To order" — same figure in two units, or
    two different values?
35. Widen "1e productie/wals da..." and "productie/wals door" to read the full
    headings.
36. Read "Priority 1" and "Priority 2" across several rows and note their
    format.
37. Read one row's "Techn. Stk. + To receive", "Order Level" and
    "% Difference" together. Check whether the percentage is
    (Techn. Stk. + To receive minus Order Level) divided by Order Level.

### Action buttons

38. Work through the **"Buttons never opened"** table at the bottom of
    [ACTIONS.md](ACTIONS.md) — one screenshot each. The ones that matter most
    are `Return` / `Par. return` (do they raise a Purchase return order?),
    `Relocate`, `Workorder`, and `Correct products and stock` (which is
    probably what books the `Hego Voorraadcorrectie` receipts).
39. Identify the three unlabelled option quick buttons — `NG`, `F` and
    `DUPK320` — by pressing each on a test line and reading the `Option` row
    it adds.

### Stock on location

40. Press **Change APP…** and **Toon reserveringen…** (*show reservations*) on
    a lot. `APP` is now known to be a **per-tonne price** (`2050 / TN` in the
    product-search dialog); what is unknown is how it differs from the
    `Purchase price` column beside it. [doc](stock-on-location.md)
41. Find out what **Gip** stands for. The product master has
    `Gip → Artikelgroep` reading `PK316`; Stock on location has `Gipgroup`
    reading `P3040K15`. Open either dropdown.
42. Group Stock on location by `Warehouse` to list them — only the `Controle`
    view shows the column and it reads `00 He…` on every row, so there may be
    just one.

### Product and company master

43. Find a product bought from a German mill and check whether its `German`
    weight is populated — it is 0 on `PK316L40021`, so its purpose is unknown.
44. Expand `Counter Orders` and `Visit reports` on a company that has some —
    two panels seen nowhere else, captured by name only.

### Purchase order detail

45. Expand the **Workorders** panel on order `400253` — the link to the
    warehouse and production work orders a receipt raises. (The `Options` panel
    is answered: its own grid, with a `Per` column holding the pricing basis.)
46. Open the **Product Receipt Documents** panel, the last one on the order —
    captured by name only.

### Purchase orders and quotes

47. Widen "Time frame" on a row with data and read its value.
48. Find a row with "Deliberately not sent" ticked and check what stops it
    being sent. Check whether "Send" and "Must be sent" are ever both true, or
    both false.
49. Open a row's "Affiliate company details". Check whether the same set of
    affiliates appears on the unexplained company columns on Purchase quotes,
    Purchase receivals and Purchase invoices.
50. Open a document on both this screen and Purchase quotes. Compare
    "Reference" here against "Purchase Reference" there.
51. Find a row with "Consignment" ticked and check whether "Customer code" is
    populated there specifically, and empty on ordinary stock purchases.
52. Open one order's lines, sum their weights, and compare against the header
    "Weight (kg)" here.

## Answered

Everything settled so far has moved to **[ANSWERED.md](ANSWERED.md)** — this
file is only the open questions.
