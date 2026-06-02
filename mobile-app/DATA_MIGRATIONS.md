# Migracje danych

## `Tasks.subjectId`, `Tasks.groupId`, `Lessons.subjectId`, `Lessons.groupId`

Nowe pola są obsługiwane w konwerterach z wartościami domyślnymi:

- brak `subjectId` w `Tasks` oznacza sekcję `Bez przedmiotu` i nie wlicza się do średniej ogólnej,
- brak `subjectId` w `Lessons` używa starego `courseId` jako opisowej wartości zapasowej,
- brak `groupId` oznacza przypisanie ręczne.

Backfill można wykonać później z konsoli administracyjnej lub skryptem migracyjnym po ustaleniu mapowania starych `courseId` na dokumenty `Subjects`.

## `users.pushTokens`, `users.avatar`

Nowe pola są opcjonalne. Brak `pushTokens` oznacza brak zarejestrowanych urządzeń, a brak `avatar` powoduje pokazanie inicjałów użytkownika.

## Indeksy Firestore dla alertów

`firestore.indexes.json` zawiera indeks `Notifications.targetUserIds CONTAINS + createdAt DESC`.
Aplikacja nie wymaga go do poprawnego działania, bo alerty są sortowane lokalnie po pobraniu, ale przy większej liczbie alertów warto wdrożyć indeks poleceniem `firebase deploy --only firestore:indexes`.
