# Regras de negocio - SupportBox

Documento de referencia das regras que governam o sistema. Toda regra
descrita aqui sera aplicada na camada de **Service** do backend. A
camada de **Controller** apenas garante que a requisicao chegue ao
Service no formato correto.

> Importante: o frontend (View) tambem pode replicar parte destas regras
> para dar feedback rapido ao usuario (esconder botoes, validar
> formularios). Isso e conveniencia, nao seguranca. **A unica fonte
> confiavel destas regras e o backend.**

---

## 1. Ciclo de vida do chamado (maquina de estados)

Um chamado transita entre estados nesta ordem:

```
Aberto  ->  Em Andamento  ->  Concluido
```

- Todo chamado novo nasce em **Aberto**, sem agente atribuido.
- Um chamado so vai para **Em Andamento** quando um agente o assume.
- Um chamado so vai para **Concluido** quando o agente atribuido marca
  como concluido.
- Nao e permitido pular estados (ex.: Aberto direto para Concluido).

*Motivo:* evita que chamados desaparecam sem trilha de atendimento e da
previsibilidade ao acompanhamento.

## 2. Atribuicao unica e responsavel

- Um chamado tem **no maximo um agente** responsavel por vez.
- Apenas usuarios com papel **Agente** podem assumir chamados.
- Apenas o **agente atribuido** pode concluir o chamado.
- Reatribuicao e permitida (outro agente assume), mas registrada no
  historico.

*Motivo:* dilui o problema de "responsabilidade difusa" tipico de filas
compartilhadas.

## 3. Visibilidade por papel (seguranca)

- O **Solicitante** ve apenas os chamados que ele mesmo abriu.
- O **Agente** ve todos os chamados.
- O Solicitante nao pode alterar status, prioridade, categoria nem
  reatribuir um chamado.
- Estas regras sao aplicadas no backend (Service), nunca apenas
  escondendo botoes no frontend.

*Motivo:* LGPD e principio do menor privilegio. E a regra que mais
protege a base.

## 4. Validacao obrigatoria na abertura

Campos obrigatorios ao abrir um chamado:

| Campo       | Restricao                             |
|-------------|---------------------------------------|
| titulo      | minimo 5 caracteres                   |
| descricao   | minimo 20 caracteres                  |
| categoria   | Hardware, Software, Acesso ou Rede    |
| tipo        | incidente ou solicitacao              |

- **Prioridade inicial** padrao = **Media**. O agente pode reclassificar.
- **Protocolo** gerado automaticamente no formato `CH-AAAA-NNN`,
  sequencial por ano e imutavel.

*Motivo:* descricao curta demais inviabiliza o atendimento; o protocolo
sequencial da rastreabilidade legivel.

## 5. Historico imutavel e comentarios auditaveis

- Comentarios **nao podem ser editados nem apagados** depois de salvos.
- Toda mudanca de **status**, **atribuicao** ou **prioridade** gera um
  comentario automatico do autor `Sistema`, indicando quem fez, quando e
  o que mudou.
- Apenas o solicitante do chamado e o agente atribuido podem comentar.

*Motivo:* trilha de auditoria e exigencia basica de ITSM em 2026. Sem
isso, nao ha como reconstruir o que aconteceu.

## 6. SLA por prioridade (em horas uteis)

| Prioridade | Tempo de 1a resposta | Tempo de resolucao |
|------------|----------------------|--------------------|
| Alta       | 4 h uteis            | 1 dia util         |
| Media      | 8 h uteis            | 3 dias uteis       |
| Baixa      | 24 h uteis           | 5 dias uteis       |

- O cronometro pausa enquanto o chamado aguarda resposta do solicitante.
- Chamados que estouraram o SLA recebem sinalizacao visual na tabela
  do agente.

*Motivo:* sem SLA, "Alta prioridade" vira so um rotulo. E a regra que
mais aproxima o sistema de uma ferramenta de mercado.

## 7. Reabertura controlada

- O solicitante pode **reabrir** um chamado Concluido em ate **7 dias
  corridos** apos a conclusao.
- A reabertura retorna o chamado para **Em Andamento** com o mesmo
  agente atribuido originalmente.
- Passado o prazo, e preciso abrir um chamado novo (podendo referenciar
  o anterior, se desejar).

*Motivo:* impede que um chamado de meses atras seja reaberto sem
contexto, mas da margem para correcoes honestas.

---

## Tabela rapida: quem pode fazer o que

| Acao                              | Solicitante | Agente |
|-----------------------------------|:-----------:|:------:|
| Abrir chamado                     |     sim     |  nao*  |
| Ver os proprios chamados          |     sim     |  sim   |
| Ver chamados de outros            |    nao      |  sim   |
| Assumir um chamado                |    nao      |  sim   |
| Concluir um chamado               |    nao      | so o atribuido |
| Reatribuir um chamado             |    nao      |  sim   |
| Alterar prioridade ou categoria   |    nao      |  sim   |
| Comentar                          | so nos seus | so nos atribuidos |
| Reabrir um chamado (em ate 7 dias)|     sim     |  nao   |

*Agentes podem abrir chamados em nome proprio, mas isso e excecao
operacional. O perfil padrao para abertura e o Solicitante.

---

## O que esta fora desta versao

Itens deliberadamente deixados de fora para manter o escopo enxuto:

- Anexos em chamados (arquivos, imagens).
- Notificacoes por e-mail.
- Encerramento automatico por inatividade.
- Pesquisa de satisfacao apos conclusao.
- Categorizacao por inteligencia artificial.

Estes itens podem ser avaliados em iteracoes futuras.
