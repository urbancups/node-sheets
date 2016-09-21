import assert from 'assert'
import util from 'util'
// import Sheets from './../src'
const Sheets = require('./../src').default

const SPREADSHEET_TEST_ID = '1amfst1WVcQDntGe6walYt-4O5SCrHBD5WntbjhvfIm4'
const SPREADSHEET_JWT_KEY = require('./../cred/node-sheets-test-e9b53a714340.json')
const SPREADSHEET_API_KEY = 'AIzaSyAwwdh_6ktghYF_AgP5pT9EfeiYWVCTr1Q'

describe('Sheets', function () {
  this.timeout(10000)

  describe('#constructor', function () {
    it('should exist and be a function', () => {
      assert.equal(typeof Sheets, 'function')
    })

    it('should throw Error with empty spreadsheetId in the constructor', () => {
      assert.throws(() => { new Sheets() }, Error)
    })

    it('should accept a string with spreadsheetId', () => {
      assert.notEqual(new Sheets(SPREADSHEET_TEST_ID), null)
    })
  })

  describe('#authorize', function () {
    const gs = new Sheets(SPREADSHEET_TEST_ID)

    it('should throw Error with no args in authorizeJWT', async () => {
      try {
        await gs.authorizeJWT()
        assert.fail()
      } catch(err) {
        assert.equal(err.constructor, Error)
      }
    })

    it('should throw Error with no args in authorizeApiKey', async () => {
      try {
        await gs.authorizeJWT()
        assert.fail()
      } catch(err) {
        assert.equal(err.constructor, Error)
      }
    })

    it('should authenticate with valid JWT credentials', async () => {
      await gs.authorizeJWT(SPREADSHEET_JWT_KEY)
    })

    it('should authenticate with valid API KEY credentials', async () => {
      await gs.authorizeApiKey(SPREADSHEET_API_KEY)
    })

  })

  describe('#table (Formats!A1:E3)', () => {
    const gs = new Sheets(SPREADSHEET_TEST_ID)
    before(async () => {
      await gs.authorizeApiKey(SPREADSHEET_API_KEY)
    })

    it('should return formatted tabular spreadsheet data', async () => {
      const table = await gs.table('Formats!A1:E3')
      // console.log(util.inspect(table, { depth: null, colors: true }))
      assert.deepEqual(table.headers, [ 'Automatic', 'Currency', 'Date', 'Number', 'Plain Text' ])
      assert.deepEqual(table.formats.map(f => f.numberFormat.type), [ 'NONE', 'CURRENCY', 'DATE', 'NUMBER', 'TEXT' ])
      assert.equal(table.rows.length, 2)
      assert.deepEqual(table.rows[0].stringValues, [ 'Oil', '$0.41', '1/25/2016', '123.00', 'This is some text' ])
      assert.deepEqual(table.rows[0].values, [ 'Oil', .41, new Date(2016, 0, 25), 123, 'This is some text' ])
    })

    it('should return formatted tabular (tableCols) spreadsheet data', async () => {
      const cols = await gs.tableCols('Formats!A1:E3')
      assert.equal(cols.length, 5)
      assert.deepEqual(cols.map(c => c.header), [ 'Automatic', 'Currency', 'Date', 'Number', 'Plain Text' ])
      assert.equal(cols[0].header, 'Automatic')
      assert.deepEqual(cols[0].values, ['Oil', 'Grass'])
    })
  })

  describe('#table (Class Data)', () => {
    const gs = new Sheets(SPREADSHEET_TEST_ID)
    before(async () => {
      await gs.authorizeApiKey(SPREADSHEET_API_KEY)
    })

    it('should retrieve only cols and rows with content (8 cols and 2 rows - from "Class Data")', async () => {
      const table = await gs.table('Class Data')
      assert.equal(table.headers.length, 8)
      assert.equal(table.rows.length, 2)
      // console.log(util.inspect(table, { depth: null, colors: true, breakLength: Infinity }))
    })

    it('should retrieve empty cells as undefined (5 cols and 3 rows - from "Table with empty cells")', async () => {
      const table = await gs.table('Table with empty cells')
      // console.log(util.inspect(table, { depth: null, colors: true, breakLength: Infinity }))
      assert.equal(table.headers.length, 5)
      assert.equal(table.rows.length, 3)
      assert.deepEqual(table.rows[1].values, ['Andrew', undefined, '1. Freshman', 'SD', 'Math'])
      assert.deepEqual(table.rows[2].values, ['Anna', 'Female', undefined, undefined, 'English'])
    })

  })

  describe('works with Promises', () => {
    it('should throw Error with no args in authorization', () => {
      const gs = new Sheets(SPREADSHEET_TEST_ID)
      gs.authorizeJWT()
        .then(() => assert.fail())
        .catch(err => assert.equal(err.constructor, Error))
    })

    it('should be able to chain .then() calls, and also .catch()', () => {
      const gs = new Sheets(SPREADSHEET_TEST_ID)
      const authData = SPREADSHEET_JWT_KEY
      gs.authorizeJWT(authData)
        .then(() => gs.table('Formats!A1:E3'))
        .then(table => {
          assert.notEqual(table.headers, null)
          assert.notEqual(table.formats, null)
          assert.notEqual(table.rows, null)
        })
        .catch(err => {
          console.error(err)
        })
    })
  })

})
