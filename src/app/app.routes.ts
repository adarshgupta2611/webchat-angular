import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { ChatRoomComponent } from './chat-room/chat-room.component';

export const routes: Routes = [
    {
        path: "",
        component : HomeComponent
    },
    {
        path: "login",
        component : LoginComponent
    },
    {
        path : "chat",
        component : ChatRoomComponent
    }
];
