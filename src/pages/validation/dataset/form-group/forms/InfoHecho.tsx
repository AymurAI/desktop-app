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
import nArray from 'utils/nArray';
import { FormDecisionProps } from '../FormGroup.types';
import json from './options.json';

export default function DatosDenunciante({
  decision,
  onSubmit,
  onCheck,
  register,
  suggester,
  getDecisionValue,
}: FormDecisionProps) {
  const [frasesAgresion, setFrasesAgresion] = useState(1);

  const newFraseAgresion = () => setFrasesAgresion(frasesAgresion + 1);

  const frasesArray = nArray(frasesAgresion, undefined).map((_, i) => i);
  const fraseName = (i: number) => `${LabelDecisiones.FRASES_AGRESION}${i}`;
  const defaultValue = getDecisionValue(decision ?? 0);

  const prop = (label: LabelDecisiones) => register(label, decision);

  return (
    <ValidationForm
      title="Información del hecho"
      onSubmit={onSubmit}
      onCheck={onCheck}
    >
      <Select
        ref={prop(LabelDecisiones.MATERIA)}
        {...suggester.select(LabelDecisiones.MATERIA)}
        options={json.MATERIA}
        label="Materia"
        selected={defaultValue(LabelDecisiones.MATERIA) as string}
      />
      <Input
        ref={prop(LabelDecisiones.ART_INFRINGIDO)}
        {...suggester.text(LabelDecisiones.ART_INFRINGIDO)}
        label="Artículo infringido"
        defaultValue={defaultValue(LabelDecisiones.ART_INFRINGIDO) as string}
      />
      <Select
        ref={prop(LabelDecisiones.CODIGO_O_LEY)}
        {...suggester.codigo_o_ley()}
        label="Código o ley"
        options={json.CODIGO_O_LEY}
        selected={defaultValue(LabelDecisiones.CODIGO_O_LEY) as string}
      />
      <Select
        ref={prop(LabelDecisiones.CONDUCTA)}
        {...suggester.select(LabelDecisiones.CONDUCTA)}
        label="Conducta"
        options={json.CONDUCTA}
        selected={defaultValue(LabelDecisiones.CONDUCTA) as string}
      />
      <Select
        ref={prop(LabelDecisiones.CONDUCTA_DESCRIPCION)}
        {...suggester.select(LabelDecisiones.CONDUCTA_DESCRIPCION)}
        label="Descripción de la conducta"
        options={json.CONDUCTA_DESCRIPCION}
        selected={defaultValue(LabelDecisiones.CONDUCTA_DESCRIPCION) as string}
      />
      <RadioGroup name="violenciaGenero" label="Violencia de género">
        <Radio
          {...suggester.violencia_genero('si')}
          ref={prop(LabelDecisiones.VIOLENCIA_DE_GENERO_SI)}
          checked={
            defaultValue(LabelDecisiones.VIOLENCIA_DE_GENERO_SI) as boolean
          }
        >
          Sí
        </Radio>
        <Radio
          {...suggester.violencia_genero('no')}
          ref={prop(LabelDecisiones.VIOLENCIA_DE_GENERO_NO)}
          checked={
            defaultValue(LabelDecisiones.VIOLENCIA_DE_GENERO_NO) as boolean
          }
        >
          No
        </Radio>
      </RadioGroup>
      <CheckboxGroup name="tipoViolencia" title="Tipo de violencia">
        <Checkbox
          {...suggester.violencia_tipo(LabelDecisiones.V_FISICA)}
          ref={prop(LabelDecisiones.V_FISICA)}
          checked={defaultValue(LabelDecisiones.V_FISICA) as boolean}
        >
          Física
        </Checkbox>
        <Checkbox
          {...suggester.violencia_tipo(LabelDecisiones.V_SEX)}
          ref={prop(LabelDecisiones.V_SEX)}
          checked={defaultValue(LabelDecisiones.V_SEX) as boolean}
        >
          Sexual
        </Checkbox>
        <Checkbox
          {...suggester.violencia_tipo(LabelDecisiones.V_SIMB)}
          ref={prop(LabelDecisiones.V_SIMB)}
          checked={defaultValue(LabelDecisiones.V_SIMB) as boolean}
        >
          Simbólica
        </Checkbox>
        <Checkbox
          {...suggester.violencia_tipo(LabelDecisiones.V_PSIC)}
          ref={prop(LabelDecisiones.V_PSIC)}
          checked={defaultValue(LabelDecisiones.V_PSIC) as boolean}
        >
          Psicológica
        </Checkbox>
        <Checkbox
          {...suggester.violencia_tipo(LabelDecisiones.V_SOC)}
          ref={prop(LabelDecisiones.V_SOC)}
          checked={defaultValue(LabelDecisiones.V_SOC) as boolean}
        >
          Social
        </Checkbox>
        <Checkbox
          {...suggester.violencia_tipo(LabelDecisiones.V_POLIT)}
          ref={prop(LabelDecisiones.V_POLIT)}
          checked={defaultValue(LabelDecisiones.V_POLIT) as boolean}
        >
          Política
        </Checkbox>
        <Checkbox
          {...suggester.violencia_tipo(LabelDecisiones.V_ECON)}
          ref={prop(LabelDecisiones.V_ECON)}
          checked={defaultValue(LabelDecisiones.V_ECON) as boolean}
        >
          Económica
        </Checkbox>
        <Checkbox
          {...suggester.violencia_tipo(LabelDecisiones.V_AMB)}
          ref={prop(LabelDecisiones.V_AMB)}
          checked={defaultValue(LabelDecisiones.V_AMB) as boolean}
        >
          Ambiental
        </Checkbox>
      </CheckboxGroup>
      <Select
        ref={prop(LabelDecisiones.MODALIDAD_DE_LA_VIOLENCIA)}
        {...suggester.select(LabelDecisiones.MODALIDAD_DE_LA_VIOLENCIA)}
        options={json.MODALIDAD_DE_LA_VIOLENCIA}
        label="Modalidad de la violencia"
        selected={
          defaultValue(LabelDecisiones.MODALIDAD_DE_LA_VIOLENCIA) as string
        }
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
        selected={defaultValue(LabelDecisiones.FRECUENCIA_EPISODIOS) as string}
      />
      <Select
        ref={prop(LabelDecisiones.RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE)}
        {...suggester.select(
          LabelDecisiones.RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE
        )}
        options={json.RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE}
        label="Relación y tipo entre acusada y denunciante"
        selected={
          defaultValue(
            LabelDecisiones.RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE
          ) as string
        }
      />
      <Select
        ref={prop(LabelDecisiones.HIJOS_HIJAS_EN_COMUN)}
        {...suggester.select(LabelDecisiones.HIJOS_HIJAS_EN_COMUN)}
        options={json.HIJOS_HIJAS_EN_COMUN}
        label="Hijos/as en común"
        selected={defaultValue(LabelDecisiones.HIJOS_HIJAS_EN_COMUN) as string}
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
        selected={
          defaultValue(
            LabelDecisiones.MEDIDAS_DE_PROTECCION_VIGENTES_AL_MOMENTO_DEL_HECHO
          ) as string
        }
      />
      <Select
        ref={prop(LabelDecisiones.ZONA_DEL_HECHO)}
        {...suggester.select(LabelDecisiones.ZONA_DEL_HECHO)}
        options={json.ZONA_DEL_HECHO}
        label="Zona del hecho"
        selected={defaultValue(LabelDecisiones.ZONA_DEL_HECHO) as string}
      />
      <Select
        ref={prop(LabelDecisiones.LUGAR_DEL_HECHO)}
        {...suggester.select(LabelDecisiones.LUGAR_DEL_HECHO)}
        options={json.LUGAR_DEL_HECHO}
        label="Lugar del hecho"
        selected={defaultValue(LabelDecisiones.LUGAR_DEL_HECHO) as string}
      />
    </ValidationForm>
  );
}
