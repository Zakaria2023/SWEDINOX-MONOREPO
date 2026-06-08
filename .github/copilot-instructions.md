# Copilot Workspace Instructions

## React

- Never use namespace-qualified React types like `React.ReactNode`, `React.FC`, `React.MouseEvent`, etc.  
  Always import the specific type directly from `react`.

  ```tsx
  // ❌ Bad
  const foo: React.ReactNode = null;
  const handler: React.MouseEventHandler = () => {};

  // ✅ Good
  import type { ReactNode, MouseEventHandler } from "react";
  const foo: ReactNode = null;
  const handler: MouseEventHandler = () => {};
  ```

## Components & Functions

- Never use named function declarations. Always use arrow functions.
- When a component or function returns a single expression, use the implicit arrow return — no curly braces, no `return` keyword.

  ```tsx
  // ❌ Bad
  function MyComponent() {
    return <div>Hello</div>;
  }

  // ❌ Also bad
  const MyComponent = () => {
    return <div>Hello</div>;
  };

  // ✅ Good
  const MyComponent = () => <div>Hello</div>;

  // ✅ Good (single-line)
  const MyComponent = () => <div>Hello</div>;
  ```

## Props

- Never define props inline. Always declare a named type above the component.

  ```tsx
  // ❌ Bad
  const Button = ({
    label,
    onClick,
  }: {
    label: string;
    onClick: () => void;
  }) => <button onClick={onClick}>{label}</button>;

  // ✅ Good
  type ButtonProps = {
    label: string;
    onClick: () => void;
  };

  const Button = ({ label, onClick }: ButtonProps) => (
    <button onClick={onClick}>{label}</button>
  );
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

## Tailwind CSS

- Never use arbitrary value syntax for spacing, sizing, or typography when a built-in Tailwind scale exists. Always prefer Tailwind's design tokens.

  ```tsx
  // ❌ Bad
  <p className="text-[22px] mt-[12px] w-[300px]" />

  // ✅ Good
  <p className="text-2xl mt-3 w-72" />
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

  ```ts
  // ❌ Bad
  const value = process.env.API_KEY!;

  // ✅ Good
  const value = process.env.API_KEY;
  if (!value) throw new Error("Missing required environment variable: API_KEY");
  ```

## Next.js Server Actions

- Always use Next.js Server Actions for data mutations and queries. Never create Next.js route handlers (route.ts files in the app directory).
- Server Actions should be defined in `actions.ts` files within feature directories.
- All Server Actions must have the `"use server"` directive at the top of the file.

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
