import { useEffect, useState } from 'react'

type LocalStorageOptions<T> = {
  parse?: (raw: unknown) => T
  serialize?: (value: T) => string
}

export function useLocalStorageState<T>(
  key: string,
  initialValue: T | (() => T),
  options: LocalStorageOptions<T> = {},
) {
  const resolveInitialValue = () =>
    typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue

  const [value, setValue] = useState<T>(() => {
    const fallback = resolveInitialValue()

    if (typeof window === 'undefined') {
      return fallback
    }

    try {
      const storedValue = window.localStorage.getItem(key)
      if (!storedValue) {
        return fallback
      }

      const parsed = JSON.parse(storedValue) as unknown
      return options.parse ? options.parse(parsed) : (parsed as T)
    } catch {
      return fallback
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const serialized = options.serialize ? options.serialize(value) : JSON.stringify(value)
      window.localStorage.setItem(key, serialized)
    } catch {
      // Ignore storage errors so the UI stays usable even when storage is blocked or full.
    }
  }, [key, options, value])

  return [value, setValue] as const
}
