export async function serverFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`http://localhost:5000${endpoint}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed request: ${endpoint}`);
  }

  return res.json();
}
