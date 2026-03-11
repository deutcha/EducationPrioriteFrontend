import { Component, inject, OnDestroy, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, NgModel, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../auth.service';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoginRequest, User, UserMap, UserSaveRequest } from '../../../../model/user';
import { CommonModule, NgClass } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { ToastModule } from "primeng/toast";
import { SelectModule } from 'primeng/select';
import { HasRoleDirective } from '../../has-role.directive';

@Component({
  selector: 'app-register',
  standalone: true,
   imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    CheckboxModule,
    ToastModule,
    SelectModule,
    HasRoleDirective
],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  @Input() userId: string | null = null; 
  @Input() isregister: boolean = false; 
  @Output() onSaveSuccess = new EventEmitter<void>();
  selectedRole: string = '';

  roles: {}[] = [
            { name: 'UTILISATEUR', code: 'USER' },
            { name: 'ADMINISTRATEUR', code: 'ADMIN' }
        ];

  registerForm: FormGroup;
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private subs = new Subscription();
  isvalid = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(12)]],
      confirmPassword: ['', [Validators.required]],
      role: ['USER']
    });
  }

  ngOnInit(): void {
    if (this.userId) {
      this.loadUserData();
      this.password?.setValidators([Validators.minLength(8), Validators.maxLength(12)]);
      this.registerForm.setValidators((f) => this.passwordMatchValidator(f as FormGroup));
    } else {
      this.password?.setValidators([Validators.required, (c) => this.passwordValidator(c)]);
      this.registerForm.setValidators((f) => this.passwordMatchValidator(f as FormGroup));
    }
    this.registerForm.updateValueAndValidity();
  }

  loadUserData() {
    this.userService.getUserById(this.userId!).subscribe({
      next: (user) => {
        this.registerForm.patchValue({
          email: user.email,
          username: user.username
        });
      },
      error: (error) =>{
             console.log(error)
          } 
    });
  }

  handleAction() {
    if (!this.getValid()) return;

    const { password, email, username, role } = this.registerForm.value;

    if (this.userId) {
      const updateData: Partial<UserSaveRequest> = { email, username };
      if (password){
         updateData.passwordHash = password;
      } 

      this.subs.add(
        this.userService.updateUser(this.userId, updateData).subscribe({
          next: (result : User | null | undefined) => {
            if (result) {
               this.authService.logout();
             }
           this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Utilisateur mis à jour' });
            this.onSaveSuccess.emit();
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: error.error?.errorMessage || 'Échec de la mise à jour' });
          }
        })
      );
    } else {
    
      const userSave: UserSaveRequest = { email, username, passwordHash: password, role };
      this.subs.add(
        this.authService.register(userSave).subscribe({
          next: (result : User | null | undefined) => {
             if (result && !this.isregister) {
               const userLogin: LoginRequest = { email: result?.email, password: password, role : "USER"};
               this.authService.login(userLogin).subscribe(
                    {
                      next : (result : UserMap | null | undefined) => {
                        
                        this.router.navigate(['/child/dasboard']);
                      },
                     error: (error) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: error.error?.errorMessage || 'echec de la connexion' })
                      
                    })
             }else{
              this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Compte créé avec succès' });
              this.onSaveSuccess.emit();
            }
          },
          error: (error) => {
            console.log(error,  error.error?.message);
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: error.error?.errorMessage || 'Échec de la création' })
          }
        })
      );
    }
  }
  
  getValid() {
    if (this.userId) {
 
        return this.registerForm.get('email')?.valid && this.registerForm.get('username')?.valid;
    }
    return this.registerForm.valid && 
           this.passwordValidator(this.password!) == null && 
           this.passwordMatchValidator(this.registerForm) == null;
  }

  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    if (!value) return null;
    const errors: any = {};

    if (value.length < 8 || value.length > 12) {
      errors.length = true;
    }
 
    if (!/[A-Z]/.test(value)) {
      errors.uppercase = true;
    }

    if (!/[0-9]/.test(value)) {
      errors.number = true;
    }

    if (!/[!@#$%^&*,;?.:]/.test(value)) {
      errors.special = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  passwordMatchValidator(form: FormGroup): ValidationErrors | null {

    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword 
      ? { passwordMismatch: true } 
      : null;
  }

  get password() {
    return this.registerForm.get('password');
  }

  hasValidLength(): boolean {
    const pass = this.password?.value;
    return pass && pass.length >= 8 && pass.length <= 12;

  }

  hasUpperCase(): boolean {
    const pass = this.password?.value;
    return pass && /[A-Z]/.test(pass);

  }

  hasNumber(): boolean {
    const pass = this.password?.value;
    return pass && /[0-9]/.test(pass);
  }

  hasSpecialChar(): boolean {
    const pass = this.password?.value;
    return pass && /[!@#$%^&*,;?.:]/.test(pass);
  }

  getErrorMessage(field: string): string {

    const control = this.registerForm.get(field);
    if (!control?.errors || !control.touched) return '';
    const errors = control.errors;
    if (errors['required']) return 'Ce champ est requis';
    if (errors['email']) return 'Email invalide';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} caractères`;
    if (errors['length']) return '8-12 caractères requis';
    if (errors['uppercase']) return '1 majuscule requise';
    if (errors['number']) return '1 chiffre requis';
    if (errors['special']) return '1 caractère spécial requis';

    return '';
  }

  hasError(field: string): boolean {
    const control = this.registerForm.get(field);

    return control ? (control.invalid && control.touched) : false;
  }

  getLengthIcon(): string {
    return this.hasValidLength() ? 'pi pi-check' : 'pi pi-times';
  }

  getUpperCaseIcon(): string {
    return this.hasUpperCase() ? 'pi pi-check' : 'pi pi-times';
  }

  getNumberIcon(): string {
    return this.hasNumber() ? 'pi pi-check' : 'pi pi-times';
  }

  getSpecialCharIcon(): string {
    return this.hasSpecialChar() ? 'pi pi-check' : 'pi pi-times';
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}