import { defineConfig } from 'wxt'

// Environment variables
const SITE_URL = import.meta.env.WXT_SITE_URL || 'http://localhost:3000'
// eslint-disable-next-line node/prefer-global/process
const IS_DEV = process.env.NODE_ENV === 'development'

// Content script configurations
const CONTENT_SCRIPTS = [
  {
    js: ['content-scripts/example.js'],
    matches: ['https://example.com/'],
  },
  {
    js: ['content-scripts/x.js'],
    matches: ['*://x.com/*'],
  },
  {
    js: ['content-scripts/linkedin.js'],
    matches: ['*://*.linkedin.com/*'],
  },
  {
    js: ['content-scripts/facebook.js'],
    matches: ['*://*.facebook.com/*'],
  },
]

// See https://wxt.dev/api/config.html
export default defineConfig({
  // Development settings
  dev: {
    server: {
      port: 3000,
    },
  },

  extensionApi: 'chrome',
  hooks: {
    'build:before': (wxt) => {
      console.log(`Building extension for ${wxt.config.command} mode...`)
    },

    'build:done': (wxt) => {
      console.log(`✅ Extension build completed for ${wxt.config.command} mode`)
    },

    'build:manifestGenerated': (wxt, manifest) => {
      // Add content scripts during development
      if (wxt.config.command === 'serve') {
        // https://github.com/wxt-dev/examples/tree/main/examples/dynamic-content-scripts
        // During development, content script is not listed in manifest, causing
        // "webext-dynamic-content-scripts" to throw an error. So we need to
        // add it manually.
        manifest.content_scripts ??= []
        manifest.content_scripts.push(...CONTENT_SCRIPTS)
      }

      // Add CSP for production builds
      if (wxt.config.command === 'build') {
        manifest.content_security_policy = {
          extension_pages: 'script-src \'self\'; object-src \'self\';',
        }
      }

      // Add additional permissions based on environment
      manifest.permissions = [
        'activeTab',
        'storage',
        ...(IS_DEV ? ['tabs'] : []),
      ]

      // Set version name for development builds
      if (IS_DEV) {
        manifest.version_name = `${manifest.version}-dev`
      }
    },
  },

  manifest: () => ({
    // Action configuration
    action: {
      default_popup: 'popup.html',
      default_title: '__MSG_extension_name__',
    },
    // Background script configuration
    background: {
      service_worker: 'background.js',
      type: 'module',
    },
    // Commands for keyboard shortcuts
    commands: {
      'toggle-extension': {
        description: 'Toggle AI reply suggestions',
        suggested_key: {
          default: 'Ctrl+Shift+R',
          mac: 'Command+Shift+R',
        },
      },
    },
    // Content script CSP
    content_security_policy: {
      extension_pages: 'script-src \'self\'; object-src \'self\';',
    },

    default_locale: 'en',

    description: '__MSG_extension_description__',

    // Additional metadata
    homepage_url: 'https://github.com/WaitListNow/replier-extension',

    // Permissions and hosts
    host_permissions: [
      new URL('/', SITE_URL).href,
      '*://x.com/*',
      '*://*.linkedin.com/*',
      '*://*.facebook.com/*',
    ],

    // Manifest version
    manifest_version: 3,

    // Basic info
    name: '__MSG_extension_name__',

    // Optional permissions for future features
    optional_permissions: [
      'tabs',
      'scripting',
    ],

    permissions: [
      'activeTab',
      'storage',
    ],

    version: '6.0.0',

    // Web accessible resources
    web_accessible_resources: [
      {
        matches: ['*://x.com/*'],
        resources: ['x-parser.js'],
      },
    ],
  }),

  modules: [
    '@wxt-dev/module-react',
    '@wxt-dev/auto-icons',
    '@wxt-dev/i18n/module',
  ],

  // Build configuration
  outDir: '.output',

  srcDir: 'src',

  // Production optimizations
  vite: () => ({
    build: {
      minify: !IS_DEV,
      sourcemap: IS_DEV,
    },
    define: {
      // eslint-disable-next-line node/prefer-global/process
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    esbuild: {
      drop: IS_DEV ? [] : ['console', 'debugger'],
    },
  }),
})
