import React, { useState, useEffect } from 'react';
import { SchoolTest } from './types';
import { loadSavedTests, saveTests } from './utils/storage';
import { Header } from './components/Header';
import { TabBar, TabType } from './components/TabBar';
import { DashboardView } from './components/DashboardView';
import { TestWizard } from './components/TestWizard';
import { SubjectsView } from './components/SubjectsView';
import { SimulatorView } from './components/SimulatorView';
import { SettingsView } from './components/SettingsView';
import { TestDetailModal } from './components/TestDetailModal';
import { ReportModal } from './components/ReportModal';
import { getStoredAccentColor, applyAccentColor, AccentColor } from './utils/theme';

export const App: React.FC = () => {
  const [tests, setTests] = useState<SchoolTest[]>(() => loadSavedTests());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedTestModal, setSelectedTestModal] = useState<SchoolTest | null>(null);
  const [editingTest, setEditingTest] = useState<SchoolTest | null>(null);
  const [simulatorSubject, setSimulatorSubject] = useState<string>('');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [currentAccent, setCurrentAccent] = useState<AccentColor>(() => getStoredAccentColor());

  const handleAccentChange = (accent: AccentColor) => {
    setCurrentAccent(accent);
    applyAccentColor(accent);
  };

  // Apply stored accent color on load
  useEffect(() => {
    applyAccentColor(currentAccent);
  }, [currentAccent]);

  // Persist to localStorage whenever tests change
  useEffect(() => {
    saveTests(tests);
  }, [tests]);

  // Handle saving new or edited test
  const handleSaveTest = (savedTest: SchoolTest) => {
    setTests((prev) => {
      const existsIndex = prev.findIndex((t) => t.id === savedTest.id);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = savedTest;
        return copy;
      }
      return [savedTest, ...prev];
    });

    // Reset editing state and switch back to dashboard or stay
    setEditingTest(null);
    setTimeout(() => {
      setActiveTab('dashboard');
    }, 400);
  };

  // Delete test
  const handleDeleteTest = (id: string) => {
    setTests((prev) => prev.filter((t) => t.id !== id));
    if (selectedTestModal?.id === id) {
      setSelectedTestModal(null);
    }
  };

  // Edit test
  const handleEditTest = (test: SchoolTest) => {
    setEditingTest(test);
    setSelectedTestModal(null);
    setActiveTab('calculator');
  };

  // Quick Action: New test for specific subject
  const handleNewTestForSubject = (subjectName: string) => {
    setEditingTest({
      id: '',
      title: '',
      subject: subjectName,
      totalScale: 200,
      weight: 30,
      mode: 'domains',
      domains: [
        { id: '1', name: 'Domínio 1', maxScore: 100, obtainedScore: 0 },
        { id: '2', name: 'Domínio 2', maxScore: 100, obtainedScore: 0 },
      ],
      obtainedPoints: 0,
      grade20: 0,
      percentage: 0,
      classification: 'insuficiente',
      term: '1º Período',
      date: new Date().toISOString().split('T')[0],
    });
    setActiveTab('calculator');
  };

  // Quick Action: Simulate for specific subject
  const handleSimulateForSubject = (subjectName: string) => {
    setSimulatorSubject(subjectName);
    setActiveTab('simulator');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Sticky iOS Top Navigation */}
      <Header
        activeTab={activeTab}
        onNewTestClick={() => {
          setEditingTest(null);
          setActiveTab('calculator');
        }}
        onSimulatorClick={() => setActiveTab('simulator')}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto">
        {activeTab === 'dashboard' && (
          <DashboardView
            tests={tests}
            onSelectTest={(test) => setSelectedTestModal(test)}
            onNewTestClick={() => {
              setEditingTest(null);
              setActiveTab('calculator');
            }}
            onOpenSimulator={() => setActiveTab('simulator')}
            onSelectSubject={(subj) => {
              setSimulatorSubject(subj);
              setActiveTab('subjects');
            }}
            onOpenReport={() => setIsReportModalOpen(true)}
          />
        )}

        {activeTab === 'calculator' && (
          <TestWizard
            onSaveTest={handleSaveTest}
            initialTest={editingTest}
            onCancel={() => {
              setEditingTest(null);
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'subjects' && (
          <SubjectsView
            tests={tests}
            onSelectTest={(test) => setSelectedTestModal(test)}
            onNewTestForSubject={handleNewTestForSubject}
            onSimulateForSubject={handleSimulateForSubject}
            onDeleteTest={handleDeleteTest}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorView
            tests={tests}
            initialSubject={simulatorSubject}
            onNavigateToNewTest={handleNewTestForSubject}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            tests={tests}
            onImportSuccess={(imported) => setTests(imported)}
            onClearAll={() => setTests([])}
            currentAccent={currentAccent}
            onAccentChange={handleAccentChange}
          />
        )}
      </main>

      {/* Bottom Floating iOS TabBar */}
      <TabBar
        activeTab={activeTab}
        onChangeTab={(tab) => {
          if (tab === 'calculator') {
            setEditingTest(null);
          }
          setActiveTab(tab);
        }}
        testsCount={tests.length}
      />

      {/* Detail & Action Modal */}
      <TestDetailModal
        test={selectedTestModal}
        onClose={() => setSelectedTestModal(null)}
        onDelete={handleDeleteTest}
        onEdit={handleEditTest}
      />

      {/* Printable Report / Pauta Escolar Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        tests={tests}
      />
    </div>
  );
};

export default App;
