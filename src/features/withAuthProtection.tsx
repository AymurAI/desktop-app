import { useUser } from "@/hooks";
import type { ComponentType } from "react";
import { Navigate } from "react-router-dom";

/**
 * High order component that adds auth protection / private routes to a component
 * @param Component
 * @returns
 */
export default function withAuthProtection<T extends JSX.IntrinsicAttributes>(
  Component: ComponentType<T>,
) {
  return (props: T) => {
    const user = useUser();

    // Check if the user is authenticated
    if (!user) return <Navigate to="/login" />;

    return <Component {...props} />;
  };
}
