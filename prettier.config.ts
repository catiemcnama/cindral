import type { Config } from 'prettier'

const config: Config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 120,
  tabWidth: 2,
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindStylesheet: 'src/app//globals.css',
}

export default config
