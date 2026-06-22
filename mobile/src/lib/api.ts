const API_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, token }: ApiFetchOptions = {}
): Promise<T> {
  if (!API_URL) {
    throw new ApiError(
      "EXPO_PUBLIC_API_URL n'est pas configuré (voir mobile/.env)."
    );
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      typeof data.error === "string" ? data.error : "Une erreur est survenue"
    );
  }

  return data as T;
}
