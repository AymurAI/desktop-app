import { MEDIA_EXTENSIONS } from "@/constants/config";

function formatExtensionList(extensions: string[]) {
  const formatted = extensions.map((extension) => `.${extension}`);
  if (formatted.length <= 1) return formatted.join("");

  const head = formatted.slice(0, -1).join(", ");
  return `${head} o ${formatted.at(-1)}`;
}

const voiceToText = {
  title: "Voz a Texto",
  subtitle: "Transcribe audios y videos a documentos de texto editables",
  stepper: {
    step1: "Selección",
    step2: "Transcripción",
    step3: "Validación",
    step4: "Finalización",
  },
  header: {
    appsAria: "Abrir aplicaciones",
  },
  howItWorks: {
    helpAria: "Cómo funciona la transcripción de voz a texto",
    step1: {
      alt: "Interfaz de carga de un archivo de audio o video",
      title: "Subí el archivo de audio o video",
      subtitle: `Cargá un archivo en formato ${formatExtensionList(MEDIA_EXTENSIONS)}.`,
    },
    step2: {
      alt: "Procesamiento automático de un archivo multimedia",
      title: "La inteligencia artificial procesa el archivo",
      subtitle:
        "Genera la transcripción e identifica distintas personas que hablan en el audio.",
    },
    step3: {
      alt: "Revisión y edición de una transcripción",
      title: "Revisión y validación humana",
      subtitle:
        "Revisá la transcripción, editá el texto y renombrá a las personas antes de exportar el archivo.",
    },
    step4: {
      alt: "Descarga de una transcripción terminada",
      title: "Descargá la transcripción",
      subtitle: "El archivo queda listo para exportar en formato de texto.",
    },
  },
  onboarding: {
    sectionTitle: "1. Selección de archivo",
    loadDocuments: "Cargar archivo",
    validFormats: `Formatos válidos: ${formatExtensionList(MEDIA_EXTENSIONS)}`,
    dropAreaTitle: "Selecciona o arrastra el archivo para\ntranscribir",
    dropAreaFormats: `Formatos válidos: ${formatExtensionList(MEDIA_EXTENSIONS)}`,
  },
  preview: {
    sectionTitle: "1. Selección de archivo",
    selectedCount_one: "{{count}} archivo seleccionado",
    selectedCount_other: "{{count}} archivos seleccionados",
    continue: "Siguiente",
    removeAria: "Eliminar {{name}}",
    playAria: "Reproducir 10 segundos de {{name}}",
    pauseAria: "Pausar {{name}}",
    meta: "{{duration}} · {{size}}",
  },
  process: {
    sectionTitle: "2. Transcripción de voz a texto",
    processingTitle: "AymurAI está transcribiendo el archivo.",
    processingSubtitle: "Este proceso puede tardar algunos minutos.",
    // Progress label / status / stop / replace copy is rendered by the
    // @aymurai/ui ArchiveProgress component (v0.3.0), not here.
    waitingForWords: "Esperando las primeras palabras…",
    previewAriaLabel: "Vista previa de la transcripción",
    callout:
      "Transcribiendo audio. Puede demorar unos minutos. Aparecerá aquí cuando esté listo.",
    back: "Volver",
    next: "Siguiente",
  },
  validation: {
    back: "Volver",
    finish: "Finalizar",
    saving: "Guardando...",
    saveFailed:
      "No se pudo guardar la validación. Podés continuar, pero los cambios podrían no quedar persistidos.",
    missingTranscription: "No se encontró ninguna transcripción.",
  },
  finish: {
    sectionTitle: "4. Finalización",
    description: "La transcripción ha sido completada y revisada.",
    summaryTitle: "Resumen de la transcripción",
    titleLabel: "Título",
    fileLabel: "Archivo",
    durationLabel: "Duración",
    turnsLabel: "Turnos",
    speakersLabel: "Personas",
    exportOptionsTitle: "Opciones de exportación",
    formatLabel: "Formato de archivo",
    formatDescriptions: {
      txt: ".txt: texto simple, sin formato.",
      odt: ".odt: documento editable.",
      pdf: ".pdf: sólo lectura, ideal para archivar o compartir.",
    },
    contentTitle: "Contenido",
    includeSpeakers: "Incluir oradores",
    includeTimestamps: "Incluir marcas de tiempo",
    export: "Exportar",
    exportFailed: "No se pudo generar el archivo. Intentá de nuevo.",
    back: "Volver",
    missing: "No se encontró ninguna transcripción.",
  },
  editor: {
    searchPlaceholder: "Buscar",
    searchAria: "Buscar en la transcripción",
    clearSearch: "Limpiar búsqueda",
    editMode: "Modo Edición",
    editModeBanner:
      "Modo edición activo. Seleccioná el texto para modificarlo.",
    editTitleAria: "Editar título de la transcripción",
    titleInputAria: "Título de la transcripción",
    prevResult: "Resultado anterior",
    nextResult: "Resultado siguiente",
    finish: "Finalizar",
    rewind5s: "Retroceder 5 segundos",
    forward5s: "Adelantar 5 segundos",
    play: "Reproducir",
    pause: "Pausar",
    speedAria: "Cambiar velocidad de reproducción",
    turnTextAria: "Texto de {{speaker}} en {{time}}",
    seekToTurn: "Reproducir desde {{time}}",
  },
  speakerPicker: {
    people: "Personas",
    suggested: "Roles sugeridos",
    newPerson: "Nueva persona",
    newPersonPlaceholder: "Nombre de la persona",
    create: "Crear",
  },
  selectionToolbar: {
    assignTo: "Asignar a…",
  },
  sidePanel: {
    empty: "Seleccioná un turno para editar sus propiedades.",
    selectedTurn: "Turno seleccionado",
    startsAt: "Inicia en {{time}}",
    renameAria: "Renombrar locutor en todos los turnos",
    renamePlaceholder: "Nombre del locutor",
    personSection: "Locutor",
    newPerson: "Nuevo",
    newPersonPlaceholder: "Nombre de la persona",
    create: "Crear",
    timeSection: "Marca de tiempo",
    timeInvalid: "Formato inválido. Usá mm:ss o hh:mm:ss.",
    timestampOutOfRange:
      "La marca de tiempo debe estar entre {{min}} y {{max}} para mantener el orden de los turnos.",
    actionsSection: "Acciones",
    mergePrev: "Unir con el turno anterior",
    mergeNext: "Unir con el turno siguiente",
    addBelow: "Agregar turno debajo",
    delete: "Eliminar turno",
    scopeDialog: {
      title: "Aplicar cambio",
      description:
        '"{{current}}" tiene más de una intervención en esta transcripción. ¿Aplicás el cambio sólo a este turno o a todas las intervenciones de "{{current}}"?',
      thisTurnOnly: "Sólo este turno",
      allTurns: "Todas las de {{current}}",
      cancel: "Cancelar",
    },
  },
};

export default voiceToText;
