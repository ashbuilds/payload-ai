/**
 * Shared onChange handler for Payload SelectInput components.
 * Handles both object options `{ value: string }` and raw string values.
 */
export function handleSelectChange(
  setValue: (value: unknown) => void,
  option: unknown,
): void {
  if (option && typeof option === 'object' && 'value' in option) {
    setValue((option as { value: string }).value)
  } else {
    setValue(option)
  }
}
