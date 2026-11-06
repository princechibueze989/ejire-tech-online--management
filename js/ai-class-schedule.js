const workspace = document.querySelector('#workspace-content');
const workspaceStatus = document.querySelector('#workspace-status');
const scheduleTable = 'student_ai_class_schedule';
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let instructorId = null;
let scheduleRows = [];
let editingId = null;

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[character]));

function showStatus(message, isError = false) {
  workspaceStatus.textContent = message;
  workspaceStatus.hidden = !message;
  workspaceStatus.classList.toggle('is-error', isError);
}

function renderLogin(message = '') {
  workspace.innerHTML = `
    <div class="workspace-heading"><div><div class="instructor-eyebrow instructor-eyebrow--small">Student AI protection</div><h1>Class timetable</h1><p>Sign in with an instructor account to manage weekly class times.</p></div></div>
    ${message ? `<div class="instructor-alert is-error" role="alert">${escapeHtml(message)}</div>` : ''}
    <section class="instructor-panel">
      <form class="instructor-form" data-ai-schedule-form="login">
        <label>Email address<input name="email" type="email" autocomplete="username" required></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
        <div><button class="instructor-button" type="submit">Sign in</button></div>
      </form>
    </section>`;
}

function renderSchedule() {
  const rows = [...scheduleRows].sort((a, b) =>
    a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)
  );
  const editing = editingId ? rows.find((row) => row.id === editingId) : null;
  const dayOptions = weekdays.map((day, index) =>
    `<option value="${index}" ${editing?.day_of_week === index ? 'selected' : ''}>${day}</option>`
  ).join('');
  const scheduleItems = rows.map((row) => `
    <tr>
      <td><strong>${escapeHtml(row.class_name)}</strong></td>
      <td>${escapeHtml(weekdays[row.day_of_week] || 'Unknown')}</td>
      <td>${escapeHtml(row.start_time.slice(0, 5))}–${escapeHtml(row.end_time.slice(0, 5))}</td>
      <td><div class="instructor-card-actions">
        <button class="instructor-button instructor-button--quiet" type="button" data-action="ai-schedule-edit" data-id="${escapeHtml(row.id)}">Edit</button>
        <button class="instructor-button instructor-button--quiet" type="button" data-action="ai-schedule-delete" data-id="${escapeHtml(row.id)}">Remove</button>
      </div></td>
    </tr>`).join('');

  workspace.innerHTML = `
    <div class="workspace-heading"><div><div class="instructor-eyebrow instructor-eyebrow--small">Student AI protection</div><h1>Class timetable</h1><p>During any listed class, Study AI is paused for every student. Times use Africa/Lagos.</p></div>
      <button class="instructor-button instructor-button--quiet" type="button" data-action="ai-schedule-sign-out">Sign out</button>
    </div>
    <section class="instructor-panel">
      <h2>${editing ? 'Edit class time' : 'Add a weekly class time'}</h2>
      <form class="instructor-form-grid" id="ai-class-schedule-form" data-ai-schedule-form="save">
        <input type="hidden" name="id" value="${escapeHtml(editing?.id || '')}">
        <label class="instructor-field">Class or lecture name<input name="class_name" maxlength="120" value="${escapeHtml(editing?.class_name || '')}" required></label>
        <label class="instructor-field">Day of week<select name="day_of_week" required>${dayOptions}</select></label>
        <label class="instructor-field">Starts<input name="start_time" type="time" value="${escapeHtml(editing?.start_time.slice(0, 5) || '')}" required></label>
        <label class="instructor-field">Ends<input name="end_time" type="time" value="${escapeHtml(editing?.end_time.slice(0, 5) || '')}" required></label>
        <div class="instructor-card-actions">
          <button class="instructor-button" type="submit">${editing ? 'Save changes' : 'Add class time'}</button>
          ${editing ? '<button class="instructor-button instructor-button--quiet" type="button" data-action="ai-schedule-cancel-edit">Cancel</button>' : ''}
        </div>
      </form>
    </section>
    <section class="instructor-panel instructor-section">
      <h2>Weekly class times</h2>
      ${rows.length ? `<div class="instructor-table-wrap"><table class="instructor-table"><thead><tr><th>Class</th><th>Day</th><th>Time</th><th>Actions</th></tr></thead><tbody>${scheduleItems}</tbody></table></div>` : '<div class="instructor-empty">No class times are configured. Study AI will remain paused until an instructor adds the timetable.</div>'}
    </section>`;
}

async function loadSchedule() {
  const client = window.EJIRE_SUPABASE_CLIENT;
  if (!client) {
    renderLogin('Supabase is not configured. Configure the browser client before managing the timetable.');
    return;
  }

  workspace.innerHTML = '<div class="instructor-empty">Checking instructor access…</div>';
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw new Error('Unable to verify your sign-in. Please try again.');
  if (!user) {
    instructorId = null;
    renderLogin();
    return;
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) throw new Error('Unable to verify instructor access.');
  if (profile?.role !== 'instructor') {
    instructorId = null;
    renderLogin('This timetable is available to instructor accounts only.');
    return;
  }

  instructorId = user.id;
  const { data, error } = await client
    .from(scheduleTable)
    .select('id, class_name, day_of_week, start_time, end_time')
    .order('day_of_week')
    .order('start_time');
  if (error) throw new Error('Unable to load the class timetable. Please try again.');
  scheduleRows = data || [];
  renderSchedule();
}

async function openSchedule() {
  showStatus('');
  editingId = null;
  try {
    await loadSchedule();
  } catch (error) {
    renderLogin(error.message || 'The timetable could not be loaded.');
    showStatus(error.message || 'The timetable could not be loaded.', true);
  }
}

document.querySelector('.instructor-nav').addEventListener('click', (event) => {
  const button = event.target.closest('[data-view="ai-timetable"]');
  if (!button) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  document.querySelectorAll('.instructor-nav [data-view]').forEach((item) => {
    item.classList.toggle('is-active', item === button);
  });
  void openSchedule();
}, true);

workspace.addEventListener('submit', async (event) => {
  const form = event.target.closest('form[data-ai-schedule-form]');
  if (!form) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const client = window.EJIRE_SUPABASE_CLIENT;
  if (!client) {
    showStatus('Supabase is not configured.', true);
    return;
  }

  try {
    const values = new FormData(form);
    if (form.dataset.aiScheduleForm === 'login') {
      const { error } = await client.auth.signInWithPassword({
        email: values.get('email'),
        password: values.get('password')
      });
      if (error) throw new Error('Sign-in failed. Check your instructor credentials and try again.');
      await openSchedule();
      return;
    }

    const className = String(values.get('class_name') || '').trim();
    const startTime = String(values.get('start_time') || '');
    const endTime = String(values.get('end_time') || '');
    const dayOfWeek = Number(values.get('day_of_week'));
    if (!instructorId) throw new Error('Sign in with an instructor account before saving the timetable.');
    if (!className || !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new Error('Enter a class name and select a valid day.');
    }
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(startTime) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(endTime) ||
      endTime <= startTime) {
      throw new Error('Enter a valid start and end time; the end must be later on the same day.');
    }

    const id = String(values.get('id') || '');
    const scheduleEntry = {
      class_name: className,
      day_of_week: dayOfWeek,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`
    };
    const result = id
      ? await client.from(scheduleTable).update(scheduleEntry).eq('id', id).select('id').single()
      : await client.from(scheduleTable).insert(scheduleEntry).select('id').single();
    if (result.error) throw new Error('The class time could not be saved. Check your instructor permissions and try again.');
    editingId = null;
    showStatus(id ? 'Class time updated.' : 'Class time added.');
    await loadSchedule();
  } catch (error) {
    showStatus(error.message || 'The class time could not be saved.', true);
  }
}, true);

workspace.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action^="ai-schedule-"]');
  if (!button) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const { action, id } = button.dataset;

  if (action === 'ai-schedule-cancel-edit') {
    editingId = null;
    renderSchedule();
    return;
  }
  if (action === 'ai-schedule-edit') {
    editingId = id;
    renderSchedule();
    return;
  }
  if (action === 'ai-schedule-sign-out') {
    try {
      const { error } = await window.EJIRE_SUPABASE_CLIENT.auth.signOut();
      if (error) throw new Error('Could not sign out. Please try again.');
      instructorId = null;
      scheduleRows = [];
      renderLogin();
    } catch (error) {
      showStatus(error.message || 'Could not sign out.', true);
    }
    return;
  }
  if (action === 'ai-schedule-delete') {
    if (!window.confirm('Remove this weekly class time? Study AI will no longer be paused during this period.')) return;
    try {
      const { error } = await window.EJIRE_SUPABASE_CLIENT
        .from(scheduleTable)
        .delete()
        .eq('id', id);
      if (error) throw new Error('The class time could not be removed. Check your instructor permissions and try again.');
      showStatus('Class time removed.');
      await loadSchedule();
    } catch (error) {
      showStatus(error.message || 'The class time could not be removed.', true);
    }
  }
}, true);
