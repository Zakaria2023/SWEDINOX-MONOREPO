# Which screens are really empty — and the filter that lies

Captured 10-9-2026. **This file replaces an earlier version of itself that was
wrong**, and the way it was wrong is the most useful thing on the page.

## 🔴 The correction

An earlier pass recorded eight screens as returning zero rows and concluded they
were *"the fourth feature-group this system ships switched off."* Three of them
then arrived as exports with thousands of rows in them:

| Screen | Claimed | Actually |
| ------ | ------- | -------- |
| `Revenue per product` | empty | **2 782 rows** |
| `Production capacity` | not captured | **403 rows** |
| `Production capacity details` | not captured | **1 970 rows** |

## Why they looked empty: `Year` / `Month`, not `from` / `to`

Most overviews filter on a **date range** — `from 1-1-2024 u/i 10-9-2026` — and
the standing rule is *never leave the `from` box blank, because a blank `from`
voids the filter and returns nothing.*

But a second kind of screen exists, and it filters on **year and month**:

```
Year (Invoice Date) (leave blank for current year)
Month (Invoice Date) (1-12) (leave blank for current month)
```

The screen says what it does, in the label, in brackets. **Blank does not mean
"all" here — it means "now."** So an untouched filter asks for September 2026,
a month with no invoices in it, and the grid is empty. Correctly.

`Revenue per revenue group` proves it inside a single pair of screenshots: blank
Year/Month with `View = -empty-` gives nothing, and the saved view `Omzet per
groep` over `1-1-2024 → 10-9-2026` gives three groups and €9 million of revenue.

**The general rule, restated:** an empty grid in this system is a claim about
the *filter* until you have read the filter. There are at least three ways for a
filter to return nothing while looking untouched — a blank `from`, a blank
`Year`/`Month`, and a `View` that hides the columns the rows are in.

## What is genuinely empty

These were run over a real date range — `1-1-2024` to `10-9-2026`, the same
window that returns 13.562 stock movements — and returned nothing:

| Screen | Filter used | Columns it would have |
| ------ | ----------- | --------------------- |
| `Capacity checks` | `Workorder date` 1-1-2024 → 10-9-2026 | `Status`, `Check`, `Type`, `Occupied capacity`, `Capacity u.`, `Maximum Capacity`, `Date`, `Time alert email`, `Time max warning`, `Warning capacity` |
| `Time registration` | `Date` 1-1-2024 → 10-9-2026 | `Date Time`, `User`, `Extra User`, `Scan code`, `Context`, `Context ref.`, `Action`, `Action reference` |
| `Control Revaluation of stock due to FSP-changes` | `Mutation date` 1-1-2024 → 10-9-2026, product code `zzzzzzzzzzzzzzz` | see [fsp.md](fsp.md) |
| `Purchases and sales per revenue group` | ⚠️ **Year/Month blank** — so this one is unproved | `Revenue group no.`, `Revenue group`, `Year`, `Month`, `Order type`, `Purchase (kg)`, `Purchase revenue`, `Weight`, `Revenue`, `Profit`, `Profit %`, `Avg. Sales Price/Kg` |

## Still unproved either way

`Stock history` · `Production batches` · `Freight movement` ·
`Freight flow (SFN)` · `Sawing layouts`

These returned nothing, but their filter rows were not captured, so it is not
known whether they are empty or were asked about September 2026. **They are not
evidence of anything yet.**

Two more joined them on the same day, and these two are *known* to have been
asked with a blank `Year`/`Month`, so they are certainly unproved:

- **`SFN statistics Product-Market`** — `sfn_no`, `Year`, `Month`,
  `cbs_statnr.`, `SBI code`, `Postal code`, `Weight (kg)`. Weight by customer
  industry and postcode: a market-share return, not an accounting one.
- **`Revenue w.r.t. Budget`** — every figure paired with its budget: `Weight` /
  `Weight Budget`, `Revenue` / `Revenue Budget`, `Profit` / `Profit budget`,
  `Profit %` / `Profit % Budget`, `Avg. Sales Price/Kg` / `… Budget`. A second
  view drops the revenue-group columns and reports by month alone.

⚠️ **`Purchases and sales per revenue group` is in the same position** and is
listed in the confirmed-empty table above with a warning. Its sibling
`Revenue per revenue group` returns €9 million from the same window once the
filter is set properly, so the presumption should be that it has data too.

## What still stands

Three features really are switched off, and each was proved from a populated
export rather than an empty screen — which is the difference that matters:

- **Transport costing** — `Driver`, `Km` and `Cost price` are empty on all 438
  trips in a 438-row export
- **`Resource`** — empty on all 13.610 work order lines in a 13.610-row export
- **`Pickvolgorde`** — unused across the 1.940-row location master

**A column that is blank on every row of a full export is evidence. An empty
grid is not.** The first is the system telling you it does not use something;
the second is usually you telling the system the wrong dates.

## What was built

Nothing was removed, and nothing new was built. All the routes already exist.
The value of this page is the rule at the top of it.
