module.exports = [
"[project]/.next-internal/server/app/api/admin/questions/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[project]/src/lib/cache/question-cache.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getActiveQuestionIds",
    ()=>getActiveQuestionIds,
    "invalidateQuestionCache",
    ()=>invalidateQuestionCache
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript) <locals>");
;
let cache = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL
async function getActiveQuestionIds() {
    const now = Date.now();
    if (cache && now - cache.lastFetched < CACHE_TTL_MS && cache.activeQuestionIds.length >= 50) {
        return cache.activeQuestionIds;
    }
    const questions = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].question.findMany({
        where: {
            isActive: true
        },
        select: {
            id: true
        }
    });
    const ids = questions.map((q)=>q.id);
    cache = {
        activeQuestionIds: ids,
        lastFetched: now
    };
    return ids;
}
function invalidateQuestionCache() {
    cache = null;
}
}),
"[project]/src/lib/services/question.service.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "confirmImportBatch",
    ()=>confirmImportBatch,
    "createCategory",
    ()=>createCategory,
    "createQuestion",
    ()=>createQuestion,
    "deleteCategory",
    ()=>deleteCategory,
    "deleteQuestion",
    ()=>deleteQuestion,
    "deleteQuestions",
    ()=>deleteQuestions,
    "getCategories",
    ()=>getCategories,
    "getDashboardStats",
    ()=>getDashboardStats,
    "getImportBatches",
    ()=>getImportBatches,
    "getQuestionById",
    ()=>getQuestionById,
    "getQuestions",
    ()=>getQuestions,
    "toggleQuestionStatus",
    ()=>toggleQuestionStatus,
    "updateCategory",
    ()=>updateCategory,
    "updateCategoryQuantities",
    ()=>updateCategoryQuantities,
    "updateQuestion",
    ()=>updateQuestion
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cache$2f$question$2d$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/cache/question-cache.ts [app-route] (ecmascript)");
;
;
;
;
async function getQuestions(filters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    const where = {};
    if (filters.search) {
        where.questionText = {
            contains: filters.search,
            mode: 'insensitive'
        };
    }
    if (filters.categoryId) {
        where.categoryId = filters.categoryId;
    }
    if (filters.difficulty) {
        where.difficulty = filters.difficulty;
    }
    if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
    }
    const [total, questions] = await Promise.all([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].question.count({
            where
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].question.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                category: true,
                options: {
                    orderBy: {
                        optionKey: 'asc'
                    }
                }
            }
        })
    ]);
    return {
        questions,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}
async function getQuestionById(id) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].question.findUnique({
        where: {
            id
        },
        include: {
            category: true,
            options: {
                orderBy: {
                    optionKey: 'asc'
                }
            }
        }
    });
}
async function createQuestion(data) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].$transaction(async (tx)=>{
        const question = await tx.question.create({
            data: {
                questionText: data.questionText,
                categoryId: data.categoryId || null,
                difficulty: data.difficulty || __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Difficulty"].MEDIUM,
                isActive: data.isActive !== undefined ? data.isActive : true
            }
        });
        await tx.questionOption.createMany({
            data: data.options.map((opt)=>({
                    questionId: question.id,
                    optionKey: opt.key.toUpperCase(),
                    optionText: opt.text,
                    isCorrect: opt.isCorrect
                }))
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cache$2f$question$2d$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["invalidateQuestionCache"])();
        return question;
    });
}
async function updateQuestion(id, data) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].$transaction(async (tx)=>{
        const question = await tx.question.update({
            where: {
                id
            },
            data: {
                ...data.questionText ? {
                    questionText: data.questionText
                } : {},
                ...data.categoryId !== undefined ? {
                    categoryId: data.categoryId
                } : {},
                ...data.difficulty ? {
                    difficulty: data.difficulty
                } : {},
                ...data.isActive !== undefined ? {
                    isActive: data.isActive
                } : {}
            }
        });
        if (data.options && data.options.length > 0) {
            await tx.questionOption.deleteMany({
                where: {
                    questionId: id
                }
            });
            await tx.questionOption.createMany({
                data: data.options.map((opt)=>({
                        questionId: id,
                        optionKey: opt.key.toUpperCase(),
                        optionText: opt.text,
                        isCorrect: opt.isCorrect
                    }))
            });
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cache$2f$question$2d$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["invalidateQuestionCache"])();
        return question;
    });
}
async function deleteQuestion(id) {
    const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].question.delete({
        where: {
            id
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cache$2f$question$2d$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["invalidateQuestionCache"])();
    return res;
}
async function deleteQuestions(param) {
    let ids;
    let all = false;
    let categoryId;
    let search;
    let isActive;
    if (Array.isArray(param)) {
        ids = param;
    } else {
        ids = param.ids;
        all = !!param.all;
        categoryId = param.categoryId;
        search = param.search;
        isActive = param.isActive;
    }
    const where = {};
    if (!all && ids && ids.length > 0) {
        where.id = {
            in: ids
        };
    } else if (all) {
        if (categoryId) {
            if (categoryId === 'uncategorized') {
                where.categoryId = null;
            } else {
                where.categoryId = categoryId;
            }
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        if (search) {
            where.questionText = {
                contains: search,
                mode: 'insensitive'
            };
        }
    } else {
        return {
            count: 0
        };
    }
    // Find all matching question IDs to cascade delete dependencies
    const matching = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].question.findMany({
        where,
        select: {
            id: true
        }
    });
    const idsToDelete = matching.map((q)=>q.id);
    if (idsToDelete.length === 0) return {
        count: 0
    };
    const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].$transaction(async (tx)=>{
        await tx.assessmentAnswer.deleteMany({
            where: {
                questionId: {
                    in: idsToDelete
                }
            }
        });
        await tx.assessmentQuestion.deleteMany({
            where: {
                questionId: {
                    in: idsToDelete
                }
            }
        });
        await tx.questionOption.deleteMany({
            where: {
                questionId: {
                    in: idsToDelete
                }
            }
        });
        return tx.question.deleteMany({
            where: {
                id: {
                    in: idsToDelete
                }
            }
        });
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cache$2f$question$2d$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["invalidateQuestionCache"])();
    return res;
}
async function toggleQuestionStatus(id) {
    const current = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].question.findUnique({
        where: {
            id
        },
        select: {
            isActive: true
        }
    });
    if (!current) throw new Error('Question not found');
    const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].question.update({
        where: {
            id
        },
        data: {
            isActive: !current.isActive
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cache$2f$question$2d$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["invalidateQuestionCache"])();
    return res;
}
async function getCategories() {
    const categories = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].category.findMany({
        orderBy: {
            name: 'asc'
        },
        include: {
            _count: {
                select: {
                    questions: true
                }
            },
            questions: {
                where: {
                    isActive: true
                },
                select: {
                    id: true
                }
            }
        }
    });
    return categories.map((c)=>({
            id: c.id,
            name: c.name,
            questionQuantity: c.questionQuantity,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            _count: c._count,
            activeQuestionsCount: c.questions.length
        }));
}
async function createCategory(name, questionQuantity) {
    const trimmed = name.trim();
    const qty = typeof questionQuantity === 'number' ? Math.max(0, questionQuantity) : 0;
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].category.upsert({
        where: {
            name: trimmed
        },
        update: {
            ...typeof questionQuantity === 'number' ? {
                questionQuantity: qty
            } : {}
        },
        create: {
            name: trimmed,
            questionQuantity: qty
        }
    });
}
async function updateCategory(id, data) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].category.update({
        where: {
            id
        },
        data: {
            ...data.name ? {
                name: data.name.trim()
            } : {},
            ...typeof data.questionQuantity === 'number' ? {
                questionQuantity: Math.max(0, data.questionQuantity)
            } : {}
        }
    });
}
async function updateCategoryQuantities(quantities) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].$transaction(quantities.map((item)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].category.update({
            where: {
                id: item.id
            },
            data: {
                questionQuantity: Math.max(0, Math.floor(item.questionQuantity))
            }
        })));
}
async function deleteCategory(id) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].category.delete({
        where: {
            id
        }
    });
}
async function confirmImportBatch(params) {
    const validQuestions = params.questions.filter((q)=>q.isValid);
    const batch = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].$transaction(async (tx)=>{
        // 1. Create ImportBatch
        const createdBatch = await tx.importBatch.create({
            data: {
                fileName: params.fileName,
                fileType: params.fileType,
                totalQuestions: params.questions.length,
                validQuestions: validQuestions.length,
                invalidQuestions: params.questions.length - validQuestions.length,
                importedQuestions: validQuestions.length,
                uploadedBy: params.uploadedBy
            }
        });
        // 2. Insert valid questions and their options
        for (const q of validQuestions){
            const createdQuestion = await tx.question.create({
                data: {
                    questionText: q.questionText,
                    categoryId: params.categoryId || null,
                    difficulty: params.difficulty || __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Difficulty"].MEDIUM,
                    isActive: true,
                    sourceFileName: params.fileName,
                    sourceImportId: createdBatch.id
                }
            });
            await tx.questionOption.createMany({
                data: q.options.map((opt)=>({
                        questionId: createdQuestion.id,
                        optionKey: opt.key.toUpperCase(),
                        optionText: opt.text,
                        isCorrect: opt.key.toUpperCase() === q.correctAnswer.toUpperCase()
                    }))
            });
        }
        return createdBatch;
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cache$2f$question$2d$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["invalidateQuestionCache"])();
    return batch;
}
async function getImportBatches() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].importBatch.findMany({
        orderBy: {
            createdAt: 'desc'
        }
    });
}
async function getDashboardStats() {
    const [totalQuestions, activeQuestions, inactiveQuestions, totalUsers, assessmentsStarted, assessmentsCompleted, categories, recentAssessments, completedAggregation] = await Promise.all([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].question.count(),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].question.count({
            where: {
                isActive: true
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].question.count({
            where: {
                isActive: false
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].user.count({
            where: {
                role: 'USER'
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].assessment.count(),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].assessment.count({
            where: {
                status: 'COMPLETED'
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].category.findMany({
            include: {
                _count: {
                    select: {
                        questions: true
                    }
                }
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].assessment.findMany({
            take: 10,
            orderBy: {
                startedAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].assessment.aggregate({
            where: {
                status: 'COMPLETED'
            },
            _avg: {
                score: true,
                percentage: true
            }
        })
    ]);
    const avgScore = completedAggregation._avg.score?.toFixed(1) || '0.0';
    const avgPercentage = completedAggregation._avg.percentage?.toFixed(1) || '0.0';
    return {
        totalQuestions,
        activeQuestions,
        inactiveQuestions,
        totalUsers,
        assessmentsStarted,
        assessmentsCompleted,
        avgScore,
        avgPercentage,
        categories,
        recentAssessments
    };
}
}),
"[project]/src/app/api/admin/questions/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$question$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/services/question.service.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-route] (ecmascript) <export * as z>");
;
;
;
;
;
const createQuestionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    questionText: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, 'Question text must be at least 3 characters'),
    categoryId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional().nullable(),
    difficulty: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'EASY',
        'MEDIUM',
        'HARD'
    ]).default('MEDIUM'),
    isActive: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(true),
    options: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        key: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'A',
            'B',
            'C',
            'D'
        ]),
        text: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Option text is required'),
        isCorrect: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
    })).length(4, 'Exactly 4 options (A, B, C, D) are required')
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
        const categoryId = searchParams.get('categoryId') || undefined;
        const difficulty = searchParams.get('difficulty') || undefined;
        const isActiveParam = searchParams.get('isActive');
        const isActive = isActiveParam !== null && isActiveParam !== undefined && isActiveParam !== '' ? isActiveParam === 'true' : undefined;
        const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$question$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getQuestions"])({
            page,
            limit,
            search,
            categoryId,
            difficulty,
            isActive
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(data);
    } catch (error) {
        console.error('Error fetching questions:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to fetch questions'
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
        const result = createQuestionSchema.safeParse(body);
        if (!result.success) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: result.error.errors[0].message
            }, {
                status: 400
            });
        }
        // Verify exactly one option is marked isCorrect
        const correctCount = result.data.options.filter((o)=>o.isCorrect).length;
        if (correctCount !== 1) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Exactly one option must be marked as correct.'
            }, {
                status: 400
            });
        }
        const created = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$question$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createQuestion"])(result.data);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: created
        }, {
            status: 201
        });
    } catch (error) {
        console.error('Error creating question:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Failed to create question'
        }, {
            status: 500
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
        const { questionIds, all, categoryId, isActive, search } = body;
        if (!all && (!Array.isArray(questionIds) || questionIds.length === 0)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Provide questionIds array or specify all: true'
            }, {
                status: 400
            });
        }
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$question$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["deleteQuestions"])(all ? {
            all: true,
            categoryId: categoryId || undefined,
            isActive,
            search
        } : {
            ids: questionIds
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: `Successfully deleted ${result.count} question(s).`,
            count: result.count
        });
    } catch (error) {
        console.error('Error deleting questions:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Failed to delete questions'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__8829ca2f._.js.map