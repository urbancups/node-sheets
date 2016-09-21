# node-sheets

> Read rows from google spreadsheet with google's sheets api.

[![Build Status](https://travis-ci.org/urbancups/node-sheets.svg?branch=master)](https://travis-ci.org/urbancups/node-sheets)

** This library is beta so you should use it with care. We will make an effort to support the library, but we reserve the right to make incompatible changes when necessary.

## Instalation

This library is distributed on `npm`. In order to add it as a dependency, run the following command:


```bash
$ npm install node-sheets --save
```

## Usage

Example to retrieve data from [this google spreadsheet](https://docs.google.com/spreadsheets/d/1amfst1WVcQDntGe6walYt-4O5SCrHBD5WntbjhvfIm4) using ES7 async/await.

```javascript
import Sheets from 'node-sheets'
try {
  const gs = new Sheets('1amfst1WVcQDntGe6walYt-4O5SCrHBD5WntbjhvfIm4')
  const authData = require('someGoogleCredentials.json') // authData = { client_email, private_key }
  await gs.authorizeJWT(authData)
  const table = await gs.table('Formats!A1:E3')
  console.log(table.headers)
  console.log(table.formats)
  console.log(table.rows)
} catch (err) {
  console.error(err)
}
```

You can also use the lib with Promises.

```javascript
import Sheets from 'node-sheets'
const gs = new Sheets('1amfst1WVcQDntGe6walYt-4O5SCrHBD5WntbjhvfIm4')
const authData = require('someGoogleCredentials.json') // authData = { client_email, private_key }
gs.authorizeJWT(authData)
  .then(() => gs.table('Formats!A1:E3'))
  .then(table => {
    console.log(table.headers)
    console.log(table.formats)
    console.log(table.rows)
  })
  .catch(err => {
    console.error(err)
  })
```

If you want to use this with `require` you need to import the `default`:

```javascript
const Sheets = require('node-sheets').default
```

## Authentication

For now, node-sheets offers two authentication mechanisms.

 1. With JWT token (`.authorizeJWT(auth [, scopes])`) using `private_key` and `client_email`, and also allowing to set auth scopes. The default auth scope is https://www.googleapis.com/auth/spreadsheets.readonly.

 1. With APIKEY (`.authorizeApiKey(apikey)`) using an API Key you have created in the [google developers console](https://console.developers.google.com).

## Other API Methods

- `Sheets.getLastUpdateDate()`: Returns a ISO_8601 compatible string with the last update date of the spreadsheet.

## Examples

You can check the `/test/index.js` file for examples.


## License

This library is licensed under MIT. Full license text is available in [LICENSE](LICENSE).

## Contributing

We appreciate any contribution to this project. We keep a list of features and bugs in the [issue tracker](https://github.com/urbancups/node-sheets/issue).
