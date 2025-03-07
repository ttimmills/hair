import fs from "fs"
import { createRequire } from "module"
import path from "path"
import { getIconCSS, getIconData } from "@iconify/utils"

import { callerPath } from "./utils"

import type { CollectionNames } from "../types"
import type { IconifyIcon, IconifyJSON } from "@iconify/types"

export type GenerateOptions = {
  /**
   * Scale relative to the current font size (1em).
   *
   * @default 1
   */
  scale?: number
  /**
   * Extra CSS properties applied to the generated CSS.
   *
   * @default `{}`
   */
  extraProperties?: Record<string, string>

  /**
   * Stroke width applied to the generated CSS.
   *
   * @default `undefined`
   */
  strokeWidth?: number
}

declare let TSUP_FORMAT: "esm" | "cjs"
let req =
  typeof TSUP_FORMAT === "undefined" || TSUP_FORMAT === "cjs"
    ? require
    : createRequire(import.meta.url)

export let localResolve = (cwd: string, id: string) => {
  try {
    let resolved = req.resolve(id, { paths: [cwd] })
    return resolved
  } catch {
    return null
  }
}

export let isPackageExists = (id: string) => {
  let p = callerPath()
  let cwd = p ? path.dirname(p) : process.cwd()
  return Boolean(localResolve(cwd, id))
}

export function getIconCollections<T extends CollectionNames>(
  include: T[] | "all",
): Record<T, IconifyJSON> | Record<string, never> {
  let p = callerPath()
  let cwd = p ? path.dirname(p) : process.cwd()

  let pkgPath = localResolve(cwd, "@iconify/json/package.json")
  if (!pkgPath) {
    if (Array.isArray(include)) {
      return include.reduce(
        (result, name) => {
          let jsonPath = localResolve(cwd, `@iconify-json/${name}/icons.json`)
          if (!jsonPath) {
            throw new Error(
              `Icon collection "${name}" not found. Please install @iconify-json/${name} or @iconify/json`,
            )
          }
          return {
            ...result,
            [name]: req(jsonPath),
          }
        },
        {} as Record<T, IconifyJSON>,
      )
    }
    return {} as Record<string, never>
  }
  let pkgDir = path.dirname(pkgPath)
  let files = fs.readdirSync(path.join(pkgDir, "json"))
  let collections: Record<string, IconifyJSON> = {}
  for (let file of files) {
    if (
      include === "all" ||
      (include as string[]).includes(file.replace(".json", ""))
    ) {
      let json: IconifyJSON = req(path.join(pkgDir, "json", file))
      collections[json.prefix] = json
    }
  }
  return collections
}

export let generateIconComponent = (
  data: IconifyIcon,
  options: GenerateOptions,
) => {
  if (options.strokeWidth) {
    let strokeWidthRegex = /stroke-width="\d+"/g
    let match = data.body.match(strokeWidthRegex)
    let noStrokeWidth = !match
    let isAllStrokeWidthAreEqual =
      match && match.every((strokeWidth) => strokeWidth === match[0])
    if (isAllStrokeWidthAreEqual) {
      data.body = data.body.replace(
        strokeWidthRegex,
        `stroke-width="${options.strokeWidth}"`,
      )
    }
    if (noStrokeWidth) {
      data.body = `<g stroke-width="${options.strokeWidth}">${data.body}</g>`
    }
  }

  let css = getIconCSS(data, {})
  let rules: Record<string, string> = {}
  css.replace(/^\s+([^:]+):\s*(.+);$/gm, (_, prop, value) => {
    if (prop === "width" || prop === "height") {
      rules[prop] = `${options.scale}em`
    } else {
      rules[prop] = value
    }
    return ""
  })
  if (options.extraProperties) {
    Object.assign(rules, options.extraProperties)
  }
  return rules
}

export let generateComponent = (
  {
    name,
    icons,
  }: {
    name: string
    icons: IconifyJSON
  },
  options: GenerateOptions,
) => {
  let data = getIconData(icons, name)
  if (!data) return null
  return generateIconComponent(data, options)
}
