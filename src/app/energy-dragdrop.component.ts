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
    geladeira: { label: 'Geladeira', watt: 150, image: 'assets/appliances/geladeira.png' },
    tv: { label: 'TV', watt: 80, image: 'assets/appliances/tv.png' },
    microondas: { label: 'Micro-ondas', watt: 1000, image: 'assets/appliances/microondas.png' },
    ferro: { label: 'Ferro de passar', watt: 1200, image: 'assets/appliances/ferro.png' },
    ar: { label: 'Ar-condicionado', watt: 1200, image: 'assets/appliances/ar.png' },
    lampada: { label: 'Lâmpada LED', watt: 10, image: 'assets/appliances/lampada.png' }
  };

  usage: { [key: string]: { powerW: number; hoursPerDay: number; costPerKwh: number } } = {};

  barChartData: any = { labels: [], datasets: [] };
  barChartOptions: any = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: '#ffffff', font: { size: 18, weight: 'bold' } }
      },
      tooltip: {
        bodyFont: { size: 24, weight: 'bold' },
        titleFont: { size: 20, weight: 'bold' }
      }
    },
    scales: {
      x: { ticks: { color: '#ffffff', font: { size: 16, weight: 'bold' } }, grid: { color: '#444' } },
      y: { ticks: { color: '#ffffff', font: { size: 16, weight: 'bold' } }, grid: { color: '#444' } }
    }
  };

  // Variáveis para os insights
  totalWeeklyCost: number = 0;
  topSpender: string = '-';
  consumoTotal: number = 0;
  maisEconomico: { nome: string, valor: number } = { nome: '-', valor: 0 };
  mediaConsumo: number = 0;
  participacao: { nome: string, porcentagem: number }[] = [];
  mediaDiaria: number = 0;
  projecaoMensal: number = 0;
  diferenca: number = 0;
  ranking: { nome: string, valor: number }[] = [];
  maiorGastao: { nome: string, valor: number } = { nome: '-', valor: 0 };
  economia: number = 0;
  consumoPorHora: number = 0;

  get applianceKeys() {
    return Object.keys(this.appliances);
  }

  onDragStart(event: DragEvent, key: string) {
    event.dataTransfer?.setData('appliance', key);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const key = event.dataTransfer?.getData('appliance');
    if (key && this.appliances[key] && !this.selectedAppliances.includes(key)) {
      this.selectedAppliances.push(key);
      this.usage[key] = { powerW: this.appliances[key].watt, hoursPerDay: 1, costPerKwh: 1 };
      this.recalculate();
    }
  }

  recalculate() {
    const labels: string[] = [];
    const energyData: number[] = [];
    const costData: number[] = [];

    let weeklyCost = 0;
    let maxCost = 0;
    let topKey = '-';

    let totalEnergyWeek = 0;
    let minEnergy = Infinity;
    let minEnergyName = '-';
    let maxEnergy = 0;
    let maxEnergyName = '-';

    const tempRanking: { nome: string, valor: number }[] = [];

    this.selectedAppliances.forEach(key => {
      const { powerW, hoursPerDay, costPerKwh } = this.usage[key];

      const energyDay = (powerW / 1000) * hoursPerDay;
      const energyMonth = energyDay * 30;
      const costMonth = energyMonth * costPerKwh;
      const costWeek = (energyDay * 7) * costPerKwh;

      weeklyCost += costWeek;
      totalEnergyWeek += energyDay * 7;

      labels.push(this.appliances[key].label);
      energyData.push(parseFloat(energyMonth.toFixed(2)));
      costData.push(parseFloat(costMonth.toFixed(2)));

      if (costMonth > maxCost) { maxCost = costMonth; topKey = this.appliances[key].label; }

      if (energyDay * 7 < minEnergy) { minEnergy = energyDay * 7; minEnergyName = this.appliances[key].label; }
      if (energyDay * 7 > maxEnergy) { maxEnergy = energyDay * 7; maxEnergyName = this.appliances[key].label; }

      tempRanking.push({ nome: this.appliances[key].label, valor: parseFloat((energyDay*7).toFixed(2)) });
    });

    // Bar Chart
    this.barChartData = {
      labels,
      datasets: [
        { label: 'Energia (kWh/mês)', data: energyData, backgroundColor: '#36A2EB' },
        { label: 'Custo (R$/mês)', data: costData, backgroundColor: '#FF6384' }
      ]
    };

    // Insights
    this.totalWeeklyCost = parseFloat(weeklyCost.toFixed(2));
    this.topSpender = topKey;

    this.consumoTotal = parseFloat(totalEnergyWeek.toFixed(2));
    this.maisEconomico = { nome: minEnergyName, valor: parseFloat(minEnergy.toFixed(2)) };
    this.mediaConsumo = parseFloat((totalEnergyWeek / this.selectedAppliances.length).toFixed(2));
    this.participacao = tempRanking.map(item => ({
      nome: item.nome,
      porcentagem: parseFloat(((item.valor / totalEnergyWeek) * 100).toFixed(1))
    }));
    this.mediaDiaria = parseFloat((weeklyCost / 7).toFixed(2));
    this.projecaoMensal = parseFloat((weeklyCost * 4).toFixed(2));
    this.diferenca = parseFloat((maxCost - (weeklyCost - maxCost)).toFixed(2));
    this.ranking = tempRanking.sort((a,b) => b.valor - a.valor);
    this.maiorGastao = { nome: maxEnergyName, valor: parseFloat(maxEnergy.toFixed(2)) };
    this.economia = parseFloat((maxEnergy / 7).toFixed(2)); // economia de 1h
    this.consumoPorHora = parseFloat((totalEnergyWeek / this.selectedAppliances.reduce((a,b)=>a+this.usage[b].hoursPerDay,0)).toFixed(2));
  }

  removeAppliance(key: string) {
    this.selectedAppliances = this.selectedAppliances.filter(k => k !== key);
    delete this.usage[key];
    this.recalculate();
  }
}
