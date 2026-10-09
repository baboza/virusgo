/**
 * Seed script — run this ONCE from the browser console or as a Next.js API route.
 * It pushes 20 veterinary virus records into Firestore `viruses` collection.
 *
 * Usage (from Next.js page / component):
 *   import { seedViruses } from '@/lib/firebase/seedViruses';
 *   seedViruses();
 */

import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from './config';

const VIRUS_DATA = [
  {
    virusName: "Canine Parvovirus (CPV-2)",
    family: "Parvoviridae",
    genus: "Carnivore protoparvovirus 1",
    genome: "ssDNA",
    host: ["สุนัข", "หมาป่า", "หมีแรคคูน"],
    transmission: ["สัมผัสอุจจาระสัตว์ติดเชื้อ", "สิ่งแวดล้อมปนเปื้อน", "แนวตั้ง (แม่สู่ลูก)"],
    pathogenesis: "ไวรัสเข้าสู่ร่างกายผ่านทางปาก จากนั้นแพร่เข้าสู่ต่อมน้ำเหลือง และกระแสเลือด ก่อนทำลายเซลล์ที่แบ่งตัวเร็ว ได้แก่ เซลล์เยื่อบุลำไส้และไขกระดูก",
    clinicalSigns: ["อาเจียนรุนแรง", "ท้องเสียเป็นเลือดมีกลิ่นเหม็น", "ซึมและไม่กินอาหาร", "ไข้สูง", "เม็ดเลือดขาวต่ำมาก (Leukopenia)"],
    diagnosis: ["Antigen ELISA (SNAP test)", "PCR", "ตรวจนับเม็ดเลือดพบ Leukopenia"],
    treatment: "Supportive care: น้ำเกลือ, ยาแก้อาเจียน, ยาปฏิชีวนะป้องกันการติดเชื้อแบคทีเรียซ้ำซ้อน",
    prevention: ["วัคซีน MLV (Modified Live Vaccine)", "ทำวัคซีนตั้งแต่อายุ 6-8 สัปดาห์"],
    vaccine: true,
    image: "",
    references: ["Greene CE. Infectious Diseases of the Dog and Cat, 4th ed."]
  },
  {
    virusName: "Rabies Virus",
    family: "Rhabdoviridae",
    genus: "Lyssavirus",
    genome: "ssRNA (-)",
    host: ["สุนัข", "แมว", "ค้างคาว", "สัตว์เลี้ยงลูกด้วยนมทุกชนิด", "คน"],
    transmission: ["น้ำลายสัตว์ติดเชื้อผ่านบาดแผล (ถูกกัด)", "สูดดมละอองฝอยในถ้ำค้างคาว"],
    pathogenesis: "ไวรัสเดินทางตามเส้นประสาท (Retrograde axonal transport) จากบาดแผลขึ้นสู่สมอง ทำให้เกิด Encephalitis รุนแรง",
    clinicalSigns: ["ระยะโกรธ: ก้าวร้าว กัดทุกสิ่ง", "ระยะอัมพาต: กลืนไม่ได้ น้ำลายไหล", "กลัวน้ำ (Hydrophobia)", "เสียชีวิต 100%"],
    diagnosis: ["FAT (Fluorescent Antibody Test) จากสมอง", "พบ Negri bodies ในเซลล์ประสาท"],
    treatment: "ไม่มีการรักษาจำเพาะ — ป้องกันโดยการฉีดวัคซีนก่อนและหลังสัมผัสโรค (PEP)",
    prevention: ["วัคซีนพิษสุนัขบ้า (ฉีดได้ตั้งแต่ 3 เดือน)", "ควบคุมประชากรสุนัขจรจัด"],
    vaccine: true,
    image: "",
    references: ["WHO Rabies Factsheet 2023"]
  },
  {
    virusName: "Canine Distemper Virus (CDV)",
    family: "Paramyxoviridae",
    genus: "Morbillivirus",
    genome: "ssRNA (-)",
    host: ["สุนัข", "สุนัขจิ้งจอก", "วีเซิล", "แรคคูน", "สิงโต"],
    transmission: ["ละอองฝอยทางอากาศ", "สัมผัสสารคัดหลั่ง"],
    pathogenesis: "ไวรัสติดเชื้อระบบภูมิคุ้มกันก่อน (Lymphocytes) ทำให้ภูมิคุ้มกันต่ำ จากนั้นแพร่ไปยังระบบหายใจ ทางเดินอาหาร และระบบประสาท",
    clinicalSigns: ["ไข้สองระลอก", "น้ำมูก ตาแฉะ", "ปอดบวม", "ท้องเสีย", "กล้ามเนื้อกระตุก (Myoclonus)", "ฝ่าเท้าหนาแข็ง (Hard pad)"],
    diagnosis: ["RT-PCR", "IFA ตรวจ Inclusion bodies", "ตรวจ Antibody titer"],
    treatment: "Supportive care, ป้องกันการติดเชื้อซ้ำซ้อน",
    prevention: ["วัคซีน MLV (DHPP)", "แยกสัตว์ป่วย"],
    vaccine: true,
    image: "",
    references: ["Greene CE. Infectious Diseases of the Dog and Cat, 4th ed."]
  },
  {
    virusName: "Feline Panleukopenia Virus (FPV)",
    family: "Parvoviridae",
    genus: "Carnivore protoparvovirus 1",
    genome: "ssDNA",
    host: ["แมว", "เสือ", "สิงโต", "แรคคูน"],
    transmission: ["สัมผัสสิ่งแวดล้อมปนเปื้อน", "ไรเบา"],
    pathogenesis: "ทำลายเซลล์แบ่งตัวเร็วในทางเดินอาหาร ไขกระดูก และต่อมน้ำเหลือง ทำให้เม็ดเลือดขาวต่ำมาก",
    clinicalSigns: ["อาเจียน", "ท้องเสียรุนแรง", "ซึม", "Leukopenia รุนแรง", "ลูกแมวในครรภ์มีความบกพร่องทางสมองน้อย (Cerebellar hypoplasia)"],
    diagnosis: ["SNAP CPV/FPV Antigen test", "CBC พบ Leukopenia", "PCR"],
    treatment: "Supportive care: IV fluids, ยาแก้อาเจียน",
    prevention: ["วัคซีน FVRCP", "ทำวัคซีนตั้งแต่ 6-8 สัปดาห์"],
    vaccine: true,
    image: "",
    references: ["Sykes JE. Canine and Feline Infectious Diseases"]
  },
  {
    virusName: "Feline Immunodeficiency Virus (FIV)",
    family: "Retroviridae",
    genus: "Lentivirus",
    genome: "ssRNA (+)",
    host: ["แมว"],
    transmission: ["ถูกกัด (ผ่านน้ำลาย)", "แนวตั้งจากแม่สู่ลูก (พบน้อย)"],
    pathogenesis: "ทำลาย CD4+ T-lymphocytes ทำให้ภูมิคุ้มกันบกพร่องคล้าย HIV ในคน ส่งผลให้ติดเชื้อฉวยโอกาสได้ง่าย",
    clinicalSigns: ["ปากอักเสบรุนแรง (Stomatitis/Gingivitis)", "น้ำหนักลด", "ท้องร่วงเรื้อรัง", "ติดเชื้อซ้ำซ้อนบ่อย", "ต่อมน้ำเหลืองโต"],
    diagnosis: ["ELISA ตรวจ Antibody (SNAP FIV/FeLV)", "Western blot ยืนยัน", "PCR"],
    treatment: "ไม่มีการรักษาให้หาย — ควบคุมอาการและป้องกันการติดเชื้อซ้ำ, ยาต้านไวรัส Zidovudine",
    prevention: ["วัคซีนมีในบางประเทศ", "ป้องกันการกัดกัน", "ตอน/ทำหมัน"],
    vaccine: false,
    image: "",
    references: ["Hartmann K. Feline Immunodeficiency Virus Infection. Vet Clin North Am 2011"]
  },
  {
    virusName: "Feline Leukemia Virus (FeLV)",
    family: "Retroviridae",
    genus: "Gammaretrovirus",
    genome: "ssRNA (+)",
    host: ["แมว"],
    transmission: ["น้ำลาย (แต่งตัว เลีย)", "อุจจาระและปัสสาวะ", "แนวตั้ง"],
    pathogenesis: "ไวรัสรวมเข้ากับ DNA ของเซลล์เจ้าบ้าน ทำให้เกิดมะเร็งเม็ดเลือด (Lymphoma/Leukemia) หรือกดการทำงานของไขกระดูก",
    clinicalSigns: ["โลหิตจาง", "ต่อมน้ำเหลืองโต (Lymphoma)", "ซึม เบื่ออาหาร", "ภูมิคุ้มกันต่ำ", "ท้องมาน"],
    diagnosis: ["ELISA SNAP test ตรวจ p27 antigen", "IFA ยืนยัน", "PCR"],
    treatment: "Supportive care, ยาเคมีบำบัดในรายที่เป็น Lymphoma",
    prevention: ["วัคซีน FeLV (แนะนำในแมวที่ออกนอกบ้าน)", "ทดสอบก่อนนำแมวใหม่เข้าบ้าน"],
    vaccine: true,
    image: "",
    references: ["Lutz H et al. Feline leukaemia. ABCD guidelines 2009"]
  },
  {
    virusName: "Porcine Reproductive and Respiratory Syndrome Virus (PRRSV)",
    family: "Arteriviridae",
    genus: "Betaarterivirus",
    genome: "ssRNA (+)",
    host: ["สุกร"],
    transmission: ["ละอองฝอยทางอากาศ", "สัมผัสโดยตรง", "น้ำเชื้อ", "แนวตั้ง"],
    pathogenesis: "ติดเชื้อที่ Alveolar macrophage ในปอด ทำให้เกิด Interstitial pneumonia และยับยั้งการทำงานของระบบภูมิคุ้มกัน",
    clinicalSigns: ["หูม่วงคล้ำ (Blue ear disease)", "แม่สุกรแท้งช่วงปลายท้อง", "ลูกสุกรคลอดตายหรืออ่อนแอ", "ปอดบวมรุนแรงในลูกสุกรหย่านม"],
    diagnosis: ["ELISA ตรวจ Antibody", "RT-PCR", "การแยกเชื้อไวรัส", "Histopathology พบ Interstitial pneumonia"],
    treatment: "Supportive care, ยาปฏิชีวนะป้องกันการติดเชื้อแบคทีเรียซ้ำ",
    prevention: ["วัคซีน MLV และ Killed vaccine", "ระบบ AIAO (All-in All-out)", "ควบคุมการเคลื่อนย้ายสุกร"],
    vaccine: true,
    image: "",
    references: ["Zimmerman JJ et al. Diseases of Swine, 11th ed."]
  },
  {
    virusName: "Foot and Mouth Disease Virus (FMDV)",
    family: "Picornaviridae",
    genus: "Aphthovirus",
    genome: "ssRNA (+)",
    host: ["วัว", "ควาย", "สุกร", "แกะ", "แพะ", "กวาง"],
    transmission: ["ละอองฝอยทางอากาศ", "สัมผัสโดยตรง", "อาหารและน้ำปนเปื้อน", "อุปกรณ์ฟาร์ม"],
    pathogenesis: "ไวรัสเพิ่มจำนวนที่เยื่อบุทางเดินหายใจก่อน จากนั้นเกิด Viremia และตั้งรกรากที่ผิวหนัง บริเวณปาก กีบ และเต้านม ทำให้เกิดถุงน้ำ (Vesicle)",
    clinicalSigns: ["ไข้สูงเฉียบพลัน", "ถุงน้ำและแผลที่ปาก ลิ้น รูจมูก กีบ และเต้านม", "น้ำลายไหลมาก", "เดินกะเผลก"],
    diagnosis: ["ELISA ตรวจ Antigen", "RT-PCR จำแนก Serotype (O, A, Asia 1 ฯลฯ)", "Complement Fixation Test (CFT)"],
    treatment: "ไม่มีการรักษาจำเพาะ — รักษาตามอาการและป้องกันแผลติดเชื้อ",
    prevention: ["วัคซีนชนิด Inactivated (ต้องตรงกับ Serotype)", "ควบคุมการเคลื่อนย้ายสัตว์อย่างเข้มงวด", "ทำลายสัตว์ป่วยในพื้นที่ระบาด"],
    vaccine: true,
    image: "",
    references: ["OIE Terrestrial Manual 2021 — FMD Chapter"]
  },
  {
    virusName: "African Swine Fever Virus (ASFV)",
    family: "Asfarviridae",
    genus: "Asfivirus",
    genome: "dsDNA",
    host: ["สุกรบ้าน", "หมูป่า", "หมูหูดแอฟริกา (Warthog)"],
    transmission: ["สัมผัสโดยตรงกับสุกรป่วย", "เห็บ Ornithodoros (พาหะ)", "อาหารเศษเหลือจากโรงฆ่าสัตว์", "อุปกรณ์และยานพาหนะ"],
    pathogenesis: "ติดเชื้อที่ Monocyte/Macrophage ทำให้เกิดปฏิกิริยา Cytokine storm และ Hemorrhage รุนแรงทั่วร่างกาย",
    clinicalSigns: ["ไข้สูงมาก (40-42°C)", "ซึมมาก", "ผิวหนังแดงหรือเขียวคล้ำบริเวณหู ท้อง ขา", "เลือดออกภายในอวัยวะต่างๆ", "ตายภายใน 2-10 วัน"],
    diagnosis: ["PCR จาก Blood/Tissue", "ELISA ตรวจ Antibody", "FAT", "การแยกเชื้อในเซลล์เพาะเลี้ยง"],
    treatment: "ไม่มีการรักษาและวัคซีน — ต้องทำลายสุกรทั้งฝูงและทำลายซาก",
    prevention: ["ห้ามใช้เศษอาหารเลี้ยงสุกร", "ควบคุมการเคลื่อนย้ายอย่างเข้มงวด", "กำจัดเห็บ Ornithodoros", "Biosecurity สูงสุด"],
    vaccine: false,
    image: "",
    references: ["Dixon LK et al. African Swine Fever. Virus Research 2019"]
  },
  {
    virusName: "Classical Swine Fever Virus (CSFV)",
    family: "Flaviviridae",
    genus: "Pestivirus",
    genome: "ssRNA (+)",
    host: ["สุกรบ้าน", "หมูป่า"],
    transmission: ["สัมผัสโดยตรง", "อาหารปนเปื้อน", "น้ำเชื้อ", "แนวตั้ง"],
    pathogenesis: "ทำลาย Endothelium และ Lymphocytes ทำให้เกิด Hemorrhage ทั่วร่างกายและ Immunosuppression",
    clinicalSigns: ["ไข้สูง 40-41°C", "ซึม เบื่ออาหาร", "เดินเซ อ่อนแรงขาหลัง", "จุดเลือดออก (Petechiae) ที่ผิวหนังและอวัยวะภายใน", "ท้องเสีย", "ชักในลูกสุกร"],
    diagnosis: ["ELISA (Antigen/Antibody)", "RT-PCR", "Virus Neutralization Test", "Histopathology"],
    treatment: "ไม่มีการรักษาจำเพาะ — ทำลายสัตว์ป่วยตามกฎหมาย",
    prevention: ["วัคซีน (C-strain MLV)", "ห้ามฉีดในหลายประเทศเพื่อรักษาสถานะปลอดโรค"],
    vaccine: true,
    image: "",
    references: ["Moennig V et al. Classical Swine Fever. Dtsch Tierarztl Wochenschr 2000"]
  },
  {
    virusName: "Avian Influenza Virus (AIV) H5N1",
    family: "Orthomyxoviridae",
    genus: "Alphainfluenzavirus",
    genome: "ssRNA (-) แบบ Segmented (8 segments)",
    host: ["สัตว์ปีกบ้าน", "นกป่า", "คน (Zoonosis)", "แมว", "เสือ"],
    transmission: ["น้ำและสิ่งแวดล้อมปนเปื้อนมูลสัตว์ปีก", "สัมผัสโดยตรงกับสัตว์ป่วย", "ละอองฝอย"],
    pathogenesis: "HPAI (H5N1) เพิ่มจำนวนได้ในหลายระบบ ทำให้เกิด Systemic disease รุนแรงและ Cytokine storm",
    clinicalSigns: ["ไก่: ตายกะทันหัน", "หงอนและเหนียงคล้ำม่วง", "ไข่ร่วง", "อาการทางระบบประสาท", "อัตราตายสูงถึง 100% ใน HPAI"],
    diagnosis: ["RT-PCR จาก Cloacal/Oropharyngeal swab", "Rapid Antigen Test", "Virus Isolation", "HI test"],
    treatment: "ไม่มีการรักษา — ทำลายฝูงสัตว์ปีก",
    prevention: ["วัคซีนชนิด Inactivated H5N1", "Biosecurity", "ห้ามนำสัตว์ปีกป่วยออกนอกพื้นที่"],
    vaccine: true,
    image: "",
    references: ["FAO/OIE/WHO Technical Report on Avian Influenza"]
  },
  {
    virusName: "Newcastle Disease Virus (NDV)",
    family: "Paramyxoviridae",
    genus: "Avulavirus",
    genome: "ssRNA (-)",
    host: ["สัตว์ปีกทุกชนิด", "นกป่า"],
    transmission: ["ละอองฝอยทางอากาศ", "สัมผัสสิ่งคัดหลั่ง", "อุปกรณ์ปนเปื้อน"],
    pathogenesis: "ขึ้นอยู่กับ Pathotype: Lentogenic (เล็กน้อย), Mesogenic (ปานกลาง), Velogenic (รุนแรง/ตาย)",
    clinicalSigns: ["ไอ จาม หายใจลำบาก", "ท้องเสีย", "อัมพาตขาและปีก", "คอบิด (Torticollis)", "ไข่ร่วง"],
    diagnosis: ["HI test", "ELISA ตรวจ Antibody", "RT-PCR", "Virus Isolation ใน Embryonated egg"],
    treatment: "ไม่มีการรักษาจำเพาะ",
    prevention: ["วัคซีน La Sota / B1 strain", "Inactivated vaccine"],
    vaccine: true,
    image: "",
    references: ["Alexander DJ. Newcastle disease. Br Poult Sci 2001"]
  },
  {
    virusName: "Infectious Bursal Disease Virus (IBDV)",
    family: "Birnaviridae",
    genus: "Avibirnavirus",
    genome: "dsRNA (2 segments)",
    host: ["ไก่"],
    transmission: ["สัมผัสโดยตรงและอ้อม", "สิ่งแวดล้อมปนเปื้อน", "อาหาร น้ำ ฝุ่น"],
    pathogenesis: "ทำลาย Bursa of Fabricius ซึ่งเป็นอวัยวะสร้างภูมิคุ้มกัน B-cell ทำให้ไก่อ่อนแอต่อการติดเชื้ออื่น",
    clinicalSigns: ["ซึม ขนฟู", "ท้องเสียสีขาว", "จิกก้นตัวเอง (เพราะ Bursa อักเสบ)", "ตายกะทันหันในฝูง"],
    diagnosis: ["ELISA ตรวจ Antibody", "Agar Gel Immunodiffusion (AGID)", "Histopathology ของ Bursa", "PCR"],
    treatment: "ไม่มีการรักษาจำเพาะ",
    prevention: ["วัคซีน Intermediate / Intermediate plus strain", "วัคซีนแม่ถ่ายภูมิให้ลูก"],
    vaccine: true,
    image: "",
    references: ["van den Berg TP. Acute infectious bursal disease in poultry. Avian Pathol 2000"]
  },
  {
    virusName: "Bovine Viral Diarrhea Virus (BVDV)",
    family: "Flaviviridae",
    genus: "Pestivirus",
    genome: "ssRNA (+)",
    host: ["โค", "กระบือ", "แกะ", "แพะ", "กวาง"],
    transmission: ["สัมผัสโดยตรงกับสัตว์ติดเชื้อ", "น้ำเชื้อ", "แนวตั้ง (สำคัญมาก: เกิด PI calf)"],
    pathogenesis: "ติดเชื้อในช่วงตั้งท้องทำให้ลูกโคเป็น Persistently Infected (PI) ซึ่งปล่อยเชื้อตลอดชีวิต ใน PI calf อาจเกิด Mucosal disease (MD) ที่รุนแรง",
    clinicalSigns: ["ท้องเสีย ไข้ น้ำมูก (รูปแบบเฉียบพลัน)", "แท้ง ลูกพิการ ลูกโคอ่อนแอ", "ใน Mucosal disease: แผลในปากและทางเดินอาหาร ท้องเสียรุนแรง ตาย"],
    diagnosis: ["ELISA ตรวจ Antigen (p80) หรือ Antibody", "PCR", "Ear notch test ใน PI cattle", "Virus isolation"],
    treatment: "Supportive care, รีบค้นหาและกำจัด PI cattle",
    prevention: ["วัคซีน MLV และ Killed", "ทดสอบหา PI cattle ก่อนนำเข้าฝูง"],
    vaccine: true,
    image: "",
    references: ["Houe H. Epidemiological features and economical importance of BVDV. Vet Microbiol 1999"]
  },
  {
    virusName: "Infectious Bronchitis Virus (IBV)",
    family: "Coronaviridae",
    genus: "Gammacoronavirus",
    genome: "ssRNA (+)",
    host: ["ไก่"],
    transmission: ["ละอองฝอยทางอากาศ (แพร่เร็วมาก)", "สัมผัสโดยตรง", "อุปกรณ์ปนเปื้อน"],
    pathogenesis: "ติดเชื้อที่เยื่อบุทางเดินหายใจ ไต และท่อนำไข่ ทำให้เกิดอาการหลากหลายขึ้นกับ Serotype",
    clinicalSigns: ["ไอ จาม หายใจมีเสียงดัง (Rales)", "น้ำตาไหล", "ไข่ลด ไข่ผิดรูป เปลือกบาง", "ไตอักเสบ (Nephropathogenic strains)", "ท้องมานในไก่สาว"],
    diagnosis: ["RT-PCR จำแนก Serotype", "HI test", "Virus isolation ใน Embryonated egg", "Histopathology"],
    treatment: "ไม่มีการรักษาจำเพาะ, ควบคุมสิ่งแวดล้อม",
    prevention: ["วัคซีน Live attenuated (Massachusetts, Connecticut, Ark ฯลฯ)", "วัคซีน Inactivated"],
    vaccine: true,
    image: "",
    references: ["Cavanagh D. Coronavirus avian infectious bronchitis virus. Vet Res 2007"]
  },
  {
    virusName: "Equine Influenza Virus (EIV)",
    family: "Orthomyxoviridae",
    genus: "Alphainfluenzavirus",
    genome: "ssRNA (-) Segmented",
    host: ["ม้า", "ลา", "ล่อ"],
    transmission: ["ละอองฝอยทางอากาศ", "สัมผัสโดยตรง", "อุปกรณ์ปนเปื้อน"],
    pathogenesis: "ไวรัสติดเชื้อที่เยื่อบุทางเดินหายใจส่วนบน ทำให้เกิดการอักเสบและ Mucociliary clearance บกพร่อง",
    clinicalSigns: ["ไข้สูง 39-41°C", "ไอแห้งรุนแรง", "น้ำมูกใส ต่อมาเป็นหนอง", "ซึม เบื่ออาหาร", "ต่อมน้ำเหลืองใต้คางโต"],
    diagnosis: ["Rapid Influenza Antigen Test", "RT-PCR", "Virus isolation", "Paired serology (HI/SRH)"],
    treatment: "พัก, ดูแลสิ่งแวดล้อม, NSAIDs ลดไข้, ยาปฏิชีวนะป้องกันการติดเชื้อซ้ำ",
    prevention: ["วัคซีน (Florida Clade 1 & 2)", "กักกันม้าใหม่ 3 สัปดาห์"],
    vaccine: true,
    image: "",
    references: ["Daly JM et al. Equine Influenza. Equine Vet Educ 2011"]
  },
  {
    virusName: "Marek's Disease Virus (MDV)",
    family: "Herpesviridae",
    genus: "Mardivirus",
    genome: "dsDNA",
    host: ["ไก่", "ไก่ฟ้า", "ไก่งวง"],
    transmission: ["ฝุ่นและขนจากขุมขน (Feather follicle epithelium)", "สิ่งแวดล้อม (ไวรัสคงทนมากในสิ่งแวดล้อม)"],
    pathogenesis: "ติดเชื้อ T-lymphocyte ทำให้เกิด Lymphoma และ Peripheral neuritis",
    clinicalSigns: ["อัมพาตขาและปีก (Neuritis)", "ต่อมน้ำเหลืองโตเป็น Lymphoma ในอวัยวะต่างๆ", "ม่านตาเปลี่ยนสี (Ocular lymphomatosis)", "ผิวหนังขุมขนโต"],
    diagnosis: ["Histopathology พบ Perivascular infiltration", "PCR", "Agar Gel Immunodiffusion", "Virus isolation"],
    treatment: "ไม่มีการรักษา",
    prevention: ["วัคซีน Herpesvirus of Turkey (HVT)", "วัคซีน CVI 988/Rispens (ป้องกันได้ดีที่สุด)", "ฉีดวัคซีนลูกไก่ทันทีหลังฟักออกจากไข่"],
    vaccine: true,
    image: "",
    references: ["Witter RL. Marek's Disease. In: Diseases of Poultry, 12th ed."]
  },
  {
    virusName: "Bovine Herpesvirus 1 (BHV-1 / IBR)",
    family: "Herpesviridae",
    genus: "Varicellovirus",
    genome: "dsDNA",
    host: ["โค", "กระบือ"],
    transmission: ["สัมผัสโดยตรงกับสารคัดหลั่งจากจมูก ตา และอวัยวะเพศ", "น้ำเชื้อ", "Latent carrier"],
    pathogenesis: "BHV-1 ทำให้เกิด Infectious Bovine Rhinotracheitis (IBR) ที่ระบบทางเดินหายใจ หรือ IPV ที่อวัยวะสืบพันธุ์ ไวรัสซ่อนตัว (Latent) ในปมประสาท Trigeminal ได้ตลอดชีวิต",
    clinicalSigns: ["ไข้สูง", "น้ำมูก/น้ำตาไหล", "เยื่อบุจมูกแดงและมีแผล", "แท้ง", "อวัยวะเพศอักเสบ", "เยื่อตาอักเสบ (Keratoconjunctivitis)"],
    diagnosis: ["ELISA ตรวจ Antibody", "PCR", "Virus isolation จาก Nasal swab"],
    treatment: "Supportive care, ยาปฏิชีวนะป้องกันการติดเชื้อแบคทีเรีย, ยาต้านไวรัส Acyclovir ในรายรุนแรง",
    prevention: ["วัคซีน MLV และ Killed (Marker vaccine)", "โปรแกรมกำจัดโรค (Eradication) ในยุโรป"],
    vaccine: true,
    image: "",
    references: ["Muylkens B et al. Bovine herpesvirus 1 infection and infectious bovine rhinotracheitis. Vet Res 2007"]
  },
  {
    virusName: "Pseudorabies Virus (PRV / Aujeszky's Disease)",
    family: "Herpesviridae",
    genus: "Varicellovirus",
    genome: "dsDNA",
    host: ["สุกร (Host หลัก)", "โค", "แกะ", "แพะ", "สุนัข", "แมว (Dead-end host)"],
    transmission: ["สัมผัสโดยตรง", "ละอองฝอย", "น้ำเชื้อในสุกรพ่อพันธุ์", "อาหารปนเปื้อน"],
    pathogenesis: "ในสุกรพ่อแม่พันธุ์: Latent infection. ในสุกรอ่อน: ระบบประสาท. ใน Dead-end hosts: กระตุ้นระบบประสาทรุนแรง คันอย่างรุนแรง (Mad Itch)",
    clinicalSigns: ["สุกรอ่อน: ชัก ตายสูง", "แม่สุกร: แท้ง", "Dead-end hosts (สุนัข แมว วัว): คันรุนแรง จิกหรือเลียผิวหนัง ชัก ตาย 100%"],
    diagnosis: ["ELISA (gE-ELISA แยก Vaccinated/Infected)", "PCR", "Virus Neutralization"],
    treatment: "ไม่มีการรักษา ใน dead-end hosts ตายทุกราย",
    prevention: ["วัคซีน Marker vaccine (gE-deleted)", "โปรแกรมกำจัดโรค"],
    vaccine: true,
    image: "",
    references: ["Pomeranz LE et al. Molecular biology of pseudorabies virus. Microbiol Mol Biol Rev 2005"]
  },
  {
    virusName: "Rotavirus (Group A)",
    family: "Reoviridae",
    genus: "Rotavirus",
    genome: "dsRNA (11 segments)",
    host: ["ลูกโค", "ลูกสุกร", "ลูกแกะ", "ลูกม้า", "คน"],
    transmission: ["Fecal-oral route", "สัมผัสสิ่งแวดล้อมปนเปื้อน", "ไวรัสคงทนในสิ่งแวดล้อม"],
    pathogenesis: "ทำลาย Villous enterocyte บริเวณปลาย Villi ของลำไส้เล็ก ทำให้เกิด Malabsorption และท้องร่วง เกิดในลูกสัตว์แรกเกิดถึง 2-3 สัปดาห์",
    clinicalSigns: ["ท้องร่วงสีเหลืองหรือเขียว น้ำมาก", "ขาดน้ำ (Dehydration)", "ซึม", "ในรายรุนแรง: ตาย"],
    diagnosis: ["ELISA ตรวจ Antigen จากอุจจาระ", "Electron microscopy เห็นรูปล้อรถ (Wheel-like)", "RT-PCR"],
    treatment: "Oral rehydration solution (ORS), IV fluids ในรายรุนแรง",
    prevention: ["วัคซีนแม่ก่อนคลอดเพื่อให้ภูมิผ่านน้ำนมเหลือง (Colostrum)", "สุขาภิบาลในคอกแม่คลอด"],
    vaccine: true,
    image: "",
    references: ["Saif LJ et al. Rotaviruses and Reoviruses. In: Diseases of Swine, 11th ed."]
  }
];

export async function seedViruses() {
  const collectionRef = collection(db, 'viruses');

  // Check if already seeded
  const existing = await getDocs(collectionRef);
  if (existing.size >= 10) {
    console.log(`✅ Already seeded: ${existing.size} viruses found. Skipping.`);
    return;
  }

  console.log(`🔬 Seeding ${VIRUS_DATA.length} viruses to Firestore...`);
  let count = 0;
  for (const virus of VIRUS_DATA) {
    const docRef = doc(collectionRef);
    await setDoc(docRef, { ...virus, virusID: docRef.id });
    count++;
    console.log(`  [${count}/${VIRUS_DATA.length}] Added: ${virus.virusName}`);
  }
  console.log(`✅ Done! ${count} viruses seeded.`);
}
