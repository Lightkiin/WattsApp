import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-energy-dragdrop',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h2>Arraste o eletrodoméstico para o retângulo</h2>

      <!-- Galeria de imagens -->
      <div class="gallery">
        <div 
          class="appliance" 
          *ngFor="let key of applianceKeys" 
          draggable="true"
          (dragstart)="onDragStart($event, key)">
          <img [src]="appliances[key].image" [alt]="appliances[key].label" />
          <p>{{ appliances[key].label }}</p>
        </div>
      </div>

      <!-- Área de drop -->
      <div 
        class="dropzone" 
        (dragover)="$event.preventDefault()" 
        (drop)="onDrop($event)">
        
        <ng-container *ngIf="!detectedApplianceKey">
          <p>Arraste aqui</p>
        </ng-container>

        <div *ngIf="detectedApplianceKey" class="preview-area">
          <img [src]="appliances[detectedApplianceKey].image" [alt]="appliances[detectedApplianceKey].label" />
          <div class="info">
            <p><strong>{{ appliances[detectedApplianceKey].label }}</strong></p>

            <p><strong>Potência (W):</strong> 
              <input type="number" [(ngModel)]="powerW" (input)="recalculate()" /> W
            </p>
            <p><strong>Uso por dia:</strong> 
              <input type="number" [(ngModel)]="hoursPerDay" (input)="recalculate()" /> horas/dia
            </p>
            <p><strong>Tarifa / kWh:</strong> 
              <input type="number" [(ngModel)]="costPerKwh" (input)="recalculate()" /> BRL
            </p>

            <hr />
            <p><strong>Consumo:</strong></p>
            <p>{{energyPerDayKwh | number:'1.2-2'}} kWh / dia</p>
            <p>{{energyPerMonthKwh | number:'1.2-2'}} kWh / mês (30 dias)</p>
            <p><strong>Custo estimado:</strong> {{costPerMonth | number:'1.2-2'}} BRL / mês</p>

            <button (click)="clear()">Remover</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 900px; margin: 18px auto; font-family: Arial, sans-serif; }
    .gallery { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .appliance { text-align: center; cursor: grab; width: 120px; }
    .appliance img { width: 100px; height: 100px; object-fit: contain; }
    .dropzone { border: 2px dashed #888; padding: 30px; border-radius: 8px; min-height: 220px; display: flex; align-items: center; justify-content: center; }
    .preview-area { display: flex; gap: 20px; align-items: flex-start; }
    .preview-area img { width: 150px; height: 150px; object-fit: contain; border-radius: 6px; }
    .info { flex: 1; }
    input { margin: 3px 0; }
    button { margin-top: 8px; padding: 6px 10px; border-radius: 6px; border: 1px solid #888; background: #f5f5f5 }
  `]
})
export class EnergyDragdropComponent {
  detectedApplianceKey: string | null = null;
  powerW: number = 0;
  hoursPerDay: number = 1;
  costPerKwh: number = 1;

  energyPerDayKwh: number = 0;
  energyPerMonthKwh: number = 0;
  costPerMonth: number = 0;

  appliances: { [key: string]: { label: string; watt: number; image: string } } = {
    geladeira: { label: 'Geladeira', watt: 150, image: '/assets/appliances/geladeira.png' },
    tv: { label: 'TV', watt: 80, image: 'assets/appliances/tv.png' },
    microondas: { label: 'Micro-ondas', watt: 1000, image: 'assets/appliances/microondas.png' },
    ferro: { label: 'Ferro de passar', watt: 1200, image: 'assets/appliances/ferro.png' },
    ar: { label: 'Ar-condicionado', watt: 1200, image: 'assets/appliances/ar.png' },
    lampada: { label: 'Lâmpada LED', watt: 10, image: 'assets/appliances/lampada.png' }
  };

  get applianceKeys() {
    return Object.keys(this.appliances);
  }

  onDragStart(event: DragEvent, key: string) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('appliance', key);
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const key = event.dataTransfer?.getData('appliance');
    if (key && this.appliances[key]) {
      this.detectedApplianceKey = key;
      this.powerW = this.appliances[key].watt;
      this.recalculate();
    }
  }

  recalculate() {
    this.energyPerDayKwh = (this.powerW / 1000) * (this.hoursPerDay || 0);
    this.energyPerMonthKwh = this.energyPerDayKwh * 30;
    this.costPerMonth = this.energyPerMonthKwh * (this.costPerKwh || 0);
  }

  clear() {
    this.detectedApplianceKey = null;
    this.powerW = 0;
    this.hoursPerDay = 1;
    this.costPerKwh = 1;
    this.energyPerDayKwh = 0;
    this.energyPerMonthKwh = 0;
    this.costPerMonth = 0;
  }
}
