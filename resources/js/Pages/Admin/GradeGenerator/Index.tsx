import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput } from '@/Components/ui';
import {
    ArchiveBoxArrowDownIcon,
    CalculatorIcon,
    PlusIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';

type Meta = {
    angkatan: string;
    tahun: string;
    kelompok: string;
    desa: string;
    kecamatan: string;
    kabupaten: string;
    dpl: string;
};

type StudentRow = {
    id: string;
    name: string;
    nim: string;
    discipline: number;
    attitude: number;
};

const makeId = () => `row-${Math.random().toString(36).slice(2, 9)}`;

const defaultMeta: Meta = {
    angkatan: '57',
    tahun: '2026',
    kelompok: '1',
    desa: 'Jompo',
    kecamatan: 'Kalimanah',
    kabupaten: 'Purbalingga',
    dpl: 'Rahman Afandi',
};

const defaultStudents: StudentRow[] = [
    { id: makeId(), name: 'Mochammad Ihza Al Ghifari Sri Hernando', nim: '2017101133', discipline: 90, attitude: 90 },
    { id: makeId(), name: 'Izzah Rohmatun Nissa', nim: '224110101238', discipline: 80, attitude: 80 },
    { id: makeId(), name: 'Elis Rahadewi', nim: '224110102140', discipline: 90, attitude: 90 },
];

function computeTotal({ discipline, attitude }: StudentRow): number {
    const d = Number(discipline) || 0;
    const a = Number(attitude) || 0;
    return Math.round((d + a) / 2);
}

export default function GradeGenerator() {
    const [meta, setMeta] = useState<Meta>(defaultMeta);
    const [students, setStudents] = useState<StudentRow[]>(defaultStudents);
    const [exporting, setExporting] = useState(false);

    const summary = useMemo(() => {
        if (!students.length) return { avg: 0, count: 0 };
        const avg = students.reduce((sum, s) => sum + computeTotal(s), 0) / students.length;
        return { avg: Number(avg.toFixed(2)), count: students.length };
    }, [students]);

    const addStudent = () => {
        setStudents((prev) => [
            ...prev,
            { id: makeId(), name: '', nim: '', discipline: 80, attitude: 80 },
        ]);
    };

    const removeStudent = (id: string) => {
        setStudents((prev) => prev.filter((s) => s.id !== id));
    };

    const updateStudent = (id: string, field: keyof Omit<StudentRow, 'id'>, value: string) => {
        setStudents((prev) =>
            prev.map((s) =>
                s.id === id
                    ? {
                          ...s,
                          [field]: ['discipline', 'attitude'].includes(field)
                              ? Math.max(0, Math.min(100, Number(value) || 0))
                              : value,
                      }
                    : s,
            ),
        );
    };

    const handleMetaChange = (field: keyof Meta, value: string) => {
        setMeta((m) => ({ ...m, [field]: value }));
    };

    const buildDocxBlob = async () => {
        const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } = await import('docx');

        const header = [
            new Paragraph({
                children: [new TextRun({ text: 'BLANKO PENILAIAN PESERTA KKN', bold: true, size: 28 })],
                spacing: { after: 100 },
            }),
            new Paragraph({
                children: [new TextRun({ text: `ANGKATAN ${meta.angkatan} TAHUN ${meta.tahun}`, bold: true, size: 24 })],
                spacing: { after: 200 },
            }),
        ];

        const metaRows = [
            `KELOMPOK\t${meta.kelompok}`,
            `DESA\t${meta.desa}`,
            `KECAMATAN\t${meta.kecamatan}`,
            `KABUPATEN\t${meta.kabupaten}`,
            `DPL\t${meta.dpl}`,
        ].map((line) => new Paragraph({ children: [new TextRun({ text: line })] }));

        const tableRows = [
            new TableRow({
                children: ['NO', 'NAMA MAHASISWA', 'NIM', 'KEDISIPLINAN', 'SIKAP', 'NILAI TOTAL'].map(
                    (t) => new TableCell({ children: [new Paragraph({ text: t, bold: true })] }),
                ),
            }),
            ...students.map((s, idx) =>
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(String(idx + 1))] }),
                        new TableCell({ children: [new Paragraph(s.name || '-')], width: { size: 4000, type: WidthType.DXA } }),
                        new TableCell({ children: [new Paragraph(s.nim || '-')] }),
                        new TableCell({ children: [new Paragraph(String(s.discipline))] }),
                        new TableCell({ children: [new Paragraph(String(s.attitude))] }),
                        new TableCell({ children: [new Paragraph(String(computeTotal(s)))] }),
                    ],
                }),
            ),
        ];

        const doc = new Document({
            sections: [
                {
                    children: [
                        ...header,
                        ...metaRows,
                        new Paragraph({ text: ' ' }),
                        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }),
                    ],
                },
            ],
        });

        return Packer.toBlob(doc);
    };

    const buildPdfBlob = async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text('BLANKO PENILAIAN PESERTA KKN', 14, 18);
        doc.setFontSize(14);
        doc.text(`ANGKATAN ${meta.angkatan} TAHUN ${meta.tahun}`, 14, 26);

        doc.setFontSize(11);
        const metaLines = [
            `KELOMPOK: ${meta.kelompok}`,
            `DESA: ${meta.desa}`,
            `KECAMATAN: ${meta.kecamatan}`,
            `KABUPATEN: ${meta.kabupaten}`,
            `DPL: ${meta.dpl}`,
        ];
        let y = 36;
        metaLines.forEach((line) => {
            doc.text(line, 14, y);
            y += 6;
        });

        y += 2;
        doc.setFont(undefined, 'bold');
        doc.text('NO', 14, y);
        doc.text('NAMA MAHASISWA', 28, y);
        doc.text('NIM', 110, y);
        doc.text('KEDISIPLINAN', 150, y);
        doc.text('SIKAP', 175, y);
        doc.text('NILAI TOTAL', 195, y, { align: 'right' });
        doc.setFont(undefined, 'normal');
        y += 8;

        students.forEach((s, idx) => {
            doc.text(String(idx + 1), 14, y);
            doc.text(s.name || '-', 28, y);
            doc.text(s.nim || '-', 110, y);
            doc.text(String(s.discipline), 150, y);
            doc.text(String(s.attitude), 175, y);
            doc.text(String(computeTotal(s)), 195, y, { align: 'right' });
            y += 8;
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
        });

        return doc.output('blob');
    };

    const exportZip = async () => {
        setExporting(true);
        try {
            const [{ default: JSZip }, { saveAs }] = await Promise.all([import('jszip'), import('file-saver')]);
            const [docxBlob, pdfBlob] = await Promise.all([buildDocxBlob(), buildPdfBlob()]);
            const zip = new JSZip();
            zip.file('blanko-penilaian.docx', docxBlob);
            zip.file('blanko-penilaian.pdf', pdfBlob);
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            saveAs(zipBlob, 'blanko-penilaian.zip');
        } catch (err) {
            console.error(err);
            alert('Gagal membuat ZIP. Coba ulang.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <AppLayout title="Generator Nilai">
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <CalculatorIcon className="h-6 w-6 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Generator Blanko Nilai</h1>
                        <p className="text-sm text-slate-600">
                            Cetak blanko penilaian (DOCX + PDF) tanpa koneksi database; cocok dipakai sebelum data terintegrasi.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FormInput label="Angkatan" value={meta.angkatan} onChange={(e) => handleMetaChange('angkatan', e.target.value)} />
                    <FormInput label="Tahun" value={meta.tahun} onChange={(e) => handleMetaChange('tahun', e.target.value)} />
                    <FormInput label="Kelompok" value={meta.kelompok} onChange={(e) => handleMetaChange('kelompok', e.target.value)} />
                    <FormInput label="Desa" value={meta.desa} onChange={(e) => handleMetaChange('desa', e.target.value)} />
                    <FormInput label="Kecamatan" value={meta.kecamatan} onChange={(e) => handleMetaChange('kecamatan', e.target.value)} />
                    <FormInput label="Kabupaten" value={meta.kabupaten} onChange={(e) => handleMetaChange('kabupaten', e.target.value)} />
                    <FormInput className="sm:col-span-2 lg:col-span-3" label="DPL" value={meta.dpl} onChange={(e) => handleMetaChange('dpl', e.target.value)} />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Daftar Mahasiswa</p>
                            <p className="text-xs text-slate-500">Isi nama, NIM, kedisiplinan, sikap. Nilai total otomatis rata-rata.</p>
                        </div>
                        <Button variant="primary" size="sm" onClick={addStudent}>
                            <PlusIcon className="h-4 w-4" />
                            Tambah Baris
                        </Button>
                    </div>

                    <div className="divide-y divide-slate-100">
                        <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
                            <div className="col-span-1">No</div>
                            <div className="col-span-4">Nama Mahasiswa</div>
                            <div className="col-span-3">NIM</div>
                            <div className="col-span-2">Kedisiplinan</div>
                            <div className="col-span-1">Sikap</div>
                            <div className="col-span-1 text-right">Total</div>
                        </div>

                        {students.map((s, idx) => (
                            <div key={s.id} className="grid grid-cols-12 gap-3 px-4 py-3 sm:items-center">
                                <div className="col-span-1 text-sm text-slate-700">{idx + 1}</div>
                                <div className="col-span-4">
                                    <FormInput value={s.name} onChange={(e) => updateStudent(s.id, 'name', e.target.value)} />
                                </div>
                                <div className="col-span-3">
                                    <FormInput value={s.nim} onChange={(e) => updateStudent(s.id, 'nim', e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <FormInput
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={s.discipline}
                                        onChange={(e) => updateStudent(s.id, 'discipline', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <FormInput
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={s.attitude}
                                        onChange={(e) => updateStudent(s.id, 'attitude', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1 flex items-center justify-end gap-2">
                                    <span className="text-sm font-semibold text-slate-800">{computeTotal(s)}</span>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => removeStudent(s.id)}>
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {students.length === 0 && (
                            <div className="px-4 py-6 text-center text-sm text-slate-500">Belum ada baris. Tambahkan mahasiswa.</div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="text-sm text-slate-600">
                        Total mahasiswa: <span className="font-semibold text-slate-900">{summary.count}</span> ·
                        Rata-rata nilai total: <span className="font-semibold text-slate-900">{summary.avg}</span>
                    </div>
                    <Button variant="primary" onClick={exportZip} loading={exporting}>
                        <ArchiveBoxArrowDownIcon className="h-4 w-4" />
                        Export DOCX+PDF (ZIP)
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
