# Start-Prompt für Claude Code: Physio-Praxis-Website mit Online-Buchung

## Vorbereitung (einmalig, im Terminal)

1. GitHub CLI einloggen (die Skills legen Issues auf GitHub an): `gh auth login`
2. Neues Repo anlegen:
   `mkdir praxis-buchung && cd praxis-buchung && git init && gh repo create praxis-buchung --public --source=. `
3. Matt Pococks Skills installieren: `npx skills@latest add mattpocock/skills`
   Im Installer Claude Code als Agent wählen und mindestens diese Skills anhaken:
   setup-matt-pocock-skills, grill-me (bzw. grill-with-docs), to-prd, to-issues, tdd, diagnose (bzw. diagnosing-bugs), code-review, improve-codebase-architecture, git-guardrails-claude-code
   (Die Namen können sich je nach Version leicht unterscheiden, nimm die passenden.)
4. `claude` starten und alles ab der Linie unten einfügen.

---

Wir bauen zusammen ein Portfolio- und Verkaufsprojekt. Ich bin Frontend-Entwickler mit Angular/TypeScript-Berufserfahrung und gelernter Physiotherapeut. Ich will dieses Projekt (a) als Vorlage an Physiotherapiepraxen verkaufen und (b) als Fullstack- und DevOps-Referenz auf GitHub für Bewerbungen zeigen. Sprich mit mir auf Deutsch; Code, Issues, PRs und Commit-Messages auf Englisch.

## Schritt 0: Setup

1. Prüfe, welche Matt-Pocock-Skills installiert sind, und nenne sie mir kurz.
2. Führe `/setup-matt-pocock-skills` aus: Issue-Tracker = GitHub Issues dieses Repos, Doku unter `docs/` (ADRs unter `docs/adr/`).
3. Richte über den git-guardrails-Skill die Hooks ein, sodass du kein `git push`, `reset --hard` oder `clean` ausführst. Pushen und Mergen mache ich selbst, damit ich den Ablauf lerne.
4. Lege eine `CLAUDE.md` an mit den Lernregeln, dem Skill-Workflow und dem Projektumfang aus diesem Prompt, damit sie in jeder Sitzung gelten.

## Schritt 1: Planung mit den Skills

1. `/grill-me` auf den Projektumfang unten: Stell mir die kritischen Fragen, bevor wir bauen. Ich kenne Physiopraxen von innen, nutze das.
2. `/to-prd`: Schreib daraus ein PRD nach `docs/`.
3. `/to-issues`: Zerlege das PRD in GitHub-Issues als vertikale Slices, gruppiert nach den Meilensteinen unten (je Meilenstein ein GitHub-Milestone).
4. Zeig mir die Issue-Liste und warte auf mein OK.

## Arbeitsweise pro Issue

- Eigener Branch pro Issue, am Ende ein Pull Request, der das Issue schließt. Ich merge selbst, nachdem die CI grün ist.
- Logik mit `/tdd` bauen (Test zuerst, dann Code). Besonders die Slot-Berechnung.
- Bei Fehlern `/diagnose` statt raten.
- Vor jedem PR `/code-review` auf den eigenen Diff.
- Am Ende jedes Meilensteins einmal `/improve-codebase-architecture` und wichtige Entscheidungen als ADR festhalten.

## Lernmodus (wichtigste Regel)

- Vor jedem Issue: kurzer Plan (Dateien, Konzepte, Entscheidungen), dann auf mein OK warten.
- Erkläre Entscheidungen kurz und warum, vor allem alles außerhalb von Angular: NestJS, Datenbank, Docker, CI/CD, Server, Monitoring. Da will ich am meisten dazulernen.
- Lass mich pro Meilenstein mindestens einen Teil selbst schreiben: Datei mit `// TODO(Selemon):` und Hinweis anlegen, erklären, danach meinen Code reviewen. Bei DevOps-Meilensteinen gern auch eine Workflow-Datei oder ein Dockerfile-Teil.
- Am Ende jedes Meilensteins 2–3 Verständnisfragen an mich.
- Nicht vorpreschen: nie mehrere Issues am Stück ohne meine Freigabe.
- Aktuelle stabile Versionen über npm bzw. offizielle Doku prüfen, nicht aus dem Gedächtnis.

## Produkt

Konfigurierbare Website für eine einzelne Physiotherapiepraxis mit Online-Terminbuchung. Eine neue Praxis wird nur über eine Konfigurationsdatei angepasst (Name, Farben, Logo, Leistungen, Team, Kontakt), ohne Codeänderung.

### Muss rein (MVP)

1. Öffentliche Website: Start, Leistungen, Team, Kontakt, Impressum und Datenschutz (Platzhalter). Responsiv, mobil zuerst, barrierearm, schnell.
2. Online-Buchung: Leistung (mit Dauer) und optional Therapeut wählen, freie Zeitfenster sehen, Name/E-Mail/Telefon plus Datenschutz-Einwilligung, Bestätigungsmail mit Stornierungslink, Doppelbuchungen sicher verhindern (auch bei gleichzeitigen Anfragen).
3. Erinnerungsmail 24 h vor dem Termin (geplanter Job).
4. Admin-Bereich: Login, Öffnungszeiten und Verfügbarkeit pro Therapeut, Sperrzeiten, Terminliste mit Stornieren.

### Bewusst NICHT im MVP

Bezahlung, Rezepte/Abrechnung, Patientenakte oder Diagnosen, SMS, mehrere Praxen pro Instanz, native Apps. Datensparsam: keine Gesundheitsdaten, nur Name, Kontakt, Termin.

## Technik

- Frontend: Angular (Standalone Components, Signals), eigenes schlankes Styling
- Backend: NestJS, REST, Eingabevalidierung, Health-Endpoint (`/health` mit DB-Check)
- Server für die Live-Demo: ein kleiner VPS (frag mich, welchen ich nehme, bevor Meilenstein 8 beginnt)
- Datenbank: PostgreSQL mit Prisma (Migrationen, Seed-Daten für eine Demo-Praxis)
- E-Mail: Mailpit lokal, SMTP per Umgebungsvariable in Staging/Produktion
- Admin-Auth: gehashte Passwörter, HTTP-only Cookie oder JWT (Wahl erklären)
- Monorepo: `frontend/`, `backend/`, `infra/`, `docker-compose.yml`
- Tests: Unit-Tests (Slot-Logik gründlich mit Randfällen), Playwright-E2E für den Buchungsablauf

## CI/CD und DevOps (Kern jetzt, Ausbau später)

Ziel ist eine schlanke, aber echte Pipeline bis zur Live-Demo. Halte es bewusst einfach und erkläre mir jeden Schritt.

**Jetzt (im MVP)**
- CI mit GitHub Actions bei jedem PR: Lint, Typecheck, Unit-Tests, Build; npm-Caching; Status-Badge in der README
- Branch Protection auf `main`: nur per PR, CI muss grün sein (erkläre mir, wie ich das einstelle)
- Multi-Stage-Dockerfiles für Frontend und Backend, Non-Root-User; Docker Compose für lokal und Server
- Ein Deployment: bei Merge auf `main` Images bauen, in die GitHub Container Registry pushen und per SSH auf einen Server mit Docker Compose deployen; Prisma-Migrationen vor dem App-Start
- Secrets nur über GitHub Secrets bzw. `.env` auf dem Server; `.env.example` dokumentiert alle Variablen
- Caddy als Reverse Proxy mit automatischem HTTPS
- Tägliches Datenbank-Backup (pg_dump) mit kurzer Wiederherstellungs-Anleitung in der README

**Später (nicht jetzt bauen, nur als Issues mit Label `later` anlegen)**
- Getrennte Staging- und Produktionsumgebung mit manueller Freigabe
- Multi-Arch-Images (arm64 für Raspberry Pi), Rollback-Workflow, automatische Release-Notes
- Uptime-Monitoring mit Alarm, strukturierte Logs, Security-Scans, Dependabot/Renovate
- Playwright-E2E in der CI, ausführliches Runbook

## Meilensteine

1. Gerüst: Monorepo, Docker Compose lokal, Angular + NestJS + DB laufen, CI mit Lint/Test/Build, Branch Protection
2. Datenmodell und Konfiguration: Prisma-Schema, Seed-Daten, Praxis-Config-Datei
3. Öffentliche Website aus der Config
4. Slot-Berechnung mit TDD
5. Buchungsablauf plus Bestätigungs- und Stornomail
6. Erinnerungsjob
7. Admin-Bereich mit Login
8. Deployment: Produktions-Dockerfiles, Images nach GHCR, Deploy per SSH, HTTPS, Backup
9. Sicherheitscheck (Rate-Limiting auf Buchung, Validierung, Security-Header), ein Playwright-Test für den Buchungsablauf lokal, Feinschliff
10. Portfolio-Politur: README mit Screenshots, Architektur- und Pipeline-Diagramm, Setup-Anleitung, Link auf die Live-Demo, Zusammenfassung der ADRs

## Zeitrahmen

Etwa 3–5 Stunden am Tag, Ziel ist ein vorführbares Projekt mit Live-Demo in rund 4 Wochen. Wenn ein Meilenstein den Rahmen sprengt, sag es und schlag vor, was wir streichen oder auf `later` schieben.

Starte jetzt mit Schritt 0.
