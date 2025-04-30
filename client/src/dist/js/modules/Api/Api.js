export class ApiPoller {
    static delay = 5000;
    controller = null;
    startPolling(url, onData) {
        this.endPolling();
        this.controller = new AbortController();
        const signal = this.controller.signal;
        const poll = () => {
            if (signal.aborted)
                return;
            this.pollingCycle(url, signal, ApiPoller.delay)
                .then((res) => {
                if (!res.ok)
                    throw new Error("Server error: " + res.status);
                return res.json().catch(() => null);
            })
                .then((data) => {
                if (data)
                    onData(data);
                if (!signal.aborted)
                    poll();
            })
                .catch((e) => {
                console.log(e);
                if (!signal.aborted)
                    setTimeout(poll, 1000);
            });
        };
        poll();
    }
    endPolling() {
        this.controller?.abort();
        this.controller = null;
    }
    async pollingCycle(url, signal, requestTimeout = 5000) {
        const timeoutController = new AbortController();
        const timeoutSignal = timeoutController.signal;
        const combinedSignal = this.mergeAbortSignals(signal, timeoutSignal);
        const timeoutId = setTimeout(() => timeoutController.abort(), requestTimeout);
        try {
            return await fetch(url);
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
        const abort = () => controller.abort();
        signal1.addEventListener("abort", abort);
        signal2.addEventListener("abort", abort);
        return controller.signal;
    }
}
