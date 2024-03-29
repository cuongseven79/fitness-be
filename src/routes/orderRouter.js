const express = require('express');
const { Order } = require('../config/firebase-config');
const router = express.Router();
const handlePostOrder = async(req,res) => {
    try {
        const { displayName, date, order_id, service_type, start_time, end_time, paid_money} = req.body;
        await Order.doc().set({ displayName, date, order_id, service_type, start_time, end_time, paid_money });
        return res.status(200).json({ message: "Order sent successfully", statusCode: 200 });
    } catch (error) {
      return res.status(500).send({message: error.message})
    }
  }
  const handleGetOrder = async (req, res) => { 
    try {
        const snapshot = await Order.get();
     
        if (snapshot.empty) {
            return res.status(400).json({ statusCode: 400, message: "No Order found" });
        }
        const orders = snapshot.docs.map(doc => {
            const order = doc.data();

            return order;
        });
        return res.status(200).json({statusCode: 200, ordersData: orders });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ statusCode: 500, message: "Internal Server Error" });
    }
}
  
router.get('/', handleGetOrder);
router.post('/manage-orders', handlePostOrder);
module.exports = router;