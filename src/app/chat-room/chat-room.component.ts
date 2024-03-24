import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import * as Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatRoomService } from '../chat-room.service';
import { Subscription } from 'rxjs';
import { User } from '../user.interface';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  privateChats: Map<string, any[]>;
  publicChats: any[];
  tab: string = 'CHATROOM';

  userData: User;
  stompClient: Stomp.Client;
  subscriptionArr: Subscription[] = [];

  constructor(
    private chatService: ChatRoomService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscriptionArr.push(
      this.chatService
        .getPrivateChats()
        .subscribe((chats) => (this.privateChats = chats))
    );
    this.subscriptionArr.push(
      this.chatService
        .getPublicChats()
        .subscribe((chats) => (this.publicChats = chats))
    );
    this.subscriptionArr.push(
      this.chatService.getUserData().subscribe((data) => (this.userData = data))
    );
    this.connect();
  }

  ngOnDestroy(): void {
    this.subscriptionArr.forEach((s) => s.unsubscribe());
  }

  connect() {
    let socket = new SockJS('http://localhost:8080/ws');
    this.stompClient = Stomp.over(socket);
    this.stompClient.connect(
      {},
      this.onConnected.bind(this),
      this.onError.bind(this)
    );
  }

  onConnected() {
    let userData: User = {
      username: this.activatedRoute.snapshot.queryParams['user'],
      receiverName: '',
      connected: true,
      message: '',
    };
    this.chatService.setUserData(userData);
    this.stompClient.subscribe(
      '/chatroom/public',
      this.onMessageReceived.bind(this)
    );
    this.stompClient.subscribe(
      '/user/' + this.userData.username + '/private',
      this.onPrivateMessage.bind(this)
    );
    this.userJoin();
  }

  userJoin() {
    const chatMessage = {
      senderName: this.userData.username,
      status: 'JOIN',
    };
    this.stompClient.send('/app/message', {}, JSON.stringify(chatMessage));
  }

  onMessageReceived(payload: any) {
    const payloadData = JSON.parse(payload.body);
    switch (payloadData.status) {
      case 'JOIN':
        if (!this.privateChats.get(payloadData.senderName)) {
          this.chatService.addPrivateMessage(payloadData.senderName, []);
        }
        break;
      case 'MESSAGE':
        this.chatService.addPublicMessage(payloadData);
        break;
    }
    this.cdr.detectChanges();
  }

  onPrivateMessage(payload: any) {
    const payloadData = JSON.parse(payload.body);
    if (this.privateChats.get(payloadData.senderName)) {
      this.chatService.addPrivateMessageToSender(
        payloadData.senderName,
        payloadData
      );
    } else {
      const list = [];
      list.push(payloadData);
      this.chatService.addPrivateMessage(payloadData.senderName, list);
    }

    this.cdr.detectChanges();
  }

  onError(err: any) {
    console.log(err);
  }

  handleMessage(event: any) {
    const { value } = event.target;
    this.userData.message = value;
    this.chatService.setUserData(this.userData);
  }

  sendValue() {
    if (this.stompClient) {
      const chatMessage = {
        senderName: this.userData.username,
        message: this.userData.message,
        status: 'MESSAGE',
      };
      this.stompClient.send('/app/message', {}, JSON.stringify(chatMessage));
      this.userData.message = '';
    }
  }

  sendPrivateValue() {
    if (this.stompClient) {
      const chatMessage = {
        senderName: this.userData.username,
        receiverName: this.tab,
        message: this.userData.message,
        status: 'MESSAGE',
      };

      if (this.userData.username !== this.tab) {
        this.chatService.addPrivateMessageToSender(this.tab, chatMessage);
      }
      this.stompClient.send(
        '/app/private-message',
        {},
        JSON.stringify(chatMessage)
      );
      this.userData.message = '';
    }
  }

  handleUsername(event: any) {
    const { value } = event.target;
    this.userData.username = value;
    this.chatService.setUserData(this.userData);
  }

  setActiveTab(tab: string) {
    this.tab = tab;
  }
}
