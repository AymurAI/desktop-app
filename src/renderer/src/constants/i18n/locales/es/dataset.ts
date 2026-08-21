import { documentFormats } from "./document-formats";

const dataset = {
  title: "Set de Datos",
  subtitle: "Convierte resoluciones judiciales en set de datos estructurados",
  onboarding: {
    sectionTitle: "1. Selección de archivo",
    validFormats: documentFormats,
    loadDocuments: "Cargar documento",
    dropAreaTitle:
      "Selecciona o arrastra el archivo para\nagregar al set de datos",
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
      title: "Selecciona las resoluciones judiciales",
      subtitle: "Sube los documentos que quieres incorporar al set de datos.",
    },
    step2: {
      alt: "Barra de búsqueda con cursor",
      title: "La inteligencia artificial analiza los documentos",
      subtitle:
        "Extrae automáticamente la información relevante de cada documento.",
    },
    step3: {
      alt: "Visor de documentos con controles de revisión",
      title: "Revisión y validación humana",
      subtitle:
        "Es importante que verifiques que los datos sean correctos antes de exportar el archivo.",
    },
    step4: {
      alt: "Binoculares con globo terráqueo",
      title: "Generación del set de datos",
      subtitle:
        "Los documentos pasan a formar parte del set de datos abiertos.",
    },
  },
  process: {
    sectionTitle: "2. Extracción de datos",
    processingTitle: "AymurAI está extrayendo los datos de los archivos.",
    processingSubtitle: "Este proceso puede tardar algunos minutos.",
    finishText: "Se finalizó el análisis de tus documentos.",
    // G8 F3: title/subtitle/Callout must reflect the aggregated status
    // (routes/app.$feature/process.tsx), not just "processing" forever.
    finishedTitle: "AymurAI finalizó la extracción de datos de los archivos.",
    finishedSubtitle: "Podés continuar con la validación de los datos.",
    errorTitle: "Ocurrió un problema al procesar los archivos.",
    errorSubtitle: "Alguno de los archivos no pudo procesarse correctamente.",
    errorText: "El procesamiento de los archivos no se completó correctamente.",
    next: "Continuar",
  },
  validation: {
    continue: "Continuar",
  },
  result: { sectionTitle: "" },
  finish: {
    sectionTitle: "4. Finalización",
    description:
      "Los datos encontrados por AymurAI y posteriormente validados ya son parte del set de datos abiertos con perspectiva de género.",
    subtitle: "Archivos procesados",
    restart: "Cargar más documentos",
    viewResult: "Ver set de datos",
  },
};

export default dataset;
