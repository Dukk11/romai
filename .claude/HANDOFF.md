# ROM.AI – Agent Handoff Document

> **Stand:** 2026-02-26
> **Letzte Aktion:** Alle Merge-Konflikte aufgelöst, TypeScript 0 Errors, npm install clean
> **App-Status:** Kompiliert fehlerfrei, alle Features funktional

---

## 1. Was ist ROM.AI?

Eine **Expo/React-Native Mobile-App** zur kamerabasierten **Gelenk-Winkelmessung** (Range of Motion).
Patienten oder Physiotherapeuten filmen ein Gelenk, die App erkennt per **TensorFlow.js BlazePose** die Landmarks, berechnet den Winkel und speichert ihn lokal in **SQLite**.

**Zielgruppen:** Patienten (Selbstmessung + Fortschritt) und Mediziner (Patientenverwaltung + Export).

---

## 2. Tech-Stack

| Schicht | Technologie | Version |
|---------|-------------|---------|
| Framework | Expo + React Native | 54.0 / 0.81 |
| Sprache | TypeScript (strict) | 5.9 |
| Navigation | React Navigation (Stack + Tabs) | 7.x |
| State | Zustand + persist (AsyncStorage) | 5.0 |
| ML/Pose | TensorFlow.js + BlazePose | 4.22 / 2.1 |
| Kamera | expo-camera + cameraWithTensors HOC | 17.0 |
| DB | expo-sqlite (lokal) | 16.0 |
| Charts | react-native-chart-kit | 6.12 |
| SVG | react-native-svg (Skeleton-Overlay) | 15.x |
| Backend | NestJS + Prisma (Stub, nicht verbunden) | 11 / 7.4 |

---

## 3. Projektstruktur

```
rom-ai/
├── App.tsx                          ← Root: DB init, Navigation, Role-Gate
├── index.ts                         ← Expo Entry
├── app/                             ← Screens (Expo Router Style, aber manuell per Stack)
│   ├── (tabs)/
│   │   ├── _layout.tsx              ← BottomTabs: Home + History
│   │   ├── index.tsx                ← Home → PatientDashboard / ProfessionalDashboard
│   │   └── history.tsx              ← Verlauf mit Gelenk-Picker, L/R Vergleich
│   ├── measurement/
│   │   ├── select-joint.tsx         ← Gelenk-Auswahl (Grid)
│   │   ├── camera.tsx               ← KERNSTÜCK: TF.js Kamera + Echtzeit-Erkennung
│   │   └── result.tsx               ← Ergebnis-Anzeige + DB-Insert
│   ├── onboarding.tsx               ← Rollen-Auswahl (Patient/Mediziner)
│   └── settings.tsx                 ← Einstellungen, CSV-Export, Mess-Parameter
├── src/
│   ├── components/
│   │   ├── PatientDashboard.tsx     ← Echtdaten aus DB, Streak, Fortschritt
│   │   └── ProfessionalDashboard.tsx ← Mediziner-Ansicht (TODO: echte Daten)
│   ├── constants/
│   │   ├── colors.ts               ← Farbpalette (primary, success, warning, error, neutral)
│   │   ├── joints.ts               ← 10 Gelenk-Konfigurationen mit Landmark-Triples
│   │   └── milestones.ts           ← Rehab-Meilensteine pro Woche
│   ├── hooks/
│   │   └── usePoseEstimation.ts    ← Custom Hook (aktuell nicht direkt genutzt)
│   ├── services/
│   │   └── database.ts             ← SQLite CRUD + mapRowToMeasurement()
│   ├── stores/
│   │   ├── userStore.ts            ← Zustand persist: role, settings
│   │   └── measurementStore.ts     ← Zustand: aktive Messung (wird kaum genutzt)
│   ├── types/
│   │   └── index.ts                ← Alle TypeScript-Interfaces
│   └── utils/
│       ├── angleCalculation.ts      ← calculateROM, smoothAngle, isStablePosition, calculatePelvicTilt, formatNeutralZero
│       ├── tfPoseEngine.ts          ← initTensorFlow(), estimateJointAngle(), detector
│       └── generateId.ts            ← UUID v4 Generator
└── backend/                         ← NestJS REST API (Stub, nicht verbunden)
```

---

## 4. Architektur-Entscheidungen

### Kamera-Pipeline (camera.tsx)
```
expo-camera → cameraWithTensors HOC → TF.js BlazePose
    ↓
Pose Keypoints → estimateJointAngle() → calculateROM()
    ↓
angleBuffer → smoothAngle(buffer, 5) → Moving Average
    ↓
isStablePosition(buffer, threshold, frames) → Auto-Freeze
    ↓
Haptic Feedback → Confirmation UI → result.tsx → DB INSERT
```

### Validierungs-Pipeline
- **Drift Detection**: Gelenk-Mittelpunkt darf max 150px vom Startpunkt abweichen
- **Pelvic Tilt**: Bei Hüft-/Kniemessungen wird die Beckenneigung geprüft (>15° = Ausweichbewegung)
- **Confidence Filter**: Alle 3 Keypoints brauchen Score ≥ 0.1

### Datenbank-Mapping (WICHTIG)
SQLite nutzt **snake_case** Spalten, TypeScript nutzt **camelCase** Interfaces.
Die Funktion `mapRowToMeasurement()` in `database.ts` übersetzt zwischen beiden.
NIEMALS `rows as Measurement[]` casten — das war der Original-Bug.

### State-Persistenz
Zustand mit `persist()` Middleware + AsyncStorage:
- `useUserStore`: `role` wird gespeichert → kein Onboarding-Loop bei Restart
- `useSettingsStore`: `defaultJoint`, `defaultSide`, `stabilityThreshold`, `stabilityFrames`

---

## 5. Bereits behobene Bugs

| # | Bug | Fix | Datei |
|---|-----|-----|-------|
| 1 | `Colors.warning[50]` undefined → Crash | Volle Farbpaletten (50-900) für warning + error | `colors.ts` |
| 2 | DB snake_case → camelCase Mismatch | `mapRowToMeasurement()` Mapping-Funktion | `database.ts` |
| 3 | Rolle nicht persistiert → Endlos-Onboarding | Zustand `persist()` mit AsyncStorage | `userStore.ts` |
| 4 | PatientDashboard nutzte Hardcoded-Daten | Rewrite mit echten DB-Daten + useFocusEffect | `PatientDashboard.tsx` |
| 5 | History nur "Knie Flexion" hardcoded | Gelenk-Picker mit 9 Optionen | `history.tsx` |
| 6 | UUID nicht kollisionssicher | `crypto.randomUUID()` mit Fallback | `generateId.ts` |
| 7 | `formatNeutralZero()` fehlte | Implementiert für alle Gelenke | `angleCalculation.ts` |
| 8 | `calculatePelvicTilt()` fehlte | Implementiert | `angleCalculation.ts` |
| 9 | Merge-Konflikte in 7 Dateien | Alle aufgelöst, TF.js + UI-Verbesserungen merged | Alle |
| 10 | Ungenutzte Dependencies | Cleanup: vision-camera, worklets, mediapipe, axios entfernt | `package.json` |

---

## 6. Bekannte Limitierungen / TODO

### Hoch-Priorität
- [ ] **TF.js Performance**: BlazePose `lite` Modell kann auf älteren Geräten langsam sein. Eventuell auf `full` upgraden oder ML Kit migrieren (User hat **Google MLKit** als Ziel gewählt)
- [ ] **ProfessionalDashboard**: Nutzt noch Mock-Daten. Muss wie PatientDashboard auf echte DB-Daten umgestellt werden
- [ ] **Backend nicht verbunden**: NestJS-Backend existiert als Stub. Sync-Queue in DB ist angelegt, aber kein API-Call implementiert

### Mittel-Priorität
- [ ] **Schmerzlevel-Eingabe**: `painLevel` Feld existiert in DB und Types, wird aber nirgends abgefragt
- [ ] **Video-Frame-Speicherung**: `videoFrameUri` Feld existiert, kein Screenshot bei Freeze
- [ ] **Notizen**: `notes` Feld existiert, kein Input im Result-Screen
- [ ] **measurementStore.ts**: Wird kaum genutzt, könnte entfernt oder für Live-Session-State verwendet werden
- [ ] **usePoseEstimation.ts**: Custom Hook existiert, wird aber nicht direkt in camera.tsx genutzt (camera.tsx hat eigene Logik)

### Niedrig-Priorität
- [ ] **Offline-Sync**: `sync_queue` Tabelle existiert, keine Implementierung
- [ ] **Auth**: Backend hat `auth/` Ordner, keine Implementierung
- [ ] **Multi-Patient**: `patient_id` Spalte existiert in DB, UI für Patientenverwaltung fehlt
- [ ] **i18n**: Alle Strings sind Deutsch hardcoded

---

## 7. Kritische Dateien für neue Features

| Feature | Hauptdateien |
|---------|-------------|
| Neue Gelenk-Konfiguration | `src/constants/joints.ts` + `angleCalculation.ts` (calculateROM switch) |
| ML-Engine ändern (z.B. MLKit) | `src/utils/tfPoseEngine.ts` + `app/measurement/camera.tsx` |
| Neuer Dashboard-Widget | `src/components/PatientDashboard.tsx` |
| DB-Schema erweitern | `src/services/database.ts` (initDatabase + INSERT + mapRow) + `src/types/index.ts` |
| Neue Einstellung | `src/stores/userStore.ts` (useSettingsStore) + `app/settings.tsx` |
| Neuer Screen | `app/` Ordner + `App.tsx` (Stack.Screen hinzufügen) |

---

## 8. Build & Run

```bash
# Dependencies installieren (--legacy-peer-deps wegen TF.js <> async-storage Peer-Conflict)
npm install --legacy-peer-deps

# TypeScript prüfen
npx tsc --noEmit

# Dev-Server starten
npx expo start -c --lan

# Auf Gerät: Expo Go App → QR-Code scannen
# ACHTUNG: TF.js + expo-camera braucht ein echtes Gerät (kein Web/Simulator)
```

---

## 9. Coding-Konventionen

- **Sprache im Code**: Kommentare und UI-Texte auf Deutsch
- **Typ-Sicherheit**: Strict TypeScript, keine `any` außer bei DB-Rows vor Mapping
- **State-Pattern**: Ref-Wrapped-State für Camera-Callbacks (verhindert Stale Closures)
  ```typescript
  const [value, _setValue] = useState(false);
  const valueRef = React.useRef(false);
  const setValue = (v: boolean) => { valueRef.current = v; _setValue(v); };
  ```
- **DB-Zugriff**: Immer über `database.ts` Service-Layer, nie direkt SQL in Screens
- **Farben**: Immer `Colors.xxx[N]` aus `colors.ts`, nie hardcoded Hex-Werte
- **Navigation**: `navigation.replace()` für irreversible Flows, `navigate()` für Stack-Push

---

## 10. Letzter bekannter Zustand

- `npx tsc --noEmit` → **0 Errors** ✅
- `npm install --legacy-peer-deps` → **877 packages, 0 vulnerabilities** ✅
- Keine Merge-Konflikte in Source-Dateien ✅
- `diff.txt` und altes `package-lock.json` hatten Marker → irrelevant ✅
