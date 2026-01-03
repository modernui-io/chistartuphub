import './App.css'
import { Suspense } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageSkeleton from '@/components/PageSkeleton';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClientInstance}>
        <AuthProvider>
          <Router>
            <LayoutWrapper currentPageName={mainPageKey}>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route path="/" element={<MainPage />} />
                  {Object.entries(Pages).map(([path, Page]) => (
                    <Route key={path} path={`/${path}`} element={<Page />} />
                  ))}
                  <Route path="/stories/:slug" element={<Pages.StoryDetail />} />
                  <Route path="/ecosystem/founder-asks" element={<Navigate to="/Opportunities" replace />} />
                  <Route path="*" element={
                    <div className="min-h-screen flex items-center justify-center bg-[#050A14]">
                      <div className="text-center">
                        <span className="font-mono text-[10px] text-white/20 uppercase tracking-[0.2em] block mb-4">[ERROR: 404]</span>
                        <h1 className="font-serif text-4xl text-white mb-3">Page Not Found</h1>
                        <p className="text-white/40 text-sm mb-8">The page you're looking for doesn't exist.</p>
                        <a 
                          href="/" 
                          className="font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 border border-white/20 text-white/50 hover:bg-white hover:text-black transition-colors cursor-crosshair inline-block"
                        >
                          Go Home
                        </a>
                      </div>
                    </div>
                  } />
                </Routes>
              </Suspense>
            </LayoutWrapper>
          </Router>
          <Toaster />
          <Analytics />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
