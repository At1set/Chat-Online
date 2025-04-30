export class ApiPoller {
    startPolling(requestFn, onData, params) {
        const controller = new AbortController();
        const { signal } = controller;
        const poll = () => {
            if (signal.aborted)
                return;
            this.pollingCycle(requestFn, signal, params?.delay)
                .then(async (res) => {
                if (!res.ok)
                    throw new Error("Server error: " + res.status);
                try {
                    return await res.json();
                }
                catch {
                    return null;
                }
            })
                .then((data) => {
                if (data && onData)
                    onData(data);
                if (!signal.aborted)
                    poll();
            })
                .catch((e) => {
                if (!signal.aborted) {
                    if (e === "request timeout")
                        poll();
                    else
                        setTimeout(poll, params?.restartPollingDelayAfterrErr || 1000);
                }
            });
        };
        poll();
        return {
            stop: () => controller.abort("Polling cycle is stopped"),
        };
    }
    async pollingCycle(requestFn, signal, requestTimeout = 5000) {
        const timeoutController = new AbortController();
        const timeoutSignal = timeoutController.signal;
        const combinedSignal = this.mergeAbortSignals(signal, timeoutSignal);
        const timeoutId = setTimeout(() => timeoutController.abort("request timeout"), requestTimeout);
        try {
            return await requestFn(combinedSignal);
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    mergeAbortSignals(signal1, signal2) {
        if (signal1.aborted)
            return signal1;
        else if (signal2.aborted)
            return signal2;
        const controller = new AbortController();
        const abort = (ev) => {
            const reason = ev.target.reason;
            if (!controller.signal.aborted)
                controller.abort(reason);
        };
        signal1.addEventListener("abort", abort);
        signal2.addEventListener("abort", abort);
        return controller.signal;
    }
}
