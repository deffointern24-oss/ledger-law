const User = require('../models/User');

// Add indexes in your User model first
// userSchema.index({ email: 1 });
// userSchema.index({ role: 1 });
// userSchema.index({ createdAt: -1 });

/**
 * Get Current User Profile
 */
const getProfile = async (req, res) => {
  try {
    // Use lean() for 3x faster queries [web:27]
    const user = await User.findById(req.user._id)
      .select('-password -__v') // Exclude sensitive fields
      .lean();

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Update User Profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name,
      email,
      phone,
      business_name,
      gstin,
      address,
      city,
      state,
      pincode,
      password
    } = req.body;

    // Build update object dynamically
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (business_name) updateFields.business_name = business_name;
    if (gstin) updateFields.gstin = gstin;
    if (address) updateFields.address = address;
    if (city) updateFields.city = city;
    if (state) updateFields.state = state;
    if (pincode) updateFields.pincode = pincode;

    // If password update, fetch user and save (to trigger pre-save hook)
    if (password) {
      const user = await User.findById(userId).select('+password');
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      // Update all fields
      Object.assign(user, updateFields);
      user.password = password; // Will be hashed by pre-save hook
      
      const updatedUser = await user.save();

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          business_name: updatedUser.business_name,
          gstin: updatedUser.gstin,
          address: updatedUser.address,
          city: updatedUser.city,
          state: updatedUser.state,
          pincode: updatedUser.pincode,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        }
      });
    }

    // No password update - use atomic operation [web:25]
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No fields to update' 
      });
    }

    updateFields.updatedAt = new Date();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { 
        new: true,
        runValidators: true
      }
    )
    .select('-password -__v')
    .lean();

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already exists' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Get All Users (Admin) with Pagination & Filters
 */
const getAllUsers = async (req, res) => {
  try {
    const { 
      role, 
      search,
      page = 1, 
      limit = 10 
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (role) {
      filter.role = role;
    }

    // Search by name, email, or phone
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { business_name: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination setup
    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit, 10))); // Max 50
    const skip = (pageNumber - 1) * limitNumber;

    // Parallel execution [web:24]
    const [totalUsers, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-password -__v') // Exclude sensitive data
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean()
    ]);

    const totalPages = Math.ceil(totalUsers / limitNumber);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalUsers,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Get User by ID (Admin)
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password -__v')
      .lean();

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Delete User (Admin)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete your own account' 
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  deleteUser
};