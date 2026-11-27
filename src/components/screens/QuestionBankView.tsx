import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Sparkles,
  Layers,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Tag,
  RotateCcw,
  Info
} from 'lucide-react';
import { QuestionBank3DIllustration } from '../illustrations/Magical3DIllustrations';
import { BCSQuestionRecord, loadBCSQuestionBank } from '../../data/questionBank';

const OPTION_LETTERS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];
const PAGE_SIZE = 25;

type TopicScope = 'all' | 'official' | 'extra';

function countByKey(
  items: BCSQuestionRecord[],
  picker: (q: BCSQuestionRecord) => string
): [string, number][] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = picker(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

export const QuestionBankView: React.FC = () => {
  const [questions, setQuestions] = useState<BCSQuestionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Strict 4-level filters + BPSC trend + search
  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [topicScope, setTopicScope] = useState<TopicScope>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('All');
  const [selectedTrend, setSelectedTrend] = useState<string>('All');
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [page, setPage] = useState(1);

  // Track user's interactive practice picks per question ID
  const [pickedAnswers, setPickedAnswers] = useState<Record<number, number>>({});
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});
  const listTopRef = useRef<HTMLDivElement | null>(null);

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

  // 1. BCS Tomo options sorted descending (50th -> 10th)
  const batchOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const q of questions) {
      counts.set(q.bcsBatch, (counts.get(q.bcsBatch) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => {
      const numA = parseInt(a[0], 10);
      const numB = parseInt(b[0], 10);
      if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
      if (!isNaN(numA)) return -1;
      if (!isNaN(numB)) return 1;
      return a[0].localeCompare(b[0]);
    });
  }, [questions]);

  // 2. Official Subject options sorted by count
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

  // 3. Cascading Official Syllabus Topics (filtered by selectedSubject + topicScope)
  const topicOptions = useMemo(() => {
    const base = questions.filter((q) => {
      if (selectedSubject !== 'All' && q.subject !== selectedSubject) return false;
      if (topicScope === 'official' && q.isExtraTopic) return false;
      if (topicScope === 'extra' && !q.isExtraTopic) return false;
      return true;
    });
    return countByKey(base, (q) => q.syllabusTopic);
  }, [questions, selectedSubject, topicScope]);

  // 4. Cascading Subtopics (only when a specific syllabus topic is selected)
  const subtopicOptions = useMemo(() => {
    if (selectedTopic === 'All') return [];
    const base = questions.filter((q) => {
      if (selectedSubject !== 'All' && q.subject !== selectedSubject) return false;
      return q.syllabusTopic === selectedTopic;
    });
    const list = countByKey(base, (q) => q.syllabusSubtopic);
    return list.length > 1 ? list : [];
  }, [questions, selectedSubject, selectedTopic]);

  // Top recurring BPSC Trend clusters (top 150 by frequency)
  const trendOptions = useMemo(() => {
    const base =
      selectedSubject === 'All'
        ? questions
        : questions.filter((q) => q.subject === selectedSubject);
    return countByKey(base, (q) => q.bpscTrendTag).slice(0, 150);
  }, [questions, selectedSubject]);

  const totalDiagramCount = useMemo(
    () => questions.reduce((acc, q) => acc + (q.image ? 1 : 0), 0),
    [questions]
  );

  // Apply all filters
  const filteredQuestions = useMemo(() => {
    const qLower = searchQuery.trim().toLowerCase();
    return questions.filter((item) => {
      if (selectedBatch !== 'All' && item.bcsBatch !== selectedBatch) return false;
      if (selectedSubject !== 'All' && item.subject !== selectedSubject) return false;
      if (topicScope === 'official' && item.isExtraTopic) return false;
      if (topicScope === 'extra' && !item.isExtraTopic) return false;
      if (selectedTopic !== 'All' && item.syllabusTopic !== selectedTopic) return false;
      if (selectedSubtopic !== 'All' && item.syllabusSubtopic !== selectedSubtopic) return false;
      if (selectedTrend !== 'All' && item.bpscTrendTag !== selectedTrend) return false;
      if (onlyWithImages && !item.image) return false;
      if (qLower) {
        const hay =
          `${item.question} ${item.options.join(' ')} ${item.explanation} ${item.syllabusTopic} ${item.syllabusSubtopic} ${item.bpscTrendTag} ${item.questionType} ${item.fitReason} ${item.subjectBn} ${item.bcsBatch}`.toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    });
  }, [
    questions,
    selectedBatch,
    selectedSubject,
    topicScope,
    selectedTopic,
    selectedSubtopic,
    selectedTrend,
    onlyWithImages,
    searchQuery
  ]);

  // Live analytics derived from filteredQuestions
  const analytics = useMemo(() => {
    let extraCount = 0;
    let diagramCount = 0;
    const examSet = new Set<string>();
    const subjMap = new Map<string, { labelBn: string; count: number }>();
    const topicMap = new Map<string, number>();
    const trendMap = new Map<string, number>();

    for (const q of filteredQuestions) {
      if (q.isExtraTopic) extraCount += 1;
      if (q.image) diagramCount += 1;
      examSet.add(q.bcsBatch);

      const prevSubj = subjMap.get(q.subject);
      subjMap.set(q.subject, {
        labelBn: q.subjectBn,
        count: (prevSubj?.count ?? 0) + 1
      });
      topicMap.set(q.syllabusTopic, (topicMap.get(q.syllabusTopic) ?? 0) + 1);
      trendMap.set(q.bpscTrendTag, (trendMap.get(q.bpscTrendTag) ?? 0) + 1);
    }

    const bySubject = Array.from(subjMap.entries())
      .map(([name, meta]) => ({ key: name, label: name, sublabel: meta.labelBn, count: meta.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 11);

    const byTopic = Array.from(topicMap.entries())
      .map(([name, count]) => ({ key: name, label: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const byTrend = Array.from(trendMap.entries())
      .map(([name, count]) => ({ key: name, label: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    return {
      total: filteredQuestions.length,
      exams: examSet.size,
      official: filteredQuestions.length - extraCount,
      extra: extraCount,
      diagrams: diagramCount,
      bySubject,
      byTopic,
      byTrend
    };
  }, [filteredQuestions]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredQuestions.slice(start, start + PAGE_SIZE);
  }, [filteredQuestions, safePage]);

  const hasActiveFilters =
    selectedBatch !== 'All' ||
    selectedSubject !== 'All' ||
    topicScope !== 'all' ||
    selectedTopic !== 'All' ||
    selectedSubtopic !== 'All' ||
    selectedTrend !== 'All' ||
    onlyWithImages ||
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedBatch('All');
    setSelectedSubject('All');
    setTopicScope('all');
    setSelectedTopic('All');
    setSelectedSubtopic('All');
    setSelectedTrend('All');
    setOnlyWithImages(false);
    setSearchQuery('');
    setPage(1);
  };

  const handleSubjectChange = (nextSubject: string) => {
    setSelectedSubject(nextSubject);
    setSelectedTopic('All');
    setSelectedSubtopic('All');
    setSelectedTrend('All');
    setPage(1);
  };

  const handleScopeChange = (nextScope: TopicScope) => {
    setTopicScope(nextScope);
    setSelectedTopic('All');
    setSelectedSubtopic('All');
    setPage(1);
  };

  const handleTopicChange = (nextTopic: string) => {
    setSelectedTopic(nextTopic);
    setSelectedSubtopic('All');
    setPage(1);
  };

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="section-card-qb rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-7 lg:p-9 space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <QuestionBank3DIllustration className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 animate-float-gentle" />
        <div className="text-center sm:text-left space-y-1.5 flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/40 text-sky-800 dark:text-sky-200 font-rounded font-bold text-xs">
            <Database className="w-3.5 h-3.5 text-sky-500" />
            <span>
              {loading
                ? 'Loading BCS Database...'
                : `${questions.length.toLocaleString()} Classified Questions • 10th–50th BCS (${batchOptions.length} Exams)`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-rounded font-bold theme-text-primary">
            BCS Question Bank &amp; Syllabus Explorer
          </h1>
          <p className="theme-text-secondary font-bangla text-sm sm:text-base">
            ১০ম থেকে ৫০তম বিসিএস প্রিলিমিনারি — অফিসিয়াল সিলেবাস, টপিক, সাব-টপিক ও BPSC ট্রেন্ড অ্যানালিটিক্স
          </p>
        </div>
      </div>

      {/* Live 5-KPI Summary Strip */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
          {[
            {
              label: 'Matching Questions',
              value: analytics.total.toLocaleString(),
              tone: 'text-sky-600 dark:text-sky-300'
            },
            {
              label: 'BCS Exams',
              value: String(analytics.exams),
              tone: 'text-indigo-600 dark:text-indigo-300'
            },
            {
              label: 'Official Syllabus',
              value: analytics.official.toLocaleString(),
              tone: 'text-emerald-600 dark:text-emerald-300'
            },
            {
              label: '[Extra Topic]',
              value: analytics.extra.toLocaleString(),
              tone: 'text-amber-600 dark:text-amber-300'
            },
            {
              label: 'Diagram Images',
              value: String(analytics.diagrams),
              tone: 'text-fuchsia-600 dark:text-fuchsia-300'
            }
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="px-3.5 py-3 rounded-2xl theme-subcard text-center sm:text-left"
            >
              <div className={`text-xl sm:text-2xl font-rounded font-bold leading-tight ${kpi.tone}`}>
                {kpi.value}
              </div>
              <div className="text-[11px] sm:text-xs font-rounded font-semibold theme-text-muted mt-0.5">
                {kpi.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Strict 4-Level Hierarchical Filters & Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl theme-subcard space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Level 1: BCS Tomo */}
          <div className="space-y-1">
            <label className="block text-[11px] font-rounded font-bold uppercase tracking-wider theme-text-muted pl-1">
              1. BCS Tomo
            </label>
            <div className="relative">
              <Filter className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedBatch}
                onChange={(e) => {
                  setSelectedBatch(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by BCS Tomo"
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white/75 dark:bg-slate-900/65 border border-slate-300/60 dark:border-slate-700/70 font-rounded font-semibold text-xs sm:text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="All">All BCS Exams ({questions.length.toLocaleString()})</option>
                {batchOptions.map(([batch, cnt]) => (
                  <option key={batch} value={batch}>
                    {batch} ({cnt})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Level 2: Official Subject */}
          <div className="space-y-1">
            <label className="block text-[11px] font-rounded font-bold uppercase tracking-wider theme-text-muted pl-1">
              2. Official Subject
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                aria-label="Filter by Official Subject"
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white/75 dark:bg-slate-900/65 border border-slate-300/60 dark:border-slate-700/70 font-rounded font-semibold text-xs sm:text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="All">All Subjects ({questions.length.toLocaleString()})</option>
                {subjectOptions.map(([subj, meta]) => (
                  <option key={subj} value={subj}>
                    {subj} ({meta.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Level 3: Exact Syllabus Topic */}
          <div className="space-y-1">
            <label className="block text-[11px] font-rounded font-bold uppercase tracking-wider theme-text-muted pl-1">
              3. Syllabus Topic
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedTopic}
                onChange={(e) => handleTopicChange(e.target.value)}
                aria-label="Filter by Official Syllabus Topic"
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white/75 dark:bg-slate-900/65 border border-slate-300/60 dark:border-slate-700/70 font-bangla font-semibold text-xs sm:text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="All">All Topics ({topicOptions.length})</option>
                {topicOptions.map(([topic, cnt]) => (
                  <option key={topic} value={topic}>
                    {truncate(topic, 58)} ({cnt})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Level 4: BPSC Trend Cluster */}
          <div className="space-y-1">
            <label className="block text-[11px] font-rounded font-bold uppercase tracking-wider theme-text-muted pl-1">
              4. BPSC Recurring Trend
            </label>
            <div className="relative">
              <TrendingUp className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedTrend}
                onChange={(e) => {
                  setSelectedTrend(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by BPSC Trend Cluster"
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white/75 dark:bg-slate-900/65 border border-slate-300/60 dark:border-slate-700/70 font-rounded font-semibold text-xs sm:text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="All">All BPSC Trends</option>
                {trendOptions.map(([trend, cnt]) => (
                  <option key={trend} value={trend}>
                    {truncate(trend, 46)} ({cnt}x)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cascading Subtopic selector (when topic has multiple official subtopics) + Full-text Search */}
        <div
          className={`grid grid-cols-1 ${
            subtopicOptions.length > 0 ? 'md:grid-cols-2' : ''
          } gap-3`}
        >
          {subtopicOptions.length > 0 && (
            <div className="relative">
              <Tag className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedSubtopic}
                onChange={(e) => {
                  setSelectedSubtopic(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by Exact Official Subtopic"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/75 dark:bg-slate-900/65 border border-violet-400/50 dark:border-violet-500/50 font-bangla font-semibold text-xs sm:text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
              >
                <option value="All">All Official Subtopics ({subtopicOptions.length})</option>
                {subtopicOptions.map(([st, cnt]) => (
                  <option key={st} value={st}>
                    {truncate(st, 72)} ({cnt})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="প্রশ্ন, অপশন, সিলেবাস টপিক, সাব-টপিক বা BPSC ট্রেন্ড খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/75 dark:bg-slate-900/65 border border-slate-300/60 dark:border-slate-700/70 font-bangla text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Quick Toggle Pills Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Syllabus Scope segmented pills */}
            <div className="inline-flex rounded-xl p-0.5 bg-white/60 dark:bg-slate-900/60 border border-slate-300/60 dark:border-slate-700/60">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'official', label: 'Official Syllabus' },
                  { id: 'extra', label: '[Extra Topics]' }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleScopeChange(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-rounded font-bold text-xs transition-all cursor-pointer ${
                    topicScope === tab.id
                      ? tab.id === 'extra'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-sky-600 text-white shadow-xs'
                      : 'theme-text-secondary hover:theme-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setOnlyWithImages((v) => !v);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-rounded font-bold text-xs transition-all cursor-pointer border ${
                onlyWithImages
                  ? 'bg-fuchsia-600 text-white border-fuchsia-400 shadow-sm'
                  : 'bg-white/60 dark:bg-slate-800/60 border-slate-300/60 dark:border-slate-700/60 theme-text-secondary'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Diagrams ({totalDiagramCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAnalytics((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-rounded font-bold text-xs transition-all cursor-pointer border ${
                showAnalytics
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                  : 'bg-white/60 dark:bg-slate-800/60 border-slate-300/60 dark:border-slate-700/60 theme-text-secondary'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics Charts</span>
              {showAnalytics ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 font-rounded font-bold text-xs cursor-pointer hover:bg-rose-500/25 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="font-rounded font-semibold text-xs theme-text-secondary">
            Showing {filteredQuestions.length.toLocaleString()} matching • Page {safePage} / {totalPages}
          </span>
        </div>
      </div>

      {/* Live Interactive Visual Analytics Charts */}
      {!loading && !error && showAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          {/* Chart 1: Official Subject */}
          <div className="p-4 rounded-3xl theme-subcard space-y-3 max-h-[320px] overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-rounded font-bold text-sm text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>By Official Subject</span>
              </h3>
              <span className="text-[11px] font-rounded theme-text-muted">Click bar to filter</span>
            </div>
            <div className="space-y-2">
              {analytics.bySubject.map((row) => {
                const maxVal = analytics.bySubject[0]?.count || 1;
                const pct = Math.max(4, Math.round((row.count / maxVal) * 100));
                const isActive = selectedSubject === row.key;
                return (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => handleSubjectChange(isActive ? 'All' : row.key)}
                    className={`w-full text-left group rounded-xl p-1.5 -mx-1.5 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-sky-500/15 ring-1 ring-sky-400/50'
                        : 'hover:bg-slate-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs mb-1">
                      <span className="font-rounded font-semibold theme-text-primary truncate">
                        {row.label}
                      </span>
                      <strong className="font-rounded text-sky-700 dark:text-sky-300 shrink-0">
                        {row.count.toLocaleString()}
                      </strong>
                    </div>
                    <div className="h-2 rounded-full bg-slate-400/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
              {analytics.bySubject.length === 0 && (
                <p className="text-xs font-rounded theme-text-muted">No matching data</p>
              )}
            </div>
          </div>

          {/* Chart 2: Top Official Syllabus Topics (or Extra Topics) */}
          <div className="p-4 rounded-3xl theme-subcard space-y-3 max-h-[320px] overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-rounded font-bold text-sm text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 shrink-0" />
                <span>
                  {topicScope === 'extra' ? 'Top [Extra Topics]' : 'Top Syllabus Topics'}
                </span>
              </h3>
              <span className="text-[11px] font-rounded theme-text-muted">Click bar to filter</span>
            </div>
            <div className="space-y-2">
              {analytics.byTopic.map((row) => {
                const maxVal = analytics.byTopic[0]?.count || 1;
                const pct = Math.max(4, Math.round((row.count / maxVal) * 100));
                const isActive = selectedTopic === row.key;
                const isExtraRow = row.key.startsWith('[Extra Topic]');
                return (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => handleTopicChange(isActive ? 'All' : row.key)}
                    className={`w-full text-left group rounded-xl p-1.5 -mx-1.5 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-violet-500/15 ring-1 ring-violet-400/50'
                        : 'hover:bg-slate-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs mb-1">
                      <span className="font-bangla font-semibold theme-text-primary truncate">
                        {row.label}
                      </span>
                      <strong
                        className={`font-rounded shrink-0 ${
                          isExtraRow
                            ? 'text-amber-600 dark:text-amber-300'
                            : 'text-violet-700 dark:text-violet-300'
                        }`}
                      >
                        {row.count.toLocaleString()}
                      </strong>
                    </div>
                    <div className="h-2 rounded-full bg-slate-400/20 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isExtraRow
                            ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                            : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
              {analytics.byTopic.length === 0 && (
                <p className="text-xs font-rounded theme-text-muted">No matching data</p>
              )}
            </div>
          </div>

          {/* Chart 3: Top BPSC Recurring Trends */}
          <div className="p-4 rounded-3xl theme-subcard space-y-3 max-h-[320px] overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-rounded font-bold text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Top BPSC Recurring Trends</span>
              </h3>
              <span className="text-[11px] font-rounded theme-text-muted">Click bar to filter</span>
            </div>
            <div className="space-y-2">
              {analytics.byTrend.map((row) => {
                const maxVal = analytics.byTrend[0]?.count || 1;
                const pct = Math.max(4, Math.round((row.count / maxVal) * 100));
                const isActive = selectedTrend === row.key;
                return (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => {
                      setSelectedTrend(isActive ? 'All' : row.key);
                      setPage(1);
                    }}
                    className={`w-full text-left group rounded-xl p-1.5 -mx-1.5 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/15 ring-1 ring-emerald-400/50'
                        : 'hover:bg-slate-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs mb-1">
                      <span className="font-rounded font-semibold theme-text-primary truncate">
                        {row.label}
                      </span>
                      <strong className="font-rounded text-emerald-700 dark:text-emerald-300 shrink-0">
                        {row.count}x
                      </strong>
                    </div>
                    <div className="h-2 rounded-full bg-slate-400/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
              {analytics.byTrend.length === 0 && (
                <p className="text-xs font-rounded theme-text-muted">No matching data</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Anchor for pagination scroll */}
      <div ref={listTopRef} />

      {/* Loading / Error / Empty States */}
      {loading && (
        <div className="p-10 rounded-3xl theme-subcard text-center font-rounded font-bold theme-text-secondary">
          Loading 5,655 classified BCS Preliminary questions (10th–50th BCS)...
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
            অন্য কোনো বিসিএস ব্যাচ, বিষয়, সিলেবাস টপিক বা কীওয়ার্ড দিয়ে আবার চেষ্টা করুন।
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
                className="p-4 sm:p-6 rounded-3xl theme-subcard space-y-3.5 shadow-sm"
              >
                {/* Strict 4-Level Metadata Badges */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-rounded font-bold text-xs">
                      {q.bcsBatch}
                      {q.questionNumber ? ` • Q${q.questionNumber}` : ` • #${q.id}`}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/40 text-sky-900 dark:text-sky-200 font-rounded font-bold text-xs">
                      {q.subject}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full border font-bangla font-bold text-xs ${
                        q.isExtraTopic
                          ? 'bg-amber-500/20 border-amber-400/50 text-amber-900 dark:text-amber-200'
                          : 'bg-violet-500/15 border-violet-400/40 text-violet-900 dark:text-violet-200'
                      }`}
                    >
                      {truncate(q.syllabusTopic, 52)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTrend(selectedTrend === q.bpscTrendTag ? 'All' : q.bpscTrendTag);
                        setPage(1);
                      }}
                      title="Filter questions with this BPSC trend"
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-900 dark:text-emerald-200 font-rounded font-bold text-[11px] hover:bg-emerald-500/25 transition-colors cursor-pointer"
                    >
                      <TrendingUp className="w-3 h-3 shrink-0" />
                      <span>
                        {q.bpscTrendTag} ({q.sameTypeCount}x)
                      </span>
                    </button>
                    <span className="px-2 py-0.5 rounded-full bg-slate-500/12 theme-text-muted font-rounded font-semibold text-[11px]">
                      {q.questionType}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedExplanations((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-violet-500/15 text-violet-700 dark:text-violet-300 font-rounded font-bold text-xs cursor-pointer hover:bg-violet-500/25 transition-colors shrink-0"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{showExp ? 'Hide Details' : 'Show Answer'}</span>
                  </button>
                </div>

                {/* Question text */}
                <h2 className="font-bangla font-bold text-base sm:text-lg theme-text-primary leading-relaxed">
                  {q.question}
                </h2>

                {/* Cropped diagram image if present */}
                {q.image && (
                  <div className="p-3 rounded-2xl bg-white/95 dark:bg-slate-950/75 border border-slate-300/60 dark:border-slate-700/70 inline-block max-w-full">
                    <img
                      src={q.image}
                      alt={`Question ${q.id} diagram`}
                      loading="lazy"
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

                {/* Syllabus Alignment + Fit Reason + Explanation */}
                {showExp && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 text-xs sm:text-sm theme-text-secondary leading-relaxed space-y-2">
                    {q.correctIndex === null && q.correctAnswerRaw && (
                      <div className="font-bangla font-bold text-emerald-700 dark:text-emerald-300">
                        উত্তর: {q.correctAnswerRaw}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="font-bangla">
                        <span className="font-rounded font-bold theme-text-primary">
                          Official Subtopic:{' '}
                        </span>
                        <span>{q.syllabusSubtopic}</span>
                      </div>
                      {q.fitReason && (
                        <div className="flex items-start gap-1.5 font-rounded text-xs theme-text-muted">
                          <Info className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                          <span>
                            <strong className="theme-text-secondary">Syllabus Fit:</strong>{' '}
                            {q.fitReason}
                          </span>
                        </div>
                      )}
                    </div>

                    {q.explanation && (
                      <div className="pt-2 border-t border-indigo-400/20 font-bangla theme-text-primary/90 whitespace-pre-line">
                        {q.explanation}
                      </div>
                    )}
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
            onClick={() => goToPage(Math.max(1, safePage - 1))}
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
            onClick={() => goToPage(Math.min(totalPages, safePage + 1))}
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
