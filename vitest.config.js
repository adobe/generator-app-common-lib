/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/vitest.setup.js'],
    // only pick up the real test suites under test/ (lib/ holds template payloads
    // like common-templates/utils.test.js that must not run) — mirrors the old
    // jest testPathIgnorePatterns: ['<rootDir>/lib/']
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      all: true,
      reporter: ['text', 'json-summary', 'html'],
      // mirror jest collectCoverageFrom: ['lib/**/*.js', '!lib/common-templates/*.js']
      include: ['lib/**/*.js'],
      exclude: ['lib/common-templates/**'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100
      }
    }
  }
})
