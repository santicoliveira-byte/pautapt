import React from 'react';
import {
  LayoutDashboard,
  Plus,
  GraduationCap,
  Target,
  Calendar,
  BookOpen,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'subjects'
  | 'secondary'
  | 'calculator'
  | 'exams'
  | 'agenda'
  | 'settings'
  | 'simulator';

interface TabBarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  testsCount: number;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onChangeTab, testsCount: _testsCount }) => {
  // 6 main intuitive pillars in bottom bar:
  // 1: Resumo | 2: Disciplinas (%) | 3: Secundário (3:2:1) | 4: Exames | 5: Agenda | 6: + Teste
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Resumo',
      icon: LayoutDashboard,
    },
    {
      id: 'subjects' as TabType,
      label: 'Disciplinas',
      icon: BookOpen,
      badge: '%',
    },
    {
      id: 'secondary' as TabType,
      label: 'Secundário',
      icon: GraduationCap,
      badge: '3:2:1',
    },
    {
      id: 'exams' as TabType,
      label: 'Exames',
      icon: Target,
    },
    {
      id: 'agenda' as TabType,
      label: 'Agenda',
      icon: Calendar,
    },
    {
      id: 'calculator' as TabType,
      label: '+ Teste',
      icon: Plus,
      isAction: true,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-3 pb-safe pt-1 pointer-events-none">
      <div className="pointer-events-auto max-w-lg mx-auto mb-2 bg-zinc-950/90 backdrop-blur-2xl border border-white/[0.1] rounded-3xl p-1.5 shadow-2xl grid grid-cols-6 gap-0.5 items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-ios-glow-blue transition-all duration-200 ios-pressable ${
                  isActive ? 'ring-2 ring-white/40 scale-[1.02]' : ''
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.6]" />
                <span className="text-[9.5px] mt-0.5 font-bold tracking-tight truncate max-w-full">
                  Teste
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all duration-200 ios-pressable min-w-0 ${
                isActive
                  ? 'text-blue-400 font-semibold bg-blue-500/10'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 px-1 h-3.5 rounded-full bg-blue-500 text-white text-[8px] font-black flex items-center justify-center leading-none">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[9.5px] mt-1 tracking-tight truncate max-w-full transition-colors ${
                  isActive ? 'text-blue-400' : 'text-zinc-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
