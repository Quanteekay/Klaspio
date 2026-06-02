# Klaspio — Changelog (per moduł)

Plik podzielony **per moduł / warstwę**, nie po wersjach. Po każdej zmianie dopisuję nowy punkt do odpowiedniej sekcji. Konwencja punktu: **`[YYYY-MM-DD]` krótki opis** + opcjonalnie ścieżki plików.

> ℹ️ Stan wyjściowy = wersja repozytorium z `git`-owego punktu startowego (nie ma tu gita, więc baseline = stan na 2026-05-27 przed pierwszą moją zmianą).

---

## 0. Stan wyjściowy (baseline 2026-05-27)
- Działały: Firebase Auth (email/hasło), CRUD użytkowników w panelu admina, CRUD zadań po stronie nauczyciela z dwustopniowym ocenianiem, lista ocen i zadań po stronie ucznia.
- Stuby: `student/presence.tsx`, `admin/subjects.tsx`.
- Pozostałość po szablonie startowym Expo: `app/(tabs)/` + `app/modal.tsx` (osierocone, z błędnymi importami, ciągnęły przestarzałe `expo-av`).
- Wszystkie style: zahardkodowane kolory, brak design systemu.
- Brak repozytorium git. Brak `.env` (tylko `.env.example`).

---

## 1. Modele danych (`src/models/`)
- **[2026-05-28]** `Group.ts` — **NOWY** model: `id, name, description?, memberIds[], createdBy?, createdAt?`.
- **[2026-05-27]** `UserData.ts` — dodane pole `avatar?: string`. (FAZA 1.2)
- **[2026-05-27]** `Task.ts` — dodane pole `submittedAt?: string`. (FAZA 1.1)
- **[2026-05-27]** `Attendance.ts` — **NOWY** model: `id, studentId, courseId, lessonId, date, status: "present"|"absent"|"late", note?`. (FAZA 1.3)
- **[2026-05-27]** `UserRole.ts` — dodana wartość `"parent"` do union. (FAZA 2.1)
- **[2026-05-27]** `UserData.ts` — dodane pole `children?: string[]` (UID-y dzieci dla roli parent). (FAZA 2.1)
- **[2026-05-27]** `Lesson.ts` — **NOWY** model: `id, courseId, teacherId, studentIds[], date, durationMin, topic, location, online?, meetingUrl?`. (FAZA 2.2)

## 2. Serwisy (`src/services/`)
- **[2026-05-28]** `groupsApi.ts` — **NOWY**: `getAllGroups`, `getGroupById`, `createGroup`, `updateGroup`, `deleteGroup`. Kolekcja `Groups`. `createdAt: serverTimestamp()`.
- **[2026-05-28]** `attendanceApi.ts` — dodane: `getAttendanceByLesson(lessonId)` + `upsertAttendance({...})` z deterministycznym docId `{lessonId}_{studentId}` (idempotentnie nadpisuje rekord, jeden per para lekcja×uczeń).
- **[2026-05-28]** `lessonsApi.ts` — `deleteLesson(id)` + stałe `LESSON_UNIT_MIN=45`, `LESSON_BREAK_MIN=15` + helpery `computeDurationMin(units)`, `unitsFromDuration(durationMin)`, `lessonsConflict(a, b)`. Konflikt = nakładanie czasowe **lub** mniej niż 15 min przerwy między lekcjami.
- **[2026-05-28]** `studentApi.ts` — `getRatingSubjects` i `getTasksByStudent` mają early return `if (snapshot.empty) return []`. Wcześniej dla użytkownika bez zadań kod próbował `doc(db,"users","")` (pusty `teacherId` z `?? ""`), co rzucało błędem Firestore i syfiło konsolę. Teraz po prostu empty state ("Brak ocen" / "Brak zadań domowych.") bez żadnych alertów. Dodatkowo guard na pusty `teacherId` (nie ciągnie nauczyciela jeśli brak).
- **[2026-05-28]** `userApi.ts` — `updateUserDataByUid` filtruje `undefined` z payloadu przed `updateDoc()`. Naprawia błąd „Function updateDoc() called with invalid data. Unsupported field value: undefined (found in field avatar...)" — pojawiał się przy edycji rodzica bez awatara (dodawaniu dzieci).
- **[2026-05-27]** `userApi.ts` — `getCurrentUserData/getUserDataByUid/getAllUsers` mapują teraz nowe pola (`avatar`, `children`); poprawka twardo zaszytego `active: true` → `data.active ?? true`. `createNewUser` zapisuje `children`.
- **[2026-05-27]** `studentApi.ts` — `submitTaskAnswer` zapisuje `submittedAt: serverTimestamp()`.
- **[2026-05-27]** `tasksApi.ts` — `taskConverter` parsuje `submittedAt` (Timestamp/string).
- **[2026-05-27]** `attendanceApi.ts` — **NOWY**: `getAttendanceByStudent`, `getAttendanceStats`, `groupAttendanceByCourse`, kolekcja `Attendance`.
- **[2026-05-27]** `lessonsApi.ts` — **NOWY**: `getLessonsByStudent` (array-contains), `getLessonsByTeacher`, `getLessonById`, `createLesson`, `updateLesson`, `toCalendarDay`. Kolekcja `Lessons`.

## 3. Design system (`src/theme/`, `src/components/ui/`)
- **[2026-05-28]** Nowy prymityw `EmptyState` (`src/components/ui/EmptyState.tsx`) — spójny komunikat pustej listy (fontSize 16, fontWeight 500, textMuted, centrowany). Wszystkie `ListEmptyComponent` (6 ekranów: student + parent × oceny/zadania/frekwencja) używają tej samej czcionki i stylu. Wcześniej „Brak ocen" miało fontSize 22, „Brak zadań domowych." 16 — rozjeżdżało się.
- **[2026-05-28]** Pull-to-refresh wszędzie tam, gdzie sens: nowy prymityw `ThemedRefreshControl` (kolory z motywu — iOS spring loader + Material spinner) + hook `useRefresh(fetcher)`. Podpięte: student (oceny/zadania/obecność), rodzic (oceny/zadania/frekwencja/kalendarz/panel z dziećmi), nauczyciel (lista zadań/kalendarz), admin (konta + dashboard ze statystykami), współdzielony `LessonsCalendar`.
- **[2026-05-27]** Fundament: `src/theme/theme.ts` (paletki light/dark, `spacing`, `radii`, `typography`, `makeShadows`) + `useTheme` (`src/theme/useTheme.ts`). Styl: **Soft Minimal**, adaptacyjny.
- **[2026-05-27]** Prymitywy `src/components/ui/`: `Screen`, `ScreenHeader`, `Card`, `Button` (5 wariantów), `Badge` (tony), `Chip`, `TextField` + `index.ts` (barrel).
- **[2026-05-27]** `useTabScreenOptions` — wspólne, themowane opcje dolnego paska dla wszystkich ról.
- **[2026-05-27]** Wave 1 — re-skin współdzielonych atomów: `SafeAreaContainer`, `ViewTitle`, `Loader`, `CheckAuth`, `NavigationItem`, `Single{Grade,Homework,Attendance}`, `ProfileInfo`, `FilterBadge`, `SearchBar`. Cała appka dostaje dark mode dzięki tym atomom.
- **[2026-05-28]** Wave 2 — migracja pozostałych ekranów na motyw (patrz sekcje per moduł).
- **[2026-05-28]** `TabBarIcon` — poszerzony prop `color` do `ColorValue` (peer-upgrade po SDK bumpie).
- **[2026-05-28]** Tab bar „wyspa" — `useTabScreenOptions` przerobiony na pływającą pigułkę: marginesy boczne, safe-area-aware margin dolny, `borderRadius: 30`, miękki cień, mocniejszy w dark mode. Wszystkie 4 role + gość dziedziczą automatycznie.
- **[2026-05-28]** Tab bar — `tabBarLabelStyle.marginTop: 6` + `tabBarItemStyle.paddingVertical: 2` (ikona i etykieta nie nachodzą na siebie).
- **[2026-05-28]** Tab bar / motyw nawigatora — `navTheme.colors.card` zmapowane na **`t.colors.bg`** (a nie `surface`). Tym kolorem react-navigation maluje wewnętrzny wrapper bottom-tabs — przy `surface` (białym) zostawał widoczny biały pasek pod floating pigułką. Dodatkowo `sceneStyle` (v7) + `sceneContainerStyle` (kompat.) w `useTabScreenOptions`.
- **[2026-05-28]** `app/_layout.tsx` — przywrócony `ThemeProvider` z `@react-navigation/native` (po rollbacku SDK 54 to znów bezpieczne). Kolory react-navigation (`background`, `card`, `text`, `border`, `primary`) zmapowane na nasz motyw przez `useMemo`.
- **[2026-05-28]** Tab bar — boczne marginesy działają teraz poprawnie: `left:0 + right:0 + marginHorizontal:18` (sam `left/right` react-navigation nadpisywał wewnętrznie, pigułka rozciągała się na 100% szerokości).
- **[2026-05-28]** Tab bar — `position: "absolute"` + `tabBarBackground: () => null`. Treść wjeżdża **pod** pigułkę (nie ma już szarej krechy/tła pod paskiem), pigułka jest jedynym widocznym elementem nawigacji.
- **[2026-05-28]** Tab bar — poprawiona wysokość pigułki: `height: 70`, `paddingTop: 10`, `paddingBottom: 14`, `tabBarLabelStyle.fontSize: 11, marginTop: 4`, `borderRadius: 32`. Usunięty `tabBarItemStyle` (powodował niespójne odstępy). Wygląda spójniej z dwoma elementami.
- **[2026-05-28]** `useTabScreenOptions` — `key={t.scheme}` powiązanie dla `Calendar` (react-native-calendars) tam gdzie używany, żeby remountował się przy toggle dark/light.

## 4. Auth (`app/auth/`)
- **[2026-05-28]** `auth/index.tsx` — login na nowych prymitywach (Screen + ScreenHeader + TextField + Button).
- **[2026-05-28]** `auth/register.tsx` — rewrite na prymitywy.
- **[2026-05-28]** `auth/forgotPassword.tsx` — rewrite na prymitywy + Card dla success state.

## 5. Profil współdzielony (`app/(shared)/profile/`)
- **[2026-05-27]** Dodany przycisk **„Zmień hasło"** w widoku profilu (kieruje do `/profile/changePassword`); ukryty dla gościa. (FAZA 1.2)
- **[2026-05-28]** Przyciski profilu (Edytuj / Zmień hasło / Wyloguj) zamienione na prymityw `Button` z odpowiednimi wariantami.
- **[2026-05-28]** `EditProfile.tsx` — rewrite na `TextField` + `Button`.
- **[2026-05-28]** `changePassword.tsx` — rewrite na `Screen + ScreenHeader + TextField + Button`.
- **[2026-05-28]** `ProfileInfo.tsx` — awatar z fallbackiem na inicjały, kolor badge'a dla roli (z motywu).
- **[2026-05-28]** `ProfileInfo.tsx` — układ ułożony pod prośbę użytkownika: jedna karta „Imię i nazwisko" (w jednym wierszu), karta Email, karta Rola; **User ID usunięte**.

## 6. Moduł studenta (`app/(student)/`)
- **[2026-05-28]** `student/_layout.tsx` — w dolnej pigułce widoczne **tylko Panel + Profil**. Oceny / Zadania / Kalendarz / Obecność dostępne z kafelków dashboardu (`href: null` na pozostałych zakładkach).
- **[2026-05-27]** `student/homework/*` — bez zmian wizualnych (FAZA 1.1); jedynie `submittedAt` zapisywany przy wysyłce odpowiedzi (per decyzję użytkownika).
- **[2026-05-27]** `student/presence.tsx` — przepisany ze stuba: pasek statystyk (% obecności / spóźnienia / nieobecności) + `SectionList` pogrupowana po `courseId`, read-only. (FAZA 1.3)
- **[2026-05-27]** `student/calendar.tsx` — **NOWY**, używa `LessonsCalendar` z UID-em zalogowanego ucznia.
- **[2026-05-27]** `student/_layout.tsx` — przepięty na `useTabScreenOptions`; dodana zakładka Kalendarz + kafelek na dashboardzie.
- **[2026-05-28]** Wave 2: `student/presence`, `student/grades`, `student/homework/index`, `student/homework/[id]` — themowane (motyw zamiast hardkodowanych kolorów).

## 7. Moduł nauczyciela (`app/(teacher)/`)
- **[2026-05-28]** **NOWY** moduł frekwencji `teacher/attendance/[lessonId].tsx` + `teacher/attendance/_layout.tsx` (Stack). Tylko nauczyciel‑właściciel lekcji może wejść (sprawdzane przez `auth.currentUser.uid === lesson.teacherId`, w przeciwnym razie ekran „Brak uprawnień"). UI: karta z opisem lekcji, lista uczniów z 3 togglami (Obecny / Spóźnienie / Nieobecny — kolory z motywu) + przycisk „Wszyscy obecni" + Zapisz. Save → `upsertAttendance` w `Promise.all` dla wszystkich z ustawionym statusem. Rekordy są od razu widoczne w ekranie obecności ucznia (`student/presence`) — pobiera z tej samej kolekcji `Attendance`. Wpięte: `Tabs.Screen "attendance" href:null` w teacher layout + przycisk **„Sprawdź obecność"** na `lesson/[id].tsx` dla nauczyciela‑właściciela.
- **[2026-05-28]** `teacher/lessons/new.tsx` — duża zmiana formularza tworzenia lekcji:
  - **Tryb create + edit** w jednym pliku (param `id` → edycja, prefil z `getLessonById`, tytuł „Edycja lekcji").
  - **Godzina co 15 min** — wcześniej free-text HH:MM (można było wpisać 9:17). Teraz `Pressable` otwierający modal z listą slotów od 7:00 do 21:00 (krok 15 min).
  - **Czas trwania jako godziny lekcyjne** — picker 1–4 godz. lekcyjnych zamiast wolnego pola „min". `durationMin` liczony jako `units*45 + (units-1)*15` (przerwy między lekcjami doliczane automatycznie).
  - **Walidacja konfliktów** — przed zapisem fetch wszystkich lekcji nauczyciela i `lessonsConflict()`. Blokuje zapis z czytelnym komunikatem (nazwa + godzina kolidującej lekcji) jeśli nakładają się lub mają mniej niż 15 min przerwy.
  - W trybie edycji konflikt z samą sobą jest pomijany (`l.id !== id`).
- **[2026-05-28]** `teacher/_layout.tsx` — w dolnej pigułce widoczne **tylko Panel + Profil**. Kalendarz dostępny z kafelka dashboardu (`href: null` na calendar).
- **[2026-05-27]** `teacher/calendar.tsx` — **NOWY**, lista lekcji nauczyciela + Calendar z kropkami + przycisk „+ Nowa lekcja".
- **[2026-05-27]** `teacher/lessons/_layout.tsx` + `teacher/lessons/new.tsx` — **NOWE**: formularz tworzenia lekcji (Calendar do daty, HH:MM, czas trwania, online + link, multi-select uczniów).
- **[2026-05-27]** `teacher/_layout.tsx` — przepięty na `useTabScreenOptions`; ukryta zakładka `lessons`, widoczna `calendar`; dodany kafelek Kalendarz w dashboardzie.
- **[2026-05-28]** Wave 2: `teacher/calendar`, `teacher/lessons/new`, `teacher/tasks/{index,create,task}` — themowane (motyw + Card/Badge/TextField/Button).

## 8. Moduł rodzica (`app/(parent)/`) — **NOWY** (FAZA 2.1)
- **[2026-05-27]** Guard `(parent)/_layout.tsx` (jak inne role) + Tabs `(parent)/parent/_layout.tsx` (Panel + Profil widoczne, reszta `href:null`).
- **[2026-05-27]** Dashboard `parent/index.tsx` — selektor dziecka (chipy gdy >1, karta gdy =1, empty-state gdy 0); 4 kafelki (Oceny/Frekwencja/Zadania/Kalendarz) przekazują `childId` jako route param.
- **[2026-05-27]** Read-only ekrany dziecka (re-używają istniejące serwisy z UID-em dziecka): `parent/grades.tsx`, `parent/attendance.tsx`, `parent/homework.tsx`, `parent/calendar.tsx`.
- **[2026-05-27]** `parent/profile.tsx` — re-eksport `(shared)/profile`.
- **[2026-05-27]** Hook `src/hooks/useChild.ts` — ładowanie danych dziecka po UID dla nagłówków ekranów rodzica.
- **[2026-05-28]** Wave 2: cały moduł rodzica themowany.

## 9. Panel admina (`app/(admin)/`)
- **[2026-05-28]** **NOWY** ekran `admin/groups.tsx` — CRUD grup uczniów (tylko admin). Lista z licznikiem członków + Card. Modal create/edit: nazwa, opis (multiline), multi-select uczniów. Usuwanie z destruktywnym potwierdzeniem. Pull-to-refresh + EmptyState. Wpięte do nawigacji: `Tabs.Screen "admin/groups" href:null` + kafelek na panelu admina (niebieski, icon `groups`).
- **[2026-05-28]** `(admin)/_layout.tsx` — w dolnej pigułce widoczne **tylko Panel + Profil**. Konta i Przedmioty otwierane z kafelków/statystyk panelu (`href: null`).
- **[2026-05-27]** `admin/users.tsx` — multi-select dzieci dla roli `parent` (z listy uczniów); `parent` w filtrze ról i selektorze formularza.
- **[2026-05-28]** Wave 2: `admin/users`, `admin/subjects` — themowane (Screen-equivalent + Card + Badge + TextField + Button + themowany modal).
- **[2026-05-28]** `admin/_layout.tsx` — przepięty na `useTabScreenOptions` (był jedynym layoutem ze starym `Colors[scheme]`).
- **[2026-05-28]** `admin/index.tsx` — dashboard z **kartą statystyk** (łącznie + per rola: Uczniowie/Nauczyciele/Rodzice/Admini). Każda liczba per-rola jest klikalna → `router.push("/admin/users", { role })`.
- **[2026-05-28]** `admin/users.tsx` — chipy filtra przepisane: `View` z `flexWrap`+`alignItems:"center"` zamiast horizontal ScrollView (nie rozciągały się już w pionie, nic nie obcina). **Polskie etykiety**: Wszyscy / Uczniowie / Nauczyciele / Administratorzy / Rodzice (wartości filtra zostają angielskie — zgodne z DB).
- **[2026-05-28]** `admin/users.tsx` — `useLocalSearchParams` odczytuje param `role` i ustawia filtr (działa z kliknięciami ze statystyk).

## 10. Współdzielone, gość (`app/(shared)/`, `app/(guest)/`)
- **[2026-05-28]** `(guest)/guest/index.tsx` — themowane (animacje Reanimated zachowane, kolory z motywu).
- **[2026-05-28]** `(guest)/_layout.tsx` — przepięty na `useTabScreenOptions`.
- **[2026-05-28]** `(shared)/profile/*` — patrz sekcja 5.

## 11. Routing / root (`app/index.tsx`, `app/_layout.tsx`)
- **[2026-05-28]** `app/lesson/[id].tsx` — przyciski **Edytuj** (Pressable → `/teacher/lessons/new?id=X`, prefil) i **Usuń** (Alert z destruktywnym potwierdzeniem → `deleteLesson()`). Widoczne tylko gdy zalogowany użytkownik to nauczyciel‑właściciel lekcji (`role==="teacher" && uid===lesson.teacherId`).
- **[2026-05-28]** Nowa trasa **`app/lesson/[id].tsx`** — wspólny ekran szczegółów lekcji (data PL, godzina, czas trwania, lokalizacja/online + klikalny meeting URL, nauczyciel, lista uczniów). Dostępna dla wszystkich ról (poza guardami) przez `router.push("/lesson/{id}")`. Kafelki lekcji w `LessonsCalendar` (student + rodzic) i `teacher/calendar` są teraz `Pressable` i prowadzą tutaj.
- **[2026-05-27]** `app/index.tsx` — `roleRoutes` rozszerzone o `parent: "/(parent)/parent"`.
- **[2026-05-27]** `app/_layout.tsx` — dodany `<Stack.Screen name="(parent)" />`.
- **[2026-05-28]** `app/_layout.tsx` — usunięty import z `@react-navigation/native` (przy SDK 56 expo-router go nie tolerował); `ThemeProvider` zastąpiony naszym `useTheme`, Stack dostaje `contentStyle: { backgroundColor: theme.bg }` (brak białych błysków w dark).

## 12. Cleanup / sprzątanie
- **[2026-05-27]** Usunięty osierocony szablon Expo: cały folder `app/(tabs)/` + `app/modal.tsx`. Nic do nich nie nawigowało; ciągnęły przestarzały `expo-av`.
- **[2026-05-27]** Naprawione błędne ścieżki importów (`@/components/...` → `@/src/components/...`, `../../components/...` → `../../src/components/...`) w plikach, które tymczasowo zostawiałem; potem skasowane razem z `(tabs)`.
- **[2026-05-28]** `NavigationItem` — `Route` → `Href` (po peer-upgrade expo-router).

## 13. Infrastruktura (deps, Firebase, SDK)
- **[2026-05-28]** **Rename projektu** na `klaspio` wszędzie:
  - `app.json` — `name: "Klaspio"`, `slug: "klaspio"`, `scheme: "klaspio"`, `ios.bundleIdentifier: "com.klaspio.app"`, `android.package: "com.klaspio.app"`.
  - `package.json` + `package-lock.json` — `"name": "klaspio"`.
  - `.firebaserc` — `default: "klaspio"` (placeholder — podmień na faktyczny Firebase project ID, jeśli używasz `firebase deploy`).
  - `.env.example` — placeholdery zamiast realnych kluczy starego projektu Firebase.
  - `klaspo/README.md` — przepisany pod aktualną strukturę.
  - GUI: nagłówek logowania („Witaj w Klaspio") i ekran gościa (tytuł „Klaspio") już od fali 2 z poprawną nazwą.
- **[2026-05-27]** `react-native-calendars` zainstalowany do FAZY 2.2 (kalendarze + formularz lekcji).
- **[2026-05-27]** `.env` utworzony z `.env.example` (do uruchamiania w dev).
- **[2026-05-28]** Instrukcje migracji projektu na własne konto Firebase (osobny dokument w chacie — nie w repo).
- **[2026-05-28]** Reguły bezpieczeństwa Firestore — wariant dev („dowolny zalogowany"), do produkcji warto dokręcić.
- **[2026-05-28]** SDK Expo: przypadkowo skoczyło z 54 → 56 podczas `npx expo install`. Cofnięte z powrotem do 54 (pinowanie `expo`, `expo-router`, `expo-constants`, `expo-linking`, `expo-splash-screen`).
- **[2026-05-28]** Typecheck całego projektu: `npx tsc --noEmit` zwraca EXIT=0.

## 14. Status faz
- ✅ **FAZA 1** — domknięcie scope.
  - 1.1 zadania ucznia — działało; dodany `submittedAt`.
  - 1.2 profil — awatar + przycisk zmiany hasła w widoku.
  - 1.3 obecność — nowy moduł read-only.
- ✅ **FAZA 2.1** — rola rodzica + multi-select dzieci w adminie.
- ✅ **FAZA 2.2** — kalendarz / grafik dla studenta, rodzica i nauczyciela + tworzenie lekcji.
- ⏸️ **FAZA 2.3** — push (FCM) **odłożony** — wymaga dev buildu + EAS, nie działa w Expo Go.
- 🎨 **Design system** — fala 1 (foundation) + fala 2 (migracja ekranów) + tab bar „wyspa" + polish admin/profilu.
- 🔜 **FAZA 3** — i18n PL/EN + AI chatbot.
- 🔜 **FAZA 4** — chat uczeń↔nauczyciel, materiały (Gallery/Videos/Documents).
- ✅ **Grupy uczniów** — gotowe (zarządzanie w panelu admina). Następny krok: wykorzystanie grup w formularzach (lekcja, zadanie, frekwencja) — selektor „wybierz grupę" obok manualnego multi-selectu uczniów.

---

**Tip:** nowe wpisy dodawaj jako pierwsze w sekcji (na górze) — najnowsze najwyżej, łatwiej przeglądać.
