import { Skeleton } from "../../../ui";

export default function SkeletonTableRows({
  rows = 5,
  bare = false,
}: {
  rows?: number;
  bare?: boolean;
}) {
  const list = (
    <ul className="divide-y divide-gray-200 dark:divide-white/10 overflow-hidden p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-3">
            <div className="md:col-span-4">
              <Skeleton variant="text" className="w-1/2 bg-gray-200/70 dark:bg-white/10" />
            </div>
            <div className="md:col-span-5">
              <Skeleton variant="text" className="w-3/4 bg-gray-200/60 dark:bg-white/5" />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Skeleton className="h-8 w-24 rounded-md bg-gray-200/70 dark:bg-white/10" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );

  if (bare) {
    return list;
  }

  return (
    <div className="rounded-2xl bg-white/25 dark:bg-gradient-to-br dark:from-primary-light/10 dark:to-primary-dark/10 backdrop-blur-xl border border-gray-200/70 dark:border-white/5 shadow-lg overflow-hidden">
      {list}
    </div>
  );
}