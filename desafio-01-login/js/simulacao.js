class ErroApi extends Error {
  constructor(status, errors = {}) {
    super(`Erro ${status}`);
    this.status = status;
    this.errors = errors;
  }
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function simularApi(metodo, rota, dados = {}) {
  await esperar(1200); // atraso para dar tempo de ver o carregamento

  const email = (dados.email || '').toLowerCase();

  if (email === 'offline@teste.com') throw new ErroApi(0);

  if (metodo === 'POST' && rota === '/auth/login') {
    if (email === 'erro@teste.com') throw new ErroApi(401);
    return { accessToken: 'token-simulado' };
  }

  if (metodo === 'POST' && rota === '/auth/register') {
    if (email === 'existe@teste.com') throw new ErroApi(409);
    if (dados.name.trim().length < 2) {
      throw new ErroApi(400, { name: ['O nome precisa ter pelo menos 2 letras.'] });
    }
    return { id: 1, name: dados.name, email: dados.email };
  }

  if (metodo === 'GET' && rota === '/auth/me') {
    const simular = new URLSearchParams(window.location.search).get('simular');
    if (simular === 'erro') throw new ErroApi(0);
    if (simular === 'expirado') throw new ErroApi(401);
    return { id: 1, name: 'Artur Vinicius', email: 'artur@exemplo.com' };
  }

  throw new ErroApi(404);
}
