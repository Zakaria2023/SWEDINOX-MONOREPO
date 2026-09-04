# Steps

Sorted by what a wrong answer costs, not by screen.

- **Tier 1** changes the database or the logic. Worth your time.
- **Tier 2** is lists of values. Only needed when we build that screen.
- **Tier 3** is labels. I will guess, and fix it in one line if I guess wrong.

If you only ever do one section, do Tier 1. It is four items.

## Tier 1 — the ones that change code

1. **Purchase quotes** → find a quote with "Consignation" ticked, follow it
   through to the purchase order and receipt, and check whether the received
   lot is excluded from stock value. [doc](purchase/purchase-quotes.md)
2. **Purchase receivals** → find a purchase line received in two separate
   deliveries and check whether it produces one row or two. Compare "Qty(a)"
   and "Received Qty" on each. [doc](purchase/purchase-receivals.md)
3. **Import purchase invoices** → do purchase invoices actually arrive
   electronically today (EDI, supplier portal, e-mail parsing), or does this
   screen sit unused? If unused, the whole screen leaves scope.
   [doc](purchase/import-purchase-invoices.md)
4. **StockOn advice** → on the product screen, "Use StockOp for this product?"
   is unticked and the system says its parameters have never been calculated.
   Check a handful of other products for the same. If StockOp is switched off
   everywhere, the whole StockOn advice screen leaves scope.
   [doc](purchase/stockon-advice.md)

## Tier 2 — lists of values, needed when we build that screen

5. **Sold products** → find a second product whose "Stock U." is not KG. Read
   its "Sales" against its "Avg. Monthly consumption last year" and divide out
   the factor, to confirm the consumption column is in the stock unit while
   Sales is in kilos.
6. **Purchase lines** → group the grid by "Line type" to see every distinct
   value with counts.
7. **Purchase lines** → group by "Status". Check whether two lines of one
   order ever show different statuses.
8. **Purchase quotes** → find a lapsed quote and open its "Expiration reason"
   dropdown to list every option. Group by that column to see which are used.
9. **Purchase quotes** → group by "Status" to see every distinct value.
10. **Purchase invoices** → group by "Status". Note whether a blocked invoice
    is a status or a separate flag. [doc](purchase/purchase-invoices.md)
11. **Purchase receivals** → group by "Line status", then by "Receipt status".
    Check whether they ever disagree on the same row.
12. **Orders and quotes** → group by "Status". Check whether quote-type and
    order-type values mix or stay separate.
    [doc](purchase/purchase-orders-and-quotes.md)
13. **Orders and quotes** → open the "Order method" dropdown to list every
    option.
14. **Orders and quotes** → open the "Classification code" dropdown to list
    every option.
15. **StockOn advice** → open the "Lead time method" dropdown on a product's
    setup screen and list every value. [doc](purchase/stockon-advice.md)
16. **StockOn advice** → widen "Determined by StockOp" with data on screen and
    list its values. Check a product's screen for where "StockOp" is set.
17. **Net prices** → widen "Net priceU" across several rows and list every
    value it takes. [doc](purchase/net-prices.md)
18. **Net prices** → select a row, click "Show Contract", and list every field
    the contract screen shows.

## Tier 3 — labels and details, skip unless something looks wrong

### Purchase lines

19. Note the row count with "Only current purchasing lines" checked. Uncheck
    it, press Show Data, and compare what the extra rows have in common.
20. Open a product and look for "Stock Category" and "Quality Code" fields.
21. Expand one of the older date groups and check whether those lines are
    still open.

### Purchase quotes

22. Open a quote with all three reference fields filled. Check whether
    "Purchase Reference" matches a purchase order number.
23. Open a quote line. Check whether "Revenue group" is editable there or
    comes from the product.
24. Find a row where "Initials purchaser" and "Purchaser" disagree.
25. Compare "Company code" against the supplier on the same row — constant
    down the grid, or matching the supplier's number?

### Purchase results

26. Note the value for an old receipt. Check it again after the replacement
    price has changed on that product — or check "Control Revaluation of stock
    due to FSP-changes" for a version history.
27. Find a purchase line received in two goes. Check whether it appears once
    or twice here.
28. Press Show Data over a month where one product was received twice on
    different dates. Count the rows.

### Purchase invoice line

29. Set "Bookings date" to a month with invoices and note the row count.
    Uncheck each of the two date checkboxes in turn, re-running each time.
    [doc](purchase/purchase-invoice-line.md)
30. Open a product and look for a CBS/commodity-code field.
31. Widen the "Revenue products" column with data on screen and read what it
    holds.
32. Find an invoice from a supplier whose goods came from a third country and
    check what "Country" shows.
33. Open the "View" dropdown and list every saved view.
34. Check two rows with different products but the same CBS no. Check whether
    their "Qty" is comparable.

### Purchase invoices

35. Open one invoice and read all four dates off its header (Creation,
    Invoice, Expiration, Booking period). Check whether "Booking period" is
    derived or set by hand.
36. Open a supplier and look for both "Creditor no." and "Supplier code". Note
    which is editable and which is generated, and which one a posting carries
    under Overviews to Finance to Journal entries.
37. Find an invoice with a non-zero "Credit restriction". Check whether the
    amount payable changes when paid early, and whether the supplier carries a
    credit-restriction percentage.
38. Open an invoice, note the header "Weight", and add up its lines' weights.
39. Find an invoice from a supplier whose bank details changed. Check whether
    the old invoice still shows the old IBAN.
40. Read one invoice's "Invoice amount" and "VAT amount" against its printed
    total.

### Net prices

41. Open a product with "Group product" ticked and note what is different.
42. Find a product with more than one net price row and check whether
    "FromQty" differs between them.
43. Open a contract. Compare its validity dates against the "Valid from" and
    "Valid u/i" on each of its price rows.
44. Open a product carrying a "Product no. (old)" value and check what it is
    used for.

### StockOn advice

45. Pick a product on both Order advice and StockOn advice. Check whether Order
    advice's figure can be reconstructed from "Order Level",
    "Techn. Stk. + To receive", lead time and review time.
46. Read "Order Level (Kg. or Psc.)" against "Order Level", and
    "To order (Kg. or Psc.)" against "To order" — same figure in two units, or
    two different values?
47. Widen "1e productie/wals da..." and "productie/wals door" to read the full
    headings.
48. Read "Priority 1" and "Priority 2" across several rows and note their
    format.
49. Read one row's "Techn. Stk. + To receive", "Order Level" and
    "% Difference" together. Check whether the percentage is
    (Techn. Stk. + To receive minus Order Level) divided by Order Level.

### Purchase receivals

50. Widen columns 1 to 4 (the ones whose tooltip showed a raw field name) until
    each heading is readable without the tooltip.
51. Open a purchase line with a non-zero "Price quantity (in gross price U.)"
    and compare it against the line's ordinary "Purchase U." and "Qty(p)".
52. Open a receipt row with a non-zero "Invoiced (Prod.)" value and check
    whether it points at a purchase invoice line or a production work order.
53. Set "Scheduled delivery date" to a narrow range and check whether every
    row's "Delivery date (p)" falls inside it.
54. Compare "Company code" and "Company name" on a receipt row against the
    supplier on that line's purchase order.

### Import purchase invoices

55. Widen "Final destination" and "Specification" on a row with data.
56. Widen "Role" and read a few values.
57. Open a row and check whether double-clicking opens a specific screen, to
    see what "Work panel" names.
58. Open a row with data in "Receive data" or "Data sent" and use "Show File"
    to check whether it opens the raw payload.

### Purchase orders and quotes

59. Open one quote row and one order row. Check whether both open the same kind
    of window with an "Order type" field, or two different screens.
60. Find a quote converted to an order. Check whether "Converted from/to" shows
    the other document's number on both rows.
61. Widen "Time frame" on a row with data and read its value.
62. Find a row with "Deliberately not sent" ticked and check what stops it
    being sent. Check whether "Send" and "Must be sent" are ever both true, or
    both false.
63. Open a row's "Affiliate company details". Check whether the same set of
    affiliates appears on the unexplained company columns on Purchase quotes,
    Purchase receivals and Purchase invoices.
64. Open a document on both this screen and Purchase quotes. Compare
    "Reference" here against "Purchase Reference" there.
65. Find a row with "Consignment" ticked and check whether "Customer code" is
    populated there specifically, and empty on ordinary stock purchases.
66. Open one order's lines, sum their weights, and compare against the header
    "Weight (kg)" here.

## Answered and removed

Kept as a record of what your checks have already settled, so nothing gets
asked twice.

- The product hierarchy — one tree, read from the root down.
  [see](purchase/sold-products-not-advised.md#answered)
- "Revenue" is money, "Sales" is a weight in kilos.
- "Avg. Monthly consumption last year" — trailing 12 months, divided by 12.
  [see](QUESTIONS.md)
- Consumption is counted from **invoices**, not deliveries or stock movements.
- "Reserved" on Order advice is in the purchase unit, not kilos.
  [see](purchase/order-advice.md)
- "To be received short term" excludes the reserved part of an open line.
- The purchasing unit list — eight values, not two.
- **Order advice is settled outright** by a 5,535-row export of both views,
  kept in [`exports/`](exports/). Every formula on the screen is proved:
  the ÷12 / ÷24 / ÷36 consumption windows, the min/max rounding, both
  coverages, the advice rule, and the fact that the engine runs in **purchase
  units**, not kilos. "To be received long term", "Not reserved call-off",
  "Consign.", "Order advice code" and "PAC-Code" are unused on every row.
  See [order-advice.md](purchase/order-advice.md).
- The group hierarchy is four levels deep, linked by "Material group".
- "Classification features → Product group" is the product's shape, not its
  place in the hierarchy.
- "Standard product" is greyed out, so the system derives it.
- Purchase lines shows "Purchase order type" twice — one field, not two.
- **Order advice is verified**, not just matched: the export was seeded into our
  own database, the real Server Action driven against it, and all six checkable
  columns agree on **262 of 262** rows — the same two products advised, at the
  same quantities. Two logic bugs fell out of that and are fixed:
  - the position is held **natively in purchase units**, never converted from a
    weight, which is how the reference prints a stock for a product whose
    weight per piece is blank;
  - coverage divides by the **printed** average, rounded to one decimal —
    `489 / 0,9 = 543,3`, not `489 / (11/12) = 533,5`.
- **Sold products**: consumption counts **stock units ÷ 12** while the `Sales`
  column beside it is **kilograms**. Proved on `SC304`, stocked in KG, where
  `45,22865 / 12 = 3,76905416666667` to the last decimal, and on the coil
  products, whose consumption is a small whole number of coils over twelve.
- **Purchase results**: `Subgroup` is the group **directly above the product** —
  the same level Sold products calls `Product group`, with `Main group` the
  root above it. Read off the export's own Main group / Subgroup / Product
  triples.
- **Purchase results**: `Replacement value` is **zero on all 1,800 rows**, so
  both difference columns are dead and the percentage cannot be reconstructed.
- **"Making order advices" is a property of the product, not of its group.**
  The two exports share 20 groups but not a single product code, and 83
  products sit on Sold products while a sibling **in the same group**, equally
  a stock product, sits on Order advice — `CAA1050020` excluded where
  `CAA1050030` is included. Both screens now read `Products.makingOrderAdvices`;
  the group keeps its copy as a default for the form. The column already
  existed on both tables, so no schema change was needed.
- **Sold products is verified**, the same way Order advice was: its 175-row
  export seeded and diffed against our screen — **175 of 175 on all eight
  checkable columns**, and exactly 175 rows returned, so none of the 5,398
  Order-advice products leak in.

## Done

All 12 Purchase screens are captured. No more screens to send for this group.
