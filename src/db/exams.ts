import { db } from "../core/firebase";
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, 
    query, orderBy, serverTimestamp 
} from "firebase/firestore";

const EXAMS_COL = 'exams';
const TESTS_COL = 'tests';

export const EXAMS = {
    async listExams() {
        try {
            const q = query(collection(db, EXAMS_COL), orderBy('updatedAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.error("Error listing exams:", e);
            throw e;
        }
    },

    async createExam({ title, components, rules }: any = {}) {
        try {
            const examData = {
                title: title || 'Untitled Exam',
                status: "draft",
                rules: rules || { 
                    timeLimitMin: null, 
                    attemptsAllowed: null 
                },
                audioPlan: {
                    gapBetweenAudiosSec: 0,
                    extraAfterAudioSec: 600
                },
                components: Array.isArray(components) ? components : [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);

            const allExams = await getDocs(collection(db, EXAMS_COL));
            const idPattern = new RegExp(`^exam_${yy}_(0*[0-9]+)$`);
            
            let sameYearCount = 0;
            allExams.docs.forEach(d => {
                if (typeof d.id === 'string' && idPattern.test(d.id)) {
                    sameYearCount++;
                }
            });

            const seqNum = sameYearCount + 1;
            const seqStr = String(seqNum).padStart(2, '0');
            const examId = `exam_${yy}_${seqStr}`;

            const examRef = doc(db, EXAMS_COL, examId);
            await setDoc(examRef, examData);
            
            return examId;
        } catch (e) {
            console.error("Error creating exam:", e);
            throw e;
        }
    },

    async getExam(examId: string) {
        try {
            const docRef = doc(db, EXAMS_COL, examId);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return null;
            return { id: snap.id, ...snap.data() };
        } catch (e) {
            console.error("Error getting exam:", e);
            throw e;
        }
    },

    async updateExam(examId: string, patch: any) {
        try {
            const docRef = doc(db, EXAMS_COL, examId);
            const data = { 
                ...patch, 
                updatedAt: serverTimestamp() 
            };
            await updateDoc(docRef, data);
            return true;
        } catch (e) {
            console.error("Error updating exam:", e);
            throw e;
        }
    },

    async setExamStatus(examId: string, status: string) {
        const allowed = ['draft', 'published', 'closed'];
        if (!allowed.includes(status)) throw new Error("Invalid status");
        return this.updateExam(examId, { status });
    },

    async deleteExam(examId: string) {
        try {
            const docRef = doc(db, EXAMS_COL, examId);
            await import('firebase/firestore').then(({ deleteDoc }) => deleteDoc(docRef));
            return true;
        } catch (e) {
            console.error("Error deleting exam:", e);
            throw e;
        }
    },

    async duplicateExam(examId: string) {
        try {
            const source = await this.getExam(examId);
            if (!source) throw new Error("Exam not found");
            
            const payload = {
                title: `${source.title} (Copy)`,
                components: source.components || [],
                rules: source.rules || { timeLimitMin: null, attemptsAllowed: null }
            };
            
            return this.createExam(payload);
        } catch (e) {
            console.error("Error duplicating exam:", e);
            throw e;
        }
    },

    validateExam(exam: any) {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!exam || !exam.title || typeof exam.title !== 'string' || !exam.title.trim()) {
            errors.push('Exam must have a non-empty title');
        }

        const components = exam?.components || [];
        if (!Array.isArray(components) || components.length === 0) {
            errors.push('Exam must have at least one component');
        }

        components.forEach((comp: any, idx: number) => {
            const prefix = `Component ${idx + 1}`;

            if (!comp.testId || typeof comp.testId !== 'string' || !comp.testId.trim()) {
                errors.push(`${prefix}: Missing or invalid testId`);
            }

            if (typeof comp.attempts !== 'undefined') {
                const att = parseInt(comp.attempts);
                if (!Number.isFinite(att) || att < 1) {
                    errors.push(`${prefix}: attempts must be a positive number`);
                }
            }

            if (typeof comp.timeLimitMin !== 'undefined') {
                const time = parseInt(comp.timeLimitMin);
                if (!Number.isFinite(time) || time < 1) {
                    errors.push(`${prefix}: timeLimitMin must be a positive number`);
                }
            }

            if (!comp.titleSnapshot && !comp.nameSnapshot) {
                warnings.push(`${prefix}: Missing test title snapshot (may need refresh)`);
            }
            if (!comp.skillSnapshot) {
                warnings.push(`${prefix}: Missing skill snapshot (may need refresh)`);
            }

            if (comp.updatedAtSnapshot && comp.testUpdatedAt) {
                try {
                    const snapTime = new Date(comp.updatedAtSnapshot).getTime();
                    const testTime = new Date(comp.testUpdatedAt).getTime();
                    if (testTime > snapTime) {
                        warnings.push(`${prefix}: Snapshot may be stale (test updated more recently)`);
                    }
                } catch (e) {
                }
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    },

    async refreshComponentSnapshot(examId: string, componentIdOrIndex: number | string) {
        try {
            const examRef = doc(db, EXAMS_COL, examId);
            const examSnap = await getDoc(examRef);
            
            if (!examSnap.exists()) {
                return { success: false, error: 'Exam not found' };
            }

            const examData = examSnap.data();
            const components = examData.components || [];

            let componentIndex = -1;
            if (typeof componentIdOrIndex === 'number') {
                componentIndex = componentIdOrIndex;
            } else {
                componentIndex = components.findIndex((c: any) => c.id === componentIdOrIndex);
            }

            if (componentIndex < 0 || componentIndex >= components.length) {
                return { success: false, error: 'Component not found' };
            }

            const component = components[componentIndex];
            const testId = component.testId;

            if (!testId) {
                return { success: false, error: 'Component has no testId' };
            }

            const testRef = doc(db, TESTS_COL, testId);
            const testSnap = await getDoc(testRef);

            if (!testSnap.exists()) {
                return { success: false, error: 'Linked test not found' };
            }

            const testData = testSnap.data();

            const updatedComponent = {
                ...component,
                titleSnapshot: testData.name || testData.title || 'Untitled Test',
                nameSnapshot: testData.name || testData.title || 'Untitled Test',
                skillSnapshot: testData.skill || 'Listening',
                updatedAtSnapshot: new Date().toISOString(),
                testUpdatedAt: testData.updatedAt?.toDate?.()?.toISOString() || testData.updatedAt || new Date().toISOString()
            };

            const updatedComponents = [...components];
            updatedComponents[componentIndex] = updatedComponent;

            await updateDoc(examRef, {
                components: updatedComponents,
                updatedAt: serverTimestamp()
            });

            return { 
                success: true, 
                updated: updatedComponent 
            };

        } catch (e: any) {
            console.error("Error refreshing component snapshot:", e);
            return { 
                success: false, 
                error: e.message || 'Unknown error' 
            };
        }
    }
};
