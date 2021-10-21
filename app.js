const customErrors = require('./utils/errors');
const createError = require('http-errors');
const exphbs = require('express-handlebars');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');

const indexRouter = require('./routes/index');

const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200
}));

const hbs = exphbs.create({
    extname: 'hbs',
    layoutsDir: path.join(__dirname, '/views/layouts'),
    defaultView: 'default',
    partialsDir: path.join(__dirname, '/views/partials')
});

// view engine setup
app.set('views', path.join(__dirname, '/views'));
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, '/public')));

app.use(logger('dev'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true, parameterLimit: 50000 }));
app.use(cookieParser());

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    if (err instanceof customErrors.HttpError) {
        res.status(err.statusCode).json(err.data);
    }
    else {
        // render the error page
        res.status(err.status || 500);
        res.render('error');
    }
});

module.exports = app;