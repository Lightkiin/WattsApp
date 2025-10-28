# ⚡ WattsApp

**WattsApp** é uma aplicação web interativa para calcular e visualizar o consumo de energia elétrica dos seus eletrodomésticos. Arraste e solte aparelhos, personalize o uso e receba insights detalhados sobre seu gasto de energia e dicas de economia personalizadas!

## 🌟 Funcionalidades

- 📊 **Visualização interativa** de consumo de energia por aparelho
- 🖱️ **Interface drag-and-drop** para adicionar eletrodomésticos
- ➕ **Adicionar aparelhos personalizados** com watts e tempo de uso customizados
- 💰 **Cálculo de custos** baseado na tarifa do seu estado
- 📈 **Gráficos detalhados** de consumo e custo
- 💡 **Dicas de economia personalizadas** baseadas nos seus aparelhos
- 📉 **Análise estatística** com projeções mensais e ranking de consumo
- 🗺️ **Tarifas por estado** brasileiros pré-configuradas

## 🛠️ Tecnologias

### Frontend

- **Angular 20.0.1** - Framework web
- **TypeScript** - Linguagem de programação
- **ng2-charts** - Biblioteca de gráficos
- **CSS3** - Estilização com tema dark

### Backend

- **Python/Flask** - API REST para cálculos estatísticos
- **NumPy** - Computação científica
- **SciPy** - Análises estatísticas avançadas

## 🚀 Como Executar

### Pré-requisitos

- Node.js (versão 18 ou superior)
- Angular CLI (`npm install -g @angular/cli`)
- Python 3.x
- pip (gerenciador de pacotes Python)

### Instalação

1. **Clone o repositório:**

```bash
git clone https://github.com/Lightkiin/WattsApp.git
cd WattsApp
```

2. **Instale as dependências do frontend:**

```bash
npm install
```

3. **Instale as dependências do backend:**

```bash
cd backend
pip install flask flask-cors numpy scipy
```

### Executando a Aplicação

1. **Inicie o servidor backend (Python/Flask):**

```bash
cd backend
python app.py
```

O backend estará rodando em `http://127.0.0.1:5000`

2. **Em outro terminal, inicie o servidor frontend (Angular):**

```bash
ng serve
```

O frontend estará disponível em `http://localhost:4200`

3. **Acesse a aplicação** no seu navegador em `http://localhost:4200/`

## 📖 Como Usar

1. **Selecione seu estado** para carregar a tarifa de energia automaticamente
2. **Arraste os eletrodomésticos** da galeria para a área de cálculo
3. **Personalize** a quantidade, potência e tempo de uso de cada aparelho
4. **Adicione aparelhos personalizados** clicando no botão "Adicionar" na galeria
5. **Visualize** os gráficos e insights sobre seu consumo
6. **Leia as dicas** de economia personalizadas baseadas no seu perfil de consumo

## 📊 Insights Fornecidos

- 🔋 Consumo total semanal em kWh
- 💡 Aparelho mais econômico
- 📉 Média de consumo por aparelho
- 💰 Custo médio diário
- 🏆 Ranking de consumo
- 📊 Participação percentual de cada aparelho
- 📊 Variabilidade (desvio padrão)
- 📆 Projeção mensal com intervalo de confiança (95%)
- 💡 Dicas personalizadas de economia

## 🏗️ Estrutura do Projeto

```
WattsApp/
├── src/
│   ├── app/
│   │   ├── energy-dragdrop.component.ts    # Componente principal
│   │   ├── energy-dragdrop.component.html  # Template
│   │   ├── energy-dragdrop.component.css   # Estilos
│   │   └── app.routes.ts                   # Rotas
│   ├── assets/
│   │   └── appliances/                     # Imagens dos aparelhos
│   └── index.html
├── backend/
│   └── app.py                              # API Flask
├── package.json
└── README.md
```

## 🔧 Build para Produção

Para criar uma build de produção otimizada:

```bash
ng build
```

Os arquivos compilados estarão na pasta `dist/` prontos para deploy.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abrir um Pull Request

## 📝 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 👨‍💻 Autor

Desenvolvido por [Brendon/Lightkiin](https://github.com/Lightkiin) e [Vinicius](https://github.com/ViniciusDSN)

## 📧 Contato

Para dúvidas, sugestões ou feedback, abra uma issue no repositório!

---

⚡ **WattsApp** - Economize energia, economize dinheiro! 💰
