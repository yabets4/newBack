import ToolAssignmentService from './tool_assignments.service.js';

const ToolAssignmentController = {
    getAll: async (req, res) => {
        try {
            const companyId = req.auth.companyID;
            const assignments = await ToolAssignmentService.getAllToolAssignments(companyId);
            res.status(200).json(assignments);
        } catch (error) {
            console.error('Error fetching tool assignments:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    create: async (req, res) => {
        try {
            const companyId = req.auth.companyID;
            const assignmentData = { ...req.body, companyId };
            const newAssignment = await ToolAssignmentService.createToolAssignment(assignmentData);
            res.status(201).json(newAssignment);
        } catch (error) {
            console.error('Error creating tool assignment:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const companyId = req.auth.companyID;
            const data = { ...req.body, companyId };
            const updated = await ToolAssignmentService.updateToolAssignment(id, data);
            if (!updated) return res.status(404).json({ message: 'Tool assignment not found' });
            res.status(200).json(updated);
        } catch (error) {
            console.error('Error updating tool assignment:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await ToolAssignmentService.deleteToolAssignment(id);
            if (!deleted) return res.status(404).json({ message: 'Tool assignment not found' });
            res.status(200).json({ message: 'Deleted' });
        } catch (error) {
            console.error('Error deleting tool assignment:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },


};

export default ToolAssignmentController;
