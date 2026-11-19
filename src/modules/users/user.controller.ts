import type { Request, Response } from "express";
import { connectToMongoDB } from "../../config/db.js";

const db = await connectToMongoDB();
const usersCollection = db.collection("user");



export const getAllUsers = async (req: Request, res: Response) => {

    try {
        const users = await usersCollection.find().toArray();
        res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching users",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}