import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ContactsLoading = () => (
  <div className="space-y-6 p-6">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <Skeleton width={160} height={36} />
        <Skeleton width={220} height={20} />
      </div>
      <Skeleton width={120} height={32} borderRadius={8} />
    </div>

    <div className="space-y-4">
      <div className="flex justify-end">
        <Skeleton width={100} height={36} borderRadius={8} />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="grid grid-cols-[60px_1fr_100px_1fr_120px_80px] border-b px-4 py-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width="80%" height={16} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-[60px_1fr_100px_1fr_120px_80px] border-b px-4 py-3 last:border-0"
          >
            {Array.from({ length: 6 }).map((_, colIndex) => (
              <Skeleton key={colIndex} width="70%" height={16} />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default ContactsLoading;
