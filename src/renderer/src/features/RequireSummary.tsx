import { useSummary } from "@/context/Summary";
import { Navigate, useParams } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function RequireSummary({ children }: Props) {
  const summary = useSummary();
  const { feature } = useParams({ from: "/app/$feature" });

  if (summary.status !== "completed" || !summary.document) {
    return <Navigate to="/app/$feature/process" params={{ feature }} />;
  }

  return children;
}
