import { ChurnPayload, HealthResponse as HealthResponse, HistoryItem, PredictionApiResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function parseApiError(body: any, status: number): string {
    if (!body) {
        return `Request ailed with status ${status}`;
    }

    if (body.message) {
        return Array.isArray(body.message)
            ? body.message.join('; ')
            : String(body.message);
    }

    if (body.detail && typeof body.detail === "string") {
        return body.detail;
    }

    if (body.detail && Array.isArray(body.detail)) {
        return body.detail
            .map((item: any) => item.msg || JSON.stringify(item))
            .join("; ")
    }

    if (body.detail) {
        return JSON.stringify(body.detail);
    }

    return `Request failed with status ${status}`
}

export async function predictChurn(
    payload: ChurnPayload
) : Promise<PredictionApiResponse> {
    const response = await fetch(`${API_URL}/api/v1/churn/predict`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(parseApiError(body, response.status));
}

    return body as PredictionApiResponse;
}

export async function getHealth(): Promise<HealthResponse> {
    const response = await fetch(`${API_URL}/health`, {
        cache: "no-store",
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(parseApiError(body, response.status));
    }

    return body as HealthResponse;
}

export async function getHistory(): Promise<HistoryItem[]> {
    const response = await fetch(`${API_URL}/api/v1/churn/history`, {
        cache: "no-store",
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(parseApiError(body, response.status));
    }

    return body.data ?? [];
}

export async function clearHistory(): Promise<{success: boolean; message: string}> {
    const response = await fetch(`${API_URL}/api/v1/churn/history`, {
        method: 'DELETE'
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(parseApiError(body, response.status));
    }

    return body;
}
