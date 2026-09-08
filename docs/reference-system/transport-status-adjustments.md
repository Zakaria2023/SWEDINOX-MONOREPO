# Transport status adjustments

`Overviews → Logistics → Transport status adjustments`.
Ours: `/transport-status-adjustments`.

**An audit log of one column.** Every time a trip's status changes, a row is
written here saying who changed it, when, and which order line it applied to.

**Filter**: `Date` from / u/i.
**Toolbar**: Save as Excel · Show in Excel · Print | Purchase lines ·
Warehouse workorders · Orders and Quotes · Production workorders ·
Transport workorders

---

## 🔑 The trip status ladder — seven states, not four

The whole value of this screen is that it prints the vocabulary of the
`Trip status` column in one place:

```
New → Scheduled → Loading list → Loaded → Loading done → In transit → Completed
```

All seven appear in a 26-row sample, along with the modifier
(`André van de...`), the timestamp, the `Bill of lading` and the
`Order` / `Order line`.

The line that matters for our code is between `Loading list` and `Loaded`:

| Up to `Loading list` | From `Loaded` |
|---|---|
| the goods are still on the shelf | the goods are on the vehicle |
| the trip can be re-planned freely | cancelling means physically unloading it |

Built as `tripStatuses` in `lib/enums.ts`, with `TRIP_STATUS_META`,
`nextTripStatus` and `canMoveTripTo` in `lib/helpers.ts` — which allows one step
forward always, and backwards only while `isLoaded` is false.

### ⚠️ What we had

Two things, both wrong:

- `TransportWorkOrders.status` used `transportWorkOrderStatuses` —
  `new / in_progress / completed / cancelled`. A four-state guess that collapses
  the three loading states the bay actually distinguishes.
- `TransportStatusAdjustments.tripStatus` used **`deliveryStatuses`** —
  `not_ready / ready / released / delivered`. A different vocabulary altogether,
  on the very screen whose only job is to log this column.

Both now read `tripStatuses`. Neither table had any rows, so the correction cost
nothing.

`cancelled` is **not** in the ladder: it did not appear in the sample. A trip
presumably can be cancelled, but the reference has not shown it, so it is not
invented here.

---

## A trip carries purchase orders as well as sales orders

The `Order` column holds both `1xxxxx` sales orders (`101167`, `100680`) and
`4xxxxx` purchase orders (`401081`, `401082`).

Which is consistent with what [Warehouse workorders](warehouse-workorders.md)
already showed — inbound goods are **collected** by a `Pick-up` transport work
order rather than delivered to us. The same trip machinery runs in both
directions.

---

## `Bill of lading` is sometimes blank

Three of the 26 rows have no bill of lading, and all three are early states
(`Scheduled`, `In transit`). So the document is raised at some point during the
trip rather than at the start — worth knowing before making the column
required.

Trip numbers in the sample: `300088`, `300138`, `300191`, `300244`, `300250`,
`300259`, `300288`, `300338`, `300568`, `300813`, `301176`, `301247`, `301282`,
`301289` — the `3xxxxx` series, i.e. the same sequence as warehouse and
production work orders, not the `6xxxxx` one the Warehouse workorders screen
calls `Trip number`.

⚠️ **Unresolved.** `Bill of lading` here holds `300813` and the Warehouse
workorders export's `Trip number` holds `600249`. Either they are two different
identifiers both loosely called a trip, or the bill of lading is the transport
work order number and the trip number is something above it. Not settled.

---

## Columns

`Modifier` · `Time modified` · `Trip status` · `Bill of lading` · `Order` ·
`Order line`

Six columns, and every one of them is audit metadata. There is nothing here
about the goods — the screen exists purely to answer "who changed this and
when".
