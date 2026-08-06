import { getComplaints } from "@/app/(dashboard)/complaints/actions";
import { complaintFilters } from "@/app/(dashboard)/complaints/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { TableQuery } from "@/lib/table-query";
import { ComplaintsTableContent } from "./complaints-table-content";

type Props = {
  query: TableQuery;
};

export const ComplaintsTable = async ({ query }: Props) => {
  // Sequential rather than concurrent: this database caps connections.
  const complaints = await getComplaints(query);
  const companies = await getCompaniesForSelect();
  const products = await getProductsForSelect();

  return (
    <ComplaintsTableContent
      page={complaints}
      filters={complaintFilters(companies, products)}
    />
  );
};
