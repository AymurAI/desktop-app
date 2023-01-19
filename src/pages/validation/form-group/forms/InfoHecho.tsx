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
import nArray from 'utils/nArray';

export default function DatosDenunciante({
  decision,
  onSubmit,
  register,
  suggester,
}: FormProps) {
  console.log('Receibev decision: ', decision);
  const [frasesAgresion, setFrasesAgresion] = useState(1);

  const newFraseAgresion = () => setFrasesAgresion(frasesAgresion + 1);

  const frasesArray = nArray(frasesAgresion, undefined).map((_, i) => i);
  const fraseName = (i: number) => `${LabelDecisiones.FRASES_AGRESION}${i}`;

  const prop = (label: LabelDecisiones) => register(label, decision);

  return (
    <ValidationForm title="Información del hecho" onSubmit={onSubmit}>
      <Select
        ref={prop(LabelDecisiones.MATERIA)}
        {...suggester.select(LabelDecisiones.MATERIA)}
        options={json.MATERIA}
        label="Materia"
      />
      <Select
        ref={prop(LabelDecisiones.ART_INFRINGIDO)}
        {...suggester.art_infringido()}
        label="Artículo infringido"
        options={json.ART_INFRINGIDO}
      />
      <Select
        ref={prop(LabelDecisiones.CODIGO_O_LEY)}
        {...suggester.codigo_o_ley()}
        label="Código o ley"
        options={json.CODIGO_O_LEY}
      />
      <Select
        ref={prop(LabelDecisiones.CONDUCTA)}
        {...suggester.select(LabelDecisiones.CONDUCTA)}
        label="Conducta"
        options={json.CONDUCTA}
      />
      <Select
        ref={prop(LabelDecisiones.CONDUCTA_DESCRIPCION)}
        {...suggester.select(LabelDecisiones.CONDUCTA_DESCRIPCION)}
        label="Descripción de la conducta"
        options={json.CONDUCTA_DESCRIPCION}
      />
      <RadioGroup name="violenciaGenero" label="Violencia de género">
        <Radio
          {...suggester.violencia_genero('si')}
          ref={prop(LabelDecisiones.VIOLENCIA_DE_GENERO_SI)}
        >
          Sí
        </Radio>
        <Radio
          {...suggester.violencia_genero('no')}
          ref={prop(LabelDecisiones.VIOLENCIA_DE_GENERO_NO)}
        >
          No
        </Radio>
      </RadioGroup>
      <CheckboxGroup name="tipoViolencia" title="Tipo de violencia">
        <Checkbox
          {...suggester.violencia_tipo(LabelDecisiones.V_FISICA)}
          ref={prop(LabelDecisiones.V_FISICA)}
        >
          Física
        </Checkbox>
        <Checkbox
          {...suggester.violencia_tipo(LabelDecisiones.V_SEX)}
          ref={prop(LabelDecisiones.V_SEX)}
        >
          Sexual
        </Checkbox>
        <Checkbox
          {...suggester.violencia_tipo(LabelDecisiones.V_SIMB)}
          ref={prop(LabelDecisiones.V_SIMB)}
        >
          Simbólica
        </Checkbox>
        <Checkbox
          {...suggester.violencia_tipo(LabelDecisiones.V_PSIC)}
          ref={prop(LabelDecisiones.V_PSIC)}
        >
          Psicológica
        </Checkbox>
        <Checkbox
          {...suggester.violencia_tipo(LabelDecisiones.V_SOC)}
          ref={prop(LabelDecisiones.V_SOC)}
        >
          Social
        </Checkbox>
        <Checkbox
          {...suggester.violencia_tipo(LabelDecisiones.V_POLIT)}
          ref={prop(LabelDecisiones.V_POLIT)}
        >
          Política
        </Checkbox>
        <Checkbox
          {...suggester.violencia_tipo(LabelDecisiones.V_ECON)}
          ref={prop(LabelDecisiones.V_ECON)}
        >
          Económica
        </Checkbox>
        <Checkbox
          {...suggester.violencia_tipo(LabelDecisiones.V_AMB)}
          ref={prop(LabelDecisiones.V_AMB)}
        >
          Ambiental
        </Checkbox>
      </CheckboxGroup>
      <Select
        ref={prop(LabelDecisiones.MODALIDAD_DE_LA_VIOLENCIA)}
        {...suggester.select(LabelDecisiones.MODALIDAD_DE_LA_VIOLENCIA)}
        options={json.MODALIDAD_DE_LA_VIOLENCIA}
        label="Modalidad de la violencia"
      />
      <Stack direction="column" spacing="m" align="stretch">
        {frasesArray.map((i) => (
          <Input
            key={i}
            prefix={frasesArray.length > 1 ? i + 1 : undefined}
            ref={prop(fraseName(i) as LabelDecisiones)} // Treat this dynamic Label the same way as any other
            {...suggester.text(fraseName(i) as LabelDecisiones)}
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
        {...suggester.select(LabelDecisiones.FRECUENCIA_EPISODIOS)}
        options={json.FRECUENCIA_EPISODIOS}
        label="Frecuencia del episodio"
      />
      <Select
        ref={prop(LabelDecisiones.RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE)}
        {...suggester.select(
          LabelDecisiones.RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE
        )}
        options={json.RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE}
        label="Relación y tipo entre acusada y denunciante"
      />
      <Select
        ref={prop(LabelDecisiones.HIJOS_HIJAS_EN_COMUN)}
        {...suggester.select(LabelDecisiones.HIJOS_HIJAS_EN_COMUN)}
        options={json.HIJOS_HIJAS_EN_COMUN}
        label="Hijos/as en común"
      />
      <Select
        ref={prop(
          LabelDecisiones.MEDIDAS_DE_PROTECCION_VIGENTES_AL_MOMENTO_DEL_HECHO
        )}
        {...suggester.select(
          LabelDecisiones.MEDIDAS_DE_PROTECCION_VIGENTES_AL_MOMENTO_DEL_HECHO
        )}
        options={json.MEDIDAS_DE_PROTECCION_VIGENTES_AL_MOMENTO_DEL_HECHO}
        label="Medidas de protección vigentes al momento del hecho"
      />
      <Select
        ref={prop(LabelDecisiones.ZONA_DEL_HECHO)}
        {...suggester.select(LabelDecisiones.ZONA_DEL_HECHO)}
        options={json.ZONA_DEL_HECHO}
        label="Zona del hecho"
      />
      <Select
        ref={prop(LabelDecisiones.LUGAR_DEL_HECHO)}
        {...suggester.select(LabelDecisiones.LUGAR_DEL_HECHO)}
        options={json.LUGAR_DEL_HECHO}
        label="Lugar del hecho"
      />
    </ValidationForm>
  );
}
