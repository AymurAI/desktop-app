import { useGoogleLogin } from '@react-oauth/google';

function App() {
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log(tokenResponse);
      // fetching userinfo can be done on the client or the server
    },
    // scope: 'https://www.googleapis.com/auth/spreadsheets',
  });

  return (
    <div>
      <h1>Electron App</h1>
      <p>This is the starter code for an Electron desktop app!</p>
      <button onClick={() => googleLogin()}>Login with Google</button>
    </div>
  );
}

export default App;
