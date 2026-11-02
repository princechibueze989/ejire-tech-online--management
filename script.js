const menuButton = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('.nav-links');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    navigation.classList.toggle('is-open', !isOpen);
  });

  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
      navigation.classList.remove('is-open');
    }
  });
}

    document.querySelectorAll('.event-rsvp').forEach((button) => {
      button.addEventListener('click', () => {
        const isSaved = button.getAttribute('aria-pressed') === 'true';
        button.setAttribute('aria-pressed', String(!isSaved));
        button.setAttribute('aria-label', `${isSaved ? 'Save' : 'Unsave'} ${button.closest('.event').querySelector('h3').textContent}`);
      });
    });

    document.querySelectorAll('.course-action').forEach((link) => {
      const courseName = link.closest('.course-card').querySelector('h3').textContent.trim();
      link.href = `register.html?course=${encodeURIComponent(courseName)}`;
    });

    const courseSelect = document.querySelector('#course');
    if (courseSelect) {
      const selectedCourse = new URLSearchParams(window.location.search).get('course');
      if ([...courseSelect.options].some((option) => option.value === selectedCourse)) {
        courseSelect.value = selectedCourse;
      }
    }

    document.querySelectorAll('.auth-form').forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const status = form.querySelector('[role="status"]');
        const submit = form.querySelector('[type="submit"]');
        const client = window.EJIRE_SUPABASE_CLIENT;
        if (!client) {
          status.textContent = 'Account services are not configured yet. Please contact Ejire Tech support.';
          return;
        }

        const values = new FormData(form);
        submit.disabled = true;
        status.textContent = 'Connecting securely...';
        try {
          if (form.id === 'login-form') {
            const { data, error } = await client.auth.signInWithPassword({
              email: values.get('email'),
              password: values.get('password'),
            });
            if (error || !data.user) {
              status.textContent = 'Unable to sign in. Check your email and password, then try again.';
              return;
            }
            const { data: profile, error: profileError } = await client
              .from('profiles')
              .select('role')
              .eq('id', data.user.id)
              .maybeSingle();
            if (profileError || profile?.role !== 'student') {
              await client.auth.signOut();
              status.textContent = 'This portal is available to student accounts only.';
              return;
            }
            window.location.href = 'student.html';
            return;
          }

          const { data, error } = await client.auth.signUp({
            email: values.get('email'),
            password: values.get('password'),
            options: {
              data: {
                full_name: values.get('name'),
                selected_course: values.get('course'),
              },
            },
          });
          if (error || !data.user) {
            status.textContent = 'Account creation could not be completed. Check the details or contact support.';
            return;
          }
          status.textContent = data.session
            ? 'Account created. You can now sign in.'
            : 'Account created. Check your email to confirm it, then sign in.';
          form.reset();
        } catch {
          status.textContent = 'Account services are temporarily unavailable. Please try again.';
        } finally {
          submit.disabled = false;
        }
      });
    });
