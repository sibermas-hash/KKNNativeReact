export interface CertificateConfigItem {
  id: number | null;
  config_key: string;
  label: string;
  value: string | null;
  type: 'text' | 'longtext' | 'image';
}

export interface CertificateConfigFormItem {
  id: number | null;
  value: string | File;
}

export interface CertificatePeriodOption {
  id: number;
  name: string;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const collectFromUnknown = <T>(value: unknown, mapper: (entry: unknown) => T | null): T[] => {
  const mappedValue = mapper(value);

  if (mappedValue) {
    return [mappedValue];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => {
      const mapped = mapper(entry);
      return mapped ? [mapped] : [];
    });
  }

  if (isRecord(value)) {
    return Object.values(value).flatMap((entry) => collectFromUnknown(entry, mapper));
  }

  return [];
};

export const normalizeAvailablePeriods = (value: unknown): CertificatePeriodOption[] =>
  collectFromUnknown(value, (entry) => {
    if (!isRecord(entry)) {
      return null;
    }

    const id = toNumber(entry.id);

    if (id === null) {
      return null;
    }

    return {
      id,
      name:
        typeof entry.name === 'string' && entry.name.trim() !== '' ? entry.name : `Periode ${id}`,
    };
  });

export const normalizeCertificateConfigs = (value: unknown): CertificateConfigItem[] =>
  collectFromUnknown(value, (entry) => {
    if (!isRecord(entry) || typeof entry.config_key !== 'string') {
      return null;
    }

    const rawType = entry.type;
    const type: CertificateConfigItem['type'] =
      rawType === 'image' || rawType === 'longtext' || rawType === 'text' ? rawType : 'text';

    return {
      id: entry.id == null ? null : toNumber(entry.id),
      config_key: entry.config_key,
      label:
        typeof entry.label === 'string' && entry.label.trim() !== ''
          ? entry.label
          : entry.config_key.replace(/_/g, ' '),
      value:
        typeof entry.value === 'string'
          ? entry.value
          : entry.value == null
            ? null
            : String(entry.value),
      type,
    };
  });

export const buildCertificateFormConfigs = (
  configs: CertificateConfigItem[],
): CertificateConfigFormItem[] =>
  configs.map((config) => ({ id: config.id, value: config.value ?? '' }));

export const normalizeCertificateFormConfigs = (value: unknown): CertificateConfigFormItem[] =>
  collectFromUnknown(value, (entry) => {
    if (!isRecord(entry) || (!('id' in entry) && !('value' in entry))) {
      return null;
    }

    const rawValue = entry.value;

    return {
      id: entry.id == null ? null : toNumber(entry.id),
      value:
        typeof File !== 'undefined' && rawValue instanceof File
          ? rawValue
          : typeof rawValue === 'string'
            ? rawValue
            : rawValue == null
              ? ''
              : String(rawValue),
    };
  });
