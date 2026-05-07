const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwtHelper');
const { success, error } = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return error(res, 'Email already in use', 409);

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
    return error(res, err.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !(await user.comparePassword(password))) {
      return error(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) return error(res, 'Account is deactivated', 403);

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
    return error(res, err.message);
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return error(res, 'Refresh token required', 400);

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return error(res, 'Invalid or expired refresh token', 401);
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return error(res, 'Refresh token mismatch', 401);
    }

    const tokenPayload = { id: user._id, role: user.role };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return success(res, { accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return error(res, err.message);
  }
};

const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return success(res, user);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { register, login, refreshToken, logout, getMe };
