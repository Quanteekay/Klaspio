export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; code?: string };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail(message: string, code?: string): Result<never> {
  return { ok: false, message, code };
}

export function mapFirebaseError(error: unknown): Result<never> {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : undefined;

  if (code === "permission-denied") {
    return fail("Brak uprawnień do tej operacji.", code);
  }
  if (code === "unavailable") {
    return fail("Usługa jest chwilowo niedostępna. Spróbuj ponownie.", code);
  }
  if (code === "not-found") {
    return fail("Nie znaleziono danych.", code);
  }
  return fail("Wystąpił błąd zapisu lub odczytu danych.", code);
}
