const jwt = require("jsonwebtoken");

function checkAuth(req, res, next) {
    const authToken = req.cookies.authToken;
    const refreshToken = req.cookies.refreshToken;

    if(!authToken || !refreshToken) {
        console.log('Missing tokens:', { authToken, refreshToken });
        return res.status(401).json({message: "Unauthorized"});
    }

    jwt.verify(authToken, process.env.JWT_SECRET_KEY, (err, decoded) => {
       if(err) {
        console.log('Auth token verification failed:', err);
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY, (refreshErr, refreshDecoded) => {
            if(refreshErr) {
                return res.status(401).json({message: "Unauthorized"});
            } else {
                console.log('Refresh token valid, generating new tokens');
                const newAuthToken = jwt.sign({ userId: refreshDecoded.userId }, process.env.JWT_SECRET_KEY,{ expiresIn: "1d" });
                const newRefreshToken = jwt.sign({ userId: refreshDecoded.userId }, process.env.JWT_REFRESH_SECRET_KEY, {expiresIn: "10d"});

                const isProduction = process.env.NODE_ENV === 'production';

                res.cookie("authToken", newAuthToken, {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: "none"
                });

                res.cookie('refreshToken', newRefreshToken, {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: "none"
                });

                req.userId = refreshDecoded.userId;
                req.ok = true;
                req.message = "Authorized";
                next();
            }

        })
       } 
       else {
        req.userId = decoded.userId;
        req.ok = true;
        req.message = "Authorized";
        next();
       }
    })
}

module.exports = checkAuth;
