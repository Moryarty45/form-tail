import type { LexiconEntry, NamePart } from "../core/types.ts"
import { bucketLetters } from "./buckets/manifest.ts"

interface BucketModule {
  default: readonly LexiconEntry[]
}

function bucketLoaders(part: NamePart): Record<string, () => Promise<BucketModule>> {
  switch (part) {
    case "surname":
      return {
        /* surname-loaders */
        а: () => import("./buckets/surname/а"),
        б: () => import("./buckets/surname/б"),
        в: () => import("./buckets/surname/в"),
        г: () => import("./buckets/surname/г"),
        д: () => import("./buckets/surname/д"),
        е: () => import("./buckets/surname/е"),
        ж: () => import("./buckets/surname/ж"),
        з: () => import("./buckets/surname/з"),
        и: () => import("./buckets/surname/и"),
        к: () => import("./buckets/surname/к"),
        л: () => import("./buckets/surname/л"),
        м: () => import("./buckets/surname/м"),
        н: () => import("./buckets/surname/н"),
        о: () => import("./buckets/surname/о"),
        п: () => import("./buckets/surname/п"),
        р: () => import("./buckets/surname/р"),
        с: () => import("./buckets/surname/с"),
        т: () => import("./buckets/surname/т"),
        у: () => import("./buckets/surname/у"),
        ф: () => import("./buckets/surname/ф"),
        х: () => import("./buckets/surname/х"),
        ц: () => import("./buckets/surname/ц"),
        ч: () => import("./buckets/surname/ч"),
        ш: () => import("./buckets/surname/ш"),
        щ: () => import("./buckets/surname/щ"),
        э: () => import("./buckets/surname/э"),
        ю: () => import("./buckets/surname/ю"),
        я: () => import("./buckets/surname/я"),
      }
    case "given":
      return {
        /* given-loaders */
        а: () => import("./buckets/given/а"),
        б: () => import("./buckets/given/б"),
        в: () => import("./buckets/given/в"),
        г: () => import("./buckets/given/г"),
        д: () => import("./buckets/given/д"),
        е: () => import("./buckets/given/е"),
        ж: () => import("./buckets/given/ж"),
        з: () => import("./buckets/given/з"),
        и: () => import("./buckets/given/и"),
        й: () => import("./buckets/given/й"),
        к: () => import("./buckets/given/к"),
        л: () => import("./buckets/given/л"),
        м: () => import("./buckets/given/м"),
        н: () => import("./buckets/given/н"),
        о: () => import("./buckets/given/о"),
        п: () => import("./buckets/given/п"),
        р: () => import("./buckets/given/р"),
        с: () => import("./buckets/given/с"),
        т: () => import("./buckets/given/т"),
        у: () => import("./buckets/given/у"),
        ф: () => import("./buckets/given/ф"),
        х: () => import("./buckets/given/х"),
        ц: () => import("./buckets/given/ц"),
        ч: () => import("./buckets/given/ч"),
        ш: () => import("./buckets/given/ш"),
        э: () => import("./buckets/given/э"),
        ю: () => import("./buckets/given/ю"),
        я: () => import("./buckets/given/я"),
      }
    case "patronymic":
      return {
        /* patronymic-loaders */
        а: () => import("./buckets/patronymic/а"),
        б: () => import("./buckets/patronymic/б"),
        в: () => import("./buckets/patronymic/в"),
        г: () => import("./buckets/patronymic/г"),
        д: () => import("./buckets/patronymic/д"),
        е: () => import("./buckets/patronymic/е"),
        з: () => import("./buckets/patronymic/з"),
        и: () => import("./buckets/patronymic/и"),
        к: () => import("./buckets/patronymic/к"),
        л: () => import("./buckets/patronymic/л"),
        м: () => import("./buckets/patronymic/м"),
        н: () => import("./buckets/patronymic/н"),
        о: () => import("./buckets/patronymic/о"),
        п: () => import("./buckets/patronymic/п"),
        р: () => import("./buckets/patronymic/р"),
        с: () => import("./buckets/patronymic/с"),
        т: () => import("./buckets/patronymic/т"),
        ф: () => import("./buckets/patronymic/ф"),
        э: () => import("./buckets/patronymic/э"),
        ю: () => import("./buckets/patronymic/ю"),
        я: () => import("./buckets/patronymic/я"),
      }
  }
}

const loaders: Record<NamePart, Record<string, () => Promise<BucketModule>>> = {
  surname: bucketLoaders("surname"),
  given: bucketLoaders("given"),
  patronymic: bucketLoaders("patronymic"),
}

const cache = new Map<string, Promise<readonly LexiconEntry[]>>()

/**
 * Грузит одну корзину `часть + первая буква`.
 * Буква вне кириллицы и пустая корзина дают пустой список.
 * Повторный вызов той же корзины не импортирует модуль снова.
 */
export function loadRuBucket(
  part: NamePart,
  letter: string,
): Promise<readonly LexiconEntry[]> {
  const key = `${part}:${letter}`
  const cached = cache.get(key)
  if (cached !== undefined) return cached
  const loader = loaders[part][letter]
  if (loader === undefined) return Promise.resolve([])
  const pending = loader().then((module) => module.default)
  cache.set(key, pending)
  return pending
}

/** Буквы, для которых в поставке есть хотя бы одна корзина. */
export function ruBucketLetters(): readonly string[] {
  return [...new Set([...bucketLetters.surname, ...bucketLetters.given, ...bucketLetters.patronymic])]
}

export const ruLexicons = {
  load: loadRuBucket,
}
