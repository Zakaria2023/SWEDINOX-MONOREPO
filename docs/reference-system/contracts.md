# Contracts and contract groups

`Overviews → Suppliers → Contracts per supplier`, and the `Contracts` /
`Contractgroups` masters behind it. Captured 10-9-2026.

## A contract has a *kind*

`Contracts` — 10 rows:

| Contract code | Description | Contract group | ContractInfo type |
| ------------- | ----------- | -------------- | ----------------- |
| `AZIE IMPORT` | Toeslagen voor EU import | — | **Surcharges** |
| `BB` | bb | Pallet costs | **Gross prices** |
| `CERTIFICATEN` | Certificaat 3.1 | Certificates | **Options** |
| `CODE` | new contract | Pallet costs | **Gross prices** |
| `HEGO PRODUCTIE` | Hego Productie | — | **Options** |
| `KK` | kk | Pallet costs | **Gross prices** |
| `PACKAGING COSTS` | Packaging costs | — | **Surcharges** |
| `PALLET COSTS` | Pallet costs | Pallet costs | **Surcharges** |
| `SS` | ss | — | **Options** |
| `ZZ` | zz | Certificates | **Gross prices** |

The last column is the finding. **A contract declares what it adjusts** — one
of `Gross prices`, `Surcharges` or `Options` — and that decides which part of a
line's price build-up it touches. `Certificaat 3.1` is an *option* (a
certificate you buy), `Toeslagen voor EU import` is a *surcharge*, and a
gross-price contract restates the price itself.

That maps directly onto the seven-part price build-up already recorded in
[PURCHASE-REMAINING.md](PURCHASE-REMAINING.md): gross price, discounts,
surcharges, options. A contract is a rule attached to one of those parts.

Four of the ten (`BB`, `KK`, `SS`, `ZZ`, and arguably `CODE`) are obvious test
records — two-letter codes, descriptions that repeat the code in lower case. The
six real ones are the import surcharge, the 3.1 certificate, Hego's own
production agreement, packaging costs and pallet costs.

`Searchcode 1/2/3` are free-text tags — `AZIE IMPORT` carries `Azie`, `EU`,
`import`. `Website sort` is 10 on nine of ten rows and 0 on the tenth.

## Contract groups are a two-level tree with sequences

`Contractgroups` — 3 rows:

| Contract group | Main group | Main seq. | Subgroup | Sub seq. |
| -------------- | ---------- | --------- | -------- | -------- |
| Certificates | Certificates | 0 | Certificate costs | 0 |
| Hego Productie | Production | 0 | Internal production | 0 |
| Pallet costs | Packaging | 0 | Pallet costs | 0 |

So a contract group resolves to a **main group + subgroup**, each with its own
sequence number — the same shape as the product hierarchy, and the sequences are
there to order them on a printed quotation. All six sequences are `0`, so the
ordering is unused.

## Contracts per supplier — the join

3 rows, and the columns are `Supplier code`, `Supplier`, `City`, `Contract
code`, `Contract`, `Contract group`, `Starting date`, `End date`,
**`Preference`**.

```
11750  Hyundai Corporation  SEOUL      AZIE IMPORT      30-9-2024 → 31-12-9999
13660  Hego Production      ALMERE     HEGO PRODUCTIE   23-12-2024 → 31-12-9999
13756  Zakaria Company      AMSTERDAM  CODE             13-6-2026 → 31-12-9999
```

- **A contract is time-bounded**, and the open end is the `31-12-9999` sentinel
  we already treat as blank.
- **`Preference`** is `0` on all three — a ranking for when two suppliers both
  have a contract covering the same goods. Another field that exists and is not
  used.
- The filter boxes use `zzzzzzzzz` — **nine** z's here, against the fifteen on
  the Logistics screens. The sentinel's length varies by field width, so
  `TEXT_FILTER_UPPER_BOUND_SENTINEL` should be matched by *shape* (all z's), not
  by exact string.

## What we have

`Contracts` and `ContractNetPrices` exist, and a contract already attaches to an
order (`Contracts.orderUuid`, read by `loadSalesPricingContext`). What is
missing is the **kind** — nothing says whether a contract adjusts gross prices,
surcharges or options, so every contract is treated as a price agreement.

Written up as item 5 of
[PLANNED-CODE-CHANGES-2.md](PLANNED-CODE-CHANGES-2.md). **No code was changed.**

---

# The two screens themselves — 13-9-2026

Photographed as part of the Part-B sweep. Ten contracts, three contract groups.

## Contracts — the grid

| Contract code | Description | Contract group | Website sorting | Type |
| --- | --- | --- | --- | --- |
| `AZIE IMPORT` | Toeslagen voor EU import | — | **0** | Surcharges |
| `BB` | bb | Pallet costs | 10 | Gross prices |
| `CERTIFICATEN` | Certificaat 3.1 | Certificates | 10 | **Options** |
| `CODE` | new contract | Pallet costs | 10 | Gross prices |
| `HEGO PRODUC…` | Hego Productie | — | 10 | **Options** |
| `KK` | kk | Pallet costs | 10 | Gross prices |
| `PACKAGING C…` | Packaging costs | — | 10 | Surcharges |
| `PALLET COSTS` | Pallet costs | Pallet costs | 10 | Surcharges |
| `SS` | ss | — | 10 | **Options** |
| `ZZ` | zz | Certificates | 10 | Gross prices |

🔴 **The contract type is a real, populated column.** The doc above said
*"nothing says whether a contract adjusts gross prices, surcharges or options"*
— it does, and the tooltip gives the internal name:
**`ContractInfo_ContractTypes`**. Three of the six values we ship are in use
here: `Surcharges` (3), `Options` (3), `Gross prices` (4). `net_prices`,
`cost_price` and `allowances` are unused, not absent.

**Our model is already right.** `contractTypes` in `lib/enums.ts` carries all
six, `searchCode1/2/3` exist, and `websiteSorting` defaults to **10** — which is
exactly the value nine of the ten rows carry. Nothing to change.

`Searchcode 1/2/3` are filled on **one** row (`Azie` / `EU` / `import`): free
keywords for finding a contract, not a classification.

Four contracts have **no group**, so `contractGroupUuid` stays nullable.

## Contractgroups — a group is a **main group plus a subgroup**

| Contract group | Main group | Main seq. | Subgroup | Sub seq. |
| --- | --- | --- | --- | --- |
| Certificates | Certificates | 0 | Certificate costs | 0 |
| Hego Productie | **Production** | 0 | Internal production | 0 |
| Pallet costs | **Packaging** | 0 | Pallet costs | 0 |

Both sequences are `0` on all three — confirming the earlier note that contract
group sequences are switched off.

⚠️ **Our `ContractGroups` carries `contractSubgroupUuid` and
`sequenceWithinSubgroup` — one level, one sequence.** The reference has
**two** levels with a sequence each: a main group (`Certificates`,
`Production`, `Packaging`) above the subgroup (`Certificate costs`,
`Internal production`, `Pallet costs`). Queued as item 12 of
[PLANNED-CODE-CHANGES-3.md](PLANNED-CODE-CHANGES-3.md).

## Where the contracts actually bite

[charges.md](charges.md) §4 finds `Packaging costs` and `Pallet costs` named in
the `Contract` column of eight charge rows — the same two contract codes. So a
`Surcharges` contract does what its type says: it sets the surcharge instead of
the standing tariff. That is the first observed link between a contract and a
line of money.

`CERTIFICATEN` — *Certificaat 3.1* — typed as **`Options`**, pairs with option
code `A21` *2.1 Certificate*
([sales-options-and-calloff.md](sales-options-and-calloff.md) §1). Certificates
are sold as options and priced by contract. That is most of Part E answered
before Part E was opened.
