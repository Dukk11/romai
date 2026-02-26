Erstelle oder aktualisiere die Datei `.claude/HANDOFF.md` als vollständiges Übergabe-Dokument für den nächsten Agenten.

## Anweisungen

1. **Projekt analysieren**: Lies die wichtigsten Dateien und verstehe den aktuellen Stand:
   - `package.json` (Dependencies, Scripts)
   - `App.tsx` (Root-Komponente, Navigation)
   - `src/types/index.ts` (Alle Interfaces)
   - `src/services/database.ts` (DB-Schema, CRUD)
   - `src/stores/userStore.ts` (State-Management)
   - `src/constants/joints.ts` (Gelenk-Konfigurationen)
   - `app/measurement/camera.tsx` (Kernlogik: Pose-Erkennung)

2. **Zustand prüfen**: Führe `npx tsc --noEmit` aus und prüfe auf Merge-Konflikte mit `grep -r "<<<<<<< " --include="*.ts" --include="*.tsx"`.

3. **Git-Status**: Prüfe `git status` und `git log --oneline -10` für den aktuellen Branch-Stand.

4. **HANDOFF.md schreiben** mit folgender Struktur:
   - **Was ist die App** (1-2 Sätze)
   - **Tech-Stack** (Tabelle)
   - **Projektstruktur** (Baum mit Erklärungen)
   - **Architektur-Entscheidungen** (Kamera-Pipeline, DB-Mapping, State-Persistenz)
   - **Bereits behobene Bugs** (Tabelle)
   - **Bekannte Limitierungen / TODO** (priorisiert)
   - **Kritische Dateien pro Feature** (Tabelle)
   - **Build & Run** Anweisungen
   - **Coding-Konventionen**
   - **Letzter bekannter Zustand** (TS-Errors, npm, Merge-Status)

5. Falls `$ARGUMENTS` angegeben wurde, ergänze die Handoff mit diesem zusätzlichen Kontext: $ARGUMENTS

## Wichtig
- Das Dokument muss so vollständig sein, dass ein neuer Agent **ohne Rückfragen** weiterarbeiten kann
- Technische Details > Prosa. Tabellen und Code-Snippets bevorzugen
- Aktuelle Fehler und deren Status MÜSSEN dokumentiert werden
- Die Datei soll in `.claude/HANDOFF.md` geschrieben werden (überschreibt die vorherige Version)
