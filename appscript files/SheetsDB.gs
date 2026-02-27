/**
 * SheetsDB.gs — Google Sheets database layer.
 * Handles all reads and writes to the spreadsheet.
 * Sheet names: Users, Courses, Blogs
 */

var DB = (function () {

  // ── Spreadsheet access ────────────────────────────────────────────────────

  function getSpreadsheet() {
    if (CONFIG.SPREADSHEET_ID === "PUT_YOUR_SHEET_ID_HERE") {
      throw new Error("Set CONFIG.SPREADSHEET_ID in Code.gs before using the app.");
    }
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }

  /**
   * Returns a sheet by name. Throws if not found.
   * @param {string} name
   * @returns {GoogleAppsScript.Spreadsheet.Sheet}
   */
  function sheet(name) {
    var s = getSpreadsheet().getSheetByName(name);
    if (!s) throw new Error("Sheet not found: " + name + ". Run setupSheets() first.");
    return s;
  }

  // ── Generic row utilities ─────────────────────────────────────────────────

  /**
   * Reads all rows from a sheet and returns an array of objects
   * keyed by the first-row headers.
   * @param {string} sheetName
   * @returns {Object[]}
   */
  function getRows(sheetName) {
    var s    = sheet(sheetName);
    var data = s.getDataRange().getValues();
    if (data.length < 2) return [];
    var headers = data[0];
    return data.slice(1).map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = row[i]; });
      return obj;
    });
  }

  /**
   * Appends a new row using an ordered array of values.
   * @param {string} sheetName
   * @param {Array}  values
   */
  function appendRow(sheetName, values) {
    sheet(sheetName).appendRow(values);
  }

  /**
   * Updates a row (1-based sheet row index — header is row 1, data starts at 2).
   * @param {string} sheetName
   * @param {number} rowIndex  - 1-based index among data rows (0 = first data row)
   * @param {Array}  values
   */
  function updateRow(sheetName, rowIndex, values) {
    var s = sheet(sheetName);
    // rowIndex is 0-based in data array, header is row 1, so +2
    s.getRange(rowIndex + 2, 1, 1, values.length).setValues([values]);
  }

  /**
   * Deletes a data row by 0-based index (header excluded).
   * @param {string} sheetName
   * @param {number} rowIndex
   */
  function deleteRow(sheetName, rowIndex) {
    sheet(sheetName).deleteRow(rowIndex + 2);
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  /**
   * Finds a user record by email (case-insensitive).
   * @param {string} email
   * @returns {Object|null}
   */
  function getUserByEmail(email) {
    var rows = getRows("Users");
    var norm = email.toLowerCase();
    return rows.find(function (r) {
      return r.Email && r.Email.toLowerCase() === norm;
    }) || null;
  }
  // ── User management ─────────────────────────────────────────────────────────

  /**
   * Returns all user records.
   * @returns {Object[]}
   */
  function getAllUsers() {
    return getRows("Users");
  }

  /**
   * Changes a user's role and optionally their status.
   * Supported roles: Student | Editor | Admin
   * @param {string} email
   * @param {string} newRole
   * @returns {{ ok: boolean }}
   */
  function updateUserRole(email, newRole) {
    var allowed = ["Student", "Editor", "Admin"];
    if (allowed.indexOf(newRole) === -1) throw new Error("Invalid role: " + newRole);
    var s    = sheet("Users");
    var data = s.getDataRange().getValues();
    var hdrs = data[0];  // [Name, Email, Role, Status, CreatedDate]
    var roleIdx   = hdrs.indexOf("Role");
    var statusIdx = hdrs.indexOf("Status");
    var emailIdx  = hdrs.indexOf("Email");
    if (roleIdx === -1 || emailIdx === -1) throw new Error("Users sheet missing expected columns.");
    var norm = email.toLowerCase();
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][emailIdx] && data[i][emailIdx].toLowerCase() === norm) {
        s.getRange(i + 1, roleIdx + 1).setValue(newRole);
        if (statusIdx !== -1) s.getRange(i + 1, statusIdx + 1).setValue("Active");
        found = true;
        break;
      }
    }
    if (!found) throw new Error("User not found: " + email);
    return { ok: true };
  }

  function setBanStatus(email, banned) {
    var s    = sheet("Users");
    var data = s.getDataRange().getValues();
    var hdrs = data[0];
    var emailIdx  = hdrs.indexOf("Email");
    var statusIdx = hdrs.indexOf("Status");
    if (emailIdx === -1 || statusIdx === -1) throw new Error("Users sheet missing expected columns.");
    var norm = email.toLowerCase();
    for (var i = 1; i < data.length; i++) {
      if (data[i][emailIdx] && data[i][emailIdx].toLowerCase() === norm) {
        s.getRange(i + 1, statusIdx + 1).setValue(banned ? "Banned" : "Active");
        return { ok: true };
      }
    }
    throw new Error("User not found: " + email);
  }
  // ── Dashboard stats ───────────────────────────────────────────────────────

  /**
   * Returns aggregate statistics for the admin dashboard.
   * @returns {Object}
   */
  function getDashboardStats() {
    var courses = getRows("Courses");
    var blogs   = getRows("Blogs");
    var users   = getRows("Users");

    var publishedCourses = courses.filter(function (c) { return c.Status === "Published"; });
    var publishedBlogs   = blogs.filter(function (b)   { return b.Status === "Published"; });
    var activeUsers      = users.filter(function (u)   { return u.Status === "Active"; });

    // Recent activity — combine courses and blogs, sort by CreatedDate descending
    var recent = [];
    courses.forEach(function (c) {
      recent.push({ type: "Course", id: c.ID, title: c.Title, status: c.Status, date: c.CreatedDate });
    });
    blogs.forEach(function (b) {
      recent.push({ type: "Blog", id: b.ID, title: b.Title, status: b.Status, date: b.CreatedDate });
    });
    recent.sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    // Category breakdown for charts
    var catMap = {};
    courses.forEach(function (c) {
      var cat = c.Category || "Uncategorized";
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    // Grade breakdown
    var gradeMap = {};
    courses.forEach(function (c) {
      var g = c.Grade || "Unassigned";
      gradeMap[g] = (gradeMap[g] || 0) + 1;
    });

    return {
      totalCourses:     courses.length,
      totalBlogs:       blogs.length,
      publishedCourses: publishedCourses.length,
      publishedBlogs:   publishedBlogs.length,
      activeUsers:      activeUsers.length,
      recentActivity:   recent.slice(0, 10),
      categoryData:     catMap,
      gradeData:        gradeMap,
    };
  }

  // ── One-time setup ────────────────────────────────────────────────────────

  /**
   * Creates required sheets with headers and seeds sample data.
   * Safe to run multiple times — skips sheets that already exist.
   */
  function setupSheets() {
    var ss = getSpreadsheet();

    var defs = [
      {
        name: "Users",
        headers: ["Name", "Email", "Role", "Status", "CreatedDate"],
        sample: [
          ["Admin User",   "admin1@hyd.silveroaks.co.in",  "Admin",   "Active", new Date().toISOString()],
          ["Staff Editor", "staff1@hyd.silveroaks.co.in",  "Editor",  "Active", new Date().toISOString()],
          ["Sample Student","student1@hyd.silveroaks.co.in","Student","Active", new Date().toISOString()],
        ],
      },
      {
        name: "Courses",
        headers: ["ID","Title","Description","Instructor","Category","Grade","ThumbnailURL","YouTubeURL","PDFLink","Content","Status","CreatedDate","UpdatedDate"],
        sample: [
          [
            Utilities.getUuid(),
            "Introduction to Career Planning",
            "Learn how to plan your career effectively.",
            "Dr. Sharma",
            "Career",
            "Class 11",
            "https://via.placeholder.com/400x200?text=Course+1",
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "",
            "<p>This course covers career planning fundamentals.</p>",
            "Published",
            new Date().toISOString(),
            new Date().toISOString(),
          ],
          [
            Utilities.getUuid(),
            "Resume Writing Basics",
            "Build a winning resume for your first job.",
            "Ms. Reddy",
            "Resume",
            "Class 12",
            "https://via.placeholder.com/400x200?text=Course+2",
            "",
            "",
            "<p>Learn the essentials of resume writing.</p>",
            "Published",
            new Date().toISOString(),
            new Date().toISOString(),
          ],
        ],
      },
      {
        name: "Blogs",
        headers: ["ID","Title","Content","FeaturedImageURL","AuthorEmail","Tags","Status","CreatedDate","UpdatedDate"],
        sample: [
          [
            Utilities.getUuid(),
            "Top 10 Interview Tips",
            "<p>Preparing for an interview can be stressful. Here are our top 10 tips...</p>",
            "https://via.placeholder.com/800x300?text=Blog",
            "staff1@hyd.silveroaks.co.in",
            "interview,career,tips",
            "Published",
            new Date().toISOString(),
            new Date().toISOString(),
          ],
        ],
      },
    ];

    defs.forEach(function (def) {
      var s = ss.getSheetByName(def.name);
      if (!s) {
        s = ss.insertSheet(def.name);
        var header = s.getRange(1, 1, 1, def.headers.length);
        header.setValues([def.headers]);
        header.setFontWeight("bold");
        header.setBackground("#1e3a5f");
        header.setFontColor("#ffffff");
        def.sample.forEach(function (row) { s.appendRow(row); });
        Logger.log("Created sheet: " + def.name);
      } else {
        Logger.log("Sheet already exists: " + def.name + " — skipped.");
      }
    });

    Logger.log("Setup complete.");
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    getRows:          getRows,
    appendRow:        appendRow,
    updateRow:        updateRow,
    deleteRow:        deleteRow,
    getUserByEmail:   getUserByEmail,
    getAllUsers:       getAllUsers,
    updateUserRole:   updateUserRole,
    setBanStatus:      setBanStatus,
    getDashboardStats:getDashboardStats,
    setupSheets:      setupSheets,
  };

})();
