import api from "@/services/api";
import { Navigate } from "@tanstack/react-router";
import type { ComponentType } from "react";

export function withAPIProtection<P extends object>(
  Component: ComponentType<P>
) {
  return function ProtectedComponent(props: P) {
    if (!api.defaults.baseURL) return <Navigate to="/" />;
    return <Component {...props} />;
  };
}
