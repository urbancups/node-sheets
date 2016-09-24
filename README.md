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
- `Sheets.getSheetsNames()`: Returns a list with all the names of the sheets in the spreadsheet.
- `Sheets.tables(rangeArray)`: Returns array of #table information for each range specified. Note that you may need to append `!A:ZZZ` to the end of your sheet name, if the name use a syntax compatible with a range (ex: A100). More info [here](http://stackoverflow.com/a/39641586).

## Reponse schema for `.table(range)` / `.tables(ranges)`

Returns a spreadsheet range in tabular row format. The tabular row format returns the content by rows, and each row contains the values for each column.

### Sample

| Header 1   | Header 2 | Header 3 |
| ---------- | -------- | -------- |
| row 1 text | $0.41    | 3.00     |
| ...        | ...      | ...      |

```javascript
const table = await gs.table('Formats')

{
 title: 'Formats',                                                        // name of the sheet/table
 headers: ['Header 1', 'Header 2', 'Header 3'],                           // name of the headers (1st row)
 formats: [                                                               // array with information regarding cell format
   { numberFormat: { type: 'NONE' } },
   { numberFormat: { type: 'CURRENCY', pattern: '"$"#,##0.00' } },
   { numberFormat: { type: 'NUMBER', pattern: '#,##0.00' } } ]
 rows: [                                                                  // rows contains the values for 2nd row ahead
   {                                                                      // Each row object has:
     cols: {                                                                  // cols - map header -> (value | stringValue)
       'Header 1': { value: 'row 1 text', stringValue: 'row 1 text' },
       'Header 2': { value: 0.41, stringValue: '$0.41' },
       'Header 3': { value: 3, stringValue: '3.00' }
      },
      values: ['row 1 text', 0.41, 3],                                        // values - array with values for each header
      stringValue: ['row 1 text', '$0.41', '3.00']                            // stringValue - string representation of the values for each header
    },
   { ... },
   { ... }
 ]
}
```

Sample access to the value of col 'Header 2' of first row:

```javascript
const currencyValue = table.rows[0].cols['Header 2'].value     // 0.41
```

It is also possible to get an array with all the (column) values for the row (formatted and string versions):

```javascript
const rowValues = table.rows[0].values              // [..., ..., ...]
const rowValues = table.rows[0].stringValues        // ['...', '...', ...]
```


**Note:** Formats are retrieved from first data row.


## Examples

You can check the `/test/index.js` file for examples.


## License

This library is licensed under MIT. Full license text is available in [LICENSE](LICENSE).

## Contributing

We appreciate any contribution to this project. We keep a list of features and bugs in the [issue tracker](https://github.com/urbancups/node-sheets/issue).
