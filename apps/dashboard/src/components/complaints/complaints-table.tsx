import { getComplaints } from "@/app/(dashboard)/complaints/actions";
import { ComplaintsTableContent } from "./complaints-table-content";

export const ComplaintsTable = async () => {
  const complaints = await getComplaints();
  return <ComplaintsTableContent complaints={complaints} />;
};
