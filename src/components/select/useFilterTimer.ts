import { useEffect, useRef, useState } from 'react';
import type { SelectOption } from '.';

type Timeout = ReturnType<typeof setTimeout>;

interface Props {
  options: SelectOption[];
  updateValue: (id: SelectOption['id']) => void;
}
export default function useFilterTimer(
  options: Props['options'],
  updateValue: Props['updateValue']
) {
  const [filter, setFilter] = useState<string>('');
  const timerRef = useRef<Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clear the filter state
  const clearFilter = () => setFilter('');

  // Generate regex expression based on a word
  const getRegex = () => new RegExp(`\\b${filter}\\w*`, 'gi');

  const scrollToOption = () => {
    if (containerRef.current === null) return;

    // Convert NodeList to Array
    const nodeList = containerRef.current.querySelectorAll('li');
    const items = Array.from(nodeList);

    if (items.length === 0) return;

    const regex = getRegex();
    const filtered = items.filter((item) => item.textContent?.match(regex));
    const first = filtered[0];
    console.log(first);

    if (first) {
      first.scrollIntoView({
        block: 'nearest',
        inline: 'center',
      });
      first.focus();
    }
  };

  const selectOption = () => {
    const regex = getRegex();

    const filtered = options.filter(({ text }) => text.match(regex));
    const firstOption = filtered[0];

    if (firstOption) updateValue(firstOption.id);
  };

  useEffect(() => {
    // Reset timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(clearFilter, 500);

    if (!filter) return;

    // Set filtered option
    selectOption();
    // Scroll to that option
    scrollToOption();
  }, [filter]);

  const handleFilterChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = e;
    if (key === ' ') e.preventDefault();

    // If the pressed key is not a letter, return
    if (key.length > 1) return;

    // Set filter value
    setFilter((prev) => `${prev}${key}`);
  };

  return {
    ref: containerRef,
    onKeyDown: handleFilterChange,
  };
}
