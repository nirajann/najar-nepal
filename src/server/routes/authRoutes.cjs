const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");
const {
  deleteStoredFile,
  parseDataUrl,
  readStoredVerificationImage,
  saveVerificationImageFromDataUrl,
} = require("../utils/verificationStorage.cjs");

const router = express.Router();

const VERIFICATION_REVIEW_ROLES = new Set(["admin", "reviewer"]);
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const MAX_VERIFICATION_IMAGE_BYTES = 5 * 1024 * 1024;

function canReviewVerification(role) {
  return VERIFICATION_REVIEW_ROLES.has(role);
}

function buildUserResponse(user, options = {}) {
  const {
    includeEmail = false,
    includePrivateProfile = false,
    includeReviewMetadata = false,
    includeVerificationDocuments = false,
  } = options;

  const response = {
    id: user._id,
    name: user.name,
    username: user.username,
    profilePhoto: user.profilePhoto,
    role: user.role,
    verificationStatus: user.verificationStatus,
    badges: user.badges,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (includeEmail) {
    response.email = user.email;
  }

  if (includePrivateProfile) {
    response.phone = user.phone;
    response.district = user.district;
    response.province = user.province;
    response.birthplace = user.birthplace;
    response.bio = user.bio;
  }

  if (includeReviewMetadata) {
    response.verificationSubmittedAt = user.verificationSubmittedAt;
    response.verificationReviewedAt = user.verificationReviewedAt;
    response.verificationNotes = user.verificationNotes;
    response.verificationReviewedBy = user.verificationReviewedBy;
  }

  if (includeVerificationDocuments) {
    response.citizenshipNumber = user.citizenshipNumber;
    response.hasCitizenshipFrontPhoto = Boolean(user.citizenshipFrontPhoto);
    response.hasCitizenshipBackPhoto = Boolean(user.citizenshipBackPhoto);
    response.hasVerificationSelfiePhoto = Boolean(user.verificationSelfiePhoto);
  }

  return response;
}

function validateVerificationImage(fieldLabel, value, { required = true } = {}) {
  const trimmedValue = typeof value === "string" ? value.trim() : "";

  if (!trimmedValue) {
    if (!required) {
      return { ok: true, value: "" };
    }

    return {
      ok: false,
      message: `${fieldLabel} is required`,
    };
  }

  const parsedDataUrl = parseDataUrl(trimmedValue);

  if (!parsedDataUrl) {
    return {
      ok: false,
      message: `${fieldLabel} must be uploaded as a supported image file`,
    };
  }

  const mimeType = parsedDataUrl.mimeType;

  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    return {
      ok: false,
      message: `${fieldLabel} must be a JPG, PNG, or WEBP image`,
    };
  }

  let sizeInBytes = 0;

  try {
    sizeInBytes = Buffer.from(parsedDataUrl.base64, "base64").length;
  } catch (error) {
    return {
      ok: false,
      message: `${fieldLabel} could not be processed as a valid image`,
    };
  }

  if (sizeInBytes > MAX_VERIFICATION_IMAGE_BYTES) {
    return {
      ok: false,
      message: `${fieldLabel} must be 5 MB or smaller`,
    };
  }

  return {
    ok: true,
    value: trimmedValue,
  };
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!email?.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: "user",
      verificationStatus: "unverified",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: buildUserResponse(user, {
        includeEmail: true,
        includePrivateProfile: true,
      }),
    });
  } catch (error) {
    res.status(500).json({
      message: "Register failed",
      error: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        verificationStatus: user.verificationStatus,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: buildUserResponse(user, {
        includeEmail: true,
        includePrivateProfile: true,
        includeReviewMetadata: true,
      }),
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: buildUserResponse(user, {
        includeEmail: true,
        includePrivateProfile: true,
        includeReviewMetadata: true,
      }),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
});

router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "username",
      "phone",
      "district",
      "province",
      "birthplace",
      "bio",
      "profilePhoto",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: buildUserResponse(user, {
        includeEmail: true,
        includePrivateProfile: true,
        includeReviewMetadata: true,
      }),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
});

router.post("/verification/submit", authMiddleware, async (req, res) => {
  try {
    const {
      citizenshipNumber,
      citizenshipFrontPhoto,
      citizenshipBackPhoto,
      verificationSelfiePhoto,
      district,
      province,
    } = req.body;

    if (!citizenshipNumber?.trim()) {
      return res.status(400).json({
        message: "Citizenship number is required",
      });
    }

    const frontPhoto = validateVerificationImage(
      "Citizenship front photo",
      citizenshipFrontPhoto
    );
    if (!frontPhoto.ok) {
      return res.status(400).json({ message: frontPhoto.message });
    }

    const backPhoto = validateVerificationImage(
      "Citizenship back photo",
      citizenshipBackPhoto
    );
    if (!backPhoto.ok) {
      return res.status(400).json({ message: backPhoto.message });
    }

    const selfiePhoto = validateVerificationImage(
      "Verification selfie",
      verificationSelfiePhoto,
      { required: false }
    );
    if (!selfiePhoto.ok) {
      return res.status(400).json({ message: selfiePhoto.message });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        citizenshipNumber: citizenshipNumber.trim(),
        district: district?.trim() || "",
        province: province?.trim() || "",
        verificationStatus: "pending",
        verificationSubmittedAt: new Date(),
        verificationReviewedAt: null,
        verificationNotes: "",
        verificationReviewedBy: null,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const nextFrontPhoto = saveVerificationImageFromDataUrl({
      userId: user._id,
      documentKey: "front",
      dataUrl: frontPhoto.value,
    });
    const nextBackPhoto = saveVerificationImageFromDataUrl({
      userId: user._id,
      documentKey: "back",
      dataUrl: backPhoto.value,
    });
    const nextSelfiePhoto = selfiePhoto.value
      ? saveVerificationImageFromDataUrl({
          userId: user._id,
          documentKey: "selfie",
          dataUrl: selfiePhoto.value,
        })
      : "";

    deleteStoredFile(user.citizenshipFrontPhoto);
    deleteStoredFile(user.citizenshipBackPhoto);
    deleteStoredFile(user.verificationSelfiePhoto);

    user.citizenshipFrontPhoto = nextFrontPhoto;
    user.citizenshipBackPhoto = nextBackPhoto;
    user.verificationSelfiePhoto = nextSelfiePhoto;

    await user.save();

    res.json({
      message: "Verification submitted successfully",
      user: buildUserResponse(user, {
        includeEmail: true,
        includePrivateProfile: true,
        includeReviewMetadata: true,
      }),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit verification",
      error: error.message,
    });
  }
});

router.put("/users/:userId/review-verification", authMiddleware, async (req, res) => {
  try {
    if (!canReviewVerification(req.user.role)) {
      return res.status(403).json({ message: "Verification reviewer access only" });
    }

    const { verificationStatus, verificationNotes } = req.body;

    if (!["verified", "rejected", "pending"].includes(verificationStatus)) {
      return res.status(400).json({
        message: "verificationStatus must be verified, rejected, or pending",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        verificationStatus,
        verificationNotes: verificationNotes?.trim() || "",
        verificationReviewedAt: new Date(),
        verificationReviewedBy: req.user.id,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Verification reviewed successfully",
      user: buildUserResponse(user, {
        includeEmail: true,
        includePrivateProfile: true,
        includeReviewMetadata: true,
      }),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to review verification",
      error: error.message,
    });
  }
});

// admin can view all users
router.get("/users", authMiddleware, async (req, res) => {
  try {
    if (!canReviewVerification(req.user.role)) {
      return res.status(403).json({ message: "Verification reviewer access only" });
    }

    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(
      users.map((user) =>
        buildUserResponse(user, {
          includeEmail: true,
        })
      )
    );
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
});

router.get("/users/:userId/verification-documents", authMiddleware, async (req, res) => {
  try {
    if (!canReviewVerification(req.user.role)) {
      return res.status(403).json({ message: "Verification reviewer access only" });
    }

    const user = await User.findById(req.params.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: buildUserResponse(user, {
        includeEmail: true,
        includeReviewMetadata: true,
        includeVerificationDocuments: true,
      }),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch verification documents",
      error: error.message,
    });
  }
});

router.get(
  "/users/:userId/verification-documents/:documentType",
  authMiddleware,
  async (req, res) => {
    try {
      if (!canReviewVerification(req.user.role)) {
        return res.status(403).json({ message: "Verification reviewer access only" });
      }

      const user = await User.findById(req.params.userId).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const documentFieldMap = {
        front: user.citizenshipFrontPhoto,
        back: user.citizenshipBackPhoto,
        selfie: user.verificationSelfiePhoto,
      };

      const storedValue = documentFieldMap[req.params.documentType];

      if (!storedValue) {
        return res.status(404).json({ message: "Document not found" });
      }

      const file = readStoredVerificationImage(storedValue);

      if (!file) {
        return res.status(404).json({ message: "Document file is missing" });
      }

      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Cache-Control", "no-store");
      return res.send(file.buffer);
    } catch (error) {
      return res.status(500).json({
        message: "Failed to fetch verification document",
        error: error.message,
      });
    }
  }
);

router.put("/users/:userId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const allowedFields = [
      "name",
      "username",
      "phone",
      "district",
      "province",
      "birthplace",
      "bio",
      "profilePhoto",
      "role",
      "verificationStatus",
      "badges",
      "verificationSubmittedAt",
      "verificationReviewedAt",
      "verificationNotes",
      "verificationReviewedBy",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.params.userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      user: buildUserResponse(user, {
        includeEmail: true,
      }),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update user",
      error: error.message,
    });
  }
});

router.delete("/users/:userId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const user = await User.findByIdAndDelete(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    deleteStoredFile(user.citizenshipFrontPhoto);
    deleteStoredFile(user.citizenshipBackPhoto);
    deleteStoredFile(user.verificationSelfiePhoto);

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete user",
      error: error.message,
    });
  }
});

module.exports = router;
