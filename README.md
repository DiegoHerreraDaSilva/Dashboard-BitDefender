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

## Deploy no servidor da rede interna

O painel roda como processo Node persistente num servidor da rede interna
(não mais na Vercel — a hospedagem pública foi abandonada). Isso é, na
verdade, o cenário ideal para a arquitetura atual: o `SnapshotCache` em
memória (`src/lib/cache.ts`) foi desenhado desde o início para **um processo
Node persistente**, premissa que uma função serverless não garante entre
requisições, mas que um servidor sempre ligado cumpre sem esforço nenhum.

```bash
npm install
npm run build
start.bat
```

Com `output: "standalone"` no `next.config.ts`, o build gera uma pasta
`.next/standalone` com o essencial para rodar (não precisa de `node_modules`
completo no servidor) — mas ela sai sem `public/`, `.next/static` e
`.env.local`, que o Next.js não copia automaticamente para lá. `start.bat`
copia esses três antes de subir `node server.js`, então é ele quem deve ser
usado para iniciar o painel, não `npm run start` diretamente. Já sobe
escutando em todas as interfaces de rede (não só `localhost`), então a TV
acessa direto pelo IP do servidor na rede interna (ex.:
`http://192.168.x.x:3000`).

**Para manter rodando permanentemente** (sobrevive a reinício do servidor,
reinicia sozinho se cair): registre `start.bat` como serviço do Windows via
[NSSM](https://nssm.cc/) ou como uma tarefa do Task Scheduler configurada
para rodar na inicialização.

**Para atualizar depois de uma mudança:** `git pull`, `npm install` (se o
`package.json` mudou), `npm run build`, e reinicie o serviço/processo
(`start.bat` de novo).

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
