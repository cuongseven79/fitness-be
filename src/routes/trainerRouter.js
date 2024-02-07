
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
			const allTrainers = usersData.filter((user) => user.role === "pt" && user.trainerStatus);
			return res.status(200).json({statusCode: 200, trainers: allTrainers });
		} catch (error) {
			console.error("Error fetching trainers:", error);
			res.status(500).send("Error fetching trainers");
		}
	}


router.get('/', handleGetAllTrainer);
module.exports = router;