const admin = require('firebase-admin');
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
            const { password, price, ...restCoach } = coachRef.data();
            return {...restCoach, coachId: coachId};
        }));

        return res.status(200).json({ message: "get successfully", statusCode:200, coachesData: coachesData });
    } catch (error) {
        console.error("Error fetching coaches:", error);
        res.status(500).send("Error fetching coaches");
    }
}
async function handleUpdateRating(req, res) {
    const { newRating, coachId, userId } = req.body;

    // Validate request
    if (!newRating || typeof newRating !== 'number') return res.status(400).send("Invalid rating");
    if (!coachId || typeof coachId !== 'string') return res.status(400).send("Invalid coach ID");

    try {
        const coachRef = User.doc(coachId);
        const customerRef = User.doc(userId);
        const coachSnapshot = await coachRef.get();

        if (!coachSnapshot.exists) return res.status(400).send("No document found for coach ID");

        // Add the new rating for coach
        const ratings = coachSnapshot.data().rating || [];
        ratings.push(newRating);

        // Update coach's ratings
        await coachRef.update({ rating: ratings });

        // Remove customerID from customersID list in ROLE COACH
        const customerId = coachSnapshot.get('customersId').filter(id => id === userId);
        if (customerId.length > 0) {
            await coachRef.update({ customersId: admin.firestore.FieldValue.arrayRemove(customerId[0]) });
        }

        // Remove coachID from coachesID list in ROLE CUSTOMER
        await customerRef.update({ coachesId: admin.firestore.FieldValue.arrayRemove(coachId) });

        return res.status(200).json({ message: "Update successful", statusCode: 200 });
    } catch (error) {
        console.error("Error updating rating:", error);
        return res.status(500).send("Error updating rating");
    }
}
//For Manage Coaches 
router.get('/', handleGetMyCoaches);
router.put('/update', handleUpdateRating);
module.exports = router;

