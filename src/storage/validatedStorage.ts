import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import { validate } from '../utils/validation';

export async function readStored<S extends z.ZodTypeAny>(
  key: string,
  schema: S,
  fallback: z.output<S>
): Promise<z.output<S>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return validate(schema, JSON.parse(raw));
  } catch {
    throw new Error(
      'Données locales illisibles ou invalides. Elles sont conservées ; restaurez une sauvegarde ou réessayez.'
    );
  }
}

export async function writeStored<S extends z.ZodTypeAny>(
  key: string,
  schema: S,
  value: z.input<S>
): Promise<void> {
  const parsed = validate(schema, value);
  try {
    await AsyncStorage.setItem(key, JSON.stringify(parsed));
  } catch {
    throw new Error(
      'Enregistrement local impossible. Vérifiez l’espace disponible puis réessayez.'
    );
  }
}
