/**
 * Veterinary Virology Master Content Bank (15 Chapters)
 * Extracted from faculty curriculum slides:
 * 01 & 02 Basic knowledge of Vet virology
 * 03 Parvoviridae & Adenoviridae
 * 04 Herpesviridae
 * 05 Poxviridae, Asfarviridae, Papillomaviridae
 * 06 Retroviridae
 * 07 Paramyxoviridae
 * 08 Orthomyxoviridae
 * 09 Coronaviridae
 * 10 Rhabdoviridae & Birnaviridae
 * 11 Togaviridae & Flaviviridae
 * 12 Reoviridae & Bunyaviridae
 * 13 Picornaviridae & Caliciviridae
 * 14 Arteriviridae & Circoviridae
 * 15 Other viruses & Prion
 */

export interface MasterQuestion {
  id: string;
  chapter: number;
  chapterTitle: string;
  virusName: string;
  virusType: string;
  q: string;
  choices: string[];
  answer: string;
  explanation: string;
}

export interface MatchingPair {
  id: string;
  chapter: number;
  virus: string;
  feature: string;
}

export interface LabCase {
  id: string;
  chapter: number;
  title: string;
  species: string;
  history: string;
  symptoms: string[];
  laboratoryResults: string;
  choices: string[];
  answer: string;
  explanation: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MASTER MULTIPLE CHOICE QUESTIONS (Across All 15 Chapters - 150+ Items)
// ─────────────────────────────────────────────────────────────────────────────
export const ALL_15_CHAPTER_QUESTIONS: MasterQuestion[] = [
  // ── CHAPTER 1: Basic knowledge of Vet virology Part 1 ──
  {
    id: "ch1_q1",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Viral Genome Rule",
    virusType: "default",
    q: "สารพันธุกรรมของอนุภาคไวรัสทั่วไปมีคุณสมบัติอย่างไร?",
    choices: [
      "มี DNA หรือ RNA เพียงชนิดใดชนิดหนึ่ง",
      "มีทั้ง DNA และ RNA อยู่ร่วมกันเสมอ",
      "มีเฉพาะ DNA สายคู่อย่างเดียวเท่านั้น",
      "ไม่มีสารพันธุกรรมแต่ประกอบด้วยโปรตีนล้วน",
    ],
    answer: "มี DNA หรือ RNA เพียงชนิดใดชนิดหนึ่ง",
    explanation: "ไวรัสประกอบด้วยจีโนมชนิด DNA หรือ RNA เพียงชนิดเดียวเท่านั้น ต่างจากสิ่งมีชีวิตอื่นที่มีทั้ง DNA และ RNA"
  },
  {
    id: "ch1_q2",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Capsid Structure",
    virusType: "default",
    q: "โครงสร้างเปลือกโปรตีนที่ทำหน้าที่หุ้มสารพันธุกรรมของไวรัสเรียกว่าอะไร?",
    choices: [
      "Capsid",
      "Envelope",
      "Peplomer",
      "Matrix protein",
    ],
    answer: "Capsid",
    explanation: "Capsid คือเปลือกหุ้มโปรตีนรอบจีโนมของไวรัส ทำหน้าที่ปกป้องสารพันธุกรรม"
  },
  {
    id: "ch1_q3",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Capsomers",
    virusType: "default",
    q: "หน่วยย่อยของโปรตีนที่มาเรียงต่อกันเป็นชั้น Capsid เรียกว่าอะไร?",
    choices: [
      "Capsomer",
      "Peptone",
      "Ribosome",
      "Prion",
    ],
    answer: "Capsomer",
    explanation: "Capsomer คือ Morphological subunit ของโปรตีนที่ประกอบรวมกันขึ้นเป็น Capsid"
  },
  {
    id: "ch1_q4",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Helical Symmetry",
    virusType: "default",
    q: "สมมาตรของไวรัสที่มีรูปร่างเป็นท่อเกลียวกระบอกยาวเรียกว่าอะไร?",
    choices: [
      "Helical symmetry",
      "Icosahedral symmetry",
      "Complex symmetry",
      "Binal symmetry",
    ],
    answer: "Helical symmetry",
    explanation: "Helical symmetry มีการเรียงตัวของ Capsomer เป็นวงเกลียวรอบสารพันธุกรรม เช่น Rabies virus"
  },
  {
    id: "ch1_q5",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Icosahedral Symmetry",
    virusType: "default",
    q: "สมมาตรของ Capsid ที่เป็นรูปทรงเหลี่ยม 20 หน้า ประกอบด้วยสามเหลี่ยมด้านเท่าคือแบบใด?",
    choices: [
      "Icosahedral symmetry",
      "Helical symmetry",
      "Radial symmetry",
      "Amorphous symmetry",
    ],
    answer: "Icosahedral symmetry",
    explanation: "Icosahedral symmetry มี 20 หน้า 12 มุม เป็นทรงสมมาตรที่พบบ่อยที่สุดในไวรัสสัตว์"
  },
  {
    id: "ch1_q6",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Envelope Composition",
    virusType: "default",
    q: "โครงสร้างใดพบได้เฉพาะใน Enveloped virus แต่ไม่พบใน Naked virus?",
    choices: [
      "Lipid bilayer envelope",
      "Protein capsid",
      "Nucleic acid core",
      "Capsomer subunits",
    ],
    answer: "Lipid bilayer envelope",
    explanation: "Enveloped virus มีชั้นไขมันและไกลโคโปรตีนหุ้มชั้นนอกที่ขโมยมาจากเยื่อหุ้มเซลล์ของโฮสต์"
  },
  {
    id: "ch1_q7",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Solvent Susceptibility",
    virusType: "default",
    q: "สารเคมีกลุ่มใดทำลายคุณสมบัติการติดเชื้อของ Enveloped virus ได้ดีที่สุด?",
    choices: [
      "Lipid solvents (แอลกอฮอล์, อีเทอร์)",
      "น้ำเกลือไอโซโทนิก",
      "ยาปฏิชีวนะกลุ่ม Penicillin",
      "น้ำตาลกลูโคสเข้มข้น",
    ],
    answer: "Lipid solvents (แอลกอฮอล์, อีเทอร์)",
    explanation: "เยื่อหุ้มไขมันของ Enveloped virus ไวต่อสารทำละลายไขมันและผงซักฟอกมาก ทำให้สูญเสียความสามารถในการติดเชื้อทันที"
  },
  {
    id: "ch1_q8",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Ribosome Absence",
    virusType: "default",
    q: "ออร์แกเนลล์ใดที่ไวรัสไม่มี ทำให้ไม่สามารถสร้างโปรตีนได้เองและต้องพึ่งพาเซลล์โฮสต์?",
    choices: [
      "Ribosome",
      "Nucleus",
      "Mitochondria",
      "Golgi apparatus",
    ],
    answer: "Ribosome",
    explanation: "ไวรัสไม่มีไรโบโซม จึงไม่สามารถแปลรหัสโปรตีนด้วยตัวเองได้ ต้องอาศัยไรโบโซมของเซลล์เจ้าบ้าน"
  },
  {
    id: "ch1_q9",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Virion Definition",
    virusType: "default",
    q: "อนุภาคของไวรัสที่ประกอบโครงสร้างเสร็จสมบูรณ์ภายนอกเซลล์เรียกว่าอะไร?",
    choices: [
      "Virion",
      "Viroid",
      "Prion",
      "Prophage",
    ],
    answer: "Virion",
    explanation: "Virion คือ Complete infectious virus particle ที่สมบูรณ์พร้อมติดเชื้อเข้าสู่เซลล์ใหม่"
  },
  {
    id: "ch1_q10",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "First Animal Virus Discovery",
    virusType: "default",
    q: "ไวรัสก่อโรคในสัตว์ชนิดแรกที่ถูกค้นพบว่าสามารถผ่านเยื่อกรองแบคทีเรียได้คือไวรัสใด?",
    choices: [
      "Foot and mouth disease virus",
      "Rabies virus",
      "Canine Distemper virus",
      "Rinderpest virus",
    ],
    answer: "Foot and mouth disease virus",
    explanation: "Loeffler และ Frosch ค้นพบ Foot and mouth disease virus ในปี 1898 นับเป็นไวรัสสัตว์ชนิดแรกที่ถูกค้นพบ"
  },
  // ── CHAPTER 2: Basic knowledge of Vet virology Part 2 ──
  {
    id: "ch2_q1",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Viral Attachment",
    virusType: "default",
    q: "ขั้นตอนแรกสุดในวงจรการเพิ่มจำนวนของไวรัสเมื่อเข้าสู่เซลล์โฮสต์คือข้อใด?",
    choices: [
      "Attachment (Adsorption)",
      "Penetration",
      "Uncoating",
      "Biosynthesis",
    ],
    answer: "Attachment (Adsorption)",
    explanation: "Attachment คือการที่โปรตีนผิวของไวรัสเข้าจับอย่างจำเพาะกับ Receptor บนผิวเซลล์โฮสต์"
  },
  {
    id: "ch2_q2",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Viral Uncoating",
    virusType: "default",
    q: "กระบวนการที่ไวรัสสลัดเปลือกโปรตีน Capsid เพื่อปล่อยสารพันธุกรรมเข้าสู่เซลล์เรียกว่าอะไร?",
    choices: [
      "Uncoating",
      "Assembly",
      "Budding",
      "Lysis",
    ],
    answer: "Uncoating",
    explanation: "Uncoating เป็นการแยกสลาย Capsid ออกเพื่อให้จีโนมของไวรัสทำหน้าที่ถ่ายทอดรหัสพันธุกรรมในเซลล์"
  },
  {
    id: "ch2_q3",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Viral Release Budding",
    virusType: "default",
    q: "ไวรัสที่มีเยื่อหุ้ม (Enveloped virus) มักออกจากเซลล์โฮสต์ด้วยกลไกใด?",
    choices: [
      "Budding (การแตกหน่อ)",
      "Cell lysis (เซลล์แตกกระจาย)",
      "Exocytosis ผ่านทาง Vacuole เท่านั้น",
      "การแทรกตัวผ่าน Gap junction",
    ],
    answer: "Budding (การแตกหน่อ)",
    explanation: "Enveloped virus มักออกจากเซลล์ด้วยกระบวนการ Budding โดยห่อหุ้ม Membrane ของเซลล์โฮสต์ออกมาด้วย"
  },
  {
    id: "ch2_q4",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Syncytia Formation",
    virusType: "default",
    q: "การรวมตัวของเซลล์ข้างเคียงจนเกิดเป็นเซลล์ยักษ์หลายนิวเคลียส (Syncytia) เกิดจากโปรตีนใด?",
    choices: [
      "Fusion protein",
      "Matrix protein",
      "Reverse transcriptase",
      "Integrase enzyme",
    ],
    answer: "Fusion protein",
    explanation: "Fusion protein ช่วยหลอมเยื่อหุ้มเซลล์ข้างเคียงเข้าด้วยกัน ทำให้เกิด Multinucleated giant cell (Syncytia)"
  },
  {
    id: "ch2_q5",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Cytopathic Effect",
    virusType: "default",
    q: "การเปลี่ยนแปลงทางสัณฐานวิทยาและความเสียหายของเซลล์เพาะเลี้ยงจากการติดเชื้อไวรัสเรียกว่าอะไร?",
    choices: [
      "Cytopathic effect (CPE)",
      "Cell transformation",
      "Immune tolerance",
      "Phagocytosis",
    ],
    answer: "Cytopathic effect (CPE)",
    explanation: "CPE คือความผิดปกติทางรูปร่างของเซลล์ เช่น เซลล์กลม ลอยตัว หรือแตกสลาย ที่เกิดจากการเพิ่มจำนวนของไวรัส"
  },
  {
    id: "ch2_q6",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Negri Bodies Localization",
    virusType: "default",
    q: "Negri bodies ที่พบในเซลล์ประสาทของสัตว์ป่วยโรคพิษสุนัขบ้า จัดเป็น Inclusion body แบบใด?",
    choices: [
      "Intracytoplasmic inclusion",
      "Intranuclear inclusion",
      "Peroxisomal body",
      "Extracellular plaque",
    ],
    answer: "Intracytoplasmic inclusion",
    explanation: "Negri bodies เป็น Intracytoplasmic inclusion body ที่พบสะสมอยู่ในไซโทพลาสซึมของเซลล์ประสาท"
  },
  {
    id: "ch2_q7",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Cowdry Type A Inclusions",
    virusType: "default",
    q: "Cowdry type A inclusion body ที่พบในเซลล์ติดเชื้อ Herpesvirus เกิดขึ้นที่บริเวณใดของเซลล์?",
    choices: [
      "นิวเคลียส (Intranuclear)",
      "ไซโทพลาสซึม (Intracytoplasmic)",
      "ภายในไมโทคอนเดรีย",
      "บนผิวเยื่อหุ้มเซลล์ชั้นนอก",
    ],
    answer: "นิวเคลียส (Intranuclear)",
    explanation: "Cowdry type A inclusions เป็น Eosinophilic intranuclear inclusion bodies ที่จำเพาะต่อ Herpesvirus"
  },
  {
    id: "ch2_q8",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Mucosal Immunity Antibody",
    virusType: "default",
    q: "แอนติบอดีชนิดใดมีบทบาทเด่นที่สุดในการดักจับและทำลายไวรัสบริเวณเยื่อเมือกของร่างกาย?",
    choices: [
      "Secretory IgA",
      "IgE",
      "IgD",
      "IgM",
    ],
    answer: "Secretory IgA",
    explanation: "sIgA ทำหน้าที่หลักในการป้องกันเยื่อเมือกทางเดินหายใจและทางเดินอาหารจากการติดเชื้อไวรัส"
  },
  {
    id: "ch2_q9",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Cellular Immunity Killer",
    virusType: "default",
    q: "เซลล์เม็ดเลือดขาวชนิดใดมีบทบาทหลักในการเข้าทำลายเซลล์โฮสต์ที่ติดเชื้อไวรัสแบบจำเพาะเจาะจง?",
    choices: [
      "CD8+ Cytotoxic T cell (CTL)",
      "B lymphocyte",
      "Neutrophil",
      "Eosinophil",
    ],
    answer: "CD8+ Cytotoxic T cell (CTL)",
    explanation: "CD8+ CTL จดจำแอนติเจนไวรัสคู่กับ MHC-I และหลั่ง Perforin/Granzyme ทำลายเซลล์ที่ติดเชื้อไวรัส"
  },
  {
    id: "ch2_q10",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Pattern Recognition Receptor",
    virusType: "default",
    q: "ตัวรับสัญญาณภูมิคุ้มกันแต่กำเนิด (PRR) ที่ทำหน้าที่ตรวจจับกรดนิวคลีอิกของไวรัสคือข้อใด?",
    choices: [
      "Toll-like receptors (TLRs)",
      "G-protein coupled receptors",
      "Insulin receptors",
      "Acetylcholine receptors",
    ],
    answer: "Toll-like receptors (TLRs)",
    explanation: "TLRs เช่น TLR-3, TLR-7, TLR-9 ทำหน้าที่ตรวจจับ viral RNA และ DNA เพื่อกระตุ้นการสร้าง Interferon"
  },
  // ── CHAPTER 3: Parvoviridae and Adenoviridae ──
  {
    id: "ch3_q1",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "Parvovirus Genome",
    virusType: "parvo",
    q: "สารพันธุกรรมของไวรัสในตระกูล Parvoviridae มีลักษณะอย่างไร?",
    choices: [
      "Single-stranded DNA (ssDNA)",
      "Double-stranded DNA (dsDNA)",
      "Positive-sense ssRNA",
      "Segmented dsRNA",
    ],
    answer: "Single-stranded DNA (ssDNA)",
    explanation: "Parvovirus มีจีโนมเป็น ssDNA สายเดี่ยวขนาดเล็ก ไม่มี Envelope และทนทานต่อสิ่งแวดล้อมสูงมาก"
  },
  {
    id: "ch3_q2",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "Parvovirus Target Cells",
    virusType: "parvo",
    q: "ไวรัส Parvovirus ต้องการเซลล์โฮสต์ที่มีคุณสมบัติใดเป็นพิเศษในการเพิ่มจำนวน?",
    choices: [
      "เซลล์ที่มีการแบ่งตัวอย่างรวดเร็ว (S-phase)",
      "เซลล์ประสาทที่หยุดการแบ่งตัวแล้ว",
      "เซลล์เม็ดเลือดแดงแก่ที่ไม่มีนิวเคลียส",
      "เซลล์ไขมันสะสมใต้ผิวหนัง",
    ],
    answer: "เซลล์ที่มีการแบ่งตัวอย่างรวดเร็ว (S-phase)",
    explanation: "Parvovirus ไม่มีเอนไซม์ DNA polymerase ของตัวเอง จึงต้องอาศัยกลไกการแบ่งตัวของเซลล์โฮสต์ในระยะ S-phase"
  },
  {
    id: "ch3_q3",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "Canine Parvovirus Symptoms",
    virusType: "parvo",
    q: "อาการเด่นทางคลินิกของลูกสุนัขที่ติดเชื้อ Canine Parvovirus-2 (CPV-2) คือข้อใด?",
    choices: [
      "ถ่ายเหลวมีเลือดปนและเม็ดเลือดขาวต่ำ",
      "มีตุ่มหนองกระจายตามผิวหนัง",
      "ไอแห้งเรื้อรังและขาหลังกระตุก",
      "ดีซ่านและปัสสาวะมีสีแดงเข้ม",
    ],
    answer: "ถ่ายเหลวมีเลือดปนและเม็ดเลือดขาวต่ำ",
    explanation: "CPV-2 ทำลายเซลล์เยื่อบุ Intestinal crypts และเซลล์ต้นกำเนิดเม็ดเลือดในไขกระดูก ทำให้เกิด Bloody diarrhea ร่วมกับ Panleukopenia"
  },
  {
    id: "ch3_q4",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "Feline Panleukopenia Congenital Defect",
    virusType: "parvo",
    q: "แม่แมวติดเชื้อ FPV ช่วงตั้งท้องระยะท้าย ลูกแมวที่คลอดออกมามักพบความผิดปกติแต่กำเนิดข้อใด?",
    choices: [
      "สมองน้อยฝ่อลีบ (Cerebellar hypoplasia)",
      "หัวบาตรมีน้ำในกะโหลกศีรษะ",
      "กระดูกสันหลังคดและข้อแข็งเกร็ง",
      "ผนังกั้นห้องหัวใจรั่วแต่กำเนิด",
    ],
    answer: "สมองน้อยฝ่อลีบ (Cerebellar hypoplasia)",
    explanation: "เชื้อ FPV ทำลายเซลล์ Purkinje ของสมองน้อยที่กำลังแบ่งตัว ทำให้ลูกแมวมีภาวะเดินเซ สั่น (Ataxia)"
  },
  {
    id: "ch3_q5",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "Porcine Parvovirus SMEDI",
    virusType: "parvo",
    q: "กลุ่มอาการ SMEDI ในแม่สุกร (ตายคลอด มัมมี่ ผสมไม่ติด) สัมพันธ์กับไวรัสใด?",
    choices: [
      "Porcine Parvovirus (PPV)",
      "Porcine Circovirus-2 (PCV-2)",
      "Swine Influenza Virus",
      "Pseudorabies virus",
    ],
    answer: "Porcine Parvovirus (PPV)",
    explanation: "PPV ก่อให้เกิดภาวะผสมไม่ติด ลูกมัมมี่ ตายแรกคลอด และการแท้งในแม่สุกรสาว (SMEDI syndrome)"
  },
  {
    id: "ch3_q6",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "Adenovirus Genome",
    virusType: "default",
    q: "สารพันธุกรรมของไวรัสในตระกูล Adenoviridae คือข้อใด?",
    choices: [
      "Double-stranded DNA (dsDNA)",
      "Single-stranded DNA (ssDNA)",
      "Single-stranded RNA (ssRNA)",
      "Circular dsRNA",
    ],
    answer: "Double-stranded DNA (dsDNA)",
    explanation: "Adenovirus มีสารพันธุกรรมเป็น dsDNA สายคู่แบบเส้นตรง และไม่มีเยื่อหุ้ม (Naked virus)"
  },
  {
    id: "ch3_q7",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "Adenovirus Fiber Projection",
    virusType: "default",
    q: "โครงสร้างรูปเสาหนามที่ยื่นออกมาจากมุมยอดทั้ง 12 มุมของ Capsid ใน Adenovirus เรียกว่าอะไร?",
    choices: [
      "Fibers with knob",
      "Peplomers",
      "Tegument",
      "Matrix pins",
    ],
    answer: "Fibers with knob",
    explanation: "Fiber projections ยื่นออกมาจาก Penton base ทำหน้าที่จับกับ Receptor และทำปฏิกิริยา Hemagglutination"
  },
  {
    id: "ch3_q8",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "Blue Eye Pathogenesis",
    virusType: "default",
    q: "อาการ 'Blue eye' (กระจกตาบวมขุ่นสีฟ้า) ในสุนัขติดเชื้อ CAV-1 เกิดจากสาเหตุใด?",
    choices: [
      "Immune complex ตกตะกอนที่กระจกตา",
      "เชื้อไวรัสทำลายเลนส์ตาโดยตรง",
      "ความดันตาสูงขึ้นเป็นต้อหินเฉียบพลัน",
      "ภาวะขาดวิตามินเออย่างรุนแรง",
    ],
    answer: "Immune complex ตกตะกอนที่กระจกตา",
    explanation: "Blue eye เกิดจาก Type III hypersensitivity (Antigen-Antibody complexes) ตกตะกอนที่ Corneal endothelium"
  },
  {
    id: "ch3_q9",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "CAV-2 Vaccine Advantage",
    virusType: "default",
    q: "เหตุใดวัคซีนรวมในสุนัขจึงนิยมใช้สายพันธุ์ CAV-2 แทน CAV-1?",
    choices: [
      "ป้องกันข้ามสายพันธุ์ได้และไม่ทำให้เกิด Blue eye",
      "CAV-1 ผลิตในเซลล์เพาะเลี้ยงไม่ได้",
      "CAV-2 เป็นเชื้อไวรัสที่มีเยื่อหุ้มหนากว่า",
      "CAV-2 ป้องกันโรคตับอักเสบได้ดีกว่า 10 เท่า",
    ],
    answer: "ป้องกันข้ามสายพันธุ์ได้และไม่ทำให้เกิด Blue eye",
    explanation: "CAV-2 กระตุ้นภูมิคุ้มกันข้ามสายพันธุ์ป้องกัน Infectious Canine Hepatitis (CAV-1) ได้โดยปลอดภัยและไม่ก่อให้เกิด Corneal edema"
  },
  {
    id: "ch3_q10",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "CAV-2 Disease Site",
    virusType: "default",
    q: "Canine Adenovirus type 2 (CAV-2) ก่อให้เกิดรอยโรคหลักในระบบใดของสุนัข?",
    choices: [
      "ระบบทางเดินหายใจ (Laryngotracheitis / Kennel cough)",
      "ระบบทางเดินอาหารและตับอักเสบรุนแรง",
      "ระบบประสาทส่วนกลางและไขสันหลัง",
      "ระบบสืบพันธุ์และทางเดินปัสสาวะ",
    ],
    answer: "ระบบทางเดินหายใจ (Laryngotracheitis / Kennel cough)",
    explanation: "CAV-2 มีความจำเพาะต่อเซลล์เยื่อบุทางเดินหายใจ และเป็นสาเหตุหนึ่งของกลุ่มอาการ Kennel cough"
  },
  // ── CHAPTER 4: Herpesviridae ──
  {
    id: "ch4_q1",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Tegument Layer",
    virusType: "herpes",
    q: "ชั้นโปรตีนอสัณฐานที่แทรกอยู่ระหว่าง Capsid และ Envelope ของ Herpesvirus เรียกว่าอะไร?",
    choices: [
      "Tegument",
      "Matrix shell",
      "Peplomer core",
      "Capsomer bed",
    ],
    answer: "Tegument",
    explanation: "Tegument เป็นชั้นโปรตีนเฉพาะตัวของ Herpesvirus บรรจุโปรตีนช่วยในการเริ่มขบวนการเพิ่มจำนวนของไวรัส"
  },
  {
    id: "ch4_q2",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Herpes Latency",
    virusType: "herpes",
    q: "คุณสมบัติเด่นของไวรัสในตระกูล Herpesviridae หลังการติดเชื้อครั้งแรกคือข้อใด?",
    choices: [
      "แฝงตัวอยู่ในร่างกายได้ตลอดชีวิต (Latency)",
      "สลายตัวและหายขาดจากร่างกายใน 48 ชั่วโมง",
      "ไม่สามารถกระตุ้นการสร้างแอนติบอดีได้",
      "เปลี่ยนจีโนมจาก DNA เป็น RNA ถาวร",
    ],
    answer: "แฝงตัวอยู่ในร่างกายได้ตลอดชีวิต (Latency)",
    explanation: "Herpesvirus จะคงอยู่ในเซลล์ประสาทหรือเซลล์เม็ดเลือดขาวแบบ Latent infection และกำเริบขึ้นใหม่เมื่อภูมิคุ้มกันตก"
  },
  {
    id: "ch4_q3",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Pseudorabies Natural Host",
    virusType: "herpes",
    q: "โฮสต์ตามธรรมชาติและแหล่งกักเก็บโรคของไวรัส Pseudorabies (Aujeszky's disease) คือสัตว์ชนิดใด?",
    choices: [
      "สุกร (Swine)",
      "โค (Cattle)",
      "ม้า (Horse)",
      "สุนัข (Dog)",
    ],
    answer: "สุกร (Swine)",
    explanation: "สุกรเป็นโฮสต์ตามธรรมชาติเพียงชนิดเดียวของ Pseudorabies virus และสามารถแพร่เชื้อสู่สัตว์ชนิดอื่นได้"
  },
  {
    id: "ch4_q4",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Mad Itch Syndrome",
    virusType: "herpes",
    q: "สัตว์เคี้ยวเอื้องหรือสุนัขที่ติดเชื้อ Pseudorabies มักแสดงอาการเด่นชัดข้อใด?",
    choices: [
      "คันอย่างรุนแรงจนกัดแทะเนื้อตัวเอง (Mad itch)",
      "ท้องมานน้ำและมีดีซ่าน",
      "ขนร่วงทั้งตัวแต่ไม่มีอาการคัน",
      "ตาบอดสีฟ้าแบบเฉียบพลัน",
    ],
    answer: "คันอย่างรุนแรงจนกัดแทะเนื้อตัวเอง (Mad itch)",
    explanation: "ในสัตว์ที่ไม่ใช่สุกร ไวรัสนี้ทำให้เกิด Intense pruritus (Mad itch) มีพฤติกรรมเกาและกัดบริเวณที่คันจนตายในเวลาสั้น"
  },
  {
    id: "ch4_q5",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Bovine Herpesvirus-1 Disease",
    virusType: "herpes",
    q: "โรค Infectious Bovine Rhinotracheitis (IBR) ในโคมีสาเหตุจากไวรัสกลุ่มใด?",
    choices: [
      "Bovine Herpesvirus-1 (BHV-1)",
      "Bovine Parvovirus",
      "Bovine Coronavirus",
      "Bovine Adenovirus",
    ],
    answer: "Bovine Herpesvirus-1 (BHV-1)",
    explanation: "BHV-1 ก่อโรคทางเดินหายใจอักเสบ (IBR), เยื่อบุตาอักเสบ, โรคระบบสืบพันธุ์ (IPVI) และการแท้งลูกในโค"
  },
  {
    id: "ch4_q6",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Equine Herpesvirus-1 Signs",
    virusType: "herpes",
    q: "ไวรัส Equine Herpesvirus-1 (EHV-1) ก่อให้เกิดความเสียหายรุนแรงในม้าเรื่องใด?",
    choices: [
      "การแท้งลูกและการเป็นอัมพาตทางระบบประสาท",
      "ท้องเสียถ่ายเหลวเป็นมูกเลือด",
      "การเกิดเนื้องอกที่ผิวหนังทั่วตัว",
      "ภาวะโลหิตจางจากเม็ดเลือดแดงแตก",
    ],
    answer: "การแท้งลูกและการเป็นอัมพาตทางระบบประสาท",
    explanation: "EHV-1 ก่อโรคทางเดินหายใจ แท้งลูกแบบพายุ (Abortion storms) และโรคทางระบบประสาท (EHM)"
  },
  {
    id: "ch4_q7",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Feline Herpesvirus Cornea Ulcer",
    virusType: "herpes",
    q: "รอยโรคแผลที่กระจกตาลักษณะเป็นกิ่งก้าน (Dendritic ulcer) ในแมวเกิดจากไวรัสใด?",
    choices: [
      "Feline Herpesvirus-1 (FHV-1)",
      "Feline Calicivirus (FCV)",
      "Feline Coronavirus (FCoV)",
      "Feline Leukemia Virus (FeLV)",
    ],
    answer: "Feline Herpesvirus-1 (FHV-1)",
    explanation: "Dendritic corneal ulcer เป็นรอยโรคเฉพาะตัว (Pathognomonic lesion) ของการติดเชื้อ FHV-1 ในแมว"
  },
  {
    id: "ch4_q8",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Canine Herpesvirus Hypothermia",
    virusType: "herpes",
    q: "ลูกสุนัขแรกเกิดที่ติดเชื้อ CHV-1 มักป่วยและตายเฉียบพลันเมื่อเผชิญสภาวะใด?",
    choices: [
      "อุณหภูมิร่างกายต่ำกว่าปกติ (Hypothermia)",
      "อากาศร้อนจัดและความชื้นสูง",
      "การได้รับนมแม่มากเกินไป",
      "การสัมผัสกับแสงแดดโดยตรง",
    ],
    answer: "อุณหภูมิร่างกายต่ำกว่าปกติ (Hypothermia)",
    explanation: "CHV-1 เจริญได้ดีที่สุดที่อุณหภูมิ 33-35 °C ลูกสุนัขที่ตัวเย็นจึงเกิดการแพร่กระจายของเชื้อไปทั่วอวัยวะและตายอย่างรวดเร็ว"
  },
  {
    id: "ch4_q9",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Marek's Disease Pathology",
    virusType: "herpes",
    q: "โรค Marek's disease ในไก่เกิดจากไวรัสในกลุ่มใด และทำให้เกิดพยาธิสภาพเด่นข้อใด?",
    choices: [
      "Gammaherpesvirus ทำให้เส้นประสาทบวมโตและขาเป็นอัมพาต",
      "Poxvirus ทำให้เกิดตุ่มแผลที่โคนปีก",
      "Birnavirus ทำให้ถุงเบอร์ซาฝ่อลีบ",
      "Retrovirus ทำให้โลหิตจางรุนแรง",
    ],
    answer: "Gammaherpesvirus ทำให้เส้นประสาทบวมโตและขาเป็นอัมพาต",
    explanation: "MDV เป็น Oncogenic Alphaherpesvirus (เดิมจัดเป็น Gamma) ที่ทำให้เกิด T-cell lymphoma บวมโตที่เส้นประสาท Sciatic จนขาเป็นอัมพาต"
  },
  {
    id: "ch4_q10",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Herpes Inclusion Bodies",
    virusType: "herpes",
    q: "Inclusion body ที่ตรวจพบในเซลล์ติดเชื้อ Herpesvirus มีลักษณะอย่างไร?",
    choices: [
      "Intranuclear inclusion body (Cowdry type A)",
      "Intracytoplasmic Negri body",
      "Intracytoplasmic Guarnieri body",
      "Extracellular Botryoid body",
    ],
    answer: "Intranuclear inclusion body (Cowdry type A)",
    explanation: "Herpesvirus เพิ่มจำนวนในนิวเคลียสและสร้าง Cowdry type A eosinophilic intranuclear inclusion bodies"
  },
  // ── CHAPTER 5: Pox, Asfar, Papilloma, Polyoma and Iridoviridae ──
  {
    id: "ch5_q1",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "Poxvirus Replication Site",
    virusType: "pox",
    q: "ไวรัสในตระกูล Poxviridae มีความแปลกพิเศษกว่า DNA virus ทั่วไปตรงข้อใด?",
    choices: [
      "เพิ่มจำนวนภายในไซโทพลาสซึมของเซลล์",
      "มีสารพันธุกรรมเป็น RNA สายเดี่ยว",
      "ไม่มีโปรตีน Capsid หุ้มจีโนม",
      "ไม่สามารถทนต่อสารฆ่าเชื้อได้เลย",
    ],
    answer: "เพิ่มจำนวนภายในไซโทพลาสซึมของเซลล์",
    explanation: "Poxvirus มีขนาดใหญ่และมีเอนไซม์สำหรับจำลองพันธุกรรมครบ จึงสามารถ Replicate ได้เองในไซโทพลาสซึม"
  },
  {
    id: "ch5_q2",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "Fowlpox Inclusion Bodies",
    virusType: "pox",
    q: "Inclusion bodies ในไซโทพลาสซึมของเซลล์ที่ติดเชื้อ Fowlpox virus เรียกว่าอะไร?",
    choices: [
      "Bollinger bodies",
      "Negri bodies",
      "Cowdry type B",
      "Aschoff bodies",
    ],
    answer: "Bollinger bodies",
    explanation: "Bollinger bodies เป็น Intracytoplasmic inclusion bodies ขนาดใหญ่ที่ตรวจพบใน Fowlpox"
  },
  {
    id: "ch5_q3",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "Lumpy Skin Disease Family",
    virusType: "pox",
    q: "โรค Lumpy skin disease (LSD) ในโคที่ทำให้เกิดตุ่มนูนแข็งทั่วตัวเกิดจากไวรัสตระกูลใด?",
    choices: [
      "Poxviridae (Genus Capripoxvirus)",
      "Herpesviridae",
      "Papillomaviridae",
      "Flaviviridae",
    ],
    answer: "Poxviridae (Genus Capripoxvirus)",
    explanation: "LSDV จัดอยู่ในจีนัส Capripoxvirus ตระกูล Poxviridae ก่อโรครอยโรคตุ่มนูนที่ผิวหนังโค"
  },
  {
    id: "ch5_q4",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "Orf Zoonosis",
    virusType: "pox",
    q: "โรค Orf (Contagious pustular dermatitis) ในแกะและแพะมีความสำคัญอย่างไร?",
    choices: [
      "เป็นโรคติดต่อจากสัตว์สู่คนได้ (Zoonosis)",
      "เป็นโรคที่กวาดล้างหมดไปจากโลกแล้ว",
      "ทำให้เกิดการแท้งลูกในแม่ม้าเท่านั้น",
      "รักษาหายได้ด้วยยาปฏิชีวนะฆ่าเชื้อรา",
    ],
    answer: "เป็นโรคติดต่อจากสัตว์สู่คนได้ (Zoonosis)",
    explanation: "Orf virus (Parapoxvirus) ทำให้เกิดตุ่มแผลพุพองที่ริมฝีปากแพะแกะ และติดต่อสู่คนเลี้ยงสัตว์ได้"
  },
  {
    id: "ch5_q5",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "ASFV Soft Tick Vector",
    virusType: "default",
    q: "พาหะนำโรคตามธรรมชาติของไวรัสอหิวาต์แอฟริกาในสุกร (ASFV) คือสัตว์ข้อใด?",
    choices: [
      "เห็บอ่อน (Soft tick สกุล Ornithodoros)",
      "ยุงลาย (Aedes aegypti)",
      "เห็บแข็งสุนัข (Rhipicephalus)",
      "ริ้นดำดูดเลือด (Simulium)",
    ],
    answer: "เห็บอ่อน (Soft tick สกุล Ornithodoros)",
    explanation: "ASFV ถ่ายทอดตามธรรมชาติโดยเห็บอ่อน Ornithodoros spp. ซึ่งเป็นทั้งพาหะและ Reservoir"
  },
  {
    id: "ch5_q6",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "ASFV Gross Pathology",
    virusType: "default",
    q: "รอยโรคทางพยาธิสภาพที่เด่นชัดที่สุดในสุกรที่ตายจากโรค African Swine Fever คือข้อใด?",
    choices: [
      "ม้ามขยายใหญ่สีดำคล้ำและจุดเลือดออกรุนแรง",
      "ตับแข็งฝ่อลีบและมีสีเหลืองซีด",
      "ลำไส้ใหญ่เกิดแผลหลุมรูปกระดุม",
      "สมองน้อยฝ่อและมีน้ำคั่ง",
    ],
    answer: "ม้ามขยายใหญ่สีดำคล้ำและจุดเลือดออกรุนแรง",
    explanation: "ASFV ทำลายระบบหลอดเลือดและเซลล์เยื่อบุ ทำให้เกิด Severe splenomegaly (ม้ามโตดำคล้ำ) และเลือดออกทั่วตัว"
  },
  {
    id: "ch5_q7",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "ASFV Viral Nature",
    virusType: "default",
    q: "African Swine Fever Virus (ASFV) จัดเป็นไวรัสชนิดใด?",
    choices: [
      "Enveloped dsDNA virus",
      "Naked (+)ssRNA virus",
      "Segmented (-)ssRNA virus",
      "Circular ssDNA virus",
    ],
    answer: "Enveloped dsDNA virus",
    explanation: "ASFV เป็นไวรัส dsDNA ขนาดใหญ่ มีเยื่อหุ้ม และเป็นไวรัสเพียงชนิดเดียวในตระกูล Asfarviridae"
  },
  {
    id: "ch5_q8",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "Papillomavirus Lesions",
    virusType: "default",
    q: "โรคหูด (Warts / Papilloma) ในสัตว์เลี้ยงและปศุสัตว์เกิดจากไวรัสตระกูลใด?",
    choices: [
      "Papillomaviridae",
      "Parvoviridae",
      "Retroviridae",
      "Coronaviridae",
    ],
    answer: "Papillomaviridae",
    explanation: "Papillomaviridae เป็น Naked circular dsDNA virus ก่อให้เกิดเนื้องอกไม่ร้ายแรงชนิดหูดบนผิวหนังและเยื่อเมือก"
  },
  {
    id: "ch5_q9",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "Bracken Fern Bladder Cancer",
    virusType: "default",
    q: "โคที่กินต้นกูด (Bracken fern) ร่วมกับติดเชื้อ Bovine Papillomavirus-2 มักเกิดมะเร็งที่อวัยวะใด?",
    choices: [
      "กระเพาะปัสสาวะ (Enzootic hematuria)",
      "ตับและถุงน้ำดี",
      "ปอดและหลอดลมส่วนปลาย",
      "ม้ามและต่อมน้ำเหลือง",
    ],
    answer: "กระเพาะปัสสาวะ (Enzootic hematuria)",
    explanation: "สาร Ptaquiloside ในต้นกูดทำปฏิกิริยาร่วมกับ BPV-2 เหนี่ยวนำให้เกิดมะเร็งกระเพาะปัสสาวะในโค"
  },
  {
    id: "ch5_q10",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "Iridovirus Targets",
    virusType: "default",
    q: "ไวรัสในตระกูล Iridoviridae เช่น Ranavirus ก่อโรครุนแรงในสัตว์กลุ่มใดเป็นหลัก?",
    choices: [
      "สัตว์สะเทินน้ำสะเทินบก สัตว์เลื้อยคลาน และปลา",
      "นกป่าและสัตว์ปีกเศรษฐกิจ",
      "สัตว์เคี้ยวเอื้องขนาดเล็ก",
      "ม้าและสัตว์ตระกูลม้า",
    ],
    answer: "สัตว์สะเทินน้ำสะเทินบก สัตว์เลื้อยคลาน และปลา",
    explanation: "Ranavirus ในตระกูล Iridoviridae เป็นเชื้อก่อโรคระบาดรุนแรงในกบ ซาลาแมนเดอร์ และสัตว์น้ำ"
  },
  // ── CHAPTER 6: Retroviridae ──
  {
    id: "ch6_q1",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "Reverse Transcriptase Role",
    virusType: "retro",
    q: "เอนไซม์จำเพาะของ Retrovirus ที่ใช้สังเคราะห์ DNA จากแม่แบบ RNA คือข้อใด?",
    choices: [
      "Reverse Transcriptase (RdDp)",
      "DNA-dependent RNA polymerase",
      "RNA Replicase",
      "DNA Ligase",
    ],
    answer: "Reverse Transcriptase (RdDp)",
    explanation: "Reverse Transcriptase สร้าง cDNA สายเดี่ยวจาก RNA แม่แบบ จากนั้นสังเคราะห์เป็น dsDNA เข้าสู่นิวเคลียส"
  },
  {
    id: "ch6_q2",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "Retrovirus Diploid Genome",
    virusType: "retro",
    q: "สารพันธุกรรมของไวรัสในตระกูล Retroviridae มีลักษณะจำเพาะอย่างไร?",
    choices: [
      "(+)ssRNA จำนวน 2 โมเลกุลเหมือนกัน (Diploid)",
      "dsDNA วงกลมแบบพลาสมิด",
      "(-)ssRNA สายเดี่ยวท่อนเดียว",
      "dsRNA แบ่งเป็น 10 ชิ้นส่วน",
    ],
    answer: "(+)ssRNA จำนวน 2 โมเลกุลเหมือนกัน (Diploid)",
    explanation: "Retrovirus เป็นไวรัสเพียงกลุ่มเดียวที่มีสารพันธุกรรมเป็น Diploid ((+)ssRNA 2 สายที่เหมือนกัน)"
  },
  {
    id: "ch6_q3",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "Gag Gene Function",
    virusType: "retro",
    q: "ยีน 'gag' ในโครงสร้างจีโนมของ Retrovirus ทำหน้าที่รหัสสร้างโปรตีนส่วนใด?",
    choices: [
      "โปรตีนโครงสร้างแกนกลางและ Capsid",
      "เอนไซม์ Reverse Transcriptase",
      "ไกลโคโปรตีนหนามบนผิว Envelope",
      "เอนไซม์ Integrase สำหรับแทรกยีน",
    ],
    answer: "โปรตีนโครงสร้างแกนกลางและ Capsid",
    explanation: "ยีน gag (Group-specific antigen) สังเคราะห์โปรตีนโครงสร้างภายใน ได้แก่ Matrix, Capsid และ Nucleoprotein"
  },
  {
    id: "ch6_q4",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "Env Gene Function",
    virusType: "retro",
    q: "ยีน 'env' ในจีโนมของ Retrovirus ทำหน้าที่กำหนดรหัสสร้างโครงสร้างใด?",
    choices: [
      "Spike glycoprotein ของ Envelope",
      "Capsomer ของชั้นโปรตีนหุ้มแกน",
      "เอนไซม์ Protease ของอนุภาค",
      "โปรตีนแทรกดีเอ็นเอโฮสต์",
    ],
    answer: "Spike glycoprotein ของ Envelope",
    explanation: "ยีน env รหัสสร้าง Envelope glycoproteins (เช่น Surface gp120 และ Transmembrane gp41) ที่ใช้จับ receptor"
  },
  {
    id: "ch6_q5",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "FeLV Disease Signs",
    virusType: "retro",
    q: "มะเร็งต่อมน้ำเหลืองและภาวะโลหิตจางรุนแรงในแมว สัมพันธ์กับไวรัสกลุ่มใดมากที่สุด?",
    choices: [
      "Feline Leukemia Virus (FeLV)",
      "Feline Parvovirus (FPV)",
      "Feline Coronavirus (FCoV)",
      "Feline Calicivirus (FCV)",
    ],
    answer: "Feline Leukemia Virus (FeLV)",
    explanation: "FeLV เป็น Gammaretrovirus ที่ก่อเนื้องอกมะเร็งเม็ดเลือดขาว มะเร็งต่อมน้ำเหลือง และภาวะกดไขกระดูกในแมว"
  },
  {
    id: "ch6_q6",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "FIV Genus",
    virusType: "retro",
    q: "ไวรัสเอดส์แมว (FIV) จัดอยู่ในจีนัสใดของตระกูล Retroviridae?",
    choices: [
      "Lentivirus",
      "Gammaretrovirus",
      "Alpharetrovirus",
      "Spumavirus",
    ],
    answer: "Lentivirus",
    explanation: "FIV จัดอยู่ในจีนัส Lentivirus ซึ่งเป็นกลุ่มไวรัสที่ทำให้เกิดโรคอย่างช้าๆ แบบค่อยเป็นค่อยไป"
  },
  {
    id: "ch6_q7",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "FIV Target Cell",
    virusType: "retro",
    q: "เซลล์เป้าหมายหลักที่ถูกทำลายจนลดลงอย่างต่อเนื่องในแมวติดเชื้อ FIV คือข้อใด?",
    choices: [
      "CD4+ T lymphocyte",
      "Erythrocyte",
      "Platelet",
      "Basophil",
    ],
    answer: "CD4+ T lymphocyte",
    explanation: "FIV เข้าทำลาย CD4+ T helper cells ทำให้ภูมิคุ้มกันระดับเซลล์เสื่อมถอย เกิดการติดเชื้อฉวยโอกาส"
  },
  {
    id: "ch6_q8",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "Coggins Test Target",
    virusType: "retro",
    q: "การทดสอบ Coggins test (AGID) ในม้า ใช้ตรวจวินิจฉัยโรคติดเชื้อไวรัสชนิดใด?",
    choices: [
      "Equine Infectious Anemia (EIA)",
      "Equine Viral Arteritis (EVA)",
      "African Horse Sickness (AHS)",
      "Equine Influenza (EI)",
    ],
    answer: "Equine Infectious Anemia (EIA)",
    explanation: "Coggins test คือวิธีตรวจหาแอนติบอดีต่อโปรตีน p26 ของเชื้อ Equine Infectious Anemia Virus (EIAV)"
  },
  {
    id: "ch6_q9",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "EIAV Insect Vector",
    virusType: "retro",
    q: "พาหะสำคัญที่ถ่ายทอดเชื้อ Equine Infectious Anemia Virus ระหว่างม้าคือแมลงชนิดใด?",
    choices: [
      "เหลือบม้าและแมลงวันคอก (Tabanids / Stomoxys)",
      "ยุงก้นปล่อง (Anopheles)",
      "หมัดสุนัข (Ctenocephalides)",
      "ไรนก (Dermanyssus)",
    ],
    answer: "เหลือบม้าและแมลงวันคอก (Tabanids / Stomoxys)",
    explanation: "EIAV ถ่ายทอดทางกลไก (Mechanical transmission) โดยแมลงดูดเลือดขนาดใหญ่ เช่น เหลือบม้า (Tabanid flies)"
  },
  {
    id: "ch6_q10",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "CAEV Milk Transmission",
    virusType: "retro",
    q: "โรคข้อและสมองอักเสบในแพะ (CAEV) มักถ่ายทอดสู่ลูกแพะผ่านทางใดเป็นหลัก?",
    choices: [
      "การกินน้ำนมและน้ำนมเหลืองจากแม่แพะ",
      "การโดนเห็บอ่อนกัดในคอก",
      "การสูดดมฝุ่นละอองจากอุจจาระแห้ง",
      "การผสมพันธุ์โดยพ่อพันธุ์เท่านั้น",
    ],
    answer: "การกินน้ำนมและน้ำนมเหลืองจากแม่แพะ",
    explanation: "เชื้อ CAEV ถูกขับออกมาใน Colostrum และนมของแม่แพะ ลูกแพะที่ดูดนมจะรับเชื้อเข้าสู่ทางเดินอาหาร"
  },
  // ── CHAPTER 7: Paramyxoviridae ──
  {
    id: "ch7_q1",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "Paramyxovirus Genome",
    virusType: "paramyxo",
    q: "สารพันธุกรรมของไวรัสในตระกูล Paramyxoviridae คือข้อใด?",
    choices: [
      "Negative-sense single-stranded RNA ((-)ssRNA)",
      "Positive-sense single-stranded RNA ((+)ssRNA)",
      "Segmented double-stranded RNA",
      "Circular double-stranded DNA",
    ],
    answer: "Negative-sense single-stranded RNA ((-)ssRNA)",
    explanation: "Paramyxoviridae เป็นไวรัส RNA สายเดี่ยวแบบเส้นตรง non-segmented ชนิด Negative-sense มีเยื่อหุ้ม"
  },
  {
    id: "ch7_q2",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "CDV Hard Pad",
    virusType: "paramyxo",
    q: "รอยโรคการหนาตัวแข็งด้านผิดปกติของฝ่าเท้าสุนัขติดเชื้อ Canine Distemper เรียกว่าอะไร?",
    choices: [
      "Hard pad disease (Hyperkeratosis)",
      "Blue eye syndrome",
      "Tiger heart lesion",
      "Orf stomatitis",
    ],
    answer: "Hard pad disease (Hyperkeratosis)",
    explanation: "CDV ทำให้เกิด Hyperkeratosis บริเวณแผ่นอุ้งเท้า (Footpads) และจมูก จึงเรียกว่า Hard pad disease"
  },
  {
    id: "ch7_q3",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "CDV Enamel Hypoplasia",
    virusType: "paramyxo",
    q: "ลูกสุนัขที่รอดชีวิตจากการติดเชื้อ Canine Distemper ในวัยกำลังสร้างฟัน มักพบรอยโรคใด?",
    choices: [
      "Enamel hypoplasia (เคลือบฟันสึกกร่อนผิดรูป)",
      "ฟันงอกซ้อนผิดปกติในโพรงปาก",
      "เหงือกงอกหนาตัวเป็นเนื้องอกหูด",
      "ฟันน้ำนมไม่ยอมหลุดร่วงตามอายุ",
    ],
    answer: "Enamel hypoplasia (เคลือบฟันสึกกร่อนผิดรูป)",
    explanation: "เชื้อ CDV ทำลายเซลล์ Ameloblasts ที่สร้างเคลือบฟัน ส่งผลให้ฟันแท้มีผิวขรุขระ สีน้ำตาล และกร่อนง่าย"
  },
  {
    id: "ch7_q4",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "Rinderpest Eradication",
    virusType: "paramyxo",
    q: "โรคกาฬโรคในโค (Rinderpest) มีสถานะทางระบาดวิทยาในปัจจุบันอย่างไร?",
    choices: [
      "กวาดล้างหมดสิ้นไปจากโลกแล้ว (Eradicated)",
      "ยังคงระบาดรุนแรงเฉพาะในทวีปเอเชีย",
      "กลายพันธุ์เป็นโรคติดต่อสู่มนุษย์",
      "พบการระบาดซ้ำในฟาร์มโคนมทุกปี",
    ],
    answer: "กวาดล้างหมดสิ้นไปจากโลกแล้ว (Eradicated)",
    explanation: "Rinderpest ได้รับการประกาศจาก OIE/FAO ว่าถูกกวาดล้างหมดสิ้นไปจากโลกอย่างเป็นทางการในปี 2011"
  },
  {
    id: "ch7_q5",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "PPR Target Animals",
    virusType: "paramyxo",
    q: "โรค Peste des Petits Ruminants (PPR) ก่อให้เกิดอาการป่วยรุนแรงในสัตว์กลุ่มใด?",
    choices: [
      "แพะและแกะ",
      "ม้าและลา",
      "สุนัขและแมว",
      "สุกรและหมูป่า",
    ],
    answer: "แพะและแกะ",
    explanation: "PPR หรือโรคกาฬโรคในสัตว์เคี้ยวเอื้องขนาดเล็ก เป็นโรคร้ายแรงที่มีอัตราการตายสูงในแพะและแกะ"
  },
  {
    id: "ch7_q6",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "NDV Strain Virulence",
    virusType: "paramyxo",
    q: "สายพันธุ์ของ Newcastle Disease Virus (NDV) ที่ก่อให้เกิดโรครุนแรงและตายเฉียบพลันในไก่คือข้อใด?",
    choices: [
      "Velogenic strain",
      "Mesogenic strain",
      "Lentogenic strain",
      "Asymptomatic enteric strain",
    ],
    answer: "Velogenic strain",
    explanation: "Velogenic strain เป็นสายพันธุ์ที่มีความรุนแรงสูงมาก ก่อรอยโรคทางเดินหายใจ ประสาท และอัตราตายสูงถึง 100%"
  },
  {
    id: "ch7_q7",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "NDV Diagnosis Test",
    virusType: "paramyxo",
    q: "การทดสอบทางห้องปฏิบัติการเพื่อยืนยันเชื้อ NDV โดยอาศัยคุณสมบัติเกาะกลุ่มเม็ดเลือดแดงคือข้อใด?",
    choices: [
      "Hemagglutination Inhibition (HI) test",
      "Western blot analysis",
      "Agar gel immunodiffusion",
      "Complement fixation test",
    ],
    answer: "Hemagglutination Inhibition (HI) test",
    explanation: "เชื้อ NDV มี Hemagglutinin spike ทำให้เม็ดเลือดแดงไก่เกาะกลุ่ม จึงใช้การทดสอบ HA และ HI ในการตรวจวินิจฉัย"
  },
  {
    id: "ch7_q8",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "Hendra Nipah Reservoir",
    virusType: "paramyxo",
    q: "แหล่งรังโรคตามธรรมชาติของไวรัส Hendra และ Nipah คือสัตว์ชนิดใด?",
    choices: [
      "ค้างคาวกินผลไม้ (Fruit bats / Pteropus)",
      "หนูนาและสัตว์ฟันแทะ",
      "นกพิราบและนกเป็ดน้ำ",
      "ชะมดและอีเห็นป่า",
    ],
    answer: "ค้างคาวกินผลไม้ (Fruit bats / Pteropus)",
    explanation: "Pteropus fruit bats (ค้างคาวแม่ไก่) เป็น Natural reservoir ที่นำเชื้อแพร่สู่ม้า หมู และมนุษย์"
  },
  {
    id: "ch7_q9",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "Nipah Barking Pig",
    virusType: "paramyxo",
    q: "อาการทางระบบหายใจเด่นชัดในสุกรที่ติดเชื้อไวรัส Nipah มีชื่อเรียกเฉพาะว่าอะไร?",
    choices: [
      "Barking pig syndrome",
      "Blue tongue syndrome",
      "Hard pad syndrome",
      "Mad cow syndrome",
    ],
    answer: "Barking pig syndrome",
    explanation: "สุกรติดเชื้อ Nipah มีอาการไอแห้งเสียงดังคล้ายสุนัขเห่า หายใจลำบาก เรียกว่า Barking pig syndrome"
  },
  {
    id: "ch7_q10",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "Syncytia Inclusions Paramyxo",
    virusType: "paramyxo",
    q: "ลักษณะเด่นของ Inclusion bodies ที่พบในเซลล์ติดเชื้อ Canine Distemper Virus คือข้อใด?",
    choices: [
      "พบได้ทั้งในไซโทพลาสซึมและนิวเคลียส",
      "พบเฉพาะในนิวเคลียสเท่านั้น",
      "ไม่พบ Inclusion body ใดๆ ทั้งสิ้น",
      "พบเฉพาะในช่องว่างระหว่างเซลล์",
    ],
    answer: "พบได้ทั้งในไซโทพลาสซึมและนิวเคลียส",
    explanation: "Morbillivirus เช่น CDV สามารถสร้าง Inclusion bodies ได้ทั้งแบบ Intracytoplasmic และ Intranuclear"
  },
  // ── CHAPTER 8: Orthomyxoviridae ──
  {
    id: "ch8_q1",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Orthomyxovirus Genome Segments",
    virusType: "ortho",
    q: "สารพันธุกรรมของไวรัส Influenza A ในตระกูล Orthomyxoviridae แบ่งออกเป็นกี่ชิ้นส่วน?",
    choices: [
      "8 ชิ้นส่วน (8 Segments)",
      "2 ชิ้นส่วน (2 Segments)",
      "10-12 ชิ้นส่วน",
      "สายเดี่ยวท่อนเดียวไม่แบ่งท่อน",
    ],
    answer: "8 ชิ้นส่วน (8 Segments)",
    explanation: "Influenza A virus มีจีโนมเป็น (-)ssRNA แบ่งออกเป็น 8 segments แต่ละท่อนรหัสโปรตีนสำคัญ"
  },
  {
    id: "ch8_q2",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Orthomyxovirus Nuclear Site",
    virusType: "ortho",
    q: "ไวรัสไข้หวัดใหญ่มีความแตกต่างจากไวรัส RNA ส่วนใหญ่ตรงจุดใดในกระบวนการเพิ่มจำนวน?",
    choices: [
      "จำลองสารพันธุกรรมภายในนิวเคลียส",
      "ใช้ไรโบโซมของตัวเองในการแปลรหัส",
      "ไม่อาศัยเอนไซม์ RNA polymerase",
      "ทนต่อความร้อนสูงได้มากกว่า 100 °C",
    ],
    answer: "จำลองสารพันธุกรรมภายในนิวเคลียส",
    explanation: "Orthomyxovirus เป็นหนึ่งใน RNA virus ไม่กี่กลุ่มที่ต้องเข้าไป Transcription และ Replicate ในนิวเคลียสของโฮสต์"
  },
  {
    id: "ch8_q3",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Hemagglutinin Function",
    virusType: "ortho",
    q: "ไกลโคโปรตีนหนาม Hemagglutinin (HA) ของไวรัสไข้หวัดใหญ่ทำหน้าที่สำคัญข้อใด?",
    choices: [
      "จับกับตัวรับ Sialic acid บนผิวเซลล์โฮสต์",
      "ตัดกรดไซอะลิกเพื่อปล่อยอนุภาคไวรัส",
      "สังเคราะห์สายดีเอ็นเอแม่แบบ",
      "หลอมเซลล์ให้เกิดรอยโรคแผลหลุม",
    ],
    answer: "จับกับตัวรับ Sialic acid บนผิวเซลล์โฮสต์",
    explanation: "HA ทำหน้าที่รับรู้และเข้าจับกับ Sialic acid receptor บนผิวเซลล์เจ้าบ้านเพื่อนำไวรัสเข้าสู่เซลล์"
  },
  {
    id: "ch8_q4",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Neuraminidase Function",
    virusType: "ortho",
    q: "เอนไซม์ Neuraminidase (NA) บนผิวของอนุภาคไวรัสไข้หวัดใหญ่มีหน้าที่อะไร?",
    choices: [
      "ตัดพันธะ Sialic acid เพื่อปลดปล่อยไวรัสออกจากเซลล์",
      "จับกับตัวรับเพื่อเปิดช่องเยื่อหุ้มเซลล์",
      "สร้างพลังงาน ATP ให้แก่อนุภาค",
      "ห่อหุ้มสารพันธุกรรมเป็นรูปเกลียว",
    ],
    answer: "ตัดพันธะ Sialic acid เพื่อปลดปล่อยไวรัสออกจากเซลล์",
    explanation: "NA ตัด Sialic acid ทำให้ไวรัสรุ่นลูกหลุดเป็นอิสระจากผิวเซลล์และไม่เกาะกลุ่มกันเอง"
  },
  {
    id: "ch8_q5",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Antigenic Drift Mechanism",
    virusType: "ortho",
    q: "ปรากฏการณ์ Antigenic drift ของไวรัสไข้หวัดใหญ่เกิดจากกลไกทางพันธุกรรมใด?",
    choices: [
      "การกลายพันธุ์ระดับจุด (Point mutation) สะสมต่อเนื่อง",
      "การสลับเปลี่ยนชิ้นส่วนยีนทั้งหมดระหว่างสายพันธุ์",
      "การแทรกจีโนมเข้าสู่โครโมโซมของโฮสต์",
      "การสูญเสียชั้นเยื่อหุ้มไขมันถาวร",
    ],
    answer: "การกลายพันธุ์ระดับจุด (Point mutation) สะสมต่อเนื่อง",
    explanation: "Antigenic drift เกิดจากความผิดพลาดของ RdRp ก่อให้เกิด Point mutation สะสม จนโครงสร้าง HA/NA เปลี่ยนไปทีละน้อย"
  },
  {
    id: "ch8_q6",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Antigenic Shift Mechanism",
    virusType: "ortho",
    q: "Antigenic shift ที่ก่อให้เกิดการระบาดใหญ่ระดับโลก (Pandemic) เกิดจากกระบวนการใด?",
    choices: [
      "การแลกเปลี่ยนชิ้นส่วนยีน (Genetic reassortment)",
      "การได้รับสารเคมีเร่งการเติบโตในฟาร์ม",
      "การเปลี่ยนแปลงอุณหภูมิของโลกเฉียบพลัน",
      "การติดเชื้อแบคทีเรียแทรกซ้อนพร้อมกัน",
    ],
    answer: "การแลกเปลี่ยนชิ้นส่วนยีน (Genetic reassortment)",
    explanation: "Antigenic shift เกิดเมื่อเซลล์เดียวติดเชื้อ 2 สายพันธุ์พร้อมกัน แล้วเกิด Genetic reassortment ได้สายพันธุ์ย่อยใหม่หมดจด"
  },
  {
    id: "ch8_q7",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Swine Mixing Vessel",
    virusType: "ortho",
    q: "เหตุใดสุกร (Swine) จึงมักถูกเรียกว่าเป็น 'Mixing vessel' ของเชื้อไวรัสไข้หวัดใหญ่?",
    choices: [
      "มีทั้งตัวรับแบบสัตว์ปีกและมนุษย์ในทางเดินหายใจ",
      "มีอุณหภูมิร่างกายสูงกว่าสัตว์เลี้ยงลูกด้วยนมชนิดอื่น",
      "ไม่มีระบบภูมิคุ้มกันต่อต้านไวรัสไข้หวัดใหญ่",
      "สามารถเพาะเลี้ยงเชื้อไวรัสได้ในกระเพาะอาหาร",
    ],
    answer: "มีทั้งตัวรับแบบสัตว์ปีกและมนุษย์ในทางเดินหายใจ",
    explanation: "ทางเดินหายใจของสุกรมีทั้ง alpha-2,3 (Avian) และ alpha-2,6 (Human) sialic acid receptors จึงติดเชื้อได้ทั้งสองสายพันธุ์"
  },
  {
    id: "ch8_q8",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "HPAI Clinical Signs",
    virusType: "ortho",
    q: "สัตว์ปีกที่ติดเชื้อ Highly Pathogenic Avian Influenza (HPAI) มักแสดงอาการเด่นชัดข้อใด?",
    choices: [
      "หงอนและเหนียงบวมคล้ำเขียวและตายเฉียบพลัน",
      "ขนร่วงทั่วตัวแต่ยังกินอาหารได้ปกติ",
      "ขาบวมแข็งและมีตุ่มหนองที่ฝ่าเท้า",
      "มีอาการคันตามโคนหางอย่างรุนแรง",
    ],
    answer: "หงอนและเหนียงบวมคล้ำเขียวและตายเฉียบพลัน",
    explanation: "HPAI ทำลายเซลล์บุหลอดเลือดทั่วร่างกาย ทำให้เกิด Cyanosis และ Edema บริเวณหงอน เหนียง และตายรวดเร็ว"
  },
  {
    id: "ch8_q9",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Oseltamivir Target",
    virusType: "ortho",
    q: "ยาต้านไวรัสไข้หวัดใหญ่ Oseltamivir ออกฤทธิ์ยับยั้งการทำงานของโปรตีนใด?",
    choices: [
      "Neuraminidase (NA)",
      "Hemagglutinin (HA)",
      "M2 ion channel",
      "RNA polymerase",
    ],
    answer: "Neuraminidase (NA)",
    explanation: "Oseltamivir ทำหน้าที่เป็น Neuraminidase inhibitor ป้องกันไม่ให้ไวรัสหลุดออกจากเซลล์เพื่อไปแพร่เชื้อต่อ"
  },
  {
    id: "ch8_q10",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Equine Influenza Signs",
    virusType: "ortho",
    q: "โรค Equine Influenza ในม้าก่อให้เกิดอาการทางคลินิกเด่นชัดในระบบใด?",
    choices: [
      "ระบบทางเดินหายใจ (ไอแห้ง ไข้สูง น้ำมูกใส)",
      "ระบบทางเดินอาหารและถ่ายเหลวรุนแรง",
      "ระบบกล้ามเนื้อทำให้กระดูกข้ออักเสบ",
      "ระบบผิวหนังและขนร่วงเป็นหย่อม",
    ],
    answer: "ระบบทางเดินหายใจ (ไอแห้ง ไข้สูง น้ำมูกใส)",
    explanation: "Equine flu ติดต่อง่ายทางละอองฝอยหายใจ ทำให้ม้ามีไข้สูง ไอแห้งรุนแรง ซึม และมีน้ำมูกใส"
  },
  // ── CHAPTER 9: Coronaviridae ──
  {
    id: "ch9_q1",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "Coronavirus Morphology",
    virusType: "corona",
    q: "ลักษณะเด่นของอนุภาคไวรัสโคโรนาเมื่อส่องด้วยกล้องจุลทรรศน์อิเล็กตรอนคืออะไร?",
    choices: [
      "หนามโปรตีนกระจายรอบคล้ายมงกุฎ (Crown-like)",
      "รูปร่างคล้ายกระสุนปืนทรงกระบอก",
      "อนุภาคทรงเหลี่ยมลูกบาศก์ 20 หน้า",
      "เส้นสายยืดยาวขดคล้ายด้ามร่ม",
    ],
    answer: "หนามโปรตีนกระจายรอบคล้ายมงกุฎ (Crown-like)",
    explanation: "หนาม Spike glycoprotein รูปกระบองขนาดใหญ่ยื่นรอบผิวอนุภาค ดูคล้าย Corona หรือรัศมีมงกุฎสุริยะ"
  },
  {
    id: "ch9_q2",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "Coronavirus Genome Type",
    virusType: "corona",
    q: "สารพันธุกรรมของไวรัสในตระกูล Coronaviridae จัดเป็นกลุ่มใด?",
    choices: [
      "Positive-sense single-stranded RNA ((+)ssRNA)",
      "Negative-sense segmented RNA",
      "Double-stranded circular DNA",
      "Single-stranded DNA",
    ],
    answer: "Positive-sense single-stranded RNA ((+)ssRNA)",
    explanation: "Coronaviridae มีสารพันธุกรรมเป็น (+)ssRNA ขนาดใหญ่ที่สุดในบรรดา RNA virus ทั้งหมด (~30 kb)"
  },
  {
    id: "ch9_q3",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "TGE Villous Atrophy",
    virusType: "corona",
    q: "โรค Transmissible Gastroenteritis (TGE) ในสุกรทำให้เกิดรอยโรคเด่นที่อวัยวะใด?",
    choices: [
      "วิลไลของลำไส้เล็กฝ่อลีบและผนังบางใส",
      "ต่อมทอนซิลบวมโตมีเนื้อตายสีเทา",
      "กล้ามเนื้อหัวใจมีแถบสีซีดขาว",
      "ปอดบวมน้ำและมีของเหลวในช่องอก",
    ],
    answer: "วิลไลของลำไส้เล็กฝ่อลีบและผนังบางใส",
    explanation: "TGEV ทำลายเซลล์ Enterocytes บริเวณส่วนปลายของ Villus ในลำไส้เล็ก ทำให้ Villous atrophy และท้องเสียเฉียบพลัน"
  },
  {
    id: "ch9_q4",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "PED Disease Nature",
    virusType: "corona",
    q: "โรค Porcine Epidemic Diarrhea (PED) ก่อให้เกิดอันตรายสูงสุดในสุกรช่วงอายุใด?",
    choices: [
      "ลูกสุกรดูดนมแรกเกิด (อายุต่ำกว่า 1-2 สัปดาห์)",
      "แม่สุกรช่วงตั้งท้องระยะท้าย",
      "สุกรขุนน้ำหนัก 80-100 กิโลกรัม",
      "พ่อพันธุ์สุกรโตเต็มวัย",
    ],
    answer: "ลูกสุกรดูดนมแรกเกิด (อายุต่ำกว่า 1-2 สัปดาห์)",
    explanation: "PED ในลูกสุกรแรกเกิดมีอัตราการตายสูงถึง 80-100% จากภาวะขาดน้ำและการดูดซึมสารอาหารล้มเหลว"
  },
  {
    id: "ch9_q5",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "FIP Wet Form Effusion",
    virusType: "corona",
    q: "ลักษณะของของเหลวในช่องท้องของแมวที่เป็นโรค FIP ชนิดเปียก (Effusive form) คือข้อใด?",
    choices: [
      "สีเหลืองฟางข้าว เหนียวข้น และมีโปรตีนสูง",
      "สีแดงใสคล้ายน้ำล้างเนื้อ",
      "สีขาวขุ่นข้นคล้ายหนอง",
      "น้ำใสไม่มีสีและมีโปรตีนต่ำมาก",
    ],
    answer: "สีเหลืองฟางข้าว เหนียวข้น และมีโปรตีนสูง",
    explanation: "น้ำคั่งใน FIP เกิดจาก Pyogranulomatous vasculitis เป็น Exudate สีเหลืองฟางข้าว เหนียวหนืดและโปรตีนสูง"
  },
  {
    id: "ch9_q6",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "FIP Mutation Origin",
    virusType: "corona",
    q: "ไวรัสก่อโรค FIP ในแมว เกิดจากการกลายพันธุ์ของไวรัสชนิดใดภายในตัวสัตว์?",
    choices: [
      "Feline Enteric Coronavirus (FECV)",
      "Feline Panleukopenia Virus (FPV)",
      "Feline Herpesvirus-1 (FHV-1)",
      "Feline Leukemia Virus (FeLV)",
    ],
    answer: "Feline Enteric Coronavirus (FECV)",
    explanation: "FECV ที่ไม่รุนแรงในลำไส้เกิดการกลายพันธุ์ของยีน Spike และ 3c จนเปลี่ยน Tropism ไปบุกรุก Macrophages เกิดเป็น FIPV"
  },
  {
    id: "ch9_q7",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "Infectious Bronchitis Egg Defect",
    virusType: "corona",
    q: "โรคหลอดลมอักเสบติดต่อในไก่ (IBV) นอกจากกระทบระบบทางเดินหายใจแล้วยังทำให้เกิดปัญหาใด?",
    choices: [
      "ไข่ลด เปลือกไข่บาง นิ่ม และผิดรูปย่น",
      "ลูกไก่ตาบอดสีฟ้าแบบเฉียบพลัน",
      "ขนปีกและหางร่วงพร้อมกันทั้งฝูง",
      "ขาหลังอัมพาตและบวมโต",
    ],
    answer: "ไข่ลด เปลือกไข่บาง นิ่ม และผิดรูปย่น",
    explanation: "IBV ทำลายท่อนำไข่ (Oviduct) ในไก่ไข่ ทำให้ผลผลิตไข่ลดลงอย่างมาก ไข่มีเปลือกบาง ผิวขรุขระย่น และไข่ขาวเหลวเป็นน้ำ"
  },
  {
    id: "ch9_q8",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "Bovine Coronavirus Winter Dysentery",
    virusType: "corona",
    q: "ไวรัส Bovine Coronavirus (BCoV) สัมพันธ์กับโรคทางเดินอาหารในโคช่วงฤดูใดมากที่สุด?",
    choices: [
      "โรคท้องเสียฤดูหนาว (Winter dysentery)",
      "โรคท้องเสียจากความร้อนในฤดูร้อน",
      "โรคกระเพาะอาหารอักเสบฤดูฝน",
      "โรคตับอักเสบประจำถิ่นช่วงน้ำหลาก",
    ],
    answer: "โรคท้องเสียฤดูหนาว (Winter dysentery)",
    explanation: "BCoV เป็นสาเหตุหลักของ Winter dysentery ในโคนมโตเต็มวัย ทำให้ถ่ายเหลวสีเข้มปนเลือดและน้ำนมลดฮวบ"
  },
  {
    id: "ch9_q9",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "FCoV Cell Tropism Shift",
    virusType: "corona",
    q: "เมื่อ FECV กลายพันธุ์เป็น FIPV ไวรัสจะเปลี่ยนเป้าหมายการบุกรุกไปที่เซลล์ชนิดใด?",
    choices: [
      "Monocytes และ Macrophages",
      "Erythrocytes ในม้าม",
      "Ciliated epithelial cells",
      "Pancreatic beta cells",
    ],
    answer: "Monocytes และ Macrophages",
    explanation: "การติดเชื้อและแบ่งตัวอย่างมีประสิทธิภาพใน Macrophages นำไปสู่การแพร่กระจายทั่วร่างกายและการอักเสบของหลอดเลือด"
  },
  {
    id: "ch9_q10",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "Coronavirus Stability",
    virusType: "corona",
    q: "เนื่องจาก Coronaviridae เป็นไวรัสที่มีเยื่อหุ้ม (Enveloped) ไวรัสนี้จึงมีความไวต่อสิ่งใดมากที่สุด?",
    choices: [
      "ผงซักฟอก สารละลายไขมัน และความร้อน",
      "อุณหภูมิที่ติดลบในตู้แช่แข็ง",
      "สภาพแวดล้อมที่ไร้ออกซิเจน",
      "ยาปฏิชีวนะกลุ่มเตตราไซคลิน",
    ],
    answer: "ผงซักฟอก สารละลายไขมัน และความร้อน",
    explanation: "เยื่อหุ้มไขมันของโคโรนาไวรัสถูกทำลายได้ง่ายด้วยสบู่ แอลกอฮอล์ น้ำยาฆ่าเชื้อ และความร้อนสูง"
  },
  // ── CHAPTER 10: Rhabdoviridae and Birnaviridae ──
  {
    id: "ch10_q1",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "Rabies Bullet Shape",
    virusType: "rhabdo",
    q: "ไวรัสในตระกูล Rhabdoviridae เช่น Rabies virus มีรูปร่างอนุภาคอันเป็นเอกลักษณ์แบบใด?",
    choices: [
      "ทรงกระสุนปืน (Bullet-shaped)",
      "ทรงลูกบาศก์ 20 หน้า",
      "ทรงกลมมีหนามมงกุฎ",
      "เส้นสายยืดยาวคล้ายหนอน",
    ],
    answer: "ทรงกระสุนปืน (Bullet-shaped)",
    explanation: "Rhabdoviridae มีรูปทรงกระสุนปืน ปลายด้านหนึ่งมน อีกด้านหนึ่งตัดตรง มี Envelope หุ้มชัดเจน"
  },
  {
    id: "ch10_q2",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "Rabies Axonal Transport",
    virusType: "rhabdo",
    q: "เชื้อไวรัสพิษสุนัขบ้าเคลื่อนตัวจากรอยแผลที่ถูกกัดเข้าสู่ระบบประสาทส่วนกลางผ่านเส้นทางใด?",
    choices: [
      "เคลื่อนที่ตามเส้นประสาทส่วนปลาย (Axonal transport)",
      "แพร่กระจายไปตามระบบน้ำเหลือง",
      "ล่องลอยอิสระในกระแสเลือด",
      "แพร่ผ่านทางชั้นกล้ามเนื้อลายโดยตรง",
    ],
    answer: "เคลื่อนที่ตามเส้นประสาทส่วนปลาย (Axonal transport)",
    explanation: "ไวรัสพิษสุนัขบ้าเคลื่อนที่แบบ Retrograde axoplasmic flow เข้าสู่ไขสันหลังและสมองตามเส้นประสาท"
  },
  {
    id: "ch10_q3",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "Rabies Transmission Route",
    virusType: "rhabdo",
    q: "ไวรัสพิษสุนัขบ้าถูกขับออกจากร่างกายของสัตว์ป่วยเพื่อแพร่เชื้อต่อผ่านทางของเหลวใดเป็นหลัก?",
    choices: [
      "น้ำลาย (Saliva)",
      "ปัสสาวะ",
      "เหงื่อ",
      "น้ำนม",
    ],
    answer: "น้ำลาย (Saliva)",
    explanation: "ไวรัสเพิ่มจำนวนในต่อมน้ำลาย (Salivary glands) และขับออกสู่น้ำลายเพื่อแพร่เชื้อผ่านบาดแผลถูกกัด"
  },
  {
    id: "ch10_q4",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "Negri Bodies Brain Location",
    virusType: "rhabdo",
    q: "รอยโรค Negri bodies ในสมองสัตว์ป่วยโรคพิษสุนัขบ้า มักตรวจพบได้มากที่สุดที่บริเวณใด?",
    choices: [
      "Hippocampus และ Purkinje cells ในสมองน้อย",
      "เยื่อหุ้มสมองชั้นนอก Dura mater",
      "ต่อมใต้สมอง Pituitary gland",
      "โพรงน้ำไขสันหลังส่วนกลาง",
    ],
    answer: "Hippocampus และ Purkinje cells ในสมองน้อย",
    explanation: "Negri bodies ตรวจพบได้หนาแน่นที่สุดใน Pyramidal cells ของ Hippocampus ในสุนัข และ Purkinje cells ในโค"
  },
  {
    id: "ch10_q5",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "VSV Clinical Differential",
    virusType: "rhabdo",
    q: "โรค Vesicular Stomatitis Virus (VSV) มีความสำคัญอย่างยิ่งในการวินิจฉัยแยกโรคกับโรคใด?",
    choices: [
      "Foot and mouth disease (FMD)",
      "Rabies",
      "Canine Distemper",
      "Rinderpest",
    ],
    answer: "Foot and mouth disease (FMD)",
    explanation: "VSV ทำให้เกิดตุ่มน้ำใสพองและแผลหลุมที่ปาก กีบ และเต้านม ซึ่งมีอาการเหมือนโรค FMD ทุกประการ"
  },
  {
    id: "ch10_q6",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "VSV Equine Susceptibility",
    virusType: "rhabdo",
    q: "สัตว์ชนิดใดสามารถติดเชื้อ Vesicular Stomatitis ได้ แต่ 'ไม่' ติดเชื้อปากและเท้าเปื่อย (FMD)?",
    choices: [
      "ม้า (Equine)",
      "โค (Bovine)",
      "สุกร (Swine)",
      "แพะ (Caprine)",
    ],
    answer: "ม้า (Equine)",
    explanation: "ม้าไม่ติดเชื้อ FMD แต่ไวต่อเชื้อ VSV มาก การพบแผลตุ่มน้ำในม้าจึงช่วยตัดข้อสงสัยของโรค FMD ได้"
  },
  {
    id: "ch10_q7",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "Bovine Ephemeral Fever Vector",
    virusType: "rhabdo",
    q: "โรคไข้ 3 วันในโค (Bovine Ephemeral Fever) ติดต่อระหว่างสัตว์โดยอาศัยพาหะใด?",
    choices: [
      "แมลงดูดเลือด (ยุงและริ้น)",
      "การสัมผัสปัสสาวะโดยตรง",
      "การกินอาหารปนเปื้อนเชื้อ",
      "การไอจามรดกันในอากาศ",
    ],
    answer: "แมลงดูดเลือด (ยุงและริ้น)",
    explanation: "BEFV จัดอยู่ในจีนัส Ephemerovirus ถ่ายทอดโดยยุง (Culicine mosquitoes) และริ้นน้ำเค็ม (Culicoides)"
  },
  {
    id: "ch10_q8",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "Birnaviridae Genome",
    virusType: "default",
    q: "สารพันธุกรรมของไวรัสในตระกูล Birnaviridae เช่น IBDV มีลักษณะอย่างไร?",
    choices: [
      "Bisegmented double-stranded RNA (dsRNA 2 ท่อน)",
      "Single-stranded DNA สายเดี่ยว",
      "Segmented negative ssRNA 8 ท่อน",
      "Circular double-stranded DNA",
    ],
    answer: "Bisegmented double-stranded RNA (dsRNA 2 ท่อน)",
    explanation: "Birnaviridae มาจาก 'Bi-RNA' มีจีโนมเป็น dsRNA แบ่งออกเป็น 2 segments (Segment A และ Segment B)"
  },
  {
    id: "ch10_q9",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "IBDV Target Organ",
    virusType: "default",
    q: "โรค Gumboro (Infectious Bursal Disease) ในไก่ ทำลายอวัยวะใดเป็นหลัก?",
    choices: [
      "เบอร์ซาของฟาบริเชียส (Bursa of Fabricius)",
      "ม้ามและตับอ่อน",
      "ต่อมไทมัสใต้ลำคอ",
      "ไขกระดูกส่วนโคนขา",
    ],
    answer: "เบอร์ซาของฟาบริเชียส (Bursa of Fabricius)",
    explanation: "IBDV มีความจำเพาะสูงในการทำลาย B-lymphocytes ใน Bursa of Fabricius ทำให้เกิดการบวมและฝ่อตามมา"
  },
  {
    id: "ch10_q10",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "IBD Long Term Effect",
    virusType: "default",
    q: "ผลกระทบระยะยาวที่อันตรายที่สุดในลูกไก่ที่รอดชีวิตจากการติดเชื้อ IBDV คืออะไร?",
    choices: [
      "ภาวะภูมิคุ้มกันบกพร่องถาวร (Immunosuppression)",
      "ขาหลังพิการแข็งเกร็งตลอดชีวิต",
      "การมองเห็นลดลงจนตาบอดสนิท",
      "ระบบย่อยอาหารหยุดการทำงาน",
    ],
    answer: "ภาวะภูมิคุ้มกันบกพร่องถาวร (Immunosuppression)",
    explanation: "การสูญเสีย B-cells ทำให้ไก่ไม่สามารถสร้างแอนติบอดีต่อวัคซีนชนิดอื่นและติดเชื้อแทรกซ้อนได้ง่าย"
  },
  // ── CHAPTER 11: Togaviridae and Flaviviridae ──
  {
    id: "ch11_q1",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "Alphavirus Mosquito Vector",
    virusType: "flavi",
    q: "ไวรัสในกลุ่ม Alphavirus เช่น EEEV, WEEV และ VEEV ถ่ายทอดสู่ม้าผ่านพาหะใด?",
    choices: [
      "ยุงดูดเลือด (Mosquitoes)",
      "เห็บแข็ง (Hard ticks)",
      "แมลงวันคอก (Stable flies)",
      "ไรไก่ (Poultry mites)",
    ],
    answer: "ยุงดูดเลือด (Mosquitoes)",
    explanation: "Equine Encephalomyelitis viruses จัดเป็น Arboviruses ที่มียุงเป็นพาหะนำโรคสำคัญ"
  },
  {
    id: "ch11_q2",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "JEV Amplifying Host",
    virusType: "flavi",
    q: "สัตว์ชนิดใดทำหน้าที่เป็น Amplifying host (ตัวเพิ่มจำนวนเชื้อ) ที่สำคัญของ Japanese Encephalitis Virus?",
    choices: [
      "สุกร (Swine)",
      "ม้า (Horse)",
      "สุนัข (Dog)",
      "แพะ (Goat)",
    ],
    answer: "สุกร (Swine)",
    explanation: "สุกรติดเชื้อ JEV จะมีระดับไวรัสในเลือดสูง (Viremia) โดยไม่ค่อยแสดงอาการป่วย จึงเป็นตัวแพร่เชื้อชั้นดีสู่ยุง Culex"
  },
  {
    id: "ch11_q3",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "West Nile Reservoir",
    virusType: "flavi",
    q: "แหล่งรังโรคตามธรรมชาติ (Natural reservoir) ของไวรัส West Nile (WNV) คือข้อใด?",
    choices: [
      "นกป่า (Wild birds)",
      "ค้างคาวแม่ไก่",
      "สัตว์ฟันแทะในป่า",
      "สัตว์เลื้อยคลาน",
    ],
    answer: "นกป่า (Wild birds)",
    explanation: "นกป่าเป็น Natural reservoir ของ WNV โดยมียุง Culex เป็นพาหะถ่ายทอดสู่ม้าและคน (Dead-end hosts)"
  },
  {
    id: "ch11_q4",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "BVDV Genus",
    virusType: "flavi",
    q: "เชื้อ Bovine Viral Diarrhea Virus (BVDV) จัดอยู่ในจีนัสใดของตระกูล Flaviviridae?",
    choices: [
      "Pestivirus",
      "Flavivirus",
      "Hepacivirus",
      "Pegivirus",
    ],
    answer: "Pestivirus",
    explanation: "จีนัส Pestivirus ประกอบด้วยเชื้อสำคัญในปศุสัตว์ ได้แก่ BVDV-1, BVDV-2, Border disease virus และ CSFV"
  },
  {
    id: "ch11_q5",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "BVDV PI Calves Stage",
    virusType: "flavi",
    q: "ลูกโคที่เป็นพาหะถาวร (PI calves) ของเชื้อ BVDV เกิดจากการติดเชื้อในครรภ์ช่วงใด?",
    choices: [
      "ช่วงตั้งท้อง 40 – 120 วัน",
      "ช่วงตั้งท้อง 180 – 240 วัน",
      "ช่วงสัปดาห์สุดท้ายก่อนคลอด",
      "ช่วงขณะกำลังคลอดลูก",
    ],
    answer: "ช่วงตั้งท้อง 40 – 120 วัน",
    explanation: "การติดเชื้อก่อนที่ระบบภูมิคุ้มกันของทารกจะพัฒนาสมบูรณ์ ทำให้ร่างกายทารกจดจำเชื้อไวรัสเป็นเซลล์ของตนเอง (Immunotolerance)"
  },
  {
    id: "ch11_q6",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "BVDV Mucosal Disease Trigger",
    virusType: "flavi",
    q: "ภาวะ Mucosal disease ที่มีอัตราการตายสูงในโค เกิดขึ้นเมื่อมีสภาวะใด?",
    choices: [
      "โคที่เป็น PI ติดเชื้อ BVDV สายพันธุ์ Cytopathogenic ซ้ำ",
      "โคได้รับวัคซีนเชื้อเป็นเข็มแรก",
      "โคขาดสารอาหารแร่ธาตุทองแดง",
      "โคติดเชื้อพยาธิใบไม้ในตับร่วมด้วย",
    ],
    answer: "โคที่เป็น PI ติดเชื้อ BVDV สายพันธุ์ Cytopathogenic ซ้ำ",
    explanation: "Mucosal disease เกิดเมื่อโค PI ชนิด non-cp เกิดการกลายพันธุ์หรือรับเชื้อชนิด cp-BVDV เข้าไป เกิดแผลเปื่อยทั่วทางเดินอาหารและตาย"
  },
  {
    id: "ch11_q7",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "CSFV Classification",
    virusType: "flavi",
    q: "โรคอหิวาต์สุกรดั้งเดิม (Classical Swine Fever - CSF / Hog Cholera) เกิดจากไวรัสกลุ่มใด?",
    choices: [
      "Pestivirus (Flaviviridae)",
      "Asfarviridae",
      "Coronaviridae",
      "Arteriviridae",
    ],
    answer: "Pestivirus (Flaviviridae)",
    explanation: "CSFV เป็นไวรัส (+)ssRNA มีเยื่อหุ้ม จัดอยู่ในจีนัส Pestivirus ตระกูล Flaviviridae"
  },
  {
    id: "ch11_q8",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "CSF Button Ulcers",
    virusType: "flavi",
    q: "รอยโรคแผลหลุมรูปกระดุม (Button ulcers) ในลำไส้ใหญ่ของสุกรเป็นลักษณะเฉพาะของโรคใด?",
    choices: [
      "Classical Swine Fever (CSF)",
      "Porcine Epidemic Diarrhea",
      "Transmissible Gastroenteritis",
      "Swine Dysentery",
    ],
    answer: "Classical Swine Fever (CSF)",
    explanation: "Button ulcers ในลำไส้ใหญ่เกิดจาก Necrosis ของต่อมน้ำเหลืองและเยื่อบุลำไส้ในโรค CSF ระยะเรื้อรัง"
  },
  {
    id: "ch11_q9",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "Turkey Egg Kidney",
    virusType: "flavi",
    q: "รอยโรคไตคล้ายไข่ไก่งวง (Turkey-egg kidney) จากจุดเลือดออกกระจาย เกิดจากโรคใดในสุกร?",
    choices: [
      "Classical Swine Fever (CSF)",
      "Foot and mouth disease",
      "Swine Vesicular Disease",
      "Rotavirus infection",
    ],
    answer: "Classical Swine Fever (CSF)",
    explanation: "Petechial hemorrhages ที่กระจายบนผิวไตของสุกรทำให้ดูคล้ายเปลือกไข่ไก่งวง เป็นรอยโรคเด่นของ CSF"
  },
  {
    id: "ch11_q10",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "Flaviviridae Genome Sense",
    virusType: "flavi",
    q: "สารพันธุกรรมของไวรัสในตระกูล Flaviviridae มีคุณสมบัติอย่างไร?",
    choices: [
      "Positive-sense single-stranded RNA ((+)ssRNA)",
      "Negative-sense segmented RNA",
      "Double-stranded circular DNA",
      "Single-stranded DNA",
    ],
    answer: "Positive-sense single-stranded RNA ((+)ssRNA)",
    explanation: "Flaviviridae มีจีโนมเป็น (+)ssRNA โมเลกุลเดี่ยว มีเยื่อหุ้มไขมัน และแปลรหัสเป็น Polyprotein เดียวกัน"
  },
  // ── CHAPTER 12: Reoviridae and Bunyaviridae ──
  {
    id: "ch12_q1",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "Reovirus Genome Segments",
    virusType: "default",
    q: "สารพันธุกรรมของไวรัสในตระกูล Reoviridae มีลักษณะเด่นอย่างไร?",
    choices: [
      "Segmented double-stranded RNA (dsRNA 10-12 ท่อน)",
      "Single-stranded DNA สายคู่",
      "Non-segmented (+)ssRNA",
      "Circular single-stranded RNA",
    ],
    answer: "Segmented double-stranded RNA (dsRNA 10-12 ท่อน)",
    explanation: "Reoviridae เป็นไวรัสที่มีจีโนมเป็น dsRNA แบ่งออกเป็น 10-12 segments และไม่มีเยื่อหุ้ม"
  },
  {
    id: "ch12_q2",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "Reovirus Multi-layer Capsid",
    virusType: "default",
    q: "โครงสร้าง Capsid ของไวรัสในตระกูล Reoviridae มีความพิเศษข้อใด?",
    choices: [
      "มีเปลือกโปรตีนซ้อนกัน 2-3 ชั้นโดยไม่มี Envelope",
      "มีชั้นไขมันแทรกอยู่ระหว่างชั้นโปรตีน",
      "เป็นรูปเกลียวท่อยาวไม่มีสมมาตร",
      "ประกอบด้วยกรดอะมิโนชนิดเดียวล้วน",
    ],
    answer: "มีเปลือกโปรตีนซ้อนกัน 2-3 ชั้นโดยไม่มี Envelope",
    explanation: "Reovirus มีเปลือก Capsid ซ้อนกันหลายชั้น (Concentric capsid shells) ทำให้ทนต่อสภาพแวดล้อมและน้ำย่อยได้ดี"
  },
  {
    id: "ch12_q3",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "Bluetongue Culicoides Vector",
    virusType: "default",
    q: "แมลงพาหะสำคัญที่ถ่ายทอดเชื้อไวรัส Bluetongue (BTV) ในแกะคือข้อใด?",
    choices: [
      "ริ้นดูดเลือด (Culicoides midges)",
      "ยุงลายบ้าน (Aedes aegypti)",
      "เห็บแข็งโค (Boophilus)",
      "ไรขี้เรื้อน (Sarcoptes)",
    ],
    answer: "ริ้นดูดเลือด (Culicoides midges)",
    explanation: "BTV ถ่ายทอดโดยริ้นดูดเลือด Culicoides spp. เชื้อเพิ่มจำนวนในริ้นก่อนส่งต่อสู่สัตว์เคี้ยวเอื้อง"
  },
  {
    id: "ch12_q4",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "Bluetongue Cyanosis",
    virusType: "default",
    q: "อาการทางคลินิกเด่นชัดของโรค Bluetongue ในแกะคือข้อใด?",
    choices: [
      "ลิ้นบวมเขียวคล้ำและขอบกีบอักเสบ",
      "ตุ่มหนองแข็งทั่วลำตัว",
      "ตาฝ้าสีฟ้าและเป็นต้อหิน",
      "ไอแห้งและฟันสึกกร่อน",
    ],
    answer: "ลิ้นบวมเขียวคล้ำและขอบกีบอักเสบ",
    explanation: "ไวรัสทำลายผนังหลอดเลือด ทำให้เกิดภาวะขาดออกซิเจน เลือดคั่ง ลิ้นบวมเขียว (Cyanosis) และกีบอักเสบกะเผลก"
  },
  {
    id: "ch12_q5",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "AHSV Pulmonary Form",
    virusType: "default",
    q: "โรคกาฬโรคม้า (African Horse Sickness - AHSV) รูปแบบที่มีอัตราตายสูงสุดในม้าคือแบบใด?",
    choices: [
      "รูปแบบปอดบวมน้ำ (Pulmonary form)",
      "รูปแบบผิวหนัง (Cutaneous form)",
      "รูปแบบข้อต่ออักเสบ (Arthritic form)",
      "รูปแบบเรื้อรังไม่แสดงอาการ",
    ],
    answer: "รูปแบบปอดบวมน้ำ (Pulmonary form)",
    explanation: "Pulmonary form (Dunkop) มีอัตราการตายสูงถึง 95% ม้ามักตายจากภาวะปอดบวมน้ำรุนแรงและมีฟองขาวไหลจากจมูก"
  },
  {
    id: "ch12_q6",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "AHSV Supraorbital Edema",
    virusType: "default",
    q: "สัญญาณเตือนทางคลินิกที่สำคัญของโรค AHSV ในรูปแบบหัวใจ (Cardiac form) คือข้อใด?",
    choices: [
      "รอยบวมน้ำที่แอ่งเหนือเบ้าตา (Supraorbital fossa edema)",
      "ลิ้นเปลี่ยนเป็นสีดำคล้ำ",
      "หางและใบหูเปื่อยหลุดร่วง",
      "มีตุ่มพองที่กลีบกีบเท้า",
    ],
    answer: "รอยบวมน้ำที่แอ่งเหนือเบ้าตา (Supraorbital fossa edema)",
    explanation: "อาการบวมน้ำที่แอ่งเหนือเบ้าตา (Dikkop form) เป็นลักษณะสำคัญที่ช่วยเตือนถึงโรค African Horse Sickness"
  },
  {
    id: "ch12_q7",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "Rotavirus Villus Tip Destruction",
    virusType: "default",
    q: "ไวรัส Rotavirus ทำให้เกิดอาการท้องเสียรุนแรงในลูกสัตว์แรกเกิดด้วยกลไกใด?",
    choices: [
      "ทำลายเซลล์ Enterocytes บริเวณยอดของวิลไลลำไส้เล็ก",
      "กระตุ้นการหลั่งกรดในกระเพาะอาหารอย่างรุนแรง",
      "ทำลายระบบประสาทส่วนกลางที่ควบคุมลำไส้",
      "ทำให้กล้ามเนื้อหูรูดทวารหนักเป็นอัมพาต",
    ],
    answer: "ทำลายเซลล์ Enterocytes บริเวณยอดของวิลไลลำไส้เล็ก",
    explanation: "Rotavirus ทำลายเซลล์ดูดซึมอาหารที่ยอดวิลไล ทำให้เกิด Malabsorptive diarrhea และขาดน้ำอย่างรวดเร็ว"
  },
  {
    id: "ch12_q8",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "Bunyavirales Tripartite Genome",
    virusType: "default",
    q: "สารพันธุกรรมของไวรัสในอันดับ Bunyavirales แบ่งออกเป็นกี่ชิ้นส่วน (Segments)?",
    choices: [
      "3 ชิ้นส่วน (L, M, S)",
      "2 ชิ้นส่วน (A, B)",
      "8 ชิ้นส่วน",
      "12 ชิ้นส่วน",
    ],
    answer: "3 ชิ้นส่วน (L, M, S)",
    explanation: "Bunyavirales มีจีโนมเป็น (-)ssRNA หรือ Ambisense แบ่งออกเป็น 3 ท่อน ได้แก่ Large (L), Medium (M) และ Small (S)"
  },
  {
    id: "ch12_q9",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "Rift Valley Fever Abortion Storm",
    virusType: "default",
    q: "ภาวะการแท้งลูกแบบพายุ (Abortion storms) ในฝูงแกะร่วมกับตับอักเสบรุนแรง สัมพันธ์กับโรคใด?",
    choices: [
      "Rift Valley Fever (RVF)",
      "Bluetongue",
      "African Horse Sickness",
      "Bovine Viral Diarrhea",
    ],
    answer: "Rift Valley Fever (RVF)",
    explanation: "RVFV (Phlebovirus) มียุงเป็นพาหะ ทำให้เกิดตับวาย อัตราตายสูงในลูกสัตว์ และการแท้งเกือบ 100% ในแม่แกะ"
  },
  {
    id: "ch12_q10",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "Schmallenberg Arthrogryposis",
    virusType: "default",
    q: "ไวรัส Schmallenberg ในสัตว์เคี้ยวเอื้องที่ติดเชื้อระหว่างตั้งท้อง ก่อให้เกิดความพิการใดในลูกสัตว์?",
    choices: [
      "ข้อต่อขาบิดงอแข็งเกร็ง (Arthrogryposis) และสมองพรุน",
      "ขนร่วงทั้งตัวและไม่มีกีบเท้า",
      "หัวใจโตผิดปกติและตาบอดถาวร",
      "ฟันงอกไม่สมบูรณ์และลิ้นมีแผล",
    ],
    answer: "ข้อต่อขาบิดงอแข็งเกร็ง (Arthrogryposis) และสมองพรุน",
    explanation: "Schmallenberg virus (Orthobunyavirus) ก่อให้เกิด Arthrogryposis-hydranencephaly syndrome ในลูกแกะและลูกโค"
  },
  // ── CHAPTER 13: Picornaviridae and Caliciviridae ──
  {
    id: "ch13_q1",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "Picornavirus Characteristics",
    virusType: "picorna",
    q: "สารพันธุกรรมและโครงสร้างของไวรัสในตระกูล Picornaviridae คือข้อใด?",
    choices: [
      "Naked (+)ssRNA virus ขนาดเล็ก",
      "Enveloped (-)ssRNA virus ทรงกระบอก",
      "Double-stranded DNA virus ขนาดใหญ่",
      "Segmented dsRNA virus",
    ],
    answer: "Naked (+)ssRNA virus ขนาดเล็ก",
    explanation: "Pico (เล็ก) + RNA ไวรัสกลุ่มนี้มีขนาดเล็กมาก 20-30 nm เป็น (+)ssRNA ไม่มีเยื่อหุ้ม จึงทนทานต่อสารทำละลายไขมัน"
  },
  {
    id: "ch13_q2",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "FMD Host Species",
    virusType: "picorna",
    q: "โรคปากและเท้าเปื่อย (Foot and Mouth Disease - FMD) เกิดขึ้นในสัตว์กลุ่มใด?",
    choices: [
      "สัตว์กีบคู่ (Cloven-hoofed animals)",
      "สัตว์กีบเดี่ยวเท่านั้น",
      "สัตว์ปีกทุกชนิด",
      "สัตว์ตระกูลลิงและมนุษย์เท่านั้น",
    ],
    answer: "สัตว์กีบคู่ (Cloven-hoofed animals)",
    explanation: "FMDV (Aphthovirus) ติดเชื้อเฉพาะสัตว์กีบคู่ เช่น โค กระบือ สุกร แพะ แกะ และสัตว์ป่ากีบคู่"
  },
  {
    id: "ch13_q3",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "FMD Equine Immunity",
    virusType: "picorna",
    q: "สัตว์เศรษฐกิจชนิดใดที่มีความต้านทานตามธรรมชาติต่อเชื้อโรคปากและเท้าเปื่อย (FMD)?",
    choices: [
      "ม้า (Horse)",
      "โคเนื้อ (Beef cattle)",
      "สุกรขุน (Pigs)",
      "แพะเนื้อ (Meat goats)",
    ],
    answer: "ม้า (Horse)",
    explanation: "ม้าเป็นสัตว์กีบเดี่ยว ไม่ติดเชื้อ FMD ตามธรรมชาติเด็ดขาด"
  },
  {
    id: "ch13_q4",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "FMD Tiger Heart",
    virusType: "picorna",
    q: "รอยโรค 'Tiger heart' (กล้ามเนื้อหัวใจลายเสือ) จากเชื้อ FMDV มักพบในสัตว์กลุ่มใด?",
    choices: [
      "ลูกสัตว์อายุน้อย (ลูกโค ลูกสุกร)",
      "พ่อพันธุ์แม่พันธุ์สัตว์แก่",
      "ม้าแข่งโตเต็มวัย",
      "สัตว์ปีกแรกเกิด",
    ],
    answer: "ลูกสัตว์อายุน้อย (ลูกโค ลูกสุกร)",
    explanation: "ในลูกสัตว์เล็ก ไวรัสเข้าทำลายกล้ามเนื้อหัวใจโดยตรง (Acute myocarditis) ทำให้เกิดแถบสีซีดสลับแดงคล้ายลายเสือและตายเฉียบพลัน"
  },
  {
    id: "ch13_q5",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "FMD Aerosol Transmission",
    virusType: "picorna",
    q: "ไวรัส FMDV ถูกขับออกและแพร่กระจายไปตามลมได้เป็นระยะทางไกลผ่านทางใด?",
    choices: [
      "ละอองฝอยจากการหายใจ (Aerosol droplets)",
      "ขนสัตว์ที่ร่วงหล่น",
      "มูลแห้งที่กลายเป็นฟอสซิล",
      "น้ำตาและขี้หูเท่านั้น",
    ],
    answer: "ละอองฝอยจากการหายใจ (Aerosol droplets)",
    explanation: "สุกรขับเชื้อ FMD ออกทางลมหายใจในปริมาณมหาศาล และลมสามารถพัดพาละอองเชื้อไปได้ไกลหลายสิบกิโลเมตร"
  },
  {
    id: "ch13_q6",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "Calicivirus Cup Depressions",
    virusType: "calici",
    q: "ลักษณะโครงสร้างทางสัณฐานวิทยาที่จำเพาะของ Calicivirus เมื่อดูด้วยกล้อง TEM คือข้อใด?",
    choices: [
      "รอยบุ๋มทรงถ้วย 32 จุดบนผิว Capsid (Cup-shaped)",
      "หนามโปรตีนกระจายรอบคล้ายดอกทานตะวัน",
      "เปลือกหุ้มไขมันสองชั้นรูปวงรี",
      "แท่งโปรตีนทรงกระบอกปลายแหลม",
    ],
    answer: "รอยบุ๋มทรงถ้วย 32 จุดบนผิว Capsid (Cup-shaped)",
    explanation: "Calici มาจากภาษาละติน Calix แปลว่า ถ้วย โดยผิวแคปซิดมีหลุมบุ๋มทรงถ้วยล้อมรอบอย่างเป็นเอกลักษณ์"
  },
  {
    id: "ch13_q7",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "FCV Oral Ulcers",
    virusType: "calici",
    q: "อาการทางคลินิกเด่นของโรค Feline Calicivirus (FCV) ที่ช่วยแยกจากโรคหวัดแมวชนิดอื่นคือข้อใด?",
    choices: [
      "แผลหลุมที่ลิ้น เพดานปาก และช่องปาก (Oral ulcers)",
      "รอยแผลที่กระจกตาเป็นรูปกิ่งก้าน (Dendritic ulcer)",
      "อาการท้องมานน้ำสีเหลืองเหนียวข้น",
      "การแท้งลูกและการคลอดลูกมัมมี่",
    ],
    answer: "แผลหลุมที่ลิ้น เพดานปาก และช่องปาก (Oral ulcers)",
    explanation: "FCV ก่อรอยโรคเด่นคือแผลหลุมเปื่อยที่ลิ้นและช่องปาก (Vesicles rupture into oral ulcers) น้ำลายไหลเจ็บปาก"
  },
  {
    id: "ch13_q8",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "VS-FCV Virulent Systemic",
    virusType: "calici",
    q: "เชื้อ Feline Calicivirus สายพันธุ์รุนแรง (VS-FCV) ทำให้เกิดกลุ่มอาการผิดปกติใดเพิ่มเติม?",
    choices: [
      "บวมน้ำตามใบหน้าและขา ร่วมกับตับวายเลือดออก",
      "กระดูกขาหลังหักและข้อหลุด",
      "ฟันแท้หลุดร่วงทั้งปาก",
      "ตาบอดถาวรจากต้อกระจก",
    ],
    answer: "บวมน้ำตามใบหน้าและขา ร่วมกับตับวายเลือดออก",
    explanation: "Virulent Systemic FCV (VS-FCV) ทำลายเซลล์บุหลอดเลือด ทำให้เกิดบวมน้ำรุนแรงที่ใบหน้า อุ้งเท้า ดีซ่าน และอัตราตายสูง"
  },
  {
    id: "ch13_q9",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "RHDV Rabbit Hemorrhagic",
    virusType: "calici",
    q: "โรค Rabbit Hemorrhagic Disease (RHD) ในกระต่าย ทำให้เกิดพยาธิสภาพรุนแรงที่อวัยวะใด?",
    choices: [
      "ตับวายเนื้อตายเฉียบพลันและเลือดออกทั่วร่างกาย",
      "ไตวายเรื้อรังและปัสสาวะไม่ออก",
      "ปอดอักเสบเรื้อรังจากเชื้อรา",
      "เยื่อหุ้มสมองอักเสบเป็นหนอง",
    ],
    answer: "ตับวายเนื้อตายเฉียบพลันและเลือดออกทั่วร่างกาย",
    explanation: "RHDV (Lagovirus) ทำลายตับอย่างรุนแรง (Necrotizing hepatitis) ก่อให้เกิด DIC เลือดออกตามช่องทวารและตายเฉียบพลัน"
  },
  {
    id: "ch13_q10",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "Picornavirus Disinfection",
    virusType: "picorna",
    q: "การฆ่าเชื้อไวรัสกลุ่ม Naked virus เช่น FMDV ในฟาร์ม ควรใช้น้ำยาฆ่าเชื้อชนิดใดจึงจะได้ผลดีที่สุด?",
    choices: [
      "สารฟอกขาว (โซเดียมไฮโปคลอไรต์) หรือด่างแก่",
      "แอลกอฮอล์ 70% ธรรมดา",
      "น้ำยาฆ่าเชื้อกลุ่มคลอโรฟอร์ม",
      "น้ำสบู่อ่อนเจือจาง",
    ],
    answer: "สารฟอกขาว (โซเดียมไฮโปคลอไรต์) หรือด่างแก่",
    explanation: "FMDV ไม่มีเยื่อหุ้มไขมัน จึงทนต่อแอลกอฮอล์และอีเทอร์ ต้องใช้สารออกซิไดซ์ กรดจัด หรือด่างจัด (โซดาไฟ) ในการฆ่าเชื้อ"
  },
  // ── CHAPTER 14: Arteriviridae and Circoviridae ──
  {
    id: "ch14_q1",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "PRRS Name Meaning",
    virusType: "arteri",
    q: "โรคหูฟ้าในสุกร (PRRS) มีชื่อเต็มทางการแพทย์ว่าอะไร?",
    choices: [
      "Porcine Reproductive and Respiratory Syndrome",
      "Porcine Renal and Respiratory Sickness",
      "Porcine Retroviral Reproductive Syndrome",
      "Porcine Rhabdovirus Respiratory Sickness",
    ],
    answer: "Porcine Reproductive and Respiratory Syndrome",
    explanation: "PRRS คือกลุ่มอาการทางระบบสืบพันธุ์และการหายใจในสุกร เกิดจากเชื้อ Arterivirus"
  },
  {
    id: "ch14_q2",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "PRRS Alveolar Macrophage Target",
    virusType: "arteri",
    q: "เซลล์เป้าหมายหลักในร่างกายสุกรที่ไวรัส PRRS บุกรุกเข้าทำลายคือเซลล์ใด?",
    choices: [
      "Porcine Alveolar Macrophages (PAMs)",
      "Intestinal goblet cells",
      "Renal tubular epithelial cells",
      "Pancreatic acinar cells",
    ],
    answer: "Porcine Alveolar Macrophages (PAMs)",
    explanation: "PRRSV ชอบเพิ่มจำนวนใน Macrophages ของถุงลมปอด ทำให้ระบบภูมิคุ้มกันปอดถูกทำลายและติดเชื้อแทรกซ้อนง่าย"
  },
  {
    id: "ch14_q3",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "PRRS CD163 Receptor",
    virusType: "arteri",
    q: "ตัวรับ (Receptor) สำคัญบนผิว Macrophage ที่ไวรัส PRRS ใช้ในการเข้าสู่เซลล์คือข้อใด?",
    choices: [
      "CD163",
      "CD4",
      "MHC class I",
      "Toll-like receptor 4",
    ],
    answer: "CD163",
    explanation: "โมเลกุล CD163 (Scavenger receptor) บน Macrophage เป็น Receptor สำคัญที่จำเป็นต่อการ Uncoating และติดเชื้อของ PRRSV"
  },
  {
    id: "ch14_q4",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "PRRS Sow Late Abortions",
    virusType: "arteri",
    q: "อาการเด่นของโรค PRRS ในแม่สุกรช่วงตั้งท้องระยะท้ายคือข้อใด?",
    choices: [
      "การแท้งลูก คลอดก่อนกำหนด และลูกคลอดมัมมี่",
      "น้ำนมไหลมากผิดปกติ",
      "เต้านมอักเสบเป็นฝีหนอง",
      "ตาบอดและขากระตุก",
    ],
    answer: "การแท้งลูก คลอดก่อนกำหนด และลูกคลอดมัมมี่",
    explanation: "PRRSV ผ่านรกเข้าทำลายลูกสุกรในท้องระยะท้าย ทำให้แท้ง คลอดก่อนกำหนด คลอดตาย และลูกมัมมี่"
  },
  {
    id: "ch14_q5",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "EAV Stallion Carrier",
    virusType: "arteri",
    q: "โรค Equine Viral Arteritis (EVA) สามารถแฝงตัวและแพร่เชื้อได้ยาวนานผ่านทางใด?",
    choices: [
      "น้ำเชื้อของพ่อม้าที่เป็นพาหะ (Carrier stallion)",
      "ละอองรังแคบนผิวหนังม้า",
      "มูลแห้งของลูกม้า",
      "ขี้ตาและน้ำลายม้าแก่",
    ],
    answer: "น้ำเชื้อของพ่อม้าที่เป็นพาหะ (Carrier stallion)",
    explanation: "พ่อม้าที่ติดเชื้อ EAV สามารถเป็น Persistent carrier โดยเชื้อแฝงตัวอยู่ในต่อมสืบพันธุ์เสริม (Ampullae) และหลั่งออกสู่น้ำเชื้อ"
  },
  {
    id: "ch14_q6",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "Circoviridae Circular Genome",
    virusType: "circo",
    q: "สารพันธุกรรมของไวรัสในตระกูล Circoviridae มีลักษณะอย่างไร?",
    choices: [
      "Circular single-stranded DNA ขนาดเล็กมาก",
      "Linear double-stranded RNA",
      "Segmented negative-sense RNA",
      "Diploid positive-sense RNA",
    ],
    answer: "Circular single-stranded DNA ขนาดเล็กมาก",
    explanation: "Circoviridae มีจีโนมเป็น ssDNA สายเดี่ยววงกลมขนาดเล็กที่สุดในบรรดา DNA virus ของสัตว์ (~1.7 - 2.0 kb)"
  },
  {
    id: "ch14_q7",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "PCV-2 PMWS Disease",
    virusType: "circo",
    q: "โรคแคระแกร็น ผอมโทรม (PMWS) ในสุกรหลังหย่านม สัมพันธ์กับการติดเชื้อไวรัสใด?",
    choices: [
      "Porcine Circovirus type 2 (PCV-2)",
      "Swine Pox Virus",
      "Porcine Enterovirus",
      "Pseudorabies virus",
    ],
    answer: "Porcine Circovirus type 2 (PCV-2)",
    explanation: "PCV-2 เป็นสาเหตุสำคัญของ Postweaning Multisystemic Wasting Syndrome (PMWS) ทำให้ลูกสุกรผอม โตช้า และต่อมน้ำเหลืองโต"
  },
  {
    id: "ch14_q8",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "Botryoid Inclusion Bodies",
    virusType: "circo",
    q: "ลักษณะ Botryoid inclusion bodies (กลุ่มก้อนคล้ายพวงองุ่น) ในไซโทพลาสซึมของ Macrophage เป็นเอกลักษณ์ของไวรัสใด?",
    choices: [
      "Porcine Circovirus type 2 (PCV-2)",
      "African Swine Fever Virus",
      "Classical Swine Fever Virus",
      "Foot and Mouth Disease Virus",
    ],
    answer: "Porcine Circovirus type 2 (PCV-2)",
    explanation: "Botryoid (grape-like) intracytoplasmic inclusions ใน Macrophages และ Histiocytes เป็นรอยโรคจุลพยาธิวิทยาที่จำเพาะต่อ PCV-2"
  },
  {
    id: "ch14_q9",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "PDNS Immune Complex",
    virusType: "circo",
    q: "กลุ่มอาการผื่นผิวหนังอักเสบและไตอักเสบ (PDNS) ในสุกร เกิดจากกลไกทางพยาธิวิทยาใด?",
    choices: [
      "Immune complex vasculitis และ Glomerulonephritis",
      "การขาดสารอาหารแคลเซียมอย่างรุนแรง",
      "การติดเชื้อปรสิตภายนอกกัดแทะผิวหนัง",
      "สารพิษจากเชื้อราทำลายตับโดยตรง",
    ],
    answer: "Immune complex vasculitis และ Glomerulonephritis",
    explanation: "PDNS เป็นปฏิกิริยาภูมิแพ้ Type III hypersensitivity ที่เกี่ยวข้องกับ PCV-2 ทำให้เกิดหลอดเลือดผิวหนังและไตอักเสบ"
  },
  {
    id: "ch14_q10",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "Chicken Anemia Virus Target",
    virusType: "circo",
    q: "ไวรัส Chicken Anemia Virus (CAV) ทำลายเซลล์ในระบบใดจนเกิดภาวะโลหิตจางรุนแรงในลูกไก่?",
    choices: [
      "เซลล์ต้นกำเนิดเม็ดเลือดในไขกระดูกและต่อมไทมัส",
      "เซลล์กล้ามเนื้อหัวใจห้องล่าง",
      "เซลล์เยื่อบุทางเดินอาหารส่วนปลาย",
      "เซลล์ประสาทรับความรู้สึกของดวงตา",
    ],
    answer: "เซลล์ต้นกำเนิดเม็ดเลือดในไขกระดูกและต่อมไทมัส",
    explanation: "CAV ทำลาย Erythroblast precursors ในไขกระดูกและ Thymocytes ทำให้เกิดไขกระดูกฝ่อ โลหิตจาง และภูมิคุ้มกันบกพร่อง"
  },
  // ── CHAPTER 15: Other viruses 2 and Prion ──
  {
    id: "ch15_q1",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "Avian Bornavirus PDD",
    virusType: "default",
    q: "โรคกระเพาะพักขยายตัวผิดปกติในนกปากขอ (PDD) มีสาเหตุจากเชื้อไวรัสใด?",
    choices: [
      "Avian Bornavirus (ABV)",
      "Avian Polyomavirus",
      "Psittacine Herpesvirus",
      "Avian Poxvirus",
    ],
    answer: "Avian Bornavirus (ABV)",
    explanation: "Avian Bornavirus ก่อให้เกิด Proventricular Dilatation Disease (PDD) ทำให้นกผอมแห้ง อาหารไม่ย่อย และกระเพาะพักขยายพอง"
  },
  {
    id: "ch15_q2",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "PDD Ganglioneuritis",
    virusType: "default",
    q: "รอยโรคทางจุลพยาธิวิทยาที่เด่นชัดที่สุดของโรค PDD ในนกคือข้อใด?",
    choices: [
      "การอักเสบของปมประสาททางเดินอาหาร (Lymphoplasmacytic ganglioneuritis)",
      "การเกิดตุ่มหนองที่หลอดอาหารส่วนบน",
      "การฝ่อลีบของตับและถุงน้ำดี",
      "การเกิดเนื้องอกกระดูกข้อต่อปีก",
    ],
    answer: "การอักเสบของปมประสาททางเดินอาหาร (Lymphoplasmacytic ganglioneuritis)",
    explanation: "ABV เข้าทำลายระบบประสาท Myenteric plexus ของกระเพาะและลำไส้ ส่งผลให้การบีบตัวของทางเดินอาหารล้มเหลว"
  },
  {
    id: "ch15_q3",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "Filovirus Shape",
    virusType: "default",
    q: "ไวรัสในตระกูล Filoviridae เช่น Ebola และ Marburg มีลักษณะทางสัณฐานวิทยาอย่างไร?",
    choices: [
      "เส้นสายยาวขดคล้ายด้ามร่มหรือเลข 6 (Filamentous)",
      "ทรงกระสุนปืนปลายตัดตรง",
      "ทรงเหลี่ยมลูกบาศก์ 20 หน้า",
      "ทรงกลมมีหนามโปรตีนกระจายรอบ",
    ],
    answer: "เส้นสายยาวขดคล้ายด้ามร่มหรือเลข 6 (Filamentous)",
    explanation: "Filo มาจากภาษาละติน Filum แปลว่า เส้นด้าย อนุภาคเป็นสายยาว มีการขดงอคล้ายด้ามร่มหรือตะขอ"
  },
  {
    id: "ch15_q4",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "Prion Nature",
    virusType: "prion",
    q: "พรีออน (Prion) มีองค์ประกอบทางชีววิทยาที่แตกต่างจากไวรัสโดยสิ้นเชิงในข้อใด?",
    choices: [
      "ไม่มีกรดนิวคลีอิก ประกอบด้วยโปรตีนล้วน",
      "มีสารพันธุกรรมทั้ง DNA และ RNA ปนกัน",
      "มีผนังเซลล์เป็น Peptidoglycan หนา",
      "มีไรโบโซมสังเคราะห์พลังงานได้เอง",
    ],
    answer: "ไม่มีกรดนิวคลีอิก ประกอบด้วยโปรตีนล้วน",
    explanation: "Prion (Proteinaceous infectious particle) ไม่มีสารพันธุกรรม DNA หรือ RNA เลย แต่เป็นโปรตีนที่พับตัวผิดรูป"
  },
  {
    id: "ch15_q5",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "PrP Conversion",
    virusType: "prion",
    q: "การเปลี่ยนแปลงโครงสร้างของโปรตีนพรีออนจากรูปปกติ (PrPC) ไปเป็นรูปก่อโรค (PrPSc) คือข้อใด?",
    choices: [
      "เปลี่ยนจาก Alpha-helix ไปเป็น Beta-sheet",
      "เปลี่ยนจาก Beta-sheet ไปเป็น Alpha-helix",
      "โปรตีนถูกย่อยสลายเป็นกรดอะมิโนอิสระ",
      "การสูญเสียชั้นไขมันหุ้มโมเลกุล",
    ],
    answer: "เปลี่ยนจาก Alpha-helix ไปเป็น Beta-sheet",
    explanation: "PrPSc มีสัดส่วนของ Beta-pleated sheet สูงมาก ทำให้ไม่ละลายน้ำและทนทานต่อการย่อยของเอนไซม์ Protease"
  },
  {
    id: "ch15_q6",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "BSE Meat Bone Meal",
    virusType: "prion",
    q: "โรควัวบ้า (BSE) แพร่ระบาดในฟาร์มโคนมในอดีตผ่านทางช่องทางใดเป็นหลัก?",
    choices: [
      "การให้อาหารผสมเนื้อและกระดูกป่นจากซากสัตว์ (Meat and Bone Meal)",
      "การถูกยุงและเหลือบม้ากัดในทุ่งหญ้า",
      "การกินหญ้าสดที่รดด้วยน้ำเสีย",
      "การผสมเทียมด้วยน้ำเชื้อแช่แข็ง",
    ],
    answer: "การให้อาหารผสมเนื้อและกระดูกป่นจากซากสัตว์ (Meat and Bone Meal)",
    explanation: "BSE แพร่กระจายจากการนำซากสัตว์เคี้ยวเอื้องที่ติดเชื้อมาแปรรูปเป็น Meat and Bone Meal (MBM) เลี้ยงโค"
  },
  {
    id: "ch15_q7",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "vCJD Human Connection",
    virusType: "prion",
    q: "โรคสมองฝ่อสายพันธุ์ใหม่ในมนุษย์ (vCJD) มีความสัมพันธ์กับการบริโภคผลิตภัณฑ์จากสัตว์ชนิดใด?",
    choices: [
      "โคที่เป็นโรควัวบ้า (BSE)",
      "สุกรที่ติดเชื้อไวรัสหูฟ้า",
      "ไก่ที่ติดเชื้อไข้หวัดนก",
      "แกะที่เป็นโรคพยาธิในปอด",
    ],
    answer: "โคที่เป็นโรควัวบ้า (BSE)",
    explanation: "Variant Creutzfeldt-Jakob Disease (vCJD) ในคนเกิดจากการบริโภคเนื้อวัวหรือเนื้อเยื่อประสาทที่ปนเปื้อนพรีออนจาก BSE"
  },
  {
    id: "ch15_q8",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "Scrapie Pruritus",
    virusType: "prion",
    q: "โรค Scrapie ในแกะและแพะ มีลักษณะอาการทางคลินิกเด่นชัดข้อใด?",
    choices: [
      "คันรุนแรงจนเอาตัวถูกับรั้ว ขนร่วง และเดินเซ",
      "ท้องเสียถ่ายเหลวเป็นเลือดพุ่ง",
      "ตาบอดขุ่นสีฟ้าและมีน้ำตาไหล",
      "มีตุ่มพองน้ำใสที่เต้านมและกีบเท้า",
    ],
    answer: "คันรุนแรงจนเอาตัวถูกับรั้ว ขนร่วง และเดินเซ",
    explanation: "คำว่า 'Scrapie' มาจากพฤติกรรมของแกะที่ชอบเอาตัวไปครูดไถ (Scrape) กับรั้วหรือต้นไม้เนื่องจากมีอาการคันรุนแรงจากระบบประสาทเสียหาย"
  },
  {
    id: "ch15_q9",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "CWD Host Species",
    virusType: "prion",
    q: "โรคสมองพรุนเรื้อรัง (Chronic Wasting Disease - CWD) พบการระบาดในสัตว์กลุ่มใด?",
    choices: [
      "กวางและเอลค์ (Cervids)",
      "สุนัขและสัตว์ตระกูลสุนัข",
      "แมวและสัตว์ตระกูลเสือ",
      "ช้างและสัตว์กินพืชขนาดใหญ่",
    ],
    answer: "กวางและเอลค์ (Cervids)",
    explanation: "CWD เป็น Prion disease ที่ระบาดในกลุ่มสัตว์ตระกูลกวาง (Deer, Elk, Moose) ทำให้ผอมแห้ง น้ำลายไหล และสมองเสื่อม"
  },
  {
    id: "ch15_q10",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "Prion Inactivation Method",
    virusType: "prion",
    q: "วิธีการทำลายฤทธิ์ของโปรตีนพรีออนในอุปกรณ์ทางการแพทย์ที่ถูกต้องตามมาตรฐานคือข้อใด?",
    choices: [
      "นึ่งฆ่าเชื้อด้วยไอน้ำแรงดันสูงร่วมกับสารละลายโซเดียมไฮดรอกไซด์ (NaOH)",
      "การแช่ในเอทานอล 70% เป็นเวลา 15 นาที",
      "การต้มในน้ำเดือด 100 °C เป็นเวลา 30 นาที",
      "การอบด้วยรังสีอัลตราไวโอเลต (UV) ทั่วไป",
    ],
    answer: "นึ่งฆ่าเชื้อด้วยไอน้ำแรงดันสูงร่วมกับสารละลายโซเดียมไฮดรอกไซด์ (NaOH)",
    explanation: "พรีออนทนทานต่อความร้อนและการนึ่งทั่วไปอย่างยิ่ง ต้องใช้ Autoclave ที่ 134 °C ร่วมกับ 1N NaOH จึงจะทำลายโครงสร้างโปรตีนได้สมบูรณ์"
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. MASTER MATCHING PAIRS (45 Core Viral Diagnostic Features)
// ─────────────────────────────────────────────────────────────────────────────
export const ALL_15_MATCHING_PAIRS: MatchingPair[] = [
  // Companion Animals
  { id: 'p1', chapter: 10, virus: 'Rabies Virus', feature: 'รูปกระสุนปืน & Negri bodies ในสมอง' },
  { id: 'p2', chapter: 3, virus: 'Canine Parvovirus (CPV)', feature: 'ลำไส้อักเสบถ่ายเป็นเลือด & Severe Leukopenia' },
  { id: 'p3', chapter: 7, virus: 'Canine Distemper Virus (CDV)', feature: 'Hard pad disease & กล้ามเนื้อกระตุก (Myoclonus)' },
  { id: 'p4', chapter: 3, virus: 'Canine Adenovirus-1 (CAV-1)', feature: 'Blue Eye กระจกตาบวมขุ่น & ตับอักเสบติดต่อ' },
  { id: 'p5', chapter: 4, virus: 'Feline Herpesvirus-1 (FHV-1)', feature: 'แผลหลุมรูปกิ่งไม้ที่กระจกตา (Dendritic ulcer)' },
  { id: 'p6', chapter: 13, virus: 'Feline Calicivirus (FCV)', feature: 'แผลหลุมลึกที่ลิ้น & Limping kitten syndrome' },
  { id: 'p7', chapter: 9, virus: 'Feline Infectious Peritonitis (FIP)', feature: 'กลายพันธุ์จาก FECV & น้ำในช่องท้องสีฟางข้าว Rivalta +' },
  { id: 'p8', chapter: 6, virus: 'Feline Leukemia Virus (FeLV)', feature: 'ตรวจ p27 antigen & ก่อมะเร็งเม็ดเลือดขาว Lymphoma' },
  { id: 'p9', chapter: 6, virus: 'Feline Immunodeficiency Virus (FIV)', feature: 'ตรวจ Antibody & ทำลาย CD4+ T-lymphocytes' },
  { id: 'p10', chapter: 3, virus: 'Feline Panleukopenia Virus (FPV)', feature: 'สมองน้อยฝ่อลีบแต่กำเนิด (Cerebellar hypoplasia)' },

  // Swine Diseases
  { id: 'p11', chapter: 5, virus: 'African Swine Fever (ASFV)', feature: 'DNA virus ขนาดใหญ่ & ม้ามบวมดำคล้ำ Blackberry jam' },
  { id: 'p12', chapter: 11, virus: 'Classical Swine Fever (CSFV)', feature: 'Pestivirus & ไตจุดเลือดออก Turkey egg kidney' },
  { id: 'p13', chapter: 14, virus: 'PRRS Virus (Arteriviridae)', feature: 'หูม่วงคล้ำ & ทำลาย Alveolar Macrophages ในปอด' },
  { id: 'p14', chapter: 9, virus: 'Porcine Epidemic Diarrhea (PEDV)', feature: 'ลูกสุกรดูดนมท้องเสียน้ำพุ่งตาย 100% & Villus atrophy' },
  { id: 'p15', chapter: 14, virus: 'Porcine Circovirus-2 (PCV2)', feature: 'PMWS สุกรหย่านมผอมโทรม & Botryoid inclusion bodies' },
  { id: 'p16', chapter: 4, virus: 'Pseudorabies (Aujeszky\'s)', feature: 'สุกรเป็นรังโรค & ก่อ Mad itch คันคลั่งในโค/สุนัข' },
  { id: 'p17', chapter: 3, virus: 'Porcine Parvovirus (PPV)', feature: 'กลุ่มอาการ SMEDI ลูกมัมมี่แห้งผสมไม่ติด' },
  { id: 'p18', chapter: 7, virus: 'Nipah Virus (Henipavirus)', feature: 'ค้างคาวแม่ไก่แพร่สู่หมู & หมูไอเสียงดัง Barking cough' },
  { id: 'p19', chapter: 13, virus: 'Swine Vesicular Disease (SVDV)', feature: 'Enterovirus ก่อตุ่มน้ำใสที่กีบเฉพาะในสุกร' },

  // Ruminant Diseases
  { id: 'p20', chapter: 13, virus: 'Foot and Mouth Disease (FMD)', feature: 'ตุ่มน้ำใสปากและกีบในสัตว์กีบคู่ & Tiger heart (ม้าไม่ติด)' },
  { id: 'p21', chapter: 5, virus: 'Lumpy Skin Disease (LSDV)', feature: 'Capripoxvirus ตุ่มนูนแข็งทั่วตัว & แผลหลุม Sit-fast' },
  { id: 'p22', chapter: 11, virus: 'Bovine Viral Diarrhea (BVDV)', feature: 'Persistent Infection (PI) จากลูกในท้อง & Ear notch test' },
  { id: 'p23', chapter: 4, virus: 'Infectious Bovine Rhinotracheitis (IBR)', feature: 'เยื่อบุจมูกแดงคล้ำ Red nose & แท้งลูกในแม่โค' },
  { id: 'p24', chapter: 10, virus: 'Bovine Ephemeral Fever (BEF)', feature: 'โรคไข้ 3 วันในโค ขากะเผลกนอนหมอบ & หายเองได้' },
  { id: 'p25', chapter: 12, virus: 'Bluetongue Virus (BTV)', feature: 'ริ้น Culicoides นำโรค & ลิ้นบวมม่วงคล้ำ Cyanotic tongue' },
  { id: 'p26', chapter: 9, virus: 'Bovine Coronavirus (BCoV)', feature: 'Winter dysentery โคถ่ายเป็นเลือดสดฤดูหนาว' },
  { id: 'p27', chapter: 4, virus: 'Malignant Catarrhal Fever (MCF)', feature: 'แกะเป็นพาหะแฝง & โคตาขุ่นขาว Vasculitis ตายเฉียบพลัน' },
  { id: 'p28', chapter: 5, virus: 'Contagious Ecthyma (Orf)', feature: 'Parapoxvirus ตุ่มสะเก็ดปากแกะแพะ & ติดสู่มือคน' },
  { id: 'p29', chapter: 6, virus: 'Caprine Arthritis Encephalitis (CAEV)', feature: 'ข้อเข่าบวมโต Big knee ในแพะโต & อัมพาตในลูกแพะ' },

  // Equine Diseases
  { id: 'p30', chapter: 6, virus: 'Equine Infectious Anemia (EIA)', feature: 'ม้าม้ามโตเลือดจาง & วินิจฉัยด้วย Coggins test (AGID)' },
  { id: 'p31', chapter: 12, virus: 'African Horse Sickness (AHSV)', feature: 'ริ้น Culicoides & ฟองน้ำฟอดทะลักรูจมูก Dunkop' },
  { id: 'p32', chapter: 8, virus: 'Equine Influenza (EIV H3N8)', feature: 'ไอแห้งเสียงดังรุนแรง & ต้องพักม้า 1 สัปดาห์ต่อไข้ 1 วัน' },
  { id: 'p33', chapter: 4, virus: 'Equine Herpesvirus-1 (EHV-1)', feature: 'Abortion storms ในแม่ม้า & ก่ออัมพาตไขสันหลัง EHM' },
  { id: 'p34', chapter: 11, virus: 'West Nile Virus (WNV)', feature: 'ยุง Culex นำโรคม้า & สมองอักเสบเดินเซ Ataxia' },
  { id: 'p35', chapter: 5, virus: 'Bovine Papillomavirus (BPV-1/2)', feature: 'กระโดดข้ามสปีชีส์ก่อมะเร็ง Equine Sarcoid ในม้า' },
  { id: 'p36', chapter: 14, virus: 'Equine Arteritis Virus (EAV)', feature: 'พ่อม้าเป็น Stallion carrier ขับเชื้อในน้ำเชื้อ' },

  // Avian Diseases
  { id: 'p37', chapter: 8, virus: 'Avian Influenza (HPAI H5N1)', feature: 'Segmented RNA 8 ท่อน & หงอนเหนียงบวมม่วง แข้งมีเลือดออก' },
  { id: 'p38', chapter: 7, virus: 'Newcastle Disease (NDV)', feature: 'Velogenic strain ตาย 100% & ปมประสาทบวม คอบิด' },
  { id: 'p39', chapter: 4, virus: 'Marek\'s Disease Virus (MDV)', feature: 'Oncogenic herpesvirus & ขาเหยียดหน้าหลัง Sciatic บวม' },
  { id: 'p40', chapter: 10, virus: 'Infectious Bursal Disease (IBDV)', feature: 'Bisegmented dsRNA & ทำลาย Bursa of Fabricius' },
  { id: 'p41', chapter: 9, virus: 'Infectious Bronchitis (IBV)', feature: 'Coronaviral Wrinkled egg เปลือกไข่ย่น & ไข่ขาวเหลว' },
  { id: 'p42', chapter: 5, virus: 'Fowlpox Virus', feature: 'Dry form ตุ่มหูดที่หงอน & Wet form แผ่นหนองขวางหลอดลม' },
  { id: 'p43', chapter: 4, virus: 'Infectious Laryngotracheitis (ILTV)', feature: 'ไก่ไอสะบัดก้อนเลือดสด & Fibrinous tracheitis' },
  { id: 'p44', chapter: 14, virus: 'Chicken Anemia Virus (CAV)', feature: 'ไขกระดูกซีดขาว Aplastic anemia & Blue wing disease' },

  // Prions & Others
  { id: 'p45', chapter: 15, virus: 'Bovine Spongiform Encephalopathy (BSE)', feature: 'พรีออน PrPSc ไม่มีสารพันธุกรรม & สมองรูพรุนฟองน้ำ' }
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. MASTER LAB DETECTIVE CLINICAL CASES (30 Comprehensive Cases)
// ─────────────────────────────────────────────────────────────────────────────
export const ALL_15_LAB_CASES: LabCase[] = [
  // Case 1: Swine Respiratory & Reproductive
  {
    id: "c_prrs",
    chapter: 14,
    title: "เคสที่ 01: ลูกสุกรขุนไอหอบและแม่สุกรแท้งช่วงท้าย",
    species: "สุกร (Porcine)",
    history: "ฟาร์มสุกรขุนระบบปิดพบลูกสุกรอนุบาลมีอาการไอ หายใจลำบาก หูและหน้าท้องม่วงคล้ำ อัตราการตายสูงถึง 20% ในคอกอนุบาล แม่สุกรท้องแก่หลายตัวแท้งลูก",
    symptoms: ["ไข้สูง (41°C)", "หูและหน้าท้องมีสีม่วงคล้ำ (Cyanosis)", "แท้งในแม่สุกรช่วงท้ายของการตั้งท้อง", "ลูกสุกรแคระแกร็น ปอดบวม"],
    laboratoryResults: "ผลตรวจ RT-PCR พบสารพันธุกรรมของ Arterivirus ในซีรั่ม ตัวอย่างปอดพบ Interstitial pneumonia และเนื้อเยื่อ Macrophages ถูกทำลายอย่างรุนแรง",
    choices: [
      "Porcine Reproductive and Respiratory Syndrome Virus (PRRSV)",
      "African Swine Fever Virus (ASFV)",
      "Classical Swine Fever Virus (CSFV)",
      "Foot and Mouth Disease Virus (FMDV)"
    ],
    answer: "Porcine Reproductive and Respiratory Syndrome Virus (PRRSV)",
    explanation: "อาการหูม่วง (Blue ear), ปัญหาการสืบพันธุ์ในแม่สุกร (แท้งระยะท้าย) ร่วมกับ Interstitial pneumonia จากการทำลาย PAMs ในปอด เป็นลักษณะสำคัญของโรค PRRS"
  },

  // Case 2: Canine Gastroenteritis
  {
    id: "c_cpv",
    chapter: 3,
    title: "เคสที่ 02: ลูกสุนัขซึม อาเจียน และท้องเสียถ่ายเป็นเลือดสด",
    species: "สุนัข (Canine)",
    history: "ลูกสุนัขพันธุ์โกลเด้น อายุ 3 เดือน ยังไม่เคยได้รับวัคซีน มีอาการซึม เบื่ออาหาร อาเจียนอย่างหนัก และถ่ายเหลวพุ่งเป็นเลือดสดกลิ่นเหม็นคาวรุนแรง",
    symptoms: ["ซึม ขาดน้ำรุนแรง", "อาเจียนต่อเนื่อง", "อุจจาระเหลวเป็นเลือดสดกลิ่นคาวจัด", "อุณหภูมิร่างกายต่ำ (37.2°C)"],
    laboratoryResults: "CBC พบภาวะ Severe Leukopenia (WBC = 1,200 cells/μL) ชุดตรวจเร็ว SNAP Test จากอุจจาระให้ผลบวกต่อ Viral Antigen",
    choices: [
      "Canine Parvovirus (CPV-2)",
      "Canine Coronavirus (CCoV)",
      "Canine Distemper Virus (CDV)",
      "Infectious Canine Hepatitis (CAV-1)"
    ],
    answer: "Canine Parvovirus (CPV-2)",
    explanation: "อาการท้องเสียเป็นเลือดสดกลิ่นคาวรุนแรงในลูกสุนัขที่ไม่ได้รับวัคซีน ร่วมกับภาวะเม็ดเลือดขาวต่ำอย่างวิกฤต (Severe Leukopenia) และผลบวก SNAP Test ชี้ชัดว่าเป็น Canine Parvovirus"
  },

  // Case 3: Swine Hemorrhagic Fever
  {
    id: "c_asf",
    chapter: 5,
    title: "เคสที่ 03: สุกรขุนตายเฉียบพลันเกือบยกเล้า ม้ามบวมดำคล้ำ",
    species: "สุกร (Porcine)",
    history: "ฟาร์มสุกรขุนพบสุกรตายเฉียบพลันหลายตัวโดยแทบไม่แสดงอาการล่วงหน้า สุกรที่ยังรอดมีไข้สูงมาก ผิวหนังใบหู ขา และหน้าท้องแดงม่วงคล้ำ เจ้าของใช้อาหารเศษอาหารเหลือ (Swill feeding)",
    symptoms: ["ไข้สูงมาก (41.5 - 42°C)", "ผิวหนังแดงคล้ำถึงม่วงดำ", "หายใจหอบ ถ่ายเป็นเลือดสด", "อัตราการตายสูงเกือบ 100%"],
    laboratoryResults: "ผ่าซากพบม้ามขยายใหญ่บวมคล้ำมากคล้ายแยมสีดำ (Blackberry jam spleen) ต่อมน้ำเหลืองมีเลือดออกบวมคล้ายก้อนเลือด PCR ยืนยันเชื้อ Asfivirus",
    choices: [
      "African Swine Fever Virus (ASFV)",
      "Classical Swine Fever Virus (CSFV)",
      "Erysipelothrix rhusiopathiae",
      "Porcine Circovirus type 2 (PCV2)"
    ],
    answer: "African Swine Fever Virus (ASFV)",
    explanation: "ประวัติการใช้อาหารเศษอาหาร (Swill feeding), อัตราการตายเฉียบพลันเกือบ 100% ร่วมกับรอยโรคม้ามบวมดำขนาดยักษ์ (Blackberry jam spleen) และต่อมน้ำเหลืองตกเลือด เป็นลักษณะของ African Swine Fever"
  },

  // Case 4: Avian High Mortality
  {
    id: "c_hpai",
    chapter: 8,
    title: "เคสที่ 04: ไก่เนื้อตายเฉียบพลันยกเล้า หงอนและเหนียงบวมม่วง",
    species: "ไก่ (Avian)",
    history: "ฟาร์มไก่เนื้อเปิดพบไก่ตายกระทันหันเพิ่มขึ้นอย่างรวดเร็วใน 24 ชั่วโมง ไก่ที่ป่วยซึมจัด หน้าบวม หงอนและเหนียงมีสีม่วงคล้ำ ที่เกล็ดขามีจุดเลือดออกกระจายทั่ว",
    symptoms: ["ตายรวดเร็วฉับพลัน", "หงอนและเหนียงบวมน้ำสีม่วงคล้ำ (Cyanosis)", "หน้าบวม ขี้ตาและน้ำมูกไหล", "จุดเลือดออกใต้เกล็ดแข้งขา"],
    laboratoryResults: "ตรวจ RT-PCR จากหลอดลมและทวารหนักพบเชื้อ Influenza A subtype H5N1 มี Multi-basic cleavage site บ่งชี้เป็นสายพันธุ์ HPAI",
    choices: [
      "Highly Pathogenic Avian Influenza (HPAI H5N1)",
      "Velogenic Newcastle Disease (NDV)",
      "Infectious Bronchitis (IBV)",
      "Infectious Laryngotracheitis (ILTV)"
    ],
    answer: "Highly Pathogenic Avian Influenza (HPAI H5N1)",
    explanation: "การตายเฉียบพลันสูงเกือบ 100% ร่วมกับหงอนเหนียงบวมม่วงคล้ำและจุดเลือดออกที่เกล็ดแข้งขา (Shank hemorrhage) ร่วมกับผล PCR ยืนยันเชื้อไข้หวัดนกชนิดรุนแรงสูง (HPAI)"
  },

  // Case 5: Feline Effusive Peritonitis
  {
    id: "c_fip",
    chapter: 9,
    title: "เคสที่ 05: แมวท้องมานป่อง เจาะได้น้ำสีเหลืองอำพันข้นเหนียว",
    species: "แมว (Feline)",
    history: "แมวเปอร์เซีย อายุ 1 ปี มีประวัติไข้ขึ้นๆ ลงๆ ไม่ตอบสนองต่อยาปฏิชีวนะ น้ำหนักลด ซึม ท้องขยายใหญ่ขึ้นเรื่อยๆ คลำพบของเหลวเต็มช่องท้อง",
    symptoms: ["ท้องมานโต (Ascites)", "ไข้เรื้อรังซึมผอม", "เยื่อเมือกซีด ดีซ่านเล็กน้อย", "หายใจเร็วจากน้ำดันกระบังลม"],
    laboratoryResults: "เจาะน้ำช่องท้องได้ของเหลวสีเหลืองอำพันใสปนเหนียว โปรตีนสูง 6.2 g/dL สัดส่วน A:G ratio = 0.35 การทดสอบ Rivalta test ให้ผลบวกชัดเจน",
    choices: [
      "Feline Infectious Peritonitis (FIP - Effusive form)",
      "Feline Panleukopenia Virus (FPV)",
      "ภาวะหัวใจวายและตับแข็ง",
      "พยาธิในถุงน้ำดี"
    ],
    answer: "Feline Infectious Peritonitis (FIP - Effusive form)",
    explanation: "น้ำในช่องท้องสีเหลืองอำพัน ข้นหนืด โปรตีนสูงมาก และ Albumin:Globulin ratio ต่ำกว่า 0.4 ร่วมกับ Rivalta test เป็นบวกในแมวอายุน้อย เป็นลักษณะเฉพาะของ FIP แบบเปียก"
  },

  // Case 6: Neurological Dog
  {
    id: "c_rabies",
    chapter: 10,
    title: "เคสที่ 06: สุนัขมีพฤติกรรมเปลี่ยน ขากรรไกรตก น้ำลายไหลยืด",
    species: "สุนัข (Canine)",
    history: "สุนัขไทย อายุ 2 ปี เลี้ยงปล่อยนอกบ้าน ไม่เคยฉีดวัคซีน มีประวัติถูกสุนัขจรจัดกัดเมื่อ 1 เดือนก่อน เริ่มมีพฤติกรรมเปลี่ยน ดุร้าย กัดสิ่งของ จากนั้นขากรรไกรล่างตก กลืนน้ำไม่ได้ น้ำลายไหลตลอดเวลา และตายในวันที่ 5",
    symptoms: ["พฤติกรรมก้าวร้าวสลับซึม", "ขากรรไกรล่างตกอ้าปากค้าง (Dropped jaw)", "น้ำลายไหลยืดตลอดเวลา กลืนลำบาก", "อัมพาตขาหลังและเสียชีวิต"],
    laboratoryResults: "รอยพิมพ์สมองส่วน Hippocampus ย้อม Direct Fluorescent Antibody (DFA) พบแอนติเจนเรืองแสงสีเขียวของ Rhabdovirus ชัดเจน",
    choices: [
      "Rabies Virus (Lyssavirus)",
      "Canine Distemper Virus (CDV)",
      "บาดทะยัก (Tetanus)",
      "Canine Adenovirus-1"
    ],
    answer: "Rabies Virus (Lyssavirus)",
    explanation: "อาการทางประสาทพฤติกรรมเปลี่ยน ขากรรไกรตก (Dropped jaw) ร่วมกับผลบวก DFA ในสมองส่วน Hippocampus เป็นการยืนยันโรคพิษสุนัขบ้า (Rabies) อย่างสมบูรณ์"
  },

  // Case 7: Ruminant Vesicular Disease
  {
    id: "c_fmd",
    chapter: 13,
    title: "เคสที่ 07: โคนมน้ำลายไหลยืดเป็นฟอง กีบแตกเดินกะเผลก",
    species: "โค (Bovine)",
    history: "ฟาร์มโคนมพบโคนมหลายตัวมีไข้สูง น้ำนมลดฮวบ น้ำลายไหลยืดเป็นสายยาวส่งเสียงเคี้ยวปากดังจุ๊บจั๊บ มีตุ่มน้ำใสที่ริมฝีปากและไรกีบ เมื่อตุ่มแตกกลายเป็นแผลหลุมลึก โคเดินกะเผลก ม้าในคอกข้างเคียงไม่มีอาการใดๆ",
    symptoms: ["ไข้สูง (40.8°C)", "น้ำลายไหลยืดเป็นฟองยาว", "ตุ่มน้ำใสที่เหงือก ลิ้น และไรกีบเท้า", "ขากะเผลก นอนไม่ยอมลุก"],
    laboratoryResults: "เก็บตัวอย่างเนื้อเยื่อเยื่อบุตุ่มน้ำส่งตรวจ RT-PCR พบสารพันธุกรรมของ Aphtovirus serotype O",
    choices: [
      "Foot and Mouth Disease Virus (FMDV)",
      "Vesicular Stomatitis Virus (VSV)",
      "Bovine Viral Diarrhea Virus (BVDV)",
      "Malignant Catarrhal Fever (MCF)"
    ],
    answer: "Foot and Mouth Disease Virus (FMDV)",
    explanation: "ตุ่มน้ำใสที่ปากและกีบในโคนม ร่วมกับน้ำลายไหลยืดเป็นฟอง และม้าข้างเคียงไม่ติดโรค ชี้ชัดว่าเป็นโรคปากและเท้าเปื่อย (FMD) ซึ่งเกิดจากเชื้อ Aphtovirus"
  },

  // Case 8: Canine Hard Pad & Twitching
  {
    id: "c_cdv",
    chapter: 7,
    title: "เคสที่ 08: สุนัขขี้ตาเขียวเกรอะ ฝ่าเท้าหนาแข็ง กล้ามเนื้อขากระตุก",
    species: "สุนัข (Canine)",
    history: "สุนัขพันธุ์ทาง อายุ 6 เดือน เริ่มต้นด้วยอาการไข้ ขี้ตาและน้ำมูกข้นเขียว ไอ ปอดบวม ต่อมาฝ่าเท้าและปลายจมูกหนาแข็งแห้งแตก และมีอาการกล้ามเนื้อขากระตุกเป็นจังหวะต่อเนื่องแม้ขณะหลับ",
    symptoms: ["ขี้ตาและน้ำมูกหนองเขียว (Mucopurulent discharge)", "ฝ่าเท้าหนาแข็งแตก (Hard pad disease)", "กล้ามเนื้อกระตุกเป็นจังหวะ (Myoclonus)", "อาการชักเคี้ยวฟัน"],
    laboratoryResults: "ตรวจรอยพิมพ์เยื่อตาขาวพบ Eosinophilic inclusion bodies ทั้งในนิวเคลียสและไซโทพลาสซึม RT-PCR พบ Morbillivirus",
    choices: [
      "Canine Distemper Virus (CDV)",
      "Rabies Virus",
      "Canine Parvovirus",
      "Bordetella bronchiseptica"
    ],
    answer: "Canine Distemper Virus (CDV)",
    explanation: "อาการ Hard pad (Hyperkeratosis) ร่วมกับขี้ตาเขียว และกล้ามเนื้อกระตุกเป็นจังหวะ (Myoclonus) เป็นอาการคลาสสิกของโรคไข้หัดสุนัข (Canine Distemper Virus)"
  },

  // Case 9: Equine Swamp Fever
  {
    id: "c_eia",
    chapter: 6,
    title: "เคสที่ 09: ม้าแข่งไข้ขึ้นๆ ลงๆ ซีดผอม บวมน้ำที่หน้าท้อง",
    species: "ม้า (Equine)",
    history: "ม้าแข่งอายุ 5 ปี เลี้ยงในพื้นที่ลุ่มน้ำมีแมลงดูดเลือดชุกชุม ม้ามีไข้เป็นๆ หายๆ ซีดลงเรื่อยๆ เหนื่อยง่าย น้ำหนักลด และเริ่มมีอาการบวมน้ำที่ใต้ท้องและขาหลัง",
    symptoms: ["ไข้ขึ้นลงเป็นระยะ (Recurrent fever)", "เยื่อเมือกซีดขาว (Severe anemia)", "ดีซ่านและจุดเลือดออกที่ลิ้น", "บวมน้ำที่หน้าท้องและขา (Ventral edema)"],
    laboratoryResults: "ตรวจซีรั่มด้วยวิธี Coggins test (Agar Gel Immunodiffusion) เกิดเส้นตกตะกอนร่วมกับแอนติเจน p26 ของ Lentivirus ชัดเจน",
    choices: [
      "Equine Infectious Anemia Virus (EIAV)",
      "African Horse Sickness Virus (AHSV)",
      "Equine Influenza Virus (EIV)",
      "Babesia caballi (พยาธิในเม็ดเลือด)"
    ],
    answer: "Equine Infectious Anemia Virus (EIAV)",
    explanation: "ไข้เป็นๆ หายๆ โลหิตจาง บวมน้ำใต้ท้อง ร่วมกับผล Coggins test เป็นบวก ยืนยันโรคโลหิตจางติดต่อในม้า (Equine Infectious Anemia / Swamp fever)"
  },

  // Case 10: Bovine Nodular Skin Lesions
  {
    id: "c_lsd",
    chapter: 5,
    title: "เคสที่ 10: โคเนื้อมีตุ่มนูนแข็งทั่วตัว และต่อมน้ำเหลืองโต",
    species: "โค (Bovine)",
    history: "โคเนื้อในฟาร์มมีไข้สูง 41°C ต่อมามีตุ่มนูนกลมแข็งขนาด 2-5 ซม. ผุดขึ้นกระจายทั่วผิวหนังลำตัว คอ เต้านม และฝีเย็บ ต่อมน้ำเหลืองพรีสแคปูลาร์บวมโตคลำได้ชัดเจน แมลงวันดูดเลือดในคอกชุกชุมมาก",
    symptoms: ["ไข้สูง เบื่ออาหาร", "ตุ่มกลมนูนแข็ง (Nodules) ทั่วตัว", "ต่อมน้ำเหลืองก่อนสะบักขยายใหญ่มาก", "ตุ่มตรงกลางเริ่มแห้งบุ๋มเป็นสะเก็ดหลุม (Sit-fast)"],
    laboratoryResults: "ตัดชิ้นเนื้อตุ่มผิวหนังส่งตรวจ PCR พบยีนของ Capripoxvirus ย้อมชิ้นเนื้อพบ Intracytoplasmic inclusion bodies",
    choices: [
      "Lumpy Skin Disease Virus (LSDV)",
      "Bovine Papillomatosis (หูด)",
      "Foot and Mouth Disease Virus",
      "ขี้เรื้อน Demodex"
    ],
    answer: "Lumpy Skin Disease Virus (LSDV)",
    explanation: "ตุ่มนูนแข็งทั่วตัวในโค ต่อมน้ำเหลืองโต และรอยโรค Sit-fast ร่วมกับการตรวจพบ Capripoxvirus ยืนยันโรคลัมปีสกิน (Lumpy Skin Disease)"
  },

  // Case 11: Feline Retro-Co-infection
  {
    id: "c_felv_fiv",
    chapter: 6,
    title: "เคสที่ 11: แมวผอมแห้งเหงือกซีด มีแผลในปากเรื้อรังไม่หาย",
    species: "แมว (Feline)",
    history: "แมวไทยเพศผู้ อายุ 4 ปี มีประวัติชอบออกไปเที่ยวนอกบ้าน มีแผลถูกกัดเรื้อรัง มาด้วยอาการซึม เบื่ออาหาร เหงือกซีด มีแผลเปื่อยในช่องปากไม่หายและต่อมน้ำเหลืองโตทั่วตัว",
    symptoms: ["ซีดขาว (Non-regenerative anemia)", "ช่องปากอักเสบเรื้อรัง (Gingivostomatitis)", "ต่อมน้ำเหลืองบวมโต", "ผอมหนังหุ้มกระดูก ติดเชื้อแทรกซ้อนง่าย"],
    laboratoryResults: "ชุดตรวจเร็ว SNAP Combo Test จากเลือด พบผลบวกต่อทั้ง FeLV Antigen (p27) และ FIV Antibody",
    choices: [
      "Co-infection: FeLV (Retrovirus) และ FIV (Lentivirus)",
      "Feline Infectious Peritonitis (FIP)",
      "Feline Panleukopenia Virus (FPV)",
      "Feline Calicivirus (FCV)"
    ],
    answer: "Co-infection: FeLV (Retrovirus) และ FIV (Lentivirus)",
    explanation: "การติดเชื้อร่วมระหว่าง FeLV และ FIV (Retroviridae) มักพบในแมวนอกบ้านที่ชอบกัดกัน ก่อให้เกิดภาวะภูมิคุ้มกันบกพร่อง โลหิตจาง และช่องปากอักเสบเรื้อรัง"
  },

  // Case 12: Chicken Paralyzed with Split Legs
  {
    id: "c_marek",
    chapter: 4,
    title: "เคสที่ 12: ไก่เนื้อขาเป็นอัมพาต ท่าเหยียดขาข้างหนึ่งไปหน้าข้างหนึ่งไปหลัง",
    species: "ไก่ (Avian)",
    history: "ไก่ไข่รุ่นอายุ 12 สัปดาห์ มีอาการขาอ่อนแรง ทยอยเป็นอัมพาต ไก่หลายตัวแสดงท่านอนเหยียดขาข้างหนึ่งไปข้างหน้าและอีกข้างหนึ่งชี้ไปข้างหลัง ปีกตก คลำพบเส้นประสาทขาบวมโต",
    symptoms: ["อัมพาตขาและปีก", "ท่าเอกลักษณ์ขาชี้หน้าหลัง (One leg forward, one leg backward)", "ม่านตาเปลี่ยนเป็นสีเทาขุ่น (Grey eye)", "ผอมแห้งกินอาหารไม่ได้"],
    laboratoryResults: "ผ่าซากพบเส้นประสาท Sciatic nerve บวมขยายใหญ่กว่าปกติ 3 เท่า สูญเสียลายขวาง ตรวจทางจุลพยาธิวิทยาพบ T-lymphoma แทรกตัว",
    choices: [
      "Marek's Disease Virus (MDV)",
      "Avian Leukosis Virus (ALV)",
      "Infectious Bursal Disease (IBDV)",
      "โรคขาดวิตามิน B2 (Riboflavin deficiency)"
    ],
    answer: "Marek's Disease Virus (MDV)",
    explanation: "ท่าขาเหยียดหน้าหลังร่วมกับเส้นประสาท Sciatic nerve ขยายใหญ่จากการแทรกตัวของเนื้องอก T-lymphoma เป็นลักษณะจำเพาะของโรคมาเร็กซ์ (Marek's Disease Virus)"
  },

  // Case 13: Bovine Mucosal Disease (PI Calf)
  {
    id: "c_bvd_md",
    chapter: 11,
    title: "เคสที่ 13: โคสาวแคระแกร็น ท้องเสียรุนแรง มีแผลเปื่อยลึกตลอดทางเดินอาหาร",
    species: "โค (Bovine)",
    history: "โคสาวอายุ 15 เดือน มีประวัติตัวแคระแกร็นโตช้ากว่าเพื่อนในรุ่น เกิดอาการไข้สูง ท้องเสียถ่ายเป็นน้ำพุ่งปนเยื่อเมือกและเลือด น้ำลายไหล มีแผลหลุมลึกที่ริมฝีปาก เหงือก ลิ้น และกีบเท้า และตายในวันที่ 7",
    symptoms: ["ท้องเสียถ่ายเป็นน้ำพุ่งปนเลือดและเมือก", "แผลหลุมลึกเปื่อยลอก (Erosions/Ulcers) ตลอดทางเดินอาหาร", "น้ำลายไหลยืด ตาแฉะ", "กีบอักเสบเดินกะเผลก"],
    laboratoryResults: "ผ่าซากพบ Peyer's patches ในลำไส้เล็กตายเน่าเปื่อยเป็นแถบ ชิ้นเนื้อผิวหนังใบหู (Ear notch) ตรวจพบ BVDV antigen",
    choices: [
      "BVDV Mucosal Disease (ในโคที่เป็น PI)",
      "Foot and Mouth Disease (FMD)",
      "Rinderpest",
      "Salmonellosis"
    ],
    answer: "BVDV Mucosal Disease (ในโคที่เป็น PI)",
    explanation: "อาการรอยโรคแผลเปื่อยลึกตลอดทางเดินอาหารและ Peyer's patches เน่าเปื่อยในโคแคระแกร็นที่เป็น PI ชี้ชัดว่าเป็นโรค Mucosal Disease จาก BVDV"
  },

  // Case 14: Equine Frothy Nasal Discharge
  {
    id: "c_ahsv",
    chapter: 12,
    title: "เคสที่ 14: ม้าตายเฉียบพลัน มีฟองน้ำขาวฟอดไหลทะลักออกจากรูจมูก",
    species: "ม้า (Equine)",
    history: "ม้าในคอกเกิดอาการไข้สูง หายใจหอบอย่างหนัก ยืดคออ้าปากหายใจ และล้มลงตายภายในเวลาไม่กี่ชั่วโมง มีฟองโฟมสีขาวข้นทะลักออกจากรูจมูกทั้งสองข้าง คอกม้าตั้งอยู่ใกล้แหล่งน้ำและมีริ้นชุกชุม",
    symptoms: ["ไข้สูง 41°C", "หายใจลำบากอ้าปากหายใจ (Severe dyspnea)", "ฟองน้ำท่วมปอดทะลักออกรูจมูก (Frothy discharge)", "ตายเฉียบพลันรวดเร็ว"],
    laboratoryResults: "ผ่าซากพบน้ำท่วมปอดรุนแรงมาก (Severe pulmonary edema) ปอดไม่ยุบตัว น้ำคั่งในช่องอก ตรวจ RT-PCR ยืนยันเชื้อ Orbivirus",
    choices: [
      "African Horse Sickness Virus (AHSV - Dunkop form)",
      "Equine Influenza Virus (EIV)",
      "Equine Viral Arteritis (EAV)",
      "Anthrax (โรคกาลี)"
    ],
    answer: "African Horse Sickness Virus (AHSV - Dunkop form)",
    explanation: "ม้าตายเฉียบพลันจาก Severe pulmonary edema พร้อมฟองน้ำฟอดทะลักออกจากรูจมูกในพื้นที่ที่มีริ้น Culicoides เป็นลักษณะคลาสสิกของโรคกาฬโรคม้า (African Horse Sickness แบบ Dunkop)"
  },

  // Case 15: Piglet Starvation Diarrhea
  {
    id: "c_ped",
    chapter: 9,
    title: "เคสที่ 15: ลูกสุกรแรกเกิดอาเจียนและท้องเสียน้ำพุ่งตายเกือบ 100%",
    species: "สุกร (Porcine)",
    history: "เล้าคลอดสุกรพบลูกสุกรอายุ 3-5 วันเริ่มอาเจียนพร้อมกัน จากนั้นถ่ายเหลวเป็นน้ำสีเหลืองพุ่งปนลิ่มน้ำนม กลิ่นเปรี้ยว ลูกสุกรนอนสุมกันเพราะหนาวสั่นและทยอยตายหมดทั้งคอกภายใน 3 วัน",
    symptoms: ["อาเจียนนม", "ท้องเสียเป็นน้ำพุ่งเฉียบพลัน (Watery diarrhea)", "ขาดน้ำรุนแรง ผิวหนังเหี่ยวย่น", "ลูกสุกรดูดนมตายเกือบ 100%"],
    laboratoryResults: "ผ่าซากพบลำไส้เล็กบางใสมีแก๊สและน้ำเหลืองเต็มลำไส้ ส่องกล้องพบ Villus atrophy กุดสั้นอย่างหนัก RT-PCR พบ Alphacoronavirus",
    choices: [
      "Porcine Epidemic Diarrhea Virus (PEDV)",
      "Rotavirus",
      "Clostridium perfringens type C",
      "E. coli (ETEC)"
    ],
    answer: "Porcine Epidemic Diarrhea Virus (PEDV)",
    explanation: "การระบาดของอาการอาเจียนและท้องเสียน้ำพุ่งในลูกสุกรแรกเกิดที่มีอัตราตายเกือบ 100% ร่วมกับผนังลำไส้บางใสและ Villus atrophy ยืนยันโรคท้องเสียระบาดในสุกร (PEDV)"
  },

  // Case 16: Dog Corneal Opacity
  {
    id: "c_cav1",
    chapter: 3,
    title: "เคสที่ 16: สุนัขมีไข้ ตับโต ดีซ่าน และกระจกตาขุ่นเป็นสีฟ้า",
    species: "สุนัข (Canine)",
    history: "สุนัขวัยรุ่นอายุ 8 เดือน ป่วยด้วยอาการไข้ ซึม อาเจียน ท้องเสีย คลำพบตับขยายใหญ่ ปวดช่องท้อง มีภาวะดีซ่าน หลังเริ่มฟื้นตัวพบกระจกตาทั้งสองข้างขุ่นมัวกลายเป็นสีฟ้า",
    symptoms: ["ไข้สูง ตับโต (Hepatomegaly)", "ดีซ่าน (Jaundice)", "กระจกตาบวมขุ่นสีฟ้า (Blue eye)", "จุดเลือดออกตามเยื่อเมือก"],
    laboratoryResults: "ค่าเอนไซม์ตับ ALT และ Total bilirubin พุ่งสูงมาก ตรวจ PCR พบ Canine Adenovirus type 1",
    choices: [
      "Canine Adenovirus type 1 (CAV-1 / ICH)",
      "Canine Parvovirus (CPV-2)",
      "Leptospirosis",
      "Canine Distemper Virus (CDV)"
    ],
    answer: "Canine Adenovirus type 1 (CAV-1 / ICH)",
    explanation: "โรคตับอักเสบติดต่อในสุนัข (ICH จาก CAV-1) แสดงอาการตับโต ดีซ่าน ร่วมกับปรากฏการณ์ Blue eye (Corneal edema จาก Immune complex) หลังการติดเชื้อ"
  },

  // Case 17: Feline Oral Pain
  {
    id: "c_fcv",
    chapter: 13,
    title: "เคสที่ 17: แมวน้ำลายไหลยืด มีแผลหลุมลึกที่ลิ้นและเพดานปาก",
    species: "แมว (Feline)",
    history: "แมวไทย อายุ 2 ปี มีอาการน้ำลายไหลยืดเปรอะคาง เจ็บปากไม่ยอมกินอาหาร มีไข้ อ้าปากตรวจพบแผลหลุมลึกสีแดง (Vesicles rupture into ulcers) ที่ขอบลิ้นและเพดานปาก",
    symptoms: ["น้ำลายไหลยืด (Hypersalivation)", "แผลหลุมลึกที่ขอบลิ้นและเพดานปาก (Oral ulceration)", "ไข้ ซึม เบื่ออาหาร", "ไม่มีแผลที่กระจกตา"],
    laboratoryResults: "ป้าย Swab จากแผลในปากส่งตรวจ RT-PCR พบสารพันธุกรรมของ Vesivirus (Caliciviridae)",
    choices: [
      "Feline Calicivirus (FCV)",
      "Feline Herpesvirus-1 (FHV-1)",
      "Feline Panleukopenia Virus",
      "โรคไตวายเรื้อรังจากยูเรียคั่ง"
    ],
    answer: "Feline Calicivirus (FCV)",
    explanation: "แผลหลุมลึกในช่องปาก (Oral ulceration) โดยเฉพาะที่ลิ้น ร่วมกับน้ำลายไหลยืดในแมว เป็นลักษณะเด่นของ Feline Calicivirus (FCV)"
  },

  // Case 18: Duck Nervous Disease
  {
    id: "c_tembusu",
    chapter: 11,
    title: "เคสที่ 18: เป็ดไข่ผลผลิตไข่ลดฮวบ เดินเซ ขาเป็นอัมพาต",
    species: "เป็ด (Avian/Duck)",
    history: "ฟาร์มเป็ดไข่พบผลผลิตไข่ลดลงอย่างรวดเร็วจาก 85% เหลือเพียง 10% ภายในสัปดาห์เดียว เป็ดเริ่มแสดงอาการทางประสาท เดินโซเซ ขาอ่อนแรงล้มลง และรังไข่มีเลือดออก",
    symptoms: ["ไข่ลดเฉียบพลัน (Egg drop)", "เดินเซ ขาเป็นอัมพาต (Ataxia & paresis)", "ซึม ไม่กินอาหาร", "รังไข่อักเสบเน่า"],
    laboratoryResults: "ผ่าซากพบรังไข่ตกเลือด ฟอลลิเคิลไข่แดงแตกสลายในช่องท้อง ตรวจ RT-PCR พบเชื้อ Flavivirus สายพันธุ์ Tembusu",
    choices: [
      "Duck Tembusu Virus (DTMUV)",
      "Duck Viral Enteritis (Duck Plague)",
      "Avian Influenza",
      "Newcastle Disease"
    ],
    answer: "Duck Tembusu Virus (DTMUV)",
    explanation: "อาการไข่ลดฮวบเฉียบพลัน ร่วมกับอาการทางประสาทขาอ่อนแรงและรังไข่ตกเลือดในเป็ดไข่ เป็นลักษณะเด่นของ Duck Tembusu Virus (Flaviviridae)"
  },

  // Case 19: Horse Staggering & Muscle Tremor
  {
    id: "c_wnv",
    chapter: 11,
    title: "เคสที่ 19: ม้าเดินเซโซเซ กล้ามเนื้อปากกระตุก หลังถูกยุงกัดชุกชุม",
    species: "ม้า (Equine)",
    history: "ม้าขี่อายุ 7 ปีในฤดูฝนที่มีประชากรยุงชุกชุม ม้ามีไข้ เดินเซโซเซ ขาหลังปัดไปมา (Ataxia) กล้ามเนื้อบริเวณริมฝีปากและใบหน้ากระตุก ไวต่อเสียงและสัมผัสผิดปกติ",
    symptoms: ["เดินเซโซเซ ขาอ่อนแรง (Ataxia)", "กล้ามเนื้อใบหน้าและปากกระตุก (Muscle fasciculations)", "ไข้ ซึม เซื่องซึม", "ล้มลงนอนลุกไม่ขึ้น"],
    laboratoryResults: "ตรวจน้ำไขสันหลัง (CSF) และซีรั่มพบ IgM Capture ELISA ให้ผลบวกต่อ West Nile Virus",
    choices: [
      "West Nile Virus (WNV)",
      "Rabies Virus",
      "Equine Protozoal Myeloencephalitis (EPM)",
      "Tetanus"
    ],
    answer: "West Nile Virus (WNV)",
    explanation: "อาการสมองอักเสบ เดินเซ ขาหลังปัด และกล้ามเนื้อใบหน้ากระตุกในม้าช่วงฤดูยุงชุม ร่วมกับผล IgM Capture ELISA เป็นบวก บ่งชี้การติดเชื้อ West Nile Virus"
  },

  // Case 20: Piglet PMWS Wasting
  {
    id: "c_pcv2",
    chapter: 14,
    title: "เคสที่ 20: สุกรหย่านมผอมแห้ง ขนหยาบ ต่อมน้ำเหลืองโตทั่วตัว",
    species: "สุกร (Porcine)",
    history: "สุกรหลังหย่านมอายุ 8 สัปดาห์ ทยอยแสดงอาการตัวผอมแห้งกระดูกโผล่ โตช้า ขนหยาบ ซีด หายใจลำบาก คลำพบต่อมน้ำเหลืองหลังขาหนีบ (Inguinal LN) บวมโตขนาดเท่ากำปั้น",
    symptoms: ["ผอมโซแคระแกร็น (Wasting)", "ต่อมน้ำเหลืองโตทั่วตัว (Lymphadenopathy)", "หายใจลำบาก ปอดอักเสบ", "ดีซ่านและซีด"],
    laboratoryResults: "ตรวจจุลพยาธิวิทยาของต่อมน้ำเหลืองพบ Lymphoid depletion และพบ Botryoid inclusion bodies รูปพวงองุ่นในไซโทพลาสซึม qPCR พบ PCV2 ปริมาณสูง",
    choices: [
      "Porcine Circovirus type 2 (PCV2 / PMWS)",
      "PRRS Virus",
      "Mycoplasma hyopneumoniae",
      "Swine Dysentery"
    ],
    answer: "Porcine Circovirus type 2 (PCV2 / PMWS)",
    explanation: "กลุ่มอาการผอมแห้งหลังหย่านม (PMWS) ร่วมกับต่อมน้ำเหลืองโตทั่วตัว รอยโรค Lymphoid depletion และ Botryoid inclusions ยืนยันการติดเชื้อ PCV2"
  },

  // Case 21: Chicken Wrinkled Eggs
  {
    id: "c_ibv",
    chapter: 9,
    title: "เคสที่ 21: ไก่ไข่หายใจเสียงหวีด เปลือกไข่ย่นขรุขระและไข่ขาวเหลว",
    species: "ไก่ (Avian)",
    history: "ฝูงไก่ไข่มีอาการไอ จาม หายใจมีเสียงดังหวีด จากนั้นผลผลิตไข่ลดลงอย่างรวดเร็ว ไข่ที่ได้มีเปลือกบาง ผิดรูป เปลือกย่นเป็นริ้วขรุขระ และไข่ขาวเหลวเป็นน้ำ",
    symptoms: ["หายใจเสียงหวีด ไอ จาม", "ผลผลิตไข่ตกฮวบ", "เปลือกไข่บาง ผิดรูป ขรุขระย่น (Wrinkled eggs)", "ไข่ขาวเหลวเป็นน้ำ (Watery albumen)"],
    laboratoryResults: "ผ่าซากพบไตบวมขาวมีผลึกกรดยูริกคั่ง (Nephropathogenic lesion) RT-PCR ยืนยัน Infectious Bronchitis Virus (Gammacoronavirus)",
    choices: [
      "Infectious Bronchitis Virus (IBV)",
      "Newcastle Disease Virus",
      "Egg Drop Syndrome '76 (EDS)",
      "Infectious Laryngotracheitis"
    ],
    answer: "Infectious Bronchitis Virus (IBV)",
    explanation: "ไข่เปลือกย่นเป็นริ้ว (Wrinkled egg) ไข่ขาวเหลว ร่วมกับอาการทางเดินหายใจและไตมีกรดยูริกคั่งในไก่ไข่ เป็นลักษณะเด่นของ Infectious Bronchitis Virus (IBV)"
  },

  // Case 22: Young Chicken Bursal Hemorrhage
  {
    id: "c_ibdv",
    chapter: 10,
    title: "เคสที่ 22: ลูกไก่ซึม ท้องเสียสีขาว ถุงเบอร์ซาบวมเป่งมีเลือดออก",
    species: "ไก่ (Avian)",
    history: "ลูกไก่อายุ 4 สัปดาห์ มีอาการซึม ขนยุ่ง นอนสุม ท้องเสียถ่ายเป็นน้ำสีขาวขุ่นเปรอะก้น จิกก้นตัวเอง และทยอยตายอย่างรวดเร็ว",
    symptoms: ["ซึม ขนพอง นอนสุม", "อุจจาระร่วงสีขาวขุ่น (White watery diarrhea)", "กล้ามเนื้ออกและขามีจุดเลือดออกเป็นริ้ว", "ถุงเบอร์ซาบวมเป่ง"],
    laboratoryResults: "ผ่าซากพบ Bursa of Fabricius บวมขยายใหญ่มีเมือกสีเหลืองขี้ผึ้งและจุดเลือดออกเต็มถุง ตรวจพบจีโนม dsRNA 2 ท่อนของ Birnavirus",
    choices: [
      "Infectious Bursal Disease Virus (IBDV / Gumboro)",
      "Coccidiosis (บิด)",
      "Salmonella Pullorum",
      "Avian Encephalomyelitis"
    ],
    answer: "Infectious Bursal Disease Virus (IBDV / Gumboro)",
    explanation: "Bursa of Fabricius บวมโตมีเลือดออกในลูกไก่อายุ 3-6 สัปดาห์ ร่วมกับจุดเลือดออกที่กล้ามเนื้อต้นขา เป็นรอยโรคเฉพาะของโรคกัมโบโร (IBDV)"
  },

  // Case 23: Sheep Itching & Scrapie
  {
    id: "c_scrapie",
    chapter: 15,
    title: "เคสที่ 23: แกะคันทรมานเอาตัวถูกับเสาจนขนร่วง เดินเซ",
    species: "แกะ (Ovine)",
    history: "แกะโตอายุ 3 ปี เริ่มมีพฤติกรรมเปลี่ยน หวาดระแวง และมีอาการคันอย่างรุนแรงจนเอาตัวไปถูกับเสาและรั้วคอกตลอดเวลาจนขนร่วงหลุดเป็นแถบ ต่อมาเดินเซ กล้ามเนื้อสั่น และล้มลง",
    symptoms: ["คันรุนแรงจนถูตัวขนร่วง (Pruritus/Scraping)", "เดินเซ สั่นกระตุก (Ataxia & tremors)", "พฤติกรรมตื่นตกใจง่าย", "สมองเสื่อมผอมแห้ง"],
    laboratoryResults: "ตรวจเนื้อเยื่อก้านสมอง (Obex) ด้วยวิธี IHC และ Western blot พบโปรตีนพรีออน PrPSc ทนต่อ Protease K",
    choices: [
      "Scrapie (Prion disease)",
      "ขี้เรื้อน Psoroptes ovis",
      "Rabies Virus",
      "Listeriosis"
    ],
    answer: "Scrapie (Prion disease)",
    explanation: "พฤติกรรมคันจนถูขนร่วง (Scraping) ร่วมกับอาการทางประสาทเดินเซ และการตรวจพบโปรตีน PrPSc ในเนื้อเยื่อสมอง Obex ยืนยันโรค Scrapie ในแกะ"
  },

  // Case 24: Bovine Red Nose Respiratory
  {
    id: "c_ibr",
    chapter: 4,
    title: "เคสที่ 24: โคเนื้อเยื่อบุจมูกแดงคล้ำเป็นเนื้อตาย ไอแห้ง ตาอักเสบ",
    species: "โค (Bovine)",
    history: "โคขุนนำเข้าใหม่มีไข้สูง ซึม ไอ มีน้ำมูกข้นปนหนอง ส่องดูเยื่อบุจมูกพบการอักเสบเป็นเนื้อตายสีแดงคล้ำชัดเจน (Red nose) และเยื่อบุตาขาวอักเสบแดงบวมน้ำ",
    symptoms: ["เยื่อบุจมูกแดงคล้ำมีเนื้อตาย (Red nose)", "ไข้สูง ไอ น้ำมูกหนอง", "เยื่อตาขาวอักเสบ (Conjunctivitis)", "น้ำนมลด แม่โคอุ้มท้องแท้ง"],
    laboratoryResults: "ป้ายสิ่งคัดหลั่งโพรงจมูกตรวจ PCR พบ Bovine Alphaherpesvirus 1 (BoHV-1)",
    choices: [
      "Infectious Bovine Rhinotracheitis (IBR / BoHV-1)",
      "Bovine Respiratory Syncytial Virus (BRSV)",
      "Foot and Mouth Disease",
      "Pasturellosis"
    ],
    answer: "Infectious Bovine Rhinotracheitis (IBR / BoHV-1)",
    explanation: "ลักษณะเยื่อบุจมูกอักเสบแดงจัดเป็นเนื้อตาย (Red nose) ร่วมกับตาแดง ไอ และผลตรวจพบ BoHV-1 ชี้ชัดว่าเป็นโรค IBR"
  },

  // Case 25: Cow with Blue Ear-like Mucosal Ulcers
  {
    id: "c_mcf",
    chapter: 4,
    title: "เคสที่ 25: กระบือตาขุ่นขาวจากขอบเข้ากลาง ไข้สูง น้ำมูกน้ำลายไหลพราก",
    species: "กระบือ (Bubaline/Bovine)",
    history: "กระบือปลักเลี้ยงรวมกับฝูงแกะ เกิดอาการไข้สูงมาก ซึม ต่อมน้ำเหลืองโตทั่วตัว กระจกตาเริ่มขุ่นขาวจากขอบนอกลามเข้าสู่จุดกึ่งกลางทั้งสองข้าง น้ำมูกหนองไหลเกรอะกรัง และตายในวันที่ 10",
    symptoms: ["ไข้สูงจัด (41.5°C)", "กระจกตาขุ่นขาวจากขอบเข้ากลาง (Centripetal corneal opacity)", "น้ำมูกข้นหนองไหลพราก", "แผลเปื่อยในช่องปาก ต่อมน้ำเหลืองโตมาก"],
    laboratoryResults: "ผ่าซากพบ Severe systemic necrotizing vasculitis ตรวจ PCR พบ Ovine Herpesvirus 2 (OvHV-2)",
    choices: [
      "Malignant Catarrhal Fever (MCF)",
      "Bovine Viral Diarrhea (BVDV)",
      "Infectious Bovine Rhinotracheitis (IBR)",
      "Rinderpest"
    ],
    answer: "Malignant Catarrhal Fever (MCF)",
    explanation: "ประวัติเลี้ยงร่วมกับแกะ, กระจกตาขุ่นขาวลามจากขอบเข้ากลาง (Centripetal keratitis) และต่อมน้ำเหลืองโตจัดจากการเกิด Necrotizing vasculitis เป็นลักษณะเฉพาะของ MCF"
  },

  // Case 26: Dog Bloody Diarrhea vs Yellow Water
  {
    id: "c_ccov_cpv",
    chapter: 9,
    title: "เคสที่ 26: ลูกสุนัขท้องเสียถ่ายเป็นน้ำสีส้มเหลือง ซึมเล็กน้อย เม็ดเลือดขาวปกติ",
    species: "สุนัข (Canine)",
    history: "ลูกสุนัขพันธุ์ปอมเมอเรเนียน อายุ 4 เดือน ถ่ายเหลวเป็นน้ำสีส้มเหลือง มีกลิ่นคาวเปรี้ยว ซึมเล็กน้อย แต่ยังยอมเลียกินน้ำ เม็ดเลือดขาวปกติ ไม่มีภาวะ Leukopenia และ SNAP Parvo ให้ผลลบ",
    symptoms: ["ท้องเสียถ่ายเป็นน้ำสีส้มเหลือง", "ซึมเล็กน้อย ไม่ขาดน้ำรุนแรง", "ไม่มีเลือดสดปนในอุจจาระ", "เม็ดเลือดขาวอยู่ในเกณฑ์ปกติ"],
    laboratoryResults: "RT-PCR จากอุจจาระให้ผลบวกต่อ Canine Coronavirus (CCoV) แต่ให้ผลลบต่อ CPV-2",
    choices: [
      "Canine Coronavirus (CCoV)",
      "Canine Parvovirus (CPV-2)",
      "Canine Distemper Virus (CDV)",
      "Giardia lamblia"
    ],
    answer: "Canine Coronavirus (CCoV)",
    explanation: "อาการท้องเสียถ่ายเป็นน้ำสีส้มเหลืองโดยไม่มีเลือดสด เม็ดเลือดขาวไม่ต่ำ และ SNAP Parvo เป็นลบ แต่ PCR พบเชื้อ บ่งชี้การติดเชื้อ Canine Coronavirus (CCoV)"
  },

  // Case 27: Fowl Eye Lesion and Diphtheritic Membrane
  {
    id: "c_fowlpox",
    chapter: 5,
    title: "เคสที่ 27: ไก่ชนมีตุ่มหูดสะเก็ดน้ำตาลที่หงอน และมีแผ่นหนองอุดในคอ",
    species: "ไก่ (Avian)",
    history: "ไก่ชนมีตุ่มนูนแข็งคล้ายหูดสีน้ำตาลเข้มเกาะตามหงอน เหนียง และขอบตา ไก่บางตัวเริ่มหายใจลำบาก อ้าปากตรวจพบแผ่นเยื่อเนื้อตายสีเหลืองหนา (Diphtheritic membrane) อุดกั้นในช่องคอ",
    symptoms: ["ตุ่มสะเก็ดสีน้ำตาลบนหงอนเหนียง (Cutaneous/Dry form)", "แผ่นเยื่อหนองสีเหลืองในช่องปากและกล่องเสียง (Wet form)", "หายใจลำบาก สำลัก", "ตาเจ็บมีสะเก็ดปิดตา"],
    laboratoryResults: "ขูดสะเก็ดแผลย้อมพบ Bollinger bodies (Large intracytoplasmic inclusions) ในเซลล์เยื่อบุผิว",
    choices: [
      "Fowlpox Virus",
      "Infectious Laryngotracheitis",
      "Marek's Disease",
      "Avian Influenza"
    ],
    answer: "Fowlpox Virus",
    explanation: "ตุ่มสะเก็ดบนหงอนเหนียง (Dry pox) ร่วมกับแผ่นเยื่อหนองในช่องปาก (Wet pox) และการตรวจพบ Bollinger bodies ยืนยันโรคฝีดาษไก่ (Fowlpox Virus)"
  },

  // Case 28: Cat Stomatitis & Anemia
  {
    id: "c_fiv",
    chapter: 6,
    title: "เคสที่ 28: แมวตัวผู้มีประวัติชอบกัดกัน ปากเหม็นเน่า เหงือกอักเสบเรื้อรัง",
    species: "แมว (Feline)",
    history: "แมวเพศผู้ไม่ทำหมัน อายุ 6 ปี ชอบออกไปกัดกับแมวนอกบ้าน มาด้วยอาการปากเหม็นรุนแรง เหงือกอักเสบแดงเปื่อย (Stomatitis) มีไข้เรื้อรัง และน้ำหนักลดต่อเนื่อง",
    symptoms: ["ปากอักเสบเน่าเรื้อรัง (Severe Stomatitis/Gingivitis)", "ต่อมน้ำเหลืองโต", "น้ำหนักลด ขนหยาบกร้าน", "ประวัติถูกกัดบ่อยครั้ง"],
    laboratoryResults: "ตรวจเลือดด้วยชุดตรวจ ELISA พบ Antibody ต่อ Lentivirus p24/gp40 ชัดเจน การตรวจนับเม็ดเลือดพบอัตราส่วน CD4+:CD8+ ลดลงต่ำกว่า 0.5",
    choices: [
      "Feline Immunodeficiency Virus (FIV)",
      "Feline Infectious Peritonitis (FIP)",
      "โรคไตวายเรื้อรัง",
      "Feline Herpesvirus-1"
    ],
    answer: "Feline Immunodeficiency Virus (FIV)",
    explanation: "ประวัติแมวตัวผู้ชอบกัดกัน มีแผลช่องปากอักเสบเรื้อรัง (Stomatitis) ผลตรวจแอนติบอดีบวก และสัดส่วน CD4:CD8 ตกต่ำ เป็นลักษณะของโรคเอดส์แมว (FIV)"
  },

  // Case 29: Pig Sudden Trembling
  {
    id: "c_pseudorabies",
    chapter: 4,
    title: "เคสที่ 29: ลูกสุกรแรกเกิดมีไข้ ชักเกร็ง คอบิด และตายยกคอก",
    species: "สุกร (Porcine)",
    history: "ลูกสุกรดูดนมอายุ 1 สัปดาห์ แสดงอาการไข้สูง ซึม เดินโซเซ ตัวสั่น ชักเกร็ง ขาถีบจักรยาน คอบิดเกร็ง และตายเกือบทั้งหมดในคอก แม่สุกรมีประวัติแท้งลูกมัมมี่",
    symptoms: ["ชักเกร็ง คอบิด ขาถีบจักรยาน (Tremors & convulsions)", "ไข้สูง น้ำลายไหล", "ลูกสุกรดูดนมตายเกือบ 100%", "แม่สุกรแท้งและมีไข้"],
    laboratoryResults: "ผ่าซากพบรอยโรคเนื้อตายขนาดเล็ก (Focal necrosis) ที่ตับและม้าม ตรวจ PCR พบ Suid Alphaherpesvirus 1",
    choices: [
      "Pseudorabies Virus (Aujeszky's Disease)",
      "Classical Swine Fever Virus",
      "Japanese Encephalitis Virus",
      "Streptococcus suis"
    ],
    answer: "Pseudorabies Virus (Aujeszky's Disease)",
    explanation: "อาการทางประสาทชักเกร็งตายเฉียบพลันในลูกสุกรแรกเกิด ร่วมกับรอยโรค Focal necrosis ที่ตับและม้าม และการตรวจพบ Alphaherpesvirus ยืนยันโรคพิษสุนัขบ้าเทียม (Pseudorabies)"
  },

  // Case 30: Goat Big Knee Arthritic Swelling
  {
    id: "c_caev",
    chapter: 6,
    title: "เคสที่ 30: แพะนมโตเต็มวัย ข้อเข่าหน้าบวมโตผิดรูป เดินกะเผลกเรื้อรัง",
    species: "แพะ (Caprine)",
    history: "แพะนมเพศเมียอายุ 3 ปี มีอาการเดินกะเผลกเรื้อรัง ข้อเข่าหน้า (Carpal joints) ทั้งสองข้างบวมโตขึ้นเรื่อยๆ จนมีขนาดใหญ่ผิดรูป ไม่ยอมลุกยืน เต้านมแข็งกระด้างแต่น้ำนมไม่มีหนอง",
    symptoms: ["ข้อเข่าหน้าบวมโตผิดรูป (Big knee / Carpal arthritis)", "เดินกะเผลกเรื้อรัง (Lameness)", "เต้านมแข็งกระด้าง (Hard udder)", "น้ำหนักลดลงต่อเนื่อง"],
    laboratoryResults: "เจาะน้ำไขข้อพบเซลล์ Mononuclear สูงมาก ตรวจซีรั่มด้วย AGID test ให้ผลบวกต่อ Caprine Arthritis Encephalitis Virus",
    choices: [
      "Caprine Arthritis Encephalitis Virus (CAEV)",
      "Mycoplasma agalactiae",
      "Brucella melitensis",
      "Caseous Lymphadenitis (CLA)"
    ],
    answer: "Caprine Arthritis Encephalitis Virus (CAEV)",
    explanation: "ข้อเข่าหน้าบวมโตผิดรูป (Big knee) ร่วมกับเต้านมแข็ง (Hard udder) และผลบวกต่อการตรวจซีรั่มในแพะโต เป็นลักษณะของ Caprine Arthritis Encephalitis (CAEV)"
  },

  // Case 31: Duck Viral Enteritis (Duck Plague)
  {
    id: "c_duck_plague",
    chapter: 4,
    title: "เคสที่ 31: เป็ดไข่ตายเฉียบพลัน คอพับ มีจุดเลือดออกทั่วอวัยวะภายใน",
    species: "เป็ด (Anseriformes)",
    history: "ฟาร์มเป็ดไข่ริมคลองพบเป็ดทยอยตายเฉียบพลันวันละกว่า 100 ตัว ตัวป่วยมีไข้ ซึม ขนยุ่ง ดวงตากึ่งปิดมีน้ำตาเกรอะ ปีกตก คอพับ (Dropped wing & neck) ถ่ายเหลวสีเขียวปนเปื้อนเลือด และกระหายน้ำจัด",
    symptoms: ["คอพับ ปีกตก (Dropped neck and wings)", "ถ่ายเหลวสีเขียวปนเลือด กลิ่นเหม็น", "ตายเฉียบพลันจำนวนมาก", "เยื่อตาอักเสบมีเมือกเกรอะกรัง"],
    laboratoryResults: "ผ่าซากพบรอยโรคแผ่นเนื้อตาย Fibrinous/Diphtheritic membrane เป็นแนวยาวในหลอดอาหาร (Esophagus) และจุดเลือดออกรูปวงแหวน (Annular bands) ในลำไส้ ตรวจ PCR พบ Anatid Alphaherpesvirus 1",
    choices: [
      "Duck Viral Enteritis (Duck Plague / Anatid Alphaherpesvirus 1)",
      "Avian Cholera (Pasteurella multocida)",
      "Duck Viral Hepatitis (DHAV)",
      "Infectious Bursal Disease"
    ],
    answer: "Duck Viral Enteritis (Duck Plague / Anatid Alphaherpesvirus 1)",
    explanation: "อาการคอพับปีกตก ถ่ายเหลวสีเขียวปนเลือด รอยโรค Diphtheritic membrane ในหลอดอาหาร และ Annular hemorrhagic bands ในลำไส้ ร่วมกับผลตรวจ Herpesvirus ยืนยันโรคกาฬโรคเป็ด (Duck Plague)"
  },

  // Case 32: Swine Japanese Encephalitis
  {
    id: "c_je",
    chapter: 11,
    title: "เคสที่ 32: พ่อพันธุ์สุกรลูกอัณฑะบวมโตข้างเดียว แม่สุกรคลอดลูกมัมมี่",
    species: "สุกร (Porcine)",
    history: "ฟาร์มสุกรพ่อแม่พันธุ์ในช่วงฤดูฝนพบยุงรำคาญชุกชุมมาก พ่อพันธุ์สุกรหนุ่มเริ่มมีไข้ ซึม และลูกอัณฑะบวมโตข้างเดียวอย่างเห็นได้ชัด (Orchitis) ส่วนแม่สุกรท้องมีปัญหาคลอดลูกมัมมี่ขนาดต่างๆ ปนลูกตายแรกคลอด",
    symptoms: ["อัณฑะบวมโตข้างเดียว (Unilateral Orchitis)", "ความสมบูรณ์พันธุ์ลดลงฮวบ", "แม่สุกรคลอดลูกมัมมี่หลายขนาด", "ยุงรำคาญชุกชุมในฟาร์ม"],
    laboratoryResults: "ตรวจน้ำในช่องสมองลูกสุกรแรกเกิดที่ผิดรูปพบ Hydrocephalus และ Hypoplasia ของสมองน้อย ตรวจ RT-PCR ของเนื้อสมองพบเชื้อ Flavivirus ยืนยัน",
    choices: [
      "Japanese Encephalitis Virus (JEV)",
      "Porcine Parvovirus (PPV)",
      "Brucella suis",
      "Leptospira interrogans"
    ],
    answer: "Japanese Encephalitis Virus (JEV)",
    explanation: "ปัญหาผสมพันธุ์ในฤดูยุงชุม พ่อสุกรมีลูกอัณฑะบวมโตข้างเดียว (Orchitis) และแม่สุกรคลอดลูกมัมมี่สมองฝ่อ (Hydrocephalus) ตรวจพบ Flavivirus เป็นลักษณะเด่นของโรคไข้สมองอักเสบเจอี (JEV)"
  },

  // Case 33: Horse West Nile Encephalomyelitis
  {
    id: "c_wnv_case33",
    chapter: 11,
    title: "เคสที่ 33: ม้าขี่เล่นกล้ามเนื้อกระตุก เดินเซ และริมฝีปากสั่นเกร็ง",
    species: "ม้า (Equine)",
    history: "ม้าพันธุ์ผสมอายุ 5 ปี เลี้ยงปล่อยในคอกม้าใกล้บึงน้ำขนาดใหญ่ มีไข้ ซึม เดินเซ ขาหลังปัดไปมา (Ataxia) พบกล้ามเนื้อใบหน้าและริมฝีปากกระตุกเป็นจังหวะ (Fasciculations) และสะดุ้งไวต่อสัมผัสผิดปกติ",
    symptoms: ["เดินเซโซเซ ขาปัด (Ataxia & weakness)", "กล้ามเนื้อใบหน้าและปากสั่นกระตุก (Muscle fasciculations)", "ไข้ ซึม เซื่อง", "ไวต่อสิ่งเร้าเกินเหตุ (Hyperesthesia)"],
    laboratoryResults: "ตรวจวิเคราะห์น้ำไขสันหลัง (CSF) พบเซลล์ Mononuclear สูง ตรวจน้ำไขสันหลังด้วย IgM Capture ELISA ให้ผลบวกจำเพาะต่อ Lineage 1 Flavivirus",
    choices: [
      "West Nile Virus (WNV)",
      "Equine Infectious Anemia Virus (EIAV)",
      "Tetanus (บาดทะยัก)",
      "Equine Herpesvirus-1 (EHM)"
    ],
    answer: "West Nile Virus (WNV)",
    explanation: "ม้าแสดงอาการทางระบบประสาท Ataxia ร่วมกับ Muscle fasciculations บริเวณใบหน้าและริมฝีปาก ในช่วงที่มียุงเป็นพาหะ และตรวจพบ IgM Capture ELISA บวกใน CSF ยืนยันโรคไข้สมองอักเสบเวสต์ไนล์ (WNV)"
  },

  // Case 34: Bovine Ephemeral Fever (Three-day Sickness)
  {
    id: "c_befv",
    chapter: 10,
    title: "เคสที่ 34: โคเนื้อไข้สูงจัด ขาแข็งเกร็ง ล้มนอนแต่ลุกได้เองใน 3 วัน",
    species: "โค (Bovine)",
    history: "ช่วงต้นฤดูฝน โคขุนหลายตัวในฝูงมีไข้สูงเฉียบพลัน 41-42°C นอนซม ข้อต่อบวม เจ็บกล้ามเนื้อยืนขาแข็งเกร็ง (Stiff gait) น้ำลายไหลย้อย และไม่อยากก้าวเดิน แต่เมื่อผ่านไป 3 วัน อาการไข้และขาแข็งกลับทุเลาลงอย่างรวดเร็ว",
    symptoms: ["ไข้สูงเฉียบพลันสองระลอก (Biphasic fever)", "เดินขาแข็งเกร็ง เจ็บข้อต่อ (Stiff gait / Shifting lameness)", "น้ำลายไหลยืด ซึม หายใจหอบ", "ฟื้นตัวเร็วภายใน 3-4 วัน"],
    laboratoryResults: "ตรวจตัวอย่างเลือดครบส่วน (Whole blood) เก็บในระยะไข้สูงด้วย RT-PCR พบสารพันธุกรรมของ Ephemerovirus (Rhabdoviridae)",
    choices: [
      "Bovine Ephemeral Fever Virus (BEFV - ไข้สามวัน)",
      "Blackleg (Clostridium chauvoei)",
      "Foot and Mouth Disease Virus",
      "Bovine Spongiform Encephalopathy (BSE)"
    ],
    answer: "Bovine Ephemeral Fever Virus (BEFV - ไข้สามวัน)",
    explanation: "ไข้สูงเฉียบพลัน เดินขาแข็งเกร็ง (Stiffness) เจ็บข้อกล้ามเนื้อ และฟื้นตัวได้เองภายใน 3 วันในฤดูแมลงดูดเลือดชุกชุม ร่วมกับผลบวกต่อ Ephemerovirus คือโรคไข้สามวัน (Three-day sickness / BEFV)"
  },

  // Case 35: Canine Infectious Tracheobronchitis (Kennel Cough - Cav-2)
  {
    id: "c_cav2",
    chapter: 3,
    title: "เคสที่ 35: สุนัขไอเสียงดังคล้ายห่านร้องหลังกลับจากโรงแรมรับฝากสัตว์",
    species: "สุนัข (Canine)",
    history: "สุนัขปอมเมอเรเนียน อายุ 2 ปี เพิ่งกลับจากการเข้าพักโรงแรมรับฝากสุนัขได้ 5 วัน แสดงอาการไอแห้งเสียงดังคล้ายห่านร้อง (Honking cough) ไอตลอดเวลาโดยเฉพาะเมื่อดึงสายจูงหรือคลำสัมผัสหลอดลม",
    symptoms: ["ไอแห้งรุนแรงเสียงดัง (Harsh honking cough)", "ไอสำลักคล้ายมีก้างติดคอหลังออกกำลังกาย", "กดหลอดลมกระตุ้นให้ไอ (Tracheal pinch positive)", "ร่าเริงและกินอาหารได้ปกติ"],
    laboratoryResults: "ป้ายตรวจสิ่งคัดหลั่งโพรงจมูกและคอหอย ตรวจ PCR พบ DNA ของ Canine Adenovirus type 2 (CAV-2) ร่วมกับเชื้อ Bordetella bronchiseptica",
    choices: [
      "Kennel Cough Complex (Canine Adenovirus type 2)",
      "Canine Distemper Virus (CDV)",
      "หัวใจโตกดหลอดลม",
      "พยาธิหนอนหัวใจระยะรุนแรง"
    ],
    answer: "Kennel Cough Complex (Canine Adenovirus type 2)",
    explanation: "ประวัติเข้าพักโรงแรมสุนัข มีอาการไอเสียงดัง Honking cough เมื่อกดหลอดลม และผลตรวจพบ Adenovirus type 2 (CAV-2) เป็นลักษณะคลาสสิกของ Canine Infectious Respiratory Disease Complex (CIRDC / Kennel Cough)"
  },

  // Case 36: Rabbit Hemorrhagic Disease (Calicivirus)
  {
    id: "c_rhdv",
    chapter: 13,
    title: "เคสที่ 36: กระต่ายบ้านตายเฉียบพลัน มีฟองเลือดสดไหลออกจากรูจมูก",
    species: "กระต่าย (Lagomorph)",
    history: "ฟาร์มเพาะพันธุ์กระต่ายสวยงามพบกระต่ายโตเต็มวัยทยอยล้มนอนชักเกร็งและตายเฉียบพลันภายในไม่กี่ชั่วโมง ซากกระต่ายพบคราบเลือดและฟองโฟมสีชมพูไหลทะลักออกมาจากรูจมูก (Epistaxis)",
    symptoms: ["ตายเฉียบพลัน (Peracute death)", "เลือดกำเดาไหลปนฟองโฟมจากจมูก (Epistaxis)", "ไข้ ซึม หายใจหอบก่อนตาย", "กระต่ายโตตายเกือบ 100% แต่ลูกกระต่ายอายุน้อยกว่า 4 สัปดาห์รอด"],
    laboratoryResults: "ผ่าซากพบตับบวมซีดเปราะเกิดเนื้อตายเป็นวงกว้าง (Necrotizing hepatitis) ปอดคั่งเลือดและบวมน้ำรุนแรง ตรวจ RT-PCR ยืนยันเชื้อ Lagovirus (Caliciviridae)",
    choices: [
      "Rabbit Hemorrhagic Disease Virus (RHDV / Calicivirus)",
      "Myxomatosis (Poxvirus)",
      "Pasteurellosis (Snuffles)",
      "ภาวะกระเพาะอาหารอุดตันจากก้อนขน"
    ],
    answer: "Rabbit Hemorrhagic Disease Virus (RHDV / Calicivirus)",
    explanation: "กระต่ายโตตายเฉียบพลัน เลือดสดทะลักรูจมูก ตับเกิด Necrotizing hepatitis รุนแรง และเป็นเชื้อในวงศ์ Caliciviridae ยืนยันโรคตับอักเสบเลือดออกในกระต่าย (Rabbit Hemorrhagic Disease - RHDV)"
  },

  // Case 37: Bovine Respiratory Syncytial Virus (BRSV)
  {
    id: "c_brsv",
    chapter: 7,
    title: "เคสที่ 37: ลูกโคขุนอายุน้อย หายใจอ้าปาก หอบเหนื่อย ปอดโป่งพอง",
    species: "โค (Bovine)",
    history: "ลูกโคขุนอายุ 4 เดือนหลังหย่านมและรวมฝูง มีไข้สูงเฉียบพลัน ซึม ไอแห้ง หายใจหอบเหนื่อยรุนแรง อ้าปากหายใจ ยืดคอ และมีน้ำมูกใสไหล ตรวจปอดได้ยินเสียง Cracles และ Wheezes ทั่วทรวงอก",
    symptoms: ["หายใจอ้าปากและยืดคอ (Open-mouth breathing)", "หายใจหอบลึก (Tachypnea & dyspnea)", "ไอแห้ง ไข้สูง", "ลูกโคเครียดจากการขนส่งและรวมฝูง"],
    laboratoryResults: "ส่องกล้องจุลทรรศน์ชิ้นเนื้อปอดพบเซลล์ยักษ์หลายนิวเคลียส (Syncytia formation) และมี Intracytoplasmic inclusion bodies ย้อมตรวจ Fluorescent Antibody พบ Pneumovirus (Paramyxoviridae)",
    choices: [
      "Bovine Respiratory Syncytial Virus (BRSV)",
      "Infectious Bovine Rhinotracheitis (IBR)",
      "Contagious Bovine Pleuropneumonia (CBPP)",
      "Bovine Tuberculosis"
    ],
    answer: "Bovine Respiratory Syncytial Virus (BRSV)",
    explanation: "อาการหายใจหอบอ้าปากรุนแรงในลูกโคหลังหย่านม ร่วมกับการตรวจพบ Syncytia formation (Syncytial giant cells) ในเนื้อเยื่อปอด ชี้ชัดว่าเป็น Bovine Respiratory Syncytial Virus (BRSV)"
  },

  // Case 38: Porcine Circovirus Type 2 (PMWS)
  {
    id: "c_pcv2_case38",
    chapter: 14,
    title: "เคสที่ 38: สุกรอนุบาลผอมแห้งแคระแกร็น ต่อมน้ำเหลืองโตทั่วร่างกาย",
    species: "สุกร (Porcine)",
    history: "สุกรระยะอนุบาลถึงขุนรุ่น (อายุ 8-12 สัปดาห์) มีอาการซูบผอม โตช้า แคระแกร็น (Wasting) ผิวหนังซีดจาง หายใจลำบาก ถ่ายเหลว และคลำพบต่อมน้ำเหลืองที่ขาหนีบ (Inguinal lymph nodes) บวมโตขนาดเท่าผลมะนาว",
    symptoms: ["ผอมแห้ง แคระแกร็น โตช้า (Severe wasting/stunting)", "ต่อมน้ำเหลืองทั่วตัวโตผิดปกติ (Lymphadenopathy)", "ผิวหนังซีด หายใจหอบ", "ท้องเสียเรื้อรัง"],
    laboratoryResults: "ตรวจชิ้นเนื้อต่อมน้ำเหลืองพบการสูญเสียเซลล์ลิมโฟไซต์ (Lymphoid depletion) และพบ Botryoid-like intracytoplasmic inclusion bodies ตรวจ Real-time PCR พบ Circovirus DNA ปริมาณสูง",
    choices: [
      "Porcine Circovirus type 2 (PCV-2 / PMWS)",
      "Classical Swine Fever Virus",
      "Porcine Parvovirus",
      "โรคพยาธิในทางเดินอาหารรุนแรง"
    ],
    answer: "Porcine Circovirus type 2 (PCV-2 / PMWS)",
    explanation: "อาการผอมแคระแกร็น (Wasting syndrome) ต่อมน้ำเหลืองโตทั่วตัว (Lymphadenopathy) ร่วมกับรอยโรค Lymphoid depletion และ Botryoid inclusions ยืนยันโรค PCVAD / PMWS จากเชื้อ PCV-2"
  },

  // Case 39: Avian Encephalomyelitis (Epidemic Tremor)
  {
    id: "c_aev",
    chapter: 13,
    title: "เคสที่ 39: ลูกไก่แรกเกิดเดินโซเซ หัวและคอสั่นระริก ตาขุ่นขาว",
    species: "ไก่ (Avian)",
    history: "ลูกไก่เนื้ออายุ 1-2 สัปดาห์ในโรงเรือนอนุบาล แสดงอาการเดินโซเซ ขาอ่อนแรง ล้มลงนอนตะแคง ตัวสั่น หัวและคอสั่นระริกอย่างรวดเร็ว (Tremors of head and neck) ลูกไก่บางตัวที่รอดชีวิตเริ่มมีแก้วตาขุ่นขาว (Lens opacity / Cataract)",
    symptoms: ["หัวและคอสั่นระริก (Rapid tremor of head & neck)", "เดินเซ ขาอ่อนแรง ล้มนอนตะแคง (Ataxia & paresis)", "แก้วตาขุ่นขาวในตัวที่รอด (Blue eye / Cataract)", "อัตราตายสูงในลูกไก่อายุน้อยกว่า 3 สัปดาห์"],
    laboratoryResults: "ตรวจทางจุลพยาธิวิทยาของสมองและไขสันหลังพบ Neuronal chromatolysis และต่อมน้ำเหลืองแทรกตัวรอบหลอดเลือด (Perivascular cuffing) ตรวจพบ Picornavirus",
    choices: [
      "Avian Encephalomyelitis Virus (AEV / Picornaviridae)",
      "Newcastle Disease Virus (Neurotropic form)",
      "Marek's Disease Virus",
      "ภาวะขาดวิตามินอี (Crazy chick disease)"
    ],
    answer: "Avian Encephalomyelitis Virus (AEV / Picornaviridae)",
    explanation: "ลูกไก่อายุน้อยมีอาการหัวคอสั่นระริก (Epidemic tremor) เดินเซ และเกิด Lens opacity ในตัวที่รอด ร่วมกับรอยโรค Neuronal chromatolysis ในระบบประสาท เป็นอาการเฉพาะของ Avian Encephalomyelitis (AEV)"
  },

  // Case 40: Equine Viral Arteritis (EVA)
  {
    id: "c_eva",
    chapter: 14,
    title: "เคสที่ 40: ม้าพ่อพันธุ์เบ้าตาบวมน้ำ ถุงอัณฑะบวม แม่ม้าแท้งลูก",
    species: "ม้า (Equine)",
    history: "ศูนย์เพาะพันธุ์ม้าพบม้ามีไข้ ซึม มีน้ำมูกน้ำตาไหล เปลือกตาบวมแดงชมพู (Pinkeye) บวมน้ำที่ขา ใต้ท้อง และถุงหุ้มอัณฑะ (Scrotal edema) แม่ม้าที่ผสมพันธุ์ไปเริ่มแท้งลูกสดโดยไม่มีอาการเตือนล่วงหน้า",
    symptoms: ["เยื่อบุตาบวมแดงมีน้ำตาเกรอะ (Pink eye / Conjunctivitis)", "บวมน้ำที่ถุงอัณฑะ ใต้ท้อง และขาหลัง (Scrotal & ventral edema)", "แม่ม้าแท้งลูกเฉียบพลัน", "ไข้ ซึม ผื่นลมพิษ"],
    laboratoryResults: "ตรวจพบการอักเสบของผนังหลอดเลือดแดงขนาดเล็ก (Panarteritis) ตรวจน้ำอสุจิของม้าพ่อพันธุ์ด้วย RT-PCR พบ Arterivirus ในระดับสูง",
    choices: [
      "Equine Viral Arteritis (EVA / Arteriviridae)",
      "Equine Infectious Anemia (EIA / Coggins test)",
      "African Horse Sickness (AHSV)",
      "Strangles (Streptococcus equi)"
    ],
    answer: "Equine Viral Arteritis (EVA / Arteriviridae)",
    explanation: "อาการ Pinkeye เยื่อตาบวมแดง บวมน้ำที่ถุงอัณฑะและขา แม่ม้าแท้งลูก และตรวจพบการอักเสบของหลอดเลือดแดง Panarteritis พร้อมเชื้อในน้ำอสุจิ ยืนยันโรค Equine Viral Arteritis (EVA)"
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. PREPARED DATASETS FOR ALL 8 GAME MODES
// ─────────────────────────────────────────────────────────────────────────────

// A. Classroom Battle & Quiz General (151 Questions)
export const MASTER_CLASSROOM_BATTLE_QUESTIONS = ALL_15_CHAPTER_QUESTIONS.map(q => {
  let ansIdx = q.choices.indexOf(q.answer);
  if (ansIdx === -1) ansIdx = 0;
  return {
    q: q.q,
    opts: q.choices,
    ans: ansIdx,
    chapter: q.chapter,
    chapterTitle: q.chapterTitle,
    explanation: q.explanation || ''
  };
});

export const MASTER_QUIZ_GENERAL_QUESTIONS = MASTER_CLASSROOM_BATTLE_QUESTIONS;

// B. Virus Identification Game (151 Questions)
export const MASTER_IDENTIFICATION_QUESTIONS = ALL_15_CHAPTER_QUESTIONS.map(q => ({
  id: q.id,
  chapter: q.chapter,
  chapterTitle: q.chapterTitle,
  question: q.q,
  choices: q.choices,
  answer: q.answer,
  explanation: q.explanation || '',
  virusType: q.virusType
}));

// C. Matching Game Cards (46 Pairs = 92 Cards)
export const MASTER_MATCHING_CARDS = ALL_15_MATCHING_PAIRS.flatMap((p, idx) => [
  { id: `v${idx + 1}`, text: p.virus, matchId: `m${idx + 1}`, chapter: p.chapter },
  { id: `d${idx + 1}`, text: p.feature, matchId: `m${idx + 1}`, chapter: p.chapter }
]);

// D. Diagnosis Duel Cases (Clinical Scenarios)
export const MASTER_DIAGNOSIS_DUEL_CASES = [
  {
    id: 1,
    title: "Case 01: The Drooling Cow (โคเนื้อน้ำลายฟูมปาก)",
    symptoms: [
      "โคเนื้อ เพศผู้ อายุ 2 ปี มีไข้สูง 40.5 °C",
      "น้ำลายไหลยืดฟูมปาก (Profuse salivation)",
      "มีตุ่มน้ำใสและแผลหลุดลอกที่ริมฝีปาก เหงือก และลิ้น",
      "กีบเท้าอักเสบแตก เดินกะเผลก ไม่ยอมก้าวเดิน"
    ],
    correct: {
      diag: "FMD",
      lab: "PCR_EPITHELIUM",
      treat: "SUPPORTIVE",
      prev: "VACCINE_BIOSECURITY"
    }
  },
  {
    id: 2,
    title: "Case 02: The Hemorrhagic Enteritis Puppy (ลูกสุนัขถ่ายเป็นเลือด)",
    symptoms: [
      "ลูกสุนัขพันธุ์ทาง อายุ 3 เดือน ยังไม่เคยรับวัคซีน",
      "ซึมอย่างรุนแรง เบื่ออาหาร นอนหมอบ",
      "อาเจียนหลายครั้งติดต่อกัน อุณหภูมิร่างกายต่ำ",
      "ท้องเสียถ่ายเหลวพุ่งเป็นเลือดสด มีกลิ่นเหม็นคาวเฉพาะตัว",
      "ภาวะขาดน้ำระดับรุนแรง (Skin tenting > 3 วินาที)"
    ],
    correct: {
      diag: "CPV",
      lab: "SNAP_TEST_FECES",
      treat: "FLUID_ANTIBIOTIC",
      prev: "VACCINE_PROTOCOL"
    }
  },
  {
    id: 3,
    title: "Case 03: The Aggressive Stray Dog (สุนัขจรจัดดุร้ายกัดสะบัด)",
    symptoms: [
      "สุนัขเพศผู้ อายุประมาณ 3 ปี ไม่มีประวัติวัคซีน",
      "พฤติกรรมก้าวร้าวผิดปกติ ไล่กัดวัตถุไม่มีชีวิต กัดกรง",
      "เสียงเห่าหอนเปลี่ยนไปเป็นเสียงแหบต่ำแปลกประหลาด",
      "น้ำลายไหลยืด กลืนน้ำหรืออาหารไม่ได้ (Hydrophobia/Dysphagia)",
      "ขากรรไกรล่างตก ขาหลังเริ่มอ่อนแรงและเป็นอัมพาต"
    ],
    correct: {
      diag: "RABIES",
      lab: "BRAIN_FA",
      treat: "EUTHANASIA",
      prev: "VACCINE_PROTOCOL"
    }
  },
  {
    id: 4,
    title: "Case 04: The Dehydrated Suckling Piglets (ลูกสุกรดูดนมท้องร่วงเฉียบพลัน)",
    symptoms: [
      "ลูกสุกรดูดนมอายุ 3-5 วัน ในฟาร์มปิด",
      "อุจจาระเหลวเป็นน้ำสีเหลืองพุ่งกระจายเต็มคอก",
      "อาเจียนร่วมกับท้องเสีย ภาวะขาดน้ำรุนแรง",
      "ลูกสุกรเบียดนอนสุมทับกันด้วยความหนาวสั่น",
      "อัตราการตายสูงเกือบ 90% ในสุกรอายุต่ำกว่า 1 สัปดาห์"
    ],
    correct: {
      diag: "PEDV",
      lab: "SNAP_TEST_FECES",
      treat: "SUPPORTIVE",
      prev: "VACCINE_BIOSECURITY"
    }
  },
  {
    id: 5,
    title: "Case 05: Dairy Cow Drop in Milk (โคนมน้ำนมฮวบฮาบ แผลที่เต้านมและกีบ)",
    symptoms: [
      "โคนมพันธุ์โฮลสไตน์ฟรีเชี่ยน อายุ 4 ปี",
      "ผลผลิตน้ำนมลดฮวบลงเฉียบพลันจาก 20 ลิตรเหลือ 2 ลิตร",
      "ไข้สูง 41 °C หายใจหอบ เม็ดน้ำลายฟูมเป็นฟองที่มุมปาก",
      "มีตุ่มน้ำแตกเป็นแผลลึก (Erosion) ที่หัวนมและร่องกีบเท้า",
      "พบการระบาดลามไปสู่โคตัวข้างเคียงอย่างรวดเร็วภายใน 48 ชั่วโมง"
    ],
    correct: {
      diag: "FMD",
      lab: "PCR_EPITHELIUM",
      treat: "SUPPORTIVE",
      prev: "VACCINE_BIOSECURITY"
    }
  },
  {
    id: 6,
    title: "Case 06: Paralytic Cattle with Rabies Suspect (โคเคี้ยวเอื้องอัมพาต)",
    symptoms: [
      "โคเพศเมียอายุ 3 ปี เลี้ยงปล่อยทุ่งชายป่า",
      "มีประวัติถูกสุนัขจรจัดกัดบริเวณขาหลังเมื่อ 3 สัปดาห์ก่อน",
      "ส่งเสียงร้องแหบต่ำแปลกตลอดเวลา เบ่งถ่ายอุจจาระตลอดเวลา",
      "กลืนหญ้าและน้ำไม่ได้ น้ำลายไหลย้อยเปื้อนคาง",
      "ขาหลังอัมพาต (Posterior paralysis) ล้มลงนอนตะแคง ลุกไม่ขึ้น"
    ],
    correct: {
      diag: "RABIES",
      lab: "BRAIN_FA",
      treat: "EUTHANASIA",
      prev: "VACCINE_PROTOCOL"
    }
  }
];

// E. Outbreak Simulator Scenarios
export const MASTER_OUTBREAK_SCENARIOS = [
  {
    id: 1,
    text: "สัปดาห์ที่ 1: คุณเดินทางมาถึงฟาร์มสุกรแห่งหนึ่ง พบสุกรหลายตัวมีไข้สูง ซึม และมีรอยโรคที่ผิวหนังเป็นรูปสี่เหลี่ยมขนมเปียกปูน (Diamond-shaped skin lesions) สิ่งแรกที่คุณควรทำคืออะไร?",
    options: [
      { text: "ฉีดวัคซีนให้สุกรทุกตัวทันที", hpMod: -20, exp: 0, next: 2, feedback: "การฉีดวัคซีนให้สัตว์ที่กำลังป่วยเป็นอันตราย พวกเขาต้องการการรักษาก่อน" },
      { text: "กักบริเวณสุกรป่วยและเก็บตัวอย่างส่งตรวจ", hpMod: 10, exp: 20, next: 2, feedback: "ยอดเยี่ยมมาก การกักกันโรคช่วยป้องกันการแพร่กระจายระหว่างรอผลวินิจฉัย" },
      { text: "สั่งทำลาย (Cull) สุกรทั้งฝูงทันที", hpMod: -50, exp: 0, next: 2, feedback: "รุนแรงเกินไปสำหรับการกระทำแรกโดยที่ยังไม่มีผลวินิจฉัยยืนยัน!" }
    ]
  },
  {
    id: 2,
    text: "สัปดาห์ที่ 2: ผลแล็บยืนยันว่าเป็นโรค Swine Erysipelas (ไฟลามทุ่งในสุกร) เจ้าของฟาร์มตื่นตระหนกมากเพราะกลัวว่าจะติดต่อไปสู่คน คุณจะจัดการอย่างไร?",
    options: [
      { text: "บอกให้เขาสบายใจว่าโรคนี้ไม่ติดคน", hpMod: -30, exp: 0, next: 3, feedback: "ผิด! เชื้อ Erysipelothrix rhusiopathiae สามารถติดต่อสู่คนได้ (Zoonotic)" },
      { text: "ฉีด Penicillin ให้สุกรป่วย และให้คนงานสวมถุงมือป้องกัน", hpMod: 20, exp: 20, next: 3, feedback: "ถูกต้อง! ยา Penicillin ได้ผลดีมาก และอุปกรณ์ป้องกัน (PPE) จะช่วยปกป้องคนงาน" }
    ]
  },
  {
    id: 3,
    text: "สัปดาห์ที่ 3: อาการของสุกรที่ป่วยเริ่มดีขึ้น แต่คุณพบว่ามีลูกสุกรเกิดใหม่เริ่มมีอาการท้องเสียรุนแรงเป็นน้ำ (Watery Diarrhea) และตายอย่างรวดเร็ว คุณคิดว่าเป็นโรคอะไรแทรกซ้อน?",
    options: [
      { text: "Porcine Epidemic Diarrhea (PED)", hpMod: 20, exp: 20, next: 4, feedback: "ถูกต้อง! PEDV มักทำให้เกิดอาการท้องเสียรุนแรงและมีอัตราการตายสูงในลูกสุกร" },
      { text: "Classical Swine Fever (CSF)", hpMod: -15, exp: 0, next: 4, feedback: "CSF มักมีอาการไข้สูง มีจุดเลือดออกตามตัว มากกว่าท้องเสียเฉียบพลันในลูกสุกร" },
      { text: "Foot and Mouth Disease (FMD)", hpMod: -15, exp: 0, next: 4, feedback: "FMD จะมีตุ่มน้ำใสที่จมูกและกีบเท้า ไม่ใช่ท้องเสียรุนแรง" }
    ]
  },
  {
    id: 4,
    text: "สัปดาห์ที่ 4: การระบาดของ PEDV ทำให้ลูกสุกรตายไปกว่า 50% คุณจะใช้มาตรการใดเพื่อหยุดการระบาดในระยะสั้นที่สุด?",
    options: [
      { text: "ทำ Feedback (ป้อนลำไส้สุกรป่วยให้แม่สุกรอุ้มท้อง)", hpMod: 20, exp: 20, next: 5, feedback: "ถูกต้อง! เป็นวิธีสร้างภูมิคุ้มกันหมู่แบบรวดเร็ว (Lactogenic immunity) ให้กับลูกสุกรชุดถัดไป" },
      { text: "สั่งหยุดผสมพันธุ์แม่สุกร 6 เดือน", hpMod: -20, exp: 0, next: 5, feedback: "ทำให้ฟาร์มขาดรายได้รุนแรงเกินความจำเป็น" },
      { text: "ฉีดยาปฏิชีวนะให้ลูกสุกรทุกตัว", hpMod: -15, exp: 0, next: 5, feedback: "PEDV เป็นเชื้อไวรัส ยาปฏิชีวนะไม่สามารถฆ่าไวรัสได้" }
    ]
  },
  {
    id: 5,
    text: "สัปดาห์ที่ 5: การระบาดเริ่มสงบลง คุณจะแนะนำวิธีจัดการฟาร์มระยะยาวเพื่อไม่ให้เกิดโรคระบาดซ้ำได้อย่างไร?",
    options: [
      { text: "พ่นยาฆ่าเชื้อทุกวันโดยไม่ต้องทำความสะอาดคอก", hpMod: -20, exp: 0, next: 6, feedback: "สารอินทรีย์ (ขี้หมู) จะทำให้ยาฆ่าเชื้อหมดฤทธิ์ ต้องล้างก่อนเสมอ!" },
      { text: "ใช้ระบบ All-in All-out และเพิ่ม Biosecurity", hpMod: 20, exp: 20, next: 6, feedback: "สมบูรณ์แบบ! การตัดวงจรโรคและการป้องกันเชื้อเข้าฟาร์มคือหัวใจหลัก" }
    ]
  },
  {
    id: 6,
    text: "สัปดาห์ที่ 6: มีข่าวการระบาดของโรคปากและเท้าเปื่อย (FMD) ในอำเภอข้างเคียง คุณจะยกระดับความปลอดภัยฟาร์มอย่างไรเป็นอันดับแรก?",
    options: [
      { text: "ติดตั้งบ่อจุ่มล้อรถและพ่นยาฆ่าเชื้อรถขนส่งทุกลำอย่างเข้มงวด", hpMod: 20, exp: 25, next: 7, feedback: "ถูกต้องที่สุด! ยานพาหนะขนส่งเป็นตัวการหลักของการแพร่กระจายเชื้อข้ามพื้นที่" },
      { text: "ปล่อยให้สุกรเดินออกกำลังกายกลางแจ้งเพื่อคลายเครียด", hpMod: -30, exp: 0, next: 7, feedback: "อันตรายมาก! ไวรัส FMD สามารถแพร่กระจายผ่านละอองลอยในอากาศ (Airborne) ได้ไกลหลายกิโลเมตร" }
    ]
  }
];

// F. Farm Defense Simulation Events
export const MASTER_FARM_DEFENSE_EVENTS = [
  { month: 1, title: "Threat Detected", text: "ฟาร์มข้างเคียงพบสุกรมีอาการซึมและไข้สูง ความเสี่ยงการติดเชื้อเริ่มก่อตัว", risk: 20 },
  { month: 2, title: "Vector Warning", text: "ช่วงฤดูฝน พาหะนำโรคอย่างนกและหนูเพิ่มจำนวนมากในพื้นที่", risk: 40 },
  { month: 3, title: "Regional Outbreak", text: "เกิดการระบาดของ PRRS อย่างหนักในรัศมี 10 กิโลเมตรจากฟาร์มคุณ!", risk: 70 },
  { month: 4, title: "Market Crash", text: "ข่าวโรคระบาดทำให้ราคาหมูตกต่ำ (รายได้เดือนนี้ลดลงครึ่งหนึ่ง)", risk: 30 },
  { month: 5, title: "Mutated Strain", text: "เชื้อไวรัสกลายพันธุ์และแพร่กระจายทางอากาศ (Airborne) อย่างรุนแรง!", risk: 90 },
  { month: 6, title: "Biosecurity Inspection", text: "เจ้าหน้าที่ปศุสัตว์เข้าตรวจสอบมาตรฐาน GAP และระบบป้องกันทางชีวภาพของฟาร์ม", risk: 25 }
];

