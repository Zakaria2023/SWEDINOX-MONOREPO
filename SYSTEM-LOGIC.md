===============================================================================
SYSTEM LOGIC
===============================================================================

Every rule the dashboard computes with, and why it computes it that way.

The end-to-end guide walks the screens in the order data has to be created. This
one is the other axis: what each number means, where it comes from, what may
change it afterwards, and which statements about the data are supposed to be
true at all times. Read a flow there, read the rule here.

Four laws run through everything below. Almost every design decision in the rest
of this document follows from one of them:

- A document records what was agreed at the moment it was raised. Prices, costs,
  margins and weights are resolved on the server as the row is written and
  snapshotted onto it. Re-pricing the catalogue, revaluing a lot or renegotiating
  a contract never rewrites a document already raised.
- A fact is stored in exactly one place. Where a second copy would be derivable,
  it is derived instead — a product carries no purchase price, an invoice carries
  no VAT column, a percentage is never stored beside the two figures it divides.
- Nothing is invented to make the figures close. A supplier total that its lines
  do not explain goes to a differences account; a production run that yields more
  than it consumed is refused; growth from a zero baseline is reported as "no
  baseline" rather than as a percentage.
- Physical movement and paperwork are booked separately, and both when they
  happen. Goods leaving the shelf move the inventory account that day; the
  invoice that bills them charges the cost that day. Holding accounts exist
  precisely to carry the gap.

Sections are numbered for reference, not for order. Nothing here has to be read
in sequence.

===============================================================================
PART 1 — Foundations
===============================================================================

1.1 — Where logic is allowed to live

Server Actions are the only way a page reads or writes data. Each route folder
under app/ holds its own actions.ts, and those files are the only callers of the
database. A page component and the components under it are presentational.

Route Handlers exist only where a Server Action physically cannot do the job —
today that is document upload, download and delete, because a browser needs a
real HTTP endpoint for FormData and for a streamed response. Their business
logic still lives in lib/server/document-storage.ts and
lib/server/cloudflare-r2.ts; the route file only wires a request to it.

lib/helpers.ts holds the framework-agnostic arithmetic, and is deliberately
importable from a client component, which is what lets a line editor preview a
figure with the same function the server will store it with. lib/server/*.ts
holds what is genuinely bound to a runtime or a transport — Clerk's admin
client, the R2 client, and the four pricing/credit/ledger/receivables modules.

1.2 — Identity and access

Clerk owns the user list outright. There is no local Users table, no password,
no session table. A column that refers to a person (createdByUserId,
modifiedByUserId, blockedByUserId) stores the Clerk user id as a plain string,
not a foreign key.

requireAuth resolves the session server-side and redirects to /sign-in when
there is none. requireAdmin does that and then checks
publicMetadata.role === "admin", redirecting to /unauthorized otherwise. The
middleware in proxy.ts protects every route except /sign-in(.*).

Anything a document records about who did it is read from the session at the
moment of writing, never accepted from the client.

1.3 — Derived, snapshotted, or stored

Three different lifetimes, and confusing them is the most common source of a
figure that looks wrong:

- Derived. Computed on every read, never stored. A product's average purchase
  price, its last invoiced price, a debtor's open balance, an ageing bucket, a
  margin percentage, an invoice's VAT amount when read back from its two totals.
  These follow the underlying data immediately and cannot drift.
- Snapshotted. Computed once, written onto the document, and then frozen. A
  line's net price, cost price, profit and weight; a quote's summary block; a
  batch's certificate expectation. These deliberately do not follow later
  changes, because the document recorded an agreement.
- Stored. Typed by a person and only ever changed by a person. A credit limit, a
  payment term, a markup percentage, a fixed sales price, a contract's discount
  tiers.

A snapshot's percentage is the one exception worth naming: percentages are
recomputed from the two stored figures they divide rather than stored alongside
them, so a stored revenue and a stored profit can never disagree with the margin
printed next to them.

1.4 — Money and quantities

Money is decimal(15,2) in the database and a string in TypeScript. Quantities
are three decimals. Both are strings on the way in and out precisely so a value
never passes through a float that could shift its last cent.

Anything a person types into a money field is validated before it reaches the
column. DECIMAL_AMOUNT_PATTERN is the one definition of what an amount looks
like — an optional sign, digits, and at most two decimals after a dot or a comma
— and toDecimalAmount converts a value matching it to the plain decimal string
MySQL takes, falling back to "0.00" for anything else. Both live in
lib/helpers.ts so the zod rule that rejects a bad amount and the conversion that
writes a good one cannot drift apart. This matters more than it looks: a
non-numeric string reaching a decimal column fails the whole statement, and on
the company form that statement sits inside a transaction creating everything
else too.

Rounding rules that are decided rather than accidental:

- QUANTITY_EPSILON is 0.0005. Quantities are held to three decimals, so anything
  smaller is the residue of dividing a line rather than a quantity anyone meant.
  It is what lets "this line is now fully billed" be decided without demanding
  exact equality of two decimal strings.
- A posting balances when debits and credits are within 0.005 — one cent. A VAT
  calculation can legitimately land half a cent out; anything larger is a missing
  line, not arithmetic.
- A posting line under half a cent is dropped rather than written. A zero line
  records nothing and only clutters the account it names.

1.5 — Concurrency

Two people working the same list must not be able to book the same thing twice.
Three patterns do that work, all of them inside the transaction:

- Optimistic quantity locks. A stock correction, a delivery and a production run
  each re-read the lot and apply their update only where the quantity still
  matches what was read. A race rolls the transaction back rather than letting
  the lot go negative.
- Claim-by-status. Completing a production line claims the line's status first,
  so two people completing the same line cannot both consume the input lot.
  Delivering guards on status = "reserved"; invoicing guards on
  status = "delivered".
- Claim-by-progress. Part-billing an order line matches on the invoiced quantity
  read a moment earlier. Two invoices raised at once would otherwise each bill
  the same remainder; instead the second finds nothing to update and fails with a
  message telling the user to refresh.

Where a guard fails, the action throws inside the transaction and the user is
told what happened. Nothing is half-written.

1.6 — Enums

Enums are const arrays typed as const satisfies readonly string[], with the
union derived from the array. TypeScript's enum is not used. Every enum in the
app lives in lib/enums.ts, and every label map in lib/labels.ts, keyed as
Record<EnumType, string>. A schema file imports the array rather than declaring
values inline, so the database and the application can never disagree about what
the legal values are.

Some enums are more than a picklist: the value chosen determines a computed
result elsewhere. Payment terms, VAT codes, delivery terms, stock modes, weight
types and lead-time methods all have helpers in lib/helpers.ts that turn the
self-describing value into the number the rest of the system needs. Part 15
lists them.

1.7 — Failure

describeError puts the underlying message after a human-readable fallback, so a
failed query surfaces its real cause instead of a generic "Failed to …". Actions
return { error } for anything the user can act on and throw only for a genuine
invariant breach — an unbalanced posting, a production run that yields material
from nowhere, a line claimed by somebody else mid-write.

Email is the deliberate exception to all-or-nothing. By the time a document is
mailed it is already committed, and mail cannot be rolled back with it, so a
send failure is counted and logged, never thrown.

===============================================================================
PART 2 — Masterdata
===============================================================================

2.1 — A company is its roles

One Companies row can be a customer, a prospect, a supplier, a transporter and a
purchasing organisation at once. Roles are a JSON array, and which overviews a
company appears on is a function of that array, not of separate tables — which
is why one company with both the customer and supplier roles can drive the whole
system on its own.

At least one role is required. The debtor fields (credit limit, payment terms,
the reminder flag) matter well beyond the company screen: the limit gates every
order, the term decides three separate figures on every invoice, and the flag
decides whether the debtor is ever chased.

contractableRolesOf narrows a company's roles to the ones a contract can
actually be written against. A transporter or a purchasing organisation is not a
party to a contract and is dropped from that list.

2.2 — Contacts and addresses

A contact needs a last name; an empty contact is refused. Many reports read the
first contact, and a contact with an email is welcomed by mail when it is
created — both when the company is created and when one is added later. Editing
an existing contact deliberately sends nothing, because an edit gives no way to
tell a newly typed address from a corrected one.

A contact created against a company that inherits the company's codes takes the
company's search codes and role flags and starts with zeroed revenue targets
rather than nulls.

Addresses are tagged by category (delivery, billing, and so on) and carry the
logistics facts a delivery needs: crane, canopy, bundling, unloading window, max
length and bundle weight. The main address's country is what decides domestic
versus abroad on the goods-flow return.

2.3 — Products and product groups

A product group is at most two levels deep: a group with no parent is itself the
main group, otherwise its parent is the main group and it is the subgroup. The
group carries what the product inherits commercially — preferred supplier,
revenue group, the two minimum margin floors, and the reorder settings.

A product carries sales prices only. It has no purchase price at all; see 3.1.
Its stock and standard flags, dimensions, theoretical weight and price unit are
what the line arithmetic reads.

2.4 — Contracts

A contract links a company to agreed terms, and can express its discount four
ways, which stack in a defined order (4.3): a gross price override, a group
discount ladder, a line discount ladder, and a flat extra discount. Contract net
prices are the fifth and strongest form — a fully negotiated price per product
per quantity break, which overrides all of the above.

2.5 — Warehouse, location, machine

Warehouse → sub section → location, with machines placed at a location. Creating
a warehouse auto-creates an empty warehouse work order. Production needs at
least one machine, because a production work order is planned onto one.

2.6 — Texts

A Texts row records which documents it may print on as one boolean column per
document rather than as a list. TEXT_USAGE_CATEGORY_FIELDS is the single mapping
between the enum and those columns, and activeTextUsageCategories reads the
enabled ones back as labels — so the overview's checkbox grid and the detail
screen's list are the same fact rendered twice.

A text hangs off at most one document. attachedDocumentOf returns the first key
that is set; a text with none is a library text belonging to the company, or to
nothing.

===============================================================================
PART 3 — What things cost
===============================================================================

3.1 — A product has no purchase price

What an article costs is whatever a supplier billed for it. That is recorded once
— on their invoice — and every cost figure in the app is read back from there.
lib/server/purchase-pricing.ts is the only place that reads it, and it produces
exactly two numbers per product:

  averagePurchasePrice   SUM(net price × quantity) / SUM(quantity) over every
                         booked invoice line for the article — a weighted
                         average, not an average of prices
  lastPurchasePrice      the net price on the most recent booked line

Only lines a supplier actually billed count. A cancelled invoice was never owed,
and a credit note reverses a charge rather than setting one, so the scope is
documentType = 'invoice' AND cancelled = false. "Most recent" is ordered by
COALESCE(invoice date, booking date) descending, then by line id descending —
the invoice date is what the supplier priced on, the booking date stands in when
they left it off, and the id breaks a tie so two lines on one day always resolve
to the same latest.

Both figures come in two forms. loadPurchaseCostByProduct returns a Map, loaded
once per document rather than per line. averagePurchasePriceSql and
lastPurchasePriceSql render the same two numbers as correlated subqueries, for a
report that already joins its own rows and cannot be handed a Map. The COALESCE
in the second wraps the whole subquery rather than the column, because an
article nobody has invoiced matches no rows at all and a COALESCE inside would
never see it.

3.2 — Replacement price

The last invoiced price is also what re-buying the article costs today, so it is
what the system calls the replacement price. Every place that used to read a
replacement price off the product now reads this.

Two profit figures therefore exist on every sales line and diverge whenever the
market has moved since the goods were bought: profit against what they actually
cost, and profit against what replacing them would cost. The reference ERP shows
both side by side and so does this system.

3.3 — Cost price of a line

Resolved in this order, in quoteLineFinancials:

  costPrice = averagePurchasePrice when it is above zero
            = replacementPrice otherwise

A product that has never been purchased has no average, so the replacement price
stands in. The goods cost something, and pretending otherwise would show the
line as pure profit.

Once a line reserves stock, its cost stops being a product-level figure at all
and becomes the valuation price of the lot it was allocated to. See 5.4.

===============================================================================
PART 4 — What things sell for
===============================================================================

4.1 — Base price

Written only by /product-prices → Recalculate prices, which is the sales side of
the catalogue and nothing else:

  cost basis  = lastPurchasePrice when above zero, else averagePurchasePrice
  markup      = the product's own markup when above zero, else the default
                percentage typed on the screen
  base price  = the fixed sales price when one is set,
                otherwise cost basis × (1 + markup / 100)
  price date  = today

The cost basis is not written back onto the product. It is whatever the purchase
invoices say, and copying it onto the article would create a second version of
the same fact. This is why base price comes out 0.00 until at least one purchase
invoice has been booked, and why the run has to be repeated after the first one.

4.2 — Net prices on a contract

/net-prices → Generate from contracts prices each customer contract that has no
net prices yet. The products priced are the ones that customer has actually
ordered; a customer with no order history gets the standard catalogue. Each is
priced from its base price with the contract's own discounts applied, and a
contract with quantity tiers produces one row per break — the union of both
discount ladders' thresholds, so neither ladder's break points are lost.
Contracts that already have net prices are skipped, so the generation is
re-runnable.

4.3 — What one line actually costs the customer

resolveLineNetPrice in lib/server/sales-pricing.ts, and it is the only answer.
Quotes and orders both go through it, so a line cannot be priced one way on the
quote and another on the order it becomes.

  list price = base price when above zero, else the replacement price

A line is never priced at zero merely because the price list is incomplete.

  1. An agreed net price on the contract wins outright. It was negotiated, so no
     discount is layered on top of it. The applicable row is the highest tier the
     quantity actually reaches.
  2. Otherwise the contract applies: its gross price override if it carries one,
     then its group and line discount for that quantity, then its flat extra
     discount on top of the result.
  3. Otherwise the list price stands on its own.

Discounts stack sequentially, not additively — applyPriceDiscounts multiplies
(1 − group%) by (1 − line%), so 10% and 10% is 19%, not 20%. That is how the
reference ERP quotes them.

Discount ladders are normalised before use: sorted by threshold and always
starting at a 0% tier from zero, so every quantity finds a tier and a contract
with no tiers at all resolves to 0% rather than to nothing.

4.4 — What a line then reports

quoteLineFinancials derives everything else from the net price:

  amount          netPrice × quantity
  costPrice       see 3.3
  costAmount      costPrice × quantity
  replacementCost replacementPrice × quantity
  profit          amount − costAmount
  profitMargin    profit / amount as a percentage, 0 when amount is 0
  profitReplPrice amount − replacementCost
  weightKg        quantity × theoretical weight
  m1PerPiece      length in mm / 1000
  profitTooLow    the floor is above zero and the margin is under it

The margin floor comes from the product group, and which of its two floors
applies depends on the line: a pickup line is sold ex works and is measured
against the ex-works floor, anything delivered from stock against the stock
floor.

4.5 — The client-side preview

previewQuoteLine shows a line that has not been saved yet, using the same
arithmetic the server will use — but priced off the list price alone. The
contract's agreed prices and discounts are not applied, because the client has
no business holding a customer's pricing terms. A saved line can therefore come
out cheaper than the preview, never dearer, and the screen says so beside the
grid.

4.6 — Document summaries

computeQuoteSummary rolls lines, options and surcharges into the read-only
summary a quote, order and invoice all present the same way:

- Materials, options and surcharges each report revenue and two profits —
  against actual cost, and against replacement price.
- Options carry no replacement basis of their own (the processing costs what it
  costs), so both of their profit columns report the same figure. The same is
  true of surcharges, which are agreed at a margin rather than costed per unit,
  which is why their profit is given rather than derived.
- Transport and handling are costs with no revenue. They only ever pull the
  profit columns down; they never touch revenue.
- The total is the three revenue blocks added up, less those two costs.
- VAT applies to the net total. The average kilo price is the net total spread
  over the delivered weight, and is zero rather than infinite when there is no
  weight.

The header stores the result as a snapshot so the list and the detail screen
agree, but the figures are always derived from the lines, never typed. Reading a
snapshot back (quoteSummaryFromSnapshot, orderSummaryFromSnapshot,
invoiceSummaryFromSnapshot) recomputes the percentages rather than reading them,
and an invoice's VAT is the gap between its two stored totals rather than a
column — deriving it keeps the three figures from ever disagreeing.

An order's summary is narrower than a quote's (no options, no transport or
handling of its own, no separate theoretical weight), because by then the goods
are allocated and their real weight is known. The blocks it lacks render as zero
rather than being hidden: the panel's shape is what makes the documents
comparable at a glance.

===============================================================================
PART 5 — Stock
===============================================================================

5.1 — Stock is never created by hand

A lot is born from a purchase order (as pending incoming stock), valued by the
purchase invoice, transformed by production, and it dies at delivery. There is no
"add stock" screen. The only movement with no document behind it is a manual
correction (5.6).

Every lot carries both a quantity and a value, and a unit valuation price. All
three have to stay consistent, which is what 5.2 exists for.

5.2 — A lot's value follows its quantity

restateLotValue is applied every time material leaves a lot:

  remaining quantity ≤ 0        → 0
  unit cost above zero          → remaining quantity × unit cost
  otherwise                     → previous value × (remaining / previous)

Without this, taking material out while leaving the total alone means fewer units
sitting at the old value — the lot quietly becomes worth more per unit on every
drawdown, and stock valuation drifts upward permanently with nothing on any
screen to reveal it. The unit cost is authoritative wherever there is one;
scaling by the remaining share is the fallback, and it keeps a drawdown
proportional rather than writing the remainder down to nothing.

5.3 — Available versus reserved

A lot's physical quantity is not what a new order can draw on. Available is the
physical quantity less whatever open sales-order reservations already hold
against it. Available stock is queried across all lots and is not scoped to a
company, since a sales order can draw from any lot in the warehouse.

5.4 — Allocation, and where a line's cost is fixed

Reserving takes from the oldest lots first — ordered by receipt date, then by id
— greedily, spanning as many lots as the quantity needs. One order line can
therefore become several allocations. A shortfall refuses the whole conversion
and names the short product rather than partially reserving.

Reserving is the moment a line's cost is fixed: it takes the valuation price of
the lot it was allocated to. A later revaluation of that lot never moves the
margin on an order already taken.

5.5 — Production conserves value

Sawing destroys the lot it came from. What leaves the machine is customer goods,
a usable offcut, and waste, so the quantities have to close:

  consumed = produced + remnant + waste

and the money has to close with them, or stock value drifts on every run.
productionYield splits it:

  waste             consumed − produced − remnant
  impossible        true when waste is negative
  remnantCost       remnant × input unit cost
  producedCost      (consumed × input unit cost) − remnantCost
  producedUnitCost  producedCost / produced

The remnant is carried at the input's unit cost, because it is the same material
in a shorter length and anyone may order it next; it goes back to stock
unreserved. Everything else, waste included, lands on the produced goods. That is
deliberate: yield loss is a cost of the output that caused it, so a run wasting
half a bar shows the goods costing nearly twice the raw material. That is exactly
the signal that makes bad sawing visible in the margin instead of hiding it in
the stock valuation — and it is why completing a run restates the order line's
quantity-dependent figures while leaving its agreed prices untouched, and points
the line at the lot it will actually be delivered from.

Producing more than was consumed is flagged rather than absorbed. It means the
figures are wrong, and inventing material to reconcile them is how a stock ledger
starts lying.

Because value only moves between the goods and the offcut, a completed production
run posts nothing to the ledger. If inventory moves when a run completes,
something is wrong.

5.6 — Manual correction

The one inventory movement with no counterparty. A correction moves the lot's
value as well as its count: material added by a count difference can only be
valued at what the rest of the lot cost, and material removed takes its share of
the value with it — writing off one damaged bar must not quietly make every other
bar in the lot worth more.

Nobody is billed and nobody is credited, so the value goes straight to the result
rather than waiting for paperwork that will never come:

  dr/cr 3000 Inventory
  cr/dr 7200 Inventory differences

5.7 — The goods-flow mirror

Every stock mutation is mirrored into FreightMovements in the same transaction,
right after the quantity is updated. The row records the product's revenue group,
the accounting dimensions (company, order, purchase order, supplier), the reason,
and the running stock balance before and after — quantity and value both, valued
at the unit price supplied. That ledger is what the SFN goods-flow return totals
per month and revenue group.

===============================================================================
PART 6 — Purchasing
===============================================================================

6.1 — The purchase invoice is the goods receipt

That is the central decision of the purchase side, and it is why there is no
goods-received-not-invoiced account: stock and the supplier debt appear together.

A purchase order opens incoming stock — a pending lot plus an "in" movement — and
is emailed to the supplier. The order price becomes the lot's valuation price,
which becomes the cost of sales when the goods are eventually sold, which is why
a line saved at 0.00 produces a worthless lot and a sale with no cost against it.
Ordering posts nothing to the ledger: nothing is owed and nothing is owned until
the goods and the invoice arrive.

Receiving records a receival per line and marks the line received. It still posts
nothing.

6.2 — What the invoice reconciles

summarisePurchaseInvoice derives everything except the two figures a clerk
actually types — the total printed on the supplier's paperwork, and the credit
restriction they applied:

  materials      the sum of the booked lines
  surcharges     the sum of the surcharges
  totalExclVat   materials + options + surcharges
  vatHigh        21% of the lines carrying the high code, plus 21% of the
                 surcharges (services follow the standard rate)
  vatMiddle      12% of the lines carrying the middle code
  vatLow         9% of the lines carrying the low code
  totalInclVat   totalExclVat + the three VAT bands
  remainder      the supplier's total − (totalInclVat + credit restriction),
                 or 0 when no supplier total was typed
  totalGeneral   accounted + remainder, which reconciles to the supplier's total

VAT splits per line's own code rather than at one rate for the whole invoice,
because a pallet of goods at 21% and a delivery at 9% belong in different boxes
on the return.

The remainder is the reconciliation. Zero means the booking matches the
paperwork; anything else is the amount somebody still has to explain — which is
precisely why it is shown rather than quietly absorbed into a total.

6.3 — What the invoice posts

  dr 3000 Inventory            what the lines say the goods are worth
  dr 7100 Purchase costs       whatever the invoice covered that never became
                               stock (freight, handling, options)
  dr 1520 VAT reclaimable
  dr 4750 Credit restriction   if the supplier's term carries one
  dr 1999 Differences          the remainder, when there is one
     cr 1600 Creditors         the whole invoice

The split between 3000 and 7100 is computed, not typed: whatever part of the net
total is not inventory value is a cost of buying. Freight is a cost of buying,
not stock, which is why it never enters the lot's value.

Goods received are an asset, not a cost. Buying steel does not make the business
poorer — it swaps cash for steel, and the cost lands when the steel is sold.
Expensing it at purchase would put the cost in whichever month purchasing
happened to buy, which makes every monthly margin a function of purchasing's
timing.

The remainder gets an account of its own rather than being folded into the goods.
A difference between a supplier's total and their lines is something a bookkeeper
has to clear, and burying it in inventory or cost of sales is how it stops being
clearable.

Booking the invoice is also what puts a cost on the article. The average purchase
price and the last invoiced price stop being zero everywhere they are shown the
moment it commits, with nothing to recalculate — they are read from these lines.
Base price is the one figure that does not follow on its own, because it is the
product's own sales price; /product-prices has to be re-run to mark the new cost
up.

Cancelling a purchase invoice reverses the posting and pulls the stock back,
restating what is left of the lot so its value follows its quantity.

6.4 — Editability of the purchase chain

Each rule exists because something downstream has already been decided:

  isPurchaseQuoteEditable        not awarded, not lost. An awarded quote is the
                                 head of the cost chain — a purchase order was
                                 raised from it and stock is valued at its
                                 prices. "expired" stays editable on purpose,
                                 because that is how validity gets extended.
  isPurchaseRequestEditable      not awarded, not cancelled
  canEditPurchaseRequestLines    only while null or draft. Asking a supplier for
                                 a quote copies the request's lines onto it;
                                 editing them afterwards would leave the answers
                                 on file responding to a different question.
  isPurchaseReturnOrderEditable  not received, credited or cancelled

===============================================================================
PART 7 — Selling
===============================================================================

7.1 — Quote to order

A quote's lines are priced by 4.3 on save. Converting to an order allocates each
line against pending lots (5.4), reserving stock exactly as the order form does,
and the new order inherits the quote's customer, references, delivery and payment
terms, order-type flags and contract.

An order can also be created directly. Either way the credit check in Part 8 runs
first.

7.2 — Delivery

Delivering is where the goods physically leave. It consumes the reserved lot,
restates the lot's value (5.2), writes the "out" movement, sets the line to
delivered, and emails a delivery note carrying quantities only — the invoice says
what it costs.

A block has to actually stop the goods or it is only a label, so both the line's
own holds and the order's financial block refuse delivery here. Both are lifted
the same way: deliberately, by someone with the authority, leaving a record of
who did it.

  dr 3200 Goods delivered, not invoiced      what the goods cost us
     cr 3000 Inventory

The figure posted is the value the lot actually gave up, not what the order line
says it should have been. That is what keeps account 3000 reconcilable to the
Stock table line by line.

The goods have left but have not been billed, so their cost is parked. Waiting
for the invoice would leave the balance sheet claiming stock that had already
shipped. Note the asymmetry this creates: cancelling the invoice afterwards does
not bring the stock back, because the goods really did ship.

7.3 — Invoicing, in full or in part

An invoice line carries the order line's already-resolved per-unit price and cost
verbatim. Nothing is priced a second time — the order line resolved both at
reservation, the price from the contract and the cost from the lot, and that
resolution is exactly what is being billed.

What changes with a part-bill is the extended money. Amount, cost, weight and
both profits are apportioned to the quantity on this invoice; net price, cost
price and margin percentage are carried through untouched, because they do not
scale. Weight bills what actually shipped where an actual weight was recorded,
falling back to the planned figure.

The apportionment is exact by construction. proRataSlice measures a slice as the
movement in the cumulative total — what should have been billed after this
instalment, less what should have been billed before it — so the last slice lands
on exactly the line total whatever the rounding did to the ones before. Three
instalments of a €100.00 line come to 33.33 / 33.34 / 33.33, never 99.99. A line
with no quantity cannot be apportioned and bills in full; that is the
surcharge-shaped case, value with nothing to divide it by.

Consequences of a part-bill, all of them deliberate:

- The line stays "delivered" and offers its remainder next time. Its line status
  becomes "partially invoiced", and it only reaches "invoiced" when all of it is
  billed.
- Only its unbilled share counts towards the customer's committed-order exposure,
  and only its unbilled share appears on /cost-price-invoices-to-be-sent. The
  billed share is an invoice now.
- An order with any part invoiced can no longer be cancelled.

7.4 — What the invoice charges

  exclVat          the summary's total revenue (materials + surcharges)
  creditRestriction the surcharge the payment term carries, on exclVat
  vatAmount        (exclVat + creditRestriction) × the scenario's rate
  inclVat          exclVat + vatAmount
  invoiceTotal     inclVat + creditRestriction
  outstanding      invoiceTotal, in full until a payment is registered

VAT is charged on the credit restriction too, which is why the taxable base is
the goods plus the surcharge rather than the goods alone, and why the system
carries a dedicated VAT code for it.

  dr 1300 Debtors                the whole invoice
     cr 8000 Sales revenue       net
     cr 4750 Credit restriction  the surcharge
     cr 1530 VAT payable
  dr 7000 Cost of sales          what the goods being billed cost us
     cr 3200                     clearing the holding account

The cost rides inside the sales entry rather than beside it. It balances on its
own as a second pair, and keeping it in the same entry is what makes cancelling
the invoice give back the margin along with the revenue.

Cancelling voids the invoice: the posting reverses, outstanding goes to 0.00 so
the debt stops consuming credit space, and the quantity it billed is handed back
to the order line so it can be billed again.

An invoice's header amounts stay correctable after it is raised — a credit
restriction, an agreed goodwill adjustment or a rounding fix has to be bookable
without re-cutting the invoice.

7.5 — Document reference

invoiceReference prints INV-<id>, or CRN-<id> when the document is a credit note,
and it is shared by the overview, the detail screen and the email so a customer
quoting a number back finds the same document on screen.

===============================================================================
PART 8 — Credit control
===============================================================================

8.1 — What is measured

Exposure is everything the customer would owe once this order is invoiced:

  openReceivables  SUM(outstanding) over their invoices that are not cancelled.
                   A cancelled invoice is void, so counting it would hold orders
                   against money that was never receivable.
  committedOrders  order lines taken and not yet invoiced — receivables in
                   waiting
  orderAmount      the gross value of the order being placed
  exposure         openReceivables + committedOrders + orderAmount
  creditSpace      creditLimit − (openReceivables + committedOrders)

8.2 — Committed orders

Only lines at "reserved" or "delivered" count. A fully invoiced line has already
become an invoice and is counted there; cancelled and returned lines will never
become receivables at all. A part-billed line stays at "delivered" and
contributes only its unbilled share, computed in SQL as
amount × (quantity − invoicedQuantity) / quantity, with a zero-quantity line
counting in full.

Line amounts are stored net while receivables are gross, so committed value is
grossed up before the two are added — at the rate the order's own summary
applied, from the customer's calculateVat flag. Summing net lines raw would
understate every uninvoiced order by its VAT, which at the standard rate hands a
debtor about a fifth of their limit again in credit space that does not exist,
and the shortfall only appears when the invoice lands.

8.3 — The rule, and the two refusals to block

An order is held when exposure exceeds the limit. Two cases deliberately never
block:

- A debtor with no limit recorded (0 or blank) is never blocked. Blank means
  nobody has set one, not "this customer may owe nothing" — reading it the other
  way would hold every order in the system.
- An order paid for up front is never blocked however much is outstanding,
  because it adds nothing to what the customer owes. paymentTermExtendsCredit is
  false only for a term settled on the invoice date: netDays of 0, or 100%
  prepayment. An unknown term is treated as extending credit, because the safe
  assumption is the one that checks.

A company blocked by hand is blocked regardless of either, since that flag exists
precisely to override the arithmetic, and its reason is reported as "Customer is
blocked".

The blocking reason names the figures it was decided on, and it has to fit
Orders.blockingReason (varchar 255). /credit-information-customers shows the same
figures the decision used, not a second opinion.

The check reads inside the surrounding transaction, so the figures it decides on
are the ones the order is actually being written against. The order being
assessed is excluded from the committed total and counted once, as orderAmount.

===============================================================================
PART 9 — Terms, VAT and settlement
===============================================================================

9.1 — A payment term is six numbers

Every term the ERP offers is self-describing ("within 30 days", "5% prepayment,
balance CAD"). PAYMENT_TERM_META turns that into what downstream code needs:

  netDays                      days after the invoice date the balance is due,
                               or null when no due date can be derived from the
                               invoice date alone
  endOfMonth                   the net period runs to the end of the month it
                               lands in
  prepaymentPercentage         portion required up front
  discountPercentage/Days      early-payment discount and its window
  creditRestrictionPercentage  the Dutch kredietbeperking surcharge

Terms whose due date cannot be pinned to the invoice date — letters of credit,
cash against documents, before shipping, copy BL, after arrival — carry
netDays = null and no surcharge, because there is no window to waive one against.

DEFAULT_CREDIT_RESTRICTION_PERCENTAGE is 2, and it is a policy assumption, not
something read from the reference system: that system holds the field on both
sales and purchase invoices but carries no rate to read, and 2% is the
conventional Dutch rate. One constant changes every term at once. Paying now
costs nothing extra, so terms settled on the invoice date carry no surcharge.

9.2 — Due date

getPaymentTermDueDate adds netDays to the invoice date, then rolls to the last
day of the month when the term is end-of-month. Null when the term pins no date
or there is no invoice date — callers keep whatever date is already set rather
than inventing one.

9.3 — VAT

  vat_0        0%
  vat_low_9    9%
  vat_middle  12%
  vat_high_21 21%

A sales invoice's header carries a scenario rather than a per-line code, so the
standard 21% is the applicable rate and a reverse-charge scenario drops it to 0.
Reverse charge moves the liability to the counterparty, so the document itself
charges nothing; a missing scenario defaults to charging, matching the standard
domestic case.

A quote charges VAT only when the quote asks for it and the customer is one VAT
is calculated for. A VAT-exempt customer never gets VAT on a quote that ticks the
box.

9.4 — What a payer may keep back

Both deductions are deadlines, not sliding scales, and together they can never
exceed the balance:

  discountAvailable           the term's early-payment discount, computed on the
                              net amount, in full if the money arrived inside the
                              window and zero otherwise
  creditRestrictionAvailable  the whole surcharge if paid on or before the due
                              date, zero after, zero when there is no due date
  deductionAvailable          the two, capped at what is outstanding
  cashDue                     outstanding − deductionAvailable

The discount is calculated on the net rather than the gross: the VAT belongs to
the tax authority either way, so discounting it would give away money that was
never the seller's to give.

Deductions are offered, never forced. A customer who pays early without keeping
anything back has simply paid more.

9.5 — Registering a payment

A payment settles either a sales invoice or a purchase invoice, never both and
never neither. The amount must be above zero, the invoice must not be cancelled,
and it must still have a balance.

  settled = cash + discount taken
  outstanding = outstanding − settled

Settling more than is outstanding is refused. An invoice can therefore close in
full even though less money arrived than was billed, which is why the payment
detail reports the settled amount and not only the cash.

  dr 1100 Bank                   the cash that actually arrived
  dr 4700 Discount granted       what the payer kept for paying early
  dr 4750 Credit restriction     the surcharge given back
     cr 1300 Debtors             the whole amount settled

The discount gets its own entry rather than quietly vanishing into the difference
between billed and banked — it is a real cost of collecting early, which is also
why it sits at 4700 and not in the 8xxx revenue range. A settlement records money
moving and nothing else; the VAT was booked when the invoice was raised, so
posting it again here would double it.

Which sub-ledger is cleared follows from which document was settled: debtors for
a sales invoice, creditors for a purchase invoice.

9.6 — Reversal, not correction

A payment is never edited. Getting one wrong is corrected by reversing it and
registering the right one, so the trail keeps what was booked and when. Reversal
puts the money back on the invoice and negates the ledger entries.

===============================================================================
PART 10 — The general ledger
===============================================================================

10.1 — The chart

Dutch numbering, which the reference system also uses: 1xxx balance sheet, 4xxx
costs, 7xxx cost of sales, 8xxx revenue.

  1100 Bank                          asset
  1300 Trade debtors                 asset, sub-ledger
  1520 VAT reclaimable               asset
  1530 VAT payable                   liability
  1600 Trade creditors               liability, sub-ledger
  1999 Differences to be cleared     liability
  3000 Inventory                     asset
  3100 Goods returned, not credited  asset
  3200 Goods delivered, not invoiced asset
  4700 Early payment discount        expense
  4750 Credit restriction            revenue
  7000 Cost of sales                 expense
  7100 Purchase costs and freight    expense
  7200 Inventory differences         expense
  8000 Sales revenue                 revenue

The chart is seeded from /trial-balance and the seed is additive: an account
somebody renamed is never overwritten. It is held in the same file as the posting
code on purpose — an account this system posts to but cannot name is a gap, and
keeping both together makes that gap obvious the moment a new account appears.

4750 is a revenue account, which is why the surcharge is credited on a sale and
debited on a purchase: we earn it from customers and pay it to suppliers.

10.2 — How an entry is built

Every posting is expressed as a list of signed drafts and passed through one
builder. Positive lands on the debit side, negative on the credit side, and
debitCredit does that split in one place — a negative debit is a credit, which is
what makes reversals and credit notes land on the other side rather than as a
negative figure on the same one. Posting code otherwise repeats the ternary at
every call site, and one of them getting the sign backwards produces an entry
that still balances while recording the opposite of what happened, which a trial
balance cannot catch.

The builder then:

- drops any line under half a cent;
- stamps every line with the booking date, the financial year and the period;
- tags the entry with the invoice or purchase invoice it belongs to, so it can be
  reversed as a unit;
- refuses to return anything that does not balance.

That refusal is the point. An unbalanced entry is a bug in the caller, and
letting it reach the database means the ledger can never be trusted again —
every report built on it would need a caveat. Failing the invoice is
recoverable; a silently broken ledger is not.

postingBalance states double entry's single rule as code because it is the only
check that catches a whole class of accounting bug at once: a forgotten VAT line,
a surcharge posted to no counter-account, a credit note that reverses three lines
out of four. None of those are visible in a list of journal rows; all of them
show up there immediately.

10.3 — Periods

A posting's financial year and period come from its booking date, and periods are
calendar months — JournalEntries carries a plain integer beside the year and
nothing in the system defines a fiscal offset, so the month number is the only
honest reading.

A posting with no booking date gets null rather than today's period. Filing an
entry into a period it does not belong to is worse than leaving it unfiled,
because a period that has already been reported would silently change.

A yyyy-mm-dd string is read as written rather than through Date, which would
parse it as UTC midnight and shift it back a day — and so into the previous
period — for any timezone behind UTC.

10.4 — The four journals

  sales      an invoice or credit note, revenue and cost of sales together
  purchase   a supplier invoice or credit note
  stock      inventory moving with no invoice attached yet
  bank       a settlement

An inventory movement entry is always inventory against whichever account is
holding the value in the meantime. Nothing is earned or lost — value changes
hands between two balance-sheet accounts, which is exactly what a delivery or a
return is until the paperwork settles it. Both of those accounts should clear to
nothing once it does.

10.5 — What has to be true

- The ledger balances. A difference means an entry posted one side and not the
  other; sorting journal entries by document finds it.
- Account 3000 equals SUM(Stock.valuation_euro), to the cent. This is the one
  balance with an independent source of truth. Every inventory posting is the
  value a lot actually gained or lost, so the two are the same arithmetic and
  must agree; a drift means stock moved without the ledger following.
- 3200 and 3100 clear to zero once every document has followed. A balance left on
  either is goods that moved and were never billed — the figure a bookkeeper has
  to chase.
- Every account carrying a posting is named in the chart. Anything flagged
  missing means the chart was never seeded.
- A completed production run moves inventory by nothing.

===============================================================================
PART 11 — Receivables
===============================================================================

11.1 — One definition of "open"

There is exactly one, in lib/server/receivables.ts, so the ageing report and the
reminder run can never disagree about which invoices are outstanding:

- a cancelled invoice is void, so nothing is owed on it;
- a zero balance is settled, whether by payment, discount or credit;
- a non-zero balance is open, including a negative one. A credit note the
  customer has not yet taken against an invoice is money we owe them, and leaving
  it out would overstate the debt.

Open items are ordered oldest debt first, which is the order a credit controller
works in. A debtor whose reminder flag was never set is chased: the column
defaults to true, and blank means "not configured", not "leave them alone".

An action about to write to a customer re-reads the item rather than trusting
what the page was rendered with, and gets null when it is no longer open —
cancelled, or settled since the screen was drawn.

11.2 — Ageing

Age is measured from the due date, never the invoice date. Two invoices raised
the same morning on 8-day and 60-day terms are not equally late, and only the due
date knows that.

  not_due       not yet due, or no derivable due date
  days_1_30
  days_31_60
  days_61_90
  days_over_90

daysOverdue is zero on the due date itself — the debtor has all of that day to
pay — and negative while still inside the term, which is how the caller tells
"not due" from "due today".

An invoice on a term that pins no date is reported as not-due rather than
dropped. The money is owed and belongs in the total, but calling it late would
assert a deadline the document never carried.

The buckets always add up to the whole debt, including not-yet-due, so the report
reconciles against the sales ledger. A credit note nets down the bucket it falls
in, which means a bucket can legitimately come out negative — a customer owed
more than they owe.

11.3 — Reminders

assessReminder decides, in this order, and the order matters:

  1. a credit note is owed to the customer, so it is never chased;
  2. nothing outstanding, nothing to chase;
  3. the debtor's reminder flag is off — never chased automatically, whatever the
     age. That flag is for accounts handled by hand: a payment plan, a dispute, a
     receiver;
  4. no due date to measure against;
  5. not due yet;
  6. a final notice has already been sent;
  7. not yet at the next stage's threshold.

Thresholds are 14 / 28 / 42 days past due for first / second / final. That is the
conventional Dutch cadence rather than something read from the reference system;
REMINDER_STAGE_AFTER_DAYS changes the policy everywhere.

Escalation is a sequence of letters, not a lookup. An invoice sixty days late
that has had nothing sent gets a first reminder, not a final notice.

Each stage is sent once per invoice, enforced by a unique index, so two people
working the same list cannot mail the same letter twice. The stage is decided
server-side from the invoice as it stands at that moment, never taken from the
page — a tab left open cannot send a final notice to somebody who has since paid.

The screen shows why every other open item is not being chased, with the reason.
Without that half the screen looks like it has lost invoices.

What was owed and how late it was are recorded as they stood when the reminder
went, so the record does not rewrite itself when half the balance arrives.

A reminder to a debtor with no email on file is still recorded, with nobody
reached: that is a standing condition rather than a hiccup, and leaving it
unrecorded would offer the same reminder forever and never escalate. A reminder
that failed to deliver to an address that does exist is not recorded, so it stays
on the list to try again.

The reminder mail is deliberately not a copy of the invoice. The customer already
has that; what they are sent is the balance still open, how late it is, and — at
the final stage — what happens next. The tone escalates with the stage while the
figures stay identical, because the amount owed is not a matter of emphasis.

===============================================================================
PART 12 — Returns
===============================================================================

12.1 — Sales return

  Receive:      dr 3000 Inventory   the goods are back on the shelf, at the
                cr 3200             value they left at
  Credit note:  the sales entry with every figure negated, cost included

Between receiving and crediting, 3200 goes negative — goods on hand that nobody
has been given credit for yet. It clears when the credit note is raised.

A credit note is the same document with negative amounts, so it ages, posts and
settles through exactly the same machinery, and its negative outstanding is what
nets the customer's debt down. No reversal flag is needed: amounts arriving
negative flip the sides on their own.

12.2 — Purchase return

  Dispatch:  cr 3000 Inventory     the stock leaves the shelf
             dr 3100               the supplier owes us for it
  Credit:    cr 3100, cr 1520 VAT, dr 1600 Creditors

The supplier's credit note posts to 3100 and not to inventory, because the stock
left when the goods were shipped back. Crediting inventory again would remove the
same material twice. That is what the goodsAccount override on a purchase posting
exists for.

12.3 — Complaints feed returns

returnReasonForComplaintCategory maps a complaint category to a return reason.
The two vocabularies were written for different screens and only partly overlap,
so anything without a clear counterpart lands on "other" rather than being forced
into a reason that would misreport why the goods came back.

complaintSolutionReturnsGoods decides whether the agreed solution involves the
goods physically coming back. Only those justify a return order: a price
correction or a rejected complaint settles on paper, and a subsequent delivery
sends more out rather than bringing anything in.

===============================================================================
PART 13 — Logistics, traceability and statistics
===============================================================================

13.1 — Production and transport planning

Production work orders are generated from order lines, one line per order item,
grouped under a single work order on the first machine, and the generation is
re-runnable because lines that already have one are skipped. Only lines still
holding their reservation can be planned: a line that has shipped or been billed
has no material left to process, and one cancelled or returned never will.

Deduplication is on the order line itself, not on order number plus product.
Keying on the latter collapsed two lines of the same product on one order into
one, so the second was never planned — and since completing a line consumes its
reserved lot, planning the wrong line would consume the wrong material.

Transport work orders are generated the same way and complete with no stock
change, because the stock already left at delivery.

13.2 — Weight and length

  toKilograms      a quantity already in kg passes through; anything else is
                   weighed with the product's theoretical weight per unit. A
                   product with no theoretical weight contributes nothing rather
                   than silently counting pieces as kilograms.
  runningMeters    a line already counted in running metres passes through;
                   anything else is quantity × length / 1000. Unknown length
                   yields 0 rather than an invented figure. Derived rather than
                   stored, because it is never independent information.
  resolveOrderWeight  which of the four bases an order bills against —
                   theoretical, trade, German trade, or actually weighed.

13.3 — Batches and certificates

Batches are generated one per received purchase order line, re-runnably. Each
batch is expected to carry a mill certificate, raised by generation and marked
received as the paperwork arrives.

resolveCertificateFromOptions reads the certificate a batch was bought with off
the processing options the purchase line was ordered under: the options name the
certificate directly, so an explicit 3.1 wins and anything else falls back to the
2.1 declaration of compliance that always accompanies the goods.

formatInternalChargeNumber is the internal trace number a received batch carries:
IC-<year>-<4-digit sequence within that year>.

13.4 — The SFN goods-flow return

Built entirely from the FreightMovements mirror (5.7), monthly, per revenue
group, in kilograms: starting stock carried forward, receipts split by supplier,
sales split by customer, the stock difference, ending inventory (which always
reconciles), and the outstanding order book.

Each traded counterparty is classified as producer, federation member or
non-member. An unclassified or unknown counterparty defaults to a domestic
non-member — the conservative reading, and the one the return files unrecorded
companies under. isDomesticCountry treats nl / nld / netherlands / nederland as
home, and a counterparty with no country recorded as domestic, since an unknown
address is far more likely to be a local one nobody filled in than an export.

13.5 — Reorder advice

  computeMinimumStock  a fixed value, or a multiplier on average monthly
                       consumption, depending on the product's stock mode
  resolveLeadTime      the manual value, or the automatic maximum or average of
                       observed lead times, depending on the configured method
  roundToOrderQty      an advised quantity lifted to the minimum order quantity
                       and then rounded up to the supplier's order series; a
                       non-positive advice stays zero

===============================================================================
PART 14 — Documents and email
===============================================================================

14.1 — Who a document goes to

selectRecipientAddresses decides:

- A document that names its own contact goes to that person, so a purchase order
  addressed to one buyer is not copied to everyone at the supplier.
- Only when the document names nobody — or the person it names has no address on
  file — does it fall back to every contact held for the company, which is better
  than sending nothing.
- An address the company explicitly configured is added alongside the contacts
  rather than replacing them: it says where the company also wants the document,
  not who stops receiving it.
- Addresses are de-duplicated, and a configured routing column may hold several
  separated by a comma or semicolon.

Each recipient is mailed separately, so they never see each other's addresses.

14.2 — When, and what happens if it fails

Always after the transaction commits, and never able to fail the thing it
describes. The document is already committed and mail cannot be rolled back with
it, so failures are counted and logged.

What each document says is a decision in itself: a purchase order states what is
being ordered, at what price and when it is expected; a delivery note states what
shipped and carries no prices at all; the invoice states what it costs; a
reminder states the balance and the delay rather than repeating the invoice.

===============================================================================
PART 15 — Enum-driven logic
===============================================================================

15.1 — Delivery terms are Incoterms

INCOTERM_META answers, per term: does the seller arrange and pay the main
carriage, does the seller carry an insurance obligation (only CIF and CIP), who
clears export (everyone except EXW), who clears import (only DDP), and where risk
passes — seller's premises, carrier handover, on board, named destination, or
buyer's premises.

15.2 — Order type is a set of flags, not a column

An order can be several things at once — a consignment order collected by the
customer is both — which is why there is no single type enum. Two readings
exist, deliberately:

  resolveOrderTypeLabel  one label, most specific wins: consignment, then
                         customer material, internal production, incidental,
                         pickup, else Standard. For overviews with one column.
  describeOrderType      every flag that is set, comma separated, else
                         "Standard". For the production and logistics reports.

The pickup flag also decides which margin floor a line is held to (4.4).

15.3 — Dates from planning values

  addLeadTime         adds a lead time in working days (skipping weekends),
                      weeks, or months
  isoWeekToDate       the Monday of an ISO week — week 1 is the week containing
                      the first Thursday of the year
  resolveDeliveryDate a date-type delivery is its date; a week-type delivery is
                      the Monday of that week

15.4 — Transport cost

computeTransportCost by the transporter's price unit: a flat amount, a rate per
kilometre, a rate per kilogram, or a percentage of the goods value. Missing
context for the chosen unit yields zero rather than a guess.

15.5 — Status colour

statusTone is keyed on the stored value, not on the table it came from, because
the same words mean the same thing across the system: cancelled is cancelled
whether it was an order, a purchase order or a complaint. Values group into
neutral, active, done, attention and critical, and a value nobody has classified
stays neutral rather than being guessed at.

15.6 — Presentation rules with a reason behind them

  formatCompactNumber   for a figure read on its own — a tile, an axis tick. A
                        column that has to add up keeps full precision, since
                        rounding to one decimal makes the parts stop summing to
                        the total.
  formatMoneyOrDash     an em dash where the amount is zero. A page of "€ 0.00"
                        hides the rows that carry a number.
  formatOverdueDays     blank while inside the term. "0" would read as due today
                        rather than as not yet due.
  percentChange         null when the earlier period was zero. Growth from
                        nothing is not a percentage, and reporting it as one
                        invents a baseline that was never there.
  initialsOf, orDash    an em dash for a missing value, never a blank cell
  toFormString          null becomes a string, because handing an input null
                        makes React switch it from controlled to uncontrolled
                        mid-edit; the fallback is "0.00" for a decimal field so
                        the box reads as a figure of zero rather than an empty
                        one
  enumOptions           every dropdown leads with an "Empty" entry, because
                        unset is a real choice on the document screens

15.7 — A material grade is metallurgy, and a shape is a formula

A grade code is not a label. materialGradeMeta splits it the way the codes are
built — a base grade plus a surface suffix — so 316L2B is 316L in a 2B finish
and C45+QT is C45 quenched and tempered. Both halves are matched longest-first,
which is what keeps 304L2B from being read as 304, and +C/SH from being read as
a plain +C. A code that matches no base is weighed as carbon steel at 7.85
rather than yielding no weight at all, and that fallback is stated in the table
so nobody mistakes it for a measurement.

The base decides four things: the metal family, the density every theoretical
weight is computed from, the alloy content an alloy surcharge is charged on
(chromium, nickel, molybdenum, and the titanium that marks a stabilised grade),
and whether the material is magnetic — which is how the yard separates a
300-series offcut from a 400-series one. The suffix decides the surface: whether
it travels under foil, whether it is decorative, whether it was cold rolled, and
whether it carries a metallic coating whose cut edges need touching up.

The shape decides the cross-section. crossSectionAreaMm2 is the real formula per
shape — π/4·d² for a round bar, π·t·(d−t) for a round tube, t·(2w−t) for an
angle, width times thickness for anything flat — and crossSectionPerimeterMm is
the outer perimeter the paintable surface comes from. A cross-section in mm²
over one metre is area/1000 dm³, so weight per metre is the density times that.

Two shapes deliberately yield nothing. A beam's section comes from a profile
table this system does not hold, so it is marked not derivable and keeps the
weight per metre that was typed for it. A rectangular tube carries one width and
one thickness on the article, so it is weighed as a square tube on the width it
has: inventing the second side would put a wrong weight on the line instead of
an absent one.

deriveArticleWeights returns only what it can actually derive, and
derivedWeightColumns turns that into the decimal strings the columns hold. Both
createProduct and updateProduct run it, and so does the product group mapper, so
a change of dimension, shape or grade cannot leave a weight behind that belongs
to the previous one. What cannot be derived is never overwritten.

15.8 — A surcharge description is a formula, not a caption

A surcharge row carries a rate and an amount, and the amount used to be the
rate. That is right for exactly the flat ones: a project discount of 5 charged
five euro instead of taking five percent off, and a decoil surcharge of 0.02
charged two cents for the whole consignment instead of two cents a kilo.

SURCHARGE_META gives each of the twenty-two descriptions four decisions:

  basis         what the rate is a rate of — a flat amount, a percentage of the
                goods value, per kilogram, per line, per pallet, per certificate
  deduction     comes off the document rather than being added to it: a project
                discount, and the two credit notes still to be received
  costRecharge  recharges a cost the company itself incurred, so the row is
                expected to carry a cost and contributes margin, not pure profit
  purchaseOnly  exists to reconcile what a supplier billed against what its
                lines explain — rounding differences, price differences, EU
                import duties, credit notes to be received. Six of the
                twenty-two. A customer invoice that carried one would be
                billing the customer for our own bookkeeping, so createInvoice
                refuses it by name.

Each description also names the revenue group it is reported under, which is
what lets freight, cutting, decoiling and the allowances land in the right place
without a second mapping.

computeSurchargeAmount applies the rate on its basis and signs the result from
`deduction`. A basis with no context to measure against yields zero rather than
a guess, the same rule computeTransportCost follows, and a row whose description
is not set charges nothing.

resolveSurchargeAmounts does that for every row of a document, leaving the rate
exactly as typed — it is what a person agreed — and computing only the amount it
implies. Quotes, orders, sales invoices and purchase invoices all run it against
their own lines, so the same rate on the same description charges the same thing
wherever it is used. The invoice form no longer copies the rate into the amount:
it cannot, because the weight and value being billed are only known on the
server.

15.9 — A revenue group says what kind of revenue it is

Revenue per revenue group added traded metal, a freight recharge and a price
difference into one column and printed a margin on the total. REVENUE_GROUP_META
classifies all twenty-six: eight material, six processing, two freight, one
allowance, six adjustment, three other. Each also carries the ledger account
type it belongs to, whether it is a deduction, and whether it counts toward the
material margin — which only the eight material groups do.

The report now prints the kind, shows a margin only on the rows a margin can be
earned on, and subtotals material apart from everything else. It groups by the
RevenueGroups table, whose rows are named by hand, so revenueGroupFromName
matches a stored name against the labels; a name nobody recognises reads as
"other", which is the kind that claims nothing about the figures beneath it.

revenueGroupForMaterialGrade reads the group off the grade instead: 316 in any
finish reports under SS 316, 321 under SS 321, the heat-resistant grades under
High Alloys, ferritic and martensitic under SS 430, the rest of austenitic under
SS 304, aluminium under Aluminium, brass, bronze and copper under Other
products, and everything else under Steel. All 157 grades resolve.

ARTICLE_GROUP_META says the same one level up: CK is coil, PW and PK are sheet,
PTA is sheet at the thickness its code carries (PTA2,5 is 2.5 mm), PDIVA is the
mixed group. Each names the family, the shape and the revenue group its articles
roll into.

A product group's revenue group is therefore no longer a blank when nobody picks
one: the grade answers it, and the article group answers it if there is no
grade. The grade wins, being the more specific of the two.

15.10 — A machine's option and its production line have to agree

A machine carried an option and a production line as two free choices, so a
decoiler could be set up to run a laser and nothing objected.
MACHINE_PRODUCTION_META names what each of the six lines performs — decoiler:
decoiling and slitting; shearing: shear cut; laser 1 and laser 2: laser;
grinding/foiling: grinding, brushing, polishing and the four foil steps;
internal processing: the remaining eleven. Every one of the twenty-two options
is performed by at least one line, and canMachinePerform is checked on both
create and edit.

MACHINE_OPTION_META gives each option the unit a machine running it measures its
day in — a laser in cutting metres, a grinder in square metres, a decoiler in
kilos, a saw in pieces — so a new machine's capacity unit is defaulted from its
option rather than picked from a list of thirteen. It also records what the run
does to the goods: whether material is cut away (the seven cutting steps),
whether foil is applied or stripped, whether the surface itself is changed so
the finish the grade names no longer describes it, and the setup time lost
before the run starts.

15.11 — A production run is planned from what was sold

The sold-processing vocabulary is the same list plus three steps no machine
performs: paper interleaving and the two certificates.
MACHINE_OPTION_FOR_PROCESSING maps the twenty-five onto the twenty-two, with
those three mapping to nothing rather than to a pretend option.

generateProductionWorkOrders used to put every reserved line on whichever
machine came back first and record no option at all — the shop floor was told to
process something without being told what to do to it. It now reads each line's
sold options, turns each into the machine option that performs it, and opens one
work order per machine and option. A line sold two steps is planned onto both,
because both have to happen to it. A machine out of business cannot take work,
and one whose line cannot perform the option is passed over in favour of one
that can — preferring the machine already set up for it. A line sold no
processing at all is still planned, on no particular option, which is what it
was before.

15.12 — A mode of transport is an Intrastat code

The eight transport modes are not a house list: they are the Intrastat
mode-of-transport code list, and the numbers are what a statutory return
declares — 1 sea, 2 rail, 3 road, 4 air, 5 post, 7 fixed installations, 8 inland
waterway, 9 own propulsion. TRANSPORT_MODE_META carries those codes, so the CBS
export declares the transport code from the order's own transport mode instead
of printing a dash. A mode nobody recorded still prints a dash: a statutory
return may not guess.

Each mode also carries what one consignment can lift (24 t by road, 5 t by air,
30 kg by post, no practical limit by sea or barge), how much longer it takes than
the road journey the region's transit time is quoted for, and the consignment
note it travels under — CMR, bill of lading, air waybill, CIM.

TRANSPORT_REGION_META answers the rest for the twelve regions: whether it is
domestic, whether it is inside the EU customs union (the UK is not, since
Brexit; "Eastern Europe" here is the non-member part, the Baltic states having
their own region), the road transit time in working days, the mode a consignment
goes by unless told otherwise, and how much more the freight costs than a
domestic delivery.

What that gives:

  estimatedTransitDays      the region's road time stretched by the mode, so
                            Asia is 36 working days by sea and 2 by air
  requiresCustomsDocuments  outside the customs union only; a region nobody set
                            reads as domestic, on the same reasoning as
                            isDomesticCountry
  defaultTransportModeFor   road within Europe, sea from Asia and South America
  freightCostForRegion      the transporter's rate plus the region's distance
                            surcharge
  consignmentsNeeded        how many loads a weight needs by that mode

The order form's transport region and mode were free-text boxes, so neither
could be asked any of this. Both are now selects over their enums, and the form
prints the transit time and whether export documents travel with the goods while
the order is being written. A return order and a purchase return order default
their mode from their region.

asTransportMode and asTransportRegion narrow the free-text columns the sales and
purchase order headers hold, returning null for anything unrecognised rather
than letting a stray string reach the metadata.

15.13 — A location type says what state the goods are in

A location's type was recorded and never consulted, so a lot on the scrap heap,
waiting at the inspection bench, or already staged at the loading bay was
offered to a sales order exactly like a lot on a pick face.

WAREHOUSE_LOCATION_TYPE_META answers four questions per type — does it hold
stock, may a sales order draw from it, does a picker walk to it, is it counted —
and, for the types whose stock is not free, why. Three are sellable: pick, bulk
and put-away (received but not yet shelved: our stock, standing in the wrong
place). Eight are not, and each says why: inspection is awaiting a verdict,
call-off is held against a contract, and production, processing, sorting, load,
collection and scrap are all spoken for or on their way somewhere.

That rule is enforced where stock is offered and where it is allocated:
getAvailableStockForSelect, getPendingStockForCompany and the quote-line
allocation now exclude blocked lots and lots standing anywhere non-sellable. A
location with no type recorded stays sellable — most locations are ordinary
shelves, and refusing every unclassified one would empty the warehouse on paper.
The locations overview prints sellable, picked-from and counted, and falls back
to the type's own block reason where none was typed.

The seven work-order line types are the moves between those location kinds:
unloading brings goods in from outside to put-away, put-away shelves them into
bulk, transfer replenishes the pick face, picking stages onto the loading bay,
loading takes them out, processing sends them to a machine, and inspection sends
them to the bench. Each says its from, its to, whether it is a stock in, out or
move, and whether it is closed by a scan. workOrderLineTypeForMove names the
operation for a move, and returns null for one no operation describes — which is
what makes an unsupported move visible rather than silently allowed.

15.14 — A printer is a device, and a label option is a count

A printer was a name on a dropdown, so an A4 pick slip could be routed to a
label roll, a paper tray could be chosen on a device that has none, and a
sticker setting could be saved with no label printer behind it. Nothing
objected; the print run simply came out wrong on the floor.

PRINTER_META describes the thirteen devices: six A4 sheet printers with trays
(three departments, black and colour), two 203 dpi SATO thermal label printers
with no trays, and five virtual devices that only ever produce a file.
WORKORDER_SLIP_META gives each slip type the medium it has to come out on — A4
landscape, A4 portrait, a label, or a CSV file that is not printed at all.

checkPrintSetup refuses three things on save, on both the create screen and the
two edit sections that own printer fields: a slip on a device that cannot produce
its medium, a tray on a device with no trays, and a sticker-per-pick setting with
no label printer behind it. A virtual device accepts anything, because it does.

One thing is deliberately not refused. The two sticker-per-pick settings are
specified at 600 dpi and every label device in the catalogue prints at 203, so
refusing that pair would make the setting unusable. printSetupAdvisory says so on
the screen instead, and the save goes through.

The label options are counts, not captions. customerLabelCount prints one label
per line, one per collo, or one per piece — which is the whole difference between
sticker_per_line, sticker_per_collo and sticker_per_piece, and it was not being
counted anywhere. stockLabelCount does the same for the three breakdowns: the
line's own label plus one per bundle, one per bundle alone, or a fixed number per
line. stickerPerPickCount is none, one for the order, or one per line. The
warehouse work-order detail now shows how many labels each line has to produce.

15.15 — The customer's own document settings

A company carries six sets of options — quote, order, quote/order,
quote/order/invoice, miscellaneous and EDI — as arrays of enum values, and not
one of them was read. So a customer set up with "no financial blockage" was
blocked by the credit rule anyway, one set up with "do not print prices" was
sent an invoice with a price column, and one whose documents were supposed to
lead with its own catalogue code got ours.

Blocking. orderBlockingPolicy and quoteBlockingPolicy read the two waivers off
the arrays, and assessCredit takes financialBlockingWaived. A waived overrun is
not blocked but is still written to Orders.blockingReason with "(not blocked:
financial blocking waived)" after it, because somebody has to be able to see
that the order went over the limit. A customer blocked by hand stays blocked
whatever the waiver says: that was a decision, not a limit being reached.

Quote/order. quoteOrderPolicy gives six requirements. Two are enforced on
createOrder: "reference required" refuses an order that does not quote the
customer's own reference, and "default pickup" and "complete delivery" default
those flags on a new order rather than leaving them false.

Printing. documentPrintPolicy folds four settings into one answer — whether
prices print at all, whether only the line total does, whether options are
condensed and folded into the material price, whether gross prices are
suppressed, which product code leads (the customer's external one, ours, or
none), what order the lines print in, and whether group titles print. The
invoice email honours it: "do not print prices" drops the unit-price and amount
columns from both tables, "total amount per line" drops the unit price and keeps
the total, and orderDocumentLines sorts the lines as entered, alphabetically, or
grouped by the lowest order-line number each description carries.

Invoicing rhythm. invoiceGroupKeyFor gives the key deliveries group into
invoices by — the delivery, the order, or the order line — and nextInvoiceRunDate
the next date a run reaches the customer: tomorrow when daily, next Monday when
weekly (a Monday rolls forward a full week, since this week's run has gone), the
first of next month when monthly.

The rest are read the same way and available to the screens that need them:
customerMiscPolicy (occasional customer, portal login, bill of lading per order,
waybills, consignment, neutral labels, label per sawn piece) and ediPolicy
(product features, PDF attachment).

15.16 — How the money moved decides where it lands

Every settlement posted to the bank, whatever its method. So a till full of
notes, a card payment the acquirer is still holding, and a credit note netted
against an invoice all read as money in the bank account — and an offset, where
nothing arrives at all, said the bank balance went up.

PAYMENT_METHOD_META gives each of the five a settlement account, whether it
settles the same day, whether it needs the counterparty's bank details, whether
any money moves at all, and how many working days it takes to clear. Three
accounts join the chart to receive them: cash in hand (1000), card takings not
yet settled (1150), and settlement offsets (1900).

settlementAccountNumber turns the method into the account, and registerPayment
uses it for all four postings — customer receipt, supplier payment, and both
reversals, the reversal reading the method off the payment it is undoing.
A direct debit is refused against a counterparty with no IBAN and no bank
account on file, because it is collected by us and there is nothing to collect
from. paymentClearsOn dates the money's availability in working days.

15.17 — A currency is not a label

CURRENCY_META carries each currency's ISO code, symbol, decimals, whether it is
the currency the ledger is kept in, and the smallest step cash can actually be
paid in — five cents in the euro area, where the one-cent coins are gone, ten in
Hong Kong, one where the smallest coin still exists.

formatCurrencyAmount prints an amount with its own currency's symbol, so the
three credit limits on the company screen now read in the currency they were
agreed in rather than all in euro. needsCurrencyConversion says whether a figure
has to be converted before it can be compared with a ledger balance, and the
screen says so. roundToCashStep and isPayableInCash answer whether an amount can
physically be handed over.

No exchange rate is invented anywhere. The system stores no rates, so it says
when a conversion is needed and leaves the conversion to whoever has the rate.

===============================================================================
PART 16 — Quick map of the derivations
===============================================================================

Cost side, bottom up:

  supplier invoice line
    → averagePurchasePrice (weighted) and lastPurchasePrice (newest)
    → replacementPrice = lastPurchasePrice
    → cost basis for base price = last, else average
    → line costPrice = average, else replacement
    → but once a lot is reserved, line cost = that lot's valuation price

Sales side, top down:

  base price = fixed sales price, else cost basis × (1 + markup)
    → net price = contract net price, else contract discounts on gross/base,
      else base
    → amount, profit, margin, weight on the line
    → the document's summary blocks
    → the invoice's revenue, and its cost of sales

Stock, cradle to grave:

  purchase order        opens a pending lot, "in" movement, no posting
  purchase invoice      values the lot (3000), owes the supplier (1600),
                        non-stock cost to 7100, unexplained to 1999
  reservation           fixes the line's cost from the lot
  production complete   conserves value, posts nothing
  delivery              consumes the lot, restates its value, parks cost on 3200
  invoice               charges 3200 to 7000, bills 1300 / 8000 / 1530 / 4750
  payment               settles 1300 against 1100, discount to 4700
  return in             3200 back to 3000, then the credit note negates the sale
  correction            3000 against 7200, the one movement with no counterparty

Every stock movement is mirrored into FreightMovements, which the SFN return
totals per month and revenue group.

Invariants, all of them checkable:

  debits = credits                              on every entry, always
  3000 = SUM(Stock.valuation_euro)              to the cent
  3200, 3100 → 0                                once every document has followed
  ageing buckets = total open debt               including not-yet-due
  instalments = the whole line                  exactly, however it was split
  consumed = produced + remnant + waste         on every production run
  committed + receivables = what gates a limit  the same figures on screen

===============================================================================
PART 17 — Where the logic is knowingly incomplete
===============================================================================

Policy assumptions, not read from the reference system. Each is one constant:

- DEFAULT_CREDIT_RESTRICTION_PERCENTAGE = 2. The reference system holds the field
  but carries no rate and exposed no maintenance screen for it.
- REMINDER_STAGE_AFTER_DAYS = 14 / 28 / 42. The reference system holds a
  per-debtor reminder flag but no schedule.
- STANDARD_INVOICE_VAT_RATE = 21%, because an invoice header carries a scenario
  rather than a per-line VAT code.

Server logic complete, no screen writes to it:

- Sales return lines. The New Return Order form sends no line items, and
  /return-lines → Generate from orders writes lines carrying the original order
  and line number but not the order line's uuid, which is what Receive and Credit
  match on. Receive therefore moves no stock and Credit refuses.
- Purchase return lines. The New Purchase Return Order form sends no line items
  either, so Dispatch and Credit have nothing to act on.
- Paying a supplier. registerPayment handles a purchase invoice and posts it
  against creditors and bank, but no purchase invoice screen offers the form, so
  a purchase invoice's balance can only go down by being cancelled.
- The "partially invoiced" line status is set on part-billed lines, and no
  overview filters on it.

Columns with no source in this data model, so they stay blank rather than being
invented: CBS/Intrastat codes, the FSP change history a revaluation figure would
need, a trip's region and delivery address, the processor and GL account on an
external-processing movement, and the electronic certificate-exchange message
status. Each is named on the screen that would otherwise look broken.

/balanced-scorecard is a frame only: every value, target, status and trend is
currently hardcoded, so it reads identically before and after a full run.
