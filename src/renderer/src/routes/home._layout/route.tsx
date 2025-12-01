import LoginLayout from "@/layout/login";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/home/_layout")({
  component: RouteComponent,
});

function RouteComponent() {
  return <LoginLayout />;
}
