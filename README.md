# PautaPT — Calculadora e Gestor de Notas Escolares (Portugal)

Aplicação web moderna, minimalista e ultra-rápida, otimizada para iPhone/smartphones (estilo iOS nativo / PWA) para cálculo e gestão de notas de testes escolares em Portugal (escala oficial de 0 a 20 valores).

---

## 🚀 Funcionalidades

### 1. Passo Inicial (Configuração do Teste)
- **Seleção de Disciplina:** Atalhos rápidos para as disciplinas habituais do Ensino Básico e Secundário em Portugal (*Matemática A, Português, Físico-Química A, Biologia e Geologia, Filosofia, Inglês, etc.*) ou disciplina personalizada.
- **Cotação Total:** Seleção instantânea de escalas comuns:
  - **200 pontos** (IAVE / Exames Nacionais e testes do Secundário)
  - **20 valores** (Padrão nacional direto)
  - **100 pontos** (Módulos / Frequências)
  - **50 pontos** (Mini-testes / Questões-aula)
  - Cotação personalizada livre.
- **Ponderação e Momento:** Peso do teste no período/semestre (ex: 30%, 40%) e período letivo (1º, 2º, 3º Período ou Semestres).
- **Estrutura por Domínios / Exercícios:**
  - **Por Domínios:** Conhecimento, Raciocínio, Comunicação, etc.
  - **Por Exercícios/Questões:** Grupo I, Grupo II, Grupo III, etc.
  - **Cotação Direta:** Introdução simples do total de pontos obtidos.
  - Botão de ajuste proporcional automático para equalizar a soma dos itens à cotação total.

### 2. Passo de Cálculo em Tempo Real
- Introdução intuitiva de valores com barras deslizantes suaves ou numéricas.
- **Cálculo instantâneo** da nota final convertida para a escala de **0 a 20 valores** (com 1 e 2 casas decimais).
- Indicador visual dinâmico com a menção qualitativa em Portugal:
  - `< 9.5`: Não Satisfaz (Negativa)
  - `9.5 - 13.4`: Satisfaz (Suficiente)
  - `13.5 - 17.4`: Bom (Satisfaz Bem)
  - `17.5 - 20.0`: Muito Bom / Excelente
- Feedback háptico visual (glows e cores no padrão iOS Dark Mode).

### 3. Dashboard e Histórico Completo
- **Persistência Local (localStorage):** Todos os dados ficam guardados no teu dispositivo, com total privacidade e funcionamento offline.
- **Média Geral Ponderada:** Cálculo rigoroso da média global e por disciplina tendo em conta o peso de cada teste.
- **Visão por Disciplinas:** Cartões expansíveis com detalhe de cada teste, melhor nota, pior nota e percentagem de positivos.
- **Simulador de Metas:** Permite calcular exatamente que nota precisas de obter no próximo teste (e quantos pontos na escala de 200 ou 20) para atingir uma média pretendida.
- **Cópia de Segurança:** Exportação e importação de dados em formato JSON.

---

## 📱 Instalação no iPhone (PWA / Estilo App Nativa)

1. Abre a aplicação no Safari no iPhone.
2. Toca no ícone de **Partilhar** (quadrado com seta para cima).
3. Seleciona **"Adicionar ao Ecrã Principal"** (Add to Home Screen).
4. A app abrirá em ecrã inteiro (fullscreen), sem barra de navegação, com safe areas respeitadas (Dynamic Island / Notch).

---

## ⚡ Como Correr Localmente

Requisitos: Node.js (v18+)

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Gerar build de produção
npm run build

# Testar a build de produção localmente
npm run preview
```

---

## 🌐 Deploy Direto para a Vercel

O projeto já inclui o ficheiro `vercel.json` pré-configurado.

### Opção 1: Via GitHub (Recomendado)
1. Faz push deste repositório para o teu GitHub.
2. Acede a [vercel.com](https://vercel.com) e clica em **"Add New Project"**.
3. Importa o repositório — a Vercel deteta automaticamente o Vite:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Clica em **"Deploy"**.

### Opção 2: Via Vercel CLI
```bash
npm install -g vercel
vercel
```
Siga as instruções rápidas no terminal e o projeto fica online em segundos com HTTPS e CDN global.
