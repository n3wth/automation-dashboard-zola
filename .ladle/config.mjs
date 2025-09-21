export default {
  stories: 'src/**/*.stories.{js,jsx,ts,tsx}',
  outDir: 'dist-ladle',
  serve: {
    port: 61000,
  },
  build: {
    outDir: 'dist-ladle',
  },
  viteConfig: './vite.config.ts',
  defaultStory: 'Button',
}