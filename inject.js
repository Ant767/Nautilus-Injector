const decompress = require("decompress");
const fs = require('fs');
const chalk = require('chalk');
const uuid = require('uuid');
const { zip } = require('zip-a-folder')
module.exports = class Injector {
    constructor(file, injectorData) {
        this.file = file;
        this.decompress();
        this.injectorData = injectorData;
        this.pluginTxts = [];
    }
    decompress() {
        decompress(this.file, "dist")
            .then((files) => {
                decompress("dist/output.mcpack", "dist/NautilusTemp")
                    .then((files) => {
                        this.checkAzalea();
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            })
            .catch((error) => {
                console.log(error);
            });
    }
    checkAzalea() {
        if (!fs.existsSync("dist/NautilusTemp/scripts/dynamicPropertyDb.js"))
            console.log(chalk.redBright("NAUTILUS ERROR: Archive is not azalea"));
        else
            this.begin();
    }
    begin() {
        fs.mkdirSync('dist/NautilusTemp/scripts/nautilus', { recursive: false })
        this.injectorData();
    }
    inject(file, type = 'dir', done) {
        if (type == "dir") {
            fs.readdir(file, (err, files) => {
                for (const file2 of files) {
                    if (file2 == "plugin.txt") {
                        this.pluginTxts.push(fs.readFileSync(`${file}/${file2}`).toString().replace(/\r\n/g,"\n"))
                        continue;
                    }
                    if(!file2.endsWith('.js')) return;
                    let code = fs.readFileSync(`${file}/${file2}`).toString();
                    let uuid2 = uuid.v4();
                    fs.writeFile('dist/NautilusTemp/scripts/nautilus/' + uuid + '.js', code, err => { });
                    fs.appendFile('dist/NautilusTemp/scripts/index.js', `\n\nimport './nautilus/${uuid}.js'`,err=>{})
                }
                fs.writeFile('dist/NautilusTemp/scripts/nautilus-plugin-texts.js', `export const pluginTexts = ${JSON.stringify(this.pluginTxts,null,2)}`,err=>{

                })
                done();
            });
        }
    }
    compress(done) {
        zip('dist/NautilusTemp', 'output.zip').then(res=>{
            fs.rmSync('dist', {recursive:true});
            done();
        });
    }
}