import type { ContourResult } from "./types";
import type { ContourWorkerRequest, ContourWorkerResponse } from "./worker-protocol";

interface PendingRequest {
    resolve: (result: ContourResult) => void;
    reject: (error: Error) => void;
}

/**
 * Promise-based handle on the contour Web Worker. Requests are answered in
 * order; callers decide whether a result is still wanted when it arrives.
 */
export class ContourWorkerClient {
    private readonly worker: Worker;
    private readonly pending = new Map<number, PendingRequest>();
    private nextId = 1;

    constructor() {
        this.worker = new Worker(new URL("./contour.worker.ts", import.meta.url), { type: "module" });
        this.worker.onmessage = (event: MessageEvent<ContourWorkerResponse>) => {
            const request = this.pending.get(event.data.id);
            if (!request) return;
            this.pending.delete(event.data.id);
            if ("error" in event.data) request.reject(new Error(event.data.error));
            else request.resolve(event.data.result);
        };
        this.worker.onerror = (event) => this.rejectAll(new Error(event.message || "Contour worker failed"));
    }

    /** Compute contours; the pixel buffer in `request.grid`, if any, is transferred rather than copied. */
    compute(request: Omit<ContourWorkerRequest, "id">): Promise<ContourResult> {
        const id = this.nextId++;
        return new Promise<ContourResult>((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            const message: ContourWorkerRequest = { id, ...request };
            this.worker.postMessage(message, request.grid ? [request.grid.pixels.buffer] : []);
        });
    }

    terminate(): void {
        this.rejectAll(new Error("Contour worker terminated"));
        this.worker.terminate();
    }

    private rejectAll(error: Error): void {
        for (const request of this.pending.values()) request.reject(error);
        this.pending.clear();
    }
}
