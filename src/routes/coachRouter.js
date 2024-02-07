const express = require('express');
const router = express.Router();
const { User } = require('../config/firebase-config');
async function handleGetMyCoaches(req, res) {
    try {
        const { userId } = req.query;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).send("Invalid user ID");
        }
        // Fetch user data
        const userRef = await User.doc(userId).get();
        const { coachesId, ...restUser } = userRef.data();

        // Fetch coaches data
        const coachesData = await Promise.all(coachesId.map(async (coachId) => {
            const coachRef = await User.doc(coachId).get();
            const { password,rating,price,coachesId,customersId, ...restCoach } = coachRef.data();
            return restCoach;
        }));

        return res.status(200).json({ message: "get successfully", statusCode:200, coachesData: coachesData });
    } catch (error) {
        console.error("Error fetching coaches:", error);
        res.status(500).send("Error fetching coaches");
    }
}

router.get('/', handleGetMyCoaches);
module.exports = router;

