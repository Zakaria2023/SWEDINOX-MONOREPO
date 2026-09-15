import { getWorkLists } from "@/app/(dashboard)/tasks/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { WorkListGrid } from "@/components/tasks/work-list-grid";

const TasksPage = async () => {
  const rows = await getWorkLists();

  return (
    <div className="space-y-4">
      <PageHeading title="Tasks" />
      <WorkListGrid rows={rows} />
    </div>
  );
};

export default TasksPage;
