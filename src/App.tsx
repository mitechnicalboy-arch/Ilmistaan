/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AcademicProvider, useAcademic } from './context/AcademicContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { AuthScreen } from './components/auth/AuthScreen';
import { SuspensionGatekeeper } from './components/common/SuspensionGatekeeper';
import { UndoToast } from './components/common/UndoToast';
import { QuickAddModal } from './components/modals/QuickAddModal';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { ItemDetailModal } from './components/modals/ItemDetailModal';
import { SubjectDetailPopupModal } from './components/modals/SubjectDetailPopupModal';
import { EditItemModal } from './components/modals/EditItemModal';
import { ConfirmationModal } from './components/modals/ConfirmationModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { CoursesView } from './components/views/CoursesView';
import { CourseDetailHub } from './components/views/CourseDetailHub';
import { AssignmentsView } from './components/views/AssignmentsView';
import { LecturesView } from './components/views/LecturesView';
import { QuizzesView } from './components/views/QuizzesView';
import { CalendarView } from './components/views/CalendarView';
import { RemindersView } from './components/views/RemindersView';
import { PinnedView } from './components/views/PinnedView';
import { TrashView } from './components/views/TrashView';
import { AITutorView } from './components/views/AITutorView';
import { AdminConsoleView } from './components/views/AdminConsoleView';
import { StudentProfileView } from './components/views/StudentProfileView';

const PortalContent: React.FC = () => {
  const { 
    currentUser, 
    activeView, 
    searchQuery, 
    setSearchQuery, 
    setIsQuickAddOpen,
    confirmModal,
    closeConfirmation
  } = useAcademic();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e || typeof e.key !== 'string') return;

      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
        return;
      }

      // N for quick add (when not in an input or editable field)
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName ? target.tagName.toLowerCase() : '';
      const isEditable = target?.isContentEditable || false;

      if (
        e.key.toLowerCase() === 'n' && 
        !['input', 'textarea', 'select'].includes(tagName) &&
        !isEditable &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        setIsQuickAddOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsQuickAddOpen]);

  // Open search modal if top search bar is typed into
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setIsSearchModalOpen(true);
    }
  }, [searchQuery]);

  // Auth gate
  if (!currentUser) {
    return <AuthScreen />;
  }

  // Account suspension gatekeeper
  if (currentUser.isSuspended) {
    return <SuspensionGatekeeper />;
  }

  // View dispatcher
  const renderCurrentView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'courses':
        return <CoursesView />;
      case 'course-detail':
        return <CourseDetailHub />;
      case 'assignments':
        return <AssignmentsView />;
      case 'lectures':
        return <LecturesView />;
      case 'quizzes':
        return <QuizzesView />;
      case 'calendar':
        return <CalendarView />;
      case 'reminders':
        return <RemindersView />;
      case 'pinned':
        return <PinnedView />;
      case 'trash':
        return <TrashView />;
      case 'tutor':
        return <AITutorView />;
      case 'admin':
        return currentUser.role === 'admin' ? <AdminConsoleView /> : <DashboardView />;
      case 'profile':
        return <StudentProfileView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAF9] overflow-hidden">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 bg-white h-full shadow-2xl">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader onToggleMobileMenu={() => setIsMobileMenuOpen(true)} />

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderCurrentView()}
        </main>

        {/* Mobile thumb bottom nav */}
        <MobileBottomNav />
      </div>

      {/* Modals & Toasts */}
      <QuickAddModal />
      <ItemDetailModal />
      <EditItemModal />
      <SubjectDetailPopupModal />
      <GlobalSearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => {
          setIsSearchModalOpen(false);
          setSearchQuery('');
        }} 
      />
      <UndoToast />
      <ConfirmationModal config={confirmModal} onClose={closeConfirmation} />
    </div>
  );
};

export default function App() {
  return (
    <AcademicProvider>
      <PortalContent />
    </AcademicProvider>
  );
}
