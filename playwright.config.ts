import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  reporter: [['json', { outputFile: 'test-results/results.json' }], ['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
  },
  webServer: {
    command: 'node -e "const http=require(\'node:http\');const fs=require(\'node:fs\');const path=require(\'node:path\');const root=path.resolve(process.cwd());http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,\'http://localhost\').pathname);const requested=pathname===\'/\'?\'index.html\':pathname.slice(1);const file=path.resolve(root,requested);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end(\'Forbidden\');return;}fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end(\'Not found\');return;}res.setHeader(\'Content-Type\',file.endsWith(\'.html\')?\'text/html; charset=utf-8\':\'application/octet-stream\');res.end(data);});}).listen(4173,\'127.0.0.1\');"',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
