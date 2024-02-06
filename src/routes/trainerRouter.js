const admin = require('firebase-admin');
const express = require('express');
const router = express.Router();
const { User } = require('../config/firebase-config');

async function handleGetAllTrainer(req, res) {
		try {
			const usersSnapshot = await User.get();
			const usersData = usersSnapshot.docs.map((doc) => {
				const { password, ...userWithoutPassword } = doc.data();
				return {
					id: doc.id,
					...userWithoutPassword,
				};
			});
			const allTrainers = usersData.filter((user) => user.role === "pt" && user.trainerStatus == true);
			return res.status(200).json({statusCode: 200, trainers: allTrainers });
		} catch (error) {
			console.error("Error fetching trainers:", error);
			res.status(500).send("Error fetching trainers");
		}
	}
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
            const { password,rating,price,coachesId, ...restCoach } = coachRef.data();
            return restCoach;
        }));

        return res.status(200).json({ message: "get Coaches successfully", statusCode:200, coachesData: coachesData });
    } catch (error) {
        console.error("Error fetching coaches:", error);
        res.status(500).send("Error fetching coaches");
    }
}

	router.get('/', handleGetMyCoaches);
	router.get('/', handleGetAllTrainer);
	module.exports = router;