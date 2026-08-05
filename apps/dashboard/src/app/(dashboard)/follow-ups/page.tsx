import { getFollowUps } from "@/app/(dashboard)/follow-ups/actions";
import { FollowUpsTable } from "@/components/follow-ups/follow-ups-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const FollowUpsPage = async () => {
  const followUps = await getFollowUps();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Follow-ups" />
      <FollowUpsTable followUps={followUps} />
    </div>
  );
};

export default FollowUpsPage;
