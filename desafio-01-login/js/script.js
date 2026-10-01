const MIN_PASSWORD_LENGTH = 8;
const TOKEN_KEY = 'accessToken';
const DASHBOARD_PAGE = 'dashboard.html';

if (localStorage.getItem(TOKEN_KEY)) {
  window.location.replace(DASHBOARD_PAGE);
}

const container = document.getElementById('container');
const forms = {
  login: document.getElementById('login-form'),
  register: document.getElementById('register-form'),
};
const sections = {
  login: document.getElementById('login-section'),
  register: document.getElementById('register-section'),
};
const panelContents = document.querySelectorAll('[data-panel]');

const rules = {
  name(value) {
    return value.trim() ? '' : 'Informe seu nome.';
  },
  email(value) {
    const email = value.trim();
    if (!email) return 'Informe seu e-mail.';
    if (!email.includes('@')) return 'O e-mail precisa ter "@".';
    return '';
  },
  password(value) {
    if (!value) return 'Informe sua senha.';
    if (value.length < MIN_PASSWORD_LENGTH) {
      return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    return '';
  },
};

function getValidatedInputs(form) {
  return [...form.querySelectorAll('input[name]')].filter((input) => input.name in rules);
}

function setFieldState(input, message) {
  const field = input.closest('.field');
  const errorElement = document.getElementById(`${input.id}-error`);
  const hasError = Boolean(message);

  field.classList.toggle('field--error', hasError);
  field.classList.toggle('field--valid', !hasError && input.value !== '');
  input.setAttribute('aria-invalid', String(hasError));
  errorElement.textContent = message;
}

function clearFieldStates(form) {
  getValidatedInputs(form).forEach((input) => {
    input.closest('.field').classList.remove('field--error', 'field--valid');
    input.removeAttribute('aria-invalid');
    delete input.dataset.touched;
    document.getElementById(`${input.id}-error`).textContent = '';
  });
}

function validateField(input) {
  const message = rules[input.name](input.value);
  setFieldState(input, message);
  return !message;
}

function validateForm(form) {
  let firstInvalid = null;

  getValidatedInputs(form).forEach((input) => {
    input.dataset.touched = 'true';
    if (!validateField(input) && !firstInvalid) firstInvalid = input;
  });

  firstInvalid?.focus();
  return !firstInvalid;
}

Object.values(forms).forEach((form) => {
  getValidatedInputs(form).forEach((input) => {
    input.addEventListener('blur', () => {
      if (input.value === '' && !input.dataset.touched) return;
      input.dataset.touched = 'true';
      validateField(input);
    });

    input.addEventListener('input', () => {
      hideMessage(form);
      if (input.dataset.touched) validateField(input);
    });
  });
});

function showMessage(form, text, type = 'success') {
  const box = form.querySelector('.form-message');
  box.textContent = text;
  box.dataset.type = type;
  box.hidden = false;
}

function hideMessage(form) {
  const box = form.querySelector('.form-message');
  box.hidden = true;
  box.textContent = '';
}

function setLoading(form, isLoading) {
  const button = form.querySelector('[type="submit"]');
  const label = button.querySelector('.btn__label');

  if (!button.dataset.idleLabel) button.dataset.idleLabel = label.textContent;

  button.disabled = isLoading;
  button.classList.toggle('is-loading', isLoading);
  button.setAttribute('aria-busy', String(isLoading));
  label.textContent = isLoading ? button.dataset.loadingLabel : button.dataset.idleLabel;
  form.dataset.submitting = String(isLoading);
}

function isSubmitting(form) {
  return form.dataset.submitting === 'true';
}

function applyApiErrors(form, errors) {
  const leftovers = [];
  let firstInput = null;

  Object.entries(errors).forEach(([key, messages]) => {
    const message = Array.isArray(messages) ? messages[0] : String(messages);
    const input = form.elements.namedItem(key);

    if (input instanceof HTMLInputElement) {
      input.dataset.touched = 'true';
      setFieldState(input, message);
      if (!firstInput) firstInput = input;
    } else {
      leftovers.push(message);
    }
  });

  if (leftovers.length) showMessage(form, leftovers.join(' '), 'error');
  if (!firstInput && !leftovers.length) {
    showMessage(form, 'Confira os dados e tente novamente.', 'error');
  }
  firstInput?.focus();
}

function describeError(error) {
  if (error.status === 0) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  }
  return 'Algo deu errado do nosso lado. Tente novamente em instantes.';
}

function setMode(mode, { focusSelector } = {}) {
  container.dataset.mode = mode;

  Object.entries(sections).forEach(([key, section]) => {
    section.inert = key !== mode;
  });
  panelContents.forEach((content) => {
    content.inert = content.dataset.panel !== mode;
  });

  document.title = mode === 'login' ? 'Entrar' : 'Criar conta';
  hideMessage(forms[mode]);

  if (focusSelector) {
    forms[mode].querySelector(focusSelector)?.focus({ preventScroll: true });
  }
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-mode-target]');
  if (!trigger) return;
  setMode(trigger.dataset.modeTarget, { focusSelector: 'input' });
});

document.querySelectorAll('.toggle-password').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.getAttribute('aria-controls'));
    const willShow = input.type === 'password';
    input.type = willShow ? 'text' : 'password';
    button.textContent = willShow ? 'Ocultar' : 'Mostrar';
  });
});

forms.login.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = forms.login;

  if (isSubmitting(form)) return;
  hideMessage(form);
  if (!validateForm(form)) return;

  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;

  setLoading(form, true);

  try {
    const data = await simularApi('POST', '/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    window.location.assign(DASHBOARD_PAGE);
  } catch (error) {
    setLoading(form, false);

    if (error.status === 401) {
      showMessage(form, 'E-mail ou senha incorretos.', 'error');
    } else if (error.status === 400) {
      applyApiErrors(form, error.errors);
    } else {
      showMessage(form, describeError(error), 'error');
    }
  }
});

forms.register.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = forms.register;

  if (isSubmitting(form)) return;
  hideMessage(form);
  if (!validateForm(form)) return;

  const name = form.elements.name.value.trim();
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;

  setLoading(form, true);

  try {
    await simularApi('POST', '/auth/register', { name, email, password });

    form.reset();
    clearFieldStates(form);

    forms.login.elements.email.value = email;
    setMode('login', { focusSelector: 'input[name="password"]' });
    showMessage(forms.login, 'Conta criada! Agora entre com seu e-mail e senha.');
  } catch (error) {
    if (error.status === 400) {
      applyApiErrors(form, error.errors);
    } else if (error.status === 409) {
      const emailInput = form.elements.email;
      setFieldState(emailInput, 'Já existe uma conta com este e-mail.');
      emailInput.focus();
    } else {
      showMessage(form, describeError(error), 'error');
    }
  } finally {
    setLoading(form, false);
  }
});

setMode('login');
