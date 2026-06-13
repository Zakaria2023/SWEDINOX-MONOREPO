import { Skeleton } from "@/components/shadcn/skeleton";
import { cn } from "@/lib/helpers";

type DataTableFallbackProps = {
  columnCount: number;
  rowCount?: number;
  toolbarWidthClassName?: string;
};

const WIDTH_CLASSES = ["w-1/2", "w-2/3", "w-3/4", "w-5/6"];

export const DataTableFallback = ({
  columnCount,
  rowCount = 8,
  toolbarWidthClassName = "w-24",
}: DataTableFallbackProps) => {
  const gridTemplateColumns = `repeat(${columnCount}, minmax(6rem, 1fr))`;
  const minWidth = `${Math.max(columnCount * 6, 24)}rem`;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Skeleton className={cn("h-9 rounded-md", toolbarWidthClassName)} />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <div style={{ gridTemplateColumns, minWidth }}>
          <div className="grid gap-4 border-b px-4 py-3" style={{ gridTemplateColumns }}>
            {Array.from({ length: columnCount }).map((_, index) => (
              <Skeleton
                key={`header-${index}`}
                className={cn("h-4", WIDTH_CLASSES[index % WIDTH_CLASSES.length])}
              />
            ))}
          </div>

          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="grid gap-4 border-b px-4 py-3 last:border-0"
              style={{ gridTemplateColumns }}
            >
              {Array.from({ length: columnCount }).map((_, columnIndex) => (
                <Skeleton
                  key={`cell-${rowIndex}-${columnIndex}`}
                  className={cn(
                    "h-4",
                    WIDTH_CLASSES[(rowIndex + columnIndex) % WIDTH_CLASSES.length],
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
