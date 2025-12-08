import { db } from './firebase';
import { collection, query, where, getDocs, Timestamp, writeBatch } from 'firebase/firestore';
import * as XLSX from 'xlsx';

export const checkAndArchiveOldData = async (months: number = 6) => {
    const now = new Date();
    const cutoffDate = new Date(now.setMonth(now.getMonth() - months));

    try {
        const q = query(
            collection(db, "entries"),
            where("timestamp", "<", Timestamp.fromDate(cutoffDate))
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { status: 'no_data', count: 0 };
        }

        const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate().toISOString()
        }));

        // Generate Excel
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Archive");

        // Save file
        const fileName = `archive_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        // Delete old data
        const batch = writeBatch(db);
        querySnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        return { status: 'success', count: data.length, fileName };

    } catch (error) {
        console.error("Error archiving data:", error);
        throw error;
    }
};
