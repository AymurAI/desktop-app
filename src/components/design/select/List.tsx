import type { SelectOption } from ".";
import * as S from "./Select.styles";

interface ListProps {
  options: SelectOption[];
  onClick: (value: SelectOption["value"]) => void;
  onKeyDown: (value: SelectOption["value"]) => void;
}
export function List({ options, onClick, onKeyDown }: ListProps) {
  if (options.length === 0) return null;

  return (
    <S.OptionContainer>
      {options.map(({ value, label }) => (
        <S.Option
          onClick={() => onClick(value)}
          onKeyDown={() => onKeyDown(value)}
          key={value}
        >
          {label}
        </S.Option>
      ))}
    </S.OptionContainer>
  );
}
