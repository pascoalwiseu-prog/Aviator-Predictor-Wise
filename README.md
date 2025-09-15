
# Aviator Predictor — Minimal MVP (Local)

Este é um pacote mínimo com um backend Express e um frontend estático para o MVP descrito.

**Aviso importante:** Este projecto fornece ferramentas de análise estatística. Não garante previsões certeiras e não promete 98% de precisão. Use com responsabilidade.

## Como executar localmente

Requisitos:
- Node.js (v14+)

Passos:
1. Extrai o ficheiro `aviator_predictor.zip` para uma pasta.
2. No terminal, entra na pasta `aviator_predictor`.
3. Rode `npm install`.
4. Rode `npm start`.
5. Abre o navegador em `http://localhost:3000`.

Funcionalidades:
- Upload CSV com colunas `timestamp_utc,round_id,multiplier`.
- Dashboard com gráfico dos multipliers.
- Endpoint `/api/simulate` que roda uma simulação bootstrap simples.
- Página inclui um iframe para PremierBet (apenas visual).

## Deploy
Para disponibilizar online, podes:
- Deploy no Heroku/Render/Railway (subir o repositório).
- Ou usar Vercel para o frontend e Railway/AWS para o backend. Dá-me se quiseres os comandos exatos para deploy.

## Formato CSV exemplo (sample_rounds.csv incluído)
timestamp_utc,round_id,multiplier
2025-09-15T12:34:56Z,123456789,1.45
2025-09-15T12:35:12Z,123456790,3.21

