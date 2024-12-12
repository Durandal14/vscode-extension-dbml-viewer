# DBML Viewer

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
![](https://img.shields.io/github/package-json/v/durandal14/vscode-extension-dbml-viewer)

An extension for Visual Studio Code that provides real-time rendering of a database schema from the generated DBML code.

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/vscode-extension-dbml-viewer.git
    cd vscode-extension-dbml-viewer
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

## Build

To build the project, run:
```sh
npm run build
```

## Supported Syntax

The DBML Viewer now supports both the current syntax and the syntax used on dbdiagram.io.

### Example

```dbml
table user {
    id uuid pk
    name text unique
    verbandsschlüssel char(1)
}
```

or

```dbml
table user {
    id uuid [pk]
    name text [unique]
    verbandsschluessel char(1)
}
```

## Table Definitions

To create tables and fields, use the Table definition syntax.

### Example

```dbml
Table users {
  id int [PK]
  email varchar
  gender varchar
  relationship varchar
  dob datetime
  country int
}

Table countries {
  code int [PK]
  name varchar
  continent_name varchar
}
```

## Relationships

We support 2 ways of creating relationships:

1. Typing DBML code
2. Interacting directly on the diagrams itself, by dragging from field to field.

### Example

The below defines a 1-n relationship between `countries.code` to `users.country`.

```dbml
Ref: countries.code < users.country;
```

or use inline relationships:

```dbml
Table users {
  id int [primary key]
  country int [ref: > countries.code] // many-to-one
  ...
}
```

## Schemas

You can define the tables with full schema names:

```dbml
Table ecommerce.order_items {
  ...
}
```

Moreover, you can make cross-schemas relationships and use enums from different schemas:

```dbml
Table orders {
  id int [pk, ref: < ecommerce.order_items.order_id]
  status core.order_status
  ...
}

Enum core.order_status {
  ...
}
```

## Roadmap

-   [x] ~Live preview (eye icon in the top right corner / command palette)~
-   [x] ~Download SVG (in command palette)~
-   [x] ~Code Structure with layout of code~
-   [ ] Light/dark mode toggle
-   [ ] Zooming in/out
-   [ ] Change the ugly logo

## Demo

![Demo](./dbml-demo.gif)

## Appendix

This extension is a perfect complement to [vscode-dbml](vscode:extension/matt-meyers.vscode-dbml) (color syntaxing and SQL export commands).

## References

Here are some related projects used in this extension

[@softwaretechnik-berlin/dbml-renderer](https://github.com/softwaretechnik-berlin/dbml-renderer/)

## Authors

-   [@Durandal14](https://www.github.com/durandal14)
