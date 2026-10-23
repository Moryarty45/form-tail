import { useMemo, useRef, useState, type CSSProperties, type InputHTMLAttributes } from "react"
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
  onKeyDown,
  onBlur,
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
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (!event.defaultPrevented) field.onKeyDown(event)
        }}
        onBlur={(event) => {
          field.onBlur()
          onBlur?.(event)
        }}
        autoComplete="off"
        aria-autocomplete="none"
        style={{ gridArea: "1 / 1", font: "inherit", letterSpacing: "inherit", padding: "inherit" }}
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
            font: "inherit",
            letterSpacing: "inherit",
            padding: "inherit",
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
 * `FormTailInput` сообщает значение через `observe` в том же тике.
 * `set*` нужны, если значением управляет внешний state.
 */
export function useFioFields(options: UseFioFieldsOptions) {
  const { fio, gender } = options
  const values = useRef({ surname: "", given: "", patronymic: "" })
  const [, redraw] = useState(0)
  const explicit = gender === undefined ? {} : { gender }

  function remember(part: "surname" | "given" | "patronymic", value: string): void {
    values.current = { ...values.current, [part]: value }
    redraw((version) => version + 1)
  }

  function partEngine(
    part: "given" | "patronymic",
    source: FioSuggest["given"],
  ): FormTailEngine {
    return {
      ...source,
      observe(value) {
        values.current = { ...values.current, [part]: value }
      },
      suggest(input: string) {
        const current = values.current
        return source.suggest(input, {
          surname: current.surname,
          given: part === "given" ? input : current.given,
          patronymic: part === "patronymic" ? input : current.patronymic,
          ...explicit,
        })
      },
    }
  }

  return {
    setSurname: (value: string) => {
      remember("surname", value)
    },
    setGiven: (value: string) => {
      remember("given", value)
    },
    setPatronymic: (value: string) => {
      remember("patronymic", value)
    },
    surname: {
      ...fio.surname,
      observe(value: string) {
        values.current = { ...values.current, surname: value }
      },
    } satisfies FormTailEngine,
    given: partEngine("given", fio.given),
    patronymic: partEngine("patronymic", fio.patronymic),
  }
}
