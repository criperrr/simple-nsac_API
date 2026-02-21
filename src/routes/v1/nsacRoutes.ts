import { Router } from "express";

import * as nsacController from "../../controllers/nsacController.js";

import { checkBody } from "../../middlewares/checkBody.js";

const router = Router();

router.use("/accounts", checkBody);

router.get("/grades", nsacController.getApiGrades);

export default router;
