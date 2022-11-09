import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';

import google from 'services/google';

function App() {
  const [title, setTitle] = useState<string | null>(null);
  const googleLogin = useGoogleLogin({
    onSuccess: async (res) => {
      const data = await google(res.access_token)
        // ID of the dataset
        .spreadsheet('1uAi-Yfq-rJl_cqQaVe9Fv1rLlBJcmEtDpUB0NTOrLAs')
        .data();

      console.log(data);
      setTitle(data.properties.title);
    },
  });

  return (
    <div>
      <h1>Electron App</h1>
      <p>This is the starter code for an Electron desktop app!</p>
      <button onClick={() => googleLogin()}>Login with Google</button>
      <p>
        Recibido el spreadsheet: <code>{title ?? '-'}</code>
      </p>
    </div>
  );
}

export default App;
