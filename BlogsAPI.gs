/**
 * BlogsAPI.gs — Blog CRUD operations.
 * Read, create, update, delete blog posts in the Blogs sheet.
 */

var Blogs = (function () {

  var SHEET = "Blogs";

  // ── Read ─────────────────────────────────────────────────────────────────

  /**
   * Returns paginated, filtered list of published blog posts.
   * @param {Object} opts - { search, tag, limit, offset }
   * @returns {{ rows: Object[], total: number }}
   */
  function listPublished(opts) {
    return _list(false, opts);
  }

  /** Returns all posts including drafts (admin use). */
  function listAll() {
    return DB.getRows(SHEET);
  }

  /**
   * Gets a single blog post by ID.
   * @param {string} id
   * @returns {Object|null}
   */
  function getById(id) {
    if (!id) return null;
    return DB.getRows(SHEET).find(function (r) { return r.ID === id; }) || null;
  }

  /** Returns a de-duplicated sorted list of all tags across published posts. */
  function getAllTags() {
    var rows = DB.getRows(SHEET);
    var tagSet = {};
    rows.forEach(function (r) {
      if (r.Status !== "Published") return;
      var tags = (r.Tags || "").split(",");
      tags.forEach(function (t) {
        var clean = t.trim();
        if (clean) tagSet[clean] = true;
      });
    });
    return Object.keys(tagSet).sort();
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  /**
   * Creates or updates a blog post.
   * @param {Object} payload
   * @returns {{ ok: boolean, id: string }}
   */
  function save(payload) {
    _validatePost(payload);
    var rows = DB.getRows(SHEET);
    var now  = new Date().toISOString();

    if (payload.id) {
      var idx = rows.findIndex(function (r) { return r.ID === payload.id; });
      if (idx === -1) throw new Error("Post not found: " + payload.id);
      var existing = rows[idx];
      DB.updateRow(SHEET, idx, _toRow(payload.id, payload, existing.CreatedDate, now, existing.AuthorEmail));
      return { ok: true, id: payload.id };
    }

    var newId       = Utilities.getUuid();
    var authorEmail = Session.getActiveUser().getEmail();
    DB.appendRow(SHEET, _toRow(newId, payload, now, now, authorEmail));
    return { ok: true, id: newId };
  }

  /**
   * Deletes a blog post by ID.
   * @param {string} id
   * @returns {{ ok: boolean }}
   */
  function remove(id) {
    var rows = DB.getRows(SHEET);
    var idx  = rows.findIndex(function (r) { return r.ID === id; });
    if (idx === -1) throw new Error("Post not found: " + id);
    DB.deleteRow(SHEET, idx);
    return { ok: true };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _list(includeDraft, opts) {
    var o      = opts || {};
    var search = (o.search || "").toLowerCase();
    var tag    = (o.tag    || "").toLowerCase();
    var limit  = o.limit  || CONFIG.PAGE_SIZE;
    var offset = o.offset || 0;

    var rows = DB.getRows(SHEET).filter(function (r) {
      if (!includeDraft && r.Status !== "Published") return false;
      if (search && !_matchSearch(r, search)) return false;
      if (tag    && !_hasTag(r, tag))          return false;
      return true;
    });

    // Sort newest first
    rows.sort(function (a, b) {
      return new Date(b.CreatedDate) - new Date(a.CreatedDate);
    });

    return { total: rows.length, rows: rows.slice(offset, offset + limit) };
  }

  function _matchSearch(row, q) {
    return (row.Title   || "").toLowerCase().includes(q) ||
           (row.Content || "").toLowerCase().includes(q) ||
           (row.Tags    || "").toLowerCase().includes(q);
  }

  function _hasTag(row, tag) {
    return (row.Tags || "").toLowerCase().split(",").some(function (t) {
      return t.trim() === tag;
    });
  }

  function _validatePost(p) {
    if (!p.title || !p.title.trim()) throw new Error("Title is required.");
    if (!p.content || !p.content.trim()) throw new Error("Content is required.");
    if (!p.status || !["Draft","Published"].includes(p.status)) {
      throw new Error("Status must be Draft or Published.");
    }
    // Sanitize plain text fields only (content is rich HTML, sanitize carefully)
    p.title = _escapeHtml(p.title);
    p.tags  = _escapeHtml(p.tags || "");
  }

  function _toRow(id, p, created, updated, authorEmail) {
    return [
      id,
      p.title,
      p.content        || "",
      p.featuredImageUrl|| "",
      authorEmail      || "",
      p.tags           || "",
      p.status,
      created,
      updated,
    ];
  }

  function _escapeHtml(str) {
    return String(str)
      .replace(/&/g,  "&amp;")
      .replace(/</g,  "&lt;")
      .replace(/>/g,  "&gt;")
      .replace(/"/g,  "&quot;")
      .replace(/'/g,  "&#039;");
  }

  return {
    listPublished: listPublished,
    listAll:       listAll,
    getById:       getById,
    getAllTags:     getAllTags,
    save:          save,
    remove:        remove,
  };

})();
