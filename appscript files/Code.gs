/**
 * Career Laboratory Resource Website
 * Google Apps Script — REST JSON API backend
 * Frontend is hosted on GitHub Pages and calls this web app via fetch().
 *
 * Deploy settings:
 *   Execute as:  Me (owner)
 *   Who can access: Anyone
 */

// ─── App Configuration ────────────────────────────────────────────────────────
var CONFIG = {
  APP_NAME:       "Career Laboratory Resource Website",
  ALLOWED_DOMAIN: "hyd.silveroaks.co.in",      // no leading @
  SPREADSHEET_ID: "1nDVOm72SBdR-Nf3AfWwi5QOZP5QxCXSLu3W1QnA29w0",    // ← Replace with your Google Sheet ID
  PAGE_SIZE:      9,
  CLIENT_ID:      "PUT_YOUR_OAUTH_CLIENT_ID",  // ← Google Cloud OAuth 2.0 client ID
};

// ─── HTTP entry points ────────────────────────────────────────────────────────

/**
 * GET requests — read-only operations.
 * Query params: action, token, and action-specific params.
 */
function doGet(e) {
  var p   = e.parameter || {};
  var out;
  try {
    switch (p.action) {
      case "home":       out = withUser(p, function(u){ return getHomeData(u); });       break;
      case "courses":    out = withUser(p, function(u){ return getCourses(p, u); });     break;
      case "course":     out = withUser(p, function(u){ return getCourse(p.id, u); });   break;
      case "posts":      out = withUser(p, function(u){ return getPosts(p, u); });       break;
      case "post":       out = withUser(p, function(u){ return getPost(p.id, u); });     break;
      case "search":     out = withUser(p, function(u){ return search(p.q, u); });       break;
      case "stats":      out = withAdmin(p, function(u){ return getStats(u); });         break;
      case "allCourses": out = withAdmin(p, function(u){ return Courses.listAll(); });        break;
      case "allPosts":   out = withAdmin(p, function(u){ return Blogs.listAll(); });          break;
      case "allUsers":   out = withAdmin(p, function(u){ return DB.getAllUsers(); });          break;
      case "me":         out = withUser(p, function(u){ return u; });                          break;
      case "ping":       out = {ok: true, name: CONFIG.APP_NAME};                        break;
      default:           out = {error: "Unknown action"};
    }
  } catch(ex) {
    out = {error: ex.message || String(ex)};
  }
  return jsonOut(out);
}

/**
 * POST requests — write operations.
 * Body must be JSON with: { action, token, ...data }
 * Use Content-Type: text/plain to avoid CORS preflight.
 */
function doPost(e) {
  var out;
  try {
    var body = JSON.parse(e.postData.contents);
    var p    = body;
    switch (body.action) {
      case "saveCourse":     out = withAdmin(p, function(u){ return saveCourse(body.data, u); });      break;
      case "deleteCourse":   out = withAdmin(p, function(u){ return deleteCourse(body.id, u); });      break;
      case "savePost":       out = withAdmin(p, function(u){ return savePost(body.data, u); });        break;
      case "deletePost":     out = withAdmin(p, function(u){ return deletePost(body.id, u); });        break;
      case "updateUserRole": out = withAdmin(p, function(u){ return DB.updateUserRole(body.email, body.role); }); break;
      case "banUser":        out = withAdmin(p, function(u){ if (u.email === body.email) throw new Error("You cannot ban yourself."); return DB.setBanStatus(body.email, true); });  break;
      case "unbanUser":      out = withAdmin(p, function(u){ return DB.setBanStatus(body.email, false); }); break;
      case "uploadImage":    out = withAdmin(p, function(u){ return uploadImageToDrive(body.filename, body.mimeType, body.data); }); break;
      case "setup":          out = setupSheets();                                                       break;
      default:             out = {error: "Unknown action"};
    }
  } catch(ex) {
    out = {error: ex.message || String(ex)};
  }
  return jsonOut(out);
}

function jsonOut(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Auth wrappers ────────────────────────────────────────────────────────────

function withUser(p, fn) {
  var user = Auth.verifyToken(p.token);
  return fn(user);
}

function withAdmin(p, fn) {
  var user = Auth.verifyToken(p.token);
  Auth.requireAdmin(user);
  return fn(user);
}

// ─── Read handlers ────────────────────────────────────────────────────────────

function getCourses(p, user) {
  var result = Courses.listPublished({
    search:   p.search   || "",
    category: p.category || "",
    grade:    p.grade    || "",
    offset:   Number(p.offset) || 0,
    limit:    Number(p.limit)  || CONFIG.PAGE_SIZE,
  });
  result.rows.forEach(function(c) {
    c._embedUrl    = Courses.youtubeEmbed(c.YouTubeURL);
    c._downloadUrl = Courses.driveDownload(c.PDFLink);
  });
  return result;
}

function getCourse(id, user) {
  var c = Courses.getById(id);
  if (!c || c.Status !== "Published") throw new Error("Not found");
  c._embedUrl    = Courses.youtubeEmbed(c.YouTubeURL);
  c._downloadUrl = Courses.driveDownload(c.PDFLink);
  return c;
}

function getPosts(p, user) {
  return Blogs.listPublished({
    search: p.search || "",
    tag:    p.tag    || "",
    offset: Number(p.offset) || 0,
    limit:  Number(p.limit)  || CONFIG.PAGE_SIZE,
  });
}

function getPost(id, user) {
  var post = Blogs.getById(id);
  if (!post || post.Status !== "Published") throw new Error("Not found");
  return post;
}

function getHomeData(user) {
  var courses = Courses.listPublished({ limit: 3, offset: 0 }).rows;
  courses.forEach(function(c) { c._embedUrl = Courses.youtubeEmbed(c.YouTubeURL); });
  return {
    featuredCourses: courses,
    featuredPosts:   Blogs.listPublished({ limit: 3, offset: 0 }).rows,
    categories:      Courses.getAllCategories(),
    allGrades:       Courses.getAllGrades(),
    allTags:         Blogs.getAllTags(),
  };
}

function search(query, user) {
  return {
    courses: Courses.listPublished({ search: query, limit: 5, offset: 0 }).rows,
    posts:   Blogs.listPublished({ search: query, limit: 5, offset: 0 }).rows,
  };
}

function getStats(user) {
  return DB.getDashboardStats();
}

function saveCourse(data, user) {
  return Courses.save(data);
}

function deleteCourse(id, user) {
  return Courses.remove(id);
}

function savePost(data, user) {
  return Blogs.save(data);
}

function deletePost(id, user) {
  return Blogs.remove(id);
}

/** Run once from Apps Script editor to create sheets + seed sample data */
function setupSheets() {
  return DB.setupSheets();
}

/**
 * Uploads a base64-encoded image to a dedicated Google Drive folder
 * and returns a publicly accessible direct image URL.
 */
function uploadImageToDrive(filename, mimeType, base64Data) {
  if (!filename || !mimeType || !base64Data) throw new Error("Missing image data.");

  // Find or create a folder called "CareerLab Thumbnails" in Drive root
  var folderName = "CareerLab Thumbnails";
  var folders = DriveApp.getFoldersByName(folderName);
  var folder   = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

  // Decode base64 → blob
  var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, filename);

  // Save file to folder
  var file = folder.createFile(blob);

  // Make it publicly viewable (anyone with link)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // Return direct image URL
  var fileId = file.getId();
  return { ok: true, url: "https://drive.google.com/uc?export=view&id=" + fileId };
}
