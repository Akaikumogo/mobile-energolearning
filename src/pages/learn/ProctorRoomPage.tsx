import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import mobileApi from '@/services/api';
import { CheerfulBackLink } from '@/components/CheerfulBackLink';

export default function ProctorRoomPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [qr, setQr] = useState('');
  const room = useQuery({
    queryKey: ['proctor-enter', token],
    queryFn: () => mobileApi.enterProctorRoom(token),
    enabled: token.length >= 16,
  });
  const results = useQuery({
    queryKey: ['proctor-my-results'],
    queryFn: () => mobileApi.myProctorResults(),
  });
  const payload = useMemo(() => (token ? `elektrolearn://proctor?token=${token}` : ''), [token]);

  useEffect(() => {
    if (!payload) return;
    void QRCode.toDataURL(payload, { margin: 1, width: 220 }).then(setQr);
  }, [payload]);

  return (
    <div className="space-y-4 px-4 py-4">
      <CheerfulBackLink to="/learn/news">Bildirishnomalar</CheerfulBackLink>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Imtihon xonasi</h1>
      {!token ? <p className="text-sm text-slate-500">Havola topilmadi. Bildirishnomadagi xonani oching.</p> : null}
      {room.isLoading ? <p className="text-sm">Yuklanmoqda…</p> : null}
      {room.isError ? (
        <p className="text-sm text-red-600">Xona ochilmadi. Bu havola boshqa xodimga tegishli yoki sessiya tugagan.</p>
      ) : null}
      {room.data ? (
        <div className="space-y-2 border border-slate-200 p-4 dark:border-slate-700">
          <p className="font-medium">{room.data.standardName}</p>
          <p className="text-sm text-slate-600">{new Date(room.data.scheduledAt).toLocaleString()}</p>
          <p className="text-sm">Holat: {room.data.status}</p>
          <p className="text-sm">
            Imtihon ElektroLearn dasturida topshiriladi. QR kodni shu kompyuterdagi dastur o‘qiydi. Havolaning o‘zi kirmaydi.
          </p>
          {qr ? <img src={qr} alt="Imtihon xonasi QR" className="h-52 w-52" /> : null}
        </div>
      ) : null}
      <h2 className="text-lg font-semibold">Natijalarim</h2>
      {results.data?.length ? (
        <ul className="space-y-2 text-sm">
          {results.data.map((row) => (
            <li key={`${row.examinationName}-${row.examDate}`} className="border border-slate-200 p-3">
              {row.examinationName}: {row.correctCount}/{row.questionCount} · {row.scorePercent}% · {row.gradeLabel}
              {row.nextExamDate ? ` · keyingi ${row.nextExamDate}` : ''}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">Hozircha natija yo‘q</p>
      )}
    </div>
  );
}
