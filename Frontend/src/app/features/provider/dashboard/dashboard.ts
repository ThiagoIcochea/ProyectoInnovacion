// Backend touchpoint: provider dashboard metrics and recent request snapshot.
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductoMasVendido } from './producto-mas-vendido.model'; 
import { ProveedorDashboardService } from './dashboard.service';
import { DashboardResponse } from './dashboard-response.model';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class ProviderDashboardComponent implements OnInit  {
  
  
  
  dashboard?: DashboardResponse;

  cargando = false;
  error = false;

private graficoIngresos?: Chart;
  private graficoProductos?: Chart;


  constructor(
    private dashboardService: ProveedorDashboardService
  ) { }

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {

    this.cargando = true;
    this.error = false;

    this.dashboardService.getDashboard()
      .subscribe({

        next: (response: DashboardResponse) => {

          this.dashboard = response;
           console.log(
  JSON.stringify(response, null, 2)
);

          this.cargando = false;

          // Aquí luego puedes crear tus gráficos
          this.crearGraficoIngresos();
          //this.crearGraficoProductos();

        },

        error: (err) => {

          console.error(err);

          this.error = true;
          this.cargando = false;

        }

      });
    
    }


   private crearGraficoIngresos():void{



    if (!this.dashboard) {
        return;
    }

    const labels =
        this.dashboard.graficoIngresos.map(
            x => x.mes
        );

    const valores =
        this.dashboard.graficoIngresos.map(
            x => x.ingresos
        );

    if (this.graficoIngresos) {
        this.graficoIngresos.destroy();
    }

    this.graficoIngresos = new Chart("graficoIngresos", {

        type: "line",

        data: {

            labels,

            datasets: [

                {

                    label: "Ingresos",

                    data: valores,

                    borderWidth: 3,

                    tension: 0.3,

                    fill: false

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false

        }

    });

}





   


  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  metrics = [
    {
      title: 'Solicitudes recibidas',
      value: '1,248',
      change: '+12% vs. mes anterior',
      icon: '▣'
    },
    {
      title: 'Solicitudes aceptadas',
      value: '842',
      change: '+5% vs. mes anterior',
      icon: '✓'
    },
    {
      title: 'Ingresos estimados',
      value: '$142,500.00',
      change: '+18% vs. mes anterior',
      icon: '$'
    }
  ];

  recentRequests = [
    {
      id: 'RFQ-2026-0891',
      client: 'TechNova S.A.',
      location: 'Lima, Perú',
      products: '14 unidades / 3 ítems',
      date: 'Hoy, 10:45 AM',
      status: 'Nueva'
    },
    {
      id: 'RFQ-2026-0888',
      client: 'Corporación Andes',
      location: 'Bogotá, Colombia',
      products: '45 unidades / 8 ítems',
      date: 'Ayer, 16:30 PM',
      status: 'Nueva'
    },
    {
      id: 'RFQ-2026-0875',
      client: 'Fintech Nexus',
      location: 'Santiago, Chile',
      products: '5 unidades / 2 ítems',
      date: '12 Abr 2026',
      status: 'En evaluación'
    }
  ];
}