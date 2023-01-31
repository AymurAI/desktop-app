import { keyframes, styled } from 'styles';

const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

const SVG = styled('svg', {
  animation: `${spin} 1s linear infinite`,
});
