# Kabadiwala — Flutter Starter

A working skeleton covering all 8 planned screens, offline-first storage
(Hive), and a REST API layer ready to point at your backend.

## Run it

```bash
flutter create --project-name kabadiwala_app .   # if you haven't run `flutter create` in this folder yet
flutter pub get
flutter run
```

If you add or change fields on `ScrapTransaction`, delete
`lib/models/scrap_transaction.g.dart` and regenerate it with:

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

## What's wired up

- **Navigation**: Login → Home → the 6 feature screens, all routed in `main.dart`.
- **Offline-first**: `StorageService` writes every transaction to Hive
  immediately, then tries `ApiService.uploadTransaction()`. A
  `connectivity_plus` listener retries any unsynced transactions the
  moment the phone reconnects — this is the "20kg copper offline, syncs
  later" requirement from the spec.
- **Sell Scrap**: generates a UUID transaction ID on-device (works with
  zero connectivity), grabs GPS best-effort, computes value from a
  material price table.
- **Scan Scrap**: camera capture + a stubbed `classifyScrap()` call —
  swap the stub body in `api_service.dart` for your real AI endpoint.
- **Bilingual labels**: Hindi text alongside English on the primary
  screens as a starting point. For full i18n, add `flutter_localizations`
  and `.arb` files for Hindi/Marathi — the current labels are a
  placeholder, not a real localization setup.

## Next steps for the team

1. Replace `ApiService.baseUrl` with the real backend URL once it's deployed.
2. Wire real auth (OTP) into `LoginScreen` instead of the pass-through button.
3. Replace the stubbed price table in `SellScrapScreen`/`ApiService` with
   a live `/prices` endpoint.
4. Add proper `flutter_localizations` + `.arb` files for Hindi/Marathi
   instead of the inline bilingual strings.
5. Add audio prompts (e.g. `audioplayers` package) for low-literacy support.
6. Write widget tests for `StorageService` sync logic — that's the
   riskiest part to get wrong in front of judges/users.
