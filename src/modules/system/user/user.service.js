
import UserModel from './user.model.js';

const userModel = new UserModel();

// --- Users ---
export const getAllUsers = async (limit = 50, offset = 0, companyId = null) => {
    return userModel.findUsers({ limit, offset }, companyId);
};

export const getUserById = async (userId, companyId = null) => {
    return userModel.findUserById(userId, companyId);
};

export const createUser = async (payload, companyId = null) => {
    return userModel.createUser(payload, companyId);
};

export const updateUser = async (userId, payload, companyId = null) => {
    return userModel.updateUser(userId, payload, companyId);
};

export const deleteUser = async (userId, companyId = null) => {
    return userModel.removeUser(userId, companyId);
};
