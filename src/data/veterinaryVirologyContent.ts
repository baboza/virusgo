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
  // ── CHAPTER 1: Basic Virology Part 1 (Viral Structure & Baltimore Classification) ──
  {
    id: "ch1_q1",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Viral Structure",
    virusType: "default",
    q: "องค์ประกอบพื้นฐานที่ไวรัสทุกชนิดต้องมีเหมือนกันคือข้อใด?",
    choices: [
      "Capsid หุ้ม Nucleic acid (Genomic material)",
      "Lipid envelope และ Peplomer (Spike)",
      "Ribosome สำหรับสังเคราะห์โปรตีนด้วยตนเอง",
      "Mitochondria สำหรับสร้างพลังงาน ATP"
    ],
    answer: "Capsid หุ้ม Nucleic acid (Genomic material)",
    explanation: "ไวรัสทุกชนิดประกอบด้วยจีโนม (DNA หรือ RNA) หุ้มด้วยเปลือกโปรตีนที่เรียกว่า Capsid ไวรัสบางชนิดอาจไม่มี Envelope และไวรัสไม่มีออร์แกเนลล์เช่น Ribosome หรือ Mitochondria ของตนเอง"
  },
  {
    id: "ch1_q2",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Capsid Symmetry",
    virusType: "default",
    q: "สมมาตรของ Capsid แบบใดที่พบมากที่สุดในไวรัสสัตว์ และมีลักษณะทางเรขาคณิตเป็นรูปเหลี่ยม 20 หน้า?",
    choices: [
      "Icosahedral symmetry (ลูกบาศก์ 20 หน้า)",
      "Helical symmetry (เกลียวทรงกระบอก)",
      "Complex symmetry (แบบซับซ้อน)",
      "Binal symmetry (หัวและหาง)"
    ],
    answer: "Icosahedral symmetry (ลูกบาศก์ 20 หน้า)",
    explanation: "Icosahedral symmetry ประกอบด้วยรูปสามเหลี่ยมด้านเท่า 20 หน้า มี 12 มุม เป็นโครงสร้างสมมาตรแบบปิดที่มีประสิทธิภาพในการบรรจุสารพันธุกรรมสูงสุด"
  },
  {
    id: "ch1_q3",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Viral Envelope",
    virusType: "default",
    q: "Envelope ของ Enveloped viruses ได้มาจากส่วนใดของเซลล์เจ้าบ้าน (Host cell)?",
    choices: [
      "เยื่อหุ้มเซลล์ (Plasma membrane) หรือเยื่อหุ้มออร์แกเนลล์ของโฮสต์ระหว่างการแตกหน่อ (Budding)",
      "สังเคราะห์ไขมันขึ้นมาใหม่จากยีนของไวรัสเอง",
      "ผนังเซลล์ของแบคทีเรียที่อาศัยอยู่ร่วมกัน",
      "โปรตีน Capsomer ที่ละลายกลายเป็นไขมัน"
    ],
    answer: "เยื่อหุ้มเซลล์ (Plasma membrane) หรือเยื่อหุ้มออร์แกเนลล์ของโฮสต์ระหว่างการแตกหน่อ (Budding)",
    explanation: "Envelope เป็น Lipid bilayer ที่ไวรัสขโมยมาจาก Host membrane (เช่น Plasma membrane, ER membrane หรือ Nuclear membrane) ขณะไวรัสเคลื่อนที่ออกจากเซลล์ผ่านกระบวนการ Budding"
  },
  {
    id: "ch1_q4",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Disinfection Resistance",
    virusType: "default",
    q: "ไวรัสกลุ่มใดมีความทนทานต่อสารฆ่าเชื้อประเภท Lipid solvents (เช่น แอลกอฮอล์ อีเทอร์ คลอโรฟอร์ม) ในสิ่งแวดล้อมได้ดีกว่า?",
    choices: [
      "Naked virus (Non-enveloped virus)",
      "Enveloped virus",
      "ไวรัสที่มีเปลือกหุ้มหนาพิเศษ",
      "ไวรัสที่มีหนามโปรตีน Peplomer"
    ],
    answer: "Naked virus (Non-enveloped virus)",
    explanation: "Naked virus ไม่มีชั้นไขมัน จึงทนทานต่อสารทำละลายไขมัน ผงซักฟอก และแอลกอฮอล์ได้ดีกว่า Enveloped virus ซึ่งไวรัสที่มีเปลือกหุ้มจะสูญเสียสภาพการติดเชื้อทันทีที่เยื่อหุ้มไขมันถูกทำลาย"
  },
  {
    id: "ch1_q5",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Baltimore Classification",
    virusType: "default",
    q: "ตาม Baltimore classification ไวรัสกลุ่ม Group I และ Group IV มีสารพันธุกรรมชนิดใดตามลำดับ?",
    choices: [
      "dsDNA และ (+)ssRNA",
      "ssDNA และ (-)ssRNA",
      "dsRNA และ Retrovirus",
      "(+)ssRNA และ dsDNA"
    ],
    answer: "dsDNA และ (+)ssRNA",
    explanation: "ระบบ Baltimore แบ่งตามประเภทจีโนมและวิถีการสร้าง mRNA: Group I คือ dsDNA (เช่น Pox, Herpes, Adeno) และ Group IV คือ (+)ssRNA (เช่น Picorna, Corona, Flavi)"
  },
  {
    id: "ch1_q6",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Positive vs Negative Sense RNA",
    virusType: "default",
    q: "ไวรัสที่มีสารพันธุกรรมเป็น Positive-sense single-stranded RNA ((+)ssRNA) มีคุณสมบัติพิเศษอย่างไร?",
    choices: [
      "จีโนมสามารถทำหน้าที่เสมือน mRNA และถูกแปลรหัส (Translate) เป็นโปรตีนได้ทันทีเมื่อเข้าสู่ไซโทพลาสซึม",
      "ต้องนำเอนไซม์ RNA polymerase บรรจุมาในอนุภาคไวรัสเสมอเพื่อคัดลอกสายพันธุกรรม",
      "ไม่สามารถก่อให้เกิดการติดเชื้อได้หากฉีดเฉพาะสารพันธุกรรมบริสุทธิ์เข้าสู่เซลล์",
      "ต้องแทรกจีโนมเข้าสู่โครโมโซมของโฮสต์ก่อนเริ่มแปลรหัสเสมอ"
    ],
    answer: "จีโนมสามารถทำหน้าที่เสมือน mRNA และถูกแปลรหัส (Translate) เป็นโปรตีนได้ทันทีเมื่อเข้าสู่ไซโทพลาสซึม",
    explanation: "(+)ssRNA มีทิศทาง 5' ไป 3' เหมือน mRNA ของเซลล์ ทำให้ Ribosome ของโฮสต์สามารถจับและแปลรหัสโปรตีนของไวรัสได้ทันที จึงเรียกว่า Infectious RNA"
  },
  {
    id: "ch1_q7",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Negative-sense RNA Enzymes",
    virusType: "default",
    q: "ไวรัสประเภท Negative-sense ssRNA (เช่น Rabies, Influenza, Paramyxovirus) จำเป็นต้องนำเอนไซม์ชนิดใดติดมาในอนุภาคไวรัส (Virion)?",
    choices: [
      "RNA-dependent RNA polymerase (RdRp)",
      "DNA-dependent RNA polymerase",
      "Reverse Transcriptase",
      "DNA Ligase"
    ],
    answer: "RNA-dependent RNA polymerase (RdRp)",
    explanation: "เนื่องจากเซลล์เจ้าบ้านไม่มีเอนไซม์ที่ใช้คัดลอก RNA จากแม่แบบ (-)ssRNA ไปเป็น (+)mRNA ไวรัสกลุ่มนี้จึงจำเป็นต้องบรรจุเอนไซม์ RdRp มาพร้อมใน Capsid เพื่อสร้าง mRNA ทันทีที่เข้าสู่เซลล์"
  },
  {
    id: "ch1_q8",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Viral Units & Terminology",
    virusType: "default",
    q: "คำว่า 'Virion' หมายถึงอะไรในทางไวรัสวิทยา?",
    choices: [
      "อนุภาคไวรัสที่ประกอบเสร็จสมบูรณ์ภายนอกเซลล์และมีความสามารถในการติดเชื้อ",
      "สารพันธุกรรมของไวรัสที่แทรกอยู่ในโครโมโซมของโฮสต์",
      "เปลือกโปรตีนที่ไม่มีสารพันธุกรรมอยู่ภายใน (Empty capsid)",
      "ผลึกของโปรตีนไวรัสที่สะสมในไซโทพลาสซึม"
    ],
    answer: "อนุภาคไวรัสที่ประกอบเสร็จสมบูรณ์ภายนอกเซลล์และมีความสามารถในการติดเชื้อ",
    explanation: "Virion คือ Complete physical virus particle ที่สมบูรณ์ ทั้งโครงสร้างและคุณสมบัติในการเข้าสู่เซลล์เป้าหมายใหม่"
  },
  {
    id: "ch1_q9",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Viral Size Range",
    virusType: "default",
    q: "ขนาดโดยเฉลี่ยของไวรัสสัตว์ส่วนใหญ่อยู่ในช่วงใด และเครื่องมือใดที่ใช้ในการมองเห็นอนุภาคไวรัสโดยตรง?",
    choices: [
      "20 - 300 นาโนเมตร (nm) ตรวจดูด้วยกล้องจุลทรรศน์อิเล็กตรอน (Transmission Electron Microscope)",
      "1 - 10 ไมโครเมตร (μm) ตรวจดูด้วยกล้องจุลทรรศน์แบบใช้แสงกำลังขยาย 100x",
      "0.1 - 1 มิลลิเมตร (mm) ตรวจดูด้วยกล้องสเตอริโอสโคป",
      "500 - 1000 ไมโครเมตร (μm) ตรวจดูได้ด้วยตาเปล่า"
    ],
    answer: "20 - 300 นาโนเมตร (nm) ตรวจดูด้วยกล้องจุลทรรศน์อิเล็กตรอน (Transmission Electron Microscope)",
    explanation: "ไวรัสมีขนาดเล็กมากระดับนาโนเมตร (Parvovirus ขนาดประมาณ 20 nm, Poxvirus ขนาดประมาณ 300 nm) ต้องใช้กล้องจุลทรรศน์อิเล็กตรอน (TEM) ส่องดูเท่านั้น"
  },
  {
    id: "ch1_q10",
    chapter: 1,
    chapterTitle: "Basic knowledge of Vet virology Part 1",
    virusName: "Viral Glycoproteins",
    virusType: "default",
    q: "Glycoprotein spikes (Peplomers) บนผิวของ Enveloped virus มีหน้าที่สำคัญที่สุดคือข้อใด?",
    choices: [
      "จับกับตัวรับจำเพาะ (Specific receptor) บนผิวเซลล์โฮสต์และช่วยในการหลอมรวมเพื่อเข้าสู่เซลล์",
      "สร้างสารพิษทำลายเซลล์ภูมิคุ้มกันโดยตรง",
      "ทำหน้าที่เป็นเอนไซม์สร้างพลังงาน ATP ให้แก่ไวรัส",
      "ป้องกันไม่ให้แอนติบอดีของสัตว์จับกับไวรัสได้ตลอดไป"
    ],
    answer: "จับกับตัวรับจำเพาะ (Specific receptor) บนผิวเซลล์โฮสต์และช่วยในการหลอมรวมเพื่อเข้าสู่เซลล์",
    explanation: "Spike glycoproteins ทำหน้าที่รับรู้และเข้าจับกับ Receptor บนผิวเซลล์เป้าหมาย (Host range & Tissue tropism) และช่วยในกระบวนการ Membrane fusion"
  },

  // ── CHAPTER 2: Basic Virology Part 2 (Replication, Pathogenesis & Lab Diagnosis) ──
  {
    id: "ch2_q1",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Viral Replication Cycle",
    virusType: "default",
    q: "ลำดับขั้นตอนในวงจรการเพิ่มจำนวนของไวรัส (Viral Replication Cycle) ข้อใดเรียงลำดับได้ถูกต้องที่สุด?",
    choices: [
      "Attachment → Penetration → Uncoating → Biosynthesis → Assembly → Release",
      "Penetration → Attachment → Biosynthesis → Uncoating → Release → Assembly",
      "Attachment → Biosynthesis → Penetration → Assembly → Uncoating → Release",
      "Uncoating → Attachment → Penetration → Biosynthesis → Release → Assembly"
    ],
    answer: "Attachment → Penetration → Uncoating → Biosynthesis → Assembly → Release",
    explanation: "ไวรัสเริ่มจากการเกาะผิวเซลล์ (Attachment) เข้าสู่เซลล์ (Penetration) ถอดเปลือก (Uncoating) สังเคราะห์สารพันธุกรรมและโปรตีน (Biosynthesis) ประกอบอนุภาค (Assembly) และออกจากเซลล์ (Release)"
  },
  {
    id: "ch2_q2",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Cytopathic Effect",
    virusType: "default",
    q: "Cytopathic effect (CPE) หมายถึงอะไรในห้องปฏิบัติการไวรัสวิทยา?",
    choices: [
      "การเปลี่ยนแปลงทางสัณฐานวิทยาและความเสียหายของเซลล์เพาะเลี้ยงที่เกิดจากการติดเชื้อไวรัส",
      "ความสามารถของไวรัสในการเกาะกลุ่มเม็ดเลือดแดงในหลอดทดลอง",
      "การที่ไวรัสเปลี่ยนสภาพเซลล์ปกติให้กลายเป็นเซลล์มะเร็ง",
      "การตายของตัวอ่อนไก่ฟักจากการฉีดสารพิษ"
    ],
    answer: "การเปลี่ยนแปลงทางสัณฐานวิทยาและความเสียหายของเซลล์เพาะเลี้ยงที่เกิดจากการติดเชื้อไวรัส",
    explanation: "CPE คือการเปลี่ยนแปลงทางโครงสร้างของเซลล์เพาะเลี้ยงที่สังเกตได้ใต้กล้องจุลทรรศน์ เช่น เซลล์กลมหลุดลอย (Cell rounding), รวมตัวเป็นเซลล์ยักษ์หลายนิวเคลียส (Syncytia), หรือเซลล์แตกสลาย (Lysis)"
  },
  {
    id: "ch2_q3",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Syncytia Formation",
    virusType: "default",
    q: "การรวมตัวของเซลล์ข้างเคียงจนเกิดเป็นเซลล์ยักษ์ขนาดใหญ่หลายนิวเคลียส (Multinucleated giant cell / Syncytium) เป็น CPE เด่นชัดของไวรัสกลุ่มใด?",
    choices: [
      "Paramyxoviridae (เช่น Canine Distemper, BRSV)",
      "Parvoviridae (เช่น Canine Parvovirus)",
      "Picornaviridae (เช่น FMDV)",
      "Circoviridae (เช่น PCV2)"
    ],
    answer: "Paramyxoviridae (เช่น Canine Distemper, BRSV)",
    explanation: "ไวรัสตระกูล Paramyxoviridae มีโปรตีน F (Fusion protein) ที่กระตุ้นให้เยื่อหุ้มเซลล์ของเซลล์ติดเชื้อหลอมรวมกับเซลล์ข้างเคียง เกิดเป็น Syncytia ขนาดใหญ่"
  },
  {
    id: "ch2_q4",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Hemagglutination (HA)",
    virusType: "default",
    q: "ปฏิกิริยา Hemagglutination (HA test) อาศัยคุณสมบัติใดของอนุภาคไวรัสในการทดสอบ?",
    choices: [
      "โปรตีนบนผิวไวรัสจับกับ Receptors บนผิวเม็ดเลือดแดงทำให้เม็ดเลือดแดงเกาะกลุ่มเป็นร่างแห",
      "เอนไซม์ของไวรัสย่อยสลายเม็ดเลือดแดงจนแตกสลาย (Hemolysis)",
      "แอนติบอดีในซีรั่มจับกับแอนติเจนของไวรัสแล้วเกิดการตกตะกอน",
      "กรดนิวคลีอิกของไวรัสแทรกเข้าสู่เซลล์เม็ดเลือดแดง"
    ],
    answer: "โปรตีนบนผิวไวรัสจับกับ Receptors บนผิวเม็ดเลือดแดงทำให้เม็ดเลือดแดงเกาะกลุ่มเป็นร่างแห",
    explanation: "HA test เป็นการตรวจหาอนุภาคไวรัสที่มี Hemagglutinin (เช่น Orthomyxovirus, Paramyxovirus, Parvovirus) ซึ่งสามารถเชื่อมจับเม็ดเลือดแดงเข้าด้วยกันเป็นตาข่าย ไม่ใช่ปฏิกิริยา Antigen-Antibody"
  },
  {
    id: "ch2_q5",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Embryonated Egg Inoculation",
    virusType: "default",
    q: "ในการเพาะเลี้ยงไวรัสไข้หวัดนก (Avian Influenza Virus) ในไข่ไก่ฟัก เส้นทาง (Route) ใดที่นิยมฉีดเชื้อเพื่อเก็บของเหลวที่มีปริมาณไวรัสสูงที่สุด?",
    choices: [
      "Allantoic cavity (ช่องแอลแลนทอยส์)",
      "Yolk sac (ถุงไข่แดง)",
      "Amniotic cavity (ช่องน้ำคร่ำ)",
      "Chorioallantoic membrane (CAM) โดยตรง"
    ],
    answer: "Allantoic cavity (ช่องแอลแลนทอยส์)",
    explanation: "การฉีดเข้า Allantoic cavity ของไข่ไก่ฟากอายุ 9-11 วันเป็นมาตรฐานในการเพาะเลี้ยง Orthomyxovirus และ Paramyxovirus เพราะทำได้ง่ายและเก็บเกี่ยว Allantoic fluid ที่มีไวรัสเข้มข้นได้ปริมาณมาก"
  },
  {
    id: "ch2_q6",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "RT-PCR Principle",
    virusType: "default",
    q: "เหตุใดการตรวจวินิจฉัยไวรัส RNA ด้วยวิธี Polymerase Chain Reaction (PCR) จึงจำเป็นต้องมีขั้นตอน Reverse Transcription (RT) ก่อนเสมอ?",
    choices: [
      "เพราะเอนไซม์ DNA Polymerase สามารถใช้เฉพาะสาย DNA เป็นแม่แบบในการเพิ่มจำนวนเท่านั้น",
      "เพื่อทำลายสารยับยั้งเอนไซม์ (Inhibitors) ในตัวอย่างส่งตรวจ",
      "เพื่อเปลี่ยนโปรตีน Capsid ให้เป็นสารพันธุกรรม",
      "เพื่อกระตุ้นให้ไวรัสเพิ่มจำนวนในหลอดทดลองก่อนทำ PCR"
    ],
    answer: "เพราะเอนไซม์ DNA Polymerase สามารถใช้เฉพาะสาย DNA เป็นแม่แบบในการเพิ่มจำนวนเท่านั้น",
    explanation: "Taq DNA polymerase ขยายสารพันธุกรรมได้เฉพาะ DNA เท่านั้น ดังนั้นจึงต้องใช้เอนไซม์ Reverse Transcriptase เปลี่ยน Viral RNA ให้กลายเป็น complementary DNA (cDNA) ก่อนเข้ากระบวนการ PCR"
  },
  {
    id: "ch2_q7",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Inclusion Bodies",
    virusType: "default",
    q: "Intranuclear inclusion bodies กับ Intracytoplasmic inclusion bodies มีความสัมพันธ์กับตำแหน่งการเพิ่มจำนวนของสารพันธุกรรมอย่างไร?",
    choices: [
      "DNA viruses ส่วนใหญ่สร้างในนิวเคลียส (ยกเว้น Poxvirus) ขณะที่ RNA viruses ส่วนใหญ่สร้างในไซโทพลาสซึม (ยกเว้น Influenza)",
      "ไวรัสทุกชนิดสร้าง Inclusion bodies ในนิวเคลียสเท่านั้น",
      "RNA viruses ทั้งหมดสร้างในนิวเคลียส ส่วน DNA viruses สร้างในไซโทพลาสซึม",
      "Inclusion bodies เกิดจากการสะสมของสารพิษที่สัตว์กินเข้าไป ไม่เกี่ยวกับไวรัส"
    ],
    answer: "DNA viruses ส่วนใหญ่สร้างในนิวเคลียส (ยกเว้น Poxvirus) ขณะที่ RNA viruses ส่วนใหญ่สร้างในไซโทพลาสซึม (ยกเว้น Influenza)",
    explanation: "DNA viruses ส่วนใหญ่จำลองตัวในนิวเคลียสจึงพบ Intranuclear inclusion bodies (เช่น Herpes, Adeno) ข้อยกเว้นคือ Poxvirus ที่จำลองตัวในไซโทพลาสซึม ส่วน RNA viruses จำลองตัวในไซโทพลาสซึมจึงพบ Intracytoplasmic inclusions (เช่น Rabies Negri bodies)"
  },
  {
    id: "ch2_q8",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Viral Neutralization (VN)",
    virusType: "default",
    q: "การทดสอบ Virus Neutralization Test (VNT) จัดเป็นวิธีมาตรฐานสูงสุด (Gold Standard) ในการตรวจอะไร?",
    choices: [
      "ตรวจวัดระดับ Neutralizing antibody ในซีรั่มที่สามารถยับยั้งความสามารถในการติดเชื้อของไวรัสได้จริง",
      "ตรวจหาความยาวของสายพันธุกรรมไวรัส",
      "ตรวจนับจำนวนเม็ดเลือดขาวที่ถูกไวรัสทำลาย",
      "ตรวจวัดความเป็นกรดด่างของสิ่งแวดล้อมที่ไวรัสอาศัยอยู่"
    ],
    answer: "ตรวจวัดระดับ Neutralizing antibody ในซีรั่มที่สามารถยับยั้งความสามารถในการติดเชื้อของไวรัสได้จริง",
    explanation: "VNT ประเมินความสามารถของแอนติบอดีในซีรั่มในการเข้าจับและลบล้างฤทธิ์ (Neutralize) ไวรัสที่มีชีวิต ทำให้ไวรัสไม่สามารถเข้าติดเชื้อหรือก่อ CPE ในเซลล์เพาะเลี้ยงได้"
  },
  {
    id: "ch2_q9",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Disinfection Protocol",
    virusType: "default",
    q: "ในการทำลายเชื้อไวรัสไม่มีเปลือกหุ้ม (Naked virus เช่น Parvovirus, FMDV) ในฟาร์ม น้ำยาฆ่าเชื้อชนิดใดมีประสิทธิภาพสูงที่สุด?",
    choices: [
      "Sodium hypochlorite (Bleach) หรือ Glutaraldehyde",
      "70% Ethyl alcohol",
      "Chlorhexidine 0.5%",
      "น้ำสบู่ธรรมดา"
    ],
    answer: "Sodium hypochlorite (Bleach) หรือ Glutaraldehyde",
    explanation: "แอลกอฮอล์และคลอร์เฮกซีดีนไม่สามารถทำลาย Non-enveloped viruses ได้ดี จำเป็นต้องใช้สารออกซิไดซ์รุนแรง เช่น Sodium hypochlorite (Bleach 1:32) หรือสารเชื่อมขวางโปรตีน เช่น Glutaraldehyde"
  },
  {
    id: "ch2_q10",
    chapter: 2,
    chapterTitle: "Basic knowledge of Vet virology Part 2",
    virusName: "Viremia & Spread",
    virusType: "default",
    q: "ภาวะที่มีอนุภาคไวรัสกระจายเข้าสู่กระแสเลือดเพื่อแพร่ไปยังอวัยวะเป้าหมายทั่วร่างกาย เรียกว่าอะไร?",
    choices: [
      "Viremia",
      "Bacteremia",
      "Septic shock",
      "Toxemia"
    ],
    answer: "Viremia",
    explanation: "Viremia คือการมีไวรัสอยู่ในกระแสเลือด แบ่งเป็น Primary viremia (กระจายจากจุดเริ่มติดเชื้อสู่ระบบน้ำเหลืองและเลือด) และ Secondary viremia (เพิ่มจำนวนจากอวัยวะเป้าหมายแล้วกลับเข้าสู่กระแสเลือดในปริมาณสูง)"
  },

  // ── CHAPTER 3: Parvoviridae and Adenoviridae ──
  {
    id: "ch3_q1",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "Canine Parvovirus (CPV-2)",
    virusType: "parvo",
    q: "เหตุใด Canine Parvovirus (CPV-2) จึงจำเพาะเจาะจงทำลายเซลล์เยื่อบุผนังลำไส้ส่วน Crypt of Lieberkühn และเซลล์ในไขกระดูก?",
    choices: [
      "เพราะจีโนมเป็น ssDNA ไวรัสต้องการเอนไซม์ DNA polymerase ของเซลล์ที่กำลังแบ่งตัวเร็ว (Mitotically active cells) ในระยะ S-phase",
      "เพราะไวรัสสร้างสารพิษที่ทำลายไขมันในลำไส้โดยตรง",
      "เพราะเซลล์เหล่านี้มีอุณหภูมิสูงกว่าอวัยวะอื่น",
      "เพราะไวรัสสามารถเคลื่อนที่ได้เฉพาะในทางเดินอาหารเท่านั้น"
    ],
    answer: "เพราะจีโนมเป็น ssDNA ไวรัสต้องการเอนไซม์ DNA polymerase ของเซลล์ที่กำลังแบ่งตัวเร็ว (Mitotically active cells) ในระยะ S-phase",
    explanation: "Parvovirus เป็น autonomous ssDNA virus ไม่มีเอนไซม์ polymerase เป็นของตัวเอง จึงต้องอาศัย Cellular DNA replication machinery ของเซลล์โฮสต์ที่กำลังแบ่งตัวเร็ว เช่น Intestinal crypt cells และ Bone marrow precursor cells"
  },
  {
    id: "ch3_q2",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "CPV Pathophysiology",
    virusType: "parvo",
    q: "อาการทางโลหิตวิทยาที่จำเพาะและพบได้บ่อยที่สุดในสุนัขที่ติดเชื้อ Canine Parvovirus ในระยะวิกฤตคือข้อใด?",
    choices: [
      "ภาวะเม็ดเลือดขาวต่ำอย่างรุนแรง (Panleukopenia / Severe Leukopenia)",
      "ภาวะเกล็ดเลือดสูงผิดปกติ (Thrombocytosis)",
      "ภาวะเม็ดเลือดแดงแตกตัวเฉียบพลัน (Severe Hemolytic anemia)",
      "ภาวะเม็ดเลือดขาวชนิด Eosinophil สูงผิดปกติ"
    ],
    answer: "ภาวะเม็ดเลือดขาวต่ำอย่างรุนแรง (Panleukopenia / Severe Leukopenia)",
    explanation: "การทำลายเซลล์ต้นกำเนิดเม็ดเลือดขาวในไขกระดูก (Myeloid progenitor cells) และต่อมน้ำเหลือง ร่วมกับการสูญเสียเซลล์เม็ดเลือดขาวออกไปทางลำไส้ที่อักเสบ ทำให้เกิด Severe Leukopenia (< 2,000 cells/μL)"
  },
  {
    id: "ch3_q3",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "Feline Panleukopenia Virus (FPV)",
    virusType: "parvo",
    q: "แม่แมวที่ติดเชื้อ Feline Panleukopenia Virus (FPV) ในช่วงตั้งท้องระยะท้าย ลูกแมวที่คลอดออกมามักพบความพิการแต่กำเนิดแบบใด?",
    choices: [
      "สมองน้อยฝ่อลีบแต่กำเนิด (Cerebellar hypoplasia) ทำให้ลูกแมวเดินเซ ขาสั่น (Ataxia)",
      "ตาบอดถาวรจากต้อกระจก",
      "หัวใจพิการแต่กำเนิดแบบผนังกั้นหัวใจรั่ว",
      "กระดูกขาสั้นผิดรูป"
    ],
    answer: "สมองน้อยฝ่อลีบแต่กำเนิด (Cerebellar hypoplasia) ทำให้ลูกแมวเดินเซ ขาสั่น (Ataxia)",
    explanation: "FPV โจมตีเซลล์ Purkinje และ External germinal layer ของสมองน้อย (Cerebellum) ที่กำลังแบ่งตัวอย่างรวดเร็วในลูกสัตว์ช่วงท้ายของการตั้งท้องและแรกเกิด ทำให้สมองน้อยเจริญผิดปกติ เกิด Cerebellar hypoplasia"
  },
  {
    id: "ch3_q4",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "Canine Adenovirus-1 (CAV-1)",
    virusType: "default",
    q: "ลักษณะอาการ 'Blue eye' (กระจกตาบวมขุ่นเป็นสีฟ้า) ในสุนัขที่ติดเชื้อหรือฟื้นตัวจาก Canine Adenovirus type 1 (CAV-1) เกิดจากกลไกใด?",
    choices: [
      "ปฏิกิริยาภูมิแพ้ชนิด Type III Hypersensitivity เกิด Immune complex ตกตะกอนที่ Corneal endothelium",
      "การที่ไวรัสทำลายประสาทตาโดยตรงจนขาดเลือดไปเลี้ยง",
      "การติดเชื้อแบคทีเรียแทรกซ้อนที่แผลหลุมกระจกตา",
      "เม็ดสีเมลานินในม่านตาสลายตัวจากพิษของไวรัส"
    ],
    answer: "ปฏิกิริยาภูมิแพ้ชนิด Type III Hypersensitivity เกิด Immune complex ตกตะกอนที่ Corneal endothelium",
    explanation: "Blue eye เกิดจาก Antigen-Antibody complexes (Type III hypersensitivity) ตกตะกอนที่หลอดเลือดของ Uvea และ Corneal endothelium ทำให้เกิด Anterior uveitis และ Corneal edema จนกระจกตาขุ่นเป็นสีฟ้า"
  },
  {
    id: "ch3_q5",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "CAV-2 Vaccine Rationale",
    virusType: "default",
    q: "เหตุใดวัคซีนรวมป้องกันโรคในสุนัขจึงนิยมใช้สายพันธุ์ Canine Adenovirus type 2 (CAV-2) แทนที่จะใช้ CAV-1?",
    choices: [
      "CAV-2 สามารถกระตุ้นภูมิคุ้มกันข้ามสายพันธุ์ไปป้องกัน CAV-1 ได้ดี โดยไม่ก่อผลข้างเคียงเรื่อง Blue eye และไตอักเสบ",
      "CAV-1 ไม่สามารถนำมาผลิตเป็นวัคซีนเชื้อตายหรือเชื้อเป็นได้",
      "CAV-2 ก่อโรคลำไส้อักเสบที่รุนแรงกว่า CAV-1 จึงจำเป็นต้องใช้วัคซีนสายพันธุ์นี้",
      "CAV-1 มีราคาในการเพาะเลี้ยงสูงกว่า CAV-2 หลายเท่าตัว"
    ],
    answer: "CAV-2 สามารถกระตุ้นภูมิคุ้มกันข้ามสายพันธุ์ไปป้องกัน CAV-1 ได้ดี โดยไม่ก่อผลข้างเคียงเรื่อง Blue eye และไตอักเสบ",
    explanation: "CAV-2 ก่อโรคทางเดินหายใจ (Laryngotracheitis) ซึ่งมีแอนติเจนที่คล้ายคลึงกับ CAV-1 มาก เมื่อฉีดเป็นวัคซีนจะกระตุ้น Cross-protective immunity ต่อ Infectious Canine Hepatitis (CAV-1) ได้โดยปลอดภัยและไม่ทำให้เกิด Blue eye"
  },
  {
    id: "ch3_q6",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "Adenovirus Morphology",
    virusType: "default",
    q: "โครงสร้างเด่นพิเศษของ Capsid ในไวรัสตระกูล Adenoviridae ที่ยื่นออกมาจากมุมทั้ง 12 มุม (Penton bases) เรียกว่าอะไร?",
    choices: [
      "Fibers (เสาหนามปลายกระเปาะ)",
      "Peplomers",
      "Tegument",
      "Tail fibers"
    ],
    answer: "Fibers (เสาหนามปลายกระเปาะ)",
    explanation: "Adenovirus มี Fibers ยื่นออกมาจาก Penton bases ทั้ง 12 มุมของ Capsid ปลายเป็นกระเปาะ (Knob) ทำหน้าที่เป็น Hemagglutinin และเข้าจับกับ Receptor (CAR) บนผิวเซลล์โฮสต์"
  },
  {
    id: "ch3_q7",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "Porcine Parvovirus (PPV)",
    virusType: "parvo",
    q: "กลุ่มอาการ 'SMEDI' ในฟาร์มสุกรพันธุ์ มักมีสาเหตุหลักมาจากการติดเชื้อไวรัสชนิดใด?",
    choices: [
      "Porcine Parvovirus (PPV)",
      "Porcine Circovirus type 2 (PCV2)",
      "Swine Influenza Virus (SIV)",
      "Porcine Rotavirus"
    ],
    answer: "Porcine Parvovirus (PPV)",
    explanation: "PPV เป็นสาเหตุคลาสสิกของกลุ่มอาการ SMEDI: Stillbirth (ลูกตายคลอด), Mummification (ลูกมัมมี่แห้ง), Embryonic Death (ตัวอ่อนตายในท้อง), และ Infertility (ผสมไม่ติด/เป็นหมัน)"
  },
  {
    id: "ch3_q8",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "Parvo Diagnosis SNAP Test",
    virusType: "parvo",
    q: "ชุดตรวจเร็ว SNAP Parvo Test ที่ใช้ในคลินิกสัตวแพทย์ ตรวจหาอะไรจากตัวอย่างอุจจาระของสุนัข?",
    choices: [
      "Viral antigen (โปรตีนแคปซิดของไวรัส)",
      "Antibody (ภูมิคุ้มกันของสุนัข)",
      "Viral DNA ด้วยวิธี PCR ภายในตลับ",
      "ระดับเอนไซม์จากตับอ่อน"
    ],
    answer: "Viral antigen (โปรตีนแคปซิดของไวรัส)",
    explanation: "SNAP Parvo Test ใช้หลักการ ELISA ในการตรวจจับ Viral Antigen (โปรตีน VP2 ของไวรัส) ที่ขับออกมาในปริมาณมหาศาลทางอุจจาระของสุนัขป่วย"
  },
  {
    id: "ch3_q9",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "Canine Parvovirus Myocarditis",
    virusType: "parvo",
    q: "ลูกสุนัขที่ติดเชื้อ Canine Parvovirus ในช่วงอายุแรกเกิดไม่เกิน 2-4 สัปดาห์ อาจแสดงอาการแบบใดที่ต่างจากสุนัขโตและทำให้ตายเฉียบพลัน?",
    choices: [
      "กล้ามเนื้อหัวใจอักเสบเฉียบพลัน (Non-suppurative Myocarditis)",
      "ไตวายเฉียบพลันและปัสสาวะเป็นเลือด",
      "สมองอักเสบและชักเกร็ง",
      "ตับแข็งและดีซ่านรุนแรง"
    ],
    answer: "กล้ามเนื้อหัวใจอักเสบเฉียบพลัน (Non-suppurative Myocarditis)",
    explanation: "ในลูกสุนัขแรกเกิด เซลล์กล้ามเนื้อหัวใจ (Myocytes) ยังคงมีการแบ่งตัวอย่างรวดเร็ว CPV-2 จึงเข้าทำลายกล้ามเนื้อหัวใจโดยตรง ทำให้หัวใจล้มเหลวเฉียบพลันหรือปอดบวมน้ำตายกระทันหัน"
  },
  {
    id: "ch3_q10",
    chapter: 3,
    chapterTitle: "Parvoviridae and Adenoviridae",
    virusName: "Infectious Canine Hepatitis Pathology",
    virusType: "default",
    q: "รอยโรคทางจุลพยาธิวิทยาที่จำเพาะของโรคตับอักเสบติดต่อในสุนัข (ICH จาก CAV-1) คือข้อใด?",
    choices: [
      "Large Basophilic/Amphophilic Intranuclear Inclusion bodies ในเซลล์ตับ (Hepatocytes) และ Endothelium",
      "Eosinophilic Intracytoplasmic Inclusion bodies ในเซลล์ประสาท",
      "เซลล์ตับเปลี่ยนเป็นไขมันสะสมทั้งหมดโดยไม่พบ Inclusion bodies",
      "การเกิด Granuloma ล้อมรอบด้วยเซลล์หนอง"
    ],
    answer: "Large Basophilic/Amphophilic Intranuclear Inclusion bodies ในเซลล์ตับ (Hepatocytes) และ Endothelium",
    explanation: "CAV-1 จำลองตัวในนิวเคลียสของเซลล์ตับและเซลล์เยื่อบุหลอดเลือด ทำให้เกิด Intranuclear inclusion bodies ขนาดใหญ่ (Cowdry type A) ย้อมติดสีม่วงเข้มในนิวเคลียส"
  },

  // ── CHAPTER 4: Herpesviridae ──
  {
    id: "ch4_q1",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Herpesvirus Latency",
    virusType: "herpes",
    q: "คุณสมบัติสำคัญที่เป็นเอกลักษณ์ของไวรัสตระกูล Herpesviridae ทุกชนิดในการดำรงชีวิตในตัวโฮสต์คือข้อใด?",
    choices: [
      "การซ่อนตัวแฝงแบบสงบ (Latency) ตลอดชีวิต และสามารถกลับมาก่อโรคใหม่ (Reactivation) เมื่อสัตว์เครียดหรือภูมิคุ้มกันตก",
      "การกลายพันธุ์ของแอนติเจนบนผิวตลอดเวลาเพื่อหลบภูมิคุ้มกัน",
      "การทนทานต่ออุณหภูมิน้ำเดือดและสารฆ่าเชื้อในสิ่งแวดล้อมได้หลายปี",
      "การติดต่อผ่านทางพันธุกรรมแบบ Mendelian inheritance เท่านั้น"
    ],
    answer: "การซ่อนตัวแฝงแบบสงบ (Latency) ตลอดชีวิต และสามารถกลับมาก่อโรคใหม่ (Reactivation) เมื่อสัตว์เครียดหรือภูมิคุ้มกันตก",
    explanation: "Herpesvirus ทุกชนิดสามารถสร้าง Latent infection หลังจากการติดเชื้อครั้งแรก โดยสารพันธุกรรมจะคงอยู่ในเซลล์เป้าหมาย (เช่น Sensory ganglia หรือ Lymphocytes) แบบ Episome ตลอดชีวิตของสัตว์"
  },
  {
    id: "ch4_q2",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Feline Herpesvirus-1 (FHV-1)",
    virusType: "herpes",
    q: "Feline Herpesvirus-1 (FHV-1) แฝงตัว (Latency) อยู่ที่บริเวณใดของร่างกายแมว และรอยโรคที่ตาที่จำเพาะเจาะจงมากที่สุดคืออะไร?",
    choices: [
      "Trigeminal ganglion แฝงตัว และก่อแผลหลุมรูปกิ่งก้านสาขาที่กระจกตา (Dendritic corneal ulcer)",
      "Sciatic nerve แฝงตัว และก่อกระจกตาขุ่นเป็นสีฟ้า (Blue eye)",
      "Bone marrow แฝงตัว และก่อต้อกระจกตาขาวขุ่น",
      "Ciliary ganglion แฝงตัว และก่อเนื้องอกในลูกตา"
    ],
    answer: "Trigeminal ganglion แฝงตัว และก่อแผลหลุมรูปกิ่งก้านสาขาที่กระจกตา (Dendritic corneal ulcer)",
    explanation: "FHV-1 ซ่อนตัวอยู่ใน Trigeminal ganglia เมื่อเกิด Reactivation จะก่อแผลหลุมที่กระจกตาลักษณะแตกแขนงคล้ายกิ่งไม้ (Dendritic ulcer) ซึ่งเป็น Pathognomonic lesion ของ FHV-1"
  },
  {
    id: "ch4_q3",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Pseudorabies (Aujeszky's Disease)",
    virusType: "herpes",
    q: "โรค Aujeszky's disease (Pseudorabies) มีสัตว์ชนิดใดเป็นรังโรคตามธรรมชาติ (Natural host) และก่อให้เกิดอาการรุนแรงอย่างไรเมื่อติดเชื้อข้ามไปสู่โคหรือสุนัข (Dead-end hosts)?",
    choices: [
      "สุกรเป็นรังโรคตามธรรมชาติ ส่วนโคและสุนัขจะแสดงอาการคันอย่างคลุ้มคลั่ง (Mad itch) และตายรวดเร็ว",
      "หนูเป็นรังโรคตามธรรมชาติ ส่วนสุกรจะแสดงอาการท้องเสียถ่ายเป็นเลือด",
      "สุนัขเป็นรังโรคตามธรรมชาติ ส่วนสุกรจะเกิดอาการอัมพาตครึ่งท่อน",
      "ม้าเป็นรังโรคตามธรรมชาติ ส่วนโคจะมีตุ่มน้ำใสที่กีบเท้า"
    ],
    answer: "สุกรเป็นรังโรคตามธรรมชาติ ส่วนโคและสุนัขจะแสดงอาการคันอย่างคลุ้มคลั่ง (Mad itch) และตายรวดเร็ว",
    explanation: "สุกรเป็น Natural host ของ Suid herpesvirus 1 (PRV) มักทำให้แท้งในแม่สุกรหรือประสาทในลูกสุกร แต่หากแพร่สู่ Non-porcine species (โค สุนัข แมว) จะก่ออาการคันรุนแรงจนกัดแทะเนื้อตัวเอง (Mad itch/Intense pruritus) และตาย 100%"
  },
  {
    id: "ch4_q4",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Marek's Disease Virus (MDV)",
    virusType: "herpes",
    q: "Marek's Disease ในไก่ เกิดจาก Gallid alphaherpesvirus 2 มีลักษณะพยาธิสภาพเด่นชัดคือข้อใด?",
    choices: [
      "การแทรกตัวของเซลล์ T-lymphoma ทำให้เส้นประสาทบวมโต (Sciatic nerve enlargement) ส่งผลให้ไก่มีท่าเดินขาเหยียดหน้าหลัง และมีเนื้องอกตามอวัยวะภายใน",
      "การทำลาย Bursa of Fabricius จนฝ่อและท้องเสียสีขาว",
      "การเกิดตุ่มหนองบนหงอนและเหนียง",
      "การเกิดก้อนนิ่วอุดตันในท่อนำไข่"
    ],
    answer: "การแทรกตัวของเซลล์ T-lymphoma ทำให้เส้นประสาทบวมโต (Sciatic nerve enlargement) ส่งผลให้ไก่มีท่าเดินขาเหยียดหน้าหลัง และมีเนื้องอกตามอวัยวะภายใน",
    explanation: "Marek's disease เป็น Oncogenic herpesvirus ที่เปลี่ยนสภาพ T-cells ให้กลายเป็น Lymphoma เข้าแทรกใน Peripheral nerves (ทำให้เส้นประสาท Sciatic บวมโต ไก่แสดงท่าขาเหยียดข้างหนึ่งไปหน้า ข้างหนึ่งไปหลัง) และเกิดเนื้องอกในอวัยวะภายใน"
  },
  {
    id: "ch4_q5",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Infectious Bovine Rhinotracheitis (IBR)",
    virusType: "herpes",
    q: "Bovine Alphaherpesvirus 1 (BoHV-1) เป็นสาเหตุของโรค IBR ในโค มักก่อให้เกิดกลุ่มอาการใดต่อไปนี้?",
    choices: [
      "เยื่อบุจมูกอักเสบมีเนื้อตายสีแดง (Red nose), หลอดลมอักเสบ, แท้งลูกช่วงท้าย และโรคติดเชื้อที่อวัยวะสืบพันธุ์ (IPV)",
      "ท้องเสียถ่ายเป็นน้ำพุ่งและกีบหลุด",
      "ต่อมน้ำเหลืองโตทั่วตัวและมีน้ำท่วมปอดอย่างรุนแรง",
      "กล้ามเนื้อขาลีบและชักเกร็ง"
    ],
    answer: "เยื่อบุจมูกอักเสบมีเนื้อตายสีแดง (Red nose), หลอดลมอักเสบ, แท้งลูกช่วงท้าย และโรคติดเชื้อที่อวัยวะสืบพันธุ์ (IPV)",
    explanation: "BoHV-1 ก่อโรค Infectious Bovine Rhinotracheitis (IBR) แสดงอาการ Red nose, ตาอักเสบ (Conjunctivitis), แท้งลูก (Abortion storms), และการอักเสบของอวัยวะสืบพันธุ์ภายนอก (Infectious Pustular Vulvovaginitis - IPV)"
  },
  {
    id: "ch4_q6",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Equine Herpesvirus (EHV-1 vs EHV-4)",
    virusType: "herpes",
    q: "ความแตกต่างสำคัญทางคลินิกระหว่าง Equine Herpesvirus-1 (EHV-1) และ EHV-4 ในม้าคือข้อใด?",
    choices: [
      "EHV-1 ก่อการแท้งลูก (Abortion storms) และอาการทางระบบประสาท (EHM) ได้บ่อยกว่า EHV-4 ซึ่งส่วนใหญ่ก่อโรคทางเดินหายใจในม้าอายุน้อย",
      "EHV-4 ก่อโรคพิษสุนัขบ้าเทียม ส่วน EHV-1 ไม่ก่อโรคในม้า",
      "EHV-1 ติดต่อผ่านทางแมลงดูดเลือดเท่านั้น ส่วน EHV-4 ติดต่อทางเดินหายใจ",
      "EHV-4 ทำให้เกิดโรคโลหิตจางรุนแรงในม้าแข่ง"
    ],
    answer: "EHV-1 ก่อการแท้งลูก (Abortion storms) และอาการทางระบบประสาท (EHM) ได้บ่อยกว่า EHV-4 ซึ่งส่วนใหญ่ก่อโรคทางเดินหายใจในม้าอายุน้อย",
    explanation: "EHV-4 มักก่อโรคทางเดินหายใจส่วนบน (Rhinopneumonitis) ในลูกม้า ขณะที่ EHV-1 มี Endotheliotropism สูง สามารถทำให้เกิดการแท้งลูกในม้าอุ้มท้อง (Abortion storms) และก่อมะเร็งไขสันหลัง/อัมพาต (Equine Herpesvirus Myeloencephalopathy - EHM)"
  },
  {
    id: "ch4_q7",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Malignant Catarrhal Fever (MCF)",
    virusType: "herpes",
    q: "โรค Malignant Catarrhal Fever (MCF) ในโค กระบือ และกวาง มีลักษณะพยาธิสภาพเด่นคือการอักเสบของหลอดเลือดทั่วร่างกาย (Vasculitis) โดยมีสัตว์ชนิดใดเป็นพาหะแฝงโรคที่ไม่แสดงอาการ?",
    choices: [
      "แกะ (OvHV-2) หรือวิลเดอบีสต์ (AlHV-1)",
      "สุนัขและแมว",
      "หนูนาและสัตว์ฟันแทะ",
      "นกพิราบและเป็ดป่า"
    ],
    answer: "แกะ (OvHV-2) หรือวิลเดอบีสต์ (AlHV-1)",
    explanation: "MCF เกิดจาก Gammaherpesvirus มีแกะเป็นรังโรคแฝง (Sheep-associated MCF: OvHV-2) โดยแกะไม่แสดงอาการป่วย แต่เมื่อแพร่สู่โคหรือกระบือจะเกิด Severe necrotizing vasculitis, เยื่อบุตาขุ่นขาวจากขอบเข้ากลาง (Centripetal corneal opacity), และตายเกือบ 100%"
  },
  {
    id: "ch4_q8",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Herpesvirus Structure",
    virusType: "herpes",
    q: "บริเวณช่องว่างระหว่าง Capsid และ Envelope ของอนุภาค Herpesvirus ที่บรรจุโปรตีนควบคุมการแสดงออกของยีนจำนวนมาก เรียกว่าอะไร?",
    choices: [
      "Tegument",
      "Penton base",
      "Matrix space",
      "Core vacuole"
    ],
    answer: "Tegument",
    explanation: "Tegument เป็นโครงสร้างจำเพาะของ Herpesvirus บรรจุโปรตีนมากกว่า 20 ชนิด (เช่น VP16, vhs) ที่ทำหน้าที่ยับยั้งการตอบสนองของเซลล์โฮสต์และช่วยเปิดการแปลรหัสยีนของไวรัสทันทีที่เข้าสู่เซลล์"
  },
  {
    id: "ch4_q9",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Infectious Laryngotracheitis (ILT)",
    virusType: "herpes",
    q: "โรค Infectious Laryngotracheitis (ILT) ในไก่ ก่อให้เกิดอาการและรอยโรคที่เด่นชัดที่สุดในระบบใด?",
    choices: [
      "ทางเดินหายใจส่วนต้น: หายใจลำบาก อ้าปากหายใจ ไอสะบัดมีก้อนเมือกปนเลือด (Hemorrhagic exudate) อุดกั้นในกล่องเสียงและหลอดลม",
      "ทางเดินอาหาร: ถ่ายเป็นเลือดสดและมีตุ่มหนองที่หลอดอาหาร",
      "ระบบประสาท: คอบิดและชักหมุนเป็นวงกลม",
      "ระบบสืบพันธุ์: ไข่เปลือกนิ่มผิดรูป"
    ],
    answer: "ทางเดินหายใจส่วนต้น: หายใจลำบาก อ้าปากหายใจ ไอสะบัดมีก้อนเมือกปนเลือด (Hemorrhagic exudate) อุดกั้นในกล่องเสียงและหลอดลม",
    explanation: "Gallid alphaherpesvirus 1 (ILTV) ก่อโรคในไก่ ทำให้เกิด Fibrinonecrotic & hemorrhagic laryngotracheitis ไก่จะมีอาการหายใจหอบลึก ยืดคออ้าปากหายใจ และไอสะบัดเลือดออกมาเปื้อนผนังเล้า"
  },
  {
    id: "ch4_q10",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    virusName: "Herpes Inclusion Bodies",
    virusType: "herpes",
    q: "Inclusion bodies ที่ตรวจพบในเซลล์ที่ติดเชื้อ Herpesvirus มีลักษณะอย่างไรและพบที่ตำแหน่งใดของเซลล์?",
    choices: [
      "Eosinophilic Intranuclear Inclusion bodies (Cowdry type A) ในนิวเคลียส",
      "Basophilic Intracytoplasmic Inclusion bodies ในไซโทพลาสซึม",
      "Negri bodies ในไซโทพลาสซึมของเซลล์ประสาท",
      "Guarnieri bodies ในผิวหนัง"
    ],
    answer: "Eosinophilic Intranuclear Inclusion bodies (Cowdry type A) ในนิวเคลียส",
    explanation: "Herpesvirus จำลองสารพันธุกรรมในนิวเคลียส จึงพบ Cowdry type A eosinophilic intranuclear inclusion bodies ล้อมรอบด้วยขอบใส (Halo) ใต้เยื่อหุ้มนิวเคลียส"
  },

  // ── CHAPTER 5: Pox, Asfar, Papilloma, Polyoma & Iridoviridae ──
  {
    id: "ch5_q1",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "African Swine Fever Virus (ASFV)",
    virusType: "pox",
    q: "African Swine Fever Virus (ASFV) จัดเป็นไวรัสชนิดเดียวในตระกูล Asfarviridae มีลักษณะจีโนมแบบใด และมีพาหะชีวภาพ (Biological vector) ตามธรรมชาติคืออะไร?",
    choices: [
      "dsDNA ขนาดใหญ่ และมีเห็บอ่อนสกุล Ornithodoros เป็นพาหะชีวภาพ",
      "(+)ssRNA และมียุงลาย Aedes เป็นพาหะ",
      "(-)ssRNA และมีแมลงวันคอก Stomoxys เป็นพาหะหลัก",
      "dsRNA และมีไรไก่ Dermanyssus เป็นพาหะ"
    ],
    answer: "dsDNA ขนาดใหญ่ และมีเห็บอ่อนสกุล Ornithodoros เป็นพาหะชีวภาพ",
    explanation: "ASFV เป็นไวรัส dsDNA ขนาดใหญ่ชนิดเดียวที่เป็น Arbovirus (ติดเชื้อในสัตว์ขาปล้องและแพร่สู่สัตว์เลี้ยงลูกด้วยนมได้) โดยมีเห็บอ่อน (Soft tick: Ornithodoros moubata) เป็น Biological vector และ Reservoir"
  },
  {
    id: "ch5_q2",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "ASFV Gross Pathology",
    virusType: "pox",
    q: "รอยโรคทางผ่าซากที่พบบ่อยและเด่นชัดที่สุดในสุกรที่ตายจากโรค African Swine Fever (ASF) ชนิดรุนแรงเฉียบพลันคือข้อใด?",
    choices: [
      "ม้ามขยายใหญ่บวมคล้ำมากคล้ายแยมแบล็กเบอร์รี (Blackberry jam spleen) และเลือดออกในต่อมน้ำเหลืองคล้ายก้อนเลือด",
      "ไตบวมโตมีจุดหนองสีขาวกระจายทั่วผิว",
      "ปอดแฟบและตับแข็งเป็นก้อนแข็งสีเทา",
      "ลำไส้เล็กทะลุเป็นรูพรุนทั่วพื้นผิว"
    ],
    answer: "ม้ามขยายใหญ่บวมคล้ำมากคล้ายแยมแบล็กเบอร์รี (Blackberry jam spleen) และเลือดออกในต่อมน้ำเหลืองคล้ายก้อนเลือด",
    explanation: "ASF ทำลาย Monocytes/Macrophages และหลอดเลือดอย่างรุนแรง ทำให้เกิด Massive hemorrhage และ Congestion: ม้ามบวมขยายใหญ่มาก (Splenomegaly) สีม่วงดำคล้ำคล้ายก้อนแยม และต่อมน้ำเหลือง Gastrohepatic/Renal มีเลือดออกคล้ายก้อนเลือด (Hemorrhagic lymphadenitis)"
  },
  {
    id: "ch5_q3",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "Lumpy Skin Disease Virus (LSDV)",
    virusType: "pox",
    q: "Lumpy Skin Disease Virus (LSDV) ในโคและกระบือ จัดอยู่ในสกุล (Genus) ใดของตระกูล Poxviridae?",
    choices: [
      "Capripoxvirus",
      "Orthopoxvirus",
      "Parapoxvirus",
      "Avipoxvirus"
    ],
    answer: "Capripoxvirus",
    explanation: "LSDV จัดอยู่ในสกุล Capripoxvirus ซึ่งมีความสัมพันธ์ทางแอนติเจนใกล้ชิดกับ Sheeppox virus และ Goatpox virus ติดต่อหลักผ่านทางแมลงดูดเลือด (Stomoxys, ยุง, เห็บ)"
  },
  {
    id: "ch5_q4",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "LSDV Clinical Signs",
    virusType: "pox",
    q: "ลักษณะรอยโรคบนผิวหนังที่เป็นเอกลักษณ์ของโรคลัมปีสกิน (LSD) ในโคคือข้อใด?",
    choices: [
      "ก้อนตุ่มนูนแข็ง (Nodules / Lumps) ขนาด 1-5 ซม. กระจายทั่วผิวหนัง ซึ่งอาจแห้งตายกลายเป็นแผลหลุมลึกที่เรียกว่า 'Sit-fast'",
      "แผลตุ่มน้ำใสพุพองที่กีบเท้าและริมฝีปากเท่านั้น",
      "ขนร่วงเป็นวงกลมสะเก็ดสีขาวคล้ายขี้กลาก",
      "ผิวหนังแตกลายงาและมีเลือดซึมตามรูขุมขน"
    ],
    answer: "ก้อนตุ่มนูนแข็ง (Nodules / Lumps) ขนาด 1-5 ซม. กระจายทั่วผิวหนัง ซึ่งอาจแห้งตายกลายเป็นแผลหลุมลึกที่เรียกว่า 'Sit-fast'",
    explanation: "LSD ก่อรอยโรคตุ่มนูนแข็งบนผิวหนังทั่วตัว ต่อมาส่วนกลางตุ่มจะเกิด Coagulative necrosis แห้งแข็งแยกหลุดออกจากผิวหนังโดยรอบ เรียกว่า 'Sit-fast' ทิ้งรอยแผลเป็นทำให้หนังเสียหาย"
  },
  {
    id: "ch5_q5",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "Poxvirus Replication Exception",
    virusType: "pox",
    q: "ไวรัสตระกูล Poxviridae มีความแตกต่างทางชีววิทยาจาก DNA viruses อื่นๆ เกือบทั้งหมดอย่างไร?",
    choices: [
      "เพิ่มจำนวนและจำลองสารพันธุกรรม DNA ภายในไซโทพลาสซึมของเซลล์โฮสต์ทั้งหมด",
      "เป็น DNA virus ชนิดเดียวที่ไม่มีเปลือกโปรตีน Capsid",
      "ต้องอาศัยเอนไซม์ Reverse transcriptase ในการสร้างโปรตีน",
      "ไม่สามารถเพิ่มจำนวนได้หากไม่มีการติดเชื้อแบคทีเรียร่วมด้วย"
    ],
    answer: "เพิ่มจำนวนและจำลองสารพันธุกรรม DNA ภายในไซโทพลาสซึมของเซลล์โฮสต์ทั้งหมด",
    explanation: "Poxvirus มีขนาดใหญ่และมีจีโนมที่ซับซ้อน สามารถถอดรหัสเอนไซม์สังเคราะห์ DNA และ RNA เป็นของตัวเองได้ครบถ้วน จึงจำลองสารพันธุกรรมทั้งหมดในไซโทพลาสซึม โดยไม่ต้องอาศัยนิวเคลียสของโฮสต์"
  },
  {
    id: "ch5_q6",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "Bovine Papillomavirus (BPV)",
    virusType: "default",
    q: "Bovine Papillomavirus type 1 และ 2 (BPV-1, BPV-2) เมื่อติดเชื้อข้ามสปีชีส์ไปยังม้า จะก่อให้เกิดเนื้องอกผิวหนังชนิดใดที่พบบ่อยที่สุดในม้า?",
    choices: [
      "Equine sarcoid (เนื้องอกซาร์คอยด์ในม้า)",
      "Squamous cell carcinoma",
      "Melanoma",
      "Mast cell tumor"
    ],
    answer: "Equine sarcoid (เนื้องอกซาร์คอยด์ในม้า)",
    explanation: "BPV-1 และ BPV-2 ก่อโรคติ่งเนื้อหูดในโค แต่เมื่อติดเชื้อในม้า ลา หรือล่อ จะกระตุ้น Fibroblasts ในชั้นหนังแท้ให้เจริญผิดปกติ กลายเป็น Equine Sarcoid ซึ่งเป็นเนื้องอกผิวหนังที่พบบ่อยที่สุดในม้า"
  },
  {
    id: "ch5_q7",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "Fowlpox Forms",
    virusType: "pox",
    q: "โรคฝีดาษไก่ (Fowlpox) มีการแสดงออกทางคลินิกเป็น 2 รูปแบบหลัก คือรูปแบบใดบ้าง?",
    choices: [
      "Dry form (ตุ่มสะเก็ดบนผิวหนังไร้ขน หงอน เหนียง) และ Wet form (Diphtheritic membrane ในช่องปากและกล่องเสียง)",
      "Acute form (ท้องเสียเป็นเลือด) และ Chronic form (ข้อบวม)",
      "Nerve form (คอบิด) และ Eye form (ตาบอด)",
      "Cardiac form (หัวใจโต) และ Renal form (ไตวาย)"
    ],
    answer: "Dry form (ตุ่มสะเก็ดบนผิวหนังไร้ขน หงอน เหนียง) และ Wet form (Diphtheritic membrane ในช่องปากและกล่องเสียง)",
    explanation: "Fowlpox มี 2 รูปแบบ: Cutaneous/Dry form มีตุ่มหูดสะเก็ดสีน้ำตาลบนหงอน เหนียง รอบตา และ Diphtheritic/Wet form เกิดแผ่นเยื่อเนื้อตายสีเหลืองหนาในช่องปาก กล่องเสียง และหลอดลม อุดตันทางเดินหายใจทำให้ไก่สำลักตาย"
  },
  {
    id: "ch5_q8",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "Contagious Ecthyma (Orf)",
    virusType: "pox",
    q: "โรค Orf (Contagious Ecthyma) ในแกะและแพะ ก่อให้เกิดตุ่มสะเก็ดแผลพุพองรอบริมฝีปาก จัดเป็นโรคติดต่อสู่คน (Zoonosis) คนมักติดโรคนี้ผ่านทางใด?",
    choices: [
      "การสัมผัสสัตว์ป่วยหรือซากแกะ-แพะที่มีรอยโรคโดยตรงผ่านรอยถลอกบนมือ",
      "การดื่มนมแพะพาสเจอร์ไรซ์",
      "การถูกยุงกัดในคอกแกะ",
      "การสูดดมละอองฝอยมูลสัตว์ทางอากาศ"
    ],
    answer: "การสัมผัสสัตว์ป่วยหรือซากแกะ-แพะที่มีรอยโรคโดยตรงผ่านรอยถลอกบนมือ",
    explanation: "Orf virus (Parapoxvirus) ติดต่อสู่คนผ่านผิวหนังที่มีแผลหรือรอยถลอกขณะจับสัมผัสปากแกะ-แพะที่เป็นโรค ในคนจะเกิดรอยโรคเป็นตุ่มนูนแข็ง (Maculopapular lesion) บนนิ้วมือหรือแขน"
  },
  {
    id: "ch5_q9",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "Myxoma Virus",
    virusType: "pox",
    q: "Myxoma virus (Leporipoxvirus) ก่อให้เกิดโรค Myxomatosis ในกระต่ายยุโรป (European rabbit) มีอาการสำคัญอย่างไร?",
    choices: [
      "อาการบวมน้ำของเปลือกตา โคนหู อวัยวะเพศ (Myxomatous swellings) และเยื่อบุตาอักเสบมีหนองเกรอะกรัง",
      "การเป็นหมันถาวรและขนร่วงหมดตัว",
      "ตับแข็งและท้องมารน้ำในช่องท้อง",
      "อาการชักเกร็งหลังกระตุก"
    ],
    answer: "อาการบวมน้ำของเปลือกตา โคนหู อวัยวะเพศ (Myxomatous swellings) และเยื่อบุตาอักเสบมีหนองเกรอะกรัง",
    explanation: "Myxomatosis ในกระต่ายเลี้ยง/กระต่ายยุโรปทำให้เกิด Myxoid tumors และ Subcutaneous edema บริเวณรอบตา (Sleepy head), จมูก, ริมฝีปาก, หู และอวัยวะสืบพันธุ์ อัตราการตายสูงเกือบ 100%"
  },
  {
    id: "ch5_q10",
    chapter: 5,
    chapterTitle: "Pox, Asfar, Papilloma, Polyoma and Iridoviridae",
    virusName: "Iridoviridae in Fish",
    virusType: "default",
    q: "ไวรัสตระกูล Iridoviridae มีความสำคัญทางสัตวแพทย์สัตว์น้ำอย่างมาก โดย Lymphocystis virus ก่อให้เกิดรอยโรคใดในปลา?",
    choices: [
      "ก้อนตุ่มเนื้องอกคล้ายไข่กบ (Lymphocystis cells) บนครีบและผิวหนัง ซึ่งเกิดจากเซลล์ขยายขนาดใหญ่ผิดปกติ (Hypertrophy)",
      "แผลหลุมลึกกัดกินกล้ามเนื้อจนถึงกระดูก",
      "ตาถลนบวมน้ำและท้องมาน",
      "เหงือกซีดขาวและครีบเปื่อยยุ่ย"
    ],
    answer: "ก้อนตุ่มเนื้องอกคล้ายไข่กบ (Lymphocystis cells) บนครีบและผิวหนัง ซึ่งเกิดจากเซลล์ขยายขนาดใหญ่ผิดปกติ (Hypertrophy)",
    explanation: "Lymphocystis virus ติดเชื้อในเซลล์ Fibroblasts ของปลา ทำให้เซลล์ขยายขนาดใหญ่ขึ้นมหาศาล (Massive cellular hypertrophy) สังเกตเห็นเป็นเม็ดตุ่มสีขาวขุ่นคล้ายไข่กบเกาะอยู่ตามครีบและลำตัว"
  },

  // ── CHAPTER 6: Retroviridae ──
  {
    id: "ch6_q1",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "Reverse Transcriptase & Provirus",
    virusType: "retro",
    q: "กระบวนการสำคัญที่เป็นเอกลักษณ์ของไวรัสตระกูล Retroviridae ในการแทรกสารพันธุกรรมเข้าสู่โฮสต์คือข้อใด?",
    choices: [
      "ใช้เอนไซม์ Reverse Transcriptase เปลี่ยน RNA เป็น dsDNA แล้วใช้ Integrase แทรกเป็น Provirus ในโครโมโซมของโฮสต์อย่างถาวร",
      "ใช้เอนไซม์ DNA Polymerase คัดลอก RNA ไปเป็น RNA สายคู่",
      "จำลองสารพันธุกรรมในไซโทพลาสซึมโดยไม่สัมผัสกับโครโมโซมของเซลล์",
      "ใช้โปรตีน Capsid หลอมรวมกับเยื่อหุ้มนิวเคลียสถาวร"
    ],
    answer: "ใช้เอนไซม์ Reverse Transcriptase เปลี่ยน RNA เป็น dsDNA แล้วใช้ Integrase แทรกเป็น Provirus ในโครโมโซมของโฮสต์อย่างถาวร",
    explanation: "Retrovirus มี Reverse Transcriptase (RT) เปลี่ยน (+)ssRNA เป็น complementary DNA (cDNA) และสร้างเป็น dsDNA จากนั้นเอนไซม์ Integrase จะตัดต่อจีโนมนี้แทรกเข้าสู่ Host DNA กลายเป็น Provirus ทำให้สัตว์ติดเชื้อไปตลอดชีวิต"
  },
  {
    id: "ch6_q2",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "FeLV vs FIV Difference",
    virusType: "retro",
    q: "ความแตกต่างในการตรวจวินิจฉัยด้วยชุดตรวจ SNAP Test ระหว่าง Feline Leukemia Virus (FeLV) และ Feline Immunodeficiency Virus (FIV) ในแมวคือข้อใด?",
    choices: [
      "FeLV ตรวจหา Viral Antigen (p27 capsid protein) ส่วน FIV ตรวจหา Antibody ต่อเชื้อ",
      "FeLV ตรวจหา Antibody ส่วน FIV ตรวจหา Antigen",
      "ทั้งสองโรคตรวจหาเฉพาะเชื้อไวรัสที่มีชีวิตในเลือด",
      "FeLV ตรวจหา DNA ในเม็ดเลือดแดง ส่วน FIV ตรวจหาโปรตีนในน้ำลาย"
    ],
    answer: "FeLV ตรวจหา Viral Antigen (p27 capsid protein) ส่วน FIV ตรวจหา Antibody ต่อเชื้อ",
    explanation: "แมวติดเชื้อ FeLV มักมี Viremia ในกระแสเลือด จึงตรวจหา p27 Antigen ได้โดยตรง ส่วน FIV เป็น Lentivirus เมื่อติดเชื้อแล้วจะแฝงตัวในเม็ดเลือดขาว แต่อิมมูนร่างกายจะสร้าง Antibody คงอยู่ตลอดชีวิต จึงตรวจหา Antibody เป็นหลัก"
  },
  {
    id: "ch6_q3",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "Equine Infectious Anemia (EIA)",
    virusType: "retro",
    q: "โรคโลหิตจางติดต่อในม้า (Equine Infectious Anemia - EIA) หรือ 'Swamp fever' มีการทดสอบทางห้องปฏิบัติการที่เป็น Gold Standard ระดับสากลชื่อว่าอะไร?",
    choices: [
      "Coggins test (Agar Gel Immunodiffusion - AGID)",
      "Hemagglutination Inhibition test (HI)",
      "SNAP Antigen ELISA",
      "Rose Bengal Test"
    ],
    answer: "Coggins test (Agar Gel Immunodiffusion - AGID)",
    explanation: "Coggins test (AGID) เป็นการตรวจหา Antibody ต่อโปรตีน p26 ของ EIAV ได้รับการรับรองจาก WOAH/OIE ให้เป็น Official regulatory test ในการตรวจคัดกรองม้าก่อนการเคลื่อนย้ายหรือแข่งขัน"
  },
  {
    id: "ch6_q4",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "EIA Transmission",
    virusType: "retro",
    q: "Equine Infectious Anemia Virus (EIAV) แพร่กระจายระหว่างม้าในคอกผ่านทางพาหะชนิดใดเป็นหลัก?",
    choices: [
      "แมลงดูดเลือดขนาดใหญ่ (Horse flies - Tabanus spp., Deer flies - Chrysops spp.) แบบ Mechanical transmission",
      "เห็บอ่อน Ornithodoros",
      "ละอองฝอยทางเดินหายใจจากการไอจาม",
      "การกินหญ้าปนเปื้อนปัสสาวะสุนัข"
    ],
    answer: "แมลงดูดเลือดขนาดใหญ่ (Horse flies - Tabanus spp., Deer flies - Chrysops spp.) แบบ Mechanical transmission",
    explanation: "EIAV แพร่ผ่านทางปากของแมลงดูดเลือดขนาดใหญ่ (Tabanids) ที่ถูกรบกวนขณะกินเลือดม้าป่วย แล้วบินไปกัดม้าตัวอื่นทันที โดยเชื้อติดอยู่บนส่วนปาก (Mechanical vector) หรือผ่านเข็มฉีดยาที่ใช้ซ้ำ"
  },
  {
    id: "ch6_q5",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "FIV Pathogenesis",
    virusType: "retro",
    q: "Feline Immunodeficiency Virus (FIV) ก่อให้เกิดภาวะภูมิคุ้มกันบกพร่องในแมวคล้ายกับเชื้อ HIV ในคน โดยมุ่งเป้าทำลายเซลล์ชนิดใดเป็นหลัก?",
    choices: [
      "CD4+ T-helper lymphocytes",
      "B-lymphocytes ในไขกระดูก",
      "Neutrophils และ Eosinophils",
      "Erythrocytes (เม็ดเลือดแดง)"
    ],
    answer: "CD4+ T-helper lymphocytes",
    explanation: "FIV เข้าจับกับ CD134 และ CXCR4 coreceptor บนผิว CD4+ T-lymphocytes ทำให้เซลล์ตายและลดจำนวนลง ส่งผลให้สัดส่วน CD4+/CD8+ ratio ต่ำลงเรื่อยๆ เกิดการติดเชื้อฉวยโอกาสแทรกซ้อน"
  },
  {
    id: "ch6_q6",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "Enzootic Bovine Leukosis (BLV)",
    virusType: "retro",
    q: "Bovine Leukemia Virus (BLV) เป็น Retrovirus ในโคที่ทำให้เกิดโรค Enzootic Bovine Leukosis โคที่ติดเชื้อส่วนใหญ่ (约 70%) จะมีอาการอย่างไร?",
    choices: [
      "ไม่แสดงอาการป่วยใดๆ ตลอดชีวิต (Asymptomatic carriers)",
      "เกิดเนื้องอกต่อมน้ำเหลือง (Lymphosarcoma) ทั่วร่างกายทันที",
      "ตายเฉียบพลันภายใน 48 ชั่วโมง",
      "เกิดภาวะเม็ดเลือดแดงแตกและปัสสาวะเป็นเลือดสด"
    ],
    answer: "ไม่แสดงอาการป่วยใดๆ ตลอดชีวิต (Asymptomatic carriers)",
    explanation: "โคที่ติดเชื้อ BLV ส่วนใหญ่ (60-70%) เป็นพาหะไม่แสดงอาการ มีเพียงประมาณ 30% ที่แสดงภาวะ Persistent Lymphocytosis (PL) และมีเพียง 1-5% เท่านั้นที่จะพัฒนาไปเป็น Malignant Lymphosarcoma"
  },
  {
    id: "ch6_q7",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "Jaagsiekte Sheep Retrovirus (JSRV)",
    virusType: "retro",
    q: "Jaagsiekte Sheep Retrovirus (JSRV) ก่อให้เกิดโรคมะเร็งปอดติดต่อในแกะ (Ovine Pulmonary Adenocarcinoma) รอยโรคและลักษณะทางคลินิกเด่นคือข้อใด?",
    choices: [
      "เนื้องอก Adenocarcinoma ของเซลล์ Alveolar type II ทำให้มีน้ำมูกใสและเมือกไหลทะลักออกจากจมูกเมื่อยกลอยขาหลัง (Wheelbarrow test เป็นบวก)",
      "แผลหลุมขนาดใหญ่ในกระเพาะผ้าขี้ริ้ว",
      "เนื้องอกกระดูกบริเวณสะโพก",
      "ก้อนนิ่วอุดตันในท่อน้ำดี"
    ],
    answer: "เนื้องอก Adenocarcinoma ของเซลล์ Alveolar type II ทำให้มีน้ำมูกใสและเมือกไหลทะลักออกจากจมูกเมื่อยกลอยขาหลัง (Wheelbarrow test เป็นบวก)",
    explanation: "JSRV เปลี่ยนเซลล์เยื่อบุถุงลม Type II และ Clara cells ให้เป็นมะเร็งที่ผลิตสารคัดหลั่งจำนวนมหาศาล สัตว์จะมีอาการหายใจหอบ และเมื่อยกลอยขาหลัง (Wheelbarrow test) จะมีของเหลวไหลทะลักออกจากรูจมูก"
  },
  {
    id: "ch6_q8",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "Avian Leukosis Virus (ALV)",
    virusType: "retro",
    q: "การแพร่กระจายของเชื้อ Avian Leukosis Virus (ALV) ในฝูงไก่พันธุ์ เส้นทางใดที่มีความสำคัญสูงสุดที่ทำให้ลูกไก่เกิดภาวะ Immune tolerance?",
    choices: [
      "การถ่ายทอดจากแม่ไก่สู่ลูกผ่านทางไข่ (Vertical transmission)",
      "การติดผ่านทางน้ำดื่มในเล้า",
      "การสัมผัสละอองฝอยมูลไก่ในอากาศ",
      "การถูกยุงรำคาญกัด"
    ],
    answer: "การถ่ายทอดจากแม่ไก่สู่ลูกผ่านทางไข่ (Vertical transmission)",
    explanation: "การส่งผ่านเชื้อจากแม่ไก่ที่มี Viremia สู่ไข่ (Vertical transmission) ทำให้ตัวอ่อนได้รับเชื้อตั้งแต่ระบบภูมิคุ้มกันยังไม่เจริญ ลูกไก่จึงเกิด Immune tolerance ไม่สร้างแอนติบอดี และขับเชื้อออกมาอย่างต่อเนื่องตลอดชีวิต"
  },
  {
    id: "ch6_q9",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "Caprine Arthritis Encephalitis (CAEV)",
    virusType: "retro",
    q: "โรค CAEV ในแพะ ก่อให้เกิดอาการสำคัญ 2 แบบตามกลุ่มอายุ คือข้อใด?",
    choices: [
      "ลูกแพะ (2-4 เดือน): สมองและไขสันหลังอักเสบอัมพาต (Leukoencephalomyelitis) ส่วนแพะโต: ข้อเข่าอักเสบบวมโต (Polysynovitis/Arthritis)",
      "ลูกแพะ: ท้องเสียเฉียบพลัน ส่วนแพะโต: ตาบอด",
      "ลูกแพะ: ปอดบวม ส่วนแพะโต: แผลหลุมในช่องปาก",
      "ลูกแพะ: ผิวหนังอักเสบ ส่วนแพะโต: ไตวาย"
    ],
    answer: "ลูกแพะ (2-4 เดือน): สมองและไขสันหลังอักเสบอัมพาต (Leukoencephalomyelitis) ส่วนแพะโต: ข้อเข่าอักเสบบวมโต (Polysynovitis/Arthritis)",
    explanation: "CAEV (Lentivirus) ในลูกแพะมักแสดงอาการทางประสาท ขาหลังอ่อนแรงจนเป็นอัมพาต (Paralysis) ส่วนแพะโตมักมีข้อต่ออักเสบเรื้อรัง โดยเฉพาะข้อเข่า (Carpal joints บวมโต เรียกว่า Big knee) และเต้านมอักเสบแข็ง (Hard udder)"
  },
  {
    id: "ch6_q10",
    chapter: 6,
    chapterTitle: "Retroviridae",
    virusName: "Oncogenesis by Retroviruses",
    virusType: "retro",
    q: "กลไกที่ Retroviruses เหนี่ยวนำให้เกิดมะเร็ง (Oncogenesis) สามารถเกิดจากสิ่งใดได้บ้าง?",
    choices: [
      "ทั้งการมียีนก่อเนื้องอก (Viral oncogene - v-onc) ในตัวเอง หรือการแทรก Provirus ใกล้กับยีนโฮสต์ (Insertional mutagenesis ของ c-onc)",
      "การผลิตสารพิษทำลายเซลล์ให้แตกสลายอย่างเดียว",
      "การกระตุ้นให้ร่างกายสร้างเม็ดเลือดขาวมากเกินไปโดยไม่มีการเปลี่ยนแปลงของยีน",
      "การแย่งสารอาหารของเซลล์ทำให้เกิดการกลายพันธุ์"
    ],
    answer: "ทั้งการมียีนก่อเนื้องอก (Viral oncogene - v-onc) ในตัวเอง หรือการแทรก Provirus ใกล้กับยีนโฮสต์ (Insertional mutagenesis ของ c-onc)",
    explanation: "Acute transforming retroviruses มียีน v-onc (เช่น v-myc, v-src) ในตัวเองทำให้เกิดเนื้องอกรวดเร็ว ส่วน Slow transforming retroviruses (เช่น FeLV, ALV) จะแทรก Provirus LTR promoter ใกล้ Cellular proto-oncogenes (c-onc) กระตุ้นให้เซลล์แบ่งตัวผิดปกติ"
  },

  // ── CHAPTER 7: Paramyxoviridae ──
  {
    id: "ch7_q1",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "Canine Distemper Virus (CDV)",
    virusType: "paramyxo",
    q: "อาการ 'Hard Pad Disease' ในสุนัขที่ติดเชื้อ Canine Distemper Virus (CDV) เกิดจากพยาธิสภาพแบบใด?",
    choices: [
      "Hyperkeratosis ของผิวหนังบริเวณฝ่าเท้า (Paw pads) และปลายจมูก (Nose planum)",
      "การติดเชื้อราเรื้อรังที่ซอกเล็บ",
      "กระดูกนิ้วเท้าบวมและหนาตัวผิดปกติ",
      "การคั่งของกรดยูริกที่ข้อเท้า"
    ],
    answer: "Hyperkeratosis ของผิวหนังบริเวณฝ่าเท้า (Paw pads) และปลายจมูก (Nose planum)",
    explanation: "CDV ก่อให้เกิด Hyperkeratosis บริเวณเซลล์เยื่อบุผิวฝ่าเท้าและปลายจมูก ทำให้ผิวหนาแข็งและแห้งแตก มักสัมพันธ์กับการติดเชื้อเรื้อรังและเป็นสัญญาณเตือนก่อนเกิดอาการทางระบบประสาท"
  },
  {
    id: "ch7_q2",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "CDV Neurological Signs",
    virusType: "paramyxo",
    q: "อาการทางระบบประสาทที่จำเพาะอย่างยิ่งของ Canine Distemper ในสุนัขที่มักพบร่วมกับอาการเคี้ยวฟันน้ำลายฟูมปากคือข้อใด?",
    choices: [
      "Myoclonus (กล้ามเนื้อกระตุกเป็นจังหวะต่อเนื่อง แม้ขณะนอนหลับ) และ Chewing gum fits",
      "การเดินเซหลังแอ่นไปข้างหน้า",
      "ขากรรไกรค้างอ้าปากไม่ได้",
      "อาการตากระตุกเฉพาะเวลากลางคืน"
    ],
    answer: "Myoclonus (กล้ามเนื้อกระตุกเป็นจังหวะต่อเนื่อง แม้ขณะนอนหลับ) และ Chewing gum fits",
    explanation: "CDV ทำลายระบบประสาทส่วนกลาง เกิด Demyelination และ Encephalitis แสดงอาการขากรรไกรกระตุกเคี้ยวฟัน (Chewing gum fits) และกล้ามเนื้อขากระตุกเป็นจังหวะสม่ำเสมอ (Myoclonus) ซึ่งมักไม่หายขาด"
  },
  {
    id: "ch7_q3",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "Newcastle Disease Virus (NDV)",
    virusType: "paramyxo",
    q: "การจัดกลุ่มความรุนแรงของเชื้อไวรัสนิวคาสเซิล (Newcastle Disease Virus - NDV) สายพันธุ์ที่มีความรุนแรงสูงสุดและทำให้อัตราการตายในไก่สูงถึง 100% เรียกว่าอะไร?",
    choices: [
      "Velogenic strain (เช่น Viscerotropic velogenic / Neurotropic velogenic)",
      "Mesogenic strain",
      "Lentogenic strain",
      "Avirulent enteric strain"
    ],
    answer: "Velogenic strain (เช่น Viscerotropic velogenic / Neurotropic velogenic)",
    explanation: "NDV แบ่งตามความรุนแรง 3 กลุ่ม: Velogenic (รุนแรงมาก ตาย 100%), Mesogenic (รุนแรงปานกลาง มักเป็นอาการทางเดินหายใจและประสาทในไก่อ่อน), และ Lentogenic (ความรุนแรงต่ำ นิยมนำมาทำวัคซีน เช่น LaSota, B1)"
  },
  {
    id: "ch7_q4",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "NDV Cleavage Site",
    virusType: "paramyxo",
    q: "ปัจจัยทางโมเลกุลข้อใดที่กำหนดระดับความรุนแรง (Virulence) ของเชื้อไวรัสนิวคาสเซิล (NDV)?",
    choices: [
      "ลำดับกรดอะมิโนบริเวณจุดตัด (Cleavage site) ของ Fusion (F) protein ที่สามารถถูกตัดด้วยเอนไซม์ Furin ทั่วร่างกาย",
      "ความยาวของสายพันธุกรรม RNA",
      "จำนวนหนาม Hemagglutinin-Neuraminidase (HN) บนผิว",
      "ขนาดของโปรตีน Matrix (M)"
    ],
    answer: "ลำดับกรดอะมิโนบริเวณจุดตัด (Cleavage site) ของ Fusion (F) protein ที่สามารถถูกตัดด้วยเอนไซม์ Furin ทั่วร่างกาย",
    explanation: "สายพันธุ์รุนแรง (Velogenic) มีกรดอะมิโนเบสหลายตัว (Multi-basic cleavage site) ทำให้ถูกตัดกระตุ้นโดยเอนไซม์ Furin ที่พบในทุกอวัยวะ ไวรัสจึงแพร่กระจายทั่วร่างกาย (Systemic infection) ขณะที่สายพันธุ์อ่อนถูกตัดได้เฉพาะเอนไซม์คล้ายทริปซินในทางเดินหายใจและทางเดินอาหารเท่านั้น"
  },
  {
    id: "ch7_q5",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "Nipah Virus (NiV)",
    virusType: "paramyxo",
    q: "Nipah Virus (Henipavirus) เป็นโรคติดต่อระหว่างสัตว์และคน (Zoonosis) ที่ร้ายแรง มีสัตว์ชนิดใดเป็นรังโรคตามธรรมชาติ และสัตว์ชนิดใดเป็นโฮสต์ขยายพันธุ์ (Amplifying host)?",
    choices: [
      "ค้างคาวแม่ไก่ (Pteropus fruit bats) เป็นรังโรคธรรมชาติ และสุกรเป็นโฮสต์ขยายพันธุ์",
      "หนูท่อเป็นรังโรค และสุนัขเป็นโฮสต์ขยายพันธุ์",
      "นกพิราบเป็นรังโรค และม้าเป็นโฮสต์ขยายพันธุ์",
      "ลิงแสมเป็นรังโรค และโคเป็นโฮสต์ขยายพันธุ์"
    ],
    answer: "ค้างคาวแม่ไก่ (Pteropus fruit bats) เป็นรังโรคธรรมชาติ และสุกรเป็นโฮสต์ขยายพันธุ์",
    explanation: "ค้างคาวกินผลไม้ (Fruit bats สกุล Pteropus) เป็น Natural reservoir ขับเชื้อทางน้ำลายและปัสสาวะ เมื่อสุกรรับเชื้อเข้าไปจะทำหน้าที่เป็น Amplifying host แสดงอาการไอหอน (Barking cough syndrome) และแพร่เชื้อสู่คนทางละอองฝอย"
  },
  {
    id: "ch7_q6",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "Rinderpest Eradication",
    virusType: "paramyxo",
    q: "โรคกาฬโรคในโค (Rinderpest) ก่อให้เกิดไข้สูง ท้องร่วงรุนแรง และแผลเน่าเปื่อยในทางเดินอาหาร มีความสำคัญทางประวัติศาสตร์การแพทย์อย่างไร?",
    choices: [
      "เป็นโรคไวรัสในสัตว์โรคแรก (และโรคที่สองของโลกรองจากฝีดาษในคน) ที่ถูกกวาดล้างจนหมดไปจากโลกอย่างเป็นทางการ (Eradicated)",
      "เป็นโรคแรกที่นำมาสกัดเป็นยาปฏิชีวนะ",
      "เป็นโรคที่ยังคงระบาดรุนแรงที่สุดในเอเชียตะวันออกเฉียงใต้ปัจจุบัน",
      "เป็นโรคที่ติดต่อสู่คนได้รวดเร็วที่สุด"
    ],
    answer: "เป็นโรคไวรัสในสัตว์โรคแรก (และโรคที่สองของโลกรองจากฝีดาษในคน) ที่ถูกกวาดล้างจนหมดไปจากโลกอย่างเป็นทางการ (Eradicated)",
    explanation: "Rinderpest virus (Morbillivirus) ถูกประกาศกวาดล้างหมดสิ้นจากโลก (Global eradication) อย่างเป็นทางการโดย FAO และ OIE ในปี ค.ศ. 2011 นับเป็นความสำเร็จสูงสุดทางสัตวแพทย์ศาสตร์ระดับโลก"
  },
  {
    id: "ch7_q7",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "Peste des Petits Ruminants (PPR)",
    virusType: "paramyxo",
    q: "โรคกาฬโรคในแพะและแกะ (Peste des Petits Ruminants - PPR) มักมีชื่อเรียกอีกชื่อหนึ่งว่าอะไร?",
    choices: [
      "Ovine Rinderpest หรือ กาฬโรคสัตว์เคี้ยวเอื้องขนาดเล็ก",
      "Foot and mouth disease",
      "Blue tongue disease",
      "Contagious agalactia"
    ],
    answer: "Ovine Rinderpest หรือ กาฬโรคสัตว์เคี้ยวเอื้องขนาดเล็ก",
    explanation: "PPRV (Morbillivirus) มีความคล้ายคลึงกับ Rinderpest อย่างมาก ก่อโรคในแพะและแกะ ทำให้มีไข้ แผลเนื้อตายในปาก ท้องเสียรุนแรง และปอดบวม จึงมักเรียกว่า Ovine Rinderpest"
  },
  {
    id: "ch7_q8",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "Bovine Parainfluenza-3 (BPIV-3)",
    virusType: "paramyxo",
    q: "Bovine Parainfluenza Virus 3 (BPIV-3) มีบทบาทสำคัญในการเกิดกลุ่มอาการทางเดินหายใจในโค (Bovine Respiratory Disease Complex - BRDC) อย่างไร?",
    choices: [
      "ทำลาย Ciliated epithelial cells และ Alveolar macrophages ในปอด เปิดทางให้แบคทีเรียแทรกซ้อน (เช่น Mannheimia haemolytica)",
      "ทำให้กล้ามเนื้อหัวใจวายเฉียบพลัน",
      "ทำลายเซลล์เยื่อบุทางเดินอาหารจนไม่ดูดซึมน้ำ",
      "ทำให้เกิดตุ่มน้ำใสที่เต้านมและกีบเท้า"
    ],
    answer: "ทำลาย Ciliated epithelial cells และ Alveolar macrophages ในปอด เปิดทางให้แบคทีเรียแทรกซ้อน (เช่น Mannheimia haemolytica)",
    explanation: "BPIV-3 เป็นตัวเหนี่ยวนำสำคัญใน BRDC (Shipping fever) โดยทำลายระบบพัดโบกเมือก (Mucociliary clearance) และกดการทำงานของ Alveolar macrophages ทำให้แบคทีเรียฉวยโอกาสในโพรงจมูกแพร่ลงสู่ปอดจนเกิดปอดบวมรุนแรง"
  },
  {
    id: "ch7_q9",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "Canine Distemper Inclusions",
    virusType: "paramyxo",
    q: "Inclusion bodies ของ Canine Distemper Virus (CDV) มีคุณสมบัติพิเศษอย่างไรที่ต่างจากไวรัสส่วนใหญ่?",
    choices: [
      "สามารถตรวจพบได้ทั้งในนิวเคลียส (Intranuclear) และในไซโทพลาสซึม (Intracytoplasmic) ของเซลล์เยื่อบุและเซลล์ประสาท",
      "พบได้เฉพาะในนิวเคลียสของเม็ดเลือดขาวเท่านั้น",
      "พบได้เฉพาะในไซโทพลาสซึมของเซลล์เม็ดเลือดแดง",
      "ไม่เคยพบ Inclusion bodies ในโรคหัดสุนัข"
    ],
    answer: "สามารถตรวจพบได้ทั้งในนิวเคลียส (Intranuclear) และในไซโทพลาสซึม (Intracytoplasmic) ของเซลล์เยื่อบุและเซลล์ประสาท",
    explanation: "CDV มีลักษณะจำเพาะคือสามารถสร้าง Eosinophilic inclusion bodies ได้ทั้งแบบ Intracytoplasmic และ Intranuclear ในเซลล์เยื่อบุทางเดินหายใจ กระเพาะปัสสาวะ และเซลล์ Glia ในสมอง"
  },
  {
    id: "ch7_q10",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    virusName: "Hendra Virus",
    virusType: "paramyxo",
    q: "Hendra Virus (Henipavirus) พบการระบาดครั้งแรกในประเทศออสเตรเลีย ก่อให้เกิดอาการปอดบวมเฉียบพลันและตายในสัตว์ชนิดใด ก่อนแพร่สู่สัตวแพทย์และผู้ดูแล?",
    choices: [
      "ม้า (Horses)",
      "สุนัขล่าเนื้อ",
      "โคเนื้อ",
      "แกะ"
    ],
    answer: "ม้า (Horses)",
    explanation: "Hendra virus มีค้างคาวแม่ไก่เป็นรังโรค แพร่สู่ม้าทำให้เกิด Severe respiratory and neurological disease ม้ามีฟองปนเลือดออกจากจมูกและตายสูง สัตวแพทย์ที่รักษาหรือผ่าซากม้าป่วยติดเชื้อและเสียชีวิตจาก Encephalitis"
  },

  // ── CHAPTER 8: Orthomyxoviridae ──
  {
    id: "ch8_q1",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Segmented Genome",
    virusType: "ortho",
    q: "โครงสร้างสารพันธุกรรมของ Influenza A virus มีลักษณะเด่นอย่างไรที่ทำให้ไวรัสสามารถเกิดกระบวนการ Genetic Reassortment ได้ง่าย?",
    choices: [
      "เป็น (-)ssRNA แบบแยกเป็น 8 ท่อน (8 Segmented genome)",
      "เป็น dsDNA แบบวงกลมท่อนเดียว",
      "เป็น (+)ssRNA สายเดี่ยวยาวต่อเนื่อง",
      "เป็น RNA 2 ท่อนที่เชื่อมต่อกันด้วยโปรตีน"
    ],
    answer: "เป็น (-)ssRNA แบบแยกเป็น 8 ท่อน (8 Segmented genome)",
    explanation: "Influenza A virus มีจีโนมเป็น (-)ssRNA แยกเป็น 8 ท่อนอิสระ เมื่อเซลล์หนึ่งติดเชื้อไวรัส 2 สายพันธุ์พร้อมกัน ท่อนยีนสามารถสลับจับคู่ใหม่ (Reassortment) เกิดเป็นสายพันธุ์ลูกผสมตัวใหม่ได้อย่างรวดเร็ว"
  },
  {
    id: "ch8_q2",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Antigenic Drift vs Shift",
    virusType: "ortho",
    q: "ข้อใดอธิบายความแตกต่างระหว่าง 'Antigenic Drift' และ 'Antigenic Shift' ในไวรัสไข้หวัดใหญ่ได้ถูกต้องที่สุด?",
    choices: [
      "Antigenic Drift คือการกลายพันธุ์ทีละจุด (Point mutation) ส่วน Antigenic Shift คือการแลกเปลี่ยนท่อนจีโนม (Reassortment) ทำให้เกิด Subtype ใหม่",
      "Antigenic Shift ทำให้เกิดการระบาดตามฤดูกาลขนาดเล็ก ส่วน Drift ทำให้เกิดโรคระบาดใหญ่ทั่วโลก (Pandemic)",
      "Antigenic Drift เกิดเฉพาะในนก ส่วน Antigenic Shift เกิดเฉพาะในคน",
      "ทั้งสองคำมีความหมายเหมือนกันทุกประการ"
    ],
    answer: "Antigenic Drift คือการกลายพันธุ์ทีละจุด (Point mutation) ส่วน Antigenic Shift คือการแลกเปลี่ยนท่อนจีโนม (Reassortment) ทำให้เกิด Subtype ใหม่",
    explanation: "Antigenic drift เกิดจากความผิดพลาดในการจำลองรหัสของ RdRp ทำให้กรดอะมิโนบน HA/NA เปลี่ยนทีละน้อย เกิดการระบาดประจำปี (Seasonal epidemic) ส่วน Antigenic shift เกิดจากการสลับท่อนยีนระหว่างสายพันธุ์ เกิด Subtype ใหม่ที่ประชากรไม่มีภูมิคุ้มกัน นำไปสู่การระบาดใหญ่ทั่วโลก (Pandemic)"
  },
  {
    id: "ch8_q3",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "HA and NA Surface Glycoproteins",
    virusType: "ortho",
    q: "หน้าที่ของ Hemagglutinin (HA) และ Neuraminidase (NA) บนอนุภาค Influenza virus ข้อใดถูกต้อง?",
    choices: [
      "HA ทำหน้าที่จับกับ Sialic acid receptor เพื่อเข้าสู่เซลล์ ส่วน NA ทำหน้าที่ตัด Sialic acid เพื่อปลดปล่อยไวรัสออกจากเซลล์",
      "NA ทำหน้าที่จับกับ Receptor ส่วน HA ทำหน้าที่จำลองสารพันธุกรรม",
      "HA และ NA ทำหน้าที่เป็นเอนไซม์ย่อยโปรตีนของโฮสต์เท่านั้น",
      "HA ควบคุมการสร้างเปลือก ส่วน NA ควบคุมการแทรกตัวเข้าสู่นิวเคลียส"
    ],
    answer: "HA ทำหน้าที่จับกับ Sialic acid receptor เพื่อเข้าสู่เซลล์ ส่วน NA ทำหน้าที่ตัด Sialic acid เพื่อปลดปล่อยไวรัสออกจากเซลล์",
    explanation: "HA มีหน้าที่จับกับ Sialic acid บนผิวเซลล์และช่วยหลอมรวมเยื่อหุ้มเซลล์ ส่วน NA เป็นเอนไซม์ Sialidase ตัดพันธะระหว่าง HA กับ Sialic acid เพื่อให้อนุภาคไวรัสรุ่นใหม่หลุดออกจากเซลล์และป้องกันไวรัสเกาะกลุ่มกันเอง"
  },
  {
    id: "ch8_q4",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Avian Influenza Pathogenicity (HPAI)",
    virusType: "ortho",
    q: "ไวรัสไข้หวัดนกชนิดความรุนแรงสูง (Highly Pathogenic Avian Influenza - HPAI เช่น H5N1) ทำให้ไก่แสดงอาการรอยโรคภายนอกที่เด่นชัดคือข้อใด?",
    choices: [
      "หงอน เหนียง และใบหน้าบวมคล้ำเป็นสีม่วง (Cyanosis), มีจุดเลือดออกที่แข้งและเกล็ดขา, และตายเฉียบพลันสูงถึง 100%",
      "ขนร่วงทั้งตัวและเป็นตุ่มหูดที่โคนปีก",
      "ขาเป็นอัมพาตเหยียดหน้าหลังโดยไม่มีรอยโรคเลือดออก",
      "ท้องเสียเรื้อรังเป็นเวลา 2 เดือนแต่ไม่ตาย"
    ],
    answer: "หงอน เหนียง และใบหน้าบวมคล้ำเป็นสีม่วง (Cyanosis), มีจุดเลือดออกที่แข้งและเกล็ดขา, และตายเฉียบพลันสูงถึง 100%",
    explanation: "HPAI แพร่กระจายเข้าสู่กระแสเลือดทำลายเซลล์เยื่อบุหลอดเลือดทั่วร่างกาย ทำให้เกิด Multiple organ failure, อาการคั่งเลือดบวมน้ำที่หงอนเหนียง (Facial edema & cyanosis), และจุดเลือดออกใต้เกล็ดขา (Shank hemorrhage)"
  },
  {
    id: "ch8_q5",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Swine as Mixing Vessel",
    virusType: "ortho",
    q: "เหตุใดสุกร (Pigs) จึงถูกขนานนามว่าเป็น 'Mixing Vessel' สำหรับการกำเนิดไวรัสไข้หวัดใหญ่สายพันธุ์ใหม่?",
    choices: [
      "เพราะทางเดินหายใจของสุกรมีทั้ง α-2,3 (Avian-type) และ α-2,6 (Human-type) Sialic acid receptors ทำให้ไวรัสจากนกและคนสามารถติดเชื้อพร้อมกันได้",
      "เพราะสุกรมีระบบภูมิคุ้มกันอ่อนแอที่สุดในบรรดาสัตว์เลี้ยง",
      "เพราะสุกรสามารถสร้างไวรัสไข้หวัดใหญ่ขึ้นมาเองได้โดยไม่ต้องได้รับเชื้อจากภายนอก",
      "เพราะไวรัสไม่สามารถเพิ่มจำนวนในคนได้หากไม่ผ่านสุกรก่อน"
    ],
    answer: "เพราะทางเดินหายใจของสุกรมีทั้ง α-2,3 (Avian-type) และ α-2,6 (Human-type) Sialic acid receptors ทำให้ไวรัสจากนกและคนสามารถติดเชื้อพร้อมกันได้",
    explanation: "เยื่อบุทางเดินหายใจของสุกรมีตัวรับทั้งแบบ α-2,3 (จำเพาะต่อไวรัสนก) และ α-2,6 (จำเพาะต่อไวรัสคน) หากสุกรติดเชื้อไวรัสไข้หวัดใหญ่ของนกและคนพร้อมกันในเซลล์เดียว จะเกิด Reassortment กลายเป็นสายพันธุ์ใหม่ที่แพร่สู่คนได้รวดเร็ว"
  },
  {
    id: "ch8_q6",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Equine Influenza Virus (EIV)",
    virusType: "ortho",
    q: "Equine Influenza Virus (EIV สายพันธุ์ H3N8) ก่อให้เกิดอาการเด่นชัดในม้าคือข้อใด และคำแนะนำสำคัญที่สุดในการจัดการม้าป่วยคืออะไร?",
    choices: [
      "ไข้สูงเฉียบพลัน ไอแห้งเสียงดังรุนแรง และต้องพักม้าอย่างน้อย 1 สัปดาห์ต่อไข้ 1 วัน (อย่างน้อย 3-4 สัปดาห์) เพื่อฟื้นฟูเยื่อบุทางเดินหายใจ",
      "อาการท้องเสียรุนแรง และต้องงดน้ำงดอาหาร 3 วัน",
      "อาการชักเกร็ง และต้องออกกำลังกายม้าหนักๆ เพื่อขับเหงื่อ",
      "แผลหลุมที่ลิ้น และต้องฉีดยาปฏิชีวนะฆ่าเชื้อไวรัสทันที"
    ],
    answer: "ไข้สูงเฉียบพลัน ไอแห้งเสียงดังรุนแรง และต้องพักม้าอย่างน้อย 1 สัปดาห์ต่อไข้ 1 วัน (อย่างน้อย 3-4 สัปดาห์) เพื่อฟื้นฟูเยื่อบุทางเดินหายใจ",
    explanation: "EIV ทำลาย Ciliated epithelium ของทางเดินหายใจ ทำให้ไอแห้งรุนแรงและติดเชื้อแบคทีเรียแทรกซ้อนได้ง่าย Mucociliary clearance ต้องใช้เวลาฟื้นฟูประมาณ 3-4 สัปดาห์ กฎการพักม้าคือ 1 วันที่มีไข้ = พักผ่อน 1 สัปดาห์"
  },
  {
    id: "ch8_q7",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Canine Influenza Virus (CIV)",
    virusType: "ortho",
    q: "Canine Influenza Virus (CIV สายพันธุ์ H3N8) ที่พบระบาดในสุนัข มีต้นกำเนิดวิวัฒนาการกระโดดข้ามสปีชีส์ (Spillover) มาจากสัตว์ชนิดใด?",
    choices: [
      "ม้า (Equine Influenza Virus H3N8)",
      "สุกร (Swine Influenza)",
      "เป็ดป่า (Duck Influenza)",
      "แมวบ้าน (Feline Influenza)"
    ],
    answer: "ม้า (Equine Influenza Virus H3N8)",
    explanation: "CIV H3N8 เริ่มต้นระบาดในสุนัขเกรย์ฮาวด์ (Greyhound) ในสนามแข่งม้าที่สหรัฐอเมริกา โดยพิสูจน์ได้ว่าเกิดจากการถ่ายทอดโดยตรงจาก Equine Influenza Virus (H3N8) มาปรับตัวเพิ่มจำนวนในสุนัข"
  },
  {
    id: "ch8_q8",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Avian Influenza Reservoir",
    virusType: "ortho",
    q: "สัตว์กลุ่มใดตามธรรมชาติที่เป็นแหล่งรังโรคดั้งเดิม (Natural reservoir) ของไวรัส Influenza A ทุกสายพันธุ์?",
    choices: [
      "นกน้ำป่า (Wild aquatic birds) เช่น เป็ดป่า ห่านป่า นกนางนวล",
      "ค้างคาวผลไม้",
      "หนูและสัตว์ฟันแทะ",
      "ไก่บ้านและไก่ไข่ในฟาร์ม"
    ],
    answer: "นกน้ำป่า (Wild aquatic birds) เช่น เป็ดป่า ห่านป่า นกนางนวล",
    explanation: "นกน้ำป่าตามธรรมชาติ (Order Anseriformes และ Charadriiformes) เป็นแหล่งสะสมของ Influenza A viruses ทุก Subtype (H1-H16 และ N1-N9) โดยไวรัสเพิ่มจำนวนในทางเดินอาหารและขับออกทางมูลโดยที่นกป่ามักไม่แสดงอาการป่วย"
  },
  {
    id: "ch8_q9",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Nuclear Replication Exception",
    virusType: "ortho",
    q: "ไวรัสตระกูล Orthomyxoviridae มีความแปลกประหลาดทางชีววิทยาจาก RNA viruses ส่วนใหญ่อย่างไร?",
    choices: [
      "กระบวนการจำลองสารพันธุกรรม RNA และการสังเคราะห์ mRNA ต้องเกิดขึ้นภายในนิวเคลียสของโฮสต์ (Cap-snatching)",
      "เป็น RNA virus ที่ไม่มีโปรตีนแคปซิด",
      "จำลองสารพันธุกรรมได้เฉพาะในเซลล์เม็ดเลือดแดงที่ไม่มีนิวเคลียส",
      "ไม่สามารถสร้างโปรตีนได้หากปราศจากแสงแดด"
    ],
    answer: "กระบวนการจำลองสารพันธุกรรม RNA และการสังเคราะห์ mRNA ต้องเกิดขึ้นภายในนิวเคลียสของโฮสต์ (Cap-snatching)",
    explanation: "Orthomyxovirus เป็นหนึ่งใน RNA viruses ไม่กี่ชนิดที่ต้องเข้าสู่นิวเคลียสเพื่อทำการ Transcription และ Replication เนื่องจากต้องใช้กระบวนการ 'Cap-snatching' ตัดเอา 5' cap ของ mRNA โฮสต์มาใช้เป็น Primer"
  },
  {
    id: "ch8_q10",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    virusName: "Neuraminidase Inhibitors",
    virusType: "ortho",
    q: "ยาต้านไวรัสกลุ่ม Neuraminidase Inhibitors (เช่น Oseltamivir) มีกลไกการออกฤทธิ์อย่างไรในการรักษาไข้หวัดใหญ่?",
    choices: [
      "ยับยั้งเอนไซม์ NA ทำให้ไวรัสลูกหลานที่สร้างขึ้นใหม่ไม่สามารถตัดหลุดออกจากผิวเซลล์เดิมได้ จึงไม่สามารถแพร่ไปติดเซลล์ข้างเคียง",
      "ทำลายสารพันธุกรรม RNA ให้แตกเป็นชิ้นเล็กชิ้นน้อย",
      "ป้องกันไม่ให้ไวรัสจับกับ Receptor บนผิวเซลล์ตั้งแต่แรก",
      "กระตุ้นให้เซลล์ติดเชื้อสร้างแอนติบอดีขึ้นมาทำลายไวรัส"
    ],
    answer: "ยับยั้งเอนไซม์ NA ทำให้ไวรัสลูกหลานที่สร้างขึ้นใหม่ไม่สามารถตัดหลุดออกจากผิวเซลล์เดิมได้ จึงไม่สามารถแพร่ไปติดเซลล์ข้างเคียง",
    explanation: "Oseltamivir ยับยั้งการทำงานของ Neuraminidase ส่งผลให้อนุภาคไวรัสที่ Budding ออกมายังคงเกาะติดอยู่กับ Sialic acid บนเยื่อหุ้มเซลล์เดิมและเกาะกันเองเป็นกลุ่มก้อน ไม่สามารถกระจายไปติดเชื้อเซลล์อื่นได้"
  },

  // ── CHAPTER 9: Coronaviridae ──
  {
    id: "ch9_q1",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "Feline Infectious Peritonitis (FIP)",
    virusType: "corona",
    q: "โรคเยื่อบุช่องท้องอักเสบติดต่อในแมว (FIP) เกิดจากการกลายพันธุ์ของไวรัสชนิดใดภายในตัวแมว?",
    choices: [
      "Feline Enteric Coronavirus (FECV) ที่ติดเชื้อในเซลล์ลำไส้ กลายพันธุ์จนมีความสามารถเข้าไปเพิ่มจำนวนใน Macrophages / Monocytes",
      "Feline Panleukopenia Virus (FPV)",
      "Feline Calicivirus (FCV)",
      "Feline Leukemia Virus (FeLV)"
    ],
    answer: "Feline Enteric Coronavirus (FECV) ที่ติดเชื้อในเซลล์ลำไส้ กลายพันธุ์จนมีความสามารถเข้าไปเพิ่มจำนวนใน Macrophages / Monocytes",
    explanation: "FIP ไม่ได้เกิดจากการติดเชื้อ FIPV จากภายนอกโดยตรง แต่เกิดจาก FECV ซึ่งเป็นเชื้อโคโรนาไวรัสประจำลำไส้ที่ไม่รุนแรง เกิดการกลายพันธุ์ภายในตัวแมว (Internal mutation ในยีน spike หรือ 3c/7b) เปลี่ยน Tropism ไปติดเชื้อใน Macrophages อย่างถาวร"
  },
  {
    id: "ch9_q2",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "FIP Wet vs Dry Forms",
    virusType: "corona",
    q: "ลักษณะของของเหลวในช่องท้อง (Peritoneal effusion) ของแมวที่เป็น FIP แบบเปียก (Effusive/Wet form) มีลักษณะเฉพาะอย่างไร?",
    choices: [
      "สีเหลืองอำพันหรือสีฟางข้าว ข้นเหนียว มีโปรตีนสูง (>3.5 g/dL) และให้ผลบวกต่อการทดสอบ Rivalta test",
      "ใสเหมือนน้ำ โปรตีนต่ำ (<1 g/dL) และไม่มีเซลล์",
      "สีขาวขุ่นคล้ายน้ำนมเนื่องจากมีไขมันสะสม (Chylous)",
      "เป็นเลือดสดบริสุทธิ์ที่มีเกล็ดเลือดปกติ"
    ],
    answer: "สีเหลืองอำพันหรือสีฟางข้าว ข้นเหนียว มีโปรตีนสูง (>3.5 g/dL) และให้ผลบวกต่อการทดสอบ Rivalta test",
    explanation: "น้ำในช่องท้องของแมว FIP เกิดจาก Immune-mediated vasculitis ทำให้หลอดเลือดรั่ว น้ำที่ซึมออกมาเป็น Modified transudate/Exudate สีเหลืองอำพัน ข้นหนืดเป็นฟอง โปรตีนและกลอบูลินสูงมาก ให้ผล Rivalta test เป็นหยดตะกอนจมลงก้นหลอด"
  },
  {
    id: "ch9_q3",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "Porcine Epidemic Diarrhea (PEDV)",
    virusType: "corona",
    q: "Porcine Epidemic Diarrhea Virus (PEDV) ก่อให้เกิดความสูญเสียทางเศรษฐกิจสูงสุดในฟาร์มสุกรเมื่อเกิดการติดเชื้อในสุกรกลุ่มอายุใด?",
    choices: [
      "ลูกสุกรดูดนมแรกเกิด (อายุต่ำกว่า 7-10 วัน) โดยมีอัตราการตายสูงถึง 80 - 100% จากภาวะขาดน้ำรุนแรง",
      "สุกรขุนช่วงก่อนส่งตลาด",
      "แม่สุกรทดแทนก่อนผสมพันธุ์",
      "พ่อสุกรพันธุ์ในระยะพักฟื้น"
    ],
    answer: "ลูกสุกรดูดนมแรกเกิด (อายุต่ำกว่า 7-10 วัน) โดยมีอัตราการตายสูงถึง 80 - 100% จากภาวะขาดน้ำรุนแรง",
    explanation: "PEDV ทำลาย Villous enterocytes ของลำไส้เล็กอย่างรวดเร็ว ทำให้วิลไลกุดสั้น (Villus atrophy) สูญเสียความสามารถในการดูดซึมน้ำและนม ลูกสุกรอายุไม่เกิน 1 สัปดาห์จะอาเจียน ท้องเสียน้ำพุ่ง และตายจาก Severe dehydration และ Hypothermia สูงถึง 100%"
  },
  {
    id: "ch9_q4",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "Transmissible Gastroenteritis (TGEV)",
    virusType: "corona",
    q: "Transmissible Gastroenteritis Virus (TGEV) ในสุกร มีความสัมพันธ์ทางวิวัฒนาการที่ทำให้เกิดไวรัสทางเดินหายใจที่ไม่รุนแรงชื่อว่าอะไร?",
    choices: [
      "Porcine Respiratory Coronavirus (PRCV)",
      "Porcine Hemagglutinating Encephalomyelitis Virus (PHEV)",
      "Swine Influenza Virus (SIV)",
      "PRRS Virus"
    ],
    answer: "Porcine Respiratory Coronavirus (PRCV)",
    explanation: "PRCV เกิดจากการที่ยีน Spike ของ TGEV ขาดหายไปบางส่วน (Deletion mutant) ทำให้เปลี่ยน Tropism จากทางเดินอาหารไปติดเชื้อทางเดินหายใจแทน และมักก่อโรคไม่รุนแรง แต่ช่วยกระตุ้น Cross-protective immunity ต่อ TGEV ในฝูงสุกรได้"
  },
  {
    id: "ch9_q5",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "Infectious Bronchitis Virus (IBV)",
    virusType: "corona",
    q: "Infectious Bronchitis Virus (IBV) ในแม่ไก่ไข่ นอกจากจะทำให้เกิดอาการทางเดินหายใจแล้ว ยังส่งผลกระทบต่อผลผลิตไข่อย่างไร?",
    choices: [
      "ผลผลิตไข่ลดฮวบ เปลือกไข่บาง ผิดรูป พื้นผิวขรุขระย่นเป็นริ้ว (Wrinkled eggs) และไข่ขาวเหลวเป็นน้ำ",
      "ทำให้ไข่ไก่มีสีเขียวเข้มและมีกลิ่นเหม็นเน่า",
      "ทำให้แม่ไก่ออกไข่วันละ 2 ฟองแต่ไข่แดงฝ่อ",
      "ไม่มีผลกระทบต่อผลผลิตไข่"
    ],
    answer: "ผลผลิตไข่ลดฮวบ เปลือกไข่บาง ผิดรูป พื้นผิวขรุขระย่นเป็นริ้ว (Wrinkled eggs) และไข่ขาวเหลวเป็นน้ำ",
    explanation: "IBV (Gammacoronavirus) เข้าทำลายเยื่อบุท่อนำไข่ (Oviduct) ส่งผลต่อกระบวนการสร้างเปลือกไข่และอัลบูมิน ทำให้ไข่มีรูปร่างบิดเบี้ยว เปลือกไข่ย่น (Wrinkled/Misshapen eggs) ไร้ความมันเงา และไข่ขาวเหลว (Watery albumen)"
  },
  {
    id: "ch9_q6",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "Bovine Coronavirus (BCoV)",
    virusType: "corona",
    q: "Bovine Coronavirus (BCoV) มีความสำคัญในการก่อโรค 3 รูปแบบในโคนมและโคเนื้อ ได้แก่โรคใดบ้าง?",
    choices: [
      "ท้องเสียในลูกโค (Calf diarrhea), ท้องร่วงถ่ายเป็นเลือดในโคโตฤดูหนาว (Winter dysentery), และโรคทางเดินหายใจ (Respiratory complex)",
      "โรคปากและเท้าเปื่อย, โรคแท้งติดต่อ, และเต้านมอักเสบ",
      "โรคสมองอักเสบ, ตาบอด, และกีบเน่า",
      "โรคตับอักเสบ, นิ่วในไต, และผิวหนังตกสะเก็ด"
    ],
    answer: "ท้องเสียในลูกโค (Calf diarrhea), ท้องร่วงถ่ายเป็นเลือดในโคโตฤดูหนาว (Winter dysentery), และโรคทางเดินหายใจ (Respiratory complex)",
    explanation: "BCoV มี Dual tropism ติดได้ทั้งระบบทางเดินอาหารและทางเดินหายใจ ก่อให้เกิด Neonatal calf diarrhea, โรคทางเดินหายใจร่วมในโคขุน, และ Winter dysentery ในโคนมช่วงฤดูหนาว (ท้องเสียดำเป็นน้ำปนลิ่มเลือด ผลผลิตน้ำนมตกเฉียบพลัน)"
  },
  {
    id: "ch9_q7",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "Coronavirus Genome Size",
    virusType: "corona",
    q: "ลักษณะเด่นของสารพันธุกรรมในไวรัสตระกูล Coronaviridae เมื่อเปรียบเทียบกับ RNA viruses ชนิดอื่นคือข้อใด?",
    choices: [
      "มีขนาดจีโนมใหญ่ที่สุดในบรรดา RNA viruses ทั้งหมด (ประมาณ 27 - 32 กิโลเบส) และมีเอนไซม์ Proofreading (ExoN)",
      "มีจีโนมเป็นวงกลมขนาดเล็กมากเพียง 2 กิโลเบส",
      "เป็น RNA virus ชนิดเดียวที่มีการจำลองสารพันธุกรรมแบบท่อนเดี่ยวในนิวเคลียส",
      "ไม่มีเบส Uracil ในสายพันธุกรรม"
    ],
    answer: "มีขนาดจีโนมใหญ่ที่สุดในบรรดา RNA viruses ทั้งหมด (ประมาณ 27 - 32 กิโลเบส) และมีเอนไซม์ Proofreading (ExoN)",
    explanation: "Coronavirus มีจีโนม (+)ssRNA ขนาดยักษ์ (27-32 kb) ซึ่งรักษาความเสถียรของจีโนมขนาดใหญ่ไว้ได้เพราะมีเอนไซม์ 3'-to-5' exoribonuclease (ExoN) ทำหน้าที่ตรวจทานรหัส (Proofreading) ซึ่งไม่พบใน RNA viruses อื่น"
  },
  {
    id: "ch9_q8",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "Canine Coronavirus (CCoV)",
    virusType: "corona",
    q: "ความแตกต่างทางคลินิกที่สำคัญระหว่างการติดเชื้อ Canine Coronavirus (CCoV) และ Canine Parvovirus (CPV) ในสุนัขคือข้อใด?",
    choices: [
      "CCoV ทำลายเฉพาะปลาย Villus ของลำไส้ อาการท้องเสียมักไม่รุนแรง ไม่ค่อยมีเลือดสด และเม็ดเลือดขาวไม่ต่ำ",
      "CCoV ก่ออาการรุนแรงกว่า Parvovirus และทำให้เสียชีวิตภายใน 24 ชั่วโมงเสมอ",
      "CCoV ทำลายเซลล์ไขกระดูกทำให้ Leukopenia รุนแรงกว่า CPV",
      "CCoV เป็นโรคที่ไม่แสดงอาการทางเดินอาหารแต่แสดงอาการชักเกร็ง"
    ],
    answer: "CCoV ทำลายเฉพาะปลาย Villus ของลำไส้ อาการท้องเสียมักไม่รุนแรง ไม่ค่อยมีเลือดสด และเม็ดเลือดขาวไม่ต่ำ",
    explanation: "CCoV โจมตีเฉพาะ Mature absorptive enterocytes ที่ปลายยอด Villi ไม่ได้ทำลาย Crypt cells หรือ Bone marrow เหมือน CPV ดังนั้นอาการท้องเสียจึงมักไม่รุนแรง สุนัขยังกินอาหารได้ และไม่มีภาวะ Leukopenia"
  },
  {
    id: "ch9_q9",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "FIP Antiviral Treatment",
    virusType: "corona",
    q: "สารประกอบต้านไวรัสกลุ่ม Nucleoside analog ชนิดใดที่มีการศึกษาวิจัยและนำมาใช้รักษาโรค FIP ในแมวได้อย่างมีประสิทธิภาพสูงในปัจจุบัน?",
    choices: [
      "GS-441524 (หรือ Remdesivir)",
      "Acyclovir",
      "Oseltamivir",
      "Zidovudine (AZT)"
    ],
    answer: "GS-441524 (หรือ Remdesivir)",
    explanation: "GS-441524 เป็น 1'-cyano-substituted adenine nucleoside analog ที่ออกฤทธิ์ยับยั้ง Viral RNA-dependent RNA polymerase (RdRp) ของ FIPV โดยตรง สามารถรักษาแมวป่วย FIP ให้หายขาดได้สูงกว่า 80-90%"
  },
  {
    id: "ch9_q10",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    virusName: "Spike Protein Function",
    virusType: "corona",
    q: "โปรตีน Spike (S glycoprotein) ของโคโรนาไวรัสมีบทบาทสำคัญที่สุดในข้อใด?",
    choices: [
      "กำหนด Receptor binding จำเพาะกับเซลล์โฮสต์และหลอมรวมเยื่อหุ้มเซลล์ (Membrane fusion)",
      "ห่อหุ้มสารพันธุกรรม RNA ในลักษณะเกลียวภายใน",
      "สร้างพลังงาน ATP ให้แก่ไวรัสขณะอยู่ในสิ่งแวดล้อม",
      "ทำหน้าที่เป็นเอนไซม์ย่อยสลายเม็ดเลือดแดง"
    ],
    answer: "กำหนด Receptor binding จำเพาะกับเซลล์โฮสต์และหลอมรวมเยื่อหุ้มเซลล์ (Membrane fusion)",
    explanation: "Spike protein ยื่นออกมาคล้ายมงกุฎ ประกอบด้วย subunit S1 (จับกับ Receptor ของโฮสต์ เช่น ACE2, APN) และ subunit S2 (ทำหน้าที่ Membrane fusion เพื่อให้ไวรัสเข้าสู่เซลล์)"
  },

  // ── CHAPTER 10: Rhabdoviridae & Birnaviridae ──
  {
    id: "ch10_q1",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "Rabies Virus Structure",
    virusType: "rabies",
    q: "ลักษณะทางสัณฐานวิทยา (Morphology) ที่เป็นเอกลักษณ์เด่นของอนุภาค Rabies Virus ใต้กล้องจุลทรรศน์อิเล็กตรอนคือข้อใด?",
    choices: [
      "รูปร่างคล้ายกระสุนปืน (Bullet-shaped particle) ปลายข้างหนึ่งมนและอีกข้างหนึ่งตัดตรง",
      "รูปทรงกลมมีหนามคล้ายดอกไม้",
      "รูปแท่งยาวคดเคี้ยวคล้ายเส้นด้าย",
      "รูปทรงเรขาคณิต 20 หน้าไม่มีเปลือกหุ้ม"
    ],
    answer: "รูปร่างคล้ายกระสุนปืน (Bullet-shaped particle) ปลายข้างหนึ่งมนและอีกข้างหนึ่งตัดตรง",
    explanation: "Rabies virus (Lyssavirus ตระกูล Rhabdoviridae) มีรูปร่างเอกลักษณ์แบบ Bullet-shaped ขนาดประมาณ 75 x 180 nm มีเปลือกหุ้มและมีหนาม Glycoprotein G"
  },
  {
    id: "ch10_q2",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "Rabies Pathogenesis & Transport",
    virusType: "rabies",
    q: "หลังจากการถูกสัตว์ที่เป็นโรคพิษสุนัขบ้ากัด ไวรัสเดินทางจากบาดแผลเข้าสู่สมอง (CNS) ผ่านทางเส้นทางใด?",
    choices: [
      "เดินทางไปตามเส้นประสาทส่วนปลาย (Retrograde axoplasmic transport ใน Peripheral sensory/motor nerves)",
      "เดินทางผ่านระบบไหลเวียนโลหิตอย่างรวดเร็วภายใน 1 ชั่วโมง",
      "เดินทางผ่านทางท่อน้ำเหลืองเข้าสู่ม้าม",
      "แทรกซึมผ่านทางกล้ามเนื้อลายไปตามแนวกระดูกสันหลัง"
    ],
    answer: "เดินทางไปตามเส้นประสาทส่วนปลาย (Retrograde axoplasmic transport ใน Peripheral sensory/motor nerves)",
    explanation: "ไวรัสพิษสุนัขบ้าจำลองตัวในกล้ามเนื้อบริเวณแผลกัดช่วงสั้นๆ ก่อนจับกับ Acetylcholine receptors ที่ Neuromuscular junction แล้วเดินทางย้อนขึ้นสู่สมองทาง Axon ของเส้นประสาท (Retrograde transport) ด้วยความเร็วประมาณ 50-100 mm/วัน"
  },
  {
    id: "ch10_q3",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "Negri Bodies Pathology",
    virusType: "rabies",
    q: "'Negri bodies' ที่เป็นลักษณะ Pathognomonic lesion ของโรคพิษสุนัขบ้า มีคุณสมบัติทางจุลพยาธิวิทยาอย่างไร?",
    choices: [
      "Eosinophilic Intracytoplasmic Inclusion bodies ตรวจพบมากที่สุดในเซลล์ Purkinje ของสมองน้อย และเซลล์ Pyramidal ของ Hippocampus",
      "Basophilic Intranuclear Inclusion bodies ในเซลล์ตับ",
      "เม็ดเลือดขาวตายสะสมในหลอดเลือดสมอง",
      "ก้อนหินปูนเกาะในเยื่อหุ้มสมอง"
    ],
    answer: "Eosinophilic Intracytoplasmic Inclusion bodies ตรวจพบมากที่สุดในเซลล์ Purkinje ของสมองน้อย และเซลล์ Pyramidal ของ Hippocampus",
    explanation: "Negri bodies เป็นก้อนสะสมของโปรตีนไวรัส Ribonucleoprotein ในไซโทพลาสซึม ย้อมติดสีชมพูแดง (Eosinophilic) พบเด่นชัดที่สุดใน Pyramidal neurons ของ Ammon's horn (Hippocampus) และ Purkinje cells ของ Cerebellum"
  },
  {
    id: "ch10_q4",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "Rabies Gold Standard Test",
    virusType: "rabies",
    q: "วิธีตรวจทางห้องปฏิบัติการที่เป็นมาตรฐานสากล (Gold Standard) ในการยืนยันการติดเชื้อโรคพิษสุนัขบ้าจากเนื้อเยื่อสมองสัตว์คือวิธีใด?",
    choices: [
      "Direct Fluorescent Antibody test (DFA / FAT)",
      "Enzyme-Linked Immunosorbent Assay (ELISA)",
      "Hemagglutination Inhibition test (HI)",
      "Agar Gel Immunodiffusion (AGID)"
    ],
    answer: "Direct Fluorescent Antibody test (DFA / FAT)",
    explanation: "Direct Fluorescent Antibody (DFA) test จากรอยพิมพ์สมอง (Brain impression smear: Hippocampus, Cerebellum, Brainstem) เป็นมาตรฐานสากลของ WHO/WOAH มีความไวและความจำเพาะเกือบ 100%"
  },
  {
    id: "ch10_q5",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "Infectious Bursal Disease (IBDV / Gumboro)",
    virusType: "default",
    q: "Infectious Bursal Disease Virus (IBDV หรือโรคกัมโบโร) ในไก่ จัดอยู่ในตระกูล Birnaviridae มีสารพันธุกรรมแบบใด และทำลายอวัยวะใดเป็นหลัก?",
    choices: [
      "dsRNA แยกเป็น 2 ท่อน (Bisegmented dsRNA) ทำลาย B-lymphocytes ใน Bursa of Fabricius",
      "ssDNA ท่อนเดียว ทำลายไขกระดูก",
      "(+)ssRNA ทำลายต่อมไทมัส",
      "dsDNA ทำลายม้ามและตับ"
    ],
    answer: "dsRNA แยกเป็น 2 ท่อน (Bisegmented dsRNA) ทำลาย B-lymphocytes ใน Bursa of Fabricius",
    explanation: "Birnaviridae มาจาก 'Bi-RNA' มีจีโนมเป็น dsRNA 2 ท่อน (Segment A และ B) ไวรัสทำลายเซลล์ B-lymphocytes ที่กำลังเจริญในถุงเบอร์ซา (Bursa of Fabricius) ของลูกไก่อายุ 3-6 สัปดาห์ ทำให้เกิดภูมิคุ้มกันบกพร่องรุนแรง"
  },
  {
    id: "ch10_q6",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "IBDV Gross Pathology",
    virusType: "default",
    q: "รอยโรคทางผ่าซากที่เด่นชัดในลูกไก่ที่ติดเชื้อ IBDV (Gumboro) ระยะเฉียบพลันคือข้อใด?",
    choices: [
      "Bursa of Fabricius บวมโต มีเมือกขี้ผึ้งหรือเลือดออก ก่อนจะฝ่อลีบในเวลาต่อมา และมีจุดเลือดออกตามกล้ามเนื้ออกและโคนขา",
      "หงอนและเหนียงบวมม่วงและเกล็ดขาเน่า",
      "หลอดลมตีบตันด้วยก้อนหนองแข็งสีขาว",
      "กระดูกขาหักง่ายและตับโตเป็นสีเขียว"
    ],
    answer: "Bursa of Fabricius บวมโต มีเมือกขี้ผึ้งหรือเลือดออก ก่อนจะฝ่อลีบในเวลาต่อมา และมีจุดเลือดออกตามกล้ามเนื้ออกและโคนขา",
    explanation: "ในวันที่ 3-4 หลังติดเชื้อ ถุงเบอร์ซาจะบวมโตมีขนาดใหญ่ขึ้นเป็น 2 เท่า สีครีมหรือมีจุดเลือดออก (Hemorrhagic bursa) และมีเลือดออกเป็นริ้วๆ ที่กล้ามเนื้อต้นขาและอก จากนั้นถุงเบอร์ซาจะฝ่อลีบอย่างรวดเร็ว (Atrophy)"
  },
  {
    id: "ch10_q7",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "Bovine Ephemeral Fever (BEF)",
    virusType: "rabies",
    q: "โรคไข้สามวันในโค (Bovine Ephemeral Fever - BEF) เกิดจากเชื้อ Ephemerovirus (Rhabdoviridae) ติดต่อผ่านทางแมลงดูดเลือด มีอาการสำคัญอย่างไร?",
    choices: [
      "มีไข้สูงเฉียบพลัน ขากะเผลกกล้ามเนื้อสั่นเกร็ง ลุกไม่ขึ้น (Stiffness and lameness) แต่อาการมักหายดีเองภายใน 3 วัน",
      "ตุ่มน้ำใสที่ปากและลิ้นหลุดลอก",
      "ท้องเสียถ่ายเป็นเลือดสดติดต่อกันเป็นเดือน",
      "ตาบอดถาวรและมีน้ำลายฟูมปากตลอดชีวิต"
    ],
    answer: "มีไข้สูงเฉียบพลัน ขากะเผลกกล้ามเนื้อสั่นเกร็ง ลุกไม่ขึ้น (Stiffness and lameness) แต่อาการมักหายดีเองภายใน 3 วัน",
    explanation: "BEF (Three-day sickness) เป็นโรคติดต่อผ่านริ้น Culicoides และยุง โคจะมีไข้สูง 40-41°C ตัวสั่น ขากะเผลก นอนหมอบไม่ยอมลุก น้ำตาไหล น้ำลายยืด อัตราการป่วยสูงแต่อัตราการตายต่ำ สัตว์มักฟื้นตัวได้เองภายใน 3 วัน"
  },
  {
    id: "ch10_q8",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "Vesicular Stomatitis Virus (VSV)",
    virusType: "rabies",
    q: "Vesicular Stomatitis Virus (VSV ตระกูล Rhabdoviridae) มีความสำคัญทางสัตวแพทย์ด้านการควบคุมโรคระบาดอย่างยิ่งเพราะเหตุใด?",
    choices: [
      "ก่อรอยโรคตุ่มน้ำใสที่ปากและกีบในม้า โค สุกร ซึ่งมีรอยโรคทางคลินิกแยกไม่ออกจากโรคปากและเท้าเปื่อย (FMD) ในโคและสุกร",
      "ทำให้ม้าเกิดอาการกลัวน้ำและดุร้ายเหมือนสุนัขบ้า",
      "เป็นสาเหตุของโรคแท้งระบาดในฟาร์มโคนม",
      "ทำให้ไก่ไข่หยุดไข่ถาวร"
    ],
    answer: "ก่อรอยโรคตุ่มน้ำใสที่ปากและกีบในม้า โค สุกร ซึ่งมีรอยโรคทางคลินิกแยกไม่ออกจากโรคปากและเท้าเปื่อย (FMD) ในโคและสุกร",
    explanation: "VSV ก่อตุ่มน้ำใส (Vesicles) ที่ปาก ลิ้น เต้านม และกีบ คล้ายคลึงกับ FMD มาก แต่ข้อแตกต่างสำคัญคือ **VSV สามารถก่อโรคในม้าได้** ขณะที่ FMD ไม่ก่อโรคในม้า"
  },
  {
    id: "ch10_q9",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "Rabies Quarantine Period",
    virusType: "rabies",
    q: "ตามมาตรฐานทางระบาดวิทยา สุนัขหรือแมวที่กัดคนควรถูกกักขังเพื่อสังเกตอาการโรคพิษสุนัขบ้าเป็นเวลาอย่างน้อยกี่วัน?",
    choices: [
      "อย่างน้อย 10 วัน",
      "อย่างน้อย 3 วัน",
      "อย่างน้อย 30 วัน",
      "อย่างน้อย 6 เดือน"
    ],
    answer: "อย่างน้อย 10 วัน",
    explanation: "สุนัขและแมวจะขับเชื้อ Rabies ออกมาในน้ำลายได้ก่อนแสดงอาการเพียง 1-3 วัน และเมื่อเริ่มแสดงอาการแล้วมักจะตายภายใน 10 วัน ดังนั้นหากกักดูอาการครบ 10 วันแล้วสัตว์ยังมีชีวิตเป็นปกติ แสดงว่าขณะที่กัดไม่มีเชื้อไวรัสในน้ำลาย"
  },
  {
    id: "ch10_q10",
    chapter: 10,
    chapterTitle: "Rhabdoviridae and Birnaviridae",
    virusName: "Rabies Clinical Stages",
    virusType: "rabies",
    q: "อาการของโรคพิษสุนัขบ้าในสุนัขแบ่งเป็น 2 รูปแบบหลัก คือ Furious form (แบบดุร้าย) และ Dumb/Paralytic form (แบบซึม/อัมพาต) สุนัขที่เป็นแบบ Dumb form มักแสดงอาการนำร่องอย่างไร?",
    choices: [
      "ขากรรไกรล่างตกอ้าปากค้าง (Dropped jaw), กลืนลำบาก, น้ำลายไหลยืด, และไม่มีอาการดุร้าย",
      "วิ่งไล่กัดสิ่งไม่มีชีวิตตลอดเวลา",
      "ส่งเสียงเห่าหอนแหลมสูงทั้งวัน",
      "มีอาการชักกระตุกกล้ามเนื้อตาข้างเดียว"
    ],
    answer: "ขากรรไกรล่างตกอ้าปากค้าง (Dropped jaw), กลืนลำบาก, น้ำลายไหลยืด, และไม่มีอาการดุร้าย",
    explanation: "Dumb form เกิดจากอัมพาตของกล้ามเนื้อกลืนและขากรรไกร ทำให้ขากรรไกรตก (Dropped jaw) ลิ้นห้อย น้ำลายไหลยืด เจ้าของมักเข้าใจผิดว่ามีกระดูกติดคอแล้วเอามือล้วงคอสุนัขจนติดเชื้อได้"
  },

  // ── CHAPTER 11: Togaviridae & Flaviviridae ──
  {
    id: "ch11_q1",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "Classical Swine Fever (CSFV)",
    virusType: "default",
    q: "Classical Swine Fever Virus (CSFV หรืออหิวาต์สุกร) จัดอยู่ในสกุล Pestivirus ตระกูล Flaviviridae รอยโรคทางผ่าซากที่จำเพาะเจาะจงมากคือข้อใด?",
    choices: [
      "Turkey egg kidney (จุดเลือดออกทั่วผิวไตคล้ายไข่งวง) และ Button ulcers (แผลหลุมรูปกระดุมที่ลำไส้ใหญ่)",
      "Blackberry jam spleen (ม้ามขยายใหญ่บวมคล้ำมาก)",
      "ตุ่มน้ำใสที่กีบเท้า",
      "ตับแข็งสีเหลืองสะสมไขมัน"
    ],
    answer: "Turkey egg kidney (จุดเลือดออกทั่วผิวไตคล้ายไข่งวง) และ Button ulcers (แผลหลุมรูปกระดุมที่ลำไส้ใหญ่)",
    explanation: "CSFV ก่อให้เกิด Petechial hemorrhages ทั่วผิวคอร์เทกซ์ของไต ทำให้ดูคล้ายไข่นกงวง (Turkey-egg kidney), ม้ามมีลิ่มเลือดอุดตันรูปสามเหลี่ยมที่ขอบ (Splenic infarction), และแผลหลุมกลมมีสะเก็ดเนื้อตายที่ลำไส้ใหญ่ (Button ulcers)"
  },
  {
    id: "ch11_q2",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "Bovine Viral Diarrhea (BVDV PI Calves)",
    virusType: "default",
    q: "การเกิดลูกโคติดเชื้อไวรัส BVDV แบบคงอยู่ตลอดชีวิต (Persistently Infected - PI calves) เกิดขึ้นจากสภาวะใด?",
    choices: [
      "แม่โคติดเชื้อ Non-cytopathic (NCP) BVDV ในช่วงตั้งท้องวันที่ 40-120 วัน ทำให้ระบบภูมิคุ้มกันของตัวอ่อนมองว่าไวรัสคือเซลล์ตัวเอง (Immunotolerance)",
      "ลูกโคได้รับวัคซีนเชื้อเป็นเข็มแรกหลังคลอดทันที",
      "การติดเชื้อ Cytopathic BVDV ในโครุ่นอายุ 1 ปี",
      "ลูกโคดื่มนมน้ำเหลืองที่มีแอนติบอดีสูงเกินไป"
    ],
    answer: "แม่โคติดเชื้อ Non-cytopathic (NCP) BVDV ในช่วงตั้งท้องวันที่ 40-120 วัน ทำให้ระบบภูมิคุ้มกันของตัวอ่อนมองว่าไวรัสคือเซลล์ตัวเอง (Immunotolerance)",
    explanation: "ในช่วงอายุครรภ์ 40-120 วัน ระบบภูมิคุ้มกันของลูกโคกำลังเรียนรู้สิ่งแปลกปลอม (Self vs Non-self) หากติดเชื้อ NCP-BVDV ลูกโคจะไม่สร้างแอนติบอดีต่อไวรัส คลอดออกมาเป็นโค PI ที่ขับเชื้อไวรัสปริมาณมหาศาลตลอดชีวิต เป็นแหล่งแพร่โรคสำคัญที่สุดในฝูง"
  },
  {
    id: "ch11_q3",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "BVDV Mucosal Disease",
    virusType: "default",
    q: "โรค Mucosal Disease (MD) ซึ่งเป็นระยะรุนแรงถึงตายในโค เกิดขึ้นได้อย่างไรในตัวโคที่เป็น PI?",
    choices: [
      "โคที่เป็น PI ได้รับเชื้อหรือเกิดการกลายพันธุ์ของไวรัสในตัวกลายเป็นสายพันธุ์ Cytopathic (CP) BVDV",
      "โคได้รับสารพิษจากเชื้อราในอาหารข้น",
      "โคเกิดภาวะขาดแร่ธาตุทองแดงอย่างรุนแรง",
      "การฉีดวัคซีนป้องกันโรคปากและเท้าเปื่อยซ้ำซ้อน"
    ],
    answer: "โคที่เป็น PI ได้รับเชื้อหรือเกิดการกลายพันธุ์ของไวรัสในตัวกลายเป็นสายพันธุ์ Cytopathic (CP) BVDV",
    explanation: "Mucosal Disease เกิดขึ้นเฉพาะในโคที่เป็น PI (ติดเชื้อ NCP-BVDV อยู่เดิม) เมื่อจีโนมกลายพันธุ์เป็น Cytopathic (CP) strain โคจะไม่มีภูมิคุ้มกันต่อต้าน ทำให้เกิดแผลหลุมลึกตลอดทางเดินอาหาร ท้องเสียเป็นน้ำปนเลือด และตาย 100%"
  },
  {
    id: "ch11_q4",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "West Nile Virus (WNV)",
    virusType: "default",
    q: "West Nile Virus (WNV ตระกูล Flaviviridae) มีนกเป็นรังโรคตามธรรมชาติและมียุง Culex เป็นพาหะ เมื่อแพร่สู่ม้าและคน (Dead-end hosts) จะก่อให้เกิดอาการทางระบบใด?",
    choices: [
      "ระบบประสาทส่วนกลาง: สมองและไขสันหลังอักเสบ (Encephalomyelitis) เดินเซ (Ataxia) กล้ามเนื้อใบหน้ากระตุก อัมพาต",
      "ระบบทางเดินอาหาร: อาเจียนและตับแข็ง",
      "ระบบกล้ามเนื้อ: กล้ามเนื้อลีบโดยไม่มีไข้",
      "ระบบทางเดินหายใจ: ปอดบวมมีหนอง"
    ],
    answer: "ระบบประสาทส่วนกลาง: สมองและไขสันหลังอักเสบ (Encephalomyelitis) เดินเซ (Ataxia) กล้ามเนื้อใบหน้ากระตุก อัมพาต",
    explanation: "WNV ในม้าทำให้เกิด Polioencephalomyelitis ม้ามีไข้ เดินเซโซเซ ขาหลังอ่อนแรง กล้ามเนื้อริมฝีปากและหูกระตุกกระตุก ล้มลงนอนแล้วลุกไม่ขึ้น อัตราการตายประมาณ 30-40%"
  },
  {
    id: "ch11_q5",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "Japanese Encephalitis Virus (JEV)",
    virusType: "default",
    q: "Japanese Encephalitis Virus (JEV) ในฟาร์มสุกร ก่อให้เกิดปัญหาสำคัญที่สุดในข้อใด?",
    choices: [
      "ปัญหาในระบบสืบพันธุ์: แม่สุกรแท้ง ลูกตายแรกคลอด มัมมี่ และอัณฑะอักเสบในพ่อสุกร (Orchitis)",
      "อาการท้องเสียรุนแรงในลูกสุกรขุน",
      "อาการตุ่มน้ำใสที่กีบเท้าพ่อพันธุ์",
      "อาการไอเรื้อรังและหูม่วง"
    ],
    answer: "ปัญหาในระบบสืบพันธุ์: แม่สุกรแท้ง ลูกตายแรกคลอด มัมมี่ และอัณฑะอักเสบในพ่อสุกร (Orchitis)",
    explanation: "JEV มียุง Culex tritaeniorhynchus เป็นพาหะ สุกรเป็น Amplifying host ในแม่สุกรตั้งท้องทำให้เกิด Reproductive failure (แท้ง, ลูกตายคลอด, Hydrocephalus) และในพ่อสุกรทำให้อัณฑะอักเสบ น้ำเชื้อด้อยคุณภาพและเป็นหมันชั่วคราว"
  },
  {
    id: "ch11_q6",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "Duck Tembusu Virus (DTMUV)",
    virusType: "default",
    q: "Duck Tembusu Virus (DTMUV) เป็น Flavivirus ที่แพร่ระบาดในเป็ดไข่ในเอเชีย อาการเด่นที่สร้างความเสียหายทางเศรษฐกิจสูงสุดคืออะไร?",
    choices: [
      "ผลผลิตไข่ลดลงอย่างรวดเร็วเฉียบพลัน (Egg drop syndrome) เป็ดเดินเซ ขาเป็นอัมพาต และรังไข่อักเสบมีเลือดออกรุนแรง",
      "ขนเป็ดร่วงหมดตัวภายใน 2 วัน",
      "จะงอยปากเป็ดเปื่อยเน่า",
      "ตาบอดและคอบิดหมุนรอบตัว"
    ],
    answer: "ผลผลิตไข่ลดลงอย่างรวดเร็วเฉียบพลัน (Egg drop syndrome) เป็ดเดินเซ ขาเป็นอัมพาต และรังไข่อักเสบมีเลือดออกรุนแรง",
    explanation: "DTMUV มียุง Culex เป็นพาหะ ก่อให้เกิดไข่ลดฮวบในเป็ดไข่ (จาก 80-90% เหลือต่ำกว่า 10%) เป็ดมีอาการทางประสาท เดินเซ ขาอ่อนแรง ผ่าซากพบรังไข่อักเสบ ตกเลือด และฟอลลิเคิลไข่แดงแตกสลาย (Ovaritis & Egg peritonitis)"
  },
  {
    id: "ch11_q7",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "Equine Encephalitis Viruses (EEE/WEE/VEE)",
    virusType: "default",
    q: "Eastern, Western, และ Venezuelan Equine Encephalomyelitis viruses จัดอยู่ในตระกูล Togaviridae สกุล Alphavirus มีความสำคัญทางสัตวแพทย์อย่างไร?",
    choices: [
      "ก่อโรคสมองอักเสบรุนแรงในม้าและคน (Zoonotic arboviruses) มียุงเป็นพาหะนำโรค โดย EEE มีอัตราการตายในม้าสูงถึง 90%",
      "ก่อโรคแท้งติดต่อในสุกรเท่านั้น",
      "ก่อโรคตับอักเสบในสุนัข",
      "ก่อโรคปอดบวมในแมว"
    ],
    answer: "ก่อโรคสมองอักเสบรุนแรงในม้าและคน (Zoonotic arboviruses) มียุงเป็นพาหะนำโรค โดย EEE มีอัตราการตายในม้าสูงถึง 90%",
    explanation: "Alphaviruses กลุ่มนี้เป็น Zoonotic mosquito-borne arboviruses ทำให้เกิด Severe encephalomyelitis ในม้าและคน โดย EEEV มีความรุนแรงสูงสุด อัตราการตายในม้า 75-90% และในคนประมาณ 30-70%"
  },
  {
    id: "ch11_q8",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "BVDV Ear Notch Testing",
    virusType: "default",
    q: "การตรวจคัดกรองหาโคที่เป็น PI ของโรค BVDV ในระดับฝูง นิยมใช้วิธีเก็บตัวอย่างชนิดใดตรวจหา Antigen?",
    choices: [
      "ชิ้นเนื้อขอบใบหู (Ear notch biopsy) ตรวจด้วยวิธี Antigen ELISA หรือ IHC",
      "ตัวอย่างน้ำนมถังรวมตรวจด้วยวิธีส่องกล้องจุลทรรศน์",
      "ขนหางโคตรวจหา DNA",
      "ปัสสาวะโคตรวจด้วยแถบวัดสีเคมี"
    ],
    answer: "ชิ้นเนื้อขอบใบหู (Ear notch biopsy) ตรวจด้วยวิธี Antigen ELISA หรือ IHC",
    explanation: "Ear notch biopsy สะดวกและแม่นยำสูงมาก เพราะโคที่เป็น PI จะมี BVDV antigen แทรกซึมสะสมอยู่ในเซลล์เยื่อบุผิวและต่อมขนที่ผิวหนังใบหูในปริมาณสูงตลอดเวลา โดยไม่ถูกรบกวนจาก Maternal antibody ในน้ำเลือด"
  },
  {
    id: "ch11_q9",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "CSFV vs ASFV Differentiation",
    virusType: "default",
    q: "Classical Swine Fever (CSFV) และ African Swine Fever (ASFV) มีอาการและรอยโรคทางคลินิกคล้ายคลึงกันมาก ข้อใดเป็นความแตกต่างพื้นฐานของไวรัสทั้งสอง?",
    choices: [
      "CSFV เป็น Enveloped (+)ssRNA ไวรัส มีวัคซีนป้องกันที่มีประสิทธิภาพสูง ส่วน ASFV เป็น dsDNA ไวรัสขนาดใหญ่และปัจจุบันยังไม่มีวัคซีนมาตรฐานทั่วไป",
      "CSFV ไม่ทำให้สุกรตาย ส่วน ASFV ทำให้ตาย 100%",
      "CSFV ก่อโรคในม้าได้ ส่วน ASFV ก่อโรคในสุกรเท่านั้น",
      "CSFV ติดต่อผ่านทางเห็บเท่านั้น ส่วน ASFV ติดต่อทางลมหายใจ"
    ],
    answer: "CSFV เป็น Enveloped (+)ssRNA ไวรัส มีวัคซีนป้องกันที่มีประสิทธิภาพสูง ส่วน ASFV เป็น dsDNA ไวรัสขนาดใหญ่และปัจจุบันยังไม่มีวัคซีนมาตรฐานทั่วไป",
    explanation: "CSFV เป็น Pestivirus (Flaviviridae) มีวัคซีนเชื้อเป็นผ่านกระต่าย (LOM / C-strain) ที่ให้ผลคุ้มโรคดีเยี่ยม ส่วน ASFV เป็น Asfarviridae จีโนมซับซ้อนมาก หลบเลี่ยงภูมิคุ้มกันเก่ง และยังไม่มีวัคซีนที่ปลอดภัยใช้ทั่วไปในระดับโลก"
  },
  {
    id: "ch11_q10",
    chapter: 11,
    chapterTitle: "Togaviridae and Flaviviridae",
    virusName: "Flavivirus Genome & Cleavage",
    virusType: "default",
    q: "จีโนมของไวรัสตระกูล Flaviviridae แปลรหัสโปรตีนออกมาในลักษณะใดก่อนที่จะถูกตัดแบ่งเป็นโปรตีนย่อย?",
    choices: [
      "Single large polyprotein แล้วถูกตัดย่อยด้วยเอนไซม์ Viral protease (NS2B-NS3) และ Host signalase",
      "แปลรหัสแยกเป็น mRNA แต่ละท่อนอิสระ 10 ชิ้น",
      "แปลรหัสเฉพาะโปรตีนโครงสร้าง ส่วนโปรตีนเอนไซม์ดึงมาจากเซลล์โฮสต์",
      "ไม่มีการแปลรหัสโปรตีนแต่ใช้ RNA ทำลายเซลล์โดยตรง"
    ],
    answer: "Single large polyprotein แล้วถูกตัดย่อยด้วยเอนไซม์ Viral protease (NS2B-NS3) และ Host signalase",
    explanation: "Flavivirus มี Open Reading Frame (ORF) เดียว จีโนม (+)ssRNA ถูกแปลรหัสเป็น Polyprotein สายเดี่ยวยาวสายเดียว จากนั้นจะถูกตัดด้วย Protease ของไวรัสและโฮสต์ กลายเป็น 3 Structural proteins (C, prM, E) และ 7 Non-structural proteins (NS1-NS5)"
  },

  // ── CHAPTER 12: Reoviridae & Bunyaviridae ──
  {
    id: "ch12_q1",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "African Horse Sickness (AHSV)",
    virusType: "default",
    q: "African Horse Sickness Virus (AHSV ตระกูล Reoviridae) มีแมลงชนิดใดเป็นพาหะนำโรคที่สำคัญที่สุด?",
    choices: [
      "ริ้นดูดเลือดสกุล Culicoides (Biting midges)",
      "ยุงรำคาญ Culex",
      "เหลือบม้า Tabanus",
      "แมลงวันคอก Stomoxys"
    ],
    answer: "ริ้นดูดเลือดสกุล Culicoides (Biting midges)",
    explanation: "AHSV เป็น Orbivirus ที่มีพาหะชีวภาพหลักคือริ้นน้ำจืดสกุล Culicoides (โดยเฉพาะ C. imicola และ C. bolitinos) ซึ่งมีการระบาดสัมพันธ์กับฤดูฝนและทิศทางลม"
  },
  {
    id: "ch12_q2",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "AHSV Clinical Forms",
    virusType: "default",
    q: "AHSV ในม้า รูปแบบปอดเฉียบพลันรุนแรง (Pulmonary form / Dunkop) มีอาการเด่นชัดที่ทำให้ม้าตายภายในไม่กี่ชั่วโมงคือข้อใด?",
    choices: [
      "หายใจลำบากอ้าปากหายใจ และมีฟองน้ำข้นสีขาว/ชมพูไหลทะลักออกมาจากรูจมูก (Frothy nasal discharge) เนื่องจากน้ำท่วมปอดรุนแรง",
      "อาการบวมน้ำบริเวณขมับและเปลือกตาโดยไม่มีอาการปอด",
      "อาการท้องเสียถ่ายเป็นเลือดสด",
      "ตุ่มหนองพุพองทั่วลำตัว"
    ],
    answer: "หายใจลำบากอ้าปากหายใจ และมีฟองน้ำข้นสีขาว/ชมพูไหลทะลักออกมาจากรูจมูก (Frothy nasal discharge) เนื่องจากน้ำท่วมปอดรุนแรง",
    explanation: "Dunkop (Pulmonary form) เป็นฟอร์มรุนแรงที่สุด อัตราการตาย > 95% ไวรัสทำลายหลอดเลือดในปอด เกิด Severe interstitial pulmonary edema ม้ามีฟองน้ำฟอดไหลทะลักออกจากจมูกและตายจากการขาดอากาศหายใจ"
  },
  {
    id: "ch12_q3",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "Bluetongue Virus (BTV)",
    virusType: "default",
    q: "Bluetongue Virus (BTV) ในแกะ ก่อให้เกิดอาการลิ้นบวมและมีสีม่วงคล้ำ (Cyanotic blue tongue) เกิดจากกลไกพยาธิสภาพใด?",
    choices: [
      "เชื้อทำลายเซลล์เยื่อบุผนังหลอดเลือด (Endothelial injury) ทำให้เกิดลิ่มเลือดอุดตัน ขาดเลือด และคั่งเลือด (Cyanosis)",
      "ไวรัสผลิตเม็ดสีสีน้ำเงินเข้มสะสมในกล้ามเนื้อลิ้น",
      "การติดเชื้อแบคทีเรียแทรกซ้อนที่ต่อมน้ำลาย",
      "ปฏิกิริยาแพ้ยาปฏิชีวนะ"
    ],
    answer: "เชื้อทำลายเซลล์เยื่อบุผนังหลอดเลือด (Endothelial injury) ทำให้เกิดลิ่มเลือดอุดตัน ขาดเลือด และคั่งเลือด (Cyanosis)",
    explanation: "BTV มี Tropism ต่อ Vascular endothelial cells ทำให้เกิด Thrombosis, Ischemia, Vascular leakage ลิ้นและเยื่อบุช่องปากจึงบวมน้ำอย่างหนัก ขาดออกซิเจนจนเนื้อเยื่อกลายเป็นสีเขียวคล้ำอมฟ้า (Cyanotic blue tongue)"
  },
  {
    id: "ch12_q4",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "Rotavirus Pathogenesis",
    virusType: "default",
    q: "Rotavirus (Reoviridae) เป็นสาเหตุสำคัญของโรคท้องเสียในลูกสัตว์แรกเกิด (ลูกโค, ลูกสุกร, ลูกม้า) มีกลไกการก่อโรคท้องร่วงอย่างไร?",
    choices: [
      "ทำลาย Mature enterocytes ที่ปลายวิลไลของลำไส้เล็ก ทำให้เกิด Malabsorptive diarrhea และโปรตีน NSP4 ทำหน้าที่เป็น Enterotoxin กระตุ้นการหลั่งสารคัดหลั่ง",
      "หลั่งสารพิษทำลายเซลล์ประสาทควบคุมลำไส้",
      "ทำให้กล้ามเนื้อหูรูดทวารหนักเป็นอัมพาต",
      "ทำให้ลำไส้เล็กกลืนกัน (Intussusception)"
    ],
    answer: "ทำลาย Mature enterocytes ที่ปลายวิลไลของลำไส้เล็ก ทำให้เกิด Malabsorptive diarrhea และโปรตีน NSP4 ทำหน้าที่เป็น Enterotoxin กระตุ้นการหลั่งสารคัดหลั่ง",
    explanation: "Rotavirus ทำลายเซลล์ดูดซึมอาหารที่ปลายวิลไล (Villus atrophy) ทำให้ย่อยแลคโตสไม่ได้ เกิด Osmotic/Malabsorptive diarrhea นอกจากนี้โปรตีน NSP4 ของไวรัสยังทำหน้าที่เป็น Viral enterotoxin กระตุ้นหลั่งแคลเซียมและคลอไรด์ เกิด Secretory diarrhea ร่วมด้วย"
  },
  {
    id: "ch12_q5",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "Reoviridae Genome Structure",
    virusType: "default",
    q: "โครงสร้างจีโนมของไวรัสตระกูล Reoviridae มีลักษณะเด่นคือข้อใด?",
    choices: [
      "dsRNA แยกเป็น 10 - 12 ท่อน (Segmented dsRNA) ไม่มีเปลือกหุ้ม แต่มี Capsid ซ้อนกัน 2-3 ชั้น",
      "ssDNA ท่อนเดียวรูปวงแหวน",
      "(+)ssRNA สายเดี่ยวยาวต่อเนื่อง",
      "dsDNA ขนาดใหญ่มีเปลือกหุ้ม"
    ],
    answer: "dsRNA แยกเป็น 10 - 12 ท่อน (Segmented dsRNA) ไม่มีเปลือกหุ้ม แต่มี Capsid ซ้อนกัน 2-3 ชั้น",
    explanation: "Reoviridae มีจีโนมเป็น dsRNA แยกเป็น 10 ท่อน (เช่น Orbivirus, Rotavirus) หรือ 11-12 ท่อน มี Capsid ทรง 20 หน้าซ้อนกัน 2 หรือ 3 ชั้น ทนทานในสิ่งแวดล้อมได้ดี"
  },
  {
    id: "ch12_q6",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "Rift Valley Fever (RVF)",
    virusType: "default",
    q: "Rift Valley Fever Virus (RVFV ตระกูล Bunyaviridae/Phenuiviridae) เป็นโรคสัตว์สู่คน (Zoonosis) ที่มียุงเป็นพาหะ ในฝูงแกะและโคจะก่อให้เกิดปรากฏการณ์ทางคลินิกใดที่เด่นชัดที่สุด?",
    choices: [
      "Abortion storms (การแท้งลูกระบาดเกือบ 100% ในสัตว์ตั้งท้อง) และลูกสัตว์แรกเกิดตายเฉียบพลันจากตับวาย",
      "การเกิดตุ่มน้ำใสที่เต้านมแม่โค",
      "อาการข้อบวมเดินไม่ได้ในแกะโต",
      "ขนแกะร่วงหลุดหมดทั้งฝูง"
    ],
    answer: "Abortion storms (การแท้งลูกระบาดเกือบ 100% ในสัตว์ตั้งท้อง) และลูกสัตว์แรกเกิดตายเฉียบพลันจากตับวาย",
    explanation: "RVFV ก่อการแท้งเกือบ 100% ในแกะและแพะอุ้มท้อง (Abortion storms) และลูกแกะแรกเกิดตายสูงถึง 90-100% จาก Severe necrotizing hepatitis ในคนก่อไข้ เลือดออก และตาบอด"
  },
  {
    id: "ch12_q7",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "Akabane & Schmallenberg Viruses",
    virusType: "default",
    q: "Akabane Virus และ Schmallenberg Virus (Bunyaviridae) ติดต่อผ่านริ้น Culicoides เมื่อแม่โคหรือแกะติดเชื้อในระยะตั้งท้อง จะส่งผลต่อลูกในท้องอย่างไร?",
    choices: [
      "ลูกเกิดมาพิการแต่กำเนิด: ข้อคดงอแข็งเกร็ง (Arthrogryposis) และสมองมีโพรงน้ำขนาดใหญ่ไม่มีเนื้อสมอง (Hydranencephaly)",
      "ลูกคลอดออกมาไม่มีขนและไม่มีฟัน",
      "ลูกคลอดออกมามีหัวใจ 2 ดวง",
      "ลูกมีขนาดตัวใหญ่กว่าปกติ 3 เท่า"
    ],
    answer: "ลูกเกิดมาพิการแต่กำเนิด: ข้อคดงอแข็งเกร็ง (Arthrogryposis) และสมองมีโพรงน้ำขนาดใหญ่ไม่มีเนื้อสมอง (Hydranencephaly)",
    explanation: "ไวรัสกลุ่ม Simbu serogroup ทำลายเซลล์ประสาทสั่งการในสมองและไขสันหลังของตัวอ่อนในครรภ์ ทำให้กล้ามเนื้อไม่ทำงาน ข้อต่อจึงยึดงอแข็ง (Arthrogryposis) และเนื้อสมองฝ่อลวงกลายเป็นถุงน้ำ (Hydranencephaly) เรียกว่ากลุ่มอาการ A-H syndrome"
  },
  {
    id: "ch12_q8",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "Bunyaviridae Genome Structure",
    virusType: "default",
    q: "จีโนมของไวรัสตระกูล Bunyaviridae มีลักษณะโครงสร้างอย่างไร?",
    choices: [
      "(-)ssRNA หรือ Ambisense แยกเป็น 3 ท่อน ได้แก่ L (Large), M (Medium), และ S (Small)",
      "dsRNA แยกเป็น 8 ท่อน",
      "ssDNA วงแหวนคู่",
      "RNA เส้นตรงท่อนเดี่ยวไม่มีการแบ่งท่อน"
    ],
    answer: "(-)ssRNA หรือ Ambisense แยกเป็น 3 ท่อน ได้แก่ L (Large), M (Medium), และ S (Small)",
    explanation: "Bunyavirales มีจีโนมแบบ Tripartite (-)ssRNA หรือ Ambisense 3 ท่อน: L (ถอดรหัส RdRp), M (ถอดรหัส Glycoproteins Gn/Gc), และ S (ถอดรหัส Nucleocapsid protein N)"
  },
  {
    id: "ch12_q9",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "Crimean-Congo Hemorrhagic Fever",
    virusType: "default",
    q: "Crimean-Congo Hemorrhagic Fever Virus (CCHFV) ในตระกูล Nairoviridae (Bunyavirales) มีพาหะนำโรคสำคัญคือสัตว์ขาปล้องชนิดใด?",
    choices: [
      "เห็บแข็งสกุล Hyalomma (Hard ticks)",
      "ยุงก้นปล่อง Anopheles",
      "หมัดสุนัข Ctenocephalides",
      "ไรนก Dermanyssus"
    ],
    answer: "เห็บแข็งสกุล Hyalomma (Hard ticks)",
    explanation: "CCHFV มีเห็บแข็งสกุล Hyalomma เป็นพาหะหลักและรังโรค สัตว์เคี้ยวเอื้องที่ติดเชื้อมักไม่แสดงอาการป่วย แต่คนติดเชื้อจากการถูกเห็บกัดหรือสัมผัสเลือดสัตว์ป่วย จะเกิด Severe hemorrhagic fever ตายสูงถึง 30-50%"
  },
  {
    id: "ch12_q10",
    chapter: 12,
    chapterTitle: "Reoviridae and Bunyaviridae",
    virusName: "Avian Reovirus",
    virusType: "default",
    q: "Avian Reovirus ในไก่เนื้อ มักก่อให้เกิดปัญหาข้อต่อและการเคลื่อนไหวที่สำคัญคือโรคใด?",
    choices: [
      "Viral Arthritis / Tenosynovitis (เอ็นร้อยหวาย Gastrocnemius บวมและฉีกขาด)",
      "กระดูกสะโพกหลุดแต่กำเนิด",
      "โรคกล้ามเนื้ออกแห้ง",
      "อัมพาตนิ้วเท้าหงิกงอจากขาดวิตามิน"
    ],
    answer: "Viral Arthritis / Tenosynovitis (เอ็นร้อยหวาย Gastrocnemius บวมและฉีกขาด)",
    explanation: "Avian Reovirus ก่อการอักเสบของเยื่อหุ้มข้อและปลอกหุ้มเอ็น (Tenosynovitis) บริเวณข้อต่อ Tarsometatarsal และ Tibiotarsal เอ็น Gastrocnemius tendon จะบวม เปื่อย และอาจฉีกขาด (Rupture) ทำให้ไก่เดินขากะเผลก ลุกไม่ขึ้น"
  },

  // ── CHAPTER 13: Picornaviridae & Caliciviridae ──
  {
    id: "ch13_q1",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "Foot and Mouth Disease (FMDV)",
    virusType: "picorna",
    q: "Foot and Mouth Disease Virus (FMDV ตระกูล Picornaviridae) มีซีโรไทป์ (Serotypes) ทั้งหมดกี่ชนิด และการมีภูมิคุ้มกันต่อ Serotype หนึ่งสามารถป้องกันอีก Serotype หนึ่งได้หรือไม่?",
    choices: [
      "มี 7 Serotypes (O, A, C, SAT 1, SAT 2, SAT 3, Asia 1) และไม่มีการป้องกันข้าม Serotype (No cross-protection)",
      "มี 3 Serotypes และสามารถป้องกันข้ามกันได้สมบูรณ์",
      "มีเพียง 1 Serotype เดียวในโลก",
      "มี 15 Serotypes และใช้วัคซีนชนิดเดียวป้องกันได้ทั้งหมด"
    ],
    answer: "มี 7 Serotypes (O, A, C, SAT 1, SAT 2, SAT 3, Asia 1) และไม่มีการป้องกันข้าม Serotype (No cross-protection)",
    explanation: "FMDV มี 7 ซีโรไทป์ที่ไม่คุ้มโรคข้ามกันเลย (No cross-immunity) การทำวัคซีนจะต้องเลือกสายพันธุ์ให้ตรงกับ Serotype และ Topotype ที่กำลังระบาดในพื้นที่นั้นๆ (ในไทยพบ O, A, Asia 1 เป็นหลัก)"
  },
  {
    id: "ch13_q2",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "FMD Host Susceptibility",
    virusType: "picorna",
    q: "สัตว์กลุ่มใดต่อไปนี้ที่ **ไม่ติดเชื้อ** ไวรัสโรคปากและเท้าเปื่อย (FMDV)?",
    choices: [
      "ม้า ลา ล่อ (สัตว์กีบเดี่ยว / Perissodactyla)",
      "โค กระบือ (สัตว์เคี้ยวเอื้อง)",
      "สุกร และหมูป่า",
      "แพะ แกะ และกวาง"
    ],
    answer: "ม้า ลา ล่อ (สัตว์กีบเดี่ยว / Perissodactyla)",
    explanation: "FMD เป็นโรคของสัตว์กีบคู่ (Artiodactyla) เท่านั้น สัตว์กีบเดี่ยว เช่น ม้า ลา ล่อ จะไม่ติดเชื้อ FMD โดยเด็ดขาด ซึ่งใช้เป็นจุดวินิจฉัยแยกโรคสำคัญจาก Vesicular Stomatitis"
  },
  {
    id: "ch13_q3",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "FMD Tiger Heart",
    virusType: "picorna",
    q: "ในลูกสัตว์อายุน้อย (เช่น ลูกโค ลูกสุกรดูดนม) ที่ติดเชื้อ FMDV มักตายเฉียบพลันจากรอยโรคใดที่กล้ามเนื้อหัวใจ?",
    choices: [
      "Tiger heart (หัวใจลายเสือ จากรอยโรค Myocarditis แถบสีขาวเทาสลับแดง)",
      "ลิ้นหัวใจตีบตันแต่กำเนิด",
      "เยื่อหุ้มหัวใจอักเสบเป็นหนอง",
      "หลอดเลือดโคโรนารีอุดตัน"
    ],
    answer: "Tiger heart (หัวใจลายเสือ จากรอยโรค Myocarditis แถบสีขาวเทาสลับแดง)",
    explanation: "ในลูกสัตว์อายุน้อย FMDV เข้าทำลายกล้ามเนื้อหัวใจโดยตรง เกิด Myocardial degeneration และ Necrosis เป็นแถบสีเทาขาวสลับกับเนื้อเยื่อหัวใจสีแดง เรียกว่า 'Tiger heart' ทำให้หัวใจวายตายก่อนเกิดตุ่มน้ำที่ปาก"
  },
  {
    id: "ch13_q4",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "FMD Epidemiology Roles",
    virusType: "picorna",
    q: "ในทางระบาดวิทยาของโรค FMD บทบาทของ 'โค' และ 'สุกร' แตกต่างกันอย่างไร?",
    choices: [
      "โคเป็น Indicator host (แสดงอาการเร็ว ไวต่อการติดเชื้อทางอากาศ) ส่วนสุกรเป็น Amplifier host (ขับเชื้อออกมาทางลมหายใจในปริมาณมหาศาล)",
      "สุกรเป็น Indicator host ส่วนโคเป็น Amplifier host",
      "ทั้งโคและสุกรมีบทบาทเท่ากันทุกประการ",
      "โคเป็นพาหะแฝงโรคอย่างเดียวโดยไม่เคยแสดงอาการป่วย"
    ],
    answer: "โคเป็น Indicator host (แสดงอาการเร็ว ไวต่อการติดเชื้อทางอากาศ) ส่วนสุกรเป็น Amplifier host (ขับเชื้อออกมาทางลมหายใจในปริมาณมหาศาล)",
    explanation: "โคมีความไวต่อการติดเชื้อผ่านทางละอองฝอยหายใจสูงมากแม้ปริมาณไวรัสจะต่ำ จึงเป็น 'Indicator' ที่แสดงอาการก่อน ส่วนสุกรเมื่อติดเชื้อจะขับอนุภาคไวรัสออกมาในลมหายใจมากกว่าโคถึง 1,000 เท่า จึงทำหน้าที่เป็น 'Amplifier' เร่งการระบาด"
  },
  {
    id: "ch13_q5",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "Feline Calicivirus (FCV)",
    virusType: "default",
    q: "Feline Calicivirus (FCV ตระกูล Caliciviridae) ก่อให้เกิดรอยโรคทางคลินิกที่จำเพาะเจาะจงมากที่สุดในแมวคือข้อใด?",
    choices: [
      "แผลหลุมลึกที่ลิ้น เหงือก เพดานปาก (Oral ulceration) และอาการขากะเผลกชั่วคราว (Limping kitten syndrome)",
      "แผลแตกแขนงรูปกิ่งไม้ที่กระจกตา (Dendritic ulcer)",
      "ท้องมานน้ำสีเหลืองในช่องท้อง",
      "ต่อมน้ำเหลืองโตทั่วตัวและมีเนื้องอกไขกระดูก"
    ],
    answer: "แผลหลุมลึกที่ลิ้น เหงือก เพดานปาก (Oral ulceration) และอาการขากะเผลกชั่วคราว (Limping kitten syndrome)",
    explanation: "FCV ทำให้เกิดแผลหลุมในช่องปาก (Oral ulcers) โดยเฉพาะที่ขอบลิ้น เพดานปาก และจมูก น้ำลายไหลยืด ปวดปากไม่ยอมกินอาหาร และบางสายพันธุ์ทำให้เกิดข้ออักเสบเดินกะเผลก (Limping syndrome) ต่างจาก FHV-1 ที่เด่นเรื่องแผลที่กระจกตาและจามน้ำมูกเขียว"
  },
  {
    id: "ch13_q6",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "Virulent Systemic FCV (VS-FCV)",
    virusType: "default",
    q: "Feline Calicivirus สายพันธุ์กลายพันธุ์ชนิดรุนแรงทั่วร่างกาย (Virulent Systemic FCV - VS-FCV) มีลักษณะการเกิดโรคอย่างไร?",
    choices: [
      "มีอัตราการตายสูงถึง 50% ทำให้เกิด Vasculitis หน้าและขาบวมน้ำ ดีซ่าน ตับวาย เลือดออก และแผลหลุมตามผิวหนัง",
      "ทำให้แมวกลายเป็นแมวดุร้ายคล้ายพิษสุนัขบ้า",
      "ทำให้ตาบอดและหูหนวกถาวร",
      "เกิดเฉพาะในลูกแมวแรกเกิดเท่านั้น"
    ],
    answer: "มีอัตราการตายสูงถึง 50% ทำให้เกิด Vasculitis หน้าและขาบวมน้ำ ดีซ่าน ตับวาย เลือดออก และแผลหลุมตามผิวหนัง",
    explanation: "VS-FCV เป็นสายพันธุ์กลายพันธุ์ที่มีความรุนแรงสูงมาก ก่อการทำลายหลอดเลือด (Systemic vasculitis) แมวจะมีไข้สูง หน้าและอุ้งเท้าบวมน้ำ (Edema) ตับวายดีซ่าน เลือดออก และผิวหนังตกสะเก็ดหลุดลอก อัตราการตายสูงถึง 50-60% แม้ในแมวโตที่เคยทำวัคซีน"
  },
  {
    id: "ch13_q7",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "Rabbit Hemorrhagic Disease (RHDV)",
    virusType: "default",
    q: "Rabbit Hemorrhagic Disease Virus (RHDV ตระกูล Caliciviridae) ก่อให้เกิดโรคในกระต่ายเลี้ยง (European rabbit) มีพยาธิสภาพเด่นชัดคือข้อใด?",
    choices: [
      "ตับวายและเนื้อตายเฉียบพลัน (Necrotizing hepatitis) เลือดออกทั่วอวัยวะภายใน และมีเลือดไหลออกทางรูจมูกก่อนตายอย่างรวดเร็ว",
      "ตุ่มหนองพุพองรอบดวงตาและใบหู",
      "กล้ามเนื้อขาลีบและตาบอด",
      "ฟันงอกยาวผิดรูปและท้องอืดเรื้อรัง"
    ],
    answer: "ตับวายและเนื้อตายเฉียบพลัน (Necrotizing hepatitis) เลือดออกทั่วอวัยวะภายใน และมีเลือดไหลออกทางรูจมูกก่อนตายอย่างรวดเร็ว",
    explanation: "RHDV (Lagovirus) ทำลายเซลล์ตับอย่างรุนแรง ก่อให้เกิด DIC (Disseminated Intravascular Coagulation) กระต่ายจะซึม ไข้สูง ชักเกร็ง และตายฉับพลันภายใน 12-36 ชั่วโมง ผ่าซากพบตับซีดเปื่อย และมีฟองเลือดสดไหลทะลักออกจากจมูก"
  },
  {
    id: "ch13_q8",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "Calicivirus Cup-shaped Depressions",
    virusType: "default",
    q: "ชื่อตระกูล Caliciviridae มีที่มาจากรากศัพท์ภาษาละติน 'Calix' เนื่องจากอนุภาคไวรัสมีลักษณะทางสัณฐานวิทยาอย่างไรใต้กล้องจุลทรรศน์อิเล็กตรอน?",
    choices: [
      "มีรอยบุ๋มรูปถ้วย (Cup-shaped depressions) 32 รอยบนพื้นผิวของแคปซิด",
      "มีรูปร่างยาวคล้ายแท่งกระบอง",
      "มีหนามแหลมรูปมงกุฎล้อมรอบ",
      "มีหางยาวคล้ายลูกอ๊อด"
    ],
    answer: "มีรอยบุ๋มรูปถ้วย (Cup-shaped depressions) 32 รอยบนพื้นผิวของแคปซิด",
    explanation: "คำว่า Calix แปลว่า ถ้วย (Chalice/Cup) อนุภาค Calicivirus เป็นไวรัส Nakedทรง 20 หน้า บนผิวมีหลุมบุ๋มรูปถ้วย 32 รอย เรียงตัวเป็นรูปดาวหกแฉก (Star of David) เมื่อมองบางมุม"
  },
  {
    id: "ch13_q9",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "Swine Vesicular Disease (SVDV)",
    virusType: "picorna",
    q: "Swine Vesicular Disease Virus (SVDV) เป็น Enterovirus ในสุกร มีความสำคัญทางคลินิกอย่างไร?",
    choices: [
      "ก่อรอยโรคตุ่มน้ำใสที่กีบและปากในสุกร ซึ่งมีอาการเหมือนโรค FMD ทุกประการ แต่ไม่ติดต่อไปยังโคหรือแกะ",
      "ทำให้สุกรแท้งลูกในช่วงท้ายของการตั้งท้อง",
      "ทำให้ลูกสุกรท้องเสียน้ำพุ่ง 100%",
      "ทำให้เกิดอาการหูม่วงคล้ำ"
    ],
    answer: "ก่อรอยโรคตุ่มน้ำใสที่กีบและปากในสุกร ซึ่งมีอาการเหมือนโรค FMD ทุกประการ แต่ไม่ติดต่อไปยังโคหรือแกะ",
    explanation: "SVDV เป็น Picornavirus ที่ก่อโรคตุ่มน้ำใสเฉพาะในสุกรเท่านั้น ไม่ติดสัตว์เคี้ยวเอื้อง แต่ทางคลินิกไม่สามารถแยกออกจาก FMD, VSV หรือ Vesicular Exanthema ได้ ต้องส่งแล็บยืนยันผลเท่านั้น"
  },
  {
    id: "ch13_q10",
    chapter: 13,
    chapterTitle: "Picornaviridae and Caliciviridae",
    virusName: "Avian Encephalomyelitis (AEV)",
    virusType: "picorna",
    q: "Avian Encephalomyelitis Virus (AEV หรือโรคไข้สมองอักเสบในไก่ / Epidemic tremor) ในลูกไก่อายุ 1-3 สัปดาห์ แสดงอาการทางคลินิกเด่นชัดคือข้อใด?",
    choices: [
      "อาการสั่นกระตุกอย่างรวดเร็วของหัวและคอ (Head tremor) เดินเซ และอัมพาต",
      "ข้อบวมโตและเอ็นร้อยหวายฉีกขาด",
      "หายใจมีเสียงดังหวีดและไอสะบัดเลือด",
      "การเกิดตุ่มหนองบนหงอน"
    ],
    answer: "อาการสั่นกระตุกอย่างรวดเร็วของหัวและคอ (Head tremor) เดินเซ และอัมพาต",
    explanation: "AEV (Tremovirus ในตระกูล Picornaviridae) ทำลายเซลล์ประสาทในสมองและไขสันหลัง ลูกไก่อายุต่ำกว่า 3 สัปดาห์จะเดินเซ ขาอ่อนแรง ล้มลงนอน และมีอาการสั่นรัวของหัวและคอ (Epidemic tremor) ส่วนในไก่ไข่มักพบแค่ผลผลิตไข่ลดลงชั่วคราว"
  },

  // ── CHAPTER 14: Arteriviridae, Circoviridae & Other viruses 1 ──
  {
    id: "ch14_q1",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "PRRSV Target Cells",
    virusType: "default",
    q: "Porcine Reproductive and Respiratory Syndrome Virus (PRRSV ตระกูล Arteriviridae) มีเซลล์เป้าหมายหลักในการเพิ่มจำนวนคือเซลล์ชนิดใด?",
    choices: [
      "Porcine Alveolar Macrophages (PAMs) ในปอดและต่อมน้ำเหลือง",
      "เซลล์เยื่อบุผิวลำไส้เล็ก",
      "เซลล์กล้ามเนื้อหัวใจ",
      "เซลล์เม็ดเลือดแดง"
    ],
    answer: "Porcine Alveolar Macrophages (PAMs) ในปอดและต่อมน้ำเหลือง",
    explanation: "PRRSV เข้าติดเชื้อผ่านตัวรับ CD163 และ CD169 บนผิวเซลล์ Macrophages โดยเฉพาะอย่างยิ่ง Porcine Alveolar Macrophages (PAMs) ทำให้เซลล์ภูมิคุ้มกันปอดถูกทำลายและเกิด Interstitial pneumonia"
  },
  {
    id: "ch14_q2",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "PRRS Clinical Manifestations",
    virusType: "default",
    q: "กลุ่มอาการ 2 ด้านที่เด่นชัดที่สุดของโรค PRRS ในฟาร์มสุกรคือข้อใด?",
    choices: [
      "ปัญหาการสืบพันธุ์ในแม่สุกร (แท้งระยะท้าย, มัมมี่, ลูกคลอดตาย) และปัญหาระบบทางเดินหายใจในสุกรอนุบาล/ขุน (หอบ, แคระแกร็น)",
      "ปัญหาตุ่มน้ำใสที่กีบเท้า และปัญหาตาบอด",
      "ปัญหาไตวายเฉียบพลัน และปัญหากล้ามเนื้อลีบ",
      "ปัญหาขนร่วง และปัญหาฟันผุ"
    ],
    answer: "ปัญหาการสืบพันธุ์ในแม่สุกร (แท้งระยะท้าย, มัมมี่, ลูกคลอดตาย) และปัญหาระบบทางเดินหายใจในสุกรอนุบาล/ขุน (หอบ, แคระแกร็น)",
    explanation: "PRRS หรือโรคหูม่วง แสดงออก 2 ระบบหลัก: ระบบสืบพันธุ์ในแม่สุกร (Late-term abortion, Mummified fetuses, Weak-born piglets) และระบบทางเดินหายใจในสุกรเด็กและสุกรขุน (Respiratory disease, Thumping, Secondary bacterial infection)"
  },
  {
    id: "ch14_q3",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "Equine Arteritis Virus (EAV)",
    virusType: "default",
    q: "Equine Arteritis Virus (EAV) ในม้า มีการแพร่พันธุ์และคงอยู่ในฝูงได้อย่างไรในระยะยาว?",
    choices: [
      "ม้าเพศผู้ที่เป็นพาหะไม่แสดงอาการ (Stallion carrier) ขับเชื้อออกมาทางน้ำเชื้อตลอดชีวิตและแพร่ผ่านการผสมพันธุ์",
      "เชื้อแฝงตัวอยู่ในดินได้นาน 50 ปี",
      "แพร่ผ่านทางนกพิราบที่บินมาเกาะคอกม้า",
      "ม้าทุกตัวที่ติดเชื้อจะตายหมดจึงไม่มีการแพร่ระยะยาว"
    ],
    answer: "ม้าเพศผู้ที่เป็นพาหะไม่แสดงอาการ (Stallion carrier) ขับเชื้อออกมาทางน้ำเชื้อตลอดชีวิตและแพร่ผ่านการผสมพันธุ์",
    explanation: "พ่อม้าที่ฟื้นจากโรคสามารถกลายเป็น Carrier ที่ขับเชื้อในน้ำเชื้ออย่างต่อเนื่อง (Testosterone-dependent persistence ใน Ampullae) และส่งผ่านเชื้อสู่แม่ม้าขณะผสมพันธุ์ ทำให้แม่ม้าแท้งลูกได้"
  },
  {
    id: "ch14_q4",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "Porcine Circovirus-2 (PCV2)",
    virusType: "default",
    q: "Porcine Circovirus type 2 (PCV2) จัดเป็นไวรัสชนิดใด และสัมพันธ์กับกลุ่มอาการ PMWS ในสุกรอย่างไร?",
    choices: [
      "ssDNA ทรงกลมขนาดเล็กมาก ก่อโรค Postweaning Multisystemic Wasting Syndrome (สุกรหย่านมผอมโทรม ขนหยาบ ต่อมน้ำเหลืองโตทั่วตัว)",
      "dsRNA ก่อโรคตับอักเสบในสุกรโต",
      "Enveloped virus ก่อโรคท้องเสียถ่ายเป็นเลือด",
      "ไวรัสขนาดใหญ่ที่สุดในสุกรที่ก่อตุ่มหนอง"
    ],
    answer: "ssDNA ทรงกลมขนาดเล็กมาก ก่อโรค Postweaning Multisystemic Wasting Syndrome (สุกรหย่านมผอมโทรม ขนหยาบ ต่อมน้ำเหลืองโตทั่วตัว)",
    explanation: "PCV2 เป็นไวรัส ssDNA วงกลมขนาดเล็กมาก (17 nm) ไม่มียูนิตเปลือกหุ้ม ก่อกลุ่มอาการ PCVD/PCVAD โดยเฉพาะ PMWS ในสุกรหลังหย่านม (อายุ 6-12 สัปดาห์) สุกรจะผอมแห้ง โตช้า ซีด หายใจลำบาก และต่อมน้ำเหลือง Superficial inguinal ขยายใหญ่มาก"
  },
  {
    id: "ch14_q5",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "PCV2 Histopathology",
    virusType: "default",
    q: "ลักษณะทางจุลพยาธิวิทยาที่เป็น Pathognomonic lesion ของโรค PCV2 ในเนื้อเยื่อน้ำเหลืองคือข้อใด?",
    choices: [
      "Lymphoid depletion และพบ Botryoid (Grape-like) Basophilic/Amphophilic Intracytoplasmic Inclusion bodies ใน Macrophages",
      "Intranuclear inclusion bodies ขนาดใหญ่ในเซลล์ตับ",
      "การสะสมของไขมันในเซลล์เม็ดเลือดแดง",
      "การเกิดเม็ดเลือดขาวแตกกระจายในหลอดเลือดหัวใจ"
    ],
    answer: "Lymphoid depletion และพบ Botryoid (Grape-like) Basophilic/Amphophilic Intracytoplasmic Inclusion bodies ใน Macrophages",
    explanation: "PCV2 ทำลายเนื้อเยื่อน้ำเหลืองจนเซลล์ Lymphocytes หายไป (Lymphoid depletion) และพบก้อน Inclusion bodies รวมกลุ่มเป็นพวงคล้ายพวงองุ่น (Botryoid inclusions) ย้อมติดสีม่วงในไซโทพลาสซึมของ Histiocytes/Macrophages"
  },
  {
    id: "ch14_q6",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "PDNS Syndrome",
    virusType: "default",
    q: "Porcine Dermatitis and Nephropathy Syndrome (PDNS) ในสุกร ซึ่งสัมพันธ์กับการติดเชื้อ PCV2 เกิดจากกลไกทางพยาธิสภาพแบบใด?",
    choices: [
      "Type III Hypersensitivity (Immune complex-mediated systemic necrotizing vasculitis and glomerulonephritis)",
      "Type I Hypersensitivity จากการแพ้อาหารเฉียบพลัน",
      "การติดเชื้อแบคทีเรียแทรกซ้อนที่ผิวหนังชั้นตื้น",
      "การขาดวิตามิน A และแคลเซียมอย่างรุนแรง"
    ],
    answer: "Type III Hypersensitivity (Immune complex-mediated systemic necrotizing vasculitis and glomerulonephritis)",
    explanation: "PDNS เกิดจาก Immune complex (Antigen-Antibody) ตกตะกอนที่ผนังหลอดเลือดและโกลเมอรูลัสของไต ทำให้เกิด Necrotizing vasculitis ผิวหนังมีรอยโรคปื้นแดงอมม่วงตรงกลางเป็นเนื้อตาย และไตบวมโตมีจุดเลือดออก (Glomerulonephritis)"
  },
  {
    id: "ch14_q7",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "Beak and Feather Disease (BFDV)",
    virusType: "default",
    q: "Psittacine Beak and Feather Disease (BFDV ตระกูล Circoviridae) ในนกปากขอ (นกแก้ว คอกคาเทล มาคอว์) แสดงอาการเด่นชัดคือข้อใด?",
    choices: [
      "ขนร่วงผิดรูป ขนใหม่งอกหงิกงอ จะงอยปากเปราะแตกหักผิดรูป และภูมิคุ้มกันบกพร่องรุนแรง",
      "ตาบอดและปีกหักง่าย",
      "เสียงร้องแหบแห้งและมีไข้สูง",
      "ขากรรไกรบวมโตและมีฟันงอกออกมา"
    ],
    answer: "ขนร่วงผิดรูป ขนใหม่งอกหงิกงอ จะงอยปากเปราะแตกหักผิดรูป และภูมิคุ้มกันบกพร่องรุนแรง",
    explanation: "BFDV เข้าทำลายเซลล์แบ่งตัวเร็วในรูขุมขนและเนื้อเยื่อสร้างจะงอยปาก ทำให้ขนใหม่งอกผิดปกติ ขนร่วงเป็นหย่อม ก้านขนคอดกิ่ว จะงอยปากยาวผิดรูป เปราะแตกหักง่าย และทำลาย Bursa/Thymus จนเกิดภูมิคุ้มกันตก"
  },
  {
    id: "ch14_q8",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "Chicken Anemia Virus (CAV)",
    virusType: "default",
    q: "Chicken Anemia Virus (CAV ตระกูล Anelloviridae/Gyrovirus) ก่อให้เกิดโรคในลูกไก่ มีลักษณะเด่นคือข้อใด?",
    choices: [
      "ไขกระดูกฝ่อลีบสีซีดขาว (Aplastic anemia) เม็ดเลือดต่ำ ภูมิคุ้มกันบกพร่องจาก Thymus atrophy และมีเลือดออกใต้ผิวหนัง (Blue wing disease)",
      "ตับแข็งและมีน้ำในช่องท้อง",
      "อาการคอบิดหมุนรอบตัว",
      "การเกิดตุ่มหูดที่โคนขา"
    ],
    answer: "ไขกระดูกฝ่อลีบสีซีดขาว (Aplastic anemia) เม็ดเลือดต่ำ ภูมิคุ้มกันบกพร่องจาก Thymus atrophy และมีเลือดออกใต้ผิวหนัง (Blue wing disease)",
    explanation: "CAV ทำลายเซลล์ต้นกำเนิดเม็ดเลือดในไขกระดูกและต่อมไทมัส ทำให้ไขกระดูกกลายเป็นสีเหลืองซีด (Aplastic anemia), Hematocrit ต่ำมาก (< 20%), และมีรอยโรคเลือดออกตามผิวหนังปีกจนดูเป็นสีน้ำเงินคล้ำ เรียกว่า Blue wing disease"
  },
  {
    id: "ch14_q9",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "PRRSV Lineages in Thailand",
    virusType: "default",
    q: "PRRSV ในระดับสากลแบ่งออกเป็น 2 Species หลัก คือ PRRSV-1 และ PRRSV-2 การระบาดในประเทศไทยมีลักษณะอย่างไร?",
    choices: [
      "พบการระบาดร่วมกันของทั้ง PRRSV-1 (European genotype) และ PRRSV-2 (North American genotype) โดยเฉพาะสายพันธุ์ HP-PRRSV (สายพันธุ์รุนแรงสูง)",
      "พบเฉพาะ PRRSV-1 เท่านั้น ไม่เคยพบ PRRSV-2",
      "พบเฉพาะสายพันธุ์ออสเตรเลีย",
      "ประเทศไทยไม่มีโรค PRRS ระบาดเลย"
    ],
    answer: "พบการระบาดร่วมกันของทั้ง PRRSV-1 (European genotype) และ PRRSV-2 (North American genotype) โดยเฉพาะสายพันธุ์ HP-PRRSV (สายพันธุ์รุนแรงสูง)",
    explanation: "ประเทศไทยและเอเชียตะวันออกเฉียงใต้พบทั้งสองสปีชีส์ระบาดร่วมกัน โดย PRRSV-2 (North American) โดยเฉพาะ Highly Pathogenic PRRSV (HP-PRRSV ที่มี Deletion 30 กรดอะมิโนใน NSP2) มักก่อให้เกิดไข้สูงมาก ปอดอักเสบและอัตราการตายสูงในสุกรทุกกลุ่มอายุ"
  },
  {
    id: "ch14_q10",
    chapter: 14,
    chapterTitle: "Arteriviridae and Circoviridae",
    virusName: "PCV2 Vaccine Efficacy",
    virusType: "default",
    q: "การใช้วัคซีนป้องกันโรค PCV2 ในลูกสุกรมีผลสัมฤทธิ์ทางการผลิตอย่างไร?",
    choices: [
      "มีประสิทธิภาพสูงมากในการลดอัตราการตาย ลดสัดส่วนสุกรแคระแกร็น และเพิ่มอัตราการเจริญเติบโต (ADG) ได้อย่างชัดเจน",
      "ไม่ได้ผลเลยเนื่องจากไวรัสกลายพันธุ์ทุกสัปดาห์",
      "ทำให้สุกรเป็นหมันถาวร",
      "ใช้ป้องกันได้เฉพาะแม่พันธุ์เท่านั้น ห้ามฉีดในลูกสุกร"
    ],
    answer: "มีประสิทธิภาพสูงมากในการลดอัตราการตาย ลดสัดส่วนสุกรแคระแกร็น และเพิ่มอัตราการเจริญเติบโต (ADG) ได้อย่างชัดเจน",
    explanation: "วัคซีน PCV2 (Subunit Cap protein หรือ Inactivated vaccine) จัดเป็นหนึ่งในวัคซีนที่ประสบความสำเร็จสูงสุดในวงการสุกร สามารถลด Viremia, ป้องกันการเกิดรอยโรค PMWS และช่วยฟื้นฟูอัตราการเติบโตของฝูงได้อย่างคุ้มค่าทางเศรษฐกิจ"
  },

  // ── CHAPTER 15: Other viruses 2 and Prion ──
  {
    id: "ch15_q1",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "Prion Nature & Biology",
    virusType: "default",
    q: "พรีออน (Prion) ซึ่งเป็นสาเหตุของโรคสมองฝ่อรูพรุน (Transmissible Spongiform Encephalopathies - TSEs) มีองค์ประกอบทางชีววิทยาที่แตกต่างจากไวรัสและเชื้อโรคอื่นๆ อย่างสิ้นเชิงคือข้อใด?",
    choices: [
      "ไม่มีกรดนิวคลีอิก (ไม่มีทั้ง DNA และ RNA) ประกอบด้วยเฉพาะโปรตีนที่พับตัวผิดรูป (PrPSc) และทนทานต่อความร้อน รังสี และสารฆ่าเชื้อเกือบทุกชนิด",
      "เป็นไวรัสที่มีเปลือกหุ้มหนาพิเศษเป็นขี้ผึ้ง",
      "เป็นแบคทีเรียขนาดเล็กมากที่ไม่มีผนังเซลล์",
      "เป็นสารพันธุกรรมเปล่าที่ไม่มีโปรตีนหุ้ม (Viroid)"
    ],
    answer: "ไม่มีกรดนิวคลีอิก (ไม่มีทั้ง DNA และ RNA) ประกอบด้วยเฉพาะโปรตีนที่พับตัวผิดรูป (PrPSc) และทนทานต่อความร้อน รังสี และสารฆ่าเชื้อเกือบทุกชนิด",
    explanation: "Prion (Proteinaceous infectious particle) เกิดจากการเปลี่ยนโครงสร้างทุติยภูมิของโปรตีนปกติ PrPC (alpha-helix) ไปเป็น PrPSc (beta-sheet สูง) ไม่กระตุ้นภูมิคุ้มกัน และทนทานต่อ Autoclave ปกติ ฟอร์มาลิน รังสี UV และเอนไซม์ Protease K อย่างยิ่งยวด"
  },
  {
    id: "ch15_q2",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "Scrapie in Sheep",
    virusType: "default",
    q: "โรค Scrapie ในแกะและแพะ มีลักษณะอาการทางคลินิกเด่นชัดที่เป็นที่มาของชื่อโรคคือข้อใด?",
    choices: [
      "สัตว์มีอาการคันรุนแรงจนเอาตัวไปถูกับเสาหรือรั้วจนขนหลุดร่วง (Scrape), เดินเซ, สั่นเกร็ง, และมีพฤติกรรมก้าวร้าวหรือหวาดระแวง",
      "อาการท้องร่วงเป็นน้ำพุ่งเฉียบพลัน",
      "มีตุ่มน้ำใสที่กีบเท้าจนกีบหลุด",
      "ตาบอดและขากรรไกรบวมโต"
    ],
    answer: "สัตว์มีอาการคันรุนแรงจนเอาตัวไปถูกับเสาหรือรั้วจนขนหลุดร่วง (Scrape), เดินเซ, สั่นเกร็ง, และมีพฤติกรรมก้าวร้าวหรือหวาดระแวง",
    explanation: "คำว่า 'Scrapie' มาจากพฤติกรรมของแกะป่วยที่คันทรมานจนต้องเอาลำตัวถูกับรั้วหรือเสา (Scraping against fences) จนขนร่วงหลุด สัตว์จะมีอาการ Ataxia, กล้ามเนื้อสั่นกระตุก, ไวต่อสัมผัส และสมองเป็นรูพรุนคล้ายฟองน้ำ"
  },
  {
    id: "ch15_q3",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "Bovine Spongiform Encephalopathy (BSE)",
    virusType: "default",
    q: "โรควัวบ้า (Bovine Spongiform Encephalopathy - BSE) ระบาดรุนแรงในสหราชอาณาจักรช่วงทศวรรษ 1980-1990 เกิดจากการปฏิบัติทางการเกษตรแบบใด?",
    choices: [
      "การนำซากสัตว์เคี้ยวเอื้องที่ติดเชื้อ (เช่น แกะที่เป็น Scrapie) มาแปรรูปเป็นอาหารเสริมโปรตีนเนื้อและกระดูกป่น (Meat and Bone Meal - MBM) เลี้ยงโค",
      "การฉีดวัคซีนปนเปื้อนเชื้อไวรัส",
      "การนำเข้าโคจากทวีปอเมริกาใต้",
      "การใช้ยาปฏิชีวนะเกินขนาดในฟาร์มโคนม"
    ],
    answer: "การนำซากสัตว์เคี้ยวเอื้องที่ติดเชื้อ (เช่น แกะที่เป็น Scrapie) มาแปรรูปเป็นอาหารเสริมโปรตีนเนื้อและกระดูกป่น (Meat and Bone Meal - MBM) เลี้ยงโค",
    explanation: "การรีไซเคิลซากสัตว์โดยการนำเศษเนื้อและกระดูกป่น (MBM) ของแกะและโคมาผสมในอาหารเลี้ยงโค ทำให้โคกินโปรตีน PrPSc เข้าไป กระบวนการ Rendering ปกติไม่สามารถทำลายพรีออนได้ ก่อการระบาดครั้งใหญ่ของโรควัวบ้า"
  },
  {
    id: "ch15_q4",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "Variant CJD in Humans",
    virusType: "default",
    q: "โรควัวบ้า (BSE) มีความสำคัญสูงสุดต่อสาธารณสุขเนื่องจากสามารถติดต่อสู่คนผ่านการบริโภคเนื้อวัวปนเปื้อนเนื้อเยื่อประสาท ก่อให้เกิดโรคใดในคน?",
    choices: [
      "Variant Creutzfeldt-Jakob Disease (vCJD)",
      "Alzheimer's disease",
      "Parkinson's disease",
      "Kuru disease"
    ],
    answer: "Variant Creutzfeldt-Jakob Disease (vCJD)",
    explanation: "คนกินผลิตภัณฑ์เนื้อวัวที่ปนเปื้อนเนื้อเยื่อประสาท (SRM) ของวัวที่เป็น BSE จะเกิดโรค Variant CJD (vCJD) ซึ่งเป็นโรคสมองเสื่อมรวดเร็ว มีอาการทางจิตเวช กล้ามเนื้อกระตุก เดินเซ และเสียชีวิต 100% ในคนอายุน้อย"
  },
  {
    id: "ch15_q5",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "Specified Risk Materials (SRM)",
    virusType: "default",
    q: "มาตรการควบคุมและป้องกันโรควัวบ้า (BSE) ที่สำคัญที่สุดในโรงฆ่าสัตว์คือการตัดแยกและทำลาย 'Specified Risk Materials (SRM)' ซึ่งหมายถึงอวัยวะใด?",
    choices: [
      "สมอง, ไขสันหลัง, ดวงตา, ทอนซิล, และลำไส้ส่วนปลายของโค",
      "กล้ามเนื้อสันในและตับ",
      "ผิวหนังและกีบเท้า",
      "กระดูกซี่โครงและหัวใจ"
    ],
    answer: "สมอง, ไขสันหลัง, ดวงตา, ทอนซิล, และลำไส้ส่วนปลายของโค",
    explanation: "SRM คืออวัยวะที่มีการสะสมของ Prion ในปริมาณสูงสุด ได้แก่ สมอง (Brain), ไขสันหลัง (Spinal cord), กะโหลกศีรษะ, ดวงตา, ทอนซิล และ Ileum ของโค ต้องถูกคัดแยกออกและเผาทำลาย ห้ามนำเข้าสู่ห่วงโซ่อาหารคนหรือสัตว์เด็ดขาด"
  },
  {
    id: "ch15_q6",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "Chronic Wasting Disease (CWD)",
    virusType: "default",
    q: "Chronic Wasting Disease (CWD) เป็นโรคพรีออนที่พบระบาดในสัตว์ป่าตระกูลใด และมีลักษณะการแพร่กระจายที่น่ากังวลอย่างไร?",
    choices: [
      "พบในกวาง (Cervids: กวางมูส, กวางเอลก์, กวางไวท์เทล) และสามารถขับเชื้อพรีออนออกทางน้ำลาย มูล ปัสสาวะ ตกค้างในสิ่งแวดล้อมได้นานหลายปี",
      "พบเฉพาะในหมูป่าและติดต่อผ่านทางเลือดเท่านั้น",
      "พบเฉพาะในลิงชิมแปนซีและติดต่อผ่านการกัด",
      "พบในจระเข้และติดต่อผ่านน้ำเน่าเสีย"
    ],
    answer: "พบในกวาง (Cervids: กวางมูส, กวางเอลก์, กวางไวท์เทล) และสามารถขับเชื้อพรีออนออกทางน้ำลาย มูล ปัสสาวะ ตกค้างในสิ่งแวดล้อมได้นานหลายปี",
    explanation: "CWD ในกวางแพร่ระบาดได้ง่ายมากระหว่างกวางด้วยกันทางสิ่งแวดล้อม (ดิน พืช ดินโป่ง) เนื่องจากพรีออนถูกขับออกมากับน้ำลาย เลือด มูล และซากกวางตกค้างในดินทนทานได้นานหลายปี"
  },
  {
    id: "ch15_q7",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "Borna Disease Virus (BDV)",
    virusType: "default",
    q: "Borna Disease Virus (Bornaviridae) ก่อโรคในม้าและแกะ มีพยาธิสภาพเด่นในการทำให้เกิดโรคทางระบบประสาทและพฤติกรรมผิดปกติ เรียกว่า 'Sad horse disease' เนื่องจากอะไร?",
    choices: [
      "เชื้อติดเชื้อในระบบ Limbic system ของสมอง ทำให้สัตว์มีอาการซึมเศร้า เอาหัวดันผนัง (Head pressing) พฤติกรรมก้าวร้าวสลับซึมเซา และอัมพาต",
      "ม้าจะส่งเสียงร้องคร่ำครวญทั้งคืน",
      "ม้ามีน้ำตาไหลตลอดเวลาจนตาบอด",
      "ม้าจะเดินถอยหลังตลอดทั้งวัน"
    ],
    answer: "เชื้อติดเชื้อในระบบ Limbic system ของสมอง ทำให้สัตว์มีอาการซึมเศร้า เอาหัวดันผนัง (Head pressing) พฤติกรรมก้าวร้าวสลับซึมเซา และอัมพาต",
    explanation: "BDV เป็น Non-cytolytic neurotropic virus ชอบอาศัยใน Limbic system (Hippocampus, Cortex) ของสมอง ก่อ Non-suppurative meningoencephalitis ม้าจะซึม ยืนเอาหัวดันกำแพง (Head pressing) พฤติกรรมประหลาด และมี Joest-Degen inclusion bodies ในสมอง"
  },
  {
    id: "ch15_q8",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "Astroviridae Morphology",
    virusType: "default",
    q: "ไวรัสตระกูล Astroviridae ซึ่งก่อโรคท้องร่วงในลูกสัตว์และคน มีที่มาจากคำว่า 'Astron' (ดวงดาว) เนื่องจากโครงสร้างแคปซิดมีลักษณะอย่างไร?",
    choices: [
      "มีรอยนูนเด่นเป็นรูปดาว 5 หรือ 6 แฉก (Star-like surface) ใต้กล้องจุลทรรศน์อิเล็กตรอน",
      "มีแสงเรืองสว่างในความมืด",
      "เคลื่อนที่หมุนวนรอบตัวเองคล้ายวงโคจรดาวเคราะห์",
      "มีรูปทรงกระบอกยาวชี้ขึ้นฟ้า"
    ],
    answer: "มีรอยนูนเด่นเป็นรูปดาว 5 หรือ 6 แฉก (Star-like surface) ใต้กล้องจุลทรรศน์อิเล็กตรอน",
    explanation: "Astrovirus เป็น Naked (+)ssRNA ไวรัสขนาดเล็ก (28-30 nm) บนพื้นผิวแคปซิดมีลักษณะเฉพาะคือรูปดาว 5 หรือ 6 แฉก (Star-like morphology) เด่นชัดใต้กล้องจุลทรรศน์อิเล็กตรอน ก่อโรคทางเดินอาหารในลูกสัตว์"
  },
  {
    id: "ch15_q9",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "Prion Inactivation Protocol",
    virusType: "default",
    q: "การทำลายสภาพความเป็นพิษของพรีออน (Prion Decontamination) บนเครื่องมือแพทย์ผ่าตัด ต้องใช้วิธีการใดจึงจะมีประสิทธิภาพ?",
    choices: [
      "แช่ในสารละลาย 1N Sodium hydroxide (NaOH) หรือ Sodium hypochlorite เข้มข้น ร่วมกับการอบไอน้ำ Autoclave ที่อุณหภูมิ 134°C นานอย่างน้อย 18-60 นาที",
      "เช็ดด้วย 70% แอลกอฮอล์นาน 5 นาที",
      "ต้มในน้ำเดือด 100°C นาน 15 นาที",
      "นำไปตากแดดรังสี UV 1 วัน"
    ],
    answer: "แช่ในสารละลาย 1N Sodium hydroxide (NaOH) หรือ Sodium hypochlorite เข้มข้น ร่วมกับการอบไอน้ำ Autoclave ที่อุณหภูมิ 134°C นานอย่างน้อย 18-60 นาที",
    explanation: "พรีออนทนทานสูงมาก การ Autoclave ปกติ (121°C) ไม่สามารถทำลายได้ ต้องใช้โปรโตคอลรุนแรง: แช่ 1M NaOH หรือ Bleach ที่มีคลอรีนอิสระ 20,000 ppm ร่วมกับการ Autoclave แรงดันสูงที่ 134°C เป็นเวลานานกว่าปกติ"
  },
  {
    id: "ch15_q10",
    chapter: 15,
    chapterTitle: "Other viruses 2 and Prion",
    virusName: "Prion Histopathology",
    virusType: "default",
    q: "ลักษณะรอยโรคทางจุลพยาธิวิทยาของสมองสัตว์ที่ตายจากโรคกลุ่ม TSE (เช่น Scrapie, BSE) คือข้อใด?",
    choices: [
      "เนื้อเยื่อสมองเกิดช่องว่างกลวงเป็นรูพรุนคล้ายฟองน้ำ (Spongiform change / Vacuolation ใน Neurons และ Neuropil) โดยไม่มีการตอบสนองของเซลล์อักเสบ",
      "สมองมีหนองและมีเซลล์เม็ดเลือดขาว Neutrophil คั่งในหลอดเลือดจำนวนมาก",
      "การเกิดพังผืดแข็งหนาตัวทั่วผิวสมอง",
      "มีก้อนเลือดออกขนาดใหญ่ในเนื้อสมองส่วนหน้า"
    ],
    answer: "เนื้อเยื่อสมองเกิดช่องว่างกลวงเป็นรูพรุนคล้ายฟองน้ำ (Spongiform change / Vacuolation ใน Neurons และ Neuropil) โดยไม่มีการตอบสนองของเซลล์อักเสบ",
    explanation: "TSEs มีลักษณะเด่นคือการเกิด Vacuoles เป็นรูพรุนคล้ายฟองน้ำ (Spongiform degeneration) ในเซลล์ประสาทและ Neuropil ร่วมกับ Neuronal loss และ Astrogliosis โดยที่ไม่มีอาการอักเสบ (Non-inflammatory) เพราะโฮสต์ไม่สร้างภูมิคุ้มกันต่อต้าน PrPSc"
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

