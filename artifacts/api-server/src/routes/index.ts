import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import airlinesRouter from "./airlines";
import flightsRouter from "./flights";
import customersRouter from "./customers";
import bookingsRouter from "./bookings";
import passengersRouter from "./passengers";
import paymentMethodsRouter from "./paymentMethods";
import wishlistRouter from "./wishlist";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";
import dbFeaturesRouter from "./dbFeatures";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(airlinesRouter);
router.use(flightsRouter);
router.use(customersRouter);
router.use(bookingsRouter);
router.use(passengersRouter);
router.use(paymentMethodsRouter);
router.use(wishlistRouter);
router.use(notificationsRouter);
router.use(adminRouter);
router.use(dbFeaturesRouter);

export default router;
