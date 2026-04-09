import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const owner = process.env.GITHUB_REPOSITORY_OWNER;
const defaultBase = process.env.GITHUB_ACTIONS === 'true' && repoName ? `/${repoName}` : '/';
const defaultSite = process.env.GITHUB_ACTIONS === 'true' && owner
  ? `https://${owner}.github.io`
  : 'https://hobackclub.com';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || defaultSite,
  base: process.env.PUBLIC_BASE_PATH || defaultBase,
  integrations: [sitemap()],
  output: 'static',
});
