/**
 * Roteiro de informações e decisões a coletar com o cliente.
 * Fonte: documentos na raiz do monorepo + respostas por e-mail / payloads da API B42 (2026).
 * Referências: DECISOES_PENDENTES_CLIENTE_B42, INTEGRACAO_B42_RESPOSTAS_CLIENTE,
 * DOC_PEDIDO_INTEGRACOES_BIBLIOTECA_E_EBOOKS, CONTINUACAO_CERTIFICADO_GAMIFICACAO,
 * HOMOLOGACAO_CLIENTE_LXP_UAT.
 */

export type ClientIntakeTopic = {
  id: string
  category: string
  title: string
  /** Parágrafos explicativos */
  explanation: string[]
  /** Quando for decisão de negócio/arquitetura — opções viáveis para o cliente escolher ou combinar */
  decisionOptions?: string[]
  /** Itens objetivos que precisamos receber/definir para seguir */
  whatWeNeed: string[]
  /** Texto para ler na reunião: explica o porquê e pede o que falta, em linguagem direta */
  scriptForClient: string
}

export const CLIENT_INTAKE_TOPIC_CATEGORIES: string[] = [
  "Respostas recebidas (API B42 / e-mail)",
  "Integração biblioteca / EAD Stock / Alice",
  "Certificados e documentos legais",
  "Métricas, gamificação e produto aluno",
  // "Acesso, Auth, homologação e governança",
  "Catálogo, matrícula e operações",
]

export const CLIENT_INTAKE_TOPICS: ClientIntakeTopic[] = [
  {
    id: "integration-answered-summary",
    category: "Respostas recebidas (API B42 / e-mail)",
    title: "Consolidado do que o desenvolvedor B42 já respondeu (2026)",
    explanation: [
      "**Autenticação:** Keycloak **ou** API Key; com API Key os headers são `X-API-Key` e `X-API-Secret`, sendo o secret enviado com **hash SHA256** (ainda falta o passo a passo byte-a-byte).",
      "**Duas APIs / bases:** **Eadstock** — stage `stageapi.eadstock.com.br`, prod/dev `api.eadstock.com.br`. **Gael** — stage `stageapigael.eadstock.com.br`, prod/dev `apigael.eadstock.com.br`.",
      "**E-book no iframe (posição atual do time B42):** com a **`url_caderno_digital`** da unidade (vinda de `GET /disciplinas/get/{id}` → `unidades[]`), **URL absoluta** (prefixo/base quando o campo for relativo) e **whitelist** do domínio do LXP Alunos no lado do material, **já é possível renderizar o e-book** no iframe — confirmação verbal do desenvolvedor.",
      "**Alice (2026-05-20):** API em `alice.eadstock.com.br` — `GET /api/rents`, launch via **POST** `/?c=<hash>` + HMAC. Doc: **`INTEGRACAO_ALICE_EADSTOCK.md`**.",
      "**Paginação:** estrutura Laravel-style (`current_page`, `per_page`, `total`, `from`, `to`, `last_page`, URLs de próxima/anterior, etc.). `pageSize` aceito: `[10, 20, 42, 100, 200]`; **`-1`** traz todos os itens.",
      "**Ordem das aulas:** usar **`pivot.order`** (equivalente ao `order` em `disciplina_unidades`).",
      "**Visibilidade:** campo **`disciplina_situacao_id`**; no exemplo de `GET /disciplinas/get/{id}` veio `disciplinaSituacao` com **id 3**, nome **“Disponível”**, sigla **DIS**.",
      "**Listagem:** `GET /scout/disciplinas/list` com **payload JSON** (id, hash, disciplina, isbn, filtros, `page`, `pageSize`, etc.) e **response** com `filters`, `current_page`, `data[]` (campos como `total_unidades`, `documentos`, `docs.bancoQuestoes`, etc.).",
      "**Detalhe:** `GET /disciplinas/get/{ID}` com corpo rico: `unidades[]` com **`url_caderno_digital`** (ex.: caminho relativo `_vendors/educaspace/.../index.html`), **`pivot`** (`disciplina_id`, `unidade_id`, `order`), `fornecedor`, autores aninhados.",
    ],
    whatWeNeed: [
      "**Base URL** oficial para prefixar `url_caderno_digital` quando vier **relativo** (virar `src` absoluto do iframe).",
      "**Whitelist** (e, se preciso, orientação de **CSP** / `frame-src` no LXP) com os **origins** exatos do app Alunos em homologação e produção.",
      "Confirmação escrita: **todo** e-book do piloto segue só caderno digital + whitelist, ou existe **exceção** que ainda exige **`/rents/list`** / **`alice_url`**.",
      "Confirmar **método HTTP** real da listagem (`GET` com corpo JSON vs `POST`).",
      "Confirmar em **qual host** (Eadstock vs Gael) rodam `/scout/disciplinas/list` e `/disciplinas/get/{id}` para o tenant B42.",
      "Se houver exceção Alice: **`/rents/list`** com payload + response de exemplo e ligação à unidade.",
      "**SHA256:** string exata a hashear + encoding do header + exemplo **`curl`** que retorna 200.",
      "**Matriz** de todos os `disciplina_situacao_id` exibíveis no catálogo (além do exemplo DIS=3).",
    ],
    scriptForClient:
      "A gente já entendeu que o e-book no aluno pode sair do detalhe da disciplina, usando `url_caderno_digital`, montando URL absoluta quando vier relativo e liberando o nosso domínio na whitelist do lado de vocês. Isso resolve o desenho principal. O que ainda trava a implementação do nosso lado é fechar alguns detalhes objetivos: qual é a base oficial que a gente cola na frente do caminho quando o campo vem sem `https`; quais origins exatos do app Alunos em homologação e produção entram na whitelist; se no piloto **todo** conteúdo segue só esse fluxo ou se ainda existe caso que dependa de `rents/list` ou Alice, porque aí a gente codifica dois caminhos. Também precisamos saber se a listagem de disciplinas é de fato GET com corpo JSON ou se no servidor de vocês é POST — isso muda o cliente HTTP. Para autenticação, sem um exemplo de `curl` com o SHA256 do `X-API-Secret` a gente fica chutando e toma 401. E por fim a tabela de `disciplina_situacao_id`: hoje só temos o exemplo do 3 “Disponível”; precisamos saber o que pode aparecer para o aluno no catálogo para não publicar coisa errada.",
  },
  {
    id: "alice-api-2026-05",
    category: "Respostas recebidas (API B42 / e-mail)",
    title: "API Alice — credenciais, /api/rents e launch POST (maio/2026)",
    explanation: [
      "**Doc:** https://alice.eadstock.com.br/docs/api-telemetria — produção `https://alice.eadstock.com.br`.",
      "**Credenciais:** dois pares (prefixos `backoffice-...` e `alunos-...`); HOST no WhatsApp = URLs do LXP na Vercel (cadastro), não base da API.",
      "**REST:** `Authorization: Basic base64(api_key:secret_key)` ou headers `X-Api-Key` + `X-Secret-Key`.",
      "**Listagem:** `GET /api/rents` — disciplinas agrupadas com `rents[]` (`url` / `url_completa`, `unit.id`, `?c=`). Ex.: disciplina id **38**.",
      "**Aula (iframe):** **POST** para `https://alice.eadstock.com.br/?c=<hash>`; campo `key` = HMAC-SHA256(api_key, secret_key); obrigatórios `lis_person_name_full`, `user_id`. Ver `INTEGRACAO_ALICE_EADSTOCK.md` e `TESTE_ALICE_LAUNCH.html`.",
      "**Telemetria:** `GET /api/telemetria/aluno` — progresso/acessos (fase 2 no LXP).",
    ],
    whatWeNeed: [
      "Confirmar `rent.unit.id` ↔ `unidades[].id` do Eadstock.",
      "Confirmar `user_id` no POST (auth.users vs lxp_profiles.id).",
      "Chaves stagealice quando existirem.",
    ],
    scriptForClient:
      "Recebemos as chaves e a documentação Alice — obrigado. Vamos implementar rents + POST no iframe. Só precisamos confirmar se o id da unidade no rents é o mesmo do detalhe da disciplina no Eadstock e qual user_id vocês esperam no launch.",
  },
  {
    id: "ebook-iframe-alice",
    category: "Integração biblioteca / EAD Stock / Alice",
    title: "E-book na aula: Alice (POST launch) vs caderno digital Eadstock",
    explanation: [
      "**Piloto LXP (2026-05):** abrir aula via **Alice** — `GET /api/rents` + form **POST** `/?c=<hash>` + HMAC `key` + dados do aluno no iframe (`INTEGRACAO_ALICE_EADSTOCK.md`).",
      "**Não usar** `<iframe src=\"url_completa\">` sem POST — a B42 retorna HTML após POST estilo LTI.",
      "**Legado Eadstock:** `url_caderno_digital` em `disciplinas/get/{id}` + CDN/whitelist — catálogo ou fallback.",
    ],
    decisionOptions: [
      "Opção A — **Só Alice** no player da aula (decisão atual do piloto).",
      "Opção B — Misto por fornecedor (exige regra B42).",
      "Opção C — Só caderno digital (descontinuado para embed Alice).",
    ],
    whatWeNeed: [
      "Implementação: `aliceAdapter`, `AliceLessonFrame` em Lesson.tsx.",
      "Testes locais: `TESTE_ALICE_LAUNCH.html` + `.env.local` com chaves alunos.",
    ],
    scriptForClient:
      "Seguimos o fluxo POST Alice que vocês enviaram no exemplo PHP. Estamos testando com a disciplina de exemplo e implementando no app alunos.",
  },
  {
    id: "api-secret-format",
    category: "Integração biblioteca / EAD Stock / Alice",
    title: "Formato de autenticação: X-API-Key, X-API-Secret e SHA256",
    explanation: [
      "Confirmado por e-mail: API Key usa `X-API-Key` e `X-API-Secret` com **hash SHA256** no secret. Ainda **não** está definido *o que* exatamente entra no hash (segredo bruto? concatenado com key? encoding hex?). Keycloak permanece como alternativa.",
    ],
    decisionOptions: [
      "Opção A — Documentar algoritmo + exemplo de valor final do header `X-API-Secret` (hex de 64 chars, etc.).",
      "Opção B — Homologação aceita secret **em claro** só em stage; produção exige hash — precisamos dos dois exemplos.",
      "Opção C — Padronizar **Bearer** / Keycloak para o LXP e reservar API Key para integrações batch.",
    ],
    whatWeNeed: [
      "Um **`curl` de homologação** que retorne 200 em `scout/disciplinas/list` ou `disciplinas/get`, com headers exatamente como o gateway espera.",
    ],
    scriptForClient:
      "Vocês comentaram que o `X-API-Secret` vai com hash SHA256, mas ainda não está claro **o que** entra nesse hash — se é o segredo puro, se junta com a key, se o resultado vai em hex, e assim por diante. Sem isso a integração vira tentativa e erro e a gente perde muito tempo em 401. O ideal é vocês mandarem um exemplo oficial: o comando `curl` completo que vocês usam internamente em homologação contra `scout/disciplinas/list` ou `disciplinas/get`, com os headers exatamente como o gateway aceita, e uma linha dizendo qual string foi hasheada. Com esse pacote a gente replica do nosso lado e não fica interpretando o e-mail.",
  },
  {
    id: "disciplina-situacao",
    category: "Integração biblioteca / EAD Stock / Alice",
    title: "Publicação no catálogo: disciplina_situacao_id",
    explanation: [
      "O campo continua sendo o eixo de **visibilidade**. O payload de exemplo já mostra `disciplina_situacao_id: 3` e, no detalhe, o objeto `disciplinaSituacao` **(DIS) Disponível**. Ainda precisamos da **lista completa** de situações usadas em produção e quais entram no portal do aluno.",
    ],
    decisionOptions: [
      "Opção A — Planilha com todos os IDs e significados; o LXP filtra apenas os IDs aprovados (ex.: só DIS e equivalentes).",
      "Opção B — Regra única: só exibir se `disciplina_situacao_id === 3` (e documentar exceções).",
      "Opção C — A API da listagem já retorna só publicáveis; o LXP não filtra por situação.",
    ],
    whatWeNeed: [
      "Tabela oficial **disciplina_situacao_id** → nome/sigla → “exibir no LXP: sim/não”.",
      "Comportamento para disciplinas já vinculadas no nosso curso se a situação mudar para “indisponível”.",
    ],
    scriptForClient:
      "O catálogo que o aluno vê no LXP não pode listar disciplina que vocês consideram rascunho ou indisponível. No payload de exemplo aparece `disciplina_situacao_id` 3 com significado ‘Disponível’. A gente precisa da regra de negócio por trás disso: quais outros IDs existem no dia a dia de vocês, o que cada um significa, e quais deles o aluno pode ver quando for buscar curso na biblioteca. Se a regra for ‘só o 3’, ok — mas tem que ser uma decisão explícita, porque senão a gente ou esconde coisa que devia aparecer ou mostra o que não devia. Uma tabela simples já resolve: id, nome, se entra no LXP sim ou não.",
  },
  {
    id: "api-base-urls",
    category: "Integração biblioteca / EAD Stock / Alice",
    title: "Ambientes: Eadstock vs Gael — o que já temos e o que falta",
    explanation: [
      "As **quatro bases** (stage/prod de Eadstock e Gael) foram informadas por e-mail. Falta só a **matriz operacional**: qual base usar para **cada rota** que o LXP chama (`/scout/disciplinas/list`, `/disciplinas/get/{id}`, `/rents/list`, etc.) em homologação e em produção.",
    ],
    decisionOptions: [
      "Opção A — Tabela “rota → host (Eadstock/Gael) → ambiente”.",
      "Opção B — Sempre Eadstock para tudo exceto endpoints explicitamente em Gael (listar quais).",
      "Opção C — Um único **API Gateway** URL que esconde a divisão — o LXP aponta só para ele.",
    ],
    whatWeNeed: [
      "Documento único: para **cada endpoint** do fluxo do aluno, URL base (Eadstock ou Gael) em **stage** e em **prod**.",
    ],
    scriptForClient:
      "A gente tem as quatro bases — stage e produção da Eadstock e da Gael — mas isso ainda não diz **qual** base a gente chama para **cada** rota que o app usa: listagem de disciplinas, detalhe com unidades, e eventualmente `rents/list`. Se a gente apontar pro host errado, funciona no Postman de um lado e quebra no piloto. O que a gente precisa de vocês é uma confirmação objetiva, tipo uma tabela: rota, ambiente homologação, ambiente produção, e se o host é Eadstock ou Gael. Assim a gente configura uma vez e não fica adivinhando quando for dar suporte.",
  },
  {
    id: "certificates-business",
    category: "Certificados e documentos legais",
    title: "Certificado: granularidade, template e validação pública",
    explanation: [
      "O modelo de dados já suporta templates, assinaturas e emissões por disciplina; falta a **regra de negócio** acordada com a instituição e o jurídico (o que o certificado comprova, quem assina, como o terceiro valida).",
    ],
    decisionOptions: [
      "Opção A — Um certificado por **disciplina** concluída (alinhado ao fluxo atual de `lxp_certificate_issues`).",
      "Opção B — Certificado por **curso/trilha** inteira (exige regra nova de agregação).",
      "Opção C — Híbrido: certificado de módulo + opcional de curso (duas tipologias de template).",
    ],
    whatWeNeed: [
      "Definição de template único ou múltiplos (`is_default` / por tipo de curso).",
      "Política de assinaturas: quantas, cargos, se imagem é obrigatória antes do go-live.",
      "URL pública de validação do código, texto legal mínimo e responsável pela emissão.",
      "Prazo desejado para PDF final e identidade visual aplicada ao template.",
    ],
    scriptForClient:
      "Do lado técnico a gente já consegue emitir PDF com template e assinaturas, mas o que define o produto é a regra de vocês e do jurídico: o certificado comprova conclusão de **uma disciplina**, de **um curso inteiro**, ou os dois tipos coexistem? Isso mexe no texto legal e no layout. Junto disso a gente precisa saber se existe um único modelo visual institucional ou se muda por tipo de curso; como uma pessoa de fora valida o código — URL pública, texto mínimo; e quantas assinaturas entram no PDF e com que cargo, porque isso costuma ser requisito de go-live, não detalhe cosmético.",
  },
  {
    id: "gamification-metrics",
    category: "Métricas, gamificação e produto aluno",
    title: "Métricas no app: o que conta como estudo, horas e streak",
    explanation: [
      "O MVP de gamificação já grava XP por aula/disciplina e badges. Dashboard ainda pode combinar estimativas (ex.: horas) com dados reais — a **definição pedagógica** evita retrabalho e discussão de números com o cliente.",
    ],
    decisionOptions: [
      "Opção A — Horas = soma de durações declaradas das aulas concluídas (metadado da API externa ou cadastro interno).",
      "Opção B — Horas = tempo de sessão medido no front (complexidade e privacidade maiores).",
      "Opção C — Manter **estimativa simples** (ex.: 0,5 h por aula) até haver instrumentação oficial.",
    ],
    whatWeNeed: [
      "Regra oficial para “horas estudadas” e para **streak** (fuso horário, corte do dia, tolerância).",
      "Se “trilha concluída” exige 100% das aulas, nota mínima ou outro critério.",
    ],
    scriptForClient:
      "O app já mostra progresso, XP e badges, mas ‘hora estudada’ e sequência de dias são conceitos que mudam de instituição para instituição. A gente precisa alinhar com vocês o que **conta** como hora — duração declarada da aula, tempo real na tela, uma estimativa simples — e como vocês querem fechar o dia para streak, fuso e se falta um dia zera ou não. Na mesma linha: quando vocês dizem que a trilha está 100% concluída, é só todas as aulas vistas, tem nota mínima, tem prova? Isso impacta relatório e até o que pode disparar certificado. Quanto antes a gente cravar isso, menos retrabalho depois com número discutindo com aluno e comercial.",
  },
  // {
  //   id: "enrollment-external",
  //   category: "Catálogo, matrícula e operações",
  //   title: "Matrícula: só LXP ou também API externa",
  //   explanation: [
  //     "Hoje o desenho assumido é matrícula **local** no Supabase ao clicar em inscrever-se; o cliente pode exigir sincronização com sistema acadêmico externo.",
  //   ],
  //   decisionOptions: [
  //     "Opção A — **Somente local** (como hoje): inscrição grava em `lxp_enrollments` sem callback externo.",
  //     "Opção B — Após gravar localmente, chamar **webhook/API** do cliente com payload definido (idempotência e tratamento de erro).",
  //     "Opção C — Matrícula **somente** via API externa (LXP só espelha status por job ou polling) — maior escopo.",
  //   ],
  //   whatWeNeed: [
  //     "Decisão formal + se B ou C: URL, método, payload, autenticação e SLA de resposta.",
  //   ],
  //   scriptForClient:
  //     "Hoje, quando o aluno clica em se matricular, a gravação fica no nosso Supabase. A pergunta para vocês é se isso fecha o processo de vocês ou se o sistema acadêmico ou financeiro de vocês **precisa** ser avisado na hora — por exemplo para abrir turma, fatura ou registro oficial. Se precisar, a gente precisa do contrato: URL, método, corpo mínimo, como vocês identificam o aluno na API de vocês, e o que acontece se a chamada falhar depois que o aluno já viu confirmação na tela. Se não precisar, a gente documenta que a matrícula é só LXP neste momento e segue.",
  // },
  {
    id: "library-catalog-contract",
    category: "Catálogo, matrícula e operações",
    title: "Catálogo externo: listagem e detalhe (contrato parcialmente recebido)",
    explanation: [
      "Recebemos exemplo real de **`GET /scout/disciplinas/list`** (payload com filtros e paginação) e de **`GET /disciplinas/get/{id}`** com `unidades[]`, `url_caderno_digital`, `pivot`, `fornecedor`, documentos e `disciplinaSituacao`.",
      "Pendências de **contrato formal**: método HTTP da listagem (nome diz GET mas envia corpo JSON — comum ser `POST` no servidor deles), OpenAPI/versionamento e limites de rate.",
    ],
    decisionOptions: [
      "Opção A — Publicar **OpenAPI 3** (ou Postman Collection) versionada para Eadstock + Gael.",
      "Opção B — Manter exemplos JSON em doc interna; reuniões só para mudanças breaking.",
      "Opção C — Gateway único com path estável (`/v1/...`) abstraindo Eadstock/Gael.",
    ],
    whatWeNeed: [
      "Confirmação explícita do **verbo HTTP** e path final da listagem.",
      "SLA / rate limit e política de erro (`429`, retry).",
    ],
    scriptForClient:
      "Os exemplos de JSON de listagem e de detalhe já ajudam bastante a entender o formato. O que ainda gera dúvida técnica é o verbo HTTP da listagem: o path fala `GET` mas o payload parece de corpo JSON, e em muitos gateways isso na prática é `POST` ou outro contrato. A gente precisa que vocês confirmem o que o servidor de vocês **realmente** aceita, porque biblioteca de HTTP e cache se comportam diferente. Se vocês conseguirem anexar uma especificação mínima — nem que seja OpenAPI enxuta ou collection do Postman — a gente versiona do nosso lado e qualquer mudança futura fica rastreável em vez de depender só de print.",
  },
  {
    id: "auth-homolog-urls",
    category: "Acesso, Auth, homologação e governança",
    title: "URLs de homologação e redirects do Supabase Auth",
    explanation: [
      "Convites, reset e magic links precisam abrir no **domínio oficial de homologação**, não em localhost. Isso exige alinhamento com o painel Supabase (Site URL e Additional Redirect URLs).",
    ],
    decisionOptions: [
      "Opção A — Cliente fornece subdomínio estável de hmg (ex.: `hmg.instituicao…`) e cadastra junto ao time B42 no projeto Supabase.",
      "Opção B — Manter apenas URLs Vercel do piloto até go-live; convites usam esses hosts explicitamente.",
      "Opção C — Domínio próprio com TLS gerido pelo cliente e CNAME para Vercel — exige checklist DNS conjunto.",
    ],
    whatWeNeed: [
      "URL oficial de homologação do **Backoffice** e do **Alunos** para Auth.",
      "Lista de paths permitidos em redirect (definir senha, pós-login).",
    ],
    scriptForClient:
      "Convite de equipe, reset de senha e link mágico passam pelo Supabase Auth, e o sistema só redireciona para URLs que estão cadastradas. Se a gente deixar só localhost ou um endereço provisório, o usuário clica no e-mail e cai em erro ou em ambiente errado. A gente precisa que vocês digam qual é a URL **oficial** de homologação do Backoffice e do app Alunos — aquela que vai no e-mail e que o usuário reconhece — para a gente incluir no painel do Supabase junto com vocês. Sem isso o fluxo de acesso vira suporte manual antes mesmo do piloto andar direito.",
  },
  {
    id: "student-profile-email-sync",
    category: "Acesso, Auth, homologação e governança",
    title: "E-mail do aluno: perfil LXP vs Supabase Auth",
    explanation: [
      "O backoffice pode atualizar nome e dados em `lxp_profiles`; o e-mail em `auth.users` não é sincronizado automaticamente hoje — risco de divergência e suporte.",
    ],
    decisionOptions: [
      "Opção A — **Bloquear** edição de e-mail no painel até existir fluxo de sync com Auth.",
      "Opção B — Implementar **Edge Function** que atualiza Auth quando o admin alterar e-mail (política de verificação a definir).",
      "Opção C — Manter dois e-mails conscientemente (login vs contato) com rótulos claros na UI.",
    ],
    whatWeNeed: [
      "Decisão registrada + se B: processo de confirmação de novo e-mail e quem pode disparar.",
    ],
    scriptForClient:
      "Hoje o painel permite ajustar dados do aluno no perfil, mas o e-mail de login fica no Auth do Supabase e **não** muda sozinho quando alguém edita o campo no backoffice. Isso gera confusão: o aluno acha que o login é o e-mail novo e na verdade o sistema ainda espera o antigo. A gente precisa que vocês decidam a regra de negócio: ou o e-mail do painel é só ‘contato’ e o login continua separado até existir fluxo próprio; ou toda alteração de e-mail no painel tem que refletir no login e aí a gente implementa o fluxo certo — com confirmação, quem pode alterar, etc. Sem essa decisão a gente ou bloqueia edição para não prometer o que não cumpre, ou implementa algo que vocês não querem como política.",
  },
]

export function topicsByCategory(): Map<string, ClientIntakeTopic[]> {
  const map = new Map<string, ClientIntakeTopic[]>()
  for (const cat of CLIENT_INTAKE_TOPIC_CATEGORIES) {
    map.set(cat, [])
  }
  for (const t of CLIENT_INTAKE_TOPICS) {
    const list = map.get(t.category) ?? []
    list.push(t)
    map.set(t.category, list)
  }
  return map
}
