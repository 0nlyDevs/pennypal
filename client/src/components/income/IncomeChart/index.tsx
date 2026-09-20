import { BarChart3, TrendingUp } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";
import { LineChart, type LineChartData } from "./LineChart";
import SkeletonChart from "../../common/skeletons/SkeletonChart";

interface IncomeChartProps {
  lineChartData: LineChartData[];
  loading: boolean;
  isEmpty: boolean;
  chartType: "timeline" | "cumulative";
  onChartTypeChange: (type: "timeline" | "cumulative") => void;
}

export const IncomeChart = ({
  lineChartData,
  loading,
  isEmpty,
  chartType,
  onChartTypeChange,
}: IncomeChartProps) => {
  const { isDark } = useTheme();
  if (loading) {
    return <SkeletonChart bare height="h-52" bars={6} />;
  }

  if (isEmpty) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-light/50">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
          <BarChart3 className="w-6 h-6 text-gray-400 dark:text-light/50" />
        </div>
        <p className="text-sm">No data to visualize</p>
        <p className="text-xs mt-1">Add incomes to see charts</p>
      </div>
    );
  }

  const getChartData = () => {
    switch (chartType) {
      case "cumulative":
        return lineChartData;
      case "timeline":
      default:
        return lineChartData;
    }
  };

  const getDataKey = () => {
    switch (chartType) {
      case "cumulative":
        return "cumulativeAmount";
      case "timeline":
      default:
        return "amount";
    }
  };

  const getStrokeColor = () => {
    switch (chartType) {
      case "cumulative":
        return isDark ? "#ffdd33" : "#ffb300";
      case "timeline":
      default:
        return "#FF6B6B";
    }
  };

  const getChartTitle = () => {
    switch (chartType) {
      case "cumulative":
        return "Cumulative Income";
      case "timeline":
      default:
        return "Income Timeline";
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-light/90 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          {getChartTitle()}
        </h2>

        <div className="flex gap-2">
          <button
            onClick={() => onChartTypeChange("timeline")}
            className={`p-2 rounded-lg transition-all duration-300 ${
              chartType === "timeline"
                ? "bg-accent/20 text-accent shadow-md shadow-accent/10"
                : "bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-light/70"
            }`}
            title="Individual Income Timeline"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onChartTypeChange("cumulative")}
            className={`p-2 rounded-lg transition-all duration-300 ${
              chartType === "cumulative"
                ? "bg-amber-400/20 text-amber-400 shadow-md shadow-amber-400/10"
                : "bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-light/70"
            }`}
            title="Cumulative Income"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="h-52 relative z-10">
        <LineChart
          data={getChartData()}
          dataKey={getDataKey()}
          strokeColor={getStrokeColor()}
          chartType={chartType}
        />
      </div>

      <div className="mt-10 text-xs text-gray-500 dark:text-light/60 flex justify-center">
        {chartType === "timeline" && "Individual income entries over time"}
        {chartType === "cumulative" && "Cumulative income growth"}
      </div>
    </>
  );
};
