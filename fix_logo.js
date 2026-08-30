const fs = require('fs');

let pagePath = './app/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Replace header
pageContent = pageContent.replace(
    /<Link href="\/" className="flex rounded items-center gap-3">\s*<img src="\/DevSia\.png" alt="Logo" className="w-10 h-10 object-contain shadow-lg rounded-xl" \/>\s*<span className={`text-2xl font-bold tracking-tight transition-colors \${scrolled \? 'text-slate-900' : 'text-slate-900'}`}>\s*DevSia\s*<\/span>\s*<\/Link>/,
    `<Link href="/" className="flex rounded items-center gap-3">
          <img src="/dev-sia.png" alt="Logo" className="h-10 w-auto object-contain shadow-lg rounded-xl bg-white" />
        </Link>`
);

// Replace footer
pageContent = pageContent.replace(
    /<div className="flex items-center gap-3">\s*<img src="\/DevSia\.png" alt="Logo" className="w-8 h-8 object-contain" \/>\s*<span className="font-bold text-slate-900 text-lg">DevSia<\/span>\s*<\/div>/,
    `<div className="flex items-center gap-3">
            <img src="/dev-sia.png" alt="Logo" className="h-8 w-auto object-contain" />
          </div>`
);

fs.writeFileSync(pagePath, pageContent);

let sidebarPath = './components/layout/sidebar.tsx';
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

// Remove the span showing agency name
sidebarContent = sidebarContent.replace(
    /\{\!isCollapsed && \(\s*<span className="text-lg font-bold text-white tracking-tight animate-in fade-in duration-500 truncate">\s*\{isLoading && \!cachedName \? "Syncing\.\.\." : cachedName\}\s*<\/span>\s*\)\}/g,
    ''
);

// Change /DevSia.png to /dev-sia.png
sidebarContent = sidebarContent.replace(/\/DevSia\.png/g, '/dev-sia.png');

// Change w-10 h-10 to h-8 w-auto for the image container and image
sidebarContent = sidebarContent.replace(
    /<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white\/10 shadow-inner">/g,
    `<div className="flex h-10 shrink-0 items-center justify-center rounded-xl shadow-inner">`
);
sidebarContent = sidebarContent.replace(
    /"h-6 w-6 object-contain transition-opacity duration-300"/g,
    `"h-8 w-auto object-contain transition-opacity duration-300"`
);


fs.writeFileSync(sidebarPath, sidebarContent);
console.log('Fixed Logos');
