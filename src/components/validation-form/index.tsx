import { CheckCircle } from 'phosphor-react';
import { FormEvent, ReactNode, useState } from 'react';

import { Button, Subtitle } from 'components';
import { useFileDispatch } from 'hooks';
import useForm, { RegisterFunction, FormData } from 'hooks/useForm';
import { appendValidation } from 'reducers/file/actions';
import { NativeComponent } from 'types/component';

import { Form } from './ValidationForm.styles';

interface Props extends NativeComponent<'form', 'children' | 'onSubmit'> {
  children: (
    addInput: (label: string) => {
      ref: ReturnType<RegisterFunction>;
      onChange: () => void;
    }
  ) => ReactNode;
  title: string;
  fileName: string;
  onSubmit?: (formData: FormData, e: FormEvent) => void;
}
export default function ValidationForm({
  children,
  title,
  fileName,
  onSubmit,
  ...props
}: Props) {
  const { register, submit } = useForm();
  const dispatch = useFileDispatch();
  const [checked, setChecked] = useState(false);

  const handleSubmit = submit((data, e) => {
    dispatch(appendValidation(fileName, data));

    onSubmit?.(data, e);
  });

  const handleClick = () => setChecked(true);

  const handleChange = () => {
    if (checked) setChecked(false);
  };

  const addInput = (label: string) => {
    return {
      onChange: handleChange,
      ref: register(label),
    };
  };

  return (
    <Form {...props} onSubmit={handleSubmit}>
      <Subtitle weight="strong">{title}</Subtitle>
      {children(addInput)}
      <Button
        size="s"
        css={{ alignSelf: 'flex-end' }}
        type="submit"
        onClick={handleClick}
        checked={checked}
      >
        Datos correctos
        {checked && <CheckCircle weight="fill" />}
      </Button>
    </Form>
  );
}
