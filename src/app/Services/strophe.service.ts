import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

declare var Strophe: any;
declare var $: any;
declare var $pres: any;
declare var $iq: any;
declare var $msg: any;

@Injectable({
    providedIn: 'root'
})

export class StropheService {

    constructor() { }

    public connection: any;
    public isWebsocketConn = false;
    public globalChatConnection: any;
    public stropheUsername: any;
    public strophePassword: any;
    public stropheStatus: number = 0;
    public connectedToStrophe: boolean = false;
    public stropheHandlers: any = [];
    public stropheConnTimeout: any;
    public hasInternet = true;

    public createConnection(userName: any, password: any): Observable<any> {
        const self = this;

        if (self.connection == null) {
            if (WebSocket) {
                self.isWebsocketConn = true;
                // Using websockets in strophe for ejabberd connection
                self.connection = new Strophe.Connection(environment.BOSH_WS_SERVICE);
                // self.connection = new Strophe.Connection(environment.BOSH_SERVICE);
            } else {
                self.isWebsocketConn = false;
                // Using long polling in strophe for ejabberd connection when websocket is not supported
                self.connection = new Strophe.Connection(environment.BOSH_SERVICE);
            }
        }

        this.strophePassword = password;
        self.globalChatConnection = this.connection;

        if (self.hasInternet && !self.connectedToStrophe && self.stropheStatus != 1) {
            self.connection.connect(userName, password, onConnect);
        }

        /**
         * This method is used to perform required task once response is received from Strophe.
         * @param status
         */
        function onConnect(status: number) {
            self.stropheStatus = status;
            console.log('strophe status: ' + status);
            if (status === Strophe.Status.CONNECTING) { // 1

                self.connectedToStrophe = false;

                self.stropheConnTimeout = setTimeout(() => {
                    self.stropheStatus = 0;
                }, 10000);

            } else if (status === Strophe.Status.CONNFAIL) { // 2

                clearTimeout(self.stropheConnTimeout);
                self.connectedToStrophe = false;

            } else if (status === Strophe.Status.DISCONNECTED) { // 6

                clearTimeout(self.stropheConnTimeout);
                self.connectedToStrophe = false;

            } else if (status === Strophe.Status.CONNECTED) { // 5

                clearTimeout(self.stropheConnTimeout);
                self.connectedToStrophe = true;
                self.stropheUsername = userName;
                self.strophePassword = password;

                self.globalChatConnection = self.connection;

                const jid = self.connection.jid;
                const rid = self.connection._proto.rid;
                const sid = self.connection._proto.sid;
                const ejabberdObj = {
                    jid, rid, sid
                }
                localStorage.setItem('ejabberdObj', JSON.stringify(ejabberdObj));

                // self.stropheHandlers.push(self.connection.addHandler(onPresence, null, 'presence', null, null, null));

                // self.stropheHandlers.push(self.connection.addHandler(pingHandler, 'urn:xmpp:ping', 'iq', 'get'));

                // self.stropheHandlers.push(self.connection.addHandler(onMessage, null, 'message', null, null, null));
            }

            function onPresence(presence: any) {
                console.log(presence);

                const from = $(presence).attr('from'); // the jabber_id of the contact

                const presenceType = $(presence).attr('type'); // unavailable, subscribed, etc...
                const show = $(presence).find('show').text();
                if (presenceType !== 'error') {
                    // this is required to show online users in the people search
                    if (presenceType === 'unavailable' || show == 'away') {
                        const nameArr = from.split('/');
                        const name = nameArr[0];
                    } else if (from !== undefined) {
                        const show = $(presence).find('show').text();
                        // this is what gives away, dnd, etc.
                        if (show === 'chat' || show === '') {
                            const userArr = from.split('/');
                        } else {
                            const nameArr = from.split('/');
                            console.log(nameArr);
                        }
                    }
                    if (from != undefined) {
                        const nameArr = from.split('/');
                        const name = nameArr[0];
                        console.log(name);
                    }
                }
                return true;
            }

            function pingHandler(ping: any) {
                console.log(ping);

                var pingId = ping.getAttribute('id');
                var from = ping.getAttribute('from');
                var to = ping.getAttribute('to');
                var pong = $iq({
                    type: 'result', to: from, id: pingId, from: to
                });
                // it will call every 10 seconds, that's why we are adding logic to check handlers
                // if handlers are not there, we are attaching them again.
                var messageHandlers = 0, onMessageHandler = false;
                $.each(self.connection.handlers, (idx: number, handler: any) => {
                    if (handler.name == 'message') {
                        messageHandlers++;
                        if (handler.ns == null) {
                            onMessageHandler = true;
                        }
                    }
                });
                if (self.connection.handlers.length < 3 || self.stropheHandlers.length < 5 || (messageHandlers < 3 || !onMessageHandler)) {
                    $.each(self.stropheHandlers, (idx: number, handler: any) => {
                        self.connection.deleteHandler(handler);
                        delete self.stropheHandlers[idx];
                    });
                    self.stropheHandlers = [];

                    self.stropheHandlers.push(self.connection.addHandler(onMessage, null, 'message', null, null, null));

                    self.stropheHandlers.push(self.connection.addHandler(pingHandler, 'urn:xmpp:ping', 'iq', 'get'));

                    self.stropheHandlers.push(self.connection.addHandler(onPresence, null, 'presence', null, null, null));
                }
                self.connection.sendIQ(pong);
                return true;
            }

            function onMessage(msg: any) {
                console.log(msg);
                return true;
            }
        }
        return EMPTY;
    }

    public disConnect() {
        const self = this;
        this.connectedToStrophe = false;
        this.globalChatConnection.flush();
        $.each(self.stropheHandlers, (idx: number, handler: any) => {
            self.connection.deleteHandler(handler);
            delete self.stropheHandlers[idx];
        });
        self.stropheHandlers = [];
        this.globalChatConnection.disconnect();
    }

    public getSystemOS() {
        let OSName = 'Unknown';
        if (window.navigator.userAgent.indexOf('Windows NT 10.0') !== -1) { OSName = 'Windows 10'; }
        if (window.navigator.userAgent.indexOf('Windows NT 6.3') !== -1) { OSName = 'Windows 8.1'; }
        if (window.navigator.userAgent.indexOf('Windows NT 6.2') !== -1) { OSName = 'Windows 8'; }
        if (window.navigator.userAgent.indexOf('Windows NT 6.1') !== -1) { OSName = 'Windows 7'; }
        if (window.navigator.userAgent.indexOf('Windows NT 6.0') !== -1) { OSName = 'Windows Vista'; }
        if (window.navigator.userAgent.indexOf('Windows NT 5.1') !== -1) { OSName = 'Windows XP'; }
        if (window.navigator.userAgent.indexOf('Windows NT 5.0') !== -1) { OSName = 'Windows 2000'; }
        if (window.navigator.userAgent.indexOf('Mac') !== -1) { OSName = 'Mac/iOS'; }
        if (window.navigator.userAgent.indexOf('X11') !== -1) { OSName = 'UNIX'; }
        if (window.navigator.userAgent.indexOf('Linux') !== -1) { OSName = 'Linux'; }
        return OSName;
    }
}