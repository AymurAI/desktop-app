import { ComponentType, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useFiles, useStepper } from 'hooks';

/**
 * High order component that adds protection to ensure some files are loaded
 * @param Component
 * @returns
 */
export default function withFileProtection<T extends JSX.IntrinsicAttributes>(
  Component: ComponentType<T>
) {
  return (props: T) => {
    const { files } = useFiles();
    const navigate = useNavigate();
    const { resetStepper } = useStepper();

    // Check if any file has been selected
    useEffect(() => {
      if (!files || files.length === 0) {
        resetStepper();
        navigate('/onboarding');
      }
    }, [files, navigate, resetStepper]);

    return <Component {...props}></Component>;
  };
}
