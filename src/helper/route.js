const fs = require('fs')
const promisify = require('util').promisify
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)
const Handlebars = require('handlebars')

const config = require('../config/defaultConfig')
const path = require('path')
const tplPath = path.join(__dirname, '../template/dir.tpl')
const source = fs.readFileSync(tplPath)
const template = Handlebars.compile(source.toString());

const mime = require('./mime')
const compress = require('./compress')
const range = require('./range')

const isFresh = require('./cache')

module.exports = async function (req, res, filePath) {
    try {
        const stats = await stat(filePath);
        if (stats.isFile()){
            const contentType = mime(filePath) 
            res.statusCode = 200;
            res.setHeader('Content-Type', contentType);

            if (isFresh(stats , req, res)) {
                res.statusCode = 304;
                res.end();
                return;
            }

            let rs;
            const {code, start, end}= range(stats.size, req, res);
            if (code === 200){
                res.statusCode = 200;
                rs = fs.createReadStream(filePath);
            }else {
                res.statusCode = 206;
                rs = fs.createReadStream(filePath, {start, end});
            }
            if (filePath.match(config.compress)){
                rs = (compress(rs, req, res))
            }
            rs.pipe(res);

        } else if (stats.isDirectory()){
            const files = await readdir(filePath);
            const dir = path.relative(config.root, filePath)
                res.statusCode = 200;
                res.setHeader('Content-Type','text/html');
                const data = {
                    title: path.basename(filePath),
                    dir: dir ? `/${dir}` : '',
                    files : files.map(file => {
                        return{
                            file,
                            icon: mime(file)
                        }
                    })
                }
                res.end(template(data));
        }
    } catch(ex){
        console.error(ex);
        res.statusCode = 404;
        res.setHeader('Content-Type','text/plain');
        res.end(`${filePath} is not a dir or html`);
    }
}