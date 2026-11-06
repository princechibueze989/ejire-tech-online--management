(() => {
  const originalSetAiState = window.setAiState;
  const client = window.EJIRE_SUPABASE_CLIENT;
  if (typeof originalSetAiState !== 'function') return;

  let canUseAi = false;
  let scheduleStatus = 'checking';

  function applyState(label, ready) {
    const statusLabels = {
      checking: 'Checking class timetable',
      active: 'AI paused during class',
      missing: 'Timetable not configured',
      setup: 'Setup required',
      signin: 'Student sign-in required',
      access: 'Student access only',
      unavailable: 'Timetable unavailable'
    };
    const allowed = scheduleStatus === 'available' && ready;
    originalSetAiState(allowed ? label : statusLabels[scheduleStatus] || label, allowed);
  }

  window.setAiState = (label, ready = false) => {
    canUseAi = ready;
    applyState(label, canUseAi);
  };

  function getLagosTime() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Lagos',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const hour = Number(values.hour);
    const minute = Number(values.minute);
    if (!(values.weekday in days) || !Number.isInteger(hour) || !Number.isInteger(minute)) {
      throw new Error('Could not determine Africa/Lagos time.');
    }
    return { day: days[values.weekday], minuteOfDay: hour * 60 + minute };
  }

  function timeInMinutes(value) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(value);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }

  async function refreshSchedule() {
    scheduleStatus = 'checking';
    applyState('', canUseAi);
    if (!client) {
      scheduleStatus = 'setup';
      applyState('', canUseAi);
      return;
    }

    try {
      const { data: { user }, error: authError } = await client.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        scheduleStatus = 'signin';
        applyState('', canUseAi);
        return;
      }
      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      if (profile?.role !== 'student') {
        scheduleStatus = 'access';
        applyState('', canUseAi);
        return;
      }

      const { data, error } = await client
        .from('student_ai_class_schedule')
        .select('day_of_week, start_time, end_time');
      if (error) throw error;
      if (!data?.length) {
        scheduleStatus = 'missing';
        applyState('', canUseAi);
        return;
      }

      const current = getLagosTime();
      const blocked = data.some((item) => {
        const start = timeInMinutes(item.start_time);
        const end = timeInMinutes(item.end_time);
        if (!Number.isInteger(item.day_of_week) || item.day_of_week < 0 || item.day_of_week > 6 ||
          start === null || end === null || end <= start) return true;
        return item.day_of_week === current.day &&
          current.minuteOfDay >= start &&
          current.minuteOfDay < end;
      });
      scheduleStatus = blocked ? 'active' : 'available';
    } catch (error) {
      console.error('Could not check the student AI class timetable.', error);
      scheduleStatus = 'unavailable';
    }
    applyState('', canUseAi);
  }

  void refreshSchedule();
  window.setInterval(refreshSchedule, 60_000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void refreshSchedule();
  });
})();
