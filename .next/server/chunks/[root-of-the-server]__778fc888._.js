module.exports = [
"[project]/.next-internal/server/app/api/admin/users/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/auth/session.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearSessionCookie",
    ()=>clearSessionCookie,
    "createSessionToken",
    ()=>createSessionToken,
    "getSessionFromCookies",
    ()=>getSessionFromCookies,
    "getSessionFromRequest",
    ()=>getSessionFromRequest,
    "setSessionCookie",
    ()=>setSessionCookie,
    "verifySessionToken",
    ()=>verifySessionToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$sign$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jose/dist/webapi/jwt/sign.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jose/dist/webapi/jwt/verify.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
;
;
const COOKIE_NAME = 'examination_auth_token';
const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'examination_system_fallback_secret_must_be_32_bytes_long_minimum');
async function createSessionToken(payload) {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$sign$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SignJWT"]({
        ...payload
    }).setProtectedHeader({
        alg: 'HS256'
    }).setIssuedAt().setExpirationTime('7d').sign(JWT_SECRET);
}
async function verifySessionToken(token) {
    try {
        const { payload } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jwtVerify"])(token, JWT_SECRET);
        return {
            userId: payload.userId,
            email: payload.email,
            name: payload.name,
            role: payload.role
        };
    } catch  {
        return null;
    }
}
async function setSessionCookie(payload) {
    const token = await createSessionToken(payload);
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: ("TURBOPACK compile-time value", "development") === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
    });
    return token;
}
async function clearSessionCookie() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.set(COOKIE_NAME, '', {
        httpOnly: true,
        secure: ("TURBOPACK compile-time value", "development") === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0)
    });
    cookieStore.delete(COOKIE_NAME);
}
async function getSessionFromCookies() {
    try {
        const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
        const token = cookieStore.get(COOKIE_NAME)?.value;
        if (!token) return null;
        return await verifySessionToken(token);
    } catch  {
        return null;
    }
}
async function getSessionFromRequest(request) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
        // Check Authorization Bearer header as fallback
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            return await verifySessionToken(authHeader.substring(7));
        }
        return null;
    }
    return await verifySessionToken(token);
}
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client", () => require("@prisma/client"));

module.exports = mod;
}),
"[project]/src/lib/db.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
const globalForPrisma = globalThis;
const db = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]({
    log: ("TURBOPACK compile-time truthy", 1) ? [
        'error',
        'warn'
    ] : "TURBOPACK unreachable"
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = db;
;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/lib/services/user.service.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createCandidateUser",
    ()=>createCandidateUser,
    "deleteUser",
    ()=>deleteUser,
    "deleteUsers",
    ()=>deleteUsers,
    "getUsers",
    ()=>getUsers,
    "toggleUserStatus",
    ()=>toggleUserStatus
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
;
;
async function getUsers(filters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    const where = {};
    if (filters.batchId) {
        where.batchId = filters.batchId;
    }
    if (filters.search) {
        where.OR = [
            {
                name: {
                    contains: filters.search,
                    mode: 'insensitive'
                }
            },
            {
                email: {
                    contains: filters.search,
                    mode: 'insensitive'
                }
            }
        ];
    }
    const [total, users] = await Promise.all([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].user.count({
            where
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].user.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                assessments: {
                    take: 1,
                    orderBy: {
                        startedAt: 'desc'
                    },
                    select: {
                        id: true,
                        status: true,
                        score: true,
                        percentage: true,
                        submittedAt: true
                    }
                },
                batch: {
                    select: {
                        id: true,
                        batchName: true
                    }
                }
            }
        })
    ]);
    return {
        users,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}
async function toggleUserStatus(id) {
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].user.findUnique({
        where: {
            id
        },
        select: {
            isActive: true,
            role: true
        }
    });
    if (!user) throw new Error('User not found');
    if (user.role === 'ADMIN') {
        throw new Error('Cannot deactivate admin account');
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].user.update({
        where: {
            id
        },
        data: {
            isActive: !user.isActive
        }
    });
}
async function deleteUser(id, currentUserId) {
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].user.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            name: true,
            role: true,
            batchId: true
        }
    });
    if (!user) throw new Error('User not found');
    if (currentUserId && id === currentUserId) {
        throw new Error('You cannot delete your own logged-in administrator account');
    }
    if (user.role === 'ADMIN') {
        throw new Error('Administrator accounts cannot be deleted');
    }
    const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].$transaction(async (tx)=>{
        const assessments = await tx.assessment.findMany({
            where: {
                userId: id
            },
            select: {
                id: true
            }
        });
        const assessmentIds = assessments.map((a)=>a.id);
        if (assessmentIds.length > 0) {
            await tx.assessmentAnswer.deleteMany({
                where: {
                    assessmentId: {
                        in: assessmentIds
                    }
                }
            });
            await tx.assessmentQuestion.deleteMany({
                where: {
                    assessmentId: {
                        in: assessmentIds
                    }
                }
            });
            await tx.assessment.deleteMany({
                where: {
                    id: {
                        in: assessmentIds
                    }
                }
            });
        }
        const deleted = await tx.user.delete({
            where: {
                id
            }
        });
        if (user.batchId) {
            await tx.userBatch.update({
                where: {
                    id: user.batchId
                },
                data: {
                    totalCandidates: {
                        decrement: 1
                    }
                }
            }).catch(()=>{});
        }
        return deleted;
    });
    return res;
}
async function deleteUsers(param, currentUserId) {
    let ids;
    let all = false;
    let batchId;
    let search;
    if (Array.isArray(param)) {
        ids = param;
    } else {
        ids = param.ids;
        all = !!param.all;
        batchId = param.batchId;
        search = param.search;
    }
    const where = {
        role: 'USER',
        ...currentUserId ? {
            NOT: {
                id: currentUserId
            }
        } : {}
    };
    if (!all && ids && ids.length > 0) {
        where.id = {
            in: ids
        };
    } else if (all) {
        if (batchId) {
            where.batchId = batchId;
        }
        if (search) {
            where.OR = [
                {
                    name: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                {
                    email: {
                        contains: search,
                        mode: 'insensitive'
                    }
                }
            ];
        }
    } else {
        return {
            count: 0
        };
    }
    const nonAdminUsers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].user.findMany({
        where,
        select: {
            id: true,
            batchId: true
        }
    });
    if (nonAdminUsers.length === 0) {
        return {
            count: 0
        };
    }
    const userIdsToDelete = nonAdminUsers.map((u)=>u.id);
    const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].$transaction(async (tx)=>{
        const assessments = await tx.assessment.findMany({
            where: {
                userId: {
                    in: userIdsToDelete
                }
            },
            select: {
                id: true
            }
        });
        const assessmentIds = assessments.map((a)=>a.id);
        if (assessmentIds.length > 0) {
            await tx.assessmentAnswer.deleteMany({
                where: {
                    assessmentId: {
                        in: assessmentIds
                    }
                }
            });
            await tx.assessmentQuestion.deleteMany({
                where: {
                    assessmentId: {
                        in: assessmentIds
                    }
                }
            });
            await tx.assessment.deleteMany({
                where: {
                    id: {
                        in: assessmentIds
                    }
                }
            });
        }
        const deleted = await tx.user.deleteMany({
            where: {
                id: {
                    in: userIdsToDelete
                }
            }
        });
        const batchCounts = {};
        for (const u of nonAdminUsers){
            if (u.batchId) {
                batchCounts[u.batchId] = (batchCounts[u.batchId] || 0) + 1;
            }
        }
        for (const [bId, count] of Object.entries(batchCounts)){
            await tx.userBatch.update({
                where: {
                    id: bId
                },
                data: {
                    totalCandidates: {
                        decrement: count
                    }
                }
            }).catch(()=>{});
        }
        return deleted;
    });
    return res;
}
async function createCandidateUser(data) {
    const trimmedName = data.name.trim();
    const normalizedEmail = data.email.trim().toLowerCase();
    if (!trimmedName) {
        throw new Error('Candidate name is required.');
    }
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw new Error('A valid candidate email address is required.');
    }
    // Check if user already exists
    const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].user.findUnique({
        where: {
            email: normalizedEmail
        },
        select: {
            id: true,
            email: true
        }
    });
    if (existing) {
        throw new Error(`A user with email "${normalizedEmail}" already exists in the system.`);
    }
    // Determine password
    let plainPassword = data.password?.trim();
    if (!plainPassword) {
        const firstName = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '').split(/\s+/)[0] || 'candidate';
        plainPassword = `${firstName}@123`;
    }
    if (plainPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
    }
    const salt = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].genSalt(10);
    const passwordHash = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(plainPassword, salt);
    // Validate batchId if provided
    let validBatchId = null;
    if (data.batchId && data.batchId !== 'NONE' && data.batchId !== '') {
        const batch = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].userBatch.findUnique({
            where: {
                id: data.batchId
            },
            select: {
                id: true
            }
        });
        if (batch) {
            validBatchId = batch.id;
        }
    }
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].user.create({
        data: {
            name: trimmedName,
            email: normalizedEmail,
            passwordHash,
            role: 'USER',
            isActive: true,
            batchId: validBatchId
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            batch: {
                select: {
                    id: true,
                    batchName: true
                }
            }
        }
    });
    // If assigned to a batch, increment totalCandidates count
    if (validBatchId) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].userBatch.update({
            where: {
                id: validBatchId
            },
            data: {
                totalCandidates: {
                    increment: 1
                }
            }
        });
    }
    return {
        user,
        plainPassword
    };
}
}),
"[project]/src/app/api/admin/users/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/session.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$user$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/services/user.service.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-route] (ecmascript) <export * as z>");
;
;
;
;
;
const createCandidateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Candidate name is required'),
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email('Please enter a valid email address'),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(6, 'Password must be at least 6 characters').optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('')),
    batchId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional().nullable()
});
async function GET(request) {
    try {
        const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSessionFromCookies"])();
        if (!session || session.role !== __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Role"].ADMIN) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized.'
            }, {
                status: 403
            });
        }
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const search = searchParams.get('search') || undefined;
        const batchId = searchParams.get('batchId') || undefined;
        const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$user$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUsers"])({
            page,
            limit,
            search,
            batchId
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(data);
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSessionFromCookies"])();
        if (!session || session.role !== __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Role"].ADMIN) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized.'
            }, {
                status: 403
            });
        }
        const body = await request.json();
        const result = createCandidateSchema.safeParse(body);
        if (!result.success) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: result.error.errors[0]?.message || 'Invalid input data'
            }, {
                status: 400
            });
        }
        const created = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$user$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createCandidateUser"])({
            name: result.data.name,
            email: result.data.email,
            password: result.data.password || undefined,
            batchId: result.data.batchId || null
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: `Candidate ${created.user.name} created successfully.`,
            user: created.user,
            plainPassword: created.plainPassword
        }, {
            status: 201
        });
    } catch (error) {
        console.error('Error creating student user:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Failed to create student'
        }, {
            status: error.message?.includes('already exists') ? 409 : 500
        });
    }
}
async function DELETE(request) {
    try {
        const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSessionFromCookies"])();
        if (!session || session.role !== __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Role"].ADMIN) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized.'
            }, {
                status: 403
            });
        }
        const body = await request.json();
        const { userIds, all, batchId, search } = body;
        if (!all && (!Array.isArray(userIds) || userIds.length === 0)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Provide userIds array or specify all: true'
            }, {
                status: 400
            });
        }
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$user$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["deleteUsers"])(all ? {
            all: true,
            batchId: batchId || undefined,
            search
        } : {
            ids: userIds
        }, session.userId);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: `Successfully deleted ${result.count} user(s).`,
            count: result.count
        });
    } catch (error) {
        console.error('Error bulk deleting users:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Failed to delete users'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__778fc888._.js.map