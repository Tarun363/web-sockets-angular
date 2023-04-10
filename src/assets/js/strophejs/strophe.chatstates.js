/**
 * Chat state notifications (XEP 0085) plugin
 * @see http://xmpp.org/extensions/xep-0085.html
 */
import { $iq, Strophe } from './strophe.min.js';

Strophe.addConnectionPlugin('chatstates',
{
	init: function (connection)
	{
		this._connection = connection;

		Strophe.addNamespace('CHATSTATES', 'http://jabber.org/protocol/chatstates');
	},

	statusChanged: function (status)
	{
		if (status === Strophe.Status.CONNECTED
			|| status === Strophe.Status.ATTACHED)
		{
			this._connection.addHandler(this._notificationReceived.bind(this),
				Strophe.NS.CHATSTATES, "message");
		}
	},

	addActive: function(message)
	{
		return message.c('active', {xmlns: Strophe.NS.CHATSTATES}).up();
	},

	_notificationReceived: function(message)
	{
		if ($(message).find('error').length > 0)
			return true;
		
		var composing = $(message).find('composing'),
		paused = $(message).find('paused'),
		active = $(message).find('active'),
		inactive = $(message).find('inactive'),
		gone = $(message).find('gone'),
		jid = $(message).attr('from');

		if (composing.length > 0)
		{
			$(document).trigger('composing.chatstates', jid);
		}

		if (paused.length > 0)
		{
			$(document).trigger('paused.chatstates', jid);
		}

		if (active.length > 0)
		{
			$(document).trigger('active.chatstates', jid);
		}

		if (inactive.length > 0)
		{
			$(document).trigger('inactive.chatstates', jid);
		}

		if (gone.length > 0)
		{
			$(document).trigger('gone.chatstates', jid);
		}

		return true;
	},

	sendActive: function(jid, type)
	{
		this._sendNotification(jid, type, 'active', '');
	},

	sendComposing: function(jid, type, username)
	{
		this._sendNotification(jid, type, 'composing', username);
	},

	sendPaused: function(jid, type, username)
	{
		this._sendNotification(jid, type, 'paused', username);
	},

	sendInactive: function(jid, type)
	{
		this._sendNotification(jid, type, 'inactive', '');
	},

	sendGone: function(jid, type)
	{
		this._sendNotification(jid, type, 'gone', '');
	},
	sendOnline: function(jid, type)
	{
		this._sendNotification(jid, type, 'online' , '');
	},
	_sendNotification: function(jid, type, notification, username)
	{
		try {
			if (!type) type = "chat";

			if (type === "groupchat") {
				this._connection.send(
				$msg({
					to: jid,
					type: type,
				}).c(notification, { xmlns: Strophe.NS.CHATSTATES, user: username })
				);
			} else {
				this._connection.send(
				$msg({
					to: jid,
					type: type,
				}).c(notification, { xmlns: Strophe.NS.CHATSTATES })
				);
			}
		} catch (error) {
			console.log('Error in Strophe Chat States');
		}
		
	}
});
