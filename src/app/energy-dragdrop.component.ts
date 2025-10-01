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
  // Lista de eletrodomésticos adicionados
  selectedAppliances: string[] = [];

  // Configuração de cada eletrodoméstico
  appliances: { [key: string]: { label: string; watt: number; image: string } } = {
    geladeira: { label: 'Geladeira', watt: 150, image: 'assets/appliances/geladeira.png' },
    tv: { label: 'TV', watt: 80, image: 'assets/appliances/tv.png' },
    microondas: { label: 'Micro-ondas', watt: 1000, image: 'assets/appliances/microondas.png' },
    ferro: { label: 'Ferro de passar', watt: 1200, image: 'assets/appliances/ferro.png' },
    ar: { label: 'Ar-condicionado', watt: 1200, image: 'assets/appliances/ar.png' },
    lampada: { label: 'Lâmpada LED', watt: 10, image: 'assets/appliances/lampada.png' }
  };

  // Guarda os valores individuais de cada item
  usage: { [key: string]: { powerW: number; hoursPerDay: number; costPerKwh: number } } = {};

  // Gráficos
  barChartData = {
    labels: ['Diário', 'Mensal'],
    datasets: [{ label: 'Consumo (kWh)', data: [0, 0], backgroundColor: ['#36A2EB', '#FF6384'] }]
  };

  pieChartData = {
    labels: [] as string[],
    datasets: [{ data: [] as number[], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'] }]
  };

  get applianceKeys() {
    return Object.keys(this.appliances);
  }

  // === Drag & Drop ===
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

  // === Recalcula todos os gráficos ===
  recalculate() {
    let totalDaily = 0;
    let totalMonthly = 0;
    const pieData: number[] = [];
    const pieLabels: string[] = [];

    this.selectedAppliances.forEach(key => {
      const { powerW, hoursPerDay, costPerKwh } = this.usage[key];
      const energyDay = (powerW / 1000) * hoursPerDay;
      const energyMonth = energyDay * 30;
      totalDaily += energyDay;
      totalMonthly += energyMonth;

      pieData.push(energyMonth * costPerKwh);
      pieLabels.push(this.appliances[key].label);
    });

    this.barChartData.datasets[0].data = [totalDaily, totalMonthly];
    this.pieChartData.datasets[0].data = pieData;
    this.pieChartData.labels = pieLabels;
  }

  // === Remove eletrodoméstico específico ===
  removeAppliance(key: string) {
    this.selectedAppliances = this.selectedAppliances.filter(k => k !== key);
    delete this.usage[key];
    this.recalculate();
  }
}
