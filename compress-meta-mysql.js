const stdin = process.stdin;
let input = "";

// check if there is the flag -text is passed
const isText = process.argv.includes('-text');

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
        console.log(Object.keys(output).reduce((acc, cur) => {
            acc += `\n${cur}\n`;
            acc += Object.keys(output[cur]).map(field => {
                return `\t${field}: ${output[cur][field].Type}`;
            }).join('\n') + '\n'
            return acc
        }, ''))
    } else {
        console.log(JSON.stringify(output));
    }
});

