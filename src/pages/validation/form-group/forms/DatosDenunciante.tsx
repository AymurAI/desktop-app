import { Input, Select, ValidationForm } from 'components';
import { LabelType } from 'types/aymurai';
import { FormProps } from '../FormGroup.types';
import json from './options.json';

export default function DatosDenunciante({
  fileName,
  getValue,
  getSuggestion,
}: FormProps) {
  return (
    <ValidationForm title='Datos del denunciante' fileName={fileName}>
      {(register) => (
        <>
          <Select
            {...register(LabelType.GENERO_DENUNCIANTE)}
            selected={getValue(LabelType.GENERO_DENUNCIANTE)}
            suggestion={getSuggestion(LabelType.GENERO_DENUNCIANTE)}
            label='Género'
            options={json.GENERO}
          />

          <Select
            {...register(LabelType.NACIONALIDAD_DENUNCIANTE)}
            selected={getValue(LabelType.NACIONALIDAD_DENUNCIANTE)}
            suggestion={getSuggestion(LabelType.NACIONALIDAD_DENUNCIANTE)}
            label='Nacionalidad'
            options={json.NACIONALIDAD}
          />
          <Input
            {...register(LabelType.EDAD_DENUNCIANTE)}
            defaultValue={getValue(LabelType.EDAD_DENUNCIANTE)}
            suggestion={getSuggestion(LabelType.EDAD_DENUNCIANTE)}
            label='Edad'
            helper='Al momento del hecho'
            type='number'
          />
          <Select
            {...register(LabelType.NIVEL_INSTRUCCION_DENUNCIANTE)}
            selected={getValue(LabelType.NIVEL_INSTRUCCION_DENUNCIANTE)}
            suggestion={getSuggestion(LabelType.NIVEL_INSTRUCCION_DENUNCIANTE)}
            label='Nivel de instrucción'
            options={json.NIVEL_INSTRUCCION}
          />
        </>
      )}
    </ValidationForm>
  );
}
