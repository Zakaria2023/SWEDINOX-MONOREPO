import { SignIn } from "@clerk/nextjs";

const SignInPage = () => (
  <main
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#ffffff",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        width: "100%",
        maxWidth: "420px",
        padding: "0 16px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            backgroundColor: "#111827",
            marginBottom: "14px",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "700",
            color: "#111827",
            margin: "0 0 4px",
            letterSpacing: "-0.4px",
          }}
        >
          Swedinox
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
          Welcome back — sign in to continue
        </p>
      </div>

      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#111827",
            colorBackground: "#ffffff",
            colorText: "#111827",
            colorTextSecondary: "#6b7280",
            colorInputBackground: "#f9fafb",
            colorInputText: "#111827",
            borderRadius: "10px",
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            fontSize: "14px",
          },
          elements: {
            card: {
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              boxShadow:
                "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
              padding: "32px",
              width: "100%",
            },
            headerTitle: {
              color: "#111827",
              fontSize: "18px",
              fontWeight: "600",
            },
            headerSubtitle: {
              color: "#6b7280",
              fontSize: "13px",
            },
            formFieldLabel: {
              color: "#374151",
              fontSize: "13px",
              fontWeight: "500",
            },
            formFieldInput: {
              backgroundColor: "#f9fafb",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              color: "#111827",
              fontSize: "14px",
              padding: "10px 12px",
              outline: "none",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            },
            formButtonPrimary: {
              backgroundColor: "#111827",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              padding: "11px",
              color: "#ffffff",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            },
            socialButtonsRoot: { display: "none" },
            socialButtonsBlockButton: { display: "none" },
            dividerRow: { display: "none" },
            footerAction: { display: "none" },
            footer: { display: "none" },
            formFieldSuccessText: { color: "#16a34a" },
            formFieldErrorText: { color: "#dc2626" },
            alertText: { color: "#dc2626" },
          },
        }}
      />
    </div>
  </main>
);

export default SignInPage;
