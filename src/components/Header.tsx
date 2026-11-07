import React from 'react';
import { Award, Plus, Sparkles } from 'lucide-react';

interface HeaderProps {
  onNewTestClick: () => void;
  onSimulatorClick: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  onNewTestClick,
  onSimulatorClick,
  activeTab,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full ios-glass border-b border-white/[0.08] safe-top px-4 pb-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500 flex items-center justify-center shadow-ios-glow-blue">
            <Award className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold tracking-tight text-white">PautaPT</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                0-20 val
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">
              Calculadora & Gestão de Testes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab !== 'simulator' && (
            <button
              onClick={onSimulatorClick}
              title="Simulador de Notas"
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-white/10 ios-pressable transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {activeTab !== 'calculator' && (
            <button
              onClick={onNewTestClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-ios-glow-blue ios-pressable transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Novo Teste</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
