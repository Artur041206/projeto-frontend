class ErroApi extends Error {
  constructor(status, errors = {}) {
    super(`Erro ${status}`);
    this.status = status;
    this.errors = errors;
  }
}

function esperar(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

async function simularApi(metodo, rota, dados = {}) {
  await esperar(1200);

  const email = (dados.email || '').toLowerCase();

  if (email === 'offline@teste.com') throw new ErroApi(0);

  if (metodo === 'POST' && rota === '/contact-messages') {
    if (email === 'erro@teste.com') {
      throw new ErroApi(400, { email: ['Este e-mail não foi aceito pelo servidor.'] });
    }
    if (email === 'limite@teste.com') throw new ErroApi(429);
    return { id: 1 };
  }

  throw new ErroApi(404);
}
