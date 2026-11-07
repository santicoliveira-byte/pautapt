import React, { useRef, useState } from 'react';
import { SchoolTest } from '../types';
import {
  exportDataAsJSON,
  importDataFromJSON,
  clearAllTests,
} from '../utils/storage';
import {
  ACCENT_COLORS,
  AccentColor,
} from '../utils/theme';
import { triggerHaptic } from '../utils/haptics';
import {
  Download,
  Upload,
  Trash2,
  Smartphone,
  Info,
  Check,
  Award,
  Palette,
} from 'lucide-react';

interface SettingsViewProps {
  tests: SchoolTest[];
  onImportSuccess: (imported: SchoolTest[]) => void;
  onClearAll: () => void;
  currentAccent: AccentColor;
  onAccentChange: (accent: AccentColor) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  tests,
  onImportSuccess,
  onClearAll,
  currentAccent,
  onAccentChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const handleExport = () => {
    const jsonStr = exportDataAsJSON(tests);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pautapt_notas_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const imported = importDataFromJSON(content);
      if (imported) {
        onImportSuccess(imported);
        setImportMessage(`Importados ${imported.length} testes com sucesso!`);
      } else {
        setImportMessage('Ficheiro inválido ou corrompido.');
      }
      setTimeout(() => setImportMessage(null), 3500);
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-md mx-auto pb-28 pt-2 px-4 space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Opções & Definições</h2>
        <p className="text-xs text-zinc-400">
          Personalização iOS, cópia de segurança e escala de avaliação
        </p>
      </div>

      {/* iOS Theme Accent Color */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-ios-card space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Cor de Acento do Sistema iOS
          </h3>
        </div>
        <p className="text-xs text-zinc-400">
          Personaliza os realces, seletores e reflexos de luz da aplicação.
        </p>

        <div className="grid grid-cols-5 gap-2 pt-1">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                triggerHaptic('medium');
                onAccentChange(c);
              }}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all ios-pressable ${
                currentAccent.id === c.id
                  ? 'bg-zinc-800 border-white/40 ring-2 ring-white/20'
                  : 'bg-zinc-950/60 border-white/5 hover:bg-zinc-800/50'
              }`}
            >
              <span
                className="w-6 h-6 rounded-full shadow-md transition-transform"
                style={{ backgroundColor: c.hex, boxShadow: `0 0 10px ${c.glow}` }}
              />
              <span className="text-[10px] text-zinc-400 truncate max-w-[50px]">
                {c.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* iOS App installation tips */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-ios-card space-y-2.5">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Instalar no iPhone (Estilo App Nativa)
          </h3>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Para usares o PautaPT em ecrã inteiro sem a barra do Safari:
        </p>
        <ol className="text-xs text-zinc-400 space-y-1.5 pl-4 list-decimal">
          <li>
            Toca no botão de <strong>Partilhar</strong> (ícone de quadrado com seta para cima) no Safari.
          </li>
          <li>
            Desliza e seleciona <strong>"Adicionar ao Ecrã Principal"</strong>.
          </li>
          <li>Pronto! Terás um ícone de app no iPhone com acesso rápido e offline.</li>
        </ol>
      </div>

      {/* Backup and Data Management */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-ios-card space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Cópia de Segurança (localStorage)
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExport}
            className="p-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700/80 border border-white/5 text-left ios-pressable transition-all flex flex-col justify-between"
          >
            <Download className="w-4 h-4 text-blue-400 mb-2" />
            <div>
              <span className="text-xs font-semibold text-white block">Exportar JSON</span>
              <span className="text-[10px] text-zinc-400">Descarregar ficheiro</span>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700/80 border border-white/5 text-left ios-pressable transition-all flex flex-col justify-between"
          >
            <Upload className="w-4 h-4 text-emerald-400 mb-2" />
            <div>
              <span className="text-xs font-semibold text-white block">Importar JSON</span>
              <span className="text-[10px] text-zinc-400">Restaurar cópia</span>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>

        {downloadSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Ficheiro exportado com sucesso!</span>
          </div>
        )}

        {importMessage && (
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>{importMessage}</span>
          </div>
        )}

        {/* Clear Data */}
        <div className="pt-2 border-t border-white/5">
          <button
            onClick={() => {
              if (
                window.confirm(
                  'ATENÇÃO: Desejas apagar todos os testes registados? Esta ação é irreversível a não ser que tenhas um ficheiro de backup.'
                )
              ) {
                clearAllTests();
                onClearAll();
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium flex items-center justify-center gap-2 ios-pressable transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Todos os Dados</span>
          </button>
        </div>
      </div>

      {/* Portugal Grading Scale Reference */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-ios-card space-y-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Escala de Avaliação Escolar em Portugal
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="font-semibold">17.5 a 20.0 valores</span>
            <span>Muito Bom / Excelente</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <span className="font-semibold">13.5 a 17.4 valores</span>
            <span>Bom / Satisfaz Bem</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <span className="font-semibold">9.5 a 13.4 valores</span>
            <span>Suficiente / Satisfaz</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <span className="font-semibold">0.0 a 9.4 valores</span>
            <span>Insuficiente (Negativa)</span>
          </div>
        </div>

        <p className="text-[11px] text-zinc-500 leading-relaxed pt-1">
          * Nos exames nacionais (IAVE) e em muitos testes do Ensino Secundário, a pontuação é atribuída de 0 a 200 pontos, correspondendo 10 pontos a 1.0 valor.
        </p>
      </div>

      {/* App signature */}
      <div className="text-center pt-2 text-[11px] text-zinc-600">
        PautaPT v1.0 • Desenvolvido com React, Tailwind CSS e Vite
      </div>
    </div>
  );
};
