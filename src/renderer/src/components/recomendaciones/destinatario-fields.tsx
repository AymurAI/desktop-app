import { useTranslation } from "react-i18next";

import { RadioGroup } from "@/components/ui/radio-group";
import { SECTOR_OPTIONS } from "@/constants/recomendaciones/sectores";
import { Stack, styled } from "@/styled/jsx";
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

  // §3.5, mirroring the `tema`/`subtema` treatment in `recomendacion-form.tsx`:
  // a `sector` the model returned that isn't in `SECTOR_OPTIONS` is never
  // silently discarded (it would render as an empty Select while still being
  // exported to the .xlsx) — it's kept, injected as an extra option, and
  // flagged with an error message.
  const sectorInList =
    value.sector === "" ||
    SECTOR_OPTIONS.some((option) => option.id === value.sector);
  const sectorOptions = sectorInList
    ? SECTOR_OPTIONS
    : [...SECTOR_OPTIONS, { id: value.sector, text: value.sector }];

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

      <Stack gap="1">
        <Select
          label={t("validation.sector")}
          options={sectorOptions}
          value={value.sector || undefined}
          suggestion={
            suggestion?.sector ? { id: suggestion.sector } : undefined
          }
          onChange={(option) => onChange("sector", option.id)}
        />
        {/* `Select` (@aymurai/ui) has no `error` prop, unlike `TextField` —
            render the out-of-list notice as its own text. */}
        {!sectorInList && (
          <styled.p textStyle="label.sm.default" color="system.error">
            {t("validation.sectorOutOfList")}
          </styled.p>
        )}
      </Stack>
    </Stack>
  );
}
