import { Input, Select, ValidationForm } from 'components';
import { LabelType } from 'types/aymurai';
import { suggest } from 'utils/predictions';
import { FormProps } from '../FormGroup.types';
import json from './options.json';

export default function DatosAcusado({
  onSubmit,
  register,
  getSuggestion,
  predictions,
}: FormProps) {
  return (
    <ValidationForm title="Datos del acusado/a" onSubmit={onSubmit}>
      <Select
        ref={register(LabelType.GENERO_ACUSADO)}
        {...suggest(predictions).select(LabelType.GENERO_ACUSADO)}
        label="Género"
        options={json.GENERO}
      />
      <Select
        ref={register(LabelType.PERSONA_ACUSADA_NO_DETERMINADA)}
        {...suggest(predictions).select(
          LabelType.PERSONA_ACUSADA_NO_DETERMINADA
        )}
        label="Persona acusada no determinada"
        options={json.PERSONA_ACUSADA_NO_DETERMINADA}
      />
      <Select
        ref={register(LabelType.NACIONALIDAD_ACUSADO)}
        {...suggest(predictions).select(LabelType.NACIONALIDAD_ACUSADO)}
        label="Nacionalidad"
        options={json.NACIONALIDAD}
      />
      <Input
        ref={register(LabelType.EDAD_ACUSADO)}
        {...suggest(predictions).text(LabelType.EDAD_ACUSADO)}
        type="number"
        label="Edad"
        helper="Al momento del hecho"
      />
      <Select
        ref={register(LabelType.NIVEL_INSTRUCCION_ACUSADO)}
        {...suggest(predictions).select(LabelType.NIVEL_INSTRUCCION_ACUSADO)}
        label="Nivel de instrucción"
        options={json.NIVEL_INSTRUCCION}
      />
    </ValidationForm>
  );
}
