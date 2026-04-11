/**
 * Auth.gs — Authentication & Authorization.
 * Verifies Google ID tokens sent from the GitHub Pages frontend.
 * No CSRF needed — token-based per-request auth replaces session cookies.
 */

var Auth = (function () {

  var TOKEN_CACHE_TTL_SECONDS = 600;
  var USER_CACHE_TTL_SECONDS = 180;

  /**
   * Verifies a Google ID token (JWT) received from the frontend.
   * Uses Google's tokeninfo endpoint (HTTPS call).
   * Returns a user object on success; throws on failure.
   *
   * @param {string} idToken  — credential from Google Identity Services
   * @returns {{ email, name, role, isAdmin }}
   */
  function verifyToken(idToken) {
    if (!idToken) throw new Error("Not authenticated. Please sign in.");

    var info = _readTokenInfoFromCache(idToken);
    if (!info) {
      // Call Google's tokeninfo API to validate the JWT (slow path)
      var resp = UrlFetchApp.fetch(
        "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken),
        { muteHttpExceptions: true }
      );

      if (resp.getResponseCode() !== 200) {
        throw new Error("Invalid or expired sign-in token. Please sign in again.");
      }

      info = JSON.parse(resp.getContentText());
      _writeTokenInfoToCache(idToken, info);
    }

    var email = (info.email || "").toLowerCase();

    // Optional audience check when CONFIG.CLIENT_ID is configured.
    if (CONFIG.CLIENT_ID && CONFIG.CLIENT_ID !== "PUT_YOUR_OAUTH_CLIENT_ID") {
      if (info.aud !== CONFIG.CLIENT_ID) {
        throw new Error("Invalid sign-in audience. Please sign in again.");
      }
    }

    // Must have verified email
    if (!info.email_verified) throw new Error("Google account email is not verified.");

    // Must be the allowed domain
    if (!email.endsWith("@" + CONFIG.ALLOWED_DOMAIN)) {
      throw new Error("Access denied: only @" + CONFIG.ALLOWED_DOMAIN + " accounts are allowed.");
    }

    // Look up or auto-create the user row in Users sheet
    var record = _readUserFromCache(email);
    if (!record) record = DB.getUserByEmail(email);
    if (!record) {
      // First-time login: create a Student record
      DB.appendRow("Users", [
        info.name || email.split("@")[0],
        email,
        "Student",
        "Active",
        new Date().toISOString(),
      ]);
      record = { Name: info.name || "", Email: email, Role: "Student", Status: "Active" };
    }
    _writeUserToCache(email, record);

    if (record.Status !== "Active") {
      throw new Error("Your account is not active. Contact an administrator.");
    }

    var role    = record.Role || "Student";
    var isAdmin = role === "Admin" || role === "Editor";

    return {
      email:   email,
      name:    record.Name || info.name || email.split("@")[0],
      role:    role,
      isAdmin: isAdmin,
    };
  }

  function _tokenCacheKey(idToken) {
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, idToken, Utilities.Charset.UTF_8);
    return "tok:" + Utilities.base64EncodeWebSafe(digest);
  }

  function _readTokenInfoFromCache(idToken) {
    var raw = CacheService.getScriptCache().get(_tokenCacheKey(idToken));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function _writeTokenInfoToCache(idToken, info) {
    var payload = {
      email: info.email || "",
      name: info.name || "",
      email_verified: String(info.email_verified) === "true" || info.email_verified === true,
      aud: info.aud || "",
    };
    CacheService.getScriptCache().put(_tokenCacheKey(idToken), JSON.stringify(payload), TOKEN_CACHE_TTL_SECONDS);
  }

  function _userCacheKey(email) {
    return "usr:" + String(email || "").toLowerCase();
  }

  function _readUserFromCache(email) {
    var raw = CacheService.getScriptCache().get(_userCacheKey(email));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function _writeUserToCache(email, user) {
    var payload = {
      Name: user.Name || "",
      Email: user.Email || email || "",
      Role: user.Role || "Student",
      Status: user.Status || "Active",
    };
    CacheService.getScriptCache().put(_userCacheKey(email), JSON.stringify(payload), USER_CACHE_TTL_SECONDS);
  }

  /**
   * Throws if user is not an Admin or Editor.
   * @param {{ isAdmin: boolean }} user
   */
  function requireAdmin(user) {
    if (!user)         throw new Error("Not authenticated.");
    if (!user.isAdmin) throw new Error("Access denied: admin role required.");
  }

  return {
    verifyToken:  verifyToken,
    requireAdmin: requireAdmin,
  };

})();
