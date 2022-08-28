"use strict";	
const https = require('https');
const Kucoin = require("kucoin-websocket-api");
const { ServiceBroker } = require("moleculer");
const broker = new ServiceBroker();

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: "kucoin",

	/**
	 * Settings
	 */
	settings: {

	},

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		coins: {
			params: {
				symbol: "string",
				side: "string",
				type: "string",
				makerOrderId: "string",
				sequence: "string",
				size: "string",
				price: "string",
				takerOrderId: "string",
				time: "string",
				tradeId: "string"
			},
			async handler(cnx) {
				const broker = new ServiceBroker();

				// Create a Mongoose service for `coin` entities
				broker.createService({
					name: "coins",
					mixins: [DbService],
					adapter: new MongoDBAdapter("mongodb://localhost/coins-db"),
					collection: "coins",
					settings: {
						fields: ["_id",
						 		"symbol",
								"side", 
								"type", 
								"makerOrderId", 
								"sequence",
								"size",
								"price",
								"takerOrderId",
								"time",
								"tradeId"],
						entityValidator: {
							username: "string"
						}
					},
					afterConnected() {
						// Seed the DB with ˙this.create`
					}
				});

				broker.start()
				// Create a new record
				.then(() => broker.call("coins.create", {
					symbol: cnx.params.symbol,
					side: cnx.params.side,
					type: cnx.params.type,
					makerOrderId: cnx.params.makerOrderId,
					sequence: cnx.params.sequence,
					size: cnx.params.size,
					price: cnx.params.price,
					takerOrderId: cnx.params.takerOrderId,
					time: cnx.params.time,
					tradeId: cnx.params.tradeId
				}))
				// Get all coin prices
				.then(() => broker.call("coins.find").then(console.log));
			}
		},


		live: {
			rest: {
				method: "GET",
				path: "/live"
			},
			params: {
				currency_name: "string"
			},
			async handler(cnx) {
				const client = new Kucoin();
				var symbols = [cnx.params.currency_name];
				try{
					return new Promise(async function(myResolve) {
						let connection = await client.MarketMatches(symbols, (data) => {			
							console.log(data);
							myResolve(data);	

							//broker.start()
							// Create a new record
							//.then(() => broker.call("coins.create", {
							//	symbol: data['symbol'],
							//	side: data['side'],
							//	type: data['type'],
							//	makerOrderId: data['makerOrderId'],
							//	sequence: data['sequence'],
							//	size: data['size'],
							//	price: data['price'],
							//	takerOrderId: data['takerOrderId'],
							//	time: data['time'],
							//	tradeId: data['tradeId']
							//}))

							// With calling connection() it close the socket
							setTimeout(() => {connection()}, 15000);
						})

					});
				}catch(e){
					// List coin priced with pagination
					broker.start().then(() => broker.call("kucoin.coins", { page: 2, pageSize: 10 }).then(console.log));
				}
			}
		},

		//this action returns current coin price 
		current: {
			rest: {
				method: "GET",
				path: "/current"
			},
			params: {
				currency_name: "string"
			},
			async handler(cnx) {
				var c_url = 'https://api.kucoin.com/api/v1/mark-price/' + cnx.params.currency_name + '/current' ;
				return this.url_request(c_url);
			}
		},

		//this action returns coin history
		history: {
			rest: {
				method: "GET",
				path: "/history"
			},
			params: {
				currency_name: "string"
			},
			async handler(cnx) {
				var c_url = 'https://api.kucoin.com/api/v1/market/histories?symbol=' + cnx.params.currency_name;
				return this.url_request(c_url);
			}
		},

		//this action returns coin status from 24 hours ago till request moment
		stat24h: {
			rest: {
				method: "GET",
				path: "/stat24h"
			},
			params: {
				currency_name: "string"
			},
			async handler(cnx) {
				var c_url = 'https://api.kucoin.com/api/v1/market/stats?symbol='+ cnx.params.currency_name ;
				return this.url_request(c_url);
			}
		},
		
		//this action returns candles of a coin in min, hour, day and week type
		coin_candle: {
			rest: {
				method: "GET",
				path: "/coin_candle"
			},
			params: {
				currency_name: "string",
				candle_type : "string"
			},
			async handler(cnx) {
				var c_url = 'https://api.kucoin.com/api/v1/market/candles?type='+ cnx.params.candle_type +'&symbol='+ cnx.params.currency_name ;
				return this.url_request(c_url);
			}
		},


	},

	/**const res = this.broker.call("kucoin.add", { a: 5, b: 7 });
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {
		
		//this method get http request and convert it to json 
		url_request(url){
			return new Promise(function(myResolve, myReject) {
				// "Producing Code" (May take some time)
				var res = https.get(url , (resp) => {
					let data = '';
	
					// A chunk of data has been received.
					resp.on('data', (chunk) => {
					data += chunk;
					});
				
					resp.on('end', () => {
						myResolve(data); // when successful
					});
				
				}).on("error", (err) => {
					console.log("Error: " + err.message);
					myReject(err);  // when error
				});
				
			});
		},
		
	},


	/**
	 * Service created lifecycle event handler
	 */
	created() {

	},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {

	}
};