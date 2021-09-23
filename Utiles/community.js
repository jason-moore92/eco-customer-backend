

const axios = require("./axios_init");
var crypto = require('crypto');
const jwt = require("jsonwebtoken");
const { convertEmailUnique } = require("./helpers");
const AppUser = require("../model/AppUser");


const extractPayload = (user, nonce) => {
    let uniqueEmail = convertEmailUnique(user);
    let data = {
        nonce: nonce,
        email: uniqueEmail,
        username: user.email,
        external_id: user._id.toString(),
        name: `${user.firstName} ${user.lastName}`,
        id: user._id.toString(),
        groups: "customer"

    };

    return data;
}

const signPayload = (payload) => {
    payload = new URLSearchParams(payload).toString();
    payload = Buffer.from(payload).toString('base64');
    const hmac = crypto.createHmac('sha256', process.env.COMMUNITY_SSO_KEY);
    hmac.update(payload);
    let signature = hmac.digest('hex');
    return { payload, signature };
}


const getLoginUrl = async (user, queryParams) => {
    const hmac = crypto.createHmac('sha256', process.env.COMMUNITY_SSO_KEY);
    hmac.update(queryParams.sso);
    let generatedSignature = hmac.digest('hex');
    if (generatedSignature != queryParams.sig) {
        throw Error("Community signature doesnt match while login");
    }

    let ssoPayload = Buffer.from(queryParams.sso, 'base64').toString('ascii');
    let payloadParams = new URLSearchParams(ssoPayload);
    let payloadData = {
        "nonce": payloadParams.get('nonce'),
        "return_sso_url": payloadParams.get('return_sso_url')
    }

    let payload = extractPayload(user, payloadData.nonce);
    let singedReq = signPayload(payload);
    return `${process.env.COMMUNITY_BASE_URL}/session/sso_login?sso=${singedReq.payload}&sig=${singedReq.signature}`
}

/**
 * With HashHMAC process we are not using this.
 */
const getLoginUrlJWT = async (user) => {
    let payload = extractPayload(user);

    let communityToken = jwt.sign(payload, process.env.COMMUNITY_SSO_KEY, {
        expiresIn: process.env.COMMUNITY_SSO_EXPIRES_IN || 86400,
    });

    return {
        "token": communityToken,
        "login_url": `${process.env.COMMUNITY_BASE_URL}/auth/jwt/callback?jwt=${communityToken}`
    };
}

const commonHeaders = {
    'Api-Key': process.env.COMMUNITY_API_SECRET,
    'Api-Username': process.env.COMMUNITY_API_USER
}


const syncUser = async (user) => {
    let payload = extractPayload(user);

    let signedReq = signPayload(payload);

    let response = await axios.post(`${process.env.COMMUNITY_BASE_URL}/admin/users/sync_sso`, {
        sso: signedReq.payload,
        sig: signedReq.signature
    },
        {
            headers: commonHeaders
        }
    );

    if (response.status != 200) {
        console.log(response);
    }

    let responseData = response.data;

    await AppUser.findByIdAndUpdate(user._id, {
        community: {
            id: responseData.id
        }
    })

    return responseData;

}


const getAppScopes = (user) => {
    let username = user.email;
    let external_id = user._id.toString();
    let provider = "jwt";
    return [
        {
            "scope_id": "topics:write",
            "key": "write",
            "name": "write",
            "params": [
                "topic_id"
            ],
            "urls": [
                "/posts (POST)"
            ],
            "selected": true
        },
        {
            "scope_id": "topics:read",
            "key": "read",
            "name": "read",
            "params": [
                "topic_id"
            ],
            "urls": [
                "/t/:id (GET)",
                "/t/:slug/:topic_id/print (GET)",
                "/t/:slug/:topic_id/summary (GET)",
                "/t/:topic_id/summary (GET)",
                "/t/:topic_id/:post_number (GET)",
                "/t/:topic_id/last (GET)",
                "/t/:slug/:topic_id.rss (GET)",
                "/t/:slug/:topic_id (GET)",
                "/t/:slug/:topic_id/:post_number (GET)",
                "/t/:slug/:topic_id/last (GET)",
                "/t/:topic_id/posts (GET)"
            ],
            "selected": true
        },
        {
            "scope_id": "topics:read_lists",
            "key": "read_lists",
            "name": "read lists",
            "params": [
                "category_id"
            ],
            "urls": [
                "/c/*category_slug_path_with_id.rss (GET)",
                "/c/*category_slug_path_with_id/l/latest (GET)",
                "/c/*category_slug_path_with_id/l/unread (GET)",
                "/c/*category_slug_path_with_id/l/new (GET)",
                "/c/*category_slug_path_with_id/l/top (GET)",
                "/latest (GET)",
                "/unread (GET)",
                "/new (GET)",
                "/top (GET)"
            ],
            "selected": true
        },
        {
            "scope_id": "posts:edit",
            "key": "edit",
            "name": "edit",
            "params": [
                "id"
            ],
            "urls": [
                "/posts/:id (PUT)"
            ],
            "selected": true
        },
        {
            "scope_id": "users:bookmarks",
            "key": "bookmarks",
            "name": "bookmarks",
            "params": [
                "username"
            ],
            "urls": [
                "/users/:username/bookmarks (GET)",
                "/u/:username/bookmarks (GET)"
            ],
            "selected": true,
            "username": username
        },
        {
            "scope_id": "users:show",
            "key": "show",
            "name": "show",
            "params": [
                "username",
                "external_id",
                "external_provider"
            ],
            "urls": [
                "/users/:username.json (GET)",
                "/users/:username (GET)",
                "/users/:username/summary (GET)",
                "/users/:username/activity (GET)",
                "/users/:username/activity/:filter (GET)",
                "/users/:username/notifications (GET)",
                "/users/:username/notifications/:filter (GET)",
                "/users/by-external/:external_id (GET)",
                "/users/by-external/:external_provider/:external_id (GET)",
                "/users/:username/flagged-posts (GET)",
                "/users/:username/deleted-posts (GET)",
                "/u/:username.json (GET)",
                "/u/:username (GET)",
                "/u/:username/summary (GET)",
                "/u/:username/activity (GET)",
                "/u/:username/activity/:filter (GET)",
                "/u/:username/notifications (GET)",
                "/u/:username/notifications/:filter (GET)",
                "/u/by-external/:external_id (GET)",
                "/u/by-external/:external_provider/:external_id (GET)",
                "/u/:username/flagged-posts (GET)",
                "/u/:username/deleted-posts (GET)"
            ],
            "username": username,
            "external_id": external_id,
            "selected": true,
            "external_provider": provider
        },
        {
            "scope_id": "users:check_emails",
            "key": "check_emails",
            "name": "check emails",
            "params": [
                "username"
            ],
            "urls": [
                "/users/:username/emails (GET)",
                "/u/:username/emails (GET)"
            ],
            "selected": true,
            "username": username
        },
        {
            "scope_id": "users:update",
            "key": "update",
            "name": "update",
            "params": [
                "username"
            ],
            "urls": [
                "/users/:username (PUT)",
                "/u/:username (PUT)"
            ],
            "selected": true,
            "username": username
        },
        {
            "scope_id": "users:log_out",
            "key": "log_out",
            "name": "log out",
            "params": null,
            "urls": [
                "/admin/users/:user_id/log_out (POST)"
            ],
            "selected": true
        }
    ];
}



const createAPIToken = async (user) => {
    let username = user.email;

    let userAppScopes = getAppScopes(user);

    let response = await axios.post(`${process.env.COMMUNITY_BASE_URL}/admin/api/keys`, {
        key: {
            "description": `${username}_app_api`,
            "username": username,
            "scopes": userAppScopes
        }
    },
        {
            headers: commonHeaders
        }
    );

    if (response.status != 200) {
        console.log(response);
    }

    let responseData = response.data;

    return responseData;
}

const deleteAPIToken = async (keyId) => {
    let response = await axios.delete(`${process.env.COMMUNITY_BASE_URL}/admin/api/keys/${keyId}`,
        {
            headers: commonHeaders
        },
    );

    if (response.status != 200) {
        console.log(response);
    }

    let responseData = response.data;

    return responseData;
}

module.exports = {
    extractPayload,
    signPayload,
    getLoginUrl,
    syncUser,
    getLoginUrlJWT,
    createAPIToken,
    deleteAPIToken
}