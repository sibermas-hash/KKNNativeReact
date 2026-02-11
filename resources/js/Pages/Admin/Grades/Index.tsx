import React, { useEffect, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormSelect, FormInput } from '@/Components/ui';
import axios from 'axios';

interface Group {
  id: number;
  code: string;
  name: string;
  lecturer?: { user?: { name: string } };
}

interface StudentOption {
  id: number;
  name: string;
  email: string;
  username: string;
  nim?: string;
}

interface Props {
  groups: Group[];
}

export default function Index({ groups }: Props) {
  const { data, setData, post, processing, reset, errors } = useForm({
    group_id: '',
    student_id: '',
    execution_score: '',
    article_score: '',
    discipline_score: '',
    attitude_score: '',
  });

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const fetchStudents = async (groupId: string) => {
    if (!groupId) {
      setStudents([]);
      return;
    }
    setLoadingStudents(true);
    try {
      const res = await axios.get(route('admin.groups.students', groupId));
      setStudents(res.data);
    } catch (e) {
      console.error(e);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (data.group_id) {
      fetchStudents(data.group_id as string);
    }
  }, [data.group_id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.grades.store'), {
      onSuccess: () => {
        reset('execution_score', 'article_score', 'discipline_score', 'attitude_score');
      },
    });
  };

  return (
    <AppLayout title="Input Nilai">
      <Head title="Input Nilai" />
      <div className="max-w-4xl mx-auto py-6">
        <h1 className="text-2xl font-semibold mb-4">Input Nilai Manual</h1>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Kelompok"
              value={data.group_id}
              onChange={(e) => setData('group_id', e.target.value)}
              error={errors.group_id}
            >
              <option value="">Pilih Kelompok</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code || g.name} {g.lecturer?.user?.name ? `- DPL ${g.lecturer.user.name}` : ''}
                </option>
              ))}
            </FormSelect>

            <FormSelect
              label="Mahasiswa"
              value={data.student_id}
              onChange={(e) => setData('student_id', e.target.value)}
              error={errors.student_id}
              disabled={!data.group_id || loadingStudents}
            >
              <option value="">Pilih Mahasiswa</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.username || s.name} {s.nim ? `(${s.nim})` : ''}
                </option>
              ))}
            </FormSelect>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              type="number"
              label="Nilai Pelaksanaan (Execution)"
              value={data.execution_score}
              onChange={(e) => setData('execution_score', e.target.value)}
              error={errors.execution_score}
              min={0}
              max={100}
              step="0.01"
            />
            <FormInput
              type="number"
              label="Nilai Artikel (Article)"
              value={data.article_score}
              onChange={(e) => setData('article_score', e.target.value)}
              error={errors.article_score}
              min={0}
              max={100}
              step="0.01"
            />
            <FormInput
              type="number"
              label="Disiplin (Village)"
              value={data.discipline_score}
              onChange={(e) => setData('discipline_score', e.target.value)}
              error={errors.discipline_score}
              min={0}
              max={100}
              step="0.01"
            />
            <FormInput
              type="number"
              label="Sikap (Attitude)"
              value={data.attitude_score}
              onChange={(e) => setData('attitude_score', e.target.value)}
              error={errors.attitude_score}
              min={0}
              max={100}
              step="0.01"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={processing || loadingStudents}>
              Simpan Nilai
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
