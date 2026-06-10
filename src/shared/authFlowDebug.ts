const isDebugEnabled = import.meta.env.DEV

const authFlowPrefix = '[AUTH_RELOGIN]'

export const authFlowLog = (...args: unknown[]) => {
  if (!isDebugEnabled) {
    return
  }

  console.log(authFlowPrefix, ...args)
}

export const authFlowTrace = (...args: unknown[]) => {
  if (!isDebugEnabled) {
    return
  }

  console.trace(authFlowPrefix, ...args)
}
