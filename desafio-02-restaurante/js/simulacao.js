class ErroApi extends Error {
  constructor(status, errors = {}) {
    super(`Erro ${status}`);
    this.status = status;
    this.errors = errors;
  }
}

const CATEGORIAS_SIMULADAS = [
  { slug: 'na-brasa', name: 'Na brasa' },
  { slug: 'acompanhamentos', name: 'Acompanhamentos' },
  { slug: 'sobremesas', name: 'Sobremesas' },
  { slug: 'bebidas', name: 'Bebidas' },
];

const PRATOS_SIMULADOS = [
  [
    'picanha-no-bafo',
    'Picanha no bafo',
    'Maturada 21 dias, sal grosso e farofa de alho torrado.',
    8900,
    'na-brasa',
  ],
  [
    'costela-12-horas',
    'Costela 12 horas',
    'Defumada lentamente, molho de brasa e pão de alho artesanal.',
    7600,
    'na-brasa',
  ],
  [
    'polvo-grelhado',
    'Polvo grelhado',
    'Purê de mandioquinha defumado e azeite de ervas.',
    6800,
    'na-brasa',
  ],
  [
    'fraldinha-na-manteiga',
    'Fraldinha na manteiga',
    'Fraldinha selada na brasa e finalizada na manteiga de ervas.',
    7200,
    'na-brasa',
  ],
  [
    'linguica-artesanal',
    'Linguiça artesanal',
    'Linguiça da casa defumada com vinagrete de brasa.',
    3800,
    'na-brasa',
  ],
  [
    'legumes-na-brasa',
    'Legumes na brasa',
    'Seleção do dia, azeite defumado e flor de sal.',
    3200,
    'acompanhamentos',
  ],
  [
    'farofa-de-banana',
    'Farofa de banana',
    'Manteiga de garrafa e banana caramelizada na brasa.',
    2400,
    'acompanhamentos',
  ],
  [
    'mandioca-na-brasa',
    'Mandioca na brasa',
    'Mandioca cozida e tostada na grelha com manteiga.',
    2600,
    'acompanhamentos',
  ],
  [
    'banana-assada-na-brasa',
    'Banana assada na brasa',
    'Canela, doce de leite e sorvete de creme.',
    2800,
    'sobremesas',
  ],
  [
    'fumaca-de-chocolate',
    'Fumaça de chocolate',
    'Mousse defumado com raspas de cacau torrado.',
    2600,
    'sobremesas',
  ],
  [
    'abacaxi-grelhado',
    'Abacaxi grelhado',
    'Abacaxi caramelizado na brasa com hortelã e sorvete.',
    2500,
    'sobremesas',
  ],
  [
    'old-fashioned-defumado',
    'Old fashioned defumado',
    'Bourbon, angostura e fumaça de madeira de carvalho.',
    4200,
    'bebidas',
  ],
  [
    'limonada-de-carvao',
    'Limonada de carvão',
    'Limão siciliano, carvão ativado e hortelã.',
    2200,
    'bebidas',
  ],
  [
    'cha-gelado-de-hibisco',
    'Chá gelado de hibisco',
    'Hibisco, laranja e um toque de canela.',
    1800,
    'bebidas',
  ],
].map(function ([slug, name, description, priceCents, categoria]) {
  return {
    slug,
    name,
    description,
    priceCents,
    category: CATEGORIAS_SIMULADAS.find(function (c) {
      return c.slug === categoria;
    }),
  };
});

function esperar(ms, signal) {
  return new Promise(function (resolve, reject) {
    if (signal && signal.aborted) {
      reject(new DOMException('Requisição cancelada', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener(
        'abort',
        function () {
          clearTimeout(timer);
          reject(new DOMException('Requisição cancelada', 'AbortError'));
        },
        { once: true },
      );
    }
  });
}

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function paginar(lista, page = 1, pageSize = 10) {
  const totalItems = lista.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const inicio = (page - 1) * pageSize;
  return {
    items: lista.slice(inicio, inicio + pageSize),
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

async function simularApi(metodo, rota, opcoes = {}) {
  const params = opcoes.params || {};
  const simular = new URLSearchParams(window.location.search).get('simular');

  await esperar(800, opcoes.signal);

  if (metodo !== 'GET') throw new ErroApi(405);

  if (rota === '/categories') {
    if (simular === 'erro') throw new ErroApi(0);
    return paginar(CATEGORIAS_SIMULADAS, 1, 50);
  }

  if (rota === '/menu-items') {
    const busca = normalizar(params.search || '');
    if (busca === 'erro') throw new ErroApi(500);
    if (busca === 'offline') throw new ErroApi(0);

    const filtrados = PRATOS_SIMULADOS.filter(function (prato) {
      const naCategoria = !params.category || prato.category.slug === params.category;
      const naBusca = !busca || normalizar(`${prato.name} ${prato.description}`).includes(busca);
      return naCategoria && naBusca;
    });

    return paginar(filtrados, Number(params.page) || 1, Number(params.pageSize) || 10);
  }

  if (rota.startsWith('/menu-items/')) {
    if (simular === 'erro-detalhe') throw new ErroApi(500);
    const slug = decodeURIComponent(rota.replace('/menu-items/', ''));
    const prato = PRATOS_SIMULADOS.find(function (p) {
      return p.slug === slug;
    });
    if (!prato) throw new ErroApi(404);
    return {
      ...prato,
      longDescription: `${prato.description} Preparado na hora, na nossa parrilla a lenha.`,
    };
  }

  throw new ErroApi(404);
}
