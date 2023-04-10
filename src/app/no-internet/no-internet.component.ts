import { Component, OnInit } from '@angular/core';
import { StropheService } from '../Services/strophe.service';

declare var $: any;
declare var Offline: any;

@Component({
  selector: 'app-no-internet',
  templateUrl: './no-internet.component.html',
  styleUrls: ['./no-internet.component.scss']
})
export class NoInternetComponent implements OnInit {

  constructor(private stropheService: StropheService) { }

  public userName: any = '72qtry12n@staging.aumnics.com';
  public password: any = '$2a$10$QXcm1l9iGtfd0JGnB5v68OCn.F/GvyNFebp7p1mWKvd5vQkiIXSVG';

  ngOnInit(): void {
    const self = this;

    $(() => {

      Offline.options = {
        // to check the connection status immediatly on page load.
        checkOnLoad: true,

        // to monitor AJAX requests to check connection.
        interceptRequests: true,

        // check the given url is accesable or not
        checks: {
          image: {
            url: () => ('https://esri.github.io/offline-editor-js/tiny-image.png?_='
              + (Math.floor(Math.random() * 1000000000)))

          },
          active: 'image'
        },

        // to automatically retest periodically when the connection is down (set to false to disable).
        reconnect: {
          // delay time in seconds to wait before rechecking.
          initialDelay: 3,

          // wait time in seconds between retries.
          delay: 10
        },

        // to store and attempt to remake requests which failed while the connection was down.
        requests: true,

      };

      Offline.check();

      // setInterval(() => {
      // console.log(Offline.state);
      // Offline.check();
      // }, 1000);

      Offline.on('up', () => {
        console.log('up calls');
      });

      Offline.on('down', () => {
        console.log('down calls');
      });

      this.stropheService.createConnection(this.userName, this.password);

      Offline.on('confirmed-up', () => {
        console.log('confirmed-up calls');
        self.onConnectionUp();
      });

      Offline.on('confirmed-down', () => {
        console.log('confirmed-down calls');
        self.onConnectionDown();
      });

      Offline.on('reconnect:connecting', () => {
        console.log('reconnect:connecting calls');
      });

      if (this.stropheService.getSystemOS() === 'Linux') {
        setInterval(() => {
          Offline.check();
        }, 2000);
      }

    });
  }

  public onConnectionUp() {
    console.log('On connection up calls');
    if (!this.stropheService.connectedToStrophe &&
      this.stropheService.stropheStatus !== 5 && this.stropheService.stropheStatus !== 1) {
      this.stropheService.createConnection(this.userName, this.password);
    }
  }

  public onConnectionDown() {
    console.log('On connection down calls');
    this.stropheService.connectedToStrophe = false;
  }

}
