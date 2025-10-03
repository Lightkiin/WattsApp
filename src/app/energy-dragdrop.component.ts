import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-energy-dragdrop',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './energy-dragdrop.component.html',
  styleUrls: ['./energy-dragdrop.component.css']
})
export class EnergyDragdropComponent {
  selectedAppliances: string[] = [];

  appliances: { [key: string]: { label: string; watt: number; image: string } } = {
    chuveiro: { label: 'Chuveiro Elétrico', watt: 5500, image: 'assets/appliances/chuveiro.png' },
    geladeira: { label: 'Geladeira', watt: 150, image: 'assets/appliances/geladeira.png' },
    tv: { label: 'TV', watt: 80, image: 'assets/appliances/tv.png' },
    microondas: { label: 'Micro-ondas', watt: 1000, image: 'assets/appliances/microondas.png' },
    ar: { label: 'Ar-condicionado', watt: 1200, image: 'assets/appliances/ar.png' },
    lampada: { label: 'Lâmpada LED', watt: 10, image: 'assets/appliances/lampada.png' }
  };

  usage: { [key: string]: { powerW: number; hoursPerDay: number; costPerKwh: number } } = {};

  // Lista de estados e tarifa média
  states = [
    { code: 'AC', name: 'Acre' }, { code: 'AL', name: 'Alagoas' }, { code: 'AP', name: 'Amapá' },
    { code: 'AM', name: 'Amazonas' }, { code: 'BA', name: 'Bahia' }, { code: 'CE', name: 'Ceará' },
    { code: 'DF', name: 'Distrito Federal' }, { code: 'ES', name: 'Espírito Santo' }, { code: 'GO', name: 'Goiás' },
    { code: 'MA', name: 'Maranhão' }, { code: 'MT', name: 'Mato Grosso' }, { code: 'MS', name: 'Mato Grosso do Sul' },
    { code: 'MG', name: 'Minas Gerais' }, { code: 'PA', name: 'Pará' }, { code: 'PB', name: 'Paraíba' },
    { code: 'PR', name: 'Paraná' }, { code: 'PE', name: 'Pernambuco' }, { code: 'PI', name: 'Piauí' },
    { code: 'RJ', name: 'Rio de Janeiro' }, { code: 'RN', name: 'Rio Grande do Norte' }, { code: 'RS', name: 'Rio Grande do Sul' },
    { code: 'RO', name: 'Rondônia' }, { code: 'RR', name: 'Roraima' }, { code: 'SC', name: 'Santa Catarina' },
    { code: 'SP', name: 'São Paulo' }, { code: 'SE', name: 'Sergipe' }, { code: 'TO', name: 'Tocantins' }
  ];

  selectedState: string = 'SP';

  tarifas: { [key: string]: number } = {
    'AC': 0.90, 'AL': 0.86, 'AP': 0.88, 'AM': 0.86, 'BA': 0.85, 'CE': 0.72,
    'DF': 0.77, 'ES': 0.80, 'GO': 0.78, 'MA': 0.79, 'MT': 0.87, 'MS': 0.87,
    'MG': 0.71, 'PA': 0.94, 'PB': 0.80, 'PR': 0.75, 'PE': 0.84, 'PI': 0.73,
    'RJ': 0.87, 'RN': 0.76, 'RS': 0.72, 'RO': 0.89, 'RR': 0.92, 'SC': 0.73,
    'SP': 0.78, 'SE': 0.86, 'TO': 0.88
  };

  barChartData: any = { labels: [], datasets: [] };
  barChartOptions: any = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#ffffff', font: { size: 18, weight: 'bold' } } },
      tooltip: { bodyFont: { size: 24, weight: 'bold' }, titleFont: { size: 20, weight: 'bold' } }
    },
    scales: {
      x: { ticks: { color: '#ffffff', font: { size: 16, weight: 'bold' } }, grid: { color: '#444' } },
      y: { ticks: { color: '#ffffff', font: { size: 16, weight: 'bold' } }, grid: { color: '#444' } }
    }
  };

  totalWeeklyCost = 0; topSpender = '-'; consumoTotal = 0;
  maisEconomico = { nome: '-', valor: 0 }; mediaConsumo = 0; desvioPadraoConsumo = 0;
  participacao: { nome: string, porcentagem: number }[] = [];
  mediaDiaria = 0; projecaoMensal = 0; diferenca = 0; projecaoMensalMin = 0; projecaoMensalMax = 0;
  ranking: { nome: string, valor: number }[] = [];
  maiorGastao = { nome: '-', valor: 0 }; economia = 0; consumoPorHora = 0; savingsTips: string[] = [];

  get applianceKeys() { return Object.keys(this.appliances); }

  onDragStart(event: DragEvent, key: string) { event.dataTransfer?.setData('appliance', key); }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const key = event.dataTransfer?.getData('appliance');
    if (key && this.appliances[key] && !this.selectedAppliances.includes(key)) {
      this.selectedAppliances.push(key);
      const tarifa = this.tarifas[this.selectedState] || 1;
      this.usage[key] = { powerW: this.appliances[key].watt, hoursPerDay: 1, costPerKwh: tarifa };
      this.recalculate();
    }
  }

  updateTarifa() {
    const tarifa = this.tarifas[this.selectedState] || 1;
    this.selectedAppliances.forEach(key => {
      this.usage[key].costPerKwh = tarifa;
    });
    this.recalculate();
  }

  recalculate() {
    const labels: string[] = [];
    const energyData: number[] = [];
    const costData: number[] = [];
    const weeklyEnergyValues: number[] = []; // Array para guardar os consumos semanais

    let weeklyCost = 0, maxCost = 0, topKey = '-';
    let totalEnergyWeek = 0, minEnergy = Infinity, minEnergyName = '-', maxEnergy = 0, maxEnergyName = '-';
    const tempRanking: { nome: string, valor: number }[] = [];

    this.selectedAppliances.forEach(key => {
      const { powerW, hoursPerDay, costPerKwh } = this.usage[key];
      const energyDay = (powerW / 1000) * hoursPerDay;
      const energyMonth = energyDay * 30;
      const costMonth = energyMonth * costPerKwh;
      const costWeek = (energyDay * 7) * costPerKwh;

      weeklyCost += costWeek;
      totalEnergyWeek += energyDay * 7;
      weeklyEnergyValues.push(energyDay * 7); // Adiciona o consumo ao array

      labels.push(this.appliances[key].label);
      energyData.push(parseFloat(energyMonth.toFixed(2)));
      costData.push(parseFloat(costMonth.toFixed(2)));

      if (costMonth > maxCost) { maxCost = costMonth; topKey = this.appliances[key].label; }
      if (energyDay * 7 < minEnergy) { minEnergy = energyDay * 7; minEnergyName = this.appliances[key].label; }
      if (energyDay * 7 > maxEnergy) { maxEnergy = energyDay * 7; maxEnergyName = this.appliances[key].label; }

      tempRanking.push({ nome: this.appliances[key].label, valor: parseFloat((energyDay*7).toFixed(2)) });
    });

    this.barChartData = {
      labels,
      datasets: [
        { label: 'Energia (kWh/mês)', data: energyData, backgroundColor: '#36A2EB' },
        { label: 'Custo (R$/mês)', data: costData, backgroundColor: '#FF6384' }
      ]
    };

    const n = this.selectedAppliances.length;
    this.totalWeeklyCost = parseFloat(weeklyCost.toFixed(2));
    this.topSpender = topKey;
    this.consumoTotal = parseFloat(totalEnergyWeek.toFixed(2));
    this.maisEconomico = { nome: minEnergyName, valor: parseFloat(minEnergy.toFixed(2)) };
     // Média (Medida de Tendência Central)
    this.mediaConsumo = n > 0 ? parseFloat((totalEnergyWeek / n).toFixed(2)) : 0;
    
    // Desvio Padrão (Medida de Variabilidade)
    if (n > 1) {
      const mean = this.mediaConsumo;
      const variance = weeklyEnergyValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
      this.desvioPadraoConsumo = parseFloat(Math.sqrt(variance).toFixed(2));
      // --- CÁLCULO DO INTERVALO DE CONFIANÇA (95%) ---
      // Z-score para 95% de confiança é 1.96
      // Margem de Erro = Z * (Desvio Padrão / sqrt(n))
      const dailyCostValues = weeklyEnergyValues.map(e => (e/7) * this.tarifas[this.selectedState]);
      const dailyCostMean = this.mediaDiaria;
      const dailyCostVariance = dailyCostValues.reduce((acc, val) => acc + Math.pow(val - dailyCostMean, 2), 0) / (n - 1);
      const dailyCostStdDev = Math.sqrt(dailyCostVariance);

      const marginOfError = 1.96 * (dailyCostStdDev / Math.sqrt(n));
      const monthlyMarginOfError = marginOfError * 30; // Projetando a margem de erro para o mês

      this.projecaoMensalMin = parseFloat(Math.max(0, this.projecaoMensal - monthlyMarginOfError).toFixed(2));
      this.projecaoMensalMax = parseFloat((this.projecaoMensal + monthlyMarginOfError).toFixed(2));
    } else {
      this.desvioPadraoConsumo = 0;
      this.projecaoMensalMin = this.projecaoMensal;
      this.projecaoMensalMax = this.projecaoMensal;
    }
    this.mediaConsumo = parseFloat((totalEnergyWeek / this.selectedAppliances.length).toFixed(2));
    this.participacao = tempRanking.map(item => ({
      nome: item.nome,
      porcentagem: parseFloat(((item.valor / totalEnergyWeek) * 100).toFixed(1))
    }));
    this.mediaDiaria = n > 0 ? parseFloat((weeklyCost / 7).toFixed(2)) : 0;
    this.projecaoMensal = parseFloat((weeklyCost * 4.28).toFixed(2)); // Usando 4.28 semanas/mês para mais precisão
    this.diferenca = parseFloat((maxCost - (weeklyCost - maxCost)).toFixed(2));
    this.ranking = tempRanking.sort((a,b) => b.valor - a.valor);
    this.maiorGastao = { nome: maxEnergyName, valor: parseFloat(maxEnergy.toFixed(2)) };
    this.economia = parseFloat((maxEnergy / 7).toFixed(2));
    this.consumoPorHora = parseFloat((totalEnergyWeek / this.selectedAppliances.reduce((a,b)=>a+this.usage[b].hoursPerDay,0)).toFixed(2));
    this.generateSavingsTips();
  }

  removeAppliance(key: string) {
    this.selectedAppliances = this.selectedAppliances.filter(k => k !== key);
    delete this.usage[key];
    this.recalculate();
  }

  generateSavingsTips() {
    this.savingsTips = [];
    if (this.selectedAppliances.length === 0) return;

    // Dica genérica sobre o maior consumidor (mantida e aprimorada)
    const topSpenderKey = this.ranking.length > 0 ? this.selectedAppliances.find(k => this.appliances[k].label === this.ranking[0].nome) : undefined;
    if (topSpenderKey) {
        const applianceUsage = this.usage[topSpenderKey];
        const applianceInfo = this.appliances[topSpenderKey];
        if (applianceUsage.hoursPerDay > 1 && applianceInfo.label !== 'Geladeira') {
            const dailySavingKwh = (applianceUsage.powerW / 1000) * 0.5; // Redução de 30 min
            const monthlySavingBRL = dailySavingKwh * 30 * applianceUsage.costPerKwh;
            if (monthlySavingBRL > 1) {
                this.savingsTips.push(`Seu maior vilão é ${applianceInfo.label}. Reduzir seu uso em 30 minutos por dia pode economizar cerca de R$ ${monthlySavingBRL.toFixed(2)} por mês.`);
            }
        }
    }

    // Dicas específicas por aparelho
    this.selectedAppliances.forEach(key => {
        const applianceUsage = this.usage[key];
        const applianceInfo = this.appliances[key];
        const monthlyCost = (applianceUsage.powerW / 1000) * applianceUsage.hoursPerDay * 30 * applianceUsage.costPerKwh;

        switch(key) {
            case 'chuveiro':
                const reductionMinutes = 10;
                if (applianceUsage.hoursPerDay * 60 > reductionMinutes) { // Se o uso diário for maior que a redução proposta
                    const dailySavingKwh = (applianceUsage.powerW / 1000) * (reductionMinutes / 60);
                    const monthlySavingBRL = dailySavingKwh * 30 * applianceUsage.costPerKwh;
                    this.savingsTips.push(`O chuveiro elétrico é um grande consumidor. Reduzir ${reductionMinutes} minutos do banho diário pode gerar uma economia de R$ ${monthlySavingBRL.toFixed(2)} por mês.`);
                }
                break;

            case 'ar':
                if (applianceUsage.hoursPerDay > 2) {
                    // Aumentar 1°C no ar pode economizar de 6 a 8%. Usaremos 7%.
                    const monthlySavingBRL = monthlyCost * 0.07;
                    this.savingsTips.push(`Para o ar-condicionado, aumentar a temperatura em apenas 1°C pode reduzir o consumo em até 8%. Isso representaria uma economia de R$ ${monthlySavingBRL.toFixed(2)} por mês.`);
                }
                break;

            case 'geladeira':
                // A geladeira fica ligada 24h, mas o motor não. A média de uso do motor é ~8h/dia.
                // Dica focada na troca por um modelo mais eficiente.
                const modernFridgeWatts = 50; // Potência de uma geladeira moderna (A+++)
                if (applianceUsage.powerW > modernFridgeWatts + 50) { // Se a geladeira for significativamente mais gastona
                    const currentMonthlyKwh = (applianceUsage.powerW / 1000) * 8 * 30; // 8h de motor por dia
                    const modernMonthlyKwh = (modernFridgeWatts / 1000) * 8 * 30;
                    const monthlySavingBRL = (currentMonthlyKwh - modernMonthlyKwh) * applianceUsage.costPerKwh;
                    if (monthlySavingBRL > 10) {
                      this.savingsTips.push(`Sua geladeira consome bastante. Avalie a possibilidade de trocá-la por um modelo A+++, que pode economizar até R$ ${monthlySavingBRL.toFixed(2)} por mês.`);
                    }
                }
                break;

            case 'tv':
                // Dica sobre o modo standby
                const standbyWatts = 2;
                const standbyHours = 24 - applianceUsage.hoursPerDay;
                if (standbyHours > 8) {
                    const standbyMonthlyKwh = (standbyWatts / 1000) * standbyHours * 30;
                    const monthlySavingBRL = standbyMonthlyKwh * applianceUsage.costPerKwh;
                    if (monthlySavingBRL > 1.5) {
                        this.savingsTips.push(`Desligar a TV da tomada em vez de deixá-la em standby pode economizar cerca de R$ ${monthlySavingBRL.toFixed(2)} por mês em "energia fantasma".`);
                    }
                }
                break;

            case 'microondas':
                // Dica sobre o relógio (energia fantasma)
                const clockWatts = 4;
                const clockHours = 24 - applianceUsage.hoursPerDay;
                const clockMonthlyKwh = (clockWatts / 1000) * clockHours * 30;
                const monthlySavingBRL = clockMonthlyKwh * applianceUsage.costPerKwh;
                 if (monthlySavingBRL > 1) {
                    this.savingsTips.push(`O relógio do micro-ondas também gasta energia. Desligá-lo da tomada quando não estiver em uso pode economizar R$ ${monthlySavingBRL.toFixed(2)} por mês.`);
                }
                break;
            
            case 'lampada':
                if(applianceUsage.hoursPerDay > 4) {
                    const dailySavingKwh = (applianceUsage.powerW / 1000) * 1; // 1 hora a menos
                    const monthlySavingBRL = dailySavingKwh * 30 * applianceUsage.costPerKwh;
                    this.savingsTips.push(`Apesar do baixo consumo, cada pequena economia conta! Desligar uma lâmpada LED por 1 hora a mais todos os dias pode economizar R$ ${monthlySavingBRL.toFixed(2)} por mês.`);
                }
                break;
        }
    });
  }
}