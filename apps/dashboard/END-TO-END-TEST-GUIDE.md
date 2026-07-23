Step 1.1 — Create the company

DO: /companies/add

- Company name (the code is auto-assigned).
- Roles: tick BOTH Customer and Supplier (at least one role is required — the
  form refuses to save with none). Using both lets this one company drive the
  sales side and the purchase side.
- Add at least one Address; tag it Delivery.
- Add at least one Contact (last name is required — an empty contact is
  rejected). Give it a first name, email and city too; many reports read the
  first contact.
- Optionally add a Communication setting, a Text, and Sales settings
  (representative, customer group, region, credit limit).

CHECK:

- /companies — the company appears.
- /addresses — the address appears, linked to the company.
- /contact-persons-customers-and-prospects — the contact appears (customer role).
- /contact-persons-suppliers — the contact appears (supplier role).
- /customer-overview and /customers-and-prospects — appear (customer role).
- /suppliers — appears (supplier role).
- /credit-information-customers — appears with the credit settings.
- /communication-settings and /texts — appear if you added them.
- /address-distances — one row per address pair (distance stays blank until a
  routing process fills it).

Step 1.2 — Warehouse, sub section, location, machine

DO:

- /warehouses/add — create a warehouse. This auto-creates an empty warehouse
  work order.
- /warehouse-sub-sections/add — create a sub section, linked to the warehouse.
- /locations/add — create a storage location (bin/shelf) in the warehouse.
- /machines/add — create a machine; set its stock location to the location above.

CHECK:

- /warehouses, /warehouse-sub-sections, /locations, /machines — all appear.
- /warehouse-work-orders — a work order was auto-created for the warehouse.

Step 1.3 — Contract group and contract

DO:

- /contract-groups — New Group (modal) — create a group.
- /contracts/add — create a contract, pick the group, link it to the company.
  To make the sales pricing meaningful later, set a discount on it (a group
  discount or line discount tier, or a fixed gross price).

CHECK:

- /contracts — the contract appears.
- /contracts-per-customer — appears (company has the customer role).
- /contracts-per-supplier — appears (company has the supplier role).

Step 1.4 — Text category

DO: /text-categories/add — create a category (groups reusable text blocks).
CHECK: /text-categories — the category appears.

Step 1.5 — Product group and product

DO:

- /product-groups/add — create a top-level group. Set a preferred supplier
  (the company) and a revenue group so reorder and revenue reports work.
- /products/new — create a product in that group. Tick Stock product and
  Standard product, set dimensions and theoretical weight, and set a price unit.

CHECK:

- /product-groups and /products — both appear.

Step 1.6 — Price the catalogue

DO: /product-prices — set "Default markup %" (25 is a good test value) and click
Recalculate prices. For every product it computes:

- APP — the weighted average of what was actually paid, from received goods. It
  is 0,00 until Flow 2 has receipts, so run this AGAIN after Step 2.3.
- Replacement price — kept as maintained, or seeded from the APP when still 0.
- Base price — the fixed sales price if set, otherwise replacement price plus
  the markup. This is the list price sales prices start from.
- Price date — set to today.

CHECK:

- /product-prices — Replacement price, Base price, Markup and APP are filled,
  with the product's main group, subgroup and preferred supplier alongside.

Step 1.7 — Contract net prices (agreed prices)

DO: /net-prices — click Generate from contracts. For every customer contract
with no net prices yet, it prices the products that customer has ordered (or the
standard catalogue) from the base price with the contract's discounts applied,
producing one row per quantity break.

CHECK:

- /net-prices — one row per contract/product/quantity break, showing base price,
  discount, net price and the validity window. (Values are only meaningful once
  Step 1.6 has produced non-zero base prices.)

Step 1.8 — Option prices (processing options)

DO: /option-prices-per-product — this lists the per-product prices of the
processing options (sawing, grinding, etc.) defined as sales options.

CHECK:

- /option-prices-per-product — appears with option code, price unit and validity.

===============================================================================
FLOW 2 — Purchasing and stock (this is what creates stock)
===============================================================================

There is no manual "add stock" screen. Stock is born from purchase orders and
from production. To get anything into the warehouse, buy it.

Step 2.1 — Purchase quote / request (optional)

DO:

- /purchase-quotes/new — request a supplier quote (saves the header only).
- /purchase-requests/new — internal request to buy.
- /purchase-quotes-overview — click Generate quote lines to fill each empty
  quote with lines (from what has been ordered from that supplier, or their
  catalogue). Quotes that already have lines are skipped.

CHECK:

- /purchase-quotes, /purchase-requests, /purchase-orders-and-quotes.
- /purchase-quotes-overview — one row per generated quote line.

Step 2.2 — Purchase order (makes stock)

DO: /purchase-orders/new — pick the supplier company, add a product line for the
product from Step 1.5. Creating the order opens incoming stock (a pending stock
lot plus an "in" movement).

CHECK:

- /purchase-orders — appears.
- /purchase-lines — the line appears.
- /stock — a new stock lot exists (status pending).
- /stock-movements — an In movement with the purchase order as its source.
- /stock-on-location and /stock-history — reflect the new lot.
- /purchase-orders-to-be-received — the line shows as outstanding.

Step 2.3 — Receive the goods (per line or all)

DO: /purchase-orders-to-be-received. Two ways, both real:

- Per line: click Receive on a single line's Action button.
- All at once: click Receive goods (top right) to receive every open line.
  Each records a receival and marks the line received.

Then re-run /product-prices — Recalculate prices, so APP / replacement / base
price stop being 0,00 now that there is a receipt to cost from.

CHECK:

- /purchase-receivals — one row per received line.
- /receipts — the same receipts totalled per date, supplier and product.
- /purchase-results — purchase value against today's replacement price.
- /purchase-invoices-to-be-received — a received-but-not-yet-invoiced order
  appears here, and drops off once you invoice it (Step 2.4).

Step 2.4 — Purchase invoice

DO: /purchase-invoices/add — pick the supplier. A Stock items section lists the
supplier's pending lots. Click Add line and pick a lot with a quantity for every
line you want to invoice — an invoice saved with no lines has a 0,00 total and
produces no invoice lines. Adding lines draws down that stock and posts to the
purchase ledger.

CHECK:

- /purchase-invoices — the invoice appears.
- /purchase-invoice-line — one row per line you added.
- /supplier-revenue and /supplier-revenue-per-revenue-group.
- /purchases-and-sales-per-revenue-group (purchase side).

Step 2.5 — Purchase return order (optional)

DO: /purchase-return-orders/new.
CHECK: /purchase-return-orders — the return order appears.

===============================================================================
FLOW 3 — Sales (this is what consumes stock)
===============================================================================

Now that stock exists, sell it.

Step 3.1 — Quote with lines

DO: /quotes/new — pick the customer and contact. In the Lines section, add each
line: pick a product, enter quantity, dimensions and options, click Add line.
Prices are NOT typed — on save they are resolved on the server from:

1. the contract's agreed net price for the product, if one exists; else
2. the product's base price with the contract's group/line discounts; else
3. the base price on its own.
   Cost is the product's replacement price, so profit and margin are real.

CHECK:

- /quotes — the quote appears; its header totals (materials revenue, total
  excl./incl. VAT, weight, avg. kilo price) roll up from the lines.
- /quote-lines — one row per quoted line, with gross price, discounts, net
  price, amount, cost, profit and margin.

Step 3.2 — Convert the quote into an order

DO: /quote-lines — in the "Convert quote to order" box pick the quote and click
Convert. Each quote line is allocated against the pending stock lots for its
product (oldest receipt first, spanning lots), reserving stock the same way the
order form does. The new order inherits the quote's customer, references,
delivery/payment terms, order-type flags and contract. A stock shortfall refuses
the whole conversion and names the short product — buy/receive more first.

CHECK:

- /quote-lines — "Converted to" names the new order; the line status is Released.
- /orders and /order-lines — the new order and its priced lines appear.
- /stock — the lot's Reserved goes up, Available goes down.
- /reservations — a reservation row plus summary appear.
- /deliveries — the reserved line shows with a Deliver button.

Step 3.3 — Create an order directly (alternative to 3.2)

DO: /orders/new — pick the customer, add a product line for the stocked product.
Creating the order reserves stock against the lot from Flow 2. (This is the
manual route; converting a quote in Step 3.2 produces the same result.)

CHECK: same as Step 3.2 (orders, order-lines, stock, reservations, deliveries).

- /deliveries-to-arrange — shows lines with no reservation (0 reserved).

Step 3.4 — Deliver the order

DO: /deliveries — click Deliver on the reserved line. This ships the goods, adds
an "out" stock movement and sets the line to delivered.

CHECK:

- /deliveries — the line flips to delivered with a delivery date.
- /stock and /stock-movements — an Out movement; remaining stock drops.

Step 3.5 — Invoice the delivered line

DO: /invoices/add — bill the delivered order line. This posts accounting journal
entries.

CHECK:

- /invoices — appears with Excl./Incl. VAT totals.
- /invoice-lines — the billed line appears.
- /journal-entries — bookkeeping entries were posted.
- /customer-revenue and its variants (per revenue group, per product group,
  per revenue group split, sales and visits) light up.
- /revenue-per-revenue-group, /revenue-per-product, /revenue-vs-budget.
- /customer-overview — the Invoices count and revenue update.

Step 3.6 — Counter order / return order / return lines (optional)

DO:

- /counter-orders/add — then check /counter-orders.
- /return-orders/new — saves the return header; then check /return-orders.
- /return-lines — click Generate from orders to create a return line per order
  item (the New Return Order form does not capture line items).

CHECK: /counter-orders, /return-orders, /return-lines.

Step 3.7 — Charges and options

DO:

- /charges — click Generate from orders to turn each order's lines and surcharges
  into charge records. Orders already charged are skipped.
- /options — the options revenue report; fills once order lines carry options.

CHECK: /charges (customer, revenue group, amount, cost, profit); /options.

===============================================================================
FLOW 4 — Production and transport
===============================================================================

These act on the order lines created in Flow 3.

Step 4.1 — Production work orders

DO: /production-workorders — click Generate from orders to turn order lines into
production work-order lines (needs at least one machine and one order). Then
press Complete on a line, which books finished goods into stock (a new lot plus
an "in" movement).

CHECK: /production-workorders, /stock, /stock-movements.

Step 4.2 — Transport work orders

DO: /transport-workorders — click Generate from orders to turn order lines into a
new trip's transport lines (delivered to each order's company). Then press
Complete, which marks the line shipped (no stock change — the stock already left
at delivery).

CHECK: /transport-workorders, /trip-data.

Step 4.3 — Manual stock correction

DO: /stock — use Correct on a lot to adjust its quantity, which creates a manual
stock movement.

CHECK:

- /stock-movements — the correction shows with your note.
- /freight-movements — the goods-flow ledger mirrors every stock movement
  (receipt, sale, production, correction) with its running balance.

===============================================================================
FLOW 5 — CRM (visits, follow-ups, complaints)
===============================================================================

Step 5.1 — Visit report and resolve it

DO:

- /visit-reports/add — log a visit or phone contact against the company.
- /visit-reports — click Resolve on the report's Action button. This marks it as
  having taken place (and stamps today's visit date if it had none). A resolved
  report is what the schedule and overview reports read.

CHECK:

- /visit-reports — the report shows Resolved.
- /visit-schedule, /change-visit-schedule, /to-visit-call — Last Call and Last
  Visit dates update from the resolved report.
- /customer-overview — the Visit count increments.

Step 5.2 — Follow-up

DO: open the company (/companies -> the company's detail page) and add a
follow-up note in the follow-ups section.

CHECK: /follow-ups — appears, newest first.

Step 5.3 — Complaint and complaint lines

DO:

- /complaints/new — log a complaint against the company/product.
- /complaint-lines — click Generate from complaints to create the per-item lines.

CHECK:

- /complaints — appears.
- /complaint-lines — one line per complaint item.
- /customer-overview — the Complaints count increments.

===============================================================================
FLOW 6 — Finance controls, advice and statistics
===============================================================================

Once orders, invoices and stock exist, confirm the aggregate reports compute.

Step 6.1 — Financial block and unblock

DO: set a financial block flag on an order/quote (the create forms have the
flag), then /financially-blocked — click Unblock to release it (records who/when).

CHECK:

- /financially-blocked — the blocked order/quote is listed, then clears.
- /unblocked-orders — the released order appears.
- /blocked-deliveries — shows lines with a delivery block flag set.

Step 6.2 — Call-off and advice reports

CHECK:

- /order-lines-still-to-be-called and /orders-still-to-be-called — every order
  line's planned quantity is the ordered amount with nothing called off yet, so
  the full quantity shows as still to be called.
- /order-advice, /sold-products-not-advised — reorder logic; needs stock plus
  sales history.
- /stockon-advice — lists stock products whose product group has "Use StockOp"
  enabled (set that flag and a lead time / review period on the group).

Step 6.3 — SFN goods-flow return

DO: /freight-flow — expand SFN classification and set each traded counterparty to
Producer / SFN member / Non-member (unclassified counts as non-member). Domestic
vs abroad comes from the company's main address country.

CHECK: /freight-flow — the monthly goods flow per revenue group, in kilograms:
starting stock carried forward, receipts split by supplier, sales split by
customer, stock difference, ending inventory (which always reconciles), and the
outstanding order book. Leave year/month blank for the current period.

Step 6.4 — Inactive companies and remaining reports

DO: /companies — the Inactive button in a row flags a company by hand (it turns
into Activate to undo).

CHECK:

- /inactive-companies — customers/prospects with no order in 12 months, plus any
  you flagged.
- /journal-entries, /credit-information-customers, /remarks-per-company — reflect
  your data.

===============================================================================
Quick dependency map
===============================================================================

Company (customer + supplier) leads to:

- Quotes / Orders / Counter orders / Return orders
- Purchase quotes / requests / orders / invoices
- Visit reports / Follow-ups / Complaints
- Contracts and their net prices

Product group -> Product -> Product prices -> Net prices, used on quote and
order lines.

Warehouse -> Sub section -> Location -> Machine.

Purchase order creates a STOCK LOT (in).
Receiving it fills the receivals / receipts / results reports.
A Quote's lines convert into an Order, which reserves the stock lot.
Delivering the order removes stock (out).
The delivered line is billed by an Invoice, which posts Journal entries and feeds
the revenue reports.
Production Complete also creates a STOCK LOT (in).
Every stock movement is mirrored into the Freight movement ledger, which the SFN
freight-flow return totals per month and revenue group.

Golden path (the shortest run that exercises the whole system):

1. Company (customer + supplier)
2. Product group -> Product -> Recalculate prices
3. Purchase order -> Receive goods (makes stock) -> Recalculate prices again
4. Quote with lines -> Convert to order (reserves stock)
5. Deliver (ships stock)
6. Invoice (posts revenue + journal)
7. Visit report -> Resolve, and Complaint -> Generate complaint lines

After these, roughly 90 percent of the read-only reports have data.

===============================================================================
Pages that stay empty (planning / scan / lookup — no form writes to them)
===============================================================================

/nesting, /reoptimize, /sawing-layouts, /pick-statistics,
/count-list-deviations, /capacity-checks, /production-capacity,
/production-capacity-details, /warehouse-capacity, /time-registration,
/transport-status-adjustments, /production-batches, /customer-stock (until goods
are consigned), /address-distances (until a routing process runs), /industries
(lookup data). These depend on planning, scanning or optimisation processes that
the basic create flow does not write to, so they stay empty unless that data is
seeded.
