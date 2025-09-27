import { Router } from "express";
import { evaluateHandler } from "@handlers/evaluate.hanlder";
import { resultHandler } from "@handlers/result.handler";

export const evaluateRouter = Router();
evaluateRouter.post("/evaluate", evaluateHandler);
evaluateRouter.get("/result/:id", resultHandler);
