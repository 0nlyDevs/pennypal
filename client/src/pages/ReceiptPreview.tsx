import { useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { useExpenseById } from "../hooks/useExpenseById";
import { useParams } from "react-router-dom";
import { formatDate } from "../utils/formatters";

function filenameFromUrl(u: string) {
  return u.split("/")[u.split("/").length - 1];
}

export default function ReceiptPreviewMock() {
  const { expenseId } = useParams();

  const { data, loading, error } = useExpenseById(expenseId!);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch(data!.receipt_url!, { mode: "cors" });
      const blob = await res.blob();
      const objectURL = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectURL;
      a.download = filenameFromUrl(data!.receipt_url!);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectURL);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };
  const isImage = useMemo(() => data?.receipt_mime?.includes("image"), [data]);
  const isPdf = useMemo(() => data?.receipt_mime?.includes("pdf"), [data]);
  if (loading || data == null || !data) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin" size={43} />
        <p>Loading your preview</p>
      </div>
    );
  }

  if (data && !data!.receipt_url && !loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600 dark:text-white/70">
          No receipt for this expense{" "}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center">
        <TriangleAlert size={42} />
        Error trying to preview your receipt
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 mt-20 sm:p-6 flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-r from-indigo-500/10 via-fuchsia-500/10 to-emerald-500/10 p-[1px] dark:border-white/10">
        <div className="rounded-lg bg-white/70 p-5 backdrop-blur-xl dark:bg-zinc-900/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">
                Receipt — Expense #{data.expense_id}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                {[
                  data.category?.category_name,
                  formatDate(data!.date!),
                  data!.receipt_mime!.split("/")[1],
                ].map((item) => (
                  <span className="rounded-full bg-zinc-900/5 px-2.5 py-1 text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                    {item}
                  </span>
                ))}
              </div>
              {data.description && (
                <p className="mt-3 line-clamp-2 max-w-3xl text-sm text-zinc-700 dark:text-zinc-300">
                  {data.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-white/90"
              >
                <Download size={16} />
                {isDownloading ? "Downloading…" : "Download"}
              </button>
              <a
                href={data!.receipt_url!}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-white/10"
                title="Open in a new tab"
              >
                <ExternalLink size={16} />
                Open
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-black/20">
        <div className="relative">
          {isPdf && (
            <div className="relative">
              <iframe
                src={`${data!
                  .receipt_url!}#zoom=page-width&toolbar=1&navpanes=0`}
                title="PDF preview"
                className="h-screen w-full rounded-xl border border-black/5 dark:border-white/10"
                loading="lazy"
              />
              <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-md bg-black/30 px-2 py-1 text-xs text-white backdrop-blur-md">
                <FileText size={14} /> PDF preview
              </div>
            </div>
          )}

          {isImage && (
            <div className="relative h-[78vh] w-full overflow-hidden rounded-xl border border-black/5 bg-black/5 dark:border-white/10 dark:bg-white/5">
              <img
                src={data!.receipt_url!}
                alt={filenameFromUrl(data!.receipt_url!)}
                className="h-full w-full object-contain"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-md bg-black/30 px-2 py-1 text-xs text-white backdrop-blur-md">
                <ImageIcon size={14} /> Image preview
              </div>
            </div>
          )}

          {!isPdf && !isImage && (
            <div className="grid h-[40vh] place-items-center rounded-xl border border-dashed border-black/20 p-6 text-center text-sm text-gray-600 dark:border-white/20 dark:text-white/70">
              <div>
                <p className="mb-2 font-medium">Error trying to preview your receipt</p>
                <p className="mb-4 break-all">
                  {filenameFromUrl(data!.receipt_url!)}
                </p>
                <a
                  href={data!.receipt_url!}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-100 dark:border-white/20 dark:hover:bg-white/10"
                >
                  Open in a new tab
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
