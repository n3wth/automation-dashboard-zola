import { devAuth } from './auth/dev-auth'

export async function fetchClient(input: RequestInfo, init?: RequestInit) {
  const csrf = document.cookie
    .split("; ")
    .find((c) => c.startsWith("csrf_token="))
    ?.split("=")[1]

  // Get dev auth headers if in development mode
  const devAuthHeaders = devAuth.getDevAuthHeaders()

  return fetch(input, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      "x-csrf-token": csrf || "",
      "Content-Type": "application/json",
      ...devAuthHeaders,
    },
  })
}
