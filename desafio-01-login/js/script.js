const MIN_PASSWORD_LENGTH = 8;

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

function showMessage(form, text) {
  const box = form.querySelector('.form-message');
  box.textContent = text;
  box.hidden = false;
}

function hideMessage(form) {
  const box = form.querySelector('.form-message');
  box.hidden = true;
  box.textContent = '';
}

function setMode(mode, { focus = false } = {}) {
  container.dataset.mode = mode;

  Object.entries(sections).forEach(([key, section]) => {
    section.inert = key !== mode;
  });
  panelContents.forEach((content) => {
    content.inert = content.dataset.panel !== mode;
  });

  document.title = mode === 'login' ? 'Entrar' : 'Criar conta';
  hideMessage(forms[mode]);

  if (focus) {
    forms[mode].querySelector('input')?.focus({ preventScroll: true });
  }
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-mode-target]');
  if (!trigger) return;
  setMode(trigger.dataset.modeTarget, { focus: true });
});

document.querySelectorAll('.toggle-password').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.getAttribute('aria-controls'));
    const willShow = input.type === 'password';
    input.type = willShow ? 'text' : 'password';
    button.textContent = willShow ? 'Ocultar' : 'Mostrar';
  });
});

forms.login.addEventListener('submit', (event) => {
  event.preventDefault();
  hideMessage(forms.login);
  if (!validateForm(forms.login)) return;

  showMessage(forms.login, 'Tudo certo! Dados válidos para entrar.');
});

forms.register.addEventListener('submit', (event) => {
  event.preventDefault();
  hideMessage(forms.register);
  if (!validateForm(forms.register)) return;

  forms.register.reset();
  clearFieldStates(forms.register);
  showMessage(forms.register, 'Conta criada com sucesso!');
});

setMode('login');
