"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Shield, Sword, Heart, ArrowLeft, Swords } from 'lucide-react';
import Link from 'next/link';
import { SVGVirus } from '@/components/ui/SVGVirus';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { awardDailyCappedExp, getDailyExpInfo, DailyExpInfo } from '@/lib/dailyExpCap';

// Thai Localized Data for Boss Battle
// Thai Localized Data for Boss Battle covering key curriculum chapters
const BOSSES = [
  {
    name: "Rabies Virus (Lyssavirus)",
    chapter: 10,
    chapterTitle: "Rhabdoviridae & Birnaviridae",
    maxHp: 100,
    virusType: 'rabies',
    glow: 'rgba(239, 68, 68, 0.6)',
    questions: [
      {
        q: "รูปร่างที่คลาสสิกที่สุดของไวรัสพิษสุนัขบ้า (Rabies) เมื่อดูผ่านกล้องจุลทรรศน์อิเล็กตรอนคืออะไร?",
        choices: ["รูปร่างยี่สิบหน้า (Icosahedral)", "รูปร่างคล้ายกระสุนปืน (Bullet-shaped)", "รูปร่างทรงกลม (Spherical)", "รูปร่างคล้ายเส้นด้าย (Filamentous)"],
        answer: "รูปร่างคล้ายกระสุนปืน (Bullet-shaped)",
        damage: 40
      },
      {
        q: "ข้อใดต่อไปนี้ ไม่ใช่ เส้นทางการแพร่กระจายโดยทั่วไปของโรคพิษสุนัขบ้า?",
        choices: ["โดนสัตว์ที่ติดเชื้อกัด", "สูดดมละอองฝอยในถ้ำค้างคาว", "โดนยุงกัด", "การปลูกถ่ายอวัยวะ (หายากมาก)"],
        answer: "โดนยุงกัด",
        damage: 30
      },
      {
        q: "Inclusion bodies ใดที่พบในเซลล์ประสาทและเป็นลักษณะเฉพาะเจาะจง (pathognomonic) ของโรคพิษสุนัขบ้า?",
        choices: ["Negri bodies", "Guarnieri bodies", "Cowdry Type A", "Bollinger bodies"],
        answer: "Negri bodies",
        damage: 30
      }
    ]
  },
  {
    name: "PEDV (Porcine Epidemic Diarrhea Virus)",
    chapter: 9,
    chapterTitle: "Coronaviridae",
    maxHp: 150,
    virusType: 'corona',
    glow: 'rgba(234, 179, 8, 0.6)',
    questions: [
      { q: "PEDV จัดอยู่ในกลุ่มไวรัสชนิดใด?", choices: ["Alphacoronavirus", "Betacoronavirus", "Gammacoronavirus", "Deltacoronavirus"], answer: "Alphacoronavirus", damage: 40 },
      { q: "อาการทางคลินิกที่เด่นชัดที่สุดของ PEDV ในลูกสุกรแรกเกิดคืออะไร?", choices: ["ไอและหอบรุนแรง", "ท้องเสียเป็นน้ำรุนแรงและอาเจียน", "มีตุ่มน้ำใสตามผิวหนัง", "แท้งลูกในช่วงท้ายของการตั้งท้อง"], answer: "ท้องเสียเป็นน้ำรุนแรงและอาเจียน", damage: 40 },
      { q: "การจัดการใดมีประสิทธิภาพสูงสุดในการหยุดการระบาดของ PEDV ในระยะสั้น?", choices: ["การทำ Feedback ให้แม่สุกร", "การฉีดยาปฏิชีวนะให้ลูกสุกร", "การให้วิตามินซีผสมน้ำ", "การเพิ่มอุณหภูมิในโรงเรือน"], answer: "การทำ Feedback ให้แม่สุกร", damage: 40 },
      { q: "เซลล์เป้าหมายหลักของเชื้อ PEDV ในร่างกายสุกรคือเซลล์ใด?", choices: ["Macrophage ในปอด", "Enterocyte ในลำไส้เล็ก", "Neuron ในสมอง", "Hepatocyte ในตับ"], answer: "Enterocyte ในลำไส้เล็ก", damage: 30 }
    ]
  },
  {
    name: "FMD (Foot and Mouth Disease Virus)",
    chapter: 13,
    chapterTitle: "Picornaviridae & Caliciviridae",
    maxHp: 200,
    virusType: 'picorna',
    glow: 'rgba(168, 85, 247, 0.6)',
    questions: [
      { q: "FMD จัดอยู่ในแฟมิลี (Family) ใด?", choices: ["Picornaviridae", "Flaviviridae", "Coronaviridae", "Paramyxoviridae"], answer: "Picornaviridae", damage: 40 },
      { q: "รอยโรคเฉพาะของโรค FMD ที่พบในโคคืออะไร?", choices: ["จุดเลือดออกที่ไต (Turkey egg kidney)", "ตุ่มน้ำใส (Vesicle) ที่ริมฝีปากและไรกีบ", "ต่อมน้ำเหลืองโตทั่วร่างกาย", "เยื่อบุตาอักเสบรุนแรง"], answer: "ตุ่มน้ำใส (Vesicle) ที่ริมฝีปากและไรกีบ", damage: 40 },
      { q: "สัตว์ชนิดใดสามารถเป็นพาหะอมโรค (Carrier) ของเชื้อ FMD ได้นานที่สุด?", choices: ["สุกร", "โค", "ควาย", "ม้า"], answer: "ควาย", damage: 40 },
      { q: "การเก็บตัวอย่างเพื่อส่งตรวจ FMD ที่ดีที่สุดคือข้อใด?", choices: ["เลือดครบส่วน", "ผนังของตุ่มน้ำใส (Epithelium) ที่เพิ่งแตก", "อุจจาระ", "น้ำเชื้อ"], answer: "ผนังของตุ่มน้ำใส (Epithelium) ที่เพิ่งแตก", damage: 40 },
      { q: "FMD Serotype ใดที่ ไม่พบ การระบาดในประเทศไทย?", choices: ["O", "A", "Asia 1", "SAT 1"], answer: "SAT 1", damage: 40 }
    ]
  },
  {
    name: "ASFV (African Swine Fever Virus)",
    chapter: 5,
    chapterTitle: "Poxviridae & Asfarviridae",
    maxHp: 200,
    virusType: 'asfar',
    glow: 'rgba(239, 68, 68, 0.8)',
    questions: [
      { q: "เชื้อ African Swine Fever Virus (ASFV) จัดเป็นไวรัสชนิดใด?", choices: ["Large enveloped dsDNA virus (Arbovirus)", "Small naked ssRNA virus", "Retrovirus", "Circular ssDNA virus"], answer: "Large enveloped dsDNA virus (Arbovirus)", damage: 50 },
      { q: "พาหะนำโรคทางชีวภาพ (Biological vector) ในธรรมชาติของเชื้อ ASFV คืออะไร?", choices: ["เห็บอ่อน (Ornithodoros soft tick)", "ยุงรำคาญ (Culex)", "หมัดสุนัข (Ctenocephalides)", "ไรไก่ (Dermanyssus)"], answer: "เห็บอ่อน (Ornithodoros soft tick)", damage: 50 },
      { q: "รอยโรคเด่นที่พบในทางพยาธิสภาพของสุกรที่ป่วยเป็น ASF เฉียบพลันคืออะไร?", choices: ["ม้ามโตสีดำคล้ำขนาดใหญ่ (Splenomegaly) และจุดเลือดออกที่ไต", "ตับแข็งเป็นก้อน", "เยื่อหุ้มสมองหนาตัว", "ลำไส้บิดเป็นเกลียว"], answer: "ม้ามโตสีดำคล้ำขนาดใหญ่ (Splenomegaly) และจุดเลือดออกที่ไต", damage: 50 },
      { q: "วัคซีน ASF ในปัจจุบันมีสถานะการใช้งานอย่างไรในฟาร์มทั่วไป?", choices: ["ยังไม่มีวัคซีนมาตรฐานที่ปลอดภัยและได้รับการรับรองทั่วโลก", "มีวัคซีนเชื้อตายฉีดได้ทุกฟาร์ม", "มีวัคซีนหยอดจมูกฟรีจากรัฐ", "ใช้วัคซีนรวมกับ PRRS ได้"], answer: "ยังไม่มีวัคซีนมาตรฐานที่ปลอดภัยและได้รับการรับรองทั่วโลก", damage: 50 }
    ]
  },
  {
    name: "CDV (Canine Distemper Virus)",
    chapter: 7,
    chapterTitle: "Paramyxoviridae",
    maxHp: 200,
    virusType: 'paramyxo',
    glow: 'rgba(59, 130, 246, 0.8)',
    questions: [
      { q: "Canine Distemper Virus (CDV) จัดอยู่ในจีนัส (Genus) ใด?", choices: ["Morbillivirus", "Lyssavirus", "Pestivirus", "Enterovirus"], answer: "Morbillivirus", damage: 50 },
      { q: "รอยโรคทางผิวหนังอันเป็นเอกลักษณ์ของโรคไข้หัดสุนัขเรื้อรังคืออะไร?", choices: ["Hyperkeratosis บริเวณฝ่าเท้าและจมูก (Hard pad)", "ตุ่มหนองรอบสะดือ", "ขนร่วงเป็นวงกลม", "แผลหลุมที่ลิ้น"], answer: "Hyperkeratosis บริเวณฝ่าเท้าและจมูก (Hard pad)", damage: 50 },
      { q: "อาการทางระบบประสาทที่จำเพาะอย่างยิ่งของโรคไข้หัดสุนัขคืออะไร?", choices: ["Myoclonus (กล้ามเนื้อกระตุกเป็นจังหวะ)", "ตาบอดข้างเดียวเฉียบพลัน", "เดินวนซ้ายตลอดเวลา", "คอบิดถาวร"], answer: "Myoclonus (กล้ามเนื้อกระตุกเป็นจังหวะ)", damage: 50 },
      { q: "ลักษณะ Inclusion bodies ของไวรัส CDV สามารถพบได้ที่ใดในเซลล์?", choices: ["พบได้ทั้งในนิวเคลียสและไซโทพลาสซึม (Both intranuclear & intracytoplasmic)", "เฉพาะในนิวเคลียสเท่านั้น", "เฉพาะในไซโทพลาสซึมเท่านั้น", "ไม่สร้าง Inclusion bodies"], answer: "พบได้ทั้งในนิวเคลียสและไซโทพลาสซึม (Both intranuclear & intracytoplasmic)", damage: 50 }
    ]
  },
  {
    name: "H5N1 Avian Influenza Virus (HPAI)",
    chapter: 8,
    chapterTitle: "Orthomyxoviridae",
    maxHp: 200,
    virusType: 'orthomyxo',
    glow: 'rgba(239, 68, 68, 0.9)',
    questions: [
      { q: "จีโนมของเชื้อไวรัสไข้หวัดใหญ่สัตว์ปีก (Avian Influenza) มีลักษณะสำคัญอย่างไร?", choices: ["ลบสายเดี่ยวแยกเป็น 8 ท่อน (-ssRNA 8 segments)", "บวกสายเดี่ยวท่อนเดียว (+ssRNA non-segmented)", "DNA สายคู่ทรงกลม (Circular dsDNA)", "RNA สายคู่ 10-12 ท่อน (dsRNA)"], answer: "ลบสายเดี่ยวแยกเป็น 8 ท่อน (-ssRNA 8 segments)", damage: 50 },
      { q: "ปรากฏการณ์ Antigenic Shift ที่ทำให้เกิดสายพันธุ์ระบาดใหญ่ (Pandemic) เกิดจากกลไกใด?", choices: ["Genetic Reassortment ระหว่างสองสายพันธุ์ในเซลล์เดียวกัน", "การกลายพันธุ์สะสมทีละเบสของยีน HA", "การติดเชื้อซ้ำซ้อนของแบคทีเรีย", "การตัดต่อยีนด้วยสัตวแพทย์"], answer: "Genetic Reassortment ระหว่างสองสายพันธุ์ในเซลล์เดียวกัน", damage: 50 },
      { q: "โปรตีนเปลือกนอกคู่ใดที่มีบทบาทสำคัญในการเกาะติด (Attachment) และการหลุดออกจากเซลล์ (Release)?", choices: ["Hemagglutinin (HA) และ Neuraminidase (NA)", "Spike (S) และ Envelope (E)", "Glycoprotein G และ Matrix M", "Fusion (F) และ Attachment (G)"], answer: "Hemagglutinin (HA) และ Neuraminidase (NA)", damage: 50 },
      { q: "รอยโรคเด่นชัดในสัตว์ปีกที่ติดเชื้อ HPAI สายพันธุ์รุนแรงคือข้อใด?", choices: ["หงอนและเหนียงบวมคล้ำ จุดเลือดออกที่แข้งและอวัยวะภายใน", "ตุ่มหูดแห้งที่หงอน", "ตาขุ่นขาวข้างเดียว", "ข้อเข่าหน้าบวมโต"], answer: "หงอนและเหนียงบวมคล้ำ จุดเลือดออกที่แข้งและอวัยวะภายใน", damage: 50 }
    ]
  },
  {
    name: "CPV-2 (Canine Parvovirus)",
    chapter: 3,
    chapterTitle: "Parvoviridae",
    maxHp: 200,
    virusType: 'parvo',
    glow: 'rgba(168, 85, 247, 0.8)',
    questions: [
      { q: "ลักษณะทางโครงสร้างของ Canine Parvovirus ข้อใดถูกต้อง?", choices: ["Naked icosahedral ssDNA ขนาดเล็ก ทนทานต่อสิ่งแวดล้อมสูง", "Enveloped ssRNA ขนาดใหญ่ ไวต่อน้ำยาฆ่าเชื้อ", "Circular dsDNA ขนาดใหญ่", "Enveloped dsRNA"], answer: "Naked icosahedral ssDNA ขนาดเล็ก ทนทานต่อสิ่งแวดล้อมสูง", damage: 50 },
      { q: "Canine Parvovirus ต้องการเซลล์เป้าหมายที่มีลักษณะเฉพาะแบบใดในการแบ่งตัว?", choices: ["เซลล์ที่มีการแบ่งตัวอย่างรวดเร็ว (Rapidly dividing cells เช่น Crypt & Bone marrow)", "เซลล์ประสาทที่ไม่แบ่งตัว", "เซลล์ไขมันใต้ผิวหนัง", "เซลล์กระดูกแข็ง"], answer: "เซลล์ที่มีการแบ่งตัวอย่างรวดเร็ว (Rapidly dividing cells เช่น Crypt & Bone marrow)", damage: 50 },
      { q: "การทำลายเซลล์ในหลุมเยื่อบุลำไส้ (Intestinal crypt cells) ส่งผลให้เกิดพยาธิสภาพใด?", choices: ["ลำไส้อักเสบถ่ายเป็นเลือดสด (Hemorrhagic enteritis) และ Villus collapse", "แผลหลุมเฉพาะในกระเพาะอาหาร", "ก้อนนิ่วอุดตันทางเดินอาหาร", "ลำไส้กลืนกันแบบเรื้อรัง"], answer: "ลำไส้อักเสบถ่ายเป็นเลือดสด (Hemorrhagic enteritis) และ Villus collapse", damage: 50 },
      { q: "น้ำยาฆ่าเชื้อใดที่สามารถทำลายไวรัส Parvovirus ที่ไม่มีเปลือกหุ้มได้อย่างมีประสิทธิภาพ?", choices: ["Sodium hypochlorite (น้ำยาฟอกขาว/Bleach เจือจาง 1:30)", "แอลกอฮอล์ 70% ธรรมดา", "น้ำสบู่และผงซักฟอกทั่วไป", "น้ำเกลือล้างแผล"], answer: "Sodium hypochlorite (น้ำยาฟอกขาว/Bleach เจือจาง 1:30)", damage: 50 }
    ]
  },
  {
    name: "PRRSV (Blue-Ear Pig Virus)",
    chapter: 14,
    chapterTitle: "Arteriviridae",
    maxHp: 200,
    virusType: 'arterivirus',
    glow: 'rgba(56, 189, 248, 0.8)',
    questions: [
      { q: "PRRSV จัดเป็นไวรัสชนิดใด?", choices: ["Enveloped positive-sense ssRNA (+ssRNA)", "Naked dsDNA", "Negative-sense ssRNA (-ssRNA)", "Double-stranded RNA (dsRNA)"], answer: "Enveloped positive-sense ssRNA (+ssRNA)", damage: 50 },
      { q: "เซลล์เป้าหมายหลักที่ PRRSV ชอบเข้าทำลายและแบ่งตัวในระบบหายใจสุกรคือเซลล์ใด?", choices: ["Porcine Alveolar Macrophages (PAMs)", "Ciliated epithelial cells", "Red blood cells (Erythrocytes)", "Neutrophils"], answer: "Porcine Alveolar Macrophages (PAMs)", damage: 50 },
      { q: "กลุ่มอาการเด่นชัดทางระบบสืบพันธุ์ที่เกิดจาก PRRSV ในเล้าแม่พันธุ์คืออะไร?", choices: ["การแท้งลูกระยะท้ายคลอด (Late-term abortion) และลูกหมูมัมมี่", "เป็นสัดเงียบถาวร", "คลอดลูกตัวใหญ่ผิดปกติ", "มดลูกอักเสบหลังคลอด 2 เดือน"], answer: "การแท้งลูกระยะท้ายคลอด (Late-term abortion) และลูกหมูมัมมี่", damage: 50 },
      { q: "กลยุทธ์การจัดการฝูงแม่สุกรเพื่อตัดวงจรและกำจัดเชื้อ PRRS ภายในฟาร์มคือข้อใด?", choices: ["การปิดฝูง (Herd closure) นานอย่างน้อย 200 วัน ร่วมกับ All-in All-out", "นำสุกรสาวจากตลาดภายนอกเข้ามาเติมทุกสัปดาห์", "ฉีดยาปฏิชีวนะให้แม่สุกรทุกตัวตลอดชีวิต", "งดให้น้ำสุกรในเวลากลางวัน"], answer: "การปิดฝูง (Herd closure) นานอย่างน้อย 200 วัน ร่วมกับ All-in All-out", damage: 50 }
    ]
  },
  {
    name: "BoHV-1 (Infectious Bovine Rhinotracheitis)",
    chapter: 4,
    chapterTitle: "Herpesviridae",
    maxHp: 200,
    virusType: 'herpes',
    glow: 'rgba(234, 88, 12, 0.8)',
    questions: [
      { q: "ไวรัสในตระกูล Herpesviridae มีคุณสมบัติเด่นเฉพาะตัวในข้อใดหลังจากการติดเชื้อระยะแรก?", choices: ["การแฝงตัวตลอดชีวิต (Latency) ในปมประสาทรับความรู้สึก", "การสลายตัวหายไปจากร่างกาย 100%", "การเปลี่ยนจีโนมเป็น RNA", "การไม่กระตุ้นแอนติบอดีใดๆ"], answer: "การแฝงตัวตลอดชีวิต (Latency) ในปมประสาทรับความรู้สึก", damage: 50 },
      { q: "รอยโรคเด่นชัดในระบบทางเดินหายใจของโคที่ติดเชื้อ BoHV-1 คืออะไร?", choices: ["เยื่อบุโพรงจมูกอักเสบแดงจัดเป็นเนื้อตาย (Red nose)", "ตุ่มน้ำใสที่กีบเท้า", "แผลหลุมรูปวงกลมที่เต้านม", "ปอดโป่งพองมีลมรั่ว"], answer: "เยื่อบุโพรงจมูกอักเสบแดงจัดเป็นเนื้อตาย (Red nose)", damage: 50 },
      { q: "ปมประสาท (Ganglion) ใดที่เป็นแหล่งแฝงตัวหลักของ BoHV-1 ในระบบประสาทของโค?", choices: ["Trigeminal ganglion", "Dorsal root ganglion ที่เอว", "Sympathetic chain ganglion", "Ciliary ganglion"], answer: "Trigeminal ganglion", damage: 50 },
      { q: "Inclusion bodies ของเชื้อไวรัสกลุ่ม Herpesvirus มักพบที่ตำแหน่งใดในเซลล์?", choices: ["Intranuclear inclusion bodies (Cowdry type A)", "Intracytoplasmic inclusion bodies", "ไม่พบ Inclusion bodies", "พบเฉพาะในถุงน้ำดี"], answer: "Intranuclear inclusion bodies (Cowdry type A)", damage: 50 }
    ]
  },
  {
    name: "FeLV / FIV Retroviral Complex",
    chapter: 6,
    chapterTitle: "Retroviridae",
    maxHp: 200,
    virusType: 'retro',
    glow: 'rgba(16, 185, 129, 0.8)',
    questions: [
      { q: "เอนไซม์จำเพาะที่ไวรัส Retrovirus ต้องใช้ในการเปลี่ยน RNA เป็น DNA คือเอนไซม์ใด?", choices: ["Reverse Transcriptase (RNA-dependent DNA polymerase)", "RNA Polymerase II", "DNA Ligase", "Topoisomerase"], answer: "Reverse Transcriptase (RNA-dependent DNA polymerase)", damage: 50 },
      { q: "เซลล์เป้าหมายหลักที่ถูกทำลายในแมวที่ติดเชื้อ Feline Immunodeficiency Virus (FIV) คืออะไร?", choices: ["CD4+ T lymphocytes", "B lymphocytes", "Erythrocytes", "Platelets"], answer: "CD4+ T lymphocytes", damage: 50 },
      { q: "การวินิจฉัยโรค FeLV ในคลินิกสัตว์เลี้ยงนิยมตรวจหาองค์ประกอบใดเป็นหลัก?", choices: ["FeLV p27 Capsid Antigen ในกระแสเลือด", "Antibody ต่อ FeLV", "เอนไซม์ย่อยไขมัน", "เกล็ดเลือด"], answer: "FeLV p27 Capsid Antigen ในกระแสเลือด", damage: 50 },
      { q: "การถ่ายทอดเชื้อ FeLV ในแมวมักเกิดขึ้นผ่านช่องทางใดที่สำคัญที่สุด?", choices: ["น้ำลายจากการเลียแต่งตัวให้กัน (Friendly grooming) และการกินชามข้าวร่วมกัน", "ละอองลอยในอากาศไกล 1 กิโลเมตร", "ยุงและแมลงดูดเลือด", "อาหารเม็ดสำเร็จรูป"], answer: "น้ำลายจากการเลียแต่งตัวให้กัน (Friendly grooming) และการกินชามข้าวร่วมกัน", damage: 50 }
    ]
  }
];


const PLAYER_MAX_HP = 100;

const shuffle = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

const formatBossQuestions = (bossQuestions: any[]) => {
  return shuffle(
    bossQuestions.map(q => ({
      ...q,
      choices: shuffle(q.choices || [])
    }))
  );
};

export default function BossBattle() {
  const { appUser } = useAuth();
  const [currentBossIndex, setCurrentBossIndex] = useState(0);
  const currentBoss = BOSSES[currentBossIndex];
  
  const [questions, setQuestions] = useState(() => formatBossQuestions(currentBoss.questions));
  const [bossHp, setBossHp] = useState(currentBoss.maxHp);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [currentQ, setCurrentQ] = useState(0);
  const [battleState, setBattleState] = useState<'idle' | 'attacking' | 'damaged' | 'victory' | 'defeat' | 'transitioning'>('idle');
  const [damageText, setDamageText] = useState<{value: number, type: 'boss' | 'player'} | null>(null);
  const [dailyInfo, setDailyInfo] = useState<DailyExpInfo | null>(null);
  const [totalAwardedExp, setTotalAwardedExp] = useState(0);
  const [lastBossAwardedExp, setLastBossAwardedExp] = useState<number | null>(null);


  useLiveTracking('boss-battle', `ด่าน: ${currentBossIndex + 1}/${BOSSES.length} | เลือดบอส: ${bossHp}/${currentBoss.maxHp} | เลือดผู้เล่น: ${playerHp}/${PLAYER_MAX_HP}`);
  
  React.useEffect(() => {
    if (appUser) {
      getDailyExpInfo(appUser.uid, 'boss-battle').then(setDailyInfo);
    }
  }, [appUser]);

  const question = questions[currentQ] || questions[questions.length - 1];

  const handleAnswer = async (choice: string) => {
    if (battleState !== 'idle') return;

    const isCorrect = choice === question.answer;

    if (isCorrect) {
      setBattleState('attacking');
      sfx.attack();
      setDamageText({ value: question.damage, type: 'boss' });
      
      setTimeout(async () => {
        const newBossHp = Math.max(0, bossHp - question.damage);
        setBossHp(newBossHp);
        setBattleState('idle');
        setDamageText(null);
        
        if (newBossHp <= 0) {
          const bossExp = 50; // 50 EXP per boss (Total 150 EXP for 3 bosses)
          
          // Award EXP for this defeated boss immediately
          if (appUser) {
            try {
              const res = await awardDailyCappedExp(
                appUser.uid,
                'boss-battle',
                `Boss Raid: ${currentBoss.name}`,
                bossExp,
                bossExp
              );
              setLastBossAwardedExp(res.awardedExp);
              setTotalAwardedExp(prev => prev + res.awardedExp);
              getDailyExpInfo(appUser.uid, 'boss-battle').then(setDailyInfo);
            } catch (e) {
              console.error('Failed to save EXP:', e);
            }
          }

          if (currentBossIndex < BOSSES.length - 1) {
            // Transition to next boss
            setBattleState('transitioning');
            sfx.correct();
            setTimeout(() => {
              const nextBoss = BOSSES[currentBossIndex + 1];
              setCurrentBossIndex(prev => prev + 1);
              setBossHp(nextBoss.maxHp);
              setQuestions(formatBossQuestions(nextBoss.questions));
              setCurrentQ(0);
              setBattleState('idle');
            }, 3000); // 3 seconds transition
          } else {
            // Final victory
            setTimeout(() => setBattleState('victory'), 500);
            sfx.correct();
          }
        } else {
          setCurrentQ(prev => prev + 1);
        }
      }, 1000);
    } else {
      setBattleState('damaged');
      sfx.damage();
      setDamageText({ value: 20, type: 'player' });
      
      setTimeout(() => {
        setPlayerHp(prev => Math.max(0, prev - 20));
        setBattleState('idle');
        setDamageText(null);
        
        if (playerHp - 20 <= 0) {
          setTimeout(() => setBattleState('defeat'), 500);
          sfx.wrong();
        }
      }, 1000);
    }
  };

  const HealthBar = ({ hp, maxHp, color, label, isRight = false }: any) => {
    const percentage = (hp / maxHp) * 100;
    return (
      <div className={`w-full max-w-[200px] ${isRight ? 'text-right' : 'text-left'}`}>
        <div className="flex justify-between text-xs md:text-sm font-bold mb-1 px-1 text-slate-300 tracking-wider">
          <span className="uppercase">{label}</span>
          <span className="font-mono">{hp}/{maxHp}</span>
        </div>
        <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700 relative">
          <motion.div 
            className={`absolute top-0 bottom-0 left-0 ${color}`}
            initial={{ width: '100%' }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    );
  };

  if (battleState === 'victory' || battleState === 'defeat' || battleState === 'transitioning') {
    const isVictory = battleState === 'victory';
    const isTransitioning = battleState === 'transitioning';
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-20 px-2">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }} 
          animate={{ scale: 1, rotate: 0 }} 
          className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-8 border ${isVictory ? 'bg-secondary/20 text-secondary border-secondary shadow-[0_0_30px_rgba(16,185,129,0.3)]' : isTransitioning ? 'bg-orange-500/20 text-orange-500 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)]' : 'bg-danger/20 text-danger border-danger shadow-[0_0_30px_rgba(239,68,68,0.3)]'}`}
        >
          {isVictory ? <Sword className="w-16 h-16" /> : isTransitioning ? <Shield className="w-16 h-16 animate-pulse" /> : <Heart className="w-16 h-16 line-through opacity-50" />}
        </motion.div>
        <h1 className={`text-4xl font-black uppercase ${isVictory ? 'text-glow-accent text-secondary' : isTransitioning ? 'text-glow text-orange-500 animate-pulse' : 'text-danger'}`}>
          {isVictory ? 'MISSION COMPLETED!' : isTransitioning ? 'WARNING: NEW THREAT DETECTED' : 'ภารกิจล้มเหลว...'}
        </h1>
        <p className="text-xl text-slate-400 font-mono">
          {isVictory 
            ? (totalAwardedExp > 0 
                ? `คุณได้กำจัดบอสสำเร็จ! ได้รับ EXP รวมรอบนี้ +${totalAwardedExp} EXP!` 
                : `คุณได้กำจัดบอสสำเร็จ! (โหมดฝึกซ้อม: สะสมครบโควตาประจำวันแล้ว)`)
            : isTransitioning 
            ? (lastBossAwardedExp !== null && lastBossAwardedExp > 0 
                ? `กำจัด ${BOSSES[currentBossIndex]?.name || 'บอส'} สำเร็จ (+${lastBossAwardedExp} EXP)! เตรียมรับมือบอสตัวถัดไป...`
                : `กำจัด ${BOSSES[currentBossIndex]?.name || 'บอส'} สำเร็จ (โหมดฝึกซ้อม)! เตรียมรับมือบอสตัวถัดไป...`)
            : 'ระบบภูมิคุ้มกันของคุณถูกทำลาย (สามารถกดลองใหม่ได้เสมอ)'}
        </p>
        {dailyInfo && isVictory && (
          <div className="inline-block px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-sm font-medium text-slate-300">
            โควตาบอสประจำวัน: <span className="font-bold text-amber-400">{dailyInfo.earnedToday}</span> / {dailyInfo.cap} EXP
          </div>
        )}
        {!isTransitioning && (
          <div className="flex justify-center gap-4 pt-8">
            <Button onClick={() => window.location.reload()} size="lg" className="font-bold uppercase tracking-widest">
              {isVictory ? 'เล่นอีกครั้ง' : 'พยายามใหม่'}
            </Button>
            <Link href="/student/play">
              <Button variant="secondary" size="lg" className="font-bold uppercase tracking-widest">กลับสู่ฐาน</Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 pt-4 px-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/student/play" onClick={() => sfx.click()}>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
          </Link>
          <div>
            <div className="font-bold text-danger text-glow flex items-center gap-2">
              <Swords className="w-5 h-5 animate-pulse" /> BOSS RAID: {currentBoss.name}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 font-mono">
                บอสตัวที่ {currentBossIndex + 1}/{BOSSES.length}
              </span>
              <select
                value={currentBossIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  const b = BOSSES[idx];
                  setCurrentBossIndex(idx);
                  setBossHp(b.maxHp);
                  setQuestions(formatBossQuestions(b.questions));
                  setCurrentQ(0);
                  setPlayerHp(PLAYER_MAX_HP);
                  setBattleState('idle');
                  setDamageText(null);
                }}
                className="bg-slate-900 border border-red-500/40 text-red-300 text-xs rounded-lg px-2 py-0.5 outline-none focus:border-red-400"
              >
                {BOSSES.map((b, i) => (
                  <option key={`${b.name}-${i}`} value={i} className="bg-slate-900 text-white">
                    บอสที่ {i + 1}: {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dailyInfo && (
            <div className={`text-xs px-2.5 py-1 rounded-full border ${dailyInfo.isCapped ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              โควตาวันนี้: {dailyInfo.earnedToday}/{dailyInfo.cap} EXP {dailyInfo.isCapped && '(ฝึกฝน)'}
            </div>
          )}
          <div className="font-black text-danger text-xl">Lvl MAX</div>
        </div>
      </div>

      {/* Battle Arena */}
      <Card className="p-4 md:p-8 glass-danger relative overflow-hidden h-[350px] flex items-center justify-between bg-black/60 border-danger/40">
        <div className="scanlines" />
        
        {/* Player Sprite */}
        <div className="flex flex-col items-center relative z-10 w-1/3">
          <HealthBar hp={playerHp} maxHp={PLAYER_MAX_HP} color="bg-secondary shadow-[0_0_10px_rgba(16,185,129,0.8)]" label="Player" />
          <motion.div 
            className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-secondary to-green-900 border-2 border-secondary rounded-xl mt-6 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]"
            animate={{ 
              x: battleState === 'attacking' ? [0, 80, 0] : 0,
              opacity: battleState === 'damaged' ? [1, 0, 1, 0, 1] : 1,
              scale: battleState === 'attacking' ? [1, 1.2, 1] : 1,
              filter: battleState === 'damaged' ? ['brightness(1)', 'brightness(3) drop-shadow(0 0 20px red)', 'brightness(1)'] : 'brightness(1)'
            }}
            transition={{ duration: 0.5 }}
          >
            <Shield className="w-10 h-10 md:w-12 md:h-12 text-white" />
          </motion.div>
          {damageText?.type === 'player' && (
            <motion.div 
              initial={{ opacity: 1, y: -20, scale: 1.5 }}
              animate={{ opacity: 0, y: -60 }}
              className="absolute font-black text-3xl text-danger mt-12 drop-shadow-md text-glow"
            >
              -{damageText.value}
            </motion.div>
          )}
        </div>

        <div className="text-3xl md:text-5xl font-black text-danger italic px-4 opacity-30 animate-pulse text-glow z-10">VS</div>

        {/* Boss Sprite */}
        <div className="flex flex-col items-center relative z-10 w-1/3">
          <HealthBar hp={bossHp} maxHp={currentBoss.maxHp} color="bg-danger shadow-[0_0_10px_rgba(239,68,68,0.8)]" label="Boss" isRight />
          <motion.div 
            className="mt-2 flex items-center justify-center"
            animate={{ 
              y: battleState === 'idle' ? [0, -10, 0] : 0,
              opacity: battleState === 'attacking' ? [1, 0, 1, 0, 1] : 1,
              scale: battleState === 'attacking' ? [1, 0.9, 1] : 1,
              filter: battleState === 'attacking' ? ['brightness(1)', 'brightness(3) drop-shadow(0 0 20px white)', 'brightness(1)'] : 'brightness(1)'
            }}
            transition={{ duration: battleState === 'idle' ? 3 : 0.5, repeat: battleState === 'idle' ? Infinity : 0, ease: "easeInOut" }}
          >
            {/* Call the new SVGVirus component here */}
            <SVGVirus type={currentBoss.virusType as any} className="w-28 h-28 md:w-36 md:h-36 text-danger" glowColor={currentBoss.glow} />
          </motion.div>
          
          <div className="text-danger font-mono text-xs md:text-sm tracking-widest uppercase mt-2 opacity-90 text-center font-bold">
            {currentBoss.name}
          </div>

          {damageText?.type === 'boss' && (
            <motion.div 
              initial={{ opacity: 1, y: -20, scale: 1.5 }}
              animate={{ opacity: 0, y: -60 }}
              className="absolute font-black text-3xl text-white mt-12 drop-shadow-md text-glow"
            >
              -{damageText.value}
            </motion.div>
          )}
        </div>
      </Card>

      {/* Question Panel */}
      <Card className="p-6 md:p-8 glass border-slate-800">
        {(currentBoss as any).chapterTitle && (
          <div className="mb-3">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-danger/20 text-red-300 border border-danger/40">
              บทที่ {(currentBoss as any).chapter}: {(currentBoss as any).chapterTitle}
            </span>
          </div>
        )}
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6 leading-relaxed">
          {question.q}
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {question.choices.map((choice) => (
            <Button
              key={choice}
              variant="ghost"
              className="border-2 border-slate-800 text-slate-300 hover:border-primary/50 hover:bg-primary/10 text-left justify-start py-4 h-auto whitespace-normal font-bold"
              onClick={() => {
                sfx.click();
                handleAnswer(choice);
              }}
              disabled={battleState !== 'idle'}
            >
              {choice}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
