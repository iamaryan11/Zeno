import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const ai=new GoogleGenAI({apiKey:process.env.Zeno_API})


// we need to return file info to LLM like this: App/src/test.js
async function listFiles({directory}){
    const files=[];
    // accept the files only if they have the following extensions
    const extensions=['.js','.jsx','.ts','.tsx','.html','.css'];

    function scan(dir){
        const items=fs.readdirSync(dir);
        for(const item of items){
            const fullpath=path.join(dir,item);

            // we dont want to give nodemodules, dist, build and files like these:
            if(fullpath.includes('node_modules')||fullpath.includes('dist')||fullpath.includes('build')){
                continue;
            }

            // the following helps us identify whether the the fullpath includes a directory or not:
            const stat=fs.statSync(fullpath);

            if(stat.isDirectory()){
                // if it the directory scan it onces again until the level contains files
                scan(fullpath);
            }
            else if(stat.isFile()){
                const ext=path.extreme(item);
                if(extensions.includes(ext)){
                    // we are filling the files empty array only when the fullpath includes the files and not the directory
                    files.push(fullpath);
                }
            }
        }
    }
    scan(directory);
    console.log(`Found ${files.length} files`);
    return {files};

}

 

async function readFile({file_path}){
    const content=fs.readFileSync(file_path,'utf-8');
    console.log(`Reading : ${file_path}`);
    return {content};
}

// tool to write content inside a file:
async function writeFile({file_path,content}){
    fs.writeFileSync(file_path,content,'utf-8');
    console.log(`Fixed: ${file_path}`);
    return {success:true}
}

const tools={};

