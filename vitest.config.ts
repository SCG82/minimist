import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        include: ['test/*.ts', 'test/*.js'],
        /**
         * not to ESM ported packages
         */
        exclude: ['dist', '.idea', '.git', '.cache', '**/node_modules/**'],
        coverage: {
            enabled: true,
            exclude: ['**/build/**', 'test/**'],
            lines: 94,
            functions: 88,
            branches: 93,
            statements: 94,
        },
    },
})
