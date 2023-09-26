#!/usr/bin/env node

var amqp = require('amqplib/callback_api')
const { basename } = require('path')

amqp.connect('amqp://localhost', function (error0, connection) {
	if (error0) {
		throw error0
	}
	connection.createChannel(function (error1, channel) {
		if (error1) {
			throw error1
		}
		var exchange = 'order_queue'
		const bindingKeys = process.argv.slice(2)
		if (bindingKeys.length < 1) {
			console.warn('Usage: %s [Italian] [Japanese] [Chinese] [Thai] [Indian]', basename(process.argv[1]))
			process.exit(1)
		}

		channel.assertExchange(exchange, 'direct', { durable: true })
		const { queue } = channel.assertQueue('', { exclusive: true })

		Promise.all(
			bindingKeys.map((bindingKey) => {
				channel.bindQueue(queue, exchange, bindingKey)
			})
		)

		channel.prefetch(1)
		console.log(' [*] Waiting for messages in %s with %s keys. To exit press CTRL+C', exchange, bindingKeys)
		channel.consume(
			queue,
			function (msg) {
				var secs = msg.content.toString().split('.').length - 1

				console.log(' [x] %s: Received at', msg.fields.routingKey, new Date())
				console.log(JSON.parse(msg.content))

				setTimeout(function () {
					console.log(' [x] Done')
					channel.ack(msg)
				}, secs * 1000)
			},
			{
				noAck: false
			}
		)
	})
})
