document.addEventListener('DOMContentLoaded', function () {
  const PAGE_SIZE = 6;
  const DEBOUNCE_MS = 400;
  const SKELETON_COUNT = 6;

  const nav = document.getElementById('mainNav');
  const navMenu = document.getElementById('navMenu');
  const filterTabs = document.getElementById('filterTabs');
  const searchInput = document.getElementById('menuSearch');
  const menuStatus = document.getElementById('menuStatus');
  const grid = document.getElementById('menuGrid');
  const cardTemplate = document.getElementById('cardTemplate');
  const emptyState = document.getElementById('emptyState');
  const clearFiltersButton = document.getElementById('clearFilters');
  const errorState = document.getElementById('errorState');
  const errorText = document.getElementById('errorText');
  const retryButton = document.getElementById('retryButton');
  const loadMoreButton = document.getElementById('loadMore');

  const detailModalElement = document.getElementById('detailModal');
  const detailModal = bootstrap.Modal.getOrCreateInstance(detailModalElement);
  const detailTitle = document.getElementById('detailTitle');
  const detailViews = {
    loading: document.getElementById('detailLoading'),
    error: document.getElementById('detailError'),
    content: document.getElementById('detailContent'),
  };
  const detailErrorText = document.getElementById('detailErrorText');
  const detailRetry = document.getElementById('detailRetry');
  const detailTag = document.getElementById('detailTag');
  const detailDescription = document.getElementById('detailDescription');
  const detailPrice = document.getElementById('detailPrice');

  const formatadorPreco = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const estado = { categoria: '', busca: '', pagina: 1 };
  let controladorLista = null;
  let controladorDetalhe = null;
  let timerBusca = null;
  let ultimaAcao = null;
  let detalheAtual = null;

  function formatarPreco(centavos) {
    return formatadorPreco.format(centavos / 100);
  }

  function mensagemDeErro(erro, contexto) {
    if (erro.status === 0) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
    }
    return `Não conseguimos carregar ${contexto} agora. Tente novamente em instantes.`;
  }

  function lerUrl() {
    const params = new URLSearchParams(window.location.search);
    estado.categoria = params.get('category') || '';
    estado.busca = params.get('search') || '';
    searchInput.value = estado.busca;
  }

  function atualizarUrl(modo) {
    const params = new URLSearchParams(window.location.search);
    params.delete('category');
    params.delete('search');
    if (estado.categoria) params.set('category', estado.categoria);
    if (estado.busca) params.set('search', estado.busca);

    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;

    if (modo === 'push') {
      window.history.pushState(null, '', url);
    } else {
      window.history.replaceState(null, '', url);
    }
  }

  function criarAba(slug, nome) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'filter-btn';
    botao.dataset.slug = slug;
    botao.textContent = nome;
    return botao;
  }

  function renderizarAbas(categorias) {
    const abas = categorias.map(function (categoria) {
      return criarAba(categoria.slug, categoria.name);
    });
    filterTabs.replaceChildren(criarAba('', 'Todos'), ...abas);
    marcarAbaAtiva();
  }

  function marcarAbaAtiva() {
    filterTabs.querySelectorAll('.filter-btn').forEach(function (botao) {
      const ativa = botao.dataset.slug === estado.categoria;
      botao.classList.toggle('active', ativa);
      botao.setAttribute('aria-pressed', String(ativa));
    });
  }

  function criarCard(item) {
    const fragmento = cardTemplate.content.cloneNode(true);
    const botao = fragmento.querySelector('.ticket-more');

    fragmento.querySelector('.ticket-tag').textContent = item.category.name;
    fragmento.querySelector('.ticket-name').textContent = item.name;
    fragmento.querySelector('.ticket-desc').textContent = item.description;
    fragmento.querySelector('.ticket-price').textContent = formatarPreco(item.priceCents);

    botao.dataset.slug = item.slug;
    botao.dataset.name = item.name;
    botao.setAttribute('aria-label', `Ver mais sobre ${item.name}`);

    return fragmento;
  }

  function criarEsqueleto() {
    const coluna = document.createElement('div');
    coluna.className = 'col-12 col-sm-6 col-lg-4';
    coluna.setAttribute('aria-hidden', 'true');
    coluna.innerHTML = `
      <div class="ticket-card skeleton-card">
        <span class="skeleton-line skeleton-line--tag"></span>
        <span class="skeleton-line skeleton-line--title"></span>
        <span class="skeleton-line"></span>
        <span class="skeleton-line skeleton-line--short"></span>
      </div>`;
    return coluna;
  }

  function mostrarCarregando() {
    const esqueletos = Array.from({ length: SKELETON_COUNT }, criarEsqueleto);
    grid.replaceChildren(...esqueletos);
    grid.setAttribute('aria-busy', 'true');
    emptyState.hidden = true;
    errorState.hidden = true;
    loadMoreButton.hidden = true;
    menuStatus.textContent = 'Carregando cardápio…';
  }

  function mostrarErro(mensagem, acao) {
    errorText.textContent = mensagem;
    errorState.hidden = false;
    grid.removeAttribute('aria-busy');
    menuStatus.textContent = '';
    ultimaAcao = acao;
  }

  function definirCarregandoMais(carregando) {
    loadMoreButton.disabled = carregando;
    loadMoreButton.textContent = carregando ? 'Carregando…' : 'Carregar mais';
  }

  async function carregarItens(anexar = false) {
    if (controladorLista) controladorLista.abort();
    controladorLista = new AbortController();
    const sinal = controladorLista.signal;
    const pagina = anexar ? estado.pagina + 1 : 1;

    if (anexar) {
      errorState.hidden = true;
      definirCarregandoMais(true);
    } else {
      mostrarCarregando();
    }

    try {
      const resposta = await simularApi('GET', '/menu-items', {
        params: {
          category: estado.categoria,
          search: estado.busca,
          page: pagina,
          pageSize: PAGE_SIZE,
        },
        signal: sinal,
      });

      const cards = resposta.items.map(criarCard);
      if (anexar) {
        grid.append(...cards);
      } else {
        grid.replaceChildren(...cards);
      }

      estado.pagina = resposta.page;
      grid.removeAttribute('aria-busy');
      emptyState.hidden = resposta.totalItems !== 0;
      loadMoreButton.hidden = resposta.page >= resposta.totalPages;
      menuStatus.textContent =
        resposta.totalItems === 0
          ? 'Nenhum prato encontrado.'
          : `Mostrando ${grid.children.length} de ${resposta.totalItems} pratos.`;
    } catch (erro) {
      if (erro.name === 'AbortError') return;
      if (!anexar) grid.replaceChildren();
      loadMoreButton.hidden = true;
      mostrarErro(mensagemDeErro(erro, 'o cardápio'), function () {
        carregarItens(anexar);
      });
    } finally {
      if (anexar) definirCarregandoMais(false);
    }
  }

  async function iniciar() {
    lerUrl();
    renderizarAbas([]);
    mostrarCarregando();

    try {
      const resposta = await simularApi('GET', '/categories');
      const categoriaExiste = resposta.items.some(function (categoria) {
        return categoria.slug === estado.categoria;
      });

      if (estado.categoria && !categoriaExiste) {
        estado.categoria = '';
        atualizarUrl('replace');
      }

      renderizarAbas(resposta.items);
      carregarItens();
    } catch (erro) {
      grid.replaceChildren();
      mostrarErro(mensagemDeErro(erro, 'o cardápio'), iniciar);
    }
  }

  filterTabs.addEventListener('click', function (evento) {
    const botao = evento.target.closest('.filter-btn');
    if (!botao || botao.dataset.slug === estado.categoria) return;

    estado.categoria = botao.dataset.slug;
    marcarAbaAtiva();
    atualizarUrl('push');
    carregarItens();
  });

  searchInput.addEventListener('input', function () {
    clearTimeout(timerBusca);
    timerBusca = setTimeout(function () {
      const termo = searchInput.value.trim();
      if (termo === estado.busca) return;

      estado.busca = termo;
      atualizarUrl('replace');
      carregarItens();
    }, DEBOUNCE_MS);
  });

  clearFiltersButton.addEventListener('click', function () {
    estado.categoria = '';
    estado.busca = '';
    searchInput.value = '';
    marcarAbaAtiva();
    atualizarUrl('push');
    carregarItens();
  });

  retryButton.addEventListener('click', function () {
    if (ultimaAcao) ultimaAcao();
  });

  loadMoreButton.addEventListener('click', function () {
    carregarItens(true);
  });

  window.addEventListener('popstate', function () {
    lerUrl();
    marcarAbaAtiva();
    carregarItens();
  });

  function mostrarDetalhe(nome) {
    Object.entries(detailViews).forEach(function ([chave, elemento]) {
      elemento.hidden = chave !== nome;
    });
  }

  async function abrirDetalhe(slug, nome) {
    detalheAtual = { slug, nome };
    detailTitle.textContent = nome;
    mostrarDetalhe('loading');
    detailModal.show();

    if (controladorDetalhe) controladorDetalhe.abort();
    controladorDetalhe = new AbortController();

    try {
      const item = await simularApi('GET', `/menu-items/${encodeURIComponent(slug)}`, {
        signal: controladorDetalhe.signal,
      });

      detailTitle.textContent = item.name;
      detailTag.textContent = item.category.name;
      detailDescription.textContent = item.longDescription || item.description;
      detailPrice.textContent = formatarPreco(item.priceCents);
      mostrarDetalhe('content');
    } catch (erro) {
      if (erro.name === 'AbortError') return;
      detailErrorText.textContent =
        erro.status === 404
          ? 'Este prato não está mais disponível.'
          : mensagemDeErro(erro, 'os detalhes deste prato');
      mostrarDetalhe('error');
    }
  }

  grid.addEventListener('click', function (evento) {
    const botao = evento.target.closest('.ticket-more');
    if (botao) abrirDetalhe(botao.dataset.slug, botao.dataset.name);
  });

  detailRetry.addEventListener('click', function () {
    if (detalheAtual) abrirDetalhe(detalheAtual.slug, detalheAtual.nome);
  });

  detailModalElement.addEventListener('hidden.bs.modal', function () {
    if (controladorDetalhe) controladorDetalhe.abort();
  });

  function atualizarNav() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }

  window.addEventListener('scroll', atualizarNav, { passive: true });
  atualizarNav();

  navMenu.addEventListener('click', function (evento) {
    if (evento.target.closest('.nav-link') && navMenu.classList.contains('show')) {
      bootstrap.Collapse.getOrCreateInstance(navMenu, { toggle: false }).hide();
    }
  });

  iniciar();
});
