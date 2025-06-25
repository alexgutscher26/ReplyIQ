import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      if (wxt.config.command === 'serve') {
        // https://github.com/wxt-dev/examples/tree/main/examples/dynamic-content-scripts
        // During development, content script is not listed in manifest, causing
        // "webext-dynamic-content-scripts" to throw an error. So we need to
        // add it manually.
        manifest.content_scripts ??= []
        manifest.content_scripts.push({
          js: ['content-scripts/example.js'],
          matches: ['https://example.com/'],
          // If the script has CSS, add it here.
        }, {
          js: ['content-scripts/x.js'],
          matches: ['*://x.com/*'],
        }, {
          js: ['content-scripts/linkedin.js'],
          matches: ['*://*.linkedin.com/*'],
        }, {
          js: ['content-scripts/facebook.js'],
          matches: ['*://*.facebook.com/*'],
        })
      }
    },
  },
  manifest: () => ({
    default_locale: 'en',
    description: '__MSG_extension_description__',
    host_permissions: [new URL('/', import.meta.env.WXT_SITE_URL).href],
    name: '__MSG_extension_name__',
    permissions: [],
    web_accessible_resources: [{ matches: ['*://x.com/*'], resources: ['x-parser.js'] }],
  }),
  modules: [
    '@wxt-dev/module-react',
    '@wxt-dev/auto-icons',
    '@wxt-dev/i18n/module',
  ],
  srcDir: 'src',
})
