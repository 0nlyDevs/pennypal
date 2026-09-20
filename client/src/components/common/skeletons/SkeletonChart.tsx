import { Skeleton } from "../../../ui";

const BAR_HEIGHTS = [40, 72, 56, 88, 62, 78, 48, 92, 58, 70];

export default function SkeletonChart({
  height = "h-[380px]",
  bars = 10,
  bare = false,
}: {
  height?: string;
  bars?: number;
  bare?: boolean;
}) {
  const body = (
    <>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-40 rounded-xl bg-gray-200/70 dark:bg-white/10" />
        <Skeleton className="h-10 w-24 rounded-xl bg-gray-200/70 dark:bg-white/10" />
      </div>
      <div className="flex flex-1 items-end gap-2 md:gap-3 pb-2 pt-6">
        {Array.from({ length: bars }).map((_, i) => (
          <div key={i} className="flex-1">
            <Skeleton
              className="w-full rounded-t-lg bg-gray-200/60 dark:bg-white/10"
              style={{ height: `${BAR_HEIGHTS[i % BAR_HEIGHTS.length]}%` }}
            />
          </div>
        ))}
      </div>
    </>
  );

  if (bare) {
    return (
      <div className={`flex ${height} w-full flex-col`} aria-hidden>
        {body}
      </div>
    );
  }

  return (
    <div
      className={`relative flex ${height} w-full flex-col bg-white/80 dark:bg-gradient-to-br dark:from-primary/20 dark:to-primary-dark/10 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/70 dark:border-white/5 p-6 overflow-hidden`}
      aria-hidden
    >
      {body}
    </div>
  );
}