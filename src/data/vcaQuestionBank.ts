import { 
  ALL_15_CHAPTER_QUESTIONS, 
  ALL_15_LAB_CASES, 
  MasterQuestion, 
  LabCase 
} from '@/data/veterinaryVirologyContent';
import { VirusType } from '@/components/ui/SVGVirus';

export type VCACategory = 
  | 'swine'
  | 'poultry'
  | 'bovine'
  | 'companion'
  | 'equine_zoonosis'
  | 'diagnostic_basic';

export interface VCAExamQuestion {
  id: string;
  sourceId: string;
  category: VCACategory;
  categoryLabel: string;
  species: string;
  chapterTitle: string;
  chapterNumber?: number;
  virusName: string;
  title?: string;
  vignette?: string;
  laboratoryResults?: string;
  question: string;
  choices: string[];
  correctAnswer: string;
  explanation: string;
  highYieldPearl: string;
  hint3D: {
    virionType: VirusType;
    animalKind: 'swine' | 'poultry' | 'bovine' | 'canine' | 'feline' | 'equine' | 'zoonosis';
    clue: string;
  };
}

export interface CategoryMeta {
  key: VCACategory;
  nameTh: string;
  nameEn: string;
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  targetCount: number;
}

export const VCA_CATEGORIES_CONFIG: Record<VCACategory, CategoryMeta> = {
  swine: {
    key: 'swine',
    nameTh: 'โรคสุกร',
    nameEn: 'Porcine Virology',
    color: 'rose',
    borderColor: 'border-rose-500/40',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-400',
    targetCount: 5
  },
  poultry: {
    key: 'poultry',
    nameTh: 'โรคสัตว์ปีก',
    nameEn: 'Avian Virology',
    color: 'amber',
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    targetCount: 4
  },
  bovine: {
    key: 'bovine',
    nameTh: 'โรคสัตว์เคี้ยวเอื้อง (โค-กระบือ)',
    nameEn: 'Ruminant Virology',
    color: 'emerald',
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    targetCount: 4
  },
  companion: {
    key: 'companion',
    nameTh: 'โรคสัตว์เลี้ยง (สุนัขและแมว)',
    nameEn: 'Canine & Feline Virology',
    color: 'cyan',
    borderColor: 'border-cyan-500/40',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
    targetCount: 5
  },
  equine_zoonosis: {
    key: 'equine_zoonosis',
    nameTh: 'โรคม้าและโรคสัตว์สู่คน (One Health)',
    nameEn: 'Equine & Zoonoses',
    color: 'purple',
    borderColor: 'border-purple-500/40',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    targetCount: 3
  },
  diagnostic_basic: {
    key: 'diagnostic_basic',
    nameTh: 'ไวรัสวิทยาทั่วไปและการวินิจฉัยแล็บ',
    nameEn: 'General & Diagnostic Virology',
    color: 'blue',
    borderColor: 'border-blue-500/40',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    targetCount: 4
  }
};

/**
 * Fisher-Yates array shuffler
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Resolve virion 3D morphology type for 3D Specimen Helper
 */
function resolveVirionType(text: string): VirusType {
  const t = text.toLowerCase();
  if (t.includes('rabies') || t.includes('rhabdo')) return 'rabies';
  if (t.includes('parvo')) return 'parvo';
  if (t.includes('corona') || t.includes('fip') || t.includes('ped') || t.includes('tge') || t.includes('ibv')) return 'corona';
  if (t.includes('retro') || t.includes('felv') || t.includes('fiv') || t.includes('eia') || t.includes('blv')) return 'retro';
  if (t.includes('paramyxo') || t.includes('newcastle') || t.includes('ndv') || t.includes('distemper') || t.includes('cdv') || t.includes('hendra') || t.includes('nipah')) return 'paramyxo';
  if (t.includes('arteri') || t.includes('prrs') || t.includes('eva')) return 'arterivirus';
  if (t.includes('picorna') || t.includes('fmd') || t.includes('calici') || t.includes('fcv')) return 'picorna';
  if (t.includes('asfar') || t.includes('asf')) return 'asfar';
  if (t.includes('flavi') || t.includes('bvd') || t.includes('csf') || t.includes('je') || t.includes('wnv')) return 'flavi';
  if (t.includes('orthomyxo') || t.includes('influenza') || t.includes('ai') || t.includes('hpai')) return 'orthomyxo';
  if (t.includes('birna') || t.includes('ibd') || t.includes('gumboro')) return 'birna';
  if (t.includes('herpes') || t.includes('pseudorabies') || t.includes('marek') || t.includes('ehv') || t.includes('bhv') || t.includes('ilt')) return 'herpes';
  if (t.includes('reo') || t.includes('rotavirus') || t.includes('btv') || t.includes('ahsv')) return 'reo';
  return 'default';
}

/**
 * Categorize a question based on its content, chapter, and references
 */
function categorizeQuestion(
  qText: string, 
  vName: string, 
  chapter: number, 
  speciesText?: string
): { 
  category: VCACategory; 
  species: string; 
  animalKind: 'swine' | 'poultry' | 'bovine' | 'canine' | 'feline' | 'equine' | 'zoonosis';
} {
  const combined = `${qText} ${vName} ${speciesText || ''}`.toLowerCase();

  // 1. Equine & Zoonoses check
  if (
    combined.includes('rabies') || 
    combined.includes('พิษสุนัขบ้า') || 
    combined.includes('nipah') || 
    combined.includes('hendra') || 
    combined.includes('japanese encephalitis') ||
    combined.includes('zoonosis') ||
    combined.includes('ม้า') ||
    combined.includes('horse') ||
    combined.includes('equine') ||
    combined.includes('ahsv') ||
    combined.includes('eia') ||
    combined.includes('eva') ||
    combined.includes('ehv')
  ) {
    const isHorse = combined.includes('ม้า') || combined.includes('horse') || combined.includes('equine') || combined.includes('ahsv');
    return {
      category: 'equine_zoonosis',
      species: isHorse ? 'ม้า (Equine)' : 'โรคสัตว์สู่คน (Zoonosis / One Health)',
      animalKind: isHorse ? 'equine' : 'zoonosis'
    };
  }

  // 2. Swine (Porcine)
  if (
    combined.includes('สุกร') || 
    combined.includes('หมู') || 
    combined.includes('swine') || 
    combined.includes('pig') || 
    combined.includes('porcine') ||
    combined.includes('prrs') ||
    combined.includes('asfv') ||
    combined.includes('asf') ||
    combined.includes('csfv') ||
    combined.includes('csf') ||
    combined.includes('pedv') ||
    combined.includes('tgev') ||
    combined.includes('pcv2') ||
    combined.includes('circovirus') ||
    combined.includes('pseudorabies') ||
    combined.includes('aujeszky')
  ) {
    return {
      category: 'swine',
      species: 'สุกร (Porcine)',
      animalKind: 'swine'
    };
  }

  // 3. Poultry (Avian)
  if (
    combined.includes('สัตว์ปีก') || 
    combined.includes('ไก่') || 
    combined.includes('เป็ด') || 
    combined.includes('avian') || 
    combined.includes('chicken') || 
    combined.includes('poultry') || 
    combined.includes('fowl') ||
    combined.includes('newcastle') || 
    combined.includes('ndv') || 
    combined.includes('gumboro') || 
    combined.includes('ibdv') || 
    combined.includes('marek') || 
    combined.includes('ilt') || 
    combined.includes('ibv') || 
    combined.includes('hpai') ||
    combined.includes('eds76')
  ) {
    return {
      category: 'poultry',
      species: 'สัตว์ปีก (Avian / Poultry)',
      animalKind: 'poultry'
    };
  }

  // 4. Bovine / Ruminant
  if (
    combined.includes('โค') || 
    combined.includes('กระบือ') || 
    combined.includes('แพะ') || 
    combined.includes('แกะ') || 
    combined.includes('bovine') || 
    combined.includes('cattle') || 
    combined.includes('cow') || 
    combined.includes('ruminant') ||
    combined.includes('fmd') || 
    combined.includes('bvd') || 
    combined.includes('ปากและเท้าเปื่อย') ||
    combined.includes('lumpy skin') || 
    combined.includes('mcf') ||
    combined.includes('rinderpest') ||
    combined.includes('bse') ||
    combined.includes('scrapie')
  ) {
    return {
      category: 'bovine',
      species: 'สัตว์เคี้ยวเอื้อง (Bovine / Ruminant)',
      animalKind: 'bovine'
    };
  }

  // 5. Companion (Canine & Feline)
  if (
    combined.includes('สุนัข') || 
    combined.includes('แมว') || 
    combined.includes('canine') || 
    combined.includes('feline') || 
    combined.includes('dog') || 
    combined.includes('cat') || 
    combined.includes('puppy') || 
    combined.includes('kitten') ||
    combined.includes('cpv') || 
    combined.includes('parvovirus') || 
    combined.includes('cdv') || 
    combined.includes('distemper') || 
    combined.includes('cav-') || 
    combined.includes('fip') || 
    combined.includes('felv') || 
    combined.includes('fiv') || 
    combined.includes('fpv') || 
    combined.includes('panleukopenia')
  ) {
    const isCat = combined.includes('แมว') || combined.includes('feline') || combined.includes('cat') || combined.includes('felv') || combined.includes('fiv') || combined.includes('fip');
    return {
      category: 'companion',
      species: isCat ? 'แมว (Feline)' : 'สุนัข (Canine)',
      animalKind: isCat ? 'feline' : 'canine'
    };
  }

  // 6. Basic & Diagnostic Virology (Default for Ch 1, 2 or general concepts)
  return {
    category: 'diagnostic_basic',
    species: 'ไวรัสวิทยาทั่วไปและการวินิจฉัย (General & Diagnostics)',
    animalKind: 'zoonosis'
  };
}

/**
 * Build the master unified question pool
 */
function buildUnifiedPool(): VCAExamQuestion[] {
  const pool: VCAExamQuestion[] = [];

  // 1. Process 150 Chapter Master Questions
  ALL_15_CHAPTER_QUESTIONS.forEach((qItem: MasterQuestion, index: number) => {
    const catInfo = categorizeQuestion(qItem.q, qItem.virusName || '', qItem.chapter);
    const virionType = resolveVirionType(`${qItem.virusName} ${qItem.q} ${qItem.answer}`);

    pool.push({
      id: `vca_ch_${qItem.id || index}`,
      sourceId: qItem.id || `ch_${index}`,
      category: catInfo.category,
      categoryLabel: VCA_CATEGORIES_CONFIG[catInfo.category].nameTh,
      species: catInfo.species,
      chapterTitle: qItem.chapterTitle || `บทที่ ${qItem.chapter}`,
      chapterNumber: qItem.chapter,
      virusName: qItem.virusName || 'ไวรัสทางสัตวแพทย์',
      question: qItem.q,
      choices: [...qItem.choices],
      correctAnswer: qItem.answer,
      explanation: qItem.explanation,
      highYieldPearl: `จุดเน้น ศรว.ส.: ${qItem.chapterTitle} — ทำความเข้าใจคุณสมบัติเฉพาะตัวของ ${qItem.virusName || 'เชื้อไวรัส'} และกลไกการก่อโรค`,
      hint3D: {
        virionType,
        animalKind: catInfo.animalKind,
        clue: `โครงสร้างไวรัส: สังเกตลักษณะ Capsid symmetry (${virionType === 'rabies' ? 'ทรงกระสุน Bullet-shaped' : virionType === 'corona' ? 'มี Club-shaped peplomer' : 'Icosahedral'})`
      }
    });
  });

  // 2. Process Clinical Diagnostic Lab Cases (40 cases)
  ALL_15_LAB_CASES.forEach((cItem: LabCase, index: number) => {
    const catInfo = categorizeQuestion(`${cItem.title} ${cItem.history} ${cItem.laboratoryResults}`, cItem.answer, cItem.chapter, cItem.species);
    const virionType = resolveVirionType(`${cItem.title} ${cItem.answer} ${cItem.laboratoryResults}`);

    pool.push({
      id: `vca_case_${cItem.id || index}`,
      sourceId: cItem.id || `case_${index}`,
      category: catInfo.category,
      categoryLabel: VCA_CATEGORIES_CONFIG[catInfo.category].nameTh,
      species: cItem.species || catInfo.species,
      chapterTitle: `เคสคลินิกบทที่ ${cItem.chapter}`,
      chapterNumber: cItem.chapter,
      virusName: cItem.answer,
      title: cItem.title,
      vignette: `${cItem.history}\nอาการสำคัญ: ${cItem.symptoms.join(', ')}`,
      laboratoryResults: cItem.laboratoryResults,
      question: `จากประวัติ อาการ และผลตรวจทางห้องปฏิบัติการข้างต้น เชื้อก่อโรคที่เป็นสาเหตุของเคสนี้คือข้อใด?`,
      choices: [...cItem.choices],
      correctAnswer: cItem.answer,
      explanation: cItem.explanation,
      highYieldPearl: `Clinical Pearl ศรว.ส.: วินิจฉัยแยกโรคโดยอาศัย Pathognomonic lesion ร่วมกับผลยืนยันทางห้องปฏิบัติการ (Gold standard test)`,
      hint3D: {
        virionType,
        animalKind: catInfo.animalKind,
        clue: `โมเดลสัตว์ป่วย 3D: สังเกตรอยโรคเฉพาะทางคลินิกใน ${cItem.species} และผลตรวจแล็บที่พบ`
      }
    });
  });

  return pool;
}

// Master pool cache
let MASTER_VCA_POOL: VCAExamQuestion[] | null = null;

export function getMasterVCAPool(): VCAExamQuestion[] {
  if (!MASTER_VCA_POOL) {
    MASTER_VCA_POOL = buildUnifiedPool();
  }
  return MASTER_VCA_POOL;
}

/**
 * Generates a standard balanced 25-question VCA exam set
 * with randomized runtime choice shuffling (Fisher-Yates)
 */
export function generateVCAExam(targetTotal: number = 25): VCAExamQuestion[] {
  const masterPool = getMasterVCAPool();

  // Group by category
  const groups: Record<VCACategory, VCAExamQuestion[]> = {
    swine: [],
    poultry: [],
    bovine: [],
    companion: [],
    equine_zoonosis: [],
    diagnostic_basic: []
  };

  masterPool.forEach(q => {
    if (groups[q.category]) {
      groups[q.category].push(q);
    }
  });

  const selectedQuestions: VCAExamQuestion[] = [];
  const categories: VCACategory[] = [
    'swine',
    'poultry',
    'bovine',
    'companion',
    'equine_zoonosis',
    'diagnostic_basic'
  ];

  // Draw required count per category
  categories.forEach(cat => {
    const target = VCA_CATEGORIES_CONFIG[cat].targetCount;
    const shuffled = shuffleArray(groups[cat]);
    const picked = shuffled.slice(0, target);
    selectedQuestions.push(...picked);
  });

  // If total falls short of targetTotal, draw from remaining master pool
  if (selectedQuestions.length < targetTotal) {
    const selectedIds = new Set(selectedQuestions.map(q => q.id));
    const remaining = masterPool.filter(q => !selectedIds.has(q.id));
    const additional = shuffleArray(remaining).slice(0, targetTotal - selectedQuestions.length);
    selectedQuestions.push(...additional);
  }

  // Shuffle the questions order so categories are mixed realistically
  const randomizedExam = shuffleArray(selectedQuestions.slice(0, targetTotal));

  // Shuffle the choices of every question so option positions are unbiased
  return randomizedExam.map(q => {
    const shuffledChoices = shuffleArray(q.choices);
    return {
      ...q,
      choices: shuffledChoices
    };
  });
}
