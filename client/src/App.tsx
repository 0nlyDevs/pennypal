import { lazy, Suspense } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ToastProvider } from "./ui";
import Sidebar from "./components/common/Sidebar";
import BackgroundImage from "./components/common/BackgroundImage";
import Mascot from "./components/common/Mascot";
import RequireAuth from "./components/common/RequireAuth";
import PostAuthGate from "./components/auth/PostAuthGate";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "./components/common/Header";
import RouteFallback from "./components/common/RouteFallback";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Categories = lazy(() => import("./pages/Categories"));
const ReceiptPreview = lazy(() => import("./pages/ReceiptPreview"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Incomes = lazy(() =>
  import("./pages/Incomes").then((m) => ({ default: m.Incomes }))
);
const CreateIncome = lazy(() =>
  import("./pages/CreateIncome").then((m) => ({ default: m.CreateIncome }))
);
const EditIncome = lazy(() =>
  import("./pages/EditIncome").then((m) => ({ default: m.EditIncome }))
);
const CreateExpense = lazy(() =>
  import("./pages/CreateExpense").then((m) => ({ default: m.CreateExpense }))
);
const EditExpense = lazy(() =>
  import("./pages/EditExpense").then((m) => ({ default: m.EditExpense }))
);
const Profile = lazy(() =>
  import("./pages/Profile").then((m) => ({ default: m.Profile }))
);

function App() {
  const location = useLocation();
  return (
    <ThemeProvider>
      <ToastProvider
        max={2}
        dense={false}
        pauseOnHover={true}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <div className="App min-h-screen relative overflow-x-hidden">
          {location.pathname.includes("/login") ||
          location.pathname.includes("/signup") ? null : (
            <>
              <BackgroundImage />
              <Header />
              <Sidebar />
            </>
          )}
          {location.pathname.includes("/login") ||
          location.pathname.includes("/signup") ? null : (
            <Mascot className="z-50" />
          )}
          {!(
            location.pathname.includes("/login") ||
            location.pathname.includes("/signup")
          ) && <PostAuthGate />}
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Protected routes */}
              <Route element={<RequireAuth />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/expenses/new" element={<CreateExpense />} />
                <Route path="/expenses/:id/edit" element={<EditExpense />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/receipts/:expenseId" element={<ReceiptPreview />} />
                <Route path="/incomes" element={<Incomes />} />
                <Route path="/incomes/new" element={<CreateIncome />} />
                <Route path="/incomes/:id/edit" element={<EditIncome />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;