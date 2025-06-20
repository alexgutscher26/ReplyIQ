export function avatarFallback(name: string) {
  const trimmedName = name?.trim();

  return trimmedName?.split(" ").length > 1
    ? (
        (trimmedName?.split(" ")[0]?.[0] ?? "") +
        (trimmedName?.split(" ").pop()?.[0] ?? "")
      ).toUpperCase()
    : trimmedName?.slice(0, 2).toUpperCase();
}

export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function generateSecret(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
