import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router , RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {


  email: string = '';
  password: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    const body = {
      correo: this.email,
      password: this.password
    };

    

    this.http.post('http://localhost:8080/api/auth/login', body)
      .subscribe({
        next: (res: any) => {
         
          localStorage.setItem('token', res.token);

          
          this.router.navigate(['/app']);
        },
        error: (err) => {
          console.error('Error login', err);
          alert('Credenciales incorrectas');
        }
      });
  }

}