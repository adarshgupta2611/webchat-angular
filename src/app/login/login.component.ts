import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  constructor(private router: Router) {}

  handleFormClick(form: NgForm) {
    if(form.valid){
      let user = form.value.user;
      let queryParams = {"user": user}
      this.router.navigate(['/chat'], { queryParams});
    }
  }
}
