import { useTranslation } from "react-i18next";

import { RadioGroup } from "@/components/ui/radio-group";
import { SECTOR_OPTIONS } from "@/constants/recomendaciones/sectores";
import { Stack, styled } from "@/styled/jsx";
import type { DestinatarioValue } from "@/types/recomendaciones";
import { Radio, Select, TextField } from "@aymurai/ui";

export interface DestinatarioFieldsProps {
  value: DestinatarioValue;
  /** Frozen inference for this same destinatario id, if any (a hand-added
   *  destinatario has none — see §X5/hook doc). */
  suggestion?: DestinatarioValue;
  onChange: <K extends keyof DestinatarioValue>(
    key: K,
    value: DestinatarioValue[K],
  ) => void;
  onFocusField: (field: string) => void;
}

/**
 * Editable fields for a single destinatario: `nombre`, `cargo`,
 * `destinatario_principal` and `sector`. `sector` handles the out-of-list
 * case (§3.5): a value the model returned that isn't in `SECTOR_OPTIONS` is
 * never silently discarded — it's kept, injected as an extra option, and
 * flagged with an error message.
 */
export function DestinatarioFields({
  value,
  suggestion,
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
      </Stack>

      <Stack gap="2">
        <TextField
          label={t("validation.cargo")}
          value={value.cargo}
          suggestion={suggestion?.cargo}
          onChange={(event) => onChange("cargo", event.target.value)}
          onFocus={() => onFocusField(`destinatario:${value.id}:cargo`)}
        />
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
