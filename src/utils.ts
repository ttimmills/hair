export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

function callsites() {
  var _prepareStackTrace = Error.prepareStackTrace
  try {
    let result: NodeJS.CallSite[] = []
    Error.prepareStackTrace = (_, callSites) => {
      var callSitesWithoutCurrent = callSites.slice(1)
      result = callSitesWithoutCurrent
      return callSitesWithoutCurrent
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    new Error().stack
    return result
  } finally {
    Error.prepareStackTrace = _prepareStackTrace
  }
}

function callerPath1() {
  var callSites = callsites()
  if (!callSites[0]) return
  return callSites[0].getFileName()
}

function callerPath2() {
  var error = new Error()
  var stack = error.stack?.split("\n") as string[]

  var data = stack.find(
    (line) =>
      !line.trim().startsWith("Error") &&
      !line.includes("(") &&
      !line.includes(")"),
  )
  if (!data) {
    return
  }

  var filePathPattern = new RegExp(
    /\s*at (\/.*|[a-zA-Z]:\\(?:([^<>:"\/\\|?*]*[^<>:"\/\\|?*.]\\|..\\)*([^<>:"\/\\|?*]*[^<>:"\/\\|?*.]\\?|..\\))?):\d+:\d+/i,
  )
  var result = filePathPattern.exec(data)
  if (!result) {
    return
  }

  return result[1]
}

export function callerPath() {
  return callerPath1() ?? callerPath2()
}
