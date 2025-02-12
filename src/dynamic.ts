import { collectionNames } from "../types"
import { generateComponent, getIconCollections } from "./core"

import type { CollectionNames } from "../types"
import type { GenerateOptions } from "./core"
import type { IconifyJSON } from "@iconify/types"

let cache = new Map<CollectionNames, IconifyJSON>()

function getIconCollection(name: CollectionNames) {
  let cached = cache.get(name)
  if (cached) return cached

  let collection = getIconCollections([name])[name]
  if (collection) cache.set(name, collection)
  return collection
}

export function getDynamicCSSRules(
  icon: string,
  options: GenerateOptions,
): Record<string, string> {
  let nameParts = icon.split(/--|\:/)
  if (nameParts.length !== 2) {
    throw new Error(`Invalid icon name: "${icon}"`)
  }

  let prefix = nameParts[0]
  let name = nameParts[1]!
  if (!collectionNames.includes(prefix as CollectionNames)) {
    throw new Error(`Invalid collection name: "${prefix}"`)
  }

  let icons = getIconCollection(prefix as CollectionNames)

  let generated = generateComponent(
    {
      icons,
      name,
    },
    options,
  )
  if (!generated) {
    throw new Error(`Invalid icon name: "${icon}"`)
  }

  return generated
}
