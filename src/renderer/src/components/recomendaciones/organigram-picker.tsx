import { useTranslation } from "react-i18next";

import type { OrganigramCandidate } from "@/types/recomendaciones";
import { Select } from "@aymurai/ui";

interface OrganigramPickerProps {
  /** Which text the candidate contributes to the picker's option list. */
  field: "nombre" | "cargo";
  candidates: OrganigramCandidate[];
  /** Writes the picked candidate's text into the sibling TextField. This is
   *  an action selector, not a state selector: it never reflects back a
   *  "current" value, so the control resets to empty after each pick. */
  onPick: (value: string) => void;
}

/**
 * Organigram candidate picker for a single destinatario field (`nombre` or
 * `cargo`). Renders nothing when there are no candidates (§X2: a candidate
 * list can legitimately be empty — a stored validation with no prediction,
 * or a destinatario the user added by hand).
 *
 * `score` is intentionally never read here (§X1): its scale depends on which
 * backend search mode produced it, so only the array's order — best first —
 * is meaningful.
 */
export function OrganigramPicker({
  field,
  candidates,
  onPick,
}: OrganigramPickerProps) {
  const { t } = useTranslation("recomendaciones");

  if (candidates.length === 0) return null;

  return (
    <Select
      label={t("validation.organigramCandidates")}
      options={candidates.map((candidate) => ({
        id: field === "nombre" ? candidate.nombre : candidate.cargo,
        text: field === "nombre" ? candidate.nombre : candidate.cargo,
        description: candidate.ruta_cargos,
      }))}
      value={undefined}
      clearable={false}
      size="sm"
      onChange={(option) => onPick(option.id)}
    />
  );
}
