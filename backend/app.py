from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np

# Inicializa o aplicativo Flask
app = Flask(__name__)
# Permite que o frontend Angular (que roda em outra porta) acesse este backend
CORS(app)

# Função de cálculo que usaremos
def calcular_estatisticas(dados_aparelhos, tarifa_global):
    """
    Calcula as estatísticas de consumo usando Pandas e Numpy.
    """
    if not dados_aparelhos:
        return {
            "desvioPadraoConsumo": 0, "projecaoMensal": 0,
            "projecaoMensalMin": 0, "projecaoMensalMax": 0,
            # Retorne outros valores zerados conforme necessário
            "consumoTotal": 0, "mediaConsumo": 0, "mediaDiaria": 0,
            "ranking": [], "participacao": [],
            "maisEconomico": {"nome": "-", "valor": 0},
            "maiorGastao": {"nome": "-", "valor": 0}
        }

    # 1. Criação do DataFrame do Pandas
    df = pd.DataFrame(dados_aparelhos)

    # 2. Cálculos de Consumo
    df['horasPorDia'] = df['minutesPerDay'] / 60
    df['kwhPorDia'] = (df['powerW'] / 1000) * df['horasPorDia'] * df['quantity']
    df['kwhPorSemana'] = df['kwhPorDia'] * 7
    df['custoMensal'] = df['kwhPorDia'] * 30 * tarifa_global

    consumo_total_semanal = df['kwhPorSemana'].sum()
    n = len(df)

    # 3. Medidas de Tendência Central e Variabilidade
    # Média de consumo semanal POR APARELHO
    media_consumo = df['kwhPorSemana'].mean()
    # Desvio Padrão do consumo semanal (ddof=1 para amostra)
    desvio_padrao_consumo = df['kwhPorSemana'].std(ddof=1) if n > 1 else 0

    # 4. Cálculo do Intervalo de Confiança para a Projeção Mensal
    projecao_mensal_total = df['custoMensal'].sum()
    projecao_min = projecao_mensal_total
    projecao_max = projecao_mensal_total

    if n > 1:
        custo_diario_por_aparelho = (df['kwhPorSemana'] / 7) * tarifa_global
        desvio_padrao_custo_diario = custo_diario_por_aparelho.std(ddof=1)
        
        z_score = 1.96  # Para 95% de confiança
        
        # Margem de erro para a média de custo diário
        margem_de_erro_diaria = z_score * (desvio_padrao_custo_diario / np.sqrt(n))
        margem_de_erro_mensal = margem_de_erro_diaria * 30
        
        projecao_min = max(0, projecao_mensal_total - margem_de_erro_mensal)
        projecao_max = projecao_mensal_total + margem_de_erro_mensal

    # 5. Montando o objeto de resposta (similar ao seu TypeScript)
    # Ordena o DataFrame por consumo para facilitar outros cálculos
    df_sorted = df.sort_values(by='kwhPorSemana', ascending=False)
    
    ranking = [{'nome': row['label'], 'valor': round(row['kwhPorSemana'], 2)} for index, row in df_sorted.iterrows()]
    
    participacao = []
    if consumo_total_semanal > 0:
        participacao = [{
            'nome': row['label'], 
            'porcentagem': round((row['kwhPorSemana'] / consumo_total_semanal) * 100, 1)
        } for index, row in df_sorted.iterrows()]

    return {
        "consumoTotal": round(consumo_total_semanal, 2),
        "mediaConsumo": round(media_consumo, 2),
        "desvioPadraoConsumo": round(desvio_padrao_consumo, 2),
        "mediaDiaria": round((consumo_total_semanal / 7) * tarifa_global, 2),
        "projecaoMensal": round(projecao_mensal_total, 2),
        "projecaoMensalMin": round(projecao_min, 2),
        "projecaoMensalMax": round(projecao_max, 2),
        "ranking": ranking,
        "participacao": participacao,
        "maisEconomico": ranking[-1] if ranking else {"nome": "-", "valor": 0},
        "maiorGastao": ranking[0] if ranking else {"nome": "-", "valor": 0},
        # Os dados para os gráficos também podem ser gerados aqui e enviados prontos
        "barChartData": {
            "labels": df_sorted['label'].tolist(),
            "datasets": [
                {'label': 'Energia (kWh/mês)', 'data': [round(kwh * 4.28, 2) for kwh in df_sorted['kwhPorSemana']], 'backgroundColor': '#36A2EB'},
                {'label': 'Custo (R$/mês)', 'data': [round(custo, 2) for custo in df_sorted['custoMensal']], 'backgroundColor': '#FF6384'}
            ]
        }
    }

# Define a rota/endpoint da nossa API
@app.route('/calcular', methods=['POST'])
def calcular():
    dados = request.get_json()
    
    # Extrai os dados enviados pelo frontend
    dados_aparelhos = dados.get('appliances', [])
    tarifa_global = dados.get('tariff', 0.78)
    
    # Chama a função de cálculo
    estatisticas = calcular_estatisticas(dados_aparelhos, tarifa_global)
    
    # Retorna os resultados em formato JSON
    return jsonify(estatisticas)

# Roda o servidor quando o script é executado
if __name__ == '__main__':
    # O servidor rodará em http://127.0.0.1:5000
    app.run(debug=True)

