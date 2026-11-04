import hooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

// only what catches real bugs here: hook order and stale closures
export default tseslint.config({
  files: ['src/**/*.{ts,tsx}'],
  languageOptions: { parser: tseslint.parser },
  plugins: { 'react-hooks': hooks },
  linterOptions: { reportUnusedDisableDirectives: false },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
});
