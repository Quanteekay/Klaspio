# Powiadomienia push

Klient mobilny rejestruje Expo Push Token w `users/{uid}.pushTokens` przez `registerPushToken`.

Bez własnego backendu aplikacja nie ma bezpiecznego miejsca do automatycznej wysyłki powiadomień. Punkt integracji dla przyszłego backendu albo Cloud Functions:

- zbliżająca się lekcja: cyklicznie wyszukać `Lessons.date` w najbliższym oknie czasu i wysłać do `teacherId` oraz `studentIds`,
- nowe zadanie: po utworzeniu `Tasks` wysłać do `userId`,
- nowa ocena: po zmianie `Tasks.rate`/`commited` wysłać do `userId` i rodziców powiązanych przez `children`.

Wysyłka powinna używać zapisanych tokenów Expo i pomijać web, gdzie aplikacja pokazuje fallback.
