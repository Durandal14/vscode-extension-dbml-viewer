# Change Log

All notable changes to the "dbml-viewer" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.0]

- Update DBML renderer "@softwaretechnik/dbml-renderer" -> version 1.0.30

## [0.1.1]

- Updated DBML parser to accept both current syntax and dbdiagram.io syntax.

## [Unreleased]

- Initial release
- Added support for the latest DBML syntax from dbdiagram.io
- Exported `parseTableDefinition` function from `parser.ts`
- Handled `unknown` type for the `error` variable in `extension.ts`
- Added command to generate DBML graph and display it in a webview
- Added command to save DBML content as an SVG file
- Created a file system watcher to update the webview when DBML files are changed
- Registered a document symbol provider for DBML files
- Updated `.vscodeignore` to exclude unnecessary files from the extension package
- Updated `.prettierrc` for consistent code formatting
- Updated `.gitignore` to exclude build artifacts and node_modules
- Updated `.eslintrc.json` for TypeScript linting rules
- Added integration tests using `@vscode/test-electron`
- Added MIT license
- Updated `.todo` file to reflect the current status of tasks
- Ensured compatibility with the following DBML syntax features:
  - Project Definition
  - Schema Definition
  - Public Schema
  - Table Definition
  - Table Alias
  - Table Notes
  - Table Settings
  - Column Definition
  - Column Settings
  - Default Value
  - Index Definition
  - Index Settings
  - Relationships & Foreign Key Definitions
  - Relationship settings
  - Many-to-many relationship
  - Enum Definition
  - Note Definition
  - Project Notes
  - Table Notes
  - Column Notes
  - TableGroup Notes
  - Sticky Notes
  - TableGroup
  - TableGroup Notes
  - TableGroup Settings
  - Multi-line String
  - Comments
  - Syntax Consistency
