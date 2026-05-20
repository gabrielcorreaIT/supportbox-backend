# SupportBox Backend

API REST do SupportBox. Este projeto cuida apenas das camadas
**Controller**, **Service** e **Model** do MVC. A camada **View** vive em
outro projeto (`supportbox`, o frontend em Next.js).

> Estado atual: somente a camada de Controller foi escrita. As camadas de
> Service e Model serao adicionadas nas proximas etapas.

## 1. Arquitetura

O sistema segue arquitetura em camadas, no padrao MVC com Service Layer:

```
Cliente HTTP (frontend)
        |
        v
   Controller       <- esta etapa: recebe requisicao, valida entrada,
        |              chama o Service, devolve resposta. Sem regra de
        |              negocio.
        v
   Service          <- proxima etapa: aplica as regras de negocio.
        |
        v
   Model            <- etapa seguinte: acesso aos dados (Supabase).
```

A separacao segue os principios SOLID:

- **SRP**: cada Controller cuida de um recurso (Auth, Chamados, Comentarios).
- **OCP**: novos endpoints sao adicionados como novos metodos, sem mudar
  os existentes.
- **DIP**: cada Controller depende de uma interface de Service
  (`I*Service`), nao de uma implementacao concreta. Quando o Service
  chegar, basta injetar.

## 2. Como rodar

```
npm install
cp .env.example .env       # preencha conforme necessario
npm run dev                # sobe em http://localhost:4000 com reload
```

Como o Service ainda nao foi escrito, os endpoints respondem
`501 Not Implemented` com uma mensagem clara. Isso e intencional nesta
etapa.

## 3. Estrutura de pastas

```
supportbox-backend/
|- REGRAS_DE_NEGOCIO.md       regras que o Service vai aplicar
|- src/
|  |- controllers/            recebem HTTP, validam e delegam
|  |  |- AuthController.ts
|  |  |- ChamadosController.ts
|  |  '- ComentariosController.ts
|  |- services/               somente interfaces nesta etapa
|  |  |- IAuthService.ts
|  |  |- IChamadosService.ts
|  |  '- IComentariosService.ts
|  |- routes/                 mapa de URL -> metodo do controller
|  |  '- index.ts
|  |- middlewares/            funcoes que correm antes/depois das rotas
|  |  |- autenticacao.ts
|  |  '- tratadorDeErros.ts
|  |- lib/                    utilidades isoladas
|  |  '- erros.ts
|  |- types/                  tipos compartilhados do dominio
|  |  '- dominio.ts
|  |- app.ts                  monta o Express
|  '- server.ts               inicia o servidor
|- package.json
|- tsconfig.json
|- .env.example
'- .gitignore
```

## 4. Convencoes

- Cada arquivo comeca com um comentario curto explicando o que ele faz.
- Nomes em portugues no dominio (Chamado, Comentario, Solicitante,
  Agente), nomes em ingles em conceitos da plataforma (Controller,
  Service, Request, Response).
- Classes em PascalCase (`ChamadosController.ts`), utilitarios em
  kebab-case (`erros.ts`).
- Toda regra de negocio mora no Service. O Controller nunca decide o
  que pode ou nao pode acontecer; apenas traduz HTTP para chamadas de
  Service.

## 5. O que vem pela frente

- [x] Etapa 1: Controllers + documento de regras de negocio.
- [ ] Etapa 2: Implementacao da camada de Service.
- [ ] Etapa 3: Camada de Model com Supabase.
- [ ] Etapa 4: Autenticacao real e integracao com o frontend.
