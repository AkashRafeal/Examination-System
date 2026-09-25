module.exports = [
"[project]/.next-internal/server/app/api/assessments/status/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[project]/src/lib/services/assessment.service.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EXAM_DURATION_MINUTES",
    ()=>EXAM_DURATION_MINUTES,
    "allowUserRetake",
    ()=>allowUserRetake,
    "autosaveAnswer",
    ()=>autosaveAnswer,
    "getAssessmentForUser",
    ()=>getAssessmentForUser,
    "startOrResumeAssessment",
    ()=>startOrResumeAssessment,
    "submitAssessment",
    ()=>submitAssessment
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
;
const EXAM_DURATION_MINUTES = 60; // Strictly 1 hour (60 minutes)
/**
 * Fisher-Yates array shuffle.
 */ function shuffleArray(array) {
    const arr = [
        ...array
    ];
    for(let i = arr.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [
            arr[j],
            arr[i]
        ];
    }
    return arr;
}
/**
 * Calculates remaining seconds based on server authoritative deadline.
 */ function computeRemainingSeconds(deadlineAt) {
    const diffMs = deadlineAt.getTime() - Date.now();
    return Math.max(0, Math.floor(diffMs / 1000));
}
async function startOrResumeAssessment(userId) {
    // 1. Check for existing assessment
    const existingAssessment = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].assessment.findFirst({
        where: {
            userId
        },
        include: {
            questions: {
                orderBy: {
                    questionOrder: 'asc'
                },
                include: {
                    question: {
                        include: {
                            options: {
                                orderBy: {
                                    optionKey: 'asc'
                                },
                                select: {
                                    optionKey: true,
                                    optionText: true
                                }
                            }
                        }
                    }
                }
            },
            answers: true
        }
    });
    if (existingAssessment) {
        if (existingAssessment.status === __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["AssessmentStatus"].COMPLETED) {
            throw new Error('You have already completed the assessment. Only one attempt is permitted.');
        }
        // Ensure deadline is set
        const dur = existingAssessment.durationMinutes || existingAssessment.totalQuestions || EXAM_DURATION_MINUTES;
        let deadline = existingAssessment.deadlineAt;
        if (!deadline) {
            deadline = new Date(existingAssessment.startedAt.getTime() + dur * 60 * 1000);
        }
        // If deadline has expired while candidate was away, auto-submit immediately
        if (Date.now() >= deadline.getTime()) {
            await submitAssessment(existingAssessment.id, userId, 'time_expired');
            throw new Error(`The ${dur}-minute assessment duration has expired. The exam has been automatically submitted.`);
        }
        // Resume IN_PROGRESS assessment
        const answersMap = {};
        for (const ans of existingAssessment.answers){
            answersMap[ans.questionId] = ans.selectedOption;
        }
        return {
            id: existingAssessment.id,
            status: existingAssessment.status,
            totalQuestions: existingAssessment.totalQuestions,
            attemptedQuestions: Object.keys(answersMap).length,
            startedAt: existingAssessment.startedAt.toISOString(),
            deadlineAt: deadline.toISOString(),
            durationMinutes: existingAssessment.durationMinutes || EXAM_DURATION_MINUTES,
            remainingSeconds: computeRemainingSeconds(deadline),
            submittedAt: existingAssessment.submittedAt?.toISOString() || null,
            questions: existingAssessment.questions.map((aq)=>({
                    id: aq.question.id,
                    questionNumber: aq.questionOrder,
                    questionText: aq.question.questionText,
                    options: aq.question.options.map((opt)=>({
                            key: opt.optionKey,
                            text: opt.optionText
                        }))
                })),
            answers: answersMap
        };
    }
    // 2. No assessment exists: Check if admin has set category question quantities
    const configuredCategories = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].category.findMany({
        where: {
            questionQuantity: {
                gt: 0
            }
        },
        include: {
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
    let selectedQuestionIds = [];
    if (configuredCategories.length > 0) {
        // Validate each configured category has enough active questions
        for (const cat of configuredCategories){
            if (cat.questions.length < cat.questionQuantity) {
                throw new Error(`Category "${cat.name}" requires ${cat.questionQuantity} questions for the assessment, but only ${cat.questions.length} active questions exist in the question bank. Please add more active questions or adjust the category question quantity in the Admin panel.`);
            }
            // Shuffle questions within this category and pick the configured quantity
            const catShuffled = shuffleArray(cat.questions.map((q)=>q.id));
            selectedQuestionIds.push(...catShuffled.slice(0, cat.questionQuantity));
        }
        // Shuffle the final selected question set so candidate sees randomized questions
        selectedQuestionIds = shuffleArray(selectedQuestionIds);
    } else {
        // If no category has a specific quantity configured by admin, prevent starting an unconfigured exam
        throw new Error('The administrator has not yet configured the question quantities for this assessment. Please configure category question distribution in the Admin Categories panel before starting.');
    }
    const totalQuestions = selectedQuestionIds.length;
    // Strictly 1 minute per question
    const durationMinutes = Math.max(1, totalQuestions);
    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
    // 3. Create Assessment and AssessmentQuestion records in an atomic transaction
    const newAssessment = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].$transaction(async (tx)=>{
        const assessment = await tx.assessment.create({
            data: {
                userId,
                status: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["AssessmentStatus"].IN_PROGRESS,
                totalQuestions,
                unanswered: totalQuestions,
                durationMinutes,
                startedAt,
                deadlineAt
            }
        });
        // Create assigned questions with fixed order (1 to totalQuestions)
        await tx.assessmentQuestion.createMany({
            data: selectedQuestionIds.map((qId, idx)=>({
                    assessmentId: assessment.id,
                    questionId: qId,
                    questionOrder: idx + 1
                }))
        });
        return assessment;
    });
    // 4. Return sanitized questions and countdown data for the newly created assessment
    return getAssessmentForUser(newAssessment.id, userId);
}
async function getAssessmentForUser(assessmentId, userId) {
    const assessment = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].assessment.findUnique({
        where: {
            id: assessmentId
        },
        include: {
            questions: {
                orderBy: {
                    questionOrder: 'asc'
                },
                include: {
                    question: {
                        include: {
                            options: {
                                orderBy: {
                                    optionKey: 'asc'
                                },
                                select: {
                                    optionKey: true,
                                    optionText: true
                                }
                            }
                        }
                    }
                }
            },
            answers: true
        }
    });
    if (!assessment) {
        throw new Error('Assessment not found.');
    }
    // Strict IDOR verification
    if (assessment.userId !== userId) {
        throw new Error('Unauthorized: You do not have access to this assessment.');
    }
    if (assessment.status === __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["AssessmentStatus"].COMPLETED) {
        throw new Error('You have already completed the assessment. Only one attempt is permitted.');
    }
    // Authoritative deadline calculation
    const dur = assessment.durationMinutes || assessment.totalQuestions || EXAM_DURATION_MINUTES;
    let deadline = assessment.deadlineAt;
    if (!deadline) {
        deadline = new Date(assessment.startedAt.getTime() + dur * 60 * 1000);
    }
    // Check if deadline has elapsed
    if (Date.now() >= deadline.getTime()) {
        await submitAssessment(assessment.id, userId, 'time_expired');
        throw new Error(`The ${dur}-minute assessment duration has expired. The exam has been automatically submitted.`);
    }
    const answersMap = {};
    for (const ans of assessment.answers){
        answersMap[ans.questionId] = ans.selectedOption;
    }
    return {
        id: assessment.id,
        status: assessment.status,
        totalQuestions: assessment.totalQuestions,
        attemptedQuestions: Object.keys(answersMap).length,
        startedAt: assessment.startedAt.toISOString(),
        deadlineAt: deadline.toISOString(),
        durationMinutes: assessment.durationMinutes || EXAM_DURATION_MINUTES,
        remainingSeconds: computeRemainingSeconds(deadline),
        submittedAt: assessment.submittedAt?.toISOString() || null,
        questions: assessment.questions.map((aq)=>({
                id: aq.question.id,
                questionNumber: aq.questionOrder,
                questionText: aq.question.questionText,
                options: aq.question.options.map((opt)=>({
                        key: opt.optionKey,
                        text: opt.optionText
                    }))
            })),
        answers: answersMap
    };
}
async function autosaveAnswer(assessmentId, userId, questionId, selectedOption) {
    // Validate option is A, B, C, or D
    const validOption = selectedOption.toUpperCase();
    if (![
        'A',
        'B',
        'C',
        'D'
    ].includes(validOption)) {
        throw new Error('Invalid option selected.');
    }
    // 1. Single database check for ownership, status, and deadline
    const assessment = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].assessment.findUnique({
        where: {
            id: assessmentId
        },
        select: {
            userId: true,
            status: true,
            deadlineAt: true,
            startedAt: true,
            durationMinutes: true,
            totalQuestions: true
        }
    });
    if (!assessment) throw new Error('Assessment not found.');
    if (assessment.userId !== userId) throw new Error('Unauthorized assessment access.');
    if (assessment.status !== __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["AssessmentStatus"].IN_PROGRESS) {
        throw new Error('Cannot modify answers for a completed assessment.');
    }
    // 2. Authoritative deadline check with 15-second grace window for in-flight requests
    const dur = assessment.durationMinutes || assessment.totalQuestions || EXAM_DURATION_MINUTES;
    const deadline = assessment.deadlineAt || new Date(assessment.startedAt.getTime() + dur * 60 * 1000);
    if (Date.now() > deadline.getTime() + 15000) {
        await submitAssessment(assessmentId, userId, 'time_expired');
        throw new Error('Exam time has expired. Answers can no longer be modified.');
    }
    // 3. Atomic upsert using composite unique constraint (assessmentId_questionId)
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].assessmentAnswer.upsert({
        where: {
            assessmentId_questionId: {
                assessmentId,
                questionId
            }
        },
        update: {
            selectedOption: validOption,
            answeredAt: new Date()
        },
        create: {
            assessmentId,
            questionId,
            selectedOption: validOption,
            answeredAt: new Date()
        }
    });
    return {
        success: true
    };
}
async function submitAssessment(assessmentId, userId, reason = 'manual') {
    // 1. Lightweight projection: Only fetch correct option keys and student answers
    const assessment = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].assessment.findUnique({
        where: {
            id: assessmentId
        },
        select: {
            id: true,
            userId: true,
            status: true,
            totalQuestions: true,
            questions: {
                select: {
                    questionId: true,
                    question: {
                        select: {
                            options: {
                                where: {
                                    isCorrect: true
                                },
                                select: {
                                    optionKey: true
                                }
                            }
                        }
                    }
                }
            },
            answers: {
                select: {
                    questionId: true,
                    selectedOption: true
                }
            }
        }
    });
    if (!assessment) throw new Error('Assessment not found.');
    if (assessment.userId !== userId) throw new Error('Unauthorized assessment access.');
    if (assessment.status === __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["AssessmentStatus"].COMPLETED) {
        // Idempotent return to prevent duplicate submission errors
        return {
            message: 'Your assessment has already been submitted. Your result will be available to the administrator.'
        };
    }
    // 2. Server-Side Evaluation
    const correctAnswerMap = new Map();
    for (const aq of assessment.questions){
        const correctOpt = aq.question.options[0];
        if (correctOpt) {
            correctAnswerMap.set(aq.questionId, correctOpt.optionKey.toUpperCase());
        }
    }
    const userAnswersMap = new Map();
    for (const ans of assessment.answers){
        userAnswersMap.set(ans.questionId, ans.selectedOption.toUpperCase());
    }
    let correctCount = 0;
    let incorrectCount = 0;
    let attemptedCount = 0;
    for (const [questionId, correctKey] of correctAnswerMap.entries()){
        const userSelected = userAnswersMap.get(questionId);
        if (userSelected) {
            attemptedCount++;
            if (userSelected === correctKey) {
                correctCount++;
            } else {
                incorrectCount++;
            }
        }
    }
    const total = assessment.totalQuestions || 50;
    const unansweredCount = Math.max(0, total - attemptedCount);
    const score = correctCount;
    const percentage = score / total * 100;
    // 3. Execute atomic update with condition to ensure exactly-once submission
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].assessment.update({
        where: {
            id: assessmentId
        },
        data: {
            status: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["AssessmentStatus"].COMPLETED,
            attemptedQuestions: attemptedCount,
            correctAnswers: correctCount,
            incorrectAnswers: incorrectCount,
            unanswered: unansweredCount,
            score,
            percentage,
            submittedAt: new Date(),
            submissionReason: reason
        }
    });
    return {
        message: 'Your assessment has been submitted successfully. Your result will be available to the administrator.'
    };
}
async function allowUserRetake(params) {
    const targetUserIds = new Set(params.userIds || []);
    if (params.assessmentIds && params.assessmentIds.length > 0) {
        const assessments = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].assessment.findMany({
            where: {
                id: {
                    in: params.assessmentIds
                }
            },
            select: {
                userId: true
            }
        });
        for (const a of assessments){
            targetUserIds.add(a.userId);
        }
    }
    const userIdsArray = Array.from(targetUserIds);
    if (userIdsArray.length === 0) {
        return {
            count: 0,
            message: 'No candidate specified for retake.'
        };
    }
    // Find all assessments belonging to these candidates
    const assessmentsToDelete = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].assessment.findMany({
        where: {
            userId: {
                in: userIdsArray
            }
        },
        select: {
            id: true
        }
    });
    if (assessmentsToDelete.length === 0) {
        return {
            count: 0,
            message: 'No existing assessments found for the specified candidates.'
        };
    }
    const assessmentIdsToDelete = assessmentsToDelete.map((a)=>a.id);
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].$transaction(async (tx)=>{
        await tx.assessmentAnswer.deleteMany({
            where: {
                assessmentId: {
                    in: assessmentIdsToDelete
                }
            }
        });
        await tx.assessmentQuestion.deleteMany({
            where: {
                assessmentId: {
                    in: assessmentIdsToDelete
                }
            }
        });
        await tx.assessment.deleteMany({
            where: {
                id: {
                    in: assessmentIdsToDelete
                }
            }
        });
    });
    return {
        count: assessmentIdsToDelete.length,
        usersCount: userIdsArray.length,
        message: `Successfully enabled retake for ${userIdsArray.length} candidate(s).`
    };
}
}),
"[project]/src/app/api/assessments/status/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/session.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$assessment$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/services/assessment.service.ts [app-route] (ecmascript)");
;
;
;
;
async function GET() {
    try {
        const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSessionFromCookies"])();
        if (!session) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized.'
            }, {
                status: 401
            });
        }
        const assessment = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].assessment.findFirst({
            where: {
                userId: session.userId
            },
            select: {
                id: true,
                status: true,
                startedAt: true,
                deadlineAt: true,
                durationMinutes: true,
                submittedAt: true,
                totalQuestions: true,
                attemptedQuestions: true
            }
        });
        // Query admin question configuration across categories
        const configuredCategories = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["db"].category.findMany({
            where: {
                questionQuantity: {
                    gt: 0
                }
            },
            select: {
                id: true,
                name: true,
                questionQuantity: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        const totalConfiguredQuestions = configuredCategories.reduce((acc, c)=>acc + c.questionQuantity, 0);
        const isConfigured = totalConfiguredQuestions > 0;
        if (!assessment) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                status: 'NOT_STARTED',
                hasAttempted: false,
                isConfigured,
                totalQuestions: totalConfiguredQuestions,
                durationMinutes: Math.max(1, totalConfiguredQuestions),
                categories: configuredCategories.map((c)=>({
                        name: c.name,
                        quantity: c.questionQuantity
                    }))
            });
        }
        // Check if in-progress exam has passed its duration deadline
        if (assessment.status === 'IN_PROGRESS') {
            const dur = assessment.durationMinutes || assessment.totalQuestions || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$assessment$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EXAM_DURATION_MINUTES"];
            const deadline = assessment.deadlineAt || new Date(assessment.startedAt.getTime() + dur * 60 * 1000);
            if (Date.now() >= deadline.getTime()) {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$assessment$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["submitAssessment"])(assessment.id, session.userId, 'time_expired');
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    status: 'COMPLETED',
                    hasAttempted: true,
                    attemptUsed: true,
                    isConfigured: true,
                    totalQuestions: assessment.totalQuestions,
                    durationMinutes: dur,
                    assessmentId: assessment.id,
                    submittedAt: new Date().toISOString(),
                    message: `The ${dur}-minute assessment duration has expired. The exam has been automatically submitted.`
                });
            }
        }
        if (assessment.status === 'COMPLETED') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                status: 'COMPLETED',
                hasAttempted: true,
                attemptUsed: true,
                isConfigured: true,
                totalQuestions: assessment.totalQuestions,
                durationMinutes: assessment.durationMinutes || assessment.totalQuestions,
                assessmentId: assessment.id,
                submittedAt: assessment.submittedAt,
                message: 'You have already completed your assessment. Only one attempt is permitted.'
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            status: 'IN_PROGRESS',
            hasAttempted: false,
            isConfigured: true,
            totalQuestions: assessment.totalQuestions,
            durationMinutes: assessment.durationMinutes || assessment.totalQuestions,
            assessmentId: assessment.id,
            startedAt: assessment.startedAt
        });
    } catch (error) {
        console.error('Error checking assessment status:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Failed to check assessment status.'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__2e286ca8._.js.map