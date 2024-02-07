// !NOT remove this line. call initial configuration
const initialConf = require('./src/config/firebase-config');

const app = require('./src/middleware/middleware');
const PORT = process.env.PORT || 3001;
const profileRouter = require('./src/routes/profileRouter');
const authRouter = require("./src/routes/authRouter");
const homeRouter = require("./src/routes/homeRouter");
const orderRouter = require("./src/routes/orderRouter");
const userRouter = require("./src/routes/userRouter");
const trainerRouter = require("./src/routes/trainerRouter");
const coachRouter = require("./src/routes/coachRouter");
const customerRouter = require("./src/routes/customerRouter");

app.use('/', homeRouter);
app.use('/login', authRouter);
app.use('/signup', authRouter);
app.use('/profile', profileRouter);
app.use('/trainers', trainerRouter);
app.use('/manage-coaches', coachRouter);
app.use('/manage-customers', customerRouter);
app.use('/manage-orders', orderRouter);
app.use('/manage-users', userRouter);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});