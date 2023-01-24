import { useUser } from 'hooks';
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
    const user = useUser();
    const navigate = useNavigate();

    // Check if a token is stored on the app
    useEffect(() => {
      if (!user) {
        navigate('/login');
      }
    }, [user, navigate]);

    return <Component {...props}></Component>;
  };
}
