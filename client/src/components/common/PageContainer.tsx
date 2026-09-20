import type { HTMLAttributes, ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  maxWidth?: "2xl" | "6xl" | "7xl";
} & HTMLAttributes<HTMLDivElement>;

const WIDTHS = {
  "2xl": "max-w-2xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
} as const;

export default function PageContainer({
  children,
  maxWidth = "6xl",
  className = "",
  ...rest
}: PageContainerProps) {
  return (
    <div className="w-full px-4 lg:pl-25 lg:pr-10 mt-30 mb-10" {...rest}>
      <div
        className={`relative z-2 mx-auto w-full ${WIDTHS[maxWidth]} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}