# Zotero ACP Plugin

Este plugin implementa o **Agent Client Protocol (ACP)** para o Zotero 9, permitindo que agentes de IA se conectem ao Zotero como um editor através de uma interface padronizada.

## Decisões Técnicas

- **Plataforma:** Zotero 9 (baseado em Firefox ESR 115+).
- **Arquitetura:** *Bootstrapped Plugin* (sem reinicialização), utilizando `manifest.json` e `bootstrap.js`.
- **Linguagem:** TypeScript, compilado via `esbuild` para gerar assets compatíveis com o motor do Mozilla.
- **Transporte ACP:** Utilização de `stdio` (stdin/stdout) para comunicação com agentes locais. A gestão de subprocessos será feita via APIs nativas do Mozilla (ex: `Subprocess.jsm` ou `nsIProcess`).
- **Interface:** Injeção dinâmica de UI na Sidebar/Item Pane, sem o uso de XUL Overlays (depreciados).

## Estrutura do Projeto

- `src/bootstrap.ts`: Ponto de entrada e gerenciamento do ciclo de vida do plugin.
- `src/ui/`: Futuro diretório para componentes da interface (Web Components/React).
- `manifest.json`: Manifesto de metadados do plugin.
- `esbuild.mjs`: Configuração do bundler para gerar o pacote final.

## Como Desenvolver

1. Instale as dependências: `npm install`.
2. Execute o build: `npm run build`.
3. O arquivo `build/bootstrap.js` será gerado.
4. Para carregar no Zotero, aponte para o diretório raiz do projeto no modo de desenvolvedor do Zotero ou empacote como um `.xpi` (zip).# zotero-acp
# zotero-acp
