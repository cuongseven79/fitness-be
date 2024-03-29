const express = require('express');
var dayjs = require('dayjs');
var querystring = require('qs');
var crypto = require('crypto');

const router = express.Router();
const { User, Order } = require('../config/firebase-config');

const handleCreatedPayment = async (req, res) => {
    var ipAddr =
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    var tmnCode = process.env.VNP_TMNCODE;
    var secretKey = process.env.VPN_HASHSECRET;
    var vnpUrl = process.env.VPN_URL;
    var returnUrl = process.env.VPN_RETURN;

    var createdAt = dayjs().format('YYYYMMDDHHmmss');
    var amount = req.body.vndPrice;
    var orderInfo = req.body.name;
    var orderType = 250000;
    var currCode = 'VND';
    var vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = createdAt;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = orderType;
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createdAt;

    vnp_Params = sortObject(vnp_Params);

    var signData = querystring.stringify(vnp_Params, { encode: false });

    var hmac = crypto.createHmac('sha512', secretKey);
    var signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    res.status(200).json({
        url: vnpUrl,
    });
};

const handleGetPaymentResult = async (req, res) => {
    const { vnp_OrderInfo, vnp_TxnRef, vnp_PayDate, vnp_Amount, userId, userName } = req.query;
    const payDate = dayjs(vnp_PayDate).format("DD/MM/YYYY");
    const coachExpired = setTimePackage(vnp_OrderInfo);
    delete req.query.userId;
    delete req.query.userName;
    const orderItem = {
        create_at: payDate,
        date: payDate,
        user_id: userId,
        order_id: vnp_TxnRef,
        paid_money: parseInt(vnp_Amount) / 100,
        service_type: vnp_OrderInfo,
        coach_expired: coachExpired,
        displayName: userName,
    };
    var vnp_Params = req.query;
    var secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    var secretKey = process.env.VPN_HASHSECRET;
    var signData = querystring.stringify(vnp_Params, { encode: false });
    var hmac = crypto.createHmac('sha512', secretKey);
    var signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
        var rspCode = vnp_Params['vnp_ResponseCode'];
        //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
        updatedRole(userId);
        checkDuplicateOrderId(Order, orderItem, rspCode, res);
    }
};

function sortObject(obj) {
    const sorted = {};
    const str = [];
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (let key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
}

async function updatedRole(userId) {
    const userRef = User.doc(userId);
    const userRole = (await userRef.get()).data().role;
    if (userRole === 'customer') {
        userRef.update({
            role: 'pt',
        });
        console.log('Role updated to pt');
    } else {
        console.log('Role is not customer');
    }
}

async function checkDuplicateOrderId(Orders, orderItem, rspCode, res) {
    const snapshot = await Orders.where('order_id', '==', orderItem.order_id).get();
    const userDoc = User.doc(orderItem.user_id);
    const userSnap = await userDoc.get();

    if (userSnap.exists && userSnap.data().coachesId) {
        res.status(200).json({
            RspCode: '97',
            Message: 'You are booking PT.',
        });
    }
    else {
        if (snapshot.empty) {
            const newOrders = Orders.doc();
            await newOrders.set(orderItem);
            res.status(200).json({
                RspCode: rspCode,
                Message: 'Success.',
            });
        } else if (snapshot) {
            // orderId is existed
            res.status(200).json({
                RspCode: '99',
                Message: 'orderId is duplicated.',
            });
        }
        else {
            res.status(200).json({ RspCode: rspCode, Message: 'Failed.' });
        }
    }
}

function setTimePackage(orderInfo) {
    let coachExpired;
    switch (orderInfo) {
        case "Silver Package":
            coachExpired = 180;
            break;
        case "Gold Package":
            coachExpired = 270;
            break;
        case "Platinum Package":
            coachExpired = 365;
            break;
        default:
            throw new Error(`Invalid order info: ${orderInfo}`);
    }
    return coachExpired;
}

router.post('/create-payment-url', handleCreatedPayment);
router.get('/vnpay-ipn', handleGetPaymentResult);

module.exports = router;
