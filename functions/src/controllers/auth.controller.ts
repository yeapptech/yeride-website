import { Request, Response } from "express";

export const auth = (req: Request, res: Response) => {
    console.debug(req.body);
}