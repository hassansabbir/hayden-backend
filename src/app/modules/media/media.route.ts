import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { upload } from '../../middlewares/uploadMiddleware';
import * as mediaController from './media.controller';
import { mediaIdParamSchema, uploadMediaSchema } from './media.validation';

const router = Router();

router.post(
  '/upload',
  auth,
  upload.single('file'),
  validateRequest({ body: uploadMediaSchema }),
  mediaController.uploadMedia
);

router.delete(
  '/:id',
  auth,
  validateRequest({ params: mediaIdParamSchema }),
  mediaController.deleteMedia
);

export const mediaRoutes = router;
