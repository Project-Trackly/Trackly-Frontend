/**
 * 3D Task Visualization Page
 *
 * T018: Next.js App Router page for 3D task view
 * Dynamic route: /projects/[id]/3d
 */

'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { WebGLDetector, FallbackView2D } from '@/components/3d';

// Dynamic import for 3D component (client-side only, no SSR)
// This prevents Three.js from breaking SSR and reduces initial bundle size
const TaskVisualization3D = dynamic(
  () => import('@/components/3d/TaskVisualization3D').then((mod) => mod.TaskVisualization3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading 3D View...</p>
        </div>
      </div>
    ),
  }
);

// Simple test component for debugging
const SimpleTest3D = dynamic(
  () => import('@/components/3d/SimpleTest3D').then((mod) => mod.SimpleTest3D),
  {
    ssr: false,
    loading: () => <div>Loading Test 3D...</div>,
  }
);

// Simplified TaskVisualization for debugging
const TaskVisualizationSimple = dynamic(
  () => import('@/components/3d/TaskVisualizationSimple').then((mod) => mod.TaskVisualizationSimple),
  {
    ssr: false,
    loading: () => <div>Loading Simple Task View...</div>,
  }
);

// Create QueryClient instance for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 30_000, // 30 seconds
      refetchOnWindowFocus: true,
    },
  },
});

interface PageProps {
  params: { id: string };
}

/**
 * 3D Task View Page Component
 * 
 * This is the main entry point for 3D task visualization.
 * Compatible with Next.js 14 App Router.
 */
export default function Page3D({ params }: PageProps) {
  const { id: projectId } = params;

  return (
    <QueryClientProvider client={queryClient}>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a
                href={`/projects/${projectId}`}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                ← Back to Project
              </a>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                3D Task View
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Project #{projectId}</span>
            </div>
          </div>
        </header>

        {/* 3D Content with WebGL Detection */}
        <div className="container mx-auto px-4 py-8">
          <WebGLDetector fallback={<FallbackView2D projectId={projectId} />}>
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[600px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Initializing 3D scene...</p>
                  </div>
                </div>
              }
            >
              <TaskVisualizationSimple projectId={projectId} />
              {/* <SimpleTest3D /> */}
              {/* <TaskVisualization3D projectId={projectId} /> */}
            </Suspense>
          </WebGLDetector>
        </div>
      </main>

      {/* React Query DevTools (development only) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
