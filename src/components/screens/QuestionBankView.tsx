import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  BookOpen,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  Filter,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { QuestionBank3DIllustration } from '../illustrations/Magical3DIllustrations';
import { BCSQuestionRecord, loadBCSQuestionBank } from '../../data/questionBank';

const OPTION_LETTERS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];
const PAGE_SIZE = 20;

export const QuestionBankView: React.FC = () => {
  const [questions, setQuestions] = useState<BCSQuestionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Track user's interactive practice picks per question ID
  const [pickedAnswers, setPickedAnswers] = useState<Record<number, number>>({});
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let active = true;
    loadBCSQuestionBank()
      .then((data) => {
        if (!active) return;
        setQuestions(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load question bank');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Available batches sorted numerically descending (40th -> 10th, Archive last)
  const batchOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const q of questions) {
      counts.set(q.bcsBatch, (counts.get(q.bcsBatch) ?? 0) + 1);
    }
    const sorted = Array.from(counts.entries()).sort((a, b) => {
      const numA = parseInt(a[0], 10);
      const numB = parseInt(b[0], 10);
      if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
      if (!isNaN(numA)) return -1;
      if (!isNaN(numB)) return 1;
      return a[0].localeCompare(b[0]);
    });
    return sorted;
  }, [questions]);

  const subjectOptions = useMemo(() => {
    const counts = new Map<string, { labelBn: string; count: number }>();
    for (const q of questions) {
      const prev = counts.get(q.subject);
      counts.set(q.subject, {
        labelBn: q.subjectBn,
        count: (prev?.count ?? 0) + 1
      });
    }
    return Array.from(counts.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const qLower = searchQuery.trim().toLowerCase();
    return questions.filter((item) => {
      if (selectedBatch !== 'All' && item.bcsBatch !== selectedBatch) return false;
      if (selectedSubject !== 'All' && item.subject !== selectedSubject) return false;
      if (onlyWithImages && !item.image) return false;
      if (qLower) {
        const hay = `${item.question} ${item.options.join(' ')} ${item.explanation}`.toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    });
  }, [questions, selectedBatch, selectedSubject, onlyWithImages, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredQuestions.slice(start, start + PAGE_SIZE);
  }, [filteredQuestions, safePage]);

  const handleSelectFilter = (setter: (val: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  return (
    <div className="section-card-qb rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 lg:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
        <QuestionBank3DIllustration className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 animate-float-gentle" />
        <div className="text-center sm:text-left space-y-2 flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/40 text-sky-800 dark:text-sky-200 font-rounded font-bold text-xs">
            <Database className="w-3.5 h-3.5 text-sky-500" />
            <span>
              {loading
                ? 'Loading BCS Database...'
                : `${questions.length.toLocaleString()} Questions • 10th–40th BCS`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-rounded font-bold theme-text-primary">
            BCS Question Bank
          </h1>
          <p className="theme-text-secondary font-bangla text-sm sm:text-base">
            ১০ম থেকে ৪০তম বিসিএস প্রিলিমিনারি প্রশ্নব্যাংক — ব্যাচ, বিষয় বা কীওয়ার্ড দিয়ে অনুশীলন করুন
          </p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl theme-subcard space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="প্রশ্ন বা উত্তর খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-300/60 dark:border-slate-700/70 font-bangla text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* BCS Batch Filter */}
          <div className="relative">
            <Filter className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedBatch}
              onChange={(e) => handleSelectFilter(setSelectedBatch, e.target.value)}
              aria-label="Filter by BCS Batch"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-300/60 dark:border-slate-700/70 font-rounded font-semibold text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="All">All BCS Batches ({questions.length})</option>
              {batchOptions.map(([batch, cnt]) => (
                <option key={batch} value={batch}>
                  {batch} ({cnt})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="relative">
            <BookOpen className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedSubject}
              onChange={(e) => handleSelectFilter(setSelectedSubject, e.target.value)}
              aria-label="Filter by Subject"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-300/60 dark:border-slate-700/70 font-rounded font-semibold text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="All">All Subjects ({questions.length})</option>
              {subjectOptions.map(([subj, meta]) => (
                <option key={subj} value={subj}>
                  {subj} ({meta.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setOnlyWithImages((v) => !v);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-rounded font-bold text-xs transition-all cursor-pointer border ${
                onlyWithImages
                  ? 'bg-sky-600 text-white border-sky-400 shadow-sm'
                  : 'bg-white/60 dark:bg-slate-800/60 border-slate-300/60 dark:border-slate-700/60 theme-text-secondary'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Diagram Questions Only (23)</span>
            </button>

            {(selectedBatch !== 'All' ||
              selectedSubject !== 'All' ||
              onlyWithImages ||
              searchQuery.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBatch('All');
                  setSelectedSubject('All');
                  setOnlyWithImages(false);
                  setSearchQuery('');
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 font-rounded font-bold text-xs cursor-pointer hover:bg-rose-500/25 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>

          <span className="font-rounded font-semibold text-xs theme-text-secondary">
            Showing {filteredQuestions.length.toLocaleString()} matching questions • Page {safePage} / {totalPages}
          </span>
        </div>
      </div>

      {/* Loading / Error / Empty States */}
      {loading && (
        <div className="p-10 rounded-3xl theme-subcard text-center font-rounded font-bold theme-text-secondary">
          Loading 3,080 BCS Preliminary questions...
        </div>
      )}

      {error && (
        <div className="p-6 rounded-3xl bg-rose-500/15 border border-rose-400/40 text-rose-800 dark:text-rose-200 font-rounded font-bold text-sm">
          {error}
        </div>
      )}

      {!loading && !error && pageItems.length === 0 && (
        <div className="p-10 rounded-3xl theme-subcard text-center space-y-2">
          <p className="font-rounded font-bold theme-text-primary">No matching questions found</p>
          <p className="font-bangla text-sm theme-text-secondary">
            অন্য কোনো ব্যাচ, বিষয় বা কীওয়ার্ড দিয়ে আবার চেষ্টা করুন।
          </p>
        </div>
      )}

      {/* Question Cards List */}
      {!loading && !error && pageItems.length > 0 && (
        <div className="space-y-4">
          {pageItems.map((q) => {
            const picked = pickedAnswers[q.id];
            const isPicked = picked !== undefined;
            const showExp = expandedExplanations[q.id] || isPicked;

            return (
              <article
                key={q.id}
                className="p-4 sm:p-6 rounded-3xl theme-subcard space-y-4 shadow-sm"
              >
                {/* Metadata badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white font-rounded font-bold text-xs">
                      #{q.id}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-900 dark:text-amber-200 font-rounded font-bold text-xs">
                      {q.bcsBatch}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-400/40 text-sky-900 dark:text-sky-200 font-rounded font-bold text-xs">
                      {q.subject}
                    </span>
                    {q.pageNumber !== null && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-500/15 theme-text-muted font-rounded font-semibold text-[11px]">
                        p.{q.pageNumber}
                        {q.questionNumber ? ` • Q${q.questionNumber}` : ''}
                      </span>
                    )}
                  </div>

                  {q.explanation && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedExplanations((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-violet-500/15 text-violet-700 dark:text-violet-300 font-rounded font-bold text-xs cursor-pointer hover:bg-violet-500/25 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{showExp ? 'Hide Explanation' : 'Show Answer'}</span>
                    </button>
                  )}
                </div>

                {/* Question text */}
                <h2 className="font-bangla font-bold text-base sm:text-lg theme-text-primary leading-relaxed">
                  {q.question}
                </h2>

                {/* Cropped diagram image if present */}
                {q.image && (
                  <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-950/70 border border-slate-300/60 dark:border-slate-700/70 inline-block max-w-full">
                    <img
                      src={q.image}
                      alt={`Question ${q.id} diagram`}
                      className="max-h-56 w-auto rounded-xl object-contain"
                    />
                  </div>
                )}

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, idx) => {
                    const isThisPicked = picked === idx;
                    const isCorrectOpt = q.correctIndex === idx;
                    const reveal = isPicked || showExp;

                    let cardCls =
                      'bg-white/65 dark:bg-slate-900/55 border-slate-300/60 dark:border-slate-700/70 theme-text-primary hover:border-sky-400';
                    if (reveal && isCorrectOpt) {
                      cardCls =
                        'bg-emerald-500/20 border-emerald-500 text-emerald-950 dark:text-emerald-100';
                    } else if (reveal && isThisPicked && !isCorrectOpt) {
                      cardCls = 'bg-rose-500/20 border-rose-500 text-rose-950 dark:text-rose-100';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setPickedAnswers((prev) => ({
                            ...prev,
                            [q.id]: idx
                          }))
                        }
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${cardCls}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 font-bangla font-bold text-xs flex items-center justify-center shrink-0">
                            {OPTION_LETTERS[idx] ?? idx + 1}
                          </span>
                          <span className="font-bangla font-semibold text-sm sm:text-base break-words">
                            {opt}
                          </span>
                        </div>
                        {reveal && isCorrectOpt && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        {reveal && isThisPicked && !isCorrectOpt && (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {showExp && (q.explanation || q.correctAnswerRaw) && (
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 font-bangla text-xs sm:text-sm theme-text-secondary leading-relaxed space-y-1">
                    {q.correctIndex === null && q.correctAnswerRaw && (
                      <div className="font-bold text-emerald-700 dark:text-emerald-300">
                        উত্তর: {q.correctAnswerRaw}
                      </div>
                    )}
                    {q.explanation && <div>{q.explanation}</div>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl theme-subcard font-rounded font-bold text-sm theme-text-primary disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="font-rounded font-bold text-xs sm:text-sm theme-text-secondary">
            Page {safePage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-rounded font-bold text-sm shadow-md disabled:opacity-40 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
