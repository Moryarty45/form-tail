import { useMemo, useState, type CSSProperties, type InputHTMLAttributes } from "react"
import type { FioSuggest, Gender } from "../index.ts"
import { useFormTail, type FormTailEngine, type UseFormTailOptions } from "./use-form-tail.ts"

export interface FormTailInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange">,
    UseFormTailOptions {
  completionClassName?: string
}

/**
 * Обычный input и хвост поверх него.
 * Хвост не входит в value, пока его не приняли, и не попадает в имя поля.
 */
export function FormTailInput({
  engine,
  context,
  value,
  defaultValue,
  onChange,
  onCommit,
  completionClassName,
  className,
  style,
  ...inputProps
}: FormTailInputProps) {
  const field = useFormTail({
    engine,
    ...(context === undefined ? {} : { context }),
    ...(value === undefined ? {} : { value }),
    ...(defaultValue === undefined ? {} : { defaultValue }),
    ...(onChange === undefined ? {} : { onChange }),
    ...(onCommit === undefined ? {} : { onCommit }),
  })
  const shell = useMemo<CSSProperties>(
    () => ({ display: "grid", ...style }),
    [style],
  )

  return (
    <span className={className} style={shell}>
      <input
        {...inputProps}
        value={field.value}
        onChange={field.onChange}
        onKeyDown={field.onKeyDown}
        onBlur={field.onBlur}
        autoComplete="off"
        aria-autocomplete="none"
        style={{ gridArea: "1 / 1" }}
      />
      {field.completion.length > 0 ? (
        <span
          aria-hidden="true"
          className={completionClassName}
          style={{
            gridArea: "1 / 1",
            pointerEvents: "none",
            color: "var(--form-tail-completion, #8a8f98)",
            whiteSpace: "pre",
          }}
        >
          <span style={{ visibility: "hidden" }}>{field.value}</span>
          {field.completion}
        </span>
      ) : null}
    </span>
  )
}

export interface UseFioFieldsOptions {
  fio: FioSuggest
  /** Явный пол формы. Перекрывает вывод по имени и отчеству. */
  gender?: Gender
}

/**
 * Связывает три части одной формы для пола.
 * Частоты остаются в store, который хост передал в `createFioSuggest`.
 * Перед подсказкой вызывайте `setGiven` и `setPatronymic` из `onChange` полей.
 */
export function useFioFields(options: UseFioFieldsOptions) {
  const { fio, gender } = options
  const [surname, setSurname] = useState("")
  const [given, setGiven] = useState("")
  const [patronymic, setPatronymic] = useState("")
  const explicit = gender === undefined ? {} : { gender }
  const context = { surname, ...explicit }

  return {
    setSurname,
    setGiven,
    setPatronymic,
    surname: fio.surname,
    given: {
      ...fio.given,
      suggest(input: string) {
        return fio.given.suggest(input, { ...context, patronymic })
      },
    } satisfies FormTailEngine,
    patronymic: {
      ...fio.patronymic,
      suggest(input: string) {
        return fio.patronymic.suggest(input, { ...context, given })
      },
    } satisfies FormTailEngine,
  }
}
