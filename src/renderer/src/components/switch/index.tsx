import { styled } from "@/styles/stitches.config";

const Pill = styled("div", {
  position: "relative",
  width: 32,
  height: 19,
  borderRadius: 100,
  flexShrink: 0,
  transition: "background-color $transitions$s",
  cursor: "pointer",

  variants: {
    checked: {
      true: {
        backgroundColor: "$secondary",
      },
      false: {
        backgroundColor: "$bgSecondaryAlt",
      },
    },
  },
  defaultVariants: {
    checked: false,
  },
});

const Thumb = styled("div", {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 12,
  height: 12,
  borderRadius: "50%",
  backgroundColor: "$white",
  transition: "left $transitions$s",

  variants: {
    checked: {
      true: {
        left: "calc(100% - 14px)",
      },
      false: {
        left: 3,
      },
    },
  },
  defaultVariants: {
    checked: false,
  },
});

const SwitchLabel = styled("label", {
  fontFamily: "$primary",
  fontWeight: "$default",
  fontSize: "$paragraphsSm",
  lineHeight: "$paragraphsSm",
  color: "$textDefault",
  cursor: "pointer",
  userSelect: "none",
});

const SwitchRoot = styled("div", {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
});

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  id?: string;
}

function Switch({ checked, onCheckedChange, label, id }: SwitchProps) {
  const handleToggle = () => {
    onCheckedChange(!checked);
  };

  return (
    <SwitchRoot onClick={handleToggle}>
      <Pill checked={checked} role="switch" aria-checked={checked} id={id}>
        <Thumb checked={checked} />
      </Pill>
      {label && <SwitchLabel htmlFor={id}>{label}</SwitchLabel>}
    </SwitchRoot>
  );
}

export default Switch;
