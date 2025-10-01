import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // necessário para ngModel
import { EnergyDragdropComponent } from './energy-dragdrop.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,              // adiciona suporte ao ngModel
    EnergyDragdropComponent   // importa seu componente dragdrop
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'WattsApp';
}
