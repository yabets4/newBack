import { Router } from 'express';
import { getBOMs, getBOM, createBOM, updateBOM, deleteBOM } from './bom.controller.js';

const r = Router();

r.get('/', getBOMs);
r.get('/:id', getBOM);
r.post('/', createBOM);
r.put('/:id', updateBOM);
r.delete('/:id', deleteBOM);

export default r;
