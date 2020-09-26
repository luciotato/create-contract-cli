import * as fs from "fs"
import * as path from "path"
import { execSync} from "child_process"

function fromDir(startPath, filter, callback) {

    //console.log('Starting from dir '+startPath+'/');

    if (!fs.existsSync(startPath)) {
        console.log("no dir ", startPath);
        return;
    }

    var files = fs.readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {
        var filename = path.join(startPath, files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            fromDir(filename, filter, callback); //recurse
        }
        else if (filter.test(filename)) callback(filename);
    };
};

function addDotJsToLocalImports(filename) {
    var buf = fs.readFileSync(filename);
    let replaced = buf.toString().replace(/(import .* from\s+['"])(?!.*\.js['"])(\..*?)(?=['"])/g, '$1$2.js')
    if (replaced !== buf.toString()) {
        fs.writeFileSync(filename, replaced)
        console.log("fixed imports at "+filename )
    }
}

//---------------------
//---START BUILD TASKS
//---------------------

execSync("npx tsc --build -verbose", { stdio: 'inherit' })

//add .js to ts-generated import-commands so the generated ES6 code works with node ES2020 type:module
//see: https://github.com/microsoft/TypeScript/issues/16577
fromDir("./dist", /\.js$/, addDotJsToLocalImports)
