import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayoutComponent {
  constructor(public router: Router) {}

  get isAdmin(): boolean {
    return this.router.url.startsWith('/app/admin');
  }

  get isProvider(): boolean {
    return this.router.url.startsWith('/app/provider');
  }

  get isClient(): boolean {
    return !this.isAdmin && !this.isProvider;
  }
}