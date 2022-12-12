import { Input, ValidationForm } from 'components';
import { LabelType } from 'types/aymurai';
import { FormProps } from '../FormGroup.types';

export default function InfoGral({
  fileName,
  getValue,
  getSuggestion,
}: FormProps) {
  return (
    <ValidationForm title="Información general" fileName={fileName}>
      {(register) => (
        <>
          <Input
            {...register(LabelType.FECHA_RESOLUCION)}
            suggestion={getSuggestion(LabelType.FECHA_RESOLUCION)}
            defaultValue={getValue(LabelType.FECHA_RESOLUCION)}
            label="Fecha de resolución"
          />
          <Input
            {...register(LabelType.N_EXPTE_EJE)}
            suggestion={getSuggestion(LabelType.N_EXPTE_EJE)}
            defaultValue={getValue(LabelType.N_EXPTE_EJE)}
            label="Nro de expediente"
          />
          <Input
            {...register(LabelType.FIRMA)}
            suggestion={getSuggestion(LabelType.FIRMA)}
            defaultValue={getValue(LabelType.FIRMA)}
            label="Firma"
          />
        </>
      )}
    </ValidationForm>
  );
}
