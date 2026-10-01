document.addEventListener('DOMContentLoaded', function () {
  const themeToggle = document.getElementById('themeToggle');

  function aplicarEstadoBotao(escuro) {
    themeToggle.setAttribute('aria-pressed', String(escuro));
    themeToggle.setAttribute(
      'aria-label',
      escuro ? 'Alternar para tema claro' : 'Alternar para tema escuro',
    );
  }

  aplicarEstadoBotao(document.body.classList.contains('dark'));

  themeToggle.addEventListener('click', function () {
    const estaEscuro = document.body.classList.toggle('dark');
    localStorage.setItem('tema', estaEscuro ? 'dark' : 'light');
    aplicarEstadoBotao(estaEscuro);
  });
});
