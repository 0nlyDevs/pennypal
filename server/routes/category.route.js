import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { listCategories, createCategory, updateCategory, removeCategory } from '../controllers/category.controller.js';
import { validateIdParam, validateCategoryCreate, validateCategoryUpdate } from '../middleware/validation/index.js';

const router = Router();

router.use(requireAuth);

router.get('/', listCategories);
router.post('/', validateCategoryCreate, createCategory);
router.put('/:id', validateIdParam('id'), validateCategoryUpdate, updateCategory);
router.delete('/:id', validateIdParam('id'), removeCategory);

export default router;
