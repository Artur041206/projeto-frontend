# Projeto Frontend

Três desafios de front-end feitos com HTML5, CSS3, Bootstrap 5 e JavaScript puro. As telas foram preparadas para consumir a API REST da trilha de back-end. Enquanto a API não fica pronta, elas funcionam com uma simulação.

## Desafios

| Desafio | Pasta                    | O que faz                                                                                                   |
| ------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| 01      | `desafio-01-login`       | Tela de login e cadastro em split screen, com validação em tempo real e página protegida (`dashboard.html`) |
| 02      | `desafio-02-restaurante` | Landing page de restaurante com cardápio dinâmico, abas de categoria, busca, detalhes do prato e paginação  |
| 03      | `desafio-03-portfolio`   | Portfólio pessoal com tema claro e escuro, grade de projetos e formulário de contato                        |

## Estado atual

As telas ainda não falam com a API de verdade. Cada desafio tem um arquivo `js/simulacao.js` que imita as rotas do contrato (`/auth/login`, `/menu-items`, `/contact-messages` e outras), com atraso e erros de teste. Quando a API estiver pronta, esse arquivo é removido e as chamadas passam a usar `shared/api-client.js`.

A pasta `shared` já tem o cliente de API pronto:

- `shared/config.js`: guarda a URL da API, o único lugar do projeto onde ela aparece.
- `shared/api-client.js`: única função do projeto que chama `fetch`. Envia o token, converte erros no formato `application/problem+json` e limpa a sessão quando a API responde 401.

## Como rodar

1. Instale o Node.js 18 ou superior.
2. Instale a extensão **Live Server** no VS Code.
3. Abra a pasta `projeto-frontend` no VS Code. Abra a pasta raiz, e não a de um desafio, porque os desafios acessam a pasta `shared`.
4. Clique com o botão direito no `index.html` do desafio e escolha **Open with Live Server**.

Os desafios 01 e 03 podem ser abertos assim, usando a simulação. Para usar a API real ou o mock do contrato:

```bash
npx @stoplight/prism-cli mock contracts/openapi.yaml --port 5080
```

A API fica em `http://localhost:5080/api/v1`. Para usar outro endereço, altere `API_BASE_URL` em `shared/config.js`.

No PowerShell do Windows, se aparecer o erro de execução de scripts desabilitada, use `npx.cmd` no lugar de `npx`.

## Como testar a simulação

### Desafio 01: login

| Onde      | O que fazer                                    | Resultado                              |
| --------- | ---------------------------------------------- | -------------------------------------- |
| Login     | E-mail válido e senha com 8 ou mais caracteres | Entra e vai para o dashboard           |
| Login     | E-mail `erro@teste.com`                        | Mensagem "E-mail ou senha incorretos." |
| Login     | E-mail `offline@teste.com`                     | Mensagem de servidor fora do ar        |
| Cadastro  | E-mail `existe@teste.com`                      | Erro no campo de e-mail                |
| Cadastro  | Nome com uma letra                             | Erro no campo de nome                  |
| Dashboard | Acrescentar `?simular=erro` na URL             | Estado de erro com "Tentar novamente"  |
| Dashboard | Acrescentar `?simular=expirado` na URL         | Sessão limpa e volta para o login      |

### Desafio 02: restaurante

| O que fazer                                | Resultado                                    |
| ------------------------------------------ | -------------------------------------------- |
| Abrir a página                             | Esqueleto de carregamento e depois os pratos |
| Buscar `zzz`                               | Estado vazio                                 |
| Buscar `erro`                              | Estado de erro com "Tentar novamente"        |
| Acrescentar `?simular=erro` na URL         | Erro ao carregar as categorias               |
| Acrescentar `?simular=erro-detalhe` na URL | Erro dentro da janela de detalhes            |

### Desafio 03: portfólio

| E-mail digitado no formulário | Resultado                    |
| ----------------------------- | ---------------------------- |
| Qualquer e-mail válido        | Mensagem enviada             |
| `erro@teste.com`              | Erro no campo de e-mail      |
| `limite@teste.com`            | Aviso de muitos envios       |
| `offline@teste.com`           | Aviso de servidor fora do ar |

## Estrutura

```
projeto-frontend/
├── contracts/
│   └── openapi.yaml
├── shared/
│   ├── config.js
│   └── api-client.js
├── desafio-01-login/
├── desafio-02-restaurante/
├── desafio-03-portfolio/
├── README.md
├── .prettierrc
└── .gitignore
```

## Padrões do projeto

- Código formatado com Prettier, configurado em `.prettierrc`.
- Commits pequenos, no padrão conventional commits, por exemplo `feat: adiciona busca no cardápio`.
- Todo pull request é revisado pelo aprendiz de back-end antes do merge.
- Layouts conferidos em 360px, 768px e 1280px.

Para formatar e conferir tudo de uma vez, na pasta raiz:

```bash
npx prettier --write .
npx prettier --check .
```

## Tecnologias

HTML5, CSS3, Bootstrap 5, JavaScript puro, Git e GitHub.
