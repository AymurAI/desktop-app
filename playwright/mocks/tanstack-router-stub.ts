/**
 * Stands in for `@tanstack/react-router` in the CT harness (aliased in
 * playwright-ct.config.ts). Only `ValidateDataset` imports the real package
 * directly among the components this plan mounts, and only to read a route
 * param and a no-op navigate callback - driving a real router would require
 * the full route tree plus the ReactQuery/APIProtected context the plan
 * deliberately avoids by mounting components instead of the app (see
 * RSP-02b in tasks/responsive/plan.md). Extend this stub if a later screen
 * spec mounts a component that imports more from the real package.
 *
 * `Link` (G1/T7): needed once `validate-dataset-fixture.tsx` started mounting
 * the real `Header`, which renders `HeaderLogoLink`'s `<Link to="/home/...">`.
 * A plain anchor is enough for layout/CT purposes - nothing here navigates.
 * Plain `.ts` (no JSX), so `createElement` instead of a `<a>` literal.
 *
 * `createLink` (G4/T4): needed once a `preview-fixture.tsx` started mounting
 * `FileSelectionLayout`, which imports `BackButton` (`components/ui/
 * back-button.tsx`) at module scope - and that module calls `createLink(...)`
 * at module scope too, so the import alone crashes without this export, even
 * for a consumer that never renders the resulting component. Like `Link`
 * above, this drops the routing behavior (`to`/`params` are stripped, not
 * resolved to an `href`) and just renders the wrapped component with
 * whatever's left - enough for layout/CT purposes, nothing here navigates.
 */
import {
  type AnchorHTMLAttributes,
  type ReactNode,
  createElement,
} from "react";

export function useNavigate() {
  return () => {};
}

export function useParams() {
  return { feature: "DATA_SET" };
}

export function Link({
  to: _to,
  children,
  ...rest
}: {
  to: string;
  children?: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return createElement("a", rest, children);
}

export function createLink<P extends Record<string, unknown>>(
  Component: (props: P) => ReactNode,
) {
  return function CreatedLink({
    to: _to,
    params: _params,
    ...rest
  }: P & { to?: string; params?: Record<string, unknown> }) {
    return createElement(Component, rest as P);
  };
}
