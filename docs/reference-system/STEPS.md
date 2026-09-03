# Steps

Everything to check in the old system before the purchase screens can be
finished. Work through in order. Full detail on any step is in the linked doc,
under the matching question number.

## Order advice → [doc](purchase/order-advice.md)

1. Widen the "Reserved" column to read its full heading and confirm its unit.

## Sold products not on the order recommendation → [doc](purchase/sold-products-not-advised.md)

2. Open a product and read its group fields — check whether "Main
   group"/"Product group" is one hierarchy or two separate fields.
3. Press Show Data with a wide invoice-date range. Compare the product codes
    on this screen against the codes on Order advice.
4. Open a product and find its "Standard product" field. Note whether it is
    editable or derived.
5. Widen the "Revenue" and "Sales" columns on a row with data. Read their
    values against that product's invoice history.
6. Open a product and search its screens for a "PAC-Code" field, or
    right-click the column for a description.

## Purchase lines → [doc](purchase/purchase-lines.md)

7. Widen both truncated "Purchase order type" columns until fully readable,
    with data on screen. Compare their values.
8. Note the row count with "Only current purchasing lines" checked. Uncheck
    it, press Show Data, and compare. Check what the extra rows have in
    common.
9. Group the grid by "Line type" to see every distinct value with counts.
10. Group the grid by "Status". Check whether two lines of one order ever show
    different statuses.
11. Open a product and look for "Stock Category" and "Quality Code" fields.
12. Expand one of the older date groups and check whether those lines are
    still open.

## Purchase quotes → [doc](purchase/purchase-quotes.md)

13. Find a lapsed quote and open its "Expiration reason" dropdown to list
    every option. Group the grid by that column to see which are actually
    used.
14. Drag the "Status" header into the group bar to see every distinct value
    with counts.
15. Open a quote with all three reference fields filled. Read them against its
    header — check whether "Purchase Reference" matches a purchase order
    number.
16. Open a quote line. Check whether "Revenue group" is editable there or
    comes from the product.
17. Find a quote with "Consignation" ticked. Follow it through to the purchase
    order and receipt. Check whether the received lot is excluded from stock
    value.
18. Find a row where "Initials purchaser" and "Purchaser" disagree.
19. Compare "Company code" against the supplier on the same row. Check whether
    it is constant down the whole grid or matches the supplier's number.

## Purchase results → [doc](purchase/purchase-results.md)

20. Open Overviews → Logistics → Products. Open one product and read its
    group fields. Open a product group and check whether it has a parent.
21. Note the value for an old receipt. Check it again after the replacement
    price has been changed on that product — or check "Control Revaluation of
    stock due to FSP-changes" for a version history.
22. Find a purchase line received in two goes. Check whether it appears on
    this screen once or twice.
23. Press Show Data over a month where one product was received twice on
    different dates. Count the rows.
24. Read one row's three value columns and divide out the percentage.

## Purchase invoice line → [doc](purchase/purchase-invoice-line.md)

25. Set "Bookings date" to a month with invoices, press Show Data, and note
    the row count. Uncheck each of the two date checkboxes in turn, re-run
    each time, and note any change in count.
26. Open a product and look for a CBS/commodity-code field.
27. Widen the "Revenue products" column with data on screen and read what it
    holds.
28. Find an invoice from a supplier whose goods came from a third country and
    check what "Country" shows.
29. Open the "View" dropdown and list every saved view. Capture the
    default/blank one if it exists.
30. Check two rows with different products but the same CBS no. Check whether
    their "Qty" is comparable.

## Purchase invoices → [doc](purchase/purchase-invoices.md)

31. Open one purchase invoice and read all four dates off its header
    (Creation, Invoice, Expiration, Booking period). Check whether "Booking
    period" is derived from a date or set by hand.
32. Open a supplier company and look for both "Creditor no." and "Supplier
    code". Note which is editable and which is generated. Check Overviews →
    Finance → Journal entries for which one a posting carries.
33. Find an invoice with a non-zero "Credit restriction". Check whether the
    amount payable changes when it is paid early. Check the supplier's record
    for a credit-restriction percentage.
34. Open an invoice, note the header "Weight", and add up its lines' weights
    to see if they match.
35. Find an invoice from a supplier whose bank details changed at some point.
    Check whether the old invoice still shows the old IBAN.
36. Drag the "Status" header into the group bar to list every distinct value
    with counts. Note whether a blocked invoice shows as a status or a
    separate flag.
37. Read one invoice's "Invoice amount" and "VAT amount" against its printed
    total.

## Net prices → [doc](purchase/net-prices.md)

38. Select a net price row and click "Show Contract". List every field the
    contract screen shows.
39. Open a product with "Group product" ticked and note what is different
    about it.
40. Find a product with more than one net price row and check whether
    "FromQty" differs between them.
41. Open a contract. Compare its own validity dates against the "Valid
    from"/"Valid u/i" on each of its price rows.
42. Widen the "Net priceU" column across several rows and list every value it
    takes.
43. Open a product carrying a "Product no. (old)" value and check what it is
    used for.

## StockOn advice → [doc](purchase/stockon-advice.md)

44. Pick one product that appears on both Order advice and StockOn advice.
    Check whether Order advice's figure can be reconstructed from StockOn
    advice's columns ("Order Level", "Techn. Stk. + To receive", lead time,
    review time).
45. Open a StockOn advice row with data. Read "Order Level (Kg. or Psc.)"
    against "Order Level", and "To order (Kg. or Psc.)" against "To order".
    Check whether each pair is the same figure in two units or two different
    values.
46. Widen "1e productie/wals da..." and "productie/wals door" to read the full
    headings.
47. Widen "Determined by StockOp" with data on screen and list its values.
    Check a product's own screen for where "StockOp" is configured.
48. Open a product's stocking-policy setup and read the labels next to
    "Review time" and "Lead time" directly.
49. Open the "Lead time method" dropdown on a product's setup screen (or
    widen the column across rows) and list every value.
50. Find a row where "Evaluate/decide today?" is unticked. Compare how that
    product is treated versus a ticked one.
51. Read "Priority 1" and "Priority 2" across several rows with data and note
    their format.
52. Read one row's "Techn. Stk. + To receive", "Order Level", and
    "% Difference" together. Check whether the percentage is
    `(Techn. Stk. + To receive − Order Level) / Order Level`.

## Purchase receivals → [doc](purchase/purchase-receivals.md)

53. Widen columns 1–4 (the ones whose tooltip showed a raw field name) until
    each heading is fully readable, without relying on the tooltip.
54. Find a purchase line received in two separate deliveries and check whether
    it produces two rows on this screen. Compare "Qty(a)" and "Received Qty"
    on each row.
55. Group the grid by "Line status", then by "Receipt status", to list their
    distinct values. Check whether they ever disagree on the same row.
56. Open a purchase line with a non-zero "Price quantity (in gross price U.)"
    and compare it against the line's ordinary "Purchase U." and "Qty(p)".
57. Open a receipt row with a non-zero "Invoiced (Prod.)" value and check
    whether it points at a purchase invoice line or at a production work
    order.
58. Set the "Scheduled delivery date" filter to a narrow range and check
    whether every returned row's "Delivery date (p)" falls inside it.
59. Compare "Company code"/"Company name" on a receipt row against the
    supplier on that line's purchase order.

## Import purchase invoices → [doc](purchase/import-purchase-invoices.md)

60. Ask whether purchase invoices actually arrive electronically today (EDI, a
    supplier portal, e-mail parsing), or whether this screen sits empty/unused.
    If unused, skip the rest of this section — the screen does not need
    building.
61. Widen "Final destination" and "Specification" on a row with data and read
    their values.
62. Widen "Role" and read a few values.
63. Open a row and check whether double-clicking it opens a specific screen,
    to see what "Work panel" names.
64. Open a row with data in "Receive data"/"Data sent" and use "Show File" to
    check whether it opens the raw payload.

## Purchase orders and quotes → [doc](purchase/purchase-orders-and-quotes.md)

65. Open one quote row and one order row on this screen. Open each one's own
    detail screen and check whether both open the same kind of window with an
    "Order type" field, or two different screens.
66. Find a quote that was converted to an order. Check whether the order row's
    "Converted from/to" shows the quote number, and the quote row's shows the
    resulting order number.
67. Group the grid by "Status" to list every distinct value with counts.
    Check whether quote-type and order-type values are mixed together or
    cleanly separate.
68. Widen "Time frame" on a row with data and read its value.
69. Open the "Order method" dropdown on a row to list every option. Find a row
    with "Deliberately not sent" ticked and check what stops it being sent
    automatically. Check whether "Send" and "Must be sent" are ever both true,
    or ever both false.
70. Open a row's "Affiliate company details" and read what it shows. Note its
    values and check whether the same set of affiliates appears on the
    unexplained company columns on Purchase quotes, Purchase receivals, and
    Purchase invoices.
71. Open a document that appears on both this screen and Purchase quotes.
    Compare "Reference" here against "Purchase Reference" there.
72. Find a row with "Consignment" ticked and check whether "Customer code" is
    populated there specifically, and empty on ordinary stock purchases.
73. Open the "Classification code" dropdown on a row and list every option.
74. Open one order's lines, sum their weights, and compare against the header
    "Weight (kg)" on this screen.

## Done

All 12 Purchase screens are captured. No more screens to send for this group.
