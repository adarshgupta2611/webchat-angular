import { Component, OnInit } from '@angular/core';
import * as Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ChatRoomComponent implements OnInit {
  privateChats: Map<string, any[]> = new Map();
  publicChats: any[] = [];
  tab: string = "CHATROOM";
  
  userData: any = {
    username: '',
    receivername: '',
    connected: false,
    message: ''
  };
  stompClient: any;

  ngOnInit() {}

  connect() {
    let socket = new SockJS('http://localhost:8080/ws');
    this.stompClient = Stomp.over(socket);
    this.stompClient.connect({}, this.onConnected.bind(this), this.onError.bind(this));
  }

  onConnected() {
    this.userData.connected = true;
    this.stompClient.subscribe('/chatroom/public', this.onMessageReceived.bind(this));
    this.stompClient.subscribe('/user/' + this.userData.username + '/private', this.onPrivateMessage.bind(this));
    this.userJoin();
  }

  userJoin() {
    const chatMessage = {
      senderName: this.userData.username,
      status: "JOIN"
    };
    this.stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
  }

  onMessageReceived(payload : any) {
    const payloadData = JSON.parse(payload.body);
    switch (payloadData.status) {
      case "JOIN":
        if (!this.privateChats.get(payloadData.senderName)) {
          this.privateChats.set(payloadData.senderName, []);
        }
        break;
      case "MESSAGE":
        this.publicChats.push(payloadData);
        break;
    }
  }

  onPrivateMessage(payload : any) {
    const payloadData = JSON.parse(payload.body);
    if (this.privateChats.get(payloadData.senderName)) {
      this.privateChats.get(payloadData.senderName).push(payloadData);
    } else {
      const list = [];
      list.push(payloadData);
      this.privateChats.set(payloadData.senderName, list);
    }
  }

  onError(err : any) {
    console.log(err);
  }

  handleMessage(event : any) {
    const { value } = event.target;
    this.userData.message = value;
  }

  sendValue() {
    if (this.stompClient) {
      const chatMessage = {
        senderName: this.userData.username,
        message: this.userData.message,
        status: "MESSAGE"
      };
      console.log(chatMessage);
      this.stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
      this.userData.message = "";
    }
  }

  sendPrivateValue() {
    if (this.stompClient) {
      const chatMessage = {
        senderName: this.userData.username,
        receiverName: this.tab,
        message: this.userData.message,
        status: "MESSAGE"
      };

      if (this.userData.username !== this.tab) {
        this.privateChats.get(this.tab).push(chatMessage);
      }
      this.stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
      this.userData.message = "";
    }
  }

  handleUsername(event : any) {
    const { value } = event.target;
    this.userData.username = value;
  }

  registerUser() {
    this.connect();
  }

  setActiveTab(tab: string) {
    this.tab = tab;
  }
}
