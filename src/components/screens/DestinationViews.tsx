import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Volume2, Award, LogOut } from 'lucide-react';
import {
  StudyMaterials3DIllustration,
  PrivateTutor3DIllustration,
  BCSUpdates3DIllustration
} from '../illustrations/Magical3DIllustrations';
import { MockTestArena } from './MockTestArena';
import { QuestionBankView } from './QuestionBankView';
import type { AuthUser } from '../../auth';

export type ActiveView =
  | 'home'
  | 'mock-test'
  | 'question-bank'
  | 'study-materials'
  | 'private-tutor'
  | 'bcs-updates'
  | 'progress'
  | 'profile'
  | 'settings'
  | 'leaderboard';

interface DestinationViewProps {
  view: Exclude<ActiveView, 'home'>;
  onBackHome: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const DestinationView: React.FC<DestinationViewProps> = ({
  view,
  onBackHome,
  currentUser,
  onLogout
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dailyGoal, setDailyGoal] = useState<'Calm' | 'Regular' | 'Intense'>('Regular');

  // 01. MOCK TEST DESTINATION — Dedicated Game-Like Responsive Exam Arena
  if (view === 'mock-test') {
    return <MockTestArena onBackHome={onBackHome} />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-12 sm:pb-16">
      {/* Top Floating Back Pill */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBackHome}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full section-card-branding theme-text-primary font-rounded font-bold text-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-500" />
          <span>Back to Arena</span>
        </button>
      </div>

      {/* 02. QUESTION BANK DESTINATION */}
      {view === 'question-bank' && <QuestionBankView />}

      {/* 03. STUDY MATERIALS DESTINATION */}
      {view === 'study-materials' && (
        <div className="section-card-sm rounded-[2.5rem] p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <StudyMaterials3DIllustration className="w-32 h-32 shrink-0 animate-float-gentle" />
            <div className="text-center sm:text-left space-y-2">
              <h1 className="text-2xl sm:text-3xl font-rounded font-bold theme-text-primary">
                Study Materials
              </h1>
              <p className="theme-text-secondary font-bangla text-sm sm:text-base">
                সহজ ও সুন্দরভাবে সাজানো স্টাডি গাইড এবং হ্যান্ডনোটস
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'বাংলাদেশের সংবিধান সহজ পাঠ', desc: 'গুরুত্বপূর্ণ অনুচ্ছেদ ও সংশোধনীসমূহ' },
              { title: 'বাংলা সাহিত্যের যুগবিভাগ', desc: 'চর্যাপদ থেকে আধুনিক যুগের সারসংক্ষেপ' },
              { title: 'English Literature Golden Notes', desc: 'Shakespeare to Romantic Era' },
              { title: 'গণিত ও মানসিক দক্ষতা শর্টকাট', desc: 'দ্রুত সমাধানের সহজ সূত্রাবলি' }
            ].map((book) => (
              <div
                key={book.title}
                className="p-5 rounded-3xl theme-subcard shadow-sm space-y-1.5"
              >
                <h3 className="font-bangla font-bold text-lg theme-text-primary">{book.title}</h3>
                <p className="font-bangla text-sm theme-text-secondary">{book.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 04. PRIVATE TUTOR DESTINATION */}
      {view === 'private-tutor' && (
        <div className="section-card-pt rounded-[2.5rem] p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <PrivateTutor3DIllustration className="w-32 h-32 shrink-0 animate-float-gentle" />
            <div className="text-center sm:text-left space-y-2">
              <h1 className="text-2xl sm:text-3xl font-rounded font-bold theme-text-primary">
                Private Tutor
              </h1>
              <p className="theme-text-secondary font-bangla text-sm sm:text-base">
                আপনার ব্যক্তিগত এআই লার্নিং সঙ্গী—যেকোনো কঠিন বিষয় সহজভাবে বুঝে নিন
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl theme-subcard space-y-4">
            <div className="flex items-center gap-2 text-fuchsia-600 dark:text-fuchsia-300 font-rounded font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Today’s Friendly Tip</span>
            </div>
            <p className="font-bangla theme-text-primary leading-relaxed">
              সংবিধানের ২৭, ২৮ এবং ২৯ অনুচ্ছেদ মনে রাখার সহজ কৌশল: ২৭ মানে সবার সমান অধিকার, ২৮ মানে ধর্ম-বর্ণে কোনো ভেদাভেদ নেই, আর ২৯ মানে সরকারি চাকরিতে সবার সমান সুযোগ!
            </p>
          </div>
        </div>
      )}

      {/* 05. BCS UPDATES DESTINATION */}
      {view === 'bcs-updates' && (
        <div className="section-card-up rounded-[2.5rem] p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <BCSUpdates3DIllustration className="w-32 h-32 shrink-0 animate-float-gentle" />
            <div className="text-center sm:text-left space-y-2">
              <h1 className="text-2xl sm:text-3xl font-rounded font-bold theme-text-primary">
                BCS Updates
              </h1>
              <p className="theme-text-secondary font-bangla text-sm sm:text-base">
                পিএসসি-এর সর্বশেষ বিজ্ঞপ্তি, পরীক্ষার তারিখ এবং ফলাফল সংক্রান্ত আপডেট
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {[
              {
                badge: '50th BCS',
                title: '৫০তম বিসিএস মৌখিক পরীক্ষা (ভাইভা) ও পরবর্তী সময়সূচি নির্দেশনা',
                date: '২০২৬'
              },
              {
                badge: '51st BCS',
                title: '৫১তম বিসিএস পরীক্ষার বিজ্ঞপ্তি ও প্রস্তুতি সংক্রান্ত আপডেট',
                date: '২০২৬'
              }
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-3xl theme-subcard flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <span className="inline-block px-3 py-0.5 rounded-full bg-orange-500/20 text-orange-700 dark:text-orange-300 font-rounded font-bold text-xs">
                    {item.badge}
                  </span>
                  <h3 className="font-bangla font-bold text-base sm:text-lg theme-text-primary">
                    {item.title}
                  </h3>
                </div>
                <span className="font-bangla text-xs theme-text-muted">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOTTOM NAV: PROGRESS */}
      {view === 'progress' && (
        <div className="section-card-sm rounded-[2.5rem] p-6 sm:p-10 space-y-6">
          <h1 className="text-2xl sm:text-3xl font-rounded font-bold theme-text-primary">
            Your Learning Progress
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Completed Lessons', value: '24' },
              { label: 'Practice Accuracy', value: '88%' },
              { label: 'Study Streak', value: '14 Days' }
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-6 rounded-3xl theme-subcard text-center space-y-1"
              >
                <div className="text-3xl font-rounded font-bold theme-text-primary">
                  {stat.value}
                </div>
                <div className="text-xs font-rounded theme-text-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOTTOM NAV: PROFILE */}
      {view === 'profile' && (
        <div className="section-card-pt rounded-[2.5rem] p-6 sm:p-10 space-y-6 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-400 mx-auto flex items-center justify-center text-white font-rounded font-bold text-3xl shadow-lg uppercase">
            {currentUser?.username.slice(0, 2) || 'BC'}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-rounded font-bold theme-text-primary">
              {currentUser?.displayName || 'BCS Candidate'}
            </h1>
            <p className="text-sm font-rounded theme-text-secondary">
              {currentUser?.email || '50th & 51st BCS Aspirant'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 font-rounded font-bold text-sm">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Consistent Scholar Badge</span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-500/15 border border-rose-400/40 text-rose-700 dark:text-rose-300 font-rounded font-bold text-sm hover:bg-rose-500/25 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM NAV: SETTINGS */}
      {view === 'settings' && (
        <div className="section-card-qb rounded-[2.5rem] p-6 sm:p-10 space-y-6">
          <h1 className="text-2xl sm:text-3xl font-rounded font-bold theme-text-primary">
            Settings
          </h1>
          <div className="space-y-4">
            <div className="p-5 rounded-3xl theme-subcard flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-sky-500" />
                <span className="font-rounded font-bold theme-text-primary">Sound Effects</span>
              </div>
              <button
                onClick={() => setSoundEnabled((v) => !v)}
                className={`px-4 py-2 rounded-full font-rounded font-bold text-xs cursor-pointer transition-all ${
                  soundEnabled
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-400/30 theme-text-secondary'
                }`}
              >
                {soundEnabled ? 'On' : 'Off'}
              </button>
            </div>

            <div className="p-5 rounded-3xl theme-subcard flex flex-wrap items-center justify-between gap-3">
              <span className="font-rounded font-bold theme-text-primary">Daily Study Pace</span>
              <div className="flex items-center gap-2">
                {(['Calm', 'Regular', 'Intense'] as const).map((pace) => (
                  <button
                    key={pace}
                    onClick={() => setDailyGoal(pace)}
                    className={`px-4 py-1.5 rounded-full font-rounded font-bold text-xs cursor-pointer transition-all ${
                      dailyGoal === pace
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-500/15 theme-text-primary'
                    }`}
                  >
                    {pace}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV: LEADERBOARD */}
      {view === 'leaderboard' && (
        <div className="section-card-up rounded-[2.5rem] p-6 sm:p-10 space-y-6">
          <h1 className="text-2xl sm:text-3xl font-rounded font-bold theme-text-primary">
            Leaderboard
          </h1>
          <div className="space-y-3">
            {[
              { rank: 1, name: 'তাহমিদুল ইসলাম', points: '2,450 XP', color: 'bg-amber-400 text-amber-950' },
              { rank: 2, name: 'নুসরাত জাহান অরিন', points: '2,380 XP', color: 'bg-slate-200 text-slate-800' },
              { rank: 3, name: 'সপ্তর্ষি চৌধুরী', points: '2,290 XP', color: 'bg-orange-300 text-orange-950' },
              { rank: 4, name: 'ফারহান সাদিক (You)', points: '2,180 XP', color: 'bg-indigo-500 text-white' }
            ].map((row) => (
              <div
                key={row.rank}
                className={`p-4 sm:p-5 rounded-3xl flex items-center justify-between ${
                  row.rank === 4
                    ? 'bg-indigo-500/20 border-2 border-indigo-400'
                    : 'theme-subcard'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-rounded font-bold text-sm ${row.color}`}
                  >
                    #{row.rank}
                  </span>
                  <span className="font-bangla font-bold text-base sm:text-lg theme-text-primary">
                    {row.name}
                  </span>
                </div>
                <span className="font-rounded font-bold text-sm text-indigo-600 dark:text-indigo-300">
                  {row.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
