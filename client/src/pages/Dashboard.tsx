import { useEffect, useMemo, useState } from "react";
import { Percent, ReceiptCent, Wallet } from "lucide-react";
import PieGraph from "../components/dashboard/PieGraph";
import { useIncomes } from "../hooks/useIncomes";
import { computeValueTotal } from "../utils/computeValueTotal";
import MiniStatCard from "../components/dashboard/DisplayCard";
import { useToast } from "../ui";
import {
  useLastSixthMonthSummary,
  useMonthlySummary,
  useSummaryAlert,
} from "../hooks/useSummary";
import SummaryAlert from "../components/dashboard/SummaryAlert";
import { useExpenses } from "../hooks/useExpenses";
import {
  computeEvolutionBetweenValues,
  computeSoldRatio,
} from "../utils/evolutionBetweenValues";
import MonthlyBarChart from "../components/dashboard/MonthlyBarchart";
import DateRangeFilter from "../components/dashboard/DateRangeFilter";
import ShowTipsButton from "../components/aiAdvice/ShowTipsButton";
import AIAdvice from "../components/aiAdvice/AIAdvice";
import { motion } from "framer-motion";

function Dashboard() {
  const { data: summaryAlert } = useSummaryAlert();
  const [alertOpen, setAlertOpen] = useState<boolean>(true);
  const { data: lastSixthMonthSummary } = useLastSixthMonthSummary();
  const now = new Date();
  const [showTips, setShowTips] = useState<boolean>(false);

  const defaultStartDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toLocaleDateString("fr-CA", {
    year: "numeric",
    day: "numeric",
    month: "numeric",
  });

  const defaultEndDate = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).toLocaleDateString("fr-CA", {
    year: "numeric",
    day: "numeric",
    month: "numeric",
  });

  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [filterWasUsed, setFilterWasUsed] = useState<boolean>(false);

  /* Expense and incomes */
  const { incomes, loading, error } = useIncomes(startDate, endDate);
  const { expenses, loading: expensesLoading } = useExpenses(
    startDate,
    endDate
  );

  /* Last month stat for the comparison */
  const { data: lastMonthSummary } = useMonthlySummary(
    new Date(new Date().getFullYear(), new Date().getMonth())
      .toISOString()
      .slice(0, 7)
  );
  const { data: thisMonthSummary } = useMonthlySummary(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1)
      .toISOString()
      .slice(0, 7)
  );

  const toast = useToast();

  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [sold, setSold] = useState<number>(0);

  const toDisplay = useMemo(
    () => [
      {
        label: "Income",
        value: totalIncome,
        icon: Wallet,
        deltaPct:
          computeEvolutionBetweenValues(
            lastMonthSummary?.totalIncome ?? 0,
            thisMonthSummary?.totalIncome ?? 0
          ) ?? 0,
        href: "/incomes/new",
      },
      {
        label: "Expense",
        value: totalExpense,
        icon: ReceiptCent,
        deltaPct:
          computeEvolutionBetweenValues(
            lastMonthSummary?.totalExpense ?? 0,
            thisMonthSummary?.totalExpense ?? 0
          ) ?? 0,
        customDeltaColor:
          computeEvolutionBetweenValues(
            lastMonthSummary?.totalExpense ?? 0,
            thisMonthSummary?.totalExpense ?? 0
          )! >= 0
            ? "text-rose-400"
            : null,
        customBgColor:
          computeEvolutionBetweenValues(
            lastMonthSummary?.totalExpense ?? 0,
            thisMonthSummary?.totalExpense ?? 0
          )! >= 0
            ? "bg-rose-500/20"
            : null,
        href: "/expenses/new",
      },
    ],
    [
      lastMonthSummary?.totalExpense,
      lastMonthSummary?.totalIncome,
      thisMonthSummary?.totalExpense,
      thisMonthSummary?.totalIncome,
      totalExpense,
      totalIncome,
    ]
  );

  const soldToDisplay = useMemo(
    () => ({
      label: "Sold",
      value: sold,
      icon: Percent,
      deltaPct:
        computeSoldRatio(
          lastMonthSummary?.netBalance ?? 0,
          thisMonthSummary?.netBalance ?? 0
        ) ?? 0,
    }),
    [lastMonthSummary?.netBalance, sold, thisMonthSummary?.netBalance]
  );

  /* Totals */
  useEffect(() => {
    if (!loading && incomes && !expensesLoading && expenses) {
      const incomeTotal = computeValueTotal(incomes);
      const expenseTotal =
        expensesLoading || !expenses ? 0 : computeValueTotal(expenses);
      setTotalIncome(incomeTotal);
      setTotalExpense(expenseTotal);
      setSold(incomeTotal - expenseTotal);
    }
  }, [loading, incomes, expenses, expensesLoading]);

  if (error) {
    toast.error("Failed to load incomes: " + error, {
      autoHideDuration: 2,
    });
  }

  /* Event Handler */

  // const resetFilter = () => {
  //   setStartDate(
  //     new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString(
  //       "fr-CA",
  //       {
  //         year: "numeric",
  //         day: "numeric",
  //         month: "numeric",
  //       }
  //     )
  //   );
  //   setEndDate(
  //     new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString(
  //       "fr-CA",
  //       {
  //         year: "numeric",
  //         day: "numeric",
  //         month: "numeric",
  //       }
  //     )
  //   );
  //   setFilterWasUsed(false);
  // };

  /* Event Handler */
  const handleDateRangeChange = (newStartDate: string, newEndDate: string) => {
    const isDefault =
      newStartDate === defaultStartDate && newEndDate === defaultEndDate;

    setFilterWasUsed(!isDefault); //false if default, true otherwise
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const handleDateRangeReset = () => {
    setFilterWasUsed(false);
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{opacity:1, scale:1}}
      // whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-7xl px-6 mt-30 mb-10 flex flex-col items-center gap-10 md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
    >
      {summaryAlert.alert && (
        <SummaryAlert
          alert={summaryAlert.alert}
          message={summaryAlert.message}
          open={alertOpen}
          setIsOpen={setAlertOpen}
        />
      )}
      <ShowTipsButton open={showTips} setOpen={setShowTips} />
      <AIAdvice open={showTips} setOpen={setShowTips} />

      <div className="col-span-3 flex flex-col w-full px-5 gap-5">
        {/* FILTER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center text-foreground justify-between"
        >
          <div className="flex gap-5 items-center">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateRangeChange}
              onReset={handleDateRangeReset}
            />
          </div>
        </motion.div>
        {/* CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {toDisplay.map((item, idx) => (
            <MiniStatCard key={idx} {...item} filterWasUsed={filterWasUsed} />
          ))}
          <MiniStatCard
            key={"sold"}
            {...soldToDisplay}
            filterWasUsed={filterWasUsed}
          />
        </motion.div>

        {/* BARCHART */}
        <MonthlyBarChart data={lastSixthMonthSummary} />
      </div>
      {/* PIE */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="lg:col-span-1 flex flex-col md:h-[80%] items-center gap-4 w-full 
            bg-white/80 
            dark:bg-transparent dark:bg-gradient-to-br dark:from-primary/20 dark:to-primary-dark/10
            backdrop-blur-xl
            py-2 px-2 pr-5 rounded-lg border border-gray-200/70 dark:border-white/5 shadow-lg"
      >
        <PieGraph title={"Expense Overview"} data={expenses} />
      </motion.div>
    </motion.div>
  );
}

export default Dashboard;
