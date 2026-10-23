import { useCallback, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react"
import type { FioContext, Gender, Suggestion } from "../index.ts"

/** Синхронный движок ядра или асинхронный фасад ФИО. Хук не создаёт store. */
export interface FormTailEngine {
  suggest(
    input: string,
    options?: { gender?: Gender } & FioContext,
  ): Suggestion | null | Promise<Suggestion | null>
  commit(value: string): void
  filter(input: string): string
  /** Синхронно сообщает новое value до suggest. Связка полей читает его в том же тике. */
  observe?: (value: string) => void
}

export interface UseFormTailOptions {
  engine: FormTailEngine
  context?: FioContext
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  /** Вызывается, когда токен принят и частота уже увеличена. */
  onCommit?: (value: string) => void
}

export interface UseFormTailResult {
  value: string
  /** Хвост, которого ещё нет в value. Пустая строка — подсказки нет. */
  completion: string
  suggestion: Suggestion | null
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onBlur: () => void
}

/**
 * Управляет value и хвостом одного поля.
 * Tab и стрелка вправо принимают хвост только если курсор в конце и IME закрыт.
 * Escape прячет хвост до следующего изменения value.
 * Хвост не записывается в value, пока его не приняли.
 */
export function useFormTail(options: UseFormTailOptions): UseFormTailResult {
  const { engine, context, onChange, onCommit } = options
  const [uncontrolled, setUncontrolled] = useState(options.defaultValue ?? "")
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [hidden, setHidden] = useState(false)
  const request = useRef(0)
  const suggestionRef = useRef<Suggestion | null>(null)
  const engineRef = useRef(engine)
  const contextRef = useRef(context)
  const onChangeRef = useRef(onChange)
  const onCommitRef = useRef(onCommit)
  const valueRef = useRef(options.value ?? options.defaultValue ?? "")
  engineRef.current = engine
  contextRef.current = context
  onChangeRef.current = onChange
  onCommitRef.current = onCommit
  if (options.value !== undefined) valueRef.current = options.value
  const value = options.value ?? uncontrolled

  const publish = useCallback((next: string) => {
    valueRef.current = next
    engineRef.current.observe?.(next)
    if (options.value === undefined) setUncontrolled(next)
    onChangeRef.current?.(next)
  }, [options.value])

  const refresh = useCallback((next: string) => {
    const current = ++request.current
    setHidden(false)
    void Promise.resolve(engineRef.current.suggest(next, contextRef.current)).then(
      (nextSuggestion) => {
        if (current !== request.current) return
        suggestionRef.current = nextSuggestion
        setSuggestion(nextSuggestion)
      },
      () => {
        if (current !== request.current) return
        suggestionRef.current = null
        setSuggestion(null)
      },
    )
  }, [])

  const accept = useCallback(() => {
    const current = suggestionRef.current
    if (current === null || current.completion.length === 0) return false
    publish(current.value)
    engineRef.current.commit(current.value)
    onCommitRef.current?.(current.value)
    suggestionRef.current = null
    setSuggestion(null)
    return true
  }, [publish])

  const commitWholeToken = useCallback((token: string) => {
    if (token.trim().length < 2 || /\s/u.test(token)) return
    engineRef.current.commit(token)
    onCommitRef.current?.(token)
  }, [])

  return {
    value,
    completion: hidden ? "" : (suggestion?.completion ?? ""),
    suggestion: hidden ? null : suggestion,
    onChange(event) {
      const next = engine.filter(event.target.value)
      publish(next)
      refresh(next)
    },
    onKeyDown(event) {
      if (event.nativeEvent.isComposing) return
      if (event.key === "Escape") {
        suggestionRef.current = null
        setHidden(true)
        return
      }
      const atEnd = event.currentTarget.selectionStart === event.currentTarget.value.length
      if (!atEnd || (event.key !== "Tab" && event.key !== "ArrowRight")) return
      if (!accept()) return
      event.preventDefault()
    },
    onBlur() {
      commitWholeToken(valueRef.current)
      setSuggestion(null)
    },
  }
}
