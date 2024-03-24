import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { User } from './user.interface';

@Injectable({
  providedIn: 'root',
})
export class ChatRoomService {
  private privateChats$: BehaviorSubject<Map<string, any[]>>;
  private publicChats$: BehaviorSubject<any[]>;
  private userData$: BehaviorSubject<User>;

  constructor() {
    this.privateChats$ = new BehaviorSubject<Map<string, any[]>>(
      new Map<string, any[]>()
    );
    this.publicChats$ = new BehaviorSubject<any[]>([]);

    this.userData$ = new BehaviorSubject<User>({
      username: '',
      receiverName: '',
      connected: false,
      message: '',
    });
  }

  getPrivateChats() {
    return this.privateChats$.asObservable();
  }

  getPublicChats() {
    return this.publicChats$.asObservable();
  }

  getUserData() {
    return this.userData$.asObservable();
  }

  setUserData(userData: User) {
    this.userData$.next(userData);
  }

  addPrivateMessage(senderName: string, messageArr: any[]) {
    const previousMap = this.privateChats$.getValue();
    previousMap.set(senderName, messageArr);

    this.privateChats$.next(previousMap);
  }

  addPrivateMessageToSender(senderName: string, message: any) {
    const previousMap = this.privateChats$.getValue();
    previousMap.get(senderName).push(message);
    this.privateChats$.next(previousMap);
  }

  addPublicMessage(message: string) {
    const currPublicMsg = this.publicChats$.getValue();
    currPublicMsg.push(message);
    this.publicChats$.next(currPublicMsg);
  }
}
