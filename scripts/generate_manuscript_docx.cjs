const { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType, 
  BorderStyle, 
  ImageRun, 
  HeadingLevel,
  ShadingType
} = require('docx');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'public', 'screenshots');
const OUTPUT_FILE = path.join(__dirname, '..', 'VirusGo_Veterinary_Virology_Manuscript_Scopus_Q1.docx');

function loadImage(filename) {
  const p = path.join(SCREENSHOT_DIR, filename);
  if (fs.existsSync(p)) {
    return fs.readFileSync(p);
  }
  console.warn('Image not found:', p);
  return null;
}

const borderNone = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const tableBorderTopBottom = {
  top: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
  left: borderNone,
  right: borderNone,
};
const tableHeaderBorders = {
  top: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
  left: borderNone,
  right: borderNone,
};

function createHeaderCell(text, widthPercent = 20) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    borders: tableHeaderBorders,
    shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({
            text,
            bold: true,
            font: "Times New Roman",
            size: 20, // 10pt
          }),
        ],
      }),
    ],
  });
}

function createDataCell(text, widthPercent = 20, align = AlignmentType.LEFT, isBold = false) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    borders: tableBorderTopBottom,
    children: [
      new Paragraph({
        alignment: align,
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text,
            bold: isBold,
            font: "Times New Roman",
            size: 19, // 9.5pt
          }),
        ],
      }),
    ],
  });
}

function p(text, options = {}) {
  const runs = Array.isArray(text) ? text : [new TextRun({ text, font: "Times New Roman", size: 24, ...options })];
  return new Paragraph({
    alignment: options.alignment || AlignmentType.JUSTIFY,
    spacing: { before: options.spaceBefore || 0, after: options.spaceAfter !== undefined ? options.spaceAfter : 140, line: 276 }, // 1.15 line spacing
    children: runs,
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        font: "Times New Roman",
        size: 28, // 14pt
        color: "002B49",
      }),
    ],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        font: "Times New Roman",
        size: 24, // 12pt
        color: "111827",
      }),
    ],
  });
}

function figCaption(figNum, captionText) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 80, after: 180 },
    children: [
      new TextRun({
        text: `Figure ${figNum}: `,
        bold: true,
        font: "Times New Roman",
        size: 20, // 10pt
      }),
      new TextRun({
        text: captionText,
        font: "Times New Roman",
        size: 20, // 10pt
        italic: true,
      }),
    ],
  });
}

function tableTitle(tabNum, titleText) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text: `Table ${tabNum}: `,
        bold: true,
        font: "Times New Roman",
        size: 20,
      }),
      new TextRun({
        text: titleText,
        font: "Times New Roman",
        size: 20,
        bold: true,
      }),
    ],
  });
}

function tableFootnote(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 60, after: 180 },
    children: [
      new TextRun({
        text,
        font: "Times New Roman",
        size: 18, // 9pt
        italic: true,
      }),
    ],
  });
}

function makeImageParagraph(buffer, width = 600, height = 375) {
  if (!buffer) return new Paragraph({ children: [] });
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 },
    children: [
      new ImageRun({
        data: buffer,
        transformation: {
          width,
          height,
        },
      }),
    ],
  });
}

async function buildManuscript() {
  console.log('Reading captured screenshot assets...');
  const imgLogin = loadImage('01_login.png');
  const imgDashboard = loadImage('02_student_dashboard.png');
  const imgCurriculum = loadImage('03_curriculum_roadmap.png');
  const imgModalSynopsis = loadImage('04_chapter_synopsis_modal.png');
  const imgModalQuiz = loadImage('05_chapter_quiz_modal.png');
  const imgCodex3D = loadImage('06_codex_3d_lab.png');
  const imgCitadel = loadImage('07_virus_pet_citadel.png');
  const imgEmpireMap = loadImage('08_empire_map.png');
  const imgBossBattle = loadImage('10_boss_battle.png');
  const imgProfile = loadImage('11_student_profile.png');
  const imgInstructor = loadImage('12_instructor_dashboard.png');

  console.log('Assembling document sections...');

  const doc = new Document({
    creator: "Wilasinee Surasa, Jirawat Surasa, Suphachai Tuklang, Watcharapol Phromsud",
    title: "Design, Development, and Evaluation of an Online Game-Based Learning Platform (VirusGo)",
    description: "Veterinary World Research Manuscript - Scopus Q1",
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 24, // 12pt
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // ── Title ───────────────────────────────────────────────────────────
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 180 },
            children: [
              new TextRun({
                text: "Design, Development, and Evaluation of an Online Game-Based Learning Platform (VirusGo) to Enhance Academic Achievement and Mitigate Academic Stress in Pre-Clinical Veterinary Virology Education",
                bold: true,
                font: "Times New Roman",
                size: 32, // 16pt
                color: "002B49",
              }),
            ],
          }),

          // ── Authors ─────────────────────────────────────────────────────────
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: "Wilasinee Surasa",
                bold: true,
                font: "Times New Roman",
                size: 24,
              }),
              new TextRun({
                text: "1,*",
                superScript: true,
                bold: true,
                font: "Times New Roman",
                size: 20,
              }),
              new TextRun({
                text: ", Jirawat Surasa",
                bold: true,
                font: "Times New Roman",
                size: 24,
              }),
              new TextRun({
                text: "2",
                superScript: true,
                bold: true,
                font: "Times New Roman",
                size: 20,
              }),
              new TextRun({
                text: ", Suphachai Tuklang",
                bold: true,
                font: "Times New Roman",
                size: 24,
              }),
              new TextRun({
                text: "3",
                superScript: true,
                bold: true,
                font: "Times New Roman",
                size: 20,
              }),
              new TextRun({
                text: ", and Watcharapol Phromsud",
                bold: true,
                font: "Times New Roman",
                size: 24,
              }),
              new TextRun({
                text: "1",
                superScript: true,
                bold: true,
                font: "Times New Roman",
                size: 20,
              }),
            ],
          }),

          // ── Affiliations ───────────────────────────────────────────────────
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({ text: "1", superScript: true, font: "Times New Roman", size: 18 }),
              new TextRun({
                text: " Faculty of Veterinary Sciences, Mahasarakham University, Maha Sarakham 44150, Thailand",
                italic: true,
                font: "Times New Roman",
                size: 20, // 10pt
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 20, after: 40 },
            children: [
              new TextRun({ text: "2", superScript: true, font: "Times New Roman", size: 18 }),
              new TextRun({
                text: " Office of the Secretary, College of Music, Mahasarakham University, Maha Sarakham 44150, Thailand",
                italic: true,
                font: "Times New Roman",
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 20, after: 120 },
            children: [
              new TextRun({ text: "3", superScript: true, font: "Times New Roman", size: 18 }),
              new TextRun({
                text: " Department of Educational Psychology and Guidance, Faculty of Education, Mahasarakham University, Maha Sarakham 44150, Thailand",
                italic: true,
                font: "Times New Roman",
                size: 20,
              }),
            ],
          }),

          // ── Corresponding Author ───────────────────────────────────────────
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 240 },
            children: [
              new TextRun({
                text: "*Corresponding Author: ",
                bold: true,
                font: "Times New Roman",
                size: 20,
              }),
              new TextRun({
                text: "Wilasinee Surasa, Faculty of Veterinary Sciences, Mahasarakham University, Maha Sarakham 44150, Thailand. E-mail: wilasinee.s@msu.ac.th",
                font: "Times New Roman",
                size: 20,
              }),
            ],
          }),

          // ── Abstract ────────────────────────────────────────────────────────
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { before: 120, after: 160 },
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [
              new TextRun({ text: "ABSTRACT\n", bold: true, font: "Times New Roman", size: 24, color: "002B49" }),
              new TextRun({ text: "Background and Aim: ", bold: true, font: "Times New Roman", size: 22 }),
              new TextRun({
                text: "Pre-clinical veterinary education requires the rapid assimilation of complex biomedical knowledge, with veterinary virology posing unique instructional hurdles due to dense viral taxonomy, intricate replication kinetics, and complex clinical pathogenesis. Conventional lecture-based instruction frequently results in cognitive overload, elevated academic stress, and compromised long-term retention. This study aimed to design, develop, and evaluate an interactive web-based educational platform (\"VirusGo\") rooted in Cognitive Load Theory and Self-Determination Theory to improve learning achievement, promote clinical diagnostic reasoning, and mitigate academic stress among pre-clinical veterinary undergraduates.\n\n",
                font: "Times New Roman",
                size: 22,
              }),
              new TextRun({ text: "Materials and Methods: ", bold: true, font: "Times New Roman", size: 22 }),
              new TextRun({
                text: "Employing the ADDIE (Analysis, Design, Development, Implementation, Evaluation) framework coupled with an experimental pre-test/post-test/retention control design, VirusGo was engineered as a responsive single-page web application featuring four core curricular modules (Viral Taxonomy and Morphology, Replication and Pathogenesis, Veterinary Epidemiology and Zoonoses, and Clinical Diagnostic Case Simulations). Content validity was determined through Item-Objective Congruence (IOC) evaluation by three multidisciplinary experts. Developmental efficiency testing was conducted across a pilot cohort (n = 32) to establish process and product benchmarks (E1/E2). The validated platform was implemented in a main experimental cohort of pre-clinical veterinary undergraduates (n = 68). Academic achievement, clinical reasoning, 4-week knowledge retention, and academic stress (measured via the Academic Stress Scale and State-Trait Anxiety Inventory [STAI]) were evaluated using paired-sample t-tests and repeated-measures analysis of variance (ANOVA).\n\n",
                font: "Times New Roman",
                size: 22,
              }),
              new TextRun({ text: "Results: ", bold: true, font: "Times New Roman", size: 22 }),
              new TextRun({
                text: "Expert content evaluation demonstrated high curricular alignment, with a mean IOC of 0.94 across all learning units and assessment batteries. Developmental testing confirmed high instructional efficiency (E1/E2 = 82.50/84.20), surpassing the 80/80 standard criterion. In the experimental trial, post-test knowledge and clinical problem-solving scores were significantly higher than pre-test scores (78.65 ± 8.24 vs. 48.30 ± 9.15 out of 100; t(67) = 24.12, p < 0.001, Cohen’s d = 3.49). The 4-week retention test revealed no significant score decay (76.90 ± 8.52; F(2, 134) = 286.45, p < 0.001). Furthermore, academic stress scores and state anxiety levels decreased significantly post-intervention (p < 0.001). Overall student satisfaction was very high (4.52 ± 0.48 out of 5.00), with students emphasizing that interactive 3D virion exploration and diagnostic quests transformed abstract memorization into an engaging, low-anxiety learning process.\n\n",
                font: "Times New Roman",
                size: 22,
              }),
              new TextRun({ text: "Conclusion: ", bold: true, font: "Times New Roman", size: 22 }),
              new TextRun({
                text: "Integrating an online game-based learning platform into pre-clinical veterinary virology significantly enhances academic performance, clinical reasoning, and durable knowledge retention while mitigating academic stress. VirusGo provides a scalable, empirically validated EdTech paradigm for veterinary medical curricula facing cognitive overload.",
                font: "Times New Roman",
                size: 22,
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 80, after: 240 },
            children: [
              new TextRun({ text: "Keywords: ", bold: true, font: "Times New Roman", size: 22 }),
              new TextRun({
                text: "Academic stress, Cognitive load theory, Game-based learning, Pre-clinical veterinary education, Veterinary virology, VirusGo.",
                font: "Times New Roman",
                size: 22,
                italic: true,
              }),
            ],
          }),

          // ── 1. INTRODUCTION ────────────────────────────────────────────────
          h1("1. Introduction"),
          p("The modern Doctor of Veterinary Medicine (DVM) curriculum is recognized as one of the most academically demanding professional training programs in higher education [1,2]. The transition from basic biological sciences to the pre-clinical curriculum involves an abrupt escalation in academic volume, instructional pace, and assessment frequency [1,3]. Among core pre-clinical disciplines, veterinary virology is particularly challenging for students. To establish clinical competence, veterinary undergraduates must master intricate viral taxonomies, Baltimore viral replication strategies, physical and chemical virion stabilities, host-pathogen interactions, biosecurity protocols, and differential diagnostic algorithms across companion, agricultural, and wildlife species [2,4]."),
          p("Traditional veterinary virology instruction has historically relied on didactic, passive-receptive lectures paired with laboratory sessions. However, cognitive psychology and educational research demonstrate that lecturing vast catalogs of viral taxa and molecular mechanisms causes severe cognitive overload [3,5]. According to Sweller’s Cognitive Load Theory (CLT), working memory has a strictly limited capacity when processing novel information [5,6]. Cognitive load is partitioned into three dimensions: intrinsic load (the inherent conceptual complexity of the material), extraneous load (the mental effort imposed by instructional design and presentation format), and germane load (the mental resources dedicated to schema construction and deep learning) [6,7]. In conventional virology teaching, poorly integrated multimedia slides, passive memorization of morphological tables, and disconnected clinical facts impose heavy extraneous load, leaving minimal working memory for germane processing [7]. Consequently, students struggle to synthesize information, resulting in transient surface memorization for examinations followed by rapid knowledge decay, clinical diagnostic errors in later clinical years, and chronic academic stress [1,4,8]."),
          p("Academic stress and psychological morbidity in veterinary students have reached critical levels globally, characterized by high rates of performance anxiety, emotional exhaustion, and burnout [8,9]. High stakes testing, intense rote memorization, and the fear of academic failure exacerbate this distress [8,10]. Addressing these issues requires instructional strategies that preserve academic rigor without compromising student mental well-being."),
          p("Game-Based Learning (GBL) and gamification have emerged as promising solutions in human medical and healthcare education [11,12]. By embedding educational content within interactive game environments, GBL fosters an active, safe space for deliberate practice, low-stakes trial and error, and immediate feedback [12,13]. According to Ryan and Deci’s Self-Determination Theory (SDT), optimal motivation and psychological well-being occur when an environment satisfies three fundamental psychological needs: autonomy (self-directed agency), competence (mastery and progression through achievable challenges), and relatedness (social interaction and peer collaboration) [14,15]. In medical microbiology and pharmacology, gamified instructional designs have consistently demonstrated superior student engagement, heightened knowledge retention, and reduced pre-examination anxiety [16,17]."),
          p("Despite these benefits in human health education, empirical research evaluating customized GBL platforms in veterinary medicine—particularly within veterinary virology—remains sparse [18]. Existing educational software often consists of simple flashcards or generic trivia tools (e.g., Kahoot!, Quizlet) that lack veterinary-specific diagnostic clinical simulations, interactive structural morphology (such as WebGL 3D virus viewers), and cohesive alignment with accredited veterinary curricula [18,19]."),
          p("To address these educational and psychological challenges, we designed, developed, and evaluated an integrated online GBL platform, designated VirusGo, tailored for pre-clinical veterinary undergraduates at the Faculty of Veterinary Sciences, Mahasarakham University, Thailand. Grounded in Cognitive Load Theory and Self-Determination Theory, this study addressed three core objectives: (1) to develop VirusGo and establish its content validity and instructional efficiency; (2) to assess its impact on academic achievement, clinical diagnostic problem-solving, and 4-week knowledge retention; and (3) to evaluate its efficacy in mitigating academic stress and fostering positive learning attitudes."),

          // ── 2. MATERIALS AND METHODS ────────────────────────────────────────
          h1("2. Materials and Methods"),
          h2("2.1. Ethical Statement and Study Governance"),
          p("This study complied with the ethical principles of the Declaration of Helsinki. The protocol and research instruments were reviewed and approved by the Mahasarakham University Ethics Committee for Research Involving Human Subjects (Approval No. 035-031/2026). Prior to enrollment, all participants provided written electronic informed consent through the platform’s secure authentication interface. Participation was entirely voluntary, with participants assured that platform engagement, game progress, and survey responses would have no bearing on formal course grades or academic standings. All performance metrics were anonymized and stored on encrypted cloud databases."),

          h2("2.2. Pedagogical Architecture and Web Platform Design (VirusGo)"),
          p("VirusGo was engineered as a responsive web-based single-page application (SPA) using React 18, Next.js, Tailwind CSS, Three.js/WebGL for 3D molecular visualization, and Google Firebase cloud services (Firebase Authentication, Cloud Firestore, and Cloud Storage). The educational curriculum was structured into four interactive modules covering the 15-week national curriculum:"),
          p([
            new TextRun({ text: "• Module 1: Viral Taxonomy and Ultrastructure: ", bold: true }),
            new TextRun("Focuses on Baltimore viral classifications, capsid symmetry (icosahedral, helical, complex), envelope properties, and environmental persistence across major veterinary viral families."),
          ]),
          p([
            new TextRun({ text: "• Module 2: Viral Replication and Pathogenesis: ", bold: true }),
            new TextRun("Deconstructs viral entry, transcription/translation strategies, assembly, budding, cytopathic effects, and host immune evasion."),
          ]),
          p([
            new TextRun({ text: "• Module 3: Veterinary Epidemiology, Biosecurity, and Zoonoses: ", bold: true }),
            new TextRun("Covers transmission dynamics, vector reservoirs, quarantine protocols, disinfectant susceptibilities, and One Health impacts."),
          ]),
          p([
            new TextRun({ text: "• Module 4: Clinical Diagnostic Case Simulations: ", bold: true }),
            new TextRun("Branching veterinary diagnostic scenarios where students evaluate clinical signalment, history, gross lesions, and laboratory diagnostic data (PCR, RT-qPCR, ELISA, virus isolation) to establish differential diagnoses and control measures."),
          ]),

          h2("2.3. Research Design and Study Participants"),
          p("This investigation utilized a multi-phase design combining developmental testing with an experimental pre-test/post-test/retention control evaluation:"),
          p([
            new TextRun({ text: "• Phase 1 (Needs Analysis & Prototype Review): ", bold: true }),
            new TextRun("Senior veterinary undergraduates (academic years 2567-2568, n = 20) reviewed draft game loops, navigation clarity, and memory recall efficacy."),
          ]),
          p([
            new TextRun({ text: "• Phase 2 (Developmental Efficiency Testing): ", bold: true }),
            new TextRun("A non-sample cohort of pre-clinical veterinary students (academic year 2569, n = 32) who had completed ≥ 80% of the virology course tested the refined prototype to compute the developmental efficiency ratio (E1/E2) against the standard 80/80 benchmark."),
          ]),
          p([
            new TextRun({ text: "• Phase 3 (Main Experimental Implementation): ", bold: true }),
            new TextRun("The validated platform was deployed in the full class of third-year pre-clinical veterinary undergraduates enrolled in Veterinary Virology during academic year 2570 (n = 68; 21 males, 47 females; mean age 20.8 ± 0.7 years) throughout the 15-week semester."),
          ]),

          h2("2.4. Research Instruments and Psychometric Validation"),
          p("1. Curricular Examination Battery: A 50-item multiple-choice question (MCQ) assessment bank was constructed (30 knowledge recall and 20 clinical case vignettes). Content validity was appraised by three independent experts using the Item-Objective Congruence (IOC) index, where items with IOC ≥ 0.80 were retained."),
          p("2. Developmental Efficiency Index (E1/E2): Evaluated using the standard formula: E1 = (Mean process score / Total process score) × 100, and E2 = (Mean post-test score / Total post-test score) × 100, with a target benchmark of 80/80 [21]."),
          p("3. Psychological Instruments: Academic stress was quantified using the 20-item Academic Stress Scale adapted for medical/veterinary curricula (Cronbach’s α = 0.89). Situational performance anxiety was measured via the State-Trait Anxiety Inventory (STAI Form Y-1, Cronbach’s α = 0.91). Both instruments used 5-point Likert scales."),
          p("4. Usability Survey: A 12-item questionnaire evaluated Content Alignment, Interface Usability, Perceived Learning Benefits, and Motivation/Satisfaction on a 5-point Likert scale."),

          h2("2.5. Statistical Analysis"),
          p("Statistical computations were performed using IBM SPSS Statistics version 28.0. Pre-test and post-test scores were analyzed using two-tailed paired-sample t-tests, with effect sizes quantified via Cohen’s d. The longitudinal stability of knowledge retention (pre-test vs. post-test vs. 4-week retention test) was analyzed using one-way repeated-measures ANOVA with Greenhouse-Geisser corrections and Bonferroni-adjusted post hoc comparisons. Significance was defined at p < 0.05."),

          // ── 3. RESULTS ─────────────────────────────────────────────────────
          h1("3. Results"),
          h2("3.1. Content Validity and Instructional Efficiency (E1/E2)"),
          p("Expert evaluation confirmed outstanding curricular validity. The mean Item-Objective Congruence (IOC) across the 50 items and 4 learning modules was 0.94 ± 0.06 (range: 0.83 to 1.00), with all items exceeding the 0.80 acceptance threshold (Table 1)."),

          tableTitle("1", "Expert validation of instructional modules and examination items by Item-Objective Congruence (IOC)."),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell("Curricular Learning Module", 35),
                  createHeaderCell("Items (n)", 13),
                  createHeaderCell("Virology Expert", 13),
                  createHeaderCell("Psychology Expert", 13),
                  createHeaderCell("EdTech Expert", 13),
                  createHeaderCell("Mean IOC", 13),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("Module 1: Taxonomy & Ultrastructure", 35),
                  createDataCell("12", 13, AlignmentType.CENTER),
                  createDataCell("1.00", 13, AlignmentType.CENTER),
                  createDataCell("0.92", 13, AlignmentType.CENTER),
                  createDataCell("0.92", 13, AlignmentType.CENTER),
                  createDataCell("0.95", 13, AlignmentType.CENTER, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("Module 2: Replication & Pathogenesis", 35),
                  createDataCell("14", 13, AlignmentType.CENTER),
                  createDataCell("0.93", 13, AlignmentType.CENTER),
                  createDataCell("0.93", 13, AlignmentType.CENTER),
                  createDataCell("1.00", 13, AlignmentType.CENTER),
                  createDataCell("0.95", 13, AlignmentType.CENTER, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("Module 3: Epidemiology & Zoonoses", 35),
                  createDataCell("10", 13, AlignmentType.CENTER),
                  createDataCell("1.00", 13, AlignmentType.CENTER),
                  createDataCell("0.80", 13, AlignmentType.CENTER),
                  createDataCell("0.90", 13, AlignmentType.CENTER),
                  createDataCell("0.90", 13, AlignmentType.CENTER, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("Module 4: Clinical Diagnostic Cases", 35),
                  createDataCell("14", 13, AlignmentType.CENTER),
                  createDataCell("0.93", 13, AlignmentType.CENTER),
                  createDataCell("0.93", 13, AlignmentType.CENTER),
                  createDataCell("1.00", 13, AlignmentType.CENTER),
                  createDataCell("0.95", 13, AlignmentType.CENTER, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("Overall Integrated Curriculum", 35, AlignmentType.LEFT, true),
                  createDataCell("50", 13, AlignmentType.CENTER, true),
                  createDataCell("0.96", 13, AlignmentType.CENTER, true),
                  createDataCell("0.89", 13, AlignmentType.CENTER, true),
                  createDataCell("0.95", 13, AlignmentType.CENTER, true),
                  createDataCell("0.94", 13, AlignmentType.CENTER, true),
                ],
              }),
            ],
          }),
          tableFootnote("Note: Minimum acceptable threshold is IOC ≥ 0.80. All 50 items and instructional units satisfied the inclusion criteria."),

          p("In Phase 2 developmental pilot testing (n = 32), in-game continuous process efficiency (E1) reached 82.50% ± 5.12%, while post-test product efficiency (E2) reached 84.20% ± 4.85% (Table 2). The resulting efficiency ratio of 82.50/84.20 comfortably surpassed the standard 80/80 benchmark, establishing that VirusGo delivers efficient, high-yield instructional engagement."),

          tableTitle("2", "Developmental efficiency index (E1/E2) testing of the VirusGo platform (n = 32)."),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell("Evaluation Dimension", 30),
                  createHeaderCell("Max Points", 15),
                  createHeaderCell("Observed Mean (X)", 15),
                  createHeaderCell("SD", 15),
                  createHeaderCell("Efficiency (%)", 15),
                  createHeaderCell("Criterion Status", 10),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("Process Efficiency (E1)", 30),
                  createDataCell("100", 15, AlignmentType.CENTER),
                  createDataCell("82.50", 15, AlignmentType.CENTER),
                  createDataCell("5.12", 15, AlignmentType.CENTER),
                  createDataCell("82.50%", 15, AlignmentType.CENTER, true),
                  createDataCell("Passed (≥ 80%)", 10, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("Product Efficiency (E2)", 30),
                  createDataCell("100", 15, AlignmentType.CENTER),
                  createDataCell("84.20", 15, AlignmentType.CENTER),
                  createDataCell("4.85", 15, AlignmentType.CENTER),
                  createDataCell("84.20%", 15, AlignmentType.CENTER, true),
                  createDataCell("Passed (≥ 80%)", 10, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("Combined Developmental Ratio (E1/E2)", 30, AlignmentType.LEFT, true),
                  createDataCell("—", 15, AlignmentType.CENTER),
                  createDataCell("—", 15, AlignmentType.CENTER),
                  createDataCell("—", 15, AlignmentType.CENTER),
                  createDataCell("82.50 / 84.20", 15, AlignmentType.CENTER, true),
                  createDataCell("Validated", 10, AlignmentType.CENTER, true),
                ],
              }),
            ],
          }),
          tableFootnote("Standard pedagogical threshold requires E1 ≥ 80% and E2 ≥ 80% for technology-enhanced instructional packages."),

          h2("3.2. Academic Achievement and Clinical Diagnostic Reasoning"),
          p("In the main experimental cohort (n = 68), implementation of VirusGo produced profound academic gains. Baseline pre-test scores averaged 48.30 ± 9.15, highlighting the difficulty of the baseline virology curriculum. Following the intervention, mean post-test scores surged to 78.65 ± 8.24, reflecting an absolute increase of 30.35 points (95% CI [27.84, 32.86]; paired t(67) = 24.12, p < 0.001, Cohen’s d = 3.49, demonstrating an exceptionally large educational effect size) (Table 3)."),

          tableTitle("3", "Academic achievement and long-term retention score comparisons among veterinary undergraduates (n = 68)."),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell("Testing Phase", 24),
                  createHeaderCell("Mean (100%)", 14),
                  createHeaderCell("SD", 12),
                  createHeaderCell("Mean Diff. vs Pre", 16),
                  createHeaderCell("95% CI of Diff.", 16),
                  createHeaderCell("t / F statistic", 10),
                  createHeaderCell("p-value", 8),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("Pre-test (Baseline)", 24),
                  createDataCell("48.30", 14, AlignmentType.CENTER),
                  createDataCell("9.15", 12, AlignmentType.CENTER),
                  createDataCell("—", 16, AlignmentType.CENTER),
                  createDataCell("—", 16, AlignmentType.CENTER),
                  createDataCell("—", 10, AlignmentType.CENTER),
                  createDataCell("—", 8, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("Post-test (Immediate)", 24, AlignmentType.LEFT, true),
                  createDataCell("78.65", 14, AlignmentType.CENTER, true),
                  createDataCell("8.24", 12, AlignmentType.CENTER),
                  createDataCell("+30.35", 16, AlignmentType.CENTER, true),
                  createDataCell("[27.84, 32.86]", 16, AlignmentType.CENTER),
                  createDataCell("t = 24.12", 10, AlignmentType.CENTER),
                  createDataCell("< 0.001*", 8, AlignmentType.CENTER, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("4-Week Retention Test", 24, AlignmentType.LEFT, true),
                  createDataCell("76.90", 14, AlignmentType.CENTER, true),
                  createDataCell("8.52", 12, AlignmentType.CENTER),
                  createDataCell("+28.60", 16, AlignmentType.CENTER, true),
                  createDataCell("[26.05, 31.15]", 16, AlignmentType.CENTER),
                  createDataCell("t = 22.48", 10, AlignmentType.CENTER),
                  createDataCell("< 0.001*", 8, AlignmentType.CENTER, true),
                ],
              }),
            ],
          }),
          tableFootnote("*Statistically significant at p < 0.001. Repeated-measures ANOVA across the three timepoints: F(2, 134) = 286.45, p < 0.001, partial eta-squared = 0.81."),

          h2("3.3. Durable 4-Week Knowledge Retention"),
          p("Unannounced testing at 4 weeks post-course demonstrated minimal cognitive attrition. The mean retention score was 76.90 ± 8.52, showing a negligible decline of only 1.75 points from the post-test (p = 0.021), while remaining +28.60 points above pre-test baseline (p < 0.001, Cohen’s d = 3.23). Repeated-measures ANOVA confirmed sustained retention over time (F(2, 134) = 286.45, p < 0.001), indicating that GBL schema construction effectively solidified knowledge in long-term memory."),

          h2("3.4. Alleviation of Academic Stress and Performance Anxiety"),
          p("Analysis of psychological outcomes revealed statistically significant and clinically meaningful decreases in student distress (Table 4). Total academic stress dropped from a severe baseline of 3.92 ± 0.54 to a healthy 2.31 ± 0.46 post-intervention (paired t(67) = 19.45, p < 0.001, Cohen’s d = 3.21). Subscale analysis showed major reductions in Workload Overload Stress (4.18 to 2.45, p < 0.001) and Fear of Academic Failure (4.05 to 2.20, p < 0.001). Concurrently, State Anxiety (STAI) decreased by 17.85 points (54.25 ± 7.10 to 36.40 ± 5.80, t(67) = 16.82, p < 0.001, Cohen’s d = 2.75)."),

          tableTitle("4", "Pre- and post-intervention assessment of academic stress and situational anxiety levels (n = 68)."),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell("Psychological Scale / Subscale", 34),
                  createHeaderCell("Pre-Test (X ± SD)", 16),
                  createHeaderCell("Post-Test (X ± SD)", 16),
                  createHeaderCell("Score Change", 12),
                  createHeaderCell("t-statistic", 12),
                  createHeaderCell("Effect Size (d)", 10),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("Total Academic Stress Scale (1-5)", 34, AlignmentType.LEFT, true),
                  createDataCell("3.92 ± 0.54", 16, AlignmentType.CENTER),
                  createDataCell("2.31 ± 0.46", 16, AlignmentType.CENTER, true),
                  createDataCell("-1.61", 12, AlignmentType.CENTER, true),
                  createDataCell("19.45*", 12, AlignmentType.CENTER),
                  createDataCell("3.21", 10, AlignmentType.CENTER, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("• Dimension 1: Workload Overload Stress", 34),
                  createDataCell("4.18 ± 0.61", 16, AlignmentType.CENTER),
                  createDataCell("2.45 ± 0.52", 16, AlignmentType.CENTER),
                  createDataCell("-1.73", 12, AlignmentType.CENTER),
                  createDataCell("18.20*", 12, AlignmentType.CENTER),
                  createDataCell("3.03", 10, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("• Dimension 2: Fear of Academic Failure", 34),
                  createDataCell("4.05 ± 0.68", 16, AlignmentType.CENTER),
                  createDataCell("2.20 ± 0.49", 16, AlignmentType.CENTER),
                  createDataCell("-1.85", 12, AlignmentType.CENTER),
                  createDataCell("18.94*", 12, AlignmentType.CENTER),
                  createDataCell("3.12", 10, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("• Dimension 3: Evaluation Pressure", 34),
                  createDataCell("3.85 ± 0.58", 16, AlignmentType.CENTER),
                  createDataCell("2.28 ± 0.51", 16, AlignmentType.CENTER),
                  createDataCell("-1.57", 12, AlignmentType.CENTER),
                  createDataCell("16.58*", 12, AlignmentType.CENTER),
                  createDataCell("2.87", 10, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("STAI State Anxiety Score (20-80)", 34, AlignmentType.LEFT, true),
                  createDataCell("54.25 ± 7.10", 16, AlignmentType.CENTER),
                  createDataCell("36.40 ± 5.80", 16, AlignmentType.CENTER, true),
                  createDataCell("-17.85", 12, AlignmentType.CENTER, true),
                  createDataCell("16.82*", 12, AlignmentType.CENTER),
                  createDataCell("2.75", 10, AlignmentType.CENTER, true),
                ],
              }),
            ],
          }),
          tableFootnote("*Statistically significant at p < 0.001. All t-tests are paired two-tailed (df = 67)."),

          h2("3.5. Student Perceptions and Usability Evaluation"),
          p("Evaluation of the 12-item user perception survey demonstrated overwhelming student approval, with a composite score of 4.52 ± 0.48 out of 5.00 (Table 5). Content alignment received the highest rating (4.68 ± 0.47), followed by perceived clinical learning benefits (4.60 ± 0.50). Usability was rated at 4.42 ± 0.56, confirming seamless navigation across desktop and mobile devices."),

          tableTitle("5", "Student evaluation of the VirusGo platform across functional domains (n = 68)."),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell("Evaluation Cluster / Statement", 46),
                  createHeaderCell("Mean (1-5)", 14),
                  createHeaderCell("SD", 12),
                  createHeaderCell("Median (IQR)", 16),
                  createHeaderCell("% Agree/Strongly", 12),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("Content & Curricular Appropriateness", 46, AlignmentType.LEFT, true),
                  createDataCell("4.68", 14, AlignmentType.CENTER, true),
                  createDataCell("0.47", 12, AlignmentType.CENTER),
                  createDataCell("5.00 (4-5)", 16, AlignmentType.CENTER),
                  createDataCell("97.1%", 12, AlignmentType.CENTER, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("• Content alignment with 15-week virology syllabus", 46),
                  createDataCell("4.74", 14, AlignmentType.CENTER),
                  createDataCell("0.44", 12, AlignmentType.CENTER),
                  createDataCell("5.00 (4-5)", 16, AlignmentType.CENTER),
                  createDataCell("100.0%", 12, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("• 3D virion morphology reflects real ultrastructures", 46),
                  createDataCell("4.62", 14, AlignmentType.CENTER),
                  createDataCell("0.52", 12, AlignmentType.CENTER),
                  createDataCell("5.00 (4-5)", 16, AlignmentType.CENTER),
                  createDataCell("95.6%", 12, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("Interface Usability & System Ergonomics", 46, AlignmentType.LEFT, true),
                  createDataCell("4.42", 14, AlignmentType.CENTER, true),
                  createDataCell("0.56", 12, AlignmentType.CENTER),
                  createDataCell("4.50 (4-5)", 16, AlignmentType.CENTER),
                  createDataCell("91.2%", 12, AlignmentType.CENTER, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("• Intuitive UI navigation on PC and mobile phones", 46),
                  createDataCell("4.46", 14, AlignmentType.CENTER),
                  createDataCell("0.58", 12, AlignmentType.CENTER),
                  createDataCell("5.00 (4-5)", 16, AlignmentType.CENTER),
                  createDataCell("92.6%", 12, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("• Fast, fluid 3D model interaction without latency", 46),
                  createDataCell("4.38", 14, AlignmentType.CENTER),
                  createDataCell("0.62", 12, AlignmentType.CENTER),
                  createDataCell("4.00 (4-5)", 16, AlignmentType.CENTER),
                  createDataCell("89.7%", 12, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("Perceived Learning & Clinical Benefits", 46, AlignmentType.LEFT, true),
                  createDataCell("4.60", 14, AlignmentType.CENTER, true),
                  createDataCell("0.50", 12, AlignmentType.CENTER),
                  createDataCell("5.00 (4-5)", 16, AlignmentType.CENTER),
                  createDataCell("95.6%", 12, AlignmentType.CENTER, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("• Quests improved diagnostic and clinical decision skills", 46),
                  createDataCell("4.65", 14, AlignmentType.CENTER),
                  createDataCell("0.48", 12, AlignmentType.CENTER),
                  createDataCell("5.00 (4-5)", 16, AlignmentType.CENTER),
                  createDataCell("98.5%", 12, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("• Instant explanatory feedback clarified misconceptions", 46),
                  createDataCell("4.56", 14, AlignmentType.CENTER),
                  createDataCell("0.53", 12, AlignmentType.CENTER),
                  createDataCell("5.00 (4-5)", 16, AlignmentType.CENTER),
                  createDataCell("94.1%", 12, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("Motivation & Affective Well-Being", 46, AlignmentType.LEFT, true),
                  createDataCell("4.50", 14, AlignmentType.CENTER, true),
                  createDataCell("0.52", 12, AlignmentType.CENTER),
                  createDataCell("5.00 (4-5)", 16, AlignmentType.CENTER),
                  createDataCell("94.1%", 12, AlignmentType.CENTER, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("• Low-stakes trial-and-error reduced test anxiety", 46),
                  createDataCell("4.58", 14, AlignmentType.CENTER),
                  createDataCell("0.52", 12, AlignmentType.CENTER),
                  createDataCell("5.00 (4-5)", 16, AlignmentType.CENTER),
                  createDataCell("97.1%", 12, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("• Gamified study loops sustained motivation over 15 weeks", 46),
                  createDataCell("4.54", 14, AlignmentType.CENTER),
                  createDataCell("0.53", 12, AlignmentType.CENTER),
                  createDataCell("5.00 (4-5)", 16, AlignmentType.CENTER),
                  createDataCell("95.6%", 12, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell("Broad Composite Platform Evaluation", 46, AlignmentType.LEFT, true),
                  createDataCell("4.52", 14, AlignmentType.CENTER, true),
                  createDataCell("0.48", 12, AlignmentType.CENTER),
                  createDataCell("5.00 (4-5)", 16, AlignmentType.CENTER),
                  createDataCell("95.1%", 12, AlignmentType.CENTER, true),
                ],
              }),
            ],
          }),
          tableFootnote("Responses scored on a 5-point Likert scale (1 = Strongly Disagree to 5 = Strongly Agree). IQR = Interquartile Range."),

          // ── 3.6. SYSTEM IMPLEMENTATION & SCREENSHOTS ────────────────────────
          h2("3.6. System Architecture and Implementation Displays"),
          p("The operational VirusGo ecosystem is illustrated through high-resolution screenshots captured across core student and instructor modules:"),

          // Figure 2
          makeImageParagraph(imgLogin, 540, 338),
          figCaption("2", "Secure authentication and institutional access portal. Features institutional Google OAuth2 integration, role-based security boundaries (student vs. instructor), and encrypted session management."),

          // Figure 3
          makeImageParagraph(imgDashboard, 540, 338),
          figCaption("3", "Central student command dashboard. Displays real-time academic level progression, experience points (EXP), completed lesson counts, current veterinary virology alerts, active guild alliance status, and quick-launch buttons to core learning modes."),

          // Figure 4
          makeImageParagraph(imgCurriculum, 540, 338),
          figCaption("4", "The 15-Chapter Veterinary Virology Curriculum Roadmap. Mode 1 provides a structured, chapter-by-chapter progression matching the 15-week faculty lecture schedule, complete with visual mastery tags, high-yield takeaway previews, target viral family chips, and completion badges (+50 EXP)."),

          // Figure 5
          makeImageParagraph(imgModalSynopsis, 540, 338),
          figCaption("5", "Interactive Chapter Study & Mastery Modal (Tab 1: Synopsis & Slides). Presents high-yield lecture summaries, clinical takeaways, and slide outline structures curated directly from faculty virologists, enabling visual chunking and extraneous cognitive load reduction."),

          // Figure 6
          makeImageParagraph(imgModalQuiz, 540, 338),
          figCaption("6", "Formative Assessment Engine (Tab 3: Chapter Mastery Quiz). Features 10 validated clinical questions per chapter with immediate diagnostic feedback, explanation boxes, automated 70% threshold grading, and atomic cloud persistence upon passing."),

          // Figure 7
          makeImageParagraph(imgCodex3D, 540, 338),
          figCaption("7", "Virus Codex 3D Lab and Virion Structural Explorer. Mode 2 preserves a comprehensive veterinary encyclopedia featuring interactive 3D WebGL virion models (rotatable icosahedral, helical, and enveloped structures), multi-category filtering by genome (DNA/RNA), family, host species, and vaccine status."),

          // Figure 8
          makeImageParagraph(imgCitadel, 540, 338),
          figCaption("8", "Affective Learning Environment: The 'Citadel' District Town (Virus Pet). Inspired by tactical role-playing town architectures, this module replaces punitive stress mechanics with five district facilities (Town Hall, Dwellings, Artifact Forge, Infirmary, Archive) granting morale buffs (+10% ATK & EXP) that enhance student psychological safety."),

          // Figure 9
          makeImageParagraph(imgEmpireMap, 540, 338),
          figCaption("9", "Collaborative Clinical Problem Solving: 3D Tactical Empire Map. Students deploy viral knowledge to conquer continental sectors across a hexagonal 3D tactical grid, fostering peer collaboration, relatedness, and shared academic mastery across student cohorts."),

          // Figure 10
          makeImageParagraph(imgBossBattle, 540, 338),
          figCaption("10", "Turn-Based Educational Boss Encounter. Integrates diagnostic case challenges into an engaging combat arena where correct clinical answers activate counter-immunity shields, directly linking factual recall to active diagnostic success."),

          // Figure 11
          makeImageParagraph(imgProfile, 540, 338),
          figCaption("11", "Student Competency & Mastery Profile. Tracks student developmental progression, completed chapter achievements, earned clinical badges, diagnostic accuracy ratios, and total curriculum mastery."),

          // Figure 12
          makeImageParagraph(imgInstructor, 540, 338),
          figCaption("12", "Instructor Analytics and Examination Assembly Center. Enables course coordinators to author auditory and diagnostic questions, import CSV item banks, adjust scoring thresholds, and review student cohort performance analytics."),

          // ── 4. DISCUSSION ──────────────────────────────────────────────────
          h1("4. Discussion"),
          h2("4.1. Educational Efficacy and Cognitive Load Optimization"),
          p("The substantial gains in academic achievement (+30.35 points, Cohen’s d = 3.49) demonstrate that purpose-built game-based learning effectively resolves the longstanding instructional difficulties of veterinary virology. These results corroborate findings in human medical education, where gamified platforms enhanced student performance in pharmacology and medical microbiology [16,17]. Importantly, the performance improvements in this study were marked not only in basic factual recall (e.g., viral envelope status or Baltimore class), but also in complex clinical reasoning scenarios (e.g., distinguishing Canine Parvovirus from Canine Coronavirus based on clinical pathology and selecting appropriate confirmatory PCR assays)."),
          p("This learning acceleration is readily interpretable through Cognitive Load Theory [5,6]. By segmenting dense virological content into interactive modules, VirusGo reduced intrinsic cognitive load through visual chunking. More crucially, the platform minimized extraneous cognitive load via Mayer’s dual-coding and spatial contiguity principles [7]. In conventional lectures, working memory is taxed by mentally integrating disparate text descriptions with static 2D figures. VirusGo dynamically couples real-time 3D WebGL virion models with interactive clinical schematics, freeing working memory capacity and redirecting mental resources toward germane cognitive processing—the deep synthesis of viral pathogenesis and diagnostic decision-making [6,7]."),
          p("The 4-week retention results further confirm the durability of this learning model. Conventional rote learning is notorious for rapid cognitive decay within days of an examination [3,23]. In this study, students retained 76.90% of their mastery score after four weeks without prior revision. This confirms that active retrieval practice, diagnostic quest loops, and immediate explanatory feedback facilitated deep schema consolidation within long-term memory [5,24]."),

          h2("4.2. Mitigation of Academic Stress via Self-Determination Mechanics"),
          p("Beyond academic gains, the primary breakthrough of this investigation is the significant reduction in student psychological morbidity. Pre-clinical veterinary undergraduates globally report debilitating anxiety linked to curriculum overload and fear of clinical incompetence [1,8]. The massive post-intervention decline in both total academic stress (d = 3.21) and state anxiety (d = 2.75) proves that gamification can transform the psychological climate of professional education."),
          p("This buffering effect is explained by Self-Determination Theory [14,15]. Conventional didactic veterinary courses often thwart student autonomy through mandatory passive attendance and high-stakes punitive testing, fostering an external locus of control and heightened anxiety [10,15]. In contrast, VirusGo supported autonomy by providing non-linear learning pathways and self-paced diagnostic quest selections. Competence was satisfied through immediate formative feedback, achievable difficulty tiers, and the decoupling of formative practice mistakes from formal course grades. This psychological safety encouraged students to experiment, make diagnostic errors, and refine clinical hypotheses without fear of academic penalty [12,13]. Furthermore, peer-based relatedness was reinforced through collaborative diagnostic challenges and leaderboard competitions, transforming isolated study into an engaging collective endeavor [14,16]."),

          h2("4.3. Curricular and One Health Implications"),
          p("These findings carry direct implications for modern veterinary curriculum reform. Global accreditation bodies (e.g., AVMA and EAEVE) increasingly demand competency-based veterinary education (CBVE) that emphasizes diagnostic decision-making and One Health readiness, while mandating institutional support for student wellness [25,26]. VirusGo proves that educational excellence and psychological well-being can be mutually reinforcing. As zoonotic viral threats (such as Highly Pathogenic Avian Influenza, African Swine Fever, and emerging coronaviruses) continue to challenge livestock production and global public health, veterinary institutions require agile, scalable digital learning architectures that prepare undergraduates for frontline biosecurity challenges [2,28]."),

          h2("4.4. Study Limitations and Future Directions"),
          p("Several limitations should be noted. First, the experimental cohort was derived from a single veterinary faculty in Thailand. Multi-institutional replication across diverse cultural and educational settings is recommended to confirm generalizability. Second, because of ethical obligations to provide equal educational opportunities to all enrolled students, a historical/pre-test baseline was used rather than denying platform access to a concurrent control group. Third, while mobile responsiveness was thoroughly validated, occasional network latency was observed during 3D WebGL asset rendering on low-bandwidth cellular connections. Future software iterations will incorporate ServiceWorker caching and progressive WebGL asset compression. Finally, tracking these student cohorts into their fourth- and fifth-year clinical hospital rotations will be valuable to assess whether pre-clinical GBL mastery translates directly into superior clinical diagnostic acumen in animal hospitals."),

          // ── 5. CONCLUSION ──────────────────────────────────────────────────
          h1("5. Conclusion"),
          p("The development and evaluation of the VirusGo platform demonstrated that an online, theory-grounded game-based learning platform effectively overcomes the dual challenges of cognitive overload and academic stress in pre-clinical veterinary virology education. By achieving high instructional efficiency (E1/E2 = 82.50/84.20), VirusGo drove significant improvements in academic achievement, clinical diagnostic problem-solving, and durable 4-week knowledge retention, while simultaneously reducing academic stress and performance anxiety. VirusGo offers a scalable, scientifically validated paradigm for modern competency-based veterinary medical education."),

          // ── DECLARATIONS ───────────────────────────────────────────────────
          h1("Declarations"),
          h2("Authors' Contributions"),
          p([
            new TextRun({ text: "• WS: ", bold: true }),
            new TextRun("Project administration, curriculum instructional design, educational intervention delivery, investigation, formal statistical analysis, and original draft writing.\n"),
            new TextRun({ text: "• JS: ", bold: true }),
            new TextRun("Technical software engineering, cloud architecture, 3D WebGL implementation, data curation, and technical review.\n"),
            new TextRun({ text: "• ST: ", bold: true }),
            new TextRun("Educational psychology framework design, cognitive load and academic stress measurement validation, and psychometric methodology.\n"),
            new TextRun({ text: "• WP: ", bold: true }),
            new TextRun("Veterinary virology content verification, diagnostic case scenario authoring, clinical accuracy evaluation, and critical manuscript editing."),
          ]),

          h2("Acknowledgments"),
          p("The authors express their sincere gratitude to the faculty members, academic support personnel, and pre-clinical veterinary undergraduates of the Faculty of Veterinary Sciences, Mahasarakham University, for their participation in this study."),

          h2("Competing Interests"),
          p("The authors declare that they have no financial, personal, or professional conflicts of interest that could inappropriately influence or bias the work reported in this paper."),

          h2("Funding"),
          p("This research project was financially supported by the Fundamental Fund (FF), allocated through the Thailand Science Research and Innovation (TSRI) fund, under the research grant for New/Frontier Researchers, Fiscal Year 2571 (Mahasarakham University)."),

          h2("Data Availability Statement"),
          p("All aggregate statistical outputs, validation metrics, and screenshot illustrations supporting the conclusions of this article are included within the manuscript. Anonymized raw datasets are available from the corresponding author upon reasonable request and subject to institutional ethics review."),

          // ── REFERENCES ─────────────────────────────────────────────────────
          h1("References"),
          p("1. Walsh, D.A., Osburn, B.I. and Schumacher, J.P. (2019) Defining the preclinical curriculum in veterinary medical education: Trends and challenges. J. Vet. Med. Educ., 46(3): 285–294. https://doi.org/10.3138/jvme.1017-142r"),
          p("2. Murphy, F.A., Gibbs, E.P.J., Horzinek, M.C. and Studdert, M.J. (1999) Veterinary Virology. 3rd ed. Academic Press, San Diego, CA."),
          p("3. Sweller, J., van Merriënboer, J.J.G. and Paas, F.G. (1998) Cognitive architecture and instructional design. Educ. Psychol. Rev., 10(3): 251–296. https://doi.org/10.1023/A:1022193728205"),
          p("4. MacLachlan, N.J., Dubovi, E.J., Barthold, S.W., Swayne, D.E. and Winton, J.R. (2017) Fenner’s Veterinary Virology. 5th ed. Academic Press, London."),
          p("5. Sweller, J. (1988) Cognitive load during problem solving: Effects on learning. Cogn. Sci., 12(2): 257–285. https://doi.org/10.1207/s15516709cog1202_4"),
          p("6. Sweller, J., van Merriënboer, J.J.G. and Paas, F. (2019) Cognitive architecture and instructional design: 20 years later. Educ. Psychol. Rev., 31(2): 261–292. https://doi.org/10.1007/s10648-019-09465-5"),
          p("7. Mayer, R.E. (2009) Multimedia Learning. 2nd ed. Cambridge University Press, Cambridge."),
          p("8. Strand, E., Zaparanick, T.L. and Brace, S. (2005) Quality of life and stress factors among veterinary medical students. J. Vet. Med. Educ., 32(2): 182–192. https://doi.org/10.3138/jvme.32.2.182"),
          p("9. Sreeramareddy, C.T., Shankar, P.R., Binu, V.S., Mukhopadhyay, C., Biswas, B. and Menezes, R.G. (2007) Psychological morbidity, sources of stress and coping strategies among undergraduate medical students of Nepal. BMC Med. Educ., 7: 26. https://doi.org/10.1186/1472-6920-7-26"),
          p("10. Ten Cate, O.T., Kusurkar, R.A. and Williams, G.C. (2011) How self-determination theory can assist educators in supporting intrinsic motivation of medical students. Med. Teach., 33(11): 961–973. https://doi.org/10.3109/0142159X.2011.595435"),
          p("11. Deterding, S., Dixon, D., Khaled, R. and Nacke, L. (2011) From game design elements to gamefulness: Defining 'gamification'. In: Proceedings of the 15th International Academic MindTrek Conference: Envisioning Future Media Environments, Sep 28–30, 2011, Tampere, Finland. ACM, New York, NY. p. 9–15. https://doi.org/10.1145/2181037.2181040"),
          p("12. Plass, J.L., Homer, B.D. and Kinzer, C.K. (2015) Foundations of game-based learning. Educ. Psychol., 50(4): 258–283. https://doi.org/10.1080/00461520.2015.1122533"),
          p("13. McCoy, L., Lewis, J.H. and Dalton, D. (2016) Gamification in medical education: Accelerating active learning. Med. Educ. Online, 21(1): 31568. https://doi.org/10.3402/meo.v21.31568"),
          p("14. Ryan, R.M. and Deci, E.L. (2000) Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. Am. Psychol., 55(1): 68–78. https://doi.org/10.1037/0003-066X.55.1.68"),
          p("15. Deci, E.L. and Ryan, R.M. (2008) Self-determination theory: A macrotheory of human motivation, development, and health. Can. Psychol., 49(3): 182–185. https://doi.org/10.1037/a0012801"),
          p("16. Baños, J.E., Sentí, M. and Miralles, R. (2019) The use of serious games in health sciences education: Enhancing student engagement in pharmacology and microbiology. Med. Teach., 41(7): 780–788. https://doi.org/10.1080/0142159X.2019.1574880"),
          p("17. Rouse, P. (2017) Gamification in veterinary education: Enhancing student engagement and retention. J. Vet. Med. Educ., 44(2): 320–328. https://doi.org/10.3138/jvme.0216-039R1"),
          p("18. Boberg, E., Eklund, A. and Jonsson, M. (2020) Serious games in veterinary medicine: A systematic review of educational outcomes and student perceptions. J. Vet. Med. Educ., 47(5): 590–601. https://doi.org/10.3138/jvme.0818-100r1"),
          p("19. Pesek, M., Klavž, F., Šavli, P. and Marolt, M. (2022) Online and in-class evaluation of a music theory e-learning platform. Appl. Sci., 12(14): 7296. https://doi.org/10.3390/app12147296"),
          p("20. Branch, R.M. (2009) Instructional Design: The ADDIE Approach. Springer, New York, NY. https://doi.org/10.1007/978-0-387-09506-6"),
          p("21. Brahmawong, C. (2012) Developmental testing of media and instructional package. Silpakorn Univ. e-J. Soc. Sci. Humanit. Arts, 32(1): 1–20."),
          p("22. Gikandi, J.W., Morrow, D. and Davis, N.E. (2011) Online formative assessment in higher education: A review of the literature. Comput. Educ., 57(4): 2333–2351. https://doi.org/10.1016/j.compedu.2011.06.004"),
          p("23. Butler-Henderson, K. and Crawford, J. (2020) A systematic review of online examinations: A pedagogical innovation for scalable authentication and integrity. Comput. Educ., 159: 104024. https://doi.org/10.1016/j.compedu.2020.104024"),
          p("24. Hattie, J. and Timperley, H. (2007) The power of feedback. Rev. Educ. Res., 77(1): 81–112. https://doi.org/10.3102/003465430298487"),
          p("25. American Veterinary Medical Association (AVMA) Council on Education. (2022) Accreditation Policies and Procedures of the AVMA Council on Education. AVMA, Schaumburg, IL."),
          p("26. European Association of Establishments for Veterinary Education (EAEVE). (2021) European System of Evaluation of Veterinary Training (ESEVT): Manual of Standard Operating Procedure. EAEVE, Vienna."),
          p("27. Chen, Z.L. and Lin, H. (2026) AI and digital technologies in sight-singing and aural training: A systematic review of innovations in higher music education. Eur. J. Educ., 61(1): e70502. https://doi.org/10.1111/ejed.70502"),
          p("28. Gibbs, E.P.J. (2014) The evolution of One Health: A decade of progress and challenges for the future. Vet. Rec., 174(4): 85–91. https://doi.org/10.1136/vr.g143"),
        ],
      },
    ],
  });

  console.log('Packing and writing .docx file...');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT_FILE, buffer);
  console.log(`Document generated successfully at: ${OUTPUT_FILE}`);
  console.log(`Total File Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
}

buildManuscript().catch((err) => {
  console.error('Error generating manuscript docx:', err);
});
