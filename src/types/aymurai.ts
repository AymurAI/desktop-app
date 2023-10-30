// ------------
// PREDICTION

import { SelectOption } from "components/select";

// ------------
type LabelAttributes = {
  aymurai_label: AllLabels;
  aymurai_label_subclass: string[] | null;
  aymurai_alt_text: string | null;
};

export type PredictLabel = {
  text: string;
  start_char: number;
  end_char: number;
  attrs: LabelAttributes;
};
export type PredictSuccess = {
  document: string;
  labels: PredictLabel[];
};

export enum LabelType {
  // INFO GRAL
  N = "N",
  NRO_REGISTRO = "NRO_REGISTRO",
  TOMO = "TOMO",
  FECHA_RESOLUCION = "FECHA_RESOLUCION",
  N_EXPTE_EJE = "N_EXPTE_EJE",
  FIRMA = "FIRMA",

  // DATOS DENUNCIANTE
  GENERO_DENUNCIANTE = "GENERO_DENUNCIANTE",
  NACIONALIDAD_DENUNCIANTE = "NACIONALIDAD_DENUNCIANTE",
  EDAD_DENUNCIANTE = "EDAD_DENUNCIANTE",
  NIVEL_INSTRUCCION_DENUNCIANTE = "NIVEL_INSTRUCCION_DENUNCIANTE",

  // DATOS ACUSADO
  GENERO_ACUSADO = "GENERO_ACUSADO",
  PERSONA_ACUSADA_NO_DETERMINADA = "PERSONA_ACUSADA_NO_DETERMINADA",
  NACIONALIDAD_ACUSADO = "NACIONALIDAD_ACUSADO",
  EDAD_ACUSADO = "EDAD_ACUSADO",
  NIVEL_INSTRUCCION_ACUSADO = "NIVEL_INSTRUCCION_ACUSADO",
}
export enum LabelDecisiones {
  // INFO HECHO
  MATERIA = "MATERIA",
  ART_INFRINGIDO = "ART_INFRINGIDO",
  CODIGO_O_LEY = "CODIGO_O_LEY",
  CONDUCTA = "CONDUCTA",
  CONDUCTA_DESCRIPCION = "CONDUCTA_DESCRIPCION",
  VIOLENCIA_DE_GENERO = "VIOLENCIA_DE_GENERO",
  VIOLENCIA_DE_GENERO_SI = "VIOLENCIA_DE_GENERO_SI",
  VIOLENCIA_DE_GENERO_NO = "VIOLENCIA_DE_GENERO_NO",
  V_FISICA = "V_FISICA",
  V_PSIC = "V_PSIC",
  V_ECON = "V_ECON",
  V_SEX = "V_SEX",
  V_SOC = "V_SOC",
  V_AMB = "V_AMB",
  V_SIMB = "V_SIMB",
  V_POLIT = "V_POLIT",
  MODALIDAD_DE_LA_VIOLENCIA = "MODALIDAD_DE_LA_VIOLENCIA",
  FRASES_AGRESION = "FRASES_AGRESION",
  FRECUENCIA_EPISODIOS = "FRECUENCIA_EPISODIOS",
  ZONA_DEL_HECHO = "ZONA_DEL_HECHO",
  LUGAR_DEL_HECHO = "LUGAR_DEL_HECHO",
  RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE = "RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE",
  HIJOS_HIJAS_EN_COMUN = "HIJOS_HIJAS_EN_COMUN",
  MEDIDAS_DE_PROTECCION_VIGENTES_AL_MOMENTO_DEL_HECHO = "MEDIDAS_DE_PROTECCION_VIGENTES_AL_MOMENTO_DEL_HECHO",

  // DECISION
  TIPO_DE_RESOLUCION = "TIPO_DE_RESOLUCION",
  OBJETO_DE_LA_RESOLUCION = "OBJETO_DE_LA_RESOLUCION",
  DETALLE = "DETALLE",
  DECISION = "DECISION",
  TIPO_DE_AUDIENCIA_ORAL = "TIPO_DE_AUDIENCIA_ORAL",
  TIPO_DE_AUDIENCIA_ESCRITA = "TIPO_DE_AUDIENCIA_ESCRITA",
  HORA_DE_INICIO = "HORA_DE_INICIO",
  HORA_DE_CIERRE = "HORA_DE_CIERRE",
  DURACION = "DURACION",
}
export type AllLabels = LabelType | LabelDecisiones;

export const anonymizerLabels: SelectOption[] = [
  { id: "DNI", text: "DNI" },
  { id: "PER", text: "Persona" },
  { id: "TEL", text: "Número de teléfono" },
  { id: "CORREO_ELECTRÓNICO", text: "Correo electrónico" },
  { id: "BANCO", text: "Banco" },
  { id: "CBU", text: "Clave Bancaria Uniforme " },
  { id: "CUIJ", text: "Clave única de identificación judicial" },
  { id: "CUIT_CUIL", text: "Código única de identificación laboral" },
  { id: "DIRECCION", text: "Dirección" },
  { id: "LOC", text: "Localidad" },
  { id: "EDAD", text: "Edad" },
  { id: "ESTUDIOS", text: "Estudios" },
  { id: "FECHA", text: "Fecha" },
  { id: "LINK", text: "Link" },
  { id: "LOC", text: "Localidad" },
  { id: "MARCA_AUTOMOVIL", text: "Marca automóvil" },
  { id: "NACIONALIDAD", text: "Nacionalidad" },
  { id: "NUM_ACTUACION", text: "Número actuación" },
  { id: "NUM_CAJA_AHORRO", text: "Número caja ahorro" },
  { id: "NUM_EXPEDIENTE", text: "Número expediente" },
  { id: "NUM_MATRICULA", text: "Número matrícula" },
  { id: "PATENTE_DOMINIO", text: "Patente dominio" },
  { id: "TEXTO_ANONIMIZAR", text: "Texto anonimizar" },
];

// --------------------
// DOCUMENT EXTRACTION
// --------------------

export type ExportDocumentSuccess = {
  header?: string[];
  document: string;
  footer?: string[];
};
