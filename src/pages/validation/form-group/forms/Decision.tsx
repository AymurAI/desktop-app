import {
  Input,
  Radio,
  RadioGroup,
  Select,
  Stack,
  ValidationForm,
} from 'components';
import { LabelDecisiones } from 'types/aymurai';
import { FormProps } from '../FormGroup.types';
import json from './options.json';

export default function Decision({
  register,
  getSuggestion,
  decision,
  onSubmit,
}: FormProps) {
  const prop = (label: LabelDecisiones) => register(label, decision);

  return (
    <ValidationForm title="Decisión/es" onSubmit={onSubmit}>
      <Select
        ref={prop(LabelDecisiones.TIPO_DE_RESOLUCION)}
        suggestion={getSuggestion(LabelDecisiones.TIPO_DE_RESOLUCION)}
        label="Tipo de la resolución"
        options={json.TIPO_DE_RESOLUCION}
      />
      <Select
        ref={prop(LabelDecisiones.OBJETO_DE_LA_RESOLUCION)}
        suggestion={getSuggestion(LabelDecisiones.OBJETO_DE_LA_RESOLUCION)}
        options={json.OBJETO_DE_LA_RESOLUCION}
        label="Objeto de resolución"
      />
      <Select
        ref={prop(LabelDecisiones.DETALLE)}
        suggestion={getSuggestion(LabelDecisiones.DETALLE)}
        label="Detalle"
        options={json.DETALLE}
      />
      <Select
        ref={prop(LabelDecisiones.DECISION)}
        suggestion={getSuggestion(LabelDecisiones.DECISION)}
        options={json.DECISION}
        label="Decisión"
      />
      <RadioGroup name="tipoAudiencia">
        <Radio
          checked={
            getSuggestion(LabelDecisiones.TIPO_DE_AUDIENCIA_ORAL) === 'oral'
          }
          ref={prop(LabelDecisiones.TIPO_DE_AUDIENCIA_ORAL)}
        >
          Oral
        </Radio>
        <Radio
          checked={
            getSuggestion(LabelDecisiones.TIPO_DE_AUDIENCIA_ESCRITA) ===
            'escrita'
          }
          ref={prop(LabelDecisiones.TIPO_DE_AUDIENCIA_ESCRITA)}
        >
          Escrita
        </Radio>
      </RadioGroup>
      <Stack spacing="l" css={{ '&>*': { flex: 1 } }}>
        <Input
          ref={prop(LabelDecisiones.HORA_DE_INICIO)}
          suggestion={getSuggestion(LabelDecisiones.HORA_DE_INICIO)}
          label="Hora de inicio"
        />
        <Input
          ref={prop(LabelDecisiones.HORA_DE_CIERRE)}
          suggestion={getSuggestion(LabelDecisiones.HORA_DE_CIERRE)}
          label="Hora de cierre"
        />
      </Stack>
      <Input
        ref={prop(LabelDecisiones.DURACION)}
        suggestion={getSuggestion(LabelDecisiones.DURACION)}
        label="Duración"
      />
    </ValidationForm>
  );
}
