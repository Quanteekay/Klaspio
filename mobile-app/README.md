# Klaspio Mobile App

Klient React Native i Expo dla wielorolowego dziennika elektronicznego Klaspio.

Pełny opis funkcjonalności, architektury i konfiguracji znajduje się w [głównym README](../README.md).

## Technologie

- Expo SDK 54;
- React Native 0.81 i React 19;
- Expo Router 6;
- Firebase Authentication, Cloud Firestore i Firebase Storage;
- TypeScript w trybie strict;
- Jest i ts-jest.

## Konfiguracja

Zainstaluj zależności:

```bash
npm install
```

Utwórz konfigurację środowiska:

```bash
cp .env.example .env
```

Na Windows:

```powershell
copy .env.example .env
```

Wymagane zmienne:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

Firebase musi mieć włączone Authentication Email/Password, Cloud Firestore i Storage.

## Uruchamianie

```bash
npm start
npm run android
npm run ios
npm run web
```

Tryb tunelowy:

```bash
npx expo start --tunnel
```

## Weryfikacja

```bash
npm run typecheck
npm test -- --runInBand
npm run build
```

Testy jednostkowe obejmują logikę średnich ocen, frekwencji, czasu trwania lekcji i konfliktów terminów.

## Struktura

```text
app/
|-- auth/
|-- (admin)/
|-- (teacher)/
|-- (student)/
|-- (parent)/
|-- (guest)/
|-- (shared)/
`-- lesson/

src/
|-- components/
|-- domain/
|-- hooks/
|-- models/
|-- services/
|-- theme/
`-- utils/
```

## Firebase

Konfiguracja infrastruktury:

- `FirebaseConfig.ts`;
- `firebase.json`;
- `firestore.rules`;
- `firestore.indexes.json`;
- `storage.rules`;
- `.firebaserc`.

Wdrożenie reguł:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Projekt nie zawiera Cloud Functions ani powiadomień push. Alerty i wiadomości działają w czasie rzeczywistym przez Cloud Firestore.

## Dokumentacja

- [Główny README](../README.md)
- [Audyt projektu](../AUDYT_PROJEKTU.md)
- [Scenariusze reguł Firestore](FIRESTORE_RULES_TESTS.md)
