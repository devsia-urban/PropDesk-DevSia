const fs = require('fs');

let apiPath = './app/api/chat/route.ts';
let apiContent = fs.readFileSync(apiPath, 'utf8');

const injection = `
    // TEMPORARY OVERRIDE
    return new Response(
      '0:"🤖 DevSia AI Copilot is currently paused for weekend maintenance and updates. We will be back online this Monday!"\\n',
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
`;

// Insert after "export async function POST(req: Request) {\n  try {"
apiContent = apiContent.replace(
    /export async function POST\(req: Request\) \{\n\s*try \{/g,
    `export async function POST(req: Request) {\n  try {${injection}`
);

fs.writeFileSync(apiPath, apiContent);
console.log('Disabled AI API');
