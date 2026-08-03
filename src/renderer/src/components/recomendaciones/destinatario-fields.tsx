import { useTranslation } from "react-i18next";

import { RadioGroup } from "@/components/ui/radio-group";
import { SECTOR_OPTIONS } from "@/constants/recomendaciones/sectores";
import { Stack } from "@/styled/jsx";
import type {
  DestinatarioValue,
  OrganigramCandidate,
} from "@/types/recomendaciones";
import { Radio, Select, TextField } from "@aymurai/ui";
import { OrganigramPicker } from "./organigram-picker";

export interface DestinatarioFieldsProps {
  value: DestinatarioValue;
  /** Frozen inference for this same destinatario id, if any (a hand-added
   *  destinatario has none — see §X5/hook doc). */
  suggestion?: DestinatarioValue;
  /** May be undefined/empty — §X2: never index blindly. */
  candidates?: { nombre: OrganigramCandidate[]; cargo: OrganigramCandidate[] };
  onChange: <K extends keyof DestinatarioValue>(
    key: K,
    value: DestinatarioValue[K],
  ) => void;
  onFocusField: (field: string) => void;
}

/**
 * Editable fields for a single destinatario. `nombre` and `cargo` each get
 * their own INDEPENDENT organigram picker (§X4): picking a candidate for one
 * must never write into the other, since the backend ranks them separately
 * (a person may no longer hold the cargo the organigram lists for them).
 */
export function DestinatarioFields({
  value,
  suggestion,
  candidates,
  onChange,
  onFocusField,
}: DestinatarioFieldsProps) {
  const { t } = useTranslation("recomendaciones");

  return (
    <Stack gap="4">
      <Stack gap="2">
        <TextField
          label={t("validation.nombre")}
          value={value.nombre}
          suggestion={suggestion?.nombre}
          onChange={(event) => onChange("nombre", event.target.value)}
          onFocus={() => onFocusField(`destinatario:${value.id}:nombre`)}
        />
        {candidates?.nombre && candidates.nombre.length > 0 && (
          <OrganigramPicker
            field="nombre"
            candidates={candidates.nombre}
            onPick={(picked) => onChange("nombre", picked)}
          />
        )}
      </Stack>

      <Stack gap="2">
        <TextField
          label={t("validation.cargo")}
          value={value.cargo}
          suggestion={suggestion?.cargo}
          onChange={(event) => onChange("cargo", event.target.value)}
          onFocus={() => onFocusField(`destinatario:${value.id}:cargo`)}
        />
        {candidates?.cargo && candidates.cargo.length > 0 && (
          <OrganigramPicker
            field="cargo"
            candidates={candidates.cargo}
            onPick={(picked) => onChange("cargo", picked)}
          />
        )}
      </Stack>

      <RadioGroup
        label={t("validation.principal")}
        name={`principal-${value.id}`}
      >
        <Radio
          value="si"
          checked={value.destinatario_principal}
          onChange={() => onChange("destinatario_principal", true)}
        >
          {t("validation.principalSi")}
        </Radio>
        <Radio
          value="no"
          checked={!value.destinatario_principal}
          onChange={() => onChange("destinatario_principal", false)}
        >
          {t("validation.principalNo")}
        </Radio>
      </RadioGroup>

      <Select
        label={t("validation.sector")}
        options={SECTOR_OPTIONS}
        value={value.sector || undefined}
        suggestion={suggestion?.sector ? { id: suggestion.sector } : undefined}
        onChange={(option) => onChange("sector", option.id)}
      />
    </Stack>
  );
}

export default DestinatarioFields;
