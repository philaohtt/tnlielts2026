import { db } from "../core/firebase";
import { 
    collection, doc, setDoc, serverTimestamp, getDocs, query, orderBy, getDoc, updateDoc,
    FieldValue
} from "firebase/firestore";

const ATTEMPTS_COL = 'attempts';

function sanitizeIdPart(v: any) {
    return String(v || 'unknown').trim().replace(/[^a-zA-Z0-9]/g, '_');
}

async function generateAttemptId(scheduleId: string, candidateId: string, mode: 'reuse_if_in_progress' | 'new' = 'reuse_if_in_progress') {
    const sch = sanitizeIdPart(scheduleId);
    const cand = sanitizeIdPart(candidateId);
    const baseId = `att_${sch}_${cand}`;

    const baseRef = doc(db, ATTEMPTS_COL, baseId);
    const baseSnap = await getDoc(baseRef);
    if (!baseSnap.exists()) return baseId;

    if (mode === 'reuse_if_in_progress') {
        const status = String(baseSnap.data()?.status || '').toLowerCase();
        if (status === 'in_progress') return baseId;
    }

    const pad2 = (n: number) => String(n).padStart(2, '0');
    for (let i = 2; i <= 99; i++) {
        const tryId = `${baseId}_${pad2(i)}`;
        const trySnap = await getDoc(doc(db, ATTEMPTS_COL, tryId));
        if (!trySnap.exists()) return tryId;
    }

    throw new Error('Too many attempts for this candidate in this session. Please adjust policy.');
}

export async function createAttempt(payload: any = {}) {
    try {
        if (!payload.scheduleId) throw new Error('scheduleId is required');
        if (!payload.candidateId) throw new Error('candidateId is required');

        const attemptId =
            payload.attemptId ||
            await generateAttemptId(payload.scheduleId, payload.candidateId, 'reuse_if_in_progress');

        const attemptData = {
            attemptId,
            candidateId: payload.candidateId || null,
            scheduleId: payload.scheduleId || null,
            examId: payload.examId || null,
            testerId: payload.testerId || null,
            candidateName: payload.candidateName || null,
            status: payload.status || 'in_progress',
            startedAt: payload.startedAt || serverTimestamp(),
            submittedAt: payload.submittedAt || null,
            updatedAt: serverTimestamp()
        };

        await setDoc(doc(db, ATTEMPTS_COL, attemptId), attemptData, { merge: true });

        return { id: attemptId, attemptId };
    } catch (e) {
        console.error('Error creating attempt:', e);
        throw e;
    }
}

export async function upsertAttemptProgress(payload: any = {}) {
    const attemptId = payload.attemptId;
    if (!attemptId) throw new Error('attemptId is required');
    try {
        const attemptData = {
            candidateId: payload.candidateId || null,
            scheduleId: payload.scheduleId || null,
            examId: payload.examId || null,
            testerId: payload.testerId || null,
            candidateName: payload.candidateName || null,
            status: payload.status || 'in_progress',
            updatedAt: serverTimestamp()
        };
        await setDoc(doc(db, ATTEMPTS_COL, attemptId), attemptData, { merge: true });
        return { id: attemptId };
    } catch (e) {
        console.error('Error upserting attempt progress:', e);
        throw e;
    }
}

function normalizeSkill(skill: string) {
    return String(skill || '').trim().toLowerCase();
}

function skillDocRef(attemptId: string, skill: string) {
    const s = normalizeSkill(skill);
    if (!['listening', 'reading', 'writing', 'speaking'].includes(s)) {
        throw new Error(`Invalid skill: ${skill}`);
    }
    return doc(db, ATTEMPTS_COL, attemptId, 'skills', s);
}

export async function upsertAttemptSkill(attemptId: string, skill: string, payload: any = {}) {
    if (!attemptId) throw new Error('attemptId is required');
    const s = normalizeSkill(skill);

    const data = {
        skill: s,
        testId: payload.testId || null,
        answers: payload.answers || {},
        autoscore: payload.autoscore || null,
        manual: payload.manual || null,
        updatedAt: serverTimestamp()
    };

    await setDoc(skillDocRef(attemptId, s), data, { merge: true });
    await setDoc(doc(db, ATTEMPTS_COL, attemptId), {
        skillFlags: { [s]: true },
        updatedAt: serverTimestamp()
    }, { merge: true });
    return { ok: true };
}

export async function getAttemptSkillDoc(attemptId: string, skill: string) {
    if (!attemptId) throw new Error('attemptId is required');
    const s = normalizeSkill(skill);

    const snap = await getDoc(skillDocRef(attemptId, s));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

export async function hasSkill(attemptId: string, skill: string) {
    const docData = await getAttemptSkillDoc(attemptId, skill);
    return !!docData;
}

export async function getAttemptSkill(attemptId: string, skill: string) {
    return await getAttemptSkillDoc(attemptId, skill);
}

export async function listAttempts(filters: any = {}) {
    try {
        const q = query(collection(db, ATTEMPTS_COL), orderBy('submittedAt', 'desc'));
        const snapshot = await getDocs(q);
        let results = snapshot.docs.map(d => ({ id: d.id, attemptId: d.id, ...d.data() }));

        const { status, examId, scheduleId, skill } = filters || {};
        if (status) {
            const s = String(status).toLowerCase();
            results = results.filter((a: any) => String(a.status || '').toLowerCase() === s);
        }
        if (examId) {
            results = results.filter((a: any) => String(a.examId || '') === String(examId));
        }
        if (scheduleId) {
            results = results.filter((a: any) => String(a.scheduleId || '') === String(scheduleId));
        }
        if (skill) {
            const s = String(skill).toLowerCase();
            results = results.filter((a: any) => a.skillFlags && a.skillFlags[s]);
        }

        return results;
    } catch (e) {
        console.error('Error listing attempts:', e);
        throw e;
    }
}

export async function getAttemptById(attemptId: string) {
    if (!attemptId) throw new Error('attemptId is required');
    try {
        const snap = await getDoc(doc(db, ATTEMPTS_COL, attemptId));
        if (!snap.exists()) return null;

        const attempt: any = { id: snap.id, attemptId: snap.id, ...snap.data() };

        const skillsSnap = await getDocs(collection(db, ATTEMPTS_COL, attemptId, 'skills'));
        const skills: any = {};
        skillsSnap.forEach(d => {
            const s = d.id;
            skills[s] = d.data();
        });

        attempt.skills = skills;
        return attempt;
    } catch (e) {
        console.error('Error loading attempt:', e);
        throw e;
    }
}

export async function updateAttempt(attemptId: string, patchObj: any = {}) {
    if (!attemptId) throw new Error('attemptId is required');
    try {
        const cleanPatch = { ...patchObj, updatedAt: serverTimestamp() };
        Object.keys(cleanPatch).forEach(key => cleanPatch[key] === undefined && delete cleanPatch[key]);
        await updateDoc(doc(db, ATTEMPTS_COL, attemptId), cleanPatch);
    } catch (e) {
        console.error('Error updating attempt:', e);
        throw e;
    }
}

export async function saveAutoScore(attemptId: string, autoScorePayload: any) {
  if (!attemptId) throw new Error('attemptId is required');
  if (!autoScorePayload || !autoScorePayload.skill) {
    throw new Error('autoScorePayload must contain skill property');
  }

  const s = String(autoScorePayload.skill).toLowerCase();
  await upsertAttemptSkill(attemptId, s, { autoscore: autoScorePayload });
  return { ok: true };
}
