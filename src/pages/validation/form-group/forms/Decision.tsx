import {
  Input,
  Radio,
  RadioGroup,
  Select,
  Stack,
  ValidationForm,
} from 'components';
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
          <RadioGroup name="tipoAudiencia">
            <Radio
              checked={
                getSuggestion(LabelType.TIPO_DE_AUDIENCIA_ORAL) === 'oral'
              }
              {...register(LabelType.TIPO_DE_AUDIENCIA_ORAL)}
            >
              Oral
            </Radio>
            <Radio
              checked={
                getSuggestion(LabelType.TIPO_DE_AUDIENCIA_ESCRITA) === 'escrita'
              }
              {...register(LabelType.TIPO_DE_AUDIENCIA_ESCRITA)}
            >
              Escrita
            </Radio>
          </RadioGroup>
          <Stack spacing="l" css={{ '&>*': { flex: 1 } }}>
            <Input
              {...register(LabelType.HORA_DE_INICIO)}
              suggestion={getSuggestion(LabelType.HORA_DE_INICIO)}
              defaultValue={getValue(LabelType.HORA_DE_INICIO)}
              label="Hora de inicio"
            />
            <Input
              {...register(LabelType.HORA_DE_CIERRE)}
              suggestion={getSuggestion(LabelType.HORA_DE_CIERRE)}
              defaultValue={getValue(LabelType.HORA_DE_CIERRE)}
              label="Hora de cierre"
            />
          </Stack>
          <Input
            {...register(LabelType.DURACION)}
            suggestion={getSuggestion(LabelType.DURACION)}
            defaultValue={getValue(LabelType.DURACION)}
            label="Duración"
          />
        </>
      )}
    </ValidationForm>
  );
}
