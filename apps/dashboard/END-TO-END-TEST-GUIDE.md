===============================================================================
Phase 1 — Master data (the foundation)
===============================================================================

Nothing works until these exist. Do them first.

Step 1.1 — Create a Company (CREATE /companies/add)

This is the single most important form: it's the origin point for addresses,
contacts, communication settings, texts, roles, and follow-ups.

Do:

- Fill Company Name (Code is auto-assigned).
- Set roles — tick Customer and Supplier so this one company can be used on both
  the sales side and the purchase side while testing.
- Add at least one Address (tag it delivery so delivery reports pick it up).
- Add at least one Contact person (first/last name, email, city — many reports
  read the first contact).
- Optionally add a Communication Setting, a Text, and Sales settings
  (representative, customer group, region, credit limit).

Then check:

- REPORT /companies — your company appears.
- REPORT /addresses — the address appears, linked to the company.
- REPORT /communication-settings — the setting appears (if added).
- REPORT /texts — the text appears (if added).
- REPORT /customer-overview and /customers-and-prospects — appear (customer role).
- REPORT /suppliers — appears (supplier role).
- REPORT /credit-information-customers — appears with credit settings.

Step 1.2 — Create a Warehouse (CREATE /warehouses/add)

Creating a warehouse auto-creates an empty warehouse work order.

Then check:

- REPORT /warehouses — the warehouse appears.
- REPORT /warehouse-work-orders — a work order was auto-created for it.

Step 1.3 — Create a Warehouse Sub Section (CREATE /warehouse-sub-sections/add)

Link it to the warehouse from Step 1.2.

Then check:

- REPORT /warehouse-sub-sections — the sub section appears.

Step 1.4 — Create a Location (CREATE /locations/add)

A storage spot (bin/shelf) inside the warehouse.

Then check:

- REPORT /locations — the location appears.

Step 1.5 — Create a Machine (CREATE /machines/add)

Set its Stock Location to the location from Step 1.4.

Then check:

- REPORT /machines — the machine appears.

Step 1.6 — Create Contract Group and Contract

Do:

- On /contract-groups, click New Group (modal) — create a group.
- On /contracts/add, create a contract, pick the group, link it to your company.

Then check:

- REPORT /contracts — the contract appears.
- REPORT /contracts-per-customer — appears (company has customer role).
- REPORT /contracts-per-supplier — appears (company has supplier role).

Step 1.7 — Create Text Category (CREATE /text-categories/add)

Used to group the reusable text blocks.

Then check:

- REPORT /text-categories — the category appears.

Step 1.8 — Create Product Group then Product

Do:

- CREATE /product-groups/add — create a top-level group. Set a preferred supplier
  (your company) and a revenue group so reorder/revenue reports work.
- CREATE /products/new — create a product, assign it to that group. Tick Stock
  Product and set dimensions and theoretical weight.

Then check:

- REPORT /product-groups and REPORT /products — both appear.

===============================================================================
Phase 2 — Purchasing (this is what creates stock)
===============================================================================

There is no manual "add stock" screen. Stock lots are born from purchase orders
and production. So to get anything into the warehouse, buy it.

Step 2.1 — Purchase Quote / Purchase Request (optional)

Do:

- CREATE /purchase-quotes/new — request a supplier quote.
- CREATE /purchase-requests/new — internal request to buy.

Then check:

- REPORT /purchase-quotes and /purchase-requests.
- REPORT /purchase-orders-and-quotes and /purchase-quotes-overview.

Step 2.2 — Create a Purchase Order (CREATE /purchase-orders/new)

Pick your supplier company, add a product line for the product from Step 1.8.
Creating the order opens incoming stock (a pending stock lot plus an "in" movement).

Then check:

- REPORT /purchase-orders — appears.
- REPORT /purchase-lines — the line appears.
- REPORT /stock — a new stock lot exists (status pending/received).
- REPORT /stock-movements — an In movement with the purchase order as its source.
- REPORT /stock-on-location and /stock-history — reflect the new lot.
- REPORT /purchase-orders-to-be-received — the line shows as outstanding.

Step 2.3 — Create a Purchase Invoice (CREATE /purchase-invoices/add)

Match it to the supplier/purchase order. This draws down stock and posts to the
purchase ledger.

Then check:

- REPORT /purchase-invoices and /purchase-invoice-line.
- REPORT /purchase-invoices-to-be-received — should drop off once invoiced.
- REPORT /supplier-revenue and /supplier-revenue-per-revenue-group.
- REPORT /purchases-and-sales-per-revenue-group (purchase side).

Step 2.4 — Purchase Return Order (optional, CREATE /purchase-return-orders/new)

Then check:

- REPORT /purchase-return-orders — the return order appears.

===============================================================================
Phase 3 — Sales (this is what consumes stock)
===============================================================================

Now that stock exists, sell it.

Step 3.1 — Create a Quote (CREATE /quotes/new)

Pick your customer and contact.

Then check:

- REPORT /quotes — the quote appears.

Step 3.2 — Create an Order (CREATE /orders/new)

Pick the customer, add a product line for the stocked product. Creating the order
reserves stock against the lot from Phase 2.

Then check:

- REPORT /orders — appears.
- REPORT /order-lines — the line appears with cost/profit/margin.
- REPORT /stock — the lot's Reserved goes up, Available goes down.
- REPORT /reservations — a reservation row plus summary appear.
- REPORT /deliveries — the reserved line shows with a Deliver button.
- REPORT /deliveries-to-arrange — shows lines with no reservation (0 reserved).

Step 3.3 — Counter Order / Return Order (optional)

Do:

- CREATE /counter-orders/add — then check REPORT /counter-orders.
- CREATE /return-orders/new — then check REPORT /return-orders and /return-lines.

Step 3.4 — Deliver the order (ACTION /deliveries)

Click Deliver on the reserved line. This ships the goods and updates stock (an
"out" movement) and sets the line to delivered.

Then check:

- REPORT /deliveries — line flips to delivered with a delivery date.
- REPORT /stock and /stock-movements — an Out movement; remaining stock drops.

Step 3.5 — Create an Invoice (CREATE /invoices/add)

Bill the delivered order line. This posts accounting journal entries.

Then check:

- REPORT /invoices — appears with Excl./Incl. VAT totals.
- REPORT /invoice-lines — the billed line appears.
- REPORT /journal-entries — bookkeeping entries were posted.
- REPORT the customer revenue reports light up: /customer-revenue,
  /customer-revenue-per-revenue-group, /customer-revenue-per-product-group,
  /customer-revenue-per-revenue-group-split, /customer-revenue-sales-and-visits.
- REPORT /revenue-per-revenue-group, /revenue-per-product, /revenue-vs-budget.
- REPORT /customer-overview — the Invoices count and revenue update.

===============================================================================
Phase 4 — CRM and activity
===============================================================================

Step 4.1 — Create a Visit Report (CREATE /visit-reports/add)

Log a visit or phone contact against your company. Mark has taken place.

Then check:

- REPORT /visit-reports — appears.
- REPORT /visit-schedule, /change-visit-schedule, /to-visit-call — Last Call and
  Last Visit dates update from the completed report.
- REPORT /customer-overview — Visit count increments.

Step 4.2 — Add a Follow-up (company detail page /companies/{code})

Open your company, add a follow-up note in the follow-ups section.

Then check:

- REPORT /follow-ups — appears, newest first.

Step 4.3 — Create a Complaint (CREATE /complaints/new)

Log a complaint against the company/product.

Then check:

- REPORT /complaints — appears.
- REPORT /customer-overview — Complaints count increments.

===============================================================================
Phase 5 — Warehouse and production actions
===============================================================================

These pages act on data created upstream (or by planning processes).

- ACTION /stock — use Correct to adjust a lot's quantity, which creates a manual
  stock movement. Check REPORT /stock-movements (reason shows your note) and
  /freight-movements.
- ACTION /production-workorders — press Complete on a line, which books finished
  goods into stock (new lot plus "in" movement). Check REPORT /stock and
  /stock-movements.
- ACTION /transport-workorders — press Complete, which marks the line shipped
  (no stock change).
- REPORT /pick-statistics, /count-list-deviations, /warehouse-capacity,
  /production-capacity, /production-capacity-details, /capacity-checks,
  /time-registration, /transport-status-adjustments, /trip-data,
  /production-batches — these are read-only and depend on planning/scan processes;
  they may stay empty in a from-scratch test unless that data is seeded.

===============================================================================
Phase 6 — Financial blocks and advice reports
===============================================================================

Once orders, invoices and stock exist, confirm the aggregate reports compute:

- REPORT /financially-blocked — set a financial block flag on an order/quote first;
  the Unblock button here releases it and records who/when, then check REPORT
  /unblocked-orders.
- REPORT /blocked-deliveries — shows lines with a block flag set.
- REPORT /order-lines-still-to-be-called and /orders-still-to-be-called — need a
  call-off order where planned qty is greater than called-off qty.
- REPORT /order-advice, /stockon-advice, /sold-products-not-advised — reorder
  logic; needs stock plus sales history to produce suggestions.
- REPORT /charges, /journal-entries, /credit-information-customers,
  /inactive-companies, /remarks-per-company — verify they reflect your data.

===============================================================================
Quick dependency map (cheat sheet)
===============================================================================

Company (customer + supplier) leads to:

- Quotes / Orders / Counter Orders / Return Orders
- Purchase Quotes / Requests / Orders / Invoices
- Visit Reports / Follow-ups / Complaints
- Contracts

Product Group leads to Product, used on Order and Purchase Order lines.

Warehouse leads to Sub Section, then Location, then Machine.

Purchase Order creates a STOCK LOT (in).
The stock lot is reserved by an Order line.
Delivering the order removes stock (out).
The delivered line is then billed by an Invoice.
The Invoice posts Journal entries and feeds the Revenue reports.
Production Complete also creates a STOCK LOT (in).

Golden path (the 8 steps that exercise the whole system):

1. Company (customer + supplier)
2. Product Group
3. Product
4. Purchase Order (makes stock)
5. Order (reserves stock)
6. Deliver (ships stock)
7. Invoice (posts revenue + journal)
8. Visit Report + Complaint (CRM)

After these, roughly 90 percent of the read-only reports have data.
