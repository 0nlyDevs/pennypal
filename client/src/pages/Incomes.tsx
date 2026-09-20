import { useNavigate } from "react-router-dom";
import { useToast } from "../ui";
import { IncomeService } from "../services/IncomeService";
import { useIncomes } from "../hooks/useIncomes";
import { useIncomeFilters } from "../hooks/useIncomeFilters";
import { useIncomeCharts } from "../hooks/useIncomeCharts";
import { useIncomeModals } from "../hooks/useIncomeModals";
import PageContainer from "../components/common/PageContainer";
import { motion } from "framer-motion";
import { Plus, Wallet, X, Download } from "lucide-react";
import type { Income } from "../types/Income";
import { useState, useMemo, useRef } from "react";
import {
  PdfExportService,
  Resolution,
  Margin,
} from "../services/PdfExportService";
import {
  DeleteConfirmationModal,
  ExportModal,
  IncomeChart,
  IncomeFilters,
  IncomeHeader,
  IncomeList,
  Receipt,
  ReceiptModal,
  ReceiptPdf,
} from "../components/income";
import { StatsCards } from "../components/income/IncomeHeader/StatsCards";
export const Incomes = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const { incomes: fetchedIncomes, loading, refetch } = useIncomes();

  const localIncomes = useMemo(() => fetchedIncomes || [], [fetchedIncomes]);
  const {
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    dateRange,
    dateError,
    handleStartDateChange,
    handleEndDateChange,
    clearDateFilter,
    filteredAndSortedIncomes,
    totalIncome,
    totalIncomeThisMonth,
  } = useIncomeFilters({ incomes: localIncomes });

  const { lineChartData } = useIncomeCharts({
    incomes: localIncomes,
  });

  const {
    deleteConfirmOpen,
    incomeToDelete,
    viewReceiptDialog,
    selectedIncome,
    handleDeleteClick,
    handleViewReceipt,
    closeDeleteModal,
    closeReceiptModal,
  } = useIncomeModals();

  const handleEdit = (income: Income) => {
    navigate(`/incomes/${income.income_id}/edit`);
  };

  const handleDeleteConfirm = async () => {
    if (!incomeToDelete) return;

    try {
      await IncomeService.deleteIncome(incomeToDelete.income_id.toString());
      toast.success("Income deleted successfully");
      closeDeleteModal();

      refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete income";
      toast.error(message);
    }
  };

  const handleNewIncome = () => {
    navigate("/incomes/new");
  };

  const [chartType, setChartType] = useState<"timeline" | "cumulative">(
    "timeline"
  );

  const pdfRef = useRef<HTMLDivElement>(null);
  const [filteredIncomesForPdf, setFilteredIncomesForPdf] = useState<Income[]>(
    []
  );
  const [filteredTotalAmount, setFilteredTotalAmount] = useState(0);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleCloseExportModal = () => {
    setIsExportModalOpen(false);
  };

  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
  };

  const filterIncomesByDate = (startDate?: string, endDate?: string) => {
    let filteredIncomes = localIncomes;

    if (startDate || endDate) {
      filteredIncomes = localIncomes.filter((income) => {
        const incomeDate = new Date(income.date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && end) {
          return incomeDate >= start && incomeDate <= end;
        } else if (start) {
          return incomeDate >= start;
        } else if (end) {
          return incomeDate <= end;
        }
        return true;
      });
    }

    const totalAmount = filteredIncomes.reduce(
      (sum, income) => sum + income.amount,
      0
    );

    setFilteredIncomesForPdf(filteredIncomes);
    setFilteredTotalAmount(totalAmount);

    return { filteredIncomes, totalAmount };
  };

  const handlePreviewPdf = (startDate?: string, endDate?: string) => {
    const { filteredIncomes } = filterIncomesByDate(startDate, endDate);

    if (filteredIncomes.length === 0) {
      toast.error("No receipts found for the selected date range");
      return;
    }

    setIsPreviewModalOpen(true);
  };

  const handleExportPdf = async (startDate?: string, endDate?: string) => {
    setIsExporting(true);

    try {
      const { filteredIncomes } = filterIncomesByDate(startDate, endDate);

      if (filteredIncomes.length === 0) {
        toast.error("No receipts found for export");
        return false;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      if (pdfRef.current) {
        await PdfExportService.generatePdf(pdfRef, {
          filename: PdfExportService.generateFilename(startDate, endDate),
          resolution: Resolution.LOW,
          margin: Margin.MEDIUM,
        });
        toast.success("PDF exported successfully!");
        return true;
      }
    } catch (error) {
      toast.error("Failed to export PDF. Please try again.");
      console.error("PDF export error:", error);
    } finally {
      setIsExporting(false);
    }
    return false;
  };

  return (
    <>
      <PageContainer
        maxWidth="7xl"
        className="text-gray-800 dark:text-light"
      >
        <IncomeHeader
          totalIncome={totalIncome}
          onNewIncome={handleNewIncome}
          onExport={handleExportPdf}
          incomes={localIncomes}
          onPreview={handlePreviewPdf}
        />

        <StatsCards
          totalIncomeThisMonth={totalIncomeThisMonth}
          totalIncome={totalIncome}
          incomeCount={localIncomes.length}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white/80 dark:bg-gradient-to-br dark:bg-transparent dark:from-primary-light/10 dark:to-primary-dark/10 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/70 dark:border-white/5 shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 dark:bg-accent/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/10 dark:bg-cyan-400/5 rounded-full translate-y-12 -translate-x-12"></div>

            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-light/90 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-accent" />
                Recent Incomes
              </h2>
            </div>

            <div className="flex gap-4 h-52 relative z-10">
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="size-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
                </div>
              ) : localIncomes.length === 0 ? (
                <div
                  onClick={handleNewIncome}
                  className="bg-gradient-to-br w-36 from-green-400/10 to-green-400/10 dark:from-accent/8 dark:to-amber-400/8 backdrop-blur-md rounded-xl p-4 border border-dashed border-green-700/50 hover:border-green-700/80 dark:border-accent/20 dark:hover:border-accent/30 transition-all duration-300 cursor-pointer flex items-center justify-center flex-col gap-2 group"
                >
                  <div className="w-10 h-10 rounded-full bg-green-800/10 group-hover:bg-green-800/15 dark:bg-accent/15 flex items-center justify-center dark:group-hover:bg-accent/20 transition-colors">
                    <Plus className="dark:text-accent text-green-700/50 w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="dark:text-accent/80 text-green-700/50 text-xs font-medium">
                    Add Income
                  </span>
                </div>
              ) : (
                <>
                  <div
                    onClick={handleNewIncome}
                    className="bg-gradient-to-br w-36 from-green-400/10 to-green-400/10 dark:from-accent/8 dark:to-amber-400/8 backdrop-blur-md rounded-xl p-4 border border-dashed border-green-700/50 hover:border-green-700/80 dark:border-accent/20 dark:hover:border-accent/30 transition-all duration-300 cursor-pointer flex items-center justify-center flex-col gap-2 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-800/10 group-hover:bg-green-800/15 dark:bg-accent/15 flex items-center justify-center dark:group-hover:bg-accent/20 transition-colors">
                      <Plus className="dark:text-accent text-green-700/50 w-5 h-5 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="dark:text-accent/80 text-green-700/50 text-xs font-medium">
                      Add Income
                    </span>
                  </div>
                  <Receipt
                    items={localIncomes.slice(0, 2)}
                    onViewReceipt={handleViewReceipt}
                  />
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/80 dark:bg-gradient-to-br dark:bg-transparent dark:from-primary-light/10 dark:to-primary-dark/10 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/70 dark:border-white/5 shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 dark:bg-purple-400/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/10 dark:bg-cyan-400/5 rounded-full translate-y-12 -translate-x-12"></div>

            <IncomeChart
              lineChartData={lineChartData}
              loading={loading}
              isEmpty={localIncomes.length === 0}
              chartType={chartType}
              onChartTypeChange={setChartType}
            />
          </motion.div>
        </div>

        <IncomeFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          dateRange={dateRange}
          dateError={dateError}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          onClearDateFilter={clearDateFilter}
        />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/30 dark:bg-gradient-to-br dark:bg-transparent dark:from-primary-light/10 dark:to-primary-dark/10 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/70 dark:border-white/5 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-16 translate-x-16 bg-cyan-400/10 dark:bg-cyan-400/5"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 dark:bg-accent/5 rounded-full translate-y-12 -translate-x-12"></div>

          <IncomeList
            incomes={filteredAndSortedIncomes}
            loading={loading}
            error={null}
            searchQuery={searchQuery}
            sortOrder={sortOrder}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onViewReceipt={handleViewReceipt}
            onRefetch={refetch}
          />
        </motion.div>
      </PageContainer>

      {/* hidden pdf template when exporting */}
      <div className="fixed -left-[10000px] top-0">
        <ReceiptPdf
          ref={pdfRef}
          incomes={filteredIncomesForPdf}
          totalAmount={filteredTotalAmount}
        />
      </div>

      {/* pdf preview */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[70vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-primary">
              <h2 className="text-xl text-primary font-semibold">
                PDF Preview
              </h2>
              <button
                onClick={handleClosePreviewModal}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-primary" />
              </button>
            </div>
            <div className="overflow-auto p-4 max-h-[calc(90vh-80px)]">
              <ReceiptPdf
                incomes={filteredIncomesForPdf}
                totalAmount={filteredTotalAmount}
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={handleClosePreviewModal}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  const success = await handleExportPdf();
                  if (success) {
                    handleClosePreviewModal();
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                disabled={isExporting}
              >
                {isExporting ? (
                  "Exporting..."
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ExportModal
        open={isExportModalOpen}
        onClose={handleCloseExportModal}
        onExport={handleExportPdf}
        onPreview={handlePreviewPdf}
        incomes={localIncomes}
      />

      <DeleteConfirmationModal
        open={deleteConfirmOpen}
        income={incomeToDelete}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
      />

      <ReceiptModal
        open={viewReceiptDialog}
        income={selectedIncome}
        onClose={closeReceiptModal}
      />
    </>
  );
};
