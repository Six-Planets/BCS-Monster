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

/**
 * Lazily fetches and caches the 3,080-question BCS Preliminary database.
 * Uses an in-memory promise cache so repeated calls share one network request.
 */
export function loadBCSQuestionBank(): Promise<BCSQuestionRecord[]> {
  if (cachedData) {
    return Promise.resolve(cachedData);
  }
  if (!cachedPromise) {
    cachedPromise = fetch(resolveAssetUrl('data/bcs_questions.json'))
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load BCS database (${res.status})`);
        }
        return res.json() as Promise<BCSQuestionRecord[]>;
      })
      .then((records) => {
        cachedData = records.map((r) => ({
          ...r,
          image: r.image ? resolveAssetUrl(r.image) : null
        }));
        return cachedData;
      })
      .catch((err) => {
        cachedPromise = null;
        throw err;
      });
  }
  return cachedPromise;
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
