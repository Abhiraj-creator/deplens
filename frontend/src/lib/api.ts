const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export async function api<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = (await response.json().catch(() => null)) as T & {
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(data?.error?.message || "Request failed");
  return data;
}
