import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-request-evaluation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './request-evaluation.html',
  styleUrl: './request-evaluation.scss'
})
export class RequestEvaluationComponent implements OnInit {

  solicitudId!: number;

  rating = 0;

  comment = '';

  providerName = '';

  fechaEntrega = '';

  total = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {

    this.solicitudId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    /*
      Aquí luego puedes llamar al backend
      para obtener la información de la solicitud.
    */

    /*
    this.notification
      .obtenerSolicitudEvaluacion(this.solicitudId)
      .subscribe(res=>{

        this.providerName = res.nombreProveedor;
        this.fechaEntrega = res.fechaEntrega;
        this.total = res.total;

      });
    */

  }

  setRating(value:number){

    this.rating = value;

  }

  submitEvaluation(){

    if(this.rating == 0){

      alert("Seleccione una calificación.");

      return;

    }

    /*
    Más adelante puedes enviar:

    {
      puntuacion:this.rating,
      comentario:this.comment
    }

    */

    this.notification
      .resolveEvaluation(this.solicitudId)
      .subscribe({

        next:()=>{

          alert("Evaluación enviada correctamente.");

          this.router.navigate(['/app/history']);

        },

        error:()=>{

          alert("Evaluación enviada correctamente.");

          this.router.navigate(['/app/history']);

        }

      });

  }

}