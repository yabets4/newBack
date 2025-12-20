import ToolsService from './tools.service.js';
import LocationsModel from '../../crm/locations/locations.model.js';
import { EmployeeModel } from '../../hr/employee/employee.model.js';

const ToolsController = {
    create: async (req, res) => {
        try {
            const { companyID } = req.auth; // Use companyID from auth middleware
            let toolData = { ...req.body, company_id: companyID }; // Map to company_id for the service/model

            if (req.file) {
                // Construct relative URL from the file path
                // Assumes 'uploads' is served statically at /uploads
                const relativePath = req.file.path.split('uploads')[1].replace(/\\/g, '/');
                toolData.image_url = `/uploads${relativePath}`;
            }

            // Parse numeric fields if they are strings (from FormData)
            if (toolData.cost) toolData.cost = parseFloat(toolData.cost);

            const tool = await ToolsService.createTool(toolData);
            res.status(201).json(tool);
        } catch (error) {
            console.error('Error creating tool:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    getAll: async (req, res) => {
        try {
            const { companyID } = req.auth; // Use companyID from auth middleware
            const tools = await ToolsService.getAllTools(companyID);
            res.status(200).json(tools);
        } catch (error) {
            console.error('Error fetching tools:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    getById: async (req, res) => {
        try {
            const { companyID } = req.auth; // Use companyID from auth middleware
            const { id } = req.params;
            const tool = await ToolsService.getToolById(companyID, id);
            if (!tool) {
                return res.status(404).json({ message: 'Tool not found' });
            }
            res.status(200).json(tool);
        } catch (error) {
            console.error('Error fetching tool:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    update: async (req, res) => {
        try {
            const { companyID } = req.auth; // Use companyID from auth middleware
            const { id } = req.params;
            let toolData = { ...req.body };

            if (req.file) {
                const relativePath = req.file.path.split('uploads')[1].replace(/\\/g, '/');
                toolData.image_url = `/uploads${relativePath}`;
            }

            if (toolData.cost) toolData.cost = parseFloat(toolData.cost);

            const tool = await ToolsService.updateTool(companyID, id, toolData);
            if (!tool) {
                return res.status(404).json({ message: 'Tool not found' });
            }
            res.status(200).json(tool);
        } catch (error) {
            console.error('Error updating tool:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    delete: async (req, res) => {
        try {
            const { companyID } = req.auth; // Use companyID from auth middleware
            const { id } = req.params;
            const tool = await ToolsService.deleteTool(companyID, id);
            if (!tool) {
                return res.status(404).json({ message: 'Tool not found' });
            }
            res.status(200).json({ message: 'Tool deleted successfully' });
        } catch (error) {
            console.error('Error deleting tool:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
,

    // Return lookup data needed for tools UI: locations and employees for the company
    getData: async (req, res) => {
        try {
            const { companyID } = req.auth;
            const locationsModel = new LocationsModel();
            const locations = await locationsModel.getLocationsByCompany(companyID);
            const employees = await EmployeeModel.findAll(companyID);
            return res.status(200).json({ locations, employees });
        } catch (error) {
            console.error('Error fetching lookup data for tools:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
};

export default ToolsController;
