const stdin = process.stdin;
let input = "";

// check if there is the flag -text is passed
const isText = process.argv.includes('-text');
const isCount = process.argv.includes('-count');

stdin.setEncoding("utf8");

stdin.on("readable", () => {
    const chunk = stdin.read();
    if (chunk !== null) {
        input += chunk;
    }
});

stdin.on("end", () => {
    const inputJSON = JSON.parse(input);

    const output = {};
    Object.entries(inputJSON).forEach(([table, schema]) => {
        output[table] = {};
        for (let field of schema.schema) {
            const type = field.Type.split('(')[0];
            output[table][field.Field] = { Type: type };
        }
    });
    if (isText) {
        const outputText = Object.keys(output).reduce((acc, cur) => {
            acc += `\n${cur}\n`;
            acc += Object.keys(output[cur]).map(field => {
                return `\t${field}: ${output[cur][field].Type}`;
            }).join('\n') + '\n'
            return acc
        }, '')

        if (isCount) {
            console.log(outputText.trim().split('\n').map(l => l.trim()).map(l => l.split(':')).flat().map(l => l.trim()).filter(l => l).length)
        } else {
            console.log(outputText)
        }
    } else {
        console.log(JSON.stringify(output));
    }
});

