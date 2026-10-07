export const addressCategories = [
  "invoice",
  "visit",
  "correspondence",
  "delivery",
] as const satisfies readonly string[];

export type AddressCategory = (typeof addressCategories)[number];

export const availableAtOptions = [
  "crane_unloading",
  "forklift_unloading",
] as const satisfies readonly string[];

export type AvailableAt = (typeof availableAtOptions)[number];

export const companyLangs = [
  "dutch",
  "arabic",
  "english",
] as const satisfies readonly string[];

export type CompanyLang = (typeof companyLangs)[number];

export const companyRoles = [
  "customer",
  "prospect",
  "supplier",
  "processor",
  "transporter",
  "agent",
  "purchasing_org",
  "other",
  "internal",
] as const satisfies readonly string[];

export type CompanyRole = (typeof companyRoles)[number];

export const contractableRoles = [
  "customer",
  "prospect",
  "supplier",
  "processor",
] as const satisfies readonly string[];

export type ContractableRole = (typeof contractableRoles)[number];

/**
 * Which side of the business an agreed price belongs to, and therefore which
 * contracts it is read from: a purchase price is what a supplier or processor
 * charges us, a sales price what a customer or prospect pays.
 */
export const netPriceSides = [
  "purchase",
  "sales",
] as const satisfies readonly string[];

export type NetPriceSide = (typeof netPriceSides)[number];

export const contractTypes = [
  "gross_prices",
  "options",
  "net_prices",
  "cost_price",
  "surcharges",
  "allowances",
] as const satisfies readonly string[];

export type ContractType = (typeof contractTypes)[number];

export const communicationSettingDocumentTypes = [
  "order_status_message",
  "bill_of_lading",
  "order_confirmation",
  "quote",
  "purchase_request",
  "purchase_return",
  "purchase_order",
  "consignment_consumption_confirmation",
  "call_off_confirmation",
  "return_order_confirmation",
  "pro_forma_invoice",
  "certificate_email",
  "invoice",
  "price_catalogue",
  "eta",
  "eta_delayed",
  "checklist",
] as const satisfies readonly string[];

export type CommunicationSettingDocumentType =
  (typeof communicationSettingDocumentTypes)[number];

export const communicationSettingTypes = [
  "email",
  "fax",
  "printing",
  "edi_ftp",
  "edi_http",
  "edi_https",
] as const satisfies readonly string[];

export type CommunicationSettingType =
  (typeof communicationSettingTypes)[number];

export const contractTierUnits = [
  "TN",
  "Euro",
] as const satisfies readonly string[];
export type ContractTierUnit = (typeof contractTierUnits)[number];

export const contractSurchargePerTypes = [
  "order_line",
  "group_product",
  "product_group",
] as const satisfies readonly string[];
export type ContractSurchargePerType =
  (typeof contractSurchargePerTypes)[number];

export const contractDiscountBasedOnTypes = [
  "group_product",
  "product_group",
] as const satisfies readonly string[];
export type ContractDiscountBasedOnType =
  (typeof contractDiscountBasedOnTypes)[number];

export const visitReportContactMethods = [
  "visit",
  "telephone_contact",
] as const satisfies readonly string[];

export type VisitReportContactMethod =
  (typeof visitReportContactMethods)[number];

export const visitReportReasons = [
  "visit_frequency",
  "turnover_is_lagging_behind",
  "complaint",
  "quotation_follow_up",
  "at_customers_request",
  "introduction",
  "potential_customer_prospect",
] as const satisfies readonly string[];

export type VisitReportReason = (typeof visitReportReasons)[number];

export const communicationSettingShapes = [
  "pdf",
  "scsn",
  "sales_in_the_construction",
  "edi4steel",
  "text",
  "peppol",
] as const satisfies readonly string[];

export type CommunicationSettingShape =
  (typeof communicationSettingShapes)[number];

export const salesRepresentatives = [
  "arian_bloks",
  "bnl",
  "cherice_van_rooyen",
  "export",
  "guy_mambourg",
  "hego",
] as const satisfies readonly string[];

export type SalesRepresentative = (typeof salesRepresentatives)[number];

export const devTheorWtOptions = [
  "theoretical_weight",
  "trade_weight",
  "german_trade_weight",
  "weighed",
] as const satisfies readonly string[];

export type DevTheorWt = (typeof devTheorWtOptions)[number];

export const groupLinesByDescriptionOptions = [
  "order_of_order_lines",
  "alphabetical_order",
  "lowest_order_line",
  "print_group_titles",
] as const satisfies readonly string[];

export type GroupLinesByDescription =
  (typeof groupLinesByDescriptionOptions)[number];

export const printProductCodesOptions = [
  "do_not_print",
  "print_easy2trade",
  "print_company",
] as const satisfies readonly string[];

export type PrintProductCodes = (typeof printProductCodesOptions)[number];

export const miscellaneousOptions = [
  "occasional_customer",
  "customer_has_login_code",
  "bill_of_ladings_per_order",
  "print_waybills",
  "consignment_customer",
  "neutral_labels",
  "label_per_sawed_piece",
] as const satisfies readonly string[];

export type MiscellaneousOption = (typeof miscellaneousOptions)[number];

export const quoteOrderOptions = [
  "reference_required",
  "complete_delivery",
  "round_weight_per_piece_up",
  "certificate",
  "overlength",
  "default_pickup",
] as const satisfies readonly string[];

export type QuoteOrderOption = (typeof quoteOrderOptions)[number];

export const quoteOrderInvoiceOptions = [
  "do_not_print_prices",
  "total_amount_per_line",
  "condensing_options",
  "include_option_prices_in_material_prices",
] as const satisfies readonly string[];

export type QuoteOrderInvoiceOption = (typeof quoteOrderInvoiceOptions)[number];

export const orderOptions = [
  "net_prices_only",
  "scrap_surcharge_separately",
  "no_commercial_blocking",
  "no_financial_blockage",
  "call_off_quantities_on_call_off_confirmation",
  "backorders_on_order_confirmation",
] as const satisfies readonly string[];

export type OrderOption = (typeof orderOptions)[number];

export const quoteOptions = [
  "net_prices_only",
  "scrap_surcharge_separate",
  "no_commercial_blocking",
  "no_financial_blockage",
  "dont_show_at_all",
] as const satisfies readonly string[];

export type QuoteOption = (typeof quoteOptions)[number];

export const ediOptions = [
  "product_features",
  "send_pdf",
] as const satisfies readonly string[];

export type EdiOption = (typeof ediOptions)[number];

export const contactSalutations = [
  "mr",
  "mrs",
] as const satisfies readonly string[];

export type ContactSalutation = (typeof contactSalutations)[number];

export const contactCategories = [
  "procurement",
  "sales",
  "warehouse",
  "management",
  "bookkeeping",
  "certificates",
] as const satisfies readonly string[];

export type ContactCategory = (typeof contactCategories)[number];

export const warehouseTypes = [
  "warehouse",
  "location",
] as const satisfies readonly string[];

export type WarehouseType = (typeof warehouseTypes)[number];

export const warehouseAddresses = [
  "hego_almere",
  "port_of_rotterdam",
  "port_of_antwerp",
] as const satisfies readonly string[];

export type WarehouseAddress = (typeof warehouseAddresses)[number];

export const warehouseLocationTypes = [
  "pick",
  "bulk",
  "production",
  "scrap",
  "load",
  "inspection",
  "put_away",
  "sorting",
  "processing",
  "collection",
  "call_off",
] as const satisfies readonly string[];

export type WarehouseLocationType = (typeof warehouseLocationTypes)[number];

export const warehouseLoadingLocations = [
  "load",
] as const satisfies readonly string[];

export type WarehouseLoadingLocation =
  (typeof warehouseLoadingLocations)[number];

export const warehouseCountStockTypes = [
  "technical_stock",
  "available_stock",
] as const satisfies readonly string[];

export type WarehouseCountStockType = (typeof warehouseCountStockTypes)[number];

export const warehouseBlockReasons = [
  "disapproval",
  "reserved_for_customer",
  "other",
  "consignment",
  "location_type_setting",
  // The customer has bought the goods and will say when to send them. The only
  // blocking reason on the reference's entire "Blocked deliveries" screen, and
  // the reason a call-off order exists at all: the line is finished, wanted,
  // and deliberately not moving.
  "wait_for_call",
] as const satisfies readonly string[];

export type WarehouseBlockReason = (typeof warehouseBlockReasons)[number];

export const warehouseProductTypes = [
  "beam",
  "tube",
  "sheet",
  "profile",
  "bar",
] as const satisfies readonly string[];

export type WarehouseProductType = (typeof warehouseProductTypes)[number];

export const warehouseTransportRegions = [
  "azie",
  "bal",
  "bel",
  "dui",
  "eng",
  "fra",
  "ita",
  "lux",
  "ned",
  "oe",
  "sp_po",
  "zd_am",
] as const satisfies readonly string[];

export const productShapes = [
  "bar_steel",
  "coil",
  "piece_article",
  "sheet",
  "tube",
  "beam_steel",
  "profile",
] as const satisfies readonly string[];

export type ProductShape = (typeof productShapes)[number];

export const articleGroups = [
  "ck304",
  "ck316",
  "ck430",
  "ckm304",
  "pdiva",
  "pk304",
  "pta2_5",
  "pta3",
  "pta3_5",
  "pta5",
  "pw304",
  "pw316",
  "pw430",
] as const satisfies readonly string[];

export type ArticleGroup = (typeof articleGroups)[number];

export const purchasingUnits = [
  "HK",
  "HM",
  "HS",
  "KG",
  "M1",
  "MM",
  "ST",
  "TN",
] as const satisfies readonly string[];

export type PurchasingUnit = (typeof purchasingUnits)[number];

export const deliveryTimeUnits = [
  "months",
  "weeks",
  "working_days",
] as const satisfies readonly string[];

export type DeliveryTimeUnit = (typeof deliveryTimeUnits)[number];

export const revenueGroups = [
  "ss_304",
  "ss_316",
  "ss_321",
  "ss_430",
  "high_alloys",
  "aluminium",
  "steel",
  "roestvast_nl",
  "foil_consumption_and_sales",
  "sales_residual_material",
  "other_pallets_etc",
  "other_products",
  "decoiling",
  "grinding_foiling",
  "cutting",
  "lasering",
  "other_processing",
  "freight_costs",
  "freight_costs_external",
  "credit_notes_yet_to_be_received",
  "vat_credit_restriction_creditor",
  "price_differences",
  "other_allowances",
  "eu_import_duties",
  "revenue_asia_vs_eu_material",
  "import_costs",
] as const satisfies readonly string[];

export type RevenueGroup = (typeof revenueGroups)[number];

export const salesUnitOptions = [
  "HK",
  "HM",
  "HS",
  "KG",
  "M1",
  "M2",
  // The unit a theoretical weight is nearly always struck in. A product whose
  // "Theor. Weight" reads 7.850 and whose "Theor. Weight U." reads M3 is
  // carrying a density in kg/m3, not a weight — see THEORETICAL_WEIGHT_BASIS
  // for what each unit makes the stored figure mean.
  "M3",
  "MM",
  "ST",
  "TN",
] as const satisfies readonly string[];

export type SalesUnit = (typeof salesUnitOptions)[number];

export const vatCodes = [
  "vat_0",
  "vat_low_9",
  "vat_high_21",
  "vat_middle_12",
] as const satisfies readonly string[];

export type VatCode = (typeof vatCodes)[number];

export const certificaatOptions = [
  "en10204_2_1",
  "en10204_3_1",
] as const satisfies readonly string[];

export type CertificaatOption = (typeof certificaatOptions)[number];

export const stockModes = [
  "multiplier",
  "fixed_value",
] as const satisfies readonly string[];

export type StockMode = (typeof stockModes)[number];

export const leadTimeMethods = [
  "manually",
  "automatic_maximum",
  "automatic_average",
] as const satisfies readonly string[];

export type LeadTimeMethod = (typeof leadTimeMethods)[number];

export const stockLabelTypes = [
  "label",
  "sticker",
] as const satisfies readonly string[];

export type StockLabelType = (typeof stockLabelTypes)[number];

export const stockLabelPrintingOptions = [
  "per_line_bundle",
  "per_bundle",
  "amount_per_line",
] as const satisfies readonly string[];

export type StockLabelPrintingOption =
  (typeof stockLabelPrintingOptions)[number];

export const stockStatuses = [
  "pending",
  "received",
  "cancelled",
] as const satisfies readonly string[];

export type StockStatus = (typeof stockStatuses)[number];

export const stockMovementTypes = [
  "in",
  "out",
  // 🔴 A movement that moves nothing. Added 29-9-2026 to close the gap item
  // 26b found: the reference ran `Correction…` twice on lot `404763`, the
  // second downgrading it `Standaard` → `2nd choice`, and wrote **no mutation
  // either time**. A prime bundle became 2nd choice with no record of who did
  // it, when, or what it had been.
  //
  // The category is not cosmetic — it decides what the metal can be sold as and
  // it is the basis of the 2nd-choice split in the stock analysis — so ours
  // records the change even though nothing physical happened. An `adjust` row
  // carries quantity 0 and names the attribute, the value before and the value
  // after instead.
  "adjust",
] as const satisfies readonly string[];

export type StockMovementType = (typeof stockMovementTypes)[number];

// What a general-ledger account is, which decides which side of it increases
// and which of the two statements it lands on. Assets and expenses increase on
// the debit side; liabilities, equity and revenue on the credit side.
export const ledgerAccountTypes = [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
] as const satisfies readonly string[];

export type LedgerAccountType = (typeof ledgerAccountTypes)[number];

export const stockMovementReasons = [
  "purchase_receipt",
  "invoice_consumption",
  "purchase_order_cancelled",
  "invoice_cancelled",
  "sale_consumption",
  "sale_invoice_cancelled",
  "manual_correction",
  "count_correction",
  "damaged",
  // The material a production line took to the machine, out of the lot it was
  // reserved from. Its counterpart is production_output plus, where the offcut
  // is worth keeping, production_remnant.
  "production_input",
  "production_output",
  // The usable offcut a production line put back — a new, smaller lot of the
  // same material, free for anyone to order.
  "production_remnant",
  // Material that entered the machine and came out as neither goods nor
  // remnant: saw kerf, trim, scrap. What the sawing-waste control list reports.
  "sawing_waste",
  // Goods a customer sent back, booked into stock when the return is received.
  "sales_return",
  // Goods sent back to the supplier, taken out of the lot they arrived in.
  "purchase_return",
  // The four a warehouse work order logs when a line is reported completed.
  // Unloading brings goods in off a purchase order; a pick-up takes them out to
  // the customer collecting them; every internal type moves a lot from one
  // location to another, which is logged as an "out" of the source lot and an
  // "in" of the destination one; scrapping writes a lot off the shelf.
  "warehouse_receipt",
  "warehouse_issue",
  "warehouse_transfer",
  "warehouse_scrapped",
  // The two legs of sending metal out to be worked on by somebody else.
  //
  // It leaves as our stock (`_issue`) and comes back as our stock
  // (`_return`) — the processor never owns it, which is why both legs are
  // stock movements rather than a sale and a purchase. Finance keeps a
  // "Control Stock increase due to external processing" list watching this
  // pair, and both legs hang off the PURCHASE order that bought the
  // processing: all 483 rows of the 18-9-2026 export carry an `IO4` number.
  //
  // ⚠️ Corrected 19-9-2026. The comment here used to say the goods "came back
  // worth more than they went out". The export says otherwise — across 112
  // orders with both legs the median value ratio is **0,759**, 72 of them lose
  // value, and the file nets to **−€ 146.964**. Weight is roughly conserved
  // (median yield 0,998); value is not. The list is a control on that loss,
  // not a celebration of a gain.
  "external_processing_issue",
  "external_processing_return",
  // The opening balance a lot was migrated in with. The reference's own data
  // carries thousands of these stamped within the same three seconds on
  // 31-12-2024, all reason "Conversion" — they are not movements anybody made
  // and must never be read as trading activity.
  "data_conversion",
  // The two legs of `Overboeken` — the reference's `Aanmaken
  // overboekingsopdracht`, which moves a lot to another **article**.
  //
  // 🔑 This is the one internal act that *is* a mutation, and the reason the
  // relocation rule above does not cover it. Relocating a lot changes where
  // metal sits and nothing else, so the ledger stays quiet. A transfer changes
  // **what the metal is**: article A holds less afterwards and article B holds
  // more, and every stock report that totals by article would otherwise
  // disagree with itself across the move.
  //
  // Two reasons rather than one, for the same reason a relocation writes two
  // rows: netting them into one would leave the ledger unable to say which
  // article lost and which gained.
  "stock_transfer_out",
  "stock_transfer_in",
] as const satisfies readonly string[];

export type StockMovementReason = (typeof stockMovementReasons)[number];

/**
 * The reasons `Correction…` offers, read off the open `Reden` dropdown on
 * 29-9-2026 — eight of them, and the reference will not let `OK` come alive
 * until one is chosen, so a reason is mandatory here rather than nice to have.
 *
 * They are not interchangeable, which is why they are their own list rather
 * than being folded into `stockMovementReasons`. Each one decides two things,
 * both in `stockCorrectionReasonRules`: which movement reason the row is filed
 * under, and whether it is allowed to touch quantity at all.
 *
 * 🔴 The eighth is the odd one: `Opmerking voorraad toevoegen/aanpassen`
 * — *add / adjust stock remark* — is not a physical movement of anything. It
 * pairs with the dialog's characteristics checkbox and its remark field, so
 * the one dialog does double duty: it corrects metal, and it corrects notes.
 * Without it every remark edit would look like a stock movement.
 */
export const stockCorrectionReasons = [
  "rejected_material",
  "inventory_rejection",
  "stock_difference",
  "stock_correction",
  "transfer_length",
  "internal_damage",
  "scrap",
  "stock_remark",
] as const satisfies readonly string[];

export type StockCorrectionReason = (typeof stockCorrectionReasons)[number];

/**
 * What a correction is allowed to change about a lot without moving any of it.
 *
 * The dialog's second half — `Voorraad kenmerk correctie`, which is unticked by
 * default and greys its own section. `Categorie` is a dropdown, `Kwaliteit` a
 * field, the three dimensions are fields, and the remark is free text.
 *
 * Each of these gets a movement row of its own when it changes, because
 * "category and quality both changed" is two facts and a single row could only
 * hold one of them.
 */
export const stockCorrectableAttributes = [
  "stock_category",
  "quality",
  "length_mm",
  "width_mm",
  "thickness_mm",
  "remark",
  // 🔴 The four weights, added 5-10-2026 off the real `Corrigeren voorraad`.
  //
  // The dialog carries `Gewicht`, `Gewogen gewicht`, `Brutogewicht` and
  // `Nettogewicht` as four separate editable boxes, and on the captured lot
  // they read 1 766,25 / 1 754 / 1 798 / 1 754 — so they genuinely disagree and
  // none of them can be derived from another. `gross − tare = net = weighed`,
  // and the theoretical weight is a fifth number that comes from the article.
  //
  // Correcting one of these moves no metal and no money, so each lands as an
  // `adjust` row naming which weight changed. Collapsing them into one
  // attribute would make the ledger unable to say whether somebody re-weighed a
  // bundle or re-declared what the mill said it was.
  //
  // ⚠️ `Gewicht` — the theoretical weight — is deliberately **not** here. It
  // sits in the dialog's *quantity* half beside `Nieuwe hoeveelheid`, it moves
  // with the metal, and it is already carried as the quantity leg's own kilo
  // figure. Listing it here as well would record every receipt twice.
  "weighed_weight_kg",
  "gross_weight_kg",
  "net_weight_kg",
] as const satisfies readonly string[];

export type StockCorrectableAttribute =
  (typeof stockCorrectableAttributes)[number];

// Stock unit ("StkU") a stock lot is counted in — kg for coil/plate, pieces
// for cut items, running/square/cubic metres for profiles.
export const stockUnits = [
  "kg",
  "st",
  "m1",
  "m2",
  "m3",
  "mm",
] as const satisfies readonly string[];

export type StockUnit = (typeof stockUnits)[number];

/**
 * What kind of demand is holding a lot.
 *
 * `Sale` is the only value the reference has been seen to write — reservation
 * O100742/50 on the `Laad` lot of product 6010015315, read off `Toon
 * reserveringen` on 10-9-2026. Its own column is called `Type`, which says
 * plainly that it expects more, and a cut reserving its material is the obvious
 * candidate.
 *
 * Only the proved value is listed here on purpose. Widening a `mysqlEnum` later
 * is free; inventing a member now and finding the reference spells it
 * differently is not.
 */
/**
 * How an order is being handled — the `Normal` dropdown in the reference's
 * order-type block, read off 1.970 lines of its Production capacity details
 * export:
 *
 *   Normal 1.933    Call-off 29    Rush 8
 *
 * ⚠️ **The reference labels two different fields `Order type`.** On the order
 * itself and on Production capacity details it is this one — the urgency. On
 * the revenue screens it is [orderSourceTypes] below, rolled up from the lines.
 * The two share a header and share nothing else, and reading the revenue
 * screens' header as this field is the mistake an earlier version of the notes
 * made.
 */
export const orderTypes = [
  "normal",
  "call_off",
  "rush",
  // One header of 2.091 carries it. Thin for a distribution, conclusive for
  // membership: the value is in the reference's list.
  "ex_works",
] as const satisfies readonly string[];

export type OrderType = (typeof orderTypes)[number];

/**
 * Where the metal on a line comes from — the reference's `Line type`.
 *
 * It runs through the whole system as a column or a grouping level, and it
 * splits purchases as well as sales. It is not a label:
 *
 *   Stk  EUR 6.930.267 revenue   2.580.020 kg   20,09 % margin
 *   CD   EUR 2.102.335 revenue     793.310 kg   10,55 % margin
 *
 * A quarter of the volume at half the margin, which follows from what CD is:
 * the goods are bought against a specific sale rather than taken out of stock,
 * so nothing was carried and nothing was handled. Its own screen — `CD
 * deliveries in progress` — prints the sales line and the purchase line on one
 * row, which is what `OrderItems.purchaseOrderItemUuid` records.
 *
 * `Stk+CD` is a real third value, on 31 of 1.970 lines: a line filled partly
 * from stock and partly by buying in.
 *
 * 🔑 **And `EXW` is a fourth, proved 7-10-2026** by grouping `Purchase lines`
 * on `Line type` over 2024–2025: three groups, `CD` · `EXW` · `Stk`. It had
 * shown once before, on a single sales line, and been written off as thin.
 * The same three show up as the three **minimum profit margins** on every
 * product (`Stock · Ex works · Cross Docking`) and as the three columns of the
 * reference's `REVENUEGROUP_BUDGET` (`STOCK · FACTORY · CROSSDOCK`). So this
 * is not a line label: it is a **mode of the trade**, and three things key on
 * it — the margin floor, the budget split, and whether the metal ever touches
 * our shelf.
 *
 *   Stk   supplier → our warehouse → customer
 *   CD    supplier → our lorry → customer   (`Pick up/Drop-off CD-purchases`)
 *   EXW   see below — one row, and it is not what the name suggests
 *
 * ⚠️ **The only `EXW` purchase line in 21 months is a toll-processing return,
 * not a mill delivery.** Order `400143/10`, 15-1-2025: one 3000×1500×5 plate,
 * 177 kg, from Decomecc N.V. — a `LOON (E)` company, i.e. a contract
 * processor — at **€ 0,05 per tonne**, `Received` with `Qty ordered 0` and
 * `Qty confirmed 0` (never sent, never acknowledged, yet arrived), carrying an
 * **internal** certificate (`INtern`, `NVT`) and booked to `3000 Stock` at
 * € 0,01. Its purchase-order type reads `Ex works Pro…`, a value our
 * `purchaseOrderTypes` does not hold. So on the buying side `EXW` is how metal
 * that was already ours comes back from a processor's works. Whether the
 * selling side's single `EXW` line is its mirror is still open.
 *
 * ⚠️ Either way `ex_works` is somebody else's works, not ours. A customer
 * collecting at our dock is `Pick-up`, a separate boolean — orders-and-quotes.md
 * counts 307 `Normal` pick-up orders against one `Ex works` one.
 *
 * 🚫 Both revenue screens also show an unlabelled group carrying `Price
 * differences` (94.091 kg at a 68 % margin). That is where price corrections
 * land, not a way of selling steel, so it is not a member here.
 *
 * ⚠️ Not to be confused with `OrderItems.lineType`, which is ours and holds
 * `material` — a different axis that the reference keeps in separate tables
 * rather than in a column.
 */
export const orderSourceTypes = [
  "stock",
  "stock_and_cross_dock",
  "cross_dock",
  "ex_works",
] as const satisfies readonly string[];

export type OrderSourceType = (typeof orderSourceTypes)[number];

/**
 * The values a **purchase** line can take. `Stk+CD` is absent on purpose: it
 * is a sales line filled from two sources, and a purchase line has one.
 * The 7-10-2026 grouping of the purchase-lines grid showed exactly these three.
 */
export const purchaseSourceTypes = [
  "stock",
  "cross_dock",
  "ex_works",
] as const satisfies readonly OrderSourceType[];

export type PurchaseSourceType = (typeof purchaseSourceTypes)[number];

/**
 * What kind of demand is holding a lot.
 *
 * Built from a single popup row reading `Sale`, then widened when the screen's
 * own 435-row export arrived: its `Reservation type` column is a cross product
 * of this and [reservationStatuses], and 23 rows are on the purchase side.
 *
 * A **purchase** reservation is external processing: 15 of the 23 stand at a
 * `Bewerker` location and the company is the processor — Metalfinish, Decomecc,
 * Demar Laser, Hego Production. Material goes out to be ground, foiled, slit or
 * lasered and the purchase order for that work holds it. Coils and plates
 * alike: 13 coils against 10 plates, so it is not a coil-only arrangement. The
 * same flow the `Control Stock increase due to external processing` screen
 * posts to GLA 3100.
 *
 * **`scrap`** appears once in 435 rows: two plates on a `Pick` location with no
 * order behind them, waiting to be written off. One row is thin evidence for a
 * member, but the reference prints the word and a scrap hold is a different
 * thing from a sale — reading it as either of the other two would be worse.
 *
 * This is why the list was kept to the one proved value rather than padded out
 * with guesses: widening a `mysqlEnum` costs nothing, and the guess would have
 * been "production", which is not what any of the other three turned out to be.
 */
export const reservationTypes = [
  "sale",
  "purchase",
  "scrap",
] as const satisfies readonly string[];

export type ReservationType = (typeof reservationTypes)[number];

/**
 * How firm a reservation is, and it is a progression rather than a label —
 * across the reference's 435 reservations:
 *
 *   Temporary     5   `Order` is **0** on every one: a hold with no document
 *   Provisional  66   a real order, but 64 of the 66 still at a `Pick` location
 *   Definitive  364   169 of them at `Laad`, staged for a truck
 *
 * So a reservation starts as somebody holding metal by hand, becomes
 * provisional when an order exists, and definitive once the goods are committed.
 * `Temporary` is why `Reservations.orderItemUuid` is nullable.
 */
export const reservationStatuses = [
  "definitive",
  "provisional",
  "temporary",
] as const satisfies readonly string[];

export type ReservationStatus = (typeof reservationStatuses)[number];

// How a counterparty counts in the steel federation (SFN) goods-flow return:
// a mill that makes the material, a fellow federation member, or anyone else.
// Combined with whether the counterparty sits at home or abroad, this decides
// which column of the "Freight flow (SFN)" report a movement lands in.
export const sfnCounterpartyRoles = [
  "producer",
  "sfn_member",
  "non_member",
] as const satisfies readonly string[];

export type SfnCounterpartyRole = (typeof sfnCounterpartyRoles)[number];

export const customerLabelOptions = [
  "csv_file",
  "line_label",
  "no_customer_label",
  "sticker_per_collo",
  "sticker_per_line",
  "sticker_per_piece",
] as const satisfies readonly string[];

export type CustomerLabelOption = (typeof customerLabelOptions)[number];

export const decimalPlacesOptions = [
  "0",
  "1",
  "2",
] as const satisfies readonly string[];

export type DecimalPlacesOption = (typeof decimalPlacesOptions)[number];

export const processedOptions = [
  "D",
  "SL",
  "K",
  "LSR",
  "DUP",
  "NG",
  "BF",
  "L",
  "F",
  "FV",
  "ANO",
  "BEI",
  "COA",
  "SIC",
  "PER",
  "KNT",
  "POL",
  "PON",
  "SLI",
  "WAL",
  "STP",
  "Z",
] as const satisfies readonly string[];

export type ProcessedOption = (typeof processedOptions)[number];

export const ceStandards = [
  "en_10255",
  "en_10219_1",
  "en_10210_1",
  "en_10025_1",
] as const satisfies readonly string[];

export type CeStandard = (typeof ceStandards)[number];

export const productQualityStandards = [
  "en_10025_2",
  "en_10219_1",
] as const satisfies readonly string[];

export type ProductQualityStandard = (typeof productQualityStandards)[number];

export const featuresQualities = [
  "115CrV3",
  "11SMn30+C/SH",
  "11SMnPb30+C/SH",
  "300-serie",
  "301",
  "303",
  "304",
  "3041D",
  "3042B",
  "3042BB",
  "3042D",
  "3042E",
  "3044N",
  "304BA",
  "304DECO",
  "304DIV",
  "304L",
  "304L1D",
  "304L2B",
  "304L2BB",
  "304L2D",
  "304L2E",
  "304L4N",
  "304LBA",
  "304LNO4",
  "304LSB",
  "304POL",
  "304SB",
  "304-serie",
  "309",
  "3092B",
  "3092BB",
  "309BA",
  "309H2B",
  "310",
  "3102B",
  "3102BB",
  "310S1D",
  "310SWGW",
  "316",
  "3161D",
  "3162B",
  "316BA",
  "316L",
  "316L1D",
  "316L2B",
  "316L2D",
  "316L2E",
  "316LBA",
  "316LWGW",
  "316-serie",
  "316T",
  "316T1D",
  "316T2B",
  "316T2D",
  "316T2E",
  "316TBA",
  "316TWGW",
  "321",
  "3211D",
  "3212B",
  "321WGW",
  "34CrNiMo6+QT",
  "40031D",
  "400-serie",
  "409",
  "4092B",
  "410S",
  "410S2B",
  "42CrMoS4+QT",
  "42MnV7",
  "430",
  "4301D",
  "4302B",
  "4302BB",
  "4304N",
  "430AF/SB",
  "430BA",
  "430SB",
  "431",
  "439",
  "4392B",
  "439BA",
  "441",
  "4412B",
  "4412D",
  "441BA",
  "444",
  "4442B",
  "4442D",
  "444BA",
  "4510Ti BA",
  "4513",
  "48351D",
  "A1050",
  "A1050H111",
  "A1050H22",
  "A1050H24",
  "A105N",
  "A106 Grade B",
  "A234 Grade WPB",
  "A3103",
  "A3103 H14",
  "A5005",
  "A5005H111",
  "A5005H14",
  "A5005H22",
  "A5005H24",
  "A5083",
  "A5083H111",
  "A5083H22",
  "A5083H24",
  "A5754",
  "A5754H111",
  "A5754H22",
  "A5754H24",
  "A5754O2TR",
  "A5754O5TR",
  "A6082",
  "A6082T6",
  "AlCuBiPb",
  "AlCuMgPb",
  "AlMg4.5Mn0.7",
  "AlMgSi0.5",
  "AlMgSi1",
  "Alu",
  "B500A-HKN",
  "B500B-HWL",
  "C15R",
  "C22",
  "C35+C/SH",
  "C35R",
  "C45",
  "C45+C",
  "C45+C/SH",
  "C45+N",
  "C45+SL",
  "C60R",
  "C85S",
  "DC01",
  "DC01+ZE25/25APC",
  "DC01-Am",
  "DX51D+Z275MAC",
  "E195",
  "E220",
  "E-Cu",
  "HA-serie",
  "Laserpress 240",
  "Ms58",
  "Ms63",
  "P195T",
  "P235GH",
  "P235TR1",
  "P250GH",
  "Rg12",
  "Rg7",
  "S195T",
] as const satisfies readonly string[];

export type FeaturesQuality = (typeof featuresQualities)[number];

export type WarehouseTransportRegion =
  (typeof warehouseTransportRegions)[number];

export const transportModes = [
  "sea_transport",
  "rail_transport",
  "road_transport",
  "air_transport",
  "postal_shipments",
  "fixed_transport_facilities",
  "inland_waterway_transport",
  "own_power",
] as const satisfies readonly string[];

export type TransportMode = (typeof transportModes)[number];

// The reference's own list, read off the `Return reason` dropdown of return
// order `290247` on 29-9-2026. Six values, and the field is the only thing on a
// return that says why the goods came back — there is no link to the sale it
// reverses, on the header, the line or the charge.
//
// The seven that used to be here were invented before the screen was ever
// opened. `quality_issue`, `customer_changed_mind` and `other` are not offered
// by the reference at all; `wrong_delivery` and `excess_delivery` were guesses
// at `wrong_material_delivered` and `wrong_quantity`.
//
// ⚠️ Close to `purchaseReturnOrderReasons` but not the same list: the purchase
// side offers `incorrect_delivery_address` too, and says `Not delivered` where
// this one says `Not delivered / not collected` — a sale can fail because the
// customer never came to collect.
export const returnOrderReasons = [
  "damaged",
  "wrong_quantity",
  "wrong_material_delivered",
  "delivered_too_late",
  "not_delivered_or_collected",
  "transport_damage",
] as const satisfies readonly string[];

export type ReturnOrderReason = (typeof returnOrderReasons)[number];

export const returnOrderStatuses = [
  "open",
  "in_progress",
  "received",
  "credited",
  "cancelled",
] as const satisfies readonly string[];

export type ReturnOrderStatus = (typeof returnOrderStatuses)[number];

/**
 * Which block a release lifted. The reference's `Unblocked orders` shows exactly
 * two on 571 releases: `Financiële deblokkering` 544 and `Commerciële
 * deblokkering` 27. Financial releases the credit rule's hold on the order;
 * commercial releases the lines' commercial block (margin, missing data).
 */
export const orderDeblockTypes = [
  "financial",
  "commercial",
] as const satisfies readonly string[];

export type OrderDeblockType = (typeof orderDeblockTypes)[number];

export const purchaseReturnOrderReasons = [
  "damaged",
  "wrong_quantity",
  "wrong_material_delivered",
  "delivered_too_late",
  "not_delivered",
  "transport_damage",
  "incorrect_delivery_address",
] as const satisfies readonly string[];

export type PurchaseReturnOrderReason =
  (typeof purchaseReturnOrderReasons)[number];

export const machineOptionTypes = [
  "decoiling",
  "grinding",
  "shear_cut",
  "laser",
  "duplo",
  "brushing",
  "blue_foil",
  "laser_foil",
  "uv_foil",
  "remove_foil",
  "anodizing",
  "pickling",
  "coating",
  "embossing",
  "perforate",
  "bending",
  "polished",
  "punching",
  "slitting",
  "rolling",
  "stamping",
  "sawing",
] as const satisfies readonly string[];

export type MachineOptionType = (typeof machineOptionTypes)[number];

// The options that divide the material into different pieces from the ones that
// went in, rather than treating the pieces they were handed.
//
// This is the difference between the two ways a production line is reported
// back. Grinding two plates gives two ground plates: the count is unchanged,
// nothing is left over, and the floor only has to say what it actually did. But
// shearing two plates can give five pieces and a bin of offcuts, so what came
// out has to be described separately from what went in, and the kilos of the two
// have to reconcile — see productionRemainderBalance.
//
// Punching and perforating are treatments by this measure. They make holes and
// they do drop swarf, but the plate that comes off the bed is the same plate
// that went on it, and it is the piece count that decides whether the output
// needs describing at all.
export const cuttingMachineOptions = [
  "decoiling",
  "laser",
  "sawing",
  "shear_cut",
  "slitting",
] as const satisfies readonly MachineOptionType[];

export type CuttingMachineOption = (typeof cuttingMachineOptions)[number];

export const machineProductionTypes = [
  "decoiler",
  "internal_processing",
  "shearing",
  "laser_1",
  "laser_2",
  "grinding_foiling",
] as const satisfies readonly string[];

export type MachineProductionType = (typeof machineProductionTypes)[number];

export const machineLoadingTypes = [
  "load",
] as const satisfies readonly string[];

export type MachineLoadingType = (typeof machineLoadingTypes)[number];

export const machineCapacityUnits = [
  "percent",
  "amount",
  "hk",
  "hm",
  "hs",
  "kg",
  "m1",
  "m2",
  "m3",
  "mm",
  "line",
  "st",
  "tn",
] as const satisfies readonly string[];

export type MachineCapacityUnit = (typeof machineCapacityUnits)[number];

export const processingEditings = [
  "stamping",
  "polished",
  "paper_interleaving",
  "pickling",
  "laser",
  "blue_foil",
  "bending",
  "uv_foil",
  "rolling",
  "anodizing",
  "slitting",
  "brushing",
  "remove_foil",
  "certificate_2_1",
  "sawing",
  "coating",
  "punching",
  "grinding",
  "decoiling",
  "duplo",
  "embossing",
  "shear_cut",
  "laser_foil",
  "perforate",
  "certificate_3_1",
] as const satisfies readonly string[];

export type ProcessingEditing = (typeof processingEditings)[number];

export const textUsageCategories = [
  "purchase_quote_request",
  "purchase_order",
  "purchase_order_tool_tip",
  "purchase_return_order",
  "sales_quote",
  "sales_order",
  "sales_order_tool_tip",
  "sales_invoice",
  "warehouse_order",
  "production_order",
  "loadlist",
  "waybill",
  "ride_list",
  "customer_label",
  "visit_report",
  "transport_planning",
  "website_in_advance",
  "website_after",
] as const satisfies readonly string[];

export type TextUsageCategory = (typeof textUsageCategories)[number];

export const invoiceSurchargeDescriptions = [
  "project_discount",
  "certificate_costs",
  "cutting_surcharge",
  "decoil_surcharge",
  "order_surcharge",
  "packaging_surcharge",
  "pallet_surcharge",
  "administration_costs",
  "transport_costs",
  "transport_costs_internal",
  "maut_costs",
  "return_costs",
  "import_costs",
  "costs",
  "other",
  "purchasing_rounding_differences",
  "credit_notes_to_be_received_third_party",
  "credit_notes_to_be_received",
  "eu_import_duties",
  "price_differences",
  "price_differences_eu_non_eu",
  "external_transport",
] as const satisfies readonly string[];

export type InvoiceSurchargeDescription =
  (typeof invoiceSurchargeDescriptions)[number];

// What an Invoices row actually is. A credit note is the same document with
// its amounts negated — same numbering, same ledger, same ageing — so it lives
// in the same table rather than a parallel one that every report would have to
// learn about separately.
/**
 * What the document is for. Counted across the reference's 1.683 invoices:
 * 1.616 Debit, 32 Credit, 29 Surcharge, 6 Correction.
 *
 * A credit note is a whole document carrying a negative amount rather than a
 * negative line on an invoice — which is what pairs it with a return order. A
 * `surcharge` document has no order behind it at all: 135 of the reference's
 * invoice lines bill charges alone.
 */
export const invoiceDocumentTypes = [
  "invoice",
  "credit_note",
  "surcharge",
  "correction",
] as const satisfies readonly string[];

export type InvoiceDocumentType = (typeof invoiceDocumentTypes)[number];

export const invoiceVatScenarios = [
  "purchase_domestically",
  "domestic_purchase_vat_shifted",
  "purchase_within_eu_with_reverse_charge",
  "purchase_outside_eu_with_reverse_charge",
  "domestic_sales",
  "sales_within_eu_with_reverse_charge",
  "sales_outside_eu_with_reverse_charge",
] as const satisfies readonly string[];

export type InvoiceVatScenario = (typeof invoiceVatScenarios)[number];

export const invoicePaymentTerms = [
  "prepayment",
  "cash",
  "within_7_days_after_invoice_date",
  "within_8_days_from_date_of_invoice",
  "within_10_days_from_date_of_invoice",
  "within_14_days_from_date_of_invoice",
  "within_21_days_after_invoice_date",
  "within_30_days_from_date_of_invoice",
  "within_30_days_end_of_month",
  "within_45_days_from_date_of_invoice",
  "within_60_days_from_date_of_invoice",
  "within_90_days_after_invoice_date",
  "prepayment_minus1pct_discount",
  "within_8_days_minus1pct_30_days_net",
  "within_8_days_minus1_5pct_30_days_net",
  "within_8_days_minus2pct_30_days_net",
  "5pct_prepayment_balance_cad",
  "10pct_prepayment_balance_cad",
  "15pct_prepayment_balance_cad",
  "20pct_prepayment_balance_cad",
  "25pct_prepayment_balance_cad",
  "30pct_prepayment_balance_cad",
  "50pct_prepayment_balance_cad",
  "cash_against_documents",
  "lc_at_sight",
  "within_10_days_1_5pct_30_days_net",
  "within_14_days_minus2pct_30_days_net",
  "within_10_days_minus1pct_30_days_net",
  "within_14_days_minus1pct_30_days_net",
  "within_14_days_minus3pct_30_days_net",
  "within_10_days_minus3pct_30_days_net",
  "lc_120_days",
  "20pct_prepayment_rest_before_shipping",
  "25pct_prepayment_rest_before_shipping",
  "20pct_advance_payment_remainder_copy_bl",
  "30pct_advance_payment_remainder_copy_bl",
  "5pct_prepayment_balance_30_days_copy_bl",
  "50pct_in_advance_remainder_14_days_after_arrival_at_port",
  "5pct_prepayment_balance_60_days_copy_bl",
  "50pct_prepayment_remaining_15_days_after_shipment",
  "prepayment_minus2pct_discount",
  "lc_180_days",
  "lc_90_days",
  "to_be_determined",
  "immediately_after_receipt_of_goods",
  "payment_in_settlement",
  "direct_debit",
] as const satisfies readonly string[];

export type InvoicePaymentTerm = (typeof invoicePaymentTerms)[number];

export const orderMethods = [
  "telephone",
  "email",
  "counter",
  "representative",
  "oral",
  "website",
  "edi",
  "ai_read_email",
] as const satisfies readonly string[];

export type OrderMethod = (typeof orderMethods)[number];

/**
 * The ladder a sales document climbs, counted across all 2.091 headers the
 * reference holds: 1.657 Invoiced, 195 Released, 99 In progress, 71
 * Provisional, 22 Partially invoiced, 17 Partially delivered, 17 Completed,
 * 7 Checked, 4 Received, 2 Expired.
 *
 * One list for four document types. `received` only ever appears on a return
 * order and `expired` only on a quote, but they are rungs of the same ladder
 * rather than separate vocabularies — which is why a quote carries a status
 * here instead of the boolean it used to have.
 *
 * There is no `cancelled`. The reference deletes a document rather than
 * cancelling it, which is what the 154 gaps in its order-number series are.
 */
export const orderStatuses = [
  "provisional",
  "released",
  "checked",
  "in_progress",
  "partially_delivered",
  "partially_invoiced",
  "invoiced",
  "completed",
  // Return orders only — goods are back, not yet credited.
  "received",
  // Terminal, and not only on quotes: the `Previous orders` panel of order
  // `100742` shows two order LINES sitting at `Expired` 589 days after they
  // were written, so a sales line ages out the same way an offer does.
  "expired",
  // Not a rung the reference has. It deletes a document rather than
  // cancelling one, which is what the 154 gaps in its order-number series
  // are — but this app cancels, and keeps the record.
  "cancelled",
] as const satisfies readonly string[];

export type OrderStatus = (typeof orderStatuses)[number];

/**
 * Which document series a sales header belongs to.
 *
 * The reference tells them apart by the letter on the number and by the
 * `Verkoopordertype` column on its Charges screen, which names all four:
 * `O` order (2.041), `R` return (43), `Q` quote (6), `B` counter order (1).
 */
export const salesDocumentKinds = [
  "order",
  "return",
  "quote",
  // A walk-in sale over the counter — the reference's `Balieorder`.
  "counter_order",
] as const satisfies readonly string[];

export type SalesDocumentKind = (typeof salesDocumentKinds)[number];

export const orderItemStatuses = [
  "reserved",
  "delivered",
  "invoiced",
  // Billed, then sent back and credited. Terminal: a line can only come back
  // once, so this is what stops the same delivery being credited twice.
  "returned",
  "cancelled",
] as const satisfies readonly string[];

export type OrderItemStatus = (typeof orderItemStatuses)[number];

// Fulfilment state of an order/return line (the "Line status" column).
// The lifecycle a purchase line walks, in order. "Provisional" is where a
// line converted from a quote starts — the order exists but has not been made
// final — and "checked" sits between released and the first receipt, for a
// line somebody has verified against the supplier's confirmation. Both were
// read off the reference's own saved filters and status column.
/**
 * A line climbs the same ladder as its header. Counted on 4.975 order lines:
 * 4.195 Invoiced, 335 Released, 260 In progress, 58 Completed, 43 Partially
 * invoiced, 39 Provisional, 32 Partially delivered, 9 Checked, 4 Received.
 *
 * `expired` is here because the Deliveries screen shows it on 70 lines; the
 * Order lines screen hides it, along with one further state.
 *
 * The reference numbers these in hundreds so states can be inserted between
 * them, and two screens print the number instead of the word: `010`
 * provisional, `210` released, `310` in_progress, `610` partially_delivered,
 * `805` partially_invoiced, `810` invoiced, `830` cancelled.
 */
export const orderLineStatuses = [
  "provisional",
  "released",
  "checked",
  "in_progress",
  "partially_delivered",
  "partially_invoiced",
  "invoiced",
  // What the reference calls a line that is fully delivered and not yet
  // invoiced — 58 lines, paired with delivery status `Completed` on all 58.
  "completed",
  // A purchase line some of whose goods have arrived — the reference's own
  // status column on Purchase lines shows it.
  "partially_received",
  "received",
  "expired",
  // Status `830`. Two lines carry it and the Order lines screen shows neither,
  // so the word is ours; the behaviour — hidden, terminal — is the
  // reference's.
  "cancelled",
] as const satisfies readonly string[];

export type OrderLineStatus = (typeof orderLineStatuses)[number];

/**
 * Where the goods are, which is not where the line is. A delivery line carries
 * three independent statuses: `orderLineStatuses` for the paperwork, this for
 * the metal, and `transportStatuses` for the lorry.
 *
 * Counted on 6.134 delivery lines: 5.156 Invoiced, 362 Released, 189 Ready,
 * 113 In progress, 111 Expired, 65 Partially delivered, 58 Completed, 41 New,
 * 39 Workorders created. The two ladders move together but not in lockstep —
 * an `in_progress` line sits on a `ready` delivery 178 times and on an
 * `in_progress` one 113 times.
 */
export const deliveryStatuses = [
  "new",
  "workorders_created",
  "in_progress",
  "ready",
  "released",
  "partially_delivered",
  "completed",
  "invoiced",
  "expired",
] as const satisfies readonly string[];

export type DeliveryStatus = (typeof deliveryStatuses)[number];

/**
 * Where the lorry is. Blank until the line is on a trip, which is why 1.463 of
 * 6.134 delivery lines carry none.
 *
 * A line with a transport blockage never reaches any of these: 895 blocked
 * lines, 895 without a trip number, 4.297 unblocked lines all with one, no
 * exceptions in 6.134 rows.
 */
export const transportStatuses = [
  "new",
  "scheduled",
  "loading_list",
  "loaded",
  "loading_done",
  "completed",
] as const satisfies readonly string[];

export type TransportStatus = (typeof transportStatuses)[number];

export const deliveryTerms = [
  "exw",
  "fca",
  "fob",
  "cfr",
  "cif",
  "cpt",
  "cip",
  "dap",
  "dpu",
  "ddp",
] as const satisfies readonly string[];

export type DeliveryTerm = (typeof deliveryTerms)[number];

export const orderWeightTypes = [
  "theoretical_weight",
  "trade_weight",
  "german_trade_weight",
  "weighed",
] as const satisfies readonly string[];

export type OrderWeightType = (typeof orderWeightTypes)[number];

export const deliveryTypes = [
  "date",
  "week",
] as const satisfies readonly string[];

export type DeliveryType = (typeof deliveryTypes)[number];

export const transporterPriceUnits = [
  "amount",
  "per_km",
  "per_kg",
  "percentage",
] as const satisfies readonly string[];

export type TransporterPriceUnit = (typeof transporterPriceUnits)[number];

// Country codes used on the transporter countries grid. Values are the legacy
// dispatch codes shown in the "Code" column; labels are the descriptions.
export const transporterCountries = [
  "A",
  "AE",
  "AN",
  "AZ",
  "B",
  "BAN",
  "BE2",
  "BG",
  "BR",
  "BY",
  "CDN",
  "CH",
  "CL",
  "CN",
  "CR",
  "CW",
  "CY",
  "CZ",
  "D",
  "DK",
  "E",
  "EE",
  "ES2",
  "ET",
  "F",
  "FIN",
  "FL",
  "GB",
  "GB2",
  "GE",
  "GR",
  "H",
  "HEG",
  "HK",
  "I",
  "IND",
  "IR",
  "IRL",
  "KR",
  "KRO",
  "L",
  "LT",
  "LV",
  "MA",
  "MAL",
  "MK",
  "NL",
  "NO",
  "P",
  "PK",
  "PL",
  "RC",
  "RO",
  "ROK",
  "RUS",
  "S",
  "SGP",
  "SK",
  "SLO",
  "SME",
  "SRB",
  "SVN",
  "SYR",
  "TR",
  "UA",
  "uk",
  "USA",
  "VN",
  "ZA",
] as const satisfies readonly string[];

export type TransporterCountry = (typeof transporterCountries)[number];

export const counterOrderStatuses = [
  "open",
  "in_progress",
  "delivered",
  "invoiced",
  "cancelled",
] as const satisfies readonly string[];

export type CounterOrderStatus = (typeof counterOrderStatuses)[number];

export const counterOrderPriorities = [
  "normal",
  "rush",
] as const satisfies readonly string[];

export type CounterOrderPriority = (typeof counterOrderPriorities)[number];

export const invoicingMethods = [
  "per_delivery",
  "per_order",
  "per_order_line",
] as const satisfies readonly string[];

export type InvoicingMethod = (typeof invoicingMethods)[number];

export const invoiceFrequencies = [
  "daily",
  "weekly",
  "monthly",
] as const satisfies readonly string[];

export type InvoiceFrequency = (typeof invoiceFrequencies)[number];

export const purchaseOrderTypes = [
  "materials",
  "processing",
  "customer_materials",
] as const satisfies readonly string[];

export type PurchaseOrderType = (typeof purchaseOrderTypes)[number];

/**
 * Where a purchase order header stands — the reference's own list.
 *
 * 🔴 Replaced 7-10-2026. The old list (`provisional · open · confirmed ·
 * pre_notified · completed · cancelled`) had four words the reference never
 * prints on a purchase order. Grouping `Purchase orders and quotes` on
 * `Status` over 2024–2026 gives exactly nine:
 *
 *   Checked · Delivered · Expired · In progress · Invoiced ·
 *   Partially received · Provisional · Received · Released
 *
 * It is the line ladder, rolled up: the header reads its least-advanced live
 * line (`purchaseOrderStatusFromLines`). `404102` has lines Expired, Received,
 * Invoiced and Released and its header says `Released`; `402401` has six
 * Invoiced and one In progress and says `In progress`.
 *
 * - `provisional` — converted from a quote, not yet made final; nothing can
 *   be received against it.
 * - `delivered` — a **purchase return** whose goods have gone back to the
 *   supplier (`IR950008`, `IR950030`, `IR950033`). Never an order's state.
 * - `expired` — every line lapsed (`400142`, € 0, 0 kg). An expired order
 *   drops out of both purchase overviews and is still listed on its
 *   supplier's company record.
 * - `cancelled` — ours. The reference deletes instead; this app keeps the
 *   record.
 *
 * `Confirm` and `Pre-notify` are **not** states: they are buttons whose effect
 * is stamped on the header (`confirmedAt`, `preNotifiedAt`) while the order
 * keeps climbing the ladder.
 */
export const purchaseOrderStatuses = [
  "provisional",
  "released",
  "checked",
  "in_progress",
  "partially_received",
  "received",
  "delivered",
  "invoiced",
  "expired",
  "cancelled",
] as const satisfies readonly string[];

export type PurchaseOrderStatus = (typeof purchaseOrderStatuses)[number];

/**
 * The headers still expecting goods — what `Purchase orders to be received`,
 * order advice and StockOn count as "on order".
 */
export const openPurchaseOrderStatuses = [
  "released",
  "checked",
  "in_progress",
  "partially_received",
] as const satisfies readonly PurchaseOrderStatus[];

/** Headers whose goods are all in or gone — off the "current" lists. */
export const closedPurchaseOrderStatuses = [
  "invoiced",
  "expired",
  "cancelled",
] as const satisfies readonly PurchaseOrderStatus[];

// How money actually moved. "Offset" is settlement without cash — a credit
// note or a counter-invoice netted against this one.
export const paymentMethods = [
  "bank_transfer",
  "direct_debit",
  "cash",
  "card",
  "offset",
] as const satisfies readonly string[];

export type PaymentMethod = (typeof paymentMethods)[number];

// Where a purchase request has got to. A request is the "who can supply this?"
// document: it is sent to several suppliers at once, collects their quotes, and
// ends when one of them is turned into a purchase order.
export const purchaseRequestStatuses = [
  "draft",
  "sent",
  "quoted",
  "awarded",
  "cancelled",
] as const satisfies readonly string[];

export type PurchaseRequestStatus = (typeof purchaseRequestStatuses)[number];

// Where a supplier's quote has got to. "lost" is set on the siblings when
// another quote against the same request is awarded, so the comparison screen
// shows that a decision was taken rather than leaving every quote open forever.
export const purchaseQuoteStatuses = [
  "open",
  "received",
  "awarded",
  "lost",
  "expired",
] as const satisfies readonly string[];

export type PurchaseQuoteStatus = (typeof purchaseQuoteStatuses)[number];

// Why a purchase quote was expired. `incorrectly_entered` is the reference's
// own reason, chosen by a buyer; `validity_expired` is set by the system once
// the quote's "Valid u/i" date has passed.
export const purchaseQuoteExpirationReasons = [
  "incorrectly_entered",
  "validity_expired",
] as const satisfies readonly string[];

export type PurchaseQuoteExpirationReason =
  (typeof purchaseQuoteExpirationReasons)[number];

export const purchaseCompanyTypes = [
  "supplier",
  "agent",
] as const satisfies readonly string[];

export type PurchaseCompanyType = (typeof purchaseCompanyTypes)[number];

export const complaintTypes = [
  "counter_order",
  "general",
  "order",
  "purchase_order",
  "purchase_quote",
  "quote",
  "return_order",
] as const satisfies readonly string[];

export type ComplaintType = (typeof complaintTypes)[number];

export const complaintCategories = [
  "damaged",
  "wrong_price_calculated",
  "wrong_quantity",
  "wrong_material_delivered",
  "delivered_too_late",
  "transport_damage",
  "incorrect_delivery_address",
] as const satisfies readonly string[];

export type ComplaintCategory = (typeof complaintCategories)[number];

export const complaintReports = [
  "telephone",
  "email",
  "counter",
  "representative",
  "oral",
  "website",
  "edi",
  "ai_read_email",
] as const satisfies readonly string[];

export type ComplaintReport = (typeof complaintReports)[number];

export const complaintStatuses = [
  "new",
  "in_progress",
  "on_hold",
  "done",
] as const satisfies readonly string[];

export type ComplaintStatus = (typeof complaintStatuses)[number];

export const complaintCauses = [
  "warehouse",
  "production",
  "purchasing",
  "sale",
  "transportation",
  "customer",
  "supplier",
  "processor",
] as const satisfies readonly string[];

export type ComplaintCause = (typeof complaintCauses)[number];

export const complaintSolutions = [
  "collect_goods_back_credit",
  "return_goods_credit_redeliver",
  "price_correction",
  "subsequent_delivery",
  "complaint_rejected",
  "material_retained_correct_delivery",
] as const satisfies readonly string[];

export type ComplaintSolution = (typeof complaintSolutions)[number];

export const countWorkorderMethods = [
  "counting_locations",
  "products_counting",
] as const satisfies readonly string[];

export type CountWorkorderMethod = (typeof countWorkorderMethods)[number];

export const workorderReleaseMethods = [
  "direct",
  "according_to_schedule",
  "manual",
] as const satisfies readonly string[];

export type WorkorderReleaseMethod = (typeof workorderReleaseMethods)[number];

export const workorderPrintMethods = [
  "manual",
  "automatic",
  "do_not_print",
] as const satisfies readonly string[];

export type WorkorderPrintMethod = (typeof workorderPrintMethods)[number];

export const workorderSlipTypes = [
  "a4_landscape",
  "a4_portrait",
  "label",
  "label_via_csv",
] as const satisfies readonly string[];

export type WorkorderSlipType = (typeof workorderSlipTypes)[number];

export const workorderProcessingMethods = [
  "order_picking",
] as const satisfies readonly string[];

export type WorkorderProcessingMethod =
  (typeof workorderProcessingMethods)[number];

export const stickerPerPickWorkorderTypes = [
  "no_customer_label",
  "sticker_per_workorder_600dpi",
  "sticker_per_workorder_line_600dpi",
] as const satisfies readonly string[];

export type StickerPerPickWorkorderType =
  (typeof stickerPerPickWorkorderTypes)[number];

export const printerNames = [
  "microsoft_print_to_pdf_8_redirected",
  "onenote_desktop_8_redirected",
  "send_to_onenote_16",
  "sales_black",
  "sales_color",
  "sato_cl4nx_203dpi",
  "sato_cl408e_logistics",
  "onenote_desktop",
  "microsoft_print_to_pdf",
  "logistics_black",
  "logistics_color",
  "administration_black",
  "administration_color",
] as const satisfies readonly string[];

export type PrinterName = (typeof printerNames)[number];

export const printerEntries = [
  "select_automatically",
  "manual_feed",
  "tray_1",
  "tray_2",
  "tray_3",
  "tray_4",
  "tray_5",
] as const satisfies readonly string[];

export type PrinterEntry = (typeof printerEntries)[number];

// How far a trip has got. A transport work order *is* a trip — the warehouse
// work order that rides on it carries the same "Trip number" and "Trip status" —
// so both screens read this one ladder.
//
// Warehouse and production work orders run the separate ladder below instead:
// they are released to the floor, reported back and approved. A trip is loaded
// and driven, which is a different sequence of things going right.
//
// Read off the reference's own "Transport status adjustments" screen, which logs
// every change of this column with who made it and when. The three states in
// the middle are the ones a four-state reading collapses and the loading bay
// cares about most: a loading list exists, the goods are on the lorry, the bay
// is finished with it.
export const tripStatuses = [
  "new",
  "scheduled",
  "loading_list",
  "loaded",
  "loading_done",
  "in_transit",
  "completed",
] as const satisfies readonly string[];

export type TripStatus = (typeof tripStatuses)[number];

// Where a reception has got to, which is a different question from where its
// goods have got to. Taken verbatim from the reference's own "Receipt status"
// column across a 151-row export of the Purchase receivals screen.
//
// The middle state is the one that matters and the one a purchase-only reading
// of the system misses entirely: `workorders_created` means the Unloading
// warehouse work order has been raised but not yet approved. The goods are
// promised, the paperwork exists, and nothing is in stock. Approving that work
// order is what moves a reception to `received` — see RECEIPT_STATUS_META
// and receiptStatusAfterUnloading.
export const receiptStatuses = [
  "new",
  "released",
  "workorders_created",
  "partially_received",
  "received",
  "invoiced",
  // A reception that lapsed without ever being fulfilled. Off the ladder
  // rather than at the end of it: the goods never came, so nothing downstream
  // of it ever happened. Two of the 3 088 rows in the reference's own Receipts
  // export are in this state, and both carry an accrual of nothing.
  "expired",
] as const satisfies readonly string[];

export type ReceiptStatus = (typeof receiptStatuses)[number];

// How far a work order has got, and what may be done to it. Warehouse and
// production work orders run the same ladder, which is why they also share one
// number sequence: raising a sales order hands out consecutive numbers across
// both kinds in a single click.
//
// `new` is a basket lines can still be added to. `release` freezes it and prints
// the papers, and only a released order can be cancelled back — nothing physical
// has happened yet. Reporting a line completed is what actually moves the stock.
//
// The two kinds part company at the end. A warehouse order lands straight on
// `approved` when it is reported, because there is nothing to check: the floor
// either moved the goods or it did not. A production order stops at `ready` and
// waits to be approved, because what came off the machine has to be looked at
// before it counts.
export const workOrderStatuses = [
  "new",
  "released",
  "ready",
  "approved",
] as const satisfies readonly string[];

export type WorkOrderStatus = (typeof workOrderStatuses)[number];

// What a warehouse work order is for. Every type is a move between two places;
// what separates them is which two, and whether the move crosses the company
// boundary — see WAREHOUSE_WORK_ORDER_TYPE_META for the route each one takes.
export const warehouseWorkOrderTypes = [
  "arranging",
  "counting_location",
  "counting_product",
  "fetching",
  "picking",
  "pick_up",
  "relocating",
  "restocking",
  "scrapping",
  "transferring",
  "unloading",
] as const satisfies readonly string[];

export type WarehouseWorkOrderType = (typeof warehouseWorkOrderTypes)[number];

// What reporting a warehouse work order line completed does to stock. A move
// only changes where a lot sits; `in` and `out` are the two boundary crossings
// that change how much of it there is; `count` reconciles a lot to what was
// actually found on the shelf. This is what the completion routine branches on,
// so a type without one could not be reported at all.
export const warehouseStockEffects = [
  "in",
  "out",
  "move",
  "count",
] as const satisfies readonly string[];

export type WarehouseStockEffect = (typeof warehouseStockEffects)[number];

// Returnable packaging the goods went out on, counted per work order. Pallets
// are sized by the length they carry, which is why there are four of them.
export const packagingTypes = [
  "p2m",
  "p2_5m",
  "p3m",
  "p4m",
  "euro",
  "coil",
  "bundles",
  "colli",
] as const satisfies readonly string[];

export type PackagingType = (typeof packagingTypes)[number];

// What is left on the floor when a cutting work order is reported back.
//
// A remainder is weighed rather than counted, because the balance a completion
// has to satisfy is in kilos: everything fetched must come out again as goods
// plus remainders. Where it goes is what separates the two — a usable offcut
// returns to the rack the material came from and can be sold again, while scrap
// goes to the scrap location at no value. Collapsing them would mean either
// writing off every offcut or putting swarf back on the shelf as stock.
export const remainderCategories = [
  "remnant",
  "scrap",
] as const satisfies readonly string[];

export type RemainderCategory = (typeof remainderCategories)[number];

export const purchaseInvoiceBlockReasons = [
  "price_mismatch",
  "awaiting_goods_receipt",
  "awaiting_approval",
  "duplicate",
  "disputed",
  "other",
] as const satisfies readonly string[];

export type PurchaseInvoiceBlockReason =
  (typeof purchaseInvoiceBlockReasons)[number];

/**
 * Where a supplier invoice stands, and what may still be done to it.
 *
 * `new` is keyed but not approved; `released` is approved for payment — the
 * status the reference's captured invoice carries; `final` is closed by the
 * reference's own `Final` button, after which nothing may be edited or
 * cancelled. Cancelling is a flag of its own, as the reference keeps blocking
 * separate from status.
 */
export const purchaseInvoiceStatuses = [
  "new",
  "released",
  "final",
] as const satisfies readonly string[];

export type PurchaseInvoiceStatus = (typeof purchaseInvoiceStatuses)[number];

export const purchaseInvoiceFiscalBases = [
  "booking_date",
  "document_date",
] as const satisfies readonly string[];

export type PurchaseInvoiceFiscalBase =
  (typeof purchaseInvoiceFiscalBases)[number];

export const currencies = [
  "eur",
  "usd",
  "gbp",
  "hkd",
] as const satisfies readonly string[];

export type Currency = (typeof currencies)[number];

export const customerGroups = [
  "warehouse_staff",
  "regional_trade",
  "commission_external",
  "maritime",
  "food_industry",
  "agricultural",
  "water_purification",
  "dealer",
  "equipment_manufacturing_external",
  "contract_work_external",
  "construction",
  "building",
  "user_external",
  "tank_construction",
  "equipment_manufacturing",
  "service",
  "contract_work_internal",
  "cutting_company",
  "trade_external",
  "end_user",
  "consultancies",
  "aluminium_processing",
  "auto_bicycle_garage",
  "trailer_construction",
  "tree_nurseries",
  "construction_contracting",
  "flower_growers",
  "building_materials_trade",
  "reinforcing_steel_bending",
  "camping_recreation",
  "caravan_camping_articles",
  "bodywork_light",
  "construction_companies_light",
  "construction_companies_heavy",
  "container_construction",
  "cooperatives",
  "cultural_environmental_tech",
  "hvac_sanitary_air",
  "roofing",
  "defense",
  "animal_parks",
  "miscellaneous",
  "electrotechnical",
  "consumer_goods_manufacturers",
  "various_manufacturers",
  "mink_farmers",
  "government",
  "tool_makers",
  "technical_trading",
  "various_trading",
  "fencing_industry",
  "wood_industry_carpentry",
  "purchasing_combinations",
  "installation_companies",
  "refrigeration_technology",
  "agriculture_livestock",
  "agricultural_mechanization",
  "welding_companies",
  "contracting_companies",
  "contract_sawing",
  "machine_factories",
  "warehouse_fitters",
  "market_stand_tent",
  "metal_furniture",
  "assembly_companies",
  "utilities",
  "private_individuals",
  "pipeline_companies",
  "sheet_metal_processing",
  "stainless_steel_processing",
  "gabion_baskets",
  "schools_training",
  "shipbuilding",
  "smithies",
  "social_employment",
  "steel_trade",
  "stable_construction",
  "blasting_coating",
  "transport_companies",
  "rental_companies",
  "horticulture",
  "garden_centers",
  "road_water_construction",
  "hardware_stores",
  "care_homes",
] as const satisfies readonly string[];

export type CustomerGroup = (typeof customerGroups)[number];

export const customerStockReasons = [
  "initial_stock",
  "correction",
  "counting_difference",
  "damaged",
  "return_from_customer",
  "transfer",
  "other",
] as const satisfies readonly string[];

export type CustomerStockReason = (typeof customerStockReasons)[number];

// One row of a company's yearly visit planning grid. The array is ordered
// January (index 0) → December (index 11).
export type VisitPlanningEntry = { call: boolean; visit: boolean };

export const visitReportCategories = [
  "wishing_next_visit",
  "following_complaint",
  "acquisition",
] as const satisfies readonly string[];

export type VisitReportCategory = (typeof visitReportCategories)[number];

// One reader row on a visit report: the functionary (Clerk user id) plus
// whether the report is queued for them to read and whether they have read it.
export type VisitReportReader = {
  userId: string;
  toRead: boolean;
  read: boolean;
};

export const companyClassifications = [
  "A",
  "B",
  "C",
] as const satisfies readonly string[];

export type CompanyClassification = (typeof companyClassifications)[number];

// Production-capacity traffic-light status shown on the "Production capacity"
// overview: whether the machine's booked capacity is within limits.
export const productionCapacityStatuses = [
  "ok",
  "warning",
  "full",
] as const satisfies readonly string[];

export type ProductionCapacityStatus =
  (typeof productionCapacityStatuses)[number];

// Status of the material fetch (retrieving the raw bar/length from stock to
// bring to the saw) on the Logistics "Sawing layouts" overview.
export const sawingLayoutFetchStatuses = [
  "new",
  "in_progress",
  "completed",
  "cancelled",
] as const satisfies readonly string[];

export type SawingLayoutFetchStatus =
  (typeof sawingLayoutFetchStatuses)[number];

// Status of the sawing operation itself on the "Sawing layouts" overview.
export const sawingStatuses = [
  "new",
  "in_progress",
  "completed",
  "cancelled",
] as const satisfies readonly string[];

export type SawingStatus = (typeof sawingStatuses)[number];

// The cross-section a product is made in — what "Dimensions" on the product
// screen selects. It decides which of the width/thickness fields carry meaning:
// a round bar's width is its diameter and its thickness stays 0, while a flat
// bar uses both.
export const productDimensionShapes = [
  "round",
  "square",
  "flat",
  "rectangular",
  "hexagonal",
  "octagonal",
  "tube_round",
  "tube_square",
  "tube_rectangular",
  "sheet",
  "plate",
  "beam",
  "angle",
] as const satisfies readonly string[];

export type ProductDimensionShape = (typeof productDimensionShapes)[number];

// Which stock lot leaves the warehouse first when a product is dispatched.
export const dispatchStrategies = [
  "lifo",
  "fifo",
] as const satisfies readonly string[];

export type DispatchStrategy = (typeof dispatchStrategies)[number];

// What a price-structure surcharge or discount tier is measured against: the
// single order line, the group product, or the whole product group.
export const priceTierBases = [
  "order_line",
  "group_product",
  "product_group",
] as const satisfies readonly string[];

export type PriceTierBase = (typeof priceTierBases)[number];

// How the stock label print run is broken up on a warehouse workorder.
export const stockLabelBreakdowns = [
  "per_line_bundle",
  "per_bundle",
  "amount_per_line",
] as const satisfies readonly string[];

export type StockLabelBreakdown = (typeof stockLabelBreakdowns)[number];

// Which stock figure the periodic count is measured against.
export const countStockBases = [
  "technical",
  "available",
] as const satisfies readonly string[];

export type CountStockBasis = (typeof countStockBases)[number];

// How overdue a receivable is, measured from its due date. `not_due` is not an
// age — it is everything still inside its payment term, kept in the same list
// so the buckets add up to the whole debt rather than only the late part.
export const ageingBuckets = [
  "not_due",
  "days_1_30",
  "days_31_60",
  "days_61_90",
  "days_over_90",
] as const satisfies readonly string[];

export type AgeingBucket = (typeof ageingBuckets)[number];

// How far a chase has been taken. Each stage is sent once: a debtor who has had
// a final notice is not sent another, they are escalated by hand.
export const reminderStages = [
  "first",
  "second",
  "final",
] as const satisfies readonly string[];

export type ReminderStage = (typeof reminderStages)[number];

// The metal family a grade belongs to. Derived from the grade code rather than
// picked, because the code already says it — see `materialGradeMeta`.
export const materialFamilies = [
  "stainless_austenitic",
  "stainless_ferritic",
  "stainless_martensitic",
  "stainless_heat_resistant",
  "carbon_steel",
  "quenched_tempered_steel",
  "free_cutting_steel",
  "tool_steel",
  "reinforcement_steel",
  "coated_steel",
  "aluminium",
  "brass",
  "bronze",
  "copper",
] as const satisfies readonly string[];

export type MaterialFamily = (typeof materialFamilies)[number];

// The surface a grade's suffix describes, or the condition it is delivered in.
// `316L2B` is bright cold rolled, `C45+QT` is quenched and tempered.
export const materialSurfaceFinishes = [
  "mill",
  "hot_rolled_pickled",
  "hot_rolled_plate",
  "cold_rolled_dull",
  "cold_rolled_bright",
  "cold_rolled_extra_bright",
  "cold_rolled_descaled",
  "bright_annealed",
  "ground",
  "brushed",
  "polished",
  "decorative",
  "mixed",
  "annealed",
  "strain_hardened",
  "heat_treated",
  "cold_drawn",
  "stress_relieved",
  "electro_galvanised",
  "hot_dip_galvanised",
] as const satisfies readonly string[];

export type MaterialSurfaceFinish = (typeof materialSurfaceFinishes)[number];

// What the rate on a surcharge row is a rate *of*. A decoil surcharge of 0.02
// is two cents a kilo; a project discount of 5 is five percent; an order
// surcharge of 15 is fifteen euro once. Without this the rate and the amount
// are the same number, which is only right for the flat ones.
export const surchargeBases = [
  "fixed",
  "percentage",
  "per_kg",
  "per_line",
  "per_pallet",
  "per_certificate",
] as const satisfies readonly string[];

export type SurchargeBasis = (typeof surchargeBases)[number];

// What a revenue group actually is. A revenue report that adds trading revenue
// to a freight recharge and a price difference reports a margin nobody earned,
// so each group says which of the five it belongs to.
export const revenueGroupKinds = [
  "material",
  "processing",
  "freight",
  "allowance",
  "adjustment",
  "other",
] as const satisfies readonly string[];

export type RevenueGroupKind = (typeof revenueGroupKinds)[number];

// A Clerk `publicMetadata.role`. The reference gives releasing a financial
// block to its Finance and admin profiles only — sales may see the queue but not
// work it (docs/reference-system/system-info.md §6) — so a role decides whether
// the Unblock button is offered and whether the release goes through.
export const userRoles = ["admin", "finance"] as const satisfies readonly string[];

export type UserRole = (typeof userRoles)[number];

// What an entry in the system log records. The reference's `Errors` screen is
// mostly the application writing down what it did on somebody's behalf —
// a delivery date moved, an order held, a lock cleared (error-log.md §4).
// The category decides which filter an entry sits under.
// How a document reaches the customer.
//
// The three the reference's own send dialog offers, watched on 21-9-2026 when
// order 102191 was made final: `E-mail to …`, `Fax to` and `Send message by
// Staalweb`. Fax and Staalweb are unticked and greyed on that dialog, so they
// are offered and not used — kept because the send record has to be able to say
// which of the three was chosen, including for history imported from there.
export const communicationChannels = [
  "email",
  "fax",
  "staalweb",
] as const satisfies readonly string[];

export type CommunicationChannel = (typeof communicationChannels)[number];

export const systemLogCategories = [
  "delivery_date_changed",
  "financial_block",
  "financial_unblock",
  "commercial_block",
  "commercial_unblock",
  "order_changed_after_release",
  // Made final: the order was released and the work orders it raises exist.
  // Logged because that press is what puts steel on somebody's picking list,
  // and the warehouse work order it created is the only other trace of it.
  "order_made_final",
  "lock_removed",
  "settings_changed",
] as const satisfies readonly string[];

export type SystemLogCategory = (typeof systemLogCategories)[number];

// A record that takes a lock while somebody has it open for editing — the
// reference's `Geopende werkpanelen`. The type decides which save refuses
// while another user holds the lock.
export const workPanelTypes = ["order", "company"] as const satisfies readonly string[];

export type WorkPanelType = (typeof workPanelTypes)[number];

// The two views of `Revenue w.r.t. Budget`: per revenue group, or — the
// reference's second view — per month with the group columns dropped. The view
// decides what the rows are grouped by.
export const revenueVsBudgetViews = [
  "revenue_group",
  "month",
] as const satisfies readonly string[];

export type RevenueVsBudgetView = (typeof revenueVsBudgetViews)[number];

// The worklists of the reference's task panel that this app can answer. Each
// key decides the query that counts it and the screen it opens.
export const workListKeys = [
  "orders_financially_blocked",
  "customers_blocked",
  "customers_without_debtor_number",
  "order_lines_manually_blocked",
  "orders_transport_blocked",
  "orders_invoice_blocked",
  "order_lines_late",
  "order_lines_incomplete",
  "purchase_order_lines_overdue",
  "customer_contracts_expiring",
  "customer_complaints_open",
  "incomplete_delivery_addresses",
  "visit_reports_to_read",
] as const satisfies readonly string[];

export type WorkListKey = (typeof workListKeys)[number];

/**
 * Whether a discount is a percentage off or a flat amount off.
 *
 * The reference prints a unit column immediately after each discount —
 * `RdU` after `Line discount`, `GdU` after `Group discount` — on its invoice
 * lines. A bare `5` in a discount column is therefore ambiguous on its own: it
 * is 5 % or € 5,00 depending on the unit beside it, and the two give different
 * money on every line they touch.
 *
 * Captured 18-9-2026 on order `100742`; see
 * `docs/reference-system/order-detail.md` §15.
 */
export const discountUnits = [
  "percent",
  "amount",
] as const satisfies readonly string[];

export type DiscountUnit = (typeof discountUnits)[number];

/**
 * Which way the goods travel on a transport work order line.
 *
 * A trip is not always an outbound delivery — the same lorry collects, which is
 * how a return reaches the warehouse and how goods come back from an external
 * processor. Without this the line cannot say which.
 */
export const transportDirections = [
  "deliver",
  "collect",
] as const satisfies readonly string[];

export type TransportDirection = (typeof transportDirections)[number];

/**
 * Whether an invoice line charges or refunds.
 *
 * This is how the reference models a credit note: not as a separate document
 * but as a `Type` on the line, so one invoice can carry both. It is the answer
 * to the open question in H12.
 */
export const invoiceLineTypes = [
  "debit",
  "credit",
] as const satisfies readonly string[];

export type InvoiceLineType = (typeof invoiceLineTypes)[number];

// ─────────────────────────────────────────────────────────────────────────────
// The lot dialogs, captured 5-10-2026 on `PK304L200315` at location `Laad`
// (easy2trade 3.13.0.508). Every enum below was read off a real dropdown rather
// than inferred — see docs/reference-system/stock-lot-dialogs.md.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `Categorie` on `Corrigeren voorraad` — what a lot *is*, set per lot by hand.
 *
 * Five values, read off the open dropdown. It is not cosmetic: it decides what
 * the metal may be sold as, and `third_party_inventory` is the one that says
 * the metal on our shelf is not ours.
 */
export const stockCategories = [
  "standard",
  "scrap",
  "second_choice",
  "remaining",
  "third_party_inventory",
] as const satisfies readonly string[];

export type StockCategory = (typeof stockCategories)[number];

/**
 * What each category decides, so that the enum carries behaviour rather than
 * only a label.
 *
 * `ownStock` is the one with money behind it: metal in `third_party_inventory`
 * belongs to a customer, so a stock valuation that counts it is counting
 * somebody else's property as ours.
 *
 * ⚠️ **Not yet wired into valuation.** Whether the reference values non-owned
 * stock at zero is still being checked (J1/K2), and guessing in either
 * direction would move a five-figure number on no evidence. The flag is here so
 * that the answer is a one-line change rather than a hunt.
 */
export const STOCK_CATEGORY_META: Record<
  StockCategory,
  { ownStock: boolean; sellableAsPrime: boolean }
> = {
  standard: { ownStock: true, sellableAsPrime: true },
  scrap: { ownStock: true, sellableAsPrime: false },
  second_choice: { ownStock: true, sellableAsPrime: false },
  remaining: { ownStock: true, sellableAsPrime: true },
  third_party_inventory: { ownStock: false, sellableAsPrime: false },
};

/**
 * `Reden` on `Aanmaken verplaatsopdracht` — why a lot is moving shelf.
 *
 * The reference offers a `-leeg-` first entry, which is the absence of a value
 * rather than a value, so it is not a member here.
 */
export const relocationReasons = [
  "conversion",
  "to_another_location",
  "from_another_branch",
  "moved",
] as const satisfies readonly string[];

export type RelocationReason = (typeof relocationReasons)[number];

/**
 * `Reden` on `Aanmaken overboekingsopdracht` — exactly one value.
 *
 * A one-member enum is still an enum: the value is stored and the stock
 * mutation reads it, so the column cannot be dropped just because there is
 * nothing to choose between.
 */
export const transferReasons = ["transfer"] as const satisfies readonly string[];

export type TransferReason = (typeof transferReasons)[number];

/**
 * `Optie` on `Voorraad opties` — what has been, or can be, done to metal.
 *
 * 🔴 Nineteen members across two dropdowns that were **both still scrolling**,
 * so this list is a floor and not a ceiling. It replaces the six-value guess
 * that `J5` recorded off the product panel alone.
 *
 * 🔑 `certificate_2_1` is EN 10204 2.1, the declaration of compliance — and it
 * being here is why every certificate column on the batch screens is empty. The
 * certificate is an option somebody asks for, not a file anybody attaches.
 */
export const stockOptions = [
  // ── The lot's list, read off the open `Optie` dropdown end to end ────────
  // 27 members, in the reference's own order. The 5-10 capture caught 14 of
  // these with the list still scrolling; this is the whole of it.
  "uv_foil",
  "brushing",
  "punching",
  "embossing",
  "remove_paper",
  // EN 10204 2.1 — the declaration of compliance.
  "certificate_2_1",
  "coating",
  // 🆕 Priced per m² (€ 1,40), code `BF` on the processing-code alphabet.
  "blue_foil",
  "grinding",
  "shear_cut",
  "rolling",
  "sawing",
  "paper_interleaving",
  "laser_foil",
  "decoiling",
  // `Stempels wassen` — washing stamps **off**, the inverse of `stamping`.
  "wash_stamps",
  "polished",
  "perforate",
  "anodizing",
  // 🔑🔑 EN 10204 **3.1** — the inspection certificate carrying actual test
  // results, and commercially the one that matters. Finding it here beside 2.1
  // settles the certificate question for good: a certificate is an **option on
  // a lot**, there are two grades of it, and neither is a field on a batch.
  // That is why every certificate column on the batch screens is empty.
  "certificate_3_1",
  "pickling",
  "remove_foil",
  "edging",
  "duplo",
  "slitting",
  "stamping",
  "laser",

  // ⚠️ `Knippen` is **not** in the lot dropdown, unlike the other 27.
  //
  // It is kept because it is attested in real data — `batch-registration.md`
  // records `Knippen` among the option names carried on batches, beside
  // `Decoilen`, `Slijpen`, `Laser Folie` and `Blauwe Folie`. So either the
  // product's list offers it where the lot's does not, or it is historic.
  // Removing it would make existing batch rows unreadable.
  "cutting",
] as const satisfies readonly string[];

export type StockOption = (typeof stockOptions)[number];

/**
 * `Status` on an option row.
 *
 * 🔴 **Rewritten 6-10-2026, and the model changed.** The first guess was
 * `possible` / `requested` / `done` — a *work* lifecycle. Watching the dialog
 * says otherwise: adding `Remove Foil` to a lot produced a row whose Status
 * read **`Toevoegen`** — literally *"to add"*, the same word as the button that
 * created it.
 *
 * And there is **no Status field in the `Toevoegen` block at all** — only
 * `Optie` and `Specificatie`. So the status is **never chosen; it is derived**,
 * and what it derives is the *pending edit*, not the state of the metal. The
 * grid is an edit buffer that `Opslaan` commits and `Annuleren` throws away.
 *
 * | Value | Where seen |
 * |---|---|
 * | `possible` | ✅ on the **product's** `Opties` panel, every row |
 * | `to_add` | ✅ on the **lot**, on a row staged but not yet saved |
 * | `to_remove` | ⚠️ inferred — `Verwijder geselecteerde optie` asks *"Weet je dit zeker?"* and the staged row has to be marked somehow |
 * | `applied` | ⚠️ inferred — what a row shows **after** `Opslaan`. Never seen, because the captured lot had no saved options |
 *
 * ⚠️ **Two of the four are inferred and one capture settles both:** add an
 * option, press `Opslaan`, reopen `Opties bewerken`, and read the Status of the
 * saved row. Until then do not build logic that branches on `applied`.
 *
 * 🔑 The product's `possible` and the lot's `to_add` are not the same kind of
 * fact — one is a capability, the other a pending change — which is further
 * reason the two lists stay distinguishable by which column is set.
 */
export const stockOptionStatuses = [
  "possible",
  "to_add",
  "to_remove",
  "applied",
] as const satisfies readonly string[];

export type StockOptionStatus = (typeof stockOptionStatuses)[number];
