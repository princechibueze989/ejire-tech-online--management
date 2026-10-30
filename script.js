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
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        form.querySelector('[role="status"]').textContent = 'This demo form is not connected to account services yet.';
      });
    });
