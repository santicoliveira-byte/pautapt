import React, { useState, useEffect } from 'react';
import {
  EvaluationType,
  SchoolTest,
  SubjectCriteriaMap,
  SubjectCriterionDomain,
  UpcomingEvaluation,
} from './types';
import {
  loadSavedTests,
  saveTests,
  loadSavedUpcomingEvaluations,
  saveUpcomingEvaluations,
  loadSubjectCriteria,
  saveSubjectCriteria,
} from './utils/storage';
import { getSubjectCriteriaEntry } from './utils/gradeUtils';
import { Header } from './components/Header';
import { TabBar, TabType } from './components/TabBar';
import { DashboardView } from './components/DashboardView';
import { TestWizard } from './components/TestWizard';
import { SubjectsView } from './components/SubjectsView';
import { SimulatorView } from './components/SimulatorView';
import { SecondaryAverageCalculator } from './components/SecondaryAverageCalculator';
import { HigherEducationSimulator } from './components/HigherEducationSimulator';
import { AgendaView } from './components/AgendaView';
import { SettingsView } from './components/SettingsView';
import { TestDetailModal } from './components/TestDetailModal';
import { ReportModal } from './components/ReportModal';
import { UpcomingAgendaModal } from './components/UpcomingAgendaModal';
import { getStoredAccentColor, applyAccentColor, AccentColor } from './utils/theme';

export const App: React.FC = () => {
  const [tests, setTests] = useState<SchoolTest[]>(() => loadSavedTests());
  const [evaluations, setEvaluations] = useState<UpcomingEvaluation[]>(() =>
    loadSavedUpcomingEvaluations()
  );
  const [subjectCriteria, setSubjectCriteria] = useState<SubjectCriteriaMap>(() =>
    loadSubjectCriteria()
  );
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState<boolean>(false);
  const [agendaInitialSubject, setAgendaInitialSubject] = useState<string>('');
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

  // Persist tests to localStorage
  useEffect(() => {
    saveTests(tests);
  }, [tests]);

  // Persist upcoming evaluations to localStorage
  useEffect(() => {
    saveUpcomingEvaluations(evaluations);
  }, [evaluations]);

  // Persist subject evaluation criteria to localStorage
  useEffect(() => {
    saveSubjectCriteria(subjectCriteria);
  }, [subjectCriteria]);

  const handleSaveSubjectCriteria = (subjectName: string, criteria: SubjectCriterionDomain[]) => {
    setSubjectCriteria((prev) => {
      const { key } = getSubjectCriteriaEntry(prev, subjectName);
      const targetKey = key || subjectName.trim();
      const next = { ...prev };
      if (criteria.length === 0) {
        delete next[targetKey];
      } else {
        next[targetKey] = criteria;
      }
      return next;
    });
  };

  // Handle saving upcoming evaluation
  const handleSaveEvaluation = (savedEvaluation: UpcomingEvaluation) => {
    setEvaluations((prev) => {
      const idx = prev.findIndex((e) => e.id === savedEvaluation.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedEvaluation;
        return copy;
      }
      return [savedEvaluation, ...prev];
    });
  };

  // Handle deleting evaluation
  const handleDeleteEvaluation = (id: string) => {
    setEvaluations((prev) => prev.filter((e) => e.id !== id));
  };

  // Mark evaluation as completed (converts to a test wizard draft)
  const handleMarkEvaluationCompleted = (item: UpcomingEvaluation) => {
    setIsAgendaModalOpen(false);
    setEditingTest({
      id: '',
      title: item.title,
      subject: item.subject,
      totalScale: item.totalScale || 200,
      weight: item.weight || (item.type === 'teste' ? 2 : 1),
      type: item.type,
      mode: 'domains',
      domains: [
        { id: '1', name: 'Domínio 1', maxScore: (item.totalScale || 200) / 2, obtainedScore: 0 },
        { id: '2', name: 'Domínio 2', maxScore: (item.totalScale || 200) / 2, obtainedScore: 0 },
      ],
      obtainedPoints: 0,
      grade20: 0,
      percentage: 0,
      classification: 'insuficiente',
      term: '1º Período',
      date: item.date,
      notes: item.notes,
    });
    setActiveTab('calculator');
  };

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

  // Handle direct weight and type update from modal
  const handleUpdateTestWeight = (testId: string, newWeight: number, newType?: EvaluationType) => {
    setTests((prev) =>
      prev.map((t) => {
        if (t.id === testId) {
          return {
            ...t,
            weight: newWeight,
            ...(newType ? { type: newType } : {}),
          };
        }
        return t;
      })
    );
    if (selectedTestModal?.id === testId) {
      setSelectedTestModal((prev) =>
        prev
          ? {
              ...prev,
              weight: newWeight,
              ...(newType ? { type: newType } : {}),
            }
          : null
      );
    }
  };

  // Update criteria domains present in a test directly from modal
  const handleUpdateTestCriteriaDomains = (testId: string, domainIds: string[]) => {
    const allowedSet = new Set(domainIds);
    const updateTestItem = (t: SchoolTest): SchoolTest => ({
      ...t,
      criteriaDomainIds: domainIds.length > 0 ? domainIds : undefined,
      domains: Array.isArray(t.domains)
        ? t.domains.map((d) =>
            d.criterionId && !allowedSet.has(d.criterionId)
              ? { ...d, criterionId: undefined }
              : d
          )
        : [],
    });

    setTests((prev) => prev.map((t) => (t.id === testId ? updateTestItem(t) : t)));
    if (selectedTestModal?.id === testId) {
      setSelectedTestModal((prev) => (prev ? updateTestItem(prev) : null));
    }
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
      weight: 2,
      type: 'teste',
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
        onChangeTab={(tab) => {
          if (tab === 'calculator') setEditingTest(null);
          setActiveTab(tab);
        }}
        onNewTestClick={() => {
          setEditingTest(null);
          setActiveTab('calculator');
        }}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto">
        {activeTab === 'dashboard' && (
          <DashboardView
            tests={tests}
            evaluations={evaluations}
            subjectCriteria={subjectCriteria}
            onSelectTest={(test) => setSelectedTestModal(test)}
            onNewTestClick={() => {
              setEditingTest(null);
              setActiveTab('calculator');
            }}
            onOpenSimulator={() => setActiveTab('simulator')}
            onOpenSecondary={() => setActiveTab('secondary')}
            onOpenExams={() => setActiveTab('exams')}
            onOpenSubjects={() => setActiveTab('subjects')}
            onSelectSubject={(subj) => {
              setSimulatorSubject(subj);
              setActiveTab('subjects');
            }}
            onOpenReport={() => setIsReportModalOpen(true)}
            onOpenAgenda={() => setActiveTab('agenda')}
            onQuickAddEvaluation={() => {
              setAgendaInitialSubject('');
              setIsAgendaModalOpen(true);
            }}
          />
        )}

        {activeTab === 'secondary' && (
          <div className="max-w-5xl mx-auto pb-28 pt-2 px-3 sm:px-6 animate-fade-in">
            <SecondaryAverageCalculator
              tests={tests}
              subjectCriteria={subjectCriteria}
              onNavigateToNewTest={handleNewTestForSubject}
            />
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="max-w-4xl mx-auto pb-28 pt-2 px-3 sm:px-6 animate-fade-in">
            <HigherEducationSimulator tests={tests} subjectCriteria={subjectCriteria} />
          </div>
        )}

        {activeTab === 'agenda' && (
          <AgendaView
            evaluations={evaluations}
            onSaveEvaluation={handleSaveEvaluation}
            onDeleteEvaluation={handleDeleteEvaluation}
            onMarkAsCompleted={handleMarkEvaluationCompleted}
            existingSubjects={Array.from(new Set(tests.map((t) => t.subject)))}
            initialSubject={agendaInitialSubject}
          />
        )}

        {activeTab === 'calculator' && (
          <div className="max-w-xl mx-auto px-2">
            <TestWizard
              onSaveTest={handleSaveTest}
              initialTest={editingTest}
              subjectCriteria={subjectCriteria}
              onSaveSubjectCriteria={handleSaveSubjectCriteria}
              onCancel={() => {
                setEditingTest(null);
                setActiveTab('dashboard');
              }}
            />
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="max-w-3xl mx-auto px-2">
            <SubjectsView
              tests={tests}
              subjectCriteria={subjectCriteria}
              onSaveSubjectCriteria={handleSaveSubjectCriteria}
              onSelectTest={(test) => setSelectedTestModal(test)}
              onNewTestForSubject={handleNewTestForSubject}
              onSimulateForSubject={handleSimulateForSubject}
              onDeleteTest={handleDeleteTest}
              onScheduleForSubject={(subj) => {
                setAgendaInitialSubject(subj);
                setIsAgendaModalOpen(true);
              }}
            />
          </div>
        )}

        {activeTab === 'simulator' && (
          <div className="max-w-4xl mx-auto pb-28 pt-2 px-3 sm:px-6 animate-fade-in">
            <SimulatorView
              tests={tests}
              subjectCriteria={subjectCriteria}
              initialSubject={simulatorSubject}
              onNavigateToNewTest={handleNewTestForSubject}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto px-2">
            <SettingsView
              tests={tests}
              subjectCriteria={subjectCriteria}
              onImportSuccess={(imported, importedCriteria) => {
                setTests(imported);
                if (importedCriteria) {
                  setSubjectCriteria(importedCriteria);
                }
              }}
              onClearAll={() => setTests([])}
              currentAccent={currentAccent}
              onAccentChange={handleAccentChange}
            />
          </div>
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
        onUpdateWeight={handleUpdateTestWeight}
        subjectCriteria={
          selectedTestModal
            ? getSubjectCriteriaEntry(subjectCriteria, selectedTestModal.subject).criteria
            : []
        }
        onUpdateCriteriaDomains={handleUpdateTestCriteriaDomains}
      />

      {/* Printable Report / Pauta Escolar Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        tests={tests}
        subjectCriteria={subjectCriteria}
      />

      {/* Upcoming Evaluations & Calendar (.ics) Modal */}
      <UpcomingAgendaModal
        isOpen={isAgendaModalOpen}
        onClose={() => setIsAgendaModalOpen(false)}
        evaluations={evaluations}
        onSaveEvaluation={handleSaveEvaluation}
        onDeleteEvaluation={handleDeleteEvaluation}
        onMarkAsCompleted={handleMarkEvaluationCompleted}
        existingSubjects={Array.from(new Set(tests.map((t) => t.subject)))}
        initialSubject={agendaInitialSubject}
      />
    </div>
  );
};

export default App;
