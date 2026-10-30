# SST Fruticultura

Sistema interno de Segurança e Saúde no Trabalho (cadastros, funcionários sazonais, ficha de EPI em PDF e painel de exames periódicos).
Stack: React + Vite + Tailwind CSS + Firebase (Authentication + Firestore). PDF gerado no navegador (jsPDF).

## 1. Configurar o Firebase
1. Crie um projeto em https://console.firebase.google.com.
2. **Authentication** → ative o provedor *E-mail/senha* e crie o primeiro usuário.
3. **Firestore Database** → crie o banco (modo produção, região `southamerica-east1`).
4. **Configurações do projeto** → adicione um *app Web* e copie as chaves para o `.env` (modelo em `.env.example`).
5. Publique regras e índices: `npm i -g firebase-tools && firebase login && firebase deploy --only firestore`.

## 2. Primeiro administrador
No Firestore, crie manualmente o documento `usuarios/{UID do usuário}` (UID está em Authentication):
```
nome: "Seu nome"   email: "voce@empresa.com"   role: "admin"   ativo: true
```
Perfis: `admin` (tudo), `sst` (cadastros e registros), `rh` e `consulta` (somente leitura).
Os demais usuários são criados no Authentication e liberados com um documento em `usuarios`.

## 3. Rodar localmente
```
npm install
cp .env.example .env     # preencha
npm run dev
```
Dados iniciais (opcional): salve a chave de serviço como `serviceAccount.json` e rode `npm run seed`.

## 4. Deploy
**GitHub Pages**: em *Settings → Pages*, escolha *GitHub Actions*. Em *Settings → Secrets and variables → Actions*,
crie os 6 secrets `VITE_FIREBASE_*`. Cada push na `main` publica. No Firebase (Authentication → Configurações →
Domínios autorizados) adicione `seuusuario.github.io`.

**Firebase Hosting** (alternativa): `npm run build && firebase deploy --only hosting`.

## 5. Como funciona o painel de exames
Nada é cadastrado por funcionário. O vencimento de cada exame = (data do último ASO, ou admissão) + periodicidade
definida no Cargo/GHE. Registrar um ASO reinicia os prazos. Verde = em dia; amarelo = vence em até 30/60 dias; vermelho = vencido.

## 6. Ficha de EPI
Coloque a logo em `public/logo-empresa.png` (opcional). O texto do termo legal está em `src/pdf/termoResponsabilidade.js`
e **deve ser revisado pelo jurídico/SESMT**. Ajuste o layout em `src/pdf/gerarFichaEpi.js` para ficar idêntico ao seu modelo.

## LGPD
CPF e ASO são dados pessoais/sensíveis: acesso restrito por perfil, sem exclusão física, nunca versionar `.env`,
`serviceAccount.json` ou dados reais no repositório.
