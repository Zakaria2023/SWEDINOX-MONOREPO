===============================================================================
END-TO-END TEST GUIDE
===============================================================================

How to drive the whole dashboard by hand, in the order the data has to be created,
with what each screen actually computes.

Read the two rules below before starting — most "the screen is empty" confusion
comes from one of them:

- Nothing is priced by typing a price. Sales prices, costs, margins and stock
  valuations are all resolved on the server at the moment a document is written,
  and snapshotted onto it. Re-pricing the catalogue later never rewrites a
  document already raised.
- A product has no purchase price. What an article costs is whatever a supplier
  billed for it, so it is entered once on their invoice, and every cost figure
  in the app — average purchase price, the price it would cost to re-buy, cost
  of sales, stock valuation — is read back from there. The product screen holds
  sales prices only.
- Stock is never created by hand. It is born from a purchase invoice and from
  production, and it dies at delivery. There is no "add stock" screen.

Flows must be run in order. Within a flow, steps marked (optional) can be
skipped.

===============================================================================
FLOW 1 — Masterdata (nothing else works until this exists)
===============================================================================

Step 1.1 — Create the company

DO: /companies/add

- Company name (the code is auto-assigned).
- Roles: tick BOTH Customer and Supplier (at least one role is required — the
  form refuses to save with none). Using both lets this one company drive the
  sales side and the purchase side.
- Add at least one Address; tag it Delivery.
- Add at least one Contact (last name is required — an empty contact is
  rejected). Give it a first name, email and city too; many reports read the
  first contact, and a contact with an email is sent a welcome email once the
  company commits.
- Debtor section: set a Credit limit and Payment terms. Both matter later —
  the limit blocks orders (Step 3.3) and the term decides the due date, the
  early-payment discount and the credit-restriction surcharge on every invoice.
- Leave "Reminder" ticked unless you want to test a debtor who is never chased
  (Step 7.4).
- Optionally add a Communication setting, a Text, and Sales settings
  (representative, customer group, region).

CHECK:

- /companies — the company appears.
- /addresses — the address appears, linked to the company.
- /contact-persons-customers-and-prospects — the contact appears (customer role).
- /contact-persons-suppliers — the contact appears (supplier role).
- /customer-overview and /customers-and-prospects — appear (customer role).
- /suppliers — appears (supplier role).
- /credit-information-customers — appears with the credit settings, the credit
  space still equal to the limit, and no ageing markers yet.
- /communication-settings and /texts — appear if you added them.
- /address-distances — one row per address pair (distance stays blank until a
  routing process fills it).

Note on emails: a contact with an email address is welcomed when the company is
created, and also when a contact is added later on /companies/<uuid>/edit/contacts.
Editing an existing contact deliberately sends nothing — an edit gives no way to
tell a newly typed address from a corrected one.

Step 1.2 — Warehouse, sub section, location, machine

DO:

- /warehouses/add — create a warehouse. This auto-creates an empty warehouse
  work order.
- /warehouse-sub-sections/add — create a sub section, linked to the warehouse.
- /locations/add — create a storage location (bin/shelf) in the warehouse.
- /machines/add — create a machine; set its stock location to the location above.
  Production needs at least one machine (Step 6.1).

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
Recalculate prices. It writes the sales side only:

- Base price — the fixed sales price if set, otherwise the article's cost plus
  the markup. This is the list price sales prices start from.
- Markup — the product's own, or the default you typed when it has none.
- Price date — set to today.

The cost it marks up is not stored on the product: it is the last price a
supplier invoiced the article at, falling back to the average of every invoiced
line. Until Flow 2 has booked a purchase invoice there is no such price, so base
price comes out 0,00 — run this AGAIN after Step 2.4.

CHECK:

- /product-prices — Base price and Markup are filled, alongside the article's
  Last invoiced price and APP (both read from the purchase invoices, so both are
  still 0,00 at this stage) and its main group, subgroup and preferred supplier.
- /products/<uuid> — the Sales prices panel holds what you just computed. The
  Purchase cost panel below it is read-only and still empty: nothing has been
  invoiced yet.

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

Step 1.9 — Create the chart of accounts

DO: /trial-balance — if the amber panel offers "Create the standard chart of
accounts", click it. It writes the fifteen accounts the postings use. It is
additive and safe to re-run: an account somebody has renamed is never
overwritten.

CHECK:

- /trial-balance — the report is empty (nothing has posted yet) and no account
  numbers are flagged as missing from the chart.

The accounts, because the rest of this guide names them:

  1100 Bank                     3000 Inventory
  1300 Debtors                  3100 Goods returned, not credited
  1520 VAT reclaimable          3200 Goods delivered, not invoiced
  1530 VAT payable              4700 Discount granted
  1600 Creditors                4750 Credit restriction
  1999 Differences              7000 Cost of sales
                                7100 Purchase costs
  8000 Sales revenue            7200 Inventory differences

===============================================================================
FLOW 2 — Purchasing and stock (this is what creates stock)
===============================================================================

The purchase invoice is the goods receipt in this system. That is why there is no
goods-received-not-invoiced account: stock and the supplier debt appear together.

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

Step 2.2 — Purchase order (opens incoming stock)

DO: /purchase-orders/new — pick the supplier company, add a product line for the
product from Step 1.5, with a purchase price. Creating the order opens incoming
stock (a pending stock lot plus an "in" movement) and emails the order to the
supplier.

The price matters: it becomes the lot's valuation price, which becomes the cost
of sales when the goods are eventually sold. A line saved at 0,00 produces a lot
worth nothing and a sale with no cost against it (the purchase order detail
flags such a lot in red).

CHECK:

- /purchase-orders — appears. Open it: the detail now shows Product Receipt
  Documents, Contracts, Return lines and Communication (which document types are
  routed where for this supplier) alongside the lines.
- /purchase-lines — the line appears.
- /stock — a new stock lot exists (status pending).
- /stock-movements — an In movement with the purchase order as its source.
- /stock-on-location and /stock-history — reflect the new lot.
- /purchase-orders-to-be-received — the line shows as outstanding.
- /trial-balance — still empty. Ordering posts nothing; nothing is owed and
  nothing is owned until the goods and the invoice arrive.

Step 2.3 — Receive the goods (per line or all)

DO: /purchase-orders-to-be-received. Two ways, both real:

- Per line: click Receive on a single line's Action button.
- All at once: click Receive goods (top right) to receive every open line.
  Each records a receival and marks the line received.

CHECK:

- /purchase-receivals — one row per received line.
- /receipts — the same receipts totalled per date, supplier and product.
- /purchase-results — what was paid against what replacing the goods would cost
  today, i.e. the price the article was last invoiced at. Both sides read from
  the purchase invoices, so this stays 0,00 until Step 2.4 books one.
- /purchase-invoices-to-be-received — a received-but-not-yet-invoiced order
  appears here, and drops off once you invoice it (Step 2.4).
- /purchase-orders/<uuid> — the receipt appears under Product Receipt Documents.

Step 2.4 — Purchase invoice (this is the posting that creates the asset)

DO: /purchase-invoices/add — pick the supplier. A Stock items section lists the
supplier's pending lots. Click Add line and pick a lot with a quantity for every
line you want to invoice — an invoice saved with no lines has a 0,00 total and
produces no invoice lines. Add a surcharge (freight) too, to see the split below.

This invoice is what puts a cost on the article. The moment it is booked, the
APP and the last invoiced price stop being 0,00 everywhere they are shown —
nothing has to be recalculated for that, because they are read from these lines
rather than copied onto the product.

Base price is the one figure that does not follow on its own, since it is the
product's own sales price. Re-run /product-prices — Recalculate prices to mark
the new cost up.

What it posts:

  dr 3000 Inventory              what the lines say the goods are worth
  dr 7100 Purchase costs         whatever the invoice covered that never
                                 became stock (freight, handling)
  dr 1520 VAT reclaimable
  dr 4750 Credit restriction     if the term carries one
     cr 1600 Creditors           the whole invoice
  dr 1999 Differences            only if the typed total does not match what
                                 the lines explain

Freight is a cost of buying, not stock, which is why it goes to 7100 and not into
the lot's value. Expensing the goods themselves on arrival would put the cost in
whichever month purchasing happened to buy; they are held as an asset until sold.

CHECK:

- /purchase-invoices — the invoice appears; the supplier is emailed a copy.
- /purchase-invoice-line — one row per line you added.
- /stock — the lot's quantity is drawn down by what you invoiced.
- /trial-balance — the ledger balances, and the green Inventory panel says
  inventory agrees with the stock on the shelves. This is the one balance with an
  independent source of truth: account 3000 is reconciled against
  SUM(Stock.valuation_euro), and they have to agree to the cent.
- /supplier-revenue and /supplier-revenue-per-revenue-group.
- /purchases-and-sales-per-revenue-group (purchase side).
- /journal-entries — the posting, both sides, stamped with a period.

Cancelling a purchase invoice reverses the posting and pulls the stock back,
restating what is left of the lot so its value follows its quantity.

Step 2.5 — Purchase return order (send goods back to the supplier)

DO: /purchase-return-orders/new — pick the supplier and save. Then open it:
Dispatch sends the goods back, and Credit books the supplier's credit note.

  Dispatch:  cr 3000 Inventory     the stock leaves the shelf
             dr 3100              the supplier owes us for it
  Credit:    cr 3100, cr 1520 VAT, dr 1600 Creditors

The supplier's credit note posts to 3100 and NOT to inventory, because the stock
left when the goods were shipped back. Crediting inventory again would remove the
same material twice.

KNOWN GAP: the New Purchase Return Order form saves a header only — it never
sends line items, although createPurchaseReturnOrder accepts them. With no lines,
Dispatch moves no stock and Credit has nothing to credit. The server side of this
chain is complete and covered by tests; only the form's line capture is missing.

CHECK: /purchase-return-orders — the return order appears with its status.

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

Reserving is where the line's cost is fixed: it takes the valuation price of the
lot it was allocated to. A later revaluation of that lot never moves the margin
on an order already taken.

CHECK:

- /quote-lines — "Converted to" names the new order; the line status is Released.
- /orders and /order-lines — the new order and its priced lines appear.
- /stock — the lot's Reserved goes up, Available goes down.
- /reservations — a reservation row plus summary appear.
- /deliveries — the reserved line shows with a Deliver button.

Step 3.3 — Create an order directly (alternative to 3.2), and the credit check

DO: /orders/new — pick the customer, add a product line for the stocked product.
Creating the order reserves stock against the lot from Flow 2.

Every order is weighed against the customer's credit limit first. The exposure
tested is everything already owed (open invoices) plus everything promised
(orders taken and not yet invoiced, grossed up to include VAT) plus this order.
Two deliberate refusals to block: a debtor with no limit recorded is never
blocked (blank means nobody set one, not "may owe nothing"), and an order paid
for up front is never blocked however much is outstanding.

To see it bite, set a small credit limit on the company and place an order over
it.

CHECK:

- Same as Step 3.2 (orders, order-lines, stock, reservations, deliveries).
- /deliveries-to-arrange — shows lines with no reservation (0 reserved).
- /financially-blocked — an order over the limit is held here with its reason.
- /credit-information-customers — outstanding, current orders and credit space
  move. These are the same figures the block was decided on, not a second
  opinion.

Step 3.4 — Deliver the order

DO: /deliveries — click Deliver on the reserved line. This ships the goods, adds
an "out" stock movement, sets the line to delivered and emails a delivery note
(quantities only, no prices — the invoice says what it costs).

What it posts:

  dr 3200 Goods delivered, not invoiced      what the goods cost us
     cr 3000 Inventory

The goods have physically left but have not been billed, so they stop being stock
and wait on a holding account. This is what keeps account 3000 equal to the stock
table at all times while the cost still lands in the period the sale is invoiced.

CHECK:

- /deliveries — the line flips to delivered with a delivery date.
- /stock and /stock-movements — an Out movement; remaining stock drops, and the
  lot's value drops with it.
- /trial-balance — inventory still agrees with the shelves, and the panel now
  reports a balance sitting delivered-not-invoiced.
- /cost-price-invoices-to-be-sent — the cost of goods issued but not yet billed.
  This screen is the 3200 balance, line by line.

Step 3.5 — Invoice the delivered line, in full or in part

DO: /invoices/add — pick the customer. The Delivered Order Items section lists
each delivered line with what is LEFT to bill and a quantity box. Leave the
quantity as it stands to bill the whole remainder, or lower it to bill part.
Add a surcharge if you want an invoice that bills services as well as goods.

Billing part of a line:

- The line stays at "delivered" and offers its remainder next time; its line
  status becomes "partially invoiced". It only reaches "invoiced" when all of it
  is billed.
- Amount, cost, weight and margin are apportioned; the unit price, cost price
  and margin percentage are carried through unchanged, because they do not scale.
- The instalments always add back to the whole line exactly. Three instalments of
  a EUR 100,00 line come to 33,33 / 33,34 / 33,33 — never 99,99.
- A part-billed line only contributes its UNBILLED share to the customer's
  committed-order exposure, and only its unbilled share to
  /cost-price-invoices-to-be-sent. The billed share is an invoice now.
- An order with any part of it invoiced can no longer be cancelled.

What it posts:

  dr 1300 Debtors                the whole invoice
     cr 8000 Sales revenue       net
     cr 1530 VAT payable
  dr 4750 Credit restriction     if the term carries one
  dr 7000 Cost of sales          what the goods being billed cost us
     cr 3200                     clearing the holding account

The cost rides inside the sales entry rather than beside it. That is what makes
cancelling the invoice give back the margin along with the revenue.

CHECK:

- /invoices — appears with Excl./Incl. VAT totals, a due date derived from the
  payment term, and the whole amount outstanding. The customer is emailed it.
- /invoice-lines — the billed line appears with the quantity you billed.
- /invoices/add again — a part-billed line is still listed, now showing
  "3,000 of 10,000 left".
- /journal-entries — revenue and cost of sales posted together.
- /trial-balance — gross margin is now two account balances (8000 against 7000),
  and the delivered-not-invoiced balance has dropped by what you billed.
- /customer-revenue and its variants (per revenue group, per product group,
  per revenue group split, sales and visits) light up.
- /revenue-per-revenue-group, /revenue-per-product, /revenue-vs-budget.
- /customer-overview — the Invoices count and revenue update.

Cancelling an invoice (on its detail page) voids it: the posting reverses,
outstanding goes to 0,00 so the debt stops consuming credit space, and the
quantity it billed is handed back to the order line so it can be billed again.

Step 3.6 — Sales return and credit note

DO: /return-orders/new — pick the customer and save, then open the return:
Receive books the goods back in, and Credit raises the credit note.

  Receive:      dr 3000 Inventory   the goods are back on the shelf, at the
                cr 3200             value they left at
  Credit note:  the sales entry with every figure negated, cost included

Between receiving and crediting, 3200 goes negative — goods on hand that nobody
has been given credit for yet. It clears when the credit note is raised.

A credit note is the same document with negative amounts, so it ages, posts and
settles through exactly the same machinery, and its negative outstanding is what
nets the customer's debt down.

KNOWN GAP: the same gap as Step 2.5, on the sales side. The New Return Order form
sends no line items (createReturnOrder accepts them), and /return-lines →
Generate from orders writes lines that record the original order and line NUMBER
but not the original order line's uuid — which is the link Receive and Credit
both need. So generated return lines cause Receive to move no stock and Credit to
refuse with "None of these lines point at an invoiced order line". The server
side is complete and tested; the line capture is what is missing.

CHECK:

- /return-orders — appears. Open it: the detail shows the original order, the
  return lines with a Sales column (what the goods were sold for, beside what is
  being credited), the invoice lines behind them, Workorders and Complaints
  touching those goods, Documents, and any credit notes raised.
- /return-lines — one line per generated return item.
- /counter-orders/add — then check /counter-orders (optional).

Step 3.7 — Charges and options

DO:

- /charges — click Generate from orders to turn each order's lines and surcharges
  into charge records. Orders already charged are skipped.
- /options — the options revenue report; fills once order lines carry options.

CHECK: /charges (customer, revenue group, amount, cost, profit); /options.

===============================================================================
FLOW 4 — Getting paid
===============================================================================

Until a payment is registered, every invoice stays open forever and the
receivables screens show a debt that can never be cleared.

Step 4.1 — Register a receipt

DO: open the invoice (/invoices → the invoice) and use the Payments section.
Pick a payment date and the form previews what the invoice settles for on that
date:

- Outstanding — what is still owed.
- Discount available — the early-payment discount the term grants, if you are
  inside its window.
- Credit restriction available — the surcharge earned back by settling within
  the term.
- Cash due — outstanding less whatever may be deducted.

Tick "claim the deductions" to settle at the cash due figure. Both deductions are
deadlines, not sliding scales, and together they can never exceed the balance.

What it posts:

  dr 1100 Bank                   the cash that actually arrived
  dr 4700 Discount granted       what the payer kept for paying early
  dr 4750 Credit restriction     the surcharge given back
     cr 1300 Debtors             the whole amount settled

CHECK:

- The invoice's Outstanding drops (to 0,00 on a full settlement).
- /payments — the receipt appears.
- /trial-balance — still balances; debtors falls by what was settled.
- /credit-information-customers — the customer's credit space comes back.

KNOWN GAP: paying a SUPPLIER cannot be done from the UI. registerPayment takes a
purchase invoice as readily as a sales one, and posts it against creditors and
bank, but no purchase invoice screen offers the form — so a purchase invoice's
outstanding balance can only ever go down by being cancelled. /payments lists
supplier payments once they exist.

Step 4.2 — Reverse a payment

DO: in the same Payments section, reverse a payment.

A payment is never edited. Getting one wrong is corrected by reversing it and
registering the right one, so the trail keeps what was booked and when.

CHECK: the invoice's Outstanding goes back up; /payments shows the payment as
reversed; /trial-balance still balances.

===============================================================================
FLOW 5 — Chasing the debt
===============================================================================

These two screens need an invoice that is past its due date. The quickest way to
test them is an invoice raised on short terms (cash, or within 8 days) with an
invoice date backdated far enough on /invoices/<uuid> to push the due date into
the past.

Step 5.1 — Debtor ageing

CHECK: /debtor-ageing — every open item split by how late it is, as five bucket
totals, then per debtor, then per item.

The age is measured from the DUE DATE, never the invoice date. Two invoices
raised the same morning on 8-day and 60-day terms are not equally late, and only
the due date knows that. An invoice on a term that pins no date to the invoice
date (a letter of credit, cash against documents) is reported as not-due rather
than dropped — the money is owed and belongs in the total, but calling it late
would assert a deadline the document never carried.

The buckets always add up to the whole debt, including not-yet-due, so the report
reconciles against the sales ledger. A credit note nets down the bucket it falls
in, which means a bucket can legitimately come out negative.

Step 5.2 — Payment reminders

DO: /payment-reminders — the chase list. Send one reminder from its row, or
"Send all due reminders" to clear the list.

CHECK:

- Due a reminder — the items being chased, and which stage goes out on each.
- Not being chased — every other open item, WITH the reason. Nothing outstanding,
  a credit note (owed to the customer), reminders switched off for the debtor,
  no due date to measure against, not due yet, or not yet at the next stage's
  threshold. Without this half the screen looks like it has lost invoices.
- After sending, the item moves to "Not being chased" with the reason
  "N days overdue — the next reminder is due at 28".

The rules:

- Escalation is a sequence of letters, not a lookup. An invoice sixty days late
  that has had nothing sent gets a FIRST reminder, not a final notice.
- Thresholds are 14 / 28 / 42 days past due for first / second / final. That is
  the conventional Dutch cadence, not something read from the reference system —
  change the three numbers in REMINDER_STAGE_AFTER_DAYS to change the policy
  everywhere.
- Each stage is sent once per invoice, enforced by a unique index, so two people
  working the same list cannot mail the same letter twice.
- The stage is decided server-side from the invoice as it stands at that moment,
  never taken from the page. A tab left open cannot send a final notice to
  somebody who has since paid.
- A debtor with "Reminder" unticked is never chased automatically, whatever the
  age. That flag is for accounts being handled by hand — a payment plan, a
  dispute, a receiver.

Step 5.3 — What was sent

CHECK: /debtor-ageing — the Last reminder column shows the stage and date. What
was owed and how late it was are recorded as they stood when the reminder went,
so the record does not rewrite itself when half the balance arrives.

A reminder to a debtor with no email on file is still recorded, with nobody
reached. That is a standing condition rather than a hiccup: leaving it unrecorded
would offer the same reminder forever and never escalate. A reminder that failed
to deliver to an address that does exist is NOT recorded, so it stays on the list
to try again.

===============================================================================
FLOW 6 — Production and transport
===============================================================================

These act on the order lines created in Flow 3.

Step 6.1 — Production work orders

DO: /production-workorders — click Generate from orders to turn order lines into
production work-order lines (needs at least one machine and one order). Then
press Complete on a line, which saws the reserved lot: the input lot is drawn
down and the finished goods plus the offcut are booked in.

CHECK:

- /production-workorders, /stock, /stock-movements.
- /trial-balance — inventory is UNCHANGED, and must be. Sawing splits the
  input's value between the goods and the offcut, so nothing is earned or lost
  and there is nothing to post. If inventory moves here, something is wrong.

Step 6.2 — Transport work orders

DO: /transport-workorders — click Generate from orders to turn order lines into a
new trip's transport lines (delivered to each order's company). Then press
Complete, which marks the line shipped (no stock change — the stock already left
at delivery).

CHECK: /transport-workorders, /trip-data.

Step 6.3 — Manual stock correction

DO: /stock — use Correct on a lot to adjust its quantity, with a reason
(count correction, damaged, manual).

What it posts:

  dr/cr 3000 Inventory
  cr/dr 7200 Inventory differences

This is the only inventory movement with no document on the other side. Nobody is
billed and nobody is credited, so the value goes straight to the result rather
than waiting for paperwork that will never come. Removing quantity takes its
share of the lot's value with it — writing off a damaged bar must not quietly
make every other bar in the lot worth more.

CHECK:

- /stock-movements — the correction shows with your note.
- /freight-movements — the goods-flow ledger mirrors every stock movement
  (receipt, sale, production, correction) with its running balance.
- /trial-balance — inventory still agrees with the shelves, and 7200 carries the
  loss.

===============================================================================
FLOW 7 — CRM (visits, follow-ups, complaints)
===============================================================================

Step 7.1 — Visit report and resolve it

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

Step 7.2 — Follow-up

DO: open the company (/companies -> the company's detail page) and add a
follow-up note in the follow-ups section.

CHECK: /follow-ups — appears, newest first.

Step 7.3 — Complaint and complaint lines

DO:

- /complaints/new — log a complaint against the company/product. Link its items
  to an order line to see it surface on a return.
- /complaint-lines — click Generate from complaints to create the per-item lines.

CHECK:

- /complaints — appears.
- /complaint-lines — one line per complaint item.
- /customer-overview — the Complaints count increments.
- /return-orders/<uuid> — a complaint against a returned line's order line shows
  in the return's Complaints section.

Step 7.4 — Add a contact to an existing company

DO: /companies/<uuid>/edit/contacts — add a contact with an email address.

CHECK: the contact is welcomed by email, the same as a contact added while the
company was being created. Editing that contact afterwards sends nothing.

===============================================================================
FLOW 8 — Batches and mill certificates
===============================================================================

Traceability: which heat/batch the steel came from, and the mill certificate
proving it. Both are generated from what has already been received.

Step 8.1 — Register batches

DO: /batches — click Generate to register a batch per received purchase order
line. Re-runnable; lines that already have a batch are skipped.

CHECK: /batches — each batch joined to the purchase order it arrived on, its
supplier and its product.

Step 8.2 — Expect and receive certificates

DO:

- /certificates-received — click Generate to raise the certificate each batch is
  expected to have. Then use Mark received on a row as the paperwork arrives.
- /certificates-to-be-linked — certificates that arrived without a batch to
  attach to (no received date). The reference system also shows the electronic
  certificate-exchange message status; that integration layer is not modelled
  here, so those columns have no source.

CHECK:

- /certificates-received — expected certificates with their batch, purchase
  order, supplier and product; received ones carry a date.
- /sending-certificates — delivered order lines whose certificate has arrived and
  can now be forwarded to the customer.
- /deliveries-from-missing-batch — deliveries whose batch is absent.

===============================================================================
FLOW 9 — Finance controls, advice and statistics
===============================================================================

Once orders, invoices and stock exist, confirm the aggregate reports compute.

Step 9.1 — Financial block and unblock

DO: set a financial block flag on an order/quote (the create forms have the
flag), or place an order over the credit limit (Step 3.3), then
/financially-blocked — click Unblock to release it (records who/when).

CHECK:

- /financially-blocked — the blocked order/quote is listed with its reason, then
  clears.
- /unblocked-orders — the released order appears.
- /blocked-deliveries — shows lines with a delivery block flag set.

Step 9.2 — Call-off and advice reports

CHECK:

- /order-lines-still-to-be-called and /orders-still-to-be-called — every order
  line's planned quantity is the ordered amount with nothing called off yet, so
  the full quantity shows as still to be called.
- /order-advice, /sold-products-not-advised — reorder logic; needs stock plus
  sales history.
- /stockon-advice — lists stock products whose product group has "Use StockOp"
  enabled (set that flag and a lead time / review period on the group).

Step 9.3 — SFN goods-flow return

DO: /freight-flow — expand SFN classification and set each traded counterparty to
Producer / SFN member / Non-member (unclassified counts as non-member). Domestic
vs abroad comes from the company's main address country.

CHECK: /freight-flow — the monthly goods flow per revenue group, in kilograms:
starting stock carried forward, receipts split by supplier, sales split by
customer, stock difference, ending inventory (which always reconciles), and the
outstanding order book. Leave year/month blank for the current period.

Step 9.4 — Inactive companies and remaining reports

DO: /companies — the Inactive button in a row flags a company by hand (it turns
into Activate to undo).

CHECK:

- /inactive-companies — customers and prospects where nothing has happened for
  twelve months, plus any you flagged. An account opened within the last year is
  NOT listed: a customer taken on last week has not gone quiet, they have not
  started, and counting them would report every new customer as dormant.
- /journal-entries, /credit-information-customers, /remarks-per-company — reflect
  your data.

Step 9.5 — The books

CHECK: /trial-balance, as the last thing you do.

- The ledger balances. A difference means an entry posted one side and not the
  other; sort /journal-entries by document to find it.
- Inventory agrees with the stock on the shelves. Account 3000 is reconciled
  against SUM(Stock.valuation_euro) — every inventory posting is the value a lot
  actually gained or lost, so the two are the same arithmetic and must agree to
  the cent. A drift means stock moved without the ledger following it.
- Delivered-not-invoiced (3200) and returned-not-credited (3100) should be zero
  once every document has followed. A balance left on either is goods that moved
  and were never billed, and is the figure a bookkeeper has to chase.
- Every account carrying a posting is named. Anything flagged as missing from the
  chart means Step 1.9 has not been run.

===============================================================================
Quick dependency map
===============================================================================

Company (customer + supplier) leads to:

- Quotes / Orders / Counter orders / Return orders
- Purchase quotes / requests / orders / invoices
- Visit reports / Follow-ups / Complaints
- Contracts and their net prices
- A credit limit, which gates every order

Product group -> Product -> Product prices -> Net prices, used on quote and
order lines.

Warehouse -> Sub section -> Location -> Machine.

Purchase order opens an incoming STOCK LOT.
The purchase invoice IS the receipt: it values the lot (3000) and owes the
supplier (1600), with anything that never became stock going to 7100.
A Quote's lines convert into an Order, which reserves the lot and snapshots its
cost onto the line.
Delivering removes stock and parks its cost on 3200.
Invoicing charges that cost to 7000 and clears 3200 — in instalments if you bill
part of a line.
A Payment settles the debtor and books any discount given away.
Ageing reads the due date; reminders escalate off it.
Production Complete conserves value and posts nothing.
A stock correction is the one movement with no counterparty, so it hits 7200.
Every stock movement is mirrored into the Freight movement ledger, which the SFN
freight-flow return totals per month and revenue group.

Golden path (the shortest run that exercises the whole system):

1. Company (customer + supplier, with a credit limit and payment terms)
2. Chart of accounts (/trial-balance)
3. Product group -> Product -> Recalculate prices
4. Purchase order -> Receive goods -> Purchase invoice (makes stock)
   -> Recalculate prices again
5. Quote with lines -> Convert to order (reserves stock)
6. Deliver (ships stock, parks the cost)
7. Invoice PART of the line (posts revenue and cost of sales)
8. Invoice the remainder (proves the instalments close)
9. Register a payment, claiming the discount
10. Backdate an invoice, then Debtor ageing -> Payment reminders
11. Visit report -> Resolve, and Complaint -> Generate complaint lines
12. Trial balance — must balance, and inventory must agree with the shelves

After these, roughly 90 percent of the read-only reports have data, and the
accounting is checkable end to end.

===============================================================================
Known gaps in the UI (the server side works; nothing writes to it)
===============================================================================

Both return chains can be driven server-side and are covered by tests, but no
screen captures the lines they need:

- Sales return: the New Return Order form sends no line items, and
  /return-lines -> Generate from orders writes lines carrying the original order
  and line number but not the original order line's uuid, which is what Receive
  and Credit match on. Receive therefore moves no stock and Credit refuses.
- Purchase return: the New Purchase Return Order form sends no line items
  either, so Dispatch and Credit have nothing to act on.

Paying a supplier is the third of these: registerPayment handles a purchase
invoice and posts it against creditors and bank, but no purchase invoice screen
offers the form.

Also written but not yet surfaced: the "partially invoiced" line status is set on
part-billed order lines, and no overview filters on it.

===============================================================================
The remaining read-only screens
===============================================================================

Nothing here needs its own step — each fills from the flows above. Listed with
what it shows and what has to exist first.

Combined overviews (one list across two tables):

- /orders-and-quotes — orders and quotes merged into one sales overview. Queried
  separately and merged in code rather than as a SQL union, since half the
  columns would be null-padded either way. Needs Flow 3.
- /warehouse-and-production-workorders — one list of everything outstanding on
  the floor, whichever stream it was planned in. Needs Flow 6.

Revenue, once invoices exist (Step 3.5):

- /customer-revenue-per-revenue-group, /customer-revenue-per-product-group,
  /customer-revenue-per-revenue-group-split — the same revenue cut three ways.
- /customer-revenue-sales-and-visits — revenue against visit activity, so needs
  Flow 7 as well.
- /revenue-per-revenue-group-period — the same figures by invoice period AND
  order type, so a flat-looking month can still show consignment collapsing while
  stock sales grew.
- /visits-made — only visits that actually took place. A scheduled call that
  never happened belongs on the visit schedule, not in the record of what was
  done. Needs Step 7.1 (Resolve).
- /transport-by-region — trips with their date, vehicle and load. Region,
  delivery address, trip status and largest length are not stored on a trip, so
  those columns have no source yet. Needs Step 6.2.

Control lists (each looks for one thing going wrong):

- /cd-deliveries-in-progress — cross-dock / direct-delivery order lines still in
  progress: lines drawn from a purchase order and not yet invoiced. Shows stock
  value at replacement price against purchase value at average purchase price;
  the difference is the revaluation.
- /control-sawing-waste — waste attributed to the lot it was cut from. Hand
  write-offs stay in the list: a bar ruined at the saw is waste however it was
  booked, and dropping them would make the list look better than the shop floor
  is. Needs Step 6.1 or 6.3.
- /control-stock-increase-external-processing — stock increases booked from
  processing output. The stock ledger does not distinguish external from internal
  processing and movements carry no processor or GL account, so the Company and
  GLA columns have no source; production "in" movements are the closest truthful
  source.
- /control-stock-revaluation-fsp — products carrying a fixed sales price with
  their on-hand stock. The revaluation amount and preceding FSP need an FSP
  change history, which is not stored, so those columns have no source yet.
- /order-lines-capacity-overflow — order lines that pushed a capacity check past
  its ceiling, pulling from the line, its sawing/nesting plan, the check it broke
  and the action recorded in response. Needs capacity-check data seeded.
- /sigmanest-blocked-orders — work orders SigmaNest refused to release, soonest
  delivery date first, since those cost the most to leave blocked. Needs the
  integration.

Statistics and statutory exports:

- /cbs-documentation — CBS / Intrastat export, one row per invoiced goods line
  with its invoice, customer and originating order line. The CBS-specific codes
  (rubric, commodity code, origin, container, statistical value, transaction and
  transport codes) are not captured in this system, so those columns have no
  source.
- /sfn-statistics-product-market — CBS commodity number crossed with the
  customer's SBI industry code and postal area, per month. A combination only
  forms once the product carries a commodity number and the company an industry
  code, so set both in Flow 1 if you want rows here.
- /balanced-scorecard — the KPI frame is in place but every value, target, status
  and trend is currently hardcoded to zero / on-target / flat. It reads nothing
  from your data, so it looks identical before and after a full run.

Inbound integration:

- /import-purchase-invoices — the message log for electronically delivered
  supplier invoices, newest first, with anything needing a human first within
  that: a failed import is the whole reason anyone opens the screen. Needs the
  inbound channel.

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
