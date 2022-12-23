import { Input, ValidationForm } from 'components';
import { LabelType } from 'types/aymurai';
import { FormProps } from '../FormGroup.types';

export default function InfoGral({
  fileName,
  getValue,
  getSuggestion,
}: FormProps) {
  return (
    <ValidationForm title='Información general' fileName={fileName}>
      {(register) => (
        <>
          <Input
            {...register(LabelType.N)}
            suggestion={getSuggestion(LabelType.N)}
            defaultValue={getValue(LabelType.N)}
            label='Número'
            type='number'
          />
          <Input
            {...register(LabelType.NRO_REGISTRO)}
            suggestion={getSuggestion(LabelType.NRO_REGISTRO)}
            defaultValue={getValue(LabelType.NRO_REGISTRO)}
            label='Número de registro'
            type='number'
          />
          <Input
            {...register(LabelType.TOMO)}
            suggestion={getSuggestion(LabelType.TOMO)}
            defaultValue={getValue(LabelType.TOMO)}
            label='Tomo'
            type='number'
          />
          <Input
            {...register(LabelType.FECHA_RESOLUCION)}
            suggestion={getSuggestion(LabelType.FECHA_RESOLUCION)}
            defaultValue={getValue(LabelType.FECHA_RESOLUCION)}
            label='Fecha de resolución'
          />
          <Input
            {...register(LabelType.N_EXPTE_EJE)}
            suggestion={getSuggestion(LabelType.N_EXPTE_EJE)}
            defaultValue={getValue(LabelType.N_EXPTE_EJE)}
            label='Nro de expediente'
            type='number'
          />
          <Input
            {...register(LabelType.FIRMA)}
            suggestion={getSuggestion(LabelType.FIRMA)}
            defaultValue={getValue(LabelType.FIRMA)}
            label='Firma'
          />
        </>
      )}
    </ValidationForm>
  );
}
