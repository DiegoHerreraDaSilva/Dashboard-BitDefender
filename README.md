# Painel GravityZone — TV do Mezanino

Painel de status de segurança (frota, incidentes, licenciamento) alimentado pela
API da GravityZone (Bitdefender), feito para ficar exibido permanentemente numa
TV. Ver o plano completo em `objetivo-criar-um-dashboard-moonlit-plum.md` (pasta
de planos do Claude Code) para o contexto e as decisões de arquitetura.

Princípio central: a página é 100% Server Component, sem JavaScript obrigatório
no cliente. Quem mantém o painel atualizado é a própria TV, recarregando a
página inteira a cada `DASHBOARD_REFRESH_SECONDS` via `<meta http-equiv="refresh">`
— isso garante que o painel se recupera sozinho mesmo se o navegador da TV travar
ou vazar memória depois de dias ligado.

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local
# edite .env.local e preencha GRAVITYZONE_API_KEY (a chave "tv-mezanino")
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Validando os campos reais da API

Os nomes de método (`getNetworkInventoryItems`, `getIncidentsList`,
`getLicenseInfo`) são confirmados, mas o formato exato dos campos de resposta
não foi documentado publicamente — a lógica em `src/lib/gravityzone/classify.ts`
é uma primeira tentativa, a ajustar. Para inspecionar o payload real:

1. Em `.env.local`, defina `ENABLE_DEBUG_ROUTE=true` (nunca em produção).
2. Com `npm run dev` rodando, acesse por exemplo:
   - `http://localhost:3000/api/debug/network?method=getNetworkInventoryItems&params={"page":1,"perPage":5}`
   - `http://localhost:3000/api/debug/incidents?method=getIncidentsList&version=v1.1&params={"page":1,"perPage":5}`
   - `http://localhost:3000/api/debug/licensing?method=getLicenseInfo`
3. Ajuste `classify.ts` (e os filtros em `network.ts`) para bater com os campos
   reais retornados.

## Build de produção

```bash
npm run build
npm run start
```

Com `output: "standalone"` no `next.config.ts`, o build gera uma pasta
`.next/standalone` com tudo que é preciso para rodar (não precisa de
`node_modules` completo no servidor).

## Deploy na Vercel

O painel está hospedado na Vercel (`vercel` CLI, deploy direto do diretório
local — não depende de repositório Git). Isso muda uma premissa da
arquitetura: o `SnapshotCache` em memória (`src/lib/cache.ts`) foi desenhado
para **um processo Node persistente**; funções serverless da Vercel não
garantem isso entre requisições. Na prática, com 1 TV atualizando a cada
`DASHBOARD_REFRESH_SECONDS` (60s), a função tende a ficar "quente" e o cache
funciona — mas um cold start (baixo tráfego, redeploy, escala) perde o cache e
refaz a varredura completa da frota (119 dispositivos, até 69 chamadas de
detalhe), o que pode levar alguns segundos. Não é um problema bloqueante para
este uso, só um comportamento a monitorar caso a TV pareça "travar" no
carregamento ocasionalmente.

**Deploy inicial:**

1. `npx vercel login` — precisa de um passo interativo (navegador/e-mail), só
   funciona num terminal de verdade.
2. `npx vercel link` — associa esta pasta a um projeto Vercel (cria um novo se
   ainda não existir).
3. Configure as variáveis de ambiente do projeto (nunca commitar essas
   chaves): `npx vercel env add GRAVITYZONE_ACCESS_URL production` e
   `npx vercel env add GRAVITYZONE_API_KEY production` (cole os valores do seu
   `.env.local`). As demais variáveis de `.env.local.example` são opcionais —
   têm default no código.
4. `npx vercel --prod` — builda e publica. A URL pública fica sem proteção por
   escolha deliberada (o painel mostra dados internos reais — nome de máquina,
   infecção, incidentes — então trate a URL como algo a não divulgar/indexar).

**Para atualizar depois de uma mudança:** `npx vercel --prod` de novo.

**Se preferir voltar a rodar como processo persistente** (servidor Windows
interno, por exemplo, para garantir o cache sem depender de a função ficar
"quente"): `npm run build` gera `.next/standalone` com um `server.js`
executável via NSSM ou Task Scheduler, sem depender da Vercel.

## Configurando a TV

A TV usada tem apenas o navegador embutido de fábrica (sem loja de apps de
kiosk), então:

- Abra o navegador da TV na URL do painel e deixe a aba aberta.
- Desabilite screensaver / suspensão por HDMI-sem-atividade nas configurações
  do sistema da TV — isso fica fora do controle do app.
- Se a TV suportar, defina a URL como página inicial/favorito, para facilitar
  reabrir depois de uma queda de energia.
- Rode um teste de estabilidade de alguns dias antes de considerar "pronto",
  conferindo se o painel continua atualizando sozinho via meta-refresh.

## Variáveis de ambiente

Ver `.env.local.example` para a lista completa com descrição de cada uma.
