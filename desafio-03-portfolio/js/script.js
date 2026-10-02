document.addEventListener('DOMContentLoaded', function () {
  const raiz = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');

  function aplicarEstadoBotao(escuro) {
    themeToggle.setAttribute('aria-pressed', String(escuro));
  }

  function salvarTema(tema) {
    try {
      localStorage.setItem('tema', tema);
      return true;
    } catch {
      return false;
    }
  }

  aplicarEstadoBotao(raiz.classList.contains('dark'));

  themeToggle.addEventListener('click', function () {
    const estaEscuro = raiz.classList.toggle('dark');
    salvarTema(estaEscuro ? 'dark' : 'light');
    aplicarEstadoBotao(estaEscuro);
  });

  const MENU_BREAKPOINT = '(max-width: 640px)';

  const header = document.querySelector('.site-header');
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  const telaPequena = window.matchMedia(MENU_BREAKPOINT);

  function menuEstaAberto() {
    return header.classList.contains('menu-open');
  }

  function definirMenu(aberto) {
    header.classList.toggle('menu-open', aberto);
    menuToggle.setAttribute('aria-expanded', String(aberto));
    menuToggle.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
  }

  menuToggle.addEventListener('click', function () {
    definirMenu(!menuEstaAberto());
  });

  mainNav.addEventListener('click', function (evento) {
    if (evento.target.closest('a')) definirMenu(false);
  });

  document.addEventListener('click', function (evento) {
    if (menuEstaAberto() && !header.contains(evento.target)) definirMenu(false);
  });

  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && menuEstaAberto()) {
      definirMenu(false);
      menuToggle.focus();
    }
  });

  telaPequena.addEventListener('change', function (evento) {
    if (!evento.matches) definirMenu(false);
  });

  const MIN_MENSAGEM = 10;
  const form = document.getElementById('contactForm');
  const caixaMensagem = form.querySelector('.form-message');

  const regras = {
    name: function (valor) {
      return valor.trim() ? '' : 'Informe seu nome.';
    },
    email: function (valor) {
      const email = valor.trim();
      if (!email) return 'Informe seu e-mail.';
      if (!email.includes('@')) return 'O e-mail precisa ter "@".';
      return '';
    },
    message: function (valor) {
      const texto = valor.trim();
      if (!texto) return 'Escreva sua mensagem.';
      if (texto.length < MIN_MENSAGEM) {
        return `A mensagem precisa ter pelo menos ${MIN_MENSAGEM} caracteres.`;
      }
      return '';
    },
  };

  const campos = Object.keys(regras).map(function (nome) {
    return form.elements.namedItem(nome);
  });

  function definirEstadoCampo(campo, mensagem) {
    const field = campo.closest('.field');
    const erro = document.getElementById(`${campo.id}-error`);
    const temErro = Boolean(mensagem);

    field.classList.toggle('field--error', temErro);
    campo.setAttribute('aria-invalid', String(temErro));
    erro.textContent = mensagem;
  }

  function validarCampo(campo) {
    const mensagem = regras[campo.name](campo.value);
    definirEstadoCampo(campo, mensagem);
    return !mensagem;
  }

  function validarFormulario() {
    let primeiroInvalido = null;

    campos.forEach(function (campo) {
      campo.dataset.touched = 'true';
      if (!validarCampo(campo) && !primeiroInvalido) primeiroInvalido = campo;
    });

    if (primeiroInvalido) primeiroInvalido.focus();
    return !primeiroInvalido;
  }

  function limparCampos() {
    campos.forEach(function (campo) {
      definirEstadoCampo(campo, '');
      campo.removeAttribute('aria-invalid');
      delete campo.dataset.touched;
    });
  }

  function mostrarMensagem(texto, tipo = 'success') {
    caixaMensagem.textContent = texto;
    caixaMensagem.dataset.type = tipo;
    caixaMensagem.hidden = false;
  }

  function esconderMensagem() {
    caixaMensagem.hidden = true;
    caixaMensagem.textContent = '';
  }

  function definirCarregando(carregando) {
    const botao = form.querySelector('[type="submit"]');
    const rotulo = botao.querySelector('.btn-label');

    if (!botao.dataset.idleLabel) botao.dataset.idleLabel = rotulo.textContent;

    botao.disabled = carregando;
    botao.classList.toggle('is-loading', carregando);
    botao.setAttribute('aria-busy', String(carregando));
    rotulo.textContent = carregando ? botao.dataset.loadingLabel : botao.dataset.idleLabel;
    form.dataset.submitting = String(carregando);
  }

  function aplicarErrosDaApi(errors) {
    const sobras = [];
    let primeiroCampo = null;

    Object.entries(errors).forEach(function ([chave, mensagens]) {
      const mensagem = Array.isArray(mensagens) ? mensagens[0] : String(mensagens);
      const campo = form.elements.namedItem(chave);

      if (campo && chave in regras) {
        campo.dataset.touched = 'true';
        definirEstadoCampo(campo, mensagem);
        if (!primeiroCampo) primeiroCampo = campo;
      } else {
        sobras.push(mensagem);
      }
    });

    if (sobras.length) mostrarMensagem(sobras.join(' '), 'error');
    if (!primeiroCampo && !sobras.length) {
      mostrarMensagem('Confira os dados e tente novamente.', 'error');
    }
    if (primeiroCampo) primeiroCampo.focus();
  }

  campos.forEach(function (campo) {
    campo.addEventListener('blur', function () {
      if (campo.value === '' && !campo.dataset.touched) return;
      campo.dataset.touched = 'true';
      validarCampo(campo);
    });

    campo.addEventListener('input', function () {
      esconderMensagem();
      if (campo.dataset.touched) validarCampo(campo);
    });
  });

  form.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    if (form.dataset.submitting === 'true') return;
    esconderMensagem();
    if (!validarFormulario()) return;

    const dados = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      message: form.elements.message.value.trim(),
      website: form.elements.website.value,
    };

    definirCarregando(true);

    try {
      await simularApi('POST', '/contact-messages', dados);
      form.reset();
      limparCampos();
      mostrarMensagem('Mensagem enviada! Vou responder no e-mail que você informou.');
    } catch (erro) {
      if (erro.status === 400) {
        aplicarErrosDaApi(erro.errors);
      } else if (erro.status === 429) {
        mostrarMensagem(
          'Você enviou muitas mensagens em pouco tempo. Tente de novo em alguns minutos.',
          'error',
        );
      } else if (erro.status === 0) {
        mostrarMensagem(
          'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
          'error',
        );
      } else {
        mostrarMensagem('Algo deu errado do nosso lado. Tente novamente em instantes.', 'error');
      }
    } finally {
      definirCarregando(false);
    }
  });
});
