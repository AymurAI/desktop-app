import { ComponentRef, SelectRefValue } from './types';

/**
 * Checks if the passed reference belongs to a `Select` component or not
 * @param ref Reference to a component's value
 * @returns `true` if the component we are referring to is a `Select`, `false` otherwise
 */
export function isSelect(ref: ComponentRef): ref is SelectRefValue {
  return !!ref && typeof ref.value === 'object';
}
