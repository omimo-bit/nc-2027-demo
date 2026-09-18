
const EvidenceService = {
  saveBase64: function(session, submissionId, payload) {
    if (!payload || !payload.data_url) return null;
    const match = String(payload.data_url).match(/^data:(.+);base64,(.+)$/);
    if (!match) throw {code:'INVALID_REQUEST',message:'Invalid evidence format'};

    const mime = match[1];
    const bytes = Utilities.base64Decode(match[2]);
    const ext = mime === 'image/png' ? 'png' : 'jpg';
    const name = Utilities.formatDate(new Date(), APP.timezone, 'yyyyMMdd_HHmmss') +
      '_' + submissionId.slice(0,8) + '.' + ext;

    const folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
    const folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
    const file = folder.createFile(Utilities.newBlob(bytes, mime, name));

    const record = {
      evidence_id:Utilities.getUuid(),
      submission_id:submissionId,
      evidence_type:payload.evidence_type || 'GENERAL',
      drive_file_id:file.getId(),
      file_url:file.getUrl(),
      file_name:name,
      mime_type:mime,
      file_size:bytes.length,
      captured_at:payload.captured_at || nowIso_(),
      uploaded_at:nowIso_(),
      uploaded_by:session.user_id,
      latitude:payload.latitude || '',
      longitude:payload.longitude || ''
    };
    SheetRepository.insert(APP.sheets.EVIDENCE,record);
    return record;
  }
};
