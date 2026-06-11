import { PageHeading } from "@/components/layout/page-heading";

const DashboardPage = () => {
  return (
    <div>
      <PageHeading
        titleKey="dashboard-page.title"
        descriptionKey="dashboard-page.description"
        titleClassName="text-2xl font-semibold tracking-tight"
        descriptionClassName="mt-2 text-sm text-muted-foreground"
      />
    </div>
  );
};

export default DashboardPage;
