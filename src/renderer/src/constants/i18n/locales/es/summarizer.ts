import { DOCUMENT_EXTENSIONS } from "@/constants/config";

const documentFormats = `Formatos válidos: ${DOCUMENT_EXTENSIONS.map((extension) => `.${extension}`).join(", ")}`;

const summarizer = {
  title: "Resumen de Documento",
  subtitle: "Genera síntesis claras de resoluciones judiciales extensas",
  onboarding: {
    sectionTitle: "1. Selección de archivo",
    validFormats: documentFormats,
    loadDocuments: "Cargar documento",
    dropAreaTitle: "Selecciona el archivo para resumir",
    dropAreaFormats: documentFormats,
  },
  preview: {
    sectionTitle: "Previsualización",
    filesLabel: "Vista previa del documento",
    validFormats: documentFormats,
    continue: "Continuar",
  },
  howItWorks: {
    step1: {
      alt: "Interfaz web con selector y cursor",
      title: "Sube tu documento",
      subtitle: "Carga un archivo en formato .doc, .docx",
    },
    step2: {
      alt: "Barra de progreso cargando",
      title: "La inteligencia artificial lo resume",
      subtitle: "Extrae la información relevante del documento.",
    },
    step3: {
      alt: "Visor de documentos con emoticones",
      title: "Revisa y edita el resultado",
      subtitle:
        "Revisa el resumen y edita el texto antes de exportar el archivo.",
    },
    step4: {
      alt: "Binoculares con globo terráqueo",
      title: "Descarga tu archivo",
      subtitle: "El archivo queda listo para descargar en formato de texto.",
    },
  },
  process: {
    sectionTitle: "2. Resumiendo documento",
    processingTitle: "AymurAI está resumiendo el archivo.",
    processingSubtitle: "Este proceso puede tardar algunos minutos.",
    waitingForWords: "Esperando las primeras palabras…",
    previewAriaLabel: "Vista previa del resumen",
    callout:
      "Resumiendo texto. Puede demorar unos minutos. Aparecerá aquí cuando esté listo.",
    error: "No se pudo generar el resumen. Intentá nuevamente.",
    back: "Volver",
    next: "Siguiente",
    stop: "Detener",
  },
  validation: {
    sectionTitle: "3. Validación",
    back: "Volver",
    finish: "Finalizar",
    saving: "Guardando...",
    saveFailed:
      "No se pudo guardar la validación. Podés continuar, pero los cambios podrían no quedar persistidos.",
    missingSummary: "No se encontró ningún resumen generado.",
    originalDocumentLabel: "Documento original",
  },
  finish: {
    sectionTitle: "4. Finalización",
    description: "El resumen del documento ya esta listo.",
    previewLabel: "Pre-visualización",
    exportOptionsLabel: "Opciones de exportación",
    formatLabel: "Formato de archivo",
    back: "Volver",
    export: "Exportar",
  },
};

export default summarizer;
