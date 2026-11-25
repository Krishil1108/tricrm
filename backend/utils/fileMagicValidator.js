const fs = require('fs');
const path = require('path');

/**
 * Magic-byte signatures for allowed expense attachment formats.
 * Prevents extension/MIME spoofing (SEC-03).
 */
const MAGIC_SIGNATURES = {
  '.jpg': [[0xff, 0xd8, 0xff]],
  '.jpeg': [[0xff, 0xd8, 0xff]],
  '.png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  '.gif': [[0x47, 0x49, 0x46, 0x38]],
  '.pdf': [[0x25, 0x50, 0x44, 0x46]],
  '.docx': [[0x50, 0x4b, 0x03, 0x04]],
  '.xlsx': [[0x50, 0x4b, 0x03, 0x04]],
  '.doc': [[0xd0, 0xcf, 0x11, 0xe0]],
  '.xls': [[0xd0, 0xcf, 0x11, 0xe0]]
};

const verifyFileMagicBytes = (filePath, originalName) => {
  const ext = path.extname(originalName || filePath).toLowerCase();
  const allowedSignatures = MAGIC_SIGNATURES[ext];
  if (!allowedSignatures) return false;

  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(12);
    const bytesRead = fs.readSync(fd, buffer, 0, 12, 0);
    if (bytesRead < 4) return false;

    return allowedSignatures.some((sig) =>
      sig.every((byte, idx) => bytesRead > idx && buffer[idx] === byte)
    );
  } finally {
    fs.closeSync(fd);
  }
};

/**
 * Express middleware executed after multer disk upload to reject spoofed files.
 */
const validateUploadedMagicBytes = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (files.length === 0) return next();

  for (const file of files) {
    const valid = verifyFileMagicBytes(file.path, file.originalname);
    if (!valid) {
      // Remove all uploaded files from this request to leave no orphan files on disk
      files.forEach((f) => {
        try {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        } catch (_) {}
      });
      return res.status(400).json({
        success: false,
        message: `Invalid or spoofed file signature for "${file.originalname}"`
      });
    }
  }
  next();
};

module.exports = {
  verifyFileMagicBytes,
  validateUploadedMagicBytes
};
