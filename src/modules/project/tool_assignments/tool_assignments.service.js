import ToolAssignmentModel from './tool_assignments.model.js';

const ToolAssignmentService = {
    getAllToolAssignments: async (company_id) => {
        return await ToolAssignmentModel.findAll(company_id);
    },

    createToolAssignment: async (data) => {
        return await ToolAssignmentModel.create(data);
    },

    updateToolAssignment: async (id, data) => {
        return await ToolAssignmentModel.update(id, data);
    },

    deleteToolAssignment: async (id) => {
        return await ToolAssignmentModel.delete(id);
    }
};

export default ToolAssignmentService;
