# SupportBox Backend

API REST do SupportBox. No padrao MVC, este projeto implementa duas das
tres camadas:

- **Controller** — recebe a requisicao HTTP, confere o formato e responde.
- **Model** — o "miolo" do sistema. Aqui ele **nao e uma camada unica**:
  esta dividido em **Service** (regras de negocio / validacao) e **DAO**
  (persistencia e comunicacao com o banco).

A camada **View** vive em outro projeto (`supportbox`, o frontend em
Next.js).

> **Estado atual:** os endpoints de **chamados** e **comentarios** funcionam
> de ponta a ponta — Controller -> Service -> DAO (dados **em memoria**).
> So **autenticacao** (`/api/auth/*`) ainda responde `501`: nao ha regras de
> auth nem `AuthService` ainda. Enquanto a auth real nao chega, a identidade
> de quem chama vem de cabecalhos temporarios (`X-Usuario-Id` e
> `X-Usuario-Papel`) — veja "Como rodar". O **CORS** ja esta habilitado para
> o frontend. Nao usamos framework (so o `http` nativo do Node) nem
> biblioteca de validacao de schema.

## 1. Arquitetura

```
Cliente HTTP  (View / frontend Next.js, outro projeto)
      |
      v
  Controller            recebe HTTP, confere o formato, responde
      |
      v
  Model
  |- Service            regras de negocio / validacao   (chamados + comentarios)
  |     |
  |     v
  '- DAO                persistencia (em memoria; Supabase depois)
```

Por que separar Service de DAO dentro do Model:

- O **Service** responde "isso esta de acordo com as regras do sistema?".
  Ele nao sabe nada de HTTP nem de SQL.
- O **DAO** responde "como eu gravo/leio isso no banco?". Ele nao conhece
  nenhuma regra de negocio.

Principios aplicados:

- **SRP** (responsabilidade unica): cada Controller cuida de um unico
  recurso (Auth, Chamados, Comentarios); Service e DAO tambem tem papeis
  bem delimitados.
- **OCP** (aberto/fechado): novos endpoints entram como novos metodos,
  sem mexer nos existentes.

## 2. Como rodar

```
npm install
npm run dev        # sobe em http://localhost:4000 com reload (tsx watch)
```

A porta vem da variavel de ambiente `PORT` (padrao `4000`). A origem do
frontend liberada no CORS vem de `ORIGEM_FRONTEND` (padrao
`http://localhost:3000`). Nesta fase **nao ha carregamento de arquivo
`.env`**: essas variaveis usam os padroes acima (ou o que estiver definido
no ambiente do processo).

**Identificacao temporaria (ainda sem login):** como a autenticacao real
nao existe, toda chamada aos endpoints de chamados/comentarios precisa de
dois cabecalhos dizendo quem e voce:

```
X-Usuario-Id: u-123
X-Usuario-Papel: solicitante      # ou: agente
```

Sem eles, a API responde `401`. Exemplo:

```
curl http://localhost:4000/api/chamados \
  -H "X-Usuario-Id: u-123" -H "X-Usuario-Papel: agente"
```

Os endpoints de `/api/auth/*` ainda respondem `501` (a autenticacao entra
em etapa futura).

## 3. Estrutura de pastas

```
supportbox-backend/
|- REGRAS_DE_NEGOCIO.md       regras que a camada Service aplica
|- src/
|  |- controllers/            traducao HTTP <-> Service (auth ainda 501)
|  |  |- AuthController.ts
|  |  |- ChamadosController.ts
|  |  '- ComentariosController.ts
|  |- services/               Model: camada Service (regras de negocio)
|  |  |- ChamadosService.ts
|  |  '- ComentariosService.ts
|  |- dao/                    Model: camada DAO (persistencia - em memoria)
|  |  |- ChamadosDAO.ts
|  |  '- ComentariosDAO.ts
|  |- routes/                 mapa de URL -> metodo do controller
|  |  '- index.ts
|  |- utils/                  infraestrutura HTTP (sem regra de negocio)
|  |  |- http.ts              tipos compartilhados + resposta JSON
|  |  '- corpo.ts             leitor de corpo JSON (ainda nao usado)
|  |- dominio.ts              tipos do dominio (papel, status, prioridade, chamado, comentario)
|  |- app.ts                  dispatcher de rotas (http nativo, sem framework)
|  '- server.ts               sobe o servidor HTTP
|- package.json
|- tsconfig.json
|- .env.example
'- .gitignore
```

A camada **DAO** ja existe em `src/dao/`, por enquanto guardando os dados
**em memoria** (veja a observacao no topo de `ChamadosDAO.ts`). Trocar por
um banco real (Supabase) sera uma mudanca local na DAO, sem afetar o
Service nem o Controller.

## 4. Convencoes

- **Documentacao farta:** cada arquivo abre com um bloco explicando seu
  papel, e cada funcao/metodo tem JSDoc descrevendo o que faz e por que.
- **Idioma:** nomes do dominio em portugues (Chamado, Comentario,
  Solicitante, Agente); conceitos de plataforma em ingles (Controller,
  Request, Response).
- **Controller nao decide regra de negocio:** ele so confere o formato da
  entrada e responde. Quem decide regra e o Service; quem fala com o banco
  e o DAO.

## 5. O que vem pela frente

- [x] Etapa 1: Controllers + documento de regras de negocio.
- [x] Etapa 2: Camada **Service** (regras de negocio) — chamados e
  comentarios.
- [x] Etapa 3: Camada **DAO** em memoria (chamados: criar/ler/atualizar;
  comentarios: criar/ler). Troca por Supabase fica para quando precisar.
- [x] Etapa 4: Ligar Controller -> Service -> DAO (chamados/comentarios) +
  CORS habilitado.
- [ ] Etapa 5: Autenticacao real (login/token) no lugar dos cabecalhos
  temporarios; comentarios automaticos do "Sistema" (regra 5); SLA (regra 6).
