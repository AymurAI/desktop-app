# AymurAI Desktop App

## Technologies

### Main technologies

- ⚛️ **React** + 🆎 **TypeScript** as the _main framework_ with _type checking_
tools
- ⚡ **Electron** as the _deployment and packaging tool_. It also serves the
purpose of communicating the webapp with the _NodeJS_ process.
- 🪡 **Stitches** as the _styling library_
- 🛣️ **React Router** as the _routing library_ to navigate across the webapp
- 📄 **Mammoth** + **ExcelJS** as the _libraries_ to read and write `.docx` and
datasheet files

### Other technologies

- **npm** as the _package manager_
- **ESLint** as the _code linter_

##  Getting started

1. Clone the repository
1. Add your [Google OAuth Client ID](https://developers.google.com/identity/protocols/oauth2)
as an `.env` file

   ```bash
   $ vim .env

   REACT_APP_CLIENT_ID="XXXXXXXXXXXX" # Your Client ID
   ```

1. Install dependencies with

   ```bash
   npm install
   ```

1. Start the app in development mode with

   ```bash
   npm run dev
   ```

## Run Aymurai API

1. First download the image

    ```sh
    docker pull registry.gitlab.com/collective.ai/datagenero-public/aymurai-api-prod
    ```

2. And then create the corresponding container

    ```sh
    docker run -p 8899:8899 -h -d registry.gitlab.com/collective.ai/datagenero-public/aymurai-api-prod:latest
    ```

## Scripts

### Development

- `dev:web`: levanta el frontend localmente para poder ser visualizado en un
  browser convencional
- `dev`: levanta el frontend localmente y crea una instancia de _Electron_ para
  poder visualizarlo

### Build

- `build:renderer`: genera un build de la aplicación de _Electron_
- `build:app`: genera un build de la aplicación de _React_
- `build`: genera un build de la aplicación de _React_ y luego un build de la
  aplicación de _Electron_

### Validation

- `lint`: corre el linter (_ESLint_) en todo el proyecto
- `lint:markdown`: corre el linter de markdown (_MarkdownLint_), pero
  únicamente en los archivos de markdown
- `lint:fix`: corrige los errores de linter de formato
- `check-types:react`: corre un checko de tipado en la aplicación de _React_
- `check-types:renderer`: corre un checko de tipado en la aplicación de
  _Electron_
- `validate`: corre el linter y luego el checkeo de tipos
- `pre-commit`: corre el _LintStaged_

### Deployment

- `package`: genera la aplicación empaquetada en la carpeta `/out`. El tipo de
  aplicación depende del OS host
- `make`: genera un instalador de la aplicación empaquetada. También depende del
  OS host

##  Colaborators

- Melina Gatto (_Project Manager_)
- Luciana Vega (_Project Manager_)
- Andy Orlandi (_Product Designer_)
- Luciano Lapenna (_Developer_)

## Special thanks

- Lucia Wainfeld
