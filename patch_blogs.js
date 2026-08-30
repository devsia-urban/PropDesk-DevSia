const fs = require('fs');

const file = '/Users/divitjain/Downloads/propdesk/lib/blog-data.ts';
let content = fs.readFileSync(file, 'utf8');

// Global replace 2025 with 2026
content = content.replace(/2025/g, '2026');

// Insert images
content = content.replace(
  /content: `\n## Why Indian Brokers Need a Dedicated Property Management Software/g,
  'content: `\n![Best Property Management Software](/images/blog/crm_software_2026.png)\n\n## Why Indian Brokers Need a Dedicated Property Management Software'
);

content = content.replace(
  /content: `\n## Why Your Real Estate Agency Needs a Proper CRM System/g,
  'content: `\n![How to Choose a Real Estate CRM](/images/blog/choose_crm_2026.png)\n\n## Why Your Real Estate Agency Needs a Proper CRM System'
);

content = content.replace(
  /content: `\n## The WhatsApp Group Problem Every Indian Broker Knows/g,
  'content: `\n![WhatsApp vs CRM](/images/blog/whatsapp_vs_crm.png)\n\n## The WhatsApp Group Problem Every Indian Broker Knows'
);

content = content.replace(
  /content: `\n## The Death of Old Real Estate SEO/g,
  'content: `\n![Real Estate SEO](/images/blog/seo_real_estate_2026.png)\n\n## The Death of Old Real Estate SEO'
);

content = content.replace(
  /content: `\n## Moving Past Solo Operations/g,
  'content: `\n![Scaling a Real Estate Agency](/images/blog/scale_agency_india.png)\n\n## Moving Past Solo Operations'
);

content = content.replace(
  /content: `\n## The New Era of Indian Real Estate/g,
  'content: `\n![AI in Real Estate](/images/blog/ai_real_estate_2026.png)\n\n## The New Era of Indian Real Estate'
);

fs.writeFileSync(file, content);
console.log("Blog data successfully patched with 2026 dates and images!");
