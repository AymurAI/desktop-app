import { TAXONOMY } from "@/constants/recomendaciones/taxonomy";
import type { RecomendacionValidation } from "@/schema/recomendaciones";
import type {
  DataExtractionResult,
  DestinatarioValue,
  RecomendacionState,
  RecomendacionValues,
} from "@/types/recomendaciones";
import { useRef, useState } from "react";

/** Normaliza la respuesta cruda del backend al shape editable del formulario:
 *  `null` -> `""` y asigna ids locales estables a cada destinatario. */
export function normalizeExtraction(
  result: DataExtractionResult,
): RecomendacionValues {
  const sourceDestinatarios =
    result.destinatarios.length > 0
      ? result.destinatarios
      : [
          {
            nombre: null,
            cargo: null,
            destinatario_principal: true,
            sector: null,
          },
        ];

  const destinatarios: DestinatarioValue[] = sourceDestinatarios.map(
    (destinatario) => ({
      id: crypto.randomUUID(),
      nombre: destinatario.nombre ?? "",
      cargo: destinatario.cargo ?? "",
      destinatario_principal: destinatario.destinatario_principal,
      sector: destinatario.sector ?? "",
    }),
  );

  return {
    numero_recomendacion: result.numero_recomendacion ?? "",
    fecha_recomendacion: result.fecha_recomendacion ?? "",
    destinatarios,
    tema: result.tema ?? "",
    subtema: result.subtema ?? "",
    datos_personales: result.datos_personales,
    contenido_para_publicar: result.contenido_para_publicar,
  };
}

/** Payload a persistir como validación manual: sin `id` local. */
export function toValidationPayload(
  values: RecomendacionValues,
): RecomendacionValidation {
  return {
    numero_recomendacion: values.numero_recomendacion,
    fecha_recomendacion: values.fecha_recomendacion,
    destinatarios: values.destinatarios.map((destinatario) => ({
      nombre: destinatario.nombre,
      cargo: destinatario.cargo,
      destinatario_principal: destinatario.destinatario_principal,
      sector: destinatario.sector,
    })),
    tema: values.tema,
    subtema: values.subtema,
    // `null` ("sin responder") travels through as-is: coercing it to `false`
    // would persist an explicit "No" the user never gave.
    datos_personales: values.datos_personales,
    contenido_para_publicar: values.contenido_para_publicar,
  };
}

function emptyDestinatario(): DestinatarioValue {
  return {
    id: crypto.randomUUID(),
    nombre: "",
    cargo: "",
    destinatario_principal: false,
    sector: "",
  };
}

export function useRecomendacionForm(initial: RecomendacionState) {
  // Congelado en el primer render: nunca debe reaccionar a `setField`, o se
  // pierde la señal de "el usuario cambió lo que infirió el modelo".
  const suggestionsRef = useRef(initial.suggestions);
  const suggestions = suggestionsRef.current;

  const [values, setValues] = useState<RecomendacionValues>(initial.values);

  function setField<K extends keyof RecomendacionValues>(
    key: K,
    value: RecomendacionValues[K],
  ): void {
    setValues((current) => {
      if (key === "tema") {
        const nuevoTema = value as string;
        const subtemaActual = current.subtema;
        const subtemaSigueValido =
          TAXONOMY[nuevoTema]?.includes(subtemaActual) ?? false;
        return {
          ...current,
          tema: nuevoTema,
          subtema: subtemaSigueValido ? subtemaActual : "",
        };
      }
      return { ...current, [key]: value };
    });
  }

  function setDestinatarioField<K extends keyof DestinatarioValue>(
    id: string,
    key: K,
    value: DestinatarioValue[K],
  ): void {
    setValues((current) => ({
      ...current,
      destinatarios: current.destinatarios.map((destinatario) =>
        destinatario.id === id
          ? { ...destinatario, [key]: value }
          : destinatario,
      ),
    }));
  }

  function addDestinatario(): string {
    const nuevo = emptyDestinatario();
    setValues((current) => ({
      ...current,
      destinatarios: [...current.destinatarios, nuevo],
    }));
    return nuevo.id;
  }

  function removeDestinatario(id: string): void {
    setValues((current) => {
      if (current.destinatarios.length <= 1) return current;
      return {
        ...current,
        destinatarios: current.destinatarios.filter(
          (destinatario) => destinatario.id !== id,
        ),
      };
    });
  }

  function isPristine(key: string): boolean {
    if (key.startsWith("destinatario:")) {
      const [, id, campo] = key.split(":");
      const actual = values.destinatarios.find(
        (destinatario) => destinatario.id === id,
      );
      const sugerido = suggestions.destinatarios.find(
        (destinatario) => destinatario.id === id,
      );
      if (!sugerido) return false;
      return (
        actual?.[campo as keyof DestinatarioValue] ===
        sugerido[campo as keyof DestinatarioValue]
      );
    }
    const k = key as keyof RecomendacionValues;
    return values[k] === suggestions[k];
  }

  return {
    values,
    suggestions,
    setField,
    setDestinatarioField,
    addDestinatario,
    removeDestinatario,
    isPristine,
  };
}
