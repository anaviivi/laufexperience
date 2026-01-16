// src/QuizPage.jsx
import React, { useMemo, useState } from "react";
import { useLanguage } from "./LanguageContext.jsx";

/* -------------------------
   Gamification-Regeln
-------------------------- */
const POINTS_PER_CORRECT = 10;

function calcBonus(scorePercent) {
  if (scorePercent === 100) return 25;
  if (scorePercent >= 80) return 10;
  return 0;
}
function calcBadge(scorePercent) {
  if (scorePercent === 100) return "Gold";
  if (scorePercent >= 80) return "Silber";
  if (scorePercent >= 60) return "Bronze";
  return null;
}

/* -------------------------
   Storage (Dashboard)
-------------------------- */
const DASHBOARD_KEY = "rq_dashboard_quiz";

function safeParseJSON(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function loadDashboardState() {
  const raw = localStorage.getItem(DASHBOARD_KEY);
  return safeParseJSON(raw, { totalPoints: 0, modules: {} });
}

function saveQuizResultToDashboard(payload) {
  const prev = loadDashboardState();

  const modules = { ...(prev.modules || {}) };
  modules[payload.moduleId] = { ...payload, lastPlayedAt: new Date().toISOString() };

  const next = {
    ...prev,
    totalPoints: Number(prev.totalPoints || 0) + Number(payload.totalPointsAdded || 0),
    modules,
  };

  localStorage.setItem(DASHBOARD_KEY, JSON.stringify(next));
  return next;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" });
}

/* -------------------------
   UI Texte
-------------------------- */
const UI_TEXT = {
  de: {
    title: "Quiz",
    subtitle:
      "Wähle ein Modul (je 10 Fragen). Am Ende bekommst du Punkte, Bonus und ggf. ein Badge fürs Dashboard.",
    moduleQuestions: (n) => `${n} Fragen`,
    start: "Starten",
    continue: "Weiter",
    backToModules: "Zurück zu den Modulen",
    topicLabel: "Bereich",
    questionLabel: "Frage",
    of: "von",
    tip: "Antwort wählen → prüfen → weiter. Du kannst auch zurück.",
    checkAnswer: "Antwort prüfen",
    prevQuestion: "Zurück",
    nextQuestion: "Weiter",
    finishQuiz: "Quiz beenden",
    correct: "Richtig! 🎯",
    wrong: "Nicht ganz. Schau dir die Erklärung an.",
    quizDoneTitle: "Modul abgeschlossen 🎉",
    quizDoneText: (correct, total, percent) =>
      `Du hast ${correct} von ${total} Fragen richtig beantwortet (${percent}%).`,
    pointsEarned: (points, bonus, total) =>
      `Punkte: ${points} · Bonus: ${bonus} · Gesamt: ${total}`,
    badgeEarned: (badge) => `Badge: ${badge}`,
    saveToDashboard: "Punkte speichern",
    savedToDashboard: "Ergebnis wurde fürs Dashboard gespeichert.",
    restart: "Modul nochmal starten",
    unansweredHint: (n) => `Es fehlen noch ${n} Antworten.`,
    moduleCountError: "Dieses Modul hat nicht genau 10 Fragen (bitte prüfen).",
    statusNew: "Noch nicht gespielt",
    statusBest: (p) => `Best: ${p}%`,
    statusBadge: (b) => `Badge: ${b}`,
    statusPlayedOn: (d) => `Zuletzt: ${d}`,
    modulesHeader: "Alle Module",
  },
  en: {
    title: "Quiz",
    subtitle:
      "Choose a module (10 questions each). At the end you’ll get points, a bonus and optionally a badge for your dashboard.",
    moduleQuestions: (n) => `${n} questions`,
    start: "Start",
    continue: "Continue",
    backToModules: "Back to modules",
    topicLabel: "Topic",
    questionLabel: "Question",
    of: "of",
    tip: "Pick → check → next. You can go back too.",
    checkAnswer: "Check answer",
    prevQuestion: "Previous",
    nextQuestion: "Next",
    finishQuiz: "Finish quiz",
    correct: "Correct! 🎯",
    wrong: "Not quite. Read the explanation.",
    quizDoneTitle: "Module completed 🎉",
    quizDoneText: (correct, total, percent) =>
      `You answered ${correct} out of ${total} correctly (${percent}%).`,
    pointsEarned: (points, bonus, total) =>
      `Points: ${points} · Bonus: ${bonus} · Total: ${total}`,
    badgeEarned: (badge) => `Badge: ${badge}`,
    saveToDashboard: "Save points",
    savedToDashboard: "Result saved for your dashboard.",
    restart: "Restart module",
    unansweredHint: (n) => `${n} answers missing.`,
    moduleCountError: "This module does not have exactly 10 questions (please check).",
    statusNew: "Not played yet",
    statusBest: (p) => `Best: ${p}%`,
    statusBadge: (b) => `Badge: ${b}`,
    statusPlayedOn: (d) => `Last: ${d}`,
    modulesHeader: "All modules",
  },
};

/* -------------------------
   QUIZ MODULES (8 × 10)
-------------------------- */
const QUIZ_MODULES = {
  de: [
    {
      id: "technik-basics",
      title: "Lauftechnik Basics",
      description: "Haltung, Effizienz, typische Fehler, Hüfte & Stabilität",
      questions: [
        { id: 1, topic: "Lauftechnik", question: "Wo sollte dein Fuß idealerweise beim lockeren Lauf aufsetzen?",
          answers: ["Weit vor dem Körper", "Unter dem Körperschwerpunkt", "Deutlich hinter dem Körper"],
          correctIndex: 1, explanation: "Unter dem Schwerpunkt reduziert Bremskräfte und entlastet Knie/Hüfte." },
        { id: 2, topic: "Lauftechnik", question: "Welche Schrittfrequenz gilt als effizienter Zielbereich für viele Läufer*innen?",
          answers: ["120–140", "165–180", "200–220"],
          correctIndex: 1, explanation: "165–180 S/min führt oft zu kürzeren Schritten und weniger Aufprall." },
        { id: 3, topic: "Lauftechnik", question: "Was bedeutet „Overstriding“?",
          answers: ["Zu kurze Schritte", "Zu lange Schritte vor dem Körper", "Zu geringe Armarbeit"],
          correctIndex: 1, explanation: "Zu lange Schritte bremsen und erhöhen die Stoßbelastung." },
        { id: 4, topic: "Haltung", question: "Welche Oberkörperhaltung ist für effizientes Laufen am sinnvollsten?",
          answers: ["Aufrecht, locker, leichte Vorneigung aus dem ganzen Körper", "Stark nach hinten lehnen", "Rundrücken mit hochgezogenen Schultern"],
          correctIndex: 0, explanation: "Locker-aufrecht verbessert Atmung, Stabilität und Energieeffizienz." },
        { id: 5, topic: "Arme", question: "Wie sollten sich die Arme idealerweise bewegen?",
          answers: ["Über Kreuz vor dem Körper", "Vor–zurück, ca. 90° Winkel", "Seitlich weit ausholen"],
          correctIndex: 1, explanation: "Vor–zurück stabilisiert den Lauf, Überkreuzen erzeugt Rotation." },
        { id: 6, topic: "Effizienz", question: "Was ist ein typisches Zeichen für ineffizientes „Stampfen“?",
          answers: ["Sehr kurze Schritte mit weicher Landung", "Zu lange Schritte & harte Landung", "Entspannte Schultern"],
          correctIndex: 1, explanation: "Harte Landung kommt oft durch Overstriding oder fehlende Stabilität." },
        { id: 7, topic: "Hüfte", question: "Wofür ist aktive Hüftstreckung („Hip Drive“) wichtig?",
          answers: ["Mehr Vortrieb & bessere Kraftübertragung", "Nur fürs Aussehen", "Nur für Sprint"],
          correctIndex: 0, explanation: "Mehr Schub aus der Hüfte = effizienterer Schritt." },
        { id: 8, topic: "Technik", question: "Was ist beim lockeren Laufstil meistens besser?",
          answers: ["Locker, rhythmisch, kontrolliert", "Maximaler Kniehub dauerhaft", "Verkrampfen und pressen"],
          correctIndex: 0, explanation: "Lockerheit reduziert Energieverbrauch und Überlastungen." },
        { id: 9, topic: "Blick", question: "Wohin sollte dein Blick beim Laufen überwiegend gehen?",
          answers: ["Auf die Füße", "1–2 Meter voraus", "Nur nach oben"],
          correctIndex: 1, explanation: "Vorausschau verbessert Haltung und Stabilität." },
        { id: 10, topic: "Grundsatz", question: "Was ist meist wichtiger als „Ferse vs. Vorfuß“?",
          answers: ["Laut auftreten", "Kontrolliert unter dem Körper landen", "Immer Vorfuß laufen"],
          correctIndex: 1, explanation: "Entscheidend ist der Aufsatz unter dem Schwerpunkt." },
      ],
    },

    {
      id: "fussaufsatz-untergrund",
      title: "Fußaufsatz & Untergrund",
      description: "Ferse/Mittelfuß/Vorfuß, Trail, Bergauf/Bergab",
      questions: [
        { id: 1, topic: "Fußaufsatz", question: "Welcher Laufstil ist bei Anfänger*innen häufig am verbreitetsten?",
          answers: ["Vorfußlauf", "Fersenlauf", "Nur Mittelfußlauf"],
          correctIndex: 1, explanation: "Viele Einsteiger landen zuerst auf der Ferse – oft wegen langer Schritte." },
        { id: 2, topic: "Fußaufsatz", question: "Welche Technik ist für viele Läufer*innen eine gute Mischung aus Effizienz & Schonung?",
          answers: ["Mittelfußlauf", "Dauerhafter Vorfußlauf", "Immer harter Fersenlauf"],
          correctIndex: 0, explanation: "Mittelfuß ist oft ökonomisch und weniger bremsend." },
        { id: 3, topic: "Sprint", question: "Welcher Fußaufsatz ist beim Sprint meist technisch korrekt?",
          answers: ["Ferse zuerst", "Mittelfuß zuerst", "Vorfuß/Ballen"],
          correctIndex: 2, explanation: "Sprint = kurze Bodenkontaktzeit, meist Vorfuß/Ballen." },
        { id: 4, topic: "Belastung", question: "Welche Struktur ist beim Vorfußlauf häufig stärker belastet?",
          answers: ["Waden & Achillessehne", "Ellenbogen", "Nacken"],
          correctIndex: 0, explanation: "Vorfußlastig erhöht Last auf Wade/Achillessehne – Umstellung langsam." },
        { id: 5, topic: "Bergauf", question: "Was ist bergauf meist sinnvoll?",
          answers: ["Kürzere Schritte + leichte Vorneigung", "Sehr lange Schritte", "Zurücklehnen"],
          correctIndex: 0, explanation: "Kurz & rhythmisch spart Kraft und hält die Frequenz stabil." },
        { id: 6, topic: "Bergab", question: "Was ist bergab meistens besser?",
          answers: ["Kurze, schnelle Schritte", "Lange, bremsende Schritte", "Stark zurücklehnen"],
          correctIndex: 0, explanation: "Kurze Schritte reduzieren Bremskräfte und schonen Knie." },
        { id: 7, topic: "Trails", question: "Welche Strategie ist auf Trails am sinnvollsten?",
          answers: ["Blick auf die Schuhe", "Blick 1–2 m voraus + kontrollierte Schritte", "Maximales Tempo egal was passiert"],
          correctIndex: 1, explanation: "Vorausschau + Kontrolle = Stabilität und weniger Umknick-Risiko." },
        { id: 8, topic: "Natural Running", question: "Was ist beim Minimal-/Barfußstil entscheidend?",
          answers: ["Sofort lange Läufe", "Sehr langsame Eingewöhnung", "Nur andere Schnürung"],
          correctIndex: 1, explanation: "Zu schnelle Umstellung erhöht Überlastungsrisiko deutlich." },
        { id: 9, topic: "Fehler", question: "Typischer Fehler bergab ist …",
          answers: ["Leichte Vorneigung", "Zurücklehnen & Bremsen", "Kurze Schritte"],
          correctIndex: 1, explanation: "Zurücklehnen verstärkt Bremskräfte und belastet Knie/Quadrizeps." },
        { id: 10, topic: "Grundsatz", question: "Was ist der wichtigste Grundsatz beim Auftreten?",
          answers: ["Laut auftreten", "Kontrolliert unter dem Körper landen", "Immer Vorfuß laufen"],
          correctIndex: 1, explanation: "Der Ort des Aufsatzes (unter dem Schwerpunkt) ist zentral." },
      ],
    },

    {
      id: "cadence-arme",
      title: "Schrittfrequenz & Armtechnik",
      description: "Cadence, Armswing, Schulterspannung, Rhythmus",
      questions: [
        { id: 1, topic: "Cadence", question: "Cadence bedeutet …",
          answers: ["Puls", "Schritte pro Minute", "Schrittlänge"],
          correctIndex: 1, explanation: "Cadence = Steps per Minute." },
        { id: 2, topic: "Cadence", question: "Warum hilft eine höhere Cadence oft?",
          answers: ["Sie macht automatisch schneller", "Sie verkürzt Schritte und reduziert Bremskräfte", "Sie erhöht Overstriding"],
          correctIndex: 1, explanation: "Kürzere Schritte = weniger Aufprall & weniger Bremsen." },
        { id: 3, topic: "Cadence", question: "Welcher Zielbereich ist häufig sinnvoll?",
          answers: ["120–140", "165–180", "210–230"],
          correctIndex: 1, explanation: "165–180 ist ein gängiger Orientierungsbereich." },
        { id: 4, topic: "Arme", question: "Typischer Armwinkel beim Laufen?",
          answers: ["Ca. 90°", "0° (gestreckt)", "180° (starr)"],
          correctIndex: 0, explanation: "90° ist ein guter Richtwert – locker, nicht verkrampft." },
        { id: 5, topic: "Arme", question: "Arme sollten sich primär …",
          answers: ["seitlich bewegen", "vor–zurück bewegen", "über Kreuz drehen"],
          correctIndex: 1, explanation: "Vor–zurück unterstützt Rhythmus und verhindert Rotation." },
        { id: 6, topic: "Schultern", question: "Schultern sollten …",
          answers: ["hochgezogen sein", "locker sein", "nach hinten gepresst sein"],
          correctIndex: 1, explanation: "Lockere Schultern helfen Atmung und sparen Energie." },
        { id: 7, topic: "Fehler", question: "Was kostet häufig unnötig Energie?",
          answers: ["Arme eng am Körper", "Arme überkreuzen", "Lockere Hände"],
          correctIndex: 1, explanation: "Überkreuzen erzeugt Rotation im Oberkörper." },
        { id: 8, topic: "Praxis", question: "Wie kann man Cadence einfach trainieren?",
          answers: ["Mit Metronom/Musik (BPM)", "Schritte maximal verlängern", "Nur bergab sprinten"],
          correctIndex: 0, explanation: "BPM hilft, einen stabilen Rhythmus zu lernen." },
        { id: 9, topic: "Technik", question: "Welche Handhaltung ist sinnvoll?",
          answers: ["Faust verkrampft", "Locker (als würdest du ein Chip/Blatt halten)", "Finger maximal spreizen"],
          correctIndex: 1, explanation: "Lockere Hände reduzieren Spannung im Oberkörper." },
        { id: 10, topic: "Fortschritt", question: "Was ist ein guter Technik-Ansatz?",
          answers: ["Alles auf einmal ändern", "Eine Sache pro Woche fokussieren", "Nur neue Schuhe kaufen"],
          correctIndex: 1, explanation: "Kleine Änderungen sind nachhaltiger und verletzungsärmer." },
      ],
    },

    {
      id: "warmup-cooldown",
      title: "Warm-up & Cool-down",
      description: "Vorbereitung, dynamische Übungen, Runterfahren nach dem Lauf",
      questions: [
        { id: 1, topic: "Warm-up", question: "Warum ist Warm-up sinnvoll?",
          answers: ["Es erhöht das Verletzungsrisiko", "Es bereitet Muskeln/Gelenke auf Belastung vor", "Es macht nur müde"],
          correctIndex: 1, explanation: "Aktivierung verbessert Beweglichkeit und reduziert Überlastungsrisiko." },
        { id: 2, topic: "Warm-up", question: "Was ist vor dem Lauf meist besser als langes statisches Dehnen?",
          answers: ["Dynamische Mobilität (Leg Swings, lockeres Einlaufen)", "Gar nichts", "Direkt Sprint"],
          correctIndex: 0, explanation: "Dynamik aktiviert statt zu „beruhigen“." },
        { id: 3, topic: "Warm-up", question: "Ein gutes Warm-up sollte …",
          answers: ["10 Sekunden dauern", "Von leicht zu etwas intensiver steigern", "Direkt maximal sein"],
          correctIndex: 1, explanation: "Progression bringt Kreislauf und Muskulatur auf Temperatur." },
        { id: 4, topic: "Warm-up", question: "Welche Übung passt gut als dynamische Aktivierung?",
          answers: ["Leg Swings", "Statisch bis Schmerz", "Sofort 100% Sprint"],
          correctIndex: 0, explanation: "Leg Swings = dynamisch & laufnah." },
        { id: 5, topic: "Cool-down", question: "Was gehört zu einem guten Cool-down?",
          answers: ["Sprinten", "Locker auslaufen + leichtes Dehnen", "Direkt hinsetzen"],
          correctIndex: 1, explanation: "Runterfahren unterstützt Kreislauf und Erholung." },
        { id: 6, topic: "Cool-down", question: "Warum kann lockeres Auslaufen helfen?",
          answers: ["Es macht schneller", "Es unterstützt die Rückkehr zur Ruhe und lockert die Muskulatur", "Es verhindert jeden Muskelkater"],
          correctIndex: 1, explanation: "Hilft beim Runterregeln nach intensiven Reizen." },
        { id: 7, topic: "Dehnen", question: "Wann sind statische Dehnübungen oft sinnvoller?",
          answers: ["Vor dem Sprint", "Nach dem Lauf oder an separaten Mobility-Tagen", "Während des Laufens"],
          correctIndex: 1, explanation: "Nach dem Training oder separat passt statisch meist besser." },
        { id: 8, topic: "Praxis", question: "Welche Aussage trifft am ehesten zu?",
          answers: ["Warm-up ist optional, Cool-down Pflicht", "Beides ist sinnvoll, aber kurz & passend", "Beides ist Zeitverschwendung"],
          correctIndex: 1, explanation: "Kurz & passend ist besser als gar nicht – oder zu viel." },
        { id: 9, topic: "Fehler", question: "Was ist ein typisches Warm-up-Problem?",
          answers: ["Zu früh zu schnell", "Locker starten", "Mobilität nutzen"],
          correctIndex: 0, explanation: "Zu früh zu schnell = höheres Risiko für Zerrungen/Reizungen." },
        { id: 10, topic: "Praxis", question: "Was passt gut nach einem harten Intervalltraining?",
          answers: ["Direkt sitzen bleiben", "5–10 Min lockeres Auslaufen", "Noch ein Sprint-Finish"],
          correctIndex: 1, explanation: "Lockeres Auslaufen bringt Puls und Atem wieder runter." },
      ],
    },

    {
      id: "praevention-regeneration",
      title: "Verletzungsprävention & Regeneration",
      description: "Shin Splints, Überlastung, Schlaf, Erholung, Warnzeichen",
      questions: [
        { id: 1, topic: "Prävention", question: "Häufigste Ursache für Laufverletzungen ist …",
          answers: ["Technik + zu schnelle Belastungssteigerung", "Zu viel Wasser", "Zu wenig Motivation"],
          correctIndex: 0, explanation: "Überlastung + ungünstige Muster sind Klassiker." },
        { id: 2, topic: "Verletzungen", question: "Shin Splints betreffen typischerweise …",
          answers: ["Schienbein", "Schulter", "Handgelenk"],
          correctIndex: 0, explanation: "Schienbeinkantensyndrom = Schmerz entlang des Schienbeins." },
        { id: 3, topic: "Regeneration", question: "Wann passiert die Anpassung an Training überwiegend?",
          answers: ["Während der Pause/Regeneration", "Nur beim Intervall", "Nur beim Dehnen"],
          correctIndex: 0, explanation: "Training setzt Reiz – Anpassung passiert in der Erholung." },
        { id: 4, topic: "Warnzeichen", question: "Typisches Zeichen von Übertraining ist …",
          answers: ["Anhaltende Müdigkeit/Leistungseinbruch", "Mehr Energie", "Bessere Regeneration"],
          correctIndex: 0, explanation: "Wenn’s trotz Training schlechter wird: Belastung steuern." },
        { id: 5, topic: "Steuerung", question: "Was reduziert Überlastungsrisiko am meisten?",
          answers: ["Sprunghafte Umfangsteigerung", "Schrittweise Progression + Ruhetage", "Nur harte Einheiten"],
          correctIndex: 1, explanation: "Konstanz + Pausen sind die Basis." },
        { id: 6, topic: "Schlaf", question: "Warum ist Schlaf so wichtig?",
          answers: ["Regeneration & Hormonhaushalt", "Nur fürs Immunsystem", "Macht automatisch schneller"],
          correctIndex: 0, explanation: "Schlaf unterstützt Reparaturprozesse und Anpassung." },
        { id: 7, topic: "Tools", question: "Was kann Regeneration unterstützen?",
          answers: ["Faszienrolle, lockere Bewegung, Schlaf", "Nur Fast Food", "Nur mehr Intensität"],
          correctIndex: 0, explanation: "Durchblutung + Schlaf + Entlastung = solide Basis." },
        { id: 8, topic: "Achillessehne", question: "Was ist bei plötzlich viel Vorfußlauf besonders riskant?",
          answers: ["Achillessehnen-/Wadenreizungen", "Ellbogenprobleme", "Nasenbluten"],
          correctIndex: 0, explanation: "Vorfuß erhöht Last auf Wade/Achillessehne – langsam steigern." },
        { id: 9, topic: "Kraft", question: "Warum hilft Krafttraining Läufer*innen oft?",
          answers: ["Bessere Stabilität & weniger Überlastung", "Es macht langsamer", "Nur für Bodybuilder"],
          correctIndex: 0, explanation: "Stabilität = robustere Strukturen + sauberere Technik." },
        { id: 10, topic: "Praxis", question: "Bestes Präventions-„Paket“ ist …",
          answers: ["Schmerzen ignorieren", "Technik + Belastungssteuerung + Regeneration", "Nur Dehnen"],
          correctIndex: 1, explanation: "Kombination gewinnt: smart trainieren, smart erholen." },
      ],
    },

    {
      id: "ernaehrung",
      title: "Ernährung (vor/nach dem Lauf)",
      description: "Energie, Regeneration, Timing, Hydration",
      questions: [
        { id: 1, topic: "Vor dem Lauf", question: "Was ist vor einem lockeren Lauf (45–60 Min) oft sinnvoll?",
          answers: ["Sehr fettiges Essen direkt davor", "Leichter Snack mit Kohlenhydraten (z. B. Banane/Toast)", "Gar nichts essen und trinken"],
          correctIndex: 1, explanation: "Leicht verdauliche Carbs geben Energie ohne Magenstress." },
        { id: 2, topic: "Energie", question: "Welcher Makronährstoff liefert beim Laufen hauptsächlich Energie?",
          answers: ["Kohlenhydrate", "Proteine", "Vitamin C"],
          correctIndex: 0, explanation: "Carbs sind der wichtigste Energieträger bei intensiveren Läufen." },
        { id: 3, topic: "Nach dem Lauf", question: "Was ist nach dem Lauf besonders sinnvoll?",
          answers: ["Protein + Kohlenhydrate", "Nur Fett", "Gar nichts"],
          correctIndex: 0, explanation: "Protein repariert, Carbs füllen Speicher auf." },
        { id: 4, topic: "Timing", question: "Wann ist eine größere Mahlzeit vor einem Lauf oft besser?",
          answers: ["5 Minuten davor", "1–2 Stunden vorher", "Direkt nach dem Lauf"],
          correctIndex: 1, explanation: "Zeit für Verdauung senkt Risiko für Magenprobleme." },
        { id: 5, topic: "Hydration", question: "Warum sind Elektrolyte bei längeren Läufen relevant?",
          answers: ["Sie ersetzen Mineralstoffe, die über Schweiß verloren gehen", "Sie machen automatisch schneller", "Sie ersetzen Schlaf"],
          correctIndex: 0, explanation: "Natrium & Co. unterstützen den Flüssigkeitshaushalt." },
        { id: 6, topic: "Fehler", question: "Was sollte man vor dem Lauf eher vermeiden?",
          answers: ["Leicht verdauliche Carbs", "Schwere, sehr fettige Mahlzeiten", "Wasser in kleinen Mengen"],
          correctIndex: 1, explanation: "Fettig/schwer = langsame Verdauung → Magenstress." },
        { id: 7, topic: "Regeneration", question: "Warum hilft Essen nach dem Lauf bei Regeneration?",
          answers: ["Es füllt Speicher und liefert Baustoffe", "Es verhindert jeden Muskelkater", "Es ersetzt Training"],
          correctIndex: 0, explanation: "Energie + Protein unterstützen Anpassung." },
        { id: 8, topic: "Praxis", question: "Ein gutes Post-Run-Beispiel ist …",
          answers: ["Joghurt + Obst + Hafer", "Nur Chips", "Nur Kaffee"],
          correctIndex: 0, explanation: "Carbs + Protein + Flüssigkeit = solide Basis." },
        { id: 9, topic: "Lange Läufe", question: "Bei sehr langen Läufen ist oft wichtig …",
          answers: ["Keine Energie zuführen", "Carbs & Flüssigkeit währenddessen einplanen", "Nur Protein währenddessen"],
          correctIndex: 1, explanation: "Speicher werden leer → Nachschub hilft." },
        { id: 10, topic: "Alltag", question: "Was ist der beste Ernährungs-Grundsatz?",
          answers: ["Alles strikt verbieten", "Einfach, regelmäßig, gut verträglich", "Nur Supplements"],
          correctIndex: 1, explanation: "Verträglichkeit & Konstanz schlagen komplizierte Regeln." },
      ],
    },

    {
      id: "atmung-vo2max",
      title: "Atmung & VO₂max",
      description: "Bauchatmung, Atemrhythmus, VO₂max verstehen & verbessern",
      questions: [
        { id: 1, topic: "VO₂max", question: "Was beschreibt VO₂max am besten?",
          answers: ["Maximale Sauerstoffaufnahmefähigkeit", "Maximale Schrittlänge", "Niedrigster Puls"],
          correctIndex: 0, explanation: "VO₂max zeigt, wie viel O₂ du maximal aufnehmen/verwerten kannst." },
        { id: 2, topic: "Training", question: "Welche Einheit verbessert VO₂max häufig besonders gut?",
          answers: ["Intervalltraining", "Nur sehr lockere Läufe", "Nur Dehnen"],
          correctIndex: 0, explanation: "Intervalle setzen starken Reiz für Herz-Kreislauf-System." },
        { id: 3, topic: "Atmung", question: "Welche Atemtechnik ist meist effizienter beim Laufen?",
          answers: ["Brustatmung", "Bauchatmung", "Luft anhalten"],
          correctIndex: 1, explanation: "Bauchatmung nutzt das Zwerchfell besser → ruhiger & effizienter." },
        { id: 4, topic: "Rhythmus", question: "Was bedeutet 2:2 Atemrhythmus?",
          answers: ["2 Schritte ein, 2 Schritte aus", "2 Minuten ein, 2 Minuten aus", "2 Atemzüge pro Schritt"],
          correctIndex: 0, explanation: "Atem wird an Schritte gekoppelt – hilft bei Kontrolle." },
        { id: 5, topic: "Praxis", question: "Was hilft oft gegen Seitenstechen?",
          answers: ["Ruhiger Rhythmus + tiefer atmen", "Noch schneller werden", "Luft anhalten"],
          correctIndex: 0, explanation: "Tiefe, ruhige Atmung stabilisiert und reduziert Stress." },
        { id: 6, topic: "Tempo", question: "Bei höherem Tempo ist häufig sinnvoll …",
          answers: ["Nur durch die Nase atmen", "Nase+Mund Kombination", "Gar nicht atmen"],
          correctIndex: 1, explanation: "Mund hilft, mehr Luftvolumen aufzunehmen." },
        { id: 7, topic: "Steuerung", question: "Woran merkt man, dass Easy Pace wirklich easy ist?",
          answers: ["Du kannst noch sprechen", "Du bist komplett außer Atem", "Du hast Krämpfe"],
          correctIndex: 0, explanation: "Talk-Test: Unterhaltung möglich = meist aerober Bereich." },
        { id: 8, topic: "VO₂max", question: "Welche Faktoren können VO₂max beeinflussen?",
          answers: ["Training, Technik, Schlaf/Regeneration", "Nur Schuhe", "Nur Musik"],
          correctIndex: 0, explanation: "Mehrere Faktoren wirken zusammen." },
        { id: 9, topic: "Fehler", question: "Was ist ein häufiges Atem-Problem bei Anfängern?",
          answers: ["Zu flach und hektisch", "Zu ruhig", "Zu tief"],
          correctIndex: 0, explanation: "Flach/hektisch = schneller ermüdet, oft auch verkrampft." },
        { id: 10, topic: "Praxis", question: "Was ist ein guter Atmungs-Tipp für Tempoeinheiten?",
          answers: ["Rhythmisch atmen (z. B. 2:1 oder 2:2)", "Luft anhalten", "Nur durch die Nase sprinten"],
          correctIndex: 0, explanation: "Rhythmus stabilisiert Tempo und reduziert Stress." },
      ],
    },

    {
      id: "smartwatch-tracking",
      title: "Smartwatch & Tracking",
      description: "Intervalle, Zonen, VO₂max, Daten richtig nutzen",
      questions: [
        { id: 1, topic: "Tracking", question: "Welche Daten liefern moderne Laufuhren typischerweise?",
          answers: ["Pace/Distanz & Herzfrequenz", "VO₂max-Schätzung", "Alles oben genannte"],
          correctIndex: 2, explanation: "Viele Uhren liefern Distanz, Pace, HR und teils VO₂max-Schätzung." },
        { id: 2, topic: "Herzfrequenzzonen", question: "Wozu dienen Herzfrequenzzonen?",
          answers: ["Optik im Dashboard", "Trainingsbereiche steuern", "Nur Social Media"],
          correctIndex: 1, explanation: "Zonen helfen, Intensität passend zum Trainingsziel zu wählen." },
        { id: 3, topic: "Intervalle", question: "Warum sind Intervallprogramme auf der Uhr praktisch?",
          answers: ["Uhr erinnert an Belastung/Pause", "Sie ersetzen Training", "Sie verhindern jede Verletzung"],
          correctIndex: 0, explanation: "Struktur & Timing ohne Kopfrechnen." },
        { id: 4, topic: "Zonenalarm", question: "Was macht ein Zonen-Alarm?",
          answers: ["Er misst Schuhe", "Er warnt, wenn du außerhalb deiner Zielzone bist", "Er steigert VO₂max automatisch"],
          correctIndex: 1, explanation: "Hilft z. B., Easy Runs wirklich easy zu halten." },
        { id: 5, topic: "VO₂max", question: "Wie schätzen Uhren VO₂max oft ab?",
          answers: ["Aus Tempo + Herzfrequenz (Algorithmus)", "Nur aus Gewicht", "Nur aus Schlaf"],
          correctIndex: 0, explanation: "Meist über Modelle, die HR und Pace kombinieren." },
        { id: 6, topic: "Interpretation", question: "Was ist wichtig bei Uhren-Daten?",
          answers: ["Ein einzelner Wert ist immer perfekt", "Trends über Wochen sind wichtiger als 1 Messung", "Daten ignorieren"],
          correctIndex: 1, explanation: "Trends sind stabiler als Einzelschwankungen." },
        { id: 7, topic: "Pace", question: "Was bedeutet Pace?",
          answers: ["Zeit pro Kilometer", "Kilometer pro Stunde", "Schritte pro Minute"],
          correctIndex: 0, explanation: "Pace = min/km." },
        { id: 8, topic: "Fehler", question: "Was ist ein typischer Tracking-Fehler?",
          answers: ["Nur nach Uhr trainieren ohne Körpergefühl", "Notizen machen", "Regeneration beachten"],
          correctIndex: 0, explanation: "Uhr unterstützt – Körpergefühl bleibt wichtig." },
        { id: 9, topic: "Training", question: "Welche Einheit ist oft sinnvoll, um Tempo/Schwelle zu trainieren?",
          answers: ["Tempolauf", "Nur Stretching", "Nur Spaziergang"],
          correctIndex: 0, explanation: "Tempoeinheiten verbessern Tempoausdauer und Schwelle." },
        { id: 10, topic: "Gamification", question: "Welche Darstellung motiviert in Apps oft besonders?",
          answers: ["Fortschrittsbalken/Badges & Wochenziele", "Nur Text", "Nur Fehlermeldungen"],
          correctIndex: 0, explanation: "Gamification + klare Ziele erhöhen Konsistenz." },
      ],
    },
  ],
  en: [],
};

/* -------------------------
   Styles
-------------------------- */
const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    maxWidth: 900,
    margin: "0 auto",
    padding: "0 24px 60px",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: { marginTop: 12, marginBottom: 18 },
  title: { fontSize: 28, fontWeight: 900, marginBottom: 6 },
  subtitle: { fontSize: 14, color: "var(--color-muted)", lineHeight: 1.6 },

  card: {
    marginTop: 18,
    background: "var(--color-card)",
    borderRadius: 20,
    padding: 22,
    boxShadow: "var(--color-shadow)",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  topRowTitle: { fontSize: 14, fontWeight: 900, color: "var(--color-text)" },

  moduleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
    marginTop: 10,
  },
  moduleCard: {
    borderRadius: 18,
    padding: 16,
    border: "1px solid var(--color-border)",
    background: "var(--color-card)",
    boxShadow: "var(--color-shadow)",
  },
  moduleTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 10,
  },
  moduleTitle: { fontSize: 16, fontWeight: 900 },
  moduleMeta: { fontSize: 12, color: "var(--color-muted)", fontWeight: 800 },
  moduleDesc: {
    fontSize: 13,
    color: "var(--color-muted)",
    lineHeight: 1.5,
    marginTop: 8,
    marginBottom: 10,
  },

  statusWrap: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, marginBottom: 12 },
  statusPill: (tone = "neutral") => ({
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    border: "1px solid var(--color-border)",
    background:
      tone === "good" ? "rgba(34,197,94,0.14)" : tone === "warn" ? "rgba(245,158,11,0.14)" : tone === "bad" ? "rgba(239,68,68,0.14)" : "var(--color-panelBg)",
    color:
      tone === "good" ? "rgba(34,197,94,0.95)" : tone === "warn" ? "rgba(245,158,11,0.95)" : tone === "bad" ? "rgba(239,68,68,0.95)" : "var(--color-text)",
  }),

  progressOuter: {
    marginTop: 14,
    width: "100%",
    height: 8,
    borderRadius: 999,
    background: "var(--color-border)",
    overflow: "hidden",
  },
  progressInner: (p) => ({
    width: `${p}%`,
    height: "100%",
    background: "linear-gradient(90deg,#0b1e32,#34d399)",
    transition: "width .25s ease",
  }),

  questionCounter: { fontSize: 13, color: "var(--color-muted)", marginBottom: 6 },
  questionText: { fontSize: 18, fontWeight: 900, marginBottom: 18 },

  answersList: { display: "flex", flexDirection: "column", gap: 10 },
  answerButton: (isSelected, isCorrect, showResult) => {
    let background = "var(--color-panelBg)";
    let border = "1px solid transparent";

    if (showResult) {
      if (isCorrect) {
        background = "rgba(34,197,94,0.14)";
        border = "1px solid rgba(34,197,94,0.55)";
      } else if (isSelected && !isCorrect) {
        background = "rgba(239,68,68,0.14)";
        border = "1px solid rgba(239,68,68,0.55)";
      }
    } else if (isSelected) {
      background = "rgba(99,102,241,0.14)";
      border = "1px solid rgba(99,102,241,0.55)";
    }

    return {
      textAlign: "left",
      width: "100%",
      borderRadius: 999,
      padding: "10px 14px",
      border,
      background,
      cursor: "pointer",
      fontSize: 14,
    };
  },

  explanation: { marginTop: 14, fontSize: 14, color: "var(--color-muted)" },
  feedback: (ok) => ({
    marginTop: 12,
    fontSize: 14,
    fontWeight: 900,
    color: ok ? "rgba(34,197,94,0.95)" : "rgba(239,68,68,0.95)",
  }),

  row: {
    marginTop: 18,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  pill: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "var(--color-panelBg)",
    border: "1px solid var(--color-border)",
    fontSize: 13,
    fontWeight: 900,
  },

  primaryBtn: {
    padding: "9px 18px",
    borderRadius: 999,
    background: "rgba(15,23,42,0.95)",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 800,
  },
  secondaryBtn: {
    padding: "9px 18px",
    borderRadius: 999,
    border: "1px solid #111827",
    background: "var(--color-card)",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 800,
    color: "var(--color-text)",
  },
};

/* -------------------------
   Component
-------------------------- */
function QuizPage() {
  const { language } = useLanguage();
  const ui = UI_TEXT[language] || UI_TEXT.de;

  const modules = useMemo(() => {
    const list = QUIZ_MODULES[language];
    return Array.isArray(list) && list.length ? list : QUIZ_MODULES.de;
  }, [language]);

  const [dashboardState, setDashboardState] = useState(() => loadDashboardState());

  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const activeModule = modules.find((m) => m.id === selectedModuleId) || null;
  const questions = activeModule?.questions || [];
  const total = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]); // {selectedIndex, checked}
  const [finished, setFinished] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const resetQuiz = () => {
    setCurrentIndex(0);
    setUserAnswers([]);
    setFinished(false);
    setSavedOk(false);
  };

  const startModule = (id) => {
    setSelectedModuleId(id);
    resetQuiz();
  };

  const backToModules = () => {
    setSelectedModuleId(null);
    resetQuiz();
    // Status beim Zurückgehen aktuell halten
    setDashboardState(loadDashboardState());
  };

  const startNextModule = () => {
    const played = dashboardState?.modules || {};
    // zuerst: ungespieltes Modul mit 10 Fragen
    const nextUnplayed = modules.find((m) => m.questions?.length === 10 && !played[m.id]);
    if (nextUnplayed) return startModule(nextUnplayed.id);

    // fallback: erstes Modul mit 10 Fragen
    const firstValid = modules.find((m) => m.questions?.length === 10);
    if (firstValid) return startModule(firstValid.id);
  };

  const setForIndex = (idx, patch) => {
    setUserAnswers((prev) => {
      const next = [...prev];
      next[idx] = { ...(next[idx] || { selectedIndex: null, checked: false }), ...patch };
      return next;
    });
  };

  /* -------------------------
     Start Screen: alle Module + Status
  -------------------------- */
  if (!selectedModuleId) {
    const played = dashboardState?.modules || {};

    return (
      <div style={styles.page} className="quizpage">
        <div style={styles.header}>
          <h1 style={styles.title}>{ui.title}</h1>
          <p style={styles.subtitle}>{ui.subtitle}</p>
        </div>

        <div style={styles.card}>
          <div style={styles.topRow}>
            <div style={styles.topRowTitle}>{ui.modulesHeader}</div>
            <button style={styles.primaryBtn} onClick={startNextModule}>
              {ui.continue}
            </button>
          </div>

          <div style={styles.moduleGrid}>
            {modules.map((m) => {
              const ok10 = m.questions?.length === 10;
              const status = played[m.id]; // undefined oder saved payload

              // Status-UI
              const pills = [];
              if (!status) {
                pills.push({ text: ui.statusNew, tone: "neutral" });
              } else {
                pills.push({ text: ui.statusBest(status.scorePercent ?? 0), tone: "good" });
                if (status.badge) pills.push({ text: ui.statusBadge(status.badge), tone: "warn" });
                if (status.lastPlayedAt) pills.push({ text: ui.statusPlayedOn(formatDate(status.lastPlayedAt)), tone: "neutral" });
              }

              return (
                <div key={m.id} style={styles.moduleCard}>
                  <div style={styles.moduleTitleRow}>
                    <div style={styles.moduleTitle}>{m.title}</div>
                    <div style={styles.moduleMeta}>{ui.moduleQuestions(m.questions?.length || 0)}</div>
                  </div>

                  <div style={styles.moduleDesc}>{m.description}</div>

                  <div style={styles.statusWrap}>
                    {pills.map((p, i) => (
                      <span key={i} style={styles.statusPill(p.tone)}>{p.text}</span>
                    ))}
                  </div>

                  {!ok10 ? (
                    <div style={{ fontSize: 12, color: "rgba(239,68,68,0.95)", fontWeight: 900, marginBottom: 10 }}>
                      {ui.moduleCountError}
                    </div>
                  ) : null}

                  <button
                    style={{
                      ...styles.primaryBtn,
                      opacity: ok10 ? 1 : 0.5,
                      cursor: ok10 ? "pointer" : "not-allowed",
                    }}
                    onClick={() => ok10 && startModule(m.id)}
                    disabled={!ok10}
                  >
                    {ui.start}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------
     Finish Screen
  -------------------------- */
  if (finished) {
    const correctCount = questions.reduce((acc, q, i) => {
      const a = userAnswers[i];
      if (!a) return acc;
      return acc + (a.selectedIndex === q.correctIndex ? 1 : 0);
    }, 0);

    const scorePercent = total ? Math.round((correctCount / total) * 100) : 0;
    const points = correctCount * POINTS_PER_CORRECT;
    const bonus = calcBonus(scorePercent);
    const badge = calcBadge(scorePercent);
    const totalPointsAdded = points + bonus;

    const answeredCount = userAnswers.filter((a) => a?.selectedIndex !== null).length;
    const unanswered = total - answeredCount;

    const payload = {
      moduleId: activeModule.id,
      moduleTitle: activeModule.title,
      correctCount,
      totalQuestions: total,
      scorePercent,
      points,
      bonus,
      badge,
      totalPointsAdded,
    };

    const onSave = () => {
      if (unanswered > 0) return;
      const nextState = saveQuizResultToDashboard(payload);
      setDashboardState(nextState);
      setSavedOk(true);
    };

    return (
      <div style={styles.page} className="quizpage">
        <div style={styles.header}>
          <h1 style={styles.title}>{ui.quizDoneTitle}</h1>
          <p style={styles.subtitle}>
            <b>{activeModule.title}</b> · {ui.quizDoneText(correctCount, total, scorePercent)}
          </p>
        </div>

        <div style={styles.card}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span style={styles.pill}>{ui.pointsEarned(points, bonus, totalPointsAdded)}</span>
            {badge ? <span style={styles.pill}>{ui.badgeEarned(badge)}</span> : null}
          </div>

          {unanswered > 0 ? (
            <div style={{ marginTop: 12, fontSize: 13, color: "rgba(239,68,68,0.95)", fontWeight: 900 }}>
              {ui.unansweredHint(unanswered)} (Bitte beantworte alle Fragen, um Punkte zu bekommen.)
            </div>
          ) : null}

          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={styles.primaryBtn} onClick={onSave} disabled={unanswered > 0}>
              {ui.saveToDashboard}
            </button>
            <button style={styles.secondaryBtn} onClick={resetQuiz}>
              {ui.restart}
            </button>
            <button style={styles.secondaryBtn} onClick={backToModules}>
              {ui.backToModules}
            </button>
          </div>

          {savedOk ? (
            <div style={{ marginTop: 12, fontSize: 13, color: "rgba(34,197,94,0.95)", fontWeight: 900 }}>
              {ui.savedToDashboard}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  /* -------------------------
     Quiz Screen
  -------------------------- */
  const currentQuestion = questions[currentIndex];
  const currentAnswer = userAnswers[currentIndex] || { selectedIndex: null, checked: false };
  const selectedIndex = currentAnswer.selectedIndex;
  const showResult = currentAnswer.checked;

  const progressPercent = total ? (currentIndex / total) * 100 : 0;

  const handleAnswerClick = (idx) => {
    if (showResult) return; // wenn du nach "prüfen" ändern willst: diese Zeile entfernen
    setForIndex(currentIndex, { selectedIndex: idx });
  };

  const handleCheck = () => {
    if (selectedIndex === null) return;
    setForIndex(currentIndex, { checked: true });
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleNext = () => {
    if (currentIndex + 1 < total) setCurrentIndex((i) => i + 1);
    else setFinished(true);
  };

  const isCorrectNow = showResult && selectedIndex === currentQuestion.correctIndex;

  return (
    <div style={styles.page} className="quizpage">
      <div style={styles.header}>
        <h1 style={styles.title}>{activeModule.title}</h1>
        <p style={styles.subtitle}>{activeModule.description}</p>

        <div style={styles.progressOuter}>
          <div style={styles.progressInner(progressPercent)} />
        </div>

        <div style={{ marginTop: 10 }}>
          <button style={styles.secondaryBtn} onClick={backToModules}>
            {ui.backToModules}
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.questionCounter}>
          {ui.questionLabel} {currentIndex + 1} {ui.of} {total} · {ui.topicLabel}: {currentQuestion.topic}
        </div>

        <div style={styles.questionText}>{currentQuestion.question}</div>

        <div style={styles.answersList}>
          {currentQuestion.answers.map((answer, idx) => (
            <button
              key={idx}
              style={styles.answerButton(
                selectedIndex === idx,
                idx === currentQuestion.correctIndex,
                showResult
              )}
              onClick={() => handleAnswerClick(idx)}
            >
              {answer}
            </button>
          ))}
        </div>

        {showResult ? (
          <>
            <div style={styles.feedback(isCorrectNow)}>
              {isCorrectNow ? ui.correct : ui.wrong}
            </div>
            <p style={styles.explanation}>{currentQuestion.explanation}</p>
          </>
        ) : null}

        <div style={styles.row}>
          <span style={{ fontSize: 13, color: "var(--color-muted)" }}>{ui.tip}</span>

          <div style={{ display: "flex", gap: 10 }}>
            <button style={styles.secondaryBtn} onClick={handlePrev} disabled={currentIndex === 0}>
              {ui.prevQuestion}
            </button>

            {!showResult ? (
              <button style={styles.primaryBtn} onClick={handleCheck} disabled={selectedIndex === null}>
                {ui.checkAnswer}
              </button>
            ) : (
              <button style={styles.primaryBtn} onClick={handleNext}>
                {currentIndex + 1 < total ? ui.nextQuestion : ui.finishQuiz}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizPage;
