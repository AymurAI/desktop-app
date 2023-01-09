import { Input, Select, ValidationForm } from 'components';
import { LabelType } from 'types/aymurai';
import { FormProps } from '../FormGroup.types';
import json from './options.json';

export default function DatosDenunciante({
  onSubmit,
  register,
  getSuggestion,
}: FormProps) {
  return (
    <ValidationForm title="Datos del denunciante" onSubmit={onSubmit}>
      <Select
        ref={register(LabelType.GENERO_DENUNCIANTE)}
        suggestion={getSuggestion(LabelType.GENERO_DENUNCIANTE)}
        label="Género"
        options={json.GENERO}
      />

      <Select
        ref={register(LabelType.NACIONALIDAD_DENUNCIANTE)}
        suggestion={getSuggestion(LabelType.NACIONALIDAD_DENUNCIANTE)}
        label="Nacionalidad"
        options={json.NACIONALIDAD}
      />
      <Input
        ref={register(LabelType.EDAD_DENUNCIANTE)}
        suggestion={getSuggestion(LabelType.EDAD_DENUNCIANTE)}
        label="Edad"
        helper="Al momento del hecho"
        type="number"
      />
      <Select
        ref={register(LabelType.NIVEL_INSTRUCCION_DENUNCIANTE)}
        suggestion={getSuggestion(LabelType.NIVEL_INSTRUCCION_DENUNCIANTE)}
        label="Nivel de instrucción"
        options={json.NIVEL_INSTRUCCION}
      />
    </ValidationForm>
  );
}
