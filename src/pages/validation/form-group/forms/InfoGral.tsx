import { Input, ValidationForm } from 'components';
import { LabelType } from 'types/aymurai';
import { FormProps } from '../FormGroup.types';
import { suggest } from 'utils/predictions';

export default function InfoGral({
  getSuggestion,
  onSubmit,
  register,
  predictions,
}: FormProps) {
  return (
    <ValidationForm title="Información general" onSubmit={onSubmit}>
      <Input
        ref={register(LabelType.N)}
        {...suggest(predictions).text(LabelType.N)}
        label="Número"
        type="number"
      />
      <Input
        ref={register(LabelType.NRO_REGISTRO)}
        {...suggest(predictions).text(LabelType.NRO_REGISTRO)}
        label="Número de registro"
        type="number"
      />
      <Input
        ref={register(LabelType.TOMO)}
        {...suggest(predictions).text(LabelType.TOMO)}
        label="Tomo"
        type="number"
      />
      <Input
        ref={register(LabelType.FECHA_RESOLUCION)}
        {...suggest(predictions).text(LabelType.FECHA_RESOLUCION)}
        label="Fecha de resolución"
      />
      <Input
        ref={register(LabelType.N_EXPTE_EJE)}
        {...suggest(predictions).text(LabelType.N_EXPTE_EJE)}
        label="Nro de expediente"
        type="number"
      />
      <Input
        ref={register(LabelType.FIRMA)}
        {...suggest(predictions).text(LabelType.FIRMA)}
        label="Firma"
      />
    </ValidationForm>
  );
}
