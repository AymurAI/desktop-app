import { House, Info } from "phosphor-react";

import { Button, Stack } from "@/components";
import { useLogin } from "@/hooks";
import { styled } from "@/styles";
import { FunctionType } from "@/types/user";
import { useNavigate } from "react-router-dom";
const Anchor = styled("a", {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export default function ProfileInfo() {
  const navigate = useNavigate();
  const { login } = useLogin({
    onLogout: () => {
      navigate("/login");
    },
  });

  return (
    <Stack spacing="l" align="center">
      <Button css={{ p: 2 }} onClick={() => login.offline(FunctionType.NULL)}>
        <House size={32} />
      </Button>
      <Anchor href="https://www.aymurai.info/" target="_blank" rel="noreferrer">
        <Info size={32} />
      </Anchor>
    </Stack>
  );
}
