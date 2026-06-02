# Scenariusze reguł Firestore

Wdrożenie:

```sh
firebase deploy --only firestore:rules,firestore:indexes
```

Scenariusze manualne do sprawdzenia w emulatorze lub konsoli testowej:

- Admin tworzy, edytuje i usuwa dokumenty `Subjects`, `Groups` oraz `Lessons`.
- Nauczyciel nie tworzy lekcji i nie usuwa terminu lekcji.
- Nauczyciel edytuje tylko `topic`, `summary`, `materials` we własnej lekcji po czasie startu.
- Uczeń widzi tylko swoje `Tasks`, `Lessons` i `Attendance`; może zapisać tylko odpowiedź do niezatwierdzonego zadania.
- Rodzic widzi dane wyłącznie uczniów z pola `children`.
- Inny nauczyciel nie odczytuje ani nie edytuje cudzej lekcji.
- Zalogowany użytkownik czyta tylko aktywne `ContentItems` widoczne dla jego roli; zapis treści tylko admin.
- Wiadomości `Messages` odczytują wyłącznie uczestnicy rozmowy i admin.
- Alerty `Notifications` odczytują wyłącznie odbiorcy i admin; odbiorca może aktualizować tylko `readBy`.
- Avatar w Storage zapisuje wyłącznie właściciel pliku `avatars/{uid}.jpg`.
