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

  barChartData: any = {
    labels: [] as string[],
    datasets: []
  };

  barChartOptions: any = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#ffffff', // Legenda branca
          font: {
            size: 16,       // Legenda maior
            weight: 'bold'
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#ffffff', font: { size: 14, weight: 'bold' } },
        grid: { color: '#444' }
      },
      y: {
        ticks: { color: '#ffffff', font: { size: 14, weight: 'bold' } },
        grid: { color: '#444' }
      }
    }
  };

  totalWeeklyCost: number = 0;
  topSpender: string = '-';

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
      this.usage[key] = {
        powerW: this.appliances[key].watt,
        hoursPerDay: 1,
        costPerKwh: 1
      };
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

    this.selectedAppliances.forEach(key => {
      const { powerW, hoursPerDay, costPerKwh } = this.usage[key];

      // consumo diário em kWh
      const energyDay = (powerW / 1000) * hoursPerDay;
      const energyMonth = energyDay * 30;
      const costMonth = energyMonth * costPerKwh;

      // custo semanal acumulando todos os eletrodomésticos
      const costWeek = (energyDay * 7) * costPerKwh;
      weeklyCost += costWeek;

      labels.push(this.appliances[key].label);
      energyData.push(parseFloat(energyMonth.toFixed(2)));
      costData.push(parseFloat(costMonth.toFixed(2)));

      if (costMonth > maxCost) {
        maxCost = costMonth;
        topKey = this.appliances[key].label;
      }
    });

    this.barChartData = {
      labels,
      datasets: [
        { label: 'Energia (kWh/mês)', data: energyData, backgroundColor: '#36A2EB' },
        { label: 'Custo (R$/mês)', data: costData, backgroundColor: '#FF6384' }
      ]
    };

    this.totalWeeklyCost = parseFloat(weeklyCost.toFixed(2));
    this.topSpender = topKey;
  }

  removeAppliance(key: string) {
    this.selectedAppliances = this.selectedAppliances.filter(k => k !== key);
    delete this.usage[key];
    this.recalculate();
  }
}
