import { z } from 'zod';

export const planSlugSchema = z.string().min(1);
