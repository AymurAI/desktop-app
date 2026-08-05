import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import DecisionTabs from "@/components/decision-tabs";
import { RadioGroup } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  TEMA_OPTIONS,
  subtemaOptions,
} from "@/constants/recomendaciones/taxonomy";
import { useRecomendacionForm } from "@/hooks/useRecomendacionForm";
import { Stack, styled } from "@/styled/jsx";
import type {
  RecomendacionState,
  RecomendacionValues,
} from "@/types/recomendaciones";
import { Radio, Select, TextField } from "@aymurai/ui";
import { DestinatarioFields } from "./destinatario-fields";

export interface RecomendacionFormProps {
  state: RecomendacionState;
  /** Lifts the live (undebounced) values up to `validation.tsx`, which needs
   *  them both to derive the deferred highlight annotations (§X3) and to
   *  build the save payload. */
  onValuesChange: (values: RecomendacionValues) => void;
  /** Lifts which field currently has focus, so `validation.tsx` can pass it
   *  to `FileAnnotator` as `activeField`. */
  onActiveFieldChange: (field: string | null) => void;
}

/**
 * The Recomendaciones validation form. Owns `useRecomendacionForm` (the
 * single source of truth for edits) and renders every field in the order
 * specified by the task brief. `values`/`activeField` are reported upward
 * via callbacks rather than owned by the parent, since the hook that tracks
 * pristine/dirty state and the frozen `suggestions` must live here.
 */
export function RecomendacionForm({
  state,
  onValuesChange,
  onActiveFieldChange,
}: RecomendacionFormProps) {
  const { t } = useTranslation("recomendaciones");
  const {
    values,
    suggestions,
    setField,
    setDestinatarioField,
    addDestinatario,
    removeDestinatario,
  } = useRecomendacionForm(state);

  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    onValuesChange(values);
  }, [values, onValuesChange]);

  const selectedIndex = Math.min(selectedTab, values.destinatarios.length - 1);
  const selectedDestinatario = values.destinatarios[selectedIndex];

  const handleAddDestinatario = () => {
    const newIndex = values.destinatarios.length;
    addDestinatario();
    setSelectedTab(newIndex);
  };

  const handleRemoveDestinatario = (index: number) => {
    const target = values.destinatarios[index];
    if (!target) return;
    removeDestinatario(target.id);
    setSelectedTab((current) => {
      const newLength = values.destinatarios.length - 1;
      return current >= newLength ? Math.max(0, newLength - 1) : current;
    });
  };

  // §6: a `tema`/`subtema` the model returned but that isn't in the current
  // taxonomy is never silently discarded — it's kept, injected as an extra
  // option, and flagged with an error message.
  const temaInTaxonomy =
    values.tema === "" ||
    TEMA_OPTIONS.some((option) => option.id === values.tema);
  const temaSelectOptions = temaInTaxonomy
    ? TEMA_OPTIONS
    : [...TEMA_OPTIONS, { id: values.tema, text: values.tema }];

  const subtemaBaseOptions = subtemaOptions(values.tema);
  const subtemaInTaxonomy =
    values.subtema === "" ||
    subtemaBaseOptions.some((option) => option.id === values.subtema);
  const subtemaSelectOptions = subtemaInTaxonomy
    ? subtemaBaseOptions
    : [...subtemaBaseOptions, { id: values.subtema, text: values.subtema }];

  const suggestedDestinatario = selectedDestinatario
    ? suggestions.destinatarios.find(
        (destinatario) => destinatario.id === selectedDestinatario.id,
      )
    : undefined;

  return (
    <Stack gap="8">
      <TextField
        label={t("validation.numeroRecomendacion")}
        value={values.numero_recomendacion}
        suggestion={suggestions.numero_recomendacion}
        onChange={(event) =>
          setField("numero_recomendacion", event.target.value)
        }
        onFocus={() => onActiveFieldChange("numero_recomendacion")}
      />

      <TextField
        label={t("validation.fechaRecomendacion")}
        value={values.fecha_recomendacion}
        suggestion={suggestions.fecha_recomendacion}
        onChange={(event) =>
          setField("fecha_recomendacion", event.target.value)
        }
        onFocus={() => onActiveFieldChange("fecha_recomendacion")}
      />

      <Stack gap="4">
        <DecisionTabs
          label={t("validation.destinatarioLabel")}
          selected={selectedIndex}
          decisionAmount={values.destinatarios.length}
          addDecision={handleAddDestinatario}
          selectDecision={setSelectedTab}
          onRemove={handleRemoveDestinatario}
        />
        {selectedDestinatario && (
          <DestinatarioFields
            value={selectedDestinatario}
            suggestion={suggestedDestinatario}
            onChange={(key, value) =>
              setDestinatarioField(selectedDestinatario.id, key, value)
            }
            onFocusField={onActiveFieldChange}
          />
        )}
      </Stack>

      <Stack gap="1">
        <Select
          label={t("validation.tema")}
          options={temaSelectOptions}
          value={values.tema || undefined}
          suggestion={suggestions.tema ? { id: suggestions.tema } : undefined}
          onChange={(option) => setField("tema", option.id)}
        />
        {/* `Select` (@aymurai/ui) has no `error` prop, unlike `TextField` —
            render the out-of-taxonomy notice as its own text instead of
            silently discarding the model's `tema` (§6). */}
        {!temaInTaxonomy && (
          <styled.p textStyle="label.sm.default" color="system.error">
            {t("validation.temaOutOfTaxonomy")}
          </styled.p>
        )}
      </Stack>

      <Stack gap="1">
        <Select
          label={t("validation.subtema")}
          options={subtemaSelectOptions}
          value={values.subtema || undefined}
          suggestion={
            suggestions.subtema ? { id: suggestions.subtema } : undefined
          }
          onChange={(option) => setField("subtema", option.id)}
        />
        {!subtemaInTaxonomy && (
          <styled.p textStyle="label.sm.default" color="system.error">
            {t("validation.subtemaOutOfTaxonomy")}
          </styled.p>
        )}
      </Stack>

      <RadioGroup
        label={t("validation.datosPersonales")}
        name="datos-personales"
      >
        <Radio
          value="si"
          checked={values.datos_personales === true}
          onChange={() => setField("datos_personales", true)}
        >
          {t("validation.datosPersonalesSi")}
        </Radio>
        <Radio
          value="no"
          checked={values.datos_personales === false}
          onChange={() => setField("datos_personales", false)}
        >
          {t("validation.datosPersonalesNo")}
        </Radio>
      </RadioGroup>

      <Textarea
        label={t("validation.contenidoParaPublicar")}
        value={values.contenido_para_publicar}
        onChange={(event) =>
          setField("contenido_para_publicar", event.target.value)
        }
        onFocus={() => onActiveFieldChange("contenido_para_publicar")}
      />
    </Stack>
  );
}
