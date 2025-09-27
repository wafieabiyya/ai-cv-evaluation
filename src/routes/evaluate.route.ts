import { Router } from "express";
import { evaluateHandler } from "@handlers/evaluate.hanlder";
import { resultHandler } from "@handlers/result.handler";
import rateLimit from "express-rate-limit";

export const evaluateRouter = Router();

const evalLimiter = rateLimit({ windowMs: 60_000, max: 10 });
evaluateRouter.post("/evaluate", evalLimiter, evaluateHandler);
evaluateRouter.get("/result/:id", resultHandler);
