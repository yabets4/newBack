import express from 'express';
import { DepartmentController } from './department.controller.js';

const router = express.Router({ mergeParams: true });

// Departments
router.post('/', DepartmentController.create);
router.get('/', DepartmentController.list);
router.get('/:departmentId', DepartmentController.get);
router.put('/:departmentId', DepartmentController.update);
router.delete('/:departmentId', DepartmentController.remove);

// Jobs nested under department
router.post('/:departmentId/jobs', DepartmentController.createJob);
router.get('/:departmentId/jobs', DepartmentController.listJobs);
router.get('/:departmentId/jobs/:jobId', DepartmentController.getJob);
router.put('/:departmentId/jobs/:jobId', DepartmentController.updateJob);
router.delete('/:departmentId/jobs/:jobId', DepartmentController.removeJob);

export default router;
