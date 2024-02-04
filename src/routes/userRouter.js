	const express = require('express');
	const router = express.Router();
	const { User } = require('../config/firebase-config');

	async function handleGetUsers(req, res) {
		try {
			const usersSnapshot = await User.get();
			const usersData = usersSnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));
			const users = usersData.filter((user) => user.role !== "admin");
			return res.status(200).json({statusCode: 200, users: users });
		} catch (error) {
			console.error("Error fetching users:", error);
			res.status(500).send("Error fetching users");
		}
	}

	router.get('/', handleGetUsers);

	module.exports = router;