import { Input, Select, ValidationForm } from 'components';
import { LabelType } from 'types/aymurai';
import { FormProps } from '../FormGroup.types';
import json from './options.json';

export default function Decision({
  fileName,
  getValue,
  getSuggestion,
}: FormProps) {
  return (
    <ValidationForm title="Decisión/es" fileName={fileName}>
      {(register) => (
        <>
          <Select
            {...register(LabelType.TIPO_DE_RESOLUCION)}
            selected={getValue(LabelType.TIPO_DE_RESOLUCION)}
            suggestion={getSuggestion(LabelType.TIPO_DE_RESOLUCION)}
            label="Tipo de la resolución"
            options={json.TIPO_DE_RESOLUCION}
          />
          <Input
            {...register(LabelType.OBJETO_DE_LA_RESOLUCION)}
            suggestion={getSuggestion(LabelType.OBJETO_DE_LA_RESOLUCION)}
            defaultValue={getValue(LabelType.OBJETO_DE_LA_RESOLUCION)}
            label="Objeto de resolución"
          />
          <Input
            {...register(LabelType.DETALLE)}
            suggestion={getSuggestion(LabelType.DETALLE)}
            defaultValue={getValue(LabelType.DETALLE)}
            label="Detalle"
          />
          <Input
            {...register(LabelType.DECISION)}
            suggestion={getSuggestion(LabelType.DECISION)}
            defaultValue={getValue(LabelType.DECISION)}
            label="Decisión"
          />
        </>
      )}
    </ValidationForm>
  );
}
