import { Input, ValidationForm } from 'components';
import { LabelType } from 'types/aymurai';
import { FormProps } from '../FormGroup.types';

export default function InfoGral({
  getSuggestion,
  onSubmit,
  register,
}: FormProps) {
  return (
    <ValidationForm title="Información general" onSubmit={onSubmit}>
      <Input
        ref={register(LabelType.N)}
        suggestion={getSuggestion(LabelType.N)}
        label="Número"
        type="number"
      />
      <Input
        ref={register(LabelType.NRO_REGISTRO)}
        suggestion={getSuggestion(LabelType.NRO_REGISTRO)}
        label="Número de registro"
        type="number"
      />
      <Input
        ref={register(LabelType.TOMO)}
        suggestion={getSuggestion(LabelType.TOMO)}
        label="Tomo"
        type="number"
      />
      <Input
        ref={register(LabelType.FECHA_RESOLUCION)}
        suggestion={getSuggestion(LabelType.FECHA_RESOLUCION)}
        label="Fecha de resolución"
      />
      <Input
        ref={register(LabelType.N_EXPTE_EJE)}
        suggestion={getSuggestion(LabelType.N_EXPTE_EJE)}
        label="Nro de expediente"
        type="number"
      />
      <Input
        ref={register(LabelType.FIRMA)}
        suggestion={getSuggestion(LabelType.FIRMA)}
        label="Firma"
      />
    </ValidationForm>
  );
}
