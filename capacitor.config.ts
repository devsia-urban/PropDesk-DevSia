import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nexora.propertymanager',
  appName: 'PropDesk',
  webDir: 'out',
  server: {
    url: 'https://propdesk.vercel.app', // <--- PASTE YOUR LIVE URL HERE
    cleartext: true
  }
};

export default config;
