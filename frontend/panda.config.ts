import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx,vue}'],

  // Files to exclude
  exclude: [],

  // Output directory for generated files
  outdir: 'styled-system',

  // Theme configuration
  theme: {
    extend: {
      tokens: {
        colors: {
          primary: {
            50: { value: '#f0f9ff' },
            100: { value: '#e0f2fe' },
            200: { value: '#bae6fd' },
            300: { value: '#7dd3fc' },
            400: { value: '#38bdf8' },
            500: { value: '#0ea5e9' },
            600: { value: '#0284c7' },
            700: { value: '#0369a1' },
            800: { value: '#075985' },
            900: { value: '#0c4a6e' },
          },
          secondary: {
            50: { value: '#faf5ff' },
            100: { value: '#f3e8ff' },
            200: { value: '#e9d5ff' },
            300: { value: '#d8b4fe' },
            400: { value: '#c084fc' },
            500: { value: '#a855f7' },
            600: { value: '#9333ea' },
            700: { value: '#7e22ce' },
            800: { value: '#6b21a8' },
            900: { value: '#581c87' },
          },
          neutral: {
            50: { value: '#fafafa' },
            100: { value: '#f5f5f5' },
            200: { value: '#e5e5e5' },
            300: { value: '#d4d4d4' },
            400: { value: '#a3a3a3' },
            500: { value: '#737373' },
            600: { value: '#525252' },
            700: { value: '#404040' },
            800: { value: '#262626' },
            900: { value: '#171717' },
          },
          success: { value: '#10b981' },
          warning: { value: '#f59e0b' },
          error: { value: '#ef4444' },
          info: { value: '#3b82f6' },
        },
        fonts: {
          body: { value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
          heading: { value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
          mono: { value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
        },
        spacing: {
          xs: { value: '0.25rem' },
          sm: { value: '0.5rem' },
          md: { value: '1rem' },
          lg: { value: '1.5rem' },
          xl: { value: '2rem' },
          '2xl': { value: '3rem' },
          '3xl': { value: '4rem' },
        },
        radii: {
          sm: { value: '0.25rem' },
          md: { value: '0.375rem' },
          lg: { value: '0.5rem' },
          xl: { value: '0.75rem' },
          '2xl': { value: '1rem' },
          full: { value: '9999px' },
        },
      },
    },
  },

  // Global CSS
  globalCss: {
    'html, body': {
      margin: 0,
      padding: 0,
      fontFamily: 'body',
    },
  },

  // JSX framework
  jsxFramework: 'vue',
})
