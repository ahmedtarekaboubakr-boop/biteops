import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tutorialsDir = join(__dirname, 'uploads', 'tutorials');
const photosDir = join(__dirname, 'uploads', 'photos');
const certificatesDir = join(__dirname, 'uploads', 'certificates');

if (!fs.existsSync(tutorialsDir)) {
  fs.mkdirSync(tutorialsDir, { recursive: true });
}
if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir, { recursive: true });
}
if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir, { recursive: true });
}

const tutorialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tutorialsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

export const upload = multer({
  storage: tutorialStorage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|wmv|flv|webm|mkv/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('video/');
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, photosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

export const uploadPhoto = multer({
  storage: photoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for photos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('image/');
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, certificatesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

export const uploadCertificate = multer({
  storage: certificateStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for certificates
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
    const mimetype = allowedTypes.test(file.mimetype) ||
      file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('image/');
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  }
});
