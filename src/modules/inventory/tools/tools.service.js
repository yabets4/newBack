import ToolsModel from './tools.model.js';

const ToolsService = {
    createTool: async (data) => {
        return await ToolsModel.create(data);
    },

    getAllTools: async (company_id) => {
        return await ToolsModel.findAll(company_id);
    },

    getToolById: async (company_id, id) => {
        return await ToolsModel.findById(company_id, id);
    },

    updateTool: async (company_id, id, data) => {
        return await ToolsModel.update(company_id, id, data);
    },

    deleteTool: async (company_id, id) => {
        return await ToolsModel.remove(company_id, id);
    }
};

export default ToolsService;
