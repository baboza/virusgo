"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Database, CheckCircle, AlertTriangle, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, setDoc, doc, query, where, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// === THE CORE 30 VETERINARY VIRUSES ===
const SEED_DATA = [
  // --- Companion Animals (Canine & Feline) ---
  {
    virusName: "Rabies Virus", family: "Rhabdoviridae", genus: "Lyssavirus", genome: "ssRNA (-)",
    host: ["สุนัข", "แมว", "โค", "มนุษย์", "สัตว์เลี้ยงลูกด้วยนมทุกชนิด"], transmission: ["น้ำลายผ่านรอยกัด", "บาดแผล"],
    pathogenesis: "เชื้อเดินทางตามเส้นประสาทส่วนปลาย (Peripheral nerves) ไปยังสมอง (CNS) ทำให้เกิดสมองอักเสบ",
    clinicalSigns: ["ดุร้าย", "พฤติกรรมเปลี่ยน", "น้ำลายไหลยืด", "กลืนลำบาก", "อัมพาต", "ตาย"],
    diagnosis: ["FA test (เนื้อเยื่อสมอง)", "Negri bodies (Histopathology)"],
    treatment: "ไม่มีวิธีรักษาในสัตว์", prevention: ["ฉีดวัคซีนป้องกันโรคพิษสุนัขบ้า"], vaccine: true,
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: ["OIE Terrestrial Manual", "Veterinary Microbiology"]
  },
  {
    virusName: "Canine Parvovirus (CPV-2)", family: "Parvoviridae", genus: "Protoparvovirus", genome: "ssDNA",
    host: ["สุนัข"], transmission: ["Fecal-oral", "Fomites"],
    pathogenesis: "เชื้อทำลายเซลล์ที่กำลังแบ่งตัวอย่างรวดเร็ว เช่น crypts ของลำไส้ และไขกระดูก",
    clinicalSigns: ["อาเจียนรุนแรง", "อุจจาระร่วงเป็นเลือดกลิ่นเหม็นคาว", "เม็ดเลือดขาวต่ำ (Leukopenia)"],
    diagnosis: ["SNAP test (ตรวจหา Antigen ในอุจจาระ)", "PCR"],
    treatment: "Supportive care (ให้สารน้ำ, ยาแก้อาเจียน, ยาปฏิชีวนะป้องกันโรคแทรกซ้อน)", prevention: ["ทำวัคซีนรวมสุนัข", "ฆ่าเชื้อด้วย Bleach"], vaccine: true,
    image: "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: ["Greene's Infectious Diseases of the Dog and Cat"]
  },
  {
    virusName: "Canine Distemper Virus (CDV)", family: "Paramyxoviridae", genus: "Morbillivirus", genome: "ssRNA (-)",
    host: ["สุนัข", "สัตว์ป่า (เฟอเรท, แรคคูน)"], transmission: ["ละอองฝอยทางเดินหายใจ (Aerosol)"],
    pathogenesis: "ติดเชื้อที่เนื้อเยื่อน้ำเหลือง ทางเดินหายใจ ทางเดินอาหาร และระบบประสาทส่วนกลาง",
    clinicalSigns: ["ขี้ตาและน้ำมูกข้นเขียว", "ไอ", "ท้องเสีย", "ชัก (Chewing gum fit)", "ฝ่าเท้าหนาตัว (Hard pad disease)"],
    diagnosis: ["PCR", "Immunofluorescence (ตรวจพบ inclusion bodies)"],
    treatment: "Supportive care", prevention: ["วัคซีนรวมสุนัข"], vaccine: true,
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Feline Leukemia Virus (FeLV)", family: "Retroviridae", genus: "Gammaretrovirus", genome: "ssRNA (+)",
    host: ["แมว"], transmission: ["น้ำลาย (เลีย, กัด)", "จากแม่สู่ลูก"],
    pathogenesis: "ไวรัสแทรกสารพันธุกรรมเข้าสู่เซลล์ไขกระดูก ทำให้ภูมิคุ้มกันบกพร่องและเกิดเนื้องอก (Lymphoma)",
    clinicalSigns: ["ซีด", "อ่อนเพลีย", "ติดเชื้อแทรกซ้อนง่าย", "ต่อมน้ำเหลืองโต", "มะเร็งเม็ดเลือดขาว"],
    diagnosis: ["SNAP test (ตรวจหา p27 Antigen)", "PCR"],
    treatment: "รักษาตามอาการ, ยาต้านไวรัส (Zidovudine - ช่วยยืดอายุ)", prevention: ["ทำวัคซีน FeLV", "เลี้ยงระบบปิด"], vaccine: true,
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Feline Immunodeficiency Virus (FIV)", family: "Retroviridae", genus: "Lentivirus", genome: "ssRNA (+)",
    host: ["แมว"], transmission: ["กัดกัน (พบมากในแมวตัวผู้ปล่อยนอกบ้าน)"],
    pathogenesis: "ทำลายเซลล์ CD4+ T-lymphocytes คล้าย HIV ในคน",
    clinicalSigns: ["เหงือกและช่องปากอักเสบเรื้อรัง (Stomatitis)", "ภูมิคุ้มกันตก", "น้ำหนักลด"],
    diagnosis: ["SNAP test (ตรวจหา Antibody)"],
    treatment: "รักษาตามอาการและโรคแทรกซ้อน", prevention: ["เลี้ยงระบบปิด", "ทำหมันลดการต่อสู้"], vaccine: false,
    image: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Feline Infectious Peritonitis Virus (FIPV)", family: "Coronaviridae", genus: "Alphacoronavirus", genome: "ssRNA (+)",
    host: ["แมว"], transmission: ["Fecal-oral (จาก FCoV ปกติ แล้วกลายพันธุ์ในตัวแมว)"],
    pathogenesis: "FCoV กลายพันธุ์ในลำไส้ สามารถเข้าไปอยู่ใน Macrophage ได้ ทำให้เกิดการอักเสบของหลอดเลือด (Vasculitis)",
    clinicalSigns: ["แบบเปียก (Effusive): มีน้ำในช่องอก/ช่องท้อง ท้องป่อง", "แบบแห้ง (Non-effusive): แกรนูโลมาตามอวัยวะตา/สมอง", "ไข้ไม่ลด"],
    diagnosis: ["เจาะน้ำในช่องท้องตรวจ (สีเหลืองอำพัน, โปรตีนสูง, Rivalta test +)", "PCR", "IHC"],
    treatment: "GS-441524 (ยาต้านไวรัส)", prevention: ["ลดความเครียดในฝูง", "ทำความสะอาดกระบะทราย"], vaccine: false,
    image: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Feline Panleukopenia Virus (FPV)", family: "Parvoviridae", genus: "Protoparvovirus", genome: "ssDNA",
    host: ["แมว"], transmission: ["Fecal-oral", "Fomites"],
    pathogenesis: "โจมตีเซลล์ที่แบ่งตัวเร็ว ลำไส้ ไขกระดูก ทำให้เม็ดเลือดขาวต่ำอย่างรุนแรง",
    clinicalSigns: ["ไข้สูง", "อาเจียน", "ท้องเสียรุนแรง", "ซึม", "หากติดเชื้อในลูกแมวตั้งครรภ์ สมองน้อยลูกจะฝ่อ (Cerebellar hypoplasia)"],
    diagnosis: ["SNAP test Parvo (สามารถใช้ชุดของสุนัขตรวจได้)"],
    treatment: "Supportive care", prevention: ["วัคซีนรวมแมว (ไข้หัดแมว)"], vaccine: true,
    image: "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Canine Adenovirus type 1 (CAV-1)", family: "Adenoviridae", genus: "Mastadenovirus", genome: "dsDNA",
    host: ["สุนัข"], transmission: ["Oronasal (ปัสสาวะ, น้ำลาย, อุจจาระ)"],
    pathogenesis: "ทำลายเซลล์ตับ (Hepatocytes) และเซลล์บุหลอดเลือด ทำให้ตับอักเสบติดต่อ",
    clinicalSigns: ["ไข้", "ซึม", "ดีซ่าน (Jaundice)", "กระจกตาขุ่น (Blue eye)"],
    diagnosis: ["PCR", "Viral isolation"],
    treatment: "Supportive care", prevention: ["วัคซีน CAV-2 (ช่วยป้องกัน CAV-1 ได้แบบข้ามสายพันธุ์และปลอดภัยกว่า)"], vaccine: true,
    image: "https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  // --- Swine (สุกร) ---
  {
    virusName: "Foot and Mouth Disease Virus (FMDV)", family: "Picornaviridae", genus: "Aphthovirus", genome: "ssRNA (+)",
    host: ["สุกร", "โค", "กระบือ", "แพะ", "แกะ (สัตว์กีบคู่)"], transmission: ["Aerosol", "Direct contact", "Fomites"],
    pathogenesis: "เพิ่มจำนวนในเซลล์เยื่อบุผิว ทำให้เกิดตุ่มน้ำพอง",
    clinicalSigns: ["ไข้สูง", "มีตุ่มน้ำใส (Vesicles) ที่จมูก ปาก กีบเท้า", "ขากะเผลก", "น้ำลายไหลยืด", "ลูกสุกรตายจากกล้ามเนื้อหัวใจอักเสบ (Tiger heart)"],
    diagnosis: ["ELISA", "RT-PCR (จากตัวอย่างน้ำในตุ่ม หรือ epithelium)"],
    treatment: "ห้ามรักษา (เป็นโรคระบาดร้ายแรง)", prevention: ["วัคซีน (ต้องตรงกับ Serotype O, A, Asia1)", "Biosecurity รัดกุม"], vaccine: true,
    image: "https://images.unsplash.com/photo-1605001004169-79ae3c407c5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Porcine Reproductive and Respiratory Syndrome Virus (PRRSV)", family: "Arteriviridae", genus: "Betaarterivirus", genome: "ssRNA (+)",
    host: ["สุกร"], transmission: ["Direct contact (จมูกต่อจมูก)", "น้ำเชื้อ", "Aerosol", "เข็มฉีดยาเข็มเดียวกัน"],
    pathogenesis: "ไวรัสทำลาย Macrophage ในถอด (PAMs) ทำให้ภูมิคุ้มกันปอดลดลง ติดเชื้อแทรกซ้อนง่าย",
    clinicalSigns: ["แม่สุกรแท้งช่วงท้าย (Late-term abortion)", "ลูกสุกรเกิดมาตาย หรืออ่อนแอ", "สุกรขุนหอบ ท้องร่วง", "หูสีม่วงคล้ำ (Blue ear disease)"],
    diagnosis: ["RT-PCR", "ELISA (ตรวจภูมิคุ้มกันของฝูง)"],
    treatment: "ควบคุมโรคแทรกซ้อน", prevention: ["ทำวัคซีน (MLV หรือ Killed)", "การจัดการ Acclimatization สุกรสาว"], vaccine: true,
    image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "African Swine Fever Virus (ASFV)", family: "Asfarviridae", genus: "Asfivirus", genome: "dsDNA",
    host: ["สุกร", "หมูป่า"], transmission: ["Direct contact", "กินเศษอาหารปนเปื้อนเนื้อสุกร (Swill feeding)", "เห็บอ่อน (Ornithodoros)"],
    pathogenesis: "ติดเชื้อใน Monocyte/Macrophage ทำลายระบบภูมิคุ้มกันและการแข็งตัวของเลือด เลือดออกทั่วอวัยวะภายใน",
    clinicalSigns: ["ไข้สูงมาก", "ผิวหนังแดงคล้ำ", "อาเจียน", "ถ่ายเป็นเลือด", "ตายเฉียบพลันเกือบ 100%", "ม้ามโตสีดำคล้ำ (Blackberry jam spleen)"],
    diagnosis: ["RT-PCR จากเลือด หรือม้าม"],
    treatment: "ห้ามรักษา ต้องทำลายทิ้งเท่านั้น", prevention: ["Biosecurity ขั้นสูงสุด", "งดใช้เศษอาหารเลี้ยงหมู"], vaccine: false,
    image: "https://images.unsplash.com/photo-1601242398433-87b649c09d78?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Classical Swine Fever Virus (CSFV)", family: "Flaviviridae", genus: "Pestivirus", genome: "ssRNA (+)",
    host: ["สุกร"], transmission: ["Direct contact", "Swill feeding"],
    pathogenesis: "คล้าย ASF ทำให้เกิดเลือดออกทั่วร่างกาย (Hemorrhagic fever)",
    clinicalSigns: ["ไข้", "ซึม", "จุดเลือดออกตามตัว (Petechiae)", "ไตมีจุดเลือดออกคล้ายไข่งวง (Turkey egg kidney)", "Button ulcers ที่ลำไส้ใหญ่"],
    diagnosis: ["RT-PCR", "IHC"],
    treatment: "ทำลายทิ้ง (Stamping out)", prevention: ["ทำวัคซีน (Live attenuated) ในพื้นที่ที่มีโรคประจำถิ่น"], vaccine: true,
    image: "https://images.unsplash.com/photo-1549479361-ec8587d1976f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Porcine Epidemic Diarrhea Virus (PEDV)", family: "Coronaviridae", genus: "Alphacoronavirus", genome: "ssRNA (+)",
    host: ["สุกร"], transmission: ["Fecal-oral"],
    pathogenesis: "ทำลาย Villi ของลำไส้เล็ก ทำให้ Villi หดสั้น ดูดซึมอาหารและน้ำไม่ได้",
    clinicalSigns: ["ท้องเสียเป็นน้ำพุ่ง (Watery diarrhea) ในทุกกลุ่มอายุ", "ลูกสุกรดูดนมอาเจียนและตายสูงถึง 100% ในช่วง 1 สัปดาห์แรก"],
    diagnosis: ["RT-PCR จากอุจจาระหรือลำไส้เล็ก"],
    treatment: "ให้น้ำเกลือ", prevention: ["Biosecurity (ระวังรถขนหมู)", "ทำ Feedback ให้แม่สุกรอุ้มท้อง (Lactogenic immunity)"], vaccine: true,
    image: "https://images.unsplash.com/photo-1549479361-ec8587d1976f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Porcine Circovirus type 2 (PCV2)", family: "Circoviridae", genus: "Circovirus", genome: "ssDNA",
    host: ["สุกร"], transmission: ["Direct contact", "Oronasal"],
    pathogenesis: "ทำลายระบบต่อมน้ำเหลือง (Lymphoid depletion) ทำให้ภูมิคุ้มกันตก",
    clinicalSigns: ["สุกรขุนผอมแห้ง ขนหยาบ (PMWS)", "ต่อมน้ำเหลืองโต", "โรคผิวหนังอักเสบและไตพัง (PDNS)"],
    diagnosis: ["PCR ร่วมกับรอยโรคทาง Histopathology"],
    treatment: "รักษาโรคแทรกซ้อน", prevention: ["ทำวัคซีน PCV2 (ได้ผลดีมาก นิยมทำในลูกสุกรหย่านม)"], vaccine: true,
    image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  // --- Avian (สัตว์ปีก) ---
  {
    virusName: "Newcastle Disease Virus (NDV)", family: "Paramyxoviridae", genus: "Avulavirus", genome: "ssRNA (-)",
    host: ["ไก่", "นก"], transmission: ["Aerosol", "Fecal-oral"],
    pathogenesis: "เชื้อติดเข้าทางเดินหายใจ กระจายไปอวัยวะภายในและระบบประสาท (ขึ้นอยู่กับสายพันธุ์ของไวรัส: Velogenic, Mesogenic, Lentogenic)",
    clinicalSigns: ["ไอ จาม", "ท้องเสียสีเขียว", "คอบิด (Torticollis)", "อัมพาต", "ตายกระทันหัน"],
    diagnosis: ["RT-PCR", "HA/HI test"],
    treatment: "ไม่มี", prevention: ["ทำวัคซีนไก่"], vaccine: true,
    image: "https://images.unsplash.com/photo-1548509925-0e783d6a45bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Avian Influenza Virus (AIV)", family: "Orthomyxoviridae", genus: "Alphainfluenzavirus", genome: "ssRNA (-) segmented",
    host: ["ไก่", "นกน้ำ", "นกอพยพ", "มนุษย์ (Zoonosis)"], transmission: ["Fecal-oral", "Aerosol"],
    pathogenesis: "สายพันธุ์รุนแรง (HPAI) ทำให้เกิดการคั่งเลือดและเนื้อตายทั่วร่างกาย",
    clinicalSigns: ["หงอนและเหนียงสีม่วงคล้ำ (Cyanosis)", "หน้าบวม", "จุดเลือดออกที่แข้ง", "ตายรวดเร็ว 100%"],
    diagnosis: ["RT-PCR", "Viral isolation"],
    treatment: "ห้ามรักษา ทำลายทิ้ง", prevention: ["เฝ้าระวังขั้นสูงสุด", "Biosecurity", "ห้ามเลี้ยงเป็ดปะปนกับไก่"], vaccine: false,
    image: "https://images.unsplash.com/photo-1550974059-3a6503c53ea8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Infectious Bronchitis Virus (IBV)", family: "Coronaviridae", genus: "Gammacoronavirus", genome: "ssRNA (+)",
    host: ["ไก่"], transmission: ["Aerosol"],
    pathogenesis: "ทำลายเยื่อบุหลอดลม ไต และท่อนำไข่",
    clinicalSigns: ["หายใจดัง", "ไข่รูปร่างผิดปกติ เปลือกไข่บาง/ย่น (Wrinkled eggs)", "ไตบวมน้ำมีกรดยูริกสะสม"],
    diagnosis: ["RT-PCR", "ELISA"],
    treatment: "ให้ความอบอุ่น", prevention: ["ทำวัคซีน IBV แบบหยอดตา/ละลายน้ำ"], vaccine: true,
    image: "https://images.unsplash.com/photo-1548509925-0e783d6a45bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Infectious Bursal Disease Virus (IBDV / Gumboro)", family: "Birnaviridae", genus: "Avibirnavirus", genome: "dsRNA segmented",
    host: ["ไก่"], transmission: ["Fecal-oral", "ทนทานในสิ่งแวดล้อมมาก"],
    pathogenesis: "ทำลาย B-lymphocytes ใน Bursa of Fabricius ทำให้ภูมิคุ้มกันบกพร่องถาวร",
    clinicalSigns: ["ไก่อายุ 3-6 สัปดาห์ซึม", "ท้องเสียสีขาว", "กล้ามเนื้ออก/ขา มีจุดเลือดออก", "Bursa บวมอักเสบในช่วงแรกและฝ่อในเวลาต่อมา"],
    diagnosis: ["ผ่าซากดูรอยโรคที่ Bursa", "RT-PCR"],
    treatment: "ไม่มี", prevention: ["ทำวัคซีนลูกไก่ (คำนวณวันทำวัคซีนตามระดับภูมิคุ้มกันแม่ MDA)"], vaccine: true,
    image: "https://images.unsplash.com/photo-1550974059-3a6503c53ea8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  // --- Ruminants (สัตว์เคี้ยวเอื้อง) ---
  {
    virusName: "Lumpy Skin Disease Virus (LSDV)", family: "Poxviridae", genus: "Capripoxvirus", genome: "dsDNA",
    host: ["โค", "กระบือ"], transmission: ["แมลงดูดเลือด (Vector-borne: แมลงวัน, ยุง, เห็บ)", "สัมผัสโดยตรง"],
    pathogenesis: "ไวรัสเจริญในเซลล์ผิวหนัง ทำให้เกิดก้อนตุ่มแข็งทั่วร่างกาย",
    clinicalSigns: ["ตุ่มนูนแข็ง (Nodules) ทั่วตัว", "ไข้สูง", "ต่อมน้ำเหลืองโต", "น้ำลายไหลขี้ตาเกรอะ", "ลดผลผลิตนม", "ตุ่มแตกเป็นแผลหลุม"],
    diagnosis: ["PCR จากเนื้อเยื่อตุ่ม", "ดูรอยโรค"],
    treatment: "รักษาตามอาการ (พ่นยาฆ่าแมลง/ยารักษาแผล)", prevention: ["ทำวัคซีน LSDV", "กำจัดแมลงพาหะ"], vaccine: true,
    image: "https://images.unsplash.com/photo-1546445317-29f4545e9d53?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Bovine Viral Diarrhea Virus (BVDV)", family: "Flaviviridae", genus: "Pestivirus", genome: "ssRNA (+)",
    host: ["โค"], transmission: ["Direct contact", "จากแม่สู่ลูก (Vertical)"],
    pathogenesis: "หากลูกโคติดเชื้อในช่วงตั้งท้อง 40-120 วันแรก จะกลายเป็นตัวรับเชื้อถาวร (PI - Persistently Infected)",
    clinicalSigns: ["แท้ง", "ท้องเสีย", "แผลในช่องปากและระบบทางเดินอาหาร (Mucosal disease) ในโคที่เป็น PI"],
    diagnosis: ["Ear notch test (หาโค PI ด้วย ELISA/IHC)", "RT-PCR"],
    treatment: "คัดทิ้งโคที่เป็น PI", prevention: ["กำจัดโค PI ออกจากฝูง", "กักโรคโคเข้าใหม่", "ทำวัคซีน"], vaccine: true,
    image: "https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Equine Infectious Anemia Virus (EIAV)", family: "Retroviridae", genus: "Lentivirus", genome: "ssRNA (+)",
    host: ["ม้า"], transmission: ["แมลงดูดเลือด (Horse flies, Deer flies)", "เข็มฉีดยาปนเปื้อน"],
    pathogenesis: "ติดเชื้อใน Macrophage ทำให้เกิดการทำลายเม็ดเลือดแดง (Hemolysis)",
    clinicalSigns: ["ไข้ขึ้นๆ ลงๆ", "ซีด (Anemia)", "น้ำหนักลด", "บวมน้ำที่ท้องและขา"],
    diagnosis: ["Coggins test (AGID)", "ELISA"],
    treatment: "ไม่มี", prevention: ["กักและตรวจเลือดม้าก่อนเข้าฝูง", "ควบคุมแมลง"], vaccine: false,
    image: "https://images.unsplash.com/photo-1553618551-fba689030290?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Feline Calicivirus (FCV)", family: "Caliciviridae", genus: "Vesivirus", genome: "ssRNA (+)",
    host: ["แมว"], transmission: ["Direct contact", "Aerosol", "Fomites"],
    pathogenesis: "ทำลายเยื่อบุทางเดินหายใจส่วนบนและช่องปาก",
    clinicalSigns: ["แผลหลุมในช่องปาก (Oral ulcers)", "น้ำลายไหล", "ไข้", "ขากะเผลก (Limping syndrome)"],
    diagnosis: ["RT-PCR", "Viral isolation"],
    treatment: "รักษาตามอาการ (ยาแก้ปวด, อาหารอ่อน)", prevention: ["วัคซีนรวมแมว (Core vaccine)"], vaccine: true,
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Feline Herpesvirus 1 (FHV-1)", family: "Herpesviridae", genus: "Varicellovirus", genome: "dsDNA",
    host: ["แมว"], transmission: ["Direct contact (ขี้ตา, น้ำมูก)"],
    pathogenesis: "ติดเชื้อทางเดินหายใจส่วนบน และหลบซ่อน (Latency) ในปมประสาท Trigeminal",
    clinicalSigns: ["จามรุนแรง", "ขี้ตาเขียว", "เยื่อตาขาวอักเสบ (Conjunctivitis)", "แผลที่กระจกตา (Corneal ulcers)"],
    diagnosis: ["RT-PCR", "Fluorescein stain (ดูแผลที่ตา)"],
    treatment: "ยาต้านไวรัสแบบหยอดตา, L-lysine", prevention: ["วัคซีนรวมแมว"], vaccine: true,
    image: "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Canine Coronavirus (CCoV)", family: "Coronaviridae", genus: "Alphacoronavirus", genome: "ssRNA (+)",
    host: ["สุนัข"], transmission: ["Fecal-oral"],
    pathogenesis: "ติดเชื้อที่ปลาย Villi ของลำไส้ (ไม่รุนแรงเท่า Parvovirus ที่ติดที่ Crypts)",
    clinicalSigns: ["ท้องเสียอ่อนๆ ถึงปานกลาง", "ซึมเล็กน้อย", "มักหายเองได้ถ้าไม่มีโรคแทรกซ้อน"],
    diagnosis: ["RT-PCR", "Electron microscopy"],
    treatment: "Supportive care", prevention: ["วัคซีน (แต่มักไม่จำเป็นในสุนัขโต)"], vaccine: true,
    image: "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Bovine Respiratory Syncytial Virus (BRSV)", family: "Pneumoviridae", genus: "Orthopneumovirus", genome: "ssRNA (-)",
    host: ["โค"], transmission: ["Aerosol", "Direct contact"],
    pathogenesis: "ทำลายเยื่อบุทางเดินหายใจและสร้าง Syncytial cells ทำให้เกิดปอดบวม (Bovine Respiratory Disease Complex)",
    clinicalSigns: ["หายใจหอบลึก", "ไข้", "น้ำมูกใสถึงข้น", "อ้าปากหายใจ"],
    diagnosis: ["RT-PCR", "IHC"],
    treatment: "ให้ยาปฏิชีวนะป้องกันแบคทีเรียแทรกซ้อน", prevention: ["วัคซีนรวมโรคทางเดินหายใจโค", "ลดความเครียด"], vaccine: true,
    image: "https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "West Nile Virus (WNV)", family: "Flaviviridae", genus: "Flavivirus", genome: "ssRNA (+)",
    host: ["นก (รังโรค)", "ม้า", "มนุษย์"], transmission: ["ยุงกัด (Mosquito-borne)"],
    pathogenesis: "ติดเชื้อในระบบประสาทส่วนกลาง (Encephalomyelitis) ในม้าและคน",
    clinicalSigns: ["ม้า: เดินเซ (Ataxia)", "กล้ามเนื้อกระตุก", "อัมพาต", "ตาย"],
    diagnosis: ["IgM Capture ELISA (จากน้ำไขสันหลังหรือเลือด)"],
    treatment: "Supportive care", prevention: ["ทำวัคซีนในม้า", "กำจัดยุงพาหะ"], vaccine: true,
    image: "https://images.unsplash.com/photo-1553618551-fba689030290?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Nipah Virus (NiV)", family: "Paramyxoviridae", genus: "Henipavirus", genome: "ssRNA (-)",
    host: ["ค้างคาวแม่ไก่ (รังโรค)", "สุกร", "มนุษย์"], transmission: ["สัมผัสสารคัดหลั่งค้างคาว", "สุกรสู่คน", "คนสู่คน"],
    pathogenesis: "ทำให้เกิดระบบทางเดินหายใจล้มเหลวในสุกร และสมองอักเสบรุนแรงในคน",
    clinicalSigns: ["สุกร: ไอเสียงดังรุนแรง (Barking cough)", "คน: สมองอักเสบ ตายสูงถึง 70%"],
    diagnosis: ["RT-PCR (ห้องปฏิบัติการ BSL-4)"],
    treatment: "ไม่มี (Zoonosis ร้ายแรง)", prevention: ["ทำลายสุกรติดเชื้อ", "ห้ามปลูกต้นไม้ดึงดูดค้างคาวใกล้เล้าหมู"], vaccine: false,
    image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Equine Influenza Virus (EIV)", family: "Orthomyxoviridae", genus: "Alphainfluenzavirus", genome: "ssRNA (-) segmented",
    host: ["ม้า"], transmission: ["Aerosol (ไอ จาม แพร่ไปได้ไกล)"],
    pathogenesis: "ติดเชื้อทำลาย Ciliated epithelium ของทางเดินหายใจ",
    clinicalSigns: ["ไข้สูงมาก", "ไอแห้งรุนแรง", "น้ำมูกใส", "อ่อนเพลีย"],
    diagnosis: ["RT-PCR", "Viral isolation จาก Nasal swab"],
    treatment: "พักการใช้งานอย่างน้อย 1 สัปดาห์ต่อไข้ 1 วัน", prevention: ["ทำวัคซีนสม่ำเสมอ โดยเฉพาะม้าแข่ง"], vaccine: true,
    image: "https://images.unsplash.com/photo-1553618551-fba689030290?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  },
  {
    virusName: "Duck Tembusu Virus (DTMUV)", family: "Flaviviridae", genus: "Flavivirus", genome: "ssRNA (+)",
    host: ["เป็ด"], transmission: ["ยุงกัด", "Direct contact"],
    pathogenesis: "ทำลายระบบประสาทและระบบสืบพันธุ์ของเป็ด",
    clinicalSigns: ["ไข่ลดฮวบ", "เป็ดเดินเซ ขาเป็นอัมพาต", "รังไข่อักเสบและมีเลือดออก"],
    diagnosis: ["RT-PCR", "IHC"],
    treatment: "ไม่มี", prevention: ["กำจัดยุง", "ทำวัคซีนในฟาร์มเป็ดไข่"], vaccine: true,
    image: "https://images.unsplash.com/photo-1550974059-3a6503c53ea8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    references: []
  }
];

export default function VirusSeedDatabase() {
  const { appUser } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleSeed = async () => {
    if (!window.confirm('ดำเนินการอัปเดต/เพิ่มฐานข้อมูล Core Viruses 30 ชนิด?')) return;
    setIsRunning(true);
    setIsCompleted(false);
    setLogs(["🚀 กำลังเริ่มต้นกระบวนการ Upsert (อัปเดตของเดิม / เพิ่มของใหม่) ..."]);

    const virusRef = collection(db, 'viruses');
    let added = 0;
    let updated = 0;

    for (let i = 0; i < SEED_DATA.length; i++) {
      const v = SEED_DATA[i];
      try {
        // Query to check if virus exists by name
        const q = query(virusRef, where("virusName", "==", v.virusName));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          // Update the first matching virus
          const existingDoc = snapshot.docs[0];
          await setDoc(doc(db, 'viruses', existingDoc.id), {
            ...v,
            virusID: existingDoc.id, // Preserve existing ID
          }, { merge: true });
          updated++;
          setLogs(prev => [...prev, `[UPDATED] อัปเดตข้อมูล: ${v.virusName}`]);
        } else {
          // Create new
          const newDocRef = doc(virusRef);
          await setDoc(newDocRef, {
            ...v,
            virusID: newDocRef.id
          });
          added++;
          setLogs(prev => [...prev, `[ADDED] เพิ่มไวรัสใหม่: ${v.virusName}`]);
        }
      } catch (e: any) {
        setLogs(prev => [...prev, `[ERROR] เกิดข้อผิดพลาดกับ ${v.virusName}: ${e.message}`]);
      }
    }

    setLogs(prev => [...prev, `✅ เสร็จสิ้น! เพิ่มใหม่: ${added} ชนิด | อัปเดต: ${updated} ชนิด`]);
    setIsRunning(false);
    setIsCompleted(true);
  };

  if (appUser?.role !== 'instructor') {
    return <div className="p-8 text-center text-red-500">Access Denied</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <Link href="/instructor/viruses" className="inline-flex items-center text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> กลับไปหน้าคลังไวรัส
      </Link>

      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 glass-neon shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Database className="w-64 h-64 text-accent" />
        </div>
        
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Database className="w-8 h-8 text-accent" /> 
          Database Seeding (Upsert Mode)
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          เครื่องมือพิเศษสำหรับนำเข้า <strong>"Core Veterinary Viruses"</strong> จำนวน 20-30 ชนิดที่สำคัญที่สุดในทางสัตวแพทย์ (ฉบับแปลภาษาไทยและมีข้อมูลครบถ้วน)
        </p>

        <div className="my-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-sm text-slate-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">หลักการทำงาน (Upsert):</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>หากตรวจพบไวรัสชื่อเดิมในระบบ (เช่น Rabies Virus) จะทำการ <strong>อัปเดตข้อมูลทับ</strong> เพื่อให้เนื้อหาสมบูรณ์ขึ้น</li>
                <li>หากเป็นไวรัสชนิดใหม่ที่ยังไม่เคยมีในระบบ จะทำการ <strong>สร้างใหม่</strong> ทันที</li>
                <li>ข้อมูลที่อาจารย์เคยสร้างไว้ (ที่ไม่ซ้ำชื่อกัน) จะไม่ถูกลบทิ้ง ปลอดภัย 100%</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-start">
          <Button 
            onClick={handleSeed} 
            disabled={isRunning || isCompleted}
            className="w-full sm:w-auto bg-accent hover:bg-accent/80 text-black font-black text-lg py-6 px-10 shadow-[0_0_20px_rgba(45,212,191,0.4)]"
            leftIcon={isRunning ? <Loader2 className="w-6 h-6 animate-spin" /> : <Database className="w-6 h-6" />}
          >
            {isRunning ? 'กำลังนำเข้าข้อมูลลง Firestore...' : isCompleted ? 'นำเข้าข้อมูลเรียบร้อยแล้ว' : 'กดปุ่มนี้เพื่อนำเข้าฐานข้อมูล'}
          </Button>
        </div>

        {/* LOG Console */}
        {(logs.length > 0) && (
          <div className="mt-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              System Logs {isCompleted && <CheckCircle className="w-4 h-4 text-emerald-500" />}
            </h3>
            <div className="bg-black/80 rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-64 border border-slate-700 shadow-inner">
              {logs.map((log, i) => (
                <div key={i} className={`py-1 ${
                  log.includes('[ERROR]') ? 'text-red-400' : 
                  log.includes('[UPDATED]') ? 'text-yellow-400' : 
                  log.includes('[ADDED]') ? 'text-emerald-400' : 'text-slate-300'
                }`}>
                  {log}
                </div>
              ))}
              {isRunning && (
                <div className="py-1 text-slate-500 animate-pulse">_</div>
              )}
            </div>
            
            {isCompleted && (
              <div className="mt-6">
                <Link href="/instructor/viruses">
                  <Button variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />} className="bg-emerald-900/30 text-emerald-400 border-emerald-500/50 hover:bg-emerald-900/50 hover:text-emerald-300">
                    ไปดูฐานข้อมูลไวรัส
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
