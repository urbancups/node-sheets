import Q from 'q'
import google from 'googleapis'
import util from 'util'

export default class Sheets {

  /**
   * Create an instance of Sheets for a given google spreadsheet id
   */
  constructor (spreadsheetId) {
    if (spreadsheetId === undefined) {
      throw new Error('"spreadsheetId" is a required argument')
    }

    this.spreadsheetId = spreadsheetId
    this.auth = null
  }

  /**
   * Performs Google APIs authentication with the given JWT key info.
   * The key object need to have a `client_email` and `private_key` fields.
   *
   * You can create a key in the [google developers console](https://console.developers.google.com).
   */
  async authorizeJWT (key, scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']) {
    try {
      if (!key) throw new Error('"key" is a required argument')

      this.auth = new google.auth.JWT(key.client_email, null, key.private_key, scopes, null)
      await Q.ninvoke(this.auth, 'authorize')
    } catch (err) {

      throw err
    }
  }

  /**
   * Performs Google APIs authentication with the given API KEy.
   *
   * You can create a new key in the [google developers console](https://console.developers.google.com).
   */
  async authorizeApiKey (apikey) {
    if (!apikey) throw new Error('"apikey" is a required argument')
    this.auth = apikey
  }

  /**
   * Returns the last update date of the spreadsheet.
   * Date is returned as a string in RFC 3339 date-time format. Example: 1985-04-12T23:20:50.52Z
   * This date-time format is parsable by Date constructor in Javascript and momentjs library.
   */
  async getLastUpdateDate () {
    var drive = google.drive('v3')
    const response = await Q.ninvoke(drive.files, "get", {
      auth: this.auth,
      fileId: this.spreadsheetId,
      fields: 'modifiedTime'
    })
    const res = response[0]
    return res.modifiedTime
  }

  /**
   * Returns a spreadsheet range in tabular cols format.
   * The tabular cols format returns the content by cols, and each col contains the values for each row.
   *
   * [ { header: 'Automatic',  values: [ 'Oil', 'Grass' ],                       stringValues: [ 'Oil', 'Grass' ],                      format: { numberFormat: { type: 'NONE' } } },
   *   { header: 'Currency',   values: [ 0.41, 1.3 ],                            stringValues: [ '$0.41', '$1.30' ],                    format: { numberFormat: { type: 'CURRENCY', pattern: '"$"#,##0.00' } } },
   *   { header: 'Date',       values: [ Date(24, 1, 2016), Date(15, 5, 2016) ], stringValues: [ '1/25/2016', '5/15/2016' ],            format: { numberFormat: { type: 'DATE', pattern: 'M/d/yyyy' } } },
   *   { header: 'Number',     values: [ 123, 4 ],                               stringValues: [ '123.00', '4.00' ],                    format: { numberFormat: { type: 'NUMBER', pattern: '#,##0.00' } } },
   *   { header: 'Plain Text', values: [ 'This is some text', 'Another text' ],  stringValues: [ 'This is some text', 'Another text' ], format: { numberFormat: { type: 'TEXT' } } }
   * ]
   *
   * Note: Formats are retrieved from first data row.
   */
  async tableCols (range) {
    const spreadsheet = await getRange(this.auth, this.spreadsheetId, range)

    const sheet = spreadsheet.sheets[0] // first (unique) sheet
    const gridData = sheet.data[0]  // first (unique) range
    const headers = gridData.rowData[0].values // first row (headers)
                            .map(col => formattedValue(col))

    const otherRows = gridData.rowData.slice(1)

    return headers.map((header, headerIdx) => (
      {
        header: header,
        stringValues: otherRows.map(row => formattedValue(row.values[headerIdx])),
        values: otherRows.map(row => effectiveValue(row.values[headerIdx])),
        format: effectiveFormat(otherRows[0].values[headerIdx])  // format of first data line/cell
      }
    ))

  }

  /**
   * Returns a spreadsheet range in tabular row format.
   * The tabular row format returns the content by rows, and each row contains the values for each column.
   *
   * {
   *  headers: ['Header 1', 'Header 2', 'Header 3'],
   *  formats: [
   *    { numberFormat: { type: 'NONE' } },
   *    { numberFormat: { type: 'CURRENCY', pattern: '"$"#,##0.00' } },
   *    { numberFormat: { type: 'NUMBER', pattern: '#,##0.00' } } ]
   *  rows: [
   *    { values: ['some text', 0.41, 3], stringValues: ['some text', '$0.41', '3.00' ] },
   *    { values: ['some text', 0.41, 3], stringValues: ['some text', '$0.41', '3.00' ] },
   *    { values: ['some text', 0.41, 3], stringValues: ['some text', '$0.41', '3.00' ] },
   *    { values: ['some text', 0.41, 3], stringValues: ['some text', '$0.41', '3.00' ] }
   *  ]
   * }
   *
   * Note: Formats are retrieved from first data row.
   */
  async table (range) {
    const spreadsheet = await getRange(this.auth, this.spreadsheetId, range)

    const sheet = spreadsheet.sheets[0] // first (unique) sheet
    const gridData = sheet.data[0]  // first (unique) range
    const headers = gridData.rowData[0].values // first row (headers)
                            .map(col => formattedValue(col))

    const otherRows = gridData.rowData.slice(1)

    return {
      headers: headers,
      formats: otherRows[0].values.map(value => effectiveFormat(value)),
      rows: otherRows.map(row => ({
        values: row.values.map(value => effectiveValue(value)),
        stringValues: row.values.map(value => formattedValue(value))
      }))
    }
  }


}

function formattedValue (value) {
  return value ? value.formattedValue : value
}

function effectiveValue (value) {
  if (!value) return value

  if (value.effectiveFormat === null || value.effectiveFormat === undefined) {
    return value.formattedValue
  }

  if (value.effectiveFormat.numberFormat) {
    switch (value.effectiveFormat.numberFormat.type) {
      case 'TEXT':
        return value.effectiveValue && value.effectiveValue.stringValue ? value.effectiveValue.stringValue : ''
      case 'NUMBER':
        return value.effectiveValue && value.effectiveValue.numberValue ? value.effectiveValue.numberValue : 0
      case 'CURRENCY':
        return value.effectiveValue && value.effectiveValue.numberValue ? value.effectiveValue.numberValue : 0
      case 'DATE':  // 'serial number' format
        return value.effectiveValue && value.effectiveValue.numberValue
          ? ExcelDateToJSDate(value.effectiveValue.numberValue)
          : new Date()
    }
  }

  return value.formattedValue
}

function effectiveFormat (value) {
  if(value.effectiveFormat) { return value.effectiveFormat }
  return { numberFormat: { type: 'NONE' } }
}

/**
 * Converting Excel Date Serial Number to Date using Javascript
 * Source: http://stackoverflow.com/a/16233621/336596
 * @param {[type]} serial a date value in "Excel Date Serial" format
 */
function ExcelDateToJSDate(serial) {
   var utc_days  = Math.floor(serial - 25569);
   var utc_value = utc_days * 86400;
   var date_info = new Date(utc_value * 1000);

   var fractional_day = serial - Math.floor(serial) + 0.0000001;

   var total_seconds = Math.floor(86400 * fractional_day);

   var seconds = total_seconds % 60;

   total_seconds -= seconds;

   var hours = Math.floor(total_seconds / (60 * 60));
   var minutes = Math.floor(total_seconds / 60) % 60;

   return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}

/**
 * Utility function to get a range from a spreadsheet
 */
async function getRange (
  auth,
  spreadsheetId,
  range,
  fields = 'properties.title,sheets.properties,sheets.data(rowData.values.effectiveValue,rowData.values.formattedValue,rowData.values.effectiveFormat.numberFormat)'
) {
  var sheets = google.sheets('v4')
  const response = await Q.ninvoke(sheets.spreadsheets, "get", {
    auth: auth,
    spreadsheetId: spreadsheetId,
    // https://developers.google.com/sheets/guides/concepts, https://developers.google.com/sheets/samples/sheet
    fields: fields,
    includeGridData: true,
    ranges: [range],
  })
  const spreadsheet = response[0]
  return spreadsheet
}
