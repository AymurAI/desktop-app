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
import { LabelType } from 'types/aymurai';
import { FormProps } from '../FormGroup.types';
import json from './options.json';

export default function DatosDenunciante({
  fileName,
  getValue,
  getSuggestion,
  getChecked,
}: FormProps) {
  const [frasesAgresion, setFrasesAgresion] = useState(1);

  const newFraseAgresion = () => setFrasesAgresion(frasesAgresion + 1);

  const frasesArray = Array.from(Array(frasesAgresion).keys());
  const fraseName = (i: number) => `${LabelType.FRASES_AGRESION}${i}`;

  return (
    <ValidationForm title="Información del hecho" fileName={fileName}>
      {(register) => (
        <>
          <Select
            {...register(LabelType.MATERIA)}
            selected={getValue(LabelType.MATERIA)}
            suggestion={getSuggestion(LabelType.MATERIA)}
            options={json.MATERIA}
            label="Materia"
          />
          <Select
            {...register(LabelType.ART_INFRINGIDO)}
            selected={getValue(LabelType.ART_INFRINGIDO)}
            suggestion={getSuggestion(LabelType.ART_INFRINGIDO)}
            label="Artículo infringido"
            options={json.ART_INFRINGIDO}
          />
          <Select
            {...register(LabelType.CODIGO_O_LEY)}
            selected={getValue(LabelType.CODIGO_O_LEY)}
            suggestion={getSuggestion(LabelType.CODIGO_O_LEY)}
            label="Código o ley"
            options={json.CODIGO_O_LEY}
          />
          <Select
            {...register(LabelType.CONDUCTA)}
            selected={getValue(LabelType.CONDUCTA)}
            suggestion={getSuggestion(LabelType.CONDUCTA)}
            label="Conducta"
            options={json.CONDUCTA}
          />
          <Select
            {...register(LabelType.CONDUCTA_DESCRIPCION)}
            selected={getValue(LabelType.CONDUCTA_DESCRIPCION)}
            suggestion={getSuggestion(LabelType.CONDUCTA_DESCRIPCION)}
            label="Descripción de la conducta"
            options={json.CONDUCTA_DESCRIPCION}
          />
          <RadioGroup name="violenciaGenero" label="Violencia de género">
            <Radio
              checked={getSuggestion(LabelType.VIOLENCIA_DE_GENERO) === 'si'}
              {...register(LabelType.VIOLENCIA_DE_GENERO_SI)}
            >
              Sí
            </Radio>
            <Radio
              checked={getSuggestion(LabelType.VIOLENCIA_DE_GENERO) === 'no'}
              {...register(LabelType.VIOLENCIA_DE_GENERO_NO)}
            >
              No
            </Radio>
          </RadioGroup>
          <CheckboxGroup name="tipoViolencia" title="Tipo de violencia">
            <Checkbox
              checked={getChecked(LabelType.V_FISICA)}
              {...register(LabelType.V_FISICA)}
            >
              Física
            </Checkbox>
            <Checkbox
              {...register(LabelType.V_SEX)}
              checked={getChecked(LabelType.V_SEX)}
            >
              Sexual
            </Checkbox>
            <Checkbox
              {...register(LabelType.V_SIMB)}
              checked={getChecked(LabelType.V_SIMB)}
            >
              Simbólica
            </Checkbox>
            <Checkbox
              {...register(LabelType.V_PSIC)}
              checked={getChecked(LabelType.V_PSIC)}
            >
              Psicológica
            </Checkbox>
            <Checkbox
              {...register(LabelType.V_SOC)}
              checked={getChecked(LabelType.V_SOC)}
            >
              Social
            </Checkbox>
            <Checkbox
              {...register(LabelType.V_POLIT)}
              checked={getChecked(LabelType.V_POLIT)}
            >
              Política
            </Checkbox>
            <Checkbox
              {...register(LabelType.V_ECON)}
              checked={getChecked(LabelType.V_ECON)}
            >
              Económica
            </Checkbox>
            <Checkbox
              {...register(LabelType.V_AMB)}
              checked={getChecked(LabelType.V_AMB)}
            >
              Ambiental
            </Checkbox>
          </CheckboxGroup>
          <Select
            {...register(LabelType.MODALIDAD_DE_LA_VIOLENCIA)}
            selected={getValue(LabelType.MODALIDAD_DE_LA_VIOLENCIA)}
            suggestion={getSuggestion(LabelType.MODALIDAD_DE_LA_VIOLENCIA)}
            options={json.MODALIDAD_DE_LA_VIOLENCIA}
            label="Modalidad de la violencia"
          />
          <Stack direction="column" spacing="m" align="stretch">
            {frasesArray.map((i) => (
              <Input
                key={i}
                prefix={frasesArray.length > 1 ? i + 1 : undefined}
                {...register(fraseName(i))}
                defaultValue={getValue(fraseName(i))}
                suggestion={getSuggestion(fraseName(i))}
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
            {...register(LabelType.FRECUENCIA_EPISODIOS)}
            selected={getValue(LabelType.FRECUENCIA_EPISODIOS)}
            suggestion={getSuggestion(LabelType.FRECUENCIA_EPISODIOS)}
            options={json.FRECUENCIA_EPISODIOS}
            label="Frecuencia del episodio"
          />
          <Select
            {...register(LabelType.RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE)}
            selected={getValue(
              LabelType.RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE
            )}
            suggestion={getSuggestion(
              LabelType.RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE
            )}
            options={json.RELACION_Y_TIPO_ENTRE_ACUSADO_Y_DENUNCIANTE}
            label="Relación y tipo entre acusada y denunciante"
          />
          <Select
            {...register(LabelType.HIJOS_HIJAS_EN_COMUN)}
            selected={getValue(LabelType.HIJOS_HIJAS_EN_COMUN)}
            suggestion={getSuggestion(LabelType.HIJOS_HIJAS_EN_COMUN)}
            options={json.HIJOS_HIJAS_EN_COMUN}
            label="Hijos/as en común"
          />
          <Select
            {...register(
              LabelType.MEDIDAS_DE_PROTECCION_VIGENTES_AL_MOMENTO_DEL_HECHO
            )}
            selected={getValue(
              LabelType.MEDIDAS_DE_PROTECCION_VIGENTES_AL_MOMENTO_DEL_HECHO
            )}
            suggestion={getSuggestion(
              LabelType.MEDIDAS_DE_PROTECCION_VIGENTES_AL_MOMENTO_DEL_HECHO
            )}
            options={json.MEDIDAS_DE_PROTECCION_VIGENTES_AL_MOMENTO_DEL_HECHO}
            label="Medidas de proteccion vigentes al momento del hecho"
          />
          <Select
            {...register(LabelType.ZONA_DEL_HECHO)}
            selected={getValue(LabelType.ZONA_DEL_HECHO)}
            suggestion={getSuggestion(LabelType.ZONA_DEL_HECHO)}
            options={json.ZONA_DEL_HECHO}
            label="Zona del hecho"
          />
          <Select
            {...register(LabelType.LUGAR_DEL_HECHO)}
            selected={getValue(LabelType.LUGAR_DEL_HECHO)}
            suggestion={getSuggestion(LabelType.LUGAR_DEL_HECHO)}
            options={json.LUGAR_DEL_HECHO}
            label="Lugar del hecho"
          />
        </>
      )}
    </ValidationForm>
  );
}
