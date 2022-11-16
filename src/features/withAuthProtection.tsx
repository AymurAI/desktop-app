import { useGoogleToken } from 'hooks';
import { ComponentType, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * High order component that adds auth protection / private routes to a component
 * @param Component
 * @returns
 */
export default function withAuthProtection<T extends JSX.IntrinsicAttributes>(
  Component: ComponentType<T>
) {
  return (props: T) => {
    const token = useGoogleToken();
    const navigate = useNavigate();

    // Check if a token is stored on the app
    useEffect(() => {
      if (!token || token === '') {
        navigate('/login');
      }
    }, [token, navigate]);

    return <Component {...props}></Component>;
  };
}
