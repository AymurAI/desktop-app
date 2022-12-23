import { Input, Select, ValidationForm } from 'components';
import { LabelType } from 'types/aymurai';
import { FormProps } from '../FormGroup.types';
import json from './options.json';

export default function DatosAcusado({
  fileName,
  getValue,
  getSuggestion,
}: FormProps) {
  return (
    <ValidationForm title='Datos del acusado/a' fileName={fileName}>
      {(register) => (
        <>
          <Select
            {...register(LabelType.GENERO_ACUSADO)}
            selected={getValue(LabelType.GENERO_ACUSADO)}
            suggestion={getSuggestion(LabelType.GENERO_ACUSADO)}
            label='Género'
            options={json.GENERO}
          />
          <Select
            {...register(LabelType.PERSONA_ACUSADA_NO_DETERMINADA)}
            selected={getValue(LabelType.PERSONA_ACUSADA_NO_DETERMINADA)}
            suggestion={getSuggestion(LabelType.PERSONA_ACUSADA_NO_DETERMINADA)}
            label='Persona acusada no determinada'
            options={json.PERSONA_ACUSADA_NO_DETERMINADA}
          />
          <Select
            {...register(LabelType.NACIONALIDAD_ACUSADO)}
            selected={getValue(LabelType.NACIONALIDAD_ACUSADO)}
            suggestion={getSuggestion(LabelType.NACIONALIDAD_ACUSADO)}
            label='Nacionalidad'
            options={json.NACIONALIDAD}
          />
          <Input
            {...register(LabelType.EDAD_ACUSADO)}
            defaultValue={getValue(LabelType.EDAD_ACUSADO)}
            suggestion={getSuggestion(LabelType.EDAD_ACUSADO)}
            type='number'
            label='Edad'
            helper='Al momento del hecho'
          />
          <Select
            {...register(LabelType.NIVEL_INSTRUCCION_ACUSADO)}
            selected={getValue(LabelType.NIVEL_INSTRUCCION_ACUSADO)}
            suggestion={getSuggestion(LabelType.NIVEL_INSTRUCCION_ACUSADO)}
            label='Nivel de instrucción'
            options={json.NIVEL_INSTRUCCION}
          />
        </>
      )}
    </ValidationForm>
  );
}
