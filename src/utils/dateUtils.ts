export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export type DeadlineUrgency = 'overdue' | 'due_today' | 'due_tomorrow' | 'due_this_week' | 'later';

export function getDeadlineUrgency(deadlineString: string): {
  urgency: DeadlineUrgency;
  label: string;
  daysRemaining: number;
} {
  if (!deadlineString) {
    return { urgency: 'later', label: 'No deadline', daysRemaining: 999 };
  }

  const now = new Date('2026-10-04T04:27:47-07:00'); // current runtime anchor
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const target = new Date(deadlineString);
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffTime = targetDay.getTime() - todayStart.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      urgency: 'overdue',
      label: `${Math.abs(diffDays)}d overdue`,
      daysRemaining: diffDays
    };
  } else if (diffDays === 0) {
    return {
      urgency: 'due_today',
      label: 'Due today',
      daysRemaining: 0
    };
  } else if (diffDays === 1) {
    return {
      urgency: 'due_tomorrow',
      label: 'Due tomorrow',
      daysRemaining: 1
    };
  } else if (diffDays <= 7) {
    return {
      urgency: 'due_this_week',
      label: `In ${diffDays} days`,
      daysRemaining: diffDays
    };
  } else {
    return {
      urgency: 'later',
      label: `In ${diffDays} days`,
      daysRemaining: diffDays
    };
  }
}

export function getDaysCountdown(targetDateString: string): {
  days: number;
  label: string;
  isPast: boolean;
} {
  const now = new Date('2026-10-04T04:27:47-07:00');
  const target = new Date(targetDateString);
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), label: `${Math.abs(diffDays)} days ago`, isPast: true };
  } else if (diffDays === 0) {
    return { days: 0, label: 'Today', isPast: false };
  } else if (diffDays === 1) {
    return { days: 1, label: 'Tomorrow', isPast: false };
  } else {
    return { days: diffDays, label: `${diffDays} days left`, isPast: false };
  }
}
