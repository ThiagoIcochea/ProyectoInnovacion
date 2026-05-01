import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-client',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './register-client.html',
  styleUrl: './register-client.scss'
})
export class RegisterClientComponent {}