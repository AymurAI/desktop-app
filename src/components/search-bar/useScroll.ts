import { useEffect, useRef } from 'react';

const SCROLL_DEBOUNCE = 300;

/**
 * Hook to scroll to the searched word
 * @param count Count of words found in the html
 */
export default function useScroll(count: number, word: string) {
  const timer = useRef<number | null>(null);

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

  const clear = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => {
    if (word.length >= 2) {
      setTimeout(() => scrollToComponent(1), SCROLL_DEBOUNCE);
    }
    return () => clear();
  }, [word]);

  useEffect(() => {
    setTimeout(() => scrollToComponent(count), SCROLL_DEBOUNCE);
    return () => clear();
  }, [count]);
}
