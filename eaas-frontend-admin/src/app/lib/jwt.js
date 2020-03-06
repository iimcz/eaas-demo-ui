import {signJWT} from 'webcrypto-jwt';

export async function createJwt(secret)
{
    let claims = {
        exp: Math.floor(Date.now() / 1000) + (60 * 60)
    };

    return new Promise((res, rej) => signJWT(claims, secret, 'HS256', 
        function (err, token) { 
            if (err) rej(err); else res(token);
    }));
}