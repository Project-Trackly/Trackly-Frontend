/**
 * Project Detail Page
 * 
 * Main project dashboard with task list view and controls
 * Provides navigation to 3D view and task management
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@repo/ui';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardBody } from '@repo/ui';
import { Plus, Box, List, Calendar } from 'lucide-react';
import { useTasks3D } from '@/services/api/tasks3d';
import { useCreateTask, useDeleteTask } from '@/services/api/tasks';
import type { CreateTaskRequest } from '@/types/task';

interface PageProps {
  params: { id: string };
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { id: projectId } = params;
  const [showTaskForm, setShowTaskForm] = useState(false);
  
  // Fetch tasks using 3D endpoint (since regular task list endpoint doesn't exist yet)
  const { data: tasksData, isLoading, error } = useTasks3D(projectId, true, 0, 100);

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
              프로젝트 #{projectId}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              태스크 추가
            </Button>
            <Button asChild>
              <Link href={`/projects/${projectId}/3d`} className="flex items-center gap-2">
                <Box className="w-4 h-4" />
                3D 뷰로 전환
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Task Creation Form */}
        {showTaskForm && (
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader
              title="새 태스크 만들기"
              subtitle="프로젝트에 추가할 태스크 정보를 입력하세요"
            />
            <CardBody>
              <TaskCreationForm 
                projectId={projectId} 
                onCancel={() => setShowTaskForm(false)}
                onSuccess={() => {
                  setShowTaskForm(false);
                }}
              />
            </CardBody>
          </Card>
        )}

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <button className="flex items-center gap-2 px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-medium">
            <List className="w-4 h-4" />
            리스트 뷰
          </button>
          <Link 
            href={`/projects/${projectId}/3d`}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <Box className="w-4 h-4" />
            3D 뷰
          </Link>
          <Link 
            href={`/projects/${projectId}/timeline`}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <Calendar className="w-4 h-4" />
            타임라인
          </Link>
        </div>

        {/* Task List */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">태스크를 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
            <p className="font-medium">태스크를 불러오는데 실패했습니다</p>
            <p className="text-sm mt-1">{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}</p>
          </div>
        )}

        {!isLoading && !error && (
          <TaskList 
            projectId={projectId} 
            tasks={tasksData?.tasks || []} 
          />
        )}
      </div>
    </main>
  );
}

/**
 * Task Creation Form Component
 */
interface TaskCreationFormProps {
  projectId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

function TaskCreationForm({ projectId, onCancel, onSuccess }: TaskCreationFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 50,
    dueDate: '',
    assignee: '',
    labels: [] as string[],
  });

  const createTaskMutation = useCreateTask(projectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const taskData: CreateTaskRequest = {
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
        assignee: formData.assignee || undefined,
        labels: formData.labels.length > 0 ? formData.labels : undefined,
      };

      await createTaskMutation.mutateAsync(taskData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 50,
        dueDate: '',
        assignee: '',
        labels: [],
      });
      
      onSuccess();
    } catch (error) {
      console.error('Failed to create task:', error);
      // Error is already handled by mutation
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          제목 *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="태스크 제목을 입력하세요"
          disabled={createTaskMutation.isPending}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          설명
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="태스크에 대한 상세 설명..."
          disabled={createTaskMutation.isPending}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            우선순위 ({formData.priority})
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
            className="w-full"
            disabled={createTaskMutation.isPending}
          />
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>낮음</span>
            <span>중간</span>
            <span>높음</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            마감일
          </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={createTaskMutation.isPending}
          />
        </div>
      </div>

      {createTaskMutation.isError && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
          태스크 생성에 실패했습니다. 다시 시도해주세요.
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={createTaskMutation.isPending}
        >
          취소
        </Button>
        <Button 
          type="submit"
          disabled={createTaskMutation.isPending}
        >
          {createTaskMutation.isPending ? '생성 중...' : '태스크 생성'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Task List Component
 */
interface TaskListProps {
  projectId: string;
  tasks: any[];
}

function TaskList({ projectId, tasks }: TaskListProps) {
  const deleteTaskMutation = useDeleteTask(projectId);

  const handleDelete = async (taskId: string) => {
    if (!confirm('이 태스크를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteTaskMutation.mutateAsync(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <p className="text-lg mb-2">아직 태스크가 없습니다</p>
        <p className="text-sm">상단의 &quot;태스크 추가&quot; 버튼을 눌러 첫 태스크를 만들어보세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard 
          key={task.id} 
          task={task} 
          onDelete={() => handleDelete(String(task.id))}
          isDeleting={deleteTaskMutation.isPending}
        />
      ))}
    </div>
  );
}

/**
 * Task Card Component
 */
interface TaskCardProps {
  task: {
    id: number | string;
    title: string;
    description?: string;
    priority: number;
    status: string;
    dueDate?: string;
    assignee?: string;
    labels?: string[];
  };
  onDelete: () => void;
  isDeleting: boolean;
}

function TaskCard({ task, onDelete, isDeleting }: TaskCardProps) {
  const getPriorityColor = (priority: number) => {
    if (priority >= 70) return 'text-red-600 dark:text-red-400';
    if (priority >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-green-600 dark:text-green-400';
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
    <Card className="hover:shadow-lg transition-shadow">
      <CardBody>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {task.title}
              </h3>
              <Badge className={getStatusBadge(task.status)}>
                {task.status.replace('_', ' ')}
              </Badge>
            </div>
            
            {task.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm">
              <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                우선순위: {task.priority}
              </span>
              {task.dueDate && (
                <span className="text-slate-500 dark:text-slate-400">
                  마감: {task.dueDate}
                </span>
              )}
              {task.assignee && (
                <span className="text-slate-500 dark:text-slate-400">
                  담당: {task.assignee}
                </span>
              )}
            </div>

            {task.labels && task.labels.length > 0 && (
              <div className="flex gap-2">
                {task.labels.map((label) => (
                  <Badge 
                    key={label} 
                    variant="outline"
                    className="text-xs"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => alert('편집 기능은 곧 추가될 예정입니다')}
            >
              편집
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
