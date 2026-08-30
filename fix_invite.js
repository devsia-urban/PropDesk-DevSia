const fs = require('fs');

// 1. Fix API Route
let apiPath = './app/api/team/invite/route.ts';
let apiContent = fs.readFileSync(apiPath, 'utf8');

apiContent = apiContent.replace(
    /const \{ data, error \} = await supabaseAdmin\.auth\.admin\.inviteUserByEmail\(email, \{\n\s*data: \{\n\s*agency_id: profile\.agency_id,\n\s*role: role,\n\s*\},\n\s*redirectTo: `\$\{origin\}\/accept-invite`,\n\s*\}\)/,
    `const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        data: {
          agency_id: profile.agency_id,
          role: role,
        },
        redirectTo: \`\${origin}/accept-invite\`,
      }
    })`
);

apiContent = apiContent.replace(
    /return NextResponse\.json\(\{ message: `Invite sent to \$\{email\}`, userId: data\.user\?\.id \}\)/,
    `return NextResponse.json({ 
      message: \`Invite generated for \${email}\`, 
      userId: data.user?.id,
      inviteUrl: data.properties?.action_link
    })`
);

fs.writeFileSync(apiPath, apiContent);

// 2. Fix Frontend UI
let clientPath = './components/team/team-client.tsx';
let clientContent = fs.readFileSync(clientPath, 'utf8');

clientContent = clientContent.replace(
    /        toast\.success\(`Invite sent to \$\{inviteEmail\}`\, \{\n\s*description: `They'll receive an email to join as \$\{ROLE_MAP\[inviteRole\]\.label\}\.`\n\s*\}\)/,
    `        if (data.inviteUrl) {
          navigator.clipboard.writeText(data.inviteUrl).catch(()=>{});
          toast.success("Invite link copied to clipboard!", {
            description: \`Share this secure link with \${inviteEmail} to let them join.\`
          });
        } else {
          toast.success(\`Invite sent to \${inviteEmail}\`, {
            description: \`They'll receive an email to join as \${ROLE_MAP[inviteRole].label}.\`
          });
        }`
);

fs.writeFileSync(clientPath, clientContent);
console.log('Fixed Invite Flow');
