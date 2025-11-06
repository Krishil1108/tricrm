const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  used: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Index for automatic cleanup of expired tokens
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate a secure token
passwordResetTokenSchema.statics.createToken = function(userId, ipAddress, userAgent) {
  // Generate a random token (32 bytes = 64 hex characters)
  const token = crypto.randomBytes(32).toString('hex');
  
  // Hash the token for storage (extra security layer)
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Create token document with 30 minutes expiration
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  
  return {
    token, // Return unhashed token (to send to user)
    hashedToken, // Store hashed token in DB
    expiresAt,
    ipAddress,
    userAgent
  };
};

// Static method to hash a token for verification
passwordResetTokenSchema.statics.hashToken = function(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

// Static method to verify and get token
passwordResetTokenSchema.statics.verifyToken = async function(token) {
  const hashedToken = this.hashToken(token);
  
  const tokenDoc = await this.findOne({
    token: hashedToken,
    expiresAt: { $gt: new Date() },
    used: false
  }).populate('userId', '-password');
  
  return tokenDoc;
};

// Method to mark token as used
passwordResetTokenSchema.methods.markAsUsed = async function() {
  this.used = true;
  this.usedAt = new Date();
  await this.save();
};

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
