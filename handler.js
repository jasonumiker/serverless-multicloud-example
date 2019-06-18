const handler = require('serverless-express/handler')
const app = require('./app')
 
exports.handler = handler(app)