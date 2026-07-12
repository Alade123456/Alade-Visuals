import { useEffect, useRef } from 'react';
import { Task } from './types';

export function useTaskReminders(tasks: Task[]) {
  const notifiedTasks = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Request permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const checkReminders = () => {
      const now = new Date();
      
      tasks.forEach(task => {
        if (task.completed || task.priority !== 'Urgent' || !task.dueDate || !task.dueTime) {
          return;
        }

        // Only check tasks for today
        const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        if (task.dueDate !== todayStr) return;

        const [hours, minutes] = task.dueTime.split(':').map(Number);
        const taskTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        
        // Time difference in minutes
        const diffMinutes = (taskTime.getTime() - now.getTime()) / (1000 * 60);

        // If the task is due within the next 30 minutes, and we haven't notified yet
        if (diffMinutes > 0 && diffMinutes <= 30 && !notifiedTasks.current.has(task.id)) {
          new Notification('Urgent Task Reminder', {
            body: `"${task.name}" is due in ${Math.ceil(diffMinutes)} minutes.`,
            icon: '/icon.png' // Adjust if needed
          });
          notifiedTasks.current.add(task.id);
        }
      });
    };

    // Check every minute
    const intervalId = setInterval(checkReminders, 60000);
    
    // Initial check
    checkReminders();

    return () => clearInterval(intervalId);
  }, [tasks]);
}
