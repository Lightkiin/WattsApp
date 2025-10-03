import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-energy-dragdrop',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './energy-dragdrop.component.html',
  styleUrls: ['./energy-dragdrop.component.css']
})
export class EnergyDragdropComponent {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:5000/calcular';
  selectedAppliances: string[] = [];

  appliances: { [key: string]: { label: string; watt: number; image: string } } = {
    chuveiro: { label: 'Chuveiro Elétrico', watt: 5500, image: 'assets/appliances/chuveiro.png' },
    geladeira: { label: 'Geladeira', watt: 150, image: 'assets/appliances/geladeira.png' },
    tv: { label: 'TV', watt: 80, image: 'assets/appliances/tv.png' },
    microondas: { label: 'Micro-ondas', watt: 1000, image: 'assets/appliances/microondas.png' },
    ar: { label: 'Ar-condicionado', watt: 1200, image: 'assets/appliances/ar.png' },
    lampada: { label: 'Lâmpada LED', watt: 10, image: 'assets/appliances/lampada.png' }
  };

  // Estrutura de 'usage' atualizada para incluir quantidade e minutos
  usage: { [key: string]: { powerW: number; minutesPerDay: number; quantity: number } } = {};
  
  // Tarifa global
  globalTariff: number = 0.78;

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

  consumoTotal = 0;
  maisEconomico = { nome: '-', valor: 0 };
  mediaConsumo = 0;
  desvioPadraoConsumo = 0;
  participacao: { nome: string, porcentagem: number }[] = [];
  mediaDiaria = 0;
  projecaoMensal = 0;
  projecaoMensalMin = 0;
  projecaoMensalMax = 0;
  ranking: { nome: string, valor: number }[] = [];
  maiorGastao = { nome: '-', valor: 0 };
  savingsTips: string[] = [];

  get applianceKeys() { return Object.keys(this.appliances); }

  onDragStart(event: DragEvent, key: string) { event.dataTransfer?.setData('appliance', key); }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const key = event.dataTransfer?.getData('appliance');
    if (key && this.appliances[key] && !this.selectedAppliances.includes(key)) {
      this.selectedAppliances.push(key);
      this.usage[key] = { powerW: this.appliances[key].watt, minutesPerDay: 60, quantity: 1 };
      this.recalculate();
    }
  }

  updateTariffFromState() {
    this.globalTariff = this.tarifas[this.selectedState] || 0.78;
    this.recalculate();
  }
  
  // Função para converter minutos para uma string de horas
  getMinutesAsHours(minutes: number): string {
    if (minutes === null || isNaN(minutes)) {
      return '0.00';
    }
    return (minutes / 60).toFixed(2);
  }

  recalculate() {
    if (this.selectedAppliances.length === 0) {
      this.resetValues(); 
      this.generateSavingsTips();
      return;
    }

    // Envia ao backend
    const payload = {
      tariff: this.globalTariff,
      appliances: this.selectedAppliances.map(key => ({
        label: this.appliances[key].label,
        powerW: this.usage[key].powerW,
        minutesPerDay: this.usage[key].minutesPerDay,
        quantity: this.usage[key].quantity
      }))
    };

    // Faz a chamada POST para o backend Python
    this.http.post<any>(this.apiUrl, payload).subscribe(response => {
      // Atualiza as propriedades do componente com a resposta do backend
      this.consumoTotal = response.consumoTotal;
      this.maisEconomico = response.maisEconomico;
      this.mediaConsumo = response.mediaConsumo;
      this.desvioPadraoConsumo = response.desvioPadraoConsumo;
      this.participacao = response.participacao;
      this.mediaDiaria = response.mediaDiaria;
      this.projecaoMensal = response.projecaoMensal;
      this.projecaoMensalMin = response.projecaoMensalMin;
      this.projecaoMensalMax = response.projecaoMensalMax;
      this.ranking = response.ranking;
      this.maiorGastao = response.maiorGastao;
      this.barChartData = response.barChartData;
      
      this.generateSavingsTips();
    });
  }

  // Crie esta função para limpar os cards quando não houver aparelhos
  private resetValues() {
    this.consumoTotal = 0;
    this.maisEconomico = { nome: '-', valor: 0 };
    this.maiorGastao = { nome: '-', valor: 0 };
    this.ranking = [];
    this.mediaConsumo = 0;
    this.desvioPadraoConsumo = 0;
    this.participacao = [];
    this.mediaDiaria = 0;
    this.projecaoMensal = 0;
    this.projecaoMensalMin = 0;
    this.projecaoMensalMax = 0;
    this.barChartData = { labels: [], datasets: [] };
  }

  removeAppliance(key: string) {
    this.selectedAppliances = this.selectedAppliances.filter(k => k !== key);
    delete this.usage[key];
    this.recalculate();
  }

  generateSavingsTips() {
    this.savingsTips = [];
    if (this.selectedAppliances.length === 0) return;

    const topSpenderKey = this.ranking.length > 0 ? this.selectedAppliances.find(k => this.appliances[k].label === this.ranking[0].nome) : undefined;
    if (topSpenderKey) {
        const applianceUsage = this.usage[topSpenderKey];
        const applianceInfo = this.appliances[topSpenderKey];
        if (applianceUsage.minutesPerDay > 60 && applianceInfo.label !== 'Geladeira') {
            const dailySavingKwh = (applianceUsage.powerW / 1000) * 0.5; // Redução de 30 min
            const monthlySavingBRL = dailySavingKwh * 30 * this.globalTariff;
            if (monthlySavingBRL > 1) {
                this.savingsTips.push(`Seu maior vilão é '${applianceInfo.label}'. Reduzir seu uso em 30 minutos por dia pode economizar cerca de R$ ${monthlySavingBRL.toFixed(2)} por mês.`);
            }
        }
    }

    this.selectedAppliances.forEach(key => {
        const applianceUsage = this.usage[key];
        const monthlyCost = (applianceUsage.powerW / 1000) * (applianceUsage.minutesPerDay / 60) * applianceUsage.quantity * 30 * this.globalTariff;

        switch(key) {
            case 'chuveiro':
                const reductionMinutes = 10;
                if (applianceUsage.minutesPerDay > reductionMinutes) {
                    const dailySavingKwh = (applianceUsage.powerW / 1000) * (reductionMinutes / 60) * applianceUsage.quantity;
                    const monthlySavingBRL = dailySavingKwh * 30 * this.globalTariff;
                    this.savingsTips.push(`O chuveiro elétrico é um grande consumidor. Reduzir ${reductionMinutes} minutos do banho diário pode gerar uma economia de R$ ${monthlySavingBRL.toFixed(2)} por mês.`);
                }
                break;

            case 'ar':
                if (applianceUsage.minutesPerDay > 120) {
                    const monthlySavingBRL = monthlyCost * 0.07;
                    this.savingsTips.push(`Para o ar-condicionado, aumentar a temperatura em 1°C pode economizar ~7% de energia. Isso representaria R$ ${monthlySavingBRL.toFixed(2)} a menos na sua conta.`);
                }
                break;

            case 'geladeira':
                const modernFridgeWatts = 50;
                if (applianceUsage.powerW > modernFridgeWatts + 50) {
                    const currentMonthlyKwh = (applianceUsage.powerW / 1000) * 8 * 30; // 8h de motor por dia
                    const modernMonthlyKwh = (modernFridgeWatts / 1000) * 8 * 30;
                    const monthlySavingBRL = (currentMonthlyKwh - modernMonthlyKwh) * this.globalTariff;
                    if (monthlySavingBRL > 10) {
                      this.savingsTips.push(`Sua geladeira consome bastante. Avalie a troca por um modelo A+++, o que pode economizar até R$ ${monthlySavingBRL.toFixed(2)} por mês.`);
                    }
                }
                break;

            case 'tv':
                const standbyWatts = 2;
                const standbyHours = 24 - (applianceUsage.minutesPerDay / 60);
                if (standbyHours > 8) {
                    const standbyMonthlyKwh = (standbyWatts / 1000) * standbyHours * 30 * applianceUsage.quantity;
                    const monthlySavingBRL = standbyMonthlyKwh * this.globalTariff;
                    if (monthlySavingBRL > 1.5) {
                        this.savingsTips.push(`Desligar a(s) TV(s) da tomada pode economizar cerca de R$ ${monthlySavingBRL.toFixed(2)} por mês em "energia fantasma".`);
                    }
                }
                break;

            case 'microondas':
                const clockWatts = 4;
                const clockHours = 24 - (applianceUsage.minutesPerDay / 60);
                const clockMonthlyKwh = (clockWatts / 1000) * clockHours * 30;
                const monthlySavingBRL = clockMonthlyKwh * this.globalTariff;
                 if (monthlySavingBRL > 1) {
                    this.savingsTips.push(`O relógio do micro-ondas também gasta. Desligá-lo da tomada pode economizar R$ ${monthlySavingBRL.toFixed(2)} por mês.`);
                }
                break;
            
            case 'lampada':
                if(applianceUsage.minutesPerDay > 240) {
                    const dailySavingKwh = (applianceUsage.powerW / 1000) * 1 * applianceUsage.quantity; // 1 hora a menos
                    const monthlySavingBRL = dailySavingKwh * 30 * this.globalTariff;
                    this.savingsTips.push(`Cada pequena economia conta! Desligar a(s) lâmpada(s) por 1 hora a mais todos os dias pode economizar R$ ${monthlySavingBRL.toFixed(2)} por mês.`);
                }
                break;
        }
    });
  }
}