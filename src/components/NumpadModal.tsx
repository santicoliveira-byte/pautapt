import React, { useState, useEffect } from 'react';
import { Delete, Check, X } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface NumpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (val: number) => void;
  title: string;
  maxScore: number;
  initialValue: number;
}

export const NumpadModal: React.FC<NumpadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  maxScore,
  initialValue,
}) => {
  const [valueStr, setValueStr] = useState<string>(String(initialValue || ''));

  useEffect(() => {
    if (isOpen) {
      setValueStr(initialValue > 0 ? String(initialValue) : '');
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const currentNum = Number(valueStr) || 0;
  const grade20Equivalent = maxScore > 0 ? ((currentNum / maxScore) * 20).toFixed(1) : '0.0';

  const handleKeyPress = (char: string) => {
    triggerHaptic('light');
    if (char === '.' && valueStr.includes('.')) return;
    if (valueStr === '0' && char !== '.') {
      setValueStr(char);
      return;
    }
    const next = valueStr + char;
    if (Number(next) <= maxScore * 1.5) {
      setValueStr(next);
    }
  };

  const handleBackspace = () => {
    triggerHaptic('light');
    setValueStr((prev) => prev.slice(0, -1));
  };

  const handleQuickPreset = (pct: number) => {
    triggerHaptic('medium');
    const val = Number((maxScore * pct).toFixed(1));
    setValueStr(String(val));
  };

  const handleSave = () => {
    triggerHaptic('success');
    const finalVal = Math.min(maxScore, Math.max(0, Number(valueStr) || 0));
    onConfirm(finalVal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-zinc-950 border-t border-white/10 rounded-t-3xl p-4 safe-bottom shadow-2xl animate-slide-up">
        {/* iOS Drag Indicator */}
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-3" />

        {/* Top Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Teclado Rápido iOS
            </span>
            <h4 className="text-xs font-bold text-white truncate max-w-[240px]">{title}</h4>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Display Box */}
        <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-3 flex items-center justify-between mb-3">
          <div>
            <div className="text-3xl font-black text-white">
              {valueStr || '0'}
              <span className="text-xs font-medium text-zinc-500 ml-1">/ {maxScore} pts</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Corresponde a <strong className="text-blue-400">{grade20Equivalent}</strong> / 20 valores
            </div>
          </div>

          <button
            onClick={handleBackspace}
            className="p-3 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white active:scale-95 transition-all"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Percentages Chips */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {[
            { label: '0 pts', pct: 0 },
            { label: '50%', pct: 0.5 },
            { label: '75%', pct: 0.75 },
            { label: `Máx (${maxScore})`, pct: 1 },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleQuickPreset(item.pct)}
              className="py-1.5 px-1 rounded-xl bg-zinc-900 border border-white/5 text-[11px] font-semibold text-zinc-300 active:scale-95 hover:bg-zinc-800"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 3x4 Number Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-12 rounded-2xl bg-zinc-900/80 active:bg-zinc-700 text-xl font-semibold text-white border border-white/5 active:scale-95 transition-all flex items-center justify-center shadow-sm"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleSave}
            className="h-12 rounded-2xl bg-blue-600 active:bg-blue-500 text-white font-bold text-sm shadow-ios-glow-blue active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>OK</span>
          </button>
        </div>
      </div>
    </div>
  );
};
