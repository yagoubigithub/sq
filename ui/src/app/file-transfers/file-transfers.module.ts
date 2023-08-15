import { NgModule } from '@angular/core';
import { CommonModule } from '../common/common.module';

import { FileTransfersComponent } from './file-transfers.component';
import { InboxComponent } from './inbox/inbox.component';
import { OutboxComponent } from './outbox/outbox.component';
import { Routes } from '@angular/router';


export const ROUTES: Routes = [
	{ path: '', component: FileTransfersComponent, children: [
		{ path: '', redirectTo: 'inbox', pathMatch: 'full' },
		{ path: 'inbox', component: InboxComponent },
		{ path: 'outbox', component: OutboxComponent }
	] },
];

@NgModule({
  declarations: [FileTransfersComponent, InboxComponent, OutboxComponent],
  imports: [CommonModule]
})
export class FileTransfersModule { }
