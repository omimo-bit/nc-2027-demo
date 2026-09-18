
const SheetRepository = {
  sheet: function(name) {
    const ss = SpreadsheetApp.openById(getSpreadsheetId_());
    const sh = ss.getSheetByName(name);
    if (!sh) throw new Error('SHEET_NOT_FOUND:' + name);
    return sh;
  },

  rows: function(name) {
    const sh = this.sheet(name);
    const values = sh.getDataRange().getValues();
    if (!values.length) return [];
    const headers = values[0].map(String);
    return values.slice(1)
      .filter(function(row) { return row.some(function(v){ return v !== '' && v !== null; }); })
      .map(function(row) {
        const obj = {};
        headers.forEach(function(h, i) { obj[h] = row[i]; });
        return obj;
      });
  },

  findOne: function(name, filters) {
    return this.rows(name).find(function(row) {
      return Object.keys(filters).every(function(k) {
        return String(row[k]) === String(filters[k]);
      });
    }) || null;
  },

  findMany: function(name, filters) {
    return this.rows(name).filter(function(row) {
      return Object.keys(filters).every(function(k) {
        return String(row[k]) === String(filters[k]);
      });
    });
  },

  update: function(name, idField, idValue, values) {
    const sh = this.sheet(name);
    const data = sh.getDataRange().getValues();
    if (!data.length) throw new Error('EMPTY_SHEET:'+name);
    const headers = data[0].map(String);
    const idCol = headers.indexOf(idField);
    if (idCol < 0) throw new Error('FIELD_NOT_FOUND:'+idField);
    const rowIndex = data.slice(1).findIndex(r => String(r[idCol]) === String(idValue));
    if (rowIndex < 0) throw {code:'NOT_FOUND',message:'Record not found'};
    Object.keys(values).forEach(k => {
      const col = headers.indexOf(k);
      if (col >= 0) sh.getRange(rowIndex+2,col+1).setValue(values[k]);
    });
    return this.findOne(name, {[idField]:idValue});
  },


  deleteWhere: function(name, predicate) {
    const sh = this.sheet(name);
    const data = sh.getDataRange().getValues();
    if (data.length <= 1) return 0;
    const headers = data[0].map(String);
    const kept = [];
    let deleted = 0;
    data.slice(1).forEach(function(row) {
      const obj = {};
      headers.forEach(function(h,i){ obj[h] = row[i]; });
      if (predicate(obj)) deleted++;
      else kept.push(row);
    });
    if (data.length > 1) sh.getRange(2,1,data.length-1,headers.length).clearContent();
    if (kept.length) sh.getRange(2,1,kept.length,headers.length).setValues(kept);
    return deleted;
  },

  insert: function(name, object) {
    const sh = this.sheet(name);
    const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    const row = headers.map(function(h) { return object[h] !== undefined ? object[h] : ''; });
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try { sh.appendRow(row); }
    finally { lock.releaseLock(); }
    return object;
  }
};
