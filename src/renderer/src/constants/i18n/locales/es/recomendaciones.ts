import { DOCUMENT_EXTENSIONS } from "@/constants/config";

const documentFormats = `Formatos válidos: ${DOCUMENT_EXTENSIONS.map((extension) => `.${extension}`).join(", ")}`;

const recomendaciones = {
  title: "Recomendaciones",
  subtitle:
    "Registra las recomendaciones de la Defensoría en una base estructurada",
  onboarding: {
    sectionTitle: "1. Selección de archivo",
    validFormats: documentFormats,
    loadDocuments: "Cargar documento",
    dropAreaTitle:
      "Selecciona o arrastra el archivo para\nagregar a las recomendaciones",
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
      title: "Selecciona las recomendaciones",
      subtitle:
        "Sube los documentos que quieres incorporar a la base de recomendaciones.",
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
      title: "Generación de la base de recomendaciones",
      subtitle:
        "Los documentos pasan a formar parte de la base estructurada de recomendaciones.",
    },
  },
  process: {
    sectionTitle: "2. Extracción de datos",
    processingTitle: "AymurAI está extrayendo los datos de los archivos.",
    processingSubtitle: "Este proceso puede tardar algunos minutos.",
    finishText: "Se finalizó el análisis de tus documentos.",
    errorText: "Ocurrió un error al extraer los datos del documento.",
    retry: "Reintentar",
    next: "Siguiente",
  },
  result: { sectionTitle: "" },
  finish: {
    sectionTitle: "4. Finalización",
    description:
      "Los datos encontrados por AymurAI y posteriormente validados ya son parte de la base estructurada de recomendaciones.",
    subtitle: "Archivos procesados",
    restart: "Cargar más documentos",
    viewResult: "Ver recomendaciones",
  },
};

export default recomendaciones;
