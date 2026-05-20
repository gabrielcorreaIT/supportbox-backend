# SupportBox Backend

API REST do SupportBox. Este projeto cuidara das camadas **Controller**,
**Service** e **Model** do MVC. A camada **View** vive em outro projeto
(`supportbox`, o frontend em Next.js).

> Estado atual: apenas a camada de **Controller** existe. Service e
> Model entram nas proximas etapas. Todos os endpoints respondem
> `501 Not Implemented`, exceto a validacao de entrada (que ja funciona
> nos endpoints com corpo de requisicao).

## 1. Arquitetura prevista

```
Cliente HTTP (frontend)
        |
        v
   Controller   <- esta etapa: recebe HTTP, valida entrada, responde.
        |
        v
   Service      <- proxima etapa: regras de negocio.
        |
        v
   Model        <- etapa seguinte: acesso a dados (Supabase).
```

Principios aplicados:

- **SRP**: cada Controller cuida de um unico recurso (Auth, Chamados,
  Comentarios).
- **OCP**: novos endpoints sao adicionados como novos metodos, sem
  mudar os existentes.

## 2. Como rodar

```
npm install
cp .env.example .env       # preencha conforme necessario
npm run dev                # sobe em http://localhost:4000 com reload
```

Endpoints com corpo invalido respondem `400` com a lista de erros do
zod. Demais respostas sao `501` ate o Service ser implementado.

## 3. Estrutura de pastas

```
supportbox-backend/
|- REGRAS_DE_NEGOCIO.md       regras que o Service vai aplicar
|- src/
|  |- controllers/            unicos arquivos com codigo "pronto" nesta etapa
|  |  |- AuthController.ts
|  |  |- ChamadosController.ts
|  |  '- ComentariosController.ts
|  |- routes/                 mapa de URL -> metodo do controller
|  |  '- index.ts
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
  Request, Response).
- O Controller nunca decide regra de negocio: apenas valida o formato
  da entrada e responde. A logica entra no Service na proxima etapa.

## 5. O que vem pela frente

- [x] Etapa 1: Controllers + documento de regras de negocio.
- [ ] Etapa 2: Camada de Service (regras de negocio).
- [ ] Etapa 3: Camada de Model (Supabase).
- [ ] Etapa 4: Autenticacao real e integracao com o frontend.
