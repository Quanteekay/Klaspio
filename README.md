# Klaspio

Aplikacja mobilna dla szkoły językowej (React Native + Expo Router + Firebase).

## Wymagania

Node LTS (~24).

DOCS: https://docs.expo.dev/get-started/create-a-project/

Można użyć NVM: https://github.com/nvm-sh/nvm
```bash
nvm install --lts       # windows: nvm install lts
nvm use --lts           # windows: nvm use lts
node --version          # v24.*.*
```

## Instalacja

```bash
cd klaspo/mobile-app
cp .env.example .env       # uzupełnij kluczami swojego projektu Firebase
npm install
```

## Uruchomienie

```bash
# dev server
npx expo start

# natywnie (wymaga konfiguracji Xcode/Android Studio)
npx expo run:ios
npx expo run:android
```

## Stack

- UI: React Native (Expo SDK 54)
- Routing: expo-router (typed routes)
- Auth: Firebase Authentication (email/hasło)
- Baza: Firestore Database
- Motyw: własny adaptacyjny design system (jasny/ciemny), patrz `src/theme/`
- Komponenty UI: `src/components/ui/`

Pełna lista zmian per moduł: `klaspo/mobile-app/CHANGELOG.md`.

---

# Klaspio

Wielorolowy dziennik elektroniczny dla szkoły językowej — aplikacja mobilna (iOS / Android / Web) zbudowana w **React Native + Expo + Firebase**.

Role w aplikacji: **uczeń · nauczyciel · administrator · rodzic · gość**.

---

## 🚀 Szybki start — uruchomienie w Expo Go (od A do Z)

> **Expo Go** to darmowa aplikacja na telefon, w której uruchamiasz projekt bez budowania natywnego.
> Pobierz ją ze sklepu: **App Store** (iOS) lub **Google Play** (Android).
>
> ⚠️ **Uwaga:** powiadomienia push (FCM) **nie działają** w Expo Go — to oczekiwane. Cała reszta aplikacji działa normalnie.

### Wymagania wstępne (oba systemy)
- **Node.js LTS** (zalecane v20+; projekt testowany na v24) — [nodejs.org](https://nodejs.org)
- **Git**
- Telefon z zainstalowaną aplikacją **Expo Go**
- Telefon i komputer w **tej samej sieci Wi‑Fi**
- Dane konfiguracyjne projektu **Firebase** (Web App) — patrz krok 3

---

### 🪟 Windows — krok po kroku

```powershell
# 1. Sklonuj repozytorium i wejdź do folderu aplikacji
git clone <URL-REPOZYTORIUM>
cd "klaspio v2\mobile-app"

# 2. Zainstaluj zależności
npm install

# 3. Utwórz plik .env z konfiguracją Firebase
copy .env.example .env
notepad .env          # wklej swoje klucze Firebase i zapisz

# 4. Uruchom serwer deweloperski
npx expo start
```

5. W terminalu pojawi się **kod QR**.
6. Otwórz aplikację **Expo Go** na telefonie (Android: zeskanuj QR wbudowanym skanerem Expo Go; iOS: zeskanuj aparatem i otwórz w Expo Go).
7. Aplikacja zbuduje bundle i uruchomi się na telefonie. 🎉

> Jeśli telefon nie łączy się przez Wi‑Fi (np. sieć firmowa/uczelniana izoluje urządzenia), uruchom w trybie tunnel:
> ```powershell
> npx expo start --tunnel
> ```

---

### 🍎 macOS — krok po kroku

```bash
# 1. Sklonuj repozytorium i wejdź do folderu aplikacji
git clone <URL-REPOZYTORIUM>
cd "klaspio v2/mobile-app"

# 2. Zainstaluj zależności
npm install

# 3. Utwórz plik .env z konfiguracją Firebase
cp .env.example .env
open -e .env          # wklej swoje klucze Firebase i zapisz

# 4. Uruchom serwer deweloperski
npx expo start
```

5. W terminalu pojawi się **kod QR**.
6. **iOS:** zeskanuj QR **aparatem** → stuknij baner „Otwórz w Expo Go".
   **Android:** zeskanuj QR **bezpośrednio w aplikacji Expo Go**.
7. Aplikacja zbuduje bundle i uruchomi się na telefonie. 🎉

> Tryb tunnel (gdy Wi‑Fi nie współpracuje):
> ```bash
> npx expo start --tunnel
> ```

---

### 🔑 Krok 3 szczegółowo — konfiguracja Firebase

Plik `.env` (w folderze `mobile-app/`) musi zawierać klucze Twojego projektu Firebase.
Znajdziesz je w **Firebase Console → Project Settings → General → Your apps → Web app**:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=twoj-projekt.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=twoj-projekt
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=twoj-projekt.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

W projekcie Firebase muszą być włączone: **Authentication (Email/Password)**, **Firestore Database** oraz **Storage**.

---

### 💻 Uruchomienie w przeglądarce (opcjonalnie, bez telefonu)

```bash
npx expo start --web
```

---

## 🛠️ Stack technologiczny

| Obszar | Technologia |
|---|---|
| UI | React Native (Expo SDK 54), React 19 |
| Routing | expo-router (file-based, typed routes) |
| Auth | Firebase Authentication (email/hasło) |
| Baza danych | Cloud Firestore |
| Pliki | Firebase Storage (awatary) |
| Kalendarze | react-native-calendars |
| Animacje | react-native-reanimated |
| Motyw | Własny design system light/dark (`src/theme/`, `src/components/ui/`) |
| Testy | Jest + ts-jest (logika domenowa) |

## 📁 Struktura projektu

```
mobile-app/
├── app/                # ekrany i routing (expo-router)
│   ├── auth/           # logowanie, rejestracja, reset hasła
│   ├── (student)/      # przestrzeń ucznia
│   ├── (teacher)/      # przestrzeń nauczyciela
│   ├── (admin)/        # panel administratora
│   ├── (parent)/       # przestrzeń rodzica
│   ├── (guest)/        # tryb gościa
│   └── (shared)/       # profil, treści, powiadomienia, chat
├── src/
│   ├── services/       # warstwa API (Firestore/Auth/Storage)
│   ├── domain/         # czysta logika biznesowa (testowana)
│   ├── models/         # interfejsy TypeScript
│   ├── components/     # komponenty (w tym ui/ = design system)
│   ├── theme/          # motyw i hook useTheme
│   └── hooks/          # hooki reużywalne
├── firestore.rules     # reguły bezpieczeństwa Firestore
├── storage.rules       # reguły Storage
└── firestore.indexes.json
```

## 📜 Dostępne skrypty

Uruchamiane z folderu `mobile-app/`:

```bash
npm start          # serwer deweloperski Expo
npm run android    # build natywny Android (wymaga Android Studio)
npm run ios        # build natywny iOS (wymaga Xcode, tylko macOS)
npm run web        # wersja webowa
npm run typecheck  # tsc --noEmit
npm run test       # testy Jest
```

## 🧪 Testy

Testy pokrywają warstwę logiki domenowej (`src/domain/`): obliczanie średnich ocen, statystyki frekwencji, czas trwania i konflikty lekcji.

```bash
npm run test
```

## 📚 Dokumentacja dodatkowa

- [CHANGELOG.md](CHANGELOG.md) — pełna historia zmian per moduł
- [DATA_MIGRATIONS.md](DATA_MIGRATIONS.md) — migracje i nowe pola danych
- [FIRESTORE_RULES_TESTS.md](FIRESTORE_RULES_TESTS.md) — scenariusze testowe reguł
- [PUSH_INTEGRATION.md](PUSH_INTEGRATION.md) — plan integracji powiadomień push
