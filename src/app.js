const http = require('http');
const conf = require('./config/defaultConfig')
const chalk = require('chalk')
const path = require('path')

const server = http.createServer((req, res) => {

    const url = req.url;
    const filePath = path.join(conf.root, req.url);
    res.statusCode = 200;
    res.setHeader('Content-Type','test/html');
    res.end(filePath)
});


server.listen(conf.port, conf.hostname, () =>{
    const addr = `http://${conf.hostname}:${conf.port}`
    console.info(`Server Started at ${chalk.green(addr)}`)
});
