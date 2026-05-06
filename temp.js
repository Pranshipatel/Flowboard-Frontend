const fs = require('fs');
let content = fs.readFileSync('src/app/app.routes.ts', 'utf8');
content = content.replace(/\s*\{\s*path:\s*'login'[\s\S]*?\},/g, '');
content = content.replace(/\s*\{\s*path:\s*'register'[\s\S]*?\},/g, `
  {
    path: 'guest/board/:id',
    loadComponent: () => import('./pages/board/board-view/board-view.component').then(m => m.BoardViewComponent)
  },`);
fs.writeFileSync('src/app/app.routes.ts', content);
