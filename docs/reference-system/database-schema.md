# The reference database, table by table

**Source:** `System info → Database tables`, exported 15-9-2026 →
[exports/database-tables.tsv](exports/database-tables.tsv).

It is the **SQL Server schema** of easy2trade: **382 tables, 6 764 columns**, one
row per column with `Table · Column · Column Type · Default · Max. Length ·
Optional`. **Columns only — no values.** It cannot say what a setting is set to;
it can say *where* a setting has to live, and it settles several questions about
shape that the screens could only suggest.

> The `System info` group in the left tree has eight screens and only this one
> has been opened: `Database tables`, `Errors`, `Geopende werkpanelen` (open work
> panels), `Active Logins`, `Security profiles`, `Task profiles`, `EDI`,
> `Stock value check`. WHAT-IS-LEFT.md said "every menu is now open" — that was
> true of the **menu bar**, not of this group.

---

## 1. Where the overdue-days setting must live (K1)

No column anywhere is named for overdue days, expiry or a blocking threshold.
`COMPANY_SALESFINANCE` has no such column either — **it is not per customer**,
which G12 already showed. What the schema does have is three places that store
settings **as data**, where no column name would ever show them:

| Table | Shape | Why it fits |
|---|---|---|
| **`TASK_PARAMETER`** | `Task_StoredProc` nvarchar(200) · `Parameter` nvarchar(50) · **`Value` int** · `Affiliate` | An **integer parameter per stored procedure, per company**. "Days overdue before a block" is exactly an int handed to a blocking procedure. **Most likely home.** |
| `AFFILIATE_CONFIG` | `PAGE` · `NAME` · `VALUE` text · `ENCRYPTED` | A key/value settings store per affiliate |
| `APPLICATIONSETTINGS` | `SETTINGS` image (binary blob) | Unreadable without the application |

**So K1 is almost certainly data, not vendor code** — and it is answerable by
anyone with read access to the database, in two queries:

```sql
SELECT Task_StoredProc, Parameter, Value FROM TASK_PARAMETER;
SELECT PAGE, NAME, CAST(VALUE AS nvarchar(4000)) FROM AFFILIATE_CONFIG WHERE ENCRYPTED = 0;
```

`AFFILIATE_PARAMETERS.SHORTTERMINDAYS` is the only "days" column on a settings
table — it is a short-term delivery window, not the credit rule.

## 2. The batch scheduler and AFAS (K10, K12)

- **`SCHEDULED_TASK`** holds every batch job: `NAME`, `TASKTYPENAME`, `ACTIVE`,
  **`USE_BATCHSCHEDULER`**, **`LAST_EXECUTED`**, `INTERVALINSECONDS`, `REPEATS`,
  one bit per weekday, `TIME`, `DAY_OF_MONTH`. **`LAST_EXECUTED` on the three AFAS
  jobs answers K10 by itself** — it says when open posts last came back.
- **`SCHEDULED_TASK_LOG`** records each run: `TASK`, `CREATED`, **`FAILED`**,
  `TEXT`, `MACHINE`, **`STARTEDBY`** (a user).
- Rows carry their own sync stamp: **`COMPANY.SYNCHRONIZED`** +
  `SYNCHRONIZE_BROKENRULES`, **`JOURNALENTRY.SYNCHRONIZED`** +
  `SYNCHRONIZE_BROKENRULES`. The sync is per record, and a record the ledger
  refused keeps the reason.
- **`LANGUAGE.AFAS_CODE`** — AFAS is wired into the schema, not bolted on.
- **`COMPANY_SALESFINANCE.MULTIVERS_JOURNALCODE`** nvarchar(10), default `'0'` — a
  column left from **Multivers**, an earlier accounting package. This is the
  Company → `Journal code` dropdown that showed `0` and `11` (J7).
- `EXTERNAL_ID_MAPPING` (`EXTERNALSYSTEM`, `OBJECTTYPE`, `EXTERNALID`,
  `INTERNALID`) maps easy2trade ids to another system's ids.

## 3. Batch users (K11)

**`USERS.ISBATCH`** bit — the application knows a user can be a batch account, and
`SCHEDULED_TASK_LOG.STARTEDBY` records which user a job ran as. If the `INAD`
user has `ISBATCH` set, the 63 unblocks are a job; if not, they are people on a
shared login. One look at that user record settles K11.

---

## 4. Credit and blocking — what the schema confirms

**`COMPANY_SALESFINANCE`** (the Debtor panel, G12):

| Column | Confirms |
|---|---|
| `CREDIT_LIMIT`, `CREDIT_LIMIT_UNINSURED` + `_VALIDTO` | the two limits of the credit rule ✅ |
| `CREDIT_LIMITSELF` | the third limit, `Zelfbeoordeling`, 0 everywhere ✅ |
| `CREDIT_LIMIT_INSSURANCE_DETAILS` **nvarchar(50)** + `_VALIDTO` | insurance is **text** (a policy number) — our change to `varchar(50)` matches exactly ✅ |
| `DEBTORNUMBER` **nvarchar(8)** | the second number on a company ✅ (ours is `varchar(20)`, wide enough) |
| `OPENINVOICES` / `OPENINVOICES_INC_VAT`, `OPENORDERS` / `OPENORDERS_INC_VAT` | **both** excl. and incl. VAT are stored; the rule reads excl. ✅. They are **stored**, refreshed by a job — not computed live |
| `DUEDATE`, `INVOICEDATE` | the "oldest" dates on the panel, also stored |
| `ISBLOCKED`, `BLOCKEDBY` | a company-level block with who set it ✅ |

**`PAYMENTTERM.FINANCIALBLOCKREASON`** — a payment term carries its own block
reason. Prepayment terms hold an order **because of the term**, not because of
arithmetic. This is the schema behind "prepayment customers are held" ✅.

**`COMPANY_SALESSETTINGS`**: `ORDER_NO_FINANCIALBLOCK`, `ORDER_NO_COMMERCIALBLOCK`,
`QUOTE_NO_FINANCIALBLOCK`, `QUOTE_NO_COMMERCIALBLOCK` — per-customer waivers. We
have these (`no_financial_blockage` / `no_commercial_blocking`) ✅.

**On the order — `SALES` and `SALES_FINANCE`:**

- `SALES.BLOCKED`, **`BLOCKEDMANUAL`**, `ORDERBLOCKED`
- `SALES_FINANCE.FINANCIALBLOCK`, **`FINANCIALBLOCKMANUAL`**,
  `FINANCIALBLOCKREASON`, `INVOICEBLOCK`
- 🔴 **`SALES_FINANCE.CHANGEDAFTERFINANCIALDEBLOCK`** — the reference records that
  an order was **changed after it was released**. That is the mechanism behind
  "a block comes back" (credit-and-blocking.md).

**On the delivery — `SALES_LINEDELIVERY`:** `BLOCKED`, **`AUTOBLOCK`**,
**`DELIVERYBLOCKREASON`** (its own reason list, `DELIVERYBLOCKREASON` table),
`PLANNED_DELIVERYDATE`. The commercial block sits on the **delivery row** —
confirms the blocked list one row per planned delivery ✅.

### Gaps against our code

| # | Reference | Ours |
|---|---|---|
| S1 | `CHANGEDAFTERFINANCIALDEBLOCK`: a released order that is edited is flagged, and can be held again | `deliverOrderItem` skips the credit re-check whenever **any** `OrderDeblocks` row exists, on the reasoning that an order cannot change after entry |
| S2 | `BLOCKEDMANUAL` / `FINANCIALBLOCKMANUAL`: a manual hold is told apart from an automatic one | `Orders.financialBlockage` is one boolean; a manual hold cannot be distinguished |
| S3 | `DELIVERYBLOCKREASON` list and `AUTOBLOCK` on the delivery | `OrderItems.commercialBlock` is a boolean with no reason |

None is built. They go into the next plan only once the user decides.

---

## 5. Batches — one lot can carry several batches

- **`PRODUCTBATCH`** — the batch: `PRODUCT`, **`PURCHASE`** (required), `RECEIPT`,
  **`FACTORY_CHARGE`** nvarchar(25) **required**, **`INTERNAL_CHARGE`** nvarchar(25)
  optional, `ITEM_CODE`, `DELIVERYDATE`, `IGNORE_DOCUMENT_OBLIGATIONS`.
- **`STOCKBATCH`** — the link: `STOCK` · `PRODUCTBATCH` · **`QUANTITY`** ·
  `HAS_STOCKBUNDLE`. **A stock lot holds quantities from several batches**, and a
  batch spreads over several lots.
- `SALES_LINEDELIVERY.PRODUCTBATCH` — a delivery names the batch it shipped.
- `PRODUCTION_BATCH` — a batch followed through production (`FROM_WAREHOUSE_ORDER`,
  `FROM_PRODUCTION_ORDER`, `TO_LOCATION`, `QUANTITY`).

| # | Gap |
|---|---|
| S4 | Our `Batches.stockUuid` is **one** lot per batch. The reference is many-to-many with a quantity. Sending certificates traces picks → lot → batch, which is exact only while a lot holds one batch |
| S5 | The mill charge is **required** there; ours is optional |

## 6. Companies, contacts, addresses — confirmed

- **`COMPANY`**: nine role bits — `IS_AGENT`, `IS_CUSTOMER`, `IS_INTERNAL`,
  `IS_MISCELANIOUS`, `IS_PROCESSOR`, `IS_PROSPECT`, `IS_PURCHASEORGANISATION`,
  `IS_SUPPLIER`, `IS_TRANSPORT`. Customer and prospect are **two independent bits**:
  the "not both" rule is enforced by the application, not the database. Also
  `PEPPOL_ID`, `SISTERAFFILIATE`, `SYNCHRONIZED`.
- **`COMPANY_CONTACT`** has the contact's **own** address (`CONTACT_STREET`,
  `CONTACT_CITY`, …), a link to one `COMPANYADDRESS`, `VATNUMBER`,
  `EXTERNAL_CODE` — and **nothing about the company**: no roles, representative,
  region, credit or revenue. **The phase-2 drop of 32 copied columns matches the
  reference exactly** ✅.
- **`COMPANY_ADDRESS`**: roles as `CATEGORIESTEXT`, `COMPANY_ISPOSTBOX`, and the
  delivery instructions (`DELIVERY_NEEDCRANE`, `DELIVERY_MAXLENGTH`,
  `Delivery_ForkliftUnload`, time window, …).
- **`COMPANY_VISITPLANNING`**: `VISIT_MONTHS` and `CALL_MONTHS`, each
  **nvarchar(12)** — a twelve-character mask, one character per month.
- **`COMPANY_MARKETING`**: `CALLFREQUENCY`, `VISITFREQUENCY`, `NEXTVISIT`,
  `VISITREASON`, `POTENTIAL`, **`POTENTIAL_WEIGHT`**, `TARGETREVENUE`,
  **`TARGET_WEIGHT`**, `NUMBEROFEMPLOYEES`, `BRANCH`, `CLASSIFICATION`.

| # | Gap |
|---|---|
| S6 | Our `VisitReports` stores the company's address, phone, industry, classification, frequencies and targets on each report. `VISITREPORT` stores **none** of it — the same copy pattern that was removed from contacts. Confirm with the D5 capture before touching it |

## 7. Things the screens still to capture will read

**D5 Visit reports — `VISITREPORT`:** `VISIT_DATE`, `VISIT_TIME`,
`VISIT_TYPE_CODE`, `VISIT_REASONS` **xml** (several reasons), `VISIT_EXECUTED`,
`ACCOUNTMANAGER`, `SALESMANAGER`, `VISITEDBY`, `COMPANYCONTACT`, `REMARK`,
`ISPRINTED`. `VISITREPORT_READER`: `CANREAD`, `MUSTREAD`, `HASREAD` per employee.
`VISITREPORT_RESULT`: the text.

**F1/F2 Complaints:**

- `COMPLAINT`: links to **sales order + line, sales invoice + line, purchase order
  + line, purchase invoice + line**, `TYPE_CODE`, `CATEGORY`, `INBOUNDDATE`,
  `AMOUNT`, `QUANTITY`, `WEIGHT`, `ORDERMETHOD`.
- **`COMPLAINT_HANDLING`** is its own table on the complaint: cause, solution,
  deadline, responsible, status, and **four costs** (`COSTCLAIM`,
  `COSTCUSTOMER`, `COSTEXTRA`, `COSTINTERN`), each with a description.
- `COMPLAINT_LINE`: `DELIVERY`, **`BILLOFLADING`**, `DELIVERYDATE`, dimensions,
  `QUANTITYDELIVEREDSHORT`, **`EXCHANGEPRODUCT`**, `LOCATION`, `COMPLETED`.
- `COMPLAINT_STATUSHISTORY` ≈ our `statusHistory` json.
- **S7:** our `ComplaintItems` repeats cause, solution, status and deadline on
  every line, while the reference keeps handling on the complaint and gives the
  line delivery, bill of lading and exchange product. Confirm with F1/F2.

**F3 Balanced Scorecard:** `SCORECARD_CATEGORY` → `SCORECARD_INDICATOR`
(`TYPE_CODE`, `IS_MANUAL`, `BATCHTASK_TYPE`, `UNIT`, `YELLOW_PERCENTAGE`) →
`SCORECARD_PROFILE_INDICATOR` (`CURRENT_TARGET`, `ENABLED`, `POSITION`) per
`SCORECARD_PROFILE`; `SCORECARD_VALUE` and `SCORECARD_TARGET_HISTORY` over time.
Each user has one `USERS.SCORECARD_PROFILE`.

**B16 SFN statistics — `REVENUEGROUP_STATISTICS`** per revenue group ×
`YEAR_SET` × `MONTH_SET`: `DELIVERED_NL_SFN`, `DELIVERED_NL_NONSFN`,
`DELIVERED_OUTSIDE_NL`, `PENDING_NL_PRODUCERS`, `PENDING_NL_NONPRODUCERS`,
`PENDING_OUTSIDE_NL`, `RECEIVED_EU`, `RECEIVED_NL_PRODUCERS`,
`RECEIVED_NL_NONPRODUCERS`, `RECEIVED_OUTSIDE_EU`. Nine flows. A customer's side
comes from `COMPANY_SALESSETTINGS.ISSFNMEMBER`; ours is `Companies.sfnRole`.

**B17 Revenue w.r.t. Budget — `REVENUEGROUP_BUDGET`** per revenue group × `YEAR`
× `MONTH`: revenue, weight and profit % **each split three ways — `STOCK`,
`FACTORY`, `CROSSDOCK`** — plus a `DISTRIBUTIONFACTOR`.

| # | Gap |
|---|---|
| S8 | Our `RevenueBudgets` holds one `orderType` per row with weight, revenue and profit amounts. The reference holds the three order types as columns, profit as a **percentage**, and a distribution factor. Confirm with B17 |

## 8. The statistics are batch-built — now proved

`CUSTOMERTURNOVER_PRODUCT_HISTORY`, `CUSTOMERTURNOVER_REVENUE_HISTORY` and
`REVENUEGROUP_TURNOVER_HISTORY` are **snapshot tables** — flat, denormalised
(company name, city, debtor number and customer group copied in as text), with
`REVENUETYPE_CODE` splitting product / option / charge. The customer revenue
screens read them. WHAT-IS-LEFT.md §3 called this a hypothesis; the schema makes
it fact, and explains why the `… last month` columns can be `0` while live
invoice columns beside them are right. Our screens compute from invoices live,
which cannot go stale.

## 9. Shape of the reference in general

- **One document table per side:** `SALES` holds quotes, orders and return orders
  (`SALESTYPE_CODE`, `CONVERTEDSALES`, `QUOTEVALIDTO`, `RETURNREASON`); `PURCHASE`
  likewise (`PURCHASETYPE_CODE`, `CONVERTEDPURCHASE`). There is **no
  purchase-request or purchase-return table** — they are `PURCHASE` rows with a
  type code. Our separate tables are a design choice, not a mismatch.
- **Multi-company throughout:** `AFFILIATE` on nearly every table.
- **Five languages:** `NAME1`–`NAME5` on every lookup list.
- **Lookups are editable lists** with `ACTIVE`, `CAN_EDIT`, `CAN_DELETE`,
  `SORTORDER`. We use fixed enums.
- **Present there, absent here, never seen used:** web shop (`WEB_*`), Staalweb
  orders (`STAALWEB_*`), ETIM classification, PEPPOL e-invoicing, EDI queue
  (`QUEUE`, `WORKPANEL_COMMUNICATION`), push notifications, work-panel locks.
