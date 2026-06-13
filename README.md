# Klaspio

Klaspio to wielorolowy dziennik elektroniczny dla szkoły językowej. Aplikacja działa na iOS, Androidzie i w przeglądarce, a jej klient został zbudowany w React Native, Expo Router i Firebase.

Obsługiwane role:

- administrator;
- nauczyciel;
- uczeń;
- rodzic;
- gość.

## Aktualny zakres

### Administrator

- zarządzanie kontami, rolami i aktywnością użytkowników;
- przypisywanie dzieci do kont rodziców;
- tworzenie i edycja przedmiotów;
- tworzenie i edycja grup uczniów;
- planowanie i edycja lekcji;
- wybór nauczyciela, przedmiotu, grupy lub pojedynczych uczniów;
- zarządzanie materiałami i galerią opartą na adresach URL;
- wysyłanie alertów do wszystkich lub wybranych użytkowników;
- statystyki liczby kont według ról.

### Nauczyciel

- tworzenie zadań dla ucznia lub grupy;
- przeglądanie odpowiedzi;
- zapisywanie oceny roboczej i komentarza;
- zatwierdzanie ocen;
- kalendarz własnych lekcji;
- uzupełnianie realizacji rozpoczętej lekcji;
- zapisywanie frekwencji uczniów.

### Uczeń

- dashboard postępów;
- oceny i średnie według przedmiotów;
- lista zadań z filtrowaniem i wyszukiwaniem;
- wysyłanie i edycja odpowiedzi przed zatwierdzeniem zadania;
- statystyki i historia frekwencji;
- kalendarz oraz szczegóły lekcji;
- dostęp do materiałów szkolnych.

### Rodzic

- wybór przypisanego dziecka;
- podgląd ocen i średnich;
- podgląd zadań, odpowiedzi i komentarzy;
- podgląd frekwencji;
- podgląd kalendarza i szczegółów lekcji.

### Funkcje wspólne

- logowanie przez Firebase Authentication;
- reset i zmiana hasła;
- edycja adresu e-mail;
- awatar przechowywany w Firebase Storage;
- czat jeden-do-jednego z licznikami nieprzeczytanych wiadomości;
- alerty wewnątrz aplikacji z licznikami i statusem odczytu;
- profil użytkownika;
- automatyczny jasny lub ciemny motyw;
- pull-to-refresh na ekranach danych;
- globalne dolne menu.

Alerty są przechowywane w Firestore i wyświetlane wewnątrz aplikacji. Projekt nie zawiera obecnie powiadomień push ani Cloud Functions.

## Stack technologiczny

| Obszar | Technologia |
|---|---|
| UI | React Native 0.81, React 19 |
| Runtime | Expo SDK 54 |
| Routing | Expo Router 6, routing plikowy i typed routes |
| Uwierzytelnianie | Firebase Authentication |
| Baza danych | Cloud Firestore |
| Pliki | Firebase Storage |
| Sesja natywna | AsyncStorage |
| Kalendarze | react-native-calendars |
| Animacje | react-native-reanimated |
| Testy | Jest, ts-jest |
| Język | TypeScript 5.9 w trybie strict |

## Wymagania

- Node.js LTS, zalecana wersja 20 lub nowsza;
- npm;
- Git;
- projekt Firebase z aplikacją Web;
- Expo Go na telefonie lub środowisko natywne Xcode/Android Studio.

Projekt był uruchamiany z Node.js 24.

## Instalacja

```bash
git clone <URL_REPOZYTORIUM>
cd "klaspio v2"
npm install --prefix mobile-app
```

Utwórz lokalną konfigurację Firebase:

```bash
cp mobile-app/.env.example mobile-app/.env
```

Na Windows:

```powershell
copy mobile-app\.env.example mobile-app\.env
```

Uzupełnij `mobile-app/.env` danymi aplikacji Web z Firebase Console:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

Plik `.env` nie jest śledzony przez Git.

## Konfiguracja Firebase

W projekcie Firebase należy włączyć:

1. Authentication z metodą Email/Password.
2. Cloud Firestore.
3. Firebase Storage.
4. Aplikację Web, której dane konfiguracyjne trafiają do `.env`.

Lokalne pliki infrastruktury:

- `mobile-app/firestore.rules`;
- `mobile-app/firestore.indexes.json`;
- `mobile-app/storage.rules`;
- `mobile-app/firebase.json`;
- `mobile-app/.firebaserc`.

Wdrożenie reguł i indeksów:

```bash
cd mobile-app
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Wartość projektu w `.firebaserc` musi odpowiadać faktycznemu Firebase Project ID.

## Uruchamianie

Polecenia można wykonywać z katalogu głównego:

```bash
npm start
npm run android
npm run ios
npm run web
```

Odpowiadają one skryptom z `mobile-app/package.json`.

Bezpośrednio z katalogu aplikacji:

```bash
cd mobile-app
npm start
```

Po uruchomieniu Metro:

- Android: zeskanuj kod QR w Expo Go;
- iOS: zeskanuj kod QR aparatem i otwórz projekt w Expo Go;
- Web: użyj `npm run web`.

Jeżeli urządzenia nie widzą się w sieci lokalnej:

```bash
npx expo start --tunnel
```

## Dostępne skrypty

| Polecenie | Działanie |
|---|---|
| `npm start` | Uruchamia Expo Go |
| `npm run android` | Uruchamia Expo Go na Androidzie |
| `npm run ios` | Uruchamia Expo Go na iOS |
| `npm run web` | Uruchamia aplikację Web |
| `npm run build` | Generuje statyczny eksport Web w `mobile-app/dist` |
| `npm run typecheck` | Uruchamia `tsc --noEmit` |
| `npm test` | Uruchamia testy Jest |

## Struktura projektu

```text
.
|-- README.md
|-- AUDYT_PROJEKTU.md
|-- package.json
`-- mobile-app/
    |-- app/
    |   |-- auth/
    |   |-- (admin)/
    |   |-- (teacher)/
    |   |-- (student)/
    |   |-- (parent)/
    |   |-- (guest)/
    |   |-- (shared)/
    |   `-- lesson/
    |-- src/
    |   |-- components/
    |   |-- domain/
    |   |-- hooks/
    |   |-- models/
    |   |-- services/
    |   |-- theme/
    |   `-- utils/
    |-- FirebaseConfig.ts
    |-- firestore.rules
    |-- firestore.indexes.json
    |-- storage.rules
    |-- firebase.json
    |-- app.json
    `-- package.json
```

### Warstwy

- `app/` zawiera ekrany i layouty Expo Router.
- `src/services/` realizuje operacje Firebase.
- `src/domain/` zawiera czystą logikę biznesową.
- `src/models/` definiuje encje TypeScript.
- `src/components/` zawiera komponenty współdzielone.
- `src/components/ui/` stanowi własny design system.
- `src/theme/` definiuje palety, spacing, typografię i cienie.

## Dane Firestore

Aplikacja używa kolekcji:

- `users`;
- `Subjects`;
- `Groups`;
- `Lessons`;
- `Tasks`;
- `Attendance`;
- `Messages`;
- `Notifications`;
- `ContentItems`.

Nowe pola są obsługiwane przez konwertery z wartościami domyślnymi. Repozytorium nie zawiera automatycznego skryptu migracji ani backfillu.

## Testy i kontrola jakości

Aktualny zestaw testów obejmuje:

- obliczanie średnich ocen;
- statystyki frekwencji;
- czas trwania lekcji;
- wykrywanie konfliktów lekcji.

Uruchomienie pełnej kontroli:

```bash
npm run typecheck
npm test -- --runInBand
npm run build
```

Stan potwierdzony podczas audytu z 13 czerwca 2026:

- TypeScript przechodzi bez błędów;
- 3 zestawy Jest i 10 testów przechodzą;
- statyczny eksport Web kończy się sukcesem.

Nie ma automatycznych testów ekranów, integracji Firebase, testów end-to-end ani aktywnego workflow CI. Scenariusze ręcznej weryfikacji reguł znajdują się w `mobile-app/FIRESTORE_RULES_TESTS.md`.

## Znane ograniczenia

- Projekt używa alertów wewnątrz aplikacji, bez powiadomień push.
- Nie ma własnego backendu HTTP ani Cloud Functions.
- Migracje Firestore wymagają ręcznego backfillu.
- Eksport Web zgłasza ostrzeżenie dotyczące wpisu `(shared)` w root layout.
- Reguły Firestore nie mają automatycznych testów.
- Projekt iOS i katalog `dist` są generowane lokalnie i ignorowane przez Git.
- Katalog Android prebuild nie jest przechowywany w repozytorium.

## Dokumentacja

- [Audyt projektu](AUDYT_PROJEKTU.md)
- [README aplikacji](mobile-app/README.md)
- [Scenariusze testowe reguł Firestore](mobile-app/FIRESTORE_RULES_TESTS.md)
