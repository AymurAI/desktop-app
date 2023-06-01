import { useEffect } from 'react';

/**
 * Hook to scroll to the searched word
 * @param count Count of words found in the html
 */
export default function useScroll(count: number) {
  const scrollToComponent = (n: number) => {
    const index = n - 1;
    const components = document.querySelectorAll('mark.searched-word');
    if (components.length === 0 || components.length < n) return;

    components[index].scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  };

  useEffect(() => {
    scrollToComponent(count);
  }, [count]);
}
