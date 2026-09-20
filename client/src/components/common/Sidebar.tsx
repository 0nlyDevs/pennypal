import {
  LayoutDashboard,
  CreditCard,
  DollarSign,
  FolderTree,
  User,
  LogOut,
} from "lucide-react";
import { Link } from "react-router-dom";
import LogoutButton from "./LogoutButton";

const items = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Incomes", icon: DollarSign, href: "/incomes" },
  { label: "Expenses", icon: CreditCard, href: "/expenses" },
  { label: "Categories", icon: FolderTree, href: "/categories" },
  { label: "Profile", icon: User, href: "/profile" },
];

export default function Sidebar() {
  return (
    <>
      <div className="hidden lg:block fixed left-0 top-1/2 transform -translate-y-1/2 z-40">
        <div className="group/sidebar relative h-[70vh] max-h-[600px] w-16 hover:w-56 transition-all duration-300">
          <div className="absolute inset-0 rounded-tr-[4rem] rounded-br-[4rem] py-10 overflow-hidden bg-white/80 backdrop-blur-2xl border-r border-gray-200/70 transition-all duration-300 dark:bg-white/10 dark:border-white/10">
            <nav className="h-full px-2 py-4">
              <div className="flex h-full flex-col justify-between">
                <div className="flex flex-col gap-3">
                  {items.slice(0, 4).map(({ label, icon: Icon, href }) => (
                    <Link
                      key={label}
                      to={href}
                      className="
                        flex items-center gap-3 rounded-xl px-3 py-3
                        hover:bg-gray-900/3 focus:outline-none focus:ring-2 ring-primary/30
                        transition-colors text-gray-800
                        dark:text-white dark:hover:bg-white/5 dark:focus:ring-white/30
                      "
                      title={label}
                      aria-label={label}
                    >
                      <Icon className="size-5 shrink-0" aria-hidden />
                      <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        {label}
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  {items.slice(4).map(({ label, icon: Icon, href }) => (
                    <Link
                      key={label}
                      to={href}
                      className="
                        flex items-center gap-3 rounded-xl px-3 py-3
                        hover:bg-gray-900/5 focus:outline-none focus:ring-2 ring-primary/30
                        transition-colors text-gray-700
                        dark:text-white dark:hover:bg-white/15 dark:focus:ring-white/30
                      "
                      title={label}
                      aria-label={label}
                    >
                      <Icon className="size-5 shrink-0" aria-hidden />
                      <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        {label}
                      </span>
                    </Link>
                  ))}

                  <LogoutButton
                    size="large"
                    className="text-left w-full flex items-center !justify-start gap-3 
                      rounded-xl !p-3 hover:bg-gray-900/5 focus:outline-none focus:ring-2 
                      ring-primary/30 transition-colors text-gray-700 border-none font-normal
                      dark:text-white dark:hover:bg-white/15 dark:focus:ring-white/30"
                    startIcon={
                      <LogOut className="size-5 shrink-0" aria-hidden />
                    }
                  >
                    <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Logout
                    </span>
                  </LogoutButton>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
