/**
 * Useme Team - Seed Configuration & Generator Utilities
 */
(function(exports) {
  let _seed = 421987;
  const rnd = () => {
    _seed = (_seed * 1664525 + 1013904223) % 4294967296;
    return _seed / 4294967296;
  };
  const setSeed = (s) => { _seed = s || 421987; };
  const rInt = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const pickMultiple = (arr, count) => {
    const shuffled = [...arr].sort(() => rnd() - 0.5);
    return shuffled.slice(0, Math.min(count, arr.length));
  };
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  // Date generators relative to reference date (August 25, 2026)
  const REF_DATE = new Date('2026-08-25T12:00:00.000Z');
  const addDays = (d, days) => new Date(d.getTime() + days * 86400000);
  const formatDate = (d) => d.toISOString().slice(0, 10);
  const formatDateTime = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
  const formatISO = (d) => d.toISOString();

  const FIRST_NAMES = [
    'Aarav', 'Aditi', 'Amit', 'Ananya', 'Arjun', 'Dev', 'Diya', 'Ishaan', 'Kavya', 'Manish',
    'Neha', 'Nikhil', 'Pooja', 'Priya', 'Rahul', 'Ravi', 'Rhea', 'Rohan', 'Sameer', 'Sneha',
    'Tanvi', 'Varun', 'Vikram', 'Zara', 'Kiran', 'Siddharth', 'Meera', 'Tarun', 'Alok', 'Deepa',
    'Gaurav', 'Harsh', 'Isha', 'Jatin', 'Kunal', 'Maya', 'Naveen', 'Pallavi', 'Pranav', 'Radhika',
    'Sanjay', 'Shreya', 'Sumit', 'Tanya', 'Umesh', 'Vidya', 'Vivek', 'Yash', 'Anil', 'Bhavna',
    'Rajesh', 'Sunita', 'Karthik', 'Swati', 'Abhishek', 'Monika', 'Mohit', 'Preeti', 'Deepak', 'Nisha'
  ];

  const LAST_NAMES = [
    'Sharma', 'Verma', 'Patel', 'Mehta', 'Iyer', 'Nair', 'Reddy', 'Rao', 'Gupta', 'Joshi',
    'Bhat', 'Kulkarni', 'Malhotra', 'Kapoor', 'Singh', 'Das', 'Sen', 'Chatterjee', 'Deshmukh', 'Chopra',
    'Saxena', 'Agarwal', 'Nambiar', 'Menon', 'Trivedi', 'Pandey', 'Mishra', 'Dubey', 'Bose', 'Ghosh',
    'Swaminathan', 'Singhania', 'Chauhan', 'Bhattacharya', 'Kashyap', 'Choudhury', 'Pillai', 'Acharya'
  ];

  const CITIES = [
    'Bangalore, IN', 'Mumbai, IN', 'Delhi NCR, IN', 'Hyderabad, IN', 'Pune, IN',
    'Chennai, IN', 'Kolkata, IN', 'Ahmedabad, IN', 'Jaipur, IN', 'Kochi, IN'
  ];

  const DEPARTMENTS = [
    { id: 'dept-exec', name: 'Executive', colorHex: '#4F46E5', order: 1 },
    { id: 'dept-eng', name: 'Engineering', colorHex: '#2563EB', order: 2 },
    { id: 'dept-prod', name: 'Product & Design', colorHex: '#D97706', order: 3 },
    { id: 'dept-growth', name: 'Growth & Marketing', colorHex: '#059669', order: 4 },
    { id: 'dept-fin', name: 'Finance & Operations', colorHex: '#0D9488', order: 5 },
    { id: 'dept-data', name: 'Data & Analytics', colorHex: '#7C3AED', order: 6 },
    { id: 'dept-supp', name: 'Customer Support', colorHex: '#E11D48', order: 7 }
  ];

  const SKILL_CATEGORIES = [
    { id: 'dev', name: 'Software Development', description: 'Web, backend, frontend, APIs, and distributed systems architecture' },
    { id: 'data', name: 'Data Analysis', description: 'Data modeling, BI reporting, telemetry, and analytics pipelines' },
    { id: 'finance', name: 'CA / Finance', description: 'Financial auditing, accounting, GST compliance, and forecasting' },
    { id: 'design', name: 'Printing & Design', description: 'Packaging, visual identity, UI/UX prototyping, and print assets' },
    { id: 'marketing', name: 'Marketing', description: 'Growth hacking, performance advertising, and campaign optimization' },
    { id: 'support', name: 'Tech Support', description: 'Customer troubleshooting, hardware diagnostics, and ticket resolution' }
  ];

  function sha256(str) {
    const ascii = unescape(encodeURIComponent(String(str || '')));
    function rightRotate(v, a) { return (v >>> a) | (v << (32 - a)); }
    const maxWord = Math.pow(2, 32);
    let words = [], hash = [], k = [], pCount = 0, isComp = {};
    for (let c = 2; pCount < 64; c++) {
      if (!isComp[c]) {
        for (let i = 0; i < 313; i += c) isComp[i] = c;
        hash[pCount] = (Math.pow(c, .5) * maxWord) | 0;
        k[pCount++] = (Math.pow(c, 1/3) * maxWord) | 0;
      }
    }
    hash = hash.slice(0, 8);
    let padded = ascii + '\x80';
    while (padded.length % 64 - 56) padded += '\x00';
    for (let i = 0; i < padded.length; i++) words[i >> 2] |= padded.charCodeAt(i) << ((3 - i) % 4) * 8;
    words[words.length] = ((ascii.length * 8 / maxWord) | 0);
    words[words.length] = (ascii.length * 8) | 0;
    for (let j = 0; j < words.length;) {
      let w = words.slice(j, j += 16), oldH = hash;
      hash = hash.slice(0, 8);
      for (let i = 0; i < 64; i++) {
        let w15 = w[i - 15], w2 = w[i - 2];
        let s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        let s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        let s1h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
        let ch = (hash[4] & hash[5]) ^ ((~hash[4]) & hash[6]);
        let t1 = hash[7] + s1h + ch + k[i] + w[i];
        let s0h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
        let maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        let t2 = s0h + maj;
        hash = [(t1 + t2) | 0].concat(hash);
        hash[4] = (hash[4] + t1) | 0;
      }
      for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldH[i]) | 0;
    }
    let res = '';
    for (let i = 0; i < 8; i++) for (let j = 3; j >= 0; j--) {
      let b = (hash[i] >> (8 * j)) & 255;
      res += (b < 16 ? '0' : '') + b.toString(16);
    }
    return res;
  }

  exports.SeedConfig = {
    rnd, setSeed, rInt, pick, pickMultiple, clamp,
    REF_DATE, addDays, formatDate, formatDateTime, formatISO,
    FIRST_NAMES, LAST_NAMES, CITIES, DEPARTMENTS, SKILL_CATEGORIES,
    sha256,
    STORAGE_KEY: 'useme_data_store',
    GUARD_FLAG: 'useme_seeded_v1'
  };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window = window || {}));
