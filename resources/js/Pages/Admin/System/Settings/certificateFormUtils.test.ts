import {
  buildCertificateFormConfigs,
  normalizeAvailablePeriods,
  normalizeCertificateConfigs,
  normalizeCertificateFormConfigs,
} from './certificateFormUtils';

describe('certificateFormUtils', () => {
  it('meratakan available periods yang dikirim dalam bentuk object berkelompok', () => {
    const periods = normalizeAvailablePeriods({
      56: [{ id: 10, name: 'KKN 56 Reguler' }],
      55: [{ id: '9', name: 'KKN 55 Tematik' }],
    });

    expect(periods).toHaveLength(2);
    expect(periods).toEqual(expect.arrayContaining([
      { id: 10, name: 'KKN 56 Reguler' },
      { id: 9, name: 'KKN 55 Tematik' },
    ]));
  });

  it('menormalkan configs object menjadi array config yang bisa difilter aman', () => {
    const configs = normalizeCertificateConfigs({
      0: {
        id: 1,
        config_key: 'certificate_title',
        label: 'Judul Sertifikat',
        value: 'Sertifikat KKN',
        type: 'text',
      },
      1: {
        id: 2,
        config_key: 'workshop_signatory_name',
        label: 'Penandatangan Workshop',
        value: null,
        type: 'text',
      },
    });

    expect(configs.map((config) => config.config_key)).toEqual([
      'certificate_title',
      'workshop_signatory_name',
    ]);
  });

  it('menormalkan form configs berindeks object agar lookup id tetap aman', () => {
    const initialConfigs = buildCertificateFormConfigs([
      {
        id: 11,
        config_key: 'certificate_title',
        label: 'Judul',
        value: 'Sertifikat',
        type: 'text',
      },
    ]);

    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    const normalized = normalizeCertificateFormConfigs({
      0: initialConfigs[0],
      1: { id: 12, value: file },
    });

    expect(normalized[0]).toEqual({ id: 11, value: 'Sertifikat' });
    expect(normalized[1].id).toBe(12);
    expect(normalized[1].value).toBe(file);
  });
});
