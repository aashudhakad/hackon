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
import { quickMode, flashMode, smartShop } from '../controllers/shoppingController';
import { processVision } from '../controllers/visionController';
import { processAudioIntent } from '../controllers/audioIntentController';
import { getSmartBundle, listSmartBundles } from '../controllers/smartBundleController';
import { getCrossSell } from '../controllers/crossSellController';
import { checkout } from '../controllers/checkoutController';
import {
  getHomepageFull,
  getHomepageSmartBundles,
  getPersonalized,
  getTrending,
} from '../controllers/homepageController';

/** Mounts all API routes under /api. */
export const apiRouter = Router();

// Intent understanding + bundle generation
apiRouter.post('/intent', validateBody(intentSchema), asyncHandler(parseIntent));
apiRouter.post('/bundle', validateBody(bundleSchema), asyncHandler(generateBundle));

// Gemini-powered shopping modes (text intent, any language)
apiRouter.post('/quick', validateBody(modeSchema), asyncHandler(quickMode));
apiRouter.post('/flash', validateBody(modeSchema), asyncHandler(flashMode));
// Smart relevance-ranked shopping (categories + relevance/ranking in one flow)
apiRouter.post('/shop', validateBody(modeSchema), asyncHandler(smartShop));

// Multi-modal inputs
apiRouter.post('/vision', imageUpload.single('image'), asyncHandler(processVision));
apiRouter.post('/audio-intent', audioUpload.single('audio'), asyncHandler(processAudioIntent));

// Smart bundles
apiRouter.get('/smart-bundles', asyncHandler(listSmartBundles));
apiRouter.get('/smart-bundles/:id', asyncHandler(getSmartBundle));

// Homepage module (Personalized / Trending / Smart Bundles)
apiRouter.get('/homepage/personalized', asyncHandler(getPersonalized));
apiRouter.get('/homepage/trending', asyncHandler(getTrending));
apiRouter.get('/homepage/smart-bundles', asyncHandler(getHomepageSmartBundles));
apiRouter.get('/homepage/full', asyncHandler(getHomepageFull));

// Cross-sell + checkout
apiRouter.post('/cross-sell', validateBody(crossSellSchema), asyncHandler(getCrossSell));
apiRouter.post('/checkout', validateBody(checkoutSchema), asyncHandler(checkout));
