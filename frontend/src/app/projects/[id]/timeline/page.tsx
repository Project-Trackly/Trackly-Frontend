/**
 * Timeline View Page
 * 
 * Displays tasks in a chronological timeline visualization
 * Shows task deadlines, dependencies, and progress over time
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@repo/ui';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardBody } from '@repo/ui';
import { Plus, Box, List, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasks3D } from '@/services/api/tasks3d';
import type { Task3D } from '@/types/3d';

interface PageProps {
  params: { id: string };
}

export default function TimelineViewPage({ params }: PageProps) {
  const { id: projectId } = params;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  
  // Fetch tasks
  const { data: tasksData, isLoading, error } = useTasks3D(projectId, true, 0, 100);

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }, [currentDate, viewMode]);

  // Filter and sort tasks by deadline
  const sortedTasks = useMemo(() => {
    if (!tasksData?.tasks) return [];

    return tasksData.tasks
      .filter(task => task.deadline) // Only tasks with deadlines
      .sort((a, b) => {
        const dateA = new Date(a.deadline!);
        const dateB = new Date(b.deadline!);
        return dateA.getTime() - dateB.getTime();
      });
  }, [tasksData]);

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  // Format date display
  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };

    if (viewMode === 'day') {
      return dateRange.start.toLocaleDateString('ko-KR', options);
    } else if (viewMode === 'week') {
      return `${dateRange.start.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} - ${dateRange.end.toLocaleDateString('ko-KR', options)}`;
    } else {
      return dateRange.start.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/projects" 
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              ← 프로젝트 목록
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              타임라인 뷰
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <Link 
            href={`/projects/${projectId}`}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <List className="w-4 h-4" />
            리스트 뷰
          </Link>
          <Link 
            href={`/projects/${projectId}/3d`}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <Box className="w-4 h-4" />
            3D 뷰
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-medium">
            <Calendar className="w-4 h-4" />
            타임라인
          </button>
        </div>

        {/* Timeline Controls */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100 min-w-[200px] text-center">
              {formatDateRange()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="ml-2"
            >
              오늘
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              일
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              주
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              월
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">타임라인을 불러오는 중...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
            <p className="font-medium">타임라인을 불러오는데 실패했습니다</p>
            <p className="text-sm mt-1">{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}</p>
          </div>
        )}

        {/* Timeline Content */}
        {!isLoading && !error && (
          <div className="space-y-6">
            <TimelineView 
              tasks={sortedTasks}
              dateRange={dateRange}
              viewMode={viewMode}
            />
          </div>
        )}
      </div>
    </main>
  );
}

/**
 * Timeline Visualization Component
 */
interface TimelineViewProps {
  tasks: Task3D[];
  dateRange: { start: Date; end: Date };
  viewMode: 'day' | 'week' | 'month';
}

function TimelineView({ tasks, dateRange, viewMode }: TimelineViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg mb-2">마감일이 설정된 태스크가 없습니다</p>
        <p className="text-sm">태스크에 마감일을 추가하면 타임라인에 표시됩니다</p>
      </div>
    );
  }

  // Group tasks by date
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!task.deadline) return acc;

    const date = new Date(task.deadline);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(task);
    
    return acc;
  }, {} as Record<string, Task3D[]>);

  // Sort date keys
  const sortedDates = Object.keys(groupedTasks).sort();
  console.log(sortedDates);

  return (
    <div className="space-y-8">
      {sortedDates.map(dateKey => {
        const date = new Date(dateKey);
        const tasksForDate = groupedTasks[dateKey];
        
        // Check if date is in current view range
        const isInRange = date >= dateRange.start && date <= dateRange.end;
        const isToday = dateKey === new Date().toISOString().split('T')[0];
        const isPast = date < new Date();

        return (
          <div 
            key={dateKey}
            className={`relative ${!isInRange ? 'opacity-30' : ''}`}
          >
            {/* Date Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg ${
                isToday 
                  ? 'bg-blue-600 text-white' 
                  : isPast 
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
              }`}>
                <span className="text-xs font-medium">
                  {date.toLocaleDateString('ko-KR', { month: 'short' })}
                </span>
                <span className="text-2xl font-bold">
                  {date.getDate()}
                </span>
                <span className="text-xs">
                  {date.toLocaleDateString('ko-KR', { weekday: 'short' })}
                </span>
              </div>
              
              <div className="flex-1 border-t-2 border-slate-200 dark:border-slate-700" />
              
              <Badge variant={isToday ? 'default' : 'outline'}>
                {tasksForDate.length}개 태스크
              </Badge>
            </div>

            {/* Tasks for this date */}
            <div className="ml-20 space-y-3">
              {tasksForDate.map((task) => (
                <TimelineTaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Timeline Task Card Component
 */
interface TimelineTaskCardProps {
  task: Task3D;
}

function TimelineTaskCard({ task }: TimelineTaskCardProps) {
  const getPriorityColor = (priority: number) => {
    if (priority >= 70) return 'border-red-500 bg-red-50 dark:bg-red-950/30';
    if (priority >= 50) return 'border-amber-500 bg-amber-50 dark:bg-amber-950/30';
    return 'border-green-500 bg-green-50 dark:bg-green-950/30';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      TODO: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      IN_REVIEW: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      DONE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      BLOCKED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return variants[status] || variants.TODO;
  };

  return (
    <Card className={`border-l-4 ${getPriorityColor(task.priority)}`}>
      <CardBody className="py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                {task.title}
              </h4>
              <Badge className={getStatusBadge(task.status)}>
                {task.status.replace('_', ' ')}
              </Badge>
            </div>
            
            {task.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>우선순위: {task.priority}</span>
              {task.assignee && <span>담당: {task.assignee.name}</span>}
            </div>

            {task.labels && task.labels.length > 0 && (
              <div className="flex gap-1 pt-1">
                {task.labels.map((label) => (
                  <Badge 
                    key={label} 
                    variant="outline"
                    className="text-xs px-2 py-0"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
