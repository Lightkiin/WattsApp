import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // necessário para ngModel
import { EnergyDragdropComponent } from './energy-dragdrop.component';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,              // adiciona suporte ao ngModel
    EnergyDragdropComponent,
    CommonModule,
    FormsModule,
    NgChartsModule   // importa seu componente dragdrop
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'WattsApp';
}
