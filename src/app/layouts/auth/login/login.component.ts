import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service';
import { LoginRequest, UserMap } from '../../../model/user';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    ToastModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy{
  
  private subsLogin : Subscription | null = null;
  private loginUser = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  loginForm: FormGroup;
  rememberMe = false;
  showPassword: boolean = false;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({

      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });

    console.log(this.loginUser.user());
  }

  login() {
    if (this.loginForm.invalid) {

      return;
    }
    const credential : LoginRequest = {
      email : this.loginForm.value.email,
      password : this.loginForm.value.password,
      role : "USER"
    
    } 
    this.subsLogin = this.loginUser.login(credential).subscribe(
     {
       next : (result : UserMap | null | undefined) => {
       
        this.router.navigate(['/child/dasboard']);
      },
       error: (error) => {
        console.log(error)
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: error.error?.errorMessage || 'echec de la connexion' });
      }
     })
    
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    
    if (!control?.errors || !control.touched) return '';
    
    const errors = control.errors;
    
    if (errors['required']) return 'Ce champ est requis';
    if (errors['email']) return 'Email invalide';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères`;
    
    return '';
  }

  hasError(field: string): boolean {
    const control = this.loginForm.get(field);
    return control ? (control.invalid && control.touched) : false;
  }

    ngOnDestroy(): void {
    this.subsLogin?.unsubscribe();
  }

 
}