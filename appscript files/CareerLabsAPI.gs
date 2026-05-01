/**
 * CareerLabsAPI.gs — Career Laboratory CRUD operations.
 * Admins post student research notes, video embeds, images, and PDFs.
 */

var CareerLabs = (function () {

  var SHEET = "CareerLabs";

  function listPublished(opts) { return _list(false, opts); }

  function listAll() { return DB.getRows(SHEET); }

  function getById(id) {
    if (!id) return null;
    return DB.getRowById(SHEET, id) || null;
  }

  function getAllCategories() {
    var rows = DB.getRows(SHEET);
    var cats = {};
    rows.forEach(function (r) {
      if (r.Category && r.Status === "Published") cats[r.Category] = true;
    });
    return Object.keys(cats).sort();
  }

  function save(payload) {
    _validate(payload);
    var rows = DB.getRows(SHEET);
    var now  = new Date().toISOString();

    if (payload.id) {
      var idx = rows.findIndex(function (r) { return r.ID === payload.id; });
      if (idx === -1) throw new Error("Career Lab entry not found: " + payload.id);
      var existing = rows[idx];
      DB.updateRow(SHEET, idx, _toRow(payload.id, payload, existing.CreatedDate, now));
      return { ok: true, id: payload.id };
    }

    var newId = Utilities.getUuid();
    DB.appendRow(SHEET, _toRow(newId, payload, now, now));
    return { ok: true, id: newId };
  }

  function remove(id) {
    var rows = DB.getRows(SHEET);
    var idx  = rows.findIndex(function (r) { return r.ID === id; });
    if (idx === -1) throw new Error("Career Lab entry not found: " + id);
    DB.deleteRow(SHEET, idx);
    return { ok: true };
  }

  function _list(includeDraft, opts) {
    var o         = opts || {};
    var search    = (o.search    || "").toLowerCase();
    var category  = (o.category  || "").toLowerCase();
    var student   = (o.student   || "").toLowerCase();
    var limit     = o.limit  || CONFIG.PAGE_SIZE;
    var offset    = o.offset || 0;

    var rows = DB.getRows(SHEET).filter(function (r) {
      if (!includeDraft && r.Status !== "Published") return false;
      if (search   && !_matchSearch(r, search))       return false;
      if (category && (r.Category || "").toLowerCase() !== category) return false;
      if (student  && (r.Student  || "").toLowerCase().indexOf(student) === -1) return false;
      return true;
    });

    rows.sort(function (a, b) {
      return new Date(b.CreatedDate) - new Date(a.CreatedDate);
    });

    return { total: rows.length, rows: rows.slice(offset, offset + limit) };
  }

  function _matchSearch(row, q) {
    return (row.Title       || "").toLowerCase().indexOf(q) !== -1 ||
           (row.Student     || "").toLowerCase().indexOf(q) !== -1 ||
           (row.Description || "").toLowerCase().indexOf(q) !== -1 ||
           (row.Mentor      || "").toLowerCase().indexOf(q) !== -1 ||
           (row.Category    || "").toLowerCase().indexOf(q) !== -1;
  }

  function _validate(p) {
    if (!p.title || !p.title.trim()) throw new Error("Title is required.");
    if (!p.student || !p.student.trim()) throw new Error("Student name is required.");
    if (!p.status || !["Draft", "Published"].includes(p.status)) {
      throw new Error("Status must be Draft or Published.");
    }
    if (p.pdfLink && !/^https:\/\/(drive|docs)\.google\.com\//i.test(p.pdfLink)) {
      throw new Error("PDF link must be a Google Drive URL.");
    }
    if (p.youtubeUrl && !/youtu(\.be|be\.com)/i.test(p.youtubeUrl)) {
      throw new Error("Invalid YouTube URL.");
    }
    p.title       = _escapeHtml(p.title);
    p.student     = _escapeHtml(p.student || "");
    p.description = _escapeHtml(p.description || "");
    p.mentor      = _escapeHtml(p.mentor || "");
    p.category    = _escapeHtml(p.category || "");
  }

  function _toRow(id, p, created, updated) {
    return [
      id,
      p.title,
      p.student || "",
      p.description || "",
      p.mentor || "",
      p.category || "",
      p.thumbnailUrl || "",
      p.youtubeUrl || "",
      p.pdfLink || "",
      p.content || "",
      p.status,
      created,
      updated,
    ];
  }

  function youtubeEmbed(url) {
    if (!url) return "";
    var m = url.match(/[?&]v=([^&]+)/); if (m) return "https://www.youtube.com/embed/" + m[1];
    m = url.match(/youtu\.be\/([^?]+)/); if (m) return "https://www.youtube.com/embed/" + m[1];
    m = url.match(/embed\/([^?]+)/); if (m) return "https://www.youtube.com/embed/" + m[1];
    return "";
  }

  function driveDownload(url) {
    if (!url) return "";
    var m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return "https://drive.google.com/uc?export=download&id=" + m[1];
    m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m) return "https://drive.google.com/uc?export=download&id=" + m[1];
    return url;
  }

  function _escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  return {
    listPublished: listPublished,
    listAll: listAll,
    getById: getById,
    getAllCategories: getAllCategories,
    save: save,
    remove: remove,
    youtubeEmbed: youtubeEmbed,
    driveDownload: driveDownload,
  };

})();