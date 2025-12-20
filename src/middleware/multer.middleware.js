// multer.middleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// import your DB service to fetch company name
import { getCompanyNameById } from './services/company.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------
// COMPANY PROFILES (unchanged)
const companyProfilesDir = path.join(__dirname, '../uploads/companyProfiles');
const companyStorage = multer.diskStorage({
  destination: companyProfilesDir,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Helper to resolve company folder dynamically
async function resolveCompanyFolder(req, subDir) {
  try {
    const { companyID } = req.auth;
    // fetch company name (make sure this returns e.g. 'AcmeInc' not 'Acme Inc.')
    let companyName = await getCompanyNameById(companyID);
    console.log("Resolved company name:", companyName);

    // If company name isn't available, fall back to companyID so uploads are still separated per tenant
    if (!companyName) companyName = companyID || 'default';

    // sanitize companyName for folder usage (replace spaces & special chars)
    const safeName = companyName.replace(/[^a-zA-Z0-9-_]/g, '_');

    const uploadDir = path.join(__dirname, `../uploads/${safeName}/${subDir}`);
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created/using upload directory: ${uploadDir}`);
    return uploadDir;
  } catch (err) {
    // fallback to default folder
    const fallback = path.join(__dirname, `../uploads/default/${subDir}`);
    fs.mkdirSync(fallback, { recursive: true });
    console.log(`Using fallback upload directory: ${fallback} due to error:`, err && err.message ? err.message : err);
    return fallback;
  }
}

// ------------------------
// CUSTOMER PHOTOS
const customerStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = await resolveCompanyFolder(req, 'customers');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// ------------------------
// LEAD ATTACHMENTS
const leadStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = await resolveCompanyFolder(req, 'leads');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// ------------------------
// EMPLOYEE PHOTOS
const employeeStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = await resolveCompanyFolder(req, 'employees');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const rawMaterialStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = await resolveCompanyFolder(req, 'rawMaterials');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// ------------------------
// PRODUCTS
const productStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = await resolveCompanyFolder(req, 'products');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// ------------------------
// ATTENDANCE CSV UPLOADS
const attendanceStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = await resolveCompanyFolder(req, 'attendance');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// ------------------------
// Export uploaders
export const uploadEmployeePhoto = multer({ storage: employeeStorage });
export const uploadCompanyProfile = multer({ storage: companyStorage });
export const uploadCustomerPhoto = multer({ storage: customerStorage });
export const uploadLeadAttachment = multer({ storage: leadStorage });
export const uploadRawMaterialImage = multer({ storage: rawMaterialStorage });
export const uploadAttendanceCsv = multer({ storage: attendanceStorage });
export const uploadProductImage = multer({ storage: productStorage });

// ------------------------
// PROJECT FILES
const projectStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = await resolveCompanyFolder(req, 'projects');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

export const uploadProjectFiles = multer({ storage: projectStorage });

// ------------------------
// TOOLS & MACHINERY FILES
const toolsStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = await resolveCompanyFolder(req, 'tools');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

export const uploadToolImage = multer({ storage: toolsStorage });

// ------------------------
// AP INVOICE ATTACHMENTS
const apInvoiceStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = await resolveCompanyFolder(req, 'apInvoices');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

export const uploadInvoiceAttachments = multer({ storage: apInvoiceStorage });

// ------------------------
// AR INVOICE ATTACHMENTS
const arInvoiceStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = await resolveCompanyFolder(req, 'arInvoices');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

export const uploadArInvoiceAttachments = multer({ storage: arInvoiceStorage });
