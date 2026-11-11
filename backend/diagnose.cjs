const { spawn } = require('child_process');
const http = require('http');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const proc = spawn(edgePath, [
  '--headless',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--no-sandbox',
  'http://127.0.0.1:8000/'
]);

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  await wait(2000);
  const targets = await getJson('http://127.0.0.1:9222/json');
  const page = targets.find(t => t.url && t.url.includes('127.0.0.1:8000'));
  if (!page) {
    console.log('No page target found');
    proc.kill();
    return;
  }

  const WebSocket = require('node_modules/vite/node_modules/ws') || null;
  // Let's use simple ws
  console.log('Page ws url:', page.webSocketDebuggerUrl);
  proc.kill();
}

run();
