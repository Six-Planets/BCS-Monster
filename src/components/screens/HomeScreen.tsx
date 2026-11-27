import React from 'react';
import { Play } from 'lucide-react';
import {
  MockTestHeroIllustration,
  QuestionBank3DIllustration,
  TopicMaster3DIllustration,
  StudyMaterials3DIllustration,
  PrivateTutor3DIllustration,
  BCSUpdates3DIllustration
} from '../illustrations/Magical3DIllustrations';
import { BCSCountdownFlipCard } from '../sections/BCSCountdownFlipCard';
import { BCSMonsterBrandingBar } from '../sections/BCSMonsterBrandingBar';
import { FloatingArt } from '../common/FloatingArt';
import type { ActiveView } from './DestinationViews';

/* Static SVG art never changes: memoise so it is reconciled exactly once. */
const MockArt = React.memo(MockTestHeroIllustration);
const QuestionBankArt = React.memo(QuestionBank3DIllustration);
const TopicMasterArt = React.memo(TopicMaster3DIllustration);
const StudyMaterialsArt = React.memo(StudyMaterials3DIllustration);
const PrivateTutorArt = React.memo(PrivateTutor3DIllustration);
const BCSUpdatesArt = React.memo(BCSUpdates3DIllustration);

interface FeatureCardProps {
  view: Exclude<ActiveView, 'home'>;
  onOpen: (view: ActiveView) => void;
  title: string;
  subtitle: string;
  badge?: string;
  cardClass: string;
  spanClass: string;
  paddingClass: string;
  hoverTitleClass: string;
  glowClass: string;
  glowPosition: string;
  textClass?: string;
  floatVariant: 'gentle' | 'reverse';
  art: React.ReactNode;
}

const FeatureCard = React.memo<FeatureCardProps>(
  ({
    view,
    onOpen,
    title,
    subtitle,
    badge,
    cardClass,
    spanClass,
    paddingClass,
    hoverTitleClass,
    glowClass,
    glowPosition,
    textClass = '',
    floatVariant,
    art
  }) => (
    <section
      onClick={() => onOpen(view)}
      className={`${spanClass} card-lift group relative rounded-[1.75rem] sm:rounded-[2rem] ${cardClass} ${paddingClass} overflow-hidden cursor-pointer select-none flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-4`}
    >
      <div
        className={`pointer-events-none absolute ${glowPosition} rounded-full glow-orb ${glowClass} group-hover:scale-110 transition-transform duration-500`}
      />

      <div className="relative z-10 space-y-1 text-center sm:text-left order-2 sm:order-1">
        {badge && (
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/65 dark:bg-slate-900/55 border border-white/80 dark:border-white/15 font-rounded font-bold text-[10px] tracking-wide uppercase theme-text-secondary">
            {badge}
          </span>
        )}
        <h2
          className={`text-base sm:text-[1.45rem] font-rounded font-bold theme-text-primary ${hoverTitleClass} transition-colors leading-tight`}
        >
          {title}
        </h2>
        <p
          className={`text-[11px] sm:text-sm font-bangla theme-text-secondary ${textClass} leading-snug line-clamp-2`}
        >
          {subtitle}
        </p>
      </div>

      <FloatingArt
        variant={floatVariant}
        className="relative z-10 shrink-0 group-hover:scale-105 transition-transform duration-500 order-1 sm:order-2"
      >
        {art}
      </FloatingArt>
    </section>
  )
);
FeatureCard.displayName = 'FeatureCard';

interface HomeScreenProps {
  onOpen: (view: ActiveView) => void;
}

/**
 * The homepage. It is mounted ONCE and kept alive (hidden with display:none)
 * while other screens are open, so returning to it is instant: no remount,
 * no SVG re-parse, no animation re-initialisation.
 */
export const HomeScreen: React.FC<HomeScreenProps> = React.memo(({ onOpen }) => {
  return (
    <div className="w-full max-w-[1120px] mx-auto px-3.5 sm:px-6 lg:px-8 pt-3.5 sm:pt-4 pb-28 sm:pb-32 space-y-3 sm:space-y-3.5">
      {/* SECTION 1: BCS COUNTDOWN — "50th BCS Ongoing. 51st BCS Awaits." */}
      <BCSCountdownFlipCard />

      {/* SECTION 2: BCS MONSTER BY UTTORON BRANDING + DARK/LIGHT MODE SWITCH */}
      <BCSMonsterBrandingBar />

      {/* SECTION 3 (01): MOCK TEST — LARGEST & MOST PROMINENT 3D HERO STAGE */}
      <section
        onClick={() => onOpen('mock-test')}
        className="card-lift group relative rounded-[2rem] sm:rounded-[2.5rem] section-card-mock px-5 py-4 sm:px-10 sm:py-5 lg:px-12 lg:py-6 overflow-hidden cursor-pointer select-none"
      >
        <div className="pointer-events-none absolute -top-24 -right-12 w-96 h-96 rounded-full glow-orb bg-gradient-to-br from-violet-400/40 via-pink-400/35 to-amber-300/25 group-hover:scale-110 transition-transform duration-700" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 w-80 h-80 rounded-full glow-orb bg-gradient-to-tr from-fuchsia-400/35 via-purple-300/30 to-indigo-300/30" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-5 lg:gap-8 items-center">
          <div className="lg:col-span-6 space-y-3 sm:space-y-4 text-center lg:text-left order-2 lg:order-1">
            <div className="space-y-1 sm:space-y-1.5">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-rounded font-bold theme-text-primary tracking-tight leading-[1.08]">
                Mock Test
              </h1>
              <p className="text-xs sm:text-lg font-bangla font-medium theme-text-secondary max-w-md mx-auto lg:mx-0 leading-relaxed">
                আনন্দময় ত্রিমাত্রিক পরিবেশে পূর্ণাঙ্গ বিসিএস মক টেস্ট শুরু করুন
              </p>
            </div>

            <div className="pt-0.5 flex justify-center lg:justify-start">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen('mock-test');
                }}
                className="btn-3d-start inline-flex items-center gap-3 px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full text-white font-rounded font-bold text-sm sm:text-lg tracking-wide cursor-pointer"
              >
                <span className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/25 flex items-center justify-center shadow-inner">
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white ml-0.5" />
                </span>
                <span>Start Mock Test</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex items-center justify-center order-1 lg:order-2">
            <FloatingArt
              variant="gentle"
              className="w-full max-w-[195px] sm:max-w-[310px] lg:max-w-[335px] group-hover:scale-[1.03] transition-transform duration-500"
            >
              <MockArt />
            </FloatingArt>
          </div>
        </div>
      </section>

      {/* CORE STUDY ARENAS: Question Bank & Topic Master (Dedicated Separate Sections) */}
      <div className="grid grid-cols-2 md:grid-cols-12 gap-3 sm:gap-3.5">
        <FeatureCard
          view="question-bank"
          onOpen={onOpen}
          badge="10th–50th BCS"
          title="Question Bank"
          subtitle="বিগত ৪০টি বিসিএস-এর ৫,৬৫৫টি প্রশ্ন ও সমাধান"
          cardClass="section-card-qb"
          spanClass="col-span-1 md:col-span-6"
          paddingClass="p-3.5 sm:px-6 sm:py-5"
          hoverTitleClass="group-hover:text-sky-600 dark:group-hover:text-sky-300"
          glowPosition="-right-8 -bottom-8 w-52 h-52"
          glowClass="bg-gradient-to-tl from-sky-400/45 via-cyan-300/35 to-transparent"
          textClass="max-w-xs"
          floatVariant="reverse"
          art={<QuestionBankArt className="w-20 h-20 sm:w-28 sm:h-24" />}
        />
        <FeatureCard
          view="topic-master"
          onOpen={onOpen}
          badge="Syllabus & Trends"
          title="Topic Master"
          subtitle="অফিশিয়াল সিলেবাস, সাব-টপিক ও BPSC পুনরাবৃত্তি ট্রেন্ড"
          cardClass="section-card-tm"
          spanClass="col-span-1 md:col-span-6"
          paddingClass="p-3.5 sm:px-6 sm:py-5"
          hoverTitleClass="group-hover:text-indigo-600 dark:group-hover:text-indigo-300"
          glowPosition="-right-8 -top-8 w-52 h-52"
          glowClass="bg-gradient-to-bl from-indigo-400/45 via-fuchsia-300/35 to-transparent"
          textClass="max-w-xs"
          floatVariant="gentle"
          art={<TopicMasterArt className="w-20 h-20 sm:w-28 sm:h-24" />}
        />

        {/* SUPPORTING SECTIONS: Study Materials, Private Tutor, BCS Updates */}
        <FeatureCard
          view="study-materials"
          onOpen={onOpen}
          title="Study Materials"
          subtitle="রঙিন নোটস ও সহজ রিভিশন গাইড"
          cardClass="section-card-sm"
          spanClass="col-span-1 md:col-span-4"
          paddingClass="p-3.5 sm:px-5 sm:py-4"
          hoverTitleClass="group-hover:text-emerald-600 dark:group-hover:text-emerald-300"
          glowPosition="-right-8 -top-8 w-44 h-44"
          glowClass="bg-gradient-to-bl from-emerald-400/45 via-teal-300/35 to-transparent"
          floatVariant="gentle"
          art={<StudyMaterialsArt className="w-18 h-18 sm:w-24 sm:h-24" />}
        />
        <FeatureCard
          view="private-tutor"
          onOpen={onOpen}
          title="Private Tutor"
          subtitle="যেকোনো প্রশ্ন ও ধারণা সহজে বুঝে নিন"
          cardClass="section-card-pt"
          spanClass="col-span-1 md:col-span-4"
          paddingClass="p-3.5 sm:px-5 sm:py-4"
          hoverTitleClass="group-hover:text-purple-600 dark:group-hover:text-purple-300"
          glowPosition="-left-8 -bottom-8 w-44 h-44"
          glowClass="bg-gradient-to-tr from-purple-400/45 via-fuchsia-300/35 to-transparent"
          floatVariant="reverse"
          art={<PrivateTutorArt className="w-18 h-18 sm:w-24 sm:h-24" />}
        />
        <FeatureCard
          view="bcs-updates"
          onOpen={onOpen}
          title="BCS Updates"
          subtitle="বিজ্ঞপ্তি, পরীক্ষার সময়সূচি ও নোটিশ"
          cardClass="section-card-up"
          spanClass="col-span-2 md:col-span-4"
          paddingClass="p-3.5 sm:px-5 sm:py-4"
          hoverTitleClass="group-hover:text-orange-600 dark:group-hover:text-orange-300"
          glowPosition="-right-8 -bottom-8 w-48 h-48"
          glowClass="bg-gradient-to-tl from-orange-400/45 via-rose-300/35 to-transparent"
          textClass="max-w-xs"
          floatVariant="gentle"
          art={<BCSUpdatesArt className="w-18 h-18 sm:w-24 sm:h-24" />}
        />
      </div>
    </div>
  );
});
HomeScreen.displayName = 'HomeScreen';
