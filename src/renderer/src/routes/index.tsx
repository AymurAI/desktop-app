import Loading from "@/layout/loading";
import { isWebApp } from "@/utils/app-mode";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

const TIMING = 2000;
function RouteComponent() {
  const navigate = useNavigate();
  const target = isWebApp() ? "/home/features" : "/home";

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ to: target });
    }, TIMING);

    return () => clearTimeout(timer);
  }, [navigate, target]);

  return <Loading />;
}
