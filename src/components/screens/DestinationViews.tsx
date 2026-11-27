import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { LeaderboardView, ProfileView, ProgressView, SettingsView } from './AccountViews';
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

  // 01. MOCK TEST DESTINATION — Dedicated Game-Like Responsive Exam Arena
  if (view === 'mock-test') {
    return <MockTestArena onBackHome={onBackHome} />;
  }

  return (
    <div
      className={`w-full ${
        view === 'question-bank' ? 'max-w-6xl' : 'max-w-4xl'
      } mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-12 sm:pb-16`}
    >
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

      {view === 'progress' && <ProgressView />}
      {view === 'profile' && <ProfileView currentUser={currentUser} onLogout={onLogout} />}
      {view === 'settings' && <SettingsView currentUser={currentUser} />}
      {view === 'leaderboard' && <LeaderboardView />}
    </div>
  );
};
