const express = require('express');
const router = express.Router();
const { User } = require('../config/firebase-config');

const fetchCustomerData = async (customerId) => {
    const customerRef = await User.doc(customerId).get();
    if (!customerRef.exists) {
        console.error(`No document found for customer ID: ${customerId}`);
        return null;
    }
    const { password, coachesId, customersId, ...restCustomer } = customerRef.data();
    return restCustomer;
}

const handleGetMyCustomer = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).send("Invalid user ID");
        }

        const userRef = await User.doc(userId).get();
        const { customersId, ...restUser } = userRef.data();

        let customersData = [];
        if (Array.isArray(customersId)) {
            customersData = await Promise.all(customersId.map(fetchCustomerData));
            customersData = customersData.filter(Boolean);
        }

        return res.status(200).json({ message: "get my Customer successfully", statusCode:200, customersData: customersData });
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).send("Error fetching customers");
    }
}

router.get('/', handleGetMyCustomer);
module.exports = router;