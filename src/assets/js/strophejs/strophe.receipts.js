Strophe.addConnectionPlugin('receipts', {
    _conn: null,
    _msgQueue: {},
    _retries: {},
    _resendCount: 1,
    _resendTime: 9000,

    init: function(conn) {
		this._conn = conn;
		Strophe.addNamespace('RECEIPTS', 'urn:xmpp:receipts');
		Strophe.addNamespace('DELAY', 'urn:xmpp:delay');
		
    },
	
	
    statusChanged: function (status) {
		if (status === Strophe.Status.CONNECTED || status === Strophe.Status.ATTACHED) {
			// set up handlers for receipts
			//this._conn.addHandler(this._onRequestReceived.bind(this), Strophe.NS.RECEIPTS, "message");
			var that = this;
			// setTimeout(function(){that.resendQueue();},5000);
		}
	},
	
	 
	 _onRequestReceived: function(msg){
	 	this._processReceipt(msg);
	 	return true;
	 },
	

    /* sendMessage
    ** sends a message with a receipt and stores the message in the queue
    ** in case a receipt is never received
    **
    ** msg should be a builder
    */
    sendMessage: function(msg) {

        // var id = this._conn.getUniqueId();
        
        // msg.tree().setAttribute('id', id);
		
		var id =  msg.nodeTree.id;


        var request = Strophe.xmlElement('request', {'xmlns': Strophe.NS.RECEIPTS});
        msg.tree().appendChild(request);

		// var replace = Strophe.xmlElement('replace', {'xmlns': 'urn:xmpp:message-correct:0' , 'id': id});
        // msg.tree().appendChild(replace);

        this._msgQueue[id] = msg;
        this._retries[id] = 0;

        this._conn.send(msg);
        
        //this.resendMessage(id);
        
        return id;
        
	},
	
	/* addMessageHandler
    ** add a message handler that handles XEP-0184 message receipts
    */
    addReceiptHandler: function(handler, from, options) {
        var that = this;

        var proxyHandler = function(msg) {
            that._processReceipt(msg);
         
            // call original handler
            return handler(msg);
        };

        this._conn.addHandler(proxyHandler, Strophe.NS.RECEIPTS, 'message',
                              null, null, from, options);
    },
    
    /*
	 * process a XEP-0184 message receipts
	 * send recept on request
	 * remove msg from queue on received 
	*/
	_processReceipt: function(msg){
		var id = msg.getAttribute('id'),
			from = msg.getAttribute('from'),
			req = msg.getElementsByTagName('request'),
			msgTimestamp = $(msg).find('archived').attr('id'),
			rec = msg.getElementsByTagName('received');
			
			// check for request in message
            if (req.length > 0) {
				// send receipt
				var out = $msg({to: from, from: this._conn.jid, id: this._conn.getUniqueId()}),
					request = Strophe.xmlElement('received', {'xmlns': Strophe.NS.RECEIPTS, 'id': id, timestamp: msgTimestamp});
				out.tree().appendChild(request);
				this._conn.send(out);
			}
			// check for received
            if (rec.length > 0) {
                var recv_id = rec[0].getAttribute('id');
				if (recv_id) { // delete msg from queue
					delete this._msgQueue[recv_id];
					delete this._retries[recv_id];
				}
            }			
	},
	
	resendQueue: function(){
		if (!this._conn.connected) {
			var that = this;
			setTimeout(function(){that.resendQueue();},5000);
			return;
		}
		for (var id in this._msgQueue) {
			if (this._msgQueue.hasOwnProperty(id)) {
			   this._conn.send(this._msgQueue[id]);
			}
		}	
	},

    getUnreceivedMsgs: function() {
        var msgs = [];
        for (var id in this._msgQueue) {
            if (this._msgQueue.hasOwnProperty(id)) {
                msgs.push(this._msgQueue[id]);
            }
        }
        return msgs;
    },

    clearMessages: function() {
        this._msgQueue = {};
    }
});