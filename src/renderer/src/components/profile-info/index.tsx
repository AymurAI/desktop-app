import { House, Info } from "phosphor-react";
import { useNavigate } from "react-router-dom";

import { Button, Stack } from "@/components";
import { styled } from "@/styles";

const Anchor = styled("a", {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export default function ProfileInfo() {
  const navigate = useNavigate();

  const handleLogout = () => navigate("/login/features");

  return (
    <Stack spacing="l" align="center">
      <Button css={{ p: 2 }} onClick={handleLogout}>
        <House size={32} />
      </Button>
      <Anchor href="https://www.aymurai.info/" target="_blank" rel="noreferrer">
        <Info size={32} />
      </Anchor>
    </Stack>
  );
}
