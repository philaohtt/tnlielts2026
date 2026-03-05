import { db } from "../core/firebase";
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
    query, orderBy, where, serverTimestamp, writeBatch, runTransaction 
} from "firebase/firestore";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";

const TESTS_COL = 'tests';
const SECTIONS_SUB = 'sections';
const BLOCKS_SUB = 'blocks';

function safeFileName(name: string) {
    if (!name) return 'file';
    const parts = name.split('.');
    if (parts.length === 1) {
        return parts[0].toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9._-]/g, '');
    }
    const ext = parts.pop();
    const base = parts.join('.');
    const safeBase = base.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9._-]/g, '');
    const safeExt = ext?.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${safeBase}.${safeExt}`;
}

// Debug function to find invalid values
function findInvalidData(data: any, path = ''): string[] {
    const invalidPaths: string[] = [];
    
    if (data === undefined) {
        invalidPaths.push(`${path} is undefined`);
        return invalidPaths;
    }
    
    if (typeof data === 'function' || typeof data === 'symbol') {
        invalidPaths.push(`${path} is ${typeof data}`);
        return invalidPaths;
    }
    
    if (typeof data === 'number' && !Number.isFinite(data)) {
        invalidPaths.push(`${path} is ${data}`);
        return invalidPaths;
    }
    
    if (data === null || typeof data !== 'object') return invalidPaths;
    
    if (data instanceof Date) return invalidPaths;
    
    if (Array.isArray(data)) {
        data.forEach((item, i) => {
            invalidPaths.push(...findInvalidData(item, `${path}[${i}]`));
        });
    } else {
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                invalidPaths.push(...findInvalidData(data[key], `${path}.${key}`));
            }
        }
    }
    
    return invalidPaths;
}

function sanitizeFirestoreData(data: any, seen = new WeakSet()): any {
    if (data === undefined) return undefined;
    if (data === null) return null;
    
    if (typeof data === 'number') return Number.isFinite(data) ? data : null;
    if (typeof data === 'function' || typeof data === 'symbol') return undefined;
    
    if (typeof data !== 'object') return data;
    
    if (data instanceof Date) return data;

    if (seen.has(data)) return null;
    seen.add(data);
    
    if (Array.isArray(data)) {
        return data.map(item => {
            const val = sanitizeFirestoreData(item, seen);
            return val === undefined ? null : val;
        });
    }
    
    const result: any = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const val = sanitizeFirestoreData(data[key], seen);
            if (val !== undefined) {
                result[key] = val;
            }
        }
    }
    return result;
}

function deepClone(obj: any) {
    const invalid = findInvalidData(obj, 'payload');
    if (invalid.length > 0) {
        console.warn('Found invalid Firestore data:', invalid);
    }
    return sanitizeFirestoreData(obj);
}

export const DB = {
    async listTests() {
        try {
            const q = query(collection(db, TESTS_COL), orderBy('updatedAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.error("Error listing tests:", e);
            throw e;
        }
    },

    async createTest(payload: any = {}) {
        try {
            const p = (typeof payload === 'object' && payload !== null) ? payload : {};

            const rawName = p.name;
            const title = p.title;
            const testType = p.testType;
            const rawAudioMode = p.audioMode;
            const totalTimeMin = p.totalTimeMin;
            const totalSections = p.totalSections;
            const rawSkill = p.skill;

            const name = (rawName && String(rawName).trim()) ? String(rawName).trim()
                        : (title && String(title).trim()) ? String(title).trim()
                        : 'Untitled Test';

            const skill = (rawSkill && String(rawSkill).trim()) ? String(rawSkill).trim() : 'Listening';

            const safeSections = Math.max(1, parseInt(totalSections) || 1);

            const sectionsSeed: any[] = [];
            const skillSlug = String(skill).toLowerCase().replace(/\s+/g, '_');
            for (let i = 0; i < safeSections; i++) {
                const sectionId = `sec_${skillSlug}_${i + 1}`;
                sectionsSeed.push({
                    id: sectionId,
                    index: i,
                    title: `Section ${i + 1}`,
                    instructions: ''
                });
            }

            const testData: any = {
                name,
                testType,
                skill,
                totalTimeMin: parseInt(totalTimeMin) || 30,
                totalSections: safeSections,
                status: "draft",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            if (typeof rawAudioMode !== 'undefined') {
                testData.audioMode = rawAudioMode;
            }

            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);

            const skillQuery = query(collection(db, TESTS_COL), where('skill', '==', skill));
            const skillSnap = await getDocs(skillQuery);

            const idPattern = new RegExp(`^test_${skillSlug}_${yy}_(0*[0-9]+)$`);
            let sameYearCount = 0;
            skillSnap.docs.forEach(d => {
                if (typeof d.id === 'string' && idPattern.test(d.id)) sameYearCount++;
            });

            const seqNum = sameYearCount + 1;
            const seqStr = String(seqNum).padStart(2, '0');
            const testId = `test_${skillSlug}_${yy}_${seqStr}`;

            const testRef = doc(db, TESTS_COL, testId);
            await setDoc(testRef, testData);

            const batch = writeBatch(db);
            sectionsSeed.forEach((section) => {
                const sectionRef = doc(db, TESTS_COL, testRef.id, SECTIONS_SUB, section.id);
                batch.set(sectionRef, {
                    index: section.index,
                    title: section.title,
                    instructions: section.instructions,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            });

            await batch.commit();
            return testRef.id;
        } catch (e) {
            console.error("Error creating test:", e);
            throw e;
        }
    },

    async loadTest(testId: string) {
        try {
            const testRef = doc(db, TESTS_COL, testId);
            const testSnap = await getDoc(testRef);
            
            if (!testSnap.exists()) throw new Error("Test not found");

            const testData: any = { id: testSnap.id, ...testSnap.data() };

            if (testData.testAudio) {
                testData.audio = testData.testAudio;
            }

            const secQuery = query(collection(testRef, SECTIONS_SUB), orderBy('index', 'asc'));
            const secSnap = await getDocs(secQuery);
            
            const sections = await Promise.all(secSnap.docs.map(async (sDoc) => {
                const sData: any = { id: sDoc.id, ...sDoc.data(), questions: [] };
                
                if (sData.sectionAudio) {
                    sData.audio = sData.sectionAudio;
                }
                
                const blocksQuery = query(collection(sDoc.ref, BLOCKS_SUB), orderBy('order', 'asc'));
                const blocksSnap = await getDocs(blocksQuery);
                
                sData.questions = blocksSnap.docs.map(bDoc => ({
                    id: bDoc.id,
                    ...bDoc.data()
                }));
                
                return sData;
            }));

            testData.data = sections || []; 
            testData.sections = sections || []; 

            return testData;
        } catch (e) {
            console.error("Error loading test:", e);
            throw e;
        }
    },

    async getTestWithSectionsAndBlocks(testId: string) {
        return this.loadTest(testId);
    },

    async updateSection(testId: string, sectionId: string, data: any) {
        try {
            const ref = doc(db, TESTS_COL, testId, SECTIONS_SUB, sectionId);
            const cleanData = deepClone(data);
            await updateDoc(ref, { 
                ...cleanData, 
                updatedAt: serverTimestamp() 
            });
            await updateDoc(doc(db, TESTS_COL, testId), { updatedAt: serverTimestamp() });
        } catch (e) {
            console.error("Error updating section:", e);
            throw e;
        }
    },

    async updateSectionFields(testId: string, sectionId: string, partial: any) {
        try {
            const allowedFields = ['title', 'instructions', 'instructionsText', 'promptHtml'];
            const updateData: any = {};
            
            for (const key of allowedFields) {
                if (key in partial) {
                    updateData[key] = partial[key];
                }
            }
            
            if (Object.keys(updateData).length === 0) {
                return;
            }
            
            await this.updateSection(testId, sectionId, updateData);
        } catch (e) {
            console.error("Error in updateSectionFields:", e);
            throw e;
        }
    },

    async addBlock(testId: string, sectionId: string, type: string, defaultData: any) {
        try {
            const sectionRef = doc(db, TESTS_COL, testId, SECTIONS_SUB, sectionId);
            const blocksCol = collection(sectionRef, BLOCKS_SUB);
            
            const sectionSnap = await getDoc(sectionRef);
            if (!sectionSnap.exists()) {
                throw new Error(`Section ${sectionId} not found`);
            }
            const sectionData = sectionSnap.data();
            const sectionIndex = sectionData.index !== undefined ? sectionData.index + 1 : 1;
            
            const q = query(blocksCol);
            const snap = await getDocs(q);
            const order = snap.size;
            
            const blockIndex = order + 1;
            const blockId = `blk_${type}_${sectionIndex}_${blockIndex}`;

            const blockData = {
                type,
                order,
                data: deepClone(defaultData),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const blockRef = doc(blocksCol, blockId);
            await setDoc(blockRef, blockData);
            await updateDoc(doc(db, TESTS_COL, testId), { updatedAt: serverTimestamp() });
            return blockId;
        } catch (e) {
            console.error("Error adding block:", e);
            throw e;
        }
    },

    async updateBlock(testId: string, sectionId: string, blockId: string, payload: any) {
        try {
            const ref = doc(db, TESTS_COL, testId, SECTIONS_SUB, sectionId, BLOCKS_SUB, blockId);
            const cleanPayload = deepClone(payload);
            await updateDoc(ref, { 
                ...cleanPayload, 
                updatedAt: serverTimestamp() 
            });
            await updateDoc(doc(db, TESTS_COL, testId), { updatedAt: serverTimestamp() });
        } catch (e) {
            console.error("Error updating block:", e);
            throw e;
        }
    },

    async deleteBlock(testId: string, sectionId: string, blockId: string) {
        try {
            const sectionRef = doc(db, TESTS_COL, testId, SECTIONS_SUB, sectionId);
            const blockRef = doc(sectionRef, BLOCKS_SUB, blockId);
            
            await deleteDoc(blockRef);

            const q = query(collection(sectionRef, BLOCKS_SUB), orderBy('order', 'asc'));
            const snap = await getDocs(q);
            
            const batch = writeBatch(db);
            snap.docs.forEach((doc, index) => {
                if (doc.data().order !== index) {
                    batch.update(doc.ref, { order: index });
                }
            });
            
            await batch.commit();
            await updateDoc(doc(db, TESTS_COL, testId), { updatedAt: serverTimestamp() });
        } catch (e) {
            console.error("Error deleting block:", e);
            throw e;
        }
    },

    async moveBlock(testId: string, sectionId: string, blockId: string, direction: 'up' | 'down') {
        try {
            await runTransaction(db, async (transaction) => {
                const sectionRef = doc(db, TESTS_COL, testId, SECTIONS_SUB, sectionId);
                const blockRef = doc(sectionRef, BLOCKS_SUB, blockId);
                const blockSnap = await transaction.get(blockRef);
                
                if (!blockSnap.exists()) throw "Block does not exist";
                
                const currentOrder = blockSnap.data().order;
                const swapOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
                
                if (swapOrder < 0) return; 
                
                const q = query(
                    collection(sectionRef, BLOCKS_SUB), 
                    where('order', '==', swapOrder)
                );
                const neighborSnap = await getDocs(q);
                
                if (neighborSnap.empty) return; 
                
                const neighborDoc = neighborSnap.docs[0];
                
                transaction.update(blockRef, { order: swapOrder });
                transaction.update(neighborDoc.ref, { order: currentOrder });
                transaction.update(doc(db, TESTS_COL, testId), { updatedAt: serverTimestamp() });
            });
        } catch (e) {
            console.error("Error moving block:", e);
            throw e;
        }
    },

    async reorderBlock(testId: string, sectionId: string, blockId: string, direction: 'up' | 'down') {
        return this.moveBlock(testId, sectionId, blockId, direction);
    },

    async duplicateBlock(testId: string, sectionId: string, blockId: string) {
        try {
            const sectionRef = doc(db, TESTS_COL, testId, SECTIONS_SUB, sectionId);
            const blocksRef = collection(sectionRef, BLOCKS_SUB);

            const sectionSnap = await getDoc(sectionRef);
            if (!sectionSnap.exists()) {
                throw new Error(`Section ${sectionId} not found`);
            }
            const sectionData = sectionSnap.data();
            const sectionIndex = sectionData.index !== undefined ? sectionData.index + 1 : 1;

            await runTransaction(db, async (transaction) => {
                const q = query(blocksRef, orderBy('order', 'asc'));
                const snap = await getDocs(q);
                
                const blocks = snap.docs.map(d => ({ id: d.id, ...(d.data() as any), ref: d.ref }));
                const sourceBlock = blocks.find(b => b.id === blockId);
                
                if (!sourceBlock) throw "Source block not found";

                const newOrder = sourceBlock.order + 1;
                
                for (let i = blocks.length - 1; i >= 0; i--) {
                    const b = blocks[i];
                    if (b.order >= newOrder) {
                        transaction.update(b.ref, { order: b.order + 1 });
                    }
                }

                const typePattern = new RegExp(`^blk_${sourceBlock.type}_${sectionIndex}_(\\d+)$`);
                let maxIndex = 0;
                blocks.forEach(b => {
                    const match = b.id.match(typePattern);
                    if (match) {
                        maxIndex = Math.max(maxIndex, parseInt(match[1], 10));
                    }
                });
                const newBlockId = `blk_${sourceBlock.type}_${sectionIndex}_${maxIndex + 1}`;

                const newRef = doc(blocksRef, newBlockId);
                transaction.set(newRef, {
                    type: sourceBlock.type,
                    order: newOrder,
                    data: deepClone(sourceBlock.data),
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                
                transaction.update(doc(db, TESTS_COL, testId), { updatedAt: serverTimestamp() });
            });
        } catch (e) {
            console.error("Error duplicating block:", e);
            throw e;
        }
    },

    async uploadTestAudio(testId: string, file: File) {
        try {
            const storage = getStorage();
            const name = safeFileName(file.name || 'audio.mp3');
            const path = `tests/${testId}/audio/${name}`;
            const ref = sRef(storage, path);
            await uploadBytes(ref, file);
            const url = await getDownloadURL(ref);

            await updateDoc(doc(db, TESTS_COL, testId), {
                testAudio: { url, name },
                updatedAt: serverTimestamp()
            });

            return { url, name };
        } catch (e) {
            console.error("Error uploading test audio:", e);
            throw e;
        }
    },

    async uploadSectionAudio(testId: string, sectionId: string, file: File) {
        try {
            const storage = getStorage();
            const name = safeFileName(file.name || 'audio.mp3');
            const path = `tests/${testId}/sections/${sectionId}/audio/${name}`;
            const ref = sRef(storage, path);
            await uploadBytes(ref, file);
            const url = await getDownloadURL(ref);

            const sectionRef = doc(db, TESTS_COL, testId, SECTIONS_SUB, sectionId);
            await updateDoc(sectionRef, {
                sectionAudio: { url, name },
                updatedAt: serverTimestamp()
            });

            await updateDoc(doc(db, TESTS_COL, testId), { updatedAt: serverTimestamp() });

            return { url, name };
        } catch (e) {
            console.error("Error uploading section audio:", e);
            throw e;
        }
    },

    async deleteTest(testId: string) {
        try {
            const testRef = doc(db, TESTS_COL, testId);
            const secSnap = await getDocs(collection(testRef, SECTIONS_SUB));

            for (const sDoc of secSnap.docs) {
                const sectionRef = sDoc.ref;
                const blocksSnap = await getDocs(collection(sectionRef, BLOCKS_SUB));

                const batch = writeBatch(db);
                blocksSnap.docs.forEach(b => batch.delete(b.ref));
                batch.delete(sectionRef);
                await batch.commit();
            }

            await deleteDoc(testRef);
        } catch (e) {
            console.error("Error deleting test:", e);
            throw e;
        }
    },

    async duplicateTest(testId: string) {
        try {
            const source = await this.loadTest(testId);
            const payload = {
                ...source,
                name: `${source.name} (Copy)`,
                status: 'draft',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            // Remove fields that shouldn't be in the new test doc directly or will be handled
            delete (payload as any).id;
            delete (payload as any).data;
            delete (payload as any).sections;
            delete (payload as any).publishedAt;
            delete (payload as any).unpublishedAt;

            const newId = await this.createTest(payload);
            const newTestRef = doc(db, TESTS_COL, newId);

            // Copy sections and blocks
            const sourceRef = doc(db, TESTS_COL, testId);
            const secSnap = await getDocs(query(collection(sourceRef, SECTIONS_SUB), orderBy('index', 'asc')));

            for (const sDoc of secSnap.docs) {
                const sData = sDoc.data();
                const targetSecRef = doc(newTestRef, SECTIONS_SUB, sDoc.id);
                
                await setDoc(targetSecRef, {
                    ...sData,
                    updatedAt: serverTimestamp()
                });

                // Copy blocks
                const blocksSnap = await getDocs(collection(sDoc.ref, BLOCKS_SUB));
                if (!blocksSnap.empty) {
                    const batch = writeBatch(db);
                    blocksSnap.docs.forEach(bDoc => {
                        const newBlockRef = doc(collection(targetSecRef, BLOCKS_SUB));
                        batch.set(newBlockRef, {
                            ...bDoc.data(),
                            updatedAt: serverTimestamp()
                        });
                    });
                    await batch.commit();
                }
            }
            return newId;
        } catch (e) {
            console.error("Error duplicating test:", e);
            throw e;
        }
    },

    async publishTest(testId: string) {
        try {
            await updateDoc(doc(db, TESTS_COL, testId), {
                status: 'published',
                publishedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { ok: true };
        } catch (e) {
            console.error('publishTest err', e);
            throw e;
        }
    },

    async unpublishTest(testId: string) {
        try {
            await updateDoc(doc(db, TESTS_COL, testId), {
                status: 'draft',
                unpublishedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { ok: true };
        } catch (e) {
            console.error('unpublishTest err', e);
            throw e;
        }
    },

    async setTestStatus(testId: string, status: string) {
        try {
            const allowed = ['draft', 'ready', 'published'];
            const s = allowed.includes(status) ? status : 'draft';
            await updateDoc(doc(db, TESTS_COL, testId), {
                status: s,
                updatedAt: serverTimestamp()
            });
            return { ok: true };
        } catch (e) {
            console.error('setTestStatus err', e);
            throw e;
        }
    },

    async updateTest(testId: string, data: any) {
        try {
            const ref = doc(db, TESTS_COL, testId);
            const cleanData = deepClone(data);
            await updateDoc(ref, { 
                ...cleanData, 
                updatedAt: serverTimestamp() 
            });
            return { ok: true };
        } catch (e) {
            console.error("Error updating test:", e);
            throw e;
        }
    },
};
