const stdin = process.stdin;
let input = "";

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
    console.log(JSON.stringify(output));
});

