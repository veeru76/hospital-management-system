const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwtHelper');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw new AppError('Email already in use', 409);

    const user = await User.create({ name, email, password, role, phone });

    const tokenPayload = { id: user._id, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return success(
      res,
      { user: { id: user._id, name: user.name, email: user.email, role: user.role }, accessToken, refreshToken },
      'User registered successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) throw new AppError('Account is deactivated', 403);

    const tokenPayload = { id: user._id, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return success(res, {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError('Refresh token required', 400);

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      throw new AppError('Refresh token mismatch', 401);
    }

    const tokenPayload = { id: user._id, role: user.role };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return success(res, { accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    return success(res, user);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refreshToken, logout, getMe };
