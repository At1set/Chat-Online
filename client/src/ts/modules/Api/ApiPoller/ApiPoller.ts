import { PollingObject, StartPollingParams } from "./types"

export class ApiPoller {
  public startPolling<T>(
    requestFn: (signal: AbortSignal) => Promise<any>,
    onData?: (data: T) => void,
    params?: StartPollingParams
  ): PollingObject {
    const controller = new AbortController()
    const { signal } = controller

    const poll = () => {
      if (signal.aborted) return
      this.pollingCycle(requestFn, signal, params?.delay)
        .then(async (res) => {
          if (!res.ok) throw new Error("Server error: " + res.status)
          try {
            return await res.json()
          } catch {
            return null
          }
        })
        .then((data) => {
          if (data && onData) onData(data)
          if (!signal.aborted) poll()
        })
        .catch((e) => {
          if (!signal.aborted) {
            if (e === "request timeout") poll()
            else setTimeout(poll, params?.restartPollingDelayAfterrErr || 1000)
          }
        })
    }
    poll()
    return {
      stop: () => controller.abort("Polling cycle is stopped"),
    }
  }

  private async pollingCycle(
    requestFn: (signal: AbortSignal) => Promise<any>,
    signal: AbortSignal,
    requestTimeout = 5000
  ): Promise<Response> {
    const timeoutController = new AbortController()
    const timeoutSignal = timeoutController.signal

    const combinedSignal = this.mergeAbortSignals(signal, timeoutSignal)
    const timeoutId = setTimeout(
      () => timeoutController.abort("request timeout"),
      requestTimeout
    )

    try {
      return await requestFn(combinedSignal)
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private mergeAbortSignals(
    signal1: AbortSignal,
    signal2: AbortSignal
  ): AbortSignal {
    if (signal1.aborted) return signal1
    else if (signal2.aborted) return signal2

    const controller = new AbortController()

    const abort = (ev: Event) => {
      const reason = (ev.target as AbortSignal).reason
      if (!controller.signal.aborted) controller.abort(reason)
    }
    signal1.addEventListener("abort", abort)
    signal2.addEventListener("abort", abort)

    return controller.signal
  }
}
