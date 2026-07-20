 Swedinox Dashboard — Pages & Fields Guide

A plain-language reference for every page in the dashboard: what the page is,
where its data comes from, and what each column/field means.

 How to read this guide

- What it is — a one-line description of the page in everyday words.
- How data gets here — where the records on the page are born. Two common cases:
  - _"Created on the New … page"_ — someone fills in a form to make the record.
  - _"Read-only report"_ — nothing is created here; the page just shows/adds up data that already exists elsewhere.
- Comes from (under each field) — the origin of that specific value:
  - _"typed on the New … page"_ — a person entered it.
  - _"the linked company / product / order"_ — pulled from a related record.
  - _"calculated by the system"_ — worked out automatically (a sum, a count, a difference).
  - _"set automatically by the system"_ — filled in for you (e.g. a code or a date).

The pages are grouped exactly like the sidebar: Customers, Company, Sales,
Supplier, Purchases, Warehouse, Locations, Logistics, Others.

---

 1. Customers

 Quotes — `/quotes`
What it is: A list of all price quotes sent to customers, with a link to open each one.
How data gets here: Each quote is created on the New Quote page (the "New Quote" button); this list only displays them.
Columns / fields:
-  — The quote's own number. Comes from: assigned automatically by the system when the quote is created.
- Customer — The company the quote is for. Comes from: the linked company chosen on the New Quote page.
- Contact — The person at that company (first + last name). Comes from: the linked contact person chosen on the New Quote page.
- Request — How the customer asked for the quote (e.g. phone, email). Comes from: the request method selected on the New Quote page.
- Valid Until — The date the quote expires. Comes from: typed on the New Quote page.
- Created — The date the quote was entered. Comes from: set automatically by the system.

 Orders — `/orders`
What it is: A list of all customer orders, with a link to open each order's detail page.
How data gets here: Each order is created on the New Order page; that page also reserves stock and can attach surcharges, notes, and contracts.
Columns / fields:
-  — The order's own number. Comes from: assigned automatically by the system when the order is created.
- Company — The customer the order is for. Comes from: the linked company chosen on the New Order page.
- Contact — The person at that company (first + last name). Comes from: the linked contact person chosen on the New Order page.
- Method — How the order was placed (e.g. phone, email). Comes from: the order method selected on the New Order page.
- Delivery Date — The requested delivery date, or a delivery week/year if no exact date. Comes from: typed on the New Order page.
- Created — The date the order was entered. Comes from: set automatically by the system.

 Return Orders — `/return-orders`
What it is: A list of customer return orders (goods being sent back), with a link to open each one.
How data gets here: Each return order is created on the New Return Order page; that page can also attach surcharges and notes.
Columns / fields:
-  — The return order's own number. Comes from: assigned automatically by the system when it is created.
- Customer — The company returning the goods. Comes from: the linked company chosen on the New Return Order page.
- Contact — The person at that company (first + last name). Comes from: the linked contact person chosen on the New Return Order page.
- Return Reason — Why the goods are being returned. Comes from: the reason selected on the New Return Order page.
- Return Date — The date of the return. Comes from: typed on the New Return Order page.
- Created — The date the return order was entered. Comes from: set automatically by the system.

 Return Lines — `/return-lines`
What it is: A read-only report listing every individual product line across all return orders, with pricing and profit.
How data gets here: Read-only report — nothing is created here. Each line comes from a product line entered on a return order; customer and product details are pulled from the linked return order, company, and product records.
Columns / fields:
- Return — The number of the return order this line belongs to. Comes from: the linked return order.
- Line — The line's position number within that return order. Comes from: entered when the return line was added.
- Reference — A free-text reference for the line. Comes from: entered on the return line.
- Customer — The company that made the return. Comes from: the linked company on the return order.
- Product code — The product's short code. Comes from: the linked product record.
- Description — The product's name. Comes from: the linked product record.
- Line status — The stage this line is at. Comes from: set on the return line.
- Quantity — How many units the line covers. Comes from: entered on the return line.
- QtyU — The unit of measure (e.g. pieces, kg). Comes from: set on the return line.
- Return Qty — How many units are actually being returned. Comes from: entered on the return line.
- Return reason — Why this line is returned. Comes from: set on the return line.
- Net price — The price per unit. Comes from: entered on the return line.
- Cost price — The cost per unit. Comes from: entered on the return line.
- Amount — The total value of the line. Comes from: entered on the return line.
- Profit — Amount minus cost (cost per unit times quantity). Comes from: calculated by the system.
- Profit margin — Profit as a percentage of the amount. Comes from: calculated by the system.
- Delivery date — The delivery date recorded on the line. Comes from: entered on the return line.

 Counter Orders — `/counter-orders`
What it is: A list of orders taken in person at the counter, with a column picker to show/hide fields.
How data gets here: Each counter order is created on the New Counter Order page; that page can also attach surcharges, notes, and contracts.
Columns / fields:
- Order no — The counter order's own number. Comes from: assigned automatically by the system.
- Customer — The company the order is for. Comes from: the linked company chosen on the New Counter Order page.
- Blocked — Whether handling of this order is on hold (Yes/No). Comes from: set on the counter order.
- Status — The order's current stage. Comes from: set on the counter order.
- Priority — How urgent the order is (hidden by default). Comes from: set on the counter order.
- Order date — The date the order was taken. Comes from: typed on the New Counter Order page.
- Delivery date — The requested delivery date. Comes from: typed on the New Counter Order page.
- Amount (ex VAT) — Order value excluding VAT. Comes from: entered on the New Counter Order page.
- Weight (kg) — Total weight of the order. Comes from: entered on the New Counter Order page.
- Customer reference — The customer's own reference for the order. Comes from: typed on the New Counter Order page.
- Gain% — The profit percentage. Comes from: entered/calculated on the counter order.
- Days in system — How many days since the order was created. Comes from: calculated by the system from the created date.
- Created At — The date the order was entered (hidden by default). Comes from: set automatically by the system.

 Customer Overview — `/customer-overview`
What it is: A read-only summary with one row per customer, combining their contact details with counts of quotes, orders, invoices, visits, returns, and complaints.
How data gets here: Read-only report — nothing is created here. Company details come from the company record, address details from the company's first address, contact details from the company's first contact, and the counts/totals are tallied by the system from Quotes, Orders, Invoices, Visit Reports, Return Orders, and Complaints. Only companies with the "customer" role appear.
Columns / fields:
- Customer code — The company's ID number. Comes from: the company record.
- Customer — The company name (links to the company page). Comes from: the company record.
- Search code 1 / 2 / 3 — Short lookup codes for the company. Comes from: the company record.
- Street + No. — Street address. Comes from: the company's first address record.
- City — City of that address. Comes from: the company's first address record.
- Postal code — Postcode of that address. Comes from: the company's first address record.
- Initials — Initials of the main contact. Comes from: the company's first contact record.
- Representative — The sales rep for the company. Comes from: the company record.
- Account manager — The account manager for the company. Comes from: the company record.
- Region code — Region code of the main contact. Comes from: the company's first contact record.
- Region — The company's region. Comes from: the company record.
- Customer group — Which customer group the company belongs to. Comes from: the company record.
- VAT number — The company's VAT number. Comes from: the company record.
- Email to — Best available email (action email, release email, address email, or contact email). Comes from: the company record and its address/contact records.
- Quotes — Number of quotes for this customer. Comes from: counted by the system.
- Orders — Number of orders for this customer. Comes from: counted by the system.
- Invoices — Number of invoices for this customer. Comes from: counted by the system.
- Visit — Number of visit reports for this customer. Comes from: counted by the system.
- Return orders — Number of return orders for this customer. Comes from: counted by the system.
- Complaints — Number of complaints for this customer. Comes from: counted by the system.
- Last order date — Date of the most recent order. Comes from: calculated by the system from the orders.
- Invoiced orders revenue — Total invoiced amount (incl. VAT) for the customer. Comes from: summed by the system from the invoices.
- Avg. order size — Invoiced revenue divided by the number of invoices. Comes from: calculated by the system.

 Remarks per Company — `/remarks-per-company`
What it is: A read-only report listing only the companies that have a free-text remark saved on their record.
How data gets here: Read-only report — nothing is created here. It shows the remark from the company record, plus the city from the company's first contact.
Columns / fields:
- Customer no. — The company's ID number. Comes from: the company record.
- Customer — The company name. Comes from: the company record.
- City — City of the company's main contact. Comes from: the company's first contact record.
- Representative — The sales rep for the company. Comes from: the company record.
- Remarks — The free-text note saved on the company. Comes from: typed on the company's record.

 Addresses — `/addresses`
What it is: A list of all address records with a column picker, each linked to its company, including delivery/logistics details.
How data gets here: Addresses are created and edited as part of a company's record (company addresses); this page lists them all with their linked company.
Columns / fields:
- Code — The address's ID number. Comes from: assigned automatically by the system.
- Company Code — The linked company's ID. Comes from: the linked company record.
- Company Name — The linked company's name. Comes from: the linked company record.
- Alt Name — Alternative name for the address. Comes from: entered on the address.
- Street & No. — Street and number. Comes from: entered on the address.
- Postal Code — Postcode. Comes from: entered on the address.
- City — City. Comes from: entered on the address.
- Region — Region. Comes from: entered on the address.
- Country — Country. Comes from: entered on the address.
- House — House indicator/detail (hidden by default). Comes from: entered on the address.
- PO Box — Whether it is a PO box (Yes/No, hidden by default). Comes from: set on the address.
- GLN — Global location number. Comes from: entered on the address.
- Peppol ID — Peppol e-invoicing ID. Comes from: entered on the address.
- Telephone / Fax / Email / Website — Contact details for the address (hidden by default). Comes from: entered on the address.
- Billing Attention / Billing Attention 2 — Names for the attention line on invoices (hidden by default). Comes from: entered on the address.
- Sequence No. — Ordering number for the address (hidden by default). Comes from: set on the address.
- Category — Address type tags (e.g. delivery, invoice). Comes from: selected on the address.
- Address Complete — Whether the address is marked complete (Yes/No). Comes from: set on the address.
- Need Crane / Canopy Required / Bundle Separately / Special Transport — Delivery-site requirements (hidden by default). Comes from: set on the address.
- Available At — When the site is available for delivery (hidden by default). Comes from: set on the address.
- Unloading Start / Unloading End — Unloading time window (hidden by default). Comes from: entered on the address.
- Max Length (mm) / Max Bundle Weight (kg) — Delivery size limits (hidden by default). Comes from: entered on the address.
- Loading Instructions — Free-text delivery instructions (hidden by default). Comes from: typed on the address.
- Created At / Updated At — When the address was added/last changed (hidden by default). Comes from: set automatically by the system.

 Customer/Prospect Contracts — `/contracts-per-customer`
What it is: A read-only overview of contracts belonging to companies that are customers or prospects, with a column picker.
How data gets here: Read-only report — nothing is created here. Contracts come from the contract records; company and city come from the linked company and its address; contract group comes from the linked contract group. Several columns are placeholders that are not yet filled in (they show "N/A" or 0).
Columns / fields:
- Role — Whether the linked company is a customer or prospect. Comes from: the contract record.
- Customer Code — The company's ID number. Comes from: the linked company record.
- Customer — The company name. Comes from: the linked company record.
- City — City of the company. Comes from: the linked company's address record.
- Representative — Placeholder, not yet populated (shows N/A). Comes from: not currently sourced.
- Customer Group — Placeholder, not yet populated (shows N/A). Comes from: not currently sourced.
- Contract Code — The contract's code. Comes from: the contract record.
- Description — The contract description. Comes from: the contract record.
- Contract Group — The group the contract belongs to. Comes from: the linked contract group.
- Price Date — The contract's price date. Comes from: the contract record.
- Starting Date / End Date — Placeholders, not yet populated (show N/A). Comes from: not currently sourced.
- Preference / Sales (kg) / Revenue — Placeholders, always show 0 (Revenue hidden by default). Comes from: not currently sourced.
- Most Recent Invoice Date / Region Code / Region — Placeholders, not yet populated (hidden by default). Comes from: not currently sourced.

 Customer/Prospect Contact — `/contact-persons-customers-and-prospects`
What it is: A read-only overview of every contact person who belongs to a customer or prospect company, with a wide column picker mixing contact and company details.
How data gets here: Read-only report — nothing is created here. Contact details come from each contact person's record; the company name/code and role flags come from the linked company. Contact people are created/edited on the company's record.
Columns / fields:
- Company Code / Company — The linked company's ID and name. Comes from: the linked company record.
- Customer / Prospect / Supplier / Processor / Transporter / Agent / Other — Checkmarks showing the contact's own role flags. Comes from: set on the contact record.
- Visiting Address / Visit-Postal Code / Visit-City / Visit-Country / Visit-Telephone / Visit-Fax — The contact's visiting address and phone/fax. Comes from: entered on the contact record.
- Revenue Last Year / Revenue This Year — Revenue figures held on the contact. Comes from: entered on the contact record.
- Contact Person — Title, first and last name combined. Comes from: entered on the contact record.
- Contact Person Category — Category tags for the contact. Comes from: selected on the contact record.
- Contact Person E-mail / Telephone — The contact's email and phone. Comes from: entered on the contact record.
- Correspondence Address / Postal Code / City / Country / Telephone / Fax — The contact's mailing address and phone/fax. Comes from: entered on the contact record.
- Account Manager / Representative / Customer Group — Sales assignments on the contact. Comes from: set on the contact record.
- Industry Code / Industry — Industry code and name (code hidden by default). Comes from: set on the contact record.
- Classification Code / Classification — Classification code and name (code hidden by default). Comes from: set on the contact record.
- Credit Limit — The contact's credit limit. Comes from: entered on the contact record.
- Competitors — Competitor notes. Comes from: entered on the contact record.
- Region Code / Region — Region code and region (code hidden by default). Comes from: set on the contact record.
- Target Year Revenue / Target Annual Sales — Revenue and sales targets. Comes from: entered on the contact record.
- Searchcode 1 / 2 / 3 — Short lookup codes. Comes from: entered on the contact record.
- Title / Initials / First Name / Last Name — The contact's name parts. Comes from: entered on the contact record.
- Mobile — Mobile number (hidden by default). Comes from: entered on the contact record.

 Customers and Prospects — `/customers-and-prospects`
What it is: A read-only overview of every company marked as a customer or prospect, combining company info with its main contact and delivery address, with a column picker.
How data gets here: Read-only report — nothing is created here. Company fields come from the company record, contact fields from the company's first contact, delivery address from the company's first address tagged "delivery," and the role checkmarks from the company's roles.
Columns / fields:
- Searchcode 1 / 2 / 3 — Short lookup codes. Comes from: the company record.
- Company — Company name (links to the company page). Comes from: the company record.
- Visit-City / Visit-Postcode / Visit-Telephone / Visit-Fax — The main contact's visiting address details (phone/fax hidden by default). Comes from: the company's first contact record.
- Customer / Prospect / Supplier / Processor / Transporter / Agent / Other — Checkmarks for the company's roles. Comes from: the company record's roles.
- Representative — Sales rep. Comes from: the company record.
- Target visits / year — Placeholder, always shows 0. Comes from: not currently sourced.
- Customer group — Customer group. Comes from: the company record.
- C. of C. no. — Chamber of Commerce number. Comes from: the company record.
- Credit limit — The company's credit limit. Comes from: the company record.
- Revenue last year / Revenue this year — Revenue figures. Comes from: the company's first contact record.
- Competitors — Competitor notes. Comes from: the company's first contact record.
- Correspondence Address / Postal code / City / Country / Phone. No. / Fax No. — The main contact's mailing address. Comes from: the company's first contact record.
- Delivery address / Postal code / City / Country — The company's delivery address. Comes from: the company's first "delivery" address record.
- Contact person — First and last name of the main contact. Comes from: the company's first contact record.
- Contact e-mail / Contact mobile no. — The main contact's email and mobile. Comes from: the company's first contact record.
- Region code — Region code. Comes from: the company's first contact record.
- Region — The company's region. Comes from: the company record.
- Account manager — Account manager. Comes from: the company record.
- Complete delivery — Whether the company requires complete deliveries (checkmark). Comes from: the company record's order settings.
- Company code — The company's ID number. Comes from: the company record.
- Customer since — Date the company was created. Comes from: set automatically by the system.
- Created on — Date the main contact was created. Comes from: set automatically by the system.

 Visit Schedule — `/visit-schedule`
What it is: A read-only overview of call and visit history for every customer and prospect, with a column picker.
How data gets here: Read-only report — nothing is created here. Company fields come from the company record, contact fields from the company's first contact, and the last call/visit dates are calculated from completed Visit Reports. Some "upcoming" and "due" columns are placeholders that are not yet calculated.
Columns / fields:
- Company Code / Company — ID and name (name links to the company page). Comes from: the company record.
- Visiting Address Street / Postal Code / City / Country / Telephone — The main contact's visiting address. Comes from: the company's first contact record.
- Account Manager / Representative — Sales assignments. Comes from: the company record.
- Target Year Revenue / Revenue Last Year / Revenue This Year — Revenue targets and figures. Comes from: the company's first contact record.
- Customer Group — Customer group. Comes from: the company record.
- Last Call Date — Date of the most recent completed phone contact. Comes from: calculated by the system from visit reports (phone contacts).
- Call Upcoming — Placeholder, not yet calculated (shows N/A). Comes from: not currently sourced.
- Last Visit Date — Date of the most recent completed in-person visit. Comes from: calculated by the system from visit reports (visits).
- Visit Upcoming — Placeholder, not yet calculated (shows N/A). Comes from: not currently sourced.
- Contact Person / Contact E-mail / Contact Mobile No. — The main contact's name and details. Comes from: the company's first contact record.
- Region Code — Region code (hidden by default). Comes from: the company's first contact record.
- Region — The company's region. Comes from: the company record.
- Call / Visit — Checkmarks for whether a call/visit is due; placeholders, always empty. Comes from: not currently sourced.

 Change Visit Schedule — `/change-visit-schedule`
What it is: A working list of every customer and prospect showing when they were last called or visited, so staff can plan the next contact.
How data gets here: The customer/prospect list comes from the company records; the last-call and last-visit dates come from completed visit reports logged against each company. (Despite the title, the data shown is read-only — this and the "To Visit / Call" page display the same list.)
Columns / fields:
- Company Code / Company — The company's number and name (name links to the company page). Comes from: the company record.
- Visiting Address Street / Postal Code / City / Country / Telephone — The visiting address. Comes from: the company's main contact.
- Account Manager / Representative — Sales assignments. Comes from: the company record.
- Target Year Revenue / Revenue Last Year / Revenue This Year — Sales target and revenue figures. Comes from: the company's main contact.
- Customer Group — The group the customer belongs to. Comes from: the company record.
- Last Call Date — Date of the most recent completed phone contact. Comes from: the newest telephone-type visit report marked as having taken place.
- Last Visit Date — Date of the most recent completed in-person visit. Comes from: the newest visit-type visit report marked as having taken place.
- Call Upcoming / Visit Upcoming — Planned next call/visit date. Comes from: nothing yet — always blank, no next target is stored.
- Contact Person / Contact E-mail / Contact Mobile No. — The main contact's name and details. Comes from: the company's main contact.
- Region Code — The customer's region code (hidden by default). Comes from: the company's main contact.
- Region — The company's region. Comes from: the company record.
- Call / Visit — Checkmarks flagging a call/visit is due. Comes from: nothing yet — always blank, no due-date rule is stored.

 To Visit / Call — `/to-visit-call`
What it is: A list of all customers and prospects with their latest call and visit status, used to see who still needs contacting.
How data gets here: Read-only view — it shows the same information as the "Change Visit Schedule" page, drawn from company records, their main contacts, and completed visit reports. Nothing is created here.
Columns / fields: _(Identical to "Change Visit Schedule" above — same columns and same sources.)_

 Customer Revenue — `/customer-revenue`
What it is: A sales summary showing how much turnover, weight, and profit each customer generated per invoice month and year.
How data gets here: Read-only report — nothing is created here; it adds up the invoiced order lines from customer invoices, and can be narrowed by year and month using the period filter at the top.
Columns / fields:
- Customer — the customer name. Comes from: the company record on the invoice.
- Debtor number — the customer's internal account number. Comes from: the company record.
- City / Country — the customer's city and country. Comes from: the company's main contact.
- Month / Year — the invoice period. Comes from: the date on the invoice.
- Revenue — total invoiced sales amount. Comes from: calculated — sums the amounts of the invoiced order lines.
- Weight (kg) — total planned kilograms sold. Comes from: calculated — sums the planned kg of the order lines.
- Profit — revenue minus the stock cost of what was sold. Comes from: calculated.
- Profit margin — profit as a percentage of revenue. Comes from: calculated.

 Customer Revenue per Revenue Group — `/customer-revenue-per-revenue-group`
What it is: The customer sales summary broken down further by revenue group (a product-classification bucket) per month and year.
How data gets here: Read-only report — nothing is created here; it adds up invoiced order lines grouped by customer and revenue group, filterable by year and month.
Columns / fields:
- Debtor number / Customer — the customer's account number and name. Comes from: the company record on the invoice.
- City — the customer's city. Comes from: the company's main contact.
- Revenue group / Revenue group name — the revenue group's number and name. Comes from: the revenue group linked to the product sold.
- Year / Month — the invoice period. Comes from: the date on the invoice.
- Weight (kg) — total planned kilograms sold. Comes from: calculated — sums the planned kg.
- Revenue — total invoiced sales amount. Comes from: calculated — sums the order-line amounts.

 Customer Revenue per Product Group — `/customer-revenue-per-product-group`
What it is: The customer sales summary broken down by product group, with profit figures and invoice-line counts per month and year.
How data gets here: Read-only report — nothing is created here; it adds up invoiced order lines grouped by customer and product group, filterable by year and month.
Columns / fields:
- Representative / Customer group — sales rep and group (friendly labels). Comes from: the company record.
- Debtor number / Customer — account number and name. Comes from: the company record on the invoice.
- City — the customer's city. Comes from: the company's main contact.
- Product group — the product group's name. Comes from: the product group linked to the product sold.
- Year / Month — the invoice period. Comes from: the date on the invoice.
- Weight (kg) / Revenue / Profit / Profit margin — totals for the group. Comes from: calculated from the invoiced order lines (profit = revenue minus stock cost).
- Invoice lines — how many invoice lines are behind this row. Comes from: calculated — a count.
- Region — the company's region. Comes from: the company record.

 Customer Revenue per Group (Split) — `/customer-revenue-per-revenue-group-split`
What it is: The most detailed sales breakdown — by customer, revenue group, and order type (normal, consignment, pickup, etc.) per month and year, with profit figures.
How data gets here: Read-only report — nothing is created here; it adds up invoiced order lines grouped by customer, revenue group, and order type, filterable by year and month.
Columns / fields:
- Representative / Customer group — sales rep and group (friendly labels). Comes from: the company record.
- Debtor number / Customer — account number and name. Comes from: the company record on the invoice.
- City / Country — the customer's city and country. Comes from: the company's main contact.
- Revenue group / Revenue group name — number and name. Comes from: the revenue group linked to the product sold.
- Order type — the kind of order (Normal, Consignment, Incidental, Internal production, Customer material, Pickup). Comes from: calculated from the order's on/off flags.
- Year / Month — the invoice period. Comes from: the date on the invoice.
- Revenue / Profit / Profit margin / Weight (kg) — totals for the row. Comes from: calculated from the invoiced order lines.
- Account manager — the account manager. Comes from: the company record.
- Region — the company's region. Comes from: the company record.
- Invoice lines — count of invoice lines behind the row. Comes from: calculated.

 Customer Revenue, Sales & Visits — `/customer-revenue-sales-and-visits`
What it is: A three-year side-by-side comparison of each customer's sales and weight per revenue group, alongside their visit address.
How data gets here: Read-only report — nothing is created here; it adds up invoiced order lines grouped by customer and revenue group, splitting the totals across this year, last year, and two years ago (based on today's date).
Columns / fields:
- Representative — the sales rep (friendly label). Comes from: the company record.
- Company code / Company — number and name. Comes from: the company record on the invoice.
- Visit-Postal / Visit-City — the visiting address. Comes from: the company's main contact.
- Revenue group / Revenue group name — number and name. Comes from: the revenue group linked to the product sold.
- Current year — the year treated as "this year". Comes from: today's date.
- Revenue current year / last year / 2 years ago — invoiced sales per year. Comes from: calculated from the order lines behind the invoices.
- Kg current year / last year / 2 years ago — planned kilograms sold per year. Comes from: calculated from the order lines.

 Unblocked Orders — `/unblocked-orders`
What it is: A log of orders whose hold/block was released, showing who released it, when, and the order value.
How data gets here: Read-only report — nothing is created here; it reads the block-release history recorded whenever someone releases an order's block, and pulls in the related customer and order details. Filterable by year and month.
Columns / fields:
- Customer name — the customer on the order. Comes from: the company linked to the order.
- City — the customer's city. Comes from: the company's main contact.
- Debtor number — the customer's account number. Comes from: the company record.
- Deblock type — the kind of block that was released (friendly label). Comes from: the block-release record.
- Year / Month / Deblock date / Deblock time — when the block was released. Comes from: the block-release record.
- Deblocked by — the staff member who released the block. Comes from: the block-release record.
- Order — the order's reference (or number). Comes from: the order record.
- Creation date of Order — when the order was created. Comes from: the order record.
- Order amount — the order's total value. Comes from: calculated — sums the order's line amounts.
- Region code — the customer's region code. Comes from: the company's main contact.
- Region — the company's region. Comes from: the company record.

 Follow-ups — `/follow-ups`
What it is: A combined log of all customer follow-up notes across every company, so staff can see outstanding and completed follow-ups in one place.
How data gets here: Follow-up entries are created per company on that company's detail page (the follow-ups section); this page just gathers them all together, newest first.
Columns / fields:
- Company — the company the follow-up belongs to (links to the company page). Comes from: the company linked to the follow-up.
- Date — the follow-up date. Comes from: the follow-up entry (auto-filled when created).
- By — who logged the follow-up. Comes from: the follow-up entry (auto-filled when created).
- Contact person — the person contacted. Comes from: free text typed when the follow-up is created.
- Text — the follow-up note itself. Comes from: free text typed when the follow-up is created.
- Completed — whether the follow-up is done (Yes/No). Comes from: the follow-up entry's completed flag.
- Days in system — whole days since the follow-up was logged. Comes from: calculated from its creation date.

---

 2. Company

> A company's Code is a number the system assigns automatically; the Company Name
> is typed on the New Company page. That New Company form is the origin point that feeds
> many other pages (addresses, contacts, communication settings, texts, and more).

 Companies — `/companies`
What it is: The master list of every company (customers, suppliers, prospects, transporters, etc.) in the system.
How data gets here: Each company is created on the New Company page (the big "Create Company" form), which is also where its addresses, contacts, and many related records are first added.
Columns / fields:
- Code — A number that identifies the company. Comes from: automatically assigned by the system when the company is created (not typed by anyone).
- Company Name — The company's name. Comes from: typed in the "Company Name" box on the New Company page.
- Documents — Files attached to the company. Comes from: uploaded in the Documents section on the New Company page (or on the company's detail page later).
- Created At — The date the company record was first made (hidden by default). Comes from: set automatically when the company is created.
- Updated At — The date the company record was last changed (hidden by default). Comes from: set automatically whenever the company is edited.

 Communication Settings — `/communication-settings`
What it is: A list of the delivery preferences that say how each company should receive a given document (for example, an invoice sent by email or fax).
How data gets here: Added while creating a company — using the "Add Communication Setting" button in the Company Details section of the New Company page. This page is read-only.
Columns / fields:
- Code — A number identifying the setting. Comes from: assigned automatically by the system.
- Company — The company this preference belongs to. Comes from: the company it was added under on the New Company page.
- Document Type — Which kind of document this rule is for (e.g. order, invoice). Comes from: chosen in the Add Communication Setting box.
- Communication Type — How the document should be sent (e.g. email, fax). Comes from: chosen in the Add Communication Setting box.
- Shape — The file format/layout of the document. Comes from: chosen in the Add Communication Setting box.
- Email — The email address to send to. Comes from: typed in the Add Communication Setting box.
- Fax — The fax number to send to (hidden by default). Comes from: typed in the Add Communication Setting box.
- Created At / Updated At — When the setting was created/last changed (hidden by default). Comes from: set automatically.

 Address Distances — `/address-distances`
What it is: A reference list of driving distances (in kilometres) from your business to company delivery addresses, used for transport planning.
How data gets here: Read-only. There is no add form for this page inside the app; each row is tied to a company and its address, and the distance is filled in behind the scenes.
Columns / fields:
- Company — The company the distance relates to. Comes from: the linked company.
- Country / City / Street / Postal Code — The destination address. Comes from: the address record stored for the distance.
- Km — The distance in kilometres. Comes from: the stored distance value for that address.
- Created At — When the row was created (hidden by default). Comes from: set automatically.

 Visit Reports — `/visit-reports`
What it is: A log of sales visits and phone contacts made with companies.
How data gets here: Created on the New Visit Report page (its own "Create Visit Report" form). Visit reports can also be added while creating a company, through the Visit Reports section on the New Company page.
Columns / fields:
- ID — A number identifying the visit report. Comes from: assigned automatically by the system.
- Company — The company that was visited. Comes from: chosen from the company dropdown on the form.
- Visited By — The staff member who made the visit/call. Comes from: chosen from the "Visited By" dropdown.
- Contact Method — Whether it was a visit or a phone contact. Comes from: chosen on the form.
- Visit Date — The date of the visit/call. Comes from: picked on the form.
- Happened — Whether the visit/call actually took place (Yes/No). Comes from: the "has taken place" checkbox.
- Visit Reason — Why the visit was made. Comes from: chosen on the form.
- Representative / Visit Time / Contact / City / Postal Code / Telephone / Fax / Address / Attention Point / Remarks — Extra visit details (hidden by default). Comes from: typed/chosen on the form.
- Created At — When the report was created (hidden by default). Comes from: set automatically.

 Text Categories — `/text-categories`
What it is: A list of the groups (and sub-groups) used to organise the standard text blocks found on the Texts page.
How data gets here: Created on the New Text Category page (its own "Create Text Category" form).
Columns / fields:
- ID — A number identifying the category. Comes from: assigned automatically by the system.
- Name — The category's name. Comes from: typed on the form.
- Parent Category — The category this one sits under, if any. Comes from: chosen on the form (shows "None" if empty).
- Sequence Number — A number controlling the display order. Comes from: typed on the form.
- Active — Whether the category is in use (Yes/No). Comes from: the "Active" checkbox.
- Created At / Updated At — When created/last changed (hidden by default). Comes from: set automatically.

 Texts — `/texts`
What it is: A list of reusable text blocks tied to companies, which get printed on documents (quotes, orders, invoices, and so on).
How data gets here: Added while creating a company — through the Texts section ("Add Text" box) on the New Company page. This page shows them for reference.
Columns / fields:
- Company code — The identifying number of the company the text belongs to. Comes from: the linked company.
- Company name — The company's name. Comes from: the linked company.
- City — The company's city. Comes from: the address added to that company.
- Customer / Supplier / Processor — Whether the company has that role (checkbox). Comes from: the roles chosen for the company.
- Text group — Which text category this block belongs to. Comes from: chosen in the Add Text box (links to Text Categories).
- Text — The actual text content. Comes from: typed in the Add Text box.
- Categories / usage columns (Visit Report, Purchase Order, Sales Quote, Sales Order, Sales Invoice, Warehouse Order, Loadlist, Waybill, etc.) — Yes/No for whether this text is printed on that document type. Comes from: the usage options ticked in the Add Text box.
- Modified / Created — When the text was last changed/created. Comes from: set automatically.

 Inactive Companies — `/inactive-companies`
What it is: A report listing customers and prospects that have not placed an order in the last 12 months (or never), so they can be re-engaged or archived.
How data gets here: Read-only report — nothing is created here; it combines company records with their order history.
Columns / fields:
- Company code — The company's number. Comes from: assigned by the system when the company was created.
- Company — The company's name (links to its detail page). Comes from: typed on the New Company page.
- City — The company's city. Comes from: the first contact added to that company.
- Representative / Customer group / Region — Sales settings. Comes from: chosen in the Sales settings on the New Company page.
- Last order date — The company's most recent order date, or "Never". Comes from: calculated from that company's orders.

---

 3. Sales

 Contracts — `/contracts`
What it is: A list of standalone contract records used for pricing and terms with customers, prospects and suppliers.
How data gets here: Created with the "New Contract" button (the Add Contract page). A contract can be linked to one or more companies, or saved on its own.
Columns / fields:
- Code — The contract's internal number. Comes from: assigned automatically by the system.
- Contract Type — What kind of contract it is. Comes from: chosen on the New Contract page.
- Contract Group — The group this contract belongs to. Comes from: picked on the New Contract page from the Contract Groups list.
- Description — A short description. Comes from: typed on the New Contract page.
- Search Code 1 / 2 / 3 — Extra searchable codes/labels. Comes from: typed on the New Contract page.
- Website Sort — A number controlling website order. Comes from: typed on the New Contract page.
- Hide on Website — Whether it's hidden from the website (Yes/No). Comes from: set on the New Contract page.
- Created At — When the contract was created. Comes from: recorded automatically.

 Contract Groups — `/contract-groups`
What it is: A list of groups that can be assigned to contracts, to organise them.
How data gets here: Created with the "New Group" button on this page (a pop-up form).
Columns / fields:
- Code — The group's internal number. Comes from: assigned automatically by the system.
- Name — The group's name. Comes from: typed in the New Group form.
- Subgroup — The parent/subgroup this group is nested under. Comes from: chosen in the New Group form (shows a dash if none).
- Status — Whether Active or Inactive. Comes from: the "Active" checkbox in the New Group form.
- Created At — When the group was created. Comes from: recorded automatically.

 Invoices — `/invoices`
What it is: A list of all sales invoices sent to customers.
How data gets here: Created with the "New Invoice" button (the Add Invoice page). Can be edited or cancelled from the invoice detail page.
Columns / fields:
- Invoice No. — The invoice's number (links to its detail page). Comes from: assigned automatically by the system.
- Customer — The customer's company name. Comes from: the linked customer chosen on the New Invoice page.
- Customer Code — The customer's internal number. Comes from: the linked customer's own record.
- Invoice Date — The date on the invoice. Comes from: entered on the New Invoice page.
- Expiration Date — The payment due date. Comes from: entered on the New Invoice page, or worked out by the system from the payment terms when left blank.
- Excl. VAT — The invoice amount before VAT. Comes from: calculated — adds up the invoice's surcharge lines.
- Incl. VAT — The invoice amount including VAT. Comes from: calculated (amount before VAT plus VAT).
- Credit Restriction — A credit-limit deduction amount. Comes from: calculated (currently always zero).
- Total — The full invoice total. Comes from: calculated (equals the amount including VAT).
- Outstanding — The amount still unpaid. Comes from: calculated (starts equal to the total).
- VAT Scenario — Which VAT situation applies (e.g. standard or reverse-charge). Comes from: chosen on the New Invoice page.
- Payment Terms — The agreed payment terms (e.g. within 30 days). Comes from: chosen on the New Invoice page.
- Status — Badges showing whether VAT is calculated and whether the invoice was Printed/Mailed. Comes from: settings on the invoice record.

 Deliveries — `/deliveries`
What it is: A working list of order lines to be delivered, where staff can mark a reserved line as delivered.
How data gets here: Not created here — it lists existing order lines (from orders) that are not cancelled. The "Deliver" button ships the goods and updates stock.
Columns / fields:
- Order type — The category of the order the line belongs to. Comes from: the linked order.
- Line status — The current status of the order line. Comes from: the order line's own status.
- Order / Line — The order number and line number. Comes from: the linked order / order line.
- Customer — The customer's company name. Comes from: the linked order's customer.
- Seller — The seller recorded on the line. Comes from: the order line.
- Pick-up — Whether the customer is collecting the goods. Comes from: the order line.
- Product code / Product — The product's code and name. Comes from: the linked product.
- Length / Width / Options / Line Qty(p) / StkU — Line details. Comes from: the order line.
- Delivery status — The delivery progress of the line. Comes from: the order line (set to delivered by the Deliver button).
- Delivery date — The date the line was delivered. Comes from: filled in by the system when the Deliver button is used.
- Blocking reason — A note explaining why the line is held. Comes from: the order line, if a block was recorded.
- Action — A "Deliver" button, shown only for reserved lines. Comes from: the system, based on the line's status.

 Blocked Deliveries — `/blocked-deliveries`
What it is: A read-only list of order lines being held back by a commercial, financial or transport block.
How data gets here: Read-only report — nothing is created here; it lists existing order lines that have a block flag set.
Columns / fields:
- Customer — The customer's company name. Comes from: the linked order's customer.
- Order / Customer reference / Order type — Order details. Comes from: the linked order.
- Line / Line status — Line number and status. Comes from: the order line.
- Product — The product's name. Comes from: the linked product.
- Qty(p) / Qty(call-off) / Kg(p) / Gross price / Amount — Line quantities and money. Comes from: the order line.
- Delivery date / Delivery status / Blocking reason — Delivery status details. Comes from: the order line.
- Reservation date / Qty(res) / Kg(res) — Reservation details. Comes from: the order line.

 Deliveries to Arrange — `/deliveries-to-arrange`
What it is: A read-only list of order lines still to be arranged that have no stock reserved yet.
How data gets here: Read-only report — nothing is created here; it lists existing order lines whose reserved quantity is still zero.
Columns / fields:
- Customer — The customer's company name. Comes from: the linked order's customer.
- Order / Line — Order and line number. Comes from: the linked order / order line.
- Delivery date / Qty(p) / U(p) — Delivery date, quantity and unit. Comes from: the order line.
- Product code / Product description — The product's code and name. Comes from: the linked product.
- Length — The length in millimetres. Comes from: the order line.

 Invoice Lines — `/invoice-lines`
What it is: A read-only list of every individual product line that appears on invoices.
How data gets here: Read-only report — nothing is created here; each line was created when its invoice was raised on the New Invoice page (from a delivered order line).
Columns / fields:
- Invoice no. / Invoice date — The invoice this line is on and its date. Comes from: the linked invoice.
- Order line — The original order line being billed. Comes from: the linked order line.
- Customer — The customer's company name. Comes from: the linked invoice's customer.
- Product code / Product — The product's code and name. Comes from: the linked product.
- Quantity — The quantity billed. Comes from: the invoice line (copied from the order line).
- Weight (kg) / Revenue — Weight and money amount of the original order line. Comes from: the linked order line.
- VAT number — The customer's VAT number. Comes from: the linked customer's record.

 Order Lines — `/order-lines`
What it is: A read-only report of every order line, with cost, profit and margin worked out.
How data gets here: Read-only report — nothing is created here; it lists existing order lines and can be filtered by year/month.
Columns / fields:
- Creation date — When the order line was created. Comes from: recorded automatically.
- Delivery date — The planned/actual delivery date. Comes from: the order line.
- Customer / Reference / Order — Customer and order details. Comes from: the linked order (customer from its company).
- Line / Line status — Line number and status. Comes from: the order line.
- Product code / Description — The product's code and name. Comes from: the linked product.
- Options / Length / Width / Thickness / Quantity / QtyU / Weight (kg) / Price — Line details. Comes from: the order line.
- Cost price — The stock lot's valuation cost. Comes from: the linked stock lot.
- Amount — The line's money amount. Comes from: the order line.
- Profit / Profit margin — Profit and margin. Comes from: calculated (amount minus cost).
- Seller — The seller recorded on the line. Comes from: the order line.

 Order Lines Still to be Called — `/order-lines-still-to-be-called`
What it is: A read-only report, line by line, of order lines that still have quantity waiting to be called off.
How data gets here: Read-only report — nothing is created here; it lists order lines where the planned quantity exceeds the amount called off so far (filterable by year/month).
Columns / fields:
- Revenue group — The revenue group of the product. Comes from: the linked product's revenue group.
- Our reference — The company's own order reference. Comes from: the linked order.
- Product code / Description — The product's code and name. Comes from: the linked product.
- Order line / Order — Line number and order number. Comes from: the order line / linked order.
- Customer code / Customer — Customer number and name. Comes from: the linked customer / order.
- City — The customer's city. Comes from: the customer's main contact.
- Reference / Line status / Delivery date — Order/line details. Comes from: the linked order / order line.
- Quantity / QtyU / Length / Width / Weight (kg) / Amount — Line quantities and money. Comes from: the order line.
- Quantity not called / Weight to be called / Amount to be called — What's still waiting to be called off. Comes from: calculated (planned minus called off).
- Representative — The customer's sales rep. Comes from: the linked customer.
- Consignment — Whether it's a consignment order. Comes from: the linked order.

 Orders Still to be Called — `/orders-still-to-be-called`
What it is: A read-only report of orders (shown line by line) that still have quantity to be called off, with stock figures added.
How data gets here: Read-only report — nothing is created here; it lists order lines where the planned quantity exceeds the amount called off (filterable by year/month).
Columns / fields:
- Order / Our reference — Order number and reference. Comes from: the linked order.
- Product code / Description — The product's code and name. Comes from: the linked product.
- Order line — The line number. Comes from: the order line.
- Customer code / Customer / City / Reference — Customer details. Comes from: the linked customer / order / main contact.
- Line status / Delivery date / Quantity / QtyU / Weight (kg) / Amount — Order/line details. Comes from: the order line.
- Quantity not called / Weight to be called / Amount to be called — Still to be called off. Comes from: calculated.
- Representative / Consignment / Revenue group — Extra details. Comes from: the linked customer / order / product.
- Stock (kg) / Reserved stock / Cost price — Stock figures for the reserved lot. Comes from: the linked stock lot.

 Charges — `/charges`
What it is: A list of individual order charges (surcharges and line charges) tied to customers and revenue groups.
How data gets here: Each row is a stored charge record linked to a customer and a revenue group. The list is read-only here — it adds the customer name and revenue group name for context.
Columns / fields:
- Order type / Code / Creation date / Delivery date — Charge details. Comes from: the charge record.
- Revenue group — The revenue group it's classified under. Comes from: the linked revenue group.
- Customer — The customer the charge is for. Comes from: the linked company.
- Surcharge / Contract / Amount / Cost / Profit / Weight / Country / Status — Charge values. Comes from: the charge record.

 Journal Entries — `/journal-entries`
What it is: A list of accounting journal (bookkeeping) entries with amounts, VAT and references.
How data gets here: Each entry is a stored bookkeeping record (posted automatically when invoices are created/cancelled); this list is read-only and adds the company name for the debtor/creditor when one isn't spelled out.
Columns / fields:
- Booking date / Document / Account / Journal / External account / Description / Reference — Entry details. Comes from: the journal entry record.
- Amount / VAT — The entry and VAT amounts. Comes from: the journal entry record.
- Deb/Creditor — The debtor or creditor; falls back to the linked company's name. Comes from: the journal entry record, or the linked company.
- Document date / Explanation / Transmission date — More entry details. Comes from: the journal entry record.

 Financially Blocked Quotes & Orders — `/financially-blocked`
What it is: A worklist of quotes and orders currently held on a financial block, showing the customer's credit position, with an option to release orders.
How data gets here: It gathers every quote and order flagged with a financial block (that flag is set on the Orders and Quotes pages), then pulls in the customer's credit and outstanding figures. Mostly a report, but the "Unblock" button on an order removes the block and records who did it and when.
Columns / fields:
- Type — Whether the row is an Order or a Quote. Comes from: which list the record came from.
- Code — The order/quote reference code. Comes from: the order or quote record.
- Debtor / Debtor no. — The customer name and account number. Comes from: the linked company.
- 1st delivery date / Blocking reason / Payment term — Order/quote details. Comes from: the order or quote record.
- Order amount — Total value (orders sum their line amounts; quotes use the quote total). Comes from: the order's lines, or the quote total.
- Open entrees — The customer's total unpaid invoice balance. Comes from: summed from that customer's invoices.
- Credit limit — The customer's approved credit ceiling. Comes from: the linked company.
- Credit space — Credit limit minus open receivables (red when negative). Comes from: calculated.
- Company blocked? — Whether the whole customer account is blocked. Comes from: the linked company (a "blocked by" user set).
- Action — The "Unblock" button (orders only). Comes from: an action on this page; records the release in the block-release history.

 Credit Information Customers — `/credit-information-customers`
What it is: A per-customer credit overview showing limits, insurance, outstanding balances, current orders and recent revenue.
How data gets here: Read-only report — nothing is created here. It lists every company marked as a customer and combines their credit settings, unpaid invoices, open orders and three years of invoiced revenue.
Columns / fields:
- Customer code / Company — The customer's number and name. Comes from: the company record.
- City / Initials — City and initials of the customer's first contact. Comes from: the first contact record.
- Representative / Payment terms / Credit limit / Credit limit uninsured / Credit insurance / Credit insurance date — Credit settings. Comes from: the company record.
- Outstanding entrees — Total unpaid invoice balance. Comes from: summed from the customer's invoices.
- Current orders — Value of the customer's open orders. Comes from: summed from the customer's order lines.
- Credit space — Credit limit minus outstanding minus current orders. Comes from: calculated.
- Oldest invoice date / Oldest due date — Details of the oldest unpaid invoice. Comes from: the customer's invoices.
- Blocked — Whether the account is blocked. Comes from: the company record.
- VAT number — The customer's VAT number. Comes from: the company record.
- Revenue this year / last year / 2 years ago — Invoiced revenue by year. Comes from: the customer's invoices dated in each year.

 Purchase Invoices to be Received — `/purchase-invoices-to-be-received`
What it is: A list of purchase orders whose goods have already arrived but for which the supplier's invoice hasn't come in yet.
How data gets here: Read-only report — nothing is created here. It finds purchase orders that have at least one goods-receipt recorded but no matching supplier invoice yet, and are not cancelled.
Columns / fields:
- Company / Company code — The supplier's name and number. Comes from: the linked supplier company.
- Purchase order — The purchase order reference. Comes from: the purchase order.
- City — The supplier's city. Comes from: the supplier's first contact.
- Order date / Payment terms / Scheduled delivery — Purchase order details. Comes from: the purchase order.
- Actual delivery — The latest date goods were actually received. Comes from: the goods-receipt records.
- Amount — The purchase order value (with a Total row). Comes from: the purchase order.

 Purchase Orders to be Received — `/purchase-orders-to-be-received`
What it is: A list of open purchase-order lines that still have goods outstanding (not yet fully delivered).
How data gets here: Read-only report — nothing is created here. It lists lines on purchase orders that are still open/confirmed/pre-notified and not fully received.
Columns / fields:
- Company / Company code — The supplier's name and number. Comes from: the linked supplier company.
- Purchase order / Status / Order date — Purchase order details. Comes from: the purchase order.
- Group no. / Revenue group — The revenue group of the product on the line. Comes from: the product's revenue group.
- Kg purchased — Kilograms ordered on the line. Comes from: the purchase order line.
- Kg received — Kilograms received so far. Comes from: calculated from received vs ordered quantity.
- Kg still to receive — Remaining kilograms. Comes from: calculated (purchased minus received).
- Order amount — The order's total value. Comes from: the purchase order.
- Purchaser — The buyer responsible. Comes from: the purchase order.

 Revenue per Revenue Group — `/revenue-per-revenue-group`
What it is: A summary of sales, revenue and profit totalled up by revenue group.
How data gets here: Read-only report — nothing is created here. It totals invoiced order lines grouped by revenue group; cost is taken from the stock lot's valuation price and profit/margin are calculated.
Columns / fields:
- Revenue group no. / Revenue group — Number and name ("Ungrouped" if none). Comes from: the product's revenue group.
- Sales (kg) — Total planned kilograms sold in the group. Comes from: calculated — sums planned kg.
- Revenue — Total invoiced revenue for the group. Comes from: calculated — sums order-line amounts.
- Profit — Revenue minus cost. Comes from: calculated.
- Profit margin (%) — Profit as a percentage of revenue. Comes from: calculated.

 Revenue per Product — `/revenue-per-product`
What it is: A summary of sales, revenue and profit per product, broken down by invoice year and month.
How data gets here: Read-only report — nothing is created here. It totals invoiced sales per product and period; cost is from the stock lot's valuation price.
Columns / fields:
- Product code / Product description — The product's code and name. Comes from: the product record.
- Year / Month — The invoice period. Comes from: the invoice date.
- Weight (kg) / Sales / Revenue / Profit / Profit margin — Totals for the product/period. Comes from: calculated from the invoiced order lines.

 Purchases & Sales per Revenue Group — `/purchases-and-sales-per-revenue-group`
What it is: A side-by-side summary of the buying side and the selling side per revenue group and period.
How data gets here: Read-only report — nothing is created here. It combines invoiced sales (revenue, weight, profit) with purchases (purchased kg and cost) for each revenue group and each month/year.
Columns / fields:
- Revenue group no. / Revenue group — Number and name. Comes from: the product's revenue group.
- Year / Month — The period. Comes from: the (purchase) invoice date.
- Purchase (kg) / Purchase revenue — Kilograms bought and their cost. Comes from: calculated from supplier invoices.
- Weight / Revenue / Profit / Profit % — The selling side totals. Comes from: calculated from sales order lines.
- Avg. Sales Price/Kg — Average selling price per kilogram. Comes from: calculated (revenue ÷ weight).

 Revenue w.r.t. Budget — `/revenue-vs-budget`
What it is: A comparison of actual invoiced sales against the budgeted targets, per revenue group.
How data gets here: Read-only report — nothing is created here. It puts actual invoiced sales next to the budget figures maintained for each revenue group and period.
Columns / fields:
- Revenue group no. / Revenue group — Number and name. Comes from: the product's revenue group.
- Weight / Revenue / Profit / Profit % / Avg. Sales Price — Actual figures. Comes from: calculated from the invoiced order lines.
- Weight Budget / Revenue Budget / Profit budget / Profit % Budget / Avg. Sales Price Budget — Budget targets. Comes from: the revenue budget figures for the group/period.

---

 4. Supplier

 Suppliers — `/suppliers`
What it is: A list of every company marked as a supplier, showing its roles, buyer, payment terms, and main contact details.
How data gets here: Records originate on the company create/edit form (a company gets the "supplier" role there); the contact details come from that company's first-entered contact person.
Columns / fields:
- Search code — A short lookup code. Comes from: the company record's search-code fields.
- Company — The supplier's name. Comes from: the company record.
- Supplier / Processor / Transporter / Agent / Other / Customer / Prospect — Checkmarks for the company's roles. Comes from: the roles set on the company record.
- Visit city — The city where the supplier is visited. Comes from: the company's main contact.
- Purchaser — The staff representative responsible for the supplier. Comes from: the company record.
- Payment terms — The agreed payment conditions. Comes from: the company record.
- Corresp. address / city / country / Telephone — The mailing address and phone. Comes from: the company's main contact.
- Contact person / Contact e-mail / Contact mobile — The main contact's name and details. Comes from: the company's main contact.
- Company code — The internal number of the company. Comes from: the company record.

 Supplier Revenue — `/supplier-revenue`
What it is: A summary of how much was purchased from each supplier, broken down by invoice month and year, with total value and weight.
How data gets here: Read-only report — nothing is created here; it summarizes purchase invoices and their line items, grouped by supplier and period. Filterable by year and month.
Columns / fields:
- Supplier / Supplier code — The supplier's name and number. Comes from: the company linked to the purchase invoices.
- City / Country — The supplier's city and country. Comes from: the company's main contact.
- Month / Year — The period. Comes from: the purchase invoice date.
- Revenue — Total purchased value for that supplier/period. Comes from: calculated — sums each line's valuation price × quantity.
- Weight (kg) — Total invoiced quantity in kilograms. Comes from: calculated — sums the line quantities.

 Supplier Revenue per Revenue Group — `/supplier-revenue-per-revenue-group`
What it is: A summary of purchase value and weight grouped by revenue group, per invoice month and year, with an average price per kilogram.
How data gets here: Read-only report — nothing is created here; it summarizes purchase invoice lines grouped by the revenue group of the purchased product and the period. Filterable by year and month.
Columns / fields:
- Group no. / Revenue group — Number and name. Comes from: the revenue group linked to each purchased product.
- Year / Month — The period. Comes from: the purchase invoice date.
- Weight (kg) — Total invoiced quantity in kilograms for the group. Comes from: calculated — sums the line quantities.
- Revenue — Total purchased value. Comes from: calculated — sums valuation price × quantity.
- Avg. € / kg — Average purchase price per kilogram. Comes from: calculated (value ÷ weight).

 Contracts per Supplier — `/contracts-per-supplier`
What it is: A list of all contracts that are linked to supplier companies.
How data gets here: Contracts originate on the contract create/edit form (a contract tied to a company with the supplier role); this page lists only supplier-role contracts.
Columns / fields:
- Supplier Code / Supplier — The supplier company's number and name. Comes from: the linked company.
- City — The supplier's city. Comes from: the company's address.
- Contract Code / Contract — The contract's code and description. Comes from: the contract record.
- Contract Group — The group the contract belongs to. Comes from: the linked contract group.
- Starting Date / End Date — When the contract starts/ends. Comes from: the contract record.
- Preference — A preference indicator, currently always 0 (placeholder). Comes from: not yet backed by real data.

 Contact Persons Suppliers — `/contact-persons-suppliers`
What it is: A detailed list of every contact person who belongs to a supplier company, with their personal, address, and role details.
How data gets here: Contact persons originate on the contact create/edit form under their company; this page shows only contacts whose company has the supplier role. Columns can be shown/hidden.
Columns / fields:
- Contact Person / Title / Initials / First Name / Last Name — The contact's name parts. Comes from: the contact person record.
- Contact Person Category — Categories assigned to the contact. Comes from: the contact person record.
- Contact Person E-mail / Telephone / Mobile — Contact details. Comes from: the contact person record.
- Correspondence Address / Postal Code / City / Country / Telephone / Fax — The contact's mailing address. Comes from: the contact person record.
- Visiting Address / Visit-Postal Code / Visit-City / Visit-Country / Visit-Telephone / Visit-Fax — The contact's visiting address. Comes from: the contact person record.
- Revenue Last Year / Revenue This Year — Revenue figures on the contact. Comes from: the contact person record.
- Purchaser — The buyer associated with the contact. Comes from: the contact person record.
- Searchcode 1 / 2 / 3 — Lookup codes. Comes from: the contact person record.
- Company / Company Name — The linked company's number and name. Comes from: the linked company.
- Customer / Prospect / Supplier / Processor / Transporter / Agent / Other — Role checkmarks. Comes from: the contact person record.

---

 5. Purchases

 Order Advice — `/order-advice`
What it is: A buying-suggestion report that recommends how much of each stocked product to reorder based on how fast it sells versus how much is on hand.
How data gets here: Read-only report — nothing is created here; it is calculated live from products, their product groups, current stock, open purchase orders, and past sales invoices.
Columns / fields:
- Product code / Description — The product's code and name. Comes from: the product record.
- Main group — The product's group. Comes from: the linked product group.
- Supplier — The preferred supplier for the group. Comes from: the preferred supplier linked to the product group.
- Stock / Reserved / Available — On-hand, reserved, and free quantity. Comes from: current stock records (Available is calculated).
- To be received — Quantity still expected from open purchase orders. Comes from: open purchase order lines not yet received.
- Econ. stock — Available plus what is on order. Comes from: calculated.
- Avg. monthly cons. / Cons. prev. year — Average and last-year consumption. Comes from: calculated from past sales invoices.
- Econ. coverage / Tech. coverage — How many months stock will last. Comes from: calculated.
- Min level / Max level — The stock policy's minimum and top-up levels. Comes from: the product group's stock policy settings.
- Advice qty / Order qty — Suggested and rounded reorder amounts. Comes from: calculated (Order qty uses supplier/group order rules).

 StockOn Advice — `/stockon-advice`
What it is: A reorder report for products set up to use the automatic "StockOp" review method, showing when to reorder based on a fixed review cycle and delivery lead time.
How data gets here: Read-only report — nothing is created here; it is calculated live from products whose group has StockOp enabled, plus stock, open purchase orders, and sales invoices.
Columns / fields:
- Product code / Product — The product's code and name. Comes from: the product record.
- Main group — The product's group. Comes from: the linked product group.
- Preferred supplier — The preferred supplier for the group. Comes from: the product group.
- Techn. stk. / Reserved / Available — On-hand, reserved, free. Comes from: current stock records (Available calculated).
- To be received / Econ. stock — Incoming and economic stock. Comes from: open purchase orders / calculated.
- Avg. monthly cons. — Average monthly consumption. Comes from: calculated from past sales invoices.
- Lead time (d) / Review (d) / Lead time method — Ordering timing settings. Comes from: the product group settings (lead time falls back to the supplier's delivery time).
- Order level / Stock − order level / % diff. — Target level and gap. Comes from: calculated.
- To order — Suggested reorder quantity. Comes from: calculated (rounded to supplier rules).
- Evaluate today? / Order now? — Whether today is an ordering day and a reorder is needed. Comes from: calculated from the group's order-day settings.

 Sold Products Not Advised — `/sold-products-not-advised`
What it is: A report of products that were sold in the period but are not covered by any automatic reorder logic, so no one is watching their demand.
How data gets here: Read-only report — nothing is created here; it lists sold products (from sales invoices) whose group makes no order advices, or that aren't stock products.
Columns / fields:
- Main group / Product group — The product's parent and direct group. Comes from: the linked product group.
- Product code / Description — The product's code and name. Comes from: the product record.
- Stock product / Standard product — Yes/No flags. Comes from: the product record.
- Avg. monthly cons. — Average monthly consumption. Comes from: calculated from past sales invoices.
- Revenue / Sales — Total sales value and quantity in the period. Comes from: calculated from sales lines.
- Stock / Available — On-hand and free stock. Comes from: current stock records (Available calculated).
- Stock U. — The product's stock unit. Comes from: the product record.
- PAC — The group's PAC classification code. Comes from: the linked product group.

 Purchase Quotes — `/purchase-quotes`
What it is: A list of price quotes requested from or received from suppliers.
How data gets here: Created on the New Purchase Quote page; each row links to its detail page.
Columns / fields:
-  — The quote's internal number (links to detail). Comes from: assigned automatically.
- Quote No — The supplier's own quote reference. Comes from: entered on the form.
- Company / Contact — The supplier and the person there. Comes from: chosen on the form.
- Type — The purchase order type/category. Comes from: entered on the form.
- Valid Until — The date the quote expires. Comes from: entered on the form.
- Created — When the quote was made. Comes from: set automatically.

 Purchase Requests — `/purchase-requests`
What it is: A list of internal requests to purchase goods, before they become actual purchase orders.
How data gets here: Created on the New Purchase Request page; each row links to its detail page.
Columns / fields:
-  — The request's internal number (links to detail). Comes from: assigned automatically.
- Company / Contact — The supplier and the person there. Comes from: chosen on the form.
- Type — The purchase order type/category. Comes from: entered on the form.
- Delivery Date — The requested delivery date (or week/year). Comes from: entered on the form.
- Deadline — The deadline for the request. Comes from: entered on the form.
- Created — When the request was made. Comes from: set automatically.

 Purchase Orders — `/purchase-orders`
What it is: A list of actual orders placed with suppliers to buy goods.
How data gets here: Created on the New Purchase Order page; creating one also opens incoming stock. Each row links to its detail page where the header can be edited or the order cancelled.
Columns / fields:
-  — The order's internal number (links to detail). Comes from: assigned automatically.
- Supplier / Contact — The supplier and the person there. Comes from: chosen on the form.
- Type — The purchase order type/category. Comes from: entered on the form.
- Delivery Date — The expected delivery date (or week/year). Comes from: entered on the form.
- Created — When the order was placed. Comes from: set automatically.

 Purchase Orders and Quotes — `/purchase-orders-and-quotes`
What it is: A combined report showing purchase orders and purchase quotes together in one list, filterable by year and month.
How data gets here: Read-only report — nothing is created here; it merges existing purchase orders and purchase quotes.
Columns / fields:
- Type — Whether the row is an Order or a Quote. Comes from: which source list it came from.
- Number / Creation date / Purchaser / Reference — Order/quote details. Comes from: the original purchase order or quote.
- Status — The order's status (quotes show none). Comes from: the original purchase order.
- Supplier — The supplier company. Comes from: the linked company.
- Weight (kg) / Revenue — The header totals. Comes from: the original purchase order or quote.

 Purchase Return Orders — `/purchase-return-orders`
What it is: A list of goods being sent back to suppliers, with the reason for each return.
How data gets here: Created on the New Purchase Return Order page (which can also add surcharges and text notes); each row links to its detail page.
Columns / fields:
-  — The return order's internal number (links to detail). Comes from: assigned automatically.
- Supplier / Contact — The supplier and the person there. Comes from: chosen on the form.
- Return Reason — Why the goods are being returned. Comes from: chosen on the form.
- Return Date — The date of the return. Comes from: entered on the form.
- Created — When the return order was made. Comes from: set automatically.

 Purchase Invoices — `/purchase-invoices`
What it is: The list of bills received from suppliers for goods purchased.
How data gets here: Created on the New Purchase Invoice page; creating one also draws down matching stock and posts to the purchase ledger.
Columns / fields:
- No. — The invoice's reference number (links to detail). Comes from: assigned automatically.
- Supplier / Sent By — The supplier and the contact who sent it. Comes from: chosen on the invoice form.
- Supplier Code — The supplier's lookup code. Comes from: the linked supplier's record.
- Invoice Date — The date on the supplier's invoice. Comes from: entered on the form.
- Exp. Date — The payment due date. Comes from: entered on the form, or worked out automatically from the payment terms and invoice date if left blank.
- Total — The full invoice amount. Comes from: entered/calculated on the form.
- Payment Terms — The agreed payment window. Comes from: chosen on the form.
- Blocked / Block Reason — Whether the invoice is held and why. Comes from: the invoice's own status.

 Purchase Invoice Line — `/purchase-invoice-line`
What it is: A read-only report listing each individual product line across all supplier invoices, with the supplier's country/VAT and the purchased value.
How data gets here: Read-only report — nothing is created here; it pulls the product lines recorded when supplier invoices are created.
Columns / fields:
- Year / Month — The invoice period. Comes from: the invoice date.
- Invoice / Purchase order — The invoice's number and its purchase order number. Comes from: the purchase invoice this line belongs to.
- Supplier — The company that sent the invoice. Comes from: the linked supplier.
- Country — The supplier's country. Comes from: the supplier's main contact address.
- Product code / Description — The product's code and name. Comes from: the linked product.
- Qty — How many were on this line. Comes from: the invoice line.
- Revenue products — Line value (valuation price × quantity). Comes from: calculated.
- VAT number — The supplier's VAT number. Comes from: the linked supplier's record.

 Purchase Lines — `/purchase-lines`
What it is: A read-only report listing every individual product line across all purchase orders.
How data gets here: Read-only report — nothing is created here; it pulls the product lines recorded when purchase orders are created.
Columns / fields:
- Date created — When the line was added. Comes from: the line's own creation date.
- Purchase order / Line / Status — Order number, line number and state. Comes from: the purchase order / order line.
- Supplier — The company the order was placed with. Comes from: the linked supplier.
- Product code / Product — The product's code and name. Comes from: the linked product.
- Quality / Stock category / Options / Length / Width / Qty(p) / U / Reserved / Kg(pur) / Receipt date / Purchaser — Line details. Comes from: the order line record.

 Purchase Quotes Overview — `/purchase-quotes-overview`
What it is: A read-only report listing every product line across all quotes received from suppliers.
How data gets here: Read-only report — nothing is created here; it pulls the product lines recorded when supplier purchase quotes are created.
Columns / fields:
- Supplier — The company that gave the quote. Comes from: the linked supplier.
- Quote date / Valid u/i / Quote nr. supplier / Purchase quote / Line / Status / Expiration reason — Quote and line details. Comes from: the purchase quote / quote line.
- Revenue group no. / Revenue group — Number and name. Comes from: the linked revenue group.
- Product code / Product description / Length / Width / Quantity / QtyU / Kg / Net price / Amount / Purchaser — Line details. Comes from: the quote line record.

 Purchase Receivals — `/purchase-receivals`
What it is: A read-only report of purchase order lines and how much of each has actually been received.
How data gets here: Read-only report — nothing is created here; it pulls the receival records tracked against purchase order lines as goods come in.
Columns / fields:
- Purchase order / Line — The order and line number. Comes from: the receival record.
- Supplier — The company the order was placed with. Comes from: the linked supplier.
- Product code / Product — The product's code and name. Comes from: the linked product.
- Line amount / Qty(p) / Unit / Qty(a) / Received Qty / Invoiced / Options / Line status / Receipt status / Receipt date / Delivery date (p) / Delivery date (a) / Kg(p) / Kg(a) / Purchaser — Receival details. Comes from: the receival record.

 Receipts — `/receipts`
What it is: A read-only report summarising goods received, grouped per receipt date, supplier, and product.
How data gets here: Read-only report — nothing is created here; it totals up the receival records tracked against purchase order lines.
Columns / fields:
- Receipt date — The date goods were received. Comes from: the receival records.
- Company code / Company — The supplier's code and name. Comes from: the linked supplier.
- Product — The product code and name together. Comes from: the linked product.
- Qty / Kg — Total quantity/weight received for that grouping. Comes from: summed from the receival records.
- Order no / Receipt status — Order number and receipt state. Comes from: the receival records.
- Material still to receive — Planned minus received (never below zero). Comes from: calculated.

 Purchase Results — `/purchase-results`
What it is: A read-only report comparing what was actually paid for received goods against what replacing them would cost today.
How data gets here: Read-only report — nothing is created here; it totals received-goods records and compares them with each product's current replacement price. Filterable by year and month.
Columns / fields:
- Main group — The product's main group. Comes from: the linked product group.
- Product code / Product — The product's code and name. Comes from: the linked product.
- Year / Month — When goods were received. Comes from: the receipt date.
- Purchase value — Total actually paid for the received goods. Comes from: summed line amounts on the receival records.
- Replacement value — Cost to replace them today (replacement price × quantity received). Comes from: calculated.
- Purchase -/- replacement (€) / (%) — The difference in euros and percent. Comes from: calculated.

---

 6. Warehouse

> `Stock`, `Stock on Location`, and `Customer Stock` all read the same underlying stock
> lots — just filtered and presented differently. Stock lots are created automatically
> when a purchase order is created (incoming goods) and when a production line is
> completed; stock movements are always created by the system, never by hand.

 Warehouses — `/warehouses`
What it is: The list of main warehouse locations (top-level storage sites).
How data gets here: Created by staff on the New Warehouse page. Creating one also automatically starts an empty warehouse work order for it.
Columns / fields:
- Code — The short automatic number for this warehouse. Comes from: generated automatically when saved.
- Name — The warehouse's name. Comes from: typed on the form.
- Location Type — What kind of location this is. Comes from: chosen on the form.
- Loading Location / Address — Loading usage and address category. Comes from: chosen on the form.
- Blocked — Whether it's blocked from use (Yes/No). Comes from: set on the form.
- Reason — Why it's blocked (hidden by default). Comes from: chosen on the form.
- Blocked for Optimization / Limited Dimensions — Yes/No flags (hidden by default). Comes from: set on the form.
- Document — Attached files. Comes from: uploaded against the warehouse.

 Warehouse Sub Sections — `/warehouse-sub-sections`
What it is: The list of smaller sub-areas that sit inside a main warehouse.
How data gets here: Created by staff on the New Sub Section page. Each is linked to a parent warehouse.
Columns / fields:
- Code — The short automatic number. Comes from: generated automatically when saved.
- Name — The sub-section's name. Comes from: typed on the form.
- Picking Sequence — The order in which this area is walked/picked. Comes from: entered on the form.
- Location Type / Loading Location — What kind of area and loading usage. Comes from: chosen on the form.
- Blocked — Whether blocked (Yes/No). Comes from: set on the form.
- Reason / Blocked for Optimization / Limited Dimensions — Extra flags (hidden by default). Comes from: set/chosen on the form.

 Warehouse Work Orders — `/warehouse-work-orders`
What it is: A list of work orders (jobs) tied to each warehouse.
How data gets here: Created automatically by the system — one work order is opened for a warehouse the moment that warehouse is created. Nothing is added by hand.
Columns / fields:
- Code — The automatic number of the work order. Comes from: generated automatically.
- Warehouse — Which warehouse this belongs to. Comes from: the linked warehouse.
- Status — Where the work order stands. Comes from: set automatically as the job progresses.
- Created At — The date the work order was started. Comes from: recorded automatically.

 Production Work Orders — `/production-workorders`
What it is: A list of individual production job lines (items to be produced), with a button to mark each one complete.
How data gets here: The production job lines are created elsewhere in the production planning flow. This page lists them and lets staff press "Complete" — completing a line automatically books the finished goods into stock (a new stock lot and an "in" stock movement).
Columns / fields:
- Date — The planned date for the line. Comes from: entered when the job/line was planned.
- Machine / Option — The machine and processing option. Comes from: the linked production job.
- Status — Progress of the line. Comes from: set on the line; changes to completed when "Complete" is pressed.
- Product code / Order / Company — What's produced, for which order and customer. Comes from: the production line / linked company.
- Dikte / Qty(p) / Qty(a) / Kg(p) / From / To / Deliver on / Rush / Priority / Charge — Line details. Comes from: recorded on the production line.
- Action — The "Complete" button (dash once completed). Comes from: an action on this page, not stored data.

 Transport Work Orders — `/transport-workorders`
What it is: A list of individual transport job lines (deliveries to load and ship), with a button to mark each complete.
How data gets here: The transport job lines are created elsewhere in the transport planning flow. This page lists them and lets staff press "Complete", which only marks the line shipped (no stock change — the stock already left at delivery).
Columns / fields:
- Trip / Date / Vehicle — The trip this delivery belongs to. Comes from: the linked transport trip.
- Destination / Postal Code — Who is being delivered to and where. Comes from: the linked destination company / transport line.
- Product code / Order / Action / Status / Length / Qty(p) / Qty(loaded) / Kg(p) / Colli / Priority — Line details. Comes from: recorded on the transport line.
- Action — The "Complete" button (dash once completed). Comes from: an action on this page, not stored data.

 Stock — `/stock`
What it is: The master list of stock lots (each a batch of product received or produced), with a button to correct quantities.
How data gets here: Created automatically by the system when a purchase order is created (incoming goods) and when a production line is completed. Staff can adjust a lot's quantity here using "Correct", which records a stock movement. Rows link to the stock lot's detail page.
Columns / fields:
- Product — The product code and name for this lot. Comes from: the linked product.
- Company — The company (supplier) tied to the product. Comes from: the linked product's company.
- Purchase Order — The purchase order this lot came from. Comes from: the linked purchase order, if any.
- Original / Remaining — Quantity first booked in vs what's left. Comes from: the purchase order line quantity / the lot's current quantity.
- Reserved / Available — Held by open sales orders vs still free. Comes from: stored on the lot / calculated (remaining minus reserved).
- Status — The lot's state (pending, received, cancelled). Comes from: set automatically.
- Pending For — How many days the lot has been pending. Comes from: calculated from the created date.
- Created — The date the lot was booked in. Comes from: recorded automatically.
- Action — The "Correct" button to adjust the quantity. Comes from: an action on this page, not stored data.

 Stock Movements — `/stock-movements`
What it is: A running log of every stock change (each addition or removal).
How data gets here: Created automatically by the system whenever stock changes — goods received on a purchase order, production output, a manual stock correction, or a sale/delivery. Nothing is entered directly; each row links to its detail page.
Columns / fields:
-  — The automatic number of the movement (links to detail). Comes from: generated automatically.
- Product — The product affected. Comes from: the linked product.
- Type — Whether stock went In (green) or Out (red). Comes from: set automatically when the movement was recorded.
- Reason — Why the change happened, plus any note. Comes from: set automatically; the note is entered on a manual correction.
- Quantity — How much moved. Comes from: recorded on the movement.
- Source — The document behind the movement (purchase order, purchase invoice, order, or invoice). Comes from: whichever linked document triggered the movement.
- Time — When it happened. Comes from: recorded automatically.

 Freight Movement — `/freight-movements`
What it is: A read-only goods-flow ledger: every stock mutation with its running stock balance (before and after) and the accounting details attached to it.
How data gets here: Read-only report — nothing is created here. Each row is a movement of goods; product, company, order, purchase order, charge and supplier details are pulled from the linked records.
Columns / fields:
-  — The movement's own number (links to detail). Comes from: assigned automatically by the system.
- Mutation date / time — When the movement happened. Comes from: recorded on the movement.
- Operator — Who triggered it. Comes from: recorded on the movement (a shop-floor operator code).
- Product code / Description / Length (mm) / Width (mm) — Product and piece details. Comes from: the linked product.
- MutationQty / StkU — How much moved and the unit it's counted in. Comes from: recorded on the movement.
- Mutation reason — Why the stock changed. Comes from: set on the movement.
- Workorder # — The work order behind the movement. Comes from: recorded on the movement.
- Start date / End date — The balance window this movement falls in. Comes from: recorded on the movement.
- Starting stock / Starting value — Quantity and euro value before the movement. Comes from: recorded on the movement.
- Closing stock / Closing value — Quantity and euro value after the movement. Comes from: recorded on the movement.
- General ledger — The ledger account it posts to. Comes from: recorded on the movement.
- Revenue group — The revenue bucket it rolls up to. Comes from: the linked revenue group.
- Std / Stock — Whether the product is a standard product / a stock product. Comes from: the linked product.
- Company — The customer the movement serves (code + name). Comes from: the linked company.
- Order — The sales order behind it. Comes from: the linked order.
- Text — Free-text remark. Comes from: recorded on the movement.
- Charge — The charge reference. Comes from: the linked charge.
- Purchase order / Receipt date / Supplier — The purchase side of the movement. Comes from: the linked purchase order and supplier.

 Stock on Location — `/stock-on-location`
What it is: A read-only report showing each stock lot by where it physically sits, with dimensions and valuation.
How data gets here: Read-only report — nothing is created here. It lists existing stock lots (created via purchase orders / production) together with their location details.
Columns / fields:
- Location — Where the lot is stored. Comes from: the linked warehouse/location.
- Blocked — Whether this lot is blocked. Comes from: a flag on the lot.
- Product code / Quality / Stock category / Options / Length / Width / Thickness — Product and piece details. Comes from: the linked product / the lot.
- Stock (StkU) — Quantity on hand. Comes from: the lot's current quantity.
- Reserved / Available — Held vs free. Comes from: stored on the lot / calculated.
- StkU / Stock (Kg) / Charge / Bundle / Internal charge — Units and references. Comes from: recorded on the lot.
- Supplier — The supplier of the lot. Comes from: the linked supplier.
- Receipt date — When the lot was received. Comes from: recorded on the lot.
- Stock (€) — The euro valuation of the lot. Comes from: the valuation stored on the lot.

 Customer Stock — `/customer-stock`
What it is: A read-only report of stock that is stored at our locations but owned by a customer or supplier (consignment).
How data gets here: Read-only report — nothing is created here. It lists existing stock lots that have an owner company set (i.e. not owned by us).
Columns / fields:
- Owner — The customer/company that owns the stock. Comes from: the linked owner company.
- Location — Where the lot is stored. Comes from: the linked warehouse/location.
- Product code / Quality / Stock category / Length / Width / Thickness — Product and piece details. Comes from: the linked product / the lot.
- Stock (StkU) / Available / StkU / Stock (Kg) / Charge — Quantities and references. Comes from: the lot (Available calculated).
- Supplier — The supplier of the lot. Comes from: the linked supplier.
- Valuation price / Stock (€) — Unit valuation and total valuation. Comes from: recorded on the lot.
- Remark — Free-text remark. Comes from: recorded on the lot.

 Reservations — `/reservations`
What it is: Two read-only tables: a detailed list of every stock reservation held by an order line, and a per-product summary of technical stock vs reserved.
How data gets here: Read-only report — nothing is created here. Reservations are created when sales order lines claim stock; this page lists and summarizes them.
Columns / fields (detailed table):
- Product code / Product / Stock product / Standard product / Length — Product details. Comes from: the linked product.
- Section / Location / Location type — Where the reserved lot sits. Comes from: the lot's location.
- Qty / U. — The quantity reserved and its unit. Comes from: the sales order line.
- Order / Order line / Company — The order, line, and customer. Comes from: the linked order.
- Reservation type — "Definitive (Sales)" once invoiced, otherwise "Temporary (Sales)". Comes from: calculated from the order line's status.

Columns / fields (summary table):
- Product code / Product — Product details. Comes from: the linked product.
- Qty Techn. Stock / Kg Techn. Stock / Qty Reserved — Totals across the product's lots. Comes from: calculated by summing the lots.

 Stock History — `/stock-history`
What it is: A read-only valuation report showing current stock totals per product, grouped by revenue group.
How data gets here: Read-only report — nothing is created here. It adds up the current stock lots per product. (Shows current stock; a by-date version is a planned follow-up.)
Columns / fields:
- Revenue group no. / Revenue group — Number and name ("Ungrouped" if none). Comes from: the product's revenue group.
- Product code / Description / Length — Product details. Comes from: the linked product.
- Stock (Kg) — Total weight on hand. Comes from: calculated by summing the lots.
- PriceU — Price per unit (total value ÷ total quantity). Comes from: calculated.
- Stock (Stk.U.) / Stock (€) — Total quantity and total euro valuation. Comes from: calculated by summing the lots.

 Deviations in Count Lists — `/count-list-deviations`
What it is: A read-only report of stock-count discrepancies — where the counted stock differed from what the system expected — booked per count work order.
How data gets here: Read-only report — nothing is created here. Each row is a correction booked when a count work order is completed; the product details are pulled from the linked product.
Columns / fields:
-  — The deviation's own number (links to detail). Comes from: assigned automatically by the system.
- Workorder # / Workorder date — The count work order and its date. Comes from: recorded on the deviation.
- Booked by — Who booked the correction. Comes from: recorded on the deviation (an operator code).
- Location — Where the item was counted. Comes from: recorded on the deviation.
- Product — The product counted (code + name). Comes from: the linked product.
- Length (mm) — Piece length. Comes from: the linked product.
- Qty. / U. / Kg. — The correction quantity, its unit and weight. Comes from: recorded on the deviation.
- Amount — The euro value of the correction. Comes from: recorded on the deviation.
- Document — The source document reference. Comes from: recorded on the deviation.
- Old stk. / Old stk. Kg. — Stock (quantity and weight) before the correction. Comes from: recorded on the deviation.
- New stk. / New stk. Kg. — Stock (quantity and weight) after the correction. Comes from: recorded on the deviation.
- Date reported as completed — When the count was reported done. Comes from: recorded on the deviation.

 Pick Statistic — `/pick-statistics`
What it is: A read-only statistics report of picking activity, summarized per product per month.
How data gets here: Read-only report — nothing is created here. Each row totals the picks of one product in one month; product details are pulled from the linked product.
Columns / fields:
- Product code / Description — The product. Comes from: the linked product.
- Year / Month — The period (taken from each pick's completion date). Comes from: recorded when the picks were completed.
- Picks — How many times the product was picked. Comes from: counted by the system.
- Qty. Picked / Fetched / U. — Total quantity picked and its unit. Comes from: totalled by the system.
- Kg. Picked — Total weight picked. Comes from: totalled by the system.
- Avg. Qty. per pick / Avg. Kg. per pick — Quantity/weight divided by number of picks. Comes from: calculated by the system.
- Stock product — Whether the product is a stock product. Comes from: the linked product.

 Warehouse Capacity — `/warehouse-capacity`
What it is: A read-only report of warehouse capacity per day, section, subsection and type of work order — how much is occupied, ready and still remaining.
How data gets here: Read-only report — nothing is created here. Each row is a capacity snapshot for one section on one day.
Columns / fields:
- Date — The work order day the snapshot is for. Comes from: recorded on the snapshot.
- Warehouse section / Subsection — Where the capacity sits. Comes from: recorded on the snapshot.
- Workorder type — The kind of work the capacity covers. Comes from: recorded on the snapshot.
- Occupied — Capacity already taken. Comes from: recorded on the snapshot.
- Ready — Capacity ready to run. Comes from: recorded on the snapshot.
- Remaining — Capacity still free. Comes from: recorded on the snapshot.

 Time Registration — `/time-registration`
What it is: A read-only log of shop-floor scan events — who scanned, what they scanned, and the context and action behind each scan.
How data gets here: Read-only report — nothing is created here. Each row is a scan recorded by a warehouse/production scanner.
Columns / fields:
- Date Time — When the scan happened. Comes from: recorded by the scanner.
- User / Extra User — The operator(s) that scanned (scan-login codes). Comes from: recorded by the scanner.
- Scan code — The barcode that was scanned. Comes from: recorded by the scanner.
- Context / Context reference — What the scan relates to and its reference. Comes from: recorded by the scanner.
- Action / Action reference — The action performed and its reference. Comes from: recorded by the scanner.

 Production Batches — `/production-batches`
What it is: A list of production batches (grouped production runs).
How data gets here: Created by the production process. This page just lists existing batches.
Columns / fields:
- Code — The batch's code. Comes from: recorded on the batch when created.
- Created — The date the batch was created. Comes from: recorded on the batch.
- Machine — The machine used. Comes from: the linked machine.
- To location — Where the batch's output goes. Comes from: the linked destination location.

 Trip Data — `/trip-data`
What it is: A read-only list of transport trips with their totals.
How data gets here: Read-only report — nothing is created here. Trips come from the transport planning process; this page lists them.
Columns / fields:
- Trip / Trip date / Vehicle — The trip, its date and vehicle. Comes from: recorded on the trip.
- Stops / Kg. / Colli / Orders per stop — Trip totals. Comes from: recorded on the trip.

---

 7. Locations

 Locations — `/locations`
What it is: A list of the storage spots (bins, shelves, sub-sections) inside your warehouses.
How data gets here: Each row is created on the New Location page, which lets you copy settings from an existing warehouse spot and then adjust them.
Columns / fields:
- Code — The system reference number. Comes from: assigned automatically when saved.
- Name — The name of the location. Comes from: typed on the New Location page.
- Picking Sequence — The order number that decides where this spot falls in the pick route. Comes from: typed on the New Location page.
- Location Type / Loading Location — Kind of spot and loading area. Comes from: chosen on the New Location page.
- Blocked — Whether the spot is blocked from use (Yes/No). Comes from: the "Blocked" checkbox.
- Reason — Why the spot is blocked. Comes from: chosen (only when "Blocked" is ticked).
- Blocked for Optimization / Limited Dimensions — Yes/No flags. Comes from: the checkboxes on the form.

---

 8. Logistics

 Machines — `/machines`
What it is: A list of the production machines used in the workshop.
How data gets here: Each row is created on the New Machine page.
Columns / fields:
- Code / Name — The machine's code and name. Comes from: typed on the New Machine page.
- Option — The machine's option/setup type. Comes from: chosen on the New Machine page.
- Production — The type of production it handles. Comes from: chosen on the New Machine page.
- Loading — The loading method. Comes from: chosen on the New Machine page.
- Stock Location — The warehouse spot where the machine's stock sits. Comes from: chosen on the New Machine page (name pulled from the linked location).
- Min Length / Max Length — Shortest/longest item length (mm). Comes from: typed on the New Machine page.
- Out of Business — Whether it's out of service (Yes/No). Comes from: the checkbox on the New Machine page.
- Average Daily Capacity / Warning % — Daily capacity with unit, and the warning threshold. Comes from: typed/chosen on the New Machine page.
- Documents — Attached files. Comes from: uploaded on the New Machine page.

 Product Groups — `/product-groups`
What it is: A list of the top-level product families that individual products are organized under.
How data gets here: Each row is created on the New Product Group page. Only top-level groups (without a parent) are shown here.
Columns / fields:
- Code — The system reference (links to detail). Comes from: assigned automatically when saved.
- Name — The name of the product group. Comes from: typed on the New Product Group page.
- Product Shape / Article Group — Shape and article classification. Comes from: chosen on the New Product Group page.
- Supplier — The preferred supplier for the group. Comes from: the supplier marked "Preferred" (name pulled from the linked company).
- Revenue Group — The sales revenue category. Comes from: chosen in the Sales section.
- Scrap / Packaging — Yes/No flags. Comes from: the checkboxes on the form.
- Material Group / Commodity — Material classification and commodity code. Comes from: typed on the form.

 Products — `/products`
What it is: The product catalog — every individual product that can be sold or stocked.
How data gets here: Each row is created on the New Product page.
Columns / fields:
- Product Code — The product's code (links to detail). Comes from: typed on the New Product page.
- Commodity Code — The customs/commodity code. Comes from: typed on the New Product page.
- Product Group — The group this product belongs to. Comes from: chosen on the New Product page (name pulled from the linked group).
- Product — The product's name. Comes from: typed on the New Product page.
- Stock Product / Standard Product — Yes/No flags. Comes from: set on the New Product page.
- Length / Width/Diameter / Thickness — The product's dimensions. Comes from: typed on the New Product page.
- Technical Stock — The technical stock quantity on hand. Comes from: typed on the New Product page.
- StkU / Theor. Weight (kg) / WeightU — Stock unit, theoretical weight, and weight unit. Comes from: typed/chosen on the New Product page.

---

 9. Others

 Complaints — `/complaints`
What it is: A log of customer complaints/claims and how they are being handled.
How data gets here: Each row is created on the New Complaint page.
Columns / fields:
- ID — The complaint's reference number (links to detail). Comes from: assigned automatically when saved.
- Company — The customer the complaint is about. Comes from: chosen on the New Complaint page (name from the linked company).
- Contact — The person at that company. Comes from: chosen on the New Complaint page (list loads after picking the company).
- Type / Category — The kind and category of complaint. Comes from: chosen on the New Complaint page.
- Report Date — The date the complaint was reported. Comes from: entered on the New Complaint page.
- Product — The product the complaint concerns. Comes from: chosen on the New Complaint page (code from the linked product).
