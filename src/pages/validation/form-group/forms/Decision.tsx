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
          <Select
            {...register(LabelType.OBJETO_DE_LA_RESOLUCION)}
            suggestion={getSuggestion(LabelType.OBJETO_DE_LA_RESOLUCION)}
            selected={getValue(LabelType.OBJETO_DE_LA_RESOLUCION)}
            options={json.OBJETO_DE_LA_RESOLUCION}
            label="Objeto de resolución"
          />
          <Select
            {...register(LabelType.DETALLE)}
            suggestion={getSuggestion(LabelType.DETALLE)}
            selected={getValue(LabelType.DETALLE)}
            label="Detalle"
            options={json.DETALLE}
          />
          <Select
            {...register(LabelType.DECISION)}
            suggestion={getSuggestion(LabelType.DECISION)}
            selected={getValue(LabelType.DECISION)}
            options={json.DECISION}
            label="Decisión"
          />
        </>
      )}
    </ValidationForm>
  );
}
