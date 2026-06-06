import { SignIn } from "@clerk/nextjs";

const SignInPage = () => (
  <main className="flex min-h-screen items-center justify-center">
    <SignIn
      appearance={{
        elements: {
          socialButtonsRoot: { display: "none" },
          socialButtonsBlockButton: { display: "none" },
          dividerRow: { display: "none" },
          footerAction: { display: "none" },
          footer: { display: "none" },
        },
      }}
    />
  </main>
);

export default SignInPage;
