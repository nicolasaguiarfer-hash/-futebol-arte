# Futebol Arte — Simulador de Agente de Futebol

Versão evoluída do protótipo original, agora com sistemas de gameplay
completos e interligados: jogadores, mercado de transferências,
negociações, scouting, clubes, ligas, simulação de temporada,
finanças, funcionários, reputação, eventos aleatórios, notícias (FA
News), prêmios e salvamento automático (localStorage).

A estética (cores, tipografia, layout do escritório/hero) do projeto
original foi mantida. Nenhum asset, texto ou identidade visual do
jogo "Agente de Futebol" (App Store) foi copiado — ele serviu apenas
como referência de funcionalidades.

## Estrutura

- `www/index.html` — shell da aplicação (mantém a estética original).
- `www/css/style.css` — todos os estilos.
- `www/js/data.js` — nomes, nacionalidades, clubes/ligas iniciais.
- `www/js/engine.js` — geração de jogadores/clubes, estado do jogo, save/load.
- `www/js/market.js` — mercado, negociações, contratos, scouting.
- `www/js/season.js` — simulação de partidas, passagem de tempo, eventos, fim de temporada.
- `www/js/ui.js` — renderização das telas.
- `www/js/main.js` — inicialização e navegação.
- `FutebolArteApp.swift` / `Info.plist` — wrapper nativo SwiftUI (WKWebView) para iOS.

## Rodar localmente

Abra `www/index.html` diretamente no navegador, ou sirva a pasta `www/`
com qualquer servidor estático (`npx serve www`, `python3 -m http.server`
dentro de `www/`, etc). Não há build step nem dependências externas.

## Publicar no GitHub Pages

1. Crie (ou use) um repositório no GitHub.
2. Copie **o conteúdo da pasta `www/`** (não a pasta em si) para a raiz
   do repositório — ou seja, `index.html`, `css/` e `js/` devem ficar
   na raiz do repo (ou em uma pasta `/docs`, se preferir essa opção).
3. Faça commit e push.
4. No repositório: Settings → Pages → Build and deployment → Source:
   "Deploy from a branch" → escolha a branch (ex.: `main`) e a pasta
   (`/root` ou `/docs`, conforme o passo 2).
5. Aguarde alguns minutos; o GitHub fornecerá a URL pública
   (`https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`).

Como o jogo não depende de nenhum backend/servidor, funciona 100% no
GitHub Pages, incluindo salvamento local do progresso (localStorage).

## App iOS

`FutebolArteApp.swift` carrega `www/index.html` dentro de um
`WKWebView`. Para gerar um app instalável é necessário abrir esta
estrutura em um projeto Xcode, assinar com uma conta Apple Developer e
seguir o processo de build/distribuição da Apple — este pacote é a
base do app, não um `.ipa` assinado.
