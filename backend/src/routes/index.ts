import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateBody } from '../middlewares/validate';
import { imageUpload, audioUpload } from '../middlewares/upload';
import {
  bundleSchema,
  checkoutSchema,
  crossSellSchema,
  intentSchema,
  modeSchema,
} from '../controllers/schemas';
import { generateBundle, parseIntent } from '../controllers/intentController';
import { quickMode, flashMode } from '../controllers/shoppingController';
import { processVision } from '../controllers/visionController';
import { processAudioIntent } from '../controllers/audioIntentController';
import { getSmartBundle, listSmartBundles } from '../controllers/smartBundleController';
import { getCrossSell } from '../controllers/crossSellController';
import { checkout } from '../controllers/checkoutController';

/** Mounts all API routes under /api. */
export const apiRouter = Router();

// Intent understanding + bundle generation
apiRouter.post('/intent', validateBody(intentSchema), asyncHandler(parseIntent));
apiRouter.post('/bundle', validateBody(bundleSchema), asyncHandler(generateBundle));

// Gemini-powered shopping modes (text intent, any language)
apiRouter.post('/quick', validateBody(modeSchema), asyncHandler(quickMode));
apiRouter.post('/flash', validateBody(modeSchema), asyncHandler(flashMode));

// Multi-modal inputs
apiRouter.post('/vision', imageUpload.single('image'), asyncHandler(processVision));
apiRouter.post('/audio-intent', audioUpload.single('audio'), asyncHandler(processAudioIntent));

// Smart bundles
apiRouter.get('/smart-bundles', asyncHandler(listSmartBundles));
apiRouter.get('/smart-bundles/:id', asyncHandler(getSmartBundle));

// Cross-sell + checkout
apiRouter.post('/cross-sell', validateBody(crossSellSchema), asyncHandler(getCrossSell));
apiRouter.post('/checkout', validateBody(checkoutSchema), asyncHandler(checkout));
