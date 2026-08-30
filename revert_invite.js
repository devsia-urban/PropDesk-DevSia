const fs = require('fs');

// 1. Revert API Route
let apiPath = './app/api/team/invite/route.ts';
let apiContent = fs.readFileSync(apiPath, 'utf8');

apiContent = apiContent.replace(
    /const \{ data, error \} = await supabaseAdmin\.auth\.admin\.generateLink\(\{\n\s*type: 'invite',\n\s*email: email,\n\s*options: \{\n\s*data: \{\n\s*agency_id: profile\.agency_id,\n\s*role: role,\n\s*\},\n\s*redirectTo: `\$\{origin\}\/accept-invite`,\n\s*\}\n\s*\}\)/,
    `const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        agency_id: profile.agency_id,
        role: role,
      },
      redirectTo: \`\${origin}/accept-invite\`,
    })`
);

apiContent = apiContent.replace(
    /return NextResponse\.json\(\{ \n\s*message: `Invite generated for \$\{email\}`, \n\s*userId: data\.user\?\.id,\n\s*inviteUrl: data\.properties\?\.action_link\n\s*\}\)/,
    `return NextResponse.json({ message: \`Invite sent to \${email}\`, userId: data.user?.id })`
);

fs.writeFileSync(apiPath, apiContent);

// 2. Revert Frontend UI
let clientPath = './components/team/team-client.tsx';
let clientContent = fs.readFileSync(clientPath, 'utf8');

clientContent = clientContent.replace(
    /        if \(data\.inviteUrl\) \{\n\s*navigator\.clipboard\.writeText\(data\.inviteUrl\)\.catch\(\(\)=>\{\}\);\n\s*toast\.success\("Invite link copied to clipboard!", \{\n\s*description: `Share this secure link with \$\{inviteEmail\} to let them join\.`\n\s*\}\);\n\s*\} else \{\n\s*toast\.success\(`Invite sent to \$\{inviteEmail\}`\, \{\n\s*description: `They'll receive an email to join as \$\{ROLE_MAP\[inviteRole\]\.label\}\.`\n\s*\}\);\n\s*\}/,
    `        toast.success(\`Invite sent to \${inviteEmail}\`, {
          description: \`They'll receive an email to join as \${ROLE_MAP[inviteRole].label}.\`
        })`
);

fs.writeFileSync(clientPath, clientContent);
console.log('Reverted Invite Flow');
