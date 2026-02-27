/**
 * Auth.gs — Authentication & Authorization.
 * Verifies Google ID tokens sent from the GitHub Pages frontend.
 * No CSRF needed — token-based per-request auth replaces session cookies.
 */

var Auth = (function () {

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

    // Call Google's tokeninfo API to validate the JWT
    var resp = UrlFetchApp.fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken),
      { muteHttpExceptions: true }
    );

    if (resp.getResponseCode() !== 200) {
      throw new Error("Invalid or expired sign-in token. Please sign in again.");
    }

    var info  = JSON.parse(resp.getContentText());
    var email = (info.email || "").toLowerCase();

    // Must have verified email
    if (!info.email_verified) throw new Error("Google account email is not verified.");

    // Must be the allowed domain
    if (!email.endsWith("@" + CONFIG.ALLOWED_DOMAIN)) {
      throw new Error("Access denied: only @" + CONFIG.ALLOWED_DOMAIN + " accounts are allowed.");
    }

    // Look up or auto-create the user row in Users sheet
    var record = DB.getUserByEmail(email);
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
