import { getWorkLists } from "@/app/(dashboard)/tasks/actions";
import { WorkListGrid } from "@/components/tasks/work-list-grid";

const TasksPage = async () => {
  const rows = await getWorkLists();

  return (
    <div className="space-y-4">
      <WorkListGrid rows={rows} />
    </div>
  );
};

export default TasksPage;
