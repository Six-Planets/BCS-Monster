import { APP_VERSION } from '../lib/updater';

export interface BCSQuestionRecord {
  id: number;
  bcsBatch: string;
  rawEdition: string;
  questionNumber: number | null;
  pageNumber: number | null;
  subject: string;
  subjectBn: string;
  officialSubject: string;
  topicId: string;
  syllabusTopic: string;
  syllabusSubtopic: string;
  isExtraTopic: boolean;
  questionType: string;
  bpscTrendTag: string;
  sameTypeCount: number;
  fitReason: string;
  question: string;
  options: string[];
  correctIndex: number | null;
  correctAnswerRaw: string | null;
  explanation: string;
  image: string | null;
}

export interface IndexSectionSummary {
  topic: string;
  marks: number | null;
  count: number;
  subtopics: [string, number][];
  topTrends: [string, number][];
}

export interface IndexSubjectSummary {
  subject: string;
  slug: string;
  total: number;
  examCount: number;
  subtopicCount: number;
  era: [number, number, number, number];
  sections: IndexSectionSummary[];
}

export interface IndexTrendSummary {
  tag: string;
  count: number;
  recent: number;
  latest: number;
  examSpread: number;
  subject: string;
  slugs: string[];
}

export interface IndexExtraTopicSummary {
  topic: string;
  subject: string;
  slug: string;
  count: number;
  exams: string[];
}

export interface BCSIndexDocument {
  version: 2;
  total: number;
  officialTotal: number;
  extraTotal: number;
  examCount: number;
  subjectSlugs: Record<string, string>;
  subjects: IndexSubjectSummary[];
  trends: IndexTrendSummary[];
  extraTopics: IndexExtraTopicSummary[];
}

interface CompactCatalogEntry {
  serial: number;
  s: string;
  sBn: string;
  os: string;
  t: string;
  st: string;
}

interface CompactQuestionRow {
  id: number;
  b: string;
  ed: string;
  qn: number | null;
  pg: number | null;
  tid: string;
  q: string;
  o: string[];
  ci: number | null;
  ca: string | null;
  ex: string;
  qt: string;
  tr: string;
  tc: number;
  fr: string;
  im?: string;
  s?: string;
  sBn?: string;
  os?: string;
  t?: string;
  st?: string;
}

interface CompactBankPayload {
  version: 2;
  total: number;
  catalog: Record<string, CompactCatalogEntry>;
  questions: CompactQuestionRow[];
}

let cachedPromise: Promise<BCSQuestionRecord[]> | null = null;
let cachedData: BCSQuestionRecord[] | null = null;

let cachedIndexPromise: Promise<BCSIndexDocument> | null = null;
let cachedIndex: BCSIndexDocument | null = null;

const subjectPackCache = new Map<string, BCSQuestionRecord[]>();
const subjectPackPromises = new Map<string, Promise<BCSQuestionRecord[]>>();

function resolveAssetUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `./${cleanPath}`;
}

// One cache per release, so a re-deployed question bank is never served stale.
const DB_CACHE_NAME = `bcs-monster-db-${APP_VERSION}`;
if (typeof caches !== 'undefined') {
  void caches
    .keys()
    .then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('bcs-monster-db-') && k !== DB_CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
    .catch(() => undefined);
}

async function fetchCachedJson<T>(relativePath: string): Promise<T> {
  const url = resolveAssetUrl(relativePath);
  let response: Response | undefined;
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(DB_CACHE_NAME);
      response = await cache.match(url);
      if (!response) {
        const netRes = await fetch(url);
        if (!netRes.ok) {
          throw new Error(`Failed to load ${relativePath} (${netRes.status})`);
        }
        await cache.put(url, netRes.clone());
        response = netRes;
      }
    } catch {
      response = undefined;
    }
  }
  if (!response) {
    response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${relativePath} (${response.status})`);
    }
  }
  return (await response.json()) as T;
}

function hydrateBank(raw: CompactBankPayload | BCSQuestionRecord[]): BCSQuestionRecord[] {
  if (Array.isArray(raw)) {
    return raw.map((r) => ({
      ...r,
      officialSubject: r.officialSubject || r.subject,
      topicId: r.topicId || 'EXTRA',
      syllabusTopic: r.syllabusTopic || r.subjectBn || r.subject,
      syllabusSubtopic: r.syllabusSubtopic || r.subjectBn || r.subject,
      isExtraTopic: Boolean(r.isExtraTopic),
      questionType: r.questionType || 'Standard MCQ',
      bpscTrendTag: r.bpscTrendTag || 'General BCS Pattern',
      sameTypeCount: r.sameTypeCount || 1,
      fitReason: r.fitReason || '',
      image: r.image ? resolveAssetUrl(r.image) : null
    }));
  }

  const catalog = raw.catalog || {};
  return raw.questions.map((row) => {
    const cat = row.tid !== 'EXTRA' ? catalog[row.tid] : undefined;
    const isExtra = !cat;
    return {
      id: row.id,
      bcsBatch: row.b,
      rawEdition: row.ed,
      questionNumber: row.qn,
      pageNumber: row.pg,
      subject: cat ? cat.s : row.s || 'Special Cadre (Medical/Dental)',
      subjectBn: cat ? cat.sBn : row.sBn || 'স্পেশাল ক্যাডার (মেডিকেল/ডেন্টাল)',
      officialSubject: cat ? cat.os : row.os || 'Professional / Special Cadre (Medical/Dental)',
      topicId: cat ? row.tid : 'EXTRA',
      syllabusTopic: cat ? cat.t : row.t || '[Extra Topic]',
      syllabusSubtopic: cat ? cat.st : row.st || row.t || '[Extra Topic]',
      isExtraTopic: isExtra,
      questionType: row.qt || 'Standard MCQ',
      bpscTrendTag: row.tr || 'General BCS Pattern',
      sameTypeCount: row.tc || 1,
      fitReason: row.fr || '',
      question: row.q,
      options: row.o,
      correctIndex: row.ci,
      correctAnswerRaw: row.ca,
      explanation: row.ex,
      image: row.im ? resolveAssetUrl(row.im) : null
    };
  });
}

/**
 * Loads the tiny ~19.5 KB gzipped precomputed BCS syllabus & trend index.
 * Makes Topic Master open in <30ms without downloading or parsing all 5,655 questions.
 */
export function loadBCSIndex(): Promise<BCSIndexDocument> {
  if (cachedIndex) return Promise.resolve(cachedIndex);
  if (!cachedIndexPromise) {
    cachedIndexPromise = fetchCachedJson<BCSIndexDocument>('data/bcs_index.json')
      .then((doc) => {
        cachedIndex = doc;
        return doc;
      })
      .catch((err) => {
        cachedIndexPromise = null;
        throw err;
      });
  }
  return cachedIndexPromise;
}

/**
 * Loads a single subject pack (~24–214 KB gzipped) on demand and caches it.
 * If the full 5,655-question bank is already in memory, filters synchronously with zero network.
 */
export function loadSubjectPack(slug: string, subjectName?: string): Promise<BCSQuestionRecord[]> {
  if (subjectPackCache.has(slug)) {
    return Promise.resolve(subjectPackCache.get(slug)!);
  }
  if (cachedData && subjectName) {
    const filtered = cachedData.filter((q) => q.subject === subjectName);
    subjectPackCache.set(slug, filtered);
    return Promise.resolve(filtered);
  }
  const existing = subjectPackPromises.get(slug);
  if (existing) return existing;

  const p = fetchCachedJson<CompactBankPayload>(`data/subjects/${slug}.json`)
    .then((raw) => {
      const hydrated = hydrateBank(raw);
      subjectPackCache.set(slug, hydrated);
      subjectPackPromises.delete(slug);
      return hydrated;
    })
    .catch((err) => {
      subjectPackPromises.delete(slug);
      throw err;
    });
  subjectPackPromises.set(slug, p);
  return p;
}

export async function loadSubjectPacks(slugs: string[]): Promise<BCSQuestionRecord[]> {
  const unique = Array.from(new Set(slugs.filter(Boolean)));
  const lists = await Promise.all(unique.map((s) => loadSubjectPack(s)));
  return lists.flat();
}

/**
 * Lazily fetches and caches the full 5,655-question classified BCS Preliminary database (10th–50th BCS).
 */
export function loadBCSQuestionBank(): Promise<BCSQuestionRecord[]> {
  if (cachedData) {
    return Promise.resolve(cachedData);
  }
  if (!cachedPromise) {
    cachedPromise = fetchCachedJson<CompactBankPayload | BCSQuestionRecord[]>('data/bcs_questions.json')
      .then((raw) => {
        cachedData = hydrateBank(raw);
        return cachedData;
      })
      .catch((err) => {
        cachedPromise = null;
        throw err;
      });
  }
  return cachedPromise;
}

export function prefetchBCSQuestionBank(): void {
  // Always prefetch the tiny 19.5 KB index first so Topic Master is instant!
  void loadBCSIndex().catch(() => undefined);
  void loadBCSQuestionBank().catch(() => undefined);
}

/**
 * Builds a 200-question BCS Preliminary mock exam set from verified 4-option official-syllabus MCQs.
 */
export function build200MockSet(
  records: BCSQuestionRecord[],
  count = 200
): BCSQuestionRecord[] {
  const isPlayable = (q: BCSQuestionRecord) =>
    q.options.length === 4 &&
    q.correctIndex !== null &&
    q.correctIndex >= 0 &&
    q.correctIndex < 4 &&
    q.question.trim().length > 0;

  const officialEligible = records.filter((q) => !q.isExtraTopic && isPlayable(q));
  const pool =
    officialEligible.length >= count
      ? [...officialEligible]
      : records.filter(isPlayable);

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(count, pool.length));
}
