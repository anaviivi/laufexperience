export const elearningModules = {
  technique: {
    order: 1,
    meta: { minutes: 12, level: "Beginner" },

    // ✅ neue Felder (für deinen "Material" Schritt + Quiz Schritt)
    resources: {
      de: [
        {
          type: "Artikel",
          title: "Lauftechnik: Die besten Tipps für einen guten Laufstil",
          url: "https://www.runnersworld.de/training-basiswissen/lauftechnik-guter-laufstil/",
          source: "Runner’s World",
        },
        {
          type: "Artikel",
          title: "Gesunde Körperhaltung bei Läufern: Besser atmen & effizienter laufen",
          url: "https://www.runnersworld.de/training-basiswissen/koerperhaltung-verbessern/",
          source: "Runner’s World",
        },
        {
          type: "Video",
          title: "Die richtige Lauftechnik – Armhaltung (RunningDoc / Marquardt)",
          url: "https://www.youtube.com/watch?v=1N8FUSfCTI8",
          duration: "≈6 min",
          source: "YouTube",
        },
        {
          type: "Video",
          title: "So funktioniert die richtige Armhaltung beim Laufen",
          url: "https://www.youtube.com/watch?v=CVWhB8xkmxI",
          duration: "≈8 min",
          source: "YouTube",
        },
      ],
      en: [
        {
          type: "Article",
          title: "Is There a Perfect Running Style?",
          url: "https://www.runnersworld.com/training/a28413381/rhythmic-breathing/",
          source: "Runner’s World",
          note: "General RW training resource (English).",
        },
        {
          type: "Video",
          title: "Basic running form tips (search reference)",
          url: "https://www.youtube.com/watch?v=DXiVhy445jw",
          duration: "≈10 min",
          source: "YouTube",
        },
      ],
    },

    quiz: {
      de: {
        questions: [
          {
            q: "Was ist das beste Grundprinzip für Laufhaltung?",
            options: ["Steif und Brust rausdrücken", "Groß & entspannt, ohne Verkrampfen", "So weit wie möglich nach vorn beugen"],
            correctIndex: 1,
            explanation: "Aufrecht + entspannt spart Energie und hält dich stabil.",
          },
          {
            q: "Wohin sollte der Blick beim Laufen grob gehen?",
            options: ["Direkt auf die Füße", "10–20 m nach vorne", "Nur seitlich schauen"],
            correctIndex: 1,
            explanation: "Blick nach vorn unterstützt eine aufrechte Haltung.",
          },
          {
            q: "Was ist ein guter Hinweis auf kontrollierten Bodenkontakt?",
            options: ["Sehr lautes Aufklatschen", "Leiserer Kontakt", "Hohes Springen"],
            correctIndex: 1,
            explanation: "Leiser ist oft kontrollierter (ohne dass du langsamer sein musst).",
          },
        ],
      },
      en: {
        questions: [
          {
            q: "Good baseline running posture is…",
            options: ["Stiff & forced chest out", "Tall & relaxed", "Leaning hard forward"],
            correctIndex: 1,
            explanation: "Tall + relaxed is stable and efficient.",
          },
          {
            q: "Where should your gaze be?",
            options: ["Down at your feet", "10–20m ahead", "Only to the side"],
            correctIndex: 1,
            explanation: "Looking ahead supports upright posture.",
          },
        ],
      },
    },

    de: {
      title: "Lauftechnik Basics",
      description:
        "Saubere Technik heißt: weniger Energieverlust, ruhigerer Laufstil, bessere Kontrolle. In diesem Modul lernst du die 3 wichtigsten Stellschrauben.",
      learningGoals: [
        "Du erkennst die wichtigsten Technik-Bausteine (Haltung, Fuß, Arm).",
        "Du kannst 2 schnelle Selbst-Checks im Lauf anwenden.",
        "Du weißt, welche Änderungen du sofort und welche du langsam trainierst.",
      ],
      keyPoints: [
        "Haltung: groß machen, Brustbein leicht anheben",
        "Blick: 10–20 m nach vorn, nicht nach unten kleben",
        "Arme: locker, Ellbogen ca. 80–100°",
        "Schritte: eher kurz & schnell als lang & hart",
        "Leise landen: Geräusch = Feedback",
      ],
      lesson: [
        {
          heading: "Körperhaltung – ‘groß’ statt ‘steif’",
          text:
            "Ziel: Stabil, aber nicht verkrampft.\n\n" +
            "Tipp: Stell dir einen Faden am Scheitel vor.\n" +
            "- Kopf neutral (Kinn leicht zurück)\n" +
            "- Schultern tief (nicht hochziehen)\n" +
            "- Rumpf aktiv, aber frei atmend\n\n" +
            "Fehler: Brust rausdrücken und Hohlkreuz.\n" +
            "Check: Kannst du beim Laufen ruhig ausatmen?",
        },
        {
          heading: "Arme – Rhythmus & Balance",
          text:
            "Arme bestimmen oft den Rhythmus der Beine.\n\n" +
            "- Hände locker (als würdest du Chips halten)\n" +
            "- Bewegung nach vorn/hinten, nicht überkreuzen\n" +
            "Tipp: Ellbogen hinten ‘in die Hosentasche’ führen.\n\n" +
            "Fehler: Fäuste ballen → Schulterspannung.\n" +
            "Check: Schultern fühlen sich nach 2 Minuten noch locker an?",
        },
        {
          heading: "Fußaufsatz – ‘leise’ ist meistens ‘richtig’",
          text:
            "Es gibt nicht den einen perfekten Fußaufsatz – aber: hartes Aufklatschen ist selten gut.\n\n" +
            "- Lande unter deinem Körperschwerpunkt\n" +
            "- Stell dir vor, du läufst über dünnes Eis\n" +
            "Tipp: Geräusch-Feedback nutzen: je leiser, desto besser kontrolliert.\n\n" +
            "Fehler: Zu lange Schritte → Ferse weit vor dem Körper.\n" +
            "Check: Kannst du das Geräusch bewusst 20% leiser machen?",
        },
      ],
      task: {
        title: "3× 3 Minuten Technik-Fokus",
        steps: [
          "3 Minuten locker laufen (nur an Atmung denken).",
          "3 Minuten Fokus ‘Haltung’: groß, Schultern tief, Blick nach vorn.",
          "2 Minuten locker auslaufen.",
          "3 Minuten Fokus ‘Arme’: locker, nicht kreuzen, Rhythmus fühlen.",
          "2 Minuten locker auslaufen.",
          "3 Minuten Fokus ‘Leise landen’: kurze Schritte, leiser Kontakt.",
        ],
        reflection:
          "Check: Welcher Fokus hat sofort Wirkung gezeigt?\n" +
          "Tipp: Nimm nur 1 Stellschraube pro Lauf.\n" +
          "Merke: Technik = Wiederholung, nicht Gewalt.",
      },
    },

    en: {
      title: "Running Form Basics",
      description:
        "Good form means less energy loss, smoother running, better control. You’ll learn the 3 biggest levers to improve quickly.",
      learningGoals: [
        "You can identify posture, foot strike and arm mechanics.",
        "You can apply 2 quick self-checks while running.",
        "You know what to change immediately vs. gradually.",
      ],
      keyPoints: [
        "Posture: tall, relaxed, chest gently up",
        "Gaze: 10–20m ahead",
        "Arms: loose, elbows ~80–100°",
        "Steps: short & quick > long & hard",
        "Quiet landing = useful feedback",
      ],
      lesson: [
        {
          heading: "Posture – tall, not stiff",
          text:
            "Goal: stable but relaxed.\n\n" +
            "Tip: imagine a string lifting your head.\n" +
            "- neutral head\n" +
            "- shoulders down\n" +
            "- active core, easy breathing\n\n" +
            "Mistake: over-arching the lower back.\n" +
            "Check: can you exhale calmly while running?",
        },
        {
          heading: "Arms – rhythm & balance",
          text:
            "Arms often set your leg rhythm.\n\n" +
            "- hands soft\n" +
            "- swing forward/back, don’t cross\n" +
            "Tip: drive elbows slightly back.\n\n" +
            "Mistake: clenched fists.\n" +
            "Check: shoulders still relaxed after 2 minutes?",
        },
      ],
      task: {
        title: "3× 3-minute technique focus",
        steps: [
          "3 min easy run (focus only on breathing).",
          "3 min posture focus: tall, shoulders down, gaze ahead.",
          "2 min easy.",
          "3 min arms focus: relaxed swing, feel the rhythm.",
          "2 min easy.",
          "3 min quiet landing: shorter steps, lighter contact.",
        ],
        reflection:
          "Check: which focus had immediate impact?\n" +
          "Tip: pick only 1 lever per run.\n" +
          "Remember: form = repetition, not force.",
      },
    },
  },

  cadence: {
    order: 2,
    meta: { minutes: 10, level: "Beginner" },
    resources: {
      de: [
        {
          type: "Artikel",
          title: "Warum Kadenz wichtig ist (Cadence matters)",
          url: "https://www.runnersworld.com/training/a64422354/why-cadence-matters-for-running/",
          source: "Runner’s World (EN)",
          note: "Englisch – aber sehr gut erklärt.",
        },
        {
          type: "Artikel",
          title: "Best Running Cadence – Step Rate erklärt",
          url: "https://strengthrunning.com/2020/02/best-running-cadence-step-rate/",
          source: "Strength Running",
        },
      ],
      en: [
        {
          type: "Article",
          title: "What’s the Best Running Cadence?",
          url: "https://strengthrunning.com/2020/02/best-running-cadence-step-rate/",
          source: "Strength Running",
        },
        {
          type: "Article",
          title: "Why Cadence Matters for Running",
          url: "https://www.runnersworld.com/training/a64422354/why-cadence-matters-for-running/",
          source: "Runner’s World",
        },
      ],
    },
    quiz: {
      de: {
        questions: [
          {
            q: "Kadenz bedeutet …",
            options: ["Puls pro Minute", "Schritte pro Minute", "Kilometer pro Stunde"],
            correctIndex: 1,
            explanation: "Kadenz ist die Schrittfrequenz (steps per minute).",
          },
          {
            q: "Eine kleine Kadenz-Erhöhung (+5–10 spm) hilft oft, weil …",
            options: ["du automatisch sprintest", "Schritte kürzer werden & Überstride sinkt", "du mehr hüpfst"],
            correctIndex: 1,
            explanation: "Kürzere Schritte landen eher unter dem Körper und fühlen sich weicher an.",
          },
        ],
      },
      en: {
        questions: [
          {
            q: "Cadence is …",
            options: ["Heart rate", "Steps per minute", "Speed in km/h"],
            correctIndex: 1,
            explanation: "Cadence = step rate (spm).",
          },
        ],
      },
    },
    de: {
      title: "Kadenz & Schrittlänge",
      description:
        "Kadenz ist dein Takt. Oft löst eine leicht höhere Kadenz mehrere Probleme (Überstride, harte Landung) auf einmal – ohne schneller zu laufen.",
      learningGoals: [
        "Du verstehst Kadenz vs. Tempo.",
        "Du kannst Kadenz um +5–10 Schritte/min steigern, ohne zu hetzen.",
        "Du erkennst typische Fehler (Tempo statt Schrittlänge ändern).",
      ],
      keyPoints: [
        "Kadenz = Schritte pro Minute, unabhängig vom Tempo",
        "+5–10 spm reicht oft schon",
        "Kurzere Schritte = leichter unter dem Körper landen",
        "Arme steuern den Takt",
      ],
      lesson: [
        {
          heading: "Kadenz ≠ schneller laufen",
          text:
            "Kadenz ändern heißt nicht automatisch Tempo erhöhen.\n\n" +
            "Tipp: Stell dir ‘kleinere Schritte’ vor, nicht ‘mehr Speed’.\n" +
            "- gleiche Anstrengung\n" +
            "- gleiche Pace\n" +
            "- nur Rhythmus minimal höher\n\n" +
            "Fehler: Du machst Druck nach vorn und wirst schneller.\n" +
            "Check: Atmung bleibt gleich ruhig?",
        },
        {
          heading: "Wie du +5–10 spm sauber erreichst",
          text:
            "Mach’s schrittweise.\n\n" +
            "- 30–60s bewusst etwas schnellerer Takt\n" +
            "- 60–90s normal\n" +
            "- wiederholen\n\n" +
            "Tipp: Arme leicht schneller schwingen → Beine folgen.\n" +
            "Check: Kontakt wird leiser und weicher?",
        },
      ],
      task: {
        title: "Kadenz-Intervalle (8 Minuten)",
        steps: [
          "2 Minuten locker einlaufen.",
          "4× (30s +5–10 spm) + (60s normal).",
          "2 Minuten locker auslaufen.",
          "Optional: einmal filmen (seitlich) für späteren Vergleich.",
        ],
        reflection:
          "Check: Wurde die Landung leiser?\n" +
          "Fehler: Tempo hoch statt Schritte kürzer.\n" +
          "Merke: Weniger ‘springen’, mehr ‘rollen’.",
      },
    },
    en: {
      title: "Cadence & Stride Length",
      description:
        "Cadence is your rhythm. A small increase often fixes overstriding and harsh landings—without running faster.",
      learningGoals: [
        "You understand cadence vs pace.",
        "You can increase cadence by +5–10 spm without rushing.",
        "You can spot common mistakes (speeding up instead of shortening).",
      ],
      keyPoints: ["Cadence = steps/min", "+5–10 spm is enough", "Shorter steps land under you", "Arms set the rhythm"],
      lesson: [
        {
          heading: "Cadence ≠ speed",
          text:
            "Changing cadence doesn’t have to change pace.\n\n" +
            "Tip: think ‘smaller steps’, not ‘more speed’.\n" +
            "Mistake: pushing forward and getting faster.\n" +
            "Check: breathing stays calm?",
        },
      ],
      task: {
        title: "Cadence intervals (8 minutes)",
        steps: ["2 min easy.", "4× (30s +5–10 spm) + (60s normal).", "2 min easy.", "Optional: record a short side video."],
        reflection: "Check: was landing quieter?\nMistake: speeding up.\nRemember: less bouncing, more rolling.",
      },
    },
  },

  footstrike: {
    order: 3,
    meta: { minutes: 12, level: "Intermediate" },
    resources: {
      de: [
        {
          type: "Artikel",
          title: "Biomechanik: Gibt es den perfekten Laufstil?",
          url: "https://www.runnersworld.de/training-basiswissen/gibt-es-den-perfekten-laufstil/",
          source: "Runner’s World",
        },
        {
          type: "Studie/Übersicht",
          title: "Cadence modulation & pacing (wissenschaftlicher Hintergrund)",
          url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7288070/",
          source: "PubMed Central",
        },
      ],
      en: [
        {
          type: "Article",
          title: "Why Cadence Matters (helps reduce overstriding)",
          url: "https://www.runnersworld.com/training/a64422354/why-cadence-matters-for-running/",
          source: "Runner’s World",
        },
      ],
    },
    quiz: {
      de: {
        questions: [
          {
            q: "Überstride bedeutet …",
            options: ["Fuß landet weit vor dem Körper", "Fuß landet unter dem Körper", "Arme schwingen zu wenig"],
            correctIndex: 0,
            explanation: "Überstride = Fuß zu weit vor dem Schwerpunkt, oft ‘bremsend’.",
          },
          {
            q: "Der beste schnelle Hebel gegen Überstride ist meist …",
            options: ["Schritte länger machen", "Kadenz leicht erhöhen / Schritte kürzer", "mehr aufspringen"],
            correctIndex: 1,
            explanation: "Kürzere Schritte landen leichter unter dem Körper.",
          },
        ],
      },
      en: {
        questions: [
          {
            q: "Overstriding means …",
            options: ["Foot lands far in front", "Foot lands under center", "Arms don’t move"],
            correctIndex: 0,
            explanation: "Overstriding often creates a braking effect.",
          },
        ],
      },
    },
    de: {
      title: "Fußaufsatz & Bodenkontakt",
      description:
        "Dein Ziel ist nicht ‘Vorfuss’ um jeden Preis, sondern ein kontrollierter Bodenkontakt unter dem Körper – leise, stabil, effizient.",
      learningGoals: ["Du erkennst Überstride.", "Du lernst ‘unter dem Körper’ landen.", "Du nutzt Geräusch & Gefühl als Feedback."],
      keyPoints: ["Unter dem Schwerpunkt landen", "Leise ≈ kontrolliert", "Schrittlänge anpassen, nicht stampfen", "Waden langsam gewöhnen"],
      lesson: [
        {
          heading: "Überstride erkennen",
          text:
            "Überstride = Fuß landet weit vor dem Körper.\n\n" +
            "- oft spürbar als ‘Bremsen’\n" +
            "- oft hörbar als ‘Klatschen’\n" +
            "Check: Fühlst du dich nach jedem Schritt minimal ausgebremst?",
        },
        {
          heading: "Kontrollierter Kontakt",
          text:
            "Tipp: Stell dir vor, du setzt den Fuß ‘nach unten’ statt ‘nach vorn’.\n\n" +
            "- kurze Schritte\n" +
            "- Knie leicht weich\n" +
            "- Rumpf stabil\n\n" +
            "Fehler: Zu aggressiv umstellen → Waden überlasten.\n" +
            "Merke: Anpassung in Wochen, nicht Tagen.",
        },
      ],
      task: {
        title: "Leise-Laufen Drill (10 Minuten)",
        steps: [
          "2 Minuten locker laufen.",
          "3× (1 Minute ‘leiser’) + (1 Minute normal).",
          "2 Minuten locker auslaufen.",
          "Am nächsten Tag checken: Waden ok? Wenn nein: weniger Intensität.",
        ],
        reflection: "Check: Wurde der Lauf ‘weicher’?\nTipp: Leise ≠ langsam.\nMerke: Kleine Dosis, oft wiederholen.",
      },
    },
    en: {
      title: "Foot Strike & Ground Contact",
      description:
        "The goal isn’t ‘forefoot at all costs’. It’s controlled contact under your body: quiet, stable, efficient.",
      learningGoals: ["You can identify overstriding.", "You learn to land under your center.", "You use sound & feel as feedback."],
      keyPoints: ["Land under you", "Quiet ≈ controlled", "Adjust stride length", "Adapt calves gradually"],
      lesson: [
        { heading: "Spot overstriding", text: "Overstride = foot far in front.\n- feels like braking\n- sounds like slapping\nCheck: do you feel slightly held back each step?" },
        { heading: "Controlled contact", text: "Tip: place the foot ‘down’ not ‘forward’.\n- shorter steps\n- soft knee\n- stable core\nMistake: switching too aggressively.\nRemember: weeks, not days." },
      ],
      task: {
        title: "Quiet-running drill (10 min)",
        steps: ["2 min easy.", "3× (1 min quieter) + (1 min normal).", "2 min easy.", "Next day: calves OK? If not, reduce."],
        reflection: "Check: did it feel smoother?\nTip: quiet ≠ slow.\nRemember: small dose, often.",
      },
    },
  },

  breathing: {
    order: 4,
    meta: { minutes: 10, level: "Beginner" },
    resources: {
      de: [
        {
          type: "Artikel",
          title: "Rhythmic Breathing: So hilft Atemrhythmus beim Laufen",
          url: "https://www.runnersworld.com/training/a28413381/rhythmic-breathing/",
          source: "Runner’s World (EN)",
          note: "Englisch – gute Muster wie 3:2 / 2:2 erklärt.",
        },
        {
          type: "Studie/Übersicht",
          title: "Breathing strategies & guidance systems (wissenschaftlicher Überblick)",
          url: "https://link.springer.com/article/10.1007/s42979-025-04142-7",
          source: "Springer",
        },
      ],
      en: [
        {
          type: "Article",
          title: "How the Rhythmic Breathing Method Can Help You Run",
          url: "https://www.runnersworld.com/training/a28413381/rhythmic-breathing/",
          source: "Runner’s World",
        },
      ],
    },
    quiz: {
      de: {
        questions: [
          {
            q: "Was ist ein einfacher Atemrhythmus für lockeres Laufen?",
            options: ["1:1", "3:3", "5:1"],
            correctIndex: 1,
            explanation: "3:3 (3 Schritte ein, 3 Schritte aus) ist ein einfacher Easy-Rhythmus.",
          },
          {
            q: "Warum hilft eine längere Ausatmung oft?",
            options: ["Sie macht dich automatisch schneller", "Sie reduziert Spannung & beruhigt den Rhythmus", "Sie verhindert jede Seitenstechgefahr"],
            correctIndex: 1,
            explanation: "Lange Ausatmung wirkt oft wie ein Reset (Spannung sinkt).",
          },
        ],
      },
      en: {
        questions: [
          {
            q: "A simple easy-run breathing rhythm is …",
            options: ["1:1", "3:3", "5:1"],
            correctIndex: 1,
            explanation: "3:3 is an easy pattern to start with.",
          },
        ],
      },
    },
    de: {
      title: "Atmung & Rhythmus",
      description:
        "Atmung ist ein Steuerinstrument: Wenn du sie beruhigst, beruhigt sich oft auch dein Tempo und deine Spannung.",
      learningGoals: ["Du kennst 2 Atemrhythmen.", "Du nutzt Ausatmung zum Entspannen.", "Du erkennst Stress-Atmung."],
      keyPoints: ["Lange Ausatmung senkt Spannung", "Rhythmus koppeln (z.B. 3:3)", "Nase optional, Mund ok", "Check: Schultern locker?"],
      lesson: [
        {
          heading: "Rhythmus: 3:3 und 2:2",
          text:
            "- locker: 3 Schritte ein / 3 Schritte aus\n" +
            "- zügig: 2 ein / 2 aus\n" +
            "Tipp: Fokus auf die Ausatmung – die Einatmung folgt.\n" +
            "Check: Wird der Oberkörper ruhiger?",
        },
        {
          heading: "Stress-Atmung erkennen",
          text:
            "Fehler: kurze, hektische Atemzüge → mehr Spannung.\n\n" +
            "Tipp: 10 Atemzüge mit extra langer Ausatmung.\n" +
            "Check: Pulsgefühl wird ‘ruhiger’?",
        },
      ],
      task: {
        title: "Atem-Reset (6 Minuten)",
        steps: ["2 Minuten locker laufen.", "2 Minuten 3:3 Rhythmus (Fokus Ausatmung).", "2 Minuten normal & entspannen."],
        reflection: "Check: Wurde der Lauf ruhiger?\nMerke: Ausatmung ist dein ‘Reset-Knopf’.",
      },
    },
    en: {
      title: "Breathing & Rhythm",
      description:
        "Breathing is a control tool: calm the breath and you often calm pace and tension too.",
      learningGoals: ["You know 2 breathing patterns.", "You use exhale to relax.", "You can spot stress breathing."],
      keyPoints: ["Longer exhale reduces tension", "Link to steps (3:3)", "Mouth breathing is fine", "Check shoulders"],
      lesson: [
        { heading: "3:3 and 2:2", text: "- easy: 3 steps in / 3 out\n- faster: 2 in / 2 out\nTip: focus on exhale.\nCheck: upper body calmer?" },
        { heading: "Spot stress breathing", text: "Mistake: short, frantic breaths.\nTip: 10 breaths with extra-long exhales.\nCheck: do you feel calmer?" },
      ],
      task: { title: "Breathing reset (6 min)", steps: ["2 min easy.", "2 min 3:3 (focus exhale).", "2 min normal."], reflection: "Check: calmer run?\nRemember: exhale is your reset button." },
    },
  },

  warmup: {
    order: 5,
    meta: { minutes: 10, level: "Beginner" },
    resources: {
      de: [
        {
          type: "Video",
          title: "RUNNER'S WORLD erklärt: das richtige Warm-up vor dem Laufen",
          url: "https://www.youtube.com/watch?v=e6gjEts-DOs",
          duration: "≈8 min",
          source: "YouTube",
        },
      ],
      en: [
        {
          type: "Video",
          title: "Runner’s World warm-up (search reference)",
          url: "https://www.youtube.com/watch?v=e6gjEts-DOs",
          duration: "≈8 min",
          source: "YouTube",
        },
      ],
    },
    quiz: {
      de: {
        questions: [
          {
            q: "Warm-up soll vor allem …",
            options: ["müde machen", "aktivieren, nicht ermüden", "maximale Dehnung erzwingen"],
            correctIndex: 1,
            explanation: "Warm-up = Aktivierung + Vorbereitung, nicht Auspowern.",
          },
        ],
      },
      en: {
        questions: [
          { q: "A warm-up should …", options: ["fatigue you", "activate you", "force max stretching"], correctIndex: 1, explanation: "Warm-up = prepare, not exhaust." },
        ],
      },
    },
    de: {
      title: "Warm-up & Mobilität",
      description:
        "Ein gutes Warm-up macht dich nicht nur ‘warm’, sondern verbessert sofort deinen Laufstil. Kurz, simpel, effektiv.",
      learningGoals: ["Du kannst ein 6-Minuten Warm-up.", "Du weißt, welche Mobilität sich lohnt.", "Du fühlst dich beim Start leichter."],
      keyPoints: ["2 Minuten locker gehen/joggen", "Dynamisch statt statisch", "3 Übungen reichen", "Warm-up = Performance + Prävention"],
      lesson: [
        {
          heading: "6-Minuten Routine",
          text:
            "- 2 min locker joggen\n" +
            "- 10× Kniehebelauf (kurz)\n" +
            "- 10× Anfersen (kurz)\n" +
            "- 2× 20m Skippings\n" +
            "Tipp: alles bei 60–70% Intensität.\n" +
            "Check: fühlst du dich ‘runder’?",
        },
        {
          heading: "Was du weglassen darfst",
          text:
            "Fehler: 15 Minuten Dehnen, dann kalt losballern.\n" +
            "Merke: Warm-up soll aktivieren, nicht ermüden.",
        },
      ],
      task: {
        title: "Warm-up vor dem nächsten Lauf",
        steps: ["Mach die 6-Minuten Routine.", "Starte den Lauf 5 Minuten extra locker.", "Achte auf: erste 10 Minuten ohne ‘Ziehen’."],
        reflection: "Check: War der Start angenehmer?\nTipp: 6 Minuten konsequent schlagen 0 Minuten perfekt.",
      },
    },
    en: {
      title: "Warm-up & Mobility",
      description: "A good warm-up improves form instantly. Short, simple, effective.",
      learningGoals: ["You can do a 6-minute warm-up.", "You know what mobility matters.", "You feel smoother at the start."],
      keyPoints: ["2 min easy", "Dynamic > static", "3 drills are enough", "Warm-up = performance + prevention"],
      lesson: [
        { heading: "6-minute routine", text: "- 2 min easy jog\n- 10× high knees (short)\n- 10× butt kicks (short)\n- 2× 20m skips\nTip: 60–70% intensity.\nCheck: do you feel smoother?" },
      ],
      task: { title: "Warm-up before your next run", steps: ["Do the 6-min routine.", "Start extra easy for 5 min.", "Notice: first 10 min without tightness."], reflection: "Check: better start?\nTip: 6 minutes consistent beats 0 minutes perfect." },
    },
  },

  strength: {
    order: 6,
    meta: { minutes: 15, level: "Intermediate" },
    resources: {
      de: [
        {
          type: "Video",
          title: "RUNNER'S WORLD erklärt: wichtigste Stabiübungen",
          url: "https://www.youtube.com/watch?v=P31DvNsI62U",
          duration: "≈8–10 min",
          source: "YouTube",
        },
      ],
      en: [
        {
          type: "Video",
          title: "Stability exercises for runners (search reference)",
          url: "https://www.youtube.com/watch?v=P31DvNsI62U",
          source: "YouTube",
        },
      ],
    },
    quiz: {
      de: {
        questions: [
          {
            q: "Wofür ist Krafttraining für Läufer am wichtigsten?",
            options: ["Maximale Muskelmasse", "Stabilität & Technik unter Müdigkeit", "Nur für Sprint"],
            correctIndex: 1,
            explanation: "Stabilität hält Technik und reduziert Risiko, besonders bei Müdigkeit.",
          },
        ],
      },
      en: {
        questions: [
          { q: "Strength training for runners mainly improves …", options: ["max muscle size", "stability & form under fatigue", "only sprint speed"], correctIndex: 1, explanation: "Stability supports good running form." },
        ],
      },
    },
    de: {
      title: "Kraft für Läufer",
      description:
        "Mehr Kraft bedeutet nicht ‘Bodybuilding’, sondern stabiler laufen: Hüfte, Rumpf, Fuß – damit Technik auch bei Müdigkeit hält.",
      learningGoals: ["Du kennst 4 Basis-Übungen.", "Du kannst 2×/Woche 12 Minuten Kraft einbauen.", "Du verstehst ‘stabil statt schwer’."],
      keyPoints: ["Hüfte stabilisiert Knie", "Rumpf hält Haltung", "Fuß/Unterschenkel für Kontakt", "Kurz + regelmäßig ist King"],
      lesson: [
        {
          heading: "Die 4 Basics",
          text:
            "- Split Squat\n- Hip Hinge\n- Side Plank\n- Calf Raises\n" +
            "Tipp: Qualität vor Anzahl.\n" +
            "Check: kannst du sauber 8–12 Wiederholungen?",
        },
      ],
      task: {
        title: "12-Minuten Kraft-Zirkel",
        steps: [
          "3 Runden: 8× Split Squat je Seite.",
          "3 Runden: 10× Hip Hinge (langsam, sauber).",
          "3 Runden: 30s Side Plank je Seite.",
          "3 Runden: 12× Calf Raises (kontrolliert).",
        ],
        reflection: "Check: Welche Übung war ‘wackelig’?\nTipp: Wackelig = Trainingseffekt.\nMerke: Stabilität zuerst.",
      },
    },
    en: {
      title: "Strength for Runners",
      description:
        "Strength isn’t bodybuilding. It’s stable running: hips, core, feet—so form holds when you’re tired.",
      learningGoals: ["You know 4 key exercises.", "You can add 2×/week 12-min strength.", "You understand ‘stable, not heavy’."],
      keyPoints: ["Hips stabilize knees", "Core holds posture", "Feet/ankles for contact", "Short + consistent wins"],
      lesson: [
        { heading: "The 4 basics", text: "- Split squat\n- Hip hinge\n- Side plank\n- Calf raises\nTip: quality over quantity.\nCheck: clean 8–12 reps?" },
      ],
      task: { title: "12-minute strength circuit", steps: ["3 rounds: 8 split squats/side.", "3 rounds: 10 hip hinges.", "3 rounds: 30s side plank/side.", "3 rounds: 12 calf raises."], reflection: "Check: what felt unstable?\nTip: instability = training effect.\nRemember: stability first." },
    },
  },

  recovery: {
    order: 7,
    meta: { minutes: 10, level: "Beginner" },
    resources: {
      de: [
        {
          type: "Artikel",
          title: "Training & Regeneration – warum Erholung Training ist",
          url: "https://www.runnersworld.de/training-basiswissen/",
          source: "Runner’s World",
          note: "Übersichtsseite – such dir passende Regenerationsartikel.",
        },
      ],
      en: [
        {
          type: "Article",
          title: "Rhythmic breathing (calming & control)",
          url: "https://www.runnersworld.com/training/a28413381/rhythmic-breathing/",
          source: "Runner’s World",
        },
      ],
    },
    quiz: {
      de: {
        questions: [
          {
            q: "Der wichtigste Regenerationshebel ist meist …",
            options: ["Noch eine harte Einheit", "Schlaf", "Nur Dehnen"],
            correctIndex: 1,
            explanation: "Schlaf ist der größte Hebel für Anpassung und Erholung.",
          },
        ],
      },
      en: {
        questions: [
          { q: "The most important recovery lever is …", options: ["another hard workout", "sleep", "only stretching"], correctIndex: 1, explanation: "Sleep drives recovery and adaptation." },
        ],
      },
    },
    de: {
      title: "Regeneration & Schlaf",
      description:
        "Dein Körper wird in der Pause besser – nicht in der Einheit. Mit einfachen Regeln holst du mehr raus, ohne mehr zu trainieren.",
      learningGoals: ["Du kennst 3 Regenerationshebel.", "Du planst Erholung bewusst.", "Du erkennst Warnzeichen."],
      keyPoints: ["Schlaf ist #1", "Locker heißt wirklich locker", "Stress zählt als Belastung", "Warnzeichen ernst nehmen"],
      lesson: [
        {
          heading: "Die 3 Hebel",
          text:
            "- Schlaf (7–9h)\n- Lockere Tage wirklich locker\n- Essen/Trinken zeitnah\n" +
            "Tipp: 10 Minuten Spaziergang zählen.\n" +
            "Check: fühlst du dich am nächsten Tag ‘frischer’?",
        },
      ],
      task: {
        title: "Regenerations-Plan (3 Tage)",
        steps: ["Heute: 20–30 min lockerer Spaziergang.", "Morgen: nur locker laufen oder komplett frei.", "Übermorgen: erst dann wieder Qualität, wenn du frisch bist."],
        reflection: "Check: Welche Maßnahme hat am meisten geholfen?\nMerke: Erholung ist ein Trainingstool.",
      },
    },
    en: {
      title: "Recovery & Sleep",
      description: "You improve during recovery, not during the session. Simple rules = more gains without more training.",
      learningGoals: ["You know 3 recovery levers.", "You plan recovery intentionally.", "You spot warning signs."],
      keyPoints: ["Sleep is #1", "Easy means easy", "Stress counts", "Respect warning signs"],
      lesson: [
        { heading: "The 3 levers", text: "- Sleep (7–9h)\n- Truly easy easy-days\n- Eat/drink soon after\nTip: 10-min walk counts.\nCheck: feel fresher tomorrow?" },
      ],
      task: { title: "3-day recovery plan", steps: ["Today: 20–30 min easy walk.", "Tomorrow: easy run or rest.", "Day 3: quality only if fresh."], reflection: "Check: what helped most?\nRemember: recovery is a tool." },
    },
  },
};
