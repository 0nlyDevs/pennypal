import { Skeleton } from "../../../ui";

export default function SkeletonStatCard() {
  return (
    <div className="relative bg-white/80 dark:bg-transparent dark:bg-gradient-to-br dark:from-primary/20 dark:to-primary-dark/10 backdrop-blur-xl rounded-2xl py-4 px-5 shadow-lg flex flex-col gap-3 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="size-12 rounded-xl bg-gray-200/70 dark:bg-white/10" />
          <Skeleton variant="text" className="w-24 bg-gray-200/70 dark:bg-white/10" />
        </div>
        <Skeleton className="size-8 rounded-lg bg-gray-200/70 dark:bg-white/10" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-32 h-6 bg-gray-200/70 dark:bg-white/10" />
        <Skeleton className="w-20 h-7 rounded-full bg-gray-200/70 dark:bg-white/10" />
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200/40 dark:bg-white/5" />
    </div>
  );
}