const fs = require('fs');

// ── Helpers ──────────────────────────────────────────────────────────────────

const authHeader = () => ({ key: "auth", value: "Bearer {{access_token}}", type: "text" });
const refreshHeader = () => ({ key: "x-refresh-token", value: "Bearer {{refresh_token}}", type: "text" });
const jsonHeader = () => ({ key: "Content-Type", value: "application/json", type: "text" });

function req({ name, method, path, headers = [], body = null, params = null, description = "" }) {
  const item = {
    name,
    request: {
      method,
      header: headers,
      url: {
        raw: "{{base_url}}" + path,
        host: ["{{base_url}}"],
        path: path.replace(/^\//, "").split("/").filter(Boolean),
      },
      description
    },
    response: []
  };

  if (params) {
    item.request.url.query = params;
    // append raw query string
    const qs = params.map(p => `${p.key}=${p.value}`).join("&");
    item.request.url.raw += "?" + qs;
  }

  if (body) {
    item.request.body = {
      mode: "raw",
      raw: JSON.stringify(body, null, 4),
      options: { raw: { language: "json" } }
    };
  }

  return item;
}

// Capture tokens from register/login response headers
const captureTokensScript = [
  "// Auto-capture access & refresh tokens from response headers",
  "const authHeader = pm.response.headers.get('auth');",
  "const refreshHeader = pm.response.headers.get('x-refresh-token');",
  "",
  "if (authHeader) {",
  "    const at = authHeader.replace('Bearer ', '').trim();",
  "    pm.collectionVariables.set('access_token', at);",
  "    console.log('access_token saved');",
  "}",
  "",
  "if (refreshHeader) {",
  "    const rt = refreshHeader.replace('Bearer ', '').trim();",
  "    pm.collectionVariables.set('refresh_token', rt);",
  "    console.log('refresh_token saved');",
  "}"
];

function withTokenCapture(item) {
  item.event = [
    {
      listen: "test",
      script: {
        type: "text/javascript",
        exec: captureTokensScript
      }
    }
  ];
  return item;
}

// ── AUTH ─────────────────────────────────────────────────────────────────────

const authFolder = {
  name: "1. Auth",
  description: "Registration, login, session management, and password recovery. Most routes here are public.",
  item: [

    withTokenCapture(req({
      name: "Register",
      method: "POST",
      path: "/auth/register",
      headers: [jsonHeader()],
      description: "Public — creates a new account. student_email must be a recognized Ghanaian university email domain. Access and refresh tokens are returned via the 'auth' and 'x-refresh-token' response headers and auto-saved to collection variables.",
      body: {
        email: "john.doe@example.com",
        student_email: "john.doe@st.ug.edu.gh",
        fullname: "John Doe",
        dob: "2001-05-14",
        password: "SecurePass123!",
        username: "johndoe",
        bio: "Computer Science student at University of Ghana.",
        profile_url: "",
        cover_url: "",
        device_info: "Chrome on Windows 11"
      }
    })),

    withTokenCapture(req({
      name: "Login",
      method: "POST",
      path: "/auth/login",
      headers: [jsonHeader()],
      description: "Public — authenticates a user and opens a new session. Tokens are returned via the 'auth' and 'x-refresh-token' response headers and auto-saved to collection variables.",
      body: {
        email: "john.doe@example.com",
        password: "SecurePass123!",
        device_info: "Chrome on Windows 11"
      }
    })),

    req({
      name: "Get My Profile (me)",
      method: "GET",
      path: "/auth/me",
      headers: [authHeader()],
      description: "Auth required — returns the authenticated user's full profile including organization count and pinned course count."
    }),

    req({
      name: "Refresh Access Token",
      method: "POST",
      path: "/auth/refresh",
      headers: [refreshHeader()],
      description: "Requires a valid refresh token in the 'x-refresh-token' header. Rotates the refresh token and issues a new access token via response headers."
    }),

    req({
      name: "Logout",
      method: "POST",
      path: "/auth/logout",
      headers: [authHeader()],
      description: "Auth required — deactivates the current session."
    }),

    req({
      name: "Forgot Password (Request OTP)",
      method: "POST",
      path: "/auth/forgot-password",
      headers: [jsonHeader()],
      description: "Public — sends a one-time password to the account's email for password reset. Returns an access-scoped token used in the next steps.",
      body: {
        email: "john.doe@example.com"
      }
    }),

    req({
      name: "Resend Verification Email",
      method: "POST",
      path: "/auth/resend-verification-email",
      headers: [jsonHeader()],
      description: "Public — resends the email verification link/OTP.",
      body: {
        email: "john.doe@example.com"
      }
    }),

    req({
      name: "Verify Email",
      method: "POST",
      path: "/auth/verify-email",
      headers: [jsonHeader()],
      description: "Public — verifies a user's email address using the token/OTP sent to their inbox.",
      body: {
        email: "john.doe@example.com",
        otp_key: "123456"
      }
    }),

    req({
      name: "Verify OTP (Password Reset)",
      method: "POST",
      path: "/auth/otp-verify",
      headers: [authHeader(), jsonHeader()],
      description: "Requires the access token issued by 'Forgot Password'. Validates the OTP sent to the user's email before allowing a password reset.",
      body: {
        otp_key: "123456"
      }
    }),

    req({
      name: "Reset Password",
      method: "POST",
      path: "/auth/reset-password",
      headers: [authHeader(), jsonHeader()],
      description: "Requires the access token from the OTP-verified flow. Sets a new password and invalidates the current session's tokens.",
      body: {
        new_password: "NewSecurePass456!"
      }
    })

  ]
};


// ── USERS ────────────────────────────────────────────────────────────────────

const usersFolder = {
  name: "2. Users",
  description: "Profile management for the authenticated user, plus public profile and activity lookups.",
  item: [

    req({
      name: "Get User Profile",
      method: "GET",
      path: "/users/:id",
      headers: [authHeader()],
      description: "Auth required — returns a user's public profile by ID. Includes organization_count and pinned_course_count."
    }),

    req({
      name: "Update My Profile",
      method: "PATCH",
      path: "/users",
      headers: [authHeader(), jsonHeader()],
      description: "Auth required — updates the authenticated user's full_name, bio, and website_url.",
      body: {
        full_name: "John Doe",
        bio: "Final-year Computer Science student at University of Ghana.",
        website_url: "https://johndoe.dev"
      }
    }),

    req({
      name: "Update Profile Avatar",
      method: "PATCH",
      path: "/users/avatar",
      headers: [authHeader(), jsonHeader()],
      description: "Auth required — replaces the user's profile image. profile_url must be a valid (already-uploaded) S3 URL.",
      body: {
        profile_url: "https://unny-bucket.s3.amazonaws.com/avatars/johndoe.png"
      }
    }),

    req({
      name: "Update Cover Image",
      method: "PATCH",
      path: "/users/cover",
      headers: [authHeader(), jsonHeader()],
      description: "Auth required — replaces the user's cover/banner image. image_url must be a valid (already-uploaded) S3 URL.",
      body: {
        image_url: "https://unny-bucket.s3.amazonaws.com/covers/johndoe.png"
      }
    }),

    req({
      name: "Change Password",
      method: "PATCH",
      path: "/users/password",
      headers: [authHeader(), jsonHeader()],
      description: "Auth required — changes the account password. Requires correct current_password. All other active sessions are logged out on success.",
      body: {
        current_password: "SecurePass123!",
        new_password: "EvenMoreSecure789!"
      }
    }),

    req({
      name: "Delete My Account",
      method: "DELETE",
      path: "/users",
      headers: [authHeader()],
      description: "Auth required — soft-deletes (deactivates) the authenticated user's account."
    }),

    req({
      name: "Get User's Organizations",
      method: "GET",
      path: "/users/:id/organization/0/20",
      headers: [authHeader()],
      description: "Auth required — paginated list of organizations the specified user is a verified member of. Path format: /users/:id/organization/:offset/:limit"
    }),

    req({
      name: "Get User's Enrolled Courses",
      method: "GET",
      path: "/users/:id/courses/0/20",
      headers: [authHeader()],
      description: "Auth required — paginated list of all courses (active and archived) the specified user is enrolled in. Path format: /users/:id/courses/:offset/:limit"
    }),

    req({
      name: "Get User's Pinned Courses",
      method: "GET",
      path: "/users/:id/pinned-courses/0/20",
      headers: [authHeader()],
      description: "Auth required — paginated list of courses pinned to the specified user's profile. Path format: /users/:id/pinned-courses/:offset/:limit"
    })

  ]
};


// ── ORGANIZATIONS ────────────────────────────────────────────────────────────

const orgsFolder = {
  name: "3. Organizations",
  description: "Organization CRUD, branding, and membership management.",
  item: [

    req({
      name: "List Organizations",
      method: "GET",
      path: "/organizations/0/20",
      headers: [authHeader()],
      description: "Auth required — paginated list of all organizations on the platform. Path format: /organizations/:offset/:limit"
    }),

    req({
      name: "Get Organization By Slug",
      method: "GET",
      path: "/organizations/university-of-ghana",
      headers: [],
      description: "Public — returns full organization details by slug, including owner snapshot, member count, and course counts."
    }),

    req({
      name: "Create Organization",
      method: "POST",
      path: "/organizations",
      headers: [authHeader(), jsonHeader()],
      description: "Auth required — creates a new organization. The creator is automatically added as a verified CREATOR member.",
      body: {
        name: "University of Ghana",
        slug: "university-of-ghana",
        profile_image_url: "https://unny-bucket.s3.amazonaws.com/orgs/ug-logo.png",
        cover_image_url: "https://unny-bucket.s3.amazonaws.com/orgs/ug-cover.png",
        description: "The premier university in Ghana, located in Legon, Accra.",
        website_url: "https://ug.edu.gh",
        contact_email: "info@ug.edu.gh",
        access_mode: "open"
      }
    }),

    req({
      name: "Update Organization",
      method: "PATCH",
      path: "/organizations/:id",
      headers: [authHeader(), jsonHeader()],
      description: "Auth required — org owner (CREATOR) only. Partial update of organization metadata. Omit fields you don't want to change.",
      body: {
        name: "University of Ghana",
        slug: "university-of-ghana",
        description: "Ghana's oldest and largest university, located in Legon, Accra.",
        website_url: "https://ug.edu.gh",
        contact_email: "registrar@ug.edu.gh",
        access_mode: "open"
      }
    }),

    req({
      name: "Update Organization Logo",
      method: "PATCH",
      path: "/organizations/:id/logo",
      headers: [authHeader(), jsonHeader()],
      description: "Auth required — org owner only. profile_image_url must be a valid (already-uploaded) S3 URL.",
      body: {
        profile_image_url: "https://unny-bucket.s3.amazonaws.com/orgs/ug-logo-v2.png"
      }
    }),

    req({
      name: "Update Organization Cover",
      method: "PATCH",
      path: "/organizations/:id/cover",
      headers: [authHeader(), jsonHeader()],
      description: "Auth required — org owner only. image_url must be a valid (already-uploaded) S3 URL.",
      body: {
        image_url: "https://unny-bucket.s3.amazonaws.com/orgs/ug-cover-v2.png"
      }
    }),

    req({
      name: "Delete Organization",
      method: "DELETE",
      path: "/organizations/:id",
      headers: [authHeader()],
      description: "Auth required — admin/owner level. Permanently deletes the organization and cascades to members, courses, enrollments, and documents."
    }),

    req({
      name: "List Organization Members",
      method: "GET",
      path: "/organizations/:id/members/0/20",
      headers: [authHeader()],
      description: "Auth required — paginated list of all verified members with their roles. Path format: /organizations/:id/members/:offset/:limit"
    }),

    req({
      name: "Request to Join Organization",
      method: "POST",
      path: "/organizations/:id/members/join",
      headers: [authHeader(), jsonHeader()],
      description: "Auth required — submits a membership request. role must be STUDENT or UNVERIFIED_LECTURER. Awaits verification by a CREATOR/LECTURER.",
      body: {
        role: "STUDENT",
        institutional_id: "10912345"
      }
    }),

    req({
      name: "Verify Member",
      method: "POST",
      path: "/organizations/:id/member/:userId/verify",
      headers: [authHeader(), jsonHeader()],
      description: "Auth required — CREATOR or verified LECTURER only. Verifies a pending member and assigns their confirmed role.",
      body: {
        assigned_role: "STUDENT"
      }
    }),

    req({
      name: "Change Member Role",
      method: "PATCH",
      path: "/organizations/:id/members/:userId/LECTURER",
      headers: [authHeader()],
      description: "Auth required — CREATOR only. Changes a verified member's role. Path format: /organizations/:id/members/:userId/:role  (role: STUDENT | LECTURER | UNVERIFIED_LECTURER)"
    }),

    req({
      name: "Remove Member",
      method: "DELETE",
      path: "/organizations/:id/members/:userId",
      headers: [authHeader()],
      description: "Auth required — a user can remove themselves (leave), or a CREATOR can remove any member except themselves."
    }),

    req({
      name: "List Pending Members",
      method: "GET",
      path: "/organizations/:id/pending_members",
      headers: [authHeader()],
      params: [
        { key: "offset", value: "0" },
        { key: "limit", value: "20" }
      ],
      description: "Auth required — admin/CREATOR/LECTURER level. Returns unverified membership requests awaiting approval."
    })

  ]
};


// ── COURSES ──────────────────────────────────────────────────────────────────

const coursesFolder = {
  name: "4. Courses",
  description: "Course CRUD, lifecycle (active/archive), enrollment, pinning, and document management.",
  item: [

    req({
      name: "List Courses",
      method: "GET",
      path: "/courses/0/20",
      headers: [authHeader()],
      description: "Auth required — paginated list of ACTIVE courses. Path format: /courses/:offset/:limit"
    }),

    req({
      name: "Create Course",
      method: "POST",
      path: "/courses",
      headers: [authHeader(), jsonHeader()],
      description: "Auth required — LECTURER or CREATOR level. Creates a new course under an organization. New courses default to status ACTIVE.",
      body: {
        org_id: "1234567890123456789",
        title: "Introduction to Databases",
        course_code: "CS401",
        slug: "intro-to-databases-2026",
        description: "Covers relational database design, SQL, normalization, and transactions.",
        cover_image_url: "https://unny-bucket.s3.amazonaws.com/courses/cs401-cover.png",
        start_date: "2026-01-15",
        end_date: "2026-06-15"
      }
    }),

    req({
      name: "Get Course By Slug",
      method: "GET",
      path: "/courses/intro-to-databases-2026",
      headers: [authHeader()],
      description: "Auth required — returns full course detail by slug, including enrollment count, document count, organization, and creator info."
    }),

    req({
      name: "Update Course Metadata",
      method: "PATCH",
      path: "/courses/:id",
      headers: [authHeader(), jsonHeader()],
      description: "Auth required — LECTURER/CREATOR (course owner) only. Partial update of title, course_code, and description.",
      body: {
        title: "Introduction to Databases",
        course_code: "CS401",
        description: "Updated: now also covers indexing strategies and query optimization."
      }
    }),

    req({
      name: "Update Course Cover Image",
      method: "PATCH",
      path: "/courses/:id/cover",
      headers: [authHeader(), jsonHeader()],
      description: "Auth required — LECTURER/CREATOR (course owner) only. cover_image_url must be a valid (already-uploaded) S3 URL.",
      body: {
        cover_image_url: "https://unny-bucket.s3.amazonaws.com/courses/cs401-cover-v2.png"
      }
    }),

    req({
      name: "Archive Course",
      method: "PATCH",
      path: "/courses/:id/archive",
      headers: [authHeader()],
      description: "Auth required — LECTURER/CREATOR (course owner) only. One-way transition ACTIVE -> ARCHIVED. Cannot be reversed."
    }),

    req({
      name: "Delete Course",
      method: "DELETE",
      path: "/courses/:id",
      headers: [authHeader()],
      description: "Auth required — admin/owner level. Permanently deletes the course and cascades to enrollments, documents, and pinned references."
    }),

    req({
      name: "List Enrolled Students",
      method: "GET",
      path: "/courses/:id/enrollments/0/20",
      headers: [authHeader()],
      description: "Auth required — LECTURER/CREATOR (course owner) only. Paginated list of students enrolled in this course. Path format: /courses/:id/enrollments/:offset/:limit"
    }),

    req({
      name: "Enroll In Course",
      method: "DELETE",
      path: "/courses/:id/enroll",
      headers: [authHeader()],
      description: "Auth required. NOTE: This route is defined as DELETE in the backend (course.delete('/:id/enroll')) — verify with your team whether this should be POST; sending DELETE here matches the current implementation."
    }),

    req({
      name: "Unenroll Student (Lecturer)",
      method: "DELETE",
      path: "/courses/:id/unenroll",
      headers: [authHeader()],
      params: [
        { key: "target_id", value: "STUDENT_USER_ID" }
      ],
      description: "Auth required — LECTURER level. Removes a specific student from the course. Pass the student's user id as target_id."
    }),

    req({
      name: "Pin Course To Profile",
      method: "GET",
      path: "/courses/:id/pin",
      headers: [authHeader()],
      description: "Auth required. NOTE: This route is defined as GET in the backend (course.get('/:id/pin')) — pins the course to the authenticated user's profile."
    }),

    req({
      name: "Unpin Course From Profile",
      method: "DELETE",
      path: "/courses/:id/unpin",
      headers: [authHeader()],
      description: "Auth required — removes a pinned course from the authenticated user's profile."
    }),

    req({
      name: "List Course Documents",
      method: "GET",
      path: "/courses/:id/documents/0/20",
      headers: [authHeader()],
      description: "Auth required — enrolled + verified org members only (IDOR-protected). Paginated list of visible documents. Path format: /courses/:id/documents/:offset/:limit"
    }),

    req({
      name: "Upload Course Document",
      method: "POST",
      path: "/courses/:id/documents",
      headers: [authHeader(), jsonHeader()],
      description: "Auth required — LECTURER level, must be enrolled + verified org member (IDOR-protected). file_url etc. should reference an already-uploaded S3 object.",
      body: {
        title: "Week 1 Lecture Slides — Relational Model",
        description: "Introduction to the relational model, tables, and keys.",
        file_url: "https://unny-bucket.s3.amazonaws.com/documents/cs401-week1.pdf",
        thumbnail_url: "https://unny-bucket.s3.amazonaws.com/documents/cs401-week1-thumb.png",
        file_type: "application/pdf",
        file_size_bytes: 2457600,
        original_filename: "CS401_Week1_Relational_Model.pdf"
      }
    }),

    req({
      name: "Get Document Metadata",
      method: "GET",
      path: "/courses/:id/documents/:docId",
      headers: [authHeader()],
      description: "Auth required — returns full metadata for a single document."
    }),

    req({
      name: "Update Document Metadata",
      method: "PATCH",
      path: "/courses/:id/documents/:docId",
      headers: [authHeader(), jsonHeader()],
      description: "Auth required — uploader only. Updates title and/or description.",
      body: {
        title: "Week 1 Lecture Slides — Relational Model (Revised)",
        description: "Updated with corrected diagrams for the relational model."
      }
    }),

    req({
      name: "Toggle Document Visibility",
      method: "PATCH",
      path: "/courses/:id/documents/:docId/true",
      headers: [authHeader()],
      description: "Auth required — uploader only. Path format: /courses/:id/documents/:docId/:visibility  where visibility is 'true' or 'false'."
    }),

    req({
      name: "Delete Document",
      method: "DELETE",
      path: "/courses/:id/documents/:docId",
      headers: [authHeader()],
      description: "Auth required — uploader only. Permanently deletes the document record."
    })

  ]
};


// ── NOTIFICATIONS ────────────────────────────────────────────────────────────

const notificationsFolder = {
  name: "5. Notifications",
  description: "In-app notifications — list, unread count, mark read, and delete.",
  item: [

    req({
      name: "List Notifications",
      method: "GET",
      path: "/notification/0/20",
      headers: [authHeader()],
      description: "Auth required — paginated list of the authenticated user's notifications, newest first. Path format: /notification/:offset/:limit"
    }),

    req({
      name: "Get Unread Count",
      method: "GET",
      path: "/notification/unread-count",
      headers: [authHeader()],
      description: "Auth required — returns the count of unread notifications for the badge display."
    }),

    req({
      name: "Mark Notification As Read",
      method: "PATCH",
      path: "/notification/:id/read",
      headers: [authHeader()],
      description: "Auth required — marks a single notification as read. Ownership enforced."
    }),

    req({
      name: "Mark All Notifications As Read",
      method: "PATCH",
      path: "/notification/read-all",
      headers: [authHeader()],
      description: "Auth required — bulk marks all unread notifications as read for the current user."
    }),

    req({
      name: "Delete Notification",
      method: "DELETE",
      path: "/notification/:id",
      headers: [authHeader()],
      description: "Auth required — deletes a single notification. Ownership enforced."
    })

  ]
};


// ── SEARCH ───────────────────────────────────────────────────────────────────

const searchFolder = {
  name: "6. Search",
  description: "Platform-wide and scoped search across organizations, courses, and documents.",
  item: [

    req({
      name: "Search All",
      method: "GET",
      path: "/search",
      headers: [authHeader()],
      params: [
        { key: "q", value: "database" },
        { key: "limit", value: "20" },
        { key: "offset", value: "0" }
      ],
      description: "Auth required — global search across organizations, courses, and visible documents. Returns unified results with a result_type field."
    }),

    req({
      name: "Search Organizations",
      method: "GET",
      path: "/search/organizations",
      headers: [authHeader()],
      params: [
        { key: "q", value: "ghana" },
        { key: "limit", value: "20" },
        { key: "offset", value: "0" }
      ],
      description: "Auth required — search organizations by name and description."
    }),

    req({
      name: "Search Courses",
      method: "GET",
      path: "/search/courses",
      headers: [authHeader()],
      params: [
        { key: "q", value: "database" },
        { key: "status", value: "ACTIVE" },
        { key: "limit", value: "20" },
        { key: "offset", value: "0" }
      ],
      description: "Auth required — search courses by title, description, and course_code. Optional status filter: ACTIVE | ARCHIVED."
    }),

    req({
      name: "Search Documents",
      method: "GET",
      path: "/search/documents",
      headers: [authHeader()],
      params: [
        { key: "q", value: "relational model" },
        { key: "limit", value: "20" },
        { key: "offset", value: "0" }
      ],
      description: "Auth required — search visible documents by title and description. IDOR-protected: only returns documents from courses the caller is enrolled in and orgs they are a verified member of."
    })

  ]
};


// ── ADMIN ────────────────────────────────────────────────────────────────────

const adminFolder = {
  name: "7. Admin",
  description: "Platform administration — user management, organization oversight, and statistics. Requires admin-level access.",
  item: [

    req({
      name: "List All Users",
      method: "GET",
      path: "/admin/users/0/20",
      headers: [authHeader()],
      description: "Auth required (admin) — paginated list of all platform users. Path format: /admin/users/:offset/:limit"
    }),

    req({
      name: "Activate User",
      method: "PATCH",
      path: "/admin/users/:id/activate",
      headers: [authHeader()],
      description: "Auth required (admin) — reactivates a previously deactivated user account."
    }),

    req({
      name: "Deactivate User",
      method: "PATCH",
      path: "/admin/users/:id/deactivate",
      headers: [authHeader()],
      description: "Auth required (admin) — deactivates a user account and kills all their active sessions."
    }),

    req({
      name: "List Organizations With Owners",
      method: "GET",
      path: "/admin/organizations/0/20",
      headers: [authHeader()],
      description: "Auth required (admin) — paginated list of all organizations with owner info. Path format: /admin/organizations/:offset/:limit"
    }),

    req({
      name: "List All Courses (Admin)",
      method: "GET",
      path: "/admin/courses/0/20",
      headers: [authHeader()],
      description: "Auth required (admin) — paginated list of all courses across all organizations. Path format: /admin/courses/:offset/:limit  NOTE: controller logic for this route was not implemented in the provided codebase at time of writing."
    }),

    req({
      name: "Platform Statistics",
      method: "GET",
      path: "/admin/stats",
      headers: [authHeader()],
      description: "Auth required (admin) — returns platform-wide summary statistics: users, organizations, courses (active/archived), enrollments, and documents. NOTE: route wiring for this endpoint was incomplete in the provided codebase at time of writing."
    })

  ]
};


// ── COLLECTION ASSEMBLY ──────────────────────────────────────────────────────

const collection = {
  info: {
    name: "Unny Platform API",
    description: "University-Centric Edutech Platform — full API collection.\n\nAuth flow:\n1. Run 'Register' or 'Login' — access_token and refresh_token are auto-saved to collection variables from response headers.\n2. All authenticated requests use the 'auth' header with value 'Bearer {{access_token}}'.\n3. When the access token expires, run 'Refresh Access Token' to rotate it.\n\nPagination:\nMost list routes use path-based pagination: /resource/:offset/:limit (e.g. /courses/0/20 = first 20 results).\n\nPlaceholders like :id, :slug, :userId, :docId, :org_id need to be replaced with real values returned from earlier requests.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    { key: "base_url", value: "http://localhost:3000/api/v1", type: "string" },
    { key: "access_token", value: "", type: "string" },
    { key: "refresh_token", value: "", type: "string" }
  ],
  item: [
    authFolder,
    usersFolder,
    orgsFolder,
    coursesFolder,
    notificationsFolder,
    searchFolder,
    adminFolder
  ]
};

fs.writeFileSync("/home/claude/unny_postman_collection.json", JSON.stringify(collection, null, 2));
console.log("Done");