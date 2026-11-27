import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Flame,
  GraduationCap,
  Info,
  Layers,
  Search,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
  XCircle
} from 'lucide-react';
import { TopicMaster3DIllustration } from '../illustrations/Magical3DIllustrations';
import { BCSQuestionRecord, loadBCSQuestionBank } from '../../data/questionBank';
import {
  BCSSyllabusDocument,
  consumeTopicMasterIntent,
  getSubjectTheme,
  loadBCSSyllabus,
  MasteryMap,
  readMasteryMap,
  saveMasteryAnswer
} from '../../data/syllabus';

type MainTab = 'syllabus' | 'trends' | 'extra';
type EraFilter = 'all' | 'recent' | 'mid' | 'classic';

interface FocusTarget {
  kind: 'subject' | 'topic' | 'trend' | 'extra-topic';
  title: string;
  subtitle?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  trend?: string;
}

const OPTION_LETTERS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];
const PAGE_SIZE = 20;

function editionNum(ed: string): number {
  const n = parseInt(ed, 10);
  return isNaN(n) ? 0 : n;
}

function matchesEra(ed: string, era: EraFilter): boolean {
  if (era === 'all') return true;
  const n = editionNum(ed);
  if (era === 'recent') return n >= 41;
  if (era === 'mid') return n >= 31 && n <= 40;
  return n > 0 && n <= 30;
}

function computeEraBuckets(items: BCSQuestionRecord[]) {
  let e1 = 0; // 10-20
  let e2 = 0; // 21-30
  let e3 = 0; // 31-40
  let e4 = 0; // 41-50
  for (const q of items) {
    const n = editionNum(q.rawEdition);
    if (n >= 41) e4 += 1;
    else if (n >= 31) e3 += 1;
    else if (n >= 21) e2 += 1;
    else if (n >= 10) e1 += 1;
  }
  return [
    { label: '10th–20th', count: e1 },
    { label: '21st–30th', count: e2 },
    { label: '31st–40th', count: e3 },
    { label: '41st–50th', count: e4 }
  ];
}

export const TopicMasterView: React.FC = () => {
  const [questions, setQuestions] = useState<BCSQuestionRecord[]>([]);
  const [syllabus, setSyllabus] = useState<BCSSyllabusDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation state inside Topic Master
  const [activeTab, setActiveTab] = useState<MainTab>('syllabus');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusTarget | null>(null);

  // Practice focus filters
  const [activeSubtopic, setActiveSubtopic] = useState<string>('All');
  const [eraFilter, setEraFilter] = useState<EraFilter>('all');
  const [studyMode, setStudyMode] = useState(false);
  const [focusSearch, setFocusSearch] = useState('');
  const [page, setPage] = useState(1);

  // Trends tab filters
  const [trendSubject, setTrendSubject] = useState<string>('All');
  const [trendSearch, setTrendSearch] = useState('');
  const [trendMinCount, setTrendMinCount] = useState<number>(4);
  const [trendSort, setTrendSort] = useState<'count' | 'recent'>('count');

  // Extra topics search
  const [extraSearch, setExtraSearch] = useState('');

  // Practice answers & persistent mastery
  const [pickedAnswers, setPickedAnswers] = useState<Record<number, number>>({});
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [mastery, setMastery] = useState<MasteryMap>(() => readMasteryMap());
  const topRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([loadBCSQuestionBank(), loadBCSSyllabus().catch(() => null)])
      .then(([qs, syl]) => {
        if (!active) return;
        setQuestions(qs);
        setSyllabus(syl);
        setLoading(false);

        // Apply cross-screen intent if user clicked a topic chip in Question Bank
        const intent = consumeTopicMasterIntent();
        if (intent) {
          if (intent.tab) setActiveTab(intent.tab);
          if (intent.trend) {
            setActiveTab('trends');
            setFocus({
              kind: 'trend',
              title: intent.trend,
              subtitle: 'BPSC Recurring Pattern',
              trend: intent.trend
            });
          } else if (intent.topic && intent.tab === 'extra') {
            setActiveTab('extra');
            setFocus({
              kind: 'extra-topic',
              title: intent.topic,
              subtitle: intent.subject || 'Extra / Special Cadre',
              subject: intent.subject,
              topic: intent.topic
            });
          } else if (intent.subject && intent.topic) {
            setActiveTab('syllabus');
            setSelectedSubject(intent.subject);
            setFocus({
              kind: 'topic',
              title: intent.topic,
              subtitle: intent.subject,
              subject: intent.subject,
              topic: intent.topic,
              subtopic: intent.subtopic
            });
            setActiveSubtopic(intent.subtopic || 'All');
          } else if (intent.subject) {
            setActiveTab('syllabus');
            setSelectedSubject(intent.subject);
          }
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load Topic Master data');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Split official syllabus questions vs [Extra Topic] questions cleanly
  const officialQuestions = useMemo(
    () => questions.filter((q) => !q.isExtraTopic),
    [questions]
  );
  const extraQuestions = useMemo(
    () => questions.filter((q) => q.isExtraTopic),
    [questions]
  );

  // Official section marks map from bcs_syllabus.json
  const sectionMarksMap = useMemo(() => {
    const m = new Map<string, number>();
    if (!syllabus) return m;
    for (const subj of syllabus.subjects) {
      for (const sec of subj.sections) {
        m.set(sec.section, sec.marks);
      }
    }
    return m;
  }, [syllabus]);

  // Global mastery stats across official syllabus
  const overallMastery = useMemo(() => {
    let attempted = 0;
    let correct = 0;
    for (const q of officialQuestions) {
      const state = mastery[q.id];
      if (state !== undefined) {
        attempted += 1;
        if (state === 1) correct += 1;
      }
    }
    return {
      attempted,
      correct,
      pct: officialQuestions.length ? Math.round((correct / officialQuestions.length) * 100) : 0
    };
  }, [officialQuestions, mastery]);

  // Level 1: 10 Official BCS Subjects summary cards
  const subjectCards = useMemo(() => {
    const bySubj = new Map<string, BCSQuestionRecord[]>();
    for (const q of officialQuestions) {
      const list = bySubj.get(q.subject);
      if (list) list.push(q);
      else bySubj.set(q.subject, [q]);
    }

    return Array.from(bySubj.entries())
      .map(([subj, list]) => {
        const theme = getSubjectTheme(subj);
        const topicCounts = new Map<string, number>();
        const subtopicSet = new Set<string>();
        const examSet = new Set<string>();
        let mastered = 0;

        for (const q of list) {
          topicCounts.set(q.syllabusTopic, (topicCounts.get(q.syllabusTopic) ?? 0) + 1);
          subtopicSet.add(q.syllabusSubtopic);
          examSet.add(q.bcsBatch);
          if (mastery[q.id] === 1) mastered += 1;
        }

        const topTopics = Array.from(topicCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);

        return {
          subject: subj,
          theme,
          totalQuestions: list.length,
          sectionCount: topicCounts.size,
          subtopicCount: subtopicSet.size,
          examCount: examSet.size,
          mastered,
          masteryPct: list.length ? Math.round((mastered / list.length) * 100) : 0,
          topTopics
        };
      })
      .sort((a, b) => a.theme.serial - b.theme.serial);
  }, [officialQuestions, mastery]);

  // Level 2: Selected Subject deep-dive (sections, subtopics, era chart, trends)
  const subjectDeepDive = useMemo(() => {
    if (!selectedSubject) return null;
    const list = officialQuestions.filter((q) => q.subject === selectedSubject);
    const theme = getSubjectTheme(selectedSubject);
    const eraBuckets = computeEraBuckets(list);
    const exams = new Set(list.map((q) => q.bcsBatch)).size;

    const sectionMap = new Map<
      string,
      {
        topic: string;
        marks: number | null;
        questions: BCSQuestionRecord[];
        subtopics: Map<string, number>;
        trends: Map<string, number>;
        mastered: number;
      }
    >();

    let subjectMastered = 0;
    for (const q of list) {
      const isMast = mastery[q.id] === 1;
      if (isMast) subjectMastered += 1;
      let entry = sectionMap.get(q.syllabusTopic);
      if (!entry) {
        entry = {
          topic: q.syllabusTopic,
          marks: sectionMarksMap.get(q.syllabusTopic) ?? null,
          questions: [],
          subtopics: new Map(),
          trends: new Map(),
          mastered: 0
        };
        sectionMap.set(q.syllabusTopic, entry);
      }
      entry.questions.push(q);
      if (isMast) entry.mastered += 1;
      entry.subtopics.set(q.syllabusSubtopic, (entry.subtopics.get(q.syllabusSubtopic) ?? 0) + 1);
      entry.trends.set(q.bpscTrendTag, (entry.trends.get(q.bpscTrendTag) ?? 0) + 1);
    }

    // Preserve official syllabus section order if available, otherwise sort by count desc
    const syllabusOrder = new Map<string, number>();
    if (syllabus) {
      const matchSubj = syllabus.subjects.find((s) => s.serial === theme.serial);
      matchSubj?.sections.forEach((sec, idx) => syllabusOrder.set(sec.section, idx));
    }

    const sections = Array.from(sectionMap.values())
      .map((s) => ({
        topic: s.topic,
        marks: s.marks,
        count: s.questions.length,
        sharePct: list.length ? Math.round((s.questions.length / list.length) * 100) : 0,
        mastered: s.mastered,
        subtopics: Array.from(s.subtopics.entries()).sort((a, b) => b[1] - a[1]),
        topTrends: Array.from(s.trends.entries())
          .filter(([, c]) => c >= 2)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
      }))
      .sort((a, b) => {
        const oa = syllabusOrder.get(a.topic);
        const ob = syllabusOrder.get(b.topic);
        if (oa !== undefined && ob !== undefined) return oa - ob;
        return b.count - a.count;
      });

    return {
      subject: selectedSubject,
      theme,
      total: list.length,
      exams,
      mastered: subjectMastered,
      masteryPct: list.length ? Math.round((subjectMastered / list.length) * 100) : 0,
      eraBuckets,
      sections
    };
  }, [selectedSubject, officialQuestions, mastery, sectionMarksMap, syllabus]);

  // Tab 2: BPSC Recurring Trends Radar
  const trendCards = useMemo(() => {
    const map = new Map<
      string,
      {
        tag: string;
        count: number;
        recentCount: number;
        latestEdition: number;
        exams: Set<string>;
        subjectCounts: Map<string, number>;
      }
    >();

    for (const q of officialQuestions) {
      if (trendSubject !== 'All' && q.subject !== trendSubject) continue;
      let rec = map.get(q.bpscTrendTag);
      if (!rec) {
        rec = {
          tag: q.bpscTrendTag,
          count: 0,
          recentCount: 0,
          latestEdition: 0,
          exams: new Set(),
          subjectCounts: new Map()
        };
        map.set(q.bpscTrendTag, rec);
      }
      rec.count += 1;
      const ed = editionNum(q.rawEdition);
      if (ed >= 41) rec.recentCount += 1;
      if (ed > rec.latestEdition) rec.latestEdition = ed;
      rec.exams.add(q.bcsBatch);
      rec.subjectCounts.set(q.subject, (rec.subjectCounts.get(q.subject) ?? 0) + 1);
    }

    const qLower = trendSearch.trim().toLowerCase();
    return Array.from(map.values())
      .filter((t) => {
        if (t.count < trendMinCount) return false;
        if (qLower && !t.tag.toLowerCase().includes(qLower)) return false;
        return true;
      })
      .map((t) => {
        const primarySubject =
          Array.from(t.subjectCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          'General';
        return {
          tag: t.tag,
          count: t.count,
          recentCount: t.recentCount,
          latestEdition: t.latestEdition,
          examSpread: t.exams.size,
          primarySubject
        };
      })
      .sort((a, b) =>
        trendSort === 'recent'
          ? b.recentCount - a.recentCount || b.count - a.count
          : b.count - a.count
      )
      .slice(0, 80);
  }, [officialQuestions, trendSubject, trendSearch, trendMinCount, trendSort]);

  // Tab 3: Extra / Special Cadre Topic Clusters
  const extraTopicCards = useMemo(() => {
    const map = new Map<string, { topic: string; subject: string; count: number; exams: Set<string> }>();
    for (const q of extraQuestions) {
      let rec = map.get(q.syllabusTopic);
      if (!rec) {
        rec = { topic: q.syllabusTopic, subject: q.subject, count: 0, exams: new Set() };
        map.set(q.syllabusTopic, rec);
      }
      rec.count += 1;
      rec.exams.add(q.bcsBatch);
    }
    const qLower = extraSearch.trim().toLowerCase();
    return Array.from(map.values())
      .filter((x) => !qLower || x.topic.toLowerCase().includes(qLower) || x.subject.toLowerCase().includes(qLower))
      .sort((a, b) => b.count - a.count);
  }, [extraQuestions, extraSearch]);

  // Level 3: Focused Practice Questions
  const focusBaseQuestions = useMemo(() => {
    if (!focus) return [];
    return questions.filter((q) => {
      if (focus.kind === 'subject') return !q.isExtraTopic && q.subject === focus.subject;
      if (focus.kind === 'topic') {
        return !q.isExtraTopic && q.subject === focus.subject && q.syllabusTopic === focus.topic;
      }
      if (focus.kind === 'trend') return !q.isExtraTopic && q.bpscTrendTag === focus.trend;
      if (focus.kind === 'extra-topic') return q.isExtraTopic && q.syllabusTopic === focus.topic;
      return false;
    });
  }, [questions, focus]);

  const focusSubtopics = useMemo(() => {
    if (!focus || focus.kind !== 'topic') return [];
    const counts = new Map<string, number>();
    for (const q of focusBaseQuestions) {
      counts.set(q.syllabusSubtopic, (counts.get(q.syllabusSubtopic) ?? 0) + 1);
    }
    const list = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    return list.length > 1 ? list : [];
  }, [focus, focusBaseQuestions]);

  const focusFilteredQuestions = useMemo(() => {
    const qLower = focusSearch.trim().toLowerCase();
    return focusBaseQuestions.filter((q) => {
      if (activeSubtopic !== 'All' && q.syllabusSubtopic !== activeSubtopic) return false;
      if (!matchesEra(q.rawEdition, eraFilter)) return false;
      if (qLower) {
        const hay =
          `${q.question} ${q.options.join(' ')} ${q.explanation} ${q.syllabusSubtopic} ${q.bpscTrendTag} ${q.bcsBatch}`.toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    });
  }, [focusBaseQuestions, activeSubtopic, eraFilter, focusSearch]);

  const focusMastery = useMemo(() => {
    let mastered = 0;
    for (const q of focusFilteredQuestions) {
      if (mastery[q.id] === 1) mastered += 1;
    }
    return {
      mastered,
      total: focusFilteredQuestions.length,
      pct: focusFilteredQuestions.length
        ? Math.round((mastered / focusFilteredQuestions.length) * 100)
        : 0
    };
  }, [focusFilteredQuestions, mastery]);

  const totalPages = Math.max(1, Math.ceil(focusFilteredQuestions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const focusPageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return focusFilteredQuestions.slice(start, start + PAGE_SIZE);
  }, [focusFilteredQuestions, safePage]);

  const openFocus = (target: FocusTarget, initialSubtopic = 'All') => {
    setFocus(target);
    setActiveSubtopic(initialSubtopic);
    setEraFilter('all');
    setFocusSearch('');
    setPage(1);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleTabSwitch = (tab: MainTab) => {
    setActiveTab(tab);
    setFocus(null);
    if (tab !== 'syllabus') setSelectedSubject(null);
    setPage(1);
  };

  const handlePickAnswer = (q: BCSQuestionRecord, idx: number) => {
    setPickedAnswers((prev) => ({ ...prev, [q.id]: idx }));
    if (q.correctIndex !== null) {
      setMastery(saveMasteryAnswer(q.id, idx === q.correctIndex));
    }
  };

  return (
    <div ref={topRef} className="section-card-tm rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-7 lg:p-8 space-y-5">
      {/* Clean Hero Header + 3-Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <TopicMaster3DIllustration className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 animate-float-gentle" />
        <div className="text-center sm:text-left space-y-2 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/40 text-indigo-800 dark:text-indigo-200 font-rounded font-bold text-xs">
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span>Official 200-Mark BCS Syllabus • 10th–50th BCS</span>
            </span>
            {overallMastery.attempted > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-800 dark:text-emerald-200 font-rounded font-bold text-xs">
                <Target className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mastered: {overallMastery.correct.toLocaleString()} Qs</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-rounded font-bold theme-text-primary">
            Topic Master
          </h1>
          <p className="theme-text-secondary font-bangla text-sm sm:text-base">
            অফিশিয়াল বিসিএস সিলেবাস অনুযায়ী অধ্যায়, সাব-টপিক ও BPSC-এর পুনরাবৃত্তি ট্রেন্ড ধরে প্রস্তুতি নিন
          </p>
        </div>
      </div>

      {/* Top 3-Tab Navigation */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl theme-subcard">
        {(
          [
            {
              id: 'syllabus' as const,
              label: 'Syllabus Map',
              badge: `${officialQuestions.length.toLocaleString()}`,
              icon: <Layers className="w-3.5 h-3.5 shrink-0" />
            },
            {
              id: 'trends' as const,
              label: 'BPSC Trends',
              badge: 'Hot',
              icon: <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            },
            {
              id: 'extra' as const,
              label: 'Special Cadre',
              badge: `${extraQuestions.length}`,
              icon: <Stethoscope className="w-3.5 h-3.5 shrink-0" />
            }
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabSwitch(tab.id)}
              className={`py-2.5 px-2 sm:px-4 rounded-xl font-rounded font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                active
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                  : 'theme-text-secondary hover:theme-text-primary'
              }`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
              <span
                className={`hidden sm:inline-block px-1.5 py-0.5 rounded-md text-[10px] ${
                  active ? 'bg-white/20 text-white' : 'bg-indigo-500/12 theme-text-muted'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="p-10 rounded-3xl theme-subcard text-center font-rounded font-bold theme-text-secondary">
          Loading Official BCS Syllabus &amp; 5,655 classified questions...
        </div>
      )}

      {error && (
        <div className="p-6 rounded-3xl bg-rose-500/15 border border-rose-400/40 text-rose-800 dark:text-rose-200 font-rounded font-bold text-sm">
          {error}
        </div>
      )}

      {/* ====================================================================
          LEVEL 3: FOCUSED PRACTICE WORKSPACE (Shared by Syllabus, Trends, Extra)
         ==================================================================== */}
      {!loading && !error && focus && (
        <div className="space-y-4">
          {/* Breadcrumb + Back */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setFocus(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl theme-subcard font-rounded font-bold text-xs sm:text-sm theme-text-primary hover:scale-[1.02] transition-transform cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-500" />
              <span>
                {focus.kind === 'trend'
                  ? 'Back to BPSC Trends'
                  : focus.kind === 'extra-topic'
                  ? 'Back to Special Cadre'
                  : selectedSubject
                  ? `Back to ${getSubjectTheme(selectedSubject).shortEn}`
                  : 'Back to Syllabus Map'}
              </span>
            </button>

            <span className="font-rounded font-bold text-xs theme-text-secondary">
              {focusFilteredQuestions.length.toLocaleString()} questions • Mastered{' '}
              <span className="text-emerald-600 dark:text-emerald-400">{focusMastery.pct}%</span>
            </span>
          </div>

          {/* Topic Focus Card */}
          <div className="p-4 sm:p-5 rounded-3xl theme-subcard space-y-3.5">
            <div className="space-y-1">
              {focus.subtitle && (
                <span className="inline-block text-[11px] font-rounded font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                  {focus.subtitle}
                </span>
              )}
              <h2 className="text-lg sm:text-xl font-bangla font-bold theme-text-primary leading-snug">
                {focus.title}
              </h2>
            </div>

            {/* Mastery Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-rounded font-semibold theme-text-muted">
                <span>Topic Mastery Progress</span>
                <span className="text-emerald-600 dark:text-emerald-300 font-bold">
                  {focusMastery.mastered} / {focusMastery.total} ({focusMastery.pct}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-400/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${focusMastery.pct}%` }}
                />
              </div>
            </div>

            {/* Interactive Official Subtopic Chips (when topic has multiple official subtopics) */}
            {focusSubtopics.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-slate-300/35 dark:border-slate-700/45">
                <span className="block text-[11px] font-rounded font-bold uppercase tracking-wider theme-text-muted">
                  Official Subtopics
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubtopic('All');
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-rounded font-bold text-xs cursor-pointer transition-all ${
                      activeSubtopic === 'All'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white/65 dark:bg-slate-900/55 theme-text-secondary hover:theme-text-primary'
                    }`}
                  >
                    All ({focusBaseQuestions.length})
                  </button>
                  {focusSubtopics.map(([st, cnt]) => {
                    const active = activeSubtopic === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setActiveSubtopic(active ? 'All' : st);
                          setPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bangla font-semibold text-xs text-left cursor-pointer transition-all ${
                          active
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white/65 dark:bg-slate-900/55 theme-text-secondary hover:theme-text-primary'
                        }`}
                      >
                        {st.length > 56 ? `${st.slice(0, 55)}…` : st}{' '}
                        <span className="opacity-75">({cnt})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Era filter + Search + Practice/Study Mode */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={focusSearch}
                  onChange={(e) => {
                    setFocusSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="এই টপিকের প্রশ্ন খুঁজুন..."
                  className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-300/60 dark:border-slate-700/70 font-bangla text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
                <div className="inline-flex rounded-xl p-0.5 bg-white/70 dark:bg-slate-900/65 border border-slate-300/60 dark:border-slate-700/60">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'recent', label: '41–50th' },
                      { id: 'mid', label: '31–40th' },
                      { id: 'classic', label: '10–30th' }
                    ] as const
                  ).map((era) => (
                    <button
                      key={era.id}
                      type="button"
                      onClick={() => {
                        setEraFilter(era.id);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-rounded font-bold text-[11px] cursor-pointer transition-all ${
                        eraFilter === era.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'theme-text-secondary hover:theme-text-primary'
                      }`}
                    >
                      {era.label}
                    </button>
                  ))}
                </div>

                <div className="inline-flex rounded-xl p-0.5 bg-white/70 dark:bg-slate-900/65 border border-slate-300/60 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setStudyMode(false)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-rounded font-bold text-[11px] cursor-pointer ${
                      !studyMode ? 'bg-indigo-600 text-white' : 'theme-text-secondary'
                    }`}
                  >
                    <GraduationCap className="w-3 h-3" />
                    <span>Quiz</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudyMode(true)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-rounded font-bold text-[11px] cursor-pointer ${
                      studyMode ? 'bg-emerald-600 text-white' : 'theme-text-secondary'
                    }`}
                  >
                    <BookOpenCheck className="w-3 h-3" />
                    <span>Study</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Focused Question Cards */}
          {focusPageItems.length === 0 ? (
            <div className="p-8 rounded-3xl theme-subcard text-center font-rounded text-sm theme-text-secondary">
              No questions match this filter combination. Try switching to “All” eras.
            </div>
          ) : (
            <div className="space-y-4">
              {focusPageItems.map((q) => {
                const picked = pickedAnswers[q.id];
                const isPicked = picked !== undefined;
                const reveal = studyMode || isPicked || Boolean(expandedCards[q.id]);
                return (
                  <article
                    key={q.id}
                    className="p-4 sm:p-6 rounded-3xl theme-subcard space-y-3.5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-rounded font-bold text-xs">
                          {q.bcsBatch}
                          {q.questionNumber ? ` • Q${q.questionNumber}` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            openFocus({
                              kind: 'trend',
                              title: q.bpscTrendTag,
                              subtitle: `BPSC Recurring Trend (${q.sameTypeCount}x)`,
                              trend: q.bpscTrendTag
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-800 dark:text-emerald-200 font-rounded font-bold text-[11px] hover:bg-emerald-500/25 cursor-pointer"
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>
                            {q.bpscTrendTag} ({q.sameTypeCount}x)
                          </span>
                        </button>
                      </div>

                      {!studyMode && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCards((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-violet-500/15 text-violet-700 dark:text-violet-300 font-rounded font-bold text-xs cursor-pointer hover:bg-violet-500/25"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{reveal ? 'Hide' : 'Answer'}</span>
                        </button>
                      )}
                    </div>

                    <h3 className="font-bangla font-bold text-base sm:text-lg theme-text-primary leading-relaxed">
                      {q.question}
                    </h3>

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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, idx) => {
                        const isThisPicked = picked === idx;
                        const isCorrectOpt = q.correctIndex === idx;
                        let cardCls =
                          'bg-white/70 dark:bg-slate-900/55 border-slate-300/60 dark:border-slate-700/70 theme-text-primary hover:border-indigo-400';
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
                            onClick={() => handlePickAnswer(q, idx)}
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

                    {reveal && (
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 text-xs sm:text-sm theme-text-secondary leading-relaxed space-y-2">
                        {q.correctIndex === null && q.correctAnswerRaw && (
                          <div className="font-bangla font-bold text-emerald-700 dark:text-emerald-300">
                            উত্তর: {q.correctAnswerRaw}
                          </div>
                        )}
                        <div className="font-bangla text-xs">
                          <span className="font-rounded font-bold theme-text-primary">
                            Official Subtopic:{' '}
                          </span>
                          <span>{q.syllabusSubtopic}</span>
                        </div>
                        {q.fitReason && (
                          <div className="flex items-start gap-1.5 font-rounded text-xs theme-text-muted">
                            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                            <span>{q.fitReason}</span>
                          </div>
                        )}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                disabled={safePage <= 1}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl theme-subcard font-rounded font-bold text-xs sm:text-sm theme-text-primary disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <span className="font-rounded font-bold text-xs sm:text-sm theme-text-secondary">
                Page {safePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                disabled={safePage >= totalPages}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-rounded font-bold text-xs sm:text-sm shadow-md disabled:opacity-40 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 1: SYLLABUS MAP — LEVEL 1 (10 OFFICIAL SUBJECTS) & LEVEL 2 (SECTIONS)
         ==================================================================== */}
      {!loading && !error && !focus && activeTab === 'syllabus' && !subjectDeepDive && (
        <div className="space-y-4">
          {/* Compact 4-Stat Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'Official Marks', value: '200', sub: '10 Subjects' },
              { label: 'Syllabus Units', value: '89', sub: 'Exact BPSC Wording' },
              {
                label: 'Syllabus MCQs',
                value: officialQuestions.length.toLocaleString(),
                sub: '10th–50th BCS'
              },
              {
                label: 'Your Mastery',
                value: `${overallMastery.pct}%`,
                sub: `${overallMastery.correct} mastered`
              }
            ].map((item) => (
              <div key={item.label} className="px-4 py-3 rounded-2xl theme-subcard">
                <div className="text-xl sm:text-2xl font-rounded font-extrabold theme-text-primary leading-tight">
                  {item.value}
                </div>
                <div className="text-xs font-rounded font-bold theme-text-secondary">{item.label}</div>
                <div className="text-[11px] font-rounded theme-text-muted">{item.sub}</div>
              </div>
            ))}
          </div>

          {/* 10 Official Subject Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {subjectCards.map((card) => (
              <button
                key={card.subject}
                type="button"
                onClick={() => {
                  setSelectedSubject(card.subject);
                  topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`group text-left p-5 rounded-3xl theme-subcard border-2 border-transparent ${card.theme.ring} transition-all hover:scale-[1.01] cursor-pointer space-y-3.5 shadow-sm`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${card.theme.gradient} text-white font-rounded font-extrabold text-sm flex items-center justify-center shrink-0 shadow-md`}
                    >
                      {String(card.theme.serial).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-bangla font-bold text-base sm:text-lg theme-text-primary leading-snug truncate">
                        {card.theme.nameBn}
                      </h2>
                      <p className="font-rounded font-semibold text-xs theme-text-muted truncate">
                        {card.subject}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-full border font-rounded font-bold text-xs ${card.theme.badgeBg}`}
                  >
                    {card.theme.marks} Marks
                  </span>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs font-rounded font-semibold theme-text-secondary">
                  <span>
                    <strong className="theme-text-primary">{card.totalQuestions.toLocaleString()}</strong>{' '}
                    Qs • {card.sectionCount} sections • {card.subtopicCount} subtopics
                  </span>
                  <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-300 font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Visual Weight + Mastery Bar */}
                <div className="h-2 rounded-full bg-slate-400/20 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${card.theme.barGradient}`}
                    style={{
                      width: `${Math.max(
                        10,
                        Math.round((card.totalQuestions / (subjectCards[0]?.totalQuestions || 1)) * 100)
                      )}%`
                    }}
                  />
                </div>

                {/* Top Syllabus Topic Preview Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {card.topTopics.map(([topic, cnt]) => (
                    <span
                      key={topic}
                      className="px-2.5 py-1 rounded-xl bg-white/65 dark:bg-slate-900/55 border border-slate-300/45 dark:border-slate-700/55 font-bangla text-[11px] font-semibold theme-text-secondary"
                    >
                      {topic.length > 28 ? `${topic.slice(0, 27)}…` : topic} · {cnt}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 1 — LEVEL 2: SUBJECT DEEP-DIVE (SECTIONS, SUBTOPICS & ERA CHART)
         ==================================================================== */}
      {!loading && !error && !focus && activeTab === 'syllabus' && subjectDeepDive && (
        <div className="space-y-4">
          {/* Breadcrumb + Quick Subject Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setSelectedSubject(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl theme-subcard font-rounded font-bold text-xs sm:text-sm theme-text-primary hover:scale-[1.02] transition-transform cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-500" />
              <span>All 10 Subjects</span>
            </button>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
              {subjectCards.map((sc) => (
                <button
                  key={sc.subject}
                  type="button"
                  onClick={() => setSelectedSubject(sc.subject)}
                  className={`shrink-0 px-2.5 py-1 rounded-xl font-rounded font-bold text-[11px] cursor-pointer transition-all ${
                    sc.subject === subjectDeepDive.subject
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'theme-subcard theme-text-secondary hover:theme-text-primary'
                  }`}
                >
                  {sc.theme.shortEn}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Intelligence Banner + 4-Era BPSC Evolution */}
          <div className="p-5 sm:p-6 rounded-3xl theme-subcard space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-0.5 rounded-full border font-rounded font-bold text-xs ${subjectDeepDive.theme.badgeBg}`}
                  >
                    Official Weight: {subjectDeepDive.theme.marks} / 200 Marks
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-500/12 font-rounded font-bold text-xs theme-text-secondary">
                    {subjectDeepDive.total.toLocaleString()} Historical Qs • {subjectDeepDive.exams} Exams
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bangla font-bold theme-text-primary">
                  {subjectDeepDive.theme.nameBn}
                </h2>
                <p className="font-rounded text-xs sm:text-sm theme-text-muted">
                  {subjectDeepDive.subject}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  openFocus({
                    kind: 'subject',
                    title: subjectDeepDive.theme.nameBn,
                    subtitle: `${subjectDeepDive.subject} • All Syllabus Topics`,
                    subject: subjectDeepDive.subject
                  })
                }
                className={`shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r ${subjectDeepDive.theme.gradient} text-white font-rounded font-bold text-xs sm:text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Practice All ({subjectDeepDive.total})</span>
              </button>
            </div>

            {/* Clean 4-Era Visual Spark Bars */}
            <div className="pt-3 border-t border-slate-300/35 dark:border-slate-700/45 space-y-2">
              <div className="flex items-center justify-between text-xs font-rounded font-bold theme-text-muted">
                <span>BPSC Question Trend Across Eras</span>
                <span>Mastery: {subjectDeepDive.masteryPct}%</span>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {subjectDeepDive.eraBuckets.map((b) => {
                  const maxB = Math.max(1, ...subjectDeepDive.eraBuckets.map((x) => x.count));
                  const pct = Math.max(8, Math.round((b.count / maxB) * 100));
                  return (
                    <div
                      key={b.label}
                      className="p-2.5 rounded-2xl bg-white/60 dark:bg-slate-900/50 space-y-1.5"
                    >
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-[10px] sm:text-xs font-rounded font-bold theme-text-muted">
                          {b.label}
                        </span>
                        <strong className="text-xs sm:text-sm font-rounded theme-text-primary">
                          {b.count}
                        </strong>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-400/20 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${subjectDeepDive.theme.barGradient}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Official Syllabus Sections List */}
          <div className="space-y-3.5">
            {subjectDeepDive.sections.map((sec) => (
              <div
                key={sec.topic}
                className="p-4 sm:p-5 rounded-3xl theme-subcard space-y-3.5 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {sec.marks !== null && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-800 dark:text-amber-200 font-rounded font-bold text-[11px]">
                          {sec.marks} Marks
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 font-rounded font-bold text-[11px]">
                        {sec.count} Qs ({sec.sharePct}% of subject)
                      </span>
                      {sec.mastered > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-rounded font-bold text-[11px]">
                          ✓ {sec.mastered} mastered
                        </span>
                      )}
                    </div>
                    <h3 className="font-bangla font-bold text-base sm:text-lg theme-text-primary leading-snug">
                      {sec.topic}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openFocus({
                        kind: 'topic',
                        title: sec.topic,
                        subtitle: subjectDeepDive.theme.nameBn,
                        subject: subjectDeepDive.subject,
                        topic: sec.topic
                      })
                    }
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-rounded font-bold text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Practice ({sec.count})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Proportional Share Bar */}
                <div className="h-1.5 rounded-full bg-slate-400/20 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${subjectDeepDive.theme.barGradient}`}
                    style={{ width: `${Math.max(4, sec.sharePct)}%` }}
                  />
                </div>

                {/* Exact Official Subtopics (clickable to drill directly!) */}
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-rounded font-bold uppercase tracking-wider theme-text-muted">
                    Exact Official Syllabus Subtopics
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sec.subtopics.map(([sub, cnt]) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() =>
                          openFocus(
                            {
                              kind: 'topic',
                              title: sec.topic,
                              subtitle: subjectDeepDive.theme.nameBn,
                              subject: subjectDeepDive.subject,
                              topic: sec.topic,
                              subtopic: sub
                            },
                            sub
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-slate-900/55 border border-slate-300/55 dark:border-slate-700/60 hover:border-indigo-400 font-bangla font-semibold text-xs text-left theme-text-primary transition-colors cursor-pointer"
                      >
                        {sub.length > 74 ? `${sub.slice(0, 73)}…` : sub}{' '}
                        <span className="font-rounded text-indigo-600 dark:text-indigo-300 font-bold">
                          ({cnt})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top Recurring BPSC Trends in this section */}
                {sec.topTrends.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-rounded font-bold theme-text-muted mr-1">
                      Top Trends:
                    </span>
                    {sec.topTrends.map(([trend, cnt]) => (
                      <button
                        key={trend}
                        type="button"
                        onClick={() =>
                          openFocus({
                            kind: 'trend',
                            title: trend,
                            subtitle: `Recurring Trend in ${subjectDeepDive.theme.shortEn}`,
                            trend
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/12 border border-emerald-400/35 text-emerald-800 dark:text-emerald-200 font-rounded font-bold text-[11px] hover:bg-emerald-500/25 cursor-pointer"
                      >
                        <TrendingUp className="w-3 h-3" />
                        <span>
                          {trend} ({cnt}x)
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: BPSC RECURRING TRENDS RADAR
         ==================================================================== */}
      {!loading && !error && !focus && activeTab === 'trends' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl theme-subcard space-y-3">
            {/* Subject pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setTrendSubject('All')}
                className={`shrink-0 px-3 py-1.5 rounded-xl font-rounded font-bold text-xs cursor-pointer ${
                  trendSubject === 'All'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white/60 dark:bg-slate-900/55 theme-text-secondary'
                }`}
              >
                All Subjects
              </button>
              {subjectCards.map((sc) => (
                <button
                  key={sc.subject}
                  type="button"
                  onClick={() => setTrendSubject(sc.subject)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl font-rounded font-bold text-xs cursor-pointer ${
                    trendSubject === sc.subject
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white/60 dark:bg-slate-900/55 theme-text-secondary'
                  }`}
                >
                  {sc.theme.shortEn}
                </button>
              ))}
            </div>

            {/* Search + Min frequency + Sort */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={trendSearch}
                  onChange={(e) => setTrendSearch(e.target.value)}
                  placeholder="Search BPSC recurring trend (e.g. Constitution, Liberation War, Synonyms)..."
                  className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-300/60 dark:border-slate-700/70 font-rounded text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex rounded-xl p-0.5 bg-white/70 dark:bg-slate-900/65 border border-slate-300/60 dark:border-slate-700/60">
                  {[2, 4, 8, 15].map((minC) => (
                    <button
                      key={minC}
                      type="button"
                      onClick={() => setTrendMinCount(minC)}
                      className={`px-2.5 py-1 rounded-lg font-rounded font-bold text-xs cursor-pointer ${
                        trendMinCount === minC
                          ? 'bg-emerald-600 text-white'
                          : 'theme-text-secondary'
                      }`}
                    >
                      {minC}+
                    </button>
                  ))}
                </div>

                <div className="inline-flex rounded-xl p-0.5 bg-white/70 dark:bg-slate-900/65 border border-slate-300/60 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setTrendSort('count')}
                    className={`px-2.5 py-1 rounded-lg font-rounded font-bold text-xs cursor-pointer ${
                      trendSort === 'count' ? 'bg-indigo-600 text-white' : 'theme-text-secondary'
                    }`}
                  >
                    Most Asked
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendSort('recent')}
                    className={`px-2.5 py-1 rounded-lg font-rounded font-bold text-xs cursor-pointer ${
                      trendSort === 'recent' ? 'bg-rose-600 text-white' : 'theme-text-secondary'
                    }`}
                  >
                    41–50th Hot
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Ranked Trend Cards Grid */}
          {trendCards.length === 0 ? (
            <div className="p-8 rounded-3xl theme-subcard text-center font-rounded text-sm theme-text-secondary">
              No recurring trends match this filter. Try lowering the minimum frequency to 2+.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trendCards.map((t, idx) => {
                const maxC = trendCards[0]?.count || 1;
                const pct = Math.max(8, Math.round((t.count / maxC) * 100));
                const subjTheme = getSubjectTheme(t.primarySubject);
                const isHotRecent = t.latestEdition >= 45;

                return (
                  <button
                    key={t.tag}
                    type="button"
                    onClick={() =>
                      openFocus({
                        kind: 'trend',
                        title: t.tag,
                        subtitle: `BPSC Recurring Trend • ${t.count} questions across ${t.examSpread} exams`,
                        trend: t.tag
                      })
                    }
                    className="group text-left p-4 rounded-3xl theme-subcard border border-transparent hover:border-emerald-400/60 transition-all hover:scale-[1.01] cursor-pointer space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-rounded font-extrabold text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-rounded font-bold text-sm sm:text-base theme-text-primary leading-snug truncate">
                            {t.tag}
                          </h3>
                          <span className="text-[11px] font-rounded font-semibold theme-text-muted">
                            {subjTheme.shortEn} • {t.examSpread} BCS exams
                          </span>
                        </div>
                      </div>

                      <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-800 dark:text-emerald-200 font-rounded font-extrabold text-xs">
                        {t.count}x
                      </span>
                    </div>

                    <div className="h-1.5 rounded-full bg-slate-400/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-rounded font-bold">
                      <div className="flex items-center gap-1.5">
                        {isHotRecent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300">
                            <Flame className="w-3 h-3" />
                            <span>Asked in {t.latestEdition}th BCS</span>
                          </span>
                        )}
                        {t.recentCount > 0 && (
                          <span className="theme-text-muted">{t.recentCount} in 41st–50th</span>
                        )}
                      </div>
                      <span className="text-indigo-600 dark:text-indigo-300 group-hover:translate-x-0.5 transition-transform">
                        Practice →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 3: EXTRA & SPECIAL CADRE TOPICS (Cleanly Separated)
         ==================================================================== */}
      {!loading && !error && !focus && activeTab === 'extra' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-3xl theme-subcard space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Stethoscope className="w-5 h-5" />
              </span>
              <div className="space-y-1">
                <h2 className="font-rounded font-bold text-base sm:text-lg theme-text-primary">
                  Special Cadre &amp; Out-of-Syllabus Topics ({extraQuestions.length} Questions)
                </h2>
                <p className="font-bangla text-xs sm:text-sm theme-text-secondary">
                  বিশেষ বিসিএস (যেমন ৪৮তম, ৪২তম, ৩৯তম মেডিকেল/ডেন্টাল ক্যাডার) ও সাধারণ ২০০ নম্বরের সিলেবাসের বাইরের প্রশ্নগুলো আলাদাভাবে সাজানো হয়েছে যাতে আপনার মূল সিলেবাসের অ্যানালিটিক্স নির্ভুল থাকে।
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={extraSearch}
                onChange={(e) => setExtraSearch(e.target.value)}
                placeholder="Search Medical/Dental or Extra Topic..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-300/60 dark:border-slate-700/70 font-rounded text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {extraTopicCards.map((item) => (
              <button
                key={item.topic}
                type="button"
                onClick={() =>
                  openFocus({
                    kind: 'extra-topic',
                    title: item.topic,
                    subtitle: item.subject,
                    subject: item.subject,
                    topic: item.topic
                  })
                }
                className="group text-left p-4 rounded-3xl theme-subcard border border-transparent hover:border-amber-400/60 transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="min-w-0 space-y-1">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200 font-rounded font-bold text-[10px]">
                    {item.subject}
                  </span>
                  <h3 className="font-rounded font-bold text-sm theme-text-primary leading-snug truncate">
                    {item.topic.replace(/^\[Extra Topic\]\s*/i, '')}
                  </h3>
                  <p className="text-[11px] font-rounded theme-text-muted">
                    {Array.from(item.exams).join(', ')}
                  </p>
                </div>

                <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-200 font-rounded font-bold text-xs">
                  <span>{item.count} Q</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
