import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageContact } from '../../model/model';
import { JournalManagerService } from '../services/journal-manager-service.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    InputTextModule, 
    TextareaModule, 
    ButtonModule, 
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './contact.component.html'
})
export class ContactComponent implements OnDestroy{
  
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private service = inject(JournalManagerService);
  private subs = new Subscription();

  loadingBtn: boolean = false;

  contactForm: FormGroup = this.fb.group({
    nom: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    sujet: ['', [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });

  onSubmit() {
    if (this.contactForm.valid) {
      const data: MessageContact = this.contactForm.value;
      this.loadingBtn = true;
      this.subs.add(
        this.service.sendMessage(data).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Message envoyé avec succès !'
            });
            this.loadingBtn = false;
          },
          error: (error) => {
            console.log('Erreur lors de l\'envoi du message:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Une erreur est survenue lors de l\'envoi du message.'
            });
            this.loadingBtn = false;
          }
        })
      );
      
      this.contactForm.reset();
    } else {
      this.contactForm.markAllAsTouched();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}