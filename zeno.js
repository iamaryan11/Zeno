import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const ai=new GoogleGenAI({apiKey:process.env.Zeno_API})


// we need to return file info to LLM like this: App/src/test.js
async function listFiles({directory}){

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

