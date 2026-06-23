const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN ?? ""

export async function apiPost(url: string, body: unknown) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-token": API_TOKEN,
    },
    body: JSON.stringify(body),
  })
}

export async function apiPut(url: string, body: unknown) {
  return fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-api-token": API_TOKEN,
    },
    body: JSON.stringify(body),
  })
}

export async function apiDelete(url: string) {
  return fetch(url, {
    method: "DELETE",
    headers: {
      "x-api-token": API_TOKEN,
    },
  })
}
