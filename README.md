# Dashboard Financeiro - FinP

Este projeto é um dashboard financeiro moderno construído com React e Vite. Ele utiliza uma linguagem visual baseada no "Neo-Brutalismo Editorial", focando em alto contraste, legibilidade e uso do Google Material Symbols.

## Funcionalidades

- Exibição de estatísticas e saldo
- Histórico de transações
- Design flexível e responsivo
- Integração com ícones do Material Design

## Como rodar localmente (Desenvolvimento)

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Deploy com Docker Compose (CasaOS)

O projeto inclui arquivos de configuração Docker prontos para publicar no seu servidor CasaOS ou qualquer outro servidor compatível com `docker-compose`.

Para publicar:
1. Copie a pasta do projeto para o servidor (ex: `/DATA/AppData/finp-dashboard`).
2. Entre na pasta e execute:
   ```bash
   docker-compose up -d --build
   ```
3. O app estará disponível na porta `5001`.

Caso queira alterar a porta de saída, modifique a seção `ports`, no arquivo `docker-compose.yml`.
