import { SignOut } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';

import { Button, Stack } from 'components';
import { useLogin, useUser } from 'hooks';
import ProfilePicture from './ProfilePicture';

export default function ProfileInfo() {
  const user = useUser();
  const navigate = useNavigate();
  
  const { logout } = useLogin({
    onLogout: () => {
      navigate('/login');
    },
  });

  return (
    <Stack spacing="l">
      <ProfilePicture src={user?.picture} referrerPolicy="no-referrer" />
      <Button css={{ p: 2 }} onClick={logout}>
        <SignOut size={32}></SignOut>
      </Button>
    </Stack>
  );
}
