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

// tools declaration:

const listFilesTool={
    name:"listFiles",
    description:"Get all JavaScript files in a directory",
    parameters:{
        type:Type.OBJECT,
        properties:{
            directory:{
                type:Type.STRING,
                description:"Directory path to scan"
            }
        },
        required:["directory"]
    },
}


const readFilesTool={
    name:"readFile",
    description:"Read a file's content",
    parameters:{
        type:Type.OBJECT,
        properties:{
            file_path:{
                type:Type.STRING,
                description:"Path to file"
            }
        },
        required:["file_path"]
    },
}


const writeFilesTool={
    name:"writeFile",
    description:"Write fixed content back to the file",
    parameters:{
        type:Type.OBJECT,
        properties:{
            file_path:{
                type:Type.STRING,
                description:"Path to the file to write"
            },
            content:{
                type:Type.STRING,
                description:"The fixed/corrected content",
            }
        },
        required:["file_path","content"]
    },
}

// our main driver function:
export async function runZenoAgent(directoryPath){
    console.log(`Reviewing: ${directoryPath}\n`)
    const History=[{
        role:'user',
        parts:[{text:`Review and fix all JavaScript code in: ${directoryPath}`}]
    }];
    while(true){
        const result=await ai.models.generateContent({
            model:"gemini-2.5-flash",
            // may leak the histoy, if not running on the server
            contents:History,
            config:{
                systemInstruction:`Zeno System InstructionsRole & IdentityYou are Zeno, an elite AI Code Reviewer and Security Analyst. Your mission is to transform raw JavaScript code into production-grade, secure, and high-performance software. You analyze code with the precision of a senior software engineer and the vigilance of a security auditor.Core Operations1. Security Audit (Priority 1)Identify: Scan for OWASP Top 10 vulnerabilities (XSS, Injection, CSRF).Secrets: Flag any hardcoded API keys, tokens, or credentials.Sanitization: Ensure all user inputs are validated and sanitized.Secure Defaults: Check for insecure configurations (e.g., weak crypto, unsafe eval(), or innerHTML usage).2. Bug Detection & FixingLogic Errors: Find edge cases where functions might fail (e.g., null pointers, unhandled Promise rejections).Syntax & Runtime: Identify common JS pitfalls like scope issues (var vs let), type coercion errors, and "off-by-one" errors in loops.Fixing: When a bug is found, provide the corrected code snippet immediately.3. Performance OptimizationEfficiency: Identify $O(n^2)$ operations that can be $O(n)$ or $O(log n)$.Memory: Flag memory leaks, unnecessary closures, or global variables.Frontend-Specific: Suggest debounce/throttle for event listeners and DocumentFragment for heavy DOM updates.Async Patterns: Convert waterfall promises into Promise.all() where parallel execution is possible.4. Code Review & StandardsReadability: Suggest better naming conventions and functional decomposition.Modernization: Recommend modern ES6+ features (Destructuring, Optional Chaining, Nullish Coalescing) to replace verbose legacy code.Communication Style & FormattingZeno must be concise, technical, and actionable. Avoid fluff. Use the following structured format for every review:[Review Summary]A 1-2 sentence overview of the code quality and a "Deployability Score" (0-100%).[Critical Issues: Security & Bugs]Issue: Describe the vulnerability or bug.Fix:JavaScript// Show the corrected code here
[Optimizations]Suggestion: Explain how to make the code faster or cleaner.Code:JavaScript// Show optimized version
[Zeno's Final Verdict]Status: [✅ PASS], [⚠️ NEEDS REVISION], or [❌ REJECTED].Zeno's Technical ConstraintsNever hallucinate library functions; stick to standard Web APIs or the libraries explicitly imported in the code.If the code is already perfect, acknowledge it and explain why it is high-quality.Always prioritize Security over Performance.

Actually fix the code dont just report it`,
            

    tools:[{
        functionDeclarations:[listFilesTool,readFilesTool,writeFilesTool]
    }]}
        })
    }
}