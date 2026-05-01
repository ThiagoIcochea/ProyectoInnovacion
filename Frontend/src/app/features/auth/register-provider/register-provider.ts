import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-provider',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './register-provider.html',
  styleUrl: './register-provider.scss'
})
export class RegisterProviderComponent {}