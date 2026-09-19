/**
 * Repository.gs
 * Generic CRUD over Google Sheets tabs, keyed by header row.
 *
 * Rule (05_DRD_DEMO.md §1 / §7): the frontend never manipulates sheet cells
 * directly, and row number is never treated as a primary key. Every entity
 * has a stable id column (first column by convention) used for lookups.
 */

var _sheetCache_ = {};

function getSheetByName_(sheetName) {
  if (!_sheetCache_[sheetName]) {
    var ss = getSpreadsheet_();
    var sh = ss.getSheetByName(sheetName);
    if (!sh) throw new Error('Sheet not found: ' + sheetName + ' — run Setup.setupSheets() first.');
    _sheetCache_[sheetName] = sh;
  }
  return _sheetCache_[sheetName];
}

function getHeaders_(sheetName) {
  var sh = getSheetByName_(sheetName);
  var lastCol = sh.getLastColumn();
  if (lastCol === 0) return [];
  return sh.getRange(1, 1, 1, lastCol).getValues()[0];
}

/** Returns every row as an array of plain objects keyed by header. */
function getAllRows_(sheetName) {
  var sh = getSheetByName_(sheetName);
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol === 0) return [];
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return values.map(function (row) {
    var obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
}

/** Finds the first row whose idField equals idValue. Returns null if not found. */
function findById_(sheetName, idField, idValue) {
  var rows = getAllRows_(sheetName);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][idField]) === String(idValue)) return rows[i];
  }
  return null;
}

function findAllWhere_(sheetName, predicate) {
  return getAllRows_(sheetName).filter(predicate);
}

/** Appends one row. `obj` keys not matching a header are ignored; missing headers become ''. */
function appendRow_(sheetName, obj) {
  var sh = getSheetByName_(sheetName);
  var headers = getHeaders_(sheetName);
  var row = headers.map(function (h) { return obj.hasOwnProperty(h) ? obj[h] : ''; });
  sh.appendRow(row);
  return obj;
}

/**
 * Updates the row whose idField equals idValue by merging patchObj.
 * Returns the merged object, or null if the row wasn't found.
 */
function updateById_(sheetName, idField, idValue, patchObj) {
  var sh = getSheetByName_(sheetName);
  var headers = getHeaders_(sheetName);
  var idCol = headers.indexOf(idField);
  if (idCol === -1) throw new Error('idField "' + idField + '" not found in ' + sheetName);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return null;
  var idValues = sh.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < idValues.length; i++) {
    if (String(idValues[i][0]) === String(idValue)) {
      var rowIndex = i + 2; // account for header row + 0-based loop
      var current = {};
      var currentValues = sh.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
      headers.forEach(function (h, c) { current[h] = currentValues[c]; });
      var merged = Object.assign({}, current, patchObj);
      var newRow = headers.map(function (h) { return merged[h]; });
      sh.getRange(rowIndex, 1, 1, headers.length).setValues([newRow]);
      return merged;
    }
  }
  return null;
}

function clearDataRows_(sheetName) {
  var sh = getSheetByName_(sheetName);
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow > 1 && lastCol > 0) {
    sh.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
}
