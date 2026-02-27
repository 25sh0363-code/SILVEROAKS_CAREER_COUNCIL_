/**
 * CoursesAPI.gs — Course CRUD operations.
 * Read, create, update, delete courses in the Courses sheet.
 */

var Courses = (function () {

  var SHEET = "Courses";
  var HEADERS = ["ID","Title","Description","Instructor","Category","Grade","ThumbnailURL","YouTubeURL","PDFLink","Content","Status","CreatedDate","UpdatedDate"];

  // Valid grade levels (extend as needed)
  var GRADES = ["Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"];

  // ── Read ─────────────────────────────────────────────────────────────────

  /**
   * Returns paginated, filtered list of published courses.
   * @param {Object} opts - { search, category, limit, offset }
   * @returns {{ rows: Object[], total: number }}
   */
  function listPublished(opts) {
    return _list(false, opts);
  }

  /** Returns all courses including drafts (admin use). */
  function listAll() {
    return DB.getRows(SHEET);
  }

  /**
   * Gets a single course by ID.
   * @param {string} id
   * @returns {Object|null}
   */
  function getById(id) {
    if (!id) return null;
    return DB.getRows(SHEET).find(function (r) { return r.ID === id; }) || null;
  }

  /** Returns unique category list from all published courses. */
  function getAllCategories() {
    var rows = DB.getRows(SHEET);
    var cats = {};
    rows.forEach(function (r) { if (r.Category && r.Status === "Published") cats[r.Category] = true; });
    return Object.keys(cats).sort();
  }

  /** Returns the ordered grade list (only grades that have at least one published course). */
  function getAllGrades() {
    var rows  = DB.getRows(SHEET).filter(function(r){ return r.Status === "Published"; });
    var found = {};
    rows.forEach(function(r){ if (r.Grade) found[r.Grade] = true; });
    // Return in the canonical order defined in GRADES, then any extras alphabetically
    var ordered = GRADES.filter(function(g){ return found[g]; });
    Object.keys(found).forEach(function(g){
      if (GRADES.indexOf(g) === -1) ordered.push(g);
    });
    return ordered;
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  /**
   * Creates or updates a course.
   * payload must include csrfToken (already verified by caller).
   * @param {Object} payload
   * @returns {{ ok: boolean, id: string }}
   */
  function save(payload) {
    _validateCourse(payload);
    var rows = DB.getRows(SHEET);
    var now  = new Date().toISOString();

    if (payload.id) {
      // Update existing
      var idx = rows.findIndex(function (r) { return r.ID === payload.id; });
      if (idx === -1) throw new Error("Course not found: " + payload.id);
      var existing = rows[idx];
      DB.updateRow(SHEET, idx, _toRow(payload.id, payload, existing.CreatedDate, now));
      return { ok: true, id: payload.id };
    }

    // Insert new
    var newId = Utilities.getUuid();
    DB.appendRow(SHEET, _toRow(newId, payload, now, now));
    return { ok: true, id: newId };
  }

  /**
   * Deletes a course by ID.
   * @param {string} id
   * @returns {{ ok: boolean }}
   */
  function remove(id) {
    var rows = DB.getRows(SHEET);
    var idx  = rows.findIndex(function (r) { return r.ID === id; });
    if (idx === -1) throw new Error("Course not found: " + id);
    DB.deleteRow(SHEET, idx);
    return { ok: true };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _list(includeDraft, opts) {
    var o       = opts || {};
    var search  = (o.search  || "").toLowerCase();
    var category= (o.category|| "").toLowerCase();
    var grade   = (o.grade   || "").toLowerCase();
    var limit   = o.limit  || CONFIG.PAGE_SIZE;
    var offset  = o.offset || 0;

    var rows = DB.getRows(SHEET).filter(function (r) {
      if (!includeDraft && r.Status !== "Published") return false;
      if (search   && !_matchSearch(r, search))   return false;
      if (category && (r.Category || "").toLowerCase() !== category) return false;
      if (grade    && (r.Grade    || "").toLowerCase() !== grade)    return false;
      return true;
    });

    return {
      total: rows.length,
      rows:  rows.slice(offset, offset + limit),
    };
  }

  function _matchSearch(row, q) {
    return (row.Title       || "").toLowerCase().includes(q) ||
           (row.Description || "").toLowerCase().includes(q) ||
           (row.Instructor  || "").toLowerCase().includes(q) ||
           (row.Category    || "").toLowerCase().includes(q) ||
           (row.Grade       || "").toLowerCase().includes(q);
  }

  function _validateCourse(p) {
    if (!p.title || !p.title.trim()) throw new Error("Title is required.");
    if (!p.status || !["Draft","Published"].includes(p.status)) {
      throw new Error("Status must be Draft or Published.");
    }
    if (p.pdfLink && !_isValidDriveLink(p.pdfLink)) {
      throw new Error("PDF link must be a valid Google Drive URL.");
    }
    if (p.youtubeUrl && !_isValidYouTube(p.youtubeUrl)) {
      throw new Error("Invalid YouTube URL.");
    }
    // Sanitize text fields to prevent XSS
    p.title       = _escapeHtml(p.title);
    p.description = _escapeHtml(p.description || "");
    p.instructor  = _escapeHtml(p.instructor  || "");
    p.category    = _escapeHtml(p.category    || "");
    p.grade       = _escapeHtml(p.grade       || "");
  }

  function _toRow(id, p, created, updated) {
    return [
      id,
      p.title,
      p.description   || "",
      p.instructor    || "",
      p.category      || "",
      p.grade         || "",
      p.thumbnailUrl  || "",
      p.youtubeUrl    || "",
      p.pdfLink       || "",
      p.content       || "",
      p.status,
      created,
      updated,
    ];
  }

  /** Validates a Google Drive share / download URL */
  function _isValidDriveLink(url) {
    return /^https:\/\/drive\.google\.com\//i.test(url) ||
           /^https:\/\/docs\.google\.com\//i.test(url);
  }

  /** Validates a YouTube watch / share URL */
  function _isValidYouTube(url) {
    return /youtu(\.be|be\.com)/i.test(url);
  }

  /**
   * Returns a YouTube embed URL from any standard YouTube URL.
   * Exported as a template helper.
   */
  function youtubeEmbed(url) {
    if (!url) return "";
    var m = url.match(/[?&]v=([^&]+)/);
    if (m) return "https://www.youtube.com/embed/" + m[1];
    m = url.match(/youtu\.be\/([^?]+)/);
    if (m) return "https://www.youtube.com/embed/" + m[1];
    m = url.match(/embed\/([^?]+)/);
    if (m) return "https://www.youtube.com/embed/" + m[1];
    return "";
  }

  /**
   * Converts a Google Drive share link to a direct download URL.
   * Exported as a template helper.
   */
  function driveDownload(url) {
    if (!url) return "";
    var m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return "https://drive.google.com/uc?export=download&id=" + m[1];
    m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m) return "https://drive.google.com/uc?export=download&id=" + m[1];
    return url; // return as-is if unrecognized
  }

  /** Basic HTML escaping to prevent XSS in stored text fields. */
  function _escapeHtml(str) {
    return String(str)
      .replace(/&/g,  "&amp;")
      .replace(/</g,  "&lt;")
      .replace(/>/g,  "&gt;")
      .replace(/"/g,  "&quot;")
      .replace(/'/g,  "&#039;");
  }

  return {
    listPublished:   listPublished,
    getAllGrades:     getAllGrades,
    listAll:         listAll,
    getById:         getById,
    getAllCategories: getAllCategories,
    save:            save,
    remove:          remove,
    youtubeEmbed:    youtubeEmbed,
    driveDownload:   driveDownload,
  };

})();
