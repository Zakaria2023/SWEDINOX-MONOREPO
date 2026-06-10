import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const AddressesLoading = () => (
  <div className="space-y-6 p-6">
    <div className="space-y-2">
      <Skeleton width={160} height={36} />
      <Skeleton width={240} height={20} />
    </div>

    <div className="space-y-4">
      <div className="flex justify-end">
        <Skeleton width={100} height={36} borderRadius={8} />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="grid grid-cols-[80px_120px_1fr_1fr_120px_100px_100px_80px] border-b px-4 py-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} width="75%" height={16} />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-[80px_120px_1fr_1fr_120px_100px_100px_80px] border-b px-4 py-3 last:border-0"
          >
            {Array.from({ length: 8 }).map((_, colIndex) => (
              <Skeleton key={colIndex} width="65%" height={16} />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AddressesLoading;
