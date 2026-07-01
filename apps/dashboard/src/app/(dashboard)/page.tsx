import { PageHeading } from "@/components/layout/page-heading";

const DashboardPage = () => (
  <div>
    <PageHeading
      title="Dashboard"
      description="Welcome to the Swedinox dashboard."
      titleClassName="text-2xl font-semibold tracking-tight"
      descriptionClassName="mt-2 text-sm text-muted-foreground"
    />
  </div>
);

export default DashboardPage;
