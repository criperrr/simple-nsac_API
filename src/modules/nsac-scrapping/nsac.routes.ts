import { Router } from "express";

import * as nsacController from "../../controllers/nsacController.js";

import { checkBody } from "../../shared/middlewares/checkBody.js";

const router = Router();

router.use("/accounts", checkBody);

router.get("/grades", nsacController.getNsacGrades);

export default router;
