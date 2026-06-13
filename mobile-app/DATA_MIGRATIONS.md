# Migracje danych

## `Tasks.subjectId`, `Tasks.groupId`, `Lessons.subjectId`, `Lessons.groupId`

Nowe pola są obsługiwane w konwerterach z wartościami domyślnymi:

- brak `subjectId` w `Tasks` oznacza sekcję `Bez przedmiotu` i nie wlicza się do średniej ogólnej,
- brak `subjectId` w `Lessons` używa starego `courseId` jako opisowej wartości zapasowej,
- brak `groupId` oznacza przypisanie ręczne.

Backfill można wykonać później z konsoli administracyjnej lub skryptem migracyjnym po ustaleniu mapowania starych `courseId` na dokumenty `Subjects`.

## `users.avatar`

Pole jest opcjonalne. Brak `avatar` powoduje pokazanie inicjałów użytkownika.

## Indeksy Firestore dla alertów

`firestore.indexes.json` zawiera indeks `Notifications.targetUserIds CONTAINS + createdAt DESC`.
Aplikacja nie wymaga go do poprawnego działania, bo alerty są sortowane lokalnie po pobraniu, ale przy większej liczbie alertów warto wdrożyć indeks poleceniem `firebase deploy --only firestore:indexes`.

## Wiadomości i liczniki nieprzeczytanych

Nowe wiadomości w `Messages` zapisują pole `readBy` z identyfikatorem nadawcy. Starsze wiadomości bez tego pola są traktowane jako nieprzeczytane przez odbiorcę, dopóki odbiorca nie otworzy rozmowy.

Po tej zmianie trzeba wdrożyć reguły Firestore, bo nie-admini muszą mieć możliwość pobrania kontaktów i dopisania siebie do `Messages.readBy`: `firebase deploy --only firestore:rules`.

Jeśli w aplikacji pojawia się `Missing or insufficient permissions` przy licznikach rozmów, oznacza to zwykle, że lokalne `firestore.rules` nie zostały jeszcze wdrożone do projektu Firebase.
