import express from 'express';
import { DepartmentController } from './department.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const router = express.Router({ mergeParams: true });

const canRead = permission(['hr.departments.read.all', 'hr.read.all']);
const canCreate = permission(['hr.departments.create', 'hr.create']);
const canUpdate = permission(['hr.departments.update', 'hr.update']);
const canDelete = permission(['hr.departments.delete', 'hr.delete']);

// Departments
router.post('/', canCreate, DepartmentController.create);
router.get('/', canRead, DepartmentController.list);
router.get('/:departmentId', canRead, DepartmentController.get);
router.put('/:departmentId', canUpdate, DepartmentController.update);
router.delete('/:departmentId', canDelete, DepartmentController.remove);

// Jobs nested under department
router.post('/:departmentId/jobs', canCreate, DepartmentController.createJob);
router.get('/:departmentId/jobs', canRead, DepartmentController.listJobs);
router.get('/:departmentId/jobs/:jobId', canRead, DepartmentController.getJob);
router.put('/:departmentId/jobs/:jobId', canUpdate, DepartmentController.updateJob);
router.delete('/:departmentId/jobs/:jobId', canDelete, DepartmentController.removeJob);

// Job Levels
router.post('/:departmentId/jobs/:jobId/levels', canCreate, DepartmentController.createJobLevel);
router.get('/:departmentId/jobs/:jobId/levels', canRead, DepartmentController.listJobLevels);
router.get('/:departmentId/jobs/:jobId/levels/:levelId', canRead, DepartmentController.getJobLevel);
router.put('/:departmentId/jobs/:jobId/levels/:levelId', canUpdate, DepartmentController.updateJobLevel);
router.delete('/:departmentId/jobs/:jobId/levels/:levelId', canDelete, DepartmentController.removeJobLevel);

export default router;
