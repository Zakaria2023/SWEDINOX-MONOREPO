# Field glossary — every table and field (Finance tables excluded)

Generated from `apps/dashboard/src/db/schema/*.ts` on 9-10-2026. Each field: name (type or → linked entity): what it does, taken from the comment in the code. Enum fields list their allowed values.

### AddressDistances
- uuid (char)
- companyUuid (→ company)
- country (varchar)
- city (varchar)
- street (varchar)
- postalCode (varchar)
- km (decimal)

### BatchCertificates
_The mill certificate expected for a received batch, and whether it has actually arrived._
- uuid (char)
- batchUuid (→ batch): Null until the goods arrive: a document entered on the purchase order's Product Receipt Documents panel (C19) exists before the batch it certifies.
- kind (enum: dop|certificate|other): Soort — DoP, Certificate or Other.
- purchaseLineReceivalUuid (→ purchaseLineReceival): Ontvangst regel: the reception the document belongs to, when it is tied to one rather than to the whole line.
- purchaseOrderUuid (→ purchaseOrder)
- purchaseOrderItemUuid (→ purchaseOrderItem)
- purchaseLineNumber (int): The purchase line the certified goods came in on, and the reference printed on that line.
- lineReference (varchar)
- billOfLading (varchar)
- documentCertificate (enum: en10204_2_1|en10204_3_1): Which certificate the goods were bought with, and the document itself.
- documentCode (varchar)
- fileName (varchar)
- mandatoryIgnoreDocument (boolean): "Mandatory, ignore document": the certificate is required, but the goods may be released before the file is on hand.
- producer (varchar)
- receivedDate (date): Null until the certificate actually arrives.

### Batches
_A traceable batch of received material._
- uuid (char)
- purchaseOrderUuid (→ purchaseOrder)
- purchaseOrderItemUuid (→ purchaseOrderItem)
- purchaseLineReceivalUuid (→ purchaseLineReceival)
- stockUuid (→ stock)
- productUuid (→ product)
- supplierUuid (→ supplier)
- purchaseOrderCode (varchar)
- receiptDate (date)
- lengthMm (int)
- widthMm (int)
- thicknessMm (decimal)
- qty (decimal)
- unit (enum: kg|st|m1|m2|m3|mm)
- kg (decimal)
- charge (varchar): The mill's own heat number, and the number assigned here.
- internalCharge (varchar)
- sheetNumber (varchar)
- stockCategory (varchar)
- qualityCode (varchar)
- producer (varchar)
- options (varchar)
- documentCode (varchar)
- fileName (varchar)
- mandatoryIgnoreDocument (boolean): "Mandatory, ignore document": the certificate is required, but this batch is allowed to move on without the file being on hand.
- documentCertificate (enum: en10204_2_1|en10204_3_1)

### BranchSettings
_The branch's own settings — the reference's Vestigingsgegevens, which its security profiles prove exists (72 rights, Instellingen Verkoop, Instellingen Financië_
- overduePostBlockDays (int): How many days past its due date the oldest open invoice may be before the credit rule holds a new order.
- affiliateName (varchar): The branch's own legal name — the reference's Affiliate company details column, one constant on every sales and purchase document (HEGO TEST Stainless Steel & A
- updatedByUserId (varchar)

### CapacityChecks
_Capacity checks — the Logistics "Capacity checks" overview._
- uuid (char)
- status (enum: ok|warning|full): Traffic-light "Status" (reuses the production-capacity statuses), the check's name and its type.
- checkName (varchar)
- type (varchar)
- occupiedCapacity (decimal): Capacity figures: occupied, the day's total, the maximum ceiling and the warning threshold.
- capacity (decimal)
- maximumCapacity (decimal)
- warningCapacity (decimal)
- checkDate (date): The day the check applies to ("Date").
- timeAlertEmail (varchar): Alert timing: when the alert email goes out and when the max-warning fires (times of day / thresholds recorded on the check).
- timeMaxWarning (varchar)

### OrderLineCapacityOverflows
_An order line that pushes a capacity check past its ceiling, and what was done about it._
- uuid (char)
- orderItemUuid (→ orderItem)
- capacityCheckUuid (→ capacityCheck)
- action (varchar)
- actionByUserId (varchar): Clerk user id of whoever took the action.
- actionOn (date)
- accountability (varchar): Which department carries the overflow — sales, production or logistics.

### Charges
_Sales charges / surcharges billed on top of the order lines — e.g._
- uuid (char)
- companyUuid (→ company)
- orderUuid (→ order)
- revenueGroupUuid (→ revenueGroup)
- orderType (varchar)
- code (varchar)
- creationDate (date)
- deliveryDate (date)
- surcharge (varchar)
- contract (varchar)
- amount (decimal)
- cost (decimal)
- profit (decimal)
- weightKg (decimal)
- priceFrom (decimal): Surcharge tier: applies between priceFrom and priceTo at price.
- priceTo (decimal)
- price (decimal)
- unit (varchar)
- debtorNo (varchar)
- region (varchar)
- country (varchar)
- vatNumber (varchar)
- status (varchar)

### CommunicationSettings
- companyUuid (→ company)
- shape (enum: pdf|scsn|sales_in_the_construction|edi4steel|text|peppol)
- contactUuid (→ contact): The reference splits the recipient in three: a contact of the company, whose address it then shows, or a Custom contact typed by hand.
- email (varchar)
- fax (varchar)
- modifiedByUserId (varchar)

### Communications
- uuid (char)
- documentType (varchar)
- documentUuid (→ document)
- documentLabel (varchar)
- companyUuid (→ company)
- channel (enum: email|fax|staalweb)
- recipient (varchar)
- subject (varchar)
- sentAt (timestamp)
- deliveredCount (int)
- failedCount (int)
- failureReason (text)
- sentByUserId (varchar)

### Companies
- uuid (char)
- companyName (varchar)
- correspName (varchar)
- lang (enum: dutch|arabic|english)
- remarks (text)
- searchCode1 (varchar)
- searchCode2 (varchar)
- searchCode3 (varchar)
- roles (json)
- customerGroup (enum: warehouse_staff|regional_trade|commission_external|maritime|food_industry|agricultural|water_purification|dealer|equipment_manufacturing_external|contract_work_external|construction|building|…): Sales settings
- sfnRole (enum: producer|sfn_member|non_member): How this counterparty counts in the steel federation (SFN) goods-flow return.
- representative (enum: arian_bloks|bnl|cherice_van_rooyen|export|guy_mambourg|hego)
- accountManager (enum: arian_bloks|bnl|cherice_van_rooyen|export|guy_mambourg|hego)
- region (varchar)
- memberOf (varchar)
- miscellaneousSettings (json)
- deliveryCondition (varchar)
- completeDelivery (boolean): Deliver the whole order in one go, or let it go out in parts.
- printConsignment (boolean): Whether this customer's paperwork is printed rather than emailed.
- requiresCertificate (boolean): Whether this customer requires a material certificate.
- customerSince (date): When the relationship started, as against when the record was made.
- competitors (varchar): Who else sells to this customer.
- devTheorWt (enum: theoretical_weight|trade_weight|german_trade_weight|weighed)
- defTransport (varchar)
- quoteOrderSettings (json)
- quoteOrderInvoiceSettings (json)
- orderSettings (json)
- quoteSettings (json)
- websiteQuoteApprovalAmount (decimal)
- releaseActionPrint (boolean)
- releaseActionEmailEnabled (boolean)
- releaseActionEmailTo (varchar)
- releaseActionFaxEnabled (boolean)
- releaseActionFaxTo (varchar)
- actionPrint (boolean)
- actionEmailEnabled (boolean)
- actionEmailTo (varchar)
- actionFaxEnabled (boolean)
- actionFaxTo (varchar)
- ediSettings (json)
- industry (varchar): Marketing settings industry stores the SBI code (Industries.id); it's a logical reference to the Industries lookup table.
- classification (enum: A|B|C)
- visitFrequency (int)
- callFrequencyPerYear (int)
- targetDateNextVisit (date)
- visitReason (enum: visit_frequency|turnover_is_lagging_behind|complaint|quotation_follow_up|at_customers_request|introduction|potential_customer_prospect)
- potentialAnnualRevenue (decimal)
- targetAnnualRevenue (decimal)
- potentialAnnualSales (decimal)
- targetAnnualSales (decimal)
- numberOfEmployees (int)
- visitPlanning (json)
- debtorNumber (varchar): Debtor fields The ledger's account number for this customer — not the company code.
- creditorNumber (varchar): The payables twin: Creditor 50988 on Quarto's Creditor panel, Cred.No on Purchase invoices — set by the ledger, never typed, like the debtor number (docs/refere
- debtorCompanyUuid (→ debtorCompany)
- iban (varchar)
- bic (varchar)
- bankAccount (varchar)
- postbankAccount (varchar)
- purchaseOrgCompanyUuid (→ purchaseOrgCompany)
- memberNumberPurchaseOrg (varchar)
- calculateVat (boolean)
- reminder (boolean)
- collectInvoicesInMandate (boolean)
- insuranceValidUntil (date)
- creditLimitInsurance (varchar): The credit insurer's policy number, not an amount — 0016184861 on the reference's Debtor panel, leading zeros and all.
- creditLimit (decimal)
- creditLimitUninsured (decimal)
- creditLimitUninsuredDate (date)
- paymentTerms (enum: prepayment|cash|within_7_days_after_invoice_date|within_8_days_from_date_of_invoice|within_10_days_from_date_of_invoice|within_14_days_from_date_of_invoice|within_21_days_after_invoice_date|within_30_days_from_date_of_invoice|within_30_days_end_of_month|within_45_days_from_date_of_invoice|within_60_days_from_date_of_invoice|within_90_days_after_invoice_date|…)
- deliveryTerms (enum: exw|fca|fob|cfr|cif|cpt|cip|dap|dpu|ddp): What a new order for this customer starts out as.
- weightType (enum: theoretical_weight|trade_weight|german_trade_weight|weighed)
- journalCode (int)
- vatNumber (varchar)
- cocNumber (varchar)
- currency (enum: eur|usd|gbp|hkd)
- blockedByUserId (varchar)
- blockedByNote (varchar)
- isInactive (boolean): Manually flagged as inactive — surfaces the company on the Inactive Companies overview regardless of its order history.
- modifiedByUserId (varchar): The Clerk user who last saved this company — the reference's Last modified by, which the Inactive companies overview prints beside updatedAt.
- invoicingMethod (enum: per_delivery|per_order|per_order_line): Invoicing settings (customer)
- collectiveInvoicing (boolean)
- printCommodityCode (boolean)
- invoicePrintEnabled (boolean)
- invoicePrintCount (int)
- invoiceEmailEnabled (boolean)
- invoiceEmailTo (varchar)
- sendXmlWithInvoice (boolean)

### CompanyAddresses
- uuid (char)
- companyUuid (→ company)
- altName (varchar)
- poBox (boolean)
- streetAndNo (varchar)
- postalCode (varchar)
- country (varchar)
- city (varchar)
- region (varchar)
- house (varchar)
- telephone (varchar)
- fax (varchar)
- email (varchar)
- website (varchar)
- billingAttention (varchar)
- billingAttentionAdditional (varchar)
- gln (varchar)
- peppolId (varchar)
- sequenceNumber (int)
- category (json)
- needCrane (boolean)
- canopyRequired (boolean)
- bundleSeparately (boolean)
- addressComplete (boolean)
- specialTransport (boolean)
- unloadingStartTime (time)
- unloadingEndTime (time)
- maxLength (decimal)
- maxBundleWeight (decimal)
- loadingInstructions (text)

### CompanyCompetitors
- uuid (char)
- companyUuid (→ company)
- firm (varchar)
- revenueSharePercent (decimal)
- customerSatisfaction (varchar)
- remarks (varchar)

### ComplaintItems
_One complained-about line of a complaint: which delivered goods, how many, from where._
- uuid (char)
- complaintUuid (→ complaint)
- orderUuid (→ order)
- orderItemUuid (→ orderItem)
- productUuid (→ product)
- warehouseSectionUuid (→ warehouseSection): The section the goods were stored in when the complaint was raised.
- lineNumber (int)
- description (text)
- category (enum: damaged|wrong_price_calculated|wrong_quantity|wrong_material_delivered|delivered_too_late|transport_damage|incorrect_delivery_address)
- complaintType (enum: counter_order|general|order|purchase_order|purchase_quote|quote|return_order)
- deliveryDate (date): When the complained-about goods were delivered — the reference's COMPLAINT_LINE.DELIVERYDATE, taken from the order line.
- billOfLading (varchar): The delivery the goods went out on — Bill of lading on the record's Lines panel (40025: 300302).
- completed (boolean): This line is dealt with, whatever the complaint as a whole still waits on — the reference's COMPLAINT_LINE.COMPLETED.
- createdByUserId (varchar)
- purchaserSeller (varchar): The buyer or seller the line belongs to, copied from the order.
- correspondenceName (varchar)
- qtyDelivered (decimal): Qty(a): what that delivery brought, in unit.
- unit (enum: kg|st|m1|m2|m3|mm)
- qty (decimal): Qty(shortfall): the part of the delivery in dispute — 9 of 14 on 40025, and 0 on a line listed only to say which delivery is meant (40043).
- exchangeProductUuid (→ exchangeProduct): A product the customer gets instead (Exchange product).
- amount (decimal)
- weightKg (decimal)

### Complaints
- uuid (char)
- companyUuid (→ company)
- contactUuid (→ contact)
- complaintType (enum: counter_order|general|order|purchase_order|purchase_quote|quote|return_order)
- orderUuid (→ order): The document the complaint is about.
- quoteUuid (→ quote)
- counterOrderUuid (→ counterOrder)
- purchaseOrderUuid (→ purchaseOrder)
- purchaseQuoteUuid (→ purchaseQuote)
- returnOrderUuid (→ returnOrder)
- report (enum: telephone|email|counter|representative|oral|website|edi|ai_read_email)
- reportDate (date)
- description (text)
- category (enum: damaged|wrong_price_calculated|wrong_quantity|wrong_material_delivered|delivered_too_late|transport_damage|incorrect_delivery_address)
- productUuid (→ product)
- qty (decimal)
- qtyUnit (enum: kg|st|m1|m2|m3|mm): The unit the quantity is in — a dropdown beside Qty on the reference.
- amount (decimal)
- weight (decimal)
- status (enum: new|in_progress|on_hold|done)
- responsibleUserId (varchar)
- createdByUserId (varchar): "Recorded by … on …; last changed by … on …" heads the reference's record, and Captured by is a column of both overviews.
- modifiedByUserId (varchar)
- deadline (date)
- cause (enum: warehouse|production|purchasing|sale|transportation|customer|supplier|processor)
- explanationOfCause (text)
- solution (enum: collect_goods_back_credit|return_goods_credit_redeliver|price_correction|subsequent_delivery|complaint_rejected|material_retained_correct_delivery)
- explanationOfSolution (text)
- costsCustomer (decimal)
- costsCustomerNote (varchar)
- internalCosts (decimal)
- internalCostsNote (varchar)
- extraCosts (decimal)
- extraCostsNote (varchar)
- toBeReclaimed (decimal)
- toBeReclaimedNote (varchar)
- statusHistory (json): Snapshot of every status change; assignedBy* records who made it.

### Contacts
_A contact person: the person's own name, phones, email, postal details, categories and sequence._
- uuid (char)
- companyUuid (→ company)
- salutation (enum: mr|mrs)
- firstName (varchar)
- initials (varchar)
- lastName (varchar)
- telephone (varchar)
- mobile (varchar)
- fax (varchar)
- email (varchar)
- address (varchar)
- categoryAddition (varchar)
- btwNumber (varchar)
- country (varchar)
- postal (varchar)
- house (varchar)
- poBox (boolean)
- streetAndNo (varchar)
- annex (varchar)
- postalCode (varchar)
- city (varchar)
- region (varchar)
- addressCountry (varchar)
- addressTelephone (varchar)
- addressFax (varchar)
- addressEmail (varchar)
- website (varchar)
- categories (json)
- sequenceNumber (int)

### ContractNetPrices
_The agreed price of one product under one contract — what the customer actually pays once the contract's discounts have been taken off the product's base price._
- uuid (char)
- contractUuid (→ contract)
- productUuid (→ product)
- netPrice (decimal)
- netPriceUnit (enum: HK|HM|HS|KG|M1|M2|Theor. Weight|Theor. Weight U.|M3|MM|ST|TN)
- discountPercent (decimal): The total discount that got from the base price to this net price, kept so the overview can explain the number without re-deriving it.
- fromQty (decimal)
- fromQtyUnit (enum: HK|HM|HS|KG|M1|M2|Theor. Weight|Theor. Weight U.|M3|MM|ST|TN)
- validFrom (date)
- validUntil (date)

### ContractGroups
- uuid (char)
- name (varchar)
- description (varchar)
- contractSubgroupUuid (→ contractSubgroup)
- sequenceWithinSubgroup (int)
- quicklyChangeSequenceNumber (varchar)
- isActive (boolean)

### Contracts
- uuid (char)
- companyUuid (→ company)
- orderUuid (→ order)
- counterOrderUuid (→ counterOrder)
- purchaseOrderUuid (→ purchaseOrder)
- role (enum: customer|prospect|supplier|processor)
- code (varchar)
- contractType (enum: gross_prices|options|net_prices|cost_price|surcharges|allowances)
- description (varchar)
- contractGroupUuid (→ contractGroup)
- quicklyChangeOrder (varchar)
- hasPriceDate (boolean)
- priceDate (varchar)
- linkToNewCustomer (boolean)
- startingDate (varchar)
- endDate (varchar)
- salesKg (float)
- revenue (float)
- maxWeightKg (float)
- searchCode1 (varchar)
- searchCode2 (varchar)
- searchCode3 (varchar)
- websiteSorting (int)
- hideOnWebsite (boolean)
- grossPrice (boolean): Details tab — Gross prices
- grossPriceValue (decimal)
- colorSurcharge (boolean): Details tab — Color surcharge
- colorSurchargeValue (decimal)
- colorSurchargeUnit (varchar)
- extraDiscount (boolean): Details tab — Extra discount
- extraDiscountValue (decimal)
- extraDiscountUnit (varchar)
- extraDiscountFromValue (decimal)
- extraDiscountFromUnit (varchar)
- quantitySurcharge (boolean): Details tab — Quantity surcharge
- quantitySurchargeDiscountUnit (varchar)
- quantitySurchargeTiers (json)
- lineDiscount (boolean): Details tab — Line discount
- lineDiscountDiscountUnit (varchar)
- lineDiscountTiers (json)
- groupDiscount (boolean): Details tab — Group discount
- groupDiscountDiscountUnit (varchar)
- groupDiscountTiers (json)
- groupDiscountProductGroupUuid (→ groupDiscountProductGroup)

### CountListDeviations
_Count-list deviation — the Logistics "Deviations in count lists" overview._
- uuid (char)
- workOrderNumber (varchar): The count workorder this deviation was booked under, its date, and who booked it ("Workorder #", "Workorder date", "Booked by").
- workOrderDate (date)
- bookedBy (varchar)
- location (varchar): Where the item was counted ("Location") and the product counted — backs the Product and Length (mm) columns via join.
- productUuid (→ product)
- quantity (decimal): The correction itself: quantity ("Qty."), its unit ("U."), weight ("Kg."), value ("Amount") and the source document ("Document").
- unit (enum: kg|st|m1|m2|m3|mm)
- kg (decimal)
- amount (decimal)
- documentReference (varchar)
- oldStockQty (decimal): Stock before vs.
- oldStockKg (decimal)
- newStockQty (decimal)
- newStockKg (decimal)
- dateReportedAsCompleted (date): "Date reported as completed".

### CounterOrders
- uuid (char)
- companyUuid (→ company)
- contactUuid (→ contact)
- customerRef (varchar)
- leaveCustomer (boolean)
- orderMethod (enum: telephone|email|counter|representative|oral|website|edi|ai_read_email)
- ourReference (varchar)
- seller (varchar)
- projectUuid (→ project)
- status (enum: open|in_progress|delivered|invoiced|cancelled)
- priority (enum: normal|rush)
- priceDate (date)
- orderDate (date)
- handlingBlocked (boolean)
- printPickingSlips (boolean)
- isPickup (boolean)
- isIncidental (boolean)
- isOverlength (boolean)
- mustBeSent (boolean): Whether the document is meant to go to the customer at all, and whether somebody deliberately held it back.
- deliberatelyNotSent (boolean)
- isPrinted (boolean)
- isMailed (boolean)
- isFaxed (boolean)
- deliveryTerms (enum: exw|fca|fob|cfr|cif|cpt|cip|dap|dpu|ddp)
- deliveryAddressUuid (→ deliveryAddress)
- deliveryType (enum: date|week)
- deliveryDate (date)
- deliveryWeek (int)
- deliveryYear (int)
- deliveryRemark (varchar)
- completeDelivery (boolean)
- transportBlockage (boolean)
- vehicleWithCrane (boolean)
- vehicleWithCanopy (boolean)
- bundlingSeparate (boolean)
- transportRegion (enum: azie|bal|bel|dui|eng|fra|ita|lux|ned|oe|sp_po|zd_am)
- maxLengthMm (int)
- maxBundleWeightKg (decimal)
- deliveryAfterTime (varchar)
- deliverForTime (varchar)
- transportMode (enum: sea_transport|rail_transport|road_transport|air_transport|postal_shipments|fixed_transport_facilities|inland_waterway_transport|own_power)
- showNetPrice (boolean)
- scrapSurchargeSeparate (boolean)
- calculateVatIfApplicable (boolean)
- financialBlockage (boolean)
- invoiceBlockage (boolean)
- onlyTotalAmountOnInvoice (boolean)
- paymentTerms (enum: prepayment|cash|within_7_days_after_invoice_date|within_8_days_from_date_of_invoice|within_10_days_from_date_of_invoice|within_14_days_from_date_of_invoice|within_21_days_after_invoice_date|within_30_days_from_date_of_invoice|within_30_days_end_of_month|within_45_days_from_date_of_invoice|within_60_days_from_date_of_invoice|within_90_days_after_invoice_date|…)
- billingAddressUuid (→ billingAddress)
- blockingReason (varchar)
- amountExVat (decimal)
- weightKg (decimal)
- gainPercent (decimal)
- remarks (text)

### CounterOrderSurcharges
- uuid (char)
- counterOrderUuid (→ counterOrder)
- companyUuid (→ company)
- order (int)
- description (enum: project_discount|certificate_costs|cutting_surcharge|decoil_surcharge|order_surcharge|packaging_surcharge|pallet_surcharge|administration_costs|transport_costs|transport_costs_internal|maut_costs|return_costs|…)
- surcharge (decimal)
- unit (varchar)
- fromValue (decimal)
- unitIndication (varchar)
- tierUnit (enum: TN|Euro)
- amount (decimal)
- profit (decimal)
- thirdParties (boolean)
- companyCode (varchar)

### CounterOrderItems
_Line items of a counter order ("Order lines")._
- uuid (char)
- counterOrderUuid (→ counterOrder)
- productUuid (→ product)
- lineNumber (int)
- quoteLine (int)
- status (enum: provisional|released|checked|in_progress|partially_delivered|partially_invoiced|invoiced|completed|partially_received|received|expired|cancelled)
- deliveryDate (date)
- description (varchar)
- levCode (varchar)
- reference (varchar)
- unit (enum: kg|st|m1|m2|m3|mm)
- qtyPlanned (decimal)
- qtyActual (decimal)
- lengthMm (int)
- kgPlanned (decimal)
- kgActual (decimal)
- grossPrice (decimal)
- priceUnit (varchar)
- lineDiscount (decimal)
- groupDiscount (decimal)
- commercialDiscount (decimal)
- netPrice (decimal)
- amount (decimal)
- costs (decimal)
- profitAmount (decimal)
- profitPercent (decimal)
- profitTooLow (boolean)

### CustomerProjects
- uuid (char)
- companyUuid (→ company)
- contractUuid (→ contract)
- projectName (varchar)
- startingDate (date)
- endDate (date)
- revenue (decimal)
- daysInSystem (int)

### CustomerStock
_Stock a customer keeps booked at one of our locations._
- uuid (char)
- companyUuid (→ company)
- location (varchar)
- productUuid (→ product)
- productCode (varchar)
- productName (varchar)
- quantity (decimal)
- reason (enum: initial_stock|correction|counting_difference|damaged|return_from_customer|transfer|other)
- description (text)

### FollowUps
_Company-scoped follow-ups (customer follow-up log)._
- uuid (char)
- companyUuid (→ company)
- date (varchar)
- by (varchar)
- contactPerson (varchar)
- text (text)
- completed (boolean)

### FreightMovements
_Freight movement — the goods-flow ledger behind the Logistics "Freight movement" overview._
- uuid (char)
- mutationDate (timestamp): "Mutation date / time" and the operator ("Mutation operator") who triggered it.
- mutationOperator (varchar)
- productUuid (→ product): Product being moved — backs the Product code, Description, Length (mm), Width (mm), Standard product and Stock product columns via join.
- mutationQuantity (decimal): "MutationQty" and the stock unit it is counted in ("StkU").
- stockUnit (enum: kg|st|m1|m2|m3|mm)
- reason (enum: purchase_receipt|invoice_consumption|purchase_order_cancelled|invoice_cancelled|sale_consumption|sale_invoice_cancelled|manual_correction|count_correction|damaged|production_input|production_output|production_remnant|…): "Mutation reason" — reuses the stock-movement reason vocabulary.
- internalCharge (varchar): "Internal charge" cost-centre code and the referenced work order.
- workOrderNumber (varchar)
- startDate (date): Running-balance window: quantity and value of stock before ("Starting stock") and after ("Closing stock") this mutation.
- startingStockQty (decimal)
- startingStockValue (decimal)
- endDate (date)
- closingStockQty (decimal)
- closingStockValue (decimal)
- generalLedger (varchar): Accounting dimensions — "General ledger" account and the revenue group this mutation posts to.
- revenueGroupUuid (→ revenueGroup)
- companyUuid (→ company): "Company" / "Company code" and the sales "Order" the movement serves.
- orderUuid (→ order)
- text (varchar): Free-text remark shown in the "Text" column.
- chargeUuid (→ charge): "Charge" reference.
- purchaseOrderUuid (→ purchaseOrder): Purchase side — the "Purchase order", "Receipt date" and "Supplier".
- receiptDate (date)
- supplierUuid (→ supplier)

### Industries
- name (varchar)

### InvoiceItems
- uuid (char)
- invoiceUuid (→ invoice)
- orderItemUuid (→ orderItem): The reservation this line bills — always invoiced in full.
- productUuid (→ product)
- lineNumber (int): The number this line prints under, taken from the order line it bills rather than from a counter of its own — so invoice 501106 carries lines 60, 70 and 80 and
- type (enum: debit|credit): Whether this line charges or refunds.
- description (varchar)
- deliveryDate (date): The day the goods this line bills actually went out.
- quantity (decimal)
- unit (enum: kg|st|m1|m2|m3|mm)
- lengthMm (int)
- widthMm (int)
- thicknessMm (decimal)
- priceQty (decimal): The line is priced per unit of priceUnit, and priceQty is how many of that unit this line bills — 64 pieces weighing 1209,6 kg invoice as 1,2096 TN.
- priceUnit (varchar)
- grossPrice (decimal)
- lineDiscount (decimal)
- lineDiscountUnit (enum: percent|amount): The RdU and GdU columns: what the two discounts beside them are denominated in.
- groupDiscount (decimal)
- groupDiscountUnit (enum: percent|amount)
- netPrice (decimal)
- amount (decimal)
- costPrice (decimal): An invoice is the financial record of a sale, so it has to be able to say on its own what it was worth and what it made.
- costAmount (decimal)
- replacementPrice (decimal)
- profit (decimal)
- profitMargin (decimal)
- revenueProducts (decimal): The reference bills both on one line and then splits them, so a line's revenue and profit each come in three: products, options, and the sum.
- revenueOptions (decimal)
- profitProducts (decimal)
- profitOptions (decimal)
- profitReplPrice (decimal)
- weightKg (decimal)
- charge (varchar): The melt the billed metal came from, the purchase order that bought it and the day it was received.
- purchaseOrderNumber (varchar)
- receiptDate (date)
- printed (boolean): Not per invoice: the reference stamps each line with its own print and mail state, address included.
- printedAt (timestamp)
- mailed (boolean)
- mailedAt (timestamp)
- mailedTo (varchar)

### Invoices
- uuid (char)
- companyUuid (→ company)
- debtorNo (varchar)
- documentType (enum: invoice|credit_note|surcharge|correction): A credit note is this same document with its amounts negated, so it ages, posts and settles through exactly the same machinery.
- returnOrderUuid (→ returnOrder): What the credit note credits: the goods that came back, and the invoice they were billed on.
- creditsInvoiceUuid (→ creditsInvoice)
- invoiceDate (date)
- expirationDate (date)
- invoiceAmountExclVat (decimal)
- invoiceAmountInclVat (decimal)
- creditRestriction (decimal)
- invoiceTotal (decimal)
- outstanding (decimal)
- materialsRevenue (decimal): Rolled up from the invoice lines when the invoice is raised, in the same shape the order header stores, so the two documents report their worth identically and
- materialsProfit (decimal)
- materialsProfitReplPrice (decimal)
- surchargesRevenue (decimal)
- surchargesProfit (decimal)
- avgKiloPrice (decimal)
- totalWeightKg (decimal)
- calculateVat (boolean)
- printed (boolean)
- printedAt (timestamp): When it was printed and when it was e-mailed, and to whom.
- mailed (boolean)
- mailedAt (timestamp)
- mailedTo (varchar)
- cancelled (boolean)
- vatScenario (enum: purchase_domestically|domestic_purchase_vat_shifted|purchase_within_eu_with_reverse_charge|purchase_outside_eu_with_reverse_charge|domestic_sales|sales_within_eu_with_reverse_charge|sales_outside_eu_with_reverse_charge)
- paymentTerms (enum: prepayment|cash|within_7_days_after_invoice_date|within_8_days_from_date_of_invoice|within_10_days_from_date_of_invoice|within_14_days_from_date_of_invoice|within_21_days_after_invoice_date|within_30_days_from_date_of_invoice|within_30_days_end_of_month|within_45_days_from_date_of_invoice|within_60_days_from_date_of_invoice|within_90_days_after_invoice_date|…)
- explanation (text)

### InvoiceSurcharges
_TODO: Revisit this in the future, as we may want to add these fields to the Invoices table instead of having a separate table for surcharges._
- uuid (char)
- invoiceUuid (→ invoice)
- order (int)
- description (enum: project_discount|certificate_costs|cutting_surcharge|decoil_surcharge|order_surcharge|packaging_surcharge|pallet_surcharge|administration_costs|transport_costs|transport_costs_internal|maut_costs|return_costs|…)
- surcharge (decimal)
- unit (varchar)
- surchargePercentage (decimal)
- amount (decimal)
- profit (decimal): What the surcharge earns after what it cost to provide — freight bought in, outsourced cutting.

### Machines
- uuid (char)
- code (varchar)
- name (varchar)
- option (enum: decoiling|grinding|shear_cut|laser|duplo|brushing|blue_foil|laser_foil|uv_foil|remove_foil|anodizing|pickling|…)
- production (enum: decoiler|internal_processing|shearing|laser_1|laser_2|grinding_foiling)
- loading (enum: load)
- stockLocationUuid (→ stockLocation)
- remarks (text)
- minLengthMm (int)
- maxLengthMm (int)
- outOfBusiness (boolean)
- outOfBusinessFrom (date)
- outOfBusinessUntil (date)
- averageDailyCapacity (int)
- warningPercentage (int)

### MachineProducts
- uuid (char)
- machineUuid (→ machine)
- productUuid (→ product)
- productGroupUuid (→ productGroup)
- productCode (varchar): Snapshot of the picked product/group, mirroring how a company keeps its own copy rather than referencing the catalog row directly.
- description (varchar)
- preference (int)
- productionPerHour (int)
- prodUnit (varchar)
- minCorner (decimal)
- maxCorner (decimal)
- daysInSystem (int)

### MachinePostProcessings
- uuid (char)
- machineUuid (→ machine)
- option (enum: decoiling|grinding|shear_cut|laser|duplo|brushing|blue_foil|laser_foil|uv_foil|remove_foil|anodizing|pickling|…)
- preference (int)
- daysInSystem (int)

### Nesting
_Nesting ("Nesten") — the Logistics nesting overview: the sheet-metal counterpart to sawing layouts._
- uuid (char)
- orderItemUuid (→ orderItem): The order line this nest belongs to.
- quality (varchar): Material qualification shown on this report ("Kwaliteit" / "Categorie").
- category (varchar)
- sawingSpec (boolean): Flags: sawing-spec required and fixed dimension.
- fixedDimension (boolean)
- toSaw (decimal): Amount still to saw and the sawing work-order status ("New").
- sawingWorkOrderStatus (varchar)
- productionStartingDate (date): Production/delivery planning: start date, planned/delivered quantities and their unit, planned/actual delivery dates and the delivery status.
- plannedDeliveredQty (decimal)
- deliveredQty (decimal)
- deliveryUnit (varchar)
- deliveryDatePlanned (date)
- deliveryDateActual (date)
- deliveryStatus (varchar)
- optionQty (decimal): Option quantity for this line ("Option Qty").
- sawingWorkOrder (varchar): Nesting/sawing plan: the sawing work order and its line, the nest and the sawing machine ("LASER 1").
- sawingWorkOrderLine (varchar)
- nest (varchar)
- sawingMachine (varchar)
- drillingHoles (int): Sawing geometry: drill-hole count, left/right saw angles, bundles ("Bls"), whether it saws standing, the sawing type and the raw angle spec.
- leftSawAngle (decimal)
- rightSawAngle (decimal)
- bundles (decimal)
- standing (boolean)
- sawingType (varchar)
- sawingAngles (varchar)
- transportDate (datetime): When the nested material is transported.
- fetchDate (date): Fetch side — retrieving the raw sheet from stock to feed the nest: date, code, line, status, quantity, product/description, the raw length and the residual leng
- fetchCode (varchar)
- fetchLine (int)
- fetchStatus (varchar)
- fetchQty (decimal)
- fetchProduct (varchar)
- fetchDescription (varchar)
- fetchLength (decimal)
- residualLength (decimal)

### OrderCallOffs
_One call-off against a Call-off order: the customer ringing for part of what was ordered._
- uuid (char)
- orderUuid (→ order)
- customerRef (varchar)
- deliveryAddressUuid (→ deliveryAddress)
- isRush (boolean)
- isSent (boolean): The reference's IsSend — whether the call-off went to the customer.
- modifiedByUserId (varchar)

### OrderDeblocks
_Audit trail of order block releases._
- uuid (char)
- orderUuid (→ order)
- deblockType (enum: financial|commercial)
- deblockedByUserId (varchar)

### OrderItemOptions
_An option actually charged on an order line — the processing the customer is billed for on top of the material._
- uuid (char)
- orderUuid (→ order)
- orderItemUuid (→ orderItem)
- optionUuid (→ option)
- revenueGroupUuid (→ revenueGroup)
- lineStatus (enum: provisional|released|checked|in_progress|partially_delivered|partially_invoiced|invoiced|completed|partially_received|received|expired|cancelled): Copied from the order line, so the overview can split revenue by how far the line has got without re-joining.
- quantity (decimal)
- unit (enum: kg|st|m1|m2|m3|mm)
- weightKg (decimal)
- price (decimal)
- priceUnit (varchar)
- costPrice (decimal)
- amount (decimal): Line totals: revenue billed, cost incurred and the difference.
- cost (decimal)
- profit (decimal)

### OrderItems
- uuid (char)
- orderUuid (→ order)
- stockUuid (→ stock): The lot this line is cut from.
- productUuid (→ product)
- quantity (decimal): Amount reserved from stockUuid — never changes after creation.
- invoicedQuantity (decimal): How much of that quantity has been billed.
- status (enum: reserved|delivered|invoiced|returned|cancelled)
- lineNumber (int)
- lineType (varchar): Ours: material and its siblings.
- sourceType (enum: stock|stock_and_cross_dock|cross_dock|ex_works): Where this line's metal comes from — the reference's Line type, and the Order type column on its revenue screens once it is rolled up.
- purchaseOrderItemUuid (→ purchaseOrderItem): The purchase line that covers a cross-docked sale.
- seller (varchar)
- lineStatus (enum: provisional|released|checked|in_progress|partially_delivered|partially_invoiced|invoiced|completed|partially_received|received|expired|cancelled)
- deliveryStatus (enum: new|workorders_created|in_progress|ready|released|partially_delivered|completed|invoiced|expired)
- deliveryDate (date)
- reservationDate (date)
- isPickup (boolean)
- lastWarehouseWorkOrder (varchar)
- commercialShortfall (boolean): Sold below an agreed commercial minimum.
- commercialBlock (boolean)
- financialBlock (boolean)
- transportBlock (boolean)
- blockingReason (varchar)
- unit (enum: kg|st|m1|m2|m3|mm)
- lengthMm (int)
- widthMm (int)
- thicknessMm (decimal)
- options (varchar)
- qtyPlanned (decimal)
- qtyActual (decimal)
- qtyCallOff (decimal)
- kgPlanned (decimal)
- kgActual (decimal)
- kgCallOff (decimal)
- qtyReserved (decimal)
- kgReserved (decimal)
- purchaseOrderUuid (→ purchaseOrder)
- qtyPurchased (decimal)
- kgPurchased (decimal)
- basePrice (decimal): The build-up, left column of the reference's Pricing panel.
- quantitySurcharge (decimal)
- colorSurcharge (decimal)
- lengthSurcharge (decimal): Lengtetoeslag on the reference panel — charged on lengths that are awkward to cut, handle or load rather than on the metal itself.
- grossPrice (decimal)
- priceUnit (varchar)
- lineDiscount (decimal): The cascade down, right column of the same panel.
- extraDiscount (decimal)
- groupDiscount (decimal)
- lineDiscountUnit (enum: percent|amount): What the two discount figures above are denominated in.
- groupDiscountUnit (enum: percent|amount)
- netPrice (decimal)
- amount (decimal)
- costPrice (decimal): An order line is allocated to a specific stock lot, so unlike a quote it knows exactly what the goods cost: the lot's own valuation price.
- costAmount (decimal)
- replacementPrice (decimal)
- profit (decimal)
- profitMargin (decimal)
- profitReplPrice (decimal)
- profitFsp (decimal): The third basis the reference measures a line against.
- profitTooLow (boolean): Flagged when the line's margin falls under the product group's floor.

### Orders
- uuid (char)
- companyUuid (→ company)
- contactUuid (→ contact)
- orderMethod (enum: telephone|email|counter|representative|oral|website|edi|ai_read_email)
- customerRef (varchar)
- leaveCustomer (boolean)
- ourReference (varchar)
- seller (varchar)
- projectUuid (→ project)
- priceDate (date)
- orderCategory (varchar)
- handlingBlocked (boolean)
- status (enum: provisional|released|checked|in_progress|partially_delivered|delivered|partially_invoiced|invoiced|completed|converted|received|expired|…): The reference's first rung: a freshly typed document that nobody has released.
- orderType (enum: normal|call_off|rush|ex_works): The Normal dropdown at the top of the reference's own order-type block.
- callOffPeriodFrom (date): The window a Call-off order's call-offs fall in — 17-2-2025 t/m 17-2-2025 on 100785 (7-10-2026).
- callOffPeriodTo (date)
- isPickup (boolean)
- isIncidental (boolean)
- isConsignment (boolean)
- consignmentDuration (varchar)
- isInternalProduction (boolean)
- isCustomerMaterial (boolean)
- weightType (enum: theoretical_weight|trade_weight|german_trade_weight|weighed)
- isOverlength (boolean)
- mustBeSent (boolean): Whether the document is meant to go to the customer at all, and whether somebody deliberately held it back.
- deliberatelyNotSent (boolean)
- isPrinted (boolean)
- isMailed (boolean)
- isFaxed (boolean)
- deliveryTerms (enum: exw|fca|fob|cfr|cif|cpt|cip|dap|dpu|ddp): Disabled when isPickup = true
- deliveryAddressUuid (→ deliveryAddress)
- deliveryType (enum: date|week)
- deliveryDate (date)
- deliveryWeek (int)
- deliveryYear (int)
- deliveryRemark (varchar)
- completeDelivery (boolean)
- transportBlockage (boolean)
- vehicleWithCrane (boolean)
- vehicleWithCanopy (boolean)
- bundlingSeparate (boolean)
- transportRegion (varchar)
- maxLengthMm (int)
- maxBundleWeightKg (decimal)
- deliveryAfterTime (varchar)
- deliverForTime (varchar)
- transportMode (varchar)
- showNetPrice (boolean)
- scrapSurchargeSeparate (boolean)
- calculateVatIfApplicable (boolean)
- financialBlockage (boolean)
- financialBlockManual (boolean): Set by hand on the order form rather than by the credit rule.
- invoiceBlockage (boolean): The order was edited after a financial release.
- onlyTotalAmountOnInvoice (boolean)
- paymentTerms (enum: prepayment|cash|within_7_days_after_invoice_date|within_8_days_from_date_of_invoice|within_10_days_from_date_of_invoice|within_14_days_from_date_of_invoice|within_21_days_after_invoice_date|within_30_days_from_date_of_invoice|within_30_days_end_of_month|within_45_days_from_date_of_invoice|within_60_days_from_date_of_invoice|within_90_days_after_invoice_date|…)
- billingAddressUuid (→ billingAddress)
- blockingReason (varchar)
- materialsRevenue (decimal): The same rollup a quote header carries, so an order reports its worth without every overview having to re-aggregate its lines — and so the margin recorded on th
- materialsProfit (decimal)
- materialsProfitReplPrice (decimal)
- surchargesRevenue (decimal)
- surchargesProfit (decimal)
- totalExclVat (decimal)
- vatAmount (decimal)
- totalInclVat (decimal)
- avgKiloPrice (decimal)
- totalWeightKg (decimal)
- transportCosts (decimal): Two costs that sit on the summary and earn nothing — they reduce the order's profit without touching its revenue, which is why they are beneath the three revenu
- handlingCosts (decimal)
- remarks (text)

### OrderSurcharges
- uuid (char)
- orderUuid (→ order)
- companyUuid (→ company)
- order (int)
- description (enum: project_discount|certificate_costs|cutting_surcharge|decoil_surcharge|order_surcharge|packaging_surcharge|pallet_surcharge|administration_costs|transport_costs|transport_costs_internal|maut_costs|return_costs|…)
- surcharge (decimal)
- unit (varchar)
- fromValue (decimal)
- unitIndication (varchar)
- tierUnit (enum: TN|Euro)
- amount (decimal)
- profit (decimal)
- thirdParties (boolean)
- companyCode (varchar)

### PickStatistics
_Pick statistic — the Logistics "Pick statistic" overview._
- uuid (char)
- productUuid (→ product)
- year (int): The period the picks were completed in ("Year" / "Month").
- month (int)
- picks (int): "Picks" (count), "Qty.
- quantityPicked (decimal)
- unit (enum: kg|st|m1|m2|m3|mm)
- kgPicked (decimal)

### Processings
_Processing options a processor company offers._
- uuid (char)
- companyUuid (→ company)
- editing (enum: stamping|polished|paper_interleaving|pickling|laser|blue_foil|bending|uv_foil|rolling|anodizing|slitting|brushing|…)
- preference (boolean)
- supplierUuid (→ supplier)
- deliveryTime (int)
- deliveryTimeUnit (enum: months|weeks|working_days)
- processorLocation (varchar)

### ProductAlternatives
_── Alternatives ──────────────────────────────────────────────────────────── Products that may be supplied in place of this one._
- uuid (char)
- productUuid (→ product)
- alternativeProductUuid (→ alternativeProduct)
- description (varchar)

### ProductSuppliers
_── Suppliers ─────────────────────────────────────────────────────────────── Who this article can be bought from, and on what terms._
- uuid (char)
- productUuid (→ product)
- supplierUuid (→ supplier)
- preferred (boolean)
- ean (varchar)
- externalProductCode (varchar)
- editing (varchar)
- deliveryTime (int)
- deliveryTimeUnit (enum: months|weeks|working_days)
- minOrderQty (decimal)
- minOrderQtyUnit (enum: HK|HM|HS|KG|M1|MM|ST|TN)
- orderSeries (decimal)
- orderSeriesUnit (enum: HK|HM|HS|KG|M1|MM|ST|TN)

### ProductPreferredLocations
_── Preferred locations ───────────────────────────────────────────────────── Where this article is meant to live in the warehouse, in preference order, with the_
- uuid (char)
- productUuid (→ product)
- locationUuid (→ location)
- restockLocationUuid (→ restockLocation)
- preference (int)
- locationType (enum: pick|bulk|production|scrap|load|inspection|put_away|sorting|processing|collection|call_off)
- restockLevel (decimal)
- restockLevelUnit (enum: HK|HM|HS|KG|M1|M2|Theor. Weight|Theor. Weight U.|M3|MM|ST|TN)
- restockQty (decimal)
- restockQtyUnit (enum: HK|HM|HS|KG|M1|M2|Theor. Weight|Theor. Weight U.|M3|MM|ST|TN)

### ProductPriceStructures
_── Price structures ──────────────────────────────────────────────────────── The material price for a product over a validity window._
- uuid (char)
- productUuid (→ product)
- validFrom (date)
- validUntil (date)
- basePrice (decimal)
- markup (decimal)
- scrap (decimal)
- priceUnit (enum: HK|HM|HS|KG|M1|MM|ST|TN)
- quantitySurchargeEnabled (boolean)
- quantitySurchargeTiers (json)
- groupDiscountEnabled (boolean)
- groupDiscountBasis (enum: order_line|group_product|product_group)
- groupDiscountTiers (json)
- lengthSurchargeEnabled (boolean)
- lengthSurchargeTiers (json)
- qualitySurchargeEnabled (boolean)
- qualitySurchargeTiers (json)
- lineDiscountEnabled (boolean)
- lineDiscountTiers (json)

### ProductSawingPrices
_── Sawing prices ─────────────────────────────────────────────────────────── What cutting this article costs, over its own validity window._
- uuid (char)
- productUuid (→ product)
- validFrom (date)
- validUntil (date)
- basePrice (decimal)
- priceUnit (enum: HK|HM|HS|KG|M1|MM|ST|TN)
- mitreSurchargeEvenPct (decimal)
- mitreSurchargeUnevenPct (decimal)
- quantityDiscountEnabled (boolean)
- quantityDiscountTiers (json)
- lengthSurchargeEnabled (boolean)
- lengthSurchargeTiers (json)

### ProductAppHistory
_── Valuation history ─────────────────────────────────────────────────────── Every average-purchase-price the article has carried._
- uuid (char)
- productUuid (→ product)
- startDate (date)
- endDate (date)
- averagePurchasePrice (decimal)
- reference (varchar)

### ProductFspHistory
_Every fixed settlement price the article has been valued at, with the stock position at the moment it changed — that is what makes a revaluation reproducible af_
- uuid (char)
- productUuid (→ product)
- startDate (date)
- endDate (date)
- fsp (decimal)
- replacementPrice (decimal)
- fictitiousOrderQuantity (decimal)
- internalSurcharge (decimal)
- externalSurcharge (decimal)
- stockQuantity (decimal)
- stockUnit (enum: HK|HM|HS|KG|M1|M2|Theor. Weight|Theor. Weight U.|M3|MM|ST|TN)
- stockKg (decimal)
- priceUnit (enum: HK|HM|HS|KG|M1|MM|ST|TN)

### ProductGroupSuppliers
_The suppliers that can deliver a product group, one row per supplier._
- uuid (char)
- productGroupUuid (→ productGroup)
- supplierCompanyUuid (→ supplierCompany): A Companies row holding the "supplier" role.
- preferred (boolean)
- ean (varchar)
- externalProductCode (varchar)
- editing (varchar)
- deliveryTime (int)
- deliveryTimeUnit (enum: months|weeks|working_days)
- moq (decimal)
- moqUnit (enum: HK|HM|HS|KG|M1|MM|ST|TN)
- orderSeries (int)
- orderSeriesUnit (enum: HK|HM|HS|KG|M1|MM|ST|TN)

### ProductGroups
- uuid (char)
- parentUuid (→ parent)
- name (varchar)
- productShape (enum: bar_steel|coil|piece_article|sheet|tube|beam_steel|profile)
- groupLongDesc (text)
- groupShortDesc (varchar)
- productShapeDesc (varchar)
- materialGroup (varchar)
- commodity (varchar)
- scrap (boolean)
- packaging (boolean)
- searchCode1 (varchar)
- searchCode2 (varchar)
- searchCode3 (varchar)
- articleGroup (enum: ck304|ck316|ck430|ckm304|pdiva|pk304|pta2_5|pta3|pta3_5|pta5|pw304|pw316|…)
- length (decimal): Dimensions (visible when product shape is selected)
- width (decimal)
- thickness (decimal)
- decimalPlaces (enum: 0|1|2): View features
- printDimensions (boolean)
- weight (decimal): Features
- paintSurface (decimal)
- featuresQuality (enum: 115CrV3|11SMn30+C/SH|11SMnPb30+C/SH|300-serie|301|303|304|3041D|3042B|3042BB|3042D|3042E|…)
- weightTheoretical (decimal): Weights
- weightTrade (decimal)
- weightGerman (decimal)
- standardsQuality (enum: en_10025_2|en_10219_1): Standards
- tolerance (enum: en_10025_2|en_10219_1)
- ce (enum: en_10255|en_10219_1|en_10210_1|en_10025_1)
- options (json): Options (free list)
- processedOption (enum: D|SL|K|LSR|DUP|NG|BF|L|F|FV|ANO|BEI|…): Processed
- sourceProduct (varchar)
- industryNumber (varchar): Industry
- purchasingUnit (enum: HK|HM|HS|KG|M1|MM|ST|TN): Purchase
- unitPrice (enum: HK|HM|HS|KG|M1|MM|ST|TN)
- deliveryTime (int)
- deliveryTimeUnit (enum: months|weeks|working_days)
- orderSeries (int)
- blockedForPurchasing (boolean)
- makingOrderAdvices (boolean)
- orderingAdviceNotes (varchar)
- productCodeOnPurchase (boolean)
- maxLineQty (decimal)
- maxNetPrice (decimal)
- goodsReceiptTerm (int): Warehouse Control - Receipt and Dispatch
- stockLabelType (enum: label|sticker)
- toleranceUnloadingQty (decimal): Warehouse Control - Tolerances when reporting as completed (%) How far a report may stray from its plan, per workorder type.
- toleranceUnloadingKg (decimal)
- toleranceCountQty (decimal)
- toleranceCountKg (decimal)
- tolerancePickingQty (decimal)
- tolerancePickingKg (decimal)
- toleranceProductionQty (decimal)
- toleranceProductionKg (decimal)
- revenueGroup (enum: ss_304|ss_316|ss_321|ss_430|high_alloys|aluminium|steel|roestvast_nl|foil_consumption_and_sales|sales_residual_material|other_pallets_etc|other_products|…): Sales
- salesUnit (enum: HK|HM|HS|KG|M1|M2|Theor. Weight|Theor. Weight U.|M3|MM|ST|TN): Sales - General
- salesUnitPrice (enum: HK|HM|HS|KG|M1|MM|ST|TN)
- vatCode (enum: vat_0|vat_low_9|vat_high_21|vat_middle_12)
- roundWeightPerPieceUp (boolean)
- benorProduct (boolean)
- certificaat (enum: en10204_2_1|en10204_3_1)
- websiteExport (boolean): Sales - Website
- websiteBlockedForSales (boolean)
- descriptionProductShort (boolean)
- showWeightPerPiece (boolean)
- showPackagingPerPiece (boolean)
- markProductGroup (boolean)
- priceOnRequest (boolean)
- minProfitMarginStock (decimal): Sales - Minimum profit margins (%)
- minProfitMarginExWorks (decimal)
- minProfitMarginCrossDocking (decimal)
- severalBlockedForSales (boolean): Sales - Several
- vehicleWithCraneRequired (boolean)
- vehicleWithCanopyRequired (boolean)
- alwaysReserveStock (boolean): Whether an order line holds the lot it names.
- maxSalesLineQty (decimal): Sales - Order
- maxSalesNetPrice (decimal)
- handlingCosts (decimal)
- minStockMode (enum: multiplier|fixed_value): Stock Policy - Minimum Stock
- minStockMultiplier (decimal)
- minStockFixedValue (decimal)
- minStockUnit (varchar)
- maxStockMode (enum: multiplier|fixed_value): Stock Policy - Maximum Stock
- maxStockMultiplier (decimal)
- maxStockFixedValue (decimal)
- maxStockUnit (varchar)
- leadTimeMethod (enum: manually|automatic_maximum|automatic_average): StockOp Parameters
- leadTime (int)
- reviewPeriod (int)
- orderCostsPurchasingSide (decimal)
- orderCostsLogistics (decimal)
- stockOpOrderSeries (decimal)
- minOrderQty (decimal)
- useStockOpForThisProduct (boolean): StockOn Order Parameters
- orderOnMonday (boolean): StockOn Ordering/Evaluation days
- orderOnTuesday (boolean)
- orderOnWednesday (boolean)
- orderOnThursday (boolean)
- orderOnFriday (boolean)
- capitalCost (decimal): StockOp Simulation Parameters
- warehouseCost (decimal)
- b2StockoutPct1 (decimal)
- b2StockoutPct2 (decimal)
- handling (decimal)
- transport (decimal)
- pacClassification (varchar): PAC / Order advice
- orderAdviceCode (varchar)

### ProductionBatches
_Batches produced on a machine, destined for a stock location._
- uuid (char)
- code (varchar)
- createdOn (date): "Aangemaakt" — when the batch was created on the floor.
- machineUuid (→ machine)
- toLocationUuid (→ toLocation)

### ProductionCapacityDetails
_Production capacity details — the Logistics "Production capacity details" overview: the per-order-line production/sawing drill-down behind Production capacity._
- uuid (char)
- orderItemUuid (→ orderItem): The order line this production detail belongs to.
- quality (varchar): Material qualification shown on this report ("Kwaliteit" / "Categorie").
- category (varchar)
- fixedDimension (boolean): Whether the piece is a fixed dimension ("Fixed dim.").
- productionStartingDate (date): Planning dates: when production starts, the planned delivery, and the transport date.
- plannedDeliveryDate (date)
- transportDate (date)
- sawingSpeed (decimal): Sawing plan: speed, amount still to saw, the sawing work order(s) and the sawing method/type.
- toSaw (decimal)
- sawingWorkOrder (varchar)
- sawingWorkOrderLine (varchar)
- sawingMethod (varchar)
- sawingType (varchar)
- leftSawAngle (decimal): Sawing geometry: left/right saw angles, whether it saws standing, and the raw angle spec.
- rightSawAngle (decimal)
- standing (boolean)
- sawingAngles (varchar)
- bundles (decimal): Bundles ("Bls") and bundles plus remainder ("Bls+P").
- bundlesPlusRemainder (decimal)
- sawing (boolean): Extra work: whether sawing/drilling is required and the drill-hole count.
- drilling (boolean)
- drillingHoles (int)
- optionQty (decimal): Option quantity for this line ("Option Qty").

### ProductionCapacity
_Production capacity — the Logistics "Production capacity" overview._
- uuid (char)
- status (enum: ok|warning|full): The traffic-light "Status" and the day this snapshot is for ("Date").
- capacityDate (date)
- machineUuid (→ machine): The machine the capacity belongs to ("Machine" / "Type of machine").
- maximumCapacity (decimal): Overall thresholds: "Maximum Capacity", the day's total "Capacity" and the "Warning capacity" level.
- capacity (decimal)
- warningCapacity (decimal)
- ready (decimal): Square measures ("Ready", "Remaining", "Occupied capacity").
- remaining (decimal)
- occupiedCapacity (decimal)
- readyNotSquare (decimal): Not-square measures for linear/piece work.
- remainingNotSquare (decimal)
- occupiedNotSquare (decimal)

### ProductionWorkOrders
- uuid (char)
- number (int): The number the floor calls this job by, drawn from the same counter the warehouse uses: raising the work for a sales order hands out consecutive numbers across
- machineUuid (→ machine)
- option (enum: decoiling|grinding|shear_cut|laser|duplo|brushing|blue_foil|laser_foil|uv_foil|remove_foil|anodizing|pickling|…): What the machine does to the goods.
- extraOption (enum: decoiling|grinding|shear_cut|laser|duplo|brushing|blue_foil|laser_foil|uv_foil|remove_foil|anodizing|pickling|…): A second operation layered on the machine's own.
- previousWarehouseWorkOrderUuid (→ previousWarehouseWorkOrder): The picking that fetched the steel this run works on.
- plannedDate (date): A *planned* date, never a creation date, and never a floor under the date work is reported on.
- status (enum: new|released|ready|approved)
- releasedAt (timestamp): When the run was frozen and its papers printed.

### ProductionWorkOrderLines
- uuid (char)
- workOrderUuid (→ workOrder)
- lineNumber (int): Two different numbers, both shown.
- itemNumber (int)
- orderItemUuid (→ orderItem): What this run is fulfilling.
- orderNumber (varchar)
- companyUuid (→ company)
- productUuid (→ product)
- productCode (varchar)
- extraOptions (varchar): Finishing sold on top of the machine's own option — a UV foil applied on the same pass.
- status (enum: new|released|ready|approved)
- fromLocationUuid (→ fromLocation): Three places, not two.
- toLocationUuid (→ toLocation)
- backLocationUuid (→ backLocation)
- length (int)
- width (int)
- thickness (decimal)
- qtyPlanned (decimal)
- qtyActual (decimal)
- unitPlanned (enum: kg|st|m1|m2|m3|mm): The unit can change through the machine: a coil goes in weighed and comes out counted, so what was planned and what was made are recorded apart.
- unitActual (enum: kg|st|m1|m2|m3|mm)
- kgPlanned (decimal)
- kgActual (decimal)
- charge (varchar)
- dateFinished (date)
- deliverOn (date)
- isPickup (boolean)
- rush (boolean)
- priority (int)

### ProductionWorkOrderPicks
- uuid (char)
- workOrderUuid (→ workOrder)
- workOrderLineUuid (→ workOrderLine)
- stockUuid (→ stock)
- fromLocationUuid (→ fromLocation)
- toLocationUuid (→ toLocation)
- qtyPlanned (decimal)
- qtyActual (decimal): Null until reported.
- kgPlanned (decimal)
- kgActual (decimal): Weighed, not calculated.
- length (int)
- width (int)
- thickness (decimal)
- charge (varchar)
- internalCharge (varchar)
- internalBatch (varchar)
- executedAt (timestamp)
- executedByUserId (varchar)

### ProductionWorkOrderRemainders
- uuid (char)
- workOrderUuid (→ workOrder)
- category (enum: remnant|scrap)
- productUuid (→ product): Scrap is booked as its own article rather than as the product it fell off — swarf is sold by the tonne to a merchant, not as plate.
- quantity (decimal)
- unit (enum: kg|st|m1|m2|m3|mm)
- kg (decimal)
- length (int)
- width (int)
- toLocationUuid (→ toLocation)
- charge (varchar)
- internalCharge (varchar)
- remark (varchar)
- stockUuid (→ stock): The lot this became once the run was reported, so a remainder can be traced to the steel that is now on the shelf.

### ProductionWorkOrderPackagings
- uuid (char)
- workOrderUuid (→ workOrder)
- packaging (enum: p2m|p2_5m|p3m|p4m|euro|coil|bundles|colli)
- quantity (int)
- specification (varchar)

### Products
- uuid (char)
- productCode (varchar)
- oldProductCode (varchar): The code this product carried in the predecessor system — printed alongside the current code on the price overviews so buyers can still find an article by the n
- commodityCode (varchar)
- productGroupUuid (→ productGroup)
- revenueGroupUuid (→ revenueGroup)
- name (varchar)
- stockProduct (boolean)
- standardProduct (boolean)
- groupProduct (boolean): A group product is priced and ordered as the whole product group rather than as this single article.
- length (decimal)
- widthDiameter (decimal)
- thickness (decimal)
- theoreticalThickness (decimal): What the metal actually measures, against the size it is sold as.
- technicalStock (decimal)
- stockUnit (enum: HK|HM|HS|KG|M1|M2|Theor. Weight|Theor. Weight U.|M3|MM|ST|TN)
- theoreticalWeight (decimal)
- weightUnit (enum: HK|HM|HS|KG|M1|M2|Theor. Weight|Theor. Weight U.|M3|MM|ST|TN)
- priceUnit (enum: HK|HM|HS|KG|M1|M2|Theor. Weight|Theor. Weight U.|M3|MM|ST|TN): Only what the article is sold for lives here.
- basePrice (decimal): The list price a customer is quoted before any contract discount.
- markup (decimal): Percentage added to the invoiced purchase price to reach the base price.
- fixedSalesPrice (decimal): Fixed sales price: when set, it overrides the calculated base price.
- orderAdviceCode (varchar)
- priceDate (date): When the price set above was last recalculated.
- companyUuid (→ company): Company-specific product (customer or supplier role) — set when this product was created for a specific company (e.g.
- preferred (boolean)
- ean (varchar)
- externalProductCode (varchar)
- editing (varchar)
- deliveryTime (int)
- deliveryTimeUnit (enum: months|weeks|working_days)
- minOrderQty (decimal)
- minOrderQtyUnit (enum: HK|HM|HS|KG|M1|MM|ST|TN)
- orderSeries (int)
- orderSeriesUnit (enum: HK|HM|HS|KG|M1|MM|ST|TN)
- showOnWebsite (boolean): Customer-specific products: whether this company-scoped product should be shown on that customer's website/portal.
- priceGroup (varchar): The product screen repeats much of the product group's setup because a group only supplies the defaults: a single article can be blocked, priced or counted diff
- materialGroup (varchar)
- scrap (boolean)
- packaging (boolean)
- searchCode1 (varchar)
- searchCode2 (varchar)
- searchCode3 (varchar)
- articleGroup (enum: ck304|ck316|ck430|ckm304|pdiva|pk304|pta2_5|pta3|pta3_5|pta5|pw304|pw316|…)
- groupLongDesc (text)
- groupShortDesc (varchar)
- productShortDesc (varchar)
- selectionCodes (json): Free-form selection codes used to filter the catalogue.
- dimensionShape (enum: round|square|flat|rectangular|hexagonal|octagonal|tube_round|tube_square|tube_rectangular|sheet|plate|beam|…)
- tradeLength (decimal)
- tradeLengthFixed (boolean)
- overlength (decimal)
- weightPerM1 (decimal): Weight per running metre and paintable surface per running metre — both derived from the cross-section, which is why the reference shows them read-only.
- paintSurfacePerM1 (decimal)
- featuresQuality (enum: 115CrV3|11SMn30+C/SH|11SMnPb30+C/SH|300-serie|301|303|304|3041D|3042B|3042BB|3042D|3042E|…)
- decimalPlaces (enum: 0|1|2)
- printDimensions (boolean)
- densityKgDm3 (decimal): The density every derived weight is computed from, in kg/dm3.
- weightTheoretical (decimal)
- weightTrade (decimal)
- weightGerman (decimal)
- standardsQuality (enum: en_10025_2|en_10219_1)
- tolerance (enum: en_10025_2|en_10219_1)
- ce (enum: en_10255|en_10219_1|en_10210_1|en_10025_1)
- options (json)
- processedOption (enum: D|SL|K|LSR|DUP|NG|BF|L|F|FV|ANO|BEI|…)
- sourceProductUuid (→ sourceProduct)
- industryNumber (varchar)
- classificationMaterial (varchar): Held as free text rather than enums: the reference's dropdowns were all empty in the screens these were built from, so the option lists are not known yet.
- classificationQualityGroup (varchar)
- classificationMainShape (varchar)
- classificationSubShape (varchar)
- classificationProcedure (varchar)
- classificationAppearance (varchar)
- classificationPerformance (varchar)
- purchasingUnit (enum: HK|HM|HS|KG|M1|MM|ST|TN)
- unitPrice (enum: HK|HM|HS|KG|M1|MM|ST|TN)
- blockedForPurchasing (boolean)
- makingOrderAdvices (boolean)
- orderingAdviceNotes (varchar)
- productCodeOnPurchase (boolean)
- maxLineQty (decimal)
- maxNetPrice (decimal)
- salesUnit (enum: HK|HM|HS|KG|M1|M2|Theor. Weight|Theor. Weight U.|M3|MM|ST|TN)
- salesUnitPrice (enum: HK|HM|HS|KG|M1|MM|ST|TN)
- vatCode (enum: vat_0|vat_low_9|vat_high_21|vat_middle_12)
- roundWeightPerPieceUp (boolean)
- benorProduct (boolean)
- certificaat (enum: en10204_2_1|en10204_3_1)
- websiteExport (boolean)
- websiteBlockedForSales (boolean)
- descriptionProductShort (boolean)
- showWeightPerPiece (boolean)
- showPackagingPerPiece (boolean)
- markProductGroup (boolean)
- priceOnRequest (boolean)
- minProfitMarginStock (decimal)
- minProfitMarginExWorks (decimal)
- minProfitMarginCrossDocking (decimal)
- severalBlockedForSales (boolean)
- vehicleWithCraneRequired (boolean)
- vehicleWithCanopyRequired (boolean)
- alwaysReserveStock (boolean): Whether an order line holds the lot it names.
- maxSalesLineQty (decimal)
- maxSalesNetPrice (decimal)
- handlingCosts (decimal)
- goodsReceiptTerm (int)
- stockLabelType (enum: label|sticker)
- stockLabelPieces (int)
- toleranceUnloadingQty (decimal): How far a report may stray from its plan, per workorder type.
- toleranceUnloadingKg (decimal)
- toleranceCountQty (decimal)
- toleranceCountKg (decimal)
- tolerancePickingQty (decimal)
- tolerancePickingKg (decimal)
- toleranceProductionQty (decimal)
- toleranceProductionKg (decimal)
- minStockMode (enum: multiplier|fixed_value)
- minStockMultiplier (decimal)
- minStockFixedValue (decimal)
- maxStockMode (enum: multiplier|fixed_value)
- maxStockMultiplier (decimal)
- maxStockFixedValue (decimal)
- leadTimeMethod (enum: manually|automatic_maximum|automatic_average)
- leadTime (int)
- reviewPeriod (int)
- orderCostsPurchasingSide (decimal)
- orderCostsLogistics (decimal)
- stockOpOrderSeries (decimal)
- useStockOpForThisProduct (boolean)
- orderOnMonday (boolean)
- orderOnTuesday (boolean)
- orderOnWednesday (boolean)
- orderOnThursday (boolean)
- orderOnFriday (boolean)
- capitalCost (decimal)
- warehouseCost (decimal)
- b2StockoutPct1 (decimal)
- b2StockoutPct2 (decimal)
- handling (decimal)
- transport (decimal)
- pacClassification (varchar)
- scrapProductUuid (→ scrapProduct)
- transferProductUuid (→ transferProduct)
- packagingProductUuid (→ packagingProduct)
- cdLocationUuid (→ cdLocation)
- stockProductSince (date)
- batchRegistration (boolean)
- batchRegisterLength (boolean)
- batchLengthMinimum (decimal)
- batchLengthInterval (decimal)
- batchLengthRemainderTolerance (decimal): Remainders under this many mm are dropped when a length is divided into interval steps, so a near-miss offcut is not registered as its own piece.
- batchRegisterWidth (boolean)
- batchWidthMinimum (decimal)
- batchWidthInterval (decimal)
- batchUseOptimization (boolean)
- batchCharge (boolean)
- batchDoNotSplitPerBatch (boolean)
- batchPlateNumber (boolean)
- batchPerPiece (boolean)
- batchNumber (boolean)
- countFrequency (int)
- countedThisYear (int)
- lastCountDate (date)
- nextCountTargetDate (date)
- countStockBasis (enum: technical|available)
- countBelowQuantity (decimal)
- countBelowUnit (enum: HK|HM|HS|KG|M1|M2|Theor. Weight|Theor. Weight U.|M3|MM|ST|TN)
- optTradeLengthTolerance (int)
- optEndSpace (int)
- optClamping (int)
- optOffcutMinLength (int)
- optOffcutPreferredMin (int)
- optClampingEdge (int)
- optFactorBundles (int): Weighting factors (0–999) the sawing optimiser balances against each other when it chooses a cutting plan.
- optFactorSawingCuts (int)
- optFactorCreatedOffcuts (int)
- optFactorCreatedScrapPieces (int)
- optFactorUsedTradeLengths (int)
- optFactorUsedOffcuts (int)
- optFactorScrapPieceLength (int)
- optFactorLengthCutoffs (int)
- optAllowLongestOffcuts (boolean)
- remarks (text)

### PurchaseInvoiceItems
- uuid (char)
- purchaseInvoiceUuid (→ purchaseInvoice)
- stockUuid (→ stock)
- productUuid (→ product)
- purchaseOrderItemUuid (→ purchaseOrderItem): The ordered line this receipt was booked against — where its price came from, and what a purchase return traces back through.
- quantity (decimal)
- netPrice (decimal): What the line was actually booked at, copied from the order line at the moment the goods were received.
- amount (decimal)
- vatCode (enum: vat_0|vat_low_9|vat_high_21|vat_middle_12): The product's VAT code as it stood when the line was booked, so the three-band split on the document survives a product being recoded.

### PurchaseInvoices
- uuid (char)
- companyUuid (→ company)
- invoiceSentByCompanyUuid (→ invoiceSentByCompany): Who billed us, when that is not the supplier — a factor or a group billing entity.
- invoiceSentByContactUuid (→ invoiceSentByContact)
- documentType (enum: invoice|credit_note|surcharge|correction): Goods sent back to a supplier come back as their credit note, which is this same document with its amounts negated.
- purchaseReturnOrderUuid (→ purchaseReturnOrder)
- creditsPurchaseInvoiceUuid (→ creditsPurchaseInvoice)
- bookingDate (date)
- invoiceDate (date)
- expirationDate (date)
- invoiceNumberSupplier (varchar)
- creditorNo (varchar)
- creditorNo2 (varchar)
- invoiceTotal (decimal)
- outstanding (decimal): What is still owed to the supplier.
- purchaseOrderNumber (varchar)
- paymentTerms (enum: prepayment|cash|within_7_days_after_invoice_date|within_8_days_from_date_of_invoice|within_10_days_from_date_of_invoice|within_14_days_from_date_of_invoice|within_21_days_after_invoice_date|within_30_days_from_date_of_invoice|within_30_days_end_of_month|within_45_days_from_date_of_invoice|within_60_days_from_date_of_invoice|within_90_days_after_invoice_date|…)
- status (enum: provisional|released): Where the document stands, and who moved it there.
- bookingPeriod (int): The accounting period the invoice is booked in — the month of its fiscal-period date.
- statusChangedByUserId (varchar)
- statusChangedAt (timestamp)
- iban (varchar): The bank the invoice is paid to, snapshotted when it is entered: a supplier's bank details can change, and an old invoice must keep the account it was actually
- blocked (boolean)
- blockReason (enum: price_mismatch|awaiting_goods_receipt|awaiting_approval|duplicate|disputed|other)
- cancelled (boolean)
- materials (decimal)
- optionsAmount (decimal)
- surcharges (decimal)
- vatHigh (decimal)
- vatMiddle (decimal)
- vatLow (decimal)
- creditRestriction (decimal)
- remainder (decimal): What the supplier billed that the booked lines don't account for.
- remarks (text)

### PurchaseInvoiceSurcharges
- uuid (char)
- purchaseInvoiceUuid (→ purchaseInvoice)
- order (int)
- booked (boolean)
- orderRef (varchar)
- description (enum: project_discount|certificate_costs|cutting_surcharge|decoil_surcharge|order_surcharge|packaging_surcharge|pallet_surcharge|administration_costs|transport_costs|transport_costs_internal|maut_costs|return_costs|…)
- revenueGroup (varchar)
- surcharge (decimal)
- unit (varchar)
- surchargeBasis (decimal)
- amount (decimal)
- vatRate (decimal)

### PurchaseLineReceivals
_Goods received against a purchase order line._
- uuid (char)
- purchaseOrderUuid (→ purchaseOrder)
- purchaseOrderItemUuid (→ purchaseOrderItem)
- productUuid (→ product)
- companyUuid (→ company): The supplier the goods came from.
- purchaseOrderCode (varchar)
- lineNumber (int)
- lineStatus (enum: provisional|released|checked|in_progress|partially_delivered|partially_invoiced|invoiced|completed|partially_received|received|expired|cancelled)
- receiptStatus (enum: new|released|workorders_created|partially_received|received|invoiced|expired): How far the reception has got.
- options (varchar)
- unit (enum: kg|st|m1|m2|m3|mm)
- qtyPlanned (decimal)
- qtyActual (decimal)
- receivedQty (decimal)
- priceQuantity (decimal)
- kgPlanned (decimal)
- kgActual (decimal)
- lengthMm (int)
- lineAmount (decimal)
- invoicedPrice (decimal)
- charge (varchar): Charge aanpassen...
- internalCharge (varchar): Ours, chosen from a registry rather than typed: two-digit year plus four characters (25AAWO, 23EHGI, 21GFFI).
- plateNumber (varchar)
- documentObligationWaived (boolean): Goods-in can be held until its mill certificate is attached.
- preReportedBy (varchar): Who called the delivery ahead, by initials (AVD), and the code they quoted.
- preNotifyCode (varchar)
- billOfLading (varchar)
- confirmationNumber (varchar): The rest of what Pre-notify copies onto the ticked receptions (C17): the confirmation it answers and the supplier's document.
- confirmationDate (date)
- documentSupplier (varchar)
- receiptDate (date)
- preAnnouncedDeliveryDate (date): Stamped when the supplier pre-advises a delivery, which is what the order's Pre-notify action does.
- deliveryDatePlanned (date)
- deliveryDateActual (date)
- purchaser (varchar)
- initials (varchar)
- sheetNumber (varchar): The mill's own sheet identifier, where it gives one.
- producer (varchar): Who actually rolled the steel, which is not who sold it.
- ediCharge (varchar): The reference's Receipts grid ends with four EDI columns — EDI Charge, **EDI Bundels**, EDI Vrachtbrief, EDI Leverdatum — and the order header carries Message s
- ediBundles (int)
- ediBillOfLading (varchar)
- ediDeliveryDate (date)

### PurchaseOrderItemOptions
_Options on a purchase line: the processing step bought, not metal (C10 of PLANNED-CODE-CHANGES-8)._
- uuid (char)
- purchaseOrderUuid (→ purchaseOrder)
- purchaseOrderItemUuid (→ purchaseOrderItem)
- sortOrder (int)
- option (enum: uv_foil|brushing|punching|embossing|remove_paper|certificate_2_1|coating|blue_foil|grinding|shear_cut|rolling|sawing|…)
- quantity (decimal)
- unit (enum: kg|st|m1|m2|m3|mm)
- grossPrice (decimal)
- per (varchar): Per — what the price is struck against: TN (decoiling), M2 (grinding, foil), ST.
- discountPercent (decimal)
- referenceFactor (decimal)
- netPrice (decimal)
- amount (decimal)

### PurchaseOrderItems
- uuid (char)
- purchaseOrderUuid (→ purchaseOrder)
- productUuid (→ product)
- quantity (decimal)
- lineNumber (int)
- status (enum: provisional|released|checked|in_progress|partially_delivered|partially_invoiced|invoiced|completed|partially_received|received|expired|cancelled)
- purchaser (varchar)
- sourceType (enum: stock|cross_dock|ex_works): The reference's Line type on a purchase line — where the metal goes once the supplier hands it over.
- unit (enum: kg|st|m1|m2|m3|mm)
- qualityCode (varchar)
- stockCategory (varchar)
- options (varchar)
- lengthMm (int)
- widthMm (int)
- thicknessMm (decimal)
- qtyPlanned (decimal)
- qtyReceived (decimal)
- qtyOrdered (decimal): Whether the order has actually gone to the supplier, and whether they have acknowledged it — each either zero or the whole line, so a partial confirmation can b
- qtyConfirmed (decimal)
- confirmationNumber (varchar): What Confirm purchase order copies onto each ticked line (C16, captured on 404299 8-10-2026): the supplier's confirmation number and date, the delivery date the
- confirmationDate (date)
- confirmedDeliveryDate (date)
- documentSupplier (varchar)
- reservedQty (decimal)
- closedAt (timestamp): A short line closed by hand.
- closedByUserId (varchar)
- forPurchaseOrderItemUuid (→ forPurchaseOrderItem): For line on the reference's purchase line: the line of *another* purchase order this one exists for.
- kgPurchased (decimal): A purchase line is billed on the weighed kilos, not the theoretical ones.
- kgActual (decimal)
- grossPrice (decimal): What was agreed to pay the supplier.
- groupDiscountPercent (decimal)
- lineDiscountPercent (decimal)
- netPrice (decimal)
- priceUnit (varchar)
- amount (decimal)
- receiptDate (date)

### PurchaseOrderSupplies
_Supplies on a Processing purchase order: the lot we hand the processor (C8 of PLANNED-CODE-CHANGES-8, captured on 400066 and 402401, 8-10-2026)._
- uuid (char)
- purchaseOrderUuid (→ purchaseOrder)
- stockUuid (→ stock)
- productUuid (→ product)
- blocked (boolean)
- deliveryDate (date)
- lengthMm (int)
- widthMm (int)
- thicknessMm (decimal)
- options (varchar)
- qtyPlanned (decimal)
- kgPlanned (decimal)
- m1Planned (decimal)
- qtyPicked (decimal): Picked, then what actually went out.
- qtyActual (decimal)
- kgActual (decimal)
- m1Actual (decimal)
- billOfLading (varchar)
- valueEur (decimal): What the lot was worth on its way out — the value the processed metal comes back carrying.
- status (enum: new|workorders_created|delivered)

### PurchaseOrders
- uuid (char)
- supplierUuid (→ supplier): The supplier uuid is the company uuid that is supplying the goods or services for this purchase order
- agentUuid (→ agent)
- contactUuid (→ contact)
- purchaseQuoteUuid (→ purchaseQuote): The supplier quote that was awarded, when the order came from one.
- purchaser (varchar): Purchaser here is the Clerk user ID that is logged in to the system and is creating the purchase order
- reference (varchar)
- ourReference (varchar)
- orderCategory (varchar)
- purchaseOrderType (enum: materials|processing|customer_materials|ex_works_processor)
- weightType (enum: theoretical_weight|trade_weight|german_trade_weight|weighed)
- isOverlength (boolean)
- isPrinted (boolean)
- isMailed (boolean)
- isFaxed (boolean)
- messageSentViaStaalWeb (boolean)
- deliberatelyNotSent (boolean): Held back on purpose.
- doNotPrintPrices (boolean)
- paymentTerms (enum: prepayment|cash|within_7_days_after_invoice_date|within_8_days_from_date_of_invoice|within_10_days_from_date_of_invoice|within_14_days_from_date_of_invoice|within_21_days_after_invoice_date|within_30_days_from_date_of_invoice|within_30_days_end_of_month|within_45_days_from_date_of_invoice|within_60_days_from_date_of_invoice|within_90_days_after_invoice_date|…)
- deliveryTerms (enum: exw|fca|fob|cfr|cif|cpt|cip|dap|dpu|ddp)
- deliveryAddressUuid (→ deliveryAddress)
- arrangeTransport (boolean)
- pickupDropoffCdPurchases (boolean)
- supplierAddressUuid (→ supplierAddress)
- deliveryType (enum: date|week)
- deliveryDate (date)
- deliveryWeek (int)
- deliveryYear (int)
- deliveryRemark (varchar)
- completeDelivery (boolean)
- transportBlockage (boolean)
- vehicleWithCrane (boolean)
- vehicleWithCanopy (boolean)
- bundlingSeparate (boolean)
- transportRegion (varchar)
- maxLengthMm (int)
- maxBundleWeightKg (decimal)
- deliveryAfterTime (varchar)
- deliverForTime (varchar)
- transportMode (varchar)
- status (enum: provisional|released|checked|in_progress|partially_received|received|delivered|invoiced|expired|cancelled)
- confirmedAt (timestamp): Confirm and Pre-notify are stamps, not rungs — the reference's header ladder has neither word (7-10-2026).
- preNotifiedAt (timestamp)
- forOrder (varchar)
- orderDate (date)
- amount (decimal)
- weightKg (decimal)
- confirmationReference (varchar)
- confirmationDate (date)
- copiedFrom (varchar)
- internalReference (varchar)
- inkoper (varchar)
- purchaserInitials (varchar)
- remarks (text)

### PurchaseQuoteItems
_Line items of a purchase quote ("Purchase quotes" overview shows one row per quote line)._
- uuid (char)
- purchaseQuoteUuid (→ purchaseQuote)
- productUuid (→ product)
- revenueGroupUuid (→ revenueGroup)
- forOrderItemUuid (→ forOrderItem): The sales line this quote line is buying for — the request's For line, kept through the quote so the order it becomes is still CD and still covers that sale (PL
- lineNumber (int)
- status (enum: provisional|released|checked|in_progress|partially_delivered|partially_invoiced|invoiced|completed|partially_received|received|expired|cancelled)
- expirationReason (varchar)
- description (varchar)
- lengthMm (int)
- widthMm (int)
- thicknessMm (decimal)
- quantity (decimal)
- unit (enum: kg|st|m1|m2|m3|mm)
- kg (decimal)
- grossPrice (decimal): What the supplier quoted before discounts, and the two percentages that come off it — the group's, then the line's.
- groupDiscountPercent (decimal)
- lineDiscountPercent (decimal)
- netPrice (decimal)
- priceUnit (varchar)
- amount (decimal)
- companyCode (varchar)
- internalText (text)
- isConsignment (boolean)
- purchaser (varchar)
- purchaserInitials (varchar)
- ourReference (varchar)
- purchaseReference (varchar)

### PurchaseQuotes
- uuid (char)
- companyUuid (→ company): The company is either a supplier or an agent; companyType says which one.
- companyType (enum: supplier|agent)
- contactUuid (→ contact)
- purchaseRequestUuid (→ purchaseRequest): The request this quote answers.
- status (enum: open|received|awarded|lost|expired)
- purchaser (varchar): The reference's "Expired because" — set together with status expired.
- reference (varchar)
- ourReference (varchar)
- orderCategory (varchar)
- quoteNumber (varchar)
- quoteDate (date)
- validUntil (date)
- purchaseOrderType (enum: materials|processing|customer_materials|ex_works_processor)
- weightType (enum: theoretical_weight|trade_weight|german_trade_weight|weighed)
- isOverlength (boolean)
- isConsignment (boolean)
- paymentTerms (enum: prepayment|cash|within_7_days_after_invoice_date|within_8_days_from_date_of_invoice|within_10_days_from_date_of_invoice|within_14_days_from_date_of_invoice|within_21_days_after_invoice_date|within_30_days_from_date_of_invoice|within_30_days_end_of_month|within_45_days_from_date_of_invoice|within_60_days_from_date_of_invoice|within_90_days_after_invoice_date|…)
- deliveryTerms (enum: exw|fca|fob|cfr|cif|cpt|cip|dap|dpu|ddp)
- deliveryAddressUuid (→ deliveryAddress)
- arrangeTransport (boolean)
- pickupDropoffCdPurchases (boolean)
- supplierAddressUuid (→ supplierAddress)
- deliveryType (enum: date|week)
- deliveryDate (date)
- deliveryWeek (int)
- deliveryYear (int)
- deliveryRemark (varchar)
- materials (decimal)
- optionsAmount (decimal)
- surcharges (decimal)
- totalExclVat (decimal)
- vatAmount (decimal)
- totalInclVat (decimal)
- totalWeightKg (decimal)

### PurchaseQuoteSurcharges
_── Surcharges ────────────────────────────────────────────────────────────── Line items behind the "Surcharges" panel — additional charges (transport, handling,_
- uuid (char)
- purchaseQuoteUuid (→ purchaseQuote)
- order (int)
- description (varchar)
- surchargeValue (decimal)
- unit (varchar)
- tierFrom (decimal)
- tierUntil (decimal)
- tierUnit (enum: TN|Euro)
- amount (decimal)
- profit (decimal)
- thirdParty (boolean)
- companyCode (varchar)
- companyUuid (→ company)

### PurchaseRequestItems
_What a purchase request is asking suppliers to quote for._
- uuid (char)
- purchaseRequestUuid (→ purchaseRequest)
- productUuid (→ product): Nullable: a request may ask for something not yet on the product list — that is a normal way for a new product to enter the system.
- forOrderItemUuid (→ forOrderItem): The sales order line this material is being bought for.
- lineNumber (int)
- lineStatus (enum: provisional|released|checked|in_progress|partially_delivered|partially_invoiced|invoiced|completed|partially_received|received|expired|cancelled)
- stockCategory (varchar)
- description (varchar)
- quantity (decimal)
- unit (enum: kg|st|m1|m2|m3|mm)
- kg (decimal)
- lengthMm (int)
- widthMm (int)
- thicknessMm (decimal)
- qualityCode (varchar)
- requiredDate (date)
- remark (text)

### PurchaseRequests
- uuid (char)
- companyUuid (→ company)
- companyType (enum: supplier|agent)
- contactUuid (→ contact)
- purchaser (varchar): Clerk user ID
- orderCategory (varchar)
- reference (varchar)
- ourReference (varchar)
- status (enum: draft|sent|quoted|awarded|cancelled): Tracks the request through the RFQ cycle: raised, sent to suppliers, quotes back, and finally one of them awarded as a purchase order.
- purchaseOrderType (enum: materials|processing|customer_materials|ex_works_processor)
- weightType (enum: theoretical_weight|trade_weight|german_trade_weight|weighed)
- isOverlength (boolean)
- isPrinted (boolean)
- isMailed (boolean)
- isFaxed (boolean)
- messageSentViaStaalWeb (boolean)
- paymentTerms (enum: prepayment|cash|within_7_days_after_invoice_date|within_8_days_from_date_of_invoice|within_10_days_from_date_of_invoice|within_14_days_from_date_of_invoice|within_21_days_after_invoice_date|within_30_days_from_date_of_invoice|within_30_days_end_of_month|within_45_days_from_date_of_invoice|within_60_days_from_date_of_invoice|within_90_days_after_invoice_date|…)
- deliveryTerms (enum: exw|fca|fob|cfr|cif|cpt|cip|dap|dpu|ddp)
- deliveryAddressUuid (→ deliveryAddress)
- arrangeTransport (boolean)
- pickupDropoffCdPurchases (boolean)
- supplierAddressUuid (→ supplierAddress)
- deliveryType (enum: date|week)
- deliveryDate (date)
- deliveryWeek (int)
- deliveryYear (int)
- deliveryRemark (varchar)
- deadline (date)

### PurchaseReturnOrderItems
_Line items of a purchase return order — goods going back to the supplier._
- uuid (char)
- purchaseReturnOrderUuid (→ purchaseReturnOrder)
- productUuid (→ product)
- complaintUuid (→ complaint)
- originalPurchaseOrderUuid (→ originalPurchaseOrder): The purchase order and line the goods came in on.
- originalPurchaseOrderLine (int)
- originalPurchaseOrderItemUuid (→ originalPurchaseOrderItem): The exact ordered line going back.
- stockUuid (→ stock): The lot the goods are drawn out of.
- lineNumber (int)
- lineStatus (enum: provisional|released|checked|in_progress|partially_delivered|partially_invoiced|invoiced|completed|partially_received|received|expired|cancelled)
- reference (varchar)
- unit (enum: kg|st|m1|m2|m3|mm)
- quantity (decimal)
- returnQty (decimal)
- lengthMm (int)
- widthMm (int)
- thicknessMm (decimal)
- weightKg (decimal)
- qualityCode (varchar)
- stockCategory (varchar)
- returnReason (enum: damaged|wrong_quantity|wrong_material_delivered|delivered_too_late|not_delivered|transport_damage|incorrect_delivery_address)
- netPrice (decimal): What we paid for it.
- priceUnit (varchar)
- amount (decimal)
- returnDate (date)

### PurchaseReturnOrders
- uuid (char)
- supplierUuid (→ supplier)
- purchaseOrderUuid (→ purchaseOrder)
- purchaseOrderReference (varchar)
- complaintRef (varchar)
- complaintUuid (→ complaint): The complaint Par.
- contactUuid (→ contact)
- purchaser (varchar)
- purchaseOrderType (enum: materials|processing|customer_materials|ex_works_processor)
- status (enum: provisional|released|checked|in_progress|partially_received|received|delivered|invoiced|expired|cancelled): The purchase ladder, not the sales return's.
- isPrinted (boolean)
- isMailed (boolean)
- isFaxed (boolean)
- paymentTerms (enum: prepayment|cash|within_7_days_after_invoice_date|within_8_days_from_date_of_invoice|within_10_days_from_date_of_invoice|within_14_days_from_date_of_invoice|within_21_days_after_invoice_date|within_30_days_from_date_of_invoice|within_30_days_end_of_month|within_45_days_from_date_of_invoice|within_60_days_from_date_of_invoice|within_90_days_after_invoice_date|…)
- returnDate (date)
- returnReason (enum: damaged|wrong_quantity|wrong_material_delivered|delivered_too_late|not_delivered|transport_damage|incorrect_delivery_address)
- isDropOff (boolean)
- deliveryAddressUuid (→ deliveryAddress)
- pickupAddress (varchar)
- completeDelivery (boolean)
- vehicleWithCrane (boolean)
- vehicleWithCanopy (boolean)
- bundlingSeparate (boolean)
- unloadingWarehousePerLine (boolean)
- transportRegion (enum: azie|bal|bel|dui|eng|fra|ita|lux|ned|oe|sp_po|zd_am)
- transportMode (enum: sea_transport|rail_transport|road_transport|air_transport|postal_shipments|fixed_transport_facilities|inland_waterway_transport|own_power)
- pickupAfterTime (varchar)
- pickupForTime (varchar)
- maxLengthMm (int)
- maxBundleWeightKg (decimal)
- materialsRevenue (decimal)
- optionsRevenue (decimal)
- surchargesRevenue (decimal)
- totalExclVat (decimal)
- vatAmount (decimal)
- totalInclVat (decimal)
- totalWeightKg (decimal)
- remarks (text)

### PurchaseReturnOrderSurcharges
- uuid (char)
- purchaseReturnOrderUuid (→ purchaseReturnOrder)
- companyUuid (→ company)
- order (int)
- description (enum: project_discount|certificate_costs|cutting_surcharge|decoil_surcharge|order_surcharge|packaging_surcharge|pallet_surcharge|administration_costs|transport_costs|transport_costs_internal|maut_costs|return_costs|…)
- surcharge (decimal)
- unit (varchar)
- fromValue (decimal)
- unitIndication (varchar)
- tierUnit (enum: TN|Euro)
- amount (decimal)
- profit (decimal)
- thirdParties (boolean)
- companyCode (varchar)

### QuoteItemOptions
_An option quoted on a quote line — the processing the customer would be billed for on top of the material._
- uuid (char)
- quoteUuid (→ quote)
- quoteItemUuid (→ quoteItem)
- optionUuid (→ option)
- revenueGroupUuid (→ revenueGroup)
- lineStatus (enum: provisional|released|checked|in_progress|partially_delivered|partially_invoiced|invoiced|completed|partially_received|received|expired|cancelled)
- quantity (decimal)
- unit (enum: kg|st|m1|m2|m3|mm)
- weightKg (decimal)
- price (decimal)
- priceUnit (varchar)
- costPrice (decimal)
- amount (decimal): Line totals: revenue quoted, cost incurred and the difference.
- cost (decimal)
- profit (decimal)

### QuoteItems
_Line items of a sales quote — what the customer was actually quoted._
- uuid (char)
- quoteUuid (→ quote)
- productUuid (→ product)
- revenueGroupUuid (→ revenueGroup)
- convertedToOrderUuid (→ convertedToOrder)
- lineNumber (int)
- lineType (varchar)
- sourceType (enum: stock|stock_and_cross_dock|cross_dock|ex_works): The reference's line Type (Stk · Stk+CD · CD · EXW), carried into the order line on conversion.
- status (enum: provisional|released|checked|in_progress|partially_delivered|partially_invoiced|invoiced|completed|partially_received|received|expired|cancelled)
- expirationReason (varchar)
- description (varchar)
- reference (varchar)
- options (varchar)
- deliveryDate (date)
- lengthMm (int)
- widthMm (int)
- thicknessMm (decimal)
- quantity (decimal)
- unit (enum: kg|st|m1|m2|m3|mm)
- weightKg (decimal)
- grossPrice (decimal)
- priceUnit (varchar)
- groupDiscount (decimal)
- lineDiscount (decimal)
- netPrice (decimal)
- amount (decimal)
- costPrice (decimal)
- profit (decimal)
- profitMargin (decimal)
- purchasePrice (decimal): Two costs are kept per line because the summary reports profit twice: once against what the goods actually cost (purchasePrice, the average purchase price when
- replacementPrice (decimal)
- costAmount (decimal)
- profitReplPrice (decimal)
- profitFsp (decimal): The third basis the reference measures a line against.
- profitTooLow (boolean): Flagged when the line's margin falls under the minimum the product group allows, so the salesperson sees it before the quote goes out.
- m1PerPiece (decimal): Running metres per piece — the "M1(p)" column on the lines grid.
- isConsignment (boolean)
- affiliateCompany (varchar)

### QuoteSurcharges
_A surcharge quoted on top of the material and option lines — scrap surcharge, alloy surcharge, small-order fee and the like._
- uuid (char)
- quoteUuid (→ quote)
- companyUuid (→ company)
- order (int)
- description (enum: project_discount|certificate_costs|cutting_surcharge|decoil_surcharge|order_surcharge|packaging_surcharge|pallet_surcharge|administration_costs|transport_costs|transport_costs_internal|maut_costs|return_costs|…)
- surcharge (decimal)
- unit (varchar)
- fromValue (decimal)
- unitIndication (varchar)
- tierUnit (enum: TN|Euro)
- amount (decimal)
- profit (decimal)
- thirdParties (boolean)
- companyCode (varchar)

### Quotes
- uuid (char)
- companyUuid (→ company)
- contactUuid (→ contact)
- customerRef (varchar)
- leaveCustomerRef (boolean)
- requestMethod (enum: telephone|email|counter|representative|oral|website|edi|ai_read_email)
- ourReference (varchar)
- seller (varchar)
- projectUuid (→ project)
- contractUuid (→ contract)
- priceDate (date)
- decisionDate (date)
- quoteDate (date)
- validityPeriodDays (int)
- validUntil (date)
- handlingBlocked (boolean)
- isPickup (boolean)
- isIncidental (boolean)
- isConsignment (boolean)
- consignmentDuration (varchar)
- consignmentDurationUnit (varchar)
- isInternalProduction (boolean)
- isCustomerMaterial (boolean)
- weightType (enum: theoretical_weight|trade_weight|german_trade_weight|weighed)
- isOverlength (boolean)
- mustBeSent (boolean): Whether the document is meant to go to the customer at all, and whether somebody deliberately held it back.
- deliberatelyNotSent (boolean)
- isPrinted (boolean)
- isMailed (boolean)
- isFaxed (boolean)
- showNetPrice (boolean)
- scrapSurchargeSeparate (boolean)
- calculateVatIfApplicable (boolean)
- financialBlockage (boolean)
- onlyTotalAmountOnInvoice (boolean)
- doNotShowTotalAmount (boolean)
- paymentTerms (enum: prepayment|cash|within_7_days_after_invoice_date|within_8_days_from_date_of_invoice|within_10_days_from_date_of_invoice|within_14_days_from_date_of_invoice|within_21_days_after_invoice_date|within_30_days_from_date_of_invoice|within_30_days_end_of_month|within_45_days_from_date_of_invoice|within_60_days_from_date_of_invoice|within_90_days_after_invoice_date|…)
- billingAddressUuid (→ billingAddress)
- blockingReason (varchar)
- deliveryTerms (enum: exw|fca|fob|cfr|cif|cpt|cip|dap|dpu|ddp)
- deliveryAddressUuid (→ deliveryAddress)
- deliveryType (enum: date|week)
- deliveryDate (date)
- deliveryWeek (int)
- deliveryYear (int)
- deliveryRemark (varchar)
- status (enum: provisional|released|checked|in_progress|partially_delivered|delivered|partially_invoiced|invoiced|completed|converted|received|expired|…): A quote climbs the same ladder as an order.
- expired (boolean): Kept in step with status === "expired" so the existing filters and indexes keep working; the status is what decides.
- expirationReason (varchar): Free text, and rare — one of the reference's 2.091 headers fills it, with "Customer not accepted - price." One sample proves nothing about a list, so it stays a
- materialsRevenue (decimal)
- materialsProfit (decimal)
- materialsProfitReplPrice (decimal)
- optionsRevenue (decimal)
- optionsProfit (decimal)
- optionsProfitReplPrice (decimal)
- surchargesRevenue (decimal)
- surchargesProfit (decimal)
- surchargesProfitReplPrice (decimal)
- transportCosts (decimal)
- handlingCosts (decimal)
- totalExclVat (decimal)
- vatAmount (decimal)
- totalInclVat (decimal)
- avgKiloPrice (decimal)
- totalWeightKg (decimal)
- theorWeightKg (decimal)
- remarks (text)

### Reoptimize
_(Re)optimize — the Logistics "(Re)optimize" overview: the re-optimization view of the sawing/nesting plan._
- uuid (char)
- orderItemUuid (→ orderItem): The order line this row belongs to.
- quality (varchar): Material qualification shown on this report ("Kwaliteit" / "Categorie").
- category (varchar)
- sawingSpec (boolean): Flags: sawing-spec required and fixed dimension.
- fixedDimension (boolean)
- toSaw (decimal): Amount still to saw and the sawing work-order status.
- sawingWorkOrderStatus (varchar)
- productionStartingDate (date): Production/delivery planning: start date, planned/delivered quantities and their unit, planned/actual delivery dates and the delivery status.
- plannedDeliveredQty (decimal)
- deliveredQty (decimal)
- deliveryUnit (varchar)
- deliveryDatePlanned (date)
- deliveryDateActual (date)
- deliveryStatus (varchar)
- optionQty (decimal): Option quantity for this line ("Option Qty").
- sawingWorkOrder (varchar): Nesting/sawing plan: the sawing work order and its line, the nest and the sawing machine.
- sawingWorkOrderLine (varchar)
- nest (varchar)
- sawingMachine (varchar)
- drillingHoles (int): Sawing geometry: drill-hole count, left/right saw angles, bundles ("Bls") and bundles-plus-remainder ("Bls+P"), whether sawing/drilling is required, whether it
- leftSawAngle (decimal)
- bundles (decimal)
- bundlesPlusRemainder (decimal)
- sawing (boolean)
- drilling (boolean)
- rightSawAngle (decimal)
- standing (boolean)
- sawingType (varchar)
- sawingAngles (varchar)
- transportDate (datetime): When the material is transported.
- fetchDate (date): Fetch side — retrieving the raw material from stock: date, code, line, status, quantity, product/description, the raw length and the residual length left over.
- fetchCode (varchar)
- fetchLine (int)
- fetchStatus (varchar)
- fetchQty (decimal)
- fetchProduct (varchar)
- fetchDescription (varchar)
- fetchLength (decimal)
- residualLength (decimal)

### Reservations
_A claim on one lot by one order line — the reference's Reservations screen, and specifically the panel behind its right-click Toon reserveringen._
- uuid (char)
- stockUuid (→ stock): The lot being held.
- orderItemUuid (→ orderItem): What is holding it, and it is polymorphic — the same shape as a stock movement's cause.
- purchaseOrderItemUuid (→ purchaseOrderItem)
- type (enum: sale|purchase|scrap): Company on the panel is the customer behind that order line.
- status (enum: definitive|provisional|temporary)
- quantity (decimal): Held in the lot's own unit, which is why the unit travels with it — the reference prints 64 ST and the same reservation weighs 1.190 Kg.
- unit (enum: kg|st|m1|m2|m3|mm)
- quantityKg (decimal)
- reservedFor (date): Date on the panel — the delivery date of the line that is holding the lot, and the reason a warehouse can tell a reservation that is about to ship from one that
- changedAt (timestamp): Changed on the panel, blank on the row that was read.

### ReturnOrderItems
_Line items of a return order ("Return lines")._
- uuid (char)
- returnOrderUuid (→ returnOrder)
- productUuid (→ product)
- complaintUuid (→ complaint)
- originalOrderUuid (→ originalOrder): The original sales order/line this return came from.
- originalOrderLine (int)
- originalOrderItemUuid (→ originalOrderItem): The exact order line coming back.
- lineNumber (int)
- lineType (varchar)
- lineStatus (enum: provisional|released|checked|in_progress|partially_delivered|partially_invoiced|invoiced|completed|partially_received|received|expired|cancelled)
- reference (varchar)
- unit (enum: kg|st|m1|m2|m3|mm)
- quantity (decimal)
- returnQty (decimal)
- lengthMm (int)
- widthMm (int)
- thicknessMm (decimal)
- weightKg (decimal)
- qualityCode (varchar)
- stockCategory (varchar)
- options (varchar)
- country (varchar)
- returnReason (enum: damaged|wrong_quantity|wrong_material_delivered|delivered_too_late|not_delivered_or_collected|transport_damage)
- netPrice (decimal)
- priceUnit (varchar)
- costPrice (decimal)
- fsp (decimal): Fixed sales price / average purchase price reference points.
- app (decimal)
- replacementPrice (decimal)
- amount (decimal)
- deliveryDate (date)

### ReturnOrders
- uuid (char)
- companyUuid (→ company)
- orderUuid (→ order)
- orderReference (varchar)
- complaintRef (varchar)
- contactUuid (→ contact)
- customerRef (varchar)
- ourReference (varchar)
- status (enum: open|in_progress|received|credited|cancelled)
- orderDate (date)
- handlingBlocked (boolean)
- mustBeSent (boolean): Whether the document is meant to go to the customer at all, and whether somebody deliberately held it back.
- deliberatelyNotSent (boolean)
- isPrinted (boolean)
- isMailed (boolean)
- isFaxed (boolean)
- returnDate (date)
- isPickup (boolean)
- pickupAddress (varchar)
- deliveryAddressUuid (→ deliveryAddress)
- returnReason (enum: damaged|wrong_quantity|wrong_material_delivered|delivered_too_late|not_delivered_or_collected|transport_damage)
- calculateVatIfApplicable (boolean)
- invoiceBlockage (boolean)
- onlyTotalAmountOnInvoice (boolean)
- paymentTerms (enum: prepayment|cash|within_7_days_after_invoice_date|within_8_days_from_date_of_invoice|within_10_days_from_date_of_invoice|within_14_days_from_date_of_invoice|within_21_days_after_invoice_date|within_30_days_from_date_of_invoice|within_30_days_end_of_month|within_45_days_from_date_of_invoice|within_60_days_from_date_of_invoice|within_90_days_after_invoice_date|…)
- billingAddressUuid (→ billingAddress)
- blockingReason (varchar)
- completeDelivery (boolean)
- transportBlockage (boolean)
- vehicleWithCrane (boolean)
- vehicleWithCanopy (boolean)
- bundlingSeparate (boolean)
- transportRegion (enum: azie|bal|bel|dui|eng|fra|ita|lux|ned|oe|sp_po|zd_am)
- maxLengthMm (int)
- maxBundleWeightKg (decimal)
- deliveryAfterTime (varchar)
- deliverForTime (varchar)
- transportMode (enum: sea_transport|rail_transport|road_transport|air_transport|postal_shipments|fixed_transport_facilities|inland_waterway_transport|own_power)
- materialsRevenue (decimal)
- optionsRevenue (decimal)
- surchargesRevenue (decimal)
- totalExclVat (decimal)
- vatAmount (decimal)
- totalInclVat (decimal)
- totalWeightKg (decimal)
- remarks (text)

### ReturnOrderSurcharges
- uuid (char)
- returnOrderUuid (→ returnOrder)
- companyUuid (→ company)
- order (int)
- description (enum: project_discount|certificate_costs|cutting_surcharge|decoil_surcharge|order_surcharge|packaging_surcharge|pallet_surcharge|administration_costs|transport_costs|transport_costs_internal|maut_costs|return_costs|…)
- surcharge (decimal)
- unit (varchar)
- fromValue (decimal)
- unitIndication (varchar)
- tierUnit (enum: TN|Euro)
- amount (decimal)
- profit (decimal)
- thirdParties (boolean)
- companyCode (varchar)

### RevenueBudgets
_The budget for one revenue group in one month, in the reference's shape (REVENUEGROUP_BUDGET): revenue and weight **each split by order type** — out of stock, c_
- uuid (char)
- revenueGroupUuid (→ revenueGroup)
- year (int)
- month (int)
- revenueStock (decimal)
- revenueCrossDock (decimal)
- revenueFactory (decimal)
- weightStock (decimal)
- weightCrossDock (decimal)
- weightFactory (decimal)
- profitPercentageStock (decimal)
- profitPercentageCrossDock (decimal)
- profitPercentageFactory (decimal)

### RevenueGroups
_Revenue-group dimension — the bucket products roll up into for the Finance revenue reports (Revenue per revenue group, Revenue w.r.t._
- uuid (char)
- number (int)
- name (varchar)

### SalesOptions
_A processing step that can be sold alongside the material — sawing, bending, polishing and so on._
- uuid (char)
- code (varchar)
- name (varchar)
- editing (enum: stamping|polished|paper_interleaving|pickling|laser|blue_foil|bending|uv_foil|rolling|anodizing|slitting|brushing|…)
- revenueGroupUuid (→ revenueGroup)
- priceUnit (enum: HK|HM|HS|KG|M1|M2|Theor. Weight|Theor. Weight U.|M3|MM|ST|TN): What the option is charged and costs per price unit.
- basePrice (decimal)
- costPrice (decimal)
- isActive (boolean)

### ProductOptionPrices
_What one option costs on one product, for a validity window._
- uuid (char)
- productUuid (→ product)
- optionUuid (→ option)
- priceUnit (enum: HK|HM|HS|KG|M1|M2|Theor. Weight|Theor. Weight U.|M3|MM|ST|TN)
- basePrice (decimal)
- costPrice (decimal)
- validFrom (date)
- validUntil (date)

### SawingLayouts
_Sawing layouts — the Logistics "Sawing layouts" overview._
- uuid (char)
- machine (varchar): Which saw the layout runs on.
- fetchDate (date): Fetch side — retrieving the raw bar/length from stock to bring to the saw.
- fetchCode (varchar)
- fetchStatus (enum: new|in_progress|completed|cancelled)
- fetchQty (decimal)
- warehouse (varchar): Where the raw length is stored.
- section (varchar)
- location (varchar)
- product (varchar): The raw product being sawn, its description and its length, plus the residual length left over after the layout is cut.
- description (varchar)
- length (decimal)
- residualLength (decimal)
- sawingDate (date): Sawing side — the sawing operation and the product it yields.
- sawingCode (varchar)
- sawingStatus (enum: new|in_progress|completed|cancelled)
- sawingProduct (varchar)
- sawingProductDescription (varchar)
- totalPiecesToBeSawn (int)
- sawingOfTl (varchar)
- sawingAccordingToLayout (boolean)
- layoutIncludesCutoff (boolean)
- followUpProcessing (varchar)
- toLocations (varchar)
- qty1 (int): The layout's fixed ten piece slots: quantity and length for each cut.
- length1 (decimal)
- qty2 (int)
- length2 (decimal)
- qty3 (int)
- length3 (decimal)
- qty4 (int)
- length4 (decimal)
- qty5 (int)
- length5 (decimal)
- qty6 (int)
- length6 (decimal)
- qty7 (int)
- length7 (decimal)
- qty8 (int)
- length8 (decimal)
- qty9 (int)
- length9 (decimal)
- qty10 (int)
- length10 (decimal)

### StockBatches
_Which batches a stock lot holds, and how much of each._
- uuid (char)
- stockUuid (→ stock)
- batchUuid (→ batch)
- quantity (decimal)

### StockMovements
- uuid (char)
- productUuid (→ product)
- stockUuid (→ stock)
- type (enum: in|out|adjust)
- reason (enum: purchase_receipt|invoice_consumption|purchase_order_cancelled|invoice_cancelled|sale_consumption|sale_invoice_cancelled|manual_correction|count_correction|damaged|production_input|production_output|production_remnant|…)
- quantity (decimal): As wide as Stock.quantity, so a lot and its ledger always agree.
- quantityKg (decimal): The same movement measured the other two ways the reference reports it.
- valueEur (decimal)
- note (varchar)
- correctionReason (enum: rejected_material|inventory_rejection|stock_difference|stock_correction|transfer_length|internal_damage|scrap|stock_remark): Item 26b.
- attribute (enum: stock_category|quality|length_mm|width_mm|thickness_mm|remark|weighed_weight_kg|gross_weight_kg|net_weight_kg)
- valueBefore (varchar)
- valueAfter (varchar)
- originSupplierUuid (→ originSupplier): Where the metal originally came from, copied onto every movement.
- originPurchaseOrderUuid (→ originPurchaseOrder)
- purchaseOrderUuid (→ purchaseOrder): Purchase order this movement is tied to — the original "in" receipt, or the "out" reversal logged when that order is cancelled.
- purchaseInvoiceUuid (→ purchaseInvoice): Purchase invoice this movement is tied to — the "out" consumption, or the "in" reversal logged when that invoice is cancelled.
- orderUuid (→ order): Sales order this movement is tied to — set for the reservation's eventual "out" consumption once billed.
- returnOrderUuid (→ returnOrder): The return the goods came back on, and which line of it.
- returnOrderItemUuid (→ returnOrderItem)
- invoiceUuid (→ invoice): Sales invoice this movement is tied to — the "out" consumption, or the "in" reversal logged when that invoice is cancelled.
- warehouseWorkOrderLineUuid (→ warehouseWorkOrderLine): The four links above answer "which order is this about".
- productionWorkOrderLineUuid (→ productionWorkOrderLine)
- transportWorkOrderUuid (→ transportWorkOrder)
- createdByUserId (varchar): Clerk user id of whoever triggered this movement.

### StockOptions
- uuid (char)
- stockUuid (→ stock): Exactly one of these two is set — see the note above.
- productUuid (→ product)
- option (enum: uv_foil|brushing|punching|embossing|remove_paper|certificate_2_1|coating|blue_foil|grinding|shear_cut|rolling|sawing|…)
- specification (varchar): Specificatie — a second dropdown beside the option on the reference's Toevoegen block, empty on the captured lot.
- status (enum: possible|to_add|to_remove|applied): Toevoegen is what the reference stamps on a freshly added row, so a new option is staged rather than already true of the metal.

### Stock
- uuid (char)
- productUuid (→ product)
- purchaseOrderUuid (→ purchaseOrder)
- purchaseOrderItemUuid (→ purchaseOrderItem)
- quantity (decimal): Scale 6, not 3: a lot stocked in kilos is drawn down a few kilos at a time and keeps the remainder to the gram and below — scrap lot SCA stands at 89,055375 kg
- reservedQuantity (decimal): How much of quantity is earmarked by open sales order reservations — available to sell/invoice is always quantity - reservedQuantity.
- status (enum: pending|received|cancelled)
- locationUuid (→ location)
- blocked (boolean)
- orderItemUuid (→ orderItem): The sales line that cut this lot, when it is a remnant.
- plateNumber (varchar): The plate's own number within its heat — Plaatnummer on the reception and Plate no.
- internalBatch (varchar): Our own six-digit running number for the physical bundle, e.g.
- factoryNumber (varchar): Factory number on the panel — the mill's own works number, blank on all 13 lots read off order 100742 and on every lot seen since.
- supplierUuid (→ supplier): The supplier the lot was sourced from (shown as "Supplier" on the grid).
- ownerCompanyUuid (→ ownerCompany): Owner of the stock when it isn't ours — set for customer/consignment customer stock held at a location; null means it is our own stock.
- unit (enum: kg|st|m1|m2|m3|mm)
- quantityKg (decimal)
- weighedWeightKg (decimal): The other three weights, added 5-10-2026 off Corrigeren voorraad.
- grossWeightKg (decimal)
- netWeightKg (decimal)
- quality (varchar)
- stockCategory (varchar)
- options (varchar): Superseded by the StockOptions table (see stock-options.ts).
- lengthMm (int): These are the lot's **own** measurements, and every kilo derived from this row has to come from them rather than from the product's nominal ones.
- widthMm (int)
- thicknessMm (decimal)
- unopened (boolean): Whether the bundle is still banded as it left the mill.
- charge (varchar)
- internalCharge (varchar)
- bundle (varchar): Batch on the reference's stock panels — the supplier's batch number, which is not the heat: charge 030325 arrived as batches 269335, 269336, 269337, 269338, 269
- receiptDate (date)
- remark (varchar)
- valuationPrice (decimal): Cost per unit and the resulting stock value ("Valuation price" / "Stock (€)").
- valuationEuro (decimal)

### SystemLogs
_What the application did on somebody's behalf, in words — the reference's System info → Errors._
- uuid (char)
- category (enum: delivery_date_changed|financial_block|financial_unblock|commercial_block|commercial_unblock|order_changed_after_release|order_made_final|lock_removed|settings_changed)
- message (varchar)
- orderUuid (→ order)
- userId (varchar)

### TextCategories
- uuid (char)
- parentUuid (→ parent)
- name (varchar)
- description (text)
- usageCategoriesJson (json)
- sequenceNumber (int)
- isActive (boolean)

### Texts
- uuid (char)
- companyUuid (→ company)
- orderUuid (→ order)
- counterOrderUuid (→ counterOrder)
- returnOrderUuid (→ returnOrder)
- purchaseReturnOrderUuid (→ purchaseReturnOrder)
- quoteUuid (→ quote)
- purchaseOrderUuid (→ purchaseOrder)
- purchaseQuoteUuid (→ purchaseQuote)
- purchaseRequestUuid (→ purchaseRequest)
- productGroupUuid (→ productGroup)
- textCategoryUuid (→ textCategory)
- title (varchar)
- textBlock (text)
- sequenceNumber (int)
- isActive (boolean)
- createdByUserId (varchar)
- visitReport (boolean)
- purchaseQuoteRequest (boolean)
- purchaseOrder (boolean)
- purchaseOrderToolTip (boolean)
- purchaseReturnOrder (boolean)
- salesQuote (boolean)
- salesOrder (boolean)
- salesOrderToolTip (boolean)
- salesInvoice (boolean)
- warehouseOrder (boolean)
- productionOrder (boolean)
- loadlist (boolean)
- waybill (boolean)
- rideList (boolean)
- customerLabel (boolean)
- transportPlanning (boolean)
- websiteInAdvance (boolean)
- websiteAfter (boolean)

### TimeRegistrations
_Time registration — the Logistics "Time registration" overview._
- uuid (char)
- dateTime (timestamp): When the scan happened ("Date Time").
- user (varchar): The operator(s) that scanned — shop-floor scan-login codes, not Clerk dashboard users.
- extraUser (varchar)
- scanCode (varchar): The scanned barcode ("Scan code").
- context (varchar): What the scan relates to: the "Context" (e.g.
- contextReference (varchar)
- action (varchar)
- actionReference (varchar)

### TransportStatusAdjustments
_Transport status adjustment — the Logistics "Transport status adjustments" overview._
- uuid (char)
- modifier (varchar): Who changed the status ("Modifier") and when ("Time modified").
- timeModified (timestamp)
- tripStatus (enum: new|scheduled|loading_list|loaded|loading_done|in_transit|completed): The status the trip was set to ("Trip status").
- billOfLading (varchar): What the change applies to: the "Bill of lading" reference and the linked "Order" / "Order line".
- orderUuid (→ order)
- orderItemUuid (→ orderItem)

### TransportTrips
_Transport trips ("Trip data") — a vehicle run with a number of stops and the total load carried._
- uuid (char)
- tripNumber (int)
- tripDate (date)
- vehicle (varchar)
- stops (int)
- kg (decimal)
- colli (int)
- ordersPerStop (varchar)

### TransportWorkOrders
_Transport work orders — a trip (Rit) with one line per stop/destination and the order lines carried on it._
- uuid (char)
- tripNumber (int)
- date (date)
- vehicle (varchar)
- status (enum: new|scheduled|loading_list|loaded|loading_done|in_transit|completed)
- uuid (char)
- workOrderUuid (→ workOrder)
- destinationCompanyUuid (→ destinationCompany)
- postalCode (varchar)
- productUuid (→ product)
- productCode (varchar)
- orderItemUuid (→ orderItem): The order line being carried.
- orderNumber (varchar)
- action (varchar)
- sourceStatus (varchar)
- status (enum: new|scheduled|loading_list|loaded|loading_done|in_transit|completed)
- direction (enum: deliver|collect): Which way the goods travel.
- billOfLading (varchar): The consignment note the line travels under, and the thing that groups lines onto a trip: on order 100742 three lines share bill of lading 300804 on one journey
- lengthMm (int)
- widthMm (int)
- thicknessMm (decimal)
- qtyPlanned (decimal)
- qtyActual (decimal)
- qtyLoaded (decimal)
- kgPlanned (decimal)
- kgActual (decimal)
- colli (int)
- priority (int)
- fromLocation (varchar)
- toLocation (varchar)

### TransportWorkOrderLines
- uuid (char)
- workOrderUuid (→ workOrder)
- destinationCompanyUuid (→ destinationCompany)
- postalCode (varchar)
- productUuid (→ product)
- productCode (varchar)
- orderItemUuid (→ orderItem): The order line being carried.
- orderNumber (varchar)
- action (varchar)
- sourceStatus (varchar)
- status (enum: new|scheduled|loading_list|loaded|loading_done|in_transit|completed)
- direction (enum: deliver|collect): Which way the goods travel.
- billOfLading (varchar): The consignment note the line travels under, and the thing that groups lines onto a trip: on order 100742 three lines share bill of lading 300804 on one journey
- lengthMm (int)
- widthMm (int)
- thicknessMm (decimal)
- qtyPlanned (decimal)
- qtyActual (decimal)
- qtyLoaded (decimal)
- kgPlanned (decimal)
- kgActual (decimal)
- colli (int)
- priority (int)
- fromLocation (varchar)
- toLocation (varchar)

### TransporterCosts
_Transporter cost tiers — priced per validity window and KM/KG range._
- uuid (char)
- companyUuid (→ company)
- fromDate (date)
- untilDate (date)
- nowValid (boolean)
- fromKm (decimal)
- untilKm (decimal)
- fromKg (decimal)
- untilKg (decimal)
- price (decimal)
- priceUnit (enum: amount|per_km|per_kg|percentage)
- minAmount (decimal)
- maxAmount (decimal)

### TransporterCountries
_Countries a transporter serves, with delivery terms and per-country limits._
- uuid (char)
- companyUuid (→ company)
- country (enum: A|AE|AN|AZ|B|BAN|BE2|BG|BR|BY|CDN|CH|…)
- deliveryTerms (enum: exw|fca|fob|cfr|cif|cpt|cip|dap|dpu|ddp)
- maxKg (decimal)
- surchargePercentage (decimal)

### VisitPlans
_One company's contact plan for one month: are we ringing them, are we going to see them._
- uuid (char)
- companyUuid (→ company)
- planYear (int): The month the plan is for, kept as two numbers rather than a date: a plan belongs to September, not to any day in it, and the reference's screen selects a month
- planMonth (int)
- call (boolean)
- visit (boolean)
- plannedByUserId (varchar)

### VisitReports
_One visit or call: who went, when, why, whom they saw and what was said._
- uuid (char)
- companyUuid (→ company)
- representative (varchar)
- visitedBy (varchar)
- contactUuid (→ contact)
- contactMethod (enum: visit|telephone_contact)
- visitDate (varchar)
- visitTime (varchar)
- hasTakenPlace (boolean)
- visitReasons (json): Bezoekredenen on the reference's own export is plural, and two of its 166 rows name several reasons at once.
- attentionPoint (text)
- remarks (text)
- visitResult (text): The record's third free-text panel, below the report itself.
- categories (json)
- readers (json)

### WarehouseCapacity
_Warehouse capacity — the Logistics "Warehouse capacity" overview._
- uuid (char)
- capacityDate (date): The workorder day this capacity snapshot is for ("Date").
- warehouseSection (varchar): Where the capacity sits ("Warehouse section" / "Subsection") and the kind of work it covers ("Workorder type").
- subsection (varchar)
- workOrderType (enum: arranging|counting_location|counting_product|fetching|picking|pick_up|relocating|restocking|scrapping|transferring|unloading)
- toLocationUuid (→ toLocation): Which pool the capacity belongs to, when the type alone does not say.
- occupied (decimal): Capacity already taken, capacity ready to run, and what is left.
- ready (decimal)
- remaining (decimal)

### WarehouseWorkOrders
- uuid (char)
- number (int): The number the floor calls this job by.
- warehouseUuid (→ warehouse)
- type (enum: arranging|counting_location|counting_product|fetching|picking|pick_up|relocating|restocking|scrapping|transferring|unloading): What kind of job this is, which decides the route the goods take and what reporting it completed does to stock — see WAREHOUSE_WORK_ORDER_TYPE_META.
- plannedDate (date): The day the floor is meant to do it.
- status (enum: new|released|ready|approved)
- releasedAt (timestamp): When the basket was frozen and handed to the floor, and whether that release printed stock labels — releasing without them is a deliberate choice for goods that
- stockLabelsPrinted (boolean)
- createdByUserId (varchar): Created by on the reference's Warehouse workorders overview — filled on 11 560 of 11 625 rows.

### WarehouseWorkOrderLines
- uuid (char)
- workOrderUuid (→ workOrder)
- lineNumber (int): The number the line is known by, which comes from the order line it serves rather than from a counter of its own — so a work order's lines are not necessarily 1
- orderItemUuid (→ orderItem): What this line is fulfilling.
- orderNumber (varchar)
- companyUuid (→ company)
- stockUuid (→ stock): The lot the goods come out of.
- productUuid (→ product)
- productCode (varchar)
- purchaseOrderItemUuid (→ purchaseOrderItem): What is being received, on an unloading.
- returnOrderItemUuid (→ returnOrderItem): And the other thing an unloading can be receiving: goods coming back.
- purchaseOrderSupplyUuid (→ purchaseOrderSupply): And the third thing a line can be about: a lot going out to a processor (C8).
- status (enum: new|released|ready|approved)
- fromLocationUuid (→ fromLocation): Where the goods are and where they are going.
- toLocationUuid (→ toLocation)
- length (int)
- width (int)
- thickness (int)
- qtyPlanned (decimal)
- qtyActual (decimal)
- kgPlanned (decimal)
- kgActual (decimal)
- internalBatch (varchar)
- charge (varchar)
- internalCharge (varchar)
- colliCount (int)
- packaging (varchar)
- priority (int)
- rush (boolean)
- options (varchar)
- modifiedByUserId (varchar): Modified by on the same overview: whoever last released, reported or approved the line.
- qualityCode (varchar)
- quality (varchar)

### WarehouseWorkOrderPicks
- uuid (char)
- workOrderLineUuid (→ workOrderLine)
- stockUuid (→ stock): The lot this pick draws from.
- fromLocationUuid (→ fromLocation)
- toLocationUuid (→ toLocation)
- qtyPlanned (decimal)
- qtyActual (decimal): Null until the line is reported.
- kgPlanned (decimal)
- kgActual (decimal): Weighed on the scale rather than calculated: two bundles of nominally identical plate do not weigh the same, and the invoice follows the scale.
- length (int)
- width (int)
- thickness (decimal)
- charge (varchar)
- internalCharge (varchar)
- internalBatch (varchar)
- executedAt (timestamp): Who did it and when — typed on the completion dialog, not inferred from when the row happened to be written.
- executedByUserId (varchar)

### WarehouseWorkOrderPackagings
- uuid (char)
- workOrderUuid (→ workOrder)
- packaging (enum: p2m|p2_5m|p3m|p4m|euro|coil|bundles|colli)
- quantity (int)
- specification (varchar)

### Warehouses
- uuid (char)
- parentUuid (→ parent)
- type (enum: warehouse|location)
- name (varchar)
- locationType (enum: pick|bulk|production|scrap|load|inspection|put_away|sorting|processing|collection|call_off)
- loadingLocation (enum: load)
- address (enum: hego_almere|port_of_rotterdam|port_of_antwerp): Only populated for root-level rows (parentUuid IS NULL)
- blocked (boolean)
- blockReason (enum: disapproval|reserved_for_customer|other|consignment|location_type_setting|Blocked deliveries|wait_for_call)
- blockedForOptimization (boolean)
- limitedDimensions (boolean)
- minLength (int)
- maxLength (int)
- maxWidth (int)
- maxWeight (int)
- productTypes (json)
- pickingSequence (int): Only populated for non-root rows (parentUuid IS NOT NULL)
- countPer (int): Count settings (per location)
- countedThis (int)
- countTargetDate (date)
- lastCountDate (date)
- countAs (enum: technical_stock|available_stock)
- countUnderValue (int)
- countUnderUnit (varchar)
- openCountOrderAvailable (boolean)
- countMethod (enum: counting_locations|products_counting): Count workorders
- countMaxLinesPerCommand (int)
- countPrintMethod (enum: manual|automatic|do_not_print)
- countPrintStockOnSlip (boolean)
- capacityPerResource (boolean): Miscellaneous
- printAllLocationsOnSlip (boolean)
- workorderSlip (enum: a4_landscape|a4_portrait|label|label_via_csv)
- addSectionToCsvFileName (boolean)
- callOffLocation (varchar)
- transportByCompanyUuid (→ transportByCompany)
- sawingMakePerSubsection (boolean): Fetch workorders for Sawing
- pickupDefaultLocationUuid (→ pickupDefaultLocation): Pick-up workorders
- pickupSlipPrinter (enum: microsoft_print_to_pdf_8_redirected|onenote_desktop_8_redirected|send_to_onenote_16|sales_black|sales_color|sato_cl4nx_203dpi|sato_cl408e_logistics|onenote_desktop|microsoft_print_to_pdf|logistics_black|logistics_color|administration_black|…)
- pickupOrderPrinter (enum: microsoft_print_to_pdf_8_redirected|onenote_desktop_8_redirected|send_to_onenote_16|sales_black|sales_color|sato_cl4nx_203dpi|sato_cl408e_logistics|onenote_desktop|microsoft_print_to_pdf|logistics_black|logistics_color|administration_black|…)
- a4PrinterOriginal (enum: microsoft_print_to_pdf_8_redirected|onenote_desktop_8_redirected|send_to_onenote_16|sales_black|sales_color|sato_cl4nx_203dpi|sato_cl408e_logistics|onenote_desktop|microsoft_print_to_pdf|logistics_black|logistics_color|administration_black|…): Print settings — A4 Printers
- a4PrinterCopy1 (enum: microsoft_print_to_pdf_8_redirected|onenote_desktop_8_redirected|send_to_onenote_16|sales_black|sales_color|sato_cl4nx_203dpi|sato_cl408e_logistics|onenote_desktop|microsoft_print_to_pdf|logistics_black|logistics_color|administration_black|…)
- a4PrinterCopy2 (enum: microsoft_print_to_pdf_8_redirected|onenote_desktop_8_redirected|send_to_onenote_16|sales_black|sales_color|sato_cl4nx_203dpi|sato_cl408e_logistics|onenote_desktop|microsoft_print_to_pdf|logistics_black|logistics_color|administration_black|…)
- a4SmallMaterialThresholdMm (int): Print settings — A4 Printers small material
- a4SmallPrinterCopy1 (enum: microsoft_print_to_pdf_8_redirected|onenote_desktop_8_redirected|send_to_onenote_16|sales_black|sales_color|sato_cl4nx_203dpi|sato_cl408e_logistics|onenote_desktop|microsoft_print_to_pdf|logistics_black|logistics_color|administration_black|…)
- a4SmallPrinterCopy2 (enum: microsoft_print_to_pdf_8_redirected|onenote_desktop_8_redirected|send_to_onenote_16|sales_black|sales_color|sato_cl4nx_203dpi|sato_cl408e_logistics|onenote_desktop|microsoft_print_to_pdf|logistics_black|logistics_color|administration_black|…)
- labelPrinter (enum: microsoft_print_to_pdf_8_redirected|onenote_desktop_8_redirected|send_to_onenote_16|sales_black|sales_color|sato_cl4nx_203dpi|sato_cl408e_logistics|onenote_desktop|microsoft_print_to_pdf|logistics_black|logistics_color|administration_black|…): Print settings — other printers
- stickerPrinter (enum: microsoft_print_to_pdf_8_redirected|onenote_desktop_8_redirected|send_to_onenote_16|sales_black|sales_color|sato_cl4nx_203dpi|sato_cl408e_logistics|onenote_desktop|microsoft_print_to_pdf|logistics_black|logistics_color|administration_black|…)
- csvCustomerLabelFileName (varchar): Print settings — CSV files for customer labels

### WorkPanelLocks
_A record somebody has open for editing — the reference's Geopende werkpanelen._
- uuid (char)
- panelType (enum: order|company)
- recordUuid (→ record)
- description (varchar)
- userId (varchar)
- openedAt (timestamp)
