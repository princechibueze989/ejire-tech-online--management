const STORAGE_KEY = 'ejire-tech-instructor-demo-v1';
const DEMO_INSTRUCTOR_ID = 'instructor-demo';
const workspace = document.querySelector('#workspace-content');
const workspaceStatus = document.querySelector('#workspace-status');
const state = {
  data: null,
  view: 'dashboard'
};

function makeId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function seedData() {
  const future = (days, hours = 10) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hours, 0, 0, 0);
    return date.toISOString();
  };
  return {
    profile: {
      id: DEMO_INSTRUCTOR_ID,
      full_name: 'Alex Morgan',
      email: 'alex.morgan@example.test',
      role: 'instructor'
    },
    profiles: [
      { id: 'student-john', full_name: 'John Okafor', role: 'student' },
      { id: 'student-sarah', full_name: 'Sarah Eze', role: 'student' },
      { id: 'student-david', full_name: 'David James', role: 'student' },
      { id: 'student-michael', full_name: 'Michael Obi', role: 'student' },
      { id: 'admin-demo', full_name: 'Ejire Tech Admin', role: 'admin' }
    ],
    courses: [
      { id: 'course-fullstack', title: 'Full Stack Development', description: 'Build modern web applications from the interface to the database.', published: true, instructor_id: DEMO_INSTRUCTOR_ID },
      { id: 'course-uiux', title: 'UI/UX & Graphics Design', description: 'Learn practical interface design and visual communication.', published: true, instructor_id: DEMO_INSTRUCTOR_ID }
    ],
    enrollments: [
      { id: 'enrollment-john-web', student_id: 'student-john', course_id: 'course-fullstack', status: 'active', enrolled_at: future(-40), instructor_id: DEMO_INSTRUCTOR_ID },
      { id: 'enrollment-sarah-web', student_id: 'student-sarah', course_id: 'course-fullstack', status: 'active', enrolled_at: future(-30), instructor_id: DEMO_INSTRUCTOR_ID },
      { id: 'enrollment-david-web', student_id: 'student-david', course_id: 'course-fullstack', status: 'active', enrolled_at: future(-25), instructor_id: DEMO_INSTRUCTOR_ID },
      { id: 'enrollment-michael-design', student_id: 'student-michael', course_id: 'course-uiux', status: 'active', enrolled_at: future(-20), instructor_id: DEMO_INSTRUCTOR_ID }
    ],
    modules: [
      { id: 'module-html', course_id: 'course-fullstack', title: 'Semantic HTML', description: 'Build accessible, well-structured web pages.', position: 0 },
      { id: 'module-css', course_id: 'course-fullstack', title: 'Modern CSS', description: 'Create responsive layouts and polished interfaces.', position: 1 },
      { id: 'module-research', course_id: 'course-uiux', title: 'User Research', description: 'Understand the people you are designing for.', position: 0 }
    ],
    lessons: [
      { id: 'lesson-html-intro', module_id: 'module-html', title: 'HTML foundations', content: 'Elements, attributes, document structure, and accessible landmarks.', position: 0, asset: null },
      { id: 'lesson-semantic', module_id: 'module-html', title: 'Semantic elements', content: 'Use meaningful HTML elements to describe page content.', position: 1, asset: null },
      { id: 'lesson-flexbox', module_id: 'module-css', title: 'Flexbox essentials', content: 'Arrange content with flexible, responsive layouts.', position: 0, asset: null },
      { id: 'lesson-interviews', module_id: 'module-research', title: 'Planning user interviews', content: 'Write neutral questions and turn observations into insights.', position: 0, asset: null }
    ],
    progress: [
      { student_id: 'student-john', lesson_id: 'lesson-html-intro' },
      { student_id: 'student-john', lesson_id: 'lesson-semantic' },
      { student_id: 'student-john', lesson_id: 'lesson-flexbox' },
      { student_id: 'student-sarah', lesson_id: 'lesson-html-intro' },
      { student_id: 'student-david', lesson_id: 'lesson-html-intro' },
      { student_id: 'student-michael', lesson_id: 'lesson-interviews' }
    ],
    assignments: [
      { id: 'assignment-semantic', course_id: 'course-fullstack', title: 'Accessible landing page', description: 'Create a semantic page structure and explain your accessibility choices.', due_at: future(5), points: 100, published: true, created_at: future(-4), created_by: DEMO_INSTRUCTOR_ID },
      { id: 'assignment-layout', course_id: 'course-fullstack', title: 'Responsive layout exercise', description: 'Build a responsive layout using Flexbox or Grid.', due_at: future(9), points: 50, published: true, created_at: future(-2), created_by: DEMO_INSTRUCTOR_ID },
      { id: 'assignment-draft', course_id: 'course-uiux', title: 'Draft: Interview summary', description: 'Summarize your user interviews.', due_at: null, points: 100, published: false, created_at: future(-1), created_by: DEMO_INSTRUCTOR_ID }
    ],
    submissions: [
      { id: 'submission-john-html', assignment_id: 'assignment-semantic', student_id: 'student-john', answer: 'I used header, main, nav, and footer landmarks and checked the heading order.', file_name: '', submitted_at: future(-1) },
      { id: 'submission-sarah-html', assignment_id: 'assignment-semantic', student_id: 'student-sarah', answer: 'My page uses semantic sections, descriptive links, and labelled form controls.', file_name: '', submitted_at: future(-2) },
      { id: 'submission-david-html', assignment_id: 'assignment-semantic', student_id: 'student-david', answer: 'I created a responsive structure and added accessible names to controls.', file_name: '', submitted_at: future(-3) }
    ],
    grades: [
      { id: 'grade-john-html', submission_id: 'submission-john-html', score: 92, feedback: 'Clear structure and strong accessibility choices. Nice work.', graded_at: future(-1), graded_by: DEMO_INSTRUCTOR_ID },
      { id: 'grade-sarah-html', submission_id: 'submission-sarah-html', score: 84, feedback: 'Good semantic structure. Review the heading hierarchy once more.', graded_at: future(-1), graded_by: DEMO_INSTRUCTOR_ID }
    ],
    quizzes: [
      { id: 'quiz-html', course_id: 'course-fullstack', title: 'HTML foundations check-in', description: 'A quick review of semantic HTML.', questions: [{ question: 'What is the purpose of the main element?', type: 'text' }], opens_at: null, closes_at: null, published: true, created_at: future(-3), created_by: DEMO_INSTRUCTOR_ID }
    ],
    attendance: [
      { id: 'attendance-john', course_id: 'course-fullstack', student_id: 'student-john', attendance_date: future(-2).slice(0, 10), status: 'present', note: '' },
      { id: 'attendance-sarah', course_id: 'course-fullstack', student_id: 'student-sarah', attendance_date: future(-2).slice(0, 10), status: 'present', note: '' },
      { id: 'attendance-david', course_id: 'course-fullstack', student_id: 'student-david', attendance_date: future(-2).slice(0, 10), status: 'late', note: 'Joined shortly after class started.' },
      { id: 'attendance-michael', course_id: 'course-uiux', student_id: 'student-michael', attendance_date: future(-1).slice(0, 10), status: 'present', note: '' }
    ],
    sessions: [
      { id: 'session-html', course_id: 'course-fullstack', title: 'HTML project clinic', starts_at: future(1, 11), ends_at: future(1, 12), location: 'Online', created_by: DEMO_INSTRUCTOR_ID },
      { id: 'session-design', course_id: 'course-uiux', title: 'Design critique', starts_at: future(3, 14), ends_at: future(3, 15), location: 'Design studio', created_by: DEMO_INSTRUCTOR_ID }
    ],
    messages: [
      { id: 'message-sarah', sender_id: 'student-sarah', recipient_id: DEMO_INSTRUCTOR_ID, body: 'Could you share one more example of a good heading structure?', read_at: null, created_at: future(-1) },
      { id: 'message-john', sender_id: DEMO_INSTRUCTOR_ID, recipient_id: 'student-john', body: 'Your accessibility notes were very clear. Keep it up!', read_at: future(-1), created_at: future(-1) }
    ],
    notifications: [
      { id: 'notification-assignment', recipient_id: DEMO_INSTRUCTOR_ID, title: 'Assignment submitted', body: 'David James submitted Accessible landing page.', read_at: null, created_at: future(-3) },
      { id: 'notification-message', recipient_id: DEMO_INSTRUCTOR_ID, title: 'New message', body: 'Sarah Eze sent you a message.', read_at: null, created_at: future(-1) }
    ]
  };
}

function loadData() {
  let saved;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    throw new Error(`Browser storage is unavailable: ${error.message}`);
  }
  if (!saved) {
    state.data = seedData();
    saveData();
    return;
  }
  try {
    state.data = JSON.parse(saved);
  } catch {
    throw new Error('Saved demo data could not be read. Clear the Ejire Tech instructor demo storage and reload this page.');
  }
  const required = ['profile', 'profiles', 'courses', 'enrollments', 'modules', 'lessons', 'progress', 'assignments', 'submissions', 'grades', 'quizzes', 'attendance', 'sessions', 'messages', 'notifications'];
  if (!state.data || required.some((key) => !Array.isArray(state.data[key]) && key !== 'profile') || !state.data.profile) {
    throw new Error('Saved demo data has an unsupported structure. Clear the Ejire Tech instructor demo storage and reload this page.');
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  } catch (error) {
    throw new Error(`Could not save this change in browser storage. It may be full: ${error.message}`);
  }
}

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[character]));

const dateLabel = (value, options = { dateStyle: 'medium' }) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not set' : new Intl.DateTimeFormat(undefined, options).format(date);
};

const field = (label, name, type = 'text', required = true, extra = '') => `
  <label class="instructor-field">${escapeHtml(label)}
    <input name="${escapeHtml(name)}" type="${escapeHtml(type)}" ${required ? 'required' : ''} ${extra}>
  </label>`;

const selectField = (label, name, options, required = true) => `
  <label class="instructor-field">${escapeHtml(label)}
    <select name="${escapeHtml(name)}" ${required ? 'required' : ''}>${options}</select>
  </label>`;

function showStatus(message, isError = false) {
  workspaceStatus.textContent = message;
  workspaceStatus.hidden = !message;
  workspaceStatus.classList.toggle('is-error', isError);
}

function reportError(error) {
  console.error(error);
  showStatus(error?.message || 'Something went wrong. Please try again.', true);
}

function courseName(courseId) {
  return state.data.courses.find((item) => item.id === courseId)?.title || 'Course';
}

function studentName(studentId) {
  return state.data.profiles.find((item) => item.id === studentId)?.full_name
    || (studentId === DEMO_INSTRUCTOR_ID ? state.data.profile.full_name : 'Student');
}

function getEnrollments() {
  return state.data.enrollments.filter((item) => item.instructor_id === DEMO_INSTRUCTOR_ID);
}

function getCourses() {
  const courseIds = new Set(getEnrollments().map((item) => item.course_id));
  state.data.courses.forEach((course) => {
    if (course.instructor_id === DEMO_INSTRUCTOR_ID) courseIds.add(course.id);
  });
  return state.data.courses.filter((course) => courseIds.has(course.id));
}

function getCourseModules(courseId) {
  return state.data.modules.filter((item) => item.course_id === courseId);
}

function notify(recipientId, title, body) {
  state.data.notifications.unshift({
    id: makeId('notification'),
    recipient_id: recipientId,
    title,
    body,
    read_at: null,
    created_at: new Date().toISOString()
  });
}

function enrollmentStats(studentId, courseId) {
  const moduleIds = new Set(getCourseModules(courseId).map((item) => item.id));
  const lessons = state.data.lessons.filter((lesson) => moduleIds.has(lesson.module_id));
  const completedLessons = lessons.filter((lesson) =>
    state.data.progress.some((item) => item.student_id === studentId && item.lesson_id === lesson.id)
  ).length;
  const assignments = state.data.assignments.filter((item) => item.course_id === courseId);
  const submissions = state.data.submissions.filter((item) =>
    item.student_id === studentId && assignments.some((assignment) => assignment.id === item.assignment_id)
  );
  const graded = submissions.map((submission) => ({
    grade: state.data.grades.find((item) => item.submission_id === submission.id),
    assignment: assignments.find((item) => item.id === submission.assignment_id)
  })).filter((item) => item.grade);
  const pointsEarned = graded.reduce((total, item) => total + Number(item.grade.score), 0);
  const pointsPossible = graded.reduce((total, item) => total + Number(item.assignment.points), 0);
  const attendance = state.data.attendance.filter((item) => item.student_id === studentId && item.course_id === courseId);
  const attended = attendance.filter((item) => item.status === 'present' || item.status === 'late').length;
  return {
    progress: lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0,
    lessons: lessons.length,
    completedLessons,
    assignments: assignments.length,
    submissions: submissions.length,
    average: pointsPossible ? Math.round((pointsEarned / pointsPossible) * 100) : null,
    attendance: attendance.length ? Math.round((attended / attendance.length) * 100) : null
  };
}

function renderHeader(title, description, eyebrow = 'Instructor workspace') {
  return `<div class="workspace-heading"><div><div class="instructor-eyebrow instructor-eyebrow--small">${escapeHtml(eyebrow)}</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div></div>`;
}

function renderEmpty(text) {
  return `<div class="instructor-empty">${escapeHtml(text)}</div>`;
}

function renderDashboard() {
  const enrollments = getEnrollments();
  const courses = getCourses();
  const active = enrollments.filter((item) => item.status === 'active');
  const pending = state.data.submissions.filter((submission) =>
    !state.data.grades.some((grade) => grade.submission_id === submission.id)
    && state.data.assignments.some((assignment) => assignment.id === submission.assignment_id && courses.some((course) => course.id === assignment.course_id))
  ).length;
  const upcoming = state.data.sessions.filter((item) => new Date(item.ends_at) >= new Date()).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)).slice(0, 4);
  const performance = enrollments.slice(0, 5).map((enrollment) => {
    const stats = enrollmentStats(enrollment.student_id, enrollment.course_id);
    return `<div class="instructor-list-item"><div><strong>${escapeHtml(studentName(enrollment.student_id))}</strong><span>${escapeHtml(courseName(enrollment.course_id))}</span></div><span class="instructor-badge">${stats.average === null ? `${stats.progress}% complete` : `${stats.average}% average`}</span></div>`;
  }).join('');
  const recentMessages = state.data.messages.filter((item) => item.sender_id === DEMO_INSTRUCTOR_ID || item.recipient_id === DEMO_INSTRUCTOR_ID).slice(0, 4).map((message) => {
    const otherId = message.sender_id === DEMO_INSTRUCTOR_ID ? message.recipient_id : message.sender_id;
    return `<div class="instructor-list-item"><div><strong>${escapeHtml(studentName(otherId))}</strong><span>${escapeHtml(message.body.slice(0, 70))}</span></div><span>${escapeHtml(dateLabel(message.created_at))}</span></div>`;
  }).join('');
  const notifications = state.data.notifications.filter((item) => item.recipient_id === DEMO_INSTRUCTOR_ID).slice(0, 4);
  const unreadNotifications = state.data.notifications.filter((item) => item.recipient_id === DEMO_INSTRUCTOR_ID && !item.read_at).length;
  return `${renderHeader(`Good day, ${state.data.profile.full_name || 'Instructor'}`, 'Here is what is happening across your assigned courses.')}
    <div class="instructor-stats">
      <article class="instructor-stat"><span>My students</span><strong>${new Set(active.map((item) => item.student_id)).size}</strong></article>
      <article class="instructor-stat"><span>My courses</span><strong>${courses.length}</strong></article>
      <article class="instructor-stat"><span>Pending reviews</span><strong>${pending}</strong></article>
      <article class="instructor-stat"><span>New notifications</span><strong>${unreadNotifications}</strong></article>
    </div>
    <div class="instructor-grid">
      <section class="instructor-panel"><h2>Student performance</h2><div class="instructor-list">${performance || renderEmpty('No students have been assigned to your courses yet.')}</div></section>
      <section class="instructor-panel"><h2>Upcoming classes</h2><div class="instructor-list">${upcoming.map((session) => `<div class="instructor-list-item"><div><strong>${escapeHtml(session.title)}</strong><span>${escapeHtml(courseName(session.course_id))}${session.location ? ` · ${escapeHtml(session.location)}` : ''}</span></div><span>${escapeHtml(dateLabel(session.starts_at, { dateStyle: 'medium', timeStyle: 'short' }))}</span></div>`).join('') || renderEmpty('No upcoming class sessions.')}</div></section>
      <section class="instructor-panel"><h2>Recent messages</h2><div class="instructor-list">${recentMessages || renderEmpty('Your messages will appear here.')}</div></section>
      <section class="instructor-panel"><h2>Notifications</h2><div class="instructor-list">${notifications.map((item) => `<div class="instructor-list-item"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.body)}</span></div><span>${escapeHtml(dateLabel(item.created_at))}</span></div>`).join('') || renderEmpty('You have no notifications.')}</div></section>
    </div>`;
}

function renderCourses() {
  const courses = getCourses();
  const courseOptions = courses.map((course) => `<option value="${escapeHtml(course.id)}">${escapeHtml(course.title)}</option>`).join('');
  const modules = state.data.modules.filter((module) => courses.some((course) => course.id === module.course_id)).map((module) => {
    const lessons = state.data.lessons.filter((lesson) => lesson.module_id === module.id);
    return `<article class="instructor-card">
      <div class="instructor-card-title"><h3>${escapeHtml(module.title)}</h3><div class="instructor-card-actions"><button class="instructor-button instructor-button--quiet" type="button" data-action="edit-module" data-id="${escapeHtml(module.id)}">Edit</button><button class="instructor-button instructor-button--quiet" type="button" data-action="delete-module" data-id="${escapeHtml(module.id)}">Delete</button></div></div>
      <p>${escapeHtml(module.description)}</p><span class="instructor-badge">${escapeHtml(courseName(module.course_id))}</span>
      <div class="instructor-list">${lessons.map((lesson) => `<div class="instructor-list-item"><div><strong>${escapeHtml(lesson.title)}</strong><span>${escapeHtml(lesson.content.slice(0, 100))}</span></div><div class="instructor-card-actions">${lesson.asset ? `<button class="instructor-button instructor-button--quiet" type="button" data-action="lesson-file" data-id="${escapeHtml(lesson.id)}">Open file</button>` : ''}<button class="instructor-button instructor-button--quiet" type="button" data-action="edit-lesson" data-id="${escapeHtml(lesson.id)}">Edit</button><button class="instructor-button instructor-button--quiet" type="button" data-action="delete-lesson" data-id="${escapeHtml(lesson.id)}">Delete</button></div></div>`).join('') || '<span class="sidebar-note">No lessons in this module yet.</span>'}</div>
    </article>`;
  }).join('');
  return `${renderHeader('My courses', 'Organize course modules and publish learning materials for your assigned learners.')}
    ${courses.length ? `<div class="instructor-cards">${courses.map((course) => `<article class="instructor-card"><h3>${escapeHtml(course.title)}</h3><p>${escapeHtml(course.description || 'No course description added yet.')}</p><div class="instructor-card-meta"><span>${getEnrollments().filter((item) => item.course_id === course.id).length} learners</span><span>${getCourseModules(course.id).length} modules</span><span class="instructor-badge">${course.published ? 'Published' : 'Unpublished'}</span></div></article>`).join('')}</div>` : renderEmpty('No courses have been assigned to your account.')}
    <section class="instructor-panel instructor-section"><h2>Add a course module</h2>${courses.length ? `<form class="instructor-form-grid" data-form="module">${selectField('Course', 'course_id', courseOptions)}${field('Module title', 'title')}<label class="instructor-field wide">Description<textarea name="description"></textarea></label><div><button class="instructor-button" type="submit">Add module</button></div></form>` : renderEmpty('Assign a course to this demo instructor to add content.')}</section>
    <section class="instructor-panel instructor-section"><h2>Add a lesson</h2>${state.data.modules.length ? `<form class="instructor-form-grid" data-form="lesson">${selectField('Module', 'module_id', state.data.modules.filter((module) => courses.some((course) => course.id === module.course_id)).map((module) => `<option value="${escapeHtml(module.id)}">${escapeHtml(courseName(module.course_id))} · ${escapeHtml(module.title)}</option>`).join(''))}${field('Lesson title', 'title')}<label class="instructor-field wide">Lesson content<textarea name="content"></textarea></label><label class="instructor-field wide">Learning material (PDF, video, or image; max 1 MB)<input name="file" type="file" accept=".pdf,video/mp4,video/webm,image/png,image/jpeg"></label><div><button class="instructor-button" type="submit">Add lesson</button></div></form>` : renderEmpty('Create a module before adding a lesson.')}</section>
    <section class="instructor-section"><h2>Course curriculum</h2>${modules ? `<div class="instructor-cards">${modules}</div>` : renderEmpty('No course modules yet.')}</section>`;
}

function renderStudents() {
  const enrollments = getEnrollments();
  const rows = enrollments.map((enrollment) => {
    const stats = enrollmentStats(enrollment.student_id, enrollment.course_id);
    return `<tr><td><strong>${escapeHtml(studentName(enrollment.student_id))}</strong><small>${escapeHtml(dateLabel(enrollment.enrolled_at))}</small></td><td>${escapeHtml(courseName(enrollment.course_id))}</td><td><span class="instructor-badge">${escapeHtml(enrollment.status)}</span></td><td>${stats.progress}%${stats.lessons ? `<small>${stats.completedLessons}/${stats.lessons} lessons</small>` : '<small>No lessons published</small>'}</td><td>${stats.average === null ? '—' : `${stats.average}%`}</td><td>${stats.attendance === null ? '—' : `${stats.attendance}%`}</td></tr>`;
  }).join('');
  return `${renderHeader('My students', 'Review learning progress and performance for students assigned to your courses.')}
    <section class="instructor-panel"><div class="instructor-stats"><article class="instructor-stat"><span>Assigned students</span><strong>${new Set(enrollments.map((item) => item.student_id)).size}</strong></article><article class="instructor-stat"><span>Active enrollments</span><strong>${enrollments.filter((item) => item.status === 'active').length}</strong></article><article class="instructor-stat"><span>Completed courses</span><strong>${enrollments.filter((item) => item.status === 'completed').length}</strong></article><article class="instructor-stat"><span>Course enrollments</span><strong>${enrollments.length}</strong></article></div>
    ${rows ? `<div class="instructor-table-wrap"><table class="instructor-table"><thead><tr><th>Student</th><th>Course</th><th>Status</th><th>Progress</th><th>Grades</th><th>Attendance</th></tr></thead><tbody>${rows}</tbody></table></div>` : renderEmpty('No students are assigned to your courses yet.')}</section>
    <section class="instructor-panel instructor-section"><h2>Performance center</h2><p class="sidebar-note">Progress is based on completed lessons. Grade averages use graded assignment points; attendance counts present and late records.</p>${rows ? `<div class="instructor-cards">${enrollments.map((enrollment) => { const stats = enrollmentStats(enrollment.student_id, enrollment.course_id); return `<article class="instructor-card"><h3>${escapeHtml(studentName(enrollment.student_id))}</h3><p>${escapeHtml(courseName(enrollment.course_id))}</p><div class="instructor-card-meta"><span>Lessons ${stats.completedLessons}/${stats.lessons}</span><span>Assignments ${stats.submissions}/${stats.assignments}</span><span>Grade ${stats.average === null ? 'Not graded' : `${stats.average}%`}</span><span>Attendance ${stats.attendance === null ? 'No records' : `${stats.attendance}%`}</span></div></article>`; }).join('')}</div>` : renderEmpty('Performance details will appear when students are assigned.')}</section>`;
}

function renderAssignments() {
  const courses = getCourses();
  const assignments = state.data.assignments.filter((item) => courses.some((course) => course.id === item.course_id));
  const submissions = state.data.submissions.filter((item) => assignments.some((assignment) => assignment.id === item.assignment_id));
  const courseOptions = courses.map((course) => `<option value="${escapeHtml(course.id)}">${escapeHtml(course.title)}</option>`).join('');
  const rows = submissions.map((submission) => {
    const assignment = assignments.find((item) => item.id === submission.assignment_id);
    const grade = state.data.grades.find((item) => item.submission_id === submission.id);
    return `<tr><td><strong>${escapeHtml(assignment?.title || 'Assignment')}</strong><small>${escapeHtml(courseName(assignment?.course_id))}</small></td><td>${escapeHtml(studentName(submission.student_id))}</td><td>${escapeHtml(submission.answer || 'File submission')}<small>${escapeHtml(dateLabel(submission.submitted_at, { dateStyle: 'medium', timeStyle: 'short' }))}</small>${submission.file_name ? `<span class="sidebar-note">${escapeHtml(submission.file_name)}</span>` : ''}</td><td>${grade ? `${grade.score}/${assignment?.points || 100}<small>${escapeHtml(grade.feedback)}</small><button class="instructor-button instructor-button--quiet" type="button" data-action="edit-grade" data-id="${escapeHtml(submission.id)}">Edit grade</button>` : `<form class="instructor-inline-form" data-form="grade" data-submission-id="${escapeHtml(submission.id)}"><input name="score" type="number" min="0" max="${escapeHtml(assignment?.points || 100)}" step="0.01" placeholder="Score" aria-label="Score" required><input name="feedback" type="text" placeholder="Feedback" aria-label="Feedback"><button class="instructor-button" type="submit">Grade</button></form>`}</td></tr>`;
  }).join('');
  return `${renderHeader('Assignments & grading', 'Create and publish assignments, review submissions, and return feedback.')}
    <section class="instructor-panel"><h2>Create an assignment</h2>${courses.length ? `<form class="instructor-form-grid" data-form="assignment">${selectField('Course', 'course_id', courseOptions)}${field('Title', 'title')}<label class="instructor-field wide">Instructions<textarea name="description" required></textarea></label>${field('Due date', 'due_at', 'datetime-local', false)}${field('Points possible', 'points', 'number', true, 'min="1" value="100"')}<label class="instructor-field">Publish now<select name="published"><option value="true">Yes</option><option value="false">No, keep as draft</option></select></label><div><button class="instructor-button" type="submit">Create assignment</button></div></form>` : renderEmpty('Assign a course before creating assignments.')}</section>
    <section class="instructor-panel instructor-section"><h2>Assignment list</h2>${assignments.length ? `<div class="instructor-table-wrap"><table class="instructor-table"><thead><tr><th>Assignment</th><th>Submissions</th><th>Due</th><th>Status</th></tr></thead><tbody>${assignments.map((assignment) => `<tr><td><strong>${escapeHtml(assignment.title)}</strong><small>${escapeHtml(courseName(assignment.course_id))} · ${assignment.points} pts</small></td><td>${submissions.filter((item) => item.assignment_id === assignment.id).length}</td><td>${escapeHtml(dateLabel(assignment.due_at, { dateStyle: 'medium', timeStyle: 'short' }))}</td><td><span class="instructor-badge ${assignment.published ? '' : 'instructor-badge--warning'}">${assignment.published ? 'Published' : 'Draft'}</span>${assignment.published ? '' : `<button class="instructor-button instructor-button--quiet" type="button" data-action="publish-assignment" data-id="${escapeHtml(assignment.id)}">Publish</button>`}<button class="instructor-button instructor-button--quiet" type="button" data-action="delete-assignment" data-id="${escapeHtml(assignment.id)}">Delete</button></td></tr>`).join('')}</tbody></table></div>` : renderEmpty('No assignments have been created yet.')}</section>
    <section class="instructor-panel instructor-section"><h2>Submissions to review</h2>${rows ? `<div class="instructor-table-wrap"><table class="instructor-table"><thead><tr><th>Assignment</th><th>Student</th><th>Submission</th><th>Grade &amp; feedback</th></tr></thead><tbody>${rows}</tbody></table></div>` : renderEmpty('No student submissions yet.')}</section>`;
}

function renderQuizzes() {
  const courses = getCourses();
  const quizzes = state.data.quizzes.filter((item) => courses.some((course) => course.id === item.course_id));
  const options = courses.map((course) => `<option value="${escapeHtml(course.id)}">${escapeHtml(course.title)}</option>`).join('');
  return `${renderHeader('Quizzes', 'Build course quizzes with structured question data and optional availability dates.')}
    <section class="instructor-panel"><h2>Create a quiz</h2>${courses.length ? `<form class="instructor-form-grid" data-form="quiz">${selectField('Course', 'course_id', options)}${field('Quiz title', 'title')}<label class="instructor-field wide">Description<textarea name="description"></textarea></label><label class="instructor-field wide">Questions (JSON array)<textarea name="questions" required>[{"question":"Your question","type":"text"}]</textarea></label>${field('Opens at', 'opens_at', 'datetime-local', false)}${field('Closes at', 'closes_at', 'datetime-local', false)}<label class="instructor-field">Publish now<select name="published"><option value="false">No, keep as draft</option><option value="true">Yes</option></select></label><div><button class="instructor-button" type="submit">Create quiz</button></div></form>` : renderEmpty('Assign a course before creating quizzes.')}</section>
    <section class="instructor-section"><h2>My quizzes</h2>${quizzes.length ? `<div class="instructor-cards">${quizzes.map((quiz) => `<article class="instructor-card"><h3>${escapeHtml(quiz.title)}</h3><p>${escapeHtml(courseName(quiz.course_id))} · ${(quiz.questions || []).length} questions</p><div class="instructor-card-meta"><span>${quiz.opens_at ? `Opens ${escapeHtml(dateLabel(quiz.opens_at))}` : 'No start date'}</span><span>${quiz.closes_at ? `Closes ${escapeHtml(dateLabel(quiz.closes_at))}` : 'No end date'}</span><span class="instructor-badge ${quiz.published ? '' : 'instructor-badge--warning'}">${quiz.published ? 'Published' : 'Draft'}</span>${quiz.published ? '' : `<button class="instructor-button instructor-button--quiet" type="button" data-action="publish-quiz" data-id="${escapeHtml(quiz.id)}">Publish quiz</button>`}<button class="instructor-button instructor-button--quiet" type="button" data-action="delete-quiz" data-id="${escapeHtml(quiz.id)}">Delete</button></div></article>`).join('')}</div>` : renderEmpty('No quizzes have been created yet.')}</section>`;
}

function localDate() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function renderRoster(courseId, attendanceDate = localDate()) {
  const enrollments = getEnrollments().filter((item) => item.course_id === courseId);
  if (!enrollments.length) return renderEmpty('No students are enrolled in this course.');
  return `<div class="instructor-table-wrap"><table class="instructor-table"><thead><tr><th>Student</th><th>Attendance</th><th>Note</th></tr></thead><tbody>${enrollments.map((enrollment) => {
    const existing = state.data.attendance.find((item) => item.course_id === courseId && item.student_id === enrollment.student_id && item.attendance_date === attendanceDate);
    const statuses = ['present', 'late', 'absent', 'excused'];
    const statusOptions = statuses.map((status) => `<option value="${status}" ${existing?.status === status ? 'selected' : ''}>${status[0].toUpperCase()}${status.slice(1)}</option>`).join('');
    return `<tr><td>${escapeHtml(studentName(enrollment.student_id))}</td><td><select name="status_${escapeHtml(enrollment.student_id)}" aria-label="${escapeHtml(studentName(enrollment.student_id))} attendance" required>${existing ? '' : '<option value="" disabled selected>Select status</option>'}${statusOptions}</select></td><td><input name="note_${escapeHtml(enrollment.student_id)}" type="text" value="${escapeHtml(existing?.note || '')}" aria-label="${escapeHtml(studentName(enrollment.student_id))} attendance note"></td></tr>`;
  }).join('')}</tbody></table></div>`;
}

function renderAttendance() {
  const courses = getCourses();
  const options = courses.map((course) => `<option value="${escapeHtml(course.id)}">${escapeHtml(course.title)}</option>`).join('');
  const sessions = state.data.sessions.filter((item) => courses.some((course) => course.id === item.course_id) && new Date(item.ends_at) >= new Date()).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  const attendance = state.data.attendance.filter((item) => courses.some((course) => course.id === item.course_id)).sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
  const today = localDate();
  return `${renderHeader('Attendance & classes', 'Schedule upcoming classes and record attendance for your enrolled learners.')}
    <section class="instructor-panel"><h2>Schedule a class</h2>${courses.length ? `<form class="instructor-form-grid" data-form="session">${selectField('Course', 'course_id', options)}${field('Class title', 'title')}${field('Starts at', 'starts_at', 'datetime-local')}${field('Ends at', 'ends_at', 'datetime-local')}${field('Location or meeting link', 'location', 'text', false)}<div><button class="instructor-button" type="submit">Schedule class</button></div></form>` : renderEmpty('Assign a course before scheduling a class.')}</section>
    <section class="instructor-panel instructor-section"><h2>Upcoming classes</h2>${sessions.length ? `<div class="instructor-table-wrap"><table class="instructor-table"><thead><tr><th>Class</th><th>Starts</th><th>Ends</th><th>Location</th><th></th></tr></thead><tbody>${sessions.map((session) => `<tr><td><strong>${escapeHtml(session.title)}</strong><small>${escapeHtml(courseName(session.course_id))}</small></td><td>${escapeHtml(dateLabel(session.starts_at, { dateStyle: 'medium', timeStyle: 'short' }))}</td><td>${escapeHtml(dateLabel(session.ends_at, { timeStyle: 'short' }))}</td><td>${escapeHtml(session.location || 'Online')}</td><td><button class="instructor-button instructor-button--quiet" type="button" data-action="delete-session" data-id="${escapeHtml(session.id)}">Cancel</button></td></tr>`).join('')}</tbody></table></div>` : renderEmpty('No upcoming classes scheduled.')}</section>
    <section class="instructor-panel instructor-section"><h2>Record attendance</h2>${courses.length && getEnrollments().length ? `<form class="instructor-form-grid" data-form="attendance">${selectField('Course', 'course_id', options)}${field('Date', 'attendance_date', 'date', true, `value="${today}"`)}<div class="wide" id="attendance-roster">${renderRoster(courses[0].id, today)}</div><div><button class="instructor-button" type="submit">Save attendance</button></div></form>` : renderEmpty('There are no enrolled students to take attendance for.')}</section>
    <section class="instructor-panel instructor-section"><h2>Recent attendance</h2>${attendance.length ? `<div class="instructor-table-wrap"><table class="instructor-table"><thead><tr><th>Student</th><th>Course</th><th>Date</th><th>Status</th><th>Note</th></tr></thead><tbody>${attendance.slice(0, 30).map((item) => `<tr><td>${escapeHtml(studentName(item.student_id))}</td><td>${escapeHtml(courseName(item.course_id))}</td><td>${escapeHtml(dateLabel(item.attendance_date))}</td><td><span class="instructor-badge">${escapeHtml(item.status)}</span></td><td>${escapeHtml(item.note || '—')}</td></tr>`).join('')}</tbody></table></div>` : renderEmpty('No attendance has been recorded yet.')}</section>`;
}

function renderMessages() {
  const recipients = [
    ...new Map(getEnrollments().map((item) => [item.student_id, studentName(item.student_id)])).entries(),
    ...state.data.profiles.filter((profile) => profile.role === 'admin').map((profile) => [profile.id, `Admin · ${profile.full_name}`])
  ];
  const options = recipients.map(([id, name]) => `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`).join('');
  const messages = state.data.messages.filter((item) => item.sender_id === DEMO_INSTRUCTOR_ID || item.recipient_id === DEMO_INSTRUCTOR_ID).slice(0, 100).reverse();
  const items = messages.map((message) => {
    const mine = message.sender_id === DEMO_INSTRUCTOR_ID;
    const otherId = mine ? message.recipient_id : message.sender_id;
    return `<article class="instructor-message ${mine ? 'is-mine' : ''}"><strong>${mine ? 'You → ' : ''}${escapeHtml(studentName(otherId))}</strong><p>${escapeHtml(message.body)}</p><time>${escapeHtml(dateLabel(message.created_at, { dateStyle: 'medium', timeStyle: 'short' }))}</time></article>`;
  }).join('');
  return `${renderHeader('Messages', 'Send direct messages to students assigned to your courses or the demo administrator.')}
    <section class="instructor-panel"><form class="instructor-form-grid" data-form="message">${selectField('Recipient', 'recipient_id', options)}<label class="instructor-field wide">Message<textarea name="body" maxlength="5000" required></textarea></label><div><button class="instructor-button" type="submit">Send message</button></div></form></section>
    <section class="instructor-panel instructor-section"><h2>Recent conversation activity</h2><div class="instructor-message-list">${items || renderEmpty('No messages yet.')}</div></section>`;
}

function renderNotifications() {
  const notifications = state.data.notifications.filter((item) => item.recipient_id === DEMO_INSTRUCTOR_ID);
  const items = notifications.map((item) => `<article class="instructor-list-item"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.body || '')}</span><small>${escapeHtml(dateLabel(item.created_at, { dateStyle: 'medium', timeStyle: 'short' }))}</small></div>${item.read_at ? '<span class="instructor-badge">Read</span>' : `<button class="instructor-button instructor-button--quiet" type="button" data-action="notification-read" data-id="${escapeHtml(item.id)}">Mark read</button>`}</article>`).join('');
  return `${renderHeader('Notifications', 'Keep track of new submissions, messages, and course activity.')}
    <section class="instructor-panel"><div class="instructor-list">${items || renderEmpty('You have no notifications.')}</div></section>`;
}

function renderProfile() {
  return `${renderHeader('My profile', 'Manage the instructor name displayed to your students.')}
    <section class="instructor-panel"><form class="instructor-form" data-form="profile">${field('Full name', 'full_name', 'text', true, `value="${escapeHtml(state.data.profile.full_name)}"`)}<div><button class="instructor-button" type="submit">Save profile</button></div></form>
    <div class="instructor-section"><strong>Demo account email</strong><p>${escapeHtml(state.data.profile.email)}</p><span class="instructor-badge">Local demo instructor</span><p class="sidebar-note">All demo content is stored in this browser's local storage and is not private or synchronized.</p><button class="instructor-button instructor-button--quiet" type="button" data-action="reset-demo">Reset all demo data</button></div></section>`;
}

function render() {
  const renderers = {
    dashboard: renderDashboard,
    courses: renderCourses,
    students: renderStudents,
    assignments: renderAssignments,
    quizzes: renderQuizzes,
    attendance: renderAttendance,
    messages: renderMessages,
    notifications: renderNotifications,
    profile: renderProfile
  };
  workspace.innerHTML = renderers[state.view]();
  document.querySelectorAll('.instructor-nav [data-view]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.view === state.view);
  });
  const unreadMessages = state.data.messages.filter((item) => item.recipient_id === DEMO_INSTRUCTOR_ID && !item.read_at).length;
  const messageCount = document.querySelector('#unread-count');
  messageCount.hidden = !unreadMessages;
  messageCount.textContent = String(unreadMessages);
  const unreadNotifications = state.data.notifications.filter((item) => item.recipient_id === DEMO_INSTRUCTOR_ID && !item.read_at).length;
  const notificationCount = document.querySelector('#notification-count');
  notificationCount.hidden = !unreadNotifications;
  notificationCount.textContent = String(unreadNotifications);
  document.querySelector('#profile-name').textContent = state.data.profile.full_name || 'Instructor';
  document.querySelector('#profile-avatar').textContent = (state.data.profile.full_name || 'ET').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function getFormValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', () => reject(new Error('The selected learning material could not be read.')));
    reader.readAsDataURL(file);
  });
}

async function handleForm(form) {
  const values = getFormValues(form);
  const button = form.querySelector('[type="submit"]');
  const previousData = JSON.stringify(state.data);
  button.disabled = true;
  showStatus('');
  try {
    if (form.dataset.form === 'module') {
      const course = getCourses().find((item) => item.id === values.course_id);
      if (!course) throw new Error('Choose one of the instructor’s assigned courses.');
      state.data.modules.push({
        id: makeId('module'),
        course_id: course.id,
        title: values.title.trim(),
        description: values.description.trim(),
        position: getCourseModules(course.id).length
      });
      saveData();
      render();
      showStatus('Course module added.');
    } else if (form.dataset.form === 'lesson') {
      const module = state.data.modules.find((item) => item.id === values.module_id && getCourses().some((course) => course.id === item.course_id));
      if (!module) throw new Error('Choose a module in one of your assigned courses.');
      const file = form.elements.file.files[0];
      let asset = null;
      if (file) {
        if (file.size > 1024 * 1024) throw new Error('Local demo files must be 1 MB or smaller. Use a URL in the lesson content for larger videos.');
        asset = { name: file.name, type: file.type, data: await readFile(file) };
      }
      state.data.lessons.push({
        id: makeId('lesson'),
        module_id: module.id,
        title: values.title.trim(),
        content: values.content.trim(),
        asset,
        position: state.data.lessons.filter((item) => item.module_id === module.id).length
      });
      getEnrollments().filter((item) => item.course_id === module.course_id && item.status === 'active').forEach((item) => notify(item.student_id, 'New lesson', `A new lesson is available: ${values.title.trim()}.`));
      saveData();
      render();
      showStatus('Lesson added to the course.');
    } else if (form.dataset.form === 'assignment') {
      const course = getCourses().find((item) => item.id === values.course_id);
      const points = Number(values.points);
      if (!course || !Number.isInteger(points) || points < 1) throw new Error('Choose an assigned course and a positive whole-number points value.');
      const assignment = {
        id: makeId('assignment'),
        course_id: course.id,
        created_by: DEMO_INSTRUCTOR_ID,
        title: values.title.trim(),
        description: values.description.trim(),
        due_at: values.due_at ? new Date(values.due_at).toISOString() : null,
        points,
        published: values.published === 'true',
        created_at: new Date().toISOString()
      };
      state.data.assignments.unshift(assignment);
      if (assignment.published) {
        getEnrollments().filter((item) => item.course_id === course.id && item.status === 'active').forEach((item) => notify(item.student_id, 'New assignment', `A new assignment is available: ${assignment.title}.`));
      }
      saveData();
      render();
      showStatus('Assignment created.');
    } else if (form.dataset.form === 'grade') {
      const submission = state.data.submissions.find((item) => item.id === form.dataset.submissionId);
      const assignment = state.data.assignments.find((item) => item.id === submission?.assignment_id);
      const score = Number(values.score);
      if (!assignment || !Number.isFinite(score) || score < 0 || score > assignment.points) throw new Error('Enter a score within the assignment points range.');
      let grade = state.data.grades.find((item) => item.submission_id === submission.id);
      if (!grade) {
        grade = { id: makeId('grade'), submission_id: submission.id, graded_by: DEMO_INSTRUCTOR_ID };
        state.data.grades.push(grade);
      }
      grade.score = score;
      grade.feedback = String(values.feedback || '').trim();
      grade.graded_at = new Date().toISOString();
      notify(submission.student_id, 'Assignment graded', `Your assignment "${assignment.title}" has been graded.`);
      saveData();
      render();
      showStatus('Grade and feedback saved.');
    } else if (form.dataset.form === 'quiz') {
      let questions;
      try {
        questions = JSON.parse(values.questions);
      } catch {
        throw new Error('Questions must be valid JSON.');
      }
      if (!Array.isArray(questions) || !questions.length) throw new Error('Add at least one quiz question as a JSON array.');
      const course = getCourses().find((item) => item.id === values.course_id);
      if (!course) throw new Error('Choose one of your assigned courses.');
      const opensAt = values.opens_at ? new Date(values.opens_at) : null;
      const closesAt = values.closes_at ? new Date(values.closes_at) : null;
      if (opensAt && closesAt && closesAt <= opensAt) throw new Error('The quiz close time must be after its open time.');
      const quiz = {
        id: makeId('quiz'),
        course_id: course.id,
        created_by: DEMO_INSTRUCTOR_ID,
        title: values.title.trim(),
        description: values.description.trim(),
        questions,
        opens_at: opensAt?.toISOString() || null,
        closes_at: closesAt?.toISOString() || null,
        published: values.published === 'true',
        created_at: new Date().toISOString()
      };
      state.data.quizzes.unshift(quiz);
      if (quiz.published) getEnrollments().filter((item) => item.course_id === course.id && item.status === 'active').forEach((item) => notify(item.student_id, 'New quiz', `A new quiz is available: ${quiz.title}.`));
      saveData();
      render();
      showStatus('Quiz created.');
    } else if (form.dataset.form === 'session') {
      const course = getCourses().find((item) => item.id === values.course_id);
      const startsAt = new Date(values.starts_at);
      const endsAt = new Date(values.ends_at);
      if (!course || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) throw new Error('Choose an assigned course and an end time after the start time.');
      state.data.sessions.push({
        id: makeId('session'),
        course_id: course.id,
        created_by: DEMO_INSTRUCTOR_ID,
        title: values.title.trim(),
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        location: String(values.location || '').trim()
      });
      saveData();
      render();
      showStatus('Class session scheduled.');
    } else if (form.dataset.form === 'attendance') {
      const course = getCourses().find((item) => item.id === values.course_id);
      if (!course) throw new Error('Choose one of your assigned courses.');
      const records = getEnrollments().filter((item) => item.course_id === course.id).map((enrollment) => ({
        course_id: course.id,
        student_id: enrollment.student_id,
        attendance_date: values.attendance_date,
        status: values[`status_${enrollment.student_id}`],
        note: String(values[`note_${enrollment.student_id}`] || '').trim()
      }));
      if (!records.length || records.some((item) => !item.status)) throw new Error('Choose an attendance status for every learner.');
      records.forEach((record) => {
        const existing = state.data.attendance.find((item) => item.course_id === record.course_id && item.student_id === record.student_id && item.attendance_date === record.attendance_date);
        if (existing) Object.assign(existing, record);
        else state.data.attendance.push({ id: makeId('attendance'), ...record });
      });
      saveData();
      render();
      showStatus('Attendance saved for the selected class date.');
    } else if (form.dataset.form === 'message') {
      const allowedRecipients = [...new Set([...getEnrollments().map((item) => item.student_id), ...state.data.profiles.filter((item) => item.role === 'admin').map((item) => item.id)])];
      if (!allowedRecipients.includes(values.recipient_id)) throw new Error('Choose a student assigned to you or the demo administrator.');
      const message = {
        id: makeId('message'),
        sender_id: DEMO_INSTRUCTOR_ID,
        recipient_id: values.recipient_id,
        body: values.body.trim(),
        read_at: null,
        created_at: new Date().toISOString()
      };
      state.data.messages.unshift(message);
      notify(message.recipient_id, 'New message', `You received a message from ${state.data.profile.full_name}.`);
      saveData();
      render();
      showStatus('Message sent.');
    } else if (form.dataset.form === 'profile') {
      const fullName = values.full_name.trim();
      if (!fullName) throw new Error('Enter your name.');
      state.data.profile.full_name = fullName;
      saveData();
      render();
      showStatus('Profile updated.');
    }
  } catch (error) {
    state.data = JSON.parse(previousData);
    render();
    reportError(error);
  }
}

function confirmDelete(message) {
  return window.confirm(`${message} This cannot be undone.`);
}

function handleAction(button) {
  const { action, id } = button.dataset;
  if (action === 'reset-demo') {
    if (!confirmDelete('Reset all instructor demo content to its original sample data?')) return;
    state.data = seedData();
  } else if (action === 'notification-read') {
    const item = state.data.notifications.find((notification) => notification.id === id && notification.recipient_id === DEMO_INSTRUCTOR_ID);
    if (!item) throw new Error('That notification is no longer available.');
    item.read_at = new Date().toISOString();
  } else if (action === 'publish-assignment' || action === 'publish-quiz') {
    const collection = action === 'publish-assignment' ? state.data.assignments : state.data.quizzes;
    const item = collection.find((entry) => entry.id === id && getCourses().some((course) => course.id === entry.course_id));
    if (!item) throw new Error('That course item is no longer available.');
    item.published = true;
    getEnrollments().filter((enrollment) => enrollment.course_id === item.course_id && enrollment.status === 'active').forEach((enrollment) => {
      notify(enrollment.student_id, action === 'publish-assignment' ? 'New assignment' : 'New quiz', `A new ${action === 'publish-assignment' ? 'assignment' : 'quiz'} is available: ${item.title}.`);
    });
  } else if (action === 'delete-module') {
    if (!confirmDelete('Delete this module and its lessons?')) return;
    const lessonIds = state.data.lessons.filter((lesson) => lesson.module_id === id).map((lesson) => lesson.id);
    state.data.modules = state.data.modules.filter((module) => module.id !== id);
    state.data.lessons = state.data.lessons.filter((lesson) => lesson.module_id !== id);
    state.data.progress = state.data.progress.filter((item) => !lessonIds.includes(item.lesson_id));
  } else if (action === 'delete-lesson') {
    if (!confirmDelete('Delete this lesson?')) return;
    state.data.lessons = state.data.lessons.filter((lesson) => lesson.id !== id);
    state.data.progress = state.data.progress.filter((item) => item.lesson_id !== id);
  } else if (action === 'delete-assignment') {
    if (!confirmDelete('Delete this assignment and its submissions and grades?')) return;
    const submissionIds = state.data.submissions.filter((item) => item.assignment_id === id).map((item) => item.id);
    state.data.assignments = state.data.assignments.filter((item) => item.id !== id);
    state.data.submissions = state.data.submissions.filter((item) => item.assignment_id !== id);
    state.data.grades = state.data.grades.filter((item) => !submissionIds.includes(item.submission_id));
  } else if (action === 'delete-quiz') {
    if (!confirmDelete('Delete this quiz?')) return;
    state.data.quizzes = state.data.quizzes.filter((item) => item.id !== id);
  } else if (action === 'delete-session') {
    if (!confirmDelete('Cancel this class session?')) return;
    state.data.sessions = state.data.sessions.filter((item) => item.id !== id);
  } else if (action === 'edit-module' || action === 'edit-lesson' || action === 'edit-grade') {
    const item = action === 'edit-module'
      ? state.data.modules.find((entry) => entry.id === id)
      : action === 'edit-lesson'
        ? state.data.lessons.find((entry) => entry.id === id)
        : state.data.submissions.find((entry) => entry.id === id);
    if (!item) throw new Error('That item is no longer available.');
    if (action === 'edit-grade') {
      const existingGrade = state.data.grades.find((grade) => grade.submission_id === id);
      if (!existingGrade) throw new Error('That submission does not have a grade to edit.');
      const score = window.prompt('New score:', String(existingGrade.score));
      if (score === null) return;
      const feedback = window.prompt('Feedback:', existingGrade.feedback || '');
      if (feedback === null) return;
      const assignment = state.data.assignments.find((entry) => entry.id === item.assignment_id);
      const parsedScore = Number(score);
      if (!assignment || !Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > assignment.points) throw new Error('Enter a score within the assignment points range.');
      existingGrade.score = parsedScore;
      existingGrade.feedback = feedback.trim();
      existingGrade.graded_at = new Date().toISOString();
      notify(item.student_id, 'Assignment grade updated', `Your assignment "${assignment.title}" has updated feedback.`);
    } else {
      const title = window.prompt('Title:', item.title);
      if (title === null) return;
      const descriptionKey = action === 'edit-module' ? 'description' : 'content';
      const description = window.prompt(action === 'edit-module' ? 'Description:' : 'Lesson content:', item[descriptionKey] || '');
      if (description === null) return;
      if (!title.trim()) throw new Error('Title cannot be empty.');
      item.title = title.trim();
      item[descriptionKey] = description.trim();
    }
  } else if (action === 'lesson-file') {
    const lesson = state.data.lessons.find((item) => item.id === id);
    if (!lesson?.asset?.data) throw new Error('This lesson has no saved learning material.');
    const link = document.createElement('a');
    link.href = lesson.asset.data;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = lesson.asset.name;
    link.click();
    return;
  }
  saveData();
  render();
  showStatus('Change saved in this browser.');
}

document.querySelector('.instructor-nav').addEventListener('click', (event) => {
  const button = event.target.closest('[data-view]');
  if (!button) return;
  state.view = button.dataset.view;
  let saveError = false;
  if (state.view === 'messages') {
    const previousData = JSON.stringify(state.data);
    state.data.messages.filter((item) => item.recipient_id === DEMO_INSTRUCTOR_ID && !item.read_at).forEach((item) => {
      item.read_at = new Date().toISOString();
    });
    try {
      saveData();
    } catch (error) {
      state.data = JSON.parse(previousData);
      reportError(error);
      saveError = true;
    }
  }
  if (!saveError) showStatus('');
  render();
});

workspace.addEventListener('submit', (event) => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  handleForm(form);
});

workspace.addEventListener('change', (event) => {
  if ((event.target.name === 'course_id' || event.target.name === 'attendance_date') && state.view === 'attendance') {
    const courseId = document.querySelector('[name="course_id"]').value;
    const attendanceDate = document.querySelector('[name="attendance_date"]').value;
    document.querySelector('#attendance-roster').innerHTML = renderRoster(courseId, attendanceDate);
  }
});

workspace.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const previousData = JSON.stringify(state.data);
  try {
    handleAction(button);
  } catch (error) {
    state.data = JSON.parse(previousData);
    render();
    reportError(error);
  }
});

try {
  loadData();
  render();
} catch (error) {
  reportError(error);
  workspace.innerHTML = renderEmpty('The local instructor demo could not be loaded. Check the message above, then clear the demo data or reload.');
}
