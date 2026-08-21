import { documentFormats } from "./document-formats";

const anonymizer = {
  title: "Anonimizador",
  subtitle: "Anonimiza resoluciones judiciales de manera automática y editable",
  onboarding: {
    sectionTitle: "1. Selección de archivo",
    validFormats: documentFormats,
    loadDocuments: "Cargar documento",
    dropAreaTitle: "Selecciona o arrastra el archivo para\nanonimizar",
    dropAreaFormats: documentFormats,
  },
  preview: {
    sectionTitle: "1. Selección de archivo",
    filesLabel: "Vista previa del documento",
    validFormats: documentFormats,
    loadMore: "Cargar más documentos",
    continue: "Continuar",
  },
  howItWorks: {
    step1: {
      alt: "Interfaz web con selector y cursor",
      title: "Selecciona la resolución judicial",
      subtitle: "Sube el documento que quieres anonimizar.",
    },
    step2: {
      alt: "Barra de búsqueda con cursor",
      title: "La inteligencia artificial analiza el documento",
      subtitle: "Reconoce automáticamente la información a anonimizar.",
    },
    step3: {
      alt: "Visor de documentos con controles de revisión",
      title: "Revisión y validación humana",
      subtitle:
        "Es importante que verifiques que los datos sean correctos antes de exportar el archivo.",
    },
    step4: {
      alt: "Binoculares con globo terráqueo",
      title: "Generación del documento anonimizado",
      subtitle:
        "Proceso terminado. El documento está listo para ser exportado.",
    },
  },
  labelManager: {
    closeAria: "Cerrar gestor de etiquetas",
  },
  searchBar: {
    searchAriaLabel: "Buscar en el documento",
    applyLabels: "Aplicar etiquetas",
    labelPlaceholder: "Etiqueta",
    manageLabels: "Gestor de etiquetas",
    searchPlaceholder: "Buscar",
    clearSearch: "Limpiar búsqueda",
    previousMatch: "Coincidencia anterior",
    nextMatch: "Coincidencia siguiente",
    noMatches: "0 ocurrencias",
    matchCount: "{{current}} de {{total}}",
  },
  process: {
    sectionTitle: "2. Procesamiento del archivo",
    processingTitle: "AymurAI está extrayendo los datos del archivo.",
    processingSubtitle: "Este proceso puede tardar algunos minutos.",
    finishText: "Se finalizó el análisis del documento.",
    // G8 F3: title/subtitle/Callout must reflect the aggregated status
    // (routes/app.$feature/process.tsx), not just "processing" forever.
    finishedTitle: "AymurAI finalizó la extracción de datos del archivo.",
    finishedSubtitle: "Podés continuar con la validación de los datos.",
    errorTitle: "Ocurrió un problema al procesar el archivo.",
    errorSubtitle: "El archivo no pudo procesarse correctamente.",
    errorText: "El procesamiento del archivo no se completó correctamente.",
    stoppedTitle: "Detuviste el procesamiento del archivo.",
    stoppedSubtitle: "Vuelve atrás para reiniciar el procesamiento.",
    stoppedText: "El procesamiento del archivo fue detenido manualmente.",
    continue: "Continuar",
  },
  validation: {
    toastSingleSuccess:
      'Se aplicó con éxito una etiqueta de "{{label}}" en una ocurrencia.',
    toastAllSuccess:
      'Se aplicó con éxito una etiqueta de "{{label}}" en todas las ocurrencias.',
  },
  result: { sectionTitle: "" },
  finish: {
    sectionTitle: "4. Finalización",
    description:
      "Los datos encontrados por AymurAI y posteriormente validados ya han sido anonimizados correctamente.",
    subtitle: "Archivo procesado",
    restart: "Cargar un nuevo documento",
    viewResult: "Descargar ODT",
    viewResultPDF: "Descargar PDF",
    downloadError:
      "Ocurrió un error al generar el archivo. Por favor, intente nuevamente.",
  },
  // G8 F1: one key per fatal-issue family (utils/anonymizer/export-validation.ts),
  // so the export-blocked message names the family that actually blocked the
  // export instead of a single hardcoded "offsets" message for all nine codes.
  export: {
    invalidOffsets:
      "No se puede exportar: hay entidades con offsets inválidos o fuera del texto original.",
    duplicateRanges:
      "No se puede exportar: hay más de una entidad activa sobre el mismo tramo de texto.",
    overlappingRanges:
      "No se puede exportar: hay entidades con tramos de texto solapados.",
    textMismatch:
      "No se puede exportar: el texto de una entidad no coincide con el documento original.",
    mixedGroupLabels:
      "No se puede exportar: un grupo de entidades combina etiquetas incompatibles.",
    generic: "No se puede exportar: hay entidades con datos inválidos.",
  },
};

export default anonymizer;
