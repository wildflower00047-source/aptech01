import { Router } from 'express';
import express from 'express';
import swaggerUiDist from 'swagger-ui-dist';
import { openapi } from '../docs/openapi.js';

const router = Router();

// Machine-readable spec.
router.get('/openapi.json', (_req, res) => res.json(openapi));

// Self-hosted Swagger UI assets (no CDN, so the strict CSP stays intact).
router.use('/assets', express.static(swaggerUiDist.getAbsoluteFSPath(), { index: false, maxAge: '1d' }));

// External init script (kept out of the HTML so the CSP never needs 'unsafe-inline').
router.get('/init.js', (_req, res) => {
  res.type('application/javascript').send(
    "window.addEventListener('load',function(){" +
      "window.ui=SwaggerUIBundle({url:'/api/docs/openapi.json',dom_id:'#swagger-ui'," +
      "deepLinking:true,presets:[SwaggerUIBundle.presets.apis,SwaggerUIStandalonePreset]," +
      "layout:'BaseLayout'});});",
  );
});

router.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>AuthSec API Docs</title>
    <link rel="stylesheet" href="/api/docs/assets/swagger-ui.css" />
    <style>body{margin:0;background:#0b1120}</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/api/docs/assets/swagger-ui-bundle.js"></script>
    <script src="/api/docs/assets/swagger-ui-standalone-preset.js"></script>
    <script src="/api/docs/init.js"></script>
  </body>
</html>`);
});

export default router;
