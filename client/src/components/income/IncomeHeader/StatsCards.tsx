import { Calendar, Wallet, Target, TrendingUp, Plus } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import SkeletonStatCard from "../../common/skeletons/SkeletonStatCard";

interface StatsCardsProps {
  totalIncome: number;
  incomeCount: number;
  totalIncomeThisMonth: number;
  loading?: boolean;
}

export const StatsCards = ({
  totalIncome,
  incomeCount,
  totalIncomeThisMonth,
  loading,
}: StatsCardsProps) => {
  const averageIncome = incomeCount > 0 ? totalIncome / incomeCount : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5}}
        className="bg-white/80 dark:bg-gradient-to-br dark:bg-transparent dark:from-primary-light/10 dark:to-primary-dark/10 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/70 dark:border-white/5 shadow-lg hover:shadow-accent/5 transition-all duration-300 transform-gpu hover:scale-[1.02]"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-dark/80 dark:text-light/60 text-sm">
              This Month
            </p>
            <p className="text-2xl font-bold text-primary-dark dark:text-light/90 mt-1 transition-all duration-300">
              <CountUp
                end={totalIncomeThisMonth}
                duration={1.5}
                formattingFn={formatCurrency}
                decimals={totalIncomeThisMonth % 1 !== 0 ? 2 : 0}
              />
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center transition-all duration-500 group-hover:scale-110">
            <Calendar className="w-6 h-6 text-accent transition-transform duration-300" />
          </div>
        </div>
        <div className="flex items-center mt-3">
          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-1 transition-transform duration-300" />
          <span className="text-green-700 dark:text-green-400 text-sm">
            Current month's total earnings
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5}}
        className="bg-white/80 dark:bg-gradient-to-br dark:bg-transparent dark:from-primary-light/10 dark:to-primary-dark/10 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/70 dark:border-white/5 shadow-lg hover:shadow-cyan-400/5 transition-all duration-300 transform-gpu hover:scale-[1.02]"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-dark/80 dark:text-light/60 text-sm">
              Total Records
            </p>
            <p className="text-2xl font-bold text-primary-dark dark:text-light/90 mt-1 transition-all duration-300">
              <CountUp end={incomeCount} duration={1.5} decimals={0} />
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-400/10 flex items-center justify-center transition-all duration-500 group-hover:scale-110">
            <Wallet className="w-6 h-6 text-cyan-600 dark:text-cyan-400 transition-transform duration-300" />
          </div>
        </div>
        <div className="flex items-center mt-3">
          <Plus className="w-4 h-4 text-cyan-600 dark:text-cyan-400 mr-1 transition-transform duration-300" />
          <span className="text-cyan-700 dark:text-cyan-400 text-sm">
            All-time income entries
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5}}
        className="bg-white/80 dark:bg-gradient-to-br dark:bg-transparent dark:from-primary-light/10 dark:to-primary-dark/10 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/70 dark:border-white/5 shadow-lg hover:shadow-purple-400/5 transition-all duration-300 transform-gpu hover:scale-[1.02]"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-dark/80 dark:text-light/60 text-sm">
              Avg. Income
            </p>
            <p className="text-2xl font-bold text-primary-dark dark:text-light/90 mt-1 transition-all duration-300">
              <CountUp
                end={averageIncome}
                duration={1.5}
                formattingFn={formatCurrency}
                decimals={averageIncome % 1 !== 0 ? 2 : 0}
              />
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-400/10 flex items-center justify-center transition-all duration-500 group-hover:scale-110">
            <Target className="w-6 h-6 text-purple-600 dark:text-purple-400 transition-transform duration-300" />
          </div>
        </div>
        <div className="flex items-center mt-3">
          <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-1 transition-transform duration-300" />
          <span className="text-purple-700 dark:text-purple-400 text-sm">
            Per transaction average
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};
