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

  const clearFilter = () => {
    setFilter('');
  };

  const selectOption = () => {
    if (!filter) return;

    const regex = new RegExp(`\\b${filter}\\w*`, 'gi');

    const filtered = options.filter(({ text }) => text.match(regex));
    const firstOption = filtered[0];

    if (firstOption) updateValue(firstOption.id);
  };

  useEffect(() => {
    // Reset timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(clearFilter, 500);

    // Set filtered option
    selectOption();
  }, [filter]);

  const handleFilterChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const { key } = e;
    // If the pressed key is not a letter, return
    if (key.length > 1) return;

    console.log('key', key, key === ' ');

    // Set filter value
    setFilter((prev) => `${prev}${key}`);
  };

  return handleFilterChange;
}
