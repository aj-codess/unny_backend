/**
 * Ghana University Email Domain Resolver
 * ─────────────────────────────────────────────────────────────────
 * Resolves a Ghanaian institutional email address to its full
 * university name, short name, location, and type.
 *
 * Usage:
 *   import { resolveUniversityEmail } from './universityEmailResolver.js';
 *   const result = resolveUniversityEmail('john@st.ug.edu.gh');
 */

// ─────────────────────────────────────────────────────────────────────────────
//  REGISTRY
//  Each entry maps one or more email domain suffixes to a university record.
//  Domains are matched from most-specific (longest) to least-specific so that
//  subdomains like "st.ug.edu.gh" take priority over "ug.edu.gh".
// ─────────────────────────────────────────────────────────────────────────────

/** @type {UniversityRecord[]} */
const GHANA_UNIVERSITIES = [

  // ── Public Technical Universities ────────────────────────────────────────

  {
    name:      "Accra Technical University",
    shortName: "ATU",
    location:  "Accra, Greater Accra",
    type:      "Public Technical University",
    website:   "https://atu.edu.gh",
    domains:   ["atu.edu.gh"],
  },
  {
    name:      "Kumasi Technical University",
    shortName: "KsTU",
    location:  "Kumasi, Ashanti",
    type:      "Public Technical University",
    website:   "https://kstu.edu.gh",
    domains:   ["kstu.edu.gh"],
  },
  {
    name:      "Cape Coast Technical University",
    shortName: "CCTU",
    location:  "Cape Coast, Central",
    type:      "Public Technical University",
    website:   "https://cctu.edu.gh",
    domains:   ["cctu.edu.gh"],
  },
  {
    name:      "Takoradi Technical University",
    shortName: "TTU",
    location:  "Takoradi, Western",
    type:      "Public Technical University",
    website:   "https://ttu.edu.gh",
    domains:   ["ttu.edu.gh"],
  },
  {
    name:      "Ho Technical University",
    shortName: "HTU",
    location:  "Ho, Volta",
    type:      "Public Technical University",
    website:   "https://htu.edu.gh",
    domains:   ["htu.edu.gh"],
  },
  {
    name:      "Sunyani Technical University",
    shortName: "STU",
    location:  "Sunyani, Bono",
    type:      "Public Technical University",
    website:   "https://stu.edu.gh",
    domains:   ["stu.edu.gh"],
  },
  {
    name:      "Wa Technical University",
    shortName: "WaTU",
    location:  "Wa, Upper West",
    type:      "Public Technical University",
    website:   "https://wtu.edu.gh",
    domains:   ["wtu.edu.gh"],
  },
  {
    name:      "Bolgatanga Technical University",
    shortName: "BTU",
    location:  "Bolgatanga, Upper East",
    type:      "Public Technical University",
    website:   "https://btu.edu.gh",
    domains:   ["btu.edu.gh"],
  },
  {
    name:      "Ghana Communication Technology University",
    shortName: "GCTU",
    location:  "Accra, Greater Accra",
    type:      "Public Technical University",
    website:   "https://gctu.edu.gh",
    domains:   ["gctu.edu.gh", "live.gctu.edu.gh", "student.gctu.edu.gh"],
  },

  // ── Public Universities (Traditional) ────────────────────────────────────

  {
    name:      "University of Ghana",
    shortName: "UG",
    location:  "Legon, Accra, Greater Accra",
    type:      "Public University",
    website:   "https://ug.edu.gh",
    // st.ug.edu.gh = student portal; ug.edu.gh = staff
    domains:   ["st.ug.edu.gh", "ug.edu.gh", "student.ug.edu.gh", "alumni.ug.edu.gh"],
  },
  {
    name:      "Kwame Nkrumah University of Science and Technology",
    shortName: "KNUST",
    location:  "Kumasi, Ashanti",
    type:      "Public University",
    website:   "https://knust.edu.gh",
    domains:   ["knust.edu.gh", "st.knust.edu.gh", "student.knust.edu.gh"],
  },
  {
    name:      "University of Cape Coast",
    shortName: "UCC",
    location:  "Cape Coast, Central",
    type:      "Public University",
    website:   "https://ucc.edu.gh",
    domains:   ["ucc.edu.gh", "st.ucc.edu.gh", "student.ucc.edu.gh"],
  },
  {
    name:      "University for Development Studies",
    shortName: "UDS",
    location:  "Tamale, Northern",
    type:      "Public University",
    website:   "https://uds.edu.gh",
    domains:   ["uds.edu.gh", "st.uds.edu.gh"],
  },
  {
    name:      "University of Education, Winneba",
    shortName: "UEW",
    location:  "Winneba, Central",
    type:      "Public University",
    website:   "https://uew.edu.gh",
    domains:   ["uew.edu.gh", "st.uew.edu.gh"],
  },
  {
    name:      "University of Mines and Technology",
    shortName: "UMaT",
    location:  "Tarkwa, Western",
    type:      "Public University",
    website:   "https://umat.edu.gh",
    domains:   ["umat.edu.gh", "st.umat.edu.gh"],
  },
  {
    name:      "University of Energy and Natural Resources",
    shortName: "UENR",
    location:  "Sunyani, Bono",
    type:      "Public University",
    website:   "https://uenr.edu.gh",
    domains:   ["uenr.edu.gh", "st.uenr.edu.gh"],
  },
  {
    name:      "University of Health and Allied Sciences",
    shortName: "UHAS",
    location:  "Ho, Volta",
    type:      "Public University",
    website:   "https://uhas.edu.gh",
    domains:   ["uhas.edu.gh", "st.uhas.edu.gh"],
  },
  {
    name:      "C.K. Tedam University of Technology and Applied Sciences",
    shortName: "CKT-UTAS",
    location:  "Navrongo, Upper East",
    type:      "Public University",
    website:   "https://cktutas.edu.gh",
    domains:   ["cktutas.edu.gh", "st.cktutas.edu.gh"],
  },
  {
    name:      "Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development",
    shortName: "AAMUSTED",
    location:  "Kumasi, Ashanti",
    type:      "Public University",
    website:   "https://aamusted.edu.gh",
    domains:   ["aamusted.edu.gh", "st.aamusted.edu.gh"],
  },

  // ── Private Universities ──────────────────────────────────────────────────

  {
    name:      "Ashesi University",
    shortName: "Ashesi",
    location:  "Berekuso, Eastern",
    type:      "Private University",
    website:   "https://ashesi.edu.gh",
    domains:   ["ashesi.edu.gh", "student.ashesi.edu.gh"],
  },
  {
    name:      "Central University",
    shortName: "Central",
    location:  "Miotso, Greater Accra",
    type:      "Private University",
    website:   "https://central.edu.gh",
    domains:   ["central.edu.gh", "st.central.edu.gh", "student.central.edu.gh"],
  },
  {
    name:      "University of Professional Studies, Accra",
    shortName: "UPSA",
    location:  "Accra, Greater Accra",
    type:      "Private University",
    website:   "https://upsa.edu.gh",
    domains:   ["upsa.edu.gh", "upsamail.edu.gh", "student.upsa.edu.gh", "mail.upsa.edu.gh"],
  },
  {
    name:      "Ghana Institute of Management and Public Administration",
    shortName: "GIMPA",
    location:  "Accra, Greater Accra",
    type:      "Private University",
    website:   "https://gimpa.edu.gh",
    domains:   ["gimpa.edu.gh", "st.gimpa.edu.gh"],
  },
  {
    name:      "Valley View University",
    shortName: "VVU",
    location:  "Oyibi, Greater Accra",
    type:      "Private University",
    website:   "https://vvu.edu.gh",
    domains:   ["vvu.edu.gh", "student.vvu.edu.gh"],
  },
  {
    name:      "Pentecost University",
    shortName: "PentVars / PU",
    location:  "Sowutuom, Greater Accra",
    type:      "Private University",
    website:   "https://pentvars.edu.gh",
    domains:   ["pentvars.edu.gh", "pentecost.edu.gh", "student.pentvars.edu.gh"],
  },
  {
    name:      "Ghana Christian University College",
    shortName: "GCUC",
    location:  "Kanda, Accra",
    type:      "Private University",
    website:   "https://gcuc.edu.gh",
    domains:   ["gcuc.edu.gh"],
  },
  {
    name:      "Methodist University",
    shortName: "MU",
    location:  "Dansoman, Accra",
    type:      "Private University",
    website:   "https://mu.edu.gh",
    domains:   ["mu.edu.gh", "methodist.edu.gh", "st.methodist.edu.gh"],
  },
  {
    name:      "Lancaster University Ghana",
    shortName: "LUG",
    location:  "Accra, Greater Accra",
    type:      "Private University (International Affiliate)",
    website:   "https://lancaster.edu.gh",
    domains:   ["lancaster.edu.gh", "student.lancaster.edu.gh"],
  },
  {
    name:      "Academic City University College",
    shortName: "Academic City",
    location:  "Accra, Greater Accra",
    type:      "Private University",
    website:   "https://acadcity.edu.gh",
    domains:   ["acadcity.edu.gh", "student.acadcity.edu.gh"],
  },
  {
    name:      "Regent University College of Science and Technology",
    shortName: "Regent",
    location:  "Accra, Greater Accra",
    type:      "Private University",
    website:   "https://regent.edu.gh",
    domains:   ["regent.edu.gh", "student.regent.edu.gh"],
  },
  {
    name:      "Wisconsin International University College",
    shortName: "WIUC",
    location:  "Accra, Greater Accra",
    type:      "Private University",
    website:   "https://wiuc-ghana.edu.gh",
    domains:   ["wiuc-ghana.edu.gh", "wiuc.edu.gh"],
  },
  {
    name:      "Heritage Christian University College",
    shortName: "Heritage",
    location:  "Kumasi, Ashanti",
    type:      "Private University",
    website:   "https://hcu.edu.gh",
    domains:   ["hcu.edu.gh"],
  },
  {
    name:      "Presbyterian University College",
    shortName: "PUC",
    location:  "Abetifi, Eastern",
    type:      "Private University",
    website:   "https://presbyuniversity.edu.gh",
    domains:   ["presbyuniversity.edu.gh", "puc.edu.gh"],
  },
  {
    name:      "Ghana Baptist University College",
    shortName: "GBUC",
    location:  "Kumasi, Ashanti",
    type:      "Private University",
    website:   "https://gbuc.edu.gh",
    domains:   ["gbuc.edu.gh"],
  },
  {
    name:      "Catholic University College of Ghana",
    shortName: "CUCG",
    location:  "Fiapre, Bono",
    type:      "Private University",
    website:   "https://catuc.edu.gh",
    domains:   ["catuc.edu.gh"],
  },
  {
    name:      "Zenith University College",
    shortName: "Zenith",
    location:  "Accra, Greater Accra",
    type:      "Private University",
    website:   "https://zenith.edu.gh",
    domains:   ["zenith.edu.gh"],
  },
];


// ─────────────────────────────────────────────────────────────────────────────
//  BUILD LOOKUP MAP
//  Sorted by domain length descending so the most-specific match wins.
//  e.g. "st.ug.edu.gh" is tested before "ug.edu.gh"
// ─────────────────────────────────────────────────────────────────────────────

/** @type {Map<string, UniversityRecord>} */
const DOMAIN_MAP = new Map();

for (const university of GHANA_UNIVERSITIES) {
  for (const domain of university.domains) {
    DOMAIN_MAP.set(domain.toLowerCase(), university);
  }
}

// Pre-sorted list of all known domains (longest first) for suffix matching
const SORTED_DOMAINS = [...DOMAIN_MAP.keys()].sort((a, b) => b.length - a.length);


// ─────────────────────────────────────────────────────────────────────────────
//  CORE RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves a Ghanaian institutional email to a university record.
 *
 * @param {string} email - The email address to resolve.
 * @returns {ResolveResult}
 *
 * @example
 * resolveUniversityEmail('John.doe@st.ug.edu.gh')
 * // → { found: true, university: { name: 'University of Ghana', ... }, matchedDomain: 'st.ug.edu.gh' }
 */
export function resolveUniversityEmail(email) {
  if (!email || typeof email !== "string") {
    return { found: false, reason: "Invalid input: email must be a non-empty string." };
  }

  const trimmed = email.trim().toLowerCase();

  // Basic format check
  if (!trimmed.includes("@")) {
    return { found: false, reason: "Invalid email format: missing '@' symbol." };
  }

  const [, rawDomain] = trimmed.split("@");

  if (!rawDomain) {
    return { found: false, reason: "Invalid email format: no domain found after '@'." };
  }

  // Try each known domain as a suffix match on the email's domain.
  // This handles cases like "someone@mail.st.ug.edu.gh" matching "st.ug.edu.gh".
  for (const knownDomain of SORTED_DOMAINS) {
    if (rawDomain === knownDomain || rawDomain.endsWith(`.${knownDomain}`)) {
      const university = DOMAIN_MAP.get(knownDomain);
      return {
        found:         true,
        university,
        matchedDomain: knownDomain,
        emailDomain:   rawDomain,
      };
    }
  }

  return {
    found:       false,
    reason:      `No university matched for domain: ${rawDomain}`,
    emailDomain: rawDomain,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
//  CONVENIENCE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns just the university name string, or null if not found.
 * @param {string} email
 * @returns {string|null}
 */
export function getUniversityName(email) {
  const result = resolveUniversityEmail(email);
  return result.found ? result.university.name : null;
}

/**
 * Returns true if the email belongs to any known Ghanaian university.
 * Useful as a registration guard on your platform.
 * @param {string} email
 * @returns {boolean}
 */
export function isInstitutionalEmail(email) {
  return resolveUniversityEmail(email).found;
}

/**
 * Returns all universities of a given type.
 * @param {"Public University"|"Public Technical University"|"Private University"} type
 * @returns {UniversityRecord[]}
 */
export function getUniversitiesByType(type) {
  return GHANA_UNIVERSITIES.filter(u => u.type === type);
}

/**
 * Returns the full registry of all universities.
 * @returns {UniversityRecord[]}
 */
export function getAllUniversities() {
  return GHANA_UNIVERSITIES;
}


// ─────────────────────────────────────────────────────────────────────────────
//  TYPES  (JSDoc — no TypeScript dependency needed)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} UniversityRecord
 * @property {string}   name      - Full official name
 * @property {string}   shortName - Common abbreviation
 * @property {string}   location  - City / Region
 * @property {string}   type      - University category
 * @property {string}   website   - Official website URL
 * @property {string[]} domains   - Known email domains
 */

/**
 * @typedef {Object} ResolveResult
 * @property {boolean}           found         - Whether a match was found
 * @property {UniversityRecord}  [university]  - The matched university (if found)
 * @property {string}            [matchedDomain] - The domain key that matched
 * @property {string}            [emailDomain]   - The raw domain from the email
 * @property {string}            [reason]        - Reason for failure (if not found)
 */