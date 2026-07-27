import { DOCUMENT_EXTENSIONS } from "@/constants/config";

// Shared by every flow that accepts a single document (docx/pdf) upload —
// Dataset, Anonimizador, Resumen — so the accepted-formats copy can't drift
// out of sync with DOCUMENT_EXTENSIONS across their locale files.
export const documentFormats = `Formatos válidos: ${DOCUMENT_EXTENSIONS.map((extension) => `.${extension}`).join(", ")}`;
