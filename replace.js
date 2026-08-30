const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./app', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        // Replace 'PropDesk' with 'DevSia', ignoring case for 'PropDesk' but keeping exact case for 'DevSia' where appropriate,
        // Actually, we'll replace exact match 'PropDesk' with 'DevSia'
        let newContent = content.replace(/PropDesk/g, 'DevSia');
        // Replace 'propdesk' with 'DevSia' except when it's followed by '_' (like propdesk_session_token) or '-' (like propdesk-enterprise)
        newContent = newContent.replace(/propdesk(?!_|-)/g, 'DevSia');
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent);
            console.log(`Updated ${filePath}`);
        }
    }
});
walkDir('./components', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content.replace(/PropDesk/g, 'DevSia');
        newContent = newContent.replace(/propdesk(?!_|-)/g, 'DevSia');
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent);
            console.log(`Updated ${filePath}`);
        }
    }
});
walkDir('./public', function(filePath) {
    if (filePath.endsWith('.json') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content.replace(/PropDesk/g, 'DevSia');
        newContent = newContent.replace(/propdesk(?!_|-)/g, 'DevSia');
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent);
            console.log(`Updated ${filePath}`);
        }
    }
});
