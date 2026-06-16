# 🪙 CLAUDE4.MD — ELENICE COLLECTION

> Documento de continuidade do projeto. Cole no início de uma nova conversa para retomar o trabalho com contexto completo.

---

## 🎯 VISÃO DO NEGÓCIO

**Elenice Collection** (rebranding de Sélene Jóias) é uma loja online de joias em **ouro 18k**, voltada ao público feminino premium, sediada em Balneário Camboriú/SC.

**Objetivo:** ter uma presença digital completa — site de e-commerce, painel administrativo próprio, pagamentos integrados, e-mails automáticos e identidade visual consistente — para competir visualmente com marcas como **Vivara** e **Prata Fina**, sem depender de marketplaces.

**Posicionamento:** elegante, feminino, próximo. Tom de comunicação acolhedor mas sofisticado. Paleta dourado/creme/marrom mogno, tipografia serifada (Cormorant Garamond) + sans (Jost).

**Modelo de receita:** venda direta via site (Pix com 5% desconto, cartão até 12x sem juros, boleto), com frete grátis acima de R$299 e embalagem especial inclusa em todos os pedidos.

**Diferenciais já implementados:** cards de produto em nível de loja premium (cantos arredondados, hover overlay, parcelamento em destaque), e-mails transacionais com identidade visual própria, faixa de avisos dinâmica editável pelo admin, e checkout com 3 formas de pagamento.

---

## 🛠️ COMO FOI FEITO (DECISÕES TÉCNICAS)

- **Stack:** HTML/CSS/JS puro no front (sem framework), Firebase (Auth + Firestore) como backend, Vercel para hospedagem + serverless functions, Cloudinary para imagens.
- **Pagamentos:** Mercado Pago Checkout Transparente. Toda chamada passa por `/api/payment.js` (serverless) para evitar CORS e manter o `MP_ACCESS_TOKEN` seguro no servidor.
- **E-mails:** Brevo (300/dia gratuito). Toda chamada passa por `/api/email.js` para manter `BREVO_API_KEY` fora do frontend (GitHub bloqueia push com chave exposta).
- **DNS/Domínio:** migrado de Registro.br para **Cloudflare** (nameservers evangeline + felicity) para habilitar Email Routing gratuito.
- **E-mail profissional:** `contato@elenicecollection.com.br` → Cloudflare Email Routing → Gmail (`selenejoiass98@gmail.com`), com envio/resposta via Gmail usando SMTP do Brevo.
- **Carrinho:** localStorage (`elenice_cart`), gerenciado por `assets/js/cart.js`, compartilhado entre todas as páginas públicas.
- **Faixa de avisos:** componente dinâmico carregado do Firestore (`configuracoes/loja → faixa`), presente em todas as páginas públicas, com nav que acompanha o scroll sem deixar vão.
- **Tracking:** GA4 + Meta Pixel centralizados em `assets/js/tracking.js`, carregado apenas nas páginas públicas (nunca no checkout/admin).

---

## ✅ O QUE JÁ FOI FEITO

### Identidade de Marca
- [x] Rebranding completo de "Sélene Jóias" → "Elenice Collection" em todas as páginas públicas (`index`, `catalogo`, `produto`, `checkout`, `sobre`, `rastreio`)
- [x] Paleta de cores e tipografia definidas e aplicadas (`--gold`, `--cream`, `--brown-deep`, Cormorant Garamond + Jost)
- [x] Manual de identidade visual, logo SVG, papelaria digital, templates Instagram (entregues anteriormente)

### Site E-commerce
- [x] `index.html`, `catalogo.html`, `produto.html`, `checkout.html`, `sobre.html`, `rastreio.html` — todos auditados e padronizados
- [x] **Cards de produto redesenhados**: cantos arredondados (16px), sombra suave permanente, hover com elevação, overlay "Ver produto", badge de desconto automático, botão e badges em formato pill
- [x] Preço com hierarquia clara: riscado → preço principal grande → parcelamento em 12x (decimais sempre corretos com `maximumFractionDigits:2`)
- [x] Faixa de avisos dinâmica (Firestore) em todas as páginas, nav sem "vão" no scroll
- [x] Carrinho funcional (localStorage), testado e validado — adicionar, remover, alterar quantidade, frete grátis acima de R$299

### Checkout & Pagamentos
- [x] Checkout completo: dados pessoais, endereço (busca via CEP/ViaCEP), frete simulado, cupom de desconto (validado via Firestore)
- [x] Pix, Cartão (MP Bricks) e Boleto — todos roteados via `/api/payment.js`
- [x] Boleto **funcionando em produção** (testado)
- [ ] Pix **bloqueado** — conta MP sem chave habilitada para QR code (erro: "Collector user without key enabled for QR render")

### E-mails Automáticos
- [x] `api/email.js` — serverless function segura (chave Brevo só no servidor via env var)
- [x] E-mail de confirmação (Pix/Cartão) com layout de marca, itens, totais
- [x] E-mail de boleto **diferenciado**: data de vencimento (3 dias úteis), valor em destaque, botão "PAGAR BOLETO AGORA", aviso de cancelamento automático
- [x] Cópia (BCC) de todo pedido para `contato@elenicecollection.com.br`
- [x] Domínio autenticado no Brevo (DKIM + DMARC)

### Infraestrutura & E-mail Profissional
- [x] DNS migrado para Cloudflare
- [x] `contato@elenicecollection.com.br` recebendo via Cloudflare Email Routing → Gmail
- [x] Gmail enviando/respondendo como `contato@elenicecollection.com.br` via SMTP Brevo
- [x] GA4 (`G-NB5Q5NEEG6`) e Meta Pixel (`976418968511579`) ativos
- [x] WhatsApp real configurado: `47 99725-9678`

### Páginas Legais (junho 2026)
- [x] `politica-de-entrega.html` — prazos, frete grátis R$299, rastreamento, tentativas de entrega
- [x] `politica-de-trocas-e-devolucoes.html` — garantia 1 ano + vitalícia limpeza/polimento, trocas 30 dias, devolução 7 dias (Art. 49 CDC), peças personalizadas, como solicitar
- [x] `politica-de-privacidade.html` — LGPD completa (coleta, finalidade, segurança, compartilhamento, direitos, cookies, DPO)
- [x] Layout compartilhado `.legal-*` em `style.css` (hero + sumário lateral sticky + seções numeradas), reutilizável para futuras páginas institucionais
- [x] Links do footer atualizados em todas as páginas públicas (antes apontavam para `#`)
- [x] Tom "joalheria de luxo": termos como "nossas clientes", "sua joia"; nenhum valor/prazo genérico — todos exatos conforme briefing (R$299 frete grátis, 1 ano garantia, 30 dias troca, 7 dias devolução, WhatsApp 47 99725-9678)

### Painel Admin
- [x] Login (Firebase Auth), dashboard, cadastro de produtos (Cloudinary), cupons, configurações da loja — todos funcionais
- [x] Admin: campos editáveis para hero (titulo1/2, subtítulo, botão, label, imagem, estilo A/B)
- [x] Admin: seção Hero B (Fullscreen) com 9 uploads de foto + campos próprios (etiqueta, subtítulo, título grande, botão)
- [x] Admin: seção Fotos das Categorias (5 uploads: Anéis, Colares, Pulseiras, Brincos, Conjuntos)
- [x] Admin: seção "Posts do Instagram" — toggle ativo/inativo + lista de links (até 12, botão "+ Adicionar link"), embed oficial (`embed.js` da Meta, sem API/App Review) exibido na home em grid de 4 por linha (wrap automático)
- [x] Admin: toggle independente para a seção de Depoimentos (mostrar/ocultar na home), padrão ativo
- [x] **Fix:** depoimentos não apareciam na home — causa: classe `.reveal` (scroll-fade-in) é observada uma única vez no `DOMContentLoaded` (cart.js), mas depoimentos chegam depois via Firestore e nunca eram observados, ficando com `opacity:0` permanente. Corrigido com fallback `querySelectorAll('.reveal:not(.visible))` no `finally` do `init()` do index.html (mesmo padrão que já existia em catalogo.html). **Atenção:** qualquer novo conteúdo dinâmico com classe `.reveal` precisa desse mesmo fallback ou nunca aparecerá

### Blog (sessão 16/06/2026)
- [x] **Público:** `blog.html` (listagem, grid 3 col, paginação 9/página) e `blog-post.html` (artigo individual)
- [x] Link "Blog" **somente no rodapé** de todas as páginas públicas (não está no menu superior, por pedido explícito)
- [x] **Admin:** `admin/blog.html` (lista com editar/excluir/publicar-despublicar) e `admin/blog-post.html` (formulário: título, slug auto-gerado e editável, resumo, conteúdo, categoria com sugestões, autor, imagem de capa via Cloudinary, meta título/descrição opcionais, publicar ou salvar rascunho)
- [x] Link "Blog" adicionado ao menu lateral de todas as páginas do admin
- [x] **SEO:** title/meta description dinâmicos por post, Open Graph + Twitter Card, link canonical, JSON-LD (`Article` schema), URLs limpas via slug (`/blog/{slug}`), HTML semântico (`<article>`, `<time>`, breadcrumb)
- [x] `vercel.json`: rewrites `/blog` → `blog.html` e `/blog/:slug` → `blog-post.html?slug=:slug` (+ `/admin/blog` e `/admin/blog-post`)
- [x] `robots.txt` e `sitemap.xml` criados (básicos — sitemap lista só páginas estáticas; posts do blog e produtos são indexados via crawling dos links internos, não estão no sitemap pois são dinâmicos via Firestore sem build step)
- [x] Firestore: nova coleção `blog` (ver schema abaixo)
- [ ] **Pendente:** se o volume de posts crescer, considerar sitemap dinâmico via serverless function (`/api/sitemap.js`) consultando Firestore

### Homepage Redesenhada (sessão 13/06/2026)
- [x] **Cards de produto reformulados**: preço em dourado (`--gold-mid`), sem borda separadora, gradiente sutil na imagem, 2 botões (Ver produto outline + + Carrinho ouro), categoria · material na mesma linha
- [x] **Hero A (Editorial)** — id="hero-editorial", layout split editorial (mosaico de fotos à direita), carrega texto/imagens do Firestore via `applyConfig()`
- [x] **Hero B (Fullscreen Woopy style)** — id="hero-fullscreen", 3 painéis de foto lado a lado, slideshow automático a cada 5s com grupos de 3 (total 9 fotos), texto overlay centralizado (etiqueta + subtítulo + título grande + botão), setas e dots de navegação, dados vindos de `heroB` no Firestore
- [x] **Hero C (Foto Cheia)** — id="hero-photo", foto de fundo full-bleed com gradiente cream da esquerda p/ direita, texto overlay alinhado à esquerda (reaproveita `hero.titulo1/titulo2/subtitulo/btn/label`), 3 trust badges com ícones SVG abaixo do CTA (Ouro 18k · Frete Grátis · Garantia 1 Ano), foto própria em `hero.imgFundo`
- [x] Toggle A/B/C salvo em `hero.estilo` (`editorial` | `fullscreen` | `foto`), radio buttons no admin
- [x] Tiles de categoria suportam foto via Firebase (`cat-img-{cat}`)
- [x] **Removida seção "Em Destaque"** (spotlight carousel) — somente "Nossa Coleção" (grid 4 col)
- [x] **Nova seção Diferenciais** após "Nossa Coleção": 4 colunas com ícones SVG line-art elegantes, fundo gradiente creme (Ouro 18k · Frete Grátis · 1 Ano Garantia · 12x sem juros)
- [x] **Cards redesenhados (estilo luxo minimalista)**: texto centralizado, badges em bege integrado (sem vermelho), botões empilhados "Adicionar ao Carrinho" (escuro) + "Ver Detalhes" (outline) revelados no hover apenas em dispositivos com hover real (`@media (hover: hover) and (pointer: fine)`) — sempre visíveis em touch/mobile. Aplicado em `index.html`, `catalogo.html` e `produto.html` (relacionados — corrigida estrutura antiga que nunca tinha sido atualizada)
- [x] **Zoom de cursor real** na foto principal da página de produto: `transform-origin` segue o mouse + `scale(2.2)` no hover (somente desktop)

---

## 🔄 O QUE FALTA FAZER (ORDEM SUGERIDA)

### Próximo
- [ ] **Logo real** em `assets/img/logo.png` (atualmente ausente/quebrado em algumas referências)
- [ ] **Favicon**
- [ ] Trocar e-mail de login do Firebase Auth do admin: `contato@selenejoias.com.br` → `contato@elenicecollection.com.br`
- [ ] Instagram Shopping (catálogo no Meta Commerce Manager)

### Aguardando CNPJ
- [ ] **Pix** — habilitar chave na conta Mercado Pago
- [ ] **Frete real** — API Correios (PAC/SEDEX/Mini Envios)

### Conteúdo (depende da Elenice)
- [ ] Fotos reais dos produtos (fundo neutro creme/branco)
- [ ] Texto real da página "Sobre nós"
- [x] Política de entrega, trocas/devoluções e privacidade (LGPD) — ver seção abaixo
- [ ] Remover produtos de teste ("teste 1", "teste 2") antes do lançamento oficial

---

## 🌐 INFRAESTRUTURA ATUAL

| Item | Serviço | Status |
|------|---------|--------|
| Hospedagem | Vercel (auto-deploy via GitHub) | ✅ |
| Repositório | `selenejoiass98-web/selene` | ✅ |
| Banco de dados | Firebase Firestore | ✅ |
| Autenticação | Firebase Auth | ✅ |
| Fotos | Cloudinary | ✅ |
| Domínio | elenicecollection.com.br | ✅ |
| DNS | Cloudflare | ✅ |
| E-mail transacional | Brevo (300/dia) | ✅ |
| E-mail recebimento | Cloudflare Email Routing → Gmail | ✅ |
| Analytics | GA4 + Meta Pixel | ✅ |
| Pagamentos | Mercado Pago (Pix pendente) | ⏳ |
| Frete | API Correios | ⏳ Aguarda CNPJ |

---

## ⚙️ REGRAS CRÍTICAS DE DESENVOLVIMENTO (mantidas)

- Paths em `admin/` usam `../assets/...` (nunca `../../assets/`)
- `vercel.json` usa `rewrites` (source/destination), `cleanUrls: true`, mantém `/api/payment.js` e `/api/email.js`
- Firestore: nunca combinar `where` + `orderBy` (plano gratuito exige índice composto)
- `tracking.js` **nunca** no checkout/admin
- Pagamentos: **nunca** chamar `api.mercadopago.com` direto do frontend — sempre `/api/payment` com `{ idempotencyKey, body }`
- E-mails: **nunca** expor `BREVO_API_KEY` no frontend — sempre `/api/email` com `{ to, toName, subject, htmlContent }`
- Boleto envia e-mail específico (sem o genérico); Pix/Cartão enviam o genérico
- Toda entrega de arquivo vem com os comandos git (linhas separadas — PowerShell não suporta `&&`)
- Edições cirúrgicas apenas — nunca refazer páginas inteiras
- **Cache de `/assets/`**: `vercel.json` usa `max-age=3600, must-revalidate` (não `immutable`) porque só tem CSS/JS, que mudam com frequência. Sempre que `style.css` for alterado, bump a versão no link (`assets/css/style.css?v=N`) em todas as 6 páginas públicas (index, catalogo, produto, checkout, rastreio, sobre) para forçar o navegador a buscar a versão nova — do contrário mudanças visuais não aparecem para quem já visitou o site

---

## 🆕 NOVAS DIRETRIZES DE ENGENHARIA (a partir de agora)

### Paradigma
- Adotar **Programação Orientada a Objetos** sempre que o código permitir (classes para `Cart`, `Checkout`, `PaymentService`, `EmailService`, etc.), evitando funções globais soltas quando fizer sentido encapsular estado e comportamento.

### Impacto entre módulos
- Sempre que um fix ou feature em um arquivo/classe **puder afetar outro** (ex.: alterar `cart.js` impacta `index.html`, `catalogo.html`, `checkout.html`), **avisar explicitamente** quais arquivos/páginas são afetados antes de aplicar a mudança.

### Versionamento — Git Flow
- **Branches por feature:** `feature/nome-da-feature` (ex.: `feature/logo-real`, `feature/favicon`, `feature/pix-habilitado`)
- Ao finalizar uma task: **Pull Request** da branch da feature → `develop`
- Após testes na `develop`: **merge** de `develop` → `main`
- `main` = produção (deploy automático Vercel). `develop` = staging/testes.
- Comandos de git fornecidos sempre como **linhas separadas** (compatibilidade PowerShell)

---

## 📋 CHECKLIST FINAL ANTES DO LANÇAMENTO

### Conteúdo
- [ ] Fotos reais dos produtos
- [ ] Texto real "Sobre nós"
- [ ] Política de entrega/trocas/privacidade
- [ ] Remover produtos de teste

### Técnico
- [x] Domínio + SSL + DNS
- [x] E-mail profissional funcionando
- [x] Analytics + Pixel
- [x] E-mails automáticos (Brevo)
- [x] WhatsApp real
- [ ] Logo real + favicon
- [ ] Pix habilitado
- [ ] Frete real (Correios)
- [ ] E-mail de login do admin atualizado

### Testes
- [x] Carrinho (mobile e desktop)
- [x] Checkout: CEP, frete, cupom
- [x] Boleto + e-mail de urgência
- [ ] Pix (aguarda habilitação)
- [ ] Cartão em produção (testar com cartão real)
- [x] Faixa de avisos editável pelo admin

---

---

## 🗄️ FIRESTORE — SCHEMA `configuracoes/loja`

```
hero:
  titulo1, titulo2, subtitulo, btn, label, img
  imgFundo      (foto de fundo do Hero C — Foto Cheia)
  estilo: 'editorial' | 'fullscreen' | 'foto'

heroB:
  titulo        (etiqueta, ex: "Coleção 2026")
  subtitulo     (linha pequena acima do título grande)
  tituloGrande  (ex: "ELEGÂNCIA")
  btn           (texto do botão)
  foto1…foto9   (URLs Cloudinary — exibidas 3 por vez)

box1: { label, nome, img }
box2: { nome, img }
box3: { nome, img }

categorias:
  aneis, colares, pulseiras, brincos, conjuntos → { img }

faixa: string[]
depoimentos: [{ nome, cidade, texto, estrelas }]
instagram: { ativo: boolean, posts: string[] }
depoimentosAtivo: boolean
stats: { s1num, s1label, s2num, s2label, s3num, s3label }
geral: { whatsapp, email, freteGratis, pixDesconto, aviso }
```

## 🗄️ FIRESTORE — COLEÇÃO `blog`

```
titulo, slug, resumo, conteudo (texto com \n entre parágrafos)
categoria, autor, imagemCapa (Cloudinary)
metaTitulo, metaDescricao (opcionais — fallback: titulo/resumo)
status: 'publicado' | 'rascunho'
criadoEm, atualizadoEm (serverTimestamp)
```

---

*Documento atualizado em: 13 de junho de 2026*
*Próxima etapa sugerida: Fotos reais dos produtos → Categorias com foto → Logo real → Favicon → Trocar login admin → Pix (quando CNPJ liberar)*