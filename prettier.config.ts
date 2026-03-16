import type { Config } from 'prettier';

const config: Config = {
  trailingComma: 'all',
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  jsxSingleQuote: true,
  singleAttributePerLine: true,
  printWidth: 100,
  plugins: ['prettier-plugin-tailwindcss'],
};

export default config;
