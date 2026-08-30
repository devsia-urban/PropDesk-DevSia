const fs = require('fs');

// 1. Remove the backend hack
let apiPath = './app/api/chat/route.ts';
let apiContent = fs.readFileSync(apiPath, 'utf8');

apiContent = apiContent.replace(
    /    \/\/ TEMPORARY OVERRIDE[\s\S]*?    \);\n/g,
    ''
);
fs.writeFileSync(apiPath, apiContent);

// 2. Add the intercept to frontend
let copilotPath = './components/AICopilot.tsx';
let copilotContent = fs.readFileSync(copilotPath, 'utf8');

// Destructure setMessages
copilotContent = copilotContent.replace(
    /const \{ messages, status, sendMessage \} = useChat\(\{\}\);/g,
    'const { messages, status, sendMessage, setMessages } = useChat({});'
);

// Intercept onSubmit
copilotContent = copilotContent.replace(
    /    if \(!localInput\.trim\(\) \|\| isLoading\) return;\n    sendMessage\(\{ text: localInput \}\);\n    setLocalInput\(''\);/g,
    `    if (!localInput.trim() || isLoading) return;
    
    setMessages([
      ...messages,
      { id: Date.now().toString(), role: 'user', content: localInput },
      { id: (Date.now() + 1).toString(), role: 'assistant', content: "🤖 DevSia AI Copilot is currently paused for weekend maintenance and updates. We will be back online this Monday!" }
    ]);
    setLocalInput('');
    return;`
);

// We must also intercept the quick suggestion buttons
copilotContent = copilotContent.replace(
    /onClick=\{\(\) => \{ sendMessage\(\{ text: s \}\); \}\}/g,
    `onClick={() => {
        setMessages([
          ...messages,
          { id: Date.now().toString(), role: 'user', content: s },
          { id: (Date.now() + 1).toString(), role: 'assistant', content: "🤖 DevSia AI Copilot is currently paused for weekend maintenance and updates. We will be back online this Monday!" }
        ]);
    }}`
);

fs.writeFileSync(copilotPath, copilotContent);
console.log('Fixed AI chat logic');
