const BASE_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000";

export async function serverFetch<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed request: ${url}`);
  }

  return res.json();
}