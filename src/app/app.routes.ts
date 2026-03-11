import { Routes } from '@angular/router';
import { LoginComponent } from './layouts/auth/login/login.component';
import { RegisterComponent } from './layouts/auth/register/register/register.component';
import { authGuard } from './layouts/auth/auth.guard';
import { ChildComponent } from './child/child.component';
import { hasRoleGuard } from './layouts/auth/has-role.guard';

export const routes: Routes = [

  {
    path: '',
    redirectTo: '/child/dasboard',
    pathMatch: 'full'
  },
  
  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'register',
    component: RegisterComponent
  },
 
{
  path: 'child',
  component: ChildComponent,
  children: [
    { 
      path: 'dasboard', 
      loadComponent: () => import('./layouts/dashbord/dashbord/dashbord.component').then(m => m.DashboardComponent)
    },
    {
      path: '',
      canActivate: [authGuard],
      children: [
        { 
          path: 'rubrique', 
          loadComponent: () => import('./page/rubrique/rubrique.component').then(m => m.RubriqueComponent)
        },
        { 
          path: 'journal', 
          loadComponent: () => import('./page/journal/journal.component').then(m => m.JournalComponent)
        },
        { 
          path: 'article', 
          loadComponent: () => import('./page/article/article.component').then(m => m.ArticleComponent)
        },
        { 
          path: 'article/:rubriqueId/:rubriqueNom', 
          loadComponent: () => import('./page/article/article.component').then(m => m.ArticleComponent)
        },
        { 
          path: 'articles/lire/:slug', 
          loadComponent: () => import('./page/lire-article/lire-article.component').then(m => m.LireArticleComponent)
        },
        { 
          path: 'utilisateur', 
          loadComponent: () => import('./layouts/user-list/user-list.component').then(m => m.UserListComponent),
          canActivate: [hasRoleGuard]
        },
        { 
          path: 'contact', 
          loadComponent: () => import('./layouts/contact/contact.component').then(m => m.ContactComponent)
        }
      ]
    }
  ],
},


  {
    path: '**',
    component: LoginComponent
  }
];
