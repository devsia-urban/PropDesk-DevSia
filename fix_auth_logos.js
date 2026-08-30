const fs = require('fs');

function fixAcceptInvite() {
    let p = './app/accept-invite/page.tsx';
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace(
        /<div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-50 p-2 overflow-hidden">\s*<img src=\{agencyData\?\.logo_url \|\| "\/DevSia\.png"\} alt="Logo" className="w-full h-full object-contain" \/>\s*<\/div>/g,
        `<img src={agencyData?.logo_url || "/dev-sia.png"} alt="Logo" className="h-16 w-auto object-contain bg-white rounded-2xl shadow-xl border border-slate-50 p-2" />`
    );
    // Also remove the "DevSia Access" hardcoded string if it's there? The user said "don't show agency name just show this logo".
    c = c.replace(/\{agencyData\?\.name \? `Join \$\{agencyData\.name\}` : "DevSia Access"\}/g, '{agencyData?.name ? `Join ${agencyData.name}` : ""}');
    fs.writeFileSync(p, c);
}

function fixLogin() {
    let p = './app/(auth)/login/page.tsx';
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace(
        /<div className=" h-16 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center p-2 overflow-hidden">\s*<img\s*src=\{agencyData\?\.logo_url \|\| "\/dev-sia\.png"\}\s*alt="Logo"\s*className="w-full h-full object-contain"\s*\/>\s*<\/div>/g,
        `<img src={agencyData?.logo_url || "/dev-sia.png"} alt="Logo" className="h-16 w-auto object-contain bg-white rounded-xl shadow-sm border border-slate-100 p-2" />`
    );
    // Remove adjoining DevSia text span if it exists
    c = c.replace(/<span className="text-xl font-bold text-slate-900">\s*DevSia\s*<\/span>/g, '');
    fs.writeFileSync(p, c);
}

function fixForgotPassword() {
    let p = './app/(auth)/forgot-password/page.tsx';
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace(/<img src="\/dev-sia\.png" alt="Logo" className=" h-18 object-contain shadow-xl rounded-2xl" \/>/g, '<img src="/dev-sia.png" alt="Logo" className="h-14 w-auto object-contain shadow-xl rounded-2xl p-2 bg-white" />');
    c = c.replace(/<span className="text-2xl font-bold tracking-tight text-slate-900">\s*DevSia\s*<\/span>/g, '');
    fs.writeFileSync(p, c);
}

function fixResetPassword() {
    let p = './app/(auth)/reset-password/page.tsx';
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace(/<img src="\/DevSia\.png" alt="Logo" className="w-12 h-12 object-contain shadow-xl rounded-2xl" \/>/g, '<img src="/dev-sia.png" alt="Logo" className="h-14 w-auto object-contain shadow-xl rounded-2xl p-2 bg-white" />');
    c = c.replace(/<span className="text-2xl font-bold tracking-tight text-slate-900">\s*DevSia\s*<\/span>/g, '');
    fs.writeFileSync(p, c);
}

try { fixAcceptInvite(); } catch (e) { console.error('accept-invite', e); }
try { fixLogin(); } catch (e) { console.error('login', e); }
try { fixForgotPassword(); } catch (e) { console.error('forgot-password', e); }
try { fixResetPassword(); } catch (e) { console.error('reset-password', e); }

console.log('Auth pages fixed');
