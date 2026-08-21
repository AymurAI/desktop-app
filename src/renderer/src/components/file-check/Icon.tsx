import { CheckCircle, XCircle } from "phosphor-react";

// `colors.errorPrimary` #DC582E -> `colors.system.error` (exact match);
// `colors.primary` #3F479D -> `colors.brand.primary` (exact match). `token()`
// resolves the literal hex at call time - phosphor-react's `color` prop
// needs a runtime string, not a class.
import { token } from "@/styled/tokens";
import Spinner from "../spinner";

interface Props {
  hasError: boolean;
  isLoading: boolean;
}
export default function Icon({ hasError, isLoading }: Props) {
  if (hasError)
    return <XCircle size={48} color={token("colors.system.error")} />;
  if (isLoading) return <Spinner />;
  return <CheckCircle size={48} color={token("colors.brand.primary")} />;
}
