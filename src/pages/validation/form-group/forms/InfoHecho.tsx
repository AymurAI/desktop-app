import { Plus } from 'phosphor-react';
import { useState } from 'react';

import {
  Button,
  Checkbox,
  CheckboxGroup,
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

export default function DatosDenunciante({
  getSuggestion,
  getChecked,
  decision,
  onSubmit,
  register,
}: FormProps) {
  const [frasesAgresion, setFrasesAgresion] = useState(1);

  const newFraseAgresion = () => setFrasesAgresion(frasesAgresion + 1);

  const frasesArray = Array.from(Array(frasesAgresion).keys());
  const fraseName = (i: number) => `${LabelDecisiones.FRASES_AGRESION}${i}`;

  const prop = (label: LabelDecisiones) => register(label, decision);

  return (
    <ValidationForm title="Información del hecho" onSubmit={onSubmit}>
      <Select
        ref={prop(LabelDecisiones.MATERIA)}
        suggestion={getSuggestion(LabelDecisiones.MATERIA)}
        options={json.MATERIA}
        label="Materia"
      />
      <Select
        ref={prop(LabelDecisiones.ART_INFRINGIDO)}
        suggestion={getSuggestion(LabelDecisiones.ART_INFRINGIDO)}
        label="Artículo infringido"
        options={json.ART_INFRINGIDO}
      />
      <Select
        ref={prop(LabelDecisiones.CODIGO_O_LEY)}
        suggestion={getSuggestion(LabelDecisiones.CODIGO_O_LEY)}
        label="Código o ley"
        options={json.CODIGO_O_LEY}
      />
      <Select
        ref={prop(LabelDecisiones.CONDUCTA)}
        suggestion={getSuggestion(LabelDecisiones.CONDUCTA)}
        label="Conducta"
        options={json.CONDUCTA}
      />
      <Select
        ref={prop(LabelDecisiones.CONDUCTA_DESCRIPCION)}
        suggestion={getSuggestion(LabelDecisiones.CONDUCTA_DESCRIPCION)}
        label="Descripción de la conducta"
        options={json.CONDUCTA_DESCRIPCION}
      />
      <RadioGroup name="violenciaGenero" label="Violencia de género">
        <Radio
          checked={getSuggestion(LabelDecisiones.VIOLENCIA_DE_GENERO) === 'si'}
          ref={prop(LabelDecisiones.VIOLENCIA_DE_GENERO_SI)}
        >
          Sí
        </Radio>
        <Radio
          checked={getSuggestion(LabelDecisiones.VIOLENCIA_DE_GENERO) === 'no'}
          ref={prop(LabelDecisiones.VIOLENCIA_DE_GENERO_NO)}
        >
          No
        </Radio>
      </RadioGroup>
      <CheckboxGroup name="tipoViolencia" title="Tipo de violencia">
        <Checkbox
          checked={getChecked(LabelDecisiones.V_FISICA)}
          ref={prop(LabelDecisiones.V_FISICA)}
        >
          Física
        </Checkbox>
        <Checkbox
          ref={prop(LabelDecisiones.V_SEX)}
          checked={getChecked(LabelDecisiones.V_SEX)}
        >
          Sexual
        </Checkbox>
        <Checkbox
          ref={prop(LabelDecisiones.V_SIMB)}
          checked={getChecked(LabelDecisiones.V_SIMB)}
        >
          Simbólica
        </Checkbox>
        <Checkbox
          ref={prop(LabelDecisiones.V_PSIC)}
          checked={getChecked(LabelDecisiones.V_PSIC)}
        >
          Psicológica
        </Checkbox>
        <Checkbox
          ref={prop(LabelDecisiones.V_SOC)}
          checked={getChecked(LabelDecisiones.V_SOC)}
        >
          Social
        </Checkbox>
        <Checkbox
          ref={prop(LabelDecisiones.V_POLIT)}
          checked={getChecked(LabelDecisiones.V_POLIT)}
        >
          Política
        </Checkbox>
        <Checkbox
          ref={prop(LabelDecisiones.V_ECON)}
          checked={getChecked(LabelDecisiones.V_ECON)}
        >
          Económica
        </Checkbox>
        <Checkbox
          ref={prop(LabelDecisiones.V_AMB)}
          checked={getChecked(LabelDecisiones.V_AMB)}
        >
          Ambiental
        </Checkbox>
      </CheckboxGroup>
      <Select
        ref={prop(LabelDecisiones.MODALIDAD_DE_LA_VIOLENCIA)}
        suggestion={getSuggestion(LabelDecisiones.MODALIDAD_DE_LA_VIOLENCIA)}
        options={json.MODALIDAD_DE_LA_VIOLENCIA}
        label="Modalidad de la violencia"
      />
      <Stack direction="column" spacing="m" align="stretch">
        {frasesArray.map((i) => (
          <Input
            key={i}
            prefix={frasesArray.length > 1 ? i + 1 : undefined}
            ref={prop(fraseName(i) as LabelDecisiones)} // Treat this dynamic Label the same way as any other
            suggestion={getSuggestion(fraseName(i) as LabelDecisiones)}
            label="Frases de la agresión"
          />
        ))}
        <Button
          size="s"
          css={{ alignSelf: 'flex-start' }}
          variant="secondary"
          onClick={newFraseAgresion}
        >
          <Plus />
          Agregar frase
        </Button>
      </Stack>
      <Select
        ref={prop(LabelDecisiones.FRECUENCIA_EPISODIOS)}
        suggestion={getSuggestion(LabelDecisiones.FRECUENCIA_EPISODIOS)}
        options={json.FRECUENCIA_EPISODIOS}
        label="Frecuencia del episodio"
      />
      <Select
        ref={prop(LabelDecisiones.RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE)}
        suggestion={getSuggestion(
          LabelDecisiones.RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE
        )}
        options={json.RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE}
        label="Relación y tipo entre acusada y denunciante"
      />
      <Select
        ref={prop(LabelDecisiones.HIJOS_HIJAS_EN_COMUN)}
        suggestion={getSuggestion(LabelDecisiones.HIJOS_HIJAS_EN_COMUN)}
        options={json.HIJOS_HIJAS_EN_COMUN}
        label="Hijos/as en común"
      />
      <Select
        ref={prop(
          LabelDecisiones.MEDIDAS_DE_PROTECCION_VIGENTES_AL_MOMENTO_DEL_HECHO
        )}
        suggestion={getSuggestion(
          LabelDecisiones.MEDIDAS_DE_PROTECCION_VIGENTES_AL_MOMENTO_DEL_HECHO
        )}
        options={json.MEDIDAS_DE_PROTECCION_VIGENTES_AL_MOMENTO_DEL_HECHO}
        label="Medidas de protección vigentes al momento del hecho"
      />
      <Select
        ref={prop(LabelDecisiones.ZONA_DEL_HECHO)}
        suggestion={getSuggestion(LabelDecisiones.ZONA_DEL_HECHO)}
        options={json.ZONA_DEL_HECHO}
        label="Zona del hecho"
      />
      <Select
        ref={prop(LabelDecisiones.LUGAR_DEL_HECHO)}
        suggestion={getSuggestion(LabelDecisiones.LUGAR_DEL_HECHO)}
        options={json.LUGAR_DEL_HECHO}
        label="Lugar del hecho"
      />
    </ValidationForm>
  );
}
