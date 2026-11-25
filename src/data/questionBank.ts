export interface BCSQuestionRecord {
  id: number;
  bcsBatch: string;
  rawEdition: string;
  questionNumber: number | null;
  pageNumber: number | null;
  subject: string;
  subjectBn: string;
  question: string;
  options: string[];
  correctIndex: number | null;
  correctAnswerRaw: string | null;
  explanation: string;
  image: string | null;
}

let cachedPromise: Promise<BCSQuestionRecord[]> | null = null;
let cachedData: BCSQuestionRecord[] | null = null;

function resolveAssetUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `./${cleanPath}`;
}

const DB_CACHE_NAME = 'bcs-monster-db-v1';

/**
 * Lazily fetches and caches the 3,080-question BCS Preliminary database.
 * Uses both in-memory promise caching and the browser Cache API so repeat
 * visits load from disk in milliseconds instead of re-downloading 3.2 MB.
 */
export function loadBCSQuestionBank(): Promise<BCSQuestionRecord[]> {
  if (cachedData) {
    return Promise.resolve(cachedData);
  }
  if (!cachedPromise) {
    const url = resolveAssetUrl('data/bcs_questions.json');
    cachedPromise = (async () => {
      let response: Response | undefined;
      if (typeof caches !== 'undefined') {
        try {
          const cache = await caches.open(DB_CACHE_NAME);
          response = await cache.match(url);
          if (!response) {
            const netRes = await fetch(url);
            if (!netRes.ok) {
              throw new Error(`Failed to load BCS database (${netRes.status})`);
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
          throw new Error(`Failed to load BCS database (${response.status})`);
        }
      }
      const records = (await response.json()) as BCSQuestionRecord[];
      cachedData = records.map((r) => ({
        ...r,
        image: r.image ? resolveAssetUrl(r.image) : null
      }));
      return cachedData;
    })().catch((err) => {
      cachedPromise = null;
      throw err;
    });
  }
  return cachedPromise;
}

export function prefetchBCSQuestionBank(): void {
  void loadBCSQuestionBank().catch(() => {
    // Ignore background prefetch failures
  });
}

/**
 * Builds a 200-question BCS Preliminary mock exam set from verified 4-option MCQs.
 */
export function build200MockSet(
  records: BCSQuestionRecord[],
  count = 200
): BCSQuestionRecord[] {
  const eligible = records.filter(
    (q) =>
      q.options.length === 4 &&
      q.correctIndex !== null &&
      q.correctIndex >= 0 &&
      q.correctIndex < 4 &&
      q.question.trim().length > 0
  );

  // Fisher-Yates shuffle on a copy
  const pool = [...eligible];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(count, pool.length));
}
