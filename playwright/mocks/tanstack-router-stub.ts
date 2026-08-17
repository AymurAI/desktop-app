/**
 * Stands in for `@tanstack/react-router` in the CT harness (aliased in
 * playwright-ct.config.ts). Only `ValidateDataset` imports the real package
 * directly among the components this plan mounts, and only to read a route
 * param and a no-op navigate callback - driving a real router would require
 * the full route tree plus the ReactQuery/APIProtected context the plan
 * deliberately avoids by mounting components instead of the app (see
 * RSP-02b in tasks/responsive/plan.md). Extend this stub if a later screen
 * spec mounts a component that imports more from the real package.
 */
export function useNavigate() {
  return () => {};
}

export function useParams() {
  return { feature: "DATA_SET" };
}
