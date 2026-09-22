'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function saveSettings(formData: FormData) {
  const geminiPromptIA = formData.get('geminiPromptIA') as string;
  const geminiPromptLux = formData.get('geminiPromptLux') as string;

  await prisma.settings.update({
    where: { id: 'default' },
    data: { geminiPromptIA, geminiPromptLux },
  });

  revalidatePath('/settings');
}

export async function addSource(formData: FormData) {
  const name = formData.get('name') as string;
  const url = formData.get('url') as string;
  const category = formData.get('category') as string;

  await prisma.source.create({
    data: { name, url, category },
  });

  revalidatePath('/settings');
}

export async function toggleSource(id: string, isActive: boolean) {
  await prisma.source.update({
    where: { id },
    data: { isActive },
  });
  revalidatePath('/settings');
}

export async function deleteSource(id: string) {
  await prisma.source.delete({
    where: { id },
  });
  revalidatePath('/settings');
}
