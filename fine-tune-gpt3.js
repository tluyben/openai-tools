const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function runExecutable(executable, args) {
    // Spawn a child process to run the executable
    const child = spawn(executable, args);

    // Set up listeners for the child process's stdout and stderr streams
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', data => {
        stdout += data;
    });
    child.stderr.on('data', data => {
        stderr += data;
    });

    // Wait for the child process to exit
    await new Promise((resolve, reject) => {
        child.on('exit', code => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(stderr));
            }
        });
    });

    // Return the output from the child process
    return stdout;
}

async function collectFiles(dir, rec) {
    let files = await fs.promises.readdir(dir);
    let result = [];
    for (let file of files) {
        let filePath = path.join(dir, file);
        let stats = await fs.promises.stat(filePath);
        if (rec && stats.isDirectory()) {
            // Recursively collect files in subdirectories
            result = result.concat(await collectFiles(filePath));
        } else if (stats.isFile()) {
            // Add file to the result
            result.push(filePath);
        }
    }
    return result;
}

function createCompletion(str) {
    return `{"prompt": "", "completion": ${JSON.stringify(' ' + str)}}`;
}

// Function to read all files in a directory and output lines of JSON
async function readDirectory(dir, targetFile, rec = false) {
    // Read the files in the directory
    let files = await collectFiles(dir, rec)

    // open the targetFile for writing
    let target = await fs.promises.open(targetFile, 'w');

    // Keep track of the current string
    let currentString = '';

    // Read each file in the directory
    for (let file of files) {
        let data = await fs.promises.readFile(file, 'utf8');
        let words = data.split('\n').join(' ').split(' ');
        for (let word of words) {
            if (currentString.length + word.length <= 2048) {
                currentString += `${word} `;
            } else {
                // write to targetFile; 
                await target.write(`${createCompletion(currentString)}\n`);
                //console.log(`{"prompt": "", "completion": ${JSON.stringify(currentString)}}`)
                currentString = ''
            }
        }
    }
    if (currentString.length > 0) {
        await target.write(`${createCompletion(currentString)}\n`);
    }

    // close targetFile 
    await target.close();

}

const dir = process.argv[2];
if (!dir) {
    console.error('Please specify a directory to read from');
    console.error('Usage: node fine-tune-gpt3.js <directory> [-r] [-k]');
    console.error('  -r: Recursively read files in subdirectories');
    console.error('  -d: Delete the target file after running the executable');
    console.error('  -e: (Try to) Execute the OpenAI executable');
    process.exit(1);
}

(async () => {
    // generate random number for the target json file; 
    let targetFile = `./gpt3-finetune-${Math.floor(Math.random() * 100000)}.json`;
    await readDirectory(dir, targetFile, process.argv.includes('-r'));

    if (process.argv.includes('-e')) {
        let output = await runExecutable('openai', ['tools', 'fine_tunes.prepare_data', '-f', targetFile]);
        console.log(output);

        output = await runExecutable('openai', ['api', 'fine_tunes.create', '-t', targetFile, '-m', 'davinci']);
        console.log(output);
    }

    // delete the targetFile
    if (process.argv.includes('-d')) {
        await fs.promises.unlink(targetFile);
    }
})()

