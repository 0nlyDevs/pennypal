import type { HTMLAttributes, ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  maxWidth?: "6xl" | "7xl" | "screen";
} & HTMLAttributes<HTMLDivElement>;

const WIDTHS = {
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  screen: "max-w-screen",
} as const;

export default function PageContainer({
  children,
  maxWidth = "6xl",
  className = "",
  ...rest
}: PageContainerProps) {
  return (
    <div
      className={`relative z-2 mx-auto w-full ${WIDTHS[maxWidth]} px-6 mt-30 mb-10 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}