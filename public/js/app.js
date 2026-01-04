(() => {
  const fadeToast = (el) => {
    setTimeout(() => {
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 400);
    }, 2200);
  };

  const createToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'mini-toast shadow';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    fadeToast(toast);
  };

  document.addEventListener('click', async (event) => {
    const copyTarget = event.target.closest('[data-copy]');
    if (!copyTarget) return;

    const value = copyTarget.getAttribute('data-copy');
    if (!value) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      createToast('Đã sao chép liên kết');
    } catch (error) {
      console.error('Không thể sao chép:', error);
    }
  });

  const toastMessage = document.getElementById('toast-message');
  if (toastMessage) {
    fadeToast(toastMessage);
  }

  // Tự động gắn CSRF token cho mọi form POST/PUT/PATCH/DELETE
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    document.querySelectorAll('form').forEach((form) => {
      const method = (form.getAttribute('method') || 'GET').toUpperCase();
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        if (!form.querySelector('input[name="_csrf"]')) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = '_csrf';
          input.value = csrfToken;
          form.appendChild(input);
        }
      }
    });
  }
})();
