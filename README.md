# node-sheets

> Read rows from google spreadsheet with google's sheets api.

[![Build Status](https://travis-ci.org/urbancups/node-sheets.svg?branch=master)](https://travis-ci.org/urbancups/node-sheets)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## Installation

```bash
$ npm install node-sheets --save
```

## Usage

Example to retrieve data from [this google spreadsheet](https://docs.google.com/spreadsheets/d/1amfst1WVcQDntGe6walYt-4O5SCrHBD5WntbjhvfIm4) using ES7 async/await.

```javascript
import Sheets from 'node-sheets';
try {
  const gs = new Sheets('1amfst1WVcQDntGe6walYt-4O5SCrHBD5WntbjhvfIm4');
  const authData = require('someGoogleCredentials.json'); // authData = { client_email, private_key }
  await gs.authorizeJWT(authData);
  const table = await gs.tables('Formats!A1:E3');
  console.log(table.headers);
  console.log(table.formats);
  console.log(table.rows);
} catch (err) {
  console.error(err);
}
```

You can also use the lib with Promises.

```javascript
import Sheets from 'node-sheets';
const gs = new Sheets('1amfst1WVcQDntGe6walYt-4O5SCrHBD5WntbjhvfIm4');
const authData = require('someGoogleCredentials.json'); // authData = { client_email, private_key }
gs
  .authorizeJWT(authData)
  .then(() => gs.tables('Formats!A1:E3'))
  .then(table => {
    console.log(table.headers);
    console.log(table.formats);
    console.log(table.rows);
  })
  .catch(err => {
    console.error(err);
  });
```

If you want to use this with `require` you need to import the `default`:

```javascript
const Sheets = require('node-sheets').default;
```

## API

### `Sheets.tables(string|object|array)`

Returns tabular sheet data for the specified ranges. This method accepts three distinct type of arguments: string, object and array.

### String

If a **string** argument is specified, it defines the name of the range ([A1 notation](https://developers.google.com/sheets/api/guides/concepts#a1_notation)) to be retrieved from the spreadsheet.
The return model is a `SheetTable` object.

### Object

If an **object** argument is specified, we expect to have an object with `name` and (optional) `range` properties.
The return model is a `SheetTable` object.

### Array

When the argument is an **array**, we want to retrieve table values for several sheets.
The return model is an array of `SheetTable` objects.

### `SheetTable` response schema

The `.tables()` method returns SheetTable objects that contains tabular data for a sheet.

| Header 1   | Header 2 | Header 3 |
| ---------- | -------- | -------- |
| row 1 text | $0.41    | 3.00     |
| ...        | ...      | ...      |

```javascript
const table = await gs.tables('Formats');

{
 title: 'Formats',                                                        // name of the sheet/table
 headers: ['Header 1', 'Header 2', 'Header 3'],                           // name of the headers (1st row)
 formats: [                                                               // array with information regarding cell format
   { numberFormat: { type: 'NONE' } },
   { numberFormat: { type: 'CURRENCY', pattern: '"$"#,##0.00' } },
   { numberFormat: { type: 'NUMBER', pattern: '#,##0.00' } } ]
 rows: [                                                                  // rows contains the values for 2nd row ahead
   {                                                                      // Each row object has:
     'Header 1': { value: 'row 1 text', stringValue: 'row 1 text' },
     'Header 2': { value: 0.41, stringValue: '$0.41' },
     'Header 3': { value: 3, stringValue: '3.00' }
    },
   { ... },
   { ... }
 ]
}
```

Sample access to the value of col 'Header 2' of first row:

```javascript
const currencyValue = table.rows[0]['Header 2'].value; // 0.41
```

**Note:** Formats are retrieved from first data row.

### Sample usage

```js
const sheet = await gs.tables('main'); // ranges = ['main']
const sheet = await gs.tables('A100'); // ranges = ['A100']  - that is the cell A100 and not the sheet A100
const sheet = await gs.tables({sheet: 'main'}); // ranges = ['main!A:ZZZ']
const sheet = await gs.tables({sheet: 'main', range: 'A1:B4'}); // ranges = ['main!A1:B4']
const sheets = await gs.tables([{sheet: 'main'}, {sheet: 'D001', range: 'A1:D3'}, {sheet: 'D002'}]); // ranges = ['main!A:ZZZ', 'D001!A1:D3', 'D002!A:ZZZ']
```

#### Caveat

Parsing as a cell or a named range will take precedence over a sheet name when using **string** argument.
More info [here](http://stackoverflow.com/a/39641586).

## Authentication

node-sheets offers two authentication methods.

1. With JWT token (`.authorizeJWT(auth [, scopes])`) using `private_key` and `client_email`, and also allowing to set auth scopes. The default auth scope is https://www.googleapis.com/auth/spreadsheets.readonly.

1. With api key (`.authorizeApiKey(apikey)`) using an api key you have created in the [google developers console](https://console.developers.google.com).

## `Sheets.getLastUpdateDate()`

Returns a [ISO_8601](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString) compatible string with the last update date of the spreadsheet.
This can be used to check if a re-fetch is needed.

## `Sheets.getSheetsNames()`

Returns a list with all the names of the sheets in the spreadsheet.

## Examples

You can check the `/test/index.js` file for examples.

## License

This library is licensed under MIT. Full license text is available in [LICENSE](LICENSE).

## Contributing

We appreciate any contribution to this project. We keep a list of features and bugs in the [issue tracker](https://github.com/urbancups/node-sheets/issue).
