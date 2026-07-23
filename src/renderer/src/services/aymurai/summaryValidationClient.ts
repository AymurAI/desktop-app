import { noopSummaryValidationClient } from "./noopSummaryValidation";
import type { SummaryValidationClient } from "./summaryValidation";

// Single switch point: swap this one line for `backendSummaryValidationClient`
// once `/summary/validation/document/:id` exists server-side. No other file
// in this codebase should import summaryValidation.ts's implementations
// directly — always go through this module.
export const summaryValidationClient: SummaryValidationClient =
  noopSummaryValidationClient;

export type {
  SummaryValidation,
  SummaryValidationClient,
} from "./summaryValidation";
