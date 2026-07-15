import axios from "axios";

/**
 * Pulls the message the API actually sent back, so guards like the 409 on deleting a
 * restaurant that still has rooms reach the user instead of a generic "something failed".
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
    if (!axios.isAxiosError(error)) return fallback;

    const data = error.response?.data;

    if (typeof data === "string" && data.trim()) return data;

    // ASP.NET ProblemDetails / ModelState validation responses
    if (data && typeof data === "object") {
        const problem = data as { title?: string; errors?: Record<string, string[]> };

        if (problem.errors) {
            const first = Object.values(problem.errors).flat()[0];
            if (first) return first;
        }

        if (problem.title) return problem.title;
    }

    return fallback;
}
