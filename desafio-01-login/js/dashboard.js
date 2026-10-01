const TOKEN_KEY = 'accessToken';
const LOGIN_PAGE = 'index.html';

const views = {
  loading: document.getElementById('view-loading'),
  error: document.getElementById('view-error'),
  content: document.getElementById('view-content'),
};
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const errorText = document.getElementById('error-text');

function showView(name) {
  Object.entries(views).forEach(([key, element]) => {
    element.hidden = key !== name;
  });
}

function goToLogin() {
  localStorage.removeItem(TOKEN_KEY);
  window.location.replace(LOGIN_PAGE);
}

async function loadUser() {
  showView('loading');

  try {
    const user = await simularApi('GET', '/auth/me');
    userName.textContent = user.name;
    userEmail.textContent = user.email;
    showView('content');
  } catch (error) {
    if (error.status === 401) {
      goToLogin();
      return;
    }

    errorText.textContent =
      error.status === 0
        ? 'O servidor não respondeu. Verifique sua conexão e tente novamente.'
        : 'Algo deu errado do nosso lado. Tente novamente em instantes.';
    showView('error');
  }
}

document.getElementById('retry-button').addEventListener('click', loadUser);
document.getElementById('logout-button').addEventListener('click', goToLogin);

if (localStorage.getItem(TOKEN_KEY)) {
  loadUser();
} else {
  goToLogin();
}
