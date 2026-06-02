export function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Nieprawidłowy email lub hasło.";
    case "auth/invalid-email":
      return "Podany adres e-mail jest niepoprawny.";
    case "auth/email-already-in-use":
      return "Konto z tym adresem e-mail już istnieje.";
    case "auth/weak-password":
      return "Hasło jest zbyt słabe. Użyj co najmniej 6 znaków.";
    case "auth/too-many-requests":
      return "Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.";
    case "auth/network-request-failed":
      return "Brak połączenia z siecią. Sprawdź internet i spróbuj ponownie.";
    case "auth/operation-not-allowed":
      return "Logowanie e-mailem i hasłem nie jest włączone w Firebase.";
    default:
      return "Wystąpił błąd. Spróbuj ponownie za chwilę.";
  }
}
