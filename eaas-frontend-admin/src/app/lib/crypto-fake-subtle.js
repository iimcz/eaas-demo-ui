var cryptoSubtle = (window.crypto && crypto.subtle) ||    (window.crypto && crypto.webkitSubtle) ||       (window.msCrypto && window.msCrypto.Subtle);
if (!cryptoSubtle) {
    if(!window.crypto)
        window.crypto = {};

    if(!window.crypto.subtle)
        window.crypto.subtle = {};
}