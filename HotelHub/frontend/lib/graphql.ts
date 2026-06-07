const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";

export async function graphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${gatewayUrl}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors) {
    throw new Error(payload.errors?.[0]?.message || "GraphQL request failed");
  }
  return payload.data;
}
