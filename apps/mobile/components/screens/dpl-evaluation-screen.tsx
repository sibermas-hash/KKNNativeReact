import { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import {
  useTheme,
  useStyles,
  useFormStyles,
  Screen,
  SectionTitle,
  SurfaceCard,
  PrimaryButton,
  LoadingState,
  EmptyState,
  InlineAlert,
  FieldLabel,
} from '@/components/ui/primitives';

type EvalQuestion = { id: number; question: string; type: 'rating' | 'text' };
type EvalForm = { questions: EvalQuestion[]; dpl_name?: string; already_submitted?: boolean };

function RatingInput({ value, onChange, styles }: { value: number; onChange: (v: number) => void; styles: any }) {
  return (
    <View style={styles.ratingRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} style={[styles.ratingBtn, value === n && styles.ratingBtnActive]} onPress={() => onChange(n)}>
          {n}
        </Text>
      ))}
    </View>
  );
}

export function DplEvaluationScreen() {
  const endpoints = studentEndpoints(api);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});

  const { colors } = useTheme();
  const formStyles = useFormStyles();

  const styles = useStyles((colors) => ({
    questionCard: { gap: 10 },
    ratingRow: { flexDirection: 'row' as const, gap: 8 },
    ratingBtn: {
      width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.surface, alignItems: 'center' as const, justifyContent: 'center' as const,
      textAlign: 'center' as const, lineHeight: 38, fontSize: 14, fontWeight: '800' as const, color: colors.textMuted,
    },
    ratingBtnActive: { backgroundColor: colors.soft, borderColor: colors.primary, color: colors.softText },
  }));

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'dpl-evaluation'],
    queryFn: async () => {
      const res = await endpoints.dplEvaluation.form();
      return res as unknown as EvalForm;
    },
  });

  const submit = useMutation({
    mutationFn: () => endpoints.dplEvaluation.store({ answers }),
    onSuccess: () => Alert.alert('Berhasil', 'Evaluasi DPL berhasil dikirim.'),
    onError: () => Alert.alert('Gagal', 'Gagal mengirim evaluasi.'),
  });

  if (isLoading) return <LoadingState label="Memuat form evaluasi..." />;
  if (data?.already_submitted) return (
    <Screen><InlineAlert tone="emerald" title="Sudah Terkirim" description="Anda sudah mengisi evaluasi DPL untuk periode ini." /></Screen>
  );
  if (!data?.questions?.length) return (
    <Screen><EmptyState title="Belum tersedia" description="Form evaluasi DPL belum dibuka untuk periode ini." /></Screen>
  );

  return (
    <Screen>
      <SectionTitle title="Evaluasi DPL" subtitle={data.dpl_name ? `Evaluasi untuk ${data.dpl_name}` : 'Berikan penilaian terhadap DPL Anda.'} />

      {data.questions.map((q) => (
        <SurfaceCard key={q.id} style={styles.questionCard}>
          <FieldLabel>{q.question}</FieldLabel>
          {q.type === 'rating' ? (
            <RatingInput value={Number(answers[q.id] || 0)} onChange={(v) => setAnswers((p) => ({ ...p, [q.id]: v }))} styles={styles} />
          ) : (
            <TextInput
              style={[formStyles.input, formStyles.textarea]}
              value={String(answers[q.id] || '')}
              onChangeText={(v) => setAnswers((p) => ({ ...p, [q.id]: v }))}
              placeholder="Tulis jawaban..."
              placeholderTextColor={colors.textSubtle}
              multiline
            />
          )}
        </SurfaceCard>
      ))}

      <PrimaryButton label="Kirim Evaluasi" onPress={() => submit.mutate()} loading={submit.isPending} />
    </Screen>
  );
}
