# Prompt — visualise the Swedinox ERP (everything except Finance)

> Paste everything below the line into the visualisation tool. Attach
> `FIELDS.md` (same folder) as the field glossary — it is generated from the
> database schema and lists every table and field with what it does.

---

You are a systems-diagram designer. Draw a complete visual map of the business
system described below: a stainless-steel and aluminium stockholder's ERP
(rebuild of the Dutch ERP "easy2trade" for Swedinox / HEGO). **Leave Finance
out** (ledger, journal entries, payments, credit control, revaluation, cost-price
controls). Where a flow hands over to Finance, draw a single grey box labelled
"→ Finance (out of scope)" and stop there.

## What to produce

Produce these views, each as its own diagram, using one consistent visual
language across all of them:

1. **Module tree:** the whole application as a tree. Root → the 8 menu groups
   (Section A) → every screen under each group. Colour by kind: document
   screens (you create and edit records), overviews (read-only lists), and
   work panels (where the floor reports work).
2. **End-to-end flow map:** one large left-to-right graph joining all the
   flows in Section B. Every document is a node, every action that creates or
   changes one is an arrow labelled with the button name, and status changes
   are shown on the node. Mark where stock is created, moved, reserved or
   consumed with a distinct stock icon or colour.
3. **One detailed swim-lane diagram per flow** (B1–B12). Lanes are Sales,
   Purchasing, Warehouse, Production, Transport and External processor. Every
   numbered step is a box, with:
   - the button pressed;
   - the record created or changed;
   - the fields written in that step;
   - the status before and after;
   - the business rule that applies (shown as a small note).
4. **Status state machines:** one small state diagram per status enum in
   Section C, with the transition triggers labelled.
5. **Entity-relationship diagram:** the core entities in Section D and their
   links (one-to-many and optional links). Then a field glossary per entity,
   taken from `FIELDS.md`: each field with its type, allowed values and a
   one-line description of what it does. Group the fields by panel (identity,
   physical attributes, pricing, logistics, status).

**Style:**
- Clean and readable, with no overlapping lines.
- Use the screen and button names exactly as written here.
- Keep Dutch terms in brackets where given, because the users know the
  original screens by those names.
- Use colour to separate the lanes, and keep the same colour for the same
  entity in every diagram.

**Output format:**
- Mermaid code, one fenced block per diagram, so it can be rendered and
  edited.
- Also a single SVG or HTML version of view 2.
- When a diagram gets too large, split it by flow, never by dropping steps.

---

## Section A — The module tree (menu → screens)

**Documents (create and edit):**
- Company
- Complaint
- Contract
- Counter order
- Invoice
- Location
- Machine
- Order
- Product
- Product group
- Purchase invoice
- Purchase order
- Purchase quote
- Purchase request
- Purchase return order
- Quote
- Return order
- Visit report
- Warehouse section
- Warehouse subsection

**Work panels:**
- Warehouse workorders
- Production workorders
- Warehouse- and production workorders
- Transport workorders
- Deliveries
- Tasks

**Overviews**, by menu group:

- **Purchase:**
  - Order advice
  - Sold products not on the order recommendation
  - Purchase lines
  - Purchase quotes
  - Purchase results
  - Purchase invoice line
  - Purchase invoices
  - Net prices
  - StockOn advice
  - Purchase receivals
  - Purchase orders and quotes
- **Customers:**
  - Visit schedule
  - Change visit schedule
  - To visit/call
  - Customer overview
  - Customers and Prospects
  - Contact persons Customers and Prospects
  - Addresses
  - Remarks per company
  - Customer revenue per product group
  - Customer revenue per revenue group
  - Customer revenue per revenue group with split order types
  - Unblocked orders
  - Customer revenue
  - Contracts per Customer / Prospect
  - Customer revenue, sales and visits
- **Companies:**
  - Address distances
  - Visits made
  - Visit reports
  - Inactive companies
  - Texts
  - Communication settings
- **Suppliers:**
  - Supplier revenue per revenue group
  - Supplier revenue
  - Contracts per supplier
  - Suppliers
  - Contact persons suppliers
- **Logistics:**
  - Deviations in count lists
  - Products
  - Warehouse- and production workorders
  - Receipts
  - Warehouse workorders
  - Production workorders
  - Production batches
  - Transport workorders
  - Trip data
  - Reservations
  - Stock
  - Stock on location
  - Customer stock on location
  - Locations
  - Stock history
  - Stock mutations
  - Freight movement
  - Revenue per product
  - Freight flow (SFN)
  - Pick statistic
  - Machines
  - Blocked deliveries
  - Deliveries to be arranged without stock reservation
  - Sawing layouts
  - Warehouse capacity
  - Production capacity
  - Production capacity details
  - Capacity checks
  - Time registration
  - (Re)optimize
  - Nesting
  - Transport status adjustments
- **Sales:**
  - Orders and Quotes
  - Order lines
  - Order lines capacity overflow
  - Options
  - Order lines still to be called
  - Orders still to be called
  - Quote lines
  - Invoice lines
  - Deliveries
  - Charges
  - Contracts
  - Contract groups
  - Product prices
  - Option prices per product
  - Net prices
  - SFN statistics Product-Market combinations
  - Revenue w.r.t. Budget
  - Revenue budgets
  - Invoices
  - Return lines
- **Batch registration:**
  - Certificates received
  - Sending certificates
  - Deliveries from the missing batch
  - Batches
  - Certificates to be linked
- **Other:**
  - Complaints
  - Complaint lines
  - Balanced Scorecard
  - Transport by region
  - SigmaNest blocked orders
- **System info:**
  - Errors
  - Open work panels
  - Settings (branch details)

*(Finance group: drawn as one grey collapsed node.)*

---

## Section B — The flows, step by step

### B1 Master data (the backbone everything reads)

- **Product group tree (4 levels):** main group → group → subgroup → material
  group. Groups and products are separate tables, linked by "Material group".
- **Product:**
  - **Identity:** code, name, search code, quality.
  - **Dimensions and weights:** length / width / thickness, plus three weight
    bases (theoretical, trade, German); the product's unit (KG · ST · M1 · M2).
  - **Warehouse control:** tolerance per work-order type. A count and a
    production run must close exactly; an unloading or a pick may be 5 % out.
  - **Stock control:**
    - batch registration: register length and width, dispatch strategy;
    - count frequency.
  - **Stock policy:**
    - minimum and maximum stock method;
    - order-advice parameters: lead time, review period, order costs A1/A2,
      order series, minimum order quantity, capital and warehouse cost, B2
      stock-out %, handling, transport.
  - **Sales:**
    - "Always reserve stock";
    - minimum profit margins per line type (Stock / Cross Docking / Ex works);
    - replacement price.
- **Warehouse tree:** warehouse → section → subsection → location.
  - A location has a type: pick · bulk · production · scrap · load (`Laad`) ·
    inspection · put-away (`Ontvangst`) · sorting · processing (`Bewerkers`) ·
    collection (`Afhaal`) · call-off (`Afroep`).
  - **The location type decides whether stock there is sellable or blocked.**
- **Company:** one record with nine roles (customer, supplier, processor,
  transporter, …), contacts, addresses, texts, communication settings, credit
  settings (Finance).
  - Under the company sit panels for: contacts, quotes, orders,
    `Quote- and order lines`, contracts, purchase requests, quotes, orders,
    invoices and returns, communication.
- **Machines:** options per machine (decoiling, grinding, shear cut, laser,
  foils, sawing, …).
- **Prices:** product prices, option prices per product, net prices,
  contracts with net prices, contract groups.

### B2 Sales: quote → order → delivery → invoice

1. **New Quote.**
   - Header fields: customer, contact, seller, price date, validity, delivery
     terms and address, order type (Normal / Rush / Call-off), weight type
     (trade / weighed / theoretical).
   - **Lines are chosen in the Stock search dialog (`Voorraad`), never from a
     dropdown.** The dialog filters on code, quality and dimensions (±5 %), and
     shows products above and lots below.
   - Each line has a `Line type`:
     - **Stk:** from stock;
     - **CD:** cross-dock, bought for this sale;
     - **Stk+CD:** partly each;
     - **EXW:** ex works.
   - The pricing cascade gives gross → group discount → line discount → net
     price.
   - Each line shows its margin against the floor for its line type.
2. **Convert to Order.**
   - The quote reads `Converted`; the order is `Provisional`.
   - Lines bind lots: a **reservation** (definitive) per line, unless the
     product doesn't reserve.
   - The credit check runs here and may financially block the order
     (→ Finance).
3. **Make final.**
   - The order becomes `Released`.
   - A **picking work order** is raised (lot → `Laad`), and a **transport work
     order**.
4. **Send…** mails the order confirmation.
5. **Picking reported.**
   - The lot moves to `Laad`, keeping its reservation.
6. **Delivery.**
   - A delivery is the order line's own delivery status; there is no separate
     delivery document.
   - The goods leave on a trip, and stock is consumed (out movement).
7. **Invoice.**
   - Invoice lines are taken from the delivered order lines.
   - → Finance.
8. **Call-offs:** for a call-off order, partial releases ("still to be
   called") draw down the order over its call-off period.

### B3 Cross-dock (CD): sell first, buy for the sale

1. **A CD sales line is entered from the catalogue before any lot exists.**
   - The line holds no lot and no reservation.
   - It is costed at the replacement price until a purchase covers it.
2. **A purchase line is raised `For line` that sales line**, either directly
   or through Purchase request → Purchase quote → Purchase order.
   - The purchase line's type becomes `CD` (whatever the "Pick-up/Drop-off CD"
     tickbox says).
   - The sales line points at the purchase line and reads `CD`.
   - The sales line's cost becomes its share of the purchase price.
3. **Goods unloaded:**
   - the lot lands on **`Laad`** (the loading bay);
   - it is reserved straight to the sales line (e.g. 41 of 41);
   - the sales line's cost is restated to the lot's value on the weight
     unloaded.
4. Deliver and invoice as in B2.

### B4 Purchasing: advice → order → receipt

1. **Order advice.**
   - Per product, in purchase units: stock, reserved, incoming, average
     consumption, min/max and advice quantity.
2. **Purchase request.**
   - Internal "please buy", with lines that may name a `For line` (a sales
     line).
3. **Purchase quotes.**
   - One per supplier, raised from the request.
   - Supplier prices are entered on them; one quote is awarded and the others
     become `lost`.
   - *Or* the request is ordered directly with an agreed price.
4. **Purchase order:**
   - **Provisional → Make final → Released.**
   - **Send…** mails it to the supplier.
   - **Confirm:** the supplier's confirmation number, date, confirmed delivery
     date and document, copied onto the ticked lines.
   - **Pre-notify:** bill of lading, pre-notified date, pre-notification code
     and confirmation, copied onto the ticked, not-yet-arrived receptions.
5. **Reception (receival):** created per line, with planned quantity and
   kilos.
6. **Workorder** raises an **unloading work order** (to `Ontvangst`, or to
   `Laad` for a CD line).
7. **Release** the work order; stock labels print.
8. **Report completion (`Gereedmelden`).**
   - The report dialog splits the receipt into bundles, pre-allocated to sales
     lines.
   - **Every bundle needs a `Charge` (heat number) before OK is allowed.**
   - Reporting creates the **stock lots**: valued at the price paid, with a new
     internal charge and a six-digit bundle number.
   - A **batch** is registered for each lot.
   - The line goes to `Received` (or `Partially received`).
   - Reporting self-approves.
9. **Product Receipt Documents.**
   - Certificates and DoP are attached to the purchase order:
     - kind: DoP / Certificate / Other;
     - producer, certificate type, code, file;
     - order line and reception line.
   - They link to the batch on receipt.
10. **Purchase invoice:** → Finance.
11. **Purchase return:**
    - `Par. return` creates a return order and a complaint;
    - the lines are shown negative on Purchase lines as `Delivered`.

### B5 Warehouse work orders

- **Types:**
  - unloading (in);
  - picking (out or move);
  - move / relocate (move);
  - count (count);
  - scrap (out).
- **Statuses:** New → Released → (reported) → Approved.
- **Report completion** checks the product's tolerance per type and writes
  stock movements (in / out / adjust) with their reason codes.

### B6 Production (cutting and finishing)

1. A production work order is raised for an order line.
   - **Machine options:** saw, shear cut (`Knip`), laser, grinding / foil
     (`Slijpen/Foliën`), decoiling.
2. The work panel (`Logistiek`) is a tree: day → option (machine) → work order
   → line, with **Vrijgeven** (release) and **Gereedmelden…** (report).
   - The only statuses are **Released** and **Approved**.
3. Reporting:
   - consumes the input lot;
   - creates the output lots;
   - a remnant keeps the parent lot's identity: heat, supplier, purchase order.
   - **The kilo balance must close:** input = output + remnant + scrap.
4. A line whose fetch work order (`aanhaalopdracht`) is already reported can
   no longer be reported through the dialog.

### B7 External processing (sending metal to an outside processor)

1. A **purchase order of type `Processing`** to the processor.
   - Its metal lines are priced at **€ 0**.
   - It pays for **Options** (e.g. `Decoilen` € 110 per TN), priced on the
     weight **received**.
2. **Supplies panel.** Pick our lot in the stock search; it is held for the
   order.
3. **Workorder** raises a **picking** for the supply (e.g. `5G` → `Laad`).
   - Reporting it sends the lot out ("Sent to Processor").
   - The supply reads `Delivered`, with a bill of lading.
4. The processor returns the metal as the order's own lines: **processed coil
   + scrap line (`SC304`, in KG)**. The kilos close: 900 + 234 = 1 134 sent.
5. **Unloading.** The processed lots:
   - **keep the supplied lot's heat number and original mill purchase order;**
   - carry its value, shared by weight;
   - take a new internal charge.
6. **Ex works Processor order** (type `ex_works_processor`):
   - books metal into our stock **where it lies**, at the processor;
   - uses `Report completion…` with no unloading and bill of lading `INtern`;
   - the lot lands on `Bewerkers` (processor location, blocked);
   - it is raised `For line` a line of the processing order.

### B8 Stock lot lifecycle

- **A lot:**
  - **Identity:** internal charge (per receipt), bundle number (printed
    label), charge (heat number).
  - **Physical:** quantity, kilos (theoretical / weighed / gross / net),
    dimensions, location, quality, category (1st / 2nd choice), options.
  - **Commitments:** reserved / available.
- **Dialogs on a lot:**
  - **Correct…:** quantity and attributes, reason mandatory; has
    **Simulate**, which shows the rows it would write and rolls back.
  - **Split:** the weighed weight is stated.
  - **Relocate:** to another location, no ledger.
  - **Transfer:** to another article.
  - **Scrap.**
  - **Options:** added as rows.
  - **Batch registration.**
  - **Stock label.**
  - **Reservations:** release.
- **Stock mutations** log every movement: type, reason, quantity, kilos,
  value, work-order line, document.

### B9 Returns and complaints

- **Goods come back:**
  - a return order (with a reason) creates an unloading;
  - the lot enters stock;
  - **Invoice** on the return makes the credit. A € 0 return just closes, with
    no credit note.
- **Money only:**
  - a complaint carries Qty 0, the kilos and the amount;
  - **Credit** raises a credit note on the order's invoice, with no goods
    returned (→ Finance).
- **Complaint fields:**
  - type, report channel, category, product, qty, amount, weight;
  - cause and explanation;
  - status (new → in progress → on hold → done);
  - handling.

### B10 Transport

- A transport work order per delivery or trip.
- **Trip data** is a report per trip:
  - stops, orders, kg, colli;
  - kg per stop (rounded); orders and colli per stop (rounded down);
  - km / hours / cost (empty in practice).
- Deliveries to be arranged, blocked deliveries, transport by region,
  transport status adjustments.

### B11 Batches and certificates

- A batch is created at every receipt and carries the heat number and
  internal charge.
- Certificates (3.1 / 2.1) are attached on the purchase order's
  `Product Receipt Documents`.
  - The screens Certificates received, Certificates to be linked and Sending
    certificates follow them through to the customer.

### B12 CRM and planning

- **Visits:** visit schedule (per customer), visit reports, visits made,
  to visit / call.
- **Customer revenue screens:** period, previous year, trend, targets.
- **Capacity:** warehouse capacity, production capacity and details, capacity
  checks, nesting, (re)optimise. These are read-only planning views.

---

## Section C — Status enums to draw as state machines

| Enum | States |
|---|---|
| Quote / order status | Provisional → In progress → Released → (Delivered) → Invoiced; Converted (quote); Expired; Cancelled |
| Order line status | provisional · released · checked · in_progress · partially_delivered · completed · partially_invoiced · invoiced · partially_received · received · expired · cancelled |
| Order line Type (line type) | stock (Stk) · cross_dock (CD) · stock_and_cross_dock (Stk+CD) · ex_works (EXW) |
| Purchase order status | provisional · released · checked · in_progress · partially_received · received · delivered · invoiced · expired · cancelled |
| Purchase order type | materials · processing · customer_materials · ex_works_processor |
| Reception (receipt) status | new · released · workorders_created · partially_received · received · invoiced |
| Warehouse / production work order | new → released → approved (+ cancelled) |
| Supply (processing) | new → workorders_created → delivered |
| Complaint | new → in_progress → on_hold → done |
| Purchase request | draft → sent → quoted → awarded / cancelled |
| Purchase quote | open → received → awarded / lost / expired |
| Reservation | type sale / purchase / scrap; status provisional / definitive |
| Stock lot | pending (on the shelf) · received (fully used) · cancelled |

---

## Section D — Core entities and links (for the ERD)

- **Company:**
  - 1–n Contacts, Addresses;
  - 1–n Quotes, Orders, Purchase requests, Purchase quotes, Purchase orders,
    Purchase returns, Complaints, Contracts.
- **Quote:** 1–n Quote lines. A quote line converts to an order.
- **Order:**
  - 1–n Order lines;
  - 1–n Call-offs, Surcharges.
  - An order line has 0–1 Stock lot (null while a CD line waits) and 0–1
    Purchase line (the line covering it, CD).
  - An order line has 0–n Reservations.
  - An order line has 0–n Warehouse / Production / Transport work-order lines.
  - An order line has 0–n Invoice lines.
- **Purchase request:** 1–n lines, each with an optional `For line` (order
  line). It becomes Purchase quotes (one per supplier), which become a
  Purchase order.
- **Purchase order:**
  - 1–n lines;
  - each line has 1–n Receptions, 0–n Options, and an optional `For line`
    (another purchase line);
  - 0–n Supplies (Processing orders), each with 1 Stock lot;
  - 0–n Product Receipt Documents.
- **Reception:** 0–1 unloading work-order line. Reporting it creates Stock lots
  and Batches.
- **Stock lot:**
  - belongs to 1 Product, 1 Location, 1 origin purchase line;
  - has 0–n Reservations, Stock movements, Stock options;
  - has 1 Batch.
- **Warehouse work order:** 1–n lines, with 0–n picks per line.
  - A line points at an order line **or** a purchase line **or** a return line
    **or** a supply.
- **Production work order:** input lot → output lots and remnants (lineage
  kept).
- **Return order:** 1–n lines (each with an original order line), an unloading,
  and a credit.
- **Complaint:** linked to an order / invoice / return; holds lines and
  documents.
- **Product:** belongs to a Product group (4-level tree). Lots belong to
  locations in the Warehouse tree (4 levels).

Use `FIELDS.md` for the full field list of every entity: 113 tables and
2 512 fields, each with its type, its allowed values and what it does.
