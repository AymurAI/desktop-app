import { forwardRef } from 'react';

import { CSS } from 'styles';
import { NativeComponent } from 'types/component';
import { WHITELISTED_EXTENSIONS } from 'utils/config';
import Input from './HiddenInput.styles';

interface Props extends NativeComponent<'input'> {
  css?: CSS;
}

export default forwardRef<HTMLInputElement, Props>(function HiddenInput(
  { multiple = true, ...props },
  ref
) {
  // Convert the array into a '.dcox' form
  const extensions = WHITELISTED_EXTENSIONS.map((ext) => `.${ext}`).join(',');

  return (
    <Input
      type="file"
      accept={extensions}
      multiple={multiple}
      tabIndex={-1}
      {...props}
      ref={ref}
    ></Input>
  );
});
