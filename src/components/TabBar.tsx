import React from 'react';
import { LayoutDashboard, Plus, BookOpen, Target, Settings } from 'lucide-react';

export type TabType = 'dashboard' | 'calculator' | 'subjects' | 'simulator' | 'settings';

interface TabBarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  testsCount: number;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onChangeTab, testsCount }) => {
  // Reorganized in perfect 5-column mathematical symmetry:
  // 1: Resumo | 2: Disciplinas | 3: [ + Novo Teste ] (Centro) | 4: Simulador | 5: Opções
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Resumo',
      icon: LayoutDashboard,
      badge: testsCount > 0 ? testsCount : undefined,
    },
    {
      id: 'subjects' as TabType,
      label: 'Disciplinas',
      icon: BookOpen,
    },
    {
      id: 'calculator' as TabType,
      label: 'Novo Teste',
      icon: Plus,
      isCenterAction: true,
    },
    {
      id: 'simulator' as TabType,
      label: 'Simulador',
      icon: Target,
    },
    {
      id: 'settings' as TabType,
      label: 'Opções',
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-safe pt-1">
      <div className="max-w-md mx-auto mb-2 bg-zinc-950/85 backdrop-blur-2xl border border-white/[0.1] rounded-3xl p-1.5 shadow-2xl grid grid-cols-5 items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          if (tab.isCenterAction) {
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className="relative flex flex-col items-center justify-center py-0.5 -mt-3.5 ios-pressable group"
              >
                <div
                  className={`w-11 h-11 rounded-2xl bg-blue-600 text-white shadow-ios-glow-blue border-2 border-zinc-950 flex items-center justify-center transition-all duration-200 ${
                    isActive ? 'scale-105 ring-2 ring-white/30' : 'group-hover:scale-105'
                  }`}
                >
                  <Plus className="w-5 h-5 stroke-[2.8]" />
                </div>
                <span
                  className={`text-[9.5px] mt-1 font-semibold tracking-tight transition-colors ${
                    isActive ? 'text-blue-400' : 'text-zinc-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 ios-pressable ${
                isActive
                  ? 'text-blue-400 font-semibold'
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
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight transition-colors ${
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
