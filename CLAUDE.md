# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository (`apps/dashboard`).

## Project Architecture

This is a pnpm + Turborepo repo built on Next.js 16. Today it holds a single app, `apps/dashboard` (package name `@swedinox/dashboard`) — an internal staff dashboard protected by Clerk, covering companies, orders, quotes, invoices, contracts, warehouses, machines, and related back-office entities. There is no `packages/` workspace and no other app (no separate client/admin/api/mobile surface) — everything lives under `apps/dashboard/src`.

**Structure (`apps/dashboard/src`)**

- `app/` — Next.js App Router routes. Each feature route folder (e.g. `app/(dashboard)/companies/`) holds its own `page.tsx`, `actions.ts`, `validation.ts` (zod schema), and any page-specific hooks (e.g. `use-company-submit.ts`). `app/api/documents/*` holds the file upload/download/delete Route Handlers. `app/sign-in/[[...sign-in]]` renders Clerk's `<SignIn>`.
- `components/` — all React components, grouped into a subfolder per feature/page (e.g. `components/companies/`), plus shared `components/ui`, `components/shadcn`, `components/sidebar`, `components/layout`.
- `db/` — the only place Drizzle is imported and the only place a DB connection is opened (`db/index.ts`). `db/schema/*.ts` holds one file per table, re-exported from `db/schema/index.ts`.
- `lib/` — `enums.ts` (all enum const arrays), `labels.ts` (all label maps), `helpers.ts` (framework-agnostic helpers, e.g. `cn`, `generateUuid`), `auth.ts` (`requireAuth`/`requireAdmin`), `validation-messages.ts` (shared zod error strings), and `lib/server/*.ts` for server-only, transport-bound code (Clerk admin client, Cloudflare R2 client, document storage helpers).
- `proxy.ts` — `clerkMiddleware`, protects every route except `/sign-in(.*)`.

**Calling convention**

- Server Actions (`"use server"`, defined in each route folder's `actions.ts`) are the only way pages mutate or query data. They call `db` (from `@/db`) directly — there is no separate service/business-logic package. Keep query/mutation logic in `actions.ts`; keep `page.tsx`/components presentational.
- Route Handlers exist only where a Server Action can't do the job (currently just the `/api/documents/*` upload/download/delete endpoints, since browser `fetch`/`FormData` needs a real HTTP endpoint). Never add a new Route Handler to duplicate something a Server Action could do — see **Next.js Server Actions** below.

**Auth**

- Clerk is the sole identity provider. Do not reintroduce a custom password/JWT/session system.
- There is no local `Users` table — Clerk owns the user list entirely. Columns that reference a user (e.g. `modifiedByUserId`) store the Clerk user id directly as a string column, not a foreign key.
- `clerkMiddleware` in `proxy.ts` protects every route except `/sign-in(.*)`; `<ClerkProvider>` wraps the root layout. Sign-in is Clerk's own hosted `<SignIn>` component (`app/sign-in/[[...sign-in]]/page.tsx`), not a custom form.
- `requireAuth`/`requireAdmin` (`lib/auth.ts`) resolve the Clerk session server-side (`auth()`/`currentUser()`) and redirect to `/sign-in` or `/unauthorized`; `requireAdmin` additionally checks `user.publicMetadata.role === "admin"`.
- `lib/server/clerk.ts` uses `clerkClient()` server-side (e.g. `getClerkUsers`) only to list Clerk users for dropdowns (assigning a rep, etc.) — never to manage credentials.

**Hard rules**

- No direct database access from client components — only Server Actions/Route Handlers import `@/db`.
- Never modify `db/index.ts` (the database connection/pool setup). Leave this file exactly as-is under all circumstances unless the user explicitly asks to change it.

## Package Manager

- Always use `pnpm` for installing dependencies and running scripts in this repo — never `npm` or `yarn`. (`npm install <pkg>` → `pnpm add <pkg>`, `npm run <script>` → `pnpm <script>`.)

## React

- Never use namespace-qualified React types like `React.ReactNode`, `React.FC`, `React.MouseEvent`, etc.
  Always import the specific type directly from `react`.

  ```tsx
  // ❌ Bad
  const foo: React.ReactNode = null;
  const handler: React.MouseEventHandler = () => {};

  // ✅ Good
  import { ReactNode, MouseEventHandler } from "react";
  const foo: ReactNode = null;
  const handler: MouseEventHandler = () => {};
  ```

## Components & Functions

- Never use named function declarations. Always use arrow functions.
- When a component or function body is only a `return`, use the implicit arrow return — no curly braces, no `return` keyword. If the returned JSX spans multiple lines, wrap it in `()` instead of using `{ return ... }`.

  ```tsx
  // ❌ Bad
  function MyComponent() {
    return <div>Hello</div>;
  }

  // ❌ Also bad
  const MyComponent = () => {
    return <div>Hello</div>;
  };

  // ❌ Also bad — braces + return for multi-line JSX
  const MyComponent = () => {
    return (
      <div>
        <span>Hello</span>
      </div>
    );
  };

  // ✅ Good (single-line)
  const MyComponent = () => <div>Hello</div>;

  // ✅ Good (multi-line — parens instead of braces + return)
  const MyComponent = () => (
    <div>
      <span>Hello</span>
    </div>
  );
  ```

## Props

- Never define props inline. Always declare a named type above the component.
- All types in a file always live together at the top, above every function/component in that file — not interleaved as one type directly above each function. When a file has multiple components, group all their types first, then all the components.

  ```tsx
  // ❌ Bad
  const Button = ({
    label,
    onClick,
  }: {
    label: string;
    onClick: () => void;
  }) => <button onClick={onClick}>{label}</button>;

  // ❌ Bad — type placed directly above each function, interleaved
  type ButtonProps = {
    label: string;
    onClick: () => void;
  };

  const Button = ({ label, onClick }: ButtonProps) => (
    <button onClick={onClick}>{label}</button>
  );

  type CardProps = {
    title: string;
  };

  const Card = ({ title }: CardProps) => <div>{title}</div>;

  // ✅ Good — all types grouped together above all components
  type ButtonProps = {
    label: string;
    onClick: () => void;
  };

  type CardProps = {
    title: string;
  };

  const Button = ({ label, onClick }: ButtonProps) => (
    <button onClick={onClick}>{label}</button>
  );

  const Card = ({ title }: CardProps) => <div>{title}</div>;
  ```

## Type Placement

- This applies to **every** `.ts`/`.tsx` file, not just components: all `type` declarations live together in one block at the top of the file, directly below the imports and above every `const`/function in that file. Never interleave a type between functions, and never place a type directly above the one function that happens to use it.
- This includes `actions.ts` files. When adding a new action to an existing `actions.ts`, its DTO types go at the **bottom of the existing type block at the top**, not next to the new function.
- Module-level constants also belong above the functions — put them directly below the imports, before the type block.

  ```ts
  // ❌ Bad — each type sits next to the function that uses it
  export type OrderListItem = SelectOrders & { customerName: string | null };

  export const getOrders = async (): Promise<OrderListItem[]> => {
    // ...
  };

  export type OrderDetail = OrderListItem & { items: OrderItemRow[] };

  export const getOrderDetail = async (
    uuid: string,
  ): Promise<OrderDetail | null> => {
    // ...
  };

  // ✅ Good — one type block at the top, then the functions
  const ORDER_ITEM_LIMIT = 100;

  export type OrderListItem = SelectOrders & { customerName: string | null };

  export type OrderDetail = OrderListItem & { items: OrderItemRow[] };

  export const getOrders = async (): Promise<OrderListItem[]> => {
    // ...
  };

  export const getOrderDetail = async (
    uuid: string,
  ): Promise<OrderDetail | null> => {
    // ...
  };
  ```

## Icons

- Never use inline `<svg>` elements for icons. Always use [`lucide-react`](https://lucide.dev) instead.

  ```tsx
  // ❌ Bad
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="..." stroke="currentColor" />
  </svg>;

  // ✅ Good
  import { Layers } from "lucide-react";
  <Layers size={24} />;
  ```

## Images

- Never use a plain `<img>` tag. Always use `Image` from `next/image` instead.

  ```tsx
  // ❌ Bad
  <img src={category.image} alt={category.name} className="h-10 w-10" />;

  // ✅ Good
  import Image from "next/image";
  <Image
    src={category.image}
    alt={category.name}
    width={40}
    height={40}
    className="h-10 w-10"
  />;
  ```

## Dates & Times

- Never use a native date/time input (`<Input type="date" />`, `type="time"`, `type="datetime-local"`, `type="month"`, `type="week"`). Always use `DatePicker` from `@/components/shadcn/date-picker` or `TimePicker` from `@/components/shadcn/time-picker`.
- Both are controlled by a plain string — `DatePicker` reads and emits `"yyyy-MM-dd"`, `TimePicker` reads and emits 24-hour `"HH:mm"` — which is exactly what the native inputs produced, so zod schemas and Server Actions need no change.
- Inside a `react-hook-form` form they are wired with `Controller` (they have no `ref`, so `register` does not work on them). Outside a form, pass `value` and `onChange` from `useState` directly — `onChange` hands you the string, not an event.
- When a `FormLabel` has an `htmlFor`, pass the same value as the picker's `id` so clicking the label still reaches the control.

  ```tsx
  // ❌ Bad — native date input
  <Input id="quoteDate" type="date" {...register("quoteDate")} />

  // ❌ Also bad — register() on a picker, which has no ref to bind
  <DatePicker {...register("quoteDate")} />

  // ✅ Good — inside a form
  <FormLabel htmlFor="quoteDate">Quote date</FormLabel>
  <Controller
    name="quoteDate"
    control={control}
    render={({ field }) => (
      <DatePicker
        id="quoteDate"
        value={field.value ?? ""}
        onChange={field.onChange}
      />
    )}
  />

  // ✅ Good — outside a form
  <DatePicker value={paymentDate} onChange={setPaymentDate} />
  ```

## Choosing a product

- **A product is never chosen from a plain dropdown.** Every place a document
  line names an article — sales orders, quotes, purchase orders, purchase
  quotes, purchase requests, return orders, counter orders — opens the **stock
  search dialog** (`components/orders/stock-search-dialog.tsx`), which is what
  the reference system does: pressing `New` on a line opens a window titled
  `Stock`, not a `<select>`.
- The dialog filters on product code, search code, quality and the three
  dimensions, each dimension with a **±5 % `Search with margin`**, and shows two
  grids: product/quality variants above, individual lots below.
- It searches one of three sources — `stock` (on the shelf), `purchase`
  (ordered, not yet arrived) or `catalogue` (the article list, regardless of
  stock). A **buying** document searches `catalogue`; a **selling** document
  searches `stock`.
- ⚠️ Never scope a product picker to one company's linked products. That is how
  a form ends up offering one article out of 5 626.

  ```tsx
  // ❌ Bad — a dropdown, and scoped to the supplier's own products
  <Select options={productOptions} onValueChange={field.onChange} />

  // ✅ Good — the dialog, searching the catalogue
  <ProductSearchField
    value={field.value}
    onChange={field.onChange}
    source="catalogue"
  />
  ```

## Navigation

- Never use a plain `<a>` tag for in-app navigation. Always use `Link` from `next/link` instead.

  ```tsx
  // ❌ Bad
  <a href="/products">Products</a>;

  // ✅ Good
  import Link from "next/link";
  <Link href="/products">Products</Link>;
  ```

- Never navigate imperatively with `useRouter().push()` inside an `onClick` for what is really just a link. Use `Link`. Reserve `useRouter().push()` for navigation that can't be expressed as a link (e.g. after some async work). For a whole clickable element (like a card) that also contains its own buttons, use a stretched `Link` overlay (`absolute inset-0`) plus `relative z-10` on the inner buttons — don't nest a `<button>` inside the `Link`.

  ```tsx
  // ❌ Bad — imperative navigation for a plain link
  const openProduct = (slug: string) => router.push(`/products/${slug}`);
  <article role="button" onClick={() => openProduct(slug)}>
    ...
  </article>;

  // ✅ Good — stretched Link overlay, buttons sit above it
  <article className="relative">
    <Link
      href={`/products/${slug}`}
      aria-label={`View ${name}`}
      className="absolute inset-0"
    />
    <button type="button" onClick={addToCart} className="relative z-10">
      Add
    </button>
  </article>;
  ```

## Linting

- Never disable a lint rule (`eslint-disable`, `eslint-disable-next-line`, etc.) to make a warning or error go away. Fix the underlying code so it satisfies the rule instead.

  ```tsx
  // ❌ Bad
  // eslint-disable-next-line @next/next/no-img-element
  <img src={category.image} alt={category.name} />;

  // ✅ Good — use the tool the rule is steering you toward
  import Image from "next/image";
  <Image src={category.image} alt={category.name} width={40} height={40} />;
  ```

## Tailwind CSS

- Never use arbitrary value syntax for spacing, sizing, or typography when a built-in Tailwind scale exists. Always prefer Tailwind's design tokens.

  ```tsx
  // ❌ Bad
  <p className="text-[22px] mt-[12px] w-[300px]" />

  // ✅ Good
  <p className="text-2xl mt-3 w-72" />
  ```

- Never use arbitrary letter-spacing values like `tracking-[-0.012em]`. Always use the built-in `tracking-*` scale (`tracking-tighter`, `tracking-tight`, `tracking-normal`, `tracking-wide`, etc.).

  ```tsx
  // ❌ Bad
  <h1 className="tracking-[-0.012em]" />

  // ✅ Good
  <h1 className="tracking-tight" />
  ```

- Never use the `truncate` class. Handle overflowing text another way (e.g. `line-clamp-*`, or let it wrap).

  ```tsx
  // ❌ Bad
  <p className="truncate" />

  // ✅ Good
  <p className="line-clamp-1" />
  ```

- Never use extra-bold or heavier font weights (`font-extrabold`, `font-black`). Keep text at `font-normal`, `font-medium`, or at most `font-semibold` for emphasis.

  ```tsx
  // ❌ Bad
  <span className="font-extrabold" />

  // ✅ Good
  <h3 className="font-bold" />
  <h3 className="font-semibold" />
  <span className="font-medium" />
  ```

## Exports

- Regular components use **named exports** — inline on the declaration is fine, just never `export default`.
- Only Next.js pages and layouts use `export default`, and it must be written at the **bottom** of the file, never inline.

  ```tsx
  // ❌ Bad — default export on a regular component
  export default const Card = () => <div />

  // ❌ Bad — default export on a regular component
  export default Card

  // ✅ Good — inline named export on a regular component
  export const Card = () => <div />

  // ✅ Good — page/layout with default export at the bottom
  const DashboardPage = () => (
    <main>...</main>
  )

  export default DashboardPage
  ```

## TypeScript

- Never use the non-null assertion operator (`!`). Always handle the missing case explicitly by throwing an error or returning early.
- Never use the `any` type. Use the actual type, `unknown` with a narrowing check, or a generic instead.

  ```ts
  // ❌ Bad
  const value = process.env.API_KEY!;

  // ✅ Good
  const value = process.env.API_KEY;
  if (!value) throw new Error("Missing required environment variable: API_KEY");
  ```

  ```ts
  // ❌ Bad
  const parseData = (data: any) => data.value;

  // ✅ Good
  const parseData = (data: unknown) => {
    if (typeof data !== "object" || data === null || !("value" in data)) {
      throw new Error("Invalid data shape");
    }
    return data.value;
  };
  ```

## Control Flow

- Never write a brace-less `if`. Every `if` (and `else`) body must be wrapped in `{}`, even when it's a single statement on its own line or an early `return`/`throw`.

  ```ts
  // ❌ Bad — brace-less single-statement if
  if (!boq) throw new Error("BOQ not found");

  // ❌ Also bad — brace-less early return
  if (!first) return null;

  // ✅ Good
  if (!boq) {
    throw new Error("BOQ not found");
  }

  if (!first) {
    return null;
  }
  ```

## Route Handlers

- Only add a Route Handler when a Server Action genuinely can't do the job — currently that's just `app/api/documents/upload/route.ts`, `app/api/documents/[documentId]/download/route.ts`, and `app/api/documents/[documentId]/delete/route.ts`, since the browser needs a real HTTP endpoint for `FormData` upload/streamed download. Business logic for these still lives in `lib/server/document-storage.ts` and `lib/server/cloudflare-r2.ts` — the `route.ts` file just wires the request to those helpers, it doesn't inline the logic.
- Never use the `export { handler as METHOD } from "..."` re-export syntax — write a normal handler export instead.

  ```ts
  // ❌ Bad — re-export syntax
  export { handleDocumentUpload as POST } from "./handler";

  // ✅ Good — import and call the shared handler
  import { isAllowedDocumentType } from "@/lib/server/document-storage";

  export const POST = async (req: Request) => {
    // ...
  };
  ```

## Next.js Server Actions

- Always use Next.js Server Actions for data mutations and queries. Never create a new route handler (route.ts) to duplicate something a Server Action could do.
- If a route handler already exists for an operation (e.g. file upload/download), reuse it from the client (`fetch`) instead of writing a parallel Server Action that does the same thing.
- Server Actions should be defined in `actions.ts` files within feature directories.
- All Server Actions must have the `"use server"` directive at the top of the file.
- Always perform redirects on the server, inside the Server Action itself, using `redirect` from `next/navigation`. Never redirect on the client (e.g. via `router.push` after checking `state.success`).

  ```ts
  // ❌ Bad — using route handlers
  // app/api/addresses/route.ts
  export async function POST(request: Request) {
    const data = await request.json();
    // ...
  }

  // ✅ Good — using Server Actions
  // app/(dashboard)/addresses/actions.ts
  ("use server");

  export const createAddress = async (
    _prevState: ActionResult,
    data: CreateAddressInput,
  ): Promise<ActionResult> => {
    // ...
  };
  ```

  ```ts
  // ❌ Bad — a new Server Action that duplicates an existing route handler
  // app/(dashboard)/categories/action.ts
  ("use server");

  export const uploadCategoryImage = async (formData: FormData) => {
    // ... same upload logic app/api/documents/upload/route.ts already does
  };

  // ✅ Good — reuse the existing route handler from the client
  // app/api/documents/upload/route.ts already exists, so call it directly
  const response = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
  });
  ```

  ```ts
  // ❌ Bad — redirecting on the client after a successful action
  const [state, dispatch, isPending] = useActionState(createAddress, {});

  useEffect(() => {
    if (state.success) router.push("/addresses");
  }, [state.success]);

  // ✅ Good — redirecting on the server, inside the action
  // app/(dashboard)/addresses/actions.ts
  ("use server");

  import { redirect } from "next/navigation";

  export const createAddress = async (
    _prevState: ActionResult,
    data: CreateAddressInput,
  ): Promise<ActionResult> => {
    // ... perform mutation
    redirect("/addresses");
  };
  ```

## Dynamic Route Params

- Page components for dynamic routes always type `params` as a `Promise` and `await` it to read the route values — never destructure `params` directly as a plain object.

  ```tsx
  // ❌ Bad
  type Props = {
    params: { uuid: string };
  };

  const CategoryEditPage = ({ params }: Props) => {
    const { uuid } = params;
    // ...
  };

  // ✅ Good
  type Props = {
    params: Promise<{ uuid: string }>;
  };

  const CategoryEditPage = async ({ params }: Props) => {
    const { uuid } = await params;
    // ...
  };
  ```

## Form Submissions

- Always use `useActionState` from `react` when a form submits to a server action.
- Always pair it with `react-hook-form` and `zodResolver` for client-side validation.
- Call `dispatch(validatedData)` inside `handleSubmit` — never call the server action directly.
- Use `isPending` to disable the submit button and `state.error` to display server errors. Redirects on success happen inside the Server Action itself (see Server Actions above) — don't branch on `state.success` to redirect from the client.

  ```tsx
  // ❌ Bad — calling server action directly
  const onSubmit = handleSubmit(async (data) => {
    await createAddress({}, data);
  });

  // ✅ Good — routing through useActionState
  const [state, dispatch, isPending] = useActionState(createAddress, {});

  const { handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit((data) => {
    dispatch(data);
  });
  ```

## Enums

- Never use TypeScript's `enum`. Always define enums as a `const` array typed with `as const satisfies readonly string[]`, and derive the union type from it with `(typeof arr)[number]`.
- Never define an enum inline inside a database schema file (e.g. inline in the array argument to `mysqlEnum(...)`). Define it in `lib/enums.ts` and import the const array into the schema file instead.
- All enums for the app live together in the single `lib/enums.ts` file — not scattered across one-file-per-enum.
- Labels never live in `enums.ts`. All label maps live together in the single `lib/labels.ts` file instead, each exported as a `Record<EnumType, string>`.

  ```ts
  // ✅ Good — lib/enums.ts
  export const productStatuses = [
    "draft",
    "published",
    "archived",
  ] as const satisfies readonly string[];

  export type ProductStatus = (typeof productStatuses)[number];
  ```

  ```ts
  // ✅ Good — lib/labels.ts
  import { ProductStatus } from "./enums";

  export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
    draft: "Draft",
    published: "Published",
    archived: "Archived",
  };
  ```

  ```ts
  // ❌ Bad — enum defined inline in the schema file
  // db/schema/products.ts
  status: mysqlEnum("status", ["draft", "published", "archived"]);

  // ✅ Good — import the const array from lib/enums.ts
  // db/schema/products.ts
  import { productStatuses } from "../../lib/enums";

  status: mysqlEnum("status", productStatuses);
  ```

## Folder Structure

- The `actions.ts` file for a page always lives inside that page's own route folder in `app/`, next to its `page.tsx` — never in a separate top-level actions directory.
- Zod validation schemas and custom hooks for a page also live inside that same route folder in `app/`, next to `page.tsx` and `actions.ts` — not in `components/`, not in a top-level `hooks/` or `schemas/` directory.
- Components never live inside `app/`. All components live under a top-level `components/` folder, grouped into a subfolder named after the page/feature they belong to.

  ```
  // ✅ Good
  app/
    products/
      page.tsx
      actions.ts
      validation.ts (zod schema)
      hooks.ts

  components/
    products/
      product-card.tsx
      product-filters.tsx
  ```

  ```
  // ❌ Bad — components colocated inside app/, validation/hooks pulled out to top-level folders
  app/
    products/
      page.tsx
      actions.ts
      product-card.tsx
      product-filters.tsx

  schemas/
    products.ts

  hooks/
    use-products.ts
  ```

## Helpers

- Reusable helper/utility functions (formatters, parsers, URL builders, etc.) must never be defined inline at the top of a component file. Import them instead.
- Framework-agnostic helpers (`cn`, `generateUuid`, `pluralize`, `todayDateString`, etc.) live in the single `lib/helpers.ts` file and are imported via `@/lib/helpers`.
- Only helpers that are genuinely server-only and tied to a specific transport/runtime (Clerk admin client, Cloudflare R2 client, document storage) live under `lib/server/*.ts`. Never mix server-only code into `lib/helpers.ts`, since that file is imported by client components too.

  ```tsx
  // ❌ Bad — helper defined inline in the component file
  const formatPrice = (price: string, currency: string | null) =>
    `${currency ?? "SAR"} ${Number(price).toLocaleString("en-US")}`;

  export const ProductCard = ({ product }: ProductCardProps) => (
    <span>{formatPrice(product.price, product.currency)}</span>
  );

  // ✅ Good — shared helper lives in lib/helpers.ts
  // lib/helpers.ts
  export const formatPrice = (price: string, currency: string | null): string =>
    `${currency ?? "SAR"} ${Number(price).toLocaleString("en-US")}`;

  // product-card.tsx
  import { formatPrice } from "@/lib/helpers";

  export const ProductCard = ({ product }: ProductCardProps) => (
    <span>{formatPrice(product.price, product.currency)}</span>
  );
  ```

## File Naming

- All file names are always kebab-case, regardless of what's exported from them (components, hooks, schemas, etc.) — never PascalCase or camelCase file names.

  ```
  // ❌ Bad
  LocationForm.tsx
  useProducts.ts

  // ✅ Good
  location-form.tsx
  use-products.ts
  ```

## Database Schema

- Table definitions always use PascalCase — both the exported const name and the table name string passed in must be PascalCase and match each other.

  ```ts
  // ❌ Bad
  export const communication_settings = mysqlTable(
    "communication_settings",
    // ...columns
  );

  // ❌ Bad — mismatched casing
  export const communicationSettings = mysqlTable(
    "CommunicationSettings",
    // ...columns
  );

  // ✅ Good
  export const CommunicationSettings = mysqlTable(
    "CommunicationSettings",
    // ...columns
  );
  ```

## Action DTO Types

- List/detail types returned by `actions.ts` functions must derive every field that maps to a database column from the table's `Select*` type — via indexed access (`SelectX["field"]`), `Pick`, or `Omit` — never hand-typed. This keeps them in sync with the schema automatically. Add `| null` for a left-joined column, and wrap in `NonNullable<...>` for a column the query coalesces to non-null.
- Only genuinely computed values — SQL aggregates (`SUM`/`COUNT`, e.g. `itemCount`, `subtotal`) or composed values (e.g. `companyName || fullName`) — may be plain types, since no single column backs them.

  ```ts
  // ❌ Bad — passthrough columns re-typed by hand
  export type OfferListItem = SelectOffers & {
    boqReference: string | null;
    customerName: string | null;
  };

  // ✅ Good — each column-backed field derived from its DB type
  export type OfferListItem = SelectOffers & {
    boqReference: SelectBoqs["reference"] | null; // left-joined
    customerName: SelectUsers["fullName"] | null;
  };

  // ✅ Good — aggregates stay plain; coalesced column uses NonNullable
  export type PartnerBoqListItem = SelectBoqs & {
    matchRank: NonNullable<SelectBoqPartners["matchRank"]>;
    dispatchedAt: SelectBoqPartners["createdAt"];
  };

  export type BoqListItem = SelectBoqs & {
    customerName: SelectUsers["fullName"] | null;
    itemCount: number; // SUM(...) — no single column backs it
    subtotal: number; // SUM(...)
  };
  ```
