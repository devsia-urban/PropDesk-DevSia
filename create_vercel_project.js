const https = require('https');
const fs = require('fs');
const path = require('path');

const token = "vca_7h3tg2R8xB9518NoSKATv6oTwi9zBHtX1Hb03TBzWk9gAWZTvN4bdtaU";
const teamId = "team_A2ax03VLgUdoWcP164H7E3x1";

const data = JSON.stringify({
  name: "propdesk-devsia-enterprise",
  framework: "nextjs"
});

const options = {
  hostname: 'api.vercel.com',
  port: 443,
  path: `/v9/projects?teamId=${teamId}`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const response = JSON.parse(body);
    if (response.id) {
      console.log('Project created successfully with ID:', response.id);
      const vercelDir = path.join(__dirname, '.vercel');
      if (!fs.existsSync(vercelDir)) {
        fs.mkdirSync(vercelDir);
      }
      fs.writeFileSync(path.join(vercelDir, 'project.json'), JSON.stringify({
        projectId: response.id,
        orgId: teamId
      }, null, 2));
      console.log('Successfully linked project!');
    } else {
      console.error('Failed to create project:', response);
    }
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
