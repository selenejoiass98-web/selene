# 💍 ELENICE COLLECTION — INSTRUÇÕES COMPLETAS

Cole este documento no início de qualquer conversa nova para eu entender o projeto completo.

---

## 📋 SOBRE O PROJETO

**Cliente:** Elenice Collection (era Selene Joias — rebranding concluído, domínio antigo não é mais usado)
**Segmento:** Joias em Ouro 18k — mercado premium feminino
**Localização:** Balneário Camboriú, Santa Catarina, Brasil
**Objetivo:** Presença digital completa para vender joias online
**Status atual:** Site no ar, admin completo (produtos, pedidos, clientes, cupons, blog, configurações), pagamentos reais via Mercado Pago, e-mails via Brevo, Analytics + Search Console integrados
**URL do site:** `elenicecollection.com.br`
**URL alternativa (preview Vercel):** `selene-coral.vercel.app`
**Repositório:** `github.com/selenejoiass98-web/selene`

---

## ✅ O QUE JÁ FOI FEITO

### Identidade de Marca
- [x] Logo SJ com borboleta em SVG
- [x] Manual de identidade visual completo (HTML)
- [x] Paleta de cores, tipografia, aplicações da marca
- [x] Templates Instagram (12 artes no Canva)
- [x] Papelaria digital (cartão de visitas, etiqueta, cartão de agradecimento)
- [ ] Logo real em `assets/img/logo.png` — **pasta `assets/img/` ainda não existe no repo**

### Site E-commerce
- [x] `index.html` — Página inicial (Hero configurável: Foto Cheia ou Editorial, Caixas de Destaque, Banner Fullscreen B, Depoimentos, todos com reposicionamento de foto + zoom)
- [x] `catalogo.html` — Catálogo com filtros por categoria, preço, ordenação
- [x] `produto.html` — Página individual: fotos reais com zoom em lupa no hover, tamanhos, materiais, enquadramento configurado no admin
- [x] `checkout.html` — Checkout completo (dados, endereço via CEP, frete, pagamento Pix/cartão/boleto), rola até o primeiro campo inválido e avisa o motivo no toast
- [x] `sobre.html` — Nossa história
- [x] `rastreio.html` — Rastreio de pedido real via API segura (`api/rastreio.js`), não expõe a coleção `pedidos` publicamente
- [x] `blog.html` / `blog-post.html` — Blog público (posts vêm da coleção `blog`)
- [x] `politica-de-entrega.html`, `politica-de-privacidade.html`, `politica-de-trocas-e-devolucoes.html`
- [x] `assets/css/style.css` — Estilos globais
- [x] `assets/js/cart.js` — Sistema de carrinho com localStorage
- [x] Google Analytics 4 instalado individualmente em cada página pública (sem arquivo `tracking.js` centralizado — cada HTML tem o snippet no `<head>`)

### Painel Admin (`admin/`)
- [x] `index.html` — Login seguro com Firebase Auth
- [x] `dashboard.html` — SPA com seções Produtos / Pedidos / Clientes (clientes são agregados a partir dos pedidos, não é uma coleção própria), painel de campanhas Brevo (+ botão "Criar campanha"), estatísticas do Search Console
- [x] `produto.html` — Cadastrar/editar produto, upload de até 4 fotos (Cloudinary), arrastar para reposicionar **e zoom +/-** em cada foto
- [x] `cupons.html` — Gerenciar cupons de desconto
- [x] `blog.html` / `blog-post.html` — Gerenciar posts do blog
- [x] `configuracoes.html` — Hero, faixa de avisos, Caixas de Destaque, Banner Fullscreen B, Depoimentos, WhatsApp, frete grátis, Pix — **todo campo de imagem tem arrastar + zoom (+/-na própria foto**
- [x] Sidebar recolhível (preferência salva em localStoragee responsiva (menu overlay em telas ≤1024px) em todas as páginas do admin

### Pagamentos e Pós-venda
- [x] **Mercado Pago real** — `api/payment.js` (cria pagamento Pix/cartão/boleto), `api/mp-webhook.js` (confirma pagamento via webhook com verificação HMAC de assinatura), `api/payment-status.js` (consulta status), `api/check-boletos.js` (cron diário às 12h que trata boletos vencidos)
- [x] **E-mails transacionais e marketing via Brevo** (não EmailJS— `api/email.js` (envio via SMTP da Brevo), `api/contact.js` (cadastra o cliente na lista "Clientes do Site" da Brevo a cada pedido, sem nunca bloquear a venda), `api/brevo-campaigns.js` (lista campanhas em rascunho e dispara `sendNow`)

### Infraestrutura
- [x] **Vercel** — hospedagem gratuita, deploy automático via GitHub
- [x] **Firebase Authentication** — login seguro do admin
- [x] **Firebase Firestore** — banco de dados: `produtos`, `pedidos`, `cupons`, `blog`, `configuracoes`
- [x] **Cloudinary** — armazenamento de fotos dos produtos (gratuito)
- [x] **GitHub** — repositório `selenejoiass98-web/selene`
- [x] **Regras Firestore** — produtos/blog públicos para leitura, pedidos e admin protegidos
- [x] **Google Analytics 4** — `G-NB5Q5NEEG6`, instalado só nas páginas públicas (nunca no admin)
- [x] **Google Search Console** — verificado via `sc-domain:elenicecollection.com.br`, integrado ao dashboard admin via service account do Firebase (`firebase-adminsdk-fbsvc@selene-joias.iam.gserviceaccount.com`, escopo `webmasters.readonly`), env `GSC_SITE_URL`
- [ ] Meta Pixel — **não está instalado atualmente**, apesar de versões antigas deste documento mencionarem um pixel; se quiser reativar, precisa criar/reconectar no Meta Business Suite

### Configurações Firebase
- [x] Projeto: `selene-joias` (nome interno do projeto Firebase não foi renomeado no rebranding — o site é que virou Elenice Collection)
- [x] Auth: usuário `contato@elenicecollection.com.br` criado
- [x] Firestore: coleções `produtos`, `pedidos`, `cupons`, `blog`, `configuracoes`
- [x] Cloudinary: cloud `ddmxyguk0`, preset `selene-joias` (unsigned)

---

## 🔜 O QUE FALTA FAZER (ordem sugerida)

### Conteúdo (depende da Elenice)
- [ ] Fotos reais dos produtos com fundo neutro (creme ou branco), recomendado quadradas ~1200×1200px
- [ ] Confirmar texto final da página "Sobre nós"
- [ ] Confirmar WhatsApp real em Configurações → já é um campo editável no admin (`cfg-whatsapp`), não precisa mexer em código, só preencher e salvar

### Aguardando (precisa de CNPJ / verificação de conta)
- [ ] **API Correios** — cálculo de frete real (PAC, SEDEX, Mini Envios); hoje o frete é configurado manualmente no admin
- [ ] **Mercado Pago** — a integração de código está pronta e funcionando (Pix/cartão/boleto, webhook, cron de boletos); confirmar se a conta MP já está totalmente verificada para produção

### E-mail profissional
- [ ] `contato@elenicecollection.com.br` via Zoho Mail (gratuito) — confirmar se já está ativo

### Futuro / opcional
- [ ] Instagram Shopping — catálogo de produtos no Meta Commerce Manager
- [ ] Decidir se reativa o Meta Pixel

---

## 🏗️ INFRAESTRUTURA DEFINIDA

| Item | Escolha | Custo | Status |
|------|---------|-------|--------|
| Hospedagem | Vercel | Gratuito | ✅ Ativo |
| Repositório | GitHub (selenejoiass98-web/selene| Gratuito | ✅ Ativo |
| Banco de dados | Firebase Firestore | Gratuito | ✅ Ativo |
| Autenticação | Firebase Auth | Gratuito | ✅ Ativo |
| Fotos produtos | Cloudinary | Gratuito | ✅ Ativo |
| Domínio | elenicecollection.com.br | — | ✅ Ativo |
| SSL | Vercel (automático| Gratuito | ✅ Ativo |
| Analytics | Google Analytics 4 `G-NB5Q5NEEG6` | Gratuito | ✅ Ativo |
| Search Console | `sc-domain:elenicecollection.com.br` | Gratuito | ✅ Ativo |
| E-mail (transacional + marketing) | Brevo | Gratuito até 300 e-mails/dia | ✅ Ativo |
| Pagamentos | Mercado Pago | % por transação | ✅ Código pronto — confirmar conta |
| Frete | API Correios | Gratuito | ⏳ Aguarda CNPJ |
| E-mail profissional | Zoho Mail | Gratuito | ⏳ Confirmar status |
| Pixel Meta | Meta Pixel | Gratuito | ❌ Não instalado |

---

## 📁 ESTRUTURA DE ARQUIVOS DO PROJETO

```
selene-joias/
├── index.html                     → Página inicial
├── catalogo.html                  → Catálogo com filtros
├── produto.html                   → Página de produto individual
├── checkout.html                  → Checkout completo
├── rastreio.html                  → Rastreio de pedido (API segura)
├── sobre.html                     → Sobre nós
├── blog.html / blog-post.html     → Blog público
├── politica-de-entrega.html
├── politica-de-privacidade.html
├── politica-de-trocas-e-devolucoes.html
│
├── admin/
│   ├── index.html                 → Login do admin (Firebase Auth)
│   ├── dashboard.html             → Produtos, Pedidos, Clientes, Campanhas Brevo, stats GSC
│   ├── produto.html               → Cadastrar/editar produto + Cloudinary + reposicionar/zoom
│   ├── cupons.html                → Gerenciar cupons de desconto
│   ├── blog.html / blog-post.html → Gerenciar posts do blog
│   └── configuracoes.html         → Configurações da loja (Hero, Caixas, Depoimentos, etc.)
│
├── api/
│   ├── _lib/                      → Helpers compartilhados (google-auth.js, firestore.js, brevo.js)
│   ├── payment.js                 → Cria pagamento Mercado Pago
│   ├── mp-webhook.js              → Webhook de confirmação (verifica assinatura HMAC)
│   ├── payment-status.js          → Consulta status de pagamento
│   ├── check-boletos.js           → Cron diário: trata boletos vencidos
│   ├── rastreio.js                → Busca pedidos p/ rastreio sem expor dados sensíveis
│   ├── email.js                   → Envia e-mail transacional via Brevo
│   ├── contact.js                 → Cadastra cliente na lista Brevo "Clientes do Site"
│   ├── brevo-campaigns.js         → Lista campanhas em rascunho / dispara envio
│   ├── search-console-stats.js    → Estatísticas do Google Search Console
│   └── sitemap.js                 → Gera sitemap.xml dinâmico
│
├── assets/
│   ├── css/style.css              → Estilos globais
│   ├── js/cart.js                 → Carrinho (localStorage: 'elenice_cart')
│   └── img/                       → ainda não existe — logo real pendente
│
└── vercel.json                    → Configuração de rotas, cron e headers
```

---

## 🔥 CONFIGURAÇÕES FIREBASE

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAsGGXCg0GfbJKsGuGDWDHfVpdeBna-aYI",
  authDomain: "selene-joias.firebaseapp.com",
  projectId: "selene-joias",
  storageBucket: "selene-joias.firebasestorage.app",
  messagingSenderId: "395713731584",
  appId: "1:395713731584:web:c29c4d3f53254e0ed10ce5"
};
```

## ☁️ CONFIGURAÇÕES CLOUDINARY

```javascript
const CLOUDINARY_CLOUD = 'ddmxyguk0';
const CLOUDINARY_PRESET = 'selene-joias'; // Unsigned
```

---

## 🎨 IDENTIDADE VISUAL

```css
/* CORES */
--gold:        #7C5C35;  /* Ouro Profundo — cor principal */
--gold-mid:    #A07848;  /* Ouro Médio */
--gold-light:  #C4A47A;  /* Ouro Claro — bordas, ícones */
--gold-pale:   #E0CEBB;  /* Ouro Pálido — divisores */
--cream:       #F5F0EA;  /* Creme — fundo principal */
--cream-dark:  #EDE4DA;  /* Creme Escuro — seções alt */
--brown-deep:  #3D2B1A;  /* Mogno — títulos, footer */
--brown-mid:   #5C3D28;  /* Marrom Médio */
--text:        #2A1F14;  /* Texto principal */
--text-mid:    #5A4030;  /* Texto secundário */
--text-soft:   #9C8070;  /* Texto suave — labels */
--white:       #FEFCF9;  /* Off-white */

/* FONTES */
/* Primária (títulos, logo): Cormorant Garamond */
/* Secundária (texto, labels): Jost */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Jost:wght@200;300;400;500;600&display=swap');
```

---

## ⚠️ REGRAS CRÍTICAS DE DESENVOLVIMENTO

### Paths dos arquivos admin
- Arquivos em `admin/` usam `../assets/css/style.css` (não `assets/css/style.css`)
- Arquivos em `admin/` usam `../assets/js/cart.js`
- **NUNCA** usar `../../assets/` — esse caminho não existe

### vercel.json
- Usar formato `"rewrites"` com `"source"/"destination"` (não `"routes"` com `"src"/"dest"`)
- `cleanUrls: true` deve estar ativo
- `api/payment.js` deve sempre estar presente
- Rotas obrigatórias: `/admin/cupons`, `/admin/configuracoes`, `/admin/blog`, `/admin/blog-post`, `/blog/:slug`
- O cron de boletos (`/api/check-boletos`precisa continuar em `crons`

### Firebase / Firestore
- **Nunca** combinar `where` + `orderBy` no Firestore (plano gratuito exige índice composto)
- Filtros por categoria: fazer no cliente com `.filter()` após buscar tudo
- Coleção de configurações: `configuracoes/loja`
- Chave do localStorage do carrinho: `'elenice_cart'`
- `pedidos` contém CPF/endereço/telefone — nunca expor essa coleção com leitura pública; a página de rastreio usa a API segura (`api/rastreio.js`) com service account, não acesso direto do Firestore no cliente

### Tracking (Analytics)
- GA4 é instalado individualmente em cada página pública (snippet inline no `<head>`), não existe um `assets/js/tracking.js` centralizado
- **Nunca** instalar GA4 nas páginas do admin — já aconteceu por engano uma vez em `admin/produto.html` e foi removido; isso contaminaria as métricas com a navegação dela mesma
- Meta Pixel não está instalado hoje

### E-mail e marketing
- Tudo via **Brevo** (não EmailJS— `api/email.js` para transacional, `api/contact.js` para cadastrar na lista de marketing, `api/brevo-campaigns.js` para campanhas
- A API da Brevo (`sendNow`não permite escolher destinatários por chamada — o envio sempre vai para a lista já configurada na própria campanha; por isso o botão "Criar campanha" no admin abre o Brevo direto em vez de tentar reconstruir esse fluxo

### Reposicionamento e zoom de fotos (Hero, Caixas de Destaque, produtos, etc.)
- Padrão: `object-position` (arrastar/pan+ `transform: scale()` (zoom), salvos como `posX`/`posY`/`zoom` por foto
- Nas fotos de produto, o zoom de hover do site (lupa na página do produto, ampliação no card do catálogousa a foto configurada como **base** via uma custom property CSS `--zoom` — o hover multiplica a partir dela em vez de sobrescrever, então o zoom do admin e o zoom de hover coexistem
- Estado de arraste/zoom fica em um objeto persistente por campo (não em variável local da função), porque a função de inicialização roda de novo toda vez que a foto é trocada

### CSS — cuidado com inline style
- Um `style="..."` inline sempre vence uma regra de `@media` no CSS, mesmo que a media query pareça mais específica — isso já causou dois bugs reais neste projeto (enquadramento mobile do Hero nunca aplicava; grade de 5 colunas das categorias travada no mobile). Se precisar de comportamento responsivo diferente de um valor definido inline via JS, resolva no próprio JS com `matchMedia`, não tentando sobrepor com CSS

### Sidebar admin (menu lateral)
- Todos os arquivos admin devem ter os mesmos links: Dashboard, Novo Produto, Produtos, Pedidos, Cupons, Blog, Clientes, Ver Loja, Configurações
- Sidebar é recolhível (preferência em localStorage `sidebarCollapsed`) e vira menu overlay em telas ≤1024px — o padrão de CSS/JS é o mesmo em todos os arquivos admin, copiar dali ao criar uma página nova

---

## 🚀 COMO FAZER DEPLOY

```bash
# No terminal, dentro da pasta selene-joias:
git add .
git commit -m "descrição do que foi feito"
git push
# Vercel faz o deploy automático em ~1 minuto
```

---

## 📝 OBSERVAÇÕES IMPORTANTES

- Site **mobile-first** — maioria das clientes compra pelo celular
- Todas as cores e fontes seguem o manual de identidade
- Imagens dos produtos devem ter fundo neutro (creme ou branco), recomendado quadradas ~1200×1200px
- Tom de comunicação: elegante, feminino e próximo
- Pagamento via Pix tem **desconto configurável** pelo admin
- Frete grátis acima de um valor configurável pelo admin
- Parcelamento em até **12x no cartão** (já no código)
- WhatsApp é um campo editável em Configurações — não precisa mexer em código para trocar o número
- Correios e verificação final do Mercado Pago: **aguardando CNPJ/conta**
- **Nunca** sugerir refazer páginas que já existem
- **Edições cirúrgicas apenas** — improviso causa quebra em cascata
- Sessões paralelas de chat já introduziram bugs antes — verificar paths após qualquer edição externa
- **Bug crítico já corrigido:** pedidos deixaram de ser salvos silenciosamente por um tempo porque `addDoc` foi importado de uma versão diferente do SDK do Firebase num arquivo — qualquer novo arquivo que grave no Firestore deve importar os módulos do SDK da mesma versão usada nos demais arquivos do projeto

---

## ✅ CHECKLIST FINAL ANTES DE LANÇAR OFICIALMENTE

### Conteúdo
- [ ] Fotos reais dos produtos cadastradas
- [ ] Página "Sobre nós" com história real da Elenice revisada
- [ ] WhatsApp real preenchido em Configurações
- [ ] Política de entrega, trocas e privacidade revisadas com conteúdo final

### Técnico
- [x] Domínio elenicecollection.com.br apontando para Vercel
- [x] SSL ativo (https://)
- [x] Google Analytics instalado
- [x] Google Search Console verificado e integrado
- [x] E-mails transacionais e de marketing via Brevo funcionando
- [ ] E-mail contato@elenicecollection.com.br funcionando (Zoho)
- [ ] Pagamentos reais confirmados em produção (Mercado Pago — conta verificada)
- [ ] Frete real Correios (aguarda CNPJ)
- [ ] Logo real em `assets/img/logo.png`

### Testes
- [ ] Carrinho funcionando no celular
- [ ] Checkout preenchimento de endereço via CEP
- [ ] Admin: cadastrar produto com foto, reposicionar e dar zoom
- [ ] Admin: produto aparece na loja automaticamente
- [ ] Faixa de avisos editável pelo admin aparece em todas as páginas
- [ ] Rastreio mostra pedido real de um pedido de teste

---

*Documento atualizado em: Julho 2026*
*Próxima etapa: confirmar Zoho Mail e verificação final da conta Mercado Pago → API Correios (aguarda CNPJ)*
