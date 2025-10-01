import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-energy-dragdrop',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h2>Arraste a imagem do eletrodoméstico para o retângulo</h2>

      <div
        class="dropzone"
        (dragover)="$event.preventDefault()"
        (drop)="onDrop($event)"
        (click)="fileInput.click()">
        <input #fileInput type="file" accept="image/*" (change)="onFileSelected($event)" hidden />

        @if (!imageSrc) {
          <p>Arraste e solte aqui ou clique para escolher uma imagem</p>
        }

        @if (imageSrc) {
          <div class="preview-area">
            <img [src]="imageSrc" alt="Imagem" />
            <div class="info">
              <p><strong>Arquivo:</strong> {{fileName}}</p>
              <p><strong>Eletrodoméstico (detectado):</strong>
                <select [(ngModel)]="detectedApplianceKey" (change)="onApplianceChanged()">
                  @for (key of applianceKeys; track key) {
                    <option [value]="key">{{appliances[key].label}}</option>
                  }
                </select>
              </p>

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
              <p>{{energyPerDayKwh | number:'1.3-3'}} kWh / dia</p>
              <p>{{energyPerMonthKwh | number:'1.3-3'}} kWh / mês (30 dias)</p>
              <p><strong>Custo estimado:</strong> {{costPerMonth | number:'1.2-2'}} BRL / mês</p>

              <button (click)="clear()">Remover imagem</button>
            </div>
          </div>
        }
      </div>

      <p class="note">
        Dica: o componente tenta identificar o eletrodoméstico pelo nome do arquivo (ex: geladeira.jpg, microondas.png, tv.png).
        Se a identificação estiver errada, selecione manualmente no dropdown e ajuste potência/horas.
      </p>
    </div>
  `,
  styles: [
    `:host{display:block;font-family:Arial,Helvetica,sans-serif}
    .container{max-width:900px;margin:18px auto;padding:12px}
    .dropzone{border:2px dashed #bbb;border-radius:8px;padding:20px;min-height:200px;display:flex;align-items:center;justify-content:center;cursor:pointer}
    .dropzone p{margin:0;color:#666}
    .preview-area{display:flex;gap:16px;align-items:flex-start}
    img{max-width:220px;max-height:180px;border-radius:6px;object-fit:contain}
    .info{flex:1}
    input[type=number]{width:110px}
    select{min-width:180px}
    .note{color:#444;font-size:13px;margin-top:8px}
    button{margin-top:8px;padding:6px 10px;border-radius:6px;border:1px solid #888;background:#f5f5f5}
    `]
})
export class EnergyDragdropComponent {
  imageSrc: string | null = null;
  fileName: string | null = null;

  detectedApplianceKey: string = '';
  powerW: number = 1000;
  hoursPerDay: number = 1;
  costPerKwh: number = 1.0;

  energyPerDayKwh: number = 0;
  energyPerMonthKwh: number = 0;
  costPerMonth: number = 0;

  appliances: { [key: string]: { label: string; watt: number } } = {
    geladeira: { label: 'Geladeira / Refrigerador (média)', watt: 150 },
    tv: { label: 'TV (LED) - 32" (média)', watt: 80 },
    tv_grande: { label: 'TV (LED) - 55" (média)', watt: 120 },
    microondas: { label: 'Micro-ondas', watt: 1000 },
    ferro: { label: 'Ferro de passar', watt: 1200 },
    lavadora: { label: 'Máquina de lavar', watt: 500 },
    secadora: { label: 'Secadora', watt: 3000 },
    ar_condicionado: { label: 'Ar condicionado (split - média)', watt: 1200 },
    computador: { label: 'Computador desktop', watt: 200 },
    forno: { label: 'Forno elétrico', watt: 2000 },
    lampada: { label: 'Lâmpada (LED) - por unidade', watt: 10 }
  };

  get applianceKeys() {
    return Object.keys(this.appliances);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const dt = event.dataTransfer;
    if (!dt) return;
    const file = dt.files && dt.files[0];
    if (file) this.loadFile(file);
  }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.loadFile(input.files[0]);
  }

  loadFile(file: File) {
    this.fileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      this.imageSrc = reader.result as string;
      const inferred = this.inferApplianceFromFilename(file.name);
      if (inferred) {
        this.detectedApplianceKey = inferred;
        this.powerW = this.appliances[inferred].watt;
      } else {
        this.detectedApplianceKey = Object.keys(this.appliances)[0];
        this.powerW = this.appliances[this.detectedApplianceKey].watt;
      }
      this.recalculate();
    };
    reader.readAsDataURL(file);
  }

  inferApplianceFromFilename(name: string): string | null {
    const n = name.toLowerCase();
    if (n.includes('geladeira') || n.includes('refrigerador') || n.includes('fridge')) return 'geladeira';
    if (n.includes('tv') || n.includes('televisao') || n.includes('televisão')) return 'tv';
    if (n.includes('55') && n.includes('tv')) return 'tv_grande';
    if (n.includes('micro') || n.includes('microondas')) return 'microondas';
    if (n.includes('ferro')) return 'ferro';
    if (n.includes('lav') || n.includes('lava')) return 'lavadora';
    if (n.includes('sec') && n.includes('d')) return 'secadora';
    if (n.includes('ar') && n.includes('cond')) return 'ar_condicionado';
    if (n.includes('pc') || n.includes('desktop') || n.includes('computador')) return 'computador';
    if (n.includes('forno')) return 'forno';
    if (n.includes('lamp') || n.includes('led')) return 'lampada';
    if (n.includes('oven')) return 'forno';
    return null;
  }

  onApplianceChanged() {
    if (this.detectedApplianceKey && this.appliances[this.detectedApplianceKey]) {
      this.powerW = this.appliances[this.detectedApplianceKey].watt;
      this.recalculate();
    }
  }

  recalculate() {
    this.energyPerDayKwh = (this.powerW / 1000) * (this.hoursPerDay || 0);
    this.energyPerMonthKwh = this.energyPerDayKwh * 30;
    this.costPerMonth = this.energyPerMonthKwh * (this.costPerKwh || 0);
  }

  clear() {
    this.imageSrc = null;
    this.fileName = null;
    this.detectedApplianceKey = '';
    this.powerW = 1000;
    this.hoursPerDay = 1;
    this.energyPerDayKwh = 0;
    this.energyPerMonthKwh = 0;
    this.costPerMonth = 0;
  }
}
