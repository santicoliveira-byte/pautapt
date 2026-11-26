import React from 'react';
import { TabType } from './TabBar';
import {
  Award,
  Plus,
  LayoutDashboard,
  GraduationCap,
  Target,
  Calendar,
  BookOpen,
  Printer,
  Settings,
} from 'lucide-react';

interface HeaderProps {
  onNewTestClick: () => void;
  onOpenReport?: () => void;
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewTestClick,
  onOpenReport,
  activeTab,
  onChangeTab,
}) => {
  const navItems = [
    { id: 'dashboard' as TabType, label: 'Resumo', icon: LayoutDashboard },
    { id: 'secondary' as TabType, label: 'Secundário (3:2:1)', icon: GraduationCap },
    { id: 'exams' as TabType, label: 'Exames & DGES', icon: Target },
    { id: 'agenda' as TabType, label: 'Agenda', icon: Calendar },
    { id: 'subjects' as TabType, label: 'Disciplinas', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-30 w-full ios-glass border-b border-white/[0.08] safe-top px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div
          onClick={() => onChangeTab('dashboard')}
          className="flex items-center space-x-2.5 cursor-pointer select-none shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500 flex items-center justify-center shadow-ios-glow-blue">
            <Award className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                PautaPT
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                0-20 val
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">
              Secundário & Acesso Superior
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/90 border border-white/10 rounded-2xl p-1 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ios-pressable ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onChangeTab('subjects')}
            title="Disciplinas e Critérios (%)"
            className={`md:hidden p-2 rounded-xl border ios-pressable transition-colors ${
              activeTab === 'subjects'
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {onOpenReport && (
            <button
              type="button"
              onClick={onOpenReport}
              title="Ver Pauta / Relatório em PDF"
              className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white ios-pressable transition-colors"
            >
              <Printer className="w-4 h-4 text-blue-400" />
            </button>
          )}

          {activeTab !== 'calculator' && (
            <button
              type="button"
              onClick={onNewTestClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-ios-glow-blue ios-pressable transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
              <span>Novo Teste</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onChangeTab('settings')}
            title="Definições e Opções"
            className={`p-2 rounded-xl border ios-pressable transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
