import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-file-transfers',
  templateUrl: './file-transfers.component.html',
  styleUrls: ['./file-transfers.component.scss']
})
export class FileTransfersComponent implements OnInit {

  unreadCount = 3;

  constructor() { }

  ngOnInit(): void {
  }

}
