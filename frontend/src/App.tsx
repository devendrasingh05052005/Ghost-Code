import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Stepper } from './components/common/Stepper';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { UploadPage } from './pages/UploadPage';
import { ScannerPage } from './pages/ScannerPage';
import { ExecutionPage } from './pages/ExecutionPage';
import { DownloadPage } from './pages/DownloadPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { ghostApi, ApiProject } from './services/api';
import { Check } from 'lucide-react';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('ghostcode_theme') as 'dark' | 'light') || 'dark';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('ghostcode_auth') === 'true';
  });

  const [adminUser, setAdminUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('ghostcode_user') || '{}');
    } catch {
      return null;
    }
  });

  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [maxReachedStep, setMaxReachedStep] = useState<string>('upload');
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ApiProject | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('ghostcode_theme', theme);
  }, [theme]);

  const sayToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = () => {
    localStorage.removeItem('ghostcode_auth');
    localStorage.removeItem('ghostcode_user');
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await ghostApi.getProjects();
      if (res.data.success) {
        const list = res.data.data || [];
        setProjects(list);
        setSelectedProject((prev) => {
          if (!prev) return list[0] || null;
          const stillExists = list.find((p) => p.id === prev.id);
          return stillExists || list[0] || null;
        });
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setSelectedProject((prev) => {
      if (prev?.id === projectId) {
        const remaining = projects.filter((p) => p.id !== projectId);
        return remaining[0] || null;
      }
      return prev;
    });

    try {
      await ghostApi.deleteProject(projectId);
      sayToast('Project deleted');
    } catch (err) {
      console.error('Delete error in backend:', err);
    }
    await loadProjects();
  };

  const handleTriggerScan = async () => {
    if (!selectedProject) return;
    setScanning(true);
    try {
      await ghostApi.runScan(selectedProject.id);
      sayToast('Code autopsy scan completed');
      goToStep('scanner');
    } catch (err) {
      console.error('Error running scan:', err);
    } finally {
      setScanning(false);
    }
  };

  const goToStep = (stepId: string) => {
    setCurrentPage(stepId);
    const order = ['upload', 'scanner', 'review', 'fix', 'execution', 'test', 'download'];
    const curIdx = order.indexOf(stepId);
    const maxIdx = order.indexOf(maxReachedStep);
    if (curIdx > maxIdx) {
      setMaxReachedStep(stepId);
    }
  };

  // Global Keyboard Shortcuts (G then D / P / S)
  useEffect(() => {
    let gPressed = false;
    let timer: any;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const key = e.key.toLowerCase();

      if (gPressed) {
        if (key === 'd') {
          setCurrentPage('dashboard');
          gPressed = false;
          return;
        }
        if (key === 'p') {
          setCurrentPage('projects');
          gPressed = false;
          return;
        }
        if (key === 's') {
          setCurrentPage('settings');
          gPressed = false;
          return;
        }
        gPressed = false;
        return;
      }

      if (key === 'g') {
        gPressed = true;
        clearTimeout(timer);
        timer = setTimeout(() => {
          gPressed = false;
        }, 900);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setIsAuthenticated(true);
          setAdminUser(user);
        }}
      />
    );
  }

  const isWorkflowStep = [
    'upload',
    'scanner',
    'review',
    'fix',
    'execution',
    'test',
    'download'
  ].includes(currentPage);

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardPage
            selectedProject={selectedProject}
            projects={projects}
            onSelectProject={(p) => setSelectedProject(p)}
            onNavigate={(p) => goToStep(p)}
          />
        );

      case 'projects':
        return (
          <ProjectsPage
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={(p) => setSelectedProject(p)}
            onNavigate={(p) => goToStep(p)}
            onRefreshProjects={loadProjects}
            onDeleteProject={handleDeleteProject}
          />
        );

      case 'settings':
        return <SettingsPage />;

      case 'upload':
        return (
          <UploadPage
            onProjectIngested={(p) => {
              setProjects((prev) => [p, ...prev]);
              setSelectedProject(p);
              sayToast(`"${p.name}" ingested and scanned`);
              goToStep('scanner');
            }}
            onNavigate={(p) => goToStep(p)}
          />
        );

      case 'scanner':
      case 'review':
      case 'fix':
        return (
          <ScannerPage
            selectedProject={selectedProject}
            onNavigate={(p) => goToStep(p)}
            onToast={sayToast}
          />
        );

      case 'execution':
      case 'test':
        return (
          <ExecutionPage
            selectedProject={selectedProject}
            onNavigate={(p) => goToStep(p)}
          />
        );

      case 'download':
        return (
          <DownloadPage
            selectedProject={selectedProject}
            onNavigate={(p) => goToStep(p)}
          />
        );

      default:
        return (
          <DashboardPage
            selectedProject={selectedProject}
            projects={projects}
            onSelectProject={(p) => setSelectedProject(p)}
            onNavigate={(p) => goToStep(p)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-ink font-sans select-none">
      {/* Slim Modern Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={(pageId) => {
          if (pageId === 'projects' && selectedProject && isWorkflowStep) {
            goToStep(currentPage);
          } else {
            setCurrentPage(pageId);
          }
        }}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={(p) => {
            setSelectedProject(p);
            sayToast(`Switched to "${p.name}"`);
          }}
          onRefreshProject={loadProjects}
          scanning={scanning}
          onTriggerScan={handleTriggerScan}
          adminUser={adminUser}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenProjects={() => setCurrentPage('projects')}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1080px] mx-auto px-6 lg:px-10 pt-8 pb-12">
            {isWorkflowStep && (
              <Stepper
                current={currentPage}
                maxReached={maxReachedStep}
                onGo={(step) => goToStep(step)}
              />
            )}
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Pop Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-8 right-8 z-50 card px-4 py-3 flex items-center gap-2.5 pop border-success/40 bg-surface shadow-2xl"
        >
          <span className="w-5 h-5 rounded-full bg-success/20 text-success grid place-items-center">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </span>
          <span className="text-sm font-medium text-ink">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
