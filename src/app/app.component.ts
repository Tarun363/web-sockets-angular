import { Component } from '@angular/core';
import '../assets/js/strophejs/strophe.chatstates.js';
import '../assets/js/strophejs/strophe.receipts.js';
import '../assets/js/strophejs/strophe.min.js';
import '../assets/js/strophejs/strophe.message-carbons.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'web-sockets';
}
