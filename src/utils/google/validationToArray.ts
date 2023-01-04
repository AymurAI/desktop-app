import { AllLabels, LabelDecisiones, LabelType } from 'types/aymurai';
import { DocFile } from 'types/file';
import { flatValidation } from 'utils/file';

/**
 * Columns order extracted from the original dataset spreadsheet
 */
const orderArray = [
  'N',
  'NRO_REGISTRO',
  'TOMO',
  'FECHA_RESOLUCION',
  'N_EXPTE_EJE',
  'FIRMA',
  'MATERIA',
  'ART_INFRINGIDO',
  'CODIGO_O_LEY',
  'CONDUCTA',
  'CONDUCTA_DESCRIPCION',
  'VIOLENCIA_DE_GENERO',
  'V_FISICA',
  'V_PSIC',
  'V_ECON',
  'V_SEX',
  'V_SOC',
  'V_AMB',
  'V_SIMB',
  'V_POLIT',
  'MODALIDAD_DE_LA_VIOLENCIA',
  'FRASES_AGRESION',
  'GENERO_ACUSADO',
  'PERSONA_ACUSADA_NO_DETERMINADA',
  'NACIONALIDAD_ACUSADO',
  'EDAD_ACUSADO',
  'NIVEL_INSTRUCCION_ACUSADO',
  'GENERO_DENUNCIANTE',
  'NACIONALIDAD_DENUNCIANTE',
  'EDAD_DENUNCIANTE',
  'NIVEL_INSTRUCCION_DENUNCIANTE',
  'FRECUENCIA_EPISODIOS',
  'RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE',
  'HIJOS_HIJAS_EN_COMUN',
  'MEDIDAS_DE_PROTECCION_VIGENTES_AL_MOMENTO_DEL_HECHO',
  'ZONA_DEL_HECHO',
  'LUGAR_DEL_HECHO',
  'TIPO_DE_RESOLUCION',
  'OBJETO_DE_LA_RESOLUCION',
  'DETALLE',
  'DECISION',
  'ORAL_ESCRITA',
  'HORA_DE_INICIO',
  'HORA_DE_CIERRE',
  'DURACION',
  'LINK',
  'SI_NO_RECURRENTE',
  'DECISION_CAMARA_DE_APELACIONES',
  'N_REGISTRO_Y_TOMO_CAMARA',
  'LINK_CAMARA',
  'SI_NO_RECURRENTE_CAMARA',
  'DECISION_DE_ADMISIBILIDAD_CAMARA',
  'N_REGISTRO_Y_TOMO_CAMARA_1',
  'LINK_CAMARA_1',
  'QUEJA_Y_RECURRENTE',
  'DECISION_DE_ADMISIBILIDAD_TSJ',
  'N_REGISTRO_Y_TOMO_TSJ',
  'LINK_TSJ',
  'DECISION_DE_FONDO_TSJ',
  'N_REGISTRO_Y_TOMO_TSJ_1',
  'LINK_TSJ_1',
  'RECURSO_EXTRAORDINARIO_Y_RECURRENTE',
  'DECISION_CSJN',
  'N_REGISTRO_Y_TOMO_CSJN',
  'LINK_CSJN',
] as const;

/**
 * Converts the validation object into an ordered array
 * @param object Validation object containing all the validations made in the `/validation` page
 * @returns An ordered array with the values from the `validationObject`
 */
export default function validationToArray(object: DocFile['validationObject']) {
  const flat = flatValidation(object);

  return flat.map((obj) => {
    return orderArray.map((key) => {
      // Special cases
      if (key === 'VIOLENCIA_DE_GENERO') {
        const si = obj[LabelType.VIOLENCIA_DE_GENERO_SI];
        const no = obj[LabelType.VIOLENCIA_DE_GENERO_NO];

        if (si) return true;
        else if (no) return false;
        return undefined;
      } else if (key === 'FRASES_AGRESION') {
        // Find related fields. This retrieves any field named in the format `FRASES_AGRESIONx`
        const frases = Object.keys(obj).filter((objectKey) =>
          objectKey.includes(key)
        );
        // Join the phrases by commas
        const joined = frases
          .map((frase) => obj[frase as LabelType.FRASES_AGRESION])
          .join(', ');

        return joined;
      } else if (key === 'ORAL_ESCRITA') {
        const oral = obj[LabelDecisiones.TIPO_DE_AUDIENCIA_ORAL];
        const escrita = obj[LabelDecisiones.TIPO_DE_AUDIENCIA_ESCRITA];

        if (oral) return 'oral';
        else if (escrita) return 'escrita';
        else return 'no_corresponde';
      }

      // Generic case, just return the value
      // Treat the case as a defined LabelType | LabelDecisiones. In case its not, just return the undefined
      // as this case won't create a value on the dataset as expected
      return obj[key as AllLabels];
    });
  });
}
