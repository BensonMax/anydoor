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

module.exports = async function (req, res, filePath) {
    try {
        const status = await stat(filePath);
        if (status.isFile()){
            const contentType = mime(filePath) 
            res.statusCode = 200;
            res.setHeader('Content-Type', contentType);
            let rs = fs.createReadStream(filePath);
            if (filePath.match(config.compress)){
                rs = (compress(rs, req, res))
            }
            rs.pipe(res);


        } else if (status.isDirectory()){
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