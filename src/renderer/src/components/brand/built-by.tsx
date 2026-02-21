import { DATAGENERO_URL } from "@/constants";
import { styled } from "@/styled/jsx";
import { type StackStyles, stack } from "@/styled/patterns";

interface BuiltByProps {
  size?: number;
  gap?: StackStyles["gap"];
}
export default function BuiltBy({ size = 150, gap = "2" }: BuiltByProps) {
  return (
    <a
      className={stack({ gap, align: "center" })}
      href={DATAGENERO_URL}
      target="_blank"
      rel="noreferrer"
    >
      <styled.p textStyle="label.sm.default" color="text.lighter">
        Plataforma hecha por
      </styled.p>
      <img src="/brand/datagenero.svg" alt="DataGenero isologo" width={size} />
    </a>
  );
}
