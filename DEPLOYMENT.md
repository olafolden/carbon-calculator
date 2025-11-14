# Deployment Guide

## Netlify Deployment

### Option 1: Deploy via Netlify CLI

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Deploy the site:
```bash
netlify deploy --prod
```

### Option 2: Deploy via Netlify Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Go to [Netlify](https://app.netlify.com/) and sign in

3. Click "Add new site" → "Import an existing project"

4. Connect your Git provider and select your repository

5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18 or higher

6. Click "Deploy site"

### Option 3: Drag and Drop

1. Build the project locally:
```bash
npm run build
```

2. Go to [Netlify Drop](https://app.netlify.com/drop)

3. Drag and drop the `dist` folder

## Other Deployment Options

### Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

Or use the Vercel Dashboard similar to Netlify.

### GitHub Pages

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Add to package.json:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://yourusername.github.io/carbon-calculator"
}
```

3. Update vite.config.ts:
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/carbon-calculator/'
})
```

4. Deploy:
```bash
npm run deploy
```

## Environment Variables

This application doesn't require any environment variables as it runs entirely client-side.

## Custom Domain

After deployment, you can configure a custom domain in your hosting provider's dashboard.

## Troubleshooting

- If you encounter build errors, ensure Node.js version is 18 or higher
- Clear the npm cache if dependencies fail: `npm cache clean --force`
- Check that all dependencies are installed: `npm install`
