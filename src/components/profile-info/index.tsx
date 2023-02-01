import { SignOut } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';

import { Button, Stack, Tooltip } from 'components';
import { useLogin, useUser } from 'hooks';
import ProfilePicture from './ProfilePicture';

export default function ProfileInfo() {
  const user = useUser();
  const navigate = useNavigate();

  // Only render ProfilePicture when the user is in online mode
  const hasProfilePicture = !!user?.online;

  const { logout } = useLogin({
    onLogout: () => {
      navigate('/login');
    },
  });

  return (
    <Stack spacing="l">
      {hasProfilePicture && (
        <Tooltip text={`${user?.given_name} ${user?.family_name}`}>
          <ProfilePicture
            src={user?.picture}
            alt="Profile picture"
            referrerPolicy="no-referrer"
            tabIndex={0}
          />
        </Tooltip>
      )}
      <Tooltip text="Cerrar sesión">
        <Button css={{ p: 2 }} onClick={logout}>
          <SignOut size={32}></SignOut>
        </Button>
      </Tooltip>
    </Stack>
  );
}
